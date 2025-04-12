import { Command } from 'commander';
import { startInteractiveMode } from './interactive';
import { generateProject } from '../core/projectGenerator';
import { analyzeProject } from '../services/projectAnalyzer';
import { logger } from '../utils/logger';

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
        }
      } catch (error) {
        logger.error('Error generating project:', error);
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