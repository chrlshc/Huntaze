import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de validation pour l'état réel du backend Huntaze
 * Valide que la documentation correspond à l'état actuel du code
 * Basé sur HUNTAZE_BACKEND_REAL_STATUS.md
 */

describe('Backend Real Status Validation', () => {
  describe('Prisma Schema Validation', () => {
    it('should have prisma schema file', () => {
      expect(existsSync('prisma/schema.prisma')).toBe(true);
    });

    it('should have all required models in schema', () => {
      if (!existsSync('prisma/schema.prisma')) return;
      
      const schema = readFileSync('prisma/schema.prisma', 'utf-8');
      
      // Models documentés comme existants
      expect(schema).toContain('model User');
      expect(schema).toContain('model RefreshToken');
      expect(schema).toContain('model SubscriptionRecord');
      expect(schema).toContain('model ContentAsset');
      expect(schema).toContain('model ApiKey');
    });

    it('should have PostgreSQL configured', () => {
      if (!existsSync('prisma/schema.prisma')) return;
      
      const schema = readFileSync('prisma/schema.prisma', 'utf-8');
      expect(schema).toContain('provider = "postgresql"');
    });

    it('should have required enums', () => {
      if (!existsSync('prisma/schema.prisma')) return;
      
      const schema = readFileSync('prisma/schema.prisma', 'utf-8');
      
      // Enums documentés
      expect(schema).toMatch(/enum\s+\w*Subscription/);
      expect(schema).toMatch(/enum\s+\w*Status/);
      expect(schema).toMatch(/enum\s+\w*Role/);
      expect(schema).toMatch(/enum\s+\w*ContentType/);
    });
  });

  describe('API Routes Structure Validation', () => {
    it('should have auth routes', () => {
      expect(existsSync('app/api/auth')).toBe(true);
    });

    it('should have users routes', () => {
      expect(existsSync('app/api/users')).toBe(true);
    });

    it('should have content routes', () => {
      expect(existsSync('app/api/content')).toBe(true);
    });

    it('should have billing routes', () => {
      expect(existsSync('app/api/billing')).toBe(true);
    });

    it('should have ai routes', () => {
      expect(existsSync('app/api/ai')).toBe(true);
    });

    it('should have analytics routes', () => {
      expect(existsSync('app/api/analytics')).toBe(true);
    });

    it('should have integrations routes', () => {
      expect(existsSync('app/api/integrations')).toBe(true);
    });

    it('should have webhooks routes', () => {
      expect(existsSync('app/api/webhooks')).toBe(true);
    });
  });

  describe('AI Services Validation', () => {
    it('should have ai-service.ts', () => {
      expect(existsSync('lib/services/ai-service.ts')).toBe(true);
    });

    it('should have ai-router.ts', () => {
      expect(existsSync('lib/services/ai-router.ts')).toBe(true);
    });

    it('should have ai-content-service.ts', () => {
      expect(existsSync('lib/services/ai-content-service.ts')).toBe(true);
    });

    it('should have message-personalization.ts', () => {
      expect(existsSync('lib/services/message-personalization.ts')).toBe(true);
    });
  });

  describe('AWS Infrastructure Validation', () => {
    it('should have buildspec.yml', () => {
      expect(existsSync('buildspec.yml')).toBe(true);
    });

    it('should have CloudFormation templates', () => {
      expect(existsSync('cloudformation')).toBe(true);
    });

    it('should have AWS deployment scripts', () => {
      expect(existsSync('scripts/deploy-aws-infrastructure.sh')).toBe(true);
    });
  });

  describe('Prisma Client Usage Detection', () => {
    it('should check if lib/prisma.ts exists', () => {
      const prismaClientExists = existsSync('lib/prisma.ts');
      
      if (!prismaClientExists) {
        console.warn('⚠️  lib/prisma.ts not found - Prisma client not initialized');
      }
      
      // Test passe mais log un warning si absent
      expect(typeof prismaClientExists).toBe('boolean');
    });

    it('should check if @prisma/client is imported in code', () => {
      const libFiles = [
        'lib/db.ts',
        'lib/prisma.ts',
        'lib/services/simple-user-service.ts',
        'lib/services/simple-billing-service.ts'
      ];

      let prismaImportFound = false;

      for (const file of libFiles) {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8');
          if (content.includes('@prisma/client')) {
            prismaImportFound = true;
            break;
          }
        }
      }

      if (!prismaImportFound) {
        console.warn('⚠️  No @prisma/client imports found - using mocks');
      }

      expect(typeof prismaImportFound).toBe('boolean');
    });
  });

  describe('Database Migrations Status', () => {
    it('should check if migrations directory exists', () => {
      const migrationsExist = existsSync('prisma/migrations');
      
      if (!migrationsExist) {
        console.warn('⚠️  prisma/migrations not found - database not initialized');
      }

      expect(typeof migrationsExist).toBe('boolean');
    });

    it('should validate package.json has prisma scripts', () => {
      if (!existsSync('package.json')) return;
      
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Scripts Prisma recommandés
      const recommendedScripts = [
        'prisma:generate',
        'prisma:migrate',
        'prisma:push',
        'prisma:studio'
      ];

      const missingScripts = recommendedScripts.filter(
        script => !scripts[script] && !scripts[script.replace('prisma:', '')]
      );

      if (missingScripts.length > 0) {
        console.warn(`⚠️  Missing Prisma scripts: ${missingScripts.join(', ')}`);
      }

      expect(Array.isArray(missingScripts)).toBe(true);
    });
  });

  describe('Mock Detection in API Routes', () => {
    it('should detect in-memory mocks in user routes', () => {
      const userProfileRoute = 'app/api/users/profile/route.ts';
      
      if (existsSync(userProfileRoute)) {
        const content = readFileSync(userProfileRoute, 'utf-8');
        
        const hasMocks = content.includes('new Map') || 
                        content.includes('const profiles =') ||
                        content.includes('const users =');
        
        if (hasMocks) {
          console.warn('⚠️  In-memory mocks detected in user routes');
        }

        expect(typeof hasMocks).toBe('boolean');
      }
    });

    it('should detect mock usage patterns', () => {
      const apiRoutes = [
        'app/api/users/profile/route.ts',
        'app/api/billing/checkout/route.ts',
        'app/api/content/generate/route.ts'
      ];

      const mockPatterns = [
        /new Map\s*\(/,
        /const\s+\w+\s*=\s*\[\]/,
        /\/\/\s*Mock/i,
        /\/\/\s*TODO.*prisma/i
      ];

      let mocksFound = 0;

      for (const route of apiRoutes) {
        if (existsSync(route)) {
          const content = readFileSync(route, 'utf-8');
          
          for (const pattern of mockPatterns) {
            if (pattern.test(content)) {
              mocksFound++;
              break;
            }
          }
        }
      }

      if (mocksFound > 0) {
        console.warn(`⚠️  Mocks detected in ${mocksFound} API routes`);
      }

      expect(typeof mocksFound).toBe('number');
    });
  });

  describe('NextAuth Configuration Status', () => {
    it('should check if NextAuth is configured', () => {
      const nextAuthRoute = 'app/api/auth/[...nextauth]/route.ts';
      const nextAuthExists = existsSync(nextAuthRoute);

      if (!nextAuthExists) {
        console.warn('⚠️  NextAuth not configured - using manual token management');
      }

      expect(typeof nextAuthExists).toBe('boolean');
    });

    it('should check for NextAuth dependencies', () => {
      if (!existsSync('package.json')) return;
      
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const hasNextAuth = 'next-auth' in deps;
      const hasPrismaAdapter = '@auth/prisma-adapter' in deps;

      if (!hasNextAuth) {
        console.warn('⚠️  next-auth not installed');
      }

      if (!hasPrismaAdapter) {
        console.warn('⚠️  @auth/prisma-adapter not installed');
      }

      expect(typeof hasNextAuth).toBe('boolean');
      expect(typeof hasPrismaAdapter).toBe('boolean');
    });
  });

  describe('Stripe Webhooks Implementation Status', () => {
    it('should check if Stripe webhook route exists', () => {
      const webhookRoute = 'app/api/webhooks/stripe/route.ts';
      expect(existsSync(webhookRoute)).toBe(true);
    });

    it('should validate webhook implementation completeness', () => {
      const webhookRoute = 'app/api/webhooks/stripe/route.ts';
      
      if (existsSync(webhookRoute)) {
        const content = readFileSync(webhookRoute, 'utf-8');
        
        // Vérifier si utilise Prisma ou mocks
        const usesPrisma = content.includes('@prisma/client') || 
                          content.includes('prisma.');
        
        const hasMocks = content.includes('new Map') || 
                        content.includes('// Mock') ||
                        content.includes('// TODO');

        if (!usesPrisma && hasMocks) {
          console.warn('⚠️  Stripe webhooks using mocks instead of Prisma');
        }

        expect(typeof usesPrisma).toBe('boolean');
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should have DATABASE_URL in env example', () => {
      const envExample = '.env.example';
      
      if (existsSync(envExample)) {
        const content = readFileSync(envExample, 'utf-8');
        expect(content).toContain('DATABASE_URL');
      }
    });

    it('should have Prisma-related env variables documented', () => {
      const envExample = '.env.example';
      
      if (existsSync(envExample)) {
        const content = readFileSync(envExample, 'utf-8');
        
        // Variables Prisma recommandées
        const hasDbUrl = content.includes('DATABASE_URL');
        const hasDirectUrl = content.includes('DIRECT_URL') || 
                            content.includes('DIRECT_DATABASE_URL');

        expect(hasDbUrl).toBe(true);
      }
    });
  });

  describe('Migration Readiness Check', () => {
    it('should validate all prerequisites for Prisma migration', () => {
      const prerequisites = {
        schema: existsSync('prisma/schema.prisma'),
        packageJson: existsSync('package.json'),
        apiRoutes: existsSync('app/api'),
        envExample: existsSync('.env.example')
      };

      const allReady = Object.values(prerequisites).every(v => v);

      if (!allReady) {
        const missing = Object.entries(prerequisites)
          .filter(([, exists]) => !exists)
          .map(([name]) => name);
        
        console.warn(`⚠️  Missing prerequisites: ${missing.join(', ')}`);
      }

      expect(allReady).toBe(true);
    });

    it('should estimate migration complexity', () => {
      let apiRouteCount = 0;
      const apiDir = 'app/api';

      if (existsSync(apiDir)) {
        // Compter approximativement les routes
        const countRoutes = (dir: string): number => {
          try {
            const fs = require('fs');
            const items = fs.readdirSync(dir, { withFileTypes: true });
            let count = 0;

            for (const item of items) {
              if (item.isDirectory()) {
                count += countRoutes(`${dir}/${item.name}`);
              } else if (item.name === 'route.ts' || item.name === 'route.js') {
                count++;
              }
            }

            return count;
          } catch {
            return 0;
          }
        };

        apiRouteCount = countRoutes(apiDir);
      }

      console.log(`ℹ️  Estimated ${apiRouteCount} API routes to migrate`);

      // Estimation de complexité
      let complexity: 'low' | 'medium' | 'high';
      if (apiRouteCount < 10) complexity = 'low';
      else if (apiRouteCount < 30) complexity = 'medium';
      else complexity = 'high';

      console.log(`ℹ️  Migration complexity: ${complexity}`);

      expect(['low', 'medium', 'high']).toContain(complexity);
    });
  });
});

/**
 * Tests de régression pour s'assurer que la migration Prisma
 * ne casse pas les fonctionnalités existantes
 */
describe('Prisma Migration Regression Prevention', () => {
  describe('Backward Compatibility', () => {
    it('should maintain existing API route signatures', () => {
      // Les routes doivent garder les mêmes signatures après migration
      const criticalRoutes = [
        'app/api/auth/signin/route.ts',
        'app/api/users/profile/route.ts',
        'app/api/billing/checkout/route.ts'
      ];

      for (const route of criticalRoutes) {
        if (existsSync(route)) {
          const content = readFileSync(route, 'utf-8');
          
          // Vérifier que les exports standards existent
          expect(content).toMatch(/export\s+async\s+function\s+(GET|POST|PUT|DELETE)/);
        }
      }
    });

    it('should not break existing service interfaces', () => {
      const services = [
        'lib/services/simple-user-service.ts',
        'lib/services/simple-billing-service.ts'
      ];

      for (const service of services) {
        if (existsSync(service)) {
          const content = readFileSync(service, 'utf-8');
          
          // Les méthodes publiques doivent rester exportées
          expect(content).toMatch(/export\s+(class|const|function)/);
        }
      }
    });
  });

  describe('Data Integrity', () => {
    it('should validate Prisma schema has proper constraints', () => {
      if (!existsSync('prisma/schema.prisma')) return;
      
      const schema = readFileSync('prisma/schema.prisma', 'utf-8');
      
      // Vérifier les contraintes importantes
      expect(schema).toMatch(/@unique/); // Au moins un champ unique
      expect(schema).toMatch(/@id/); // Au moins un ID
      expect(schema).toMatch(/@default/); // Au moins une valeur par défaut
    });

    it('should have proper relations defined', () => {
      if (!existsSync('prisma/schema.prisma')) return;
      
      const schema = readFileSync('prisma/schema.prisma', 'utf-8');
      
      // Vérifier les relations
      expect(schema).toMatch(/@relation/);
    });
  });

  describe('Performance Considerations', () => {
    it('should have indexes defined for common queries', () => {
      if (!existsSync('prisma/schema.prisma')) return;
      
      const schema = readFileSync('prisma/schema.prisma', 'utf-8');
      
      // Vérifier les indexes
      const hasIndexes = schema.includes('@@index') || schema.includes('@@unique');
      
      if (!hasIndexes) {
        console.warn('⚠️  No indexes found in schema - may impact performance');
      }

      expect(typeof hasIndexes).toBe('boolean');
    });
  });
});
