import axios from 'axios';
import { BaseLLMService } from './base';
import { ProjectStructure, ProjectFile, ProjectPlan, Documentation } from '../../types';
import { logger } from '../../utils/logger';
import { listFiles, readFile } from '../../utils/fileSystem';
import path from 'path';

export class GroqService extends BaseLLMService {
  private apiUrl: string = 'https://api.groq.com/openai/v1/chat/completions';
  private modelName: string = 'llama3-70b-8192';

  constructor(apiKey: string, modelName?: string) {
    super(apiKey);
    if (modelName) {
      this.modelName = modelName;
    } else if (process.env.GROQ_MODEL) {
      this.modelName = process.env.GROQ_MODEL;
    }
    
    logger.info(`Using Groq with model: ${this.modelName}`);
  }

  private async callGroqAPI(messages: any[]): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.modelName,
          messages,
          temperature: 0.7,
          max_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response) {
        logger.error('Groq API error:', error.response.data);
      } else {
        logger.error('Error calling Groq API:', error);
      }
      throw error;
    }
  }

  async generateProjectPlan(requirements: string): Promise<ProjectPlan> {
    logger.info('Generating project plan with Groq...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are an expert software architect tasked with creating a production-ready project plan. Provide your response in JSON format.'
      },
      {
        role: 'user',
        content: `Based on the following requirements, create a detailed project plan:
        
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
        }`
      }
    ];
    
    try {
      const text = await this.callGroqAPI(messages);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating project plan with Groq:', error);
      throw error;
    }
  }
  
  async generateProjectStructure(plan: ProjectPlan): Promise<ProjectStructure> {
    logger.info('Generating project structure with Groq...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are an expert software developer tasked with creating a production-ready project structure. Provide your response in JSON format.'
      },
      {
        role: 'user',
        content: `Based on the following project plan, create a detailed project structure with all necessary files and their content:
        
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
        Implement robust error handling.`
      }
    ];
    
    try {
      const text = await this.callGroqAPI(messages);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating project structure with Groq:', error);
      throw error;
    }
  }
  
  async fixCompilationErrors(errors: string[], projectStructure: ProjectStructure): Promise<ProjectFile[]> {
    logger.info('Fixing compilation errors with Groq...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are an expert TypeScript developer tasked with fixing compilation errors. Provide your response in JSON format.'
      },
      {
        role: 'user',
        content: `Here are the compilation errors:
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
        
        Include only the files that need to be updated with their full content.`
      }
    ];
    
    try {
      const text = await this.callGroqAPI(messages);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error fixing compilation errors with Groq:', error);
      throw error;
    }
  }
  
  async generateDocumentation(projectStructure: ProjectStructure): Promise<Documentation> {
    logger.info('Generating documentation with Groq...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are an expert technical writer tasked with creating documentation. Provide your response in JSON format.'
      },
      {
        role: 'user',
        content: `Based on the following project structure, create comprehensive documentation:
        
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
        - Contributing guidelines`
      }
    ];
    
    try {
      const text = await this.callGroqAPI(messages);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating documentation with Groq:', error);
      throw error;
    }
  }
  
  async generateEnhancementSuggestions(projectStructure: ProjectStructure): Promise<string> {
    logger.info('Generating enhancement suggestions with Groq...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are an expert software consultant tasked with suggesting enhancements for a project.'
      },
      {
        role: 'user',
        content: `Based on the following project structure, suggest enhancements and improvements:
        
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
        - [Step 2]`
      }
    ];
    
    try {
      const text = await this.callGroqAPI(messages);
      return text;
    } catch (error) {
      logger.error('Error generating enhancement suggestions with Groq:', error);
      throw error;
    }
  }
  
  async scanProject(projectPath: string): Promise<{ issues: string[]; suggestions: string[] }> {
    logger.info('Scanning project with Groq...');
    
    // Get all project files
    const files = await listFiles(projectPath, true);
    const fileContents: Record<string, string> = {};
    
    // Read content of important files (limit to prevent context overflow)
    const MAX_FILES = 15;
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
    
    const messages = [
      {
        role: 'system',
        content: 'You are an expert code reviewer tasked with analyzing a project. Provide your response in JSON format.'
      },
      {
        role: 'user',
        content: `Here is the structure of the project at ${projectPath}:
        
        ${Object.keys(fileContents).map(file => `- ${file}`).join('\n')}
        
        And here are the contents of the key files:
        
        ${Object.entries(fileContents).map(([file, content]) => `
        === ${file} ===
        ${content.substring(0, 800)}${content.length > 800 ? '... (truncated)' : ''}
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
        - Testing strategies`
      }
    ];
    
    try {
      const text = await this.callGroqAPI(messages);
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error scanning project with Groq:', error);
      throw error;
    }
  }
}