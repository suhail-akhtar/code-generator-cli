import axios from 'axios';
import { BaseLLMService } from './base';
import { ProjectStructure, ProjectFile, ProjectPlan, Documentation } from '../../types';
import { logger } from '../../utils/logger';
import { listFiles, readFile } from '../../utils/fileSystem';
import path from 'path';

export class OllamaService extends BaseLLMService {
  private apiUrl: string;
  private modelName: string = 'llama3';

  constructor(apiUrl: string, modelName?: string) {
    // Ollama is local, so we don't require an API key
    super('');
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    if (modelName) {
      this.modelName = modelName;
    } else if (process.env.OLLAMA_MODEL) {
      this.modelName = process.env.OLLAMA_MODEL;
    }
    
    logger.info(`Using Ollama with model: ${this.modelName} at ${this.apiUrl}`);
  }

  private async callOllamaAPI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/generate`,
        {
          model: this.modelName,
          prompt,
          stream: false,
          options: {
            temperature: 0.2, // Lower temperature for more predictable JSON
            num_predict: 4096
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.response;
    } catch (error: any) {
      if (error.response) {
        logger.error('Ollama API error:', error.response.data);
      } else {
        logger.error('Error calling Ollama API:', error);
      }
      throw error;
    }
  }

  async generateProjectPlan(requirements: string): Promise<ProjectPlan> {
    logger.info('Generating project plan with Ollama...');
    
    const prompt = `
You are an expert software architect. Generate a project plan based on these requirements:

${requirements}

The output MUST be valid JSON with this exact structure (no explanation, just JSON):

{
  "projectName": "string",
  "description": "string",
  "technologies": ["string"],
  "architecture": "string",
  "components": [
    {
      "name": "string",
      "description": "string",
      "responsibilities": ["string"]
    }
  ],
  "dataModels": [
    {
      "name": "string",
      "fields": [
        {
          "name": "string",
          "type": "string",
          "description": "string"
        }
      ]
    }
  ]
}

Remember: only respond with the JSON structure, no introduction, explanation or markdown code blocks.
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating project plan with Ollama:', error);
      throw error;
    }
  }
  
  async generateProjectStructure(plan: ProjectPlan): Promise<ProjectStructure> {
    logger.info('Generating project structure with Ollama...');
    
    const prompt = `
You are an expert software developer. Generate a project structure based on this plan:

${JSON.stringify(plan, null, 2)}

The output MUST be valid JSON with this exact structure (no explanation, just JSON):

{
  "directories": ["string"],
  "files": [
    {
      "path": "string",
      "content": "string"
    }
  ],
  "dependencies": {
    "dependencies": { "package-name": "version" },
    "devDependencies": { "package-name": "version" }
  }
}

Include all necessary files, such as package.json, tsconfig.json, README.md, etc.
For the content of each file, provide the complete code, not just placeholders.
Follow best practices for the chosen technologies.
Use latest stable versions of all dependencies.

Remember: only respond with the JSON structure, no introduction, explanation or markdown code blocks.
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      let result = this.parseJsonFromText(text);
      
      // Ensure critical properties exist to prevent "not iterable" errors
      if (!result.directories) {
        result.directories = ["src", "public"];
      }
      
      if (!Array.isArray(result.directories)) {
        result.directories = ["src", "public"];
      }
      
      if (!result.files) {
        result.files = [];
      }
      
      if (!Array.isArray(result.files)) {
        result.files = [];
      }
      
      // Ensure dependencies is properly formatted
      if (!result.dependencies) {
        result.dependencies = {
          dependencies: {},
          devDependencies: {}
        };
      } else {
        if (!result.dependencies.dependencies) {
          result.dependencies.dependencies = {};
        }
        if (!result.dependencies.devDependencies) {
          result.dependencies.devDependencies = {};
        }
      }
      
      // Common dependencies for React projects
      if (plan.technologies.some(tech => 
          tech.toLowerCase().includes('react') || 
          tech.toLowerCase().includes('web'))) {
        if (Object.keys(result.dependencies.dependencies).length === 0) {
          result.dependencies.dependencies = {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1"
          };
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error generating project structure with Ollama:', error);
      throw error;
    }
  }
  
  async fixCompilationErrors(errors: string[], projectStructure: ProjectStructure): Promise<ProjectFile[]> {
    logger.info('Fixing compilation errors with Ollama...');
    
    const prompt = `
You are an expert TypeScript developer. Fix these compilation errors:

Errors:
${errors.join('\n')}

Project Structure (abbreviated):
${JSON.stringify(projectStructure.directories, null, 2)}
${JSON.stringify(projectStructure.files.map(f => f.path), null, 2)}

The output MUST be valid JSON with this exact structure (no explanation, just JSON):

[
  {
    "path": "string",
    "content": "string"
  }
]

Only include files that need to be modified to fix the errors.

Remember: only respond with the JSON structure, no introduction, explanation or markdown code blocks.
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      const result = this.parseJsonFromText(text);
      
      // Ensure we always return an array
      if (!Array.isArray(result)) {
        return [];
      }
      
      return result;
    } catch (error) {
      logger.error('Error fixing compilation errors with Ollama:', error);
      throw error;
    }
  }
  
  async generateDocumentation(projectStructure: ProjectStructure): Promise<Documentation> {
    logger.info('Generating documentation with Ollama...');
    
    const prompt = `
You are an expert technical writer. Generate documentation based on this project structure:

Project Directories:
${JSON.stringify(projectStructure.directories, null, 2)}

Project Files:
${JSON.stringify(projectStructure.files.map(f => f.path), null, 2)}

The output MUST be valid JSON with this exact structure (no explanation, just JSON):

{
  "readme": "string",
  "additional": [
    {
      "path": "string",
      "content": "string"
    }
  ]
}

The readme should include:
- Project overview
- Installation instructions
- Usage examples
- Configuration options

Remember: only respond with the JSON structure, no introduction, explanation or markdown code blocks.
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      let result = this.parseJsonFromText(text);
      
      // Ensure critical properties exist
      if (!result.readme) {
        result.readme = `# Project Documentation\n\nThis is a generated project.`;
      }
      
      if (!result.additional) {
        result.additional = [];
      }
      
      if (!Array.isArray(result.additional)) {
        result.additional = [];
      }
      
      return result;
    } catch (error) {
      logger.error('Error generating documentation with Ollama:', error);
      throw error;
    }
  }
  
  async generateEnhancementSuggestions(projectStructure: ProjectStructure): Promise<string> {
    logger.info('Generating enhancement suggestions with Ollama...');
    
    const prompt = `
You are an expert software consultant. Suggest enhancements for this project:

Project Directories:
${JSON.stringify(projectStructure.directories, null, 2)}

Project Files:
${JSON.stringify(projectStructure.files.map(f => f.path), null, 2)}

Generate a Markdown document with the following sections:
1. Feature Enhancements
2. Performance Improvements
3. Security Enhancements
4. UI/UX Improvements
5. Advanced Features
6. Next Steps

Note: This response does NOT need to be JSON. It should be Markdown formatted text.
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return text || `# Enhancement Suggestions\n\n## Feature Enhancements\n- Add more features\n\n## Next Steps\n- Implement the project`;
    } catch (error) {
      logger.error('Error generating enhancement suggestions with Ollama:', error);
      throw error;
    }
  }
  
  async scanProject(projectPath: string): Promise<{ issues: string[]; suggestions: string[] }> {
    logger.info('Scanning project with Ollama...');
    
    // Get all project files
    const files = await listFiles(projectPath, true);
    const fileContents: Record<string, string> = {};
    
    // Read content of important files (limit to prevent context overflow)
    const MAX_FILES = 10; // Smaller limit for local models
    const importantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css'];
    
    let filesProcessed = 0;
    for (const file of files) {
      if (filesProcessed >= MAX_FILES) break;
      
      const ext = path.extname(file);
      if (importantExtensions.includes(ext) && !file.includes('node_modules')) {
        try {
          fileContents[file] = await readFile(file);
          filesProcessed++;
        } catch (error) {
          logger.error(`Error reading file ${file}:`, error);
        }
      }
    }
    
    const prompt = `
You are an expert code reviewer. Analyze this project:

Files:
${Object.keys(fileContents).join('\n')}

The output MUST be valid JSON with this exact structure (no explanation, just JSON):

{
  "issues": ["string"],
  "suggestions": ["string"]
}

Issues should include:
- Code quality issues
- Potential bugs
- Security vulnerabilities

Suggestions should include:
- Best practices
- Architectural improvements
- Code organization

Remember: only respond with the JSON structure, no introduction, explanation or markdown code blocks.
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      const result = this.parseJsonFromText(text);
      
      // Ensure critical properties exist
      if (!result.issues) {
        result.issues = [];
      }
      
      if (!result.suggestions) {
        result.suggestions = [];
      }
      
      if (!Array.isArray(result.issues)) {
        result.issues = [];
      }
      
      if (!Array.isArray(result.suggestions)) {
        result.suggestions = [];
      }
      
      return result;
    } catch (error) {
      logger.error('Error scanning project with Ollama:', error);
      throw error;
    }
  }
}