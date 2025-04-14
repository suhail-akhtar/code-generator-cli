import path from 'path';
import fs from 'fs/promises';
import { Listr } from 'listr2';
import { LLMServiceFactory } from '../services/llm';
import { installPackages } from '../services/packageManager';
import { compileProject } from './compiler';
import { logger } from '../utils/logger';
import { createDirectoryIfNotExists, writeFileWithContent, fileExists, readFile } from '../utils/fileSystem';
import { ProjectStructure, ProjectFile } from '../types';

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
  
  // Check if this is an update to an existing project
  const isExistingProject = await fileExists(path.join(outputDir, 'package.json'));
  
  // Load existing project structure for updates if needed
  let existingStructure: ProjectStructure | null = null;
  if (isUpdate && isExistingProject) {
    try {
      // Create a simplified representation of the existing project
      existingStructure = await extractExistingProjectStructure(outputDir);
      logger.info('Loaded existing project structure for update');
    } catch (error) {
      logger.warn('Failed to load existing project structure:', error);
      // Proceed with normal generation if we can't load the existing structure
    }
  }
  
  // Define tasks
  const tasks = new Listr([
    {
      title: 'Analyzing requirements',
      task: async (ctx) => {
        logger.info('Analyzing requirements with LLM...');
        
        // If we're updating, provide the existing structure to the LLM
        if (isUpdate && existingStructure) {
          // Modify the requirements to be clear this is an update
          const updateRequirements = 
            `I have an existing project with the following structure:\n` +
            `${JSON.stringify(existingStructure, null, 2)}\n\n` +
            `Please update this project based on these requirements:\n${requirements}\n\n` +
            `IMPORTANT: Do not recreate files that don't need changes. Only modify or add files that are relevant to the requirements.`;
          
          ctx.projectPlan = await llmService.generateProjectPlan(updateRequirements);
        } else {
          ctx.projectPlan = await llmService.generateProjectPlan(requirements);
        }
        
        return 'Requirements analyzed successfully';
      }
    },
    {
      title: isUpdate ? 'Updating project structure' : 'Creating project structure',
      task: async (ctx, task) => {
        logger.info(isUpdate ? 'Updating project structure...' : 'Generating project structure...');
        
        let projectStructure: ProjectStructure;
        
        if (isUpdate && existingStructure) {
          // For updates, we'll use a modified approach that reuses the existing structure
          const updatePrompt = `Update the existing project structure based on the new requirements. Only add or modify files that need to change.`;
          projectStructure = await llmService.generateProjectStructure({ 
            ...ctx.projectPlan,
            updatePrompt 
          });
          
          // Merge with existing structure
          projectStructure = await mergeProjectStructures(existingStructure, projectStructure);
        } else {
          projectStructure = await llmService.generateProjectStructure(ctx.projectPlan);
        }
        
        ctx.projectStructure = projectStructure;
        
        // Create subdirectories
        for (const dir of projectStructure.directories) {
          const dirPath = path.join(outputDir, dir);
          await createDirectoryIfNotExists(dirPath);
          task.output = `Created directory: ${dir}`;
        }
        
        // Create or update files
        const fileCreationTasks = projectStructure.files.map(file => ({
          title: `${isUpdate ? 'Updating' : 'Creating'} file: ${file.path}`,
          task: async () => {
            const filePath = path.join(outputDir, file.path);
            
            // For updates, check if the file exists and has changed
            if (isUpdate) {
              try {
                const existingContent = await readFile(filePath);
                if (existingContent === file.content) {
                  return `File unchanged: ${file.path}`;
                }
              } catch (error) {
                // File doesn't exist, will be created
              }
            }
            
            await writeFileWithContent(filePath, file.content);
            return `${isUpdate ? 'Updated' : 'Created'} file: ${file.path}`;
          }
        }));
        
        return task.newListr(fileCreationTasks, { 
          concurrent: false,
          exitOnError: false // Don't stop if a few files fail
        });
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
      title: 'Updating documentation',
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
      enabled: () => !isUpdate, // Skip for updates
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

/**
 * Extract the structure of an existing project
 * @param projectDir Project directory
 * @returns Simplified project structure
 */
async function extractExistingProjectStructure(projectDir: string): Promise<ProjectStructure> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Get directories
    const { stdout: dirOutput } = await execAsync('find . -type d -not -path "*/node_modules/*" -not -path "*/\\.*" | sort', { cwd: projectDir });
    const directories = dirOutput.split('\n')
      .filter((dir: string) => dir && dir !== '.' && dir !== '..')
      .map((dir: string) => dir.substring(2)); // Remove './'
    
    // Get files
    const { stdout: fileOutput } = await execAsync('find . -type f -not -path "*/node_modules/*" -not -path "*/\\.*" -not -path "*/dist/*" | sort', { cwd: projectDir });
    const filePaths = fileOutput.split('\n')
      .filter((file: string) => file)
      .map((file: string) => file.substring(2)); // Remove './'
    
    // Read file contents (limit to key files to avoid large payload)
    const MAX_FILES = 20;
    const IMPORTANT_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.yaml', '.yml'];
    const KEY_FILES = ['package.json', 'tsconfig.json', 'README.md'];
    
    const files: ProjectFile[] = [];
    let fileCount = 0;
    
    // First add key files
    for (const keyFile of KEY_FILES) {
      const keyFilePath: string | undefined = filePaths.find((p: string) => p.endsWith(keyFile));
      if (keyFilePath) {
        try {
          const content = await readFile(path.join(projectDir, keyFilePath));
          files.push({ path: keyFilePath, content });
          fileCount++;
        } catch (error) {
          logger.warn(`Could not read key file ${keyFilePath}:`, error);
        }
      }
    }
    
    // Then add important files by extension
    for (const filePath of filePaths) {
      if (fileCount >= MAX_FILES) break;
      
      // Skip if already added as a key file
      if (files.some(f => f.path === filePath)) continue;
      
      const ext = path.extname(filePath);
      if (IMPORTANT_EXTENSIONS.includes(ext)) {
        try {
          const content = await readFile(path.join(projectDir, filePath));
          files.push({ path: filePath, content });
          fileCount++;
        } catch (error) {
          logger.warn(`Could not read file ${filePath}:`, error);
        }
      }
    }
    
    // Parse package.json for dependencies
    let dependencies = { dependencies: {}, devDependencies: {} };
    try {
      const packageJsonPath = path.join(projectDir, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath);
      const packageJson = JSON.parse(packageJsonContent);
      
      dependencies = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };
    } catch (error) {
      logger.warn('Could not parse package.json for dependencies:', error);
    }
    
    return {
      directories,
      files,
      dependencies
    };
  } catch (error) {
    logger.error('Error extracting project structure:', error);
    throw new Error(`Failed to extract project structure: ${error}`);
  }
}

/**
 * Merge an existing project structure with new structure
 * @param existing Existing project structure
 * @param newStructure New project structure
 * @returns Merged project structure
 */
async function mergeProjectStructures(existing: ProjectStructure, newStructure: ProjectStructure): Promise<ProjectStructure> {
  // Combine directories without duplicates
  const directories = Array.from(new Set([...existing.directories, ...newStructure.directories]));
  
  // For files, new files take precedence
  const existingFilePaths = existing.files.map(file => file.path);
  const newFilePaths = newStructure.files.map(file => file.path);
  
  // Keep existing files that aren't overwritten
  const unchangedFiles = existing.files.filter(file => !newFilePaths.includes(file.path));
  
  // Merge the files, with new files taking precedence
  const files = [...unchangedFiles, ...newStructure.files];
  
  // Merge dependencies
  const dependencies = {
    dependencies: { ...existing.dependencies.dependencies, ...newStructure.dependencies.dependencies },
    devDependencies: { ...existing.dependencies.devDependencies, ...newStructure.dependencies.devDependencies }
  };
  
  return {
    directories,
    files,
    dependencies
  };
}