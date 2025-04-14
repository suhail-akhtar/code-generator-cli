import { Command } from 'commander';
import { startInteractiveMode } from './interactive';
import { generateProject } from '../core/projectGenerator';
import { analyzeProject } from '../services/projectAnalyzer';
import { logger } from '../utils/logger';
import { startProjectUpdateSession } from '../services/projectUpdater';
import { fileExists, readFile } from '../utils/fileSystem';
import path from 'path';

export const setupCLI = (program: Command): void => {
  program
    .name('project-gen')
    .description('AI-powered project generator CLI')
    .version('1.0.0');

  program
    .command('generate')
    .description('Generate a new project based on requirements')
    .option('-i, --interactive', 'Start in interactive mode')
    .option('-r, --requirements <requirements>', 'Project requirements as text')
    .option('-o, --output <directory>', 'Output directory', './generated-project')
    .option('-m, --model <model>', 'LLM model to use (gemini, azure, groq, ollama)', 'gemini')
    .action(async (options) => {
      try {
        if (options.interactive || (!options.requirements)) {
          await startInteractiveMode(options);
        } else {
          await generateProject({
            requirements: options.requirements,
            outputDir: options.output,
            modelName: options.model
          });
          
          // Ask if user wants to enter update mode
          const inquirer = await import('inquirer');
          const { enterUpdateMode } = await inquirer.default.prompt([
            {
              type: 'confirm',
              name: 'enterUpdateMode',
              message: 'Would you like to enter interactive update mode?',
              default: false
            }
          ]);
          
          if (enterUpdateMode) {
            await startProjectUpdateSession(
              options.output,
              options.model,
              options.requirements
            );
          }
        }
      } catch (error) {
        logger.error('Error generating project:', error);
        process.exit(1);
      }
    });

  program
    .command('update')
    .description('Update or modify an existing project interactively')
    .option('-p, --path <path>', 'Path to the project', '.')
    .option('-m, --model <model>', 'LLM model to use (gemini, azure, groq, ollama)', 'gemini')
    .action(async (options) => {
      try {
        // Check if this is a valid project
        const packageJsonPath = path.join(options.path, 'package.json');
        if (!(await fileExists(packageJsonPath))) {
          logger.error('No valid project found at this path. Missing package.json');
          process.exit(1);
        }
        
        // Try to get original requirements from a metadata file
        let requirements = '';
        const metadataPath = path.join(options.path, '.project-gen.json');
        
        if (await fileExists(metadataPath)) {
          try {
            const metadata = JSON.parse(await readFile(metadataPath));
            requirements = metadata.requirements || '';
          } catch (e) {
            logger.warn('Could not read project metadata:', e);
          }
        }
        
        if (!requirements) {
          // Ask for requirements if not found
          const inquirer = await import('inquirer');
          const { projectRequirements } = await inquirer.default.prompt([
            {
              type: 'input',
              name: 'projectRequirements',
              message: 'Please describe the existing project requirements:',
              validate: (input) => input.length > 0 ? true : 'Requirements cannot be empty'
            }
          ]);
          
          requirements = projectRequirements;
        }
        
        await startProjectUpdateSession(options.path, options.model, requirements);
      } catch (error) {
        logger.error('Error updating project:', error);
        process.exit(1);
      }
    });

  program
    .command('analyze')
    .description('Analyze an existing project for improvements')
    .option('-p, --path <path>', 'Path to the project', '.')
    .option('-m, --model <model>', 'LLM model to use (gemini, azure, groq, ollama)', 'gemini')
    .action(async (options) => {
      try {
        await analyzeProject(options.path, options.model, false);
      } catch (error) {
        logger.error('Error analyzing project:', error);
        process.exit(1);
      }
    });

  program
    .command('enhance')
    .description('Suggest enhancements for an existing project')
    .option('-p, --path <path>', 'Path to the project', '.')
    .option('-m, --model <model>', 'LLM model to use (gemini, azure, groq, ollama)', 'gemini')
    .action(async (options) => {
      try {
        await analyzeProject(options.path, options.model, true);
      } catch (error) {
        logger.error('Error enhancing project:', error);
        process.exit(1);
      }
    });
};