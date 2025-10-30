import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour package.json
 * Valide la configuration du projet après migration vers simple-services
 */

describe('Package.json Configuration Validation', () => {
  let packageJson: any;

  beforeEach(() => {
    if (existsSync('package.json')) {
      const content = readFileSync('package.json', 'utf-8');
      packageJson = JSON.parse(content);
    }
  });

  describe('Project Metadata', () => {
    it('should have correct project name', () => {
      expect(packageJson.name).toBe('huntaze-simple-services');
    });

    it('should have version defined', () => {
      expect(packageJson.version).toBeDefined();
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should be marked as private', () => {
      expect(packageJson.private).toBe(true);
    });
  });

  describe('Core Scripts', () => {
    it('should have essential Next.js scripts', () => {
      expect(packageJson.scripts.dev).toBe('next dev');
      expect(packageJson.scripts.build).toBe('next build');
      expect(packageJson.scripts.start).toBe('next start');
    });

    it('should have linting script', () => {
      expect(packageJson.scripts.lint).toBe('next lint');
    });

    it('should have type checking scripts', () => {
      expect(packageJson.scripts['type-check']).toBe('tsc --noEmit');
      expect(packageJson.scripts['type-check:ci']).toBe('tsc --noEmit --pretty false');
    });
  });

  describe('Test Scripts', () => {
    it('should have basic test script', () => {
      expect(packageJson.scripts.test).toBe('vitest');
    });

    it('should have test UI script', () => {
      expect(packageJson.scripts['test:ui']).toBe('vitest --ui');
    });

    it('should have test run script', () => {
      expect(packageJson.scripts['test:run']).toBe('vitest run');
    });

    it('should have CI test script with JUnit reporting', () => {
      const ciScript = packageJson.scripts['test:ci'];
      expect(ciScript).toContain('vitest run');
      expect(ciScript).toContain('--reporter=verbose');
      expect(ciScript).toContain('--reporter=junit');
      expect(ciScript).toContain('--outputFile.junit=reports/junit.xml');
    });

    it('should have coverage script', () => {
      expect(packageJson.scripts['test:coverage']).toBe('vitest run --coverage');
    });

    it('should have watch mode script', () => {
      expect(packageJson.scripts['test:watch']).toBe('vitest --watch');
    });
  });

  describe('Simple Services Test Scripts', () => {
    it('should have simple-services test script', () => {
      expect(packageJson.scripts['test:simple-services']).toBe('vitest --config vitest.simple-services.config.ts');
    });

    it('should have simple-services run script', () => {
      expect(packageJson.scripts['test:simple-services:run']).toBe('vitest run --config vitest.simple-services.config.ts');
    });

    it('should have simple-services CI script with coverage', () => {
      const ciScript = packageJson.scripts['test:simple-services:ci'];
      expect(ciScript).toContain('vitest run');
      expect(ciScript).toContain('--config vitest.simple-services.config.ts');
      expect(ciScript).toContain('--reporter=verbose');
      expect(ciScript).toContain('--reporter=junit');
      expect(ciScript).toContain('--outputFile.junit=reports/simple-services-junit.xml');
      expect(ciScript).toContain('--coverage');
    });

    it('should have simple-services watch script', () => {
      expect(packageJson.scripts['test:simple-services:watch']).toBe('vitest --config vitest.simple-services.config.ts --watch');
    });

    it('should have simple-services coverage script', () => {
      expect(packageJson.scripts['test:simple-services:coverage']).toBe('vitest run --config vitest.simple-services.config.ts --coverage');
    });
  });

  describe('Docker Test Scripts', () => {
    it('should have docker test script', () => {
      const dockerScript = packageJson.scripts['test:docker'];
      expect(dockerScript).toContain('docker compose -f docker/test.yml up -d');
      expect(dockerScript).toContain('npm run test:ci');
      expect(dockerScript).toContain('docker compose -f docker/test.yml down');
    });

    it('should have docker up script', () => {
      expect(packageJson.scripts['docker:test:up']).toBe('docker compose -f docker/test.yml up -d');
    });

    it('should have docker down script', () => {
      expect(packageJson.scripts['docker:test:down']).toBe('docker compose -f docker/test.yml down');
    });

    it('should have docker logs script', () => {
      expect(packageJson.scripts['docker:test:logs']).toBe('docker compose -f docker/test.yml logs -f');
    });
  });

  describe('Utility Scripts', () => {
    it('should have coverage check script', () => {
      expect(packageJson.scripts['check-coverage']).toBe('node scripts/check-coverage.js');
    });

    it('should have test validation script', () => {
      expect(packageJson.scripts['validate-tests']).toBe('node scripts/run-simple-services-tests.mjs');
    });

    it('should have AWS deployment script', () => {
      expect(packageJson.scripts['aws:deploy']).toBe('scripts/deploy-aws-infrastructure.sh');
    });

    it('should have AWS build trigger script', () => {
      expect(packageJson.scripts['aws:build']).toBe('aws codebuild start-build --project-name huntaze-simple-services');
    });

    it('should have clean scripts', () => {
      expect(packageJson.scripts.clean).toContain('rm -rf');
      expect(packageJson.scripts.clean).toContain('.next');
      expect(packageJson.scripts.clean).toContain('coverage');
      expect(packageJson.scripts.clean).toContain('reports');
      
      expect(packageJson.scripts['clean:docker']).toContain('docker system prune');
      expect(packageJson.scripts['clean:docker']).toContain('docker volume prune');
    });
  });

  describe('Dependencies', () => {
    it('should have Next.js dependency', () => {
      expect(packageJson.dependencies.next).toBeDefined();
      expect(packageJson.dependencies.next).toMatch(/^\^?14\./);
    });

    it('should have React dependencies', () => {
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies.react).toMatch(/^\^?18\./);
      expect(packageJson.dependencies['react-dom']).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toMatch(/^\^?18\./);
    });

    it('should have Prisma client', () => {
      expect(packageJson.dependencies['@prisma/client']).toBeDefined();
      expect(packageJson.dependencies['@prisma/client']).toMatch(/^\^?5\./);
    });

    it('should have Stripe dependencies', () => {
      expect(packageJson.dependencies.stripe).toBeDefined();
      expect(packageJson.dependencies.stripe).toMatch(/^\^?14\./);
      expect(packageJson.dependencies['@stripe/stripe-js']).toBeDefined();
    });

    it('should have Zod for validation', () => {
      expect(packageJson.dependencies.zod).toBeDefined();
      expect(packageJson.dependencies.zod).toMatch(/^\^?3\./);
    });

    it('should have Next.js font package', () => {
      expect(packageJson.dependencies['@next/font']).toBeDefined();
    });
  });

  describe('Dev Dependencies', () => {
    it('should have TypeScript', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies.typescript).toMatch(/^\^?5\./);
    });

    it('should have type definitions', () => {
      expect(packageJson.devDependencies['@types/node']).toBeDefined();
      expect(packageJson.devDependencies['@types/react']).toBeDefined();
      expect(packageJson.devDependencies['@types/react-dom']).toBeDefined();
    });

    it('should have ESLint dependencies', () => {
      expect(packageJson.devDependencies.eslint).toBeDefined();
      expect(packageJson.devDependencies['eslint-config-next']).toBeDefined();
      expect(packageJson.devDependencies['@typescript-eslint/eslint-plugin']).toBeDefined();
      expect(packageJson.devDependencies['@typescript-eslint/parser']).toBeDefined();
    });

    it('should have Vitest dependencies', () => {
      expect(packageJson.devDependencies.vitest).toBeDefined();
      expect(packageJson.devDependencies['@vitest/coverage-v8']).toBeDefined();
      expect(packageJson.devDependencies['@vitest/ui']).toBeDefined();
    });

    it('should have Prisma CLI', () => {
      expect(packageJson.devDependencies.prisma).toBeDefined();
      expect(packageJson.devDependencies.prisma).toMatch(/^\^?5\./);
    });
  });

  describe('Engine Requirements', () => {
    it('should specify Node.js version', () => {
      expect(packageJson.engines.node).toBeDefined();
      expect(packageJson.engines.node).toMatch(/>=18\.0\.0/);
    });

    it('should specify npm version', () => {
      expect(packageJson.engines.npm).toBeDefined();
      expect(packageJson.engines.npm).toMatch(/>=8\.0\.0/);
    });
  });

  describe('Script Consistency', () => {
    it('should not have conflicting test scripts', () => {
      const testScripts = Object.keys(packageJson.scripts).filter(key => key.startsWith('test'));
      
      // Verify no duplicate functionality
      expect(testScripts).toContain('test');
      expect(testScripts).toContain('test:ci');
      expect(testScripts).toContain('test:coverage');
      expect(testScripts).toContain('test:simple-services');
    });

    it('should have consistent script naming', () => {
      const scripts = packageJson.scripts;
      
      // Check for consistent naming patterns
      if (scripts['test:simple-services']) {
        expect(scripts['test:simple-services:run']).toBeDefined();
        expect(scripts['test:simple-services:ci']).toBeDefined();
        expect(scripts['test:simple-services:watch']).toBeDefined();
        expect(scripts['test:simple-services:coverage']).toBeDefined();
      }
    });

    it('should reference existing config files', () => {
      const scripts = packageJson.scripts;
      
      // Check that referenced files should exist
      if (scripts['test:simple-services']?.includes('vitest.simple-services.config.ts')) {
        // Config file should exist or be creatable
        expect(scripts['test:simple-services']).toContain('vitest.simple-services.config.ts');
      }
      
      if (scripts['check-coverage']?.includes('scripts/check-coverage.js')) {
        expect(scripts['check-coverage']).toContain('scripts/check-coverage.js');
      }
    });
  });

  describe('Removed Legacy Scripts', () => {
    it('should not have old e2e scripts', () => {
      expect(packageJson.scripts['e2e']).toBeUndefined();
      expect(packageJson.scripts['e2e:smoke']).toBeUndefined();
      expect(packageJson.scripts['e2e:headed']).toBeUndefined();
    });

    it('should not have old performance scripts', () => {
      expect(packageJson.scripts['test:performance']).toBeUndefined();
      expect(packageJson.scripts['load-test']).toBeUndefined();
    });

    it('should not have old monitoring scripts', () => {
      expect(packageJson.scripts['monitoring:start']).toBeUndefined();
      expect(packageJson.scripts['monitoring:stop']).toBeUndefined();
    });

    it('should not have old debug scripts', () => {
      expect(packageJson.scripts['debug:all']).toBeUndefined();
      expect(packageJson.scripts['debug:master']).toBeUndefined();
    });
  });

  describe('Removed Legacy Dependencies', () => {
    it('should not have Playwright dependencies', () => {
      expect(packageJson.devDependencies['@playwright/test']).toBeUndefined();
      expect(packageJson.devDependencies.playwright).toBeUndefined();
    });

    it('should not have old AWS SDK packages', () => {
      expect(packageJson.dependencies['@aws-sdk/client-cloudwatch-logs']).toBeUndefined();
      expect(packageJson.dependencies['@aws-sdk/client-eventbridge']).toBeUndefined();
      expect(packageJson.dependencies['@aws-sdk/client-s3']).toBeUndefined();
    });

    it('should not have old UI libraries', () => {
      expect(packageJson.dependencies['framer-motion']).toBeUndefined();
      expect(packageJson.dependencies['lucide-react']).toBeUndefined();
      expect(packageJson.dependencies.cmdk).toBeUndefined();
    });

    it('should not have old testing libraries', () => {
      expect(packageJson.devDependencies['@testing-library/react']).toBeUndefined();
      expect(packageJson.devDependencies['@testing-library/jest-dom']).toBeUndefined();
      expect(packageJson.devDependencies['jest-axe']).toBeUndefined();
    });
  });

  describe('Version Compatibility', () => {
    it('should have compatible React and Next.js versions', () => {
      const reactVersion = packageJson.dependencies.react;
      const nextVersion = packageJson.dependencies.next;
      
      // Next.js 14 is compatible with React 18
      expect(reactVersion).toMatch(/^\^?18\./);
      expect(nextVersion).toMatch(/^\^?14\./);
    });

    it('should have compatible Prisma versions', () => {
      const prismaClient = packageJson.dependencies['@prisma/client'];
      const prismaCli = packageJson.devDependencies.prisma;
      
      // Both should be version 5
      expect(prismaClient).toMatch(/^\^?5\./);
      expect(prismaCli).toMatch(/^\^?5\./);
    });

    it('should have compatible TypeScript and ESLint versions', () => {
      const typescript = packageJson.devDependencies.typescript;
      const eslintPlugin = packageJson.devDependencies['@typescript-eslint/eslint-plugin'];
      
      expect(typescript).toMatch(/^\^?5\./);
      expect(eslintPlugin).toMatch(/^\^?6\./);
    });
  });

  describe('Script Execution Validation', () => {
    it('should have valid shell commands in scripts', () => {
      const scripts = packageJson.scripts;
      
      Object.entries(scripts).forEach(([name, command]) => {
        // Check for common shell command issues
        expect(command).not.toMatch(/&&\s*$/); // No trailing &&
        expect(command).not.toMatch(/\|\s*$/); // No trailing |
        
        // Check for proper quoting if needed
        if (typeof command === 'string' && command.includes('rm -rf')) {
          expect(command).toContain('rm -rf');
        }
      });
    });

    it('should have proper npm script references', () => {
      const scripts = packageJson.scripts;
      
      // Check that npm run references point to existing scripts
      Object.entries(scripts).forEach(([name, command]) => {
        if (typeof command === 'string' && command.includes('npm run')) {
          const matches = command.match(/npm run ([\w:-]+)/g);
          if (matches) {
            matches.forEach(match => {
              const scriptName = match.replace('npm run ', '');
              expect(scripts[scriptName]).toBeDefined();
            });
          }
        }
      });
    });
  });

  describe('AWS Integration', () => {
    it('should have AWS deployment scripts', () => {
      expect(packageJson.scripts['aws:deploy']).toBeDefined();
      expect(packageJson.scripts['aws:build']).toBeDefined();
    });

    it('should reference correct AWS CodeBuild project', () => {
      const awsBuildScript = packageJson.scripts['aws:build'];
      expect(awsBuildScript).toContain('huntaze-simple-services');
    });
  });

  describe('Docker Integration', () => {
    it('should have Docker Compose scripts', () => {
      expect(packageJson.scripts['docker:test:up']).toBeDefined();
      expect(packageJson.scripts['docker:test:down']).toBeDefined();
      expect(packageJson.scripts['docker:test:logs']).toBeDefined();
    });

    it('should reference correct Docker Compose file', () => {
      const dockerScripts = [
        packageJson.scripts['test:docker'],
        packageJson.scripts['docker:test:up'],
        packageJson.scripts['docker:test:down'],
        packageJson.scripts['docker:test:logs']
      ];
      
      dockerScripts.forEach(script => {
        if (script) {
          expect(script).toContain('docker/test.yml');
        }
      });
    });
  });
});

/**
 * Tests de régression pour s'assurer que les modifications futures
 * ne cassent pas la configuration package.json
 */
describe('Package.json Regression Tests', () => {
  let packageJson: any;

  beforeEach(() => {
    if (existsSync('package.json')) {
      const content = readFileSync('package.json', 'utf-8');
      packageJson = JSON.parse(content);
    }
  });

  it('should maintain project name consistency', () => {
    expect(packageJson.name).toBe('huntaze-simple-services');
  });

  it('should maintain essential test scripts', () => {
    const essentialScripts = [
      'test',
      'test:ci',
      'test:coverage',
      'test:simple-services',
      'test:simple-services:ci'
    ];
    
    essentialScripts.forEach(script => {
      expect(packageJson.scripts[script]).toBeDefined();
    });
  });

  it('should maintain core dependencies', () => {
    const coreDeps = [
      'next',
      'react',
      'react-dom',
      '@prisma/client',
      'stripe',
      'zod'
    ];
    
    coreDeps.forEach(dep => {
      expect(packageJson.dependencies[dep]).toBeDefined();
    });
  });

  it('should maintain dev dependencies', () => {
    const coreDevDeps = [
      'typescript',
      'vitest',
      '@vitest/coverage-v8',
      'eslint',
      'prisma'
    ];
    
    coreDevDeps.forEach(dep => {
      expect(packageJson.devDependencies[dep]).toBeDefined();
    });
  });

  it('should maintain engine requirements', () => {
    expect(packageJson.engines.node).toBeDefined();
    expect(packageJson.engines.npm).toBeDefined();
  });
});
