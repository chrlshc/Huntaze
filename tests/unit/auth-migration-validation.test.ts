/**
 * Migration Validation Tests
 * 
 * Validates that the Auth.js v5 migration was completed successfully
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync, readdirSync } from 'fs';

const projectRoot = join(__dirname, '../..');

describe('Auth.js v5 Migration Validation', () => {
  describe('Obsolete Files Removed', () => {
    it('should have removed lib/auth.ts', () => {
      // Requirement 1.1
      const filePath = join(projectRoot, 'lib/auth.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should have removed lib/server-auth.ts', () => {
      // Requirement 1.2
      const filePath = join(projectRoot, 'lib/server-auth.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should have removed lib/middleware/api-auth.ts', () => {
      // Requirement 1.3
      const filePath = join(projectRoot, 'lib/middleware/api-auth.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should have removed lib/middleware/auth-middleware.ts', () => {
      // Requirement 1.4
      const filePath = join(projectRoot, 'lib/middleware/auth-middleware.ts');
      expect(existsSync(filePath)).toBe(false);
    });

    it('should have removed src/lib/platform-auth.ts', () => {
      // Requirement 1.5
      const filePath = join(projectRoot, 'src/lib/platform-auth.ts');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('No Obsolete Imports', () => {
    const scanDirectory = (dir: string, extensions: string[]): string[] => {
      const files: string[] = [];
      
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(dir, item.name);
          
          // Skip node_modules, .next, and other build directories
          if (item.name === 'node_modules' || item.name === '.next' || 
              item.name === 'dist' || item.name === 'build' ||
              item.name === '.git') {
            continue;
          }
          
          if (item.isDirectory()) {
            files.push(...scanDirectory(fullPath, extensions));
          } else if (extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
      
      return files;
    };

    const searchInFiles = (files: string[], pattern: RegExp): { file: string; matches: string[] }[] => {
      const results: { file: string; matches: string[] }[] = [];
      
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8');
          const matches = content.match(pattern);
          
          if (matches && matches.length > 0) {
            results.push({
              file: file.replace(projectRoot, ''),
              matches: matches
            });
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
      
      return results;
    };

    it('should have no imports from next-auth/next', () => {
      // Requirement 5.1
      const files = scanDirectory(projectRoot, ['.ts', '.tsx', '.js', '.jsx']);
      const pattern = /from\s+['"]next-auth\/next['"]/g;
      const results = searchInFiles(files, pattern);
      
      expect(results).toEqual([]);
    });

    it('should have no imports from next-auth/jwt', () => {
      // Requirement 5.2
      const files = scanDirectory(projectRoot, ['.ts', '.tsx', '.js', '.jsx']);
      const pattern = /from\s+['"]next-auth\/jwt['"]/g;
      const results = searchInFiles(files, pattern);
      
      expect(results).toEqual([]);
    });

    it('should have no usage of getServerSession', () => {
      // Requirement 5.3
      const files = scanDirectory(projectRoot, ['.ts', '.tsx', '.js', '.jsx']);
      const pattern = /\bgetServerSession\b/g;
      const results = searchInFiles(files, pattern);
      
      // Filter out this test file itself
      const filteredResults = results.filter(r => 
        !r.file.includes('auth-migration-validation.test.ts')
      );
      
      expect(filteredResults).toEqual([]);
    });

    it('should have no usage of getToken from next-auth/jwt', () => {
      // Requirement 5.4
      const files = scanDirectory(projectRoot, ['.ts', '.tsx', '.js', '.jsx']);
      
      // Look for getToken usage in context of next-auth
      const results: { file: string; matches: string[] }[] = [];
      
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Check if file imports getToken from next-auth/jwt
          if (content.includes('next-auth/jwt') && content.includes('getToken')) {
            results.push({
              file: file.replace(projectRoot, ''),
              matches: ['getToken with next-auth/jwt']
            });
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
      
      expect(results).toEqual([]);
    });

    it('should have no references to authOptions', () => {
      // Requirement 5.5
      const files = scanDirectory(projectRoot, ['.ts', '.tsx', '.js', '.jsx']);
      const pattern = /\bauthOptions\b/g;
      const results = searchInFiles(files, pattern);
      
      // Filter out this test file itself
      const filteredResults = results.filter(r => 
        !r.file.includes('auth-migration-validation.test.ts')
      );
      
      expect(filteredResults).toEqual([]);
    });
  });

  describe('New Files Exist', () => {
    it('should have auth.ts at project root', () => {
      const filePath = join(projectRoot, 'auth.ts');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have lib/auth-helpers.ts', () => {
      const filePath = join(projectRoot, 'lib/auth-helpers.ts');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have middleware.ts at project root', () => {
      const filePath = join(projectRoot, 'middleware.ts');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have migration documentation', () => {
      const filePath = join(projectRoot, 'docs/auth-migration-guide.md');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('Auth Helpers Exports', () => {
    it('should export getSession from auth-helpers', () => {
      const filePath = join(projectRoot, 'lib/auth-helpers.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('export async function getSession()');
    });

    it('should export requireAuth from auth-helpers', () => {
      const filePath = join(projectRoot, 'lib/auth-helpers.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('export async function requireAuth()');
    });

    it('should export getCurrentUser from auth-helpers', () => {
      const filePath = join(projectRoot, 'lib/auth-helpers.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('export async function getCurrentUser()');
    });

    it('should export requireUser from auth-helpers', () => {
      const filePath = join(projectRoot, 'lib/auth-helpers.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('export async function requireUser()');
    });
  });

  describe('Custom JWT System Preserved', () => {
    it('should have preserved lib/services/auth-service.ts', () => {
      // Requirement 4.1
      const filePath = join(projectRoot, 'lib/services/auth-service.ts');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have AuthService class in auth-service.ts', () => {
      const filePath = join(projectRoot, 'lib/services/auth-service.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('export class AuthService');
    });
  });
});
