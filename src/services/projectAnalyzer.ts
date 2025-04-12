import path from 'path';
import { Listr } from 'listr2';
import { LLMServiceFactory } from './llm';
import { checkOutdatedPackages } from './packageManager';
import { compileProject } from '../core/compiler';
import { logger } from '../utils/logger';
import { writeFileWithContent } from '../utils/fileSystem';
import chalk from 'chalk';

export async function analyzeProject(
  projectPath: string,
  modelName: string,
  suggestEnhancements: boolean = false
): Promise<void> {
  const llmService = LLMServiceFactory.createService(modelName);
  
  const tasks = new Listr([
    {
      title: 'Scanning project files',
      task: async (ctx) => {
        logger.info('Scanning project files...');
        const { issues, suggestions } = await llmService.scanProject(projectPath);
        ctx.issues = issues;
        ctx.suggestions = suggestions;
        return 'Project scan completed';
      }
    },
    {
      title: 'Checking for outdated packages',
      task: async (ctx) => {
        logger.info('Checking for outdated packages...');
        const outdatedPackages = await checkOutdatedPackages(projectPath);
        ctx.outdatedPackages = outdatedPackages;
        
        const packageCount = Object.keys(outdatedPackages).length;
        if (packageCount > 0) {
          return `Found ${packageCount} outdated packages`;
        } else {
          return 'All packages are up to date';
        }
      }
    },
    {
      title: 'Verifying compilation',
      task: async (ctx) => {
        logger.info('Compiling project...');
        const compilationResult = await compileProject(projectPath);
        ctx.compilationSuccess = compilationResult.success;
        
        if (compilationResult.success) {
          return 'Project compiles successfully';
        } else {
          ctx.compilationErrors = compilationResult.errors;
          return 'Found compilation errors';
        }
      }
    },
    {
      title: 'Generating enhancement suggestions',
      enabled: () => suggestEnhancements,
      task: async (ctx, task) => {
        logger.info('Generating enhancement suggestions...');
        
        // Create a mock project structure for the LLM
        const mockProjectStructure = {
          directories: [],
          files: [],
          dependencies: {
            dependencies: {},
            devDependencies: {}
          }
        };
        
        const suggestions = await llmService.generateEnhancementSuggestions(mockProjectStructure);
        ctx.enhancementSuggestions = suggestions;
        
        // Save suggestions to a file
        const suggestionsPath = path.join(projectPath, 'ENHANCEMENTS.md');
        await writeFileWithContent(suggestionsPath, suggestions);
        
        return `Enhancement suggestions generated and saved to ${suggestionsPath}`;
      }
    }
  ], { concurrent: false, rendererOptions: { collapseErrors: false } });
  
  try {
    const context = await tasks.run();
    
    // Display results
    console.log('\n' + chalk.bold.blue('======================================='));
    console.log(chalk.bold.blue('=          Analysis Results             ='));
    console.log(chalk.bold.blue('=======================================') + '\n');
    
    // Display issues
    console.log(chalk.bold.yellow('Issues:'));
    if (context.issues && context.issues.length > 0) {
      context.issues.forEach((issue: string, index: number) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('No issues found.');
    }
    console.log();
    
    // Display suggestions
    console.log(chalk.bold.green('Suggestions:'));
    if (context.suggestions && context.suggestions.length > 0) {
      context.suggestions.forEach((suggestion: string, index: number) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
    } else {
      console.log('No suggestions available.');
    }
    console.log();
    
    // Display outdated packages
    console.log(chalk.bold.magenta('Outdated Packages:'));
    if (context.outdatedPackages && Object.keys(context.outdatedPackages).length > 0) {
      console.log(chalk.gray('Package Name          Current      Wanted       Latest'));
      console.log(chalk.gray('---------------------------------------------------------'));
      
      Object.entries(context.outdatedPackages).forEach(([name, versions]: [string, any]) => {
        console.log(
          `${name.padEnd(22)} ${versions.current.padEnd(12)} ${versions.wanted.padEnd(12)} ${versions.latest}`
        );
      });
    } else {
      console.log('All packages are up to date.');
    }
    console.log();
    
    // Display compilation status
    console.log(chalk.bold.cyan('Compilation Status:'));
    if (context.compilationSuccess) {
      console.log(chalk.green('Project compiles successfully.'));
    } else {
      console.log(chalk.red('Project has compilation errors:'));
      if (context.compilationErrors && context.compilationErrors.length > 0) {
        context.compilationErrors.forEach((error: string, index: number) => {
          console.log(`${index + 1}. ${error}`);
        });
      }
    }
    console.log();
    
    // Summary
    if (suggestEnhancements) {
      console.log(chalk.bold.green('Enhancement suggestions have been saved to ENHANCEMENTS.md'));
    }
    
    logger.success('Project analysis completed');
  } catch (error) {
    logger.error('Error analyzing project:', error);
    throw error;
  }
}