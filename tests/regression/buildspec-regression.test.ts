import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de régression pour buildspec.yml
 * Garantit que les modifications futures ne cassent pas la configuration existante
 */

describe('BuildSpec Regression Tests', () => {
  let buildspecConfig: any;
  let buildspecContent: string;

  beforeEach(() => {
    if (existsSync('buildspec.yml')) {
      buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      buildspecConfig = parse(buildspecContent);
    }
  });

  describe('Critical Configuration Preservation', () => {
    it('should maintain Node.js version 20', () => {
      const nodeVersion = buildspecConfig.phases.install['runtime-versions'].nodejs;
      expect(nodeVersion).toBe(20);
    });

    it('should maintain test environment configuration', () => {
      expect(buildspecConfig.env.variables.NODE_ENV).toBe('test');
      expect(buildspecConfig.env.variables.NEXT_PUBLIC_URL).toBe('https://test.huntaze.com');
    });

    it('should maintain PostgreSQL test database configuration', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/huntaze_test"');
      expect(commands).toContain('postgres:15-alpine');
      expect(commands).toContain('POSTGRES_DB=huntaze_test');
    });

    it('should maintain Stripe Mock configuration', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('stripe/stripe-mock:0.108.0');
      expect(commands).toContain('12111:12111');
    });

    it('should maintain AWS Secrets Manager integration', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('aws secretsmanager get-secret-value');
      expect(commands).toContain('huntaze/stripe-secrets');
      expect(commands).toContain('STRIPE_SECRET_KEY');
    });
  });

  describe('Test Configuration Preservation', () => {
    it('should maintain simple services test configuration', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('vitest.simple-services.config.ts');
      expect(commands).toContain('simple-user-service.test.ts');
      expect(commands).toContain('simple-billing-service-complete.test.ts');
      expect(commands).toContain('user-billing-integration.test.ts');
      expect(commands).toContain('simple-services-validation.test.ts');
    });

    it('should maintain coverage configuration', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('--coverage');
      expect(commands).toContain('scripts/check-coverage.js');
    });

    it('should maintain JUnit reporting', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('--reporter=junit');
      expect(commands).toContain('simple-services-junit.xml');
      expect(commands).toContain('unit-tests-junit.xml');
      expect(commands).toContain('integration-tests-junit.xml');
    });

    it('should maintain TypeScript checking', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('npm run type-check');
      expect(commands).toContain('npx tsc --noEmit');
    });
  });

  describe('Artifact Configuration Preservation', () => {
    it('should maintain artifact files configuration', () => {
      expect(buildspecConfig.artifacts.files).toContain('reports/**/*');
      expect(buildspecConfig.artifacts.files).toContain('coverage/**/*');
      expect(buildspecConfig.artifacts.files).toContain('test-results/**/*');
    });

    it('should maintain artifact name', () => {
      expect(buildspecConfig.artifacts.name).toBe('huntaze-simple-services-test-artifacts');
    });

    it('should maintain discard-paths setting', () => {
      expect(buildspecConfig.artifacts['discard-paths']).toBe(false);
    });
  });

  describe('Reports Configuration Preservation', () => {
    it('should maintain all report types', () => {
      expect(buildspecConfig.reports['simple-services-tests']).toBeDefined();
      expect(buildspecConfig.reports['unit-tests']).toBeDefined();
      expect(buildspecConfig.reports['integration-tests']).toBeDefined();
    });

    it('should maintain JUnit XML format', () => {
      Object.values(buildspecConfig.reports).forEach((report: any) => {
        expect(report['file-format']).toBe('JUNITXML');
        expect(report['base-directory']).toBe('reports');
      });
    });

    it('should maintain report file paths', () => {
      expect(buildspecConfig.reports['simple-services-tests'].files)
        .toContain('reports/simple-services-junit.xml');
      expect(buildspecConfig.reports['unit-tests'].files)
        .toContain('reports/unit-tests-junit.xml');
      expect(buildspecConfig.reports['integration-tests'].files)
        .toContain('reports/integration-tests-junit.xml');
    });
  });

  describe('Cache Configuration Preservation', () => {
    it('should maintain node_modules caching', () => {
      expect(buildspecConfig.cache.paths).toContain('node_modules/**/*');
    });

    it('should maintain npm cache', () => {
      expect(buildspecConfig.cache.paths).toContain('.npm/**/*');
    });
  });

  describe('Security Configuration Preservation', () => {
    it('should maintain secret management approach', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      // Should check for environment variable first
      expect(commands).toContain('if [ -z "$STRIPE_SECRET_KEY" ]');
      
      // Should fetch from Secrets Manager if not provided
      expect(commands).toContain('aws secretsmanager get-secret-value');
      
      // Should export all Stripe variables
      expect(commands).toContain('export STRIPE_SECRET_KEY=');
      expect(commands).toContain('export STRIPE_PRO_MONTHLY_PRICE_ID=');
      expect(commands).toContain('export STRIPE_PRO_YEARLY_PRICE_ID=');
      expect(commands).toContain('export STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=');
      expect(commands).toContain('export STRIPE_ENTERPRISE_YEARLY_PRICE_ID=');
    });

    it('should not introduce hardcoded secrets', () => {
      const sensitivePatterns = [
        /sk_live_[a-zA-Z0-9]+/,
        /sk_test_[a-zA-Z0-9]+/,
        /AKIA[0-9A-Z]{16}/,
        /password\s*[:=]\s*[^$\s]+/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(buildspecContent).not.toMatch(pattern);
      });
    });
  });

  describe('Error Handling Preservation', () => {
    it('should maintain graceful error handling', () => {
      const allCommands = [
        ...buildspecConfig.phases.install.commands,
        ...buildspecConfig.phases.pre_build.commands,
        ...buildspecConfig.phases.build.commands,
        ...buildspecConfig.phases.post_build.commands
      ].join(' ');
      
      expect(allCommands).toContain('|| true');
    });

    it('should maintain conditional execution for optional components', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      expect(commands).toContain('if [ -f "prisma/schema.prisma" ]');
      
      const buildCommands = buildspecConfig.phases.build.commands.join(' ');
      expect(buildCommands).toContain('if ls tests/unit/*.test.ts');
      expect(buildCommands).toContain('if ls tests/integration/*.test.ts');
    });

    it('should maintain service health checks', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('pg_isready -U postgres');
      expect(commands).toContain('curl -f http://localhost:12111');
      expect(commands).toContain('for i in {1..30}');
      expect(commands).toContain('for i in {1..15}');
    });
  });

  describe('Performance Configuration Preservation', () => {
    it('should maintain background container execution', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('docker run -d');
    });

    it('should maintain reasonable wait times', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('sleep 10');
      expect(commands).toContain('sleep 2');
    });

    it('should maintain Docker network isolation', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('docker network create test-network');
      expect(commands).toContain('--network test-network');
    });
  });

  describe('Cleanup Configuration Preservation', () => {
    it('should maintain container cleanup', () => {
      const commands = buildspecConfig.phases.post_build.commands.join(' ');
      
      expect(commands).toContain('docker stop test-postgres stripe-mock');
      expect(commands).toContain('docker rm test-postgres stripe-mock');
      expect(commands).toContain('docker network rm test-network');
    });

    it('should maintain artifact listing', () => {
      const commands = buildspecConfig.phases.post_build.commands.join(' ');
      
      expect(commands).toContain('ls -la coverage/');
      expect(commands).toContain('ls -la reports/');
    });
  });

  describe('Logging Configuration Preservation', () => {
    it('should maintain phase identification logging', () => {
      const phases = ['install', 'pre_build', 'build', 'post_build'];
      
      phases.forEach(phaseName => {
        const phase = buildspecConfig.phases[phaseName];
        if (phase?.commands) {
          const hasPhaseLog = phase.commands.some((cmd: string) => 
            typeof cmd === 'string' && 
            cmd.includes('echo') && 
            cmd.toLowerCase().includes(phaseName.replace('_', '-'))
          );
          expect(hasPhaseLog).toBe(true);
        }
      });
    });

    it('should maintain test summary generation', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('Test Execution Summary');
      expect(commands).toContain('reports/test-summary.txt');
      expect(commands).toContain('$(date)');
      expect(commands).toContain('$(node --version)');
      expect(commands).toContain('$(npm --version)');
    });
  });

  describe('Dependency Management Preservation', () => {
    it('should maintain system dependency installation', () => {
      const commands = buildspecConfig.phases.install.commands.join(' ');
      
      expect(commands).toContain('jq');
      expect(commands).toContain('yum -y install');
      expect(commands).toContain('apt-get -y install');
    });

    it('should maintain npm ci usage', () => {
      const commands = buildspecConfig.phases.install.commands;
      
      expect(commands).toContain('npm ci');
    });

    it('should maintain Prisma migration handling', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('npx prisma migrate deploy');
      expect(commands).toContain('npx prisma db push');
    });
  });

  describe('Version Pinning Preservation', () => {
    it('should maintain specific Docker image versions', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('postgres:15-alpine');
      expect(commands).toContain('stripe/stripe-mock:0.108.0');
      
      // Should not use latest tags
      expect(commands).not.toContain(':latest');
    });

    it('should maintain buildspec version', () => {
      expect(buildspecConfig.version).toBe(0.2);
    });

    it('should maintain Node.js runtime version', () => {
      expect(buildspecConfig.phases.install['runtime-versions'].nodejs).toBe(20);
    });
  });

  describe('File Structure Preservation', () => {
    it('should maintain YAML structure integrity', () => {
      expect(() => parse(buildspecContent)).not.toThrow();
    });

    it('should maintain required top-level keys', () => {
      const requiredKeys = ['version', 'env', 'phases', 'artifacts', 'reports', 'cache'];
      
      requiredKeys.forEach(key => {
        expect(buildspecConfig[key]).toBeDefined();
      });
    });

    it('should maintain phase structure', () => {
      const requiredPhases = ['install', 'pre_build', 'build', 'post_build'];
      
      requiredPhases.forEach(phase => {
        expect(buildspecConfig.phases[phase]).toBeDefined();
        expect(buildspecConfig.phases[phase].commands).toBeDefined();
        expect(Array.isArray(buildspecConfig.phases[phase].commands)).toBe(true);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing test files', () => {
      const testFiles = [
        'tests/unit/simple-user-service.test.ts',
        'tests/unit/simple-billing-service-complete.test.ts',
        'tests/integration/user-billing-integration.test.ts',
        'tests/unit/simple-services-validation.test.ts'
      ];

      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      testFiles.forEach(file => {
        expect(commands).toContain(file);
      });
    });

    it('should maintain compatibility with package.json scripts', () => {
      if (existsSync('package.json')) {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
        const buildCommands = buildspecConfig.phases.build.commands.join(' ');
        
        if (buildCommands.includes('npm run type-check')) {
          expect(packageJson.scripts['type-check']).toBeDefined();
        }
        
        if (buildCommands.includes('npm run test')) {
          expect(packageJson.scripts.test).toBeDefined();
        }
      }
    });

    it('should maintain compatibility with existing directory structure', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('mkdir -p reports coverage');
      
      // Should reference existing directories
      if (commands.includes('tests/unit/')) {
        expect(existsSync('tests')).toBe(true);
      }
    });
  });
});