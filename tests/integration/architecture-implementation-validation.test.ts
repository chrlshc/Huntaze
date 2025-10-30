/**
 * Integration Tests - Architecture Implementation Validation
 * 
 * Tests to validate that the actual implementation matches the documented architecture
 * 
 * Coverage:
 * - Feature sections implementation
 * - API routes existence and structure
 * - Hooks implementation
 * - Services implementation
 * - Database models
 * - Component structure
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Architecture Implementation Validation', () => {
  const projectRoot = join(process.cwd());

  describe('Feature Sections Implementation', () => {
    describe('OnlyFans Section', () => {
      it('should have API routes implemented', () => {
        const routes = [
          'app/api/onlyfans/subscribers/route.ts',
          'app/api/onlyfans/earnings/route.ts',
        ];

        routes.forEach((route) => {
          const filePath = join(projectRoot, route);
          expect(existsSync(filePath)).toBe(true);
        });
      });

      it('should have hooks implemented', () => {
        const hooksPath = join(projectRoot, 'hooks/api/useOnlyFans.ts');
        expect(existsSync(hooksPath)).toBe(true);

        const content = readFileSync(hooksPath, 'utf-8');
        expect(content).toContain('useSubscribers');
        expect(content).toContain('useEarnings');
      });
    });

    describe('Marketing Section', () => {
      it('should have API routes implemented', () => {
        const routes = [
          'app/api/marketing/segments/route.ts',
          'app/api/marketing/automation/route.ts',
          'app/api/campaigns/route.ts',
        ];

        routes.forEach((route) => {
          const filePath = join(projectRoot, route);
          expect(existsSync(filePath)).toBe(true);
        });
      });

      it('should have hooks implemented', () => {
        const hooksPath = join(projectRoot, 'hooks/api/useMarketing.ts');
        expect(existsSync(hooksPath)).toBe(true);

        const content = readFileSync(hooksPath, 'utf-8');
        expect(content).toContain('useSegments');
        expect(content).toContain('useAutomations');
      });

      it('should have services implemented', () => {
        const services = [
          'lib/services/campaign.service.ts',
          'lib/services/segmentation.service.ts',
          'lib/services/automation.service.ts',
        ];

        services.forEach((service) => {
          const filePath = join(projectRoot, service);
          expect(existsSync(filePath)).toBe(true);
        });
      });
    });

    describe('Content Section', () => {
      it('should have API routes implemented', () => {
        const routes = [
          'app/api/content/library/route.ts',
          'app/api/content/ai-generate/route.ts',
        ];

        routes.forEach((route) => {
          const filePath = join(projectRoot, route);
          expect(existsSync(filePath)).toBe(true);
        });
      });

      it('should have hooks implemented', () => {
        const hooksPath = join(projectRoot, 'hooks/api/useContent.ts');
        expect(existsSync(hooksPath)).toBe(true);

        const content = readFileSync(hooksPath, 'utf-8');
        expect(content).toContain('useContentLibrary');
      });
    });

    describe('Analytics Section', () => {
      it('should have API routes implemented', () => {
        const routePath = join(projectRoot, 'app/api/analytics/overview/route.ts');
        expect(existsSync(routePath)).toBe(true);
      });

      it('should have hooks implemented', () => {
        const hooksPath = join(projectRoot, 'hooks/api/useAnalytics.ts');
        expect(existsSync(hooksPath)).toBe(true);

        const content = readFileSync(hooksPath, 'utf-8');
        expect(content).toContain('useAnalytics');
      });
    });

    describe('Chatbot Section', () => {
      it('should have API routes implemented', () => {
        const routes = [
          'app/api/chatbot/conversations/route.ts',
          'app/api/chatbot/auto-reply/route.ts',
        ];

        routes.forEach((route) => {
          const filePath = join(projectRoot, route);
          expect(existsSync(filePath)).toBe(true);
        });
      });

      it('should have hooks implemented', () => {
        const hooksPath = join(projectRoot, 'hooks/api/useChatbot.ts');
        expect(existsSync(hooksPath)).toBe(true);

        const content = readFileSync(hooksPath, 'utf-8');
        expect(content).toContain('useConversations');
      });
    });

    describe('Management Section', () => {
      it('should have API routes implemented', () => {
        const routes = [
          'app/api/management/profile/route.ts',
          'app/api/management/settings/route.ts',
        ];

        routes.forEach((route) => {
          const filePath = join(projectRoot, route);
          expect(existsSync(filePath)).toBe(true);
        });
      });

      it('should have hooks implemented', () => {
        const hooksPath = join(projectRoot, 'hooks/api/useManagement.ts');
        expect(existsSync(hooksPath)).toBe(true);

        const content = readFileSync(hooksPath, 'utf-8');
        expect(content).toContain('useProfile');
        expect(content).toContain('useSettings');
      });
    });
  });

  describe('Project Structure Validation', () => {
    it('should have app directory with correct structure', () => {
      const appPath = join(projectRoot, 'app');
      expect(existsSync(appPath)).toBe(true);

      const appDirs = readdirSync(appPath);
      expect(appDirs).toContain('api');
      expect(appDirs.some(dir => dir.includes('dashboard'))).toBe(true);
    });

    it('should have components directory with correct structure', () => {
      const componentsPath = join(projectRoot, 'components');
      expect(existsSync(componentsPath)).toBe(true);

      const componentDirs = readdirSync(componentsPath);
      expect(componentDirs).toContain('auth');
      expect(componentDirs).toContain('dashboard');
      expect(componentDirs).toContain('layout');
      expect(componentDirs).toContain('ui');
    });

    it('should have hooks directory with api subdirectory', () => {
      const hooksPath = join(projectRoot, 'hooks');
      expect(existsSync(hooksPath)).toBe(true);

      const apiHooksPath = join(hooksPath, 'api');
      expect(existsSync(apiHooksPath)).toBe(true);
    });

    it('should have lib directory with services', () => {
      const libPath = join(projectRoot, 'lib');
      expect(existsSync(libPath)).toBe(true);

      const servicesPath = join(libPath, 'services');
      expect(existsSync(servicesPath)).toBe(true);
    });

    it('should have tests directory with all test types', () => {
      const testsPath = join(projectRoot, 'tests');
      expect(existsSync(testsPath)).toBe(true);

      const testDirs = readdirSync(testsPath);
      expect(testDirs).toContain('unit');
      expect(testDirs).toContain('integration');
      expect(testDirs).toContain('e2e');
      expect(testDirs).toContain('regression');
    });

    it('should have infrastructure directory', () => {
      const infraPath = join(projectRoot, 'infra');
      expect(existsSync(infraPath)).toBe(true);

      const terraformPath = join(infraPath, 'terraform');
      expect(existsSync(terraformPath)).toBe(true);
    });
  });

  describe('Database Schema Validation', () => {
    it('should have Prisma schema file', () => {
      const schemaPath = join(projectRoot, 'prisma/schema.prisma');
      expect(existsSync(schemaPath)).toBe(true);
    });

    it('should have User model defined', () => {
      const schemaPath = join(projectRoot, 'prisma/schema.prisma');
      const content = readFileSync(schemaPath, 'utf-8');

      expect(content).toContain('model User');
      expect(content).toContain('email');
      expect(content).toContain('name');
    });

    it('should have Subscriber model defined', () => {
      const schemaPath = join(projectRoot, 'prisma/schema.prisma');
      const content = readFileSync(schemaPath, 'utf-8');

      expect(content).toContain('model Subscriber');
      expect(content).toContain('username');
      expect(content).toContain('tier');
    });

    it('should have Campaign model defined', () => {
      const schemaPath = join(projectRoot, 'prisma/schema.prisma');
      const content = readFileSync(schemaPath, 'utf-8');

      expect(content).toContain('model Campaign');
      expect(content).toContain('status');
      expect(content).toContain('type');
    });
  });

  describe('API Routes Structure', () => {
    it('should have all documented API routes', () => {
      const apiRoutes = [
        'app/api/onlyfans/subscribers/route.ts',
        'app/api/onlyfans/earnings/route.ts',
        'app/api/marketing/segments/route.ts',
        'app/api/marketing/automation/route.ts',
        'app/api/campaigns/route.ts',
        'app/api/content/library/route.ts',
        'app/api/content/ai-generate/route.ts',
        'app/api/analytics/overview/route.ts',
        'app/api/chatbot/conversations/route.ts',
        'app/api/chatbot/auto-reply/route.ts',
        'app/api/management/profile/route.ts',
        'app/api/management/settings/route.ts',
      ];

      apiRoutes.forEach((route) => {
        const filePath = join(projectRoot, route);
        expect(existsSync(filePath)).toBe(true);
      });
    });

    it('should have proper HTTP method exports in API routes', () => {
      const routePath = join(projectRoot, 'app/api/onlyfans/subscribers/route.ts');
      const content = readFileSync(routePath, 'utf-8');

      expect(content).toMatch(/export\s+(async\s+)?function\s+GET/);
    });
  });

  describe('Hooks Implementation', () => {
    it('should have all documented hooks files', () => {
      const hooks = [
        'hooks/api/useOnlyFans.ts',
        'hooks/api/useMarketing.ts',
        'hooks/api/useContent.ts',
        'hooks/api/useAnalytics.ts',
        'hooks/api/useChatbot.ts',
        'hooks/api/useManagement.ts',
      ];

      hooks.forEach((hook) => {
        const filePath = join(projectRoot, hook);
        expect(existsSync(filePath)).toBe(true);
      });
    });

    it('should export custom hooks from hook files', () => {
      const hooksPath = join(projectRoot, 'hooks/api/useOnlyFans.ts');
      const content = readFileSync(hooksPath, 'utf-8');

      expect(content).toMatch(/export\s+(function|const)\s+use/);
    });
  });

  describe('Services Implementation', () => {
    it('should have campaign service', () => {
      const servicePath = join(projectRoot, 'lib/services/campaign.service.ts');
      expect(existsSync(servicePath)).toBe(true);

      const content = readFileSync(servicePath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('Campaign');
    });

    it('should have automation service', () => {
      const servicePath = join(projectRoot, 'lib/services/automation.service.ts');
      expect(existsSync(servicePath)).toBe(true);

      const content = readFileSync(servicePath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('Automation');
    });

    it('should have rate limiter service', () => {
      const servicePath = join(projectRoot, 'lib/services/onlyfans-rate-limiter.service.ts');
      expect(existsSync(servicePath)).toBe(true);

      const content = readFileSync(servicePath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('RateLimiter');
    });
  });

  describe('Component Structure', () => {
    it('should have auth components', () => {
      const authPath = join(projectRoot, 'components/auth');
      expect(existsSync(authPath)).toBe(true);

      const authFiles = readdirSync(authPath);
      expect(authFiles.some(f => f.includes('LoginForm'))).toBe(true);
      expect(authFiles.some(f => f.includes('RegisterForm'))).toBe(true);
    });

    it('should have dashboard components', () => {
      const dashboardPath = join(projectRoot, 'components/dashboard');
      expect(existsSync(dashboardPath)).toBe(true);

      const dashboardFiles = readdirSync(dashboardPath);
      expect(dashboardFiles.length).toBeGreaterThan(0);
    });

    it('should have layout components', () => {
      const layoutPath = join(projectRoot, 'components/layout');
      expect(existsSync(layoutPath)).toBe(true);

      const layoutFiles = readdirSync(layoutPath);
      expect(layoutFiles.some(f => f.includes('Header'))).toBe(true);
      expect(layoutFiles.some(f => f.includes('Sidebar'))).toBe(true);
    });

    it('should have UI components', () => {
      const uiPath = join(projectRoot, 'components/ui');
      expect(existsSync(uiPath)).toBe(true);
    });
  });

  describe('Configuration Files', () => {
    it('should have Next.js config', () => {
      const configPath = join(projectRoot, 'next.config.ts');
      expect(existsSync(configPath)).toBe(true);
    });

    it('should have TypeScript config', () => {
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });

    it('should have Tailwind config', () => {
      const tailwindPath = join(projectRoot, 'tailwind.config.ts');
      expect(existsSync(tailwindPath)).toBe(true);
    });

    it('should have Prisma config', () => {
      const prismaPath = join(projectRoot, 'prisma/schema.prisma');
      expect(existsSync(prismaPath)).toBe(true);
    });
  });

  describe('AWS Integration Files', () => {
    it('should have rate limiter configuration', () => {
      const configPath = join(projectRoot, 'lib/config/rate-limiter.config.ts');
      expect(existsSync(configPath)).toBe(true);
    });

    it('should have CloudWatch metrics service', () => {
      const servicePath = join(projectRoot, 'lib/services/cloudwatch-metrics.service.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have Terraform infrastructure', () => {
      const terraformPath = join(projectRoot, 'infra/terraform/production-hardening');
      expect(existsSync(terraformPath)).toBe(true);
    });
  });

  describe('Authentication Implementation', () => {
    it('should have Auth.js configuration', () => {
      const authPath = join(projectRoot, 'auth.ts');
      expect(existsSync(authPath)).toBe(true);

      const content = readFileSync(authPath, 'utf-8');
      expect(content).toContain('NextAuth');
    });

    it('should have auth helpers', () => {
      const helpersPath = join(projectRoot, 'lib/auth-helpers.ts');
      expect(existsSync(helpersPath)).toBe(true);

      const content = readFileSync(helpersPath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('auth');
    });

    it('should have middleware for route protection', () => {
      const middlewarePath = join(projectRoot, 'middleware.ts');
      expect(existsSync(middlewarePath)).toBe(true);
    });
  });

  describe('Testing Infrastructure', () => {
    it('should have test configuration', () => {
      const vitestConfig = join(projectRoot, 'vitest.config.ts');
      expect(existsSync(vitestConfig)).toBe(true);
    });

    it('should have test setup file', () => {
      const setupPath = join(projectRoot, 'vitest.setup.ts');
      expect(existsSync(setupPath)).toBe(true);
    });

    it('should have unit tests directory', () => {
      const unitPath = join(projectRoot, 'tests/unit');
      expect(existsSync(unitPath)).toBe(true);

      const unitTests = readdirSync(unitPath, { recursive: true });
      expect(unitTests.length).toBeGreaterThan(0);
    });

    it('should have integration tests directory', () => {
      const integrationPath = join(projectRoot, 'tests/integration');
      expect(existsSync(integrationPath)).toBe(true);

      const integrationTests = readdirSync(integrationPath, { recursive: true });
      expect(integrationTests.length).toBeGreaterThan(0);
    });

    it('should have E2E tests directory', () => {
      const e2ePath = join(projectRoot, 'tests/e2e');
      expect(existsSync(e2ePath)).toBe(true);
    });
  });
});
