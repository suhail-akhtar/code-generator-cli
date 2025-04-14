import { BaseLLMService } from './base';
import { GeminiService } from './gemini';
import { AzureService } from './azure';
import { GroqService } from './groq';
import { OllamaService } from './ollama';
import { logger } from '../../utils/logger';
import { ProjectStructure, FileChange, ProjectUpdateOptions } from '../../types';
import { applyFileChanges } from '../../utils/fileSystem';
import path from 'path';

export class LLMServiceFactory {
  static createService(modelName: string): BaseLLMService {
    const apiKeys: Record<string, string | undefined> = {
      gemini: process.env.GEMINI_API_KEY,
      azure: process.env.AZURE_OPENAI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      ollama: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    };

    const apiKey = apiKeys[modelName];
    
    if (!apiKey && modelName !== 'ollama') {
      throw new Error(`API key for ${modelName} not found in environment variables`);
    }
    
    switch (modelName) {
      case 'gemini':
        logger.info('Using Google Gemini model');
        return new GeminiService(apiKey!);
      case 'azure':
        logger.info('Using Azure OpenAI model');
        return new AzureService(apiKey!);
      case 'groq':
        logger.info('Using Groq model');
        return new GroqService(apiKey!);
      case 'ollama':
        logger.info('Using Ollama model');
        return new OllamaService(apiKey || 'http://localhost:11434');
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }

  /**
   * Update an existing project using a LLM
   * @param projectDir Project directory
   * @param options Update options
   * @param modelName LLM model to use
   * @returns Promise that resolves when update is complete
   */
  static async updateProject(
    projectDir: string, 
    options: ProjectUpdateOptions,
    modelName: string
  ): Promise<void> {
    logger.info(`Updating project with ${options.changeType} changes...`);
    
    const service = this.createService(modelName);
    
    try {
      // Format the update prompt based on the change type
      const updatePrompt = formatUpdatePrompt(options);
      
      // Generate file changes based on the prompt
      const fileChanges = await generateFileChanges(service, updatePrompt, options);
      
      // Apply the changes to the project
      await applyFileChanges(projectDir, fileChanges);
      
      logger.success('Project updated successfully');
    } catch (error) {
      logger.error('Error updating project:', error);
      throw error;
    }
  }
}

/**
 * Format the update prompt based on the change type
 * @param options Update options
 * @returns Formatted prompt
 */
function formatUpdatePrompt(options: ProjectUpdateOptions): string {
  const { changeType, changes } = options;
  
  const promptPrefix = {
    features: 'Add the following new features to the existing project:',
    bugs: 'Fix the following bugs in the existing project:',
    ui: 'Enhance the UI/UX of the existing project as follows:',
    performance: 'Improve the performance of the existing project as follows:',
    security: 'Add the following security measures to the existing project:'
  }[changeType] || 'Make the following changes to the existing project:';
  
  return `${promptPrefix}\n\n${changes}\n\nOnly modify files that need to be changed.`;
}

/**
 * Generate file changes based on the update prompt
 * @param service LLM service
 * @param prompt Update prompt
 * @param options Update options
 * @returns Array of file changes
 */
async function generateFileChanges(
  service: BaseLLMService,
  prompt: string,
  options: ProjectUpdateOptions
): Promise<FileChange[]> {
  const { existingStructure } = options;
  
  if (!existingStructure) {
    throw new Error('Cannot generate file changes without existing project structure');
  }
  
  // Use the LLM to generate changes
  const updateRequirements = 
    `I have an existing project with the following structure:\n` +
    `${JSON.stringify(existingStructure, null, 2)}\n\n` +
    `${prompt}\n\n` +
    `Please provide the list of files that need to be added, modified, or deleted in JSON format.`;
  
  // We don't have a direct method in BaseLLMService to get file changes,
  // so we'll use generateProjectStructure and compare with the existing structure
  const temporaryPlan = await service.generateProjectPlan(updateRequirements);
  const updatedStructure = await service.generateProjectStructure(temporaryPlan);
  
  // Compare and generate changes
  return compareStructuresForChanges(existingStructure, updatedStructure);
}

/**
 * Compare project structures to determine file changes
 * @param existing Existing project structure
 * @param updated Updated project structure
 * @returns Array of file changes
 */
function compareStructuresForChanges(
  existing: ProjectStructure,
  updated: ProjectStructure
): FileChange[] {
  const changes: FileChange[] = [];
  
  // Map existing files by path for easier lookup
  const existingFilesMap = new Map(
    existing.files.map(file => [file.path, file.content])
  );
  
  // Find added or modified files
  for (const file of updated.files) {
    if (!existingFilesMap.has(file.path)) {
      // This is a new file
      changes.push({
        path: file.path,
        type: 'add',
        content: file.content
      });
    } else if (existingFilesMap.get(file.path) !== file.content) {
      // This is a modified file
      changes.push({
        path: file.path,
        type: 'modify',
        content: file.content
      });
    }
  }
  
  // Find deleted files (if any)
  // Note: LLMs typically don't suggest deletions, but we support it for completeness
  const updatedFilePaths = new Set(updated.files.map(file => file.path));
  for (const existingPath of existingFilesMap.keys()) {
    if (!updatedFilePaths.has(existingPath)) {
      changes.push({
        path: existingPath,
        type: 'delete'
      });
    }
  }
  
  return changes;
}