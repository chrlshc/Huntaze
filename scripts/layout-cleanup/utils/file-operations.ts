import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Utility functions for file operations
 */

export interface FileInfo {
  path: string;
  content: string;
  exists: boolean;
}

/**
 * Read a file and return its content
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Write content to a file
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    throw new Error(`Failed to delete file ${filePath}: ${error}`);
  }
}

/**
 * Copy a file from source to destination
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  try {
    await fs.copyFile(source, destination);
  } catch (error) {
    throw new Error(`Failed to copy file from ${source} to ${destination}: ${error}`);
  }
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Ensure a directory exists, create if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error}`);
  }
}

/**
 * Find all files matching a pattern in a directory
 */
export async function findFiles(
  dirPath: string,
  pattern: RegExp,
  recursive: boolean = true
): Promise<string[]> {
  const results: string[] = [];

  async function scan(currentPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory() && recursive) {
          await scan(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.warn(`Warning: Could not read directory ${currentPath}`);
    }
  }

  await scan(dirPath);
  return results;
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    throw new Error(`Failed to get stats for ${filePath}: ${error}`);
  }
}

/**
 * Create a backup of a file with timestamp
 */
export async function createBackup(
  filePath: string,
  backupDir: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  const backupFileName = `${relativePath.replace(/\//g, '_')}-${timestamp}`;
  const backupPath = path.join(backupDir, backupFileName);

  await ensureDirectory(backupDir);
  await copyFile(filePath, backupPath);

  return backupPath;
}

/**
 * Restore a file from backup
 */
export async function restoreFromBackup(
  backupPath: string,
  originalPath: string
): Promise<void> {
  await copyFile(backupPath, originalPath);
}

/**
 * Clean up old backups (older than specified days)
 */
export async function cleanupOldBackups(
  backupDir: string,
  daysToKeep: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  let deletedCount = 0;

  try {
    const files = await fs.readdir(backupDir);

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not clean up backups in ${backupDir}`);
  }

  return deletedCount;
}
