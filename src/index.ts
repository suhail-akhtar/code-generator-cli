#!/usr/bin/env node
import dotenv from 'dotenv';
import { program } from 'commander';
import { setupCLI } from './cli';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Set up the CLI
setupCLI(program);

// Error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the CLI
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
}