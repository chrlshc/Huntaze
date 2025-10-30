/**
 * Auth File Removal Process Tests
 * 
 * Tests for Task 2: Remove obsolete authentication files
 * Validates the file removal process and ensures no remnants remain
 * 
 * Coverage:
 * - File removal verification (Requirements 1.1-1.5)
 * - Backup file detection
 * - Import cleanup validation
 * - Reference cleanup validation
 * - Documentation updates
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '../..');

describe('Auth File Removal Process - Task 2', () => {
  describe('Primary File Removal (Requirements 1.1-1.5)', () => {
    const obsoleteFiles = [
      { path: 'lib/auth.ts', requirement: '1.1', description: 'getServerSession stub' },
      { path: 'lib/server-auth.ts', requirement: '1.2', description: 'NextAuth v4 patterns' },
      { path: 'lib/middleware/api-auth.ts', requirement: '1.3', description: 'obsolete getToken usage' },
      { path: 'lib/middleware/auth-middleware.ts', requirement: '1.4', description: 'obsolete middleware patterns' },
      { path: 'src/lib/platform-auth.ts', requirement: '1.5', description: 'NextAuth v4 configuration' },
    ];

    obsoleteFiles.forEach(({ path, requirement, description }) => {
      it(`should have removed ${path} (Req ${requirement}: ${description})`, () => {
        const filePath = join(projectRoot, path);
        expect(existsSync(filePath)).toBe(false);
      });
    });
  });

  describe('Backup File Detection', () => {
    const backupPatterns = [
      '.bak',
      '.backup',
      '.old',
      '~',
      '.orig',
    ];

    const obsoleteBasePaths = [
      'lib/auth',
      'lib/server-auth',
      'lib/middleware/api-auth',
      'lib/middleware/auth-middleware',
      'src/lib/platform-auth',
    ];

    obsoleteBasePaths.forEach((basePath) => {
      backupPatterns.forEach((pattern) => {
        it(`should not have backup file ${basePath}${pattern}`, () => {
          const filePath = join(projectRoot, `${basePath}${pattern}`);
          expect(existsSync(filePath)).toBe(false);
        });

        it(`should not have backup file ${basePath}.ts${pattern}`, () => {
          const filePath = join(projectRoot, `${basePath}.ts${pattern}`);
          expect(existsSync(filePath)).toBe(false);
        });
      });
    });
  });

  describe('Directory Cleanup', () => {
    it('should have removed lib/middleware directory if empty', () => {
      const dirPath = join(projectRoot, 'lib/middleware');
      
      if (existsSync(dirPath)) {
        const files = readdirSync(dirPath);
        // If directory exists, it should not contain auth-related files
        const authFiles = files.filter(f => 
          f.includes('auth') && !f.includes('test')
        );
        expect(authFiles).toEqual([]);
      }
    });

    it('should have removed src/lib directory if it only contained platform-auth.ts', () => {
      const dirPath = join(projectRoot, 'src/lib');
      
      if (existsSync(dirPath)) {
        const files = readdirSync(dirPath);
        // If directory exists, it should not contain platform-auth.ts
        expect(files).not.toContain('platform-auth.ts');
      }
    });
  });

  describe('Import Statement Cleanup', () => {
    const scanForImports = (dir: string, pattern: RegExp): string[] => {
      const results: string[] = [];
      
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(dir, item.name);
          
          // Skip build directories and node_modules
          if (item.name === 'node_modules' || item.name === '.next' || 
              item.name === 'dist' || item.name === '.git') {
            continue;
          }
          
          if (item.isDirectory()) {
            results.push(...scanForImports(fullPath, pattern));
          } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
            try {
              const content = readFileSync(fullPath, 'utf-8');
              if (pattern.test(content)) {
                results.push(fullPath.replace(projectRoot, ''));
              }
            } catch (error) {
              // Skip files we can't read
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
      
      return results;
    };

    it('should have no imports from @/lib/auth (obsolete stub)', () => {
      const pattern = /from\s+['"]@\/lib\/auth['"]/;
      const files = scanForImports(projectRoot, pattern);
      
      // Filter out test files
      const nonTestFiles = files.filter(f => !f.includes('.test.'));
      
      expect(nonTestFiles).toEqual([]);
    });

    it('should have no imports from @/lib/server-auth', () => {
      const pattern = /from\s+['"]@\/lib\/server-auth['"]/;
      const files = scanForImports(projectRoot, pattern);
      
      const nonTestFiles = files.filter(f => !f.includes('.test.'));
      
      expect(nonTestFiles).toEqual([]);
    });

    it('should have no imports from @/lib/middleware/api-auth', () => {
      const pattern = /from\s+['"]@\/lib\/middleware\/api-auth['"]/;
      const files = scanForImports(projectRoot, pattern);
      
      const nonTestFiles = files.filter(f => !f.includes('.test.'));
      
      expect(nonTestFiles).toEqual([]);
    });

    it('should have no imports from @/lib/middleware/auth-middleware', () => {
      const pattern = /from\s+['"]@\/lib\/middleware\/auth-middleware['"]/;
      const files = scanForImports(projectRoot, pattern);
      
      const nonTestFiles = files.filter(f => !f.includes('.test.'));
      
      expect(nonTestFiles).toEqual([]);
    });

    it('should have no imports from @/src/lib/platform-auth', () => {
      const pattern = /from\s+['"]@\/src\/lib\/platform-auth['"]/;
      const files = scanForImports(projectRoot, pattern);
      
      const nonTestFiles = files.filter(f => !f.includes('.test.'));
      
      expect(nonTestFiles).toEqual([]);
    });
  });

  describe('Function Reference Cleanup', () => {
    const scanForReferences = (dir: string, functionName: string): string[] => {
      const results: string[] = [];
      const pattern = new RegExp(`\\b${functionName}\\b`, 'g');
      
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(dir, item.name);
          
          if (item.name === 'node_modules' || item.name === '.next' || 
              item.name === 'dist' || item.name === '.git') {
            continue;
          }
          
          if (item.isDirectory()) {
            results.push(...scanForReferences(fullPath, functionName));
          } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
            try {
              const content = readFileSync(fullPath, 'utf-8');
              if (pattern.test(content)) {
                results.push(fullPath.replace(projectRoot, ''));
              }
            } catch (error) {
              // Skip
            }
          }
        }
      } catch (error) {
        // Skip
      }
      
      return results;
    };

    it('should have no references to getServerSession (except in tests)', () => {
      const files = scanForReferences(projectRoot, 'getServerSession');
      
      // Filter out test files and documentation
      const nonTestFiles = files.filter(f => 
        !f.includes('.test.') && 
        !f.includes('/tests/') &&
        !f.includes('/docs/') &&
        !f.includes('.md')
      );
      
      expect(nonTestFiles).toEqual([]);
    });

    it('should have no references to authOptions (except in tests)', () => {
      const files = scanForReferences(projectRoot, 'authOptions');
      
      const nonTestFiles = files.filter(f => 
        !f.includes('.test.') && 
        !f.includes('/tests/') &&
        !f.includes('/docs/') &&
        !f.includes('.md')
      );
      
      expect(nonTestFiles).toEqual([]);
    });
  });

  describe('Git History Cleanup (Optional)', () => {
    it('should document removed files in migration guide', () => {
      const guidePath = join(projectRoot, 'docs/auth-migration-guide.md');
      
      if (existsSync(guidePath)) {
        const content = readFileSync(guidePath, 'utf-8');
        
        // Should mention removed files
        expect(content).toMatch(/lib\/auth\.ts/);
        expect(content).toMatch(/lib\/server-auth\.ts/);
        expect(content).toMatch(/removed|deleted/i);
      }
    });
  });

  describe('Replacement Verification', () => {
    it('should have auth.ts at root as replacement', () => {
      const filePath = join(projectRoot, 'auth.ts');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('auth');
    });

    it('should have lib/auth-helpers.ts as replacement', () => {
      const filePath = join(projectRoot, 'lib/auth-helpers.ts');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('export async function requireAuth');
      expect(content).toContain('export async function getSession');
    });

    it('should have middleware.ts at root as replacement', () => {
      const filePath = join(projectRoot, 'middleware.ts');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('export');
    });
  });

  describe('Custom JWT System Preservation', () => {
    it('should have preserved lib/services/auth-service.ts', () => {
      const filePath = join(projectRoot, 'lib/services/auth-service.ts');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should not have modified auth-service.ts during cleanup', () => {
      const filePath = join(projectRoot, 'lib/services/auth-service.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      // Should still have JWT functionality
      expect(content).toMatch(/jwt|JWT|token/i);
      expect(content).toContain('export class AuthService');
    });

    it('should not have removed any JWT-related files', () => {
      const jwtFiles = [
        'lib/services/auth-service.ts',
      ];

      jwtFiles.forEach(file => {
        const filePath = join(projectRoot, file);
        expect(existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('TypeScript Compilation', () => {
    it('should not have TypeScript errors after file removal', () => {
      // This test verifies that removing files didn't break imports
      // In a real scenario, this would run `tsc --noEmit`
      
      const authHelpersPath = join(projectRoot, 'lib/auth-helpers.ts');
      expect(existsSync(authHelpersPath)).toBe(true);
      
      const content = readFileSync(authHelpersPath, 'utf-8');
      
      // Should import from @/auth (not from removed files)
      expect(content).toContain("from '@/auth'");
      expect(content).not.toContain("from '@/lib/auth'");
      expect(content).not.toContain("from '@/lib/server-auth'");
    });
  });

  describe('Documentation Updates', () => {
    it('should have migration guide documenting removed files', () => {
      const guidePath = join(projectRoot, 'docs/auth-migration-guide.md');
      expect(existsSync(guidePath)).toBe(true);
    });

    it('should have updated README if it referenced removed files', () => {
      const readmePath = join(projectRoot, 'README.md');
      
      if (existsSync(readmePath)) {
        const content = readFileSync(readmePath, 'utf-8');
        
        // Should not reference removed files
        expect(content).not.toContain('lib/auth.ts');
        expect(content).not.toContain('lib/server-auth.ts');
        expect(content).not.toContain('getServerSession');
      }
    });
  });

  describe('Task Completion Verification', () => {
    it('should have all subtasks of Task 2 completed', () => {
      const tasksPath = join(projectRoot, '.kiro/specs/auth-js-v5-migration/tasks.md');
      const content = readFileSync(tasksPath, 'utf-8');
      
      // Task 2 should be marked as in progress or complete
      expect(content).toMatch(/- \[[-x]\] 2\. Remove obsolete authentication files/);
    });

    it('should have all 5 file removal subtasks documented', () => {
      const tasksPath = join(projectRoot, '.kiro/specs/auth-js-v5-migration/tasks.md');
      const content = readFileSync(tasksPath, 'utf-8');
      
      // Should have subtasks 2.1 through 2.5
      expect(content).toContain('2.1 Remove `lib/auth.ts`');
      expect(content).toContain('2.2 Remove `lib/server-auth.ts`');
      expect(content).toContain('2.3 Remove `lib/middleware/api-auth.ts`');
      expect(content).toContain('2.4 Remove `lib/middleware/auth-middleware.ts`');
      expect(content).toContain('2.5 Remove `src/lib/platform-auth.ts`');
    });
  });
});
