import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface CompilationResult {
  success: boolean;
  errors?: string[];
  output?: string;
}

export async function compileProject(projectDir: string): Promise<CompilationResult> {
  try {
    logger.info(`Compiling project in ${projectDir}...`);
    
    // Check if there's a package.json with a build script
    try {
      const { stdout: packageJsonContent } = await execAsync('cat package.json', { cwd: projectDir });
      const packageJson = JSON.parse(packageJsonContent);
      
      if (packageJson.scripts && packageJson.scripts.build) {
        // Run npm build command
        try {
          const { stdout } = await execAsync('npm run build', { cwd: projectDir });
          logger.success('Project compiled successfully');
          return {
            success: true,
            output: stdout
          };
        } catch (buildError: any) {
          logger.error('Build command failed:', buildError.stderr);
          return {
            success: false,
            errors: [buildError.stderr || buildError.message]
          };
        }
      } else {
        // If package.json exists but has no build script, check if it's a JavaScript project
        if (packageJson.dependencies && (
            packageJson.dependencies.react || 
            !packageJson.devDependencies?.typescript)) {
          logger.info('JavaScript project detected, skipping TypeScript compilation');
          return {
            success: true,
            output: 'JavaScript project, no compilation needed'
          };
        }
      }
    } catch (packageJsonError) {
      // No package.json or invalid JSON, try typescript directly
      logger.warn('No package.json with build script found, trying tsc directly');
    }
    
    // If no package.json with build script found, try using tsc directly
    try {
      // First check if tsconfig.json exists
      try {
        await execAsync('cat tsconfig.json', { cwd: projectDir });
      } catch (noTsConfig) {
        logger.info('No tsconfig.json found, assuming JavaScript project');
        return {
          success: true,
          output: 'JavaScript project, no compilation needed'
        };
      }
      
      const { stdout } = await execAsync('npx tsc --noEmit', { cwd: projectDir });
      logger.success('Project compiled successfully using TypeScript compiler');
      return {
        success: true,
        output: stdout
      };
    } catch (tscError: any) {
      // Capture and format the TypeScript errors
      logger.error('TypeScript compilation failed:', tscError.stderr || tscError.message);
      return {
        success: false,
        errors: [(tscError.stderr || tscError.message)]
      };
    }
  } catch (error: any) {
    logger.error('Compilation process failed:', error);
    return {
      success: false,
      errors: [error.message]
    };
  }
}