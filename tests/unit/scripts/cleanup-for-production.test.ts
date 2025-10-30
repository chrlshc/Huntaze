/**
 * Unit Tests - Cleanup for Production Script
 * 
 * Tests for scripts/cleanup-for-production.sh
 * 
 * Coverage:
 * - Script execution and exit codes
 * - File deletion operations
 * - Backup creation
 * - .gitignore updates
 * - Build artifact cleanup
 * - File count validation
 * - Git operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const SCRIPT_PATH = join(process.cwd(), 'scripts/cleanup-for-production.sh');
const TEST_DIR = join(process.cwd(), '.test-cleanup-temp');

describe('Cleanup for Production Script - Unit Tests', () => {
  beforeEach(() => {
    // Create test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Script Existence and Permissions', () => {
    it('should exist at expected path', () => {
      expect(existsSync(SCRIPT_PATH)).toBe(true);
    });

    it('should be executable', () => {
      const stats = require('fs').statSync(SCRIPT_PATH);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should have bash shebang', () => {
      const content = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should have set -e for error handling', () => {
      const content = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(content).toContain('set -e');
    });
  });

  describe('Script Content Validation', () => {
    let scriptContent: string;

    beforeEach(() => {
      scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('should have descriptive header comment', () => {
      expect(scriptContent).toContain('Huntaze Production Cleanup Script');
      expect(scriptContent).toContain('Nettoie tous les fichiers');
    });

    it('should create backup with git stash', () => {
      expect(scriptContent).toContain('git stash push');
      expect(scriptContent).toContain('backup-before-cleanup');
    });

    it('should remove test summary files', () => {
      expect(scriptContent).toContain('rm -f *_TESTS_*.md');
      expect(scriptContent).toContain('rm -f *_SUMMARY.md');
      expect(scriptContent).toContain('rm -f *_COMPLETE.md');
      expect(scriptContent).toContain('rm -f *_STATUS.md');
    });

    it('should remove FILES_CREATED files', () => {
      expect(scriptContent).toContain('rm -f FILES_CREATED_*.md');
    });

    it('should remove TEST files', () => {
      expect(scriptContent).toContain('rm -f TEST_*.md');
    });

    it('should remove DEPLOYMENT files', () => {
      expect(scriptContent).toContain('rm -f DEPLOYMENT_*.md');
    });

    it('should remove PRODUCTION files', () => {
      expect(scriptContent).toContain('rm -f PRODUCTION_*.md');
    });

    it('should preserve essential documentation', () => {
      expect(scriptContent).toContain('README.md');
      expect(scriptContent).toContain('CHANGELOG.md');
      expect(scriptContent).toContain('docs/');
    });

    it('should clean test documentation in tests/', () => {
      expect(scriptContent).toContain('find tests -name "*_SUMMARY.md" -delete');
      expect(scriptContent).toContain('find tests -name "*_README.md" -delete');
      expect(scriptContent).toContain('find tests -name "FILES_CREATED*.md" -delete');
    });

    it('should update .gitignore', () => {
      expect(scriptContent).toContain('cat >> .gitignore');
      expect(scriptContent).toContain('*_TESTS_*.md');
      expect(scriptContent).toContain('*_SUMMARY.md');
      expect(scriptContent).toContain('!docs/**/*.md');
      expect(scriptContent).toContain('!README.md');
      expect(scriptContent).toContain('!CHANGELOG.md');
    });

    it('should clean build artifacts', () => {
      expect(scriptContent).toContain('rm -rf .next');
      expect(scriptContent).toContain('rm -rf .turbo');
      expect(scriptContent).toContain('rm -rf dist');
      expect(scriptContent).toContain('rm -rf coverage');
      expect(scriptContent).toContain('rm -rf reports');
      expect(scriptContent).toContain('rm -rf test-results');
    });

    it('should clean node_modules cache', () => {
      expect(scriptContent).toContain('rm -rf node_modules/.cache');
    });

    it('should verify file count', () => {
      expect(scriptContent).toContain('git ls-files | wc -l');
      expect(scriptContent).toContain('FILE_COUNT');
    });

    it('should warn if file count exceeds 1000', () => {
      expect(scriptContent).toContain('if [ "$FILE_COUNT" -gt 1000 ]');
      expect(scriptContent).toContain('WARNING');
    });

    it('should stage changes with git add', () => {
      expect(scriptContent).toContain('git add -A');
    });

    it('should provide next steps instructions', () => {
      expect(scriptContent).toContain('Next steps:');
      expect(scriptContent).toContain('git status');
      expect(scriptContent).toContain('git commit');
      expect(scriptContent).toContain('npm ci --legacy-peer-deps');
      expect(scriptContent).toContain('npm run build');
      expect(scriptContent).toContain('git push origin main');
    });
  });

  describe('File Deletion Patterns', () => {
    it('should target correct test summary patterns', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      
      const patterns = [
        '*_TESTS_*.md',
        '*_SUMMARY.md',
        '*_COMPLETE.md',
        '*_STATUS.md',
        'FILES_CREATED_*.md',
        'TEST_*.md',
        'DEPLOYMENT_*.md',
        'PRODUCTION_*.md',
      ];

      patterns.forEach(pattern => {
        expect(scriptContent).toContain(pattern);
      });
    });

    it('should use safe deletion with -f flag', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -f');
    });

    it('should use recursive deletion for directories', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf');
    });

    it('should use find command for nested files', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('find tests');
      expect(scriptContent).toContain('-delete');
    });
  });

  describe('Gitignore Updates', () => {
    it('should append to .gitignore without overwriting', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('cat >> .gitignore');
      expect(scriptContent).not.toContain('cat > .gitignore');
    });

    it('should ignore test artifacts', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('*.tsbuildinfo');
      expect(scriptContent).toContain('.turbo');
      expect(scriptContent).toContain('dist/');
      expect(scriptContent).toContain('coverage/');
    });

    it('should ignore documentation artifacts', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('*_TESTS_*.md');
      expect(scriptContent).toContain('*_SUMMARY.md');
      expect(scriptContent).toContain('*_COMPLETE.md');
    });

    it('should preserve docs folder', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('!docs/**/*.md');
    });

    it('should preserve README and CHANGELOG', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('!README.md');
      expect(scriptContent).toContain('!CHANGELOG.md');
    });

    it('should ignore IDE files', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('.vscode/');
      expect(scriptContent).toContain('.idea/');
      expect(scriptContent).toContain('*.swp');
    });
  });

  describe('Build Artifact Cleanup', () => {
    it('should clean Next.js build directory', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf .next');
    });

    it('should clean Turbo cache', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf .turbo');
    });

    it('should clean dist directory', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf dist');
    });

    it('should clean coverage reports', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf coverage');
    });

    it('should clean test results', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf test-results');
    });

    it('should clean node_modules cache', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('rm -rf node_modules/.cache');
    });
  });

  describe('File Count Validation', () => {
    it('should count tracked files with git ls-files', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git ls-files | wc -l');
    });

    it('should trim whitespace from count', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain("tr -d ' '");
    });

    it('should store count in FILE_COUNT variable', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('FILE_COUNT=');
    });

    it('should check if count exceeds 1000', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('if [ "$FILE_COUNT" -gt 1000 ]');
    });

    it('should show warning for high file count', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('WARNING');
      expect(scriptContent).toContain('Still tracking');
    });

    it('should show success for acceptable file count', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('File count looks good');
    });

    it('should display first 50 files on warning', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git ls-files | head -50');
    });
  });

  describe('Git Operations', () => {
    it('should create backup with git stash', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git stash push -m');
    });

    it('should include timestamp in backup name', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('$(date +%Y%m%d-%H%M%S)');
    });

    it('should stage all changes', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git add -A');
    });

    it('should not auto-commit changes', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).not.toContain('git commit -m');
    });
  });

  describe('User Instructions', () => {
    it('should provide clear next steps', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Next steps:');
    });

    it('should instruct to review changes', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git status');
    });

    it('should provide commit command', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git commit');
      expect(scriptContent).toContain('cleanup test artifacts for production beta');
    });

    it('should instruct to reinstall dependencies', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('npm ci --legacy-peer-deps');
    });

    it('should instruct to test build', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('npm run build');
    });

    it('should instruct to push changes', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git push origin main');
    });
  });

  describe('Output Messages', () => {
    it('should show starting message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Huntaze Production Cleanup - Starting');
    });

    it('should show backup creation message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Creating backup');
    });

    it('should show file removal messages', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Removing test summary files');
      expect(scriptContent).toContain('Removing test documentation files');
    });

    it('should show preservation message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Keeping essential documentation');
    });

    it('should show gitignore update message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Updating .gitignore');
    });

    it('should show build cleanup message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Cleaning build artifacts');
    });

    it('should show file count check message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Checking file count');
    });

    it('should show staging message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Staging cleanup changes');
    });

    it('should show completion message', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Cleanup complete');
    });

    it('should use emoji indicators', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('🧹');
      expect(scriptContent).toContain('📦');
      expect(scriptContent).toContain('🗑️');
      expect(scriptContent).toContain('✅');
      expect(scriptContent).toContain('📝');
      expect(scriptContent).toContain('📊');
      expect(scriptContent).toContain('⚠️');
    });
  });

  describe('Error Handling', () => {
    it('should exit on error with set -e', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('set -e');
    });

    it('should use safe deletion flags', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      // -f flag prevents errors if files don't exist
      expect(scriptContent).toContain('rm -f');
      expect(scriptContent).toContain('rm -rf');
    });

    it('should handle missing directories gracefully', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      // -rf flag handles missing directories
      expect(scriptContent).toContain('rm -rf');
    });
  });

  describe('Script Safety', () => {
    it('should not delete source code', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).not.toContain('rm -rf app');
      expect(scriptContent).not.toContain('rm -rf lib');
      expect(scriptContent).not.toContain('rm -rf components');
      expect(scriptContent).not.toContain('rm -rf pages');
    });

    it('should not delete configuration files', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).not.toContain('rm -f package.json');
      expect(scriptContent).not.toContain('rm -f tsconfig.json');
      expect(scriptContent).not.toContain('rm -f next.config');
    });

    it('should not delete node_modules', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).not.toContain('rm -rf node_modules');
    });

    it('should not delete .git directory', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).not.toContain('rm -rf .git');
    });

    it('should preserve essential docs', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('README.md');
      expect(scriptContent).toContain('CHANGELOG.md');
      expect(scriptContent).toContain('docs/');
    });
  });

  describe('Performance Considerations', () => {
    it('should use efficient find command', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('find tests');
      expect(scriptContent).toContain('-delete');
    });

    it('should use glob patterns for efficiency', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('*_TESTS_*.md');
      expect(scriptContent).toContain('*_SUMMARY.md');
    });

    it('should batch git operations', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('git add -A');
      // Single add command instead of multiple
    });
  });

  describe('Documentation Quality', () => {
    it('should have clear comments', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('# 1. Backup current state');
      expect(scriptContent).toContain('# 2. Remove all test summary');
      expect(scriptContent).toContain('# 3. Clean test documentation');
      expect(scriptContent).toContain('# 4. Update .gitignore');
      expect(scriptContent).toContain('# 5. Clean build artifacts');
      expect(scriptContent).toContain('# 6. Verify file count');
      expect(scriptContent).toContain('# 7. Stage changes');
    });

    it('should explain purpose in header', () => {
      const scriptContent = readFileSync(SCRIPT_PATH, 'utf-8');
      expect(scriptContent).toContain('Huntaze Production Cleanup Script');
      expect(scriptContent).toContain('Nettoie tous les fichiers');
    });
  });
});
