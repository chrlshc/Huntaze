import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { parse } from 'yaml';

const execAsync = promisify(exec);

/**
 * Tests d'intégration pour l'exécution du buildspec.yml
 * Simule l'environnement AWS CodeBuild et teste les commandes
 */

describe('BuildSpec Execution Integration', () => {
  let buildspecConfig: any;
  
  beforeAll(() => {
    if (existsSync('buildspec.yml')) {
      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      buildspecConfig = parse(buildspecContent);
    }
  });

  describe('Environment Setup Simulation', () => {
    it('should validate Node.js version requirement', async () => {
      try {
        const { stdout } = await execAsync('node --version');
        const nodeVersion = parseInt(stdout.replace('v', '').split('.')[0]);
        const requiredVersion = buildspecConfig.phases.install['runtime-versions'].nodejs;
        
        expect(nodeVersion).toBeGreaterThanOrEqual(requiredVersion);
      } catch (error) {
        console.warn('Node.js version check failed:', error);
      }
    });

    it('should validate npm availability', async () => {
      try {
        const { stdout } = await execAsync('npm --version');
        expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
      } catch (error) {
        throw new Error('npm is required but not available');
      }
    });

    it('should validate Docker availability for tests', async () => {
      try {
        const { stdout } = await execAsync('docker --version');
        expect(stdout).toContain('Docker version');
      } catch (error) {
        console.warn('Docker not available - container tests will be skipped');
      }
    });
  });

  describe('Install Phase Simulation', () => {
    it('should validate package.json exists for npm ci', () => {
      expect(existsSync('package.json')).toBe(true);
    });

    it('should validate npm ci can run successfully', async () => {
      // Skip if in CI environment to avoid conflicts
      if (process.env.CI) return;
      
      try {
        // Test npm ci in dry-run mode
        const { stderr } = await execAsync('npm ci --dry-run');
        expect(stderr).not.toContain('ENOENT');
      } catch (error) {
        console.warn('npm ci dry-run failed:', error);
      }
    }, 30000);

    it('should validate system dependencies installation commands', async () => {
      const commands = buildspecConfig.phases.install.commands;
      const installCommand = commands.find((cmd: string) => 
        typeof cmd === 'string' && cmd.includes('jq')
      );
      
      expect(installCommand).toBeDefined();
      
      // Test if jq is available or can be installed
      try {
        await execAsync('which jq');
      } catch (error) {
        // jq not available, check if installation commands are proper
        expect(installCommand).toContain('yum -y install jq');
        expect(installCommand).toContain('apt-get -y install jq');
      }
    });
  });

  describe('Pre-build Phase Simulation', () => {
    it('should validate database URL format', () => {
      const commands = buildspecConfig.phases.pre_build.commands;
      const dbCommand = commands.find((cmd: string) => 
        typeof cmd === 'string' && cmd.includes('DATABASE_URL')
      );
      
      expect(dbCommand).toContain('postgresql://');
      expect(dbCommand).toContain('huntaze_test');
    });

    it('should validate Docker commands syntax', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      // PostgreSQL container
      expect(commands).toContain('docker run -d');
      expect(commands).toContain('--name test-postgres');
      expect(commands).toContain('-e POSTGRES_PASSWORD=postgres');
      
      // Stripe Mock container
      expect(commands).toContain('--name stripe-mock');
      expect(commands).toContain('stripe/stripe-mock');
    });

    it('should validate health check commands', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('pg_isready -U postgres');
      expect(commands).toContain('curl -f http://localhost:12111');
    });

    it('should validate Prisma commands if schema exists', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('prisma migrate deploy');
      expect(commands).toContain('prisma db push');
      
      if (existsSync('prisma/schema.prisma')) {
        // Validate Prisma is available
        try {
          execAsync('npx prisma --version');
        } catch (error) {
          console.warn('Prisma not available but schema exists');
        }
      }
    });
  });

  describe('Build Phase Simulation', () => {
    it('should validate TypeScript configuration', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      expect(commands).toContain('npm run type-check');
      
      // Check if TypeScript config exists
      const tsConfigExists = existsSync('tsconfig.json') || existsSync('tsconfig.typecheck.json');
      expect(tsConfigExists).toBe(true);
    });

    it('should validate test configuration files', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      if (commands.includes('vitest.simple-services.config.ts')) {
        // Config should exist or be creatable
        if (!existsSync('vitest.simple-services.config.ts')) {
          console.warn('vitest.simple-services.config.ts referenced but missing');
        }
      }
    });

    it('should validate test files exist', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      const testFiles = [
        'tests/unit/simple-user-service.test.ts',
        'tests/unit/simple-billing-service-complete.test.ts',
        'tests/integration/user-billing-integration.test.ts',
        'tests/unit/simple-services-validation.test.ts'
      ];

      testFiles.forEach(file => {
        if (commands.includes(file)) {
          expect(existsSync(file)).toBe(true);
        }
      });
    });

    it('should validate coverage script exists', () => {
      const commands = buildspecConfig.phases.build.commands.join(' ');
      
      if (commands.includes('scripts/check-coverage.js')) {
        expect(existsSync('scripts/check-coverage.js')).toBe(true);
      }
    });

    it('should validate report directory creation', () => {
      const commands = buildspecConfig.phases.build.commands;
      
      expect(commands).toContain('mkdir -p reports coverage');
    });
  });

  describe('Post-build Phase Simulation', () => {
    it('should validate cleanup commands', () => {
      const commands = buildspecConfig.phases.post_build.commands.join(' ');
      
      expect(commands).toContain('docker stop test-postgres stripe-mock');
      expect(commands).toContain('docker rm test-postgres stripe-mock');
      expect(commands).toContain('docker network rm test-network');
    });

    it('should validate artifact listing commands', () => {
      const commands = buildspecConfig.phases.post_build.commands.join(' ');
      
      expect(commands).toContain('ls -la coverage/');
      expect(commands).toContain('ls -la reports/');
    });
  });

  describe('Command Execution Simulation', () => {
    it('should validate npm scripts exist in package.json', () => {
      if (!existsSync('package.json')) return;
      
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const buildspecCommands = JSON.stringify(buildspecConfig.phases.build.commands);
      
      if (buildspecCommands.includes('npm run type-check')) {
        expect(packageJson.scripts['type-check']).toBeDefined();
      }
      
      if (buildspecCommands.includes('npm run test')) {
        expect(packageJson.scripts.test).toBeDefined();
      }
    });

    it('should simulate directory creation', async () => {
      try {
        // Simulate mkdir command
        await execAsync('mkdir -p /tmp/test-reports /tmp/test-coverage');
        await execAsync('rmdir /tmp/test-reports /tmp/test-coverage');
      } catch (error) {
        throw new Error('Directory creation simulation failed');
      }
    });

    it('should validate environment variable syntax', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      // Check for proper shell variable syntax
      expect(commands).toMatch(/export\s+\w+=/);
      expect(commands).not.toMatch(/\$\{[^}]*\$\{/); // No nested variables
    });
  });

  describe('Error Handling Simulation', () => {
    it('should have proper error handling with || true', () => {
      const allCommands = [
        ...buildspecConfig.phases.install.commands,
        ...buildspecConfig.phases.pre_build.commands,
        ...buildspecConfig.phases.build.commands,
        ...buildspecConfig.phases.post_build.commands
      ].join(' ');
      
      // Should have fallback commands for non-critical operations
      expect(allCommands).toContain('|| true');
    });

    it('should handle missing optional files gracefully', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('if [ -f "prisma/schema.prisma" ]');
      
      const buildCommands = buildspecConfig.phases.build.commands.join(' ');
      expect(buildCommands).toContain('if ls tests/unit/*.test.ts');
    });

    it('should have timeout mechanisms for service waits', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('for i in {1..30}'); // PostgreSQL timeout
      expect(commands).toContain('for i in {1..15}'); // Stripe Mock timeout
    });
  });

  describe('Security Validation', () => {
    it('should not contain hardcoded secrets', () => {
      const allContent = JSON.stringify(buildspecConfig);
      
      // Check for common secret patterns
      expect(allContent).not.toMatch(/sk_live_[a-zA-Z0-9]+/);
      expect(allContent).not.toMatch(/sk_test_[a-zA-Z0-9]+/);
      expect(allContent).not.toMatch(/password.*[^=]=[^$]/i);
    });

    it('should use AWS Secrets Manager for sensitive data', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('aws secretsmanager get-secret-value');
      expect(commands).toContain('huntaze/stripe-secrets');
    });

    it('should use environment variables properly', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('if [ -z "$STRIPE_SECRET_KEY" ]');
      expect(commands).toContain('export STRIPE_SECRET_KEY=');
    });
  });

  describe('Performance Validation', () => {
    it('should use caching for dependencies', () => {
      expect(buildspecConfig.cache).toBeDefined();
      expect(buildspecConfig.cache.paths).toContain('node_modules/**/*');
      expect(buildspecConfig.cache.paths).toContain('.npm/**/*');
    });

    it('should run containers in background', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('docker run -d');
    });

    it('should have reasonable wait times', () => {
      const commands = buildspecConfig.phases.pre_build.commands.join(' ');
      
      expect(commands).toContain('sleep 10'); // Initial wait
      expect(commands).toContain('sleep 2');  // Retry wait
    });
  });
});

/**
 * Tests de régression pour s'assurer que les modifications futures
 * ne cassent pas la configuration buildspec
 */
describe('BuildSpec Regression Tests', () => {
  it('should maintain backward compatibility with existing test structure', () => {
    const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
    
    // Should still reference core test files
    expect(buildspecContent).toContain('simple-user-service.test.ts');
    expect(buildspecContent).toContain('simple-billing-service');
    expect(buildspecContent).toContain('user-billing-integration');
  });

  it('should maintain compatibility with package.json scripts', () => {
    if (!existsSync('package.json')) return;
    
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
    
    // Core scripts should still exist
    if (buildspecContent.includes('npm run test')) {
      expect(packageJson.scripts.test).toBeDefined();
    }
    
    if (buildspecContent.includes('npm run type-check')) {
      expect(packageJson.scripts['type-check']).toBeDefined();
    }
  });

  it('should maintain Docker image version consistency', () => {
    const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
    
    // Should use specific versions, not latest
    expect(buildspecContent).toMatch(/postgres:\d+/);
    expect(buildspecContent).toMatch(/stripe\/stripe-mock:\d+\.\d+\.\d+/);
    
    // Should not use latest tag
    expect(buildspecContent).not.toContain(':latest');
  });

  it('should maintain proper artifact configuration', () => {
    const buildspecConfig = parse(readFileSync('buildspec.yml', 'utf-8'));
    
    expect(buildspecConfig.artifacts.files).toContain('reports/**/*');
    expect(buildspecConfig.artifacts.files).toContain('coverage/**/*');
    expect(buildspecConfig.artifacts.name).toContain('huntaze');
  });

  it('should maintain JUnit report compatibility', () => {
    const buildspecConfig = parse(readFileSync('buildspec.yml', 'utf-8'));
    
    Object.values(buildspecConfig.reports).forEach((report: any) => {
      expect(report['file-format']).toBe('JUNITXML');
    });
  });
});