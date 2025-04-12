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
            temperature: 0.7,
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
    <system>
    You are an expert software architect tasked with creating a production-ready project plan.
    Provide your response in JSON format.
    </system>
    
    <user>
    Based on the following requirements, create a detailed project plan:
    
    ${requirements}
    
    Provide your response in JSON format with the following structure:
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
    </user>
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
    <system>
    You are an expert software developer tasked with creating a production-ready project structure.
    Provide your response in JSON format.
    </system>
    
    <user>
    Based on the following project plan, create a detailed project structure with all necessary files and their content:
    
    ${JSON.stringify(plan, null, 2)}
    
    Provide your response in JSON format with the following structure:
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
    Include proper type definitions for TypeScript.
    Implement robust error handling.
    </user>
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating project structure with Ollama:', error);
      throw error;
    }
  }
  
  async fixCompilationErrors(errors: string[], projectStructure: ProjectStructure): Promise<ProjectFile[]> {
    logger.info('Fixing compilation errors with Ollama...');
    
    const prompt = `
    <system>
    You are an expert TypeScript developer tasked with fixing compilation errors.
    Provide your response in JSON format.
    </system>
    
    <user>
    Here are the compilation errors:
    ${errors.join('\n')}
    
    Here is the current project structure:
    ${JSON.stringify(projectStructure, null, 2)}
    
    Analyze the errors and provide fixed versions of the files that need to be updated.
    
    Provide your response in JSON format with the following structure:
    [
      {
        "path": "string",
        "content": "string"
      }
    ]
    
    Include only the files that need to be updated with their full content.
    </user>
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error fixing compilation errors with Ollama:', error);
      throw error;
    }
  }
  
  async generateDocumentation(projectStructure: ProjectStructure): Promise<Documentation> {
    logger.info('Generating documentation with Ollama...');
    
    const prompt = `
    <system>
    You are an expert technical writer tasked with creating documentation.
    Provide your response in JSON format.
    </system>
    
    <user>
    Based on the following project structure, create comprehensive documentation:
    
    ${JSON.stringify(projectStructure, null, 2)}
    
    Provide your response in JSON format with the following structure:
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
    - Development setup
    
    Additional documentation should cover:
    - API documentation
    - Architecture overview
    - Contributing guidelines
    </user>
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating documentation with Ollama:', error);
      throw error;
    }
  }
  
  async generateEnhancementSuggestions(projectStructure: ProjectStructure): Promise<string> {
    logger.info('Generating enhancement suggestions with Ollama...');
    
    const prompt = `
    <system>
    You are an expert software consultant tasked with suggesting enhancements for a project.
    </system>
    
    <user>
    Based on the following project structure, suggest enhancements and improvements:
    
    ${JSON.stringify(projectStructure, null, 2)}
    
    Provide a comprehensive Markdown document with the following sections:
    
    # Enhancement Suggestions
    
    ## Feature Enhancements
    - [Suggestion 1]
    - [Suggestion 2]
    
    ## Performance Improvements
    - [Suggestion 1]
    - [Suggestion 2]
    
    ## Security Enhancements
    - [Suggestion 1]
    - [Suggestion 2]
    
    ## UI/UX Improvements
    - [Suggestion 1]
    - [Suggestion 2]
    
    ## Advanced Features
    - [Suggestion 1]
    - [Suggestion 2]
    
    ## Next Steps
    - [Step 1]
    - [Step 2]
    </user>
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return text;
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
    <system>
    You are an expert code reviewer tasked with analyzing a project.
    Provide your response in JSON format.
    </system>
    
    <user>
    Here is the structure of the project at ${projectPath}:
    
    ${Object.keys(fileContents).map(file => `- ${file}`).join('\n')}
    
    And here are the contents of the key files:
    
    ${Object.entries(fileContents).map(([file, content]) => `
    === ${file} ===
    ${content.substring(0, 500)}${content.length > 500 ? '... (truncated)' : ''}
    `).join('\n')}
    
    Provide your analysis in JSON format with the following structure:
    {
      "issues": ["string"],
      "suggestions": ["string"]
    }
    
    Issues should include:
    - Code quality issues
    - Potential bugs
    - Security vulnerabilities
    - Performance issues
    
    Suggestions should include:
    - Best practices
    - Architectural improvements
    - Code organization
    - Testing strategies
    </user>
    `;
    
    try {
      const text = await this.callOllamaAPI(prompt);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error scanning project with Ollama:', error);
      throw error;
    }
  }
}