import { AzureOpenAI } from 'openai';
import { BaseLLMService } from './base';
import { ProjectStructure, ProjectFile, ProjectPlan, Documentation } from '../../types';
import { logger } from '../../utils/logger';
import { listFiles, readFile } from '../../utils/fileSystem';
import path from 'path';

export class AzureService extends BaseLLMService {
  private client: AzureOpenAI;
  private modelName: string;

  private maxTokensLimit = 4000; // Slightly below 4096 to be safe

  constructor(apiKey: string) {
    super(apiKey);
    
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    if (!endpoint) {
      throw new Error('Azure OpenAI endpoint is required. Set AZURE_OPENAI_ENDPOINT in your environment variables.');
    }
    
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
    if (!deployment) {
      throw new Error('Azure OpenAI deployment ID is required. Set AZURE_OPENAI_DEPLOYMENT_ID in your environment variables.');
    }

    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    
    this.client = new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion
    });
    
    this.modelName = process.env.AZURE_OPENAI_MODEL || deployment;
    
    logger.info(`Using Azure OpenAI with deployment ID: ${deployment}, model: ${this.modelName}`);
  }

  async generateProjectPlan(requirements: string): Promise<ProjectPlan> {
    logger.info('Generating project plan with Azure OpenAI...');
    
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
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert software architect. Provide responses in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        model: this.modelName,
        temperature: 0.7,
        max_tokens: this.maxTokensLimit,
        response_format: { type: 'json_object' }
      });
      
      const text = response.choices[0].message.content || '';
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating project plan with Azure OpenAI:', error);
      throw error;
    }
  }
  
  async generateProjectStructure(plan: ProjectPlan): Promise<ProjectStructure> {
    logger.info('Generating project structure with Azure OpenAI...');
    
    const prompt = `
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
    `;
    
    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert software developer. Provide responses in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        model: this.modelName,
        temperature: 0.7,
        max_tokens: this.maxTokensLimit,
        response_format: { type: 'json_object' }
      });
      
      const text = response.choices[0].message.content || '';
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating project structure with Azure OpenAI:', error);
      throw error;
    }
  }
  
  async fixCompilationErrors(errors: string[], projectStructure: ProjectStructure): Promise<ProjectFile[]> {
    logger.info('Fixing compilation errors with Azure OpenAI...');
    
    const prompt = `
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
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert TypeScript developer. Provide responses in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        model: this.modelName,
        temperature: 0.3,
        max_tokens: this.maxTokensLimit,
        response_format: { type: 'json_object' }
      });
      
      const text = response.choices[0].message.content || '';
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error fixing compilation errors with Azure OpenAI:', error);
      throw error;
    }
  }
  
  async generateDocumentation(projectStructure: ProjectStructure): Promise<Documentation> {
    logger.info('Generating documentation with Azure OpenAI...');
    
    const prompt = `
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
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert technical writer. Provide responses in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        model: this.modelName,
        temperature: 0.7,
        max_tokens: this.maxTokensLimit,
        response_format: { type: 'json_object' }
      });
      
      const text = response.choices[0].message.content || '';
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error generating documentation with Azure OpenAI:', error);
      throw error;
    }
  }
  
  async generateEnhancementSuggestions(projectStructure: ProjectStructure): Promise<string> {
    logger.info('Generating enhancement suggestions with Azure OpenAI...');
    
    const prompt = `
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
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert software consultant. Provide a structured Markdown response.' },
          { role: 'user', content: prompt }
        ],
        model: this.modelName,
        temperature: 0.7,
        max_tokens: this.maxTokensLimit
      });
      
      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('Error generating enhancement suggestions with Azure OpenAI:', error);
      throw error;
    }
  }
  
  async scanProject(projectPath: string): Promise<{ issues: string[]; suggestions: string[] }> {
    logger.info('Scanning project with Azure OpenAI...');
    
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
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert code reviewer. Provide responses in JSON format only.' },
          { role: 'user', content: prompt }
        ],
        model: this.modelName,
        temperature: 0.3,
        max_tokens: this.maxTokensLimit,
        response_format: { type: 'json_object' }
      });
      
      const text = response.choices[0].message.content || '';
      return this.parseJsonFromText(text);
    } catch (error) {
      logger.error('Error scanning project with Azure OpenAI:', error);
      throw error;
    }
  }
}