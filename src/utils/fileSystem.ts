import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { logger } from './logger';
import { FileChange } from '../types';

/**
 * Create a directory if it doesn't exist
 * @param dir Directory path
 */
export async function createDirectoryIfNotExists(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    logger.debug(`Creating directory: ${dir}`);
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Write content to a file, creating parent directories if needed
 * @param filePath Path to the file
 * @param content Content to write
 */
export async function writeFileWithContent(filePath: string, content: string | object): Promise<void> {
  try {
    // Create parent directory if it doesn't exist
    await createDirectoryIfNotExists(path.dirname(filePath));
    
    // Convert object to string if necessary
    const contentStr = typeof content === 'object' ? 
      JSON.stringify(content, null, 2) : 
      String(content);
    
    // Write file
    await fs.writeFile(filePath, contentStr);
    logger.debug(`File written: ${filePath}`);
  } catch (error) {
    logger.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Read a file's content
 * @param filePath Path to the file
 * @returns File content as string
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    logger.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all files in a directory (and optionally its subdirectories)
 * @param dirPath Directory path
 * @param recursive Whether to include subdirectories
 * @returns Array of file paths
 */
export async function listFiles(dirPath: string, recursive: boolean = false): Promise<string[]> {
  try {
    const pattern = recursive ? `${dirPath}/**/*` : `${dirPath}/*`;
    return await glob(pattern, { dot: true });
  } catch (error) {
    logger.error(`Error listing files in ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Delete a file or directory
 * @param path Path to file or directory
 * @param recursive Whether to recursively delete directories
 */
export async function deletePath(path: string, recursive: boolean = false): Promise<void> {
  try {
    const stats = await fs.stat(path);
    
    if (stats.isDirectory()) {
      if (recursive) {
        await fs.rm(path, { recursive: true, force: true });
      } else {
        await fs.rmdir(path);
      }
    } else {
      await fs.unlink(path);
    }
    
    logger.debug(`Deleted: ${path}`);
  } catch (error) {
    logger.error(`Error deleting ${path}:`, error);
    throw error;
  }
}

/**
 * Apply a set of file changes to a project
 * @param projectDir Project directory
 * @param changes Array of file changes
 * @returns Promise that resolves when all changes are applied
 */
export async function applyFileChanges(projectDir: string, changes: FileChange[]): Promise<void> {
  for (const change of changes) {
    const filePath = path.join(projectDir, change.path);
    
    try {
      switch (change.type) {
        case 'add':
        case 'modify':
          if (!change.content) {
            logger.warn(`No content provided for ${change.type} operation on ${change.path}`);
            continue;
          }
          await writeFileWithContent(filePath, change.content);
          logger.debug(`${change.type === 'add' ? 'Added' : 'Modified'} file: ${change.path}`);
          break;
          
        case 'delete':
          if (await fileExists(filePath)) {
            await deletePath(filePath);
            logger.debug(`Deleted file: ${change.path}`);
          }
          break;
          
        default:
          logger.warn(`Unknown file change type: ${(change as any).type}`);
      }
    } catch (error) {
      logger.error(`Error applying change to ${change.path}:`, error);
      throw error;
    }
  }
}

/**
 * Compare file content to check if it has changed
 * @param filePath Path to the file
 * @param newContent New content to compare
 * @returns True if content differs or file doesn't exist, false if identical
 */
export async function hasContentChanged(filePath: string, newContent: string): Promise<boolean> {
  try {
    if (!(await fileExists(filePath))) {
      return true; // New file
    }
    
    const existingContent = await readFile(filePath);
    return existingContent !== newContent;
  } catch (error) {
    logger.warn(`Error comparing file ${filePath}:`, error);
    return true; // Assume changed if there's an error
  }
}