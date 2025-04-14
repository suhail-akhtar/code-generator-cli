import inquirer from 'inquirer';
import { generateProject } from '../core/projectGenerator';
import { analyzeProject } from '../services/projectAnalyzer';
import { logger } from '../utils/logger';
import path from 'path';
import { fileExists, readFile } from '../utils/fileSystem';

interface InteractiveOptions {
  output?: string;
  model?: string;
}

export const startInteractiveMode = async (options: InteractiveOptions): Promise<void> => {
  logger.info('Starting interactive mode...');
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'requirements',
      message: 'Describe your project requirements:',
      validate: (input) => input.length > 10 ? true : 'Please provide detailed requirements (at least 10 characters)'
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output directory:',
      default: options.output || './generated-project'
    },
    {
      type: 'list',
      name: 'modelName',
      message: 'Select LLM model:',
      choices: [
        { name: 'Google Gemini', value: 'gemini' },
        { name: 'Azure OpenAI', value: 'azure' },
        { name: 'Groq', value: 'groq' },
        { name: 'Ollama', value: 'ollama' }
      ],
      default: options.model || 'gemini'
    }
  ]);

  await generateProject({
    requirements: answers.requirements,
    outputDir: answers.outputDir,
    modelName: answers.modelName
  });

  // Store conversation context for future interactions
  const context = {
    requirements: answers.requirements,
    outputDir: answers.outputDir,
    modelName: answers.modelName
  };

  await handleAdditionalInteractions(context);
};

const handleAdditionalInteractions = async (context: any): Promise<void> => {
  const { moreChanges } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'moreChanges',
      message: 'Would you like to make additional changes to the project?',
      default: false
    }
  ]);

  if (moreChanges) {
    const { changeType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'changeType',
        message: 'What would you like to do?',
        choices: [
          { name: 'Add new features', value: 'features' },
          { name: 'Fix bugs', value: 'bugs' },
          { name: 'Enhance UI/UX', value: 'ui' },
          { name: 'Improve performance', value: 'performance' },
          { name: 'Add security measures', value: 'security' },
          { name: 'Get enhancement suggestions', value: 'analyze' }
        ]
      }
    ]);

    if (changeType === 'analyze') {
      await analyzeProject(context.outputDir, context.modelName, true);
    } else {
      const { changes } = await inquirer.prompt([
        {
          type: 'input',
          name: 'changes',
          message: `Describe the ${changeType} changes you want to make:`,
          validate: (input) => input.length > 0 ? true : 'Change description cannot be empty'
        }
      ]);

      // Update context with new requirements
      context.requirements = `${context.requirements}\n\nAdditional requirements (${changeType}): ${changes}`;
      
      // Apply changes to existing project instead of regenerating
      await modifyExistingProject(context, changeType, changes);
    }

    // Continue the interaction loop
    await handleAdditionalInteractions(context);
  }
};

const modifyExistingProject = async (context: any, changeType: string, changes: string): Promise<void> => {
  logger.info(`Applying ${changeType} changes to existing project...`);
  
  try {
    // Check if we're working with an existing project that has files
    const projectExists = await fileExists(path.join(context.outputDir, 'package.json'));
    
    if (!projectExists) {
      logger.warn('Project structure not found, creating from scratch');
      await generateProject({
        requirements: context.requirements,
        outputDir: context.outputDir,
        modelName: context.modelName
      });
      return;
    }
    
    // Load existing project metadata to understand its structure
    const packageJsonPath = path.join(context.outputDir, 'package.json');
    const packageJsonContent = await readFile(packageJsonPath);
    const packageJson = JSON.parse(packageJsonContent);
    
    // Determine specific actions based on change type
    switch (changeType) {
      case 'features':
        await addNewFeatures(context, changes, packageJson);
        break;
      case 'bugs':
        await fixBugs(context, changes, packageJson);
        break;
      case 'ui':
        await enhanceUI(context, changes, packageJson);
        break;
      case 'performance':
        await improvePerformance(context, changes, packageJson);
        break;
      case 'security':
        await addSecurity(context, changes, packageJson);
        break;
      default:
        // For unknown change types, use the selective update approach
        await generateProject({
          requirements: context.requirements,
          outputDir: context.outputDir,
          modelName: context.modelName,
          isUpdate: true
        });
    }
    
    logger.success(`Project updated with ${changeType} changes`);
  } catch (error) {
    logger.error(`Error updating project with ${changeType} changes:`, error);
    logger.info('Falling back to regeneration with updated requirements');
    
    await generateProject({
      requirements: context.requirements,
      outputDir: context.outputDir,
      modelName: context.modelName,
      isUpdate: true
    });
  }
};

// Implementation of specific change type handlers
const addNewFeatures = async (context: any, changes: string, packageJson: any): Promise<void> => {
  // Extract what new features need to be added
  logger.info('Adding new features to the project...');
  
  // Instead of recreating the project, we selectively update it
  await generateProject({
    requirements: `Add the following new features to the existing project:\n${changes}`,
    outputDir: context.outputDir,
    modelName: context.modelName,
    isUpdate: true
  });
};

const fixBugs = async (context: any, changes: string, packageJson: any): Promise<void> => {
  logger.info('Fixing bugs in the project...');
  
  await generateProject({
    requirements: `Fix the following bugs in the existing project:\n${changes}`,
    outputDir: context.outputDir,
    modelName: context.modelName,
    isUpdate: true
  });
};

const enhanceUI = async (context: any, changes: string, packageJson: any): Promise<void> => {
  logger.info('Enhancing UI/UX in the project...');
  
  await generateProject({
    requirements: `Enhance the UI/UX of the existing project as follows:\n${changes}`,
    outputDir: context.outputDir,
    modelName: context.modelName,
    isUpdate: true
  });
};

const improvePerformance = async (context: any, changes: string, packageJson: any): Promise<void> => {
  logger.info('Improving performance in the project...');
  
  await generateProject({
    requirements: `Improve the performance of the existing project as follows:\n${changes}`,
    outputDir: context.outputDir,
    modelName: context.modelName,
    isUpdate: true
  });
};

const addSecurity = async (context: any, changes: string, packageJson: any): Promise<void> => {
  logger.info('Adding security measures to the project...');
  
  await generateProject({
    requirements: `Add the following security measures to the existing project:\n${changes}`,
    outputDir: context.outputDir,
    modelName: context.modelName,
    isUpdate: true
  });
};