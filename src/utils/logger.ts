import chalk from 'chalk';

/**
 * Logger utility for console output with color-coding
 */
class Logger {
  private debugMode: boolean;

  constructor() {
    this.debugMode = process.env.DEBUG === 'true';
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  info(message: string, ...optionalParams: any[]): void {
    console.log(chalk.blue('ℹ️ INFO:'), message, ...optionalParams);
  }

  /**
   * Log a success message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  success(message: string, ...optionalParams: any[]): void {
    console.log(chalk.green('✅ SUCCESS:'), message, ...optionalParams);
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  warn(message: string, ...optionalParams: any[]): void {
    console.log(chalk.yellow('⚠️ WARNING:'), message, ...optionalParams);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  error(message: string, ...optionalParams: any[]): void {
    console.error(chalk.red('❌ ERROR:'), message, ...optionalParams);
  }

  /**
   * Log a debug message (only in debug mode)
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  debug(message: string, ...optionalParams: any[]): void {
    if (this.debugMode) {
      console.log(chalk.gray('🔍 DEBUG:'), message, ...optionalParams);
    }
  }
  
  /**
   * Toggle debug mode
   * @param enabled Whether debug mode should be enabled
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

export const logger = new Logger();