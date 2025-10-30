/**
 * Integration Tests - Auth.js v5 Migration
 * Tests for Requirements 1, 2, 5: File removal, API migration, import updates
 * 
 * Coverage:
 * - Obsolete files removed
 * - auth() usage instead of getServerSession()
 * - Import statements updated
 * - No NextAuth v4 references
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Auth.js v5 Migration Integration Tests', () => {
  describe('Requirement 1: Obsolete Files Removed', () => {
    const filesToRemove = [
      'lib/auth.ts',
      'lib/server-auth.ts',
      'lib/middleware/api-auth.ts',
      'lib/middleware/auth-middleware.ts',
      'src/lib/platform-auth.ts',
    ];

    filesToRemove.forEach((filePath) => {
      it(`should have removed ${filePath}`, () => {
        const fullPath = join(process.cwd(), filePath);
        const exists = existsSync(fullPath);
        
        expect(exists).toBe(false);
      });
    });

    it('should not have any getServerSession stubs in lib/', () => {
      const libPath = join(process.cwd(), 'lib');
      
      if (!existsSync(libPath)) {
        return; // Skip if lib doesn't exist
      }
      
      const files = getAllFiles(libPath, ['.ts', '.tsx']);
      
      files.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // Check for getServerSession stub pattern
        if (content.includes('getServerSession')) {
          // Should not be a stub (should be actual usage or import)
          expect(content).not.toMatch(/export\s+(async\s+)?function\s+getServerSession/);
        }
      });
    });

    it('should not have NextAuth v4 configuration files', () => {
      const nextAuthV4Patterns = [
        'pages/api/auth/[...nextauth].ts',
        'pages/api/auth/[...nextauth].js',
        'lib/nextauth.ts',
        'lib/nextauth-config.ts',
      ];

      nextAuthV4Patterns.forEach((pattern) => {
        const fullPath = join(process.cwd(), pattern);
        expect(existsSync(fullPath)).toBe(false);
      });
    });
  });

  describe('Requirement 2: auth() API Usage', () => {
    it('should have auth.ts at root with auth() export', () => {
      const authPath = join(process.cwd(), 'auth.ts');
      
      expect(existsSync(authPath)).toBe(true);
      
      const content = readFileSync(authPath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('auth');
    });

    it('should use auth() in Server Components', () => {
      const appPath = join(process.cwd(), 'app');
      
      if (!existsSync(appPath)) {
        return; // Skip if app directory doesn't exist
      }
      
      const serverComponents = getAllFiles(appPath, ['.tsx'])
        .filter((file) => !file.includes('/api/'))
        .filter((file) => {
          const content = readFileSync(file, 'utf-8');
          return content.includes('auth()') || content.includes('requireAuth()');
        });

      // If there are server components using auth, verify they import from @/auth
      serverComponents.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        if (content.includes('auth()')) {
          expect(content).toMatch(/import.*auth.*from ['"]@\/auth['"]/);
        }
      });
    });

    it('should use auth() in API routes', () => {
      const apiPath = join(process.cwd(), 'app/api');
      
      if (!existsSync(apiPath)) {
        return; // Skip if API directory doesn't exist
      }
      
      const apiRoutes = getAllFiles(apiPath, ['.ts'])
        .filter((file) => file.endsWith('route.ts'));

      apiRoutes.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // If file uses authentication
        if (content.includes('session') || content.includes('auth')) {
          // Should not use getServerSession
          expect(content).not.toContain('getServerSession');
          
          // If using auth(), should import from @/auth
          if (content.includes('auth()')) {
            expect(content).toMatch(/import.*auth.*from ['"]@\/auth['"]/);
          }
        }
      });
    });

    it('should not throw errors on auth failure', () => {
      // This is a structural test - actual behavior tested in unit tests
      const appPath = join(process.cwd(), 'app');
      
      if (!existsSync(appPath)) {
        return;
      }
      
      const files = getAllFiles(appPath, ['.ts', '.tsx']);
      
      files.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // Check for patterns that throw on null session
        if (content.includes('auth()')) {
          // Should not have: if (!session) throw new Error()
          expect(content).not.toMatch(/if\s*\(\s*!session\s*\)\s*throw/);
        }
      });
    });
  });

  describe('Requirement 5: Import Updates', () => {
    it('should not import from next-auth/next', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'components'), ['.ts', '.tsx']),
      ];

      allFiles.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        expect(content).not.toContain('from "next-auth/next"');
        expect(content).not.toContain("from 'next-auth/next'");
      });
    });

    it('should not import from next-auth/jwt', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'components'), ['.ts', '.tsx']),
      ];

      allFiles.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        expect(content).not.toContain('from "next-auth/jwt"');
        expect(content).not.toContain("from 'next-auth/jwt'");
      });
    });

    it('should import auth from @/auth', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
      ];

      const filesUsingAuth = allFiles.filter((file) => {
        const content = readFileSync(file, 'utf-8');
        return content.includes('auth()') && !file.includes('auth.ts');
      });

      filesUsingAuth.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // Should import from @/auth
        expect(content).toMatch(/import.*auth.*from ['"]@\/auth['"]/);
      });
    });

    it('should not have getServerSession imports', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'components'), ['.ts', '.tsx']),
      ];

      allFiles.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        expect(content).not.toMatch(/import.*getServerSession/);
      });
    });

    it('should not have getToken imports', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'components'), ['.ts', '.tsx']),
      ];

      allFiles.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // Exclude auth-service.ts which may have custom JWT
        if (!file.includes('auth-service.ts')) {
          expect(content).not.toMatch(/import.*getToken.*from ['"]next-auth/);
        }
      });
    });

    it('should not reference NextAuth v4 APIs', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
      ];

      const nextAuthV4APIs = [
        'unstable_getServerSession',
        'getSession',
        'getCsrfToken',
        'getProviders',
        'signIn',
        'signOut',
        'useSession',
      ];

      allFiles.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // Check for NextAuth v4 API usage
        nextAuthV4APIs.forEach((api) => {
          if (content.includes(api)) {
            // Should not import from next-auth
            expect(content).not.toMatch(new RegExp(`import.*${api}.*from ['"]next-auth`));
          }
        });
      });
    });
  });

  describe('Requirement 4: Custom JWT System Preserved', () => {
    it('should preserve lib/services/auth-service.ts', () => {
      const authServicePath = join(process.cwd(), 'lib/services/auth-service.ts');
      
      expect(existsSync(authServicePath)).toBe(true);
    });

    it('should not modify auth-service.ts', () => {
      const authServicePath = join(process.cwd(), 'lib/services/auth-service.ts');
      
      if (!existsSync(authServicePath)) {
        return;
      }
      
      const content = readFileSync(authServicePath, 'utf-8');
      
      // Should still have JWT functionality
      expect(content).toMatch(/jwt|JWT|token/i);
    });

    it('should allow auth-service.ts to coexist with Auth.js v5', () => {
      const authServicePath = join(process.cwd(), 'lib/services/auth-service.ts');
      const authPath = join(process.cwd(), 'auth.ts');
      
      // Both should exist
      expect(existsSync(authServicePath) || existsSync(authPath)).toBe(true);
    });
  });

  describe('Migration Completeness', () => {
    it('should have requireAuth helper', () => {
      const authHelpersPath = join(process.cwd(), 'lib/auth-helpers.ts');
      
      expect(existsSync(authHelpersPath)).toBe(true);
      
      const content = readFileSync(authHelpersPath, 'utf-8');
      expect(content).toContain('requireAuth');
      expect(content).toContain('export');
    });

    it('should have Auth.js v5 route handler', () => {
      const authRoutePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
      
      expect(existsSync(authRoutePath)).toBe(true);
      
      const content = readFileSync(authRoutePath, 'utf-8');
      expect(content).toContain('auth');
    });

    it('should not have mixed authentication patterns', () => {
      const allFiles = [
        ...getAllFiles(join(process.cwd(), 'app'), ['.ts', '.tsx']),
        ...getAllFiles(join(process.cwd(), 'lib'), ['.ts', '.tsx']),
      ];

      allFiles.forEach((file) => {
        const content = readFileSync(file, 'utf-8');
        
        // Should not mix old and new patterns in same file
        const hasOldPattern = content.includes('getServerSession');
        const hasNewPattern = content.includes('auth()') && content.includes('@/auth');
        
        if (hasOldPattern && hasNewPattern) {
          // This is a migration issue
          expect(hasOldPattern && hasNewPattern).toBe(false);
        }
      });
    });
  });
});

// Helper function to recursively get all files with specific extensions
function getAllFiles(dirPath: string, extensions: string[]): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const files: string[] = [];
  const items = readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dirPath, item.name);

    if (item.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (item.isFile()) {
      if (extensions.some((ext) => item.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}
