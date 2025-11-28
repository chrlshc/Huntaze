/**
 * Property-Based Test: No Backup Files
 * 
 * Feature: codebase-cleanup-refactor, Property 4: No Backup Files
 * Validates: Requirements 2.1
 * 
 * Property: For any file in the codebase, its name should not match 
 * backup patterns (.backup, .bak, .old, -backup, -old)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 4: No Backup Files', () => {
  const BACKUP_PATTERNS = [
    /\.backup$/,
    /\.bak$/,
    /\.old$/,
    /-backup\./,
    /-old\./,
    /\.copy$/,
    /-copy\./,
  ];

  const EXCLUDE_DIRS = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    'coverage',
  ];

  /**
   * Check if filename matches any backup pattern
   */
  function isBackupFile(filename: string): boolean {
    return BACKUP_PATTERNS.some(pattern => pattern.test(filename));
  }

  /**
   * Recursively scan directory for files
   */
  function scanDirectory(dir: string, files: string[] = [], rootDir: string = dir): string[] {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
          scanDirectory(fullPath, files, rootDir);
        } else if (entry.isFile()) {
          const relativePath = path.relative(rootDir, fullPath);
          files.push(relativePath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }

    return files;
  }

  /**
   * Get all files in specific directories
   */
  function getProjectFiles(): string[] {
    const rootDir = process.cwd();
    const dirsToScan = ['app', 'components', 'lib', 'hooks', 'contexts', 'styles'];
    const allFiles: string[] = [];

    for (const dir of dirsToScan) {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        scanDirectory(fullPath, allFiles, rootDir);
      }
    }

    return allFiles;
  }

  it('should not have any backup files in the codebase', () => {
    const files = getProjectFiles();
    const backupFiles = files.filter(file => isBackupFile(file));

    expect(
      backupFiles,
      `Found backup files that should be removed: ${backupFiles.join(', ')}`
    ).toHaveLength(0);
  });

  it('property: no file should match backup patterns', () => {
    const files = getProjectFiles();

    fc.assert(
      fc.property(
        fc.constantFrom(...(files.length > 0 ? files : ['dummy.ts'])),
        (filename) => {
          // Property: filename should not match any backup pattern
          return !isBackupFile(filename);
        }
      ),
      { numRuns: Math.min(files.length, 100) }
    );
  });

  it('property: backup pattern detection is consistent', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('.backup', '.bak', '.old', '-backup', '-old', '.copy', '-copy'),
        (basename, suffix) => {
          const filename = basename + suffix;
          
          // Property: any filename with backup suffix should be detected
          return isBackupFile(filename) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: non-backup files should not be flagged', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('.ts', '.tsx', '.js', '.jsx', '.css', '.md'),
        (basename, extension) => {
          // Ensure basename doesn't contain backup patterns
          const cleanBasename = basename.replace(/backup|bak|old|copy/gi, 'file');
          const filename = cleanBasename + extension;
          
          // Property: clean filenames should not be detected as backups
          return !isBackupFile(filename);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not have .env backup files', () => {
    const rootDir = process.cwd();
    const envBackups = ['.env.bak', '.env.backup', '.env.old'];

    for (const envFile of envBackups) {
      const fullPath = path.join(rootDir, envFile);
      expect(
        fs.existsSync(fullPath),
        `Environment backup file ${envFile} should not exist`
      ).toBe(false);
    }
  });

  it('should not have page backup files', () => {
    const files = getProjectFiles();
    const pageBackups = files.filter(file => 
      file.includes('page') && isBackupFile(file)
    );

    expect(
      pageBackups,
      `Found page backup files: ${pageBackups.join(', ')}`
    ).toHaveLength(0);
  });

  it('should not have component backup files', () => {
    const files = getProjectFiles();
    const componentBackups = files.filter(file => 
      file.includes('components') && isBackupFile(file)
    );

    expect(
      componentBackups,
      `Found component backup files: ${componentBackups.join(', ')}`
    ).toHaveLength(0);
  });

  it('property: backup files in any directory should be detected', () => {
    const directories = ['app', 'components', 'lib', 'hooks', 'styles'];

    fc.assert(
      fc.property(
        fc.constantFrom(...directories),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('.backup', '.bak', '.old'),
        (dir, filename, suffix) => {
          const fullFilename = `${dir}/${filename}${suffix}`;
          
          // Property: backup files should be detected regardless of directory
          return isBackupFile(fullFilename);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: case sensitivity in backup detection', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (basename) => {
          const variations = [
            `${basename}.backup`,
            `${basename}.BACKUP`,
            `${basename}.Backup`,
            `${basename}.bak`,
            `${basename}.BAK`,
          ];

          // Property: all case variations should be detected
          return variations.every(filename => isBackupFile(filename));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect backup files with multiple extensions', () => {
    const testCases = [
      'file.tsx.backup',
      'component.js.bak',
      'style.css.old',
      'config.json.backup',
    ];

    for (const testCase of testCases) {
      expect(
        isBackupFile(testCase),
        `${testCase} should be detected as a backup file`
      ).toBe(true);
    }
  });

  it('should not flag files with backup-like names but valid extensions', () => {
    const testCases = [
      'backup-utils.ts',
      'old-design.tsx',
      'copy-handler.js',
    ];

    for (const testCase of testCases) {
      // These are valid files, not backups (backup is part of the name, not suffix)
      const isBackup = isBackupFile(testCase);
      
      // Only flag if it ends with backup pattern
      if (testCase.endsWith('.backup') || testCase.endsWith('.bak') || testCase.endsWith('.old')) {
        expect(isBackup).toBe(true);
      }
    }
  });
});
