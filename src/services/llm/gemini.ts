import { GoogleGenAI } from '@google/genai';
import { BaseLLMService } from './base';
import { ProjectStructure, ProjectFile, ProjectPlan, Documentation } from '../../types';
import { logger } from '../../utils/logger';
import { listFiles, readFile } from '../../utils/fileSystem';
import path from 'path';

export class GeminiService extends BaseLLMService {
  private client: GoogleGenAI;
  private modelName: string = 'gemini-2.0-flash'; // Default model

  constructor(apiKey: string, modelName?: string) {
    super(apiKey);
    this.client = new GoogleGenAI({apiKey: apiKey});
    
    // Set the model name based on environment or parameter
    if (modelName) {
      this.modelName = modelName;
    } else if (process.env.GEMINI_MODEL) {
      this.modelName = process.env.GEMINI_MODEL;
    } else {
      // Check for specific model variants
      const models = [
        'gemini-2.5-pro-preview-03-25',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash'
      ];
      
      for (const model of models) {
        if (process.env[`GEMINI_${model.toUpperCase().replace(/[-\.]/g, '_')}_API_KEY`]) {
          this.modelName = model;
          break;
        }
      }
    }
    
    logger.info(`Using Gemini model: ${this.modelName}`);
  }

  async generateProjectPlan(requirements: string): Promise<ProjectPlan> {
    logger.info('Generating project plan with Gemini...');
    
        
    const prompt = `
    You are an expert software architect tasked with creating a production-ready project plan.
    
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
    `;
    
    try {
      const result = await this.client.models.generateContent({model: this.modelName, contents:prompt});
      const text = result.text;
      return this.parseJsonFromText(text ?? '');
    } catch (error) {
      logger.error('Error generating project plan with Gemini:', error);
      throw error;
    }
  }
  
  async generateProjectStructure(plan: ProjectPlan): Promise<ProjectStructure> {
    logger.info('Generating project structure with Gemini...');
    
        
    const prompt = `
    You are an expert software developer tasked with creating a production-ready project structure.
    
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
    Include comprehensive documentation comments.
    `;
    
    try {
      const result = await this.client.models.generateContent({model: this.modelName, contents: prompt});
      const text = result.text;
      return this.parseJsonFromText(text ?? '');
    } catch (error) {
      logger.error('Error generating project structure with Gemini:', error);
      throw error;
    }
  }
  
  async fixCompilationErrors(errors: string[], projectStructure: ProjectStructure): Promise<ProjectFile[]> {
    logger.info('Fixing compilation errors with Gemini...');
    
    
    
    const prompt = `
    You are an expert TypeScript developer tasked with fixing compilation errors in a project.
    
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
    `;
    
    try {
      const result = await this.client.models.generateContent({model:this.modelName, contents:prompt});
      const text = result.text;
      return this.parseJsonFromText(text??'');
    } catch (error) {
      logger.error('Error fixing compilation errors with Gemini:', error);
      throw error;
    }
  }
  
  async generateDocumentation(projectStructure: ProjectStructure): Promise<Documentation> {
    logger.info('Generating documentation with Gemini...');
      
    const prompt = `
    You are an expert technical writer tasked with creating documentation for a project.
    
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
    `;
    
    try {
      const result = await this.client.models.generateContent({model:this.modelName, contents:prompt});
      const text = result.text;
      return this.parseJsonFromText(text??'');
    } catch (error) {
      logger.error('Error generating documentation with Gemini:', error);
      throw error;
    }
  }
  
  async generateEnhancementSuggestions(projectStructure: ProjectStructure): Promise<string> {
    logger.info('Generating enhancement suggestions with Gemini...');
    
    const prompt = `
    You are an expert software consultant tasked with suggesting enhancements for a project.
    
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
    `;
    
    try {
      const result = await this.client.models.generateContent({model:this.modelName, contents:prompt});
      return result.text ?? '';
      
    } catch (error) {
      logger.error('Error generating enhancement suggestions with Gemini:', error);
      throw error;
    }
  }
  
  async scanProject(projectPath: string): Promise<{ issues: string[]; suggestions: string[] }> {
    logger.info('Scanning project with Gemini...');
    
    // Get all project files
    const files = await listFiles(projectPath, true);
    const fileContents: Record<string, string> = {};
    
    // Read content of important files (limit to prevent context overflow)
    const MAX_FILES = 20;
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
    You are an expert code reviewer tasked with analyzing a project.
    
    Here is the structure of the project at ${projectPath}:
    
    ${Object.keys(fileContents).map(file => `- ${file}`).join('\n')}
    
    And here are the contents of the key files:
    
    ${Object.entries(fileContents).map(([file, content]) => `
    === ${file} ===
    ${content.substring(0, 1000)}${content.length > 1000 ? '... (truncated)' : ''}
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
    `;
    
    try {
      const result = await this.client.models.generateContent({model:this.modelName, contents:prompt});
      const text = result.text;
      return this.parseJsonFromText(text??'');
    } catch (error) {
      logger.error('Error scanning project with Gemini:', error);
      throw error;
    }
  }
}