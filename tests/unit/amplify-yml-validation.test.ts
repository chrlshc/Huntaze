/**
 * Unit Tests - amplify.yml Configuration Validation
 * 
 * Tests to validate the AWS Amplify build configuration
 * 
 * Coverage:
 * - Build phases configuration
 * - Environment variables setup
 * - Node.js version requirements
 * - Build commands execution order
 * - Artifacts configuration
 * - Cache configuration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

describe('amplify.yml Configuration Validation', () => {
  let amplifyConfig: any;

  beforeAll(() => {
    const filePath = join(process.cwd(), 'amplify.yml');
    const fileContent = readFileSync(filePath, 'utf-8');
    amplifyConfig = parse(fileContent);
  });

  describe('Configuration Structure', () => {
    it('should have version 1', () => {
      expect(amplifyConfig.version).toBe(1);
    });

    it('should have frontend configuration', () => {
      expect(amplifyConfig.frontend).toBeDefined();
      expect(typeof amplifyConfig.frontend).toBe('object');
    });

    it('should have phases configuration', () => {
      expect(amplifyConfig.frontend.phases).toBeDefined();
      expect(typeof amplifyConfig.frontend.phases).toBe('object');
    });

    it('should have artifacts configuration', () => {
      expect(amplifyConfig.frontend.artifacts).toBeDefined();
      expect(typeof amplifyConfig.frontend.artifacts).toBe('object');
    });

    it('should have cache configuration', () => {
      expect(amplifyConfig.frontend.cache).toBeDefined();
      expect(typeof amplifyConfig.frontend.cache).toBe('object');
    });
  });

  describe('Build Phases', () => {
    it('should have preBuild phase', () => {
      expect(amplifyConfig.frontend.phases.preBuild).toBeDefined();
      expect(amplifyConfig.frontend.phases.preBuild.commands).toBeDefined();
      expect(Array.isArray(amplifyConfig.frontend.phases.preBuild.commands)).toBe(true);
    });

    it('should have build phase', () => {
      expect(amplifyConfig.frontend.phases.build).toBeDefined();
      expect(amplifyConfig.frontend.phases.build.commands).toBeDefined();
      expect(Array.isArray(amplifyConfig.frontend.phases.build.commands)).toBe(true);
    });

    it('should have at least 3 preBuild commands', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      expect(commands.length).toBeGreaterThanOrEqual(3);
    });

    it('should have at least 3 build commands', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      expect(commands.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Node.js Configuration', () => {
    it('should install Node.js 20', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const nvmCommand = commands.find((cmd: string) => cmd.includes('nvm install'));
      
      expect(nvmCommand).toBeDefined();
      expect(nvmCommand).toContain('nvm install 20');
      expect(nvmCommand).toContain('nvm use 20');
    });

    it('should verify Node.js and npm versions', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const versionCheck = commands.find((cmd: string) => 
        cmd.includes('node -v') && cmd.includes('npm -v')
      );
      
      expect(versionCheck).toBeDefined();
    });

    it('should log prebuild completion', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const completionLog = commands.find((cmd: string) => cmd.includes('PREBUILD_DONE'));
      
      expect(completionLog).toBeDefined();
    });
  });

  describe('Dependency Installation', () => {
    it('should use npm ci with fallback to npm install', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toBeDefined();
      expect(installCommand).toContain('npm ci');
      expect(installCommand).toContain('npm i');
    });

    it('should use --no-audit flag', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('--no-audit');
    });

    it('should use --no-fund flag', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('--no-fund');
    });

    it('should use --legacy-peer-deps flag', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('--legacy-peer-deps');
    });

    it('should have fallback install command', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('||');
      expect(installCommand).toContain('npm i');
    });
  });

  describe('Build Phase Commands', () => {
    it('should log build start', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const startLog = commands.find((cmd: string) => cmd.includes('BUILD_START'));
      
      expect(startLog).toBeDefined();
    });

    it('should set BUILD_REDIS_MOCK environment variable', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const redisMock = commands.find((cmd: string) => cmd.includes('BUILD_REDIS_MOCK'));
      
      expect(redisMock).toBeDefined();
      expect(redisMock).toContain('export BUILD_REDIS_MOCK=1');
    });

    it('should create .env.production file', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('cat > .env.production')
      );
      
      expect(envFileCommand).toBeDefined();
    });

    it('should run npm build', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const buildCommand = commands.find((cmd: string) => cmd.includes('npm run build'));
      
      expect(buildCommand).toBeDefined();
    });

    it('should log build completion', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const completionLog = commands.find((cmd: string) => cmd.includes('BUILD_DONE'));
      
      expect(completionLog).toBeDefined();
    });
  });

  describe('Environment Variables Configuration', () => {
    it('should configure database environment variables', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('DATABASE_URL');
      expect(envFileCommand).toContain('REDIS_URL');
    });

    it('should configure Azure OpenAI variables', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('AZURE_OPENAI_ENDPOINT');
      expect(envFileCommand).toContain('AZURE_OPENAI_DEPLOYMENT');
      expect(envFileCommand).toContain('AZURE_OPENAI_API_KEY');
      expect(envFileCommand).toContain('AZURE_OPENAI_API_VERSION');
    });

    it('should configure OpenAI fallback variables', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('OPENAI_API_KEY');
      expect(envFileCommand).toContain('OPENAI_ORG_ID');
    });

    it('should configure AWS credentials', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('AWS_REGION');
      expect(envFileCommand).toContain('AWS_ACCESS_KEY_ID');
      expect(envFileCommand).toContain('AWS_SECRET_ACCESS_KEY');
    });

    it('should configure DynamoDB tables', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('DYNAMODB_COSTS_TABLE');
      expect(envFileCommand).toContain('DYNAMODB_ALERTS_TABLE');
    });

    it('should configure SQS queues', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('SQS_URL');
      expect(envFileCommand).toContain('SQS_WORKFLOW_QUEUE');
      expect(envFileCommand).toContain('SQS_RATE_LIMITER_QUEUE');
    });

    it('should configure SNS topics', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('COST_ALERTS_SNS_TOPIC');
    });

    it('should configure cost monitoring', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('COST_ALERT_EMAIL');
      expect(envFileCommand).toContain('SLACK_WEBHOOK_URL');
      expect(envFileCommand).toContain('DAILY_COST_THRESHOLD');
      expect(envFileCommand).toContain('MONTHLY_COST_THRESHOLD');
    });

    it('should configure feature flags', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('HYBRID_ORCHESTRATOR_ENABLED');
      expect(envFileCommand).toContain('COST_MONITORING_ENABLED');
      expect(envFileCommand).toContain('RATE_LIMITER_ENABLED');
    });

    it('should configure OnlyFans integration', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('ONLYFANS_API_URL');
      expect(envFileCommand).toContain('ONLYFANS_USER_AGENT');
    });

    it('should configure authentication', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('JWT_SECRET');
      expect(envFileCommand).toContain('NEXTAUTH_SECRET');
      expect(envFileCommand).toContain('NEXTAUTH_URL');
    });

    it('should configure Stripe', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('STRIPE_SECRET_KEY');
      expect(envFileCommand).toContain('STRIPE_WEBHOOK_SECRET');
    });

    it('should configure app URLs', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('NEXT_PUBLIC_APP_URL');
      expect(envFileCommand).toContain('NEXT_PUBLIC_API_URL');
    });

    it('should configure logging', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('API_LOG_GROUP');
      expect(envFileCommand).toContain('AI_SMOKE_TOKEN');
    });

    it('should set NODE_ENV to production', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('NODE_ENV=production');
    });

    it('should log environment file creation', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const logCommand = commands.find((cmd: string) => 
        cmd.includes('wrote .env.production')
      );
      
      expect(logCommand).toBeDefined();
      expect(logCommand).toContain('hybrid orchestrator config');
    });
  });

  describe('Artifacts Configuration', () => {
    it('should have baseDirectory set to .next', () => {
      expect(amplifyConfig.frontend.artifacts.baseDirectory).toBe('.next');
    });

    it('should include all files in artifacts', () => {
      expect(amplifyConfig.frontend.artifacts.files).toBeDefined();
      expect(Array.isArray(amplifyConfig.frontend.artifacts.files)).toBe(true);
      expect(amplifyConfig.frontend.artifacts.files).toContain('**/*');
    });

    it('should have at least one file pattern', () => {
      expect(amplifyConfig.frontend.artifacts.files.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Configuration', () => {
    it('should cache node_modules', () => {
      expect(amplifyConfig.frontend.cache.paths).toBeDefined();
      expect(Array.isArray(amplifyConfig.frontend.cache.paths)).toBe(true);
      
      const nodeModulesCache = amplifyConfig.frontend.cache.paths.find(
        (path: string) => path.includes('node_modules')
      );
      expect(nodeModulesCache).toBeDefined();
    });

    it('should cache Next.js build cache', () => {
      const nextCachePath = amplifyConfig.frontend.cache.paths.find(
        (path: string) => path.includes('.next/cache')
      );
      expect(nextCachePath).toBeDefined();
    });

    it('should have at least 2 cache paths', () => {
      expect(amplifyConfig.frontend.cache.paths.length).toBeGreaterThanOrEqual(2);
    });

    it('should use wildcard patterns for cache paths', () => {
      amplifyConfig.frontend.cache.paths.forEach((path: string) => {
        expect(path).toMatch(/\*\*\/\*/);
      });
    });
  });

  describe('Command Execution Order', () => {
    it('should install Node.js before npm commands', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const nvmIndex = commands.findIndex((cmd: string) => cmd.includes('nvm install'));
      const npmIndex = commands.findIndex((cmd: string) => cmd.includes('npm ci'));
      
      expect(nvmIndex).toBeLessThan(npmIndex);
    });

    it('should verify versions after Node.js installation', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const nvmIndex = commands.findIndex((cmd: string) => cmd.includes('nvm install'));
      const versionIndex = commands.findIndex((cmd: string) => cmd.includes('node -v'));
      
      expect(nvmIndex).toBeLessThan(versionIndex);
    });

    it('should install dependencies before build', () => {
      const preBuildCommands = amplifyConfig.frontend.phases.preBuild.commands;
      const buildCommands = amplifyConfig.frontend.phases.build.commands;
      
      const hasInstall = preBuildCommands.some((cmd: string) => cmd.includes('npm ci'));
      const hasBuild = buildCommands.some((cmd: string) => cmd.includes('npm run build'));
      
      expect(hasInstall).toBe(true);
      expect(hasBuild).toBe(true);
    });

    it('should create .env.production before npm build', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envIndex = commands.findIndex((cmd: string) => cmd.includes('.env.production'));
      const buildIndex = commands.findIndex((cmd: string) => cmd.includes('npm run build'));
      
      expect(envIndex).toBeLessThan(buildIndex);
    });

    it('should log build start before creating env file', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const startIndex = commands.findIndex((cmd: string) => cmd.includes('BUILD_START'));
      const envIndex = commands.findIndex((cmd: string) => cmd.includes('.env.production'));
      
      expect(startIndex).toBeLessThan(envIndex);
    });

    it('should log build completion after npm build', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const buildIndex = commands.findIndex((cmd: string) => cmd.includes('npm run build'));
      const doneIndex = commands.findIndex((cmd: string) => cmd.includes('BUILD_DONE'));
      
      expect(buildIndex).toBeLessThan(doneIndex);
    });
  });

  describe('Security Considerations', () => {
    it('should use environment variable interpolation for secrets', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      // Check that secrets use ${VAR} syntax
      expect(envFileCommand).toMatch(/\$\{[A-Z_]+\}/);
    });

    it('should not contain hardcoded secrets', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      // Should not contain actual API keys or secrets
      expect(envFileCommand).not.toMatch(/sk-[a-zA-Z0-9]{48}/); // OpenAI key pattern
      expect(envFileCommand).not.toMatch(/[0-9a-f]{32}/); // Generic secret pattern
    });

    it('should use secure variable names', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('_SECRET');
      expect(envFileCommand).toContain('_KEY');
    });
  });

  describe('Performance Optimizations', () => {
    it('should use npm ci for faster installs', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toBeDefined();
      expect(installCommand).toContain('npm ci');
    });

    it('should skip audit for faster builds', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('--no-audit');
    });

    it('should skip funding messages', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('--no-fund');
    });

    it('should cache node_modules for faster rebuilds', () => {
      const cachePaths = amplifyConfig.frontend.cache.paths;
      const hasNodeModules = cachePaths.some((path: string) => 
        path.includes('node_modules')
      );
      
      expect(hasNodeModules).toBe(true);
    });

    it('should cache Next.js build artifacts', () => {
      const cachePaths = amplifyConfig.frontend.cache.paths;
      const hasNextCache = cachePaths.some((path: string) => 
        path.includes('.next/cache')
      );
      
      expect(hasNextCache).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should have fallback for npm install', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      expect(installCommand).toContain('||');
      expect(installCommand).toContain('npm i');
    });

    it('should use same flags for fallback install', () => {
      const commands = amplifyConfig.frontend.phases.preBuild.commands;
      const installCommand = commands.find((cmd: string) => cmd.includes('npm ci'));
      
      const parts = installCommand.split('||');
      expect(parts[0]).toContain('--no-audit');
      expect(parts[1]).toContain('--no-audit');
      expect(parts[0]).toContain('--no-fund');
      expect(parts[1]).toContain('--no-fund');
      expect(parts[0]).toContain('--legacy-peer-deps');
      expect(parts[1]).toContain('--legacy-peer-deps');
    });
  });

  describe('Build Logging', () => {
    it('should have clear phase markers', () => {
      const preBuildCommands = amplifyConfig.frontend.phases.preBuild.commands;
      const buildCommands = amplifyConfig.frontend.phases.build.commands;
      
      const hasPreBuildMarker = preBuildCommands.some((cmd: string) => 
        cmd.includes('PREBUILD')
      );
      const hasBuildMarker = buildCommands.some((cmd: string) => 
        cmd.includes('BUILD')
      );
      
      expect(hasPreBuildMarker).toBe(true);
      expect(hasBuildMarker).toBe(true);
    });

    it('should log important configuration steps', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const hasEnvLog = commands.some((cmd: string) => 
        cmd.includes('wrote .env.production')
      );
      
      expect(hasEnvLog).toBe(true);
    });

    it('should use descriptive log messages', () => {
      const allCommands = [
        ...amplifyConfig.frontend.phases.preBuild.commands,
        ...amplifyConfig.frontend.phases.build.commands
      ];
      
      const logCommands = allCommands.filter((cmd: string) => 
        cmd.includes('echo')
      );
      
      expect(logCommands.length).toBeGreaterThan(3);
    });
  });

  describe('Next.js Specific Configuration', () => {
    it('should set artifacts baseDirectory to .next', () => {
      expect(amplifyConfig.frontend.artifacts.baseDirectory).toBe('.next');
    });

    it('should cache .next/cache directory', () => {
      const cachePaths = amplifyConfig.frontend.cache.paths;
      const hasNextCache = cachePaths.some((path: string) => 
        path.includes('.next/cache')
      );
      
      expect(hasNextCache).toBe(true);
    });

    it('should run npm run build command', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const buildCommand = commands.find((cmd: string) => 
        cmd.includes('npm run build')
      );
      
      expect(buildCommand).toBeDefined();
    });

    it('should set NODE_ENV to production', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('NODE_ENV=production');
    });
  });

  describe('AWS Integration', () => {
    it('should configure all required AWS services', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      // Check for AWS service configurations
      expect(envFileCommand).toContain('AWS_REGION');
      expect(envFileCommand).toContain('SQS_');
      expect(envFileCommand).toContain('DYNAMODB_');
      expect(envFileCommand).toContain('SNS_');
    });

    it('should configure rate limiter queue', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('SQS_RATE_LIMITER_QUEUE');
    });

    it('should configure cost monitoring', () => {
      const commands = amplifyConfig.frontend.phases.build.commands;
      const envFileCommand = commands.find((cmd: string) => 
        cmd.includes('.env.production')
      );
      
      expect(envFileCommand).toContain('COST_MONITORING_ENABLED');
      expect(envFileCommand).toContain('COST_ALERTS_SNS_TOPIC');
    });
  });
});
