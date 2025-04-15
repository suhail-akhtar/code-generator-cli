import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileWithContent } from '../utils/fileSystem';
import { logger } from '../utils/logger';
import path from 'path';

const execAsync = promisify(exec);

export interface Dependencies {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/**
 * Install packages in the specified directory
 * @param projectDir Directory of the project
 * @param dependencies Dependencies to install
 * @returns Promise that resolves when all packages are installed
 */
export async function installPackages(
  projectDir: string,
  dependencies: Dependencies | undefined
): Promise<void> {
  try {
    // Handle case where dependencies is undefined
    if (!dependencies) {
      dependencies = {
        dependencies: {},
        devDependencies: {}
      };
      logger.warn('No dependencies specified, using empty dependency objects');
    }
    
    // Ensure dependencies and devDependencies exist
    if (!dependencies.dependencies) {
      dependencies.dependencies = {};
    }
    
    if (!dependencies.devDependencies) {
      dependencies.devDependencies = {};
    }
    
    // Check if package.json exists
    const packageJsonPath = path.join(projectDir, 'package.json');
    let packageJson: any;
    
    try {
      const { stdout } = await execAsync(`cat ${packageJsonPath}`);
      packageJson = JSON.parse(stdout);
    } catch (e) {
      // Create a new package.json if it doesn't exist
      packageJson = {
        name: path.basename(projectDir),
        version: '1.0.0',
        description: 'Generated project',
        main: 'index.js',
        scripts: {
          test: 'echo "Error: no test specified" && exit 1'
        },
        keywords: [],
        author: '',
        license: 'ISC',
        dependencies: {},
        devDependencies: {}
      };
    }
    
    // Merge dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies.dependencies
    };
    
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...dependencies.devDependencies
    };
    
    // Write updated package.json
    await writeFileWithContent(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    logger.info('Installing dependencies...');
    await execAsync('npm install', { cwd: projectDir });
    logger.success('Dependencies installed successfully');
    
  } catch (error) {
    logger.error('Error installing packages:', error);
    throw new Error(`Failed to install packages: ${error}`);
  }
}

/**
 * Get installed versions of packages
 * @param projectDir Directory of the project
 * @returns Object containing package names and versions
 */
export async function getInstalledVersions(
  projectDir: string
): Promise<Record<string, string>> {
  try {
    const { stdout } = await execAsync('npm list --json', { cwd: projectDir });
    const npmList = JSON.parse(stdout);
    
    return npmList.dependencies || {};
  } catch (error) {
    logger.error('Error getting installed versions:', error);
    return {};
  }
}

/**
 * Check for outdated packages
 * @param projectDir Directory of the project
 * @returns Object containing outdated packages info
 */
export async function checkOutdatedPackages(
  projectDir: string
): Promise<Record<string, { current: string; wanted: string; latest: string }>> {
  try {
    const { stdout } = await execAsync('npm outdated --json', { cwd: projectDir });
    
    try {
      return JSON.parse(stdout);
    } catch (e) {
      // npm outdated returns empty output if no packages are outdated
      return {};
    }
  } catch (error: any) {
    // npm outdated exits with code 1 if outdated packages exist
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (e) {
        return {};
      }
    }
    
    logger.error('Error checking outdated packages:', error);
    return {};
  }
}