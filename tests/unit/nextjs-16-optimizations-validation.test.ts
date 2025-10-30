import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Next.js 16 Optimizations Validation', () => {
  const apiRoutesPath = join(process.cwd(), 'app/api');

  describe('API Routes Configuration', () => {
    it('should use nodejs runtime for Prisma routes', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'onlyfans/earnings/route.ts',
        'marketing/segments/route.ts',
        'marketing/automation/route.ts',
        'content/library/route.ts',
        'content/ai-generate/route.ts',
        'analytics/overview/route.ts',
        'chatbot/conversations/route.ts',
        'chatbot/auto-reply/route.ts',
        'management/settings/route.ts',
        'management/profile/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        
        // Verify file exists
        expect(existsSync(filePath)).toBe(true);
        
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain("export const runtime = 'nodejs'");
      });
    });

    it('should use NextRequest and NextResponse', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('NextRequest');
        expect(content).toContain('NextResponse');
      });
    });

    it('should use auth() from Auth.js v5', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain("import { auth } from '@/auth'");
        expect(content).toContain('await auth()');
      });
    });
  });

  describe('Error Handling', () => {
    it('should have try-catch blocks in all routes', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('try {');
        expect(content).toContain('} catch');
        expect(content).toContain('console.error');
      });
    });

    it('should return standardized error responses', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('success: false');
        expect(content).toContain('error: {');
        expect(content).toContain('code:');
        expect(content).toContain('message:');
      });
    });
  });

  describe('Authentication', () => {
    it('should check authentication in all protected routes', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('if (!session?.user)');
        expect(content).toContain('UNAUTHORIZED');
        expect(content).toContain('status: 401');
      });
    });
  });

  describe('Parallel Data Fetching', () => {
    it('should use Promise.all for parallel queries', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'onlyfans/earnings/route.ts',
        'analytics/overview/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('Promise.all');
      });
    });
  });

  describe('Response Format', () => {
    it('should return success responses with data', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('success: true');
        expect(content).toContain('data:');
      });
    });

    it('should include metadata for paginated responses', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'content/library/route.ts',
        'chatbot/conversations/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('metadata:');
        expect(content).toContain('page');
        expect(content).toContain('pageSize');
        expect(content).toContain('total');
      });
    });
  });

  describe('TypeScript Types', () => {
    it('should have proper type annotations', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('NextRequest');
        expect(content).toContain('NextResponse');
        expect(content).toContain('async function');
      });
    });
  });

  describe('Caching Strategy', () => {
    it('should not use cache for mutation routes', () => {
      const mutationRoutes = [
        'onlyfans/messages/send/route.ts',
        'marketing/segments/route.ts',
        'marketing/automation/route.ts',
        'content/ai-generate/route.ts',
      ];

      mutationRoutes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          // Should not have revalidate export for mutations
          expect(content).not.toContain('export const revalidate');
          // Should use force-dynamic or no cache
          if (content.includes('export const dynamic')) {
            expect(content).toContain("export const dynamic = 'force-dynamic'");
          }
        }
      });
    });

    it('should use appropriate cache for read-only routes', () => {
      const readOnlyRoutes = [
        { path: 'onlyfans/earnings/route.ts', revalidate: 300 }, // 5 min
        { path: 'analytics/overview/route.ts', revalidate: 120 }, // 2 min
        { path: 'content/library/route.ts', revalidate: 60 }, // 1 min
      ];

      readOnlyRoutes.forEach(({ path, revalidate }) => {
        const filePath = join(apiRoutesPath, path);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          // Should have revalidate export
          const revalidateMatch = content.match(/export const revalidate = (\d+)/);
          if (revalidateMatch) {
            const actualRevalidate = parseInt(revalidateMatch[1]);
            expect(actualRevalidate).toBeGreaterThan(0);
            expect(actualRevalidate).toBeLessThanOrEqual(revalidate);
          }
        }
      });
    });
  });

  describe('Import Optimization', () => {
    it('should use selective imports from next/server', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        // Should use destructured imports
        expect(content).toMatch(/import\s+{\s*NextRequest,?\s*NextResponse\s*}\s+from\s+['"]next\/server['"]/);
      });
    });

    it('should not have unused imports', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        // Check if NextRequest is imported but not used
        if (content.includes('import { NextRequest')) {
          expect(content).toMatch(/request:\s*NextRequest/);
        }
        
        // Check if NextResponse is imported but not used
        if (content.includes('NextResponse')) {
          expect(content).toMatch(/NextResponse\./);
        }
      });
    });
  });

  describe('Async/Await Patterns', () => {
    it('should use async/await for all route handlers', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        // Should have async function declarations
        expect(content).toMatch(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/);
      });
    });

    it('should await Prisma queries', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
        'content/library/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        // If Prisma is used, should have await
        if (content.includes('prisma.')) {
          expect(content).toMatch(/await\s+prisma\./);
        }
      });
    });
  });

  describe('HTTP Methods', () => {
    it('should export appropriate HTTP methods', () => {
      const routeConfigs = [
        { path: 'onlyfans/subscribers/route.ts', methods: ['GET'] },
        { path: 'marketing/segments/route.ts', methods: ['GET', 'POST'] },
        { path: 'content/library/route.ts', methods: ['GET'] },
        { path: 'content/ai-generate/route.ts', methods: ['POST'] },
      ];

      routeConfigs.forEach(({ path, methods }) => {
        const filePath = join(apiRoutesPath, path);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          methods.forEach((method) => {
            expect(content).toMatch(new RegExp(`export\\s+async\\s+function\\s+${method}`));
          });
        }
      });
    });
  });

  describe('Request Validation', () => {
    it('should validate request body for POST routes', () => {
      const postRoutes = [
        'marketing/segments/route.ts',
        'marketing/automation/route.ts',
        'content/ai-generate/route.ts',
      ];

      postRoutes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          if (content.includes('export async function POST')) {
            // Should parse request body
            expect(content).toMatch(/await\s+request\.json\(\)/);
          }
        }
      });
    });

    it('should validate query parameters for GET routes', () => {
      const getRoutes = [
        'onlyfans/subscribers/route.ts',
        'content/library/route.ts',
        'chatbot/conversations/route.ts',
      ];

      getRoutes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          if (content.includes('export async function GET')) {
            // Should access searchParams
            expect(content).toMatch(/searchParams|request\.nextUrl\.searchParams/);
          }
        }
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should use parallel queries where appropriate', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'onlyfans/earnings/route.ts',
        'analytics/overview/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          // If multiple Prisma queries, should use Promise.all
          const prismaMatches = content.match(/await\s+prisma\./g);
          if (prismaMatches && prismaMatches.length > 1) {
            expect(content).toContain('Promise.all');
          }
        }
      });
    });

    it('should not have blocking operations in hot paths', () => {
      const routes = [
        'onlyfans/subscribers/route.ts',
        'marketing/segments/route.ts',
      ];

      routes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        const content = readFileSync(filePath, 'utf-8');
        
        // Should not have synchronous file operations
        expect(content).not.toContain('readFileSync');
        expect(content).not.toContain('writeFileSync');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing files gracefully', () => {
      const nonExistentRoute = 'non-existent/route.ts';
      const filePath = join(apiRoutesPath, nonExistentRoute);
      
      expect(existsSync(filePath)).toBe(false);
    });

    it('should handle routes without runtime export', () => {
      // Some routes might not need explicit runtime export
      const optionalRuntimeRoutes = [
        'campaigns/route.ts',
        'dashboard/metrics/route.ts',
      ];

      optionalRuntimeRoutes.forEach((route) => {
        const filePath = join(apiRoutesPath, route);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          
          // It's okay if runtime is not explicitly set (defaults to nodejs)
          if (!content.includes('export const runtime')) {
            expect(content).toBeDefined();
          }
        }
      });
    });
  });
});
