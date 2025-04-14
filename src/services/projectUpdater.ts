import { Listr } from 'listr2';
import inquirer from 'inquirer';
import path from 'path';
import { LLMServiceFactory } from './llm';
import { generateProject } from '../core/projectGenerator';
import { analyzeProject } from './projectAnalyzer';
import { logger } from '../utils/logger';
import { fileExists } from '../utils/fileSystem';

/**
 * Start an update session for an existing project
 */
export async function startProjectUpdateSession(
  outputDir: string,
  modelName: string,
  requirements: string
): Promise<void> {
  logger.info('Starting interactive update session...');
  
  let continueSession = true;
  while (continueSession) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Add new feature', value: 'feature' },
          { name: 'Fix a bug', value: 'bugfix' },
          { name: 'Enhance UI/UX', value: 'ui' },
          { name: 'Improve performance', value: 'performance' },
          { name: 'Add security measures', value: 'security' },
          { name: 'Analyze project', value: 'analyze' },
          { name: 'Exit update session', value: 'exit' }
        ]
      }
    ]);
    
    if (action === 'exit') {
      continueSession = false;
      continue;
    }
    
    if (action === 'analyze') {
      await analyzeProject(outputDir, modelName, true);
      continue;
    }
    
    // For all modification actions
    const { description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: `Describe the ${action === 'feature' ? 'new feature' : action} change:`,
        validate: (input) => input.length > 0 ? true : 'Description cannot be empty'
      }
    ]);
    
    // Update the requirements with the new change
    const updatedRequirements = `${requirements}\n\nAdditional ${action} change: ${description}`;
    
    // Use simplified approach for now - regenerate project with isUpdate flag
    await generateProject({
      requirements: updatedRequirements,
      outputDir: outputDir,
      modelName: modelName,
      isUpdate: true
    });
    
    // Update the base requirements for future changes
    requirements = updatedRequirements;
    
    logger.success(`Project updated with ${action} changes!`);
  }
  
  logger.info('Update session completed.');
}