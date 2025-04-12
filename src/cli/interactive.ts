import inquirer from 'inquirer';
import { generateProject } from '../core/projectGenerator';
import { analyzeProject } from '../services/projectAnalyzer';
import { logger } from '../utils/logger';

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
      
      // Regenerate project with updated requirements
      await generateProject({
        requirements: context.requirements,
        outputDir: context.outputDir,
        modelName: context.modelName,
        isUpdate: true
      });
    }

    // Continue the interaction loop
    await handleAdditionalInteractions(context);
  }
};