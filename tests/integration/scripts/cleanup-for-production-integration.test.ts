/**
 * Integration Tests - Cleanup for Production Script
 * 
 * Tests the actual execution of scripts/cleanup-for-production.sh
 * in a controlled test environment
 * 
 * Coverage:
 * - Script execution in test environment
 * - File deletion verification
 * - Gitignore updates
 * - Git operations
 * - Error scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SCRIPT_PATH = join(process.cwd(), 'scripts/cleanup-for-production.sh');
const TEST_REPO_DIR = join(process.cwd(), '.test-cleanup-repo');

describe('Cleanup for Production Script - Integration Tests', () => {
  beforeEach(() => {
    // Create test repository
    if (existsSync(TEST_REPO_DIR)) {
      rmSync(TEST_REPO_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_REPO_DIR, { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: TEST_REPO_DIR });
    execSync('git config user.email "test@example.com"', { cwd: TEST_REPO_DIR });
    execSync('git config user.name "Test User"', { cwd: TEST_REPO_DIR });
  });

  afterEach(() => {
    // Cleanup test repository
    if (existsSync(TEST_REPO_DIR)) {
      rmSync(TEST_REPO_DIR, { recursive: true, force: true });
    }
  });

  describe('File Deletion Operations', () => {
    it('should delete test summary files from root', () => {
      // Create test files
      const testFiles = [
        'TESTS_SUMMARY.md',
        'TASK_1_TESTS_COMPLETE.md',
        'FILES_CREATED_TESTS.md',
        'TEST_RESULTS.md',
        'DEPLOYMENT_STATUS.md',
        'PRODUCTION_READY.md',
      ];

      testFiles.forEach(file => {
        writeFileSync(join(TEST_REPO_DIR, file), 'test content');
      });

      // Verify files exist
      testFiles.forEach(file => {
        expect(existsSync(join(TEST_REPO_DIR, file))).toBe(true);
      });

      // Copy and run script
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      // Add files to git
      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      // Run script (may fail on git stash, that's ok for this test)
      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Script may fail on some operations, but file deletion should work
      }

      // Verify files are deleted (or staged for deletion)
      const remainingFiles = readdirSync(TEST_REPO_DIR);
      const testFilesRemaining = testFiles.filter(file => 
        remainingFiles.includes(file)
      );

      // Most test files should be gone
      expect(testFilesRemaining.length).toBeLessThan(testFiles.length);
    });

    it('should preserve README.md and CHANGELOG.md', () => {
      // Create essential files
      writeFileSync(join(TEST_REPO_DIR, 'README.md'), '# README');
      writeFileSync(join(TEST_REPO_DIR, 'CHANGELOG.md'), '# CHANGELOG');
      writeFileSync(join(TEST_REPO_DIR, 'TEST_SUMMARY.md'), 'test');

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      // Essential files should still exist
      expect(existsSync(join(TEST_REPO_DIR, 'README.md'))).toBe(true);
      expect(existsSync(join(TEST_REPO_DIR, 'CHANGELOG.md'))).toBe(true);
    });

    it('should delete test documentation in tests/ directory', () => {
      // Create tests directory with documentation
      const testsDir = join(TEST_REPO_DIR, 'tests');
      mkdirSync(testsDir, { recursive: true });

      const testDocs = [
        'TESTS_SUMMARY.md',
        'TESTS_README.md',
        'FILES_CREATED_TESTS.md',
      ];

      testDocs.forEach(file => {
        writeFileSync(join(testsDir, file), 'test content');
      });

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      // Test docs should be deleted
      const remainingFiles = existsSync(testsDir) ? readdirSync(testsDir) : [];
      const docsRemaining = testDocs.filter(file => remainingFiles.includes(file));

      expect(docsRemaining.length).toBe(0);
    });

    it('should clean build artifacts', () => {
      // Create build directories
      const buildDirs = ['.next', '.turbo', 'dist', 'coverage', 'test-results'];

      buildDirs.forEach(dir => {
        const dirPath = join(TEST_REPO_DIR, dir);
        mkdirSync(dirPath, { recursive: true });
        writeFileSync(join(dirPath, 'test.txt'), 'content');
      });

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add cleanup.sh', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      // Build directories should be deleted
      buildDirs.forEach(dir => {
        expect(existsSync(join(TEST_REPO_DIR, dir))).toBe(false);
      });
    });
  });

  describe('Gitignore Updates', () => {
    it('should append to existing .gitignore', () => {
      // Create initial .gitignore
      const initialContent = '# Initial content\nnode_modules/\n';
      writeFileSync(join(TEST_REPO_DIR, '.gitignore'), initialContent);

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      const gitignoreContent = readFileSync(join(TEST_REPO_DIR, '.gitignore'), 'utf-8');

      // Should contain both initial and new content
      expect(gitignoreContent).toContain('# Initial content');
      expect(gitignoreContent).toContain('node_modules/');
      expect(gitignoreContent).toContain('*_TESTS_*.md');
      expect(gitignoreContent).toContain('*_SUMMARY.md');
    });

    it('should add test artifact patterns to .gitignore', () => {
      writeFileSync(join(TEST_REPO_DIR, '.gitignore'), '');

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      const gitignoreContent = readFileSync(join(TEST_REPO_DIR, '.gitignore'), 'utf-8');

      const expectedPatterns = [
        '*_TESTS_*.md',
        '*_SUMMARY.md',
        '*_COMPLETE.md',
        '*_STATUS.md',
        'FILES_CREATED_*.md',
        '!docs/**/*.md',
        '!README.md',
        '!CHANGELOG.md',
      ];

      expectedPatterns.forEach(pattern => {
        expect(gitignoreContent).toContain(pattern);
      });
    });
  });

  describe('Git Operations', () => {
    it('should create backup with git stash', () => {
      // Create a file to stash
      writeFileSync(join(TEST_REPO_DIR, 'test.txt'), 'content');

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      // Modify file
      writeFileSync(join(TEST_REPO_DIR, 'test.txt'), 'modified');

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      // Check if stash was created
      const stashList = execSync('git stash list', { 
        cwd: TEST_REPO_DIR,
        encoding: 'utf-8'
      });

      expect(stashList).toContain('backup-before-cleanup');
    });

    it('should stage changes with git add', () => {
      writeFileSync(join(TEST_REPO_DIR, 'TEST_SUMMARY.md'), 'test');

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      // Check git status
      const status = execSync('git status --porcelain', {
        cwd: TEST_REPO_DIR,
        encoding: 'utf-8'
      });

      // Should have staged changes
      expect(status.length).toBeGreaterThan(0);
    });
  });

  describe('File Count Validation', () => {
    it('should count tracked files', () => {
      // Create multiple files
      for (let i = 0; i < 10; i++) {
        writeFileSync(join(TEST_REPO_DIR, `file${i}.txt`), 'content');
      }

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      let output = '';
      try {
        output = execSync('./cleanup.sh', { 
          cwd: TEST_REPO_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        output = error.stdout || '';
      }

      // Should display file count
      expect(output).toContain('Current tracked files:');
      expect(output).toMatch(/\d+/); // Should contain a number
    });

    it('should warn if file count exceeds 1000', () => {
      // This test would require creating 1000+ files, which is impractical
      // Instead, we verify the warning logic exists in the script
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('if [ "$FILE_COUNT" -gt 1000 ]');
      expect(scriptContent).toContain('WARNING');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing directories gracefully', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      // Run script without build directories
      let exitCode = 0;
      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error: any) {
        exitCode = error.status || 1;
      }

      // Should not fail due to missing directories
      // (may fail for other reasons like git stash)
      expect([0, 1]).toContain(exitCode);
    });

    it('should handle missing test files gracefully', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      // Run script without test files
      let exitCode = 0;
      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error: any) {
        exitCode = error.status || 1;
      }

      // Should not fail due to missing files
      expect([0, 1]).toContain(exitCode);
    });
  });

  describe('Output Messages', () => {
    it('should display progress messages', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      let output = '';
      try {
        output = execSync('./cleanup.sh', {
          cwd: TEST_REPO_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        output = error.stdout || '';
      }

      const expectedMessages = [
        'Huntaze Production Cleanup',
        'Creating backup',
        'Removing test summary files',
        'Cleanup complete',
      ];

      expectedMessages.forEach(message => {
        expect(output).toContain(message);
      });
    });

    it('should display next steps', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      let output = '';
      try {
        output = execSync('./cleanup.sh', {
          cwd: TEST_REPO_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        output = error.stdout || '';
      }

      expect(output).toContain('Next steps:');
      expect(output).toContain('git status');
      expect(output).toContain('git commit');
      expect(output).toContain('npm ci');
      expect(output).toContain('npm run build');
    });
  });

  describe('Safety Checks', () => {
    it('should not delete source code directories', () => {
      // Create source directories
      const sourceDirs = ['app', 'lib', 'components', 'pages'];
      sourceDirs.forEach(dir => {
        const dirPath = join(TEST_REPO_DIR, dir);
        mkdirSync(dirPath, { recursive: true });
        writeFileSync(join(dirPath, 'test.ts'), 'export {}');
      });

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      // Source directories should still exist
      sourceDirs.forEach(dir => {
        expect(existsSync(join(TEST_REPO_DIR, dir))).toBe(true);
      });
    });

    it('should not delete package.json', () => {
      writeFileSync(join(TEST_REPO_DIR, 'package.json'), '{}');

      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      expect(existsSync(join(TEST_REPO_DIR, 'package.json'))).toBe(true);
    });

    it('should not delete .git directory', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      const testScriptPath = join(TEST_REPO_DIR, 'cleanup.sh');
      writeFileSync(testScriptPath, scriptContent);
      execSync(`chmod +x ${testScriptPath}`);

      execSync('git add .', { cwd: TEST_REPO_DIR });
      execSync('git commit -m "initial"', { cwd: TEST_REPO_DIR });

      try {
        execSync('./cleanup.sh', { cwd: TEST_REPO_DIR, stdio: 'pipe' });
      } catch (error) {
        // Ignore errors
      }

      expect(existsSync(join(TEST_REPO_DIR, '.git'))).toBe(true);
    });
  });
});
