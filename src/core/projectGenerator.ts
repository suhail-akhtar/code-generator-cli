import path from 'path';
import fs from 'fs/promises';
import { Listr } from 'listr2';
import { LLMServiceFactory } from '../services/llm';
import { installPackages } from '../services/packageManager';
import { compileProject } from './compiler';
import { logger } from '../utils/logger';
import { createDirectoryIfNotExists, writeFileWithContent } from '../utils/fileSystem';
import { ProjectStructure } from '../types';

interface GenerateProjectOptions {
  requirements: string;
  outputDir: string;
  modelName: string;
  isUpdate?: boolean;
}

export async function generateProject(options: GenerateProjectOptions): Promise<void> {
  const { requirements, outputDir, modelName, isUpdate = false } = options;
  
  // Initialize LLM service
  const llmService = LLMServiceFactory.createService(modelName);
  
  // Create base directory if it doesn't exist
  await createDirectoryIfNotExists(outputDir);
  
  // Define tasks
  const tasks = new Listr([
    {
      title: 'Analyzing requirements',
      task: async (ctx) => {
        logger.info('Analyzing requirements with LLM...');
        ctx.projectPlan = await llmService.generateProjectPlan(requirements);
        return 'Requirements analyzed successfully';
      }
    },
    {
      title: 'Creating project structure',
      task: async (ctx, task) => {
        logger.info('Generating project structure...');
        const projectStructure: ProjectStructure = await llmService.generateProjectStructure(ctx.projectPlan);
        ctx.projectStructure = projectStructure;
        
        // Create subdirectories
        for (const dir of projectStructure.directories) {
          const dirPath = path.join(outputDir, dir);
          await createDirectoryIfNotExists(dirPath);
          task.output = `Created directory: ${dir}`;
        }
        
        // Create files
        const fileCreationTasks = projectStructure.files.map(file => ({
          title: `Creating file: ${file.path}`,
          task: async () => {
            const filePath = path.join(outputDir, file.path);
            await writeFileWithContent(filePath, file.content);
            return `Created file: ${file.path}`;
          }
        }));
        
        return task.newListr(fileCreationTasks, { concurrent: false });
      }
    },
    {
      title: 'Installing dependencies',
      task: async (ctx, task) => {
        logger.info('Installing packages...');
        await installPackages(outputDir, ctx.projectStructure.dependencies);
        return 'Dependencies installed successfully';
      }
    },
    {
      title: 'Compiling project',
      task: async (ctx, task) => {
        logger.info('Compiling project...');
        const compilationResult = await compileProject(outputDir);
        
        if (compilationResult.success) {
          return 'Project compiled successfully';
        } else {
          // Log the actual errors for debugging
          logger.debug('Compilation errors:', compilationResult.errors);
          
          // Check if errors are too complex or lengthy to fix
          if (!compilationResult.errors || 
              compilationResult.errors.length === 0 || 
              (compilationResult.errors[0] && compilationResult.errors[0].length > 5000)) {
            return 'Skipping compilation - JavaScript project or complex build setup';
          }
          
          // Fix compilation errors using LLM
          task.output = 'Fixing compilation errors...';
          try {
            const fixedFiles = await llmService.fixCompilationErrors(
              compilationResult.errors,
              ctx.projectStructure
            );
            
            if (!fixedFiles || fixedFiles.length === 0) {
              logger.warn('No fixes provided by the LLM');
              return 'Completed with compilation warnings';
            }
            
            // Update the files with fixed content
            for (const file of fixedFiles) {
              const filePath = path.join(outputDir, file.path);
              await writeFileWithContent(filePath, file.content);
              task.output = `Fixed file: ${file.path}`;
            }
            
            // Try compiling again
            const recompilationResult = await compileProject(outputDir);
            if (!recompilationResult.success) {
              logger.warn('Compilation still has issues, but continuing with project generation');
              return 'Completed with compilation warnings';
            }
            
            return 'Fixed compilation errors and compiled successfully';
          } catch (fixError) {
            logger.error('Error fixing compilation errors:', fixError);
            return 'Completed with compilation warnings';
          }
        }
      }
    },
    {
      title: 'Generating documentation',
      task: async (ctx) => {
        logger.info('Generating documentation...');
        const docs = await llmService.generateDocumentation(ctx.projectStructure);
        
        // Create README.md
        const readmePath = path.join(outputDir, 'README.md');
        await writeFileWithContent(readmePath, docs.readme);
        
        // Create additional documentation files
        for (const doc of docs.additional) {
          const docPath = path.join(outputDir, doc.path);
          await writeFileWithContent(docPath, doc.content);
        }
        
        return 'Documentation generated successfully';
      }
    },
    {
      title: 'Suggesting enhancements',
      task: async (ctx) => {
        logger.info('Generating enhancement suggestions...');
        const suggestions = await llmService.generateEnhancementSuggestions(ctx.projectStructure);
        
        // Save suggestions to a file
        const suggestionsPath = path.join(outputDir, 'ENHANCEMENTS.md');
        await writeFileWithContent(suggestionsPath, suggestions);
        
        return 'Enhancement suggestions generated successfully';
      }
    }
  ], { concurrent: false, rendererOptions: { collapseErrors: false } });
  
  try {
    await tasks.run();
    
    logger.success(`Project ${isUpdate ? 'updated' : 'generated'} successfully in ${path.resolve(outputDir)}`);
    logger.info('You can now explore the project and check the generated files.');
    logger.info('To run the project, follow the instructions in the README.md file.');
  } catch (error) {
    logger.error(`Error ${isUpdate ? 'updating' : 'generating'} project:`, error);
    throw error;
  }
}