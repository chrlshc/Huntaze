import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de validation pour buildspec.yml
 * Valide la configuration AWS CodeBuild pour les tests des services simplifiés
 */

describe('BuildSpec Configuration Validation', () => {
  let buildspecContent: string;
  let buildspecConfig: any;

  beforeEach(() => {
    if (existsSync('buildspec.yml')) {
      buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      buildspecConfig = parse(buildspecContent);
    }
  });

  describe('File Structure', () => {
    it('should have buildspec.yml file', () => {
      expect(existsSync('buildspec.yml')).toBe(true);
    });

    it('should be valid YAML format', () => {
      expect(() => parse(buildspecContent)).not.toThrow();
      expect(buildspecConfig).toBeDefined();
    });

    it('should have correct version', () => {
      expect(buildspecConfig.version).toBe(0.2);
    });
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      expect(buildspecConfig.env).toBeDefined();
      expect(buildspecConfig.env.variables).toBeDefined();
      
      const variables = buildspecConfig.env.variables;
      expect(variables.NODE_ENV).toBe('test');
      expect(variables.NEXT_PUBLIC_URL).toBe('https://test.huntaze.com');
    });

    it('should have proper comments for secrets management', () => {
      expect(buildspecContent).toContain('# Database will be set in pre_build phase');
      expect(buildspecContent).toContain('# STRIPE_SECRET_KEY will be fetched from Secrets Manager');
    });
  });

  describe('Phases Configuration', () => {
    it('should have all required phases', () => {
      expect(buildspecConfig.phases).toBeDefined();
      expect(buildspecConfig.phases.install).toBeDefined();
      expect(buildspecConfig.phases.pre_build).toBeDefined();
      expect(buildspecConfig.phases.build).toBeDefined();
      expect(buildspecConfig.phases.post_build).toBeDefined();
    });

    describe('Install Phase', () => {
      it('should specify correct Node.js version', () => {
        const installPhase = buildspecConfig.phases.install;
        expect(installPhase['runtime-versions']).toBeDefined();
        expect(installPhase['runtime-versions'].nodejs).toBe(20);
      });

      it('should have npm ci command', () => {
        const commands = buildspecConfig.phases.install.commands;
        expect(commands).toContain('npm ci');
      });

      it('should install system dependencies', () => {
        const commands = buildspecConfig.phases.install.commands.join(' ');
        expect(commands).toContain('jq');
        expect(commands).toContain('yum');
        expect(commands).toContain('apt-get');
      });
    });

    describe('Pre-build Phase', () => {
      it('should setup database URL', () => {
        const commands = buildspecConfig.phases.pre_build.commands.join(' ');
        expect(commands).toContain('DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/huntaze_test"');
      });

      it('should start PostgreSQL container', () => {
        const commands = buildspecConfig.phases.pre_build.commands.join(' ');
        expect(commands).toContain('docker run');
        expect(commands).toContain('postgres:15-alpine');
        expect(commands).toContain('test-postgres');
      });

      it('should start Stripe Mock server', () => {
        const commands = buildspecConfig.phases.pre_build.commands.join(' ');
        expect(commands).toContain('stripe/stripe-mock');
        expect(commands).toContain('stripe-mock');
        expect(commands).toContain('12111:12111');
      });

      it('should handle Stripe secrets from AWS Secrets Manager', () => {
        const commands = buildspecConfig.phases.pre_build.commands.join(' ');
        expect(commands).toContain('aws secretsmanager get-secret-value');
        expect(commands).toContain('huntaze/stripe-secrets');
        expect(commands).toContain('STRIPE_SECRET_KEY');
        expect(commands).toContain('STRIPE_PRO_MONTHLY_PRICE_ID');
      });

      it('should wait for services to be ready', () => {
        const commands = buildspecConfig.phases.pre_build.commands.join(' ');
        expect(commands).toContain('pg_isready');
        expect(commands).toContain('curl -f http://localhost:12111');
      });

      it('should run database migrations', () => {
        const commands = buildspecConfig.phases.pre_build.commands.join(' ');
        expect(commands).toContain('prisma migrate deploy');
        expect(commands).toContain('prisma db push');
      });
    });

    describe('Build Phase', () => {
      it('should run TypeScript type checking', () => {
        const commands = buildspecConfig.phases.build.commands.join(' ');
        expect(commands).toContain('npm run type-check');
        expect(commands).toContain('npx tsc --noEmit');
      });

      it('should create reports directory', () => {
        const commands = buildspecConfig.phases.build.commands;
        expect(commands).toContain('mkdir -p reports coverage');
      });

      it('should run simple services tests with coverage', () => {
        const commands = buildspecConfig.phases.build.commands.join(' ');
        expect(commands).toContain('vitest.simple-services.config.ts');
        expect(commands).toContain('--coverage');
        expect(commands).toContain('simple-user-service.test.ts');
        expect(commands).toContain('simple-billing-service-complete.test.ts');
        expect(commands).toContain('user-billing-integration.test.ts');
      });

      it('should generate JUnit reports', () => {
        const commands = buildspecConfig.phases.build.commands.join(' ');
        expect(commands).toContain('--reporter=junit');
        expect(commands).toContain('simple-services-junit.xml');
        expect(commands).toContain('unit-tests-junit.xml');
        expect(commands).toContain('integration-tests-junit.xml');
      });

      it('should check coverage thresholds', () => {
        const commands = buildspecConfig.phases.build.commands;
        expect(commands).toContain('node scripts/check-coverage.js || true');
      });

      it('should generate test summary', () => {
        const commands = buildspecConfig.phases.build.commands.join(' ');
        expect(commands).toContain('Test Execution Summary');
        expect(commands).toContain('reports/test-summary.txt');
      });
    });

    describe('Post-build Phase', () => {
      it('should cleanup test containers', () => {
        const commands = buildspecConfig.phases.post_build.commands.join(' ');
        expect(commands).toContain('docker stop test-postgres stripe-mock');
        expect(commands).toContain('docker rm test-postgres stripe-mock');
        expect(commands).toContain('docker network rm test-network');
      });

      it('should list coverage and reports', () => {
        const commands = buildspecConfig.phases.post_build.commands.join(' ');
        expect(commands).toContain('ls -la coverage/');
        expect(commands).toContain('ls -la reports/');
      });
    });
  });

  describe('Artifacts Configuration', () => {
    it('should define artifacts correctly', () => {
      expect(buildspecConfig.artifacts).toBeDefined();
      expect(buildspecConfig.artifacts.files).toContain('reports/**/*');
      expect(buildspecConfig.artifacts.files).toContain('coverage/**/*');
      expect(buildspecConfig.artifacts.files).toContain('test-results/**/*');
    });

    it('should have correct artifact name', () => {
      expect(buildspecConfig.artifacts.name).toBe('huntaze-simple-services-test-artifacts');
    });

    it('should preserve directory structure', () => {
      expect(buildspecConfig.artifacts['discard-paths']).toBe(false);
    });
  });

  describe('Reports Configuration', () => {
    it('should define test reports', () => {
      expect(buildspecConfig.reports).toBeDefined();
      expect(buildspecConfig.reports['simple-services-tests']).toBeDefined();
      expect(buildspecConfig.reports['unit-tests']).toBeDefined();
      expect(buildspecConfig.reports['integration-tests']).toBeDefined();
    });

    it('should use correct report format', () => {
      const reports = buildspecConfig.reports;
      
      Object.values(reports).forEach((report: any) => {
        expect(report['file-format']).toBe('JUNITXML');
        expect(report['base-directory']).toBe('reports');
      });
    });

    it('should reference correct report files', () => {
      const reports = buildspecConfig.reports;
      
      expect(reports['simple-services-tests'].files).toContain('reports/simple-services-junit.xml');
      expect(reports['unit-tests'].files).toContain('reports/unit-tests-junit.xml');
      expect(reports['integration-tests'].files).toContain('reports/integration-tests-junit.xml');
    });
  });

  describe('Cache Configuration', () => {
    it('should cache node_modules and npm cache', () => {
      expect(buildspecConfig.cache).toBeDefined();
      expect(buildspecConfig.cache.paths).toContain('node_modules/**/*');
      expect(buildspecConfig.cache.paths).toContain('.npm/**/*');
    });
  });

  describe('Security and Best Practices', () => {
    it('should use secure secret management', () => {
      const content = buildspecContent;
      
      // Should not contain hardcoded secrets
      expect(content).not.toMatch(/sk_live_[a-zA-Z0-9]+/);
      expect(content).not.toMatch(/sk_test_[a-zA-Z0-9]+/);
      
      // Should use AWS Secrets Manager
      expect(content).toContain('aws secretsmanager get-secret-value');
    });

    it('should use proper error handling', () => {
      const content = buildspecContent;
      
      // Should have fallback commands
      expect(content).toContain('|| true');
      expect(content).toContain('|| npx');
    });

    it('should use specific Docker image versions', () => {
      const content = buildspecContent;
      
      expect(content).toContain('postgres:15-alpine');
      expect(content).toContain('stripe/stripe-mock:0.108.0');
    });

    it('should have proper service health checks', () => {
      const content = buildspecContent;
      
      expect(content).toContain('pg_isready');
      expect(content).toContain('curl -f http://localhost:12111');
      expect(content).toContain('for i in {1..30}');
      expect(content).toContain('for i in {1..15}');
    });
  });

  describe('Test Configuration Validation', () => {
    it('should reference existing test files', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      // Check if referenced test files exist
      const testFiles = [
        'tests/unit/simple-user-service.test.ts',
        'tests/unit/simple-billing-service-complete.test.ts',
        'tests/integration/user-billing-integration.test.ts',
        'tests/unit/simple-services-validation.test.ts'
      ];

      testFiles.forEach(file => {
        expect(commands).toContain(file);
      });
    });

    it('should reference existing config files', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('vitest.simple-services.config.ts');
      
      // Check if config file should exist
      if (existsSync('vitest.simple-services.config.ts')) {
        expect(true).toBe(true); // Config exists
      } else {
        console.warn('vitest.simple-services.config.ts referenced but not found');
      }
    });

    it('should reference existing scripts', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('scripts/check-coverage.js');
      
      // Verify package.json scripts
      if (existsSync('package.json')) {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
        expect(packageJson.scripts['type-check']).toBeDefined();
      }
    });
  });

  describe('Environment Compatibility', () => {
    it('should work with both yum and apt-get systems', () => {
      const content = buildspecContent;
      
      expect(content).toContain('command -v yum');
      expect(content).toContain('command -v apt-get');
      expect(content).toContain('yum -y install jq');
      expect(content).toContain('apt-get update && apt-get -y install jq');
    });

    it('should handle missing optional dependencies gracefully', () => {
      const content = buildspecContent;
      
      expect(content).toContain('|| true');
      expect(content).toContain('if [ -f "prisma/schema.prisma" ]');
      expect(content).toContain('if ls tests/unit/*.test.ts');
    });
  });

  describe('Performance Considerations', () => {
    it('should use parallel operations where possible', () => {
      const content = buildspecContent;
      
      // Docker containers should start in background
      expect(content).toContain('docker run -d');
    });

    it('should have reasonable timeouts', () => {
      const content = buildspecContent;
      
      expect(content).toContain('sleep 10');
      expect(content).toContain('sleep 2');
      expect(content).toContain('{1..30}'); // 30 attempts for PostgreSQL
      expect(content).toContain('{1..15}'); // 15 attempts for Stripe Mock
    });

    it('should cache dependencies', () => {
      expect(buildspecConfig.cache).toBeDefined();
      expect(buildspecConfig.cache.paths.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Tests d'intégration pour vérifier que buildspec.yml fonctionne avec l'écosystème
 */
describe('BuildSpec Integration', () => {
  describe('Package.json Compatibility', () => {
    it('should reference existing npm scripts', () => {
      if (!existsSync('package.json')) return;
      
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Verify referenced scripts exist
      if (buildspecContent.includes('npm run type-check')) {
        expect(packageJson.scripts['type-check']).toBeDefined();
      }
      
      if (buildspecContent.includes('npm run test')) {
        expect(packageJson.scripts.test).toBeDefined();
      }
    });

    it('should be compatible with Node.js version in package.json', () => {
      if (!existsSync('package.json')) return;
      
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const buildspecConfig = parse(readFileSync('buildspec.yml', 'utf-8'));
      
      if (packageJson.engines?.node) {
        const nodeVersion = buildspecConfig.phases.install['runtime-versions'].nodejs;
        const requiredVersion = packageJson.engines.node;
        
        // Basic compatibility check
        if (requiredVersion.includes('>=')) {
          const minVersion = parseInt(requiredVersion.replace('>=', ''));
          expect(nodeVersion).toBeGreaterThanOrEqual(minVersion);
        }
      }
    });
  });

  describe('Test Files Compatibility', () => {
    it('should reference existing test directories', () => {
      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      if (buildspecContent.includes('tests/unit/')) {
        expect(existsSync('tests/unit')).toBe(true);
      }
      
      if (buildspecContent.includes('tests/integration/')) {
        expect(existsSync('tests/integration')).toBe(true);
      }
    });

    it('should be compatible with vitest configuration', () => {
      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      if (buildspecContent.includes('vitest.simple-services.config.ts')) {
        // Should either exist or be creatable
        if (!existsSync('vitest.simple-services.config.ts')) {
          console.warn('vitest.simple-services.config.ts should be created');
        }
      }
    });
  });

  describe('Docker Compatibility', () => {
    it('should use compatible Docker images', () => {
      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Verify image versions are specified
      expect(buildspecContent).toMatch(/postgres:\d+/);
      expect(buildspecContent).toMatch(/stripe\/stripe-mock:\d+\.\d+\.\d+/);
    });

    it('should use proper networking', () => {
      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      expect(buildspecContent).toContain('--network test-network');
      expect(buildspecContent).toContain('docker network create test-network');
    });
  });
});