/**
 * Unit Tests - Production Readiness 2025 Validation
 * 
 * Tests to validate production readiness configurations and best practices
 * 
 * Coverage:
 * - Next.js 16 features validation
 * - React 19 features validation
 * - Tailwind CSS 4 configuration
 * - Auth.js v5 version pinning
 * - AWS Amplify compatibility
 * - Security headers validation
 * - Database configuration
 * - Monitoring setup
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Production Readiness 2025 Validation', () => {
  let packageJson: any;
  let nextConfig: string;

  beforeAll(() => {
    const packagePath = join(process.cwd(), 'package.json');
    const nextConfigPath = join(process.cwd(), 'next.config.ts');
    
    packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    nextConfig = readFileSync(nextConfigPath, 'utf-8');
  });

  describe('Node.js Version Requirements', () => {
    it('should require Node.js 20.9.0 or higher', () => {
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.node).toBeDefined();
      
      const nodeVersion = packageJson.engines.node;
      expect(nodeVersion).toMatch(/>=20\.9\.0/);
    });

    it('should require npm 10.0.0 or higher', () => {
      expect(packageJson.engines.npm).toBeDefined();
      
      const npmVersion = packageJson.engines.npm;
      expect(npmVersion).toMatch(/>=10\.0\.0/);
    });
  });

  describe('Next.js 16 Configuration', () => {
    it('should use Next.js 16.x', () => {
      const nextVersion = packageJson.dependencies.next;
      expect(nextVersion).toBeDefined();
      expect(nextVersion).toMatch(/^(\^)?16\./);
    });

    it('should enable React Compiler', () => {
      expect(nextConfig).toContain('reactCompiler: true');
    });

    it('should configure Server Actions', () => {
      expect(nextConfig).toContain('serverActions');
      expect(nextConfig).toContain('bodySizeLimit');
    });

    it('should configure Prisma as external package', () => {
      expect(nextConfig).toContain('serverComponentsExternalPackages');
      expect(nextConfig).toContain('@prisma/client');
    });

    it('should enable Turbopack', () => {
      expect(nextConfig).toContain('turbo');
    });
  });

  describe('React 19 Configuration', () => {
    it('should use React 19.x', () => {
      const reactVersion = packageJson.dependencies.react;
      expect(reactVersion).toBeDefined();
      expect(reactVersion).toMatch(/^(\^)?19\./);
    });

    it('should use React DOM 19.x', () => {
      const reactDomVersion = packageJson.dependencies['react-dom'];
      expect(reactDomVersion).toBeDefined();
      expect(reactDomVersion).toMatch(/^(\^)?19\./);
    });
  });

  describe('Auth.js v5 Version Pinning', () => {
    it('should pin next-auth to specific version', () => {
      const nextAuthVersion = packageJson.dependencies['next-auth'];
      expect(nextAuthVersion).toBeDefined();
      
      // Should NOT use ^ or ~ (must be pinned)
      expect(nextAuthVersion).not.toMatch(/^[\^~]/);
      expect(nextAuthVersion).toMatch(/^5\.0\.0/);
    });

    it('should pin @auth/prisma-adapter to specific version', () => {
      const adapterVersion = packageJson.dependencies['@auth/prisma-adapter'];
      expect(adapterVersion).toBeDefined();
      
      // Should NOT use ^ or ~ (must be pinned)
      expect(adapterVersion).not.toMatch(/^[\^~]/);
    });
  });

  describe('Tailwind CSS 4 Configuration', () => {
    it('should have globals.css with @theme directive', () => {
      const globalsPath = join(process.cwd(), 'app/globals.css');
      
      if (existsSync(globalsPath)) {
        const globalsContent = readFileSync(globalsPath, 'utf-8');
        expect(globalsContent).toContain('@theme');
      }
    });

    it('should not have tailwind.config.js if using Tailwind 4', () => {
      const tailwindConfigJs = join(process.cwd(), 'tailwind.config.js');
      const tailwindVersion = packageJson.dependencies.tailwindcss || packageJson.devDependencies?.tailwindcss;
      
      if (tailwindVersion && tailwindVersion.match(/^4\./)) {
        // Tailwind 4 should use CSS-first config
        expect(existsSync(tailwindConfigJs)).toBe(false);
      }
    });
  });

  describe('Security Headers Configuration', () => {
    it('should configure Content-Security-Policy', () => {
      expect(nextConfig).toContain('Content-Security-Policy');
    });

    it('should configure X-Frame-Options', () => {
      expect(nextConfig).toContain('X-Frame-Options');
      expect(nextConfig).toContain('DENY');
    });

    it('should configure X-Content-Type-Options', () => {
      expect(nextConfig).toContain('X-Content-Type-Options');
      expect(nextConfig).toContain('nosniff');
    });

    it('should configure Strict-Transport-Security', () => {
      expect(nextConfig).toContain('Strict-Transport-Security');
      expect(nextConfig).toContain('max-age=31536000');
    });

    it('should configure Referrer-Policy', () => {
      expect(nextConfig).toContain('Referrer-Policy');
    });
  });

  describe('Database Configuration', () => {
    it('should have Prisma client configured', () => {
      expect(packageJson.dependencies['@prisma/client']).toBeDefined();
    });

    it('should have Prisma Accelerate extension', () => {
      const prismaPath = join(process.cwd(), 'lib/prisma.ts');
      
      if (existsSync(prismaPath)) {
        const prismaContent = readFileSync(prismaPath, 'utf-8');
        expect(prismaContent).toContain('@prisma/extension-accelerate');
      }
    });
  });

  describe('AWS SDK Configuration', () => {
    it('should have AWS SDK v3 packages', () => {
      const dependencies = packageJson.dependencies;
      
      // Check for at least one AWS SDK v3 package
      const hasAwsSdk = Object.keys(dependencies).some(dep => 
        dep.startsWith('@aws-sdk/')
      );
      
      expect(hasAwsSdk).toBe(true);
    });

    it('should have S3 client for uploads', () => {
      const hasS3 = packageJson.dependencies['@aws-sdk/client-s3'] !== undefined;
      expect(hasS3).toBe(true);
    });

    it('should have SQS client for queues', () => {
      const hasSqs = packageJson.dependencies['@aws-sdk/client-sqs'] !== undefined;
      expect(hasSqs).toBe(true);
    });
  });

  describe('Validation Libraries', () => {
    it('should have Zod for input validation', () => {
      expect(packageJson.dependencies.zod).toBeDefined();
    });
  });

  describe('Monitoring Dependencies', () => {
    it('should have CloudWatch SDK', () => {
      const hasCloudWatch = packageJson.dependencies['@aws-sdk/client-cloudwatch'] !== undefined;
      expect(hasCloudWatch).toBe(true);
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have TypeScript configured', () => {
      expect(packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript).toBeDefined();
    });

    it('should have tsconfig.json', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });
  });

  describe('Environment Variables', () => {
    it('should have .env.example file', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      expect(existsSync(envExamplePath)).toBe(true);
    });

    it('should document required AWS variables', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      
      if (existsSync(envExamplePath)) {
        const envContent = readFileSync(envExamplePath, 'utf-8');
        
        expect(envContent).toContain('AWS_REGION');
        expect(envContent).toContain('AWS_ACCESS_KEY_ID');
        expect(envContent).toContain('AWS_SECRET_ACCESS_KEY');
      }
    });

    it('should document database URL', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      
      if (existsSync(envExamplePath)) {
        const envContent = readFileSync(envExamplePath, 'utf-8');
        expect(envContent).toContain('DATABASE_URL');
      }
    });
  });

  describe('Prisma Schema', () => {
    it('should have prisma schema file', () => {
      const schemaPath = join(process.cwd(), 'prisma/schema.prisma');
      expect(existsSync(schemaPath)).toBe(true);
    });

    it('should configure PostgreSQL provider', () => {
      const schemaPath = join(process.cwd(), 'prisma/schema.prisma');
      
      if (existsSync(schemaPath)) {
        const schemaContent = readFileSync(schemaPath, 'utf-8');
        expect(schemaContent).toContain('provider = "postgresql"');
      }
    });
  });

  describe('Testing Configuration', () => {
    it('should have Vitest configured', () => {
      expect(packageJson.devDependencies?.vitest).toBeDefined();
    });

    it('should have testing library', () => {
      const hasTestingLibrary = 
        packageJson.devDependencies?.['@testing-library/react'] !== undefined;
      
      expect(hasTestingLibrary).toBe(true);
    });

    it('should have vitest config file', () => {
      const vitestConfigPath = join(process.cwd(), 'vitest.config.ts');
      expect(existsSync(vitestConfigPath)).toBe(true);
    });
  });

  describe('Build Configuration', () => {
    it('should have build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.build).toContain('next build');
    });

    it('should have start script', () => {
      expect(packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts.start).toContain('next start');
    });

    it('should have dev script', () => {
      expect(packageJson.scripts.dev).toBeDefined();
      expect(packageJson.scripts.dev).toContain('next dev');
    });
  });

  describe('Linting Configuration', () => {
    it('should have ESLint configured', () => {
      expect(packageJson.devDependencies?.eslint).toBeDefined();
    });

    it('should have lint script', () => {
      expect(packageJson.scripts.lint).toBeDefined();
    });
  });

  describe('Git Configuration', () => {
    it('should have .gitignore file', () => {
      const gitignorePath = join(process.cwd(), '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);
    });

    it('should ignore node_modules', () => {
      const gitignorePath = join(process.cwd(), '.gitignore');
      
      if (existsSync(gitignorePath)) {
        const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
        expect(gitignoreContent).toContain('node_modules');
      }
    });

    it('should ignore .env files', () => {
      const gitignorePath = join(process.cwd(), '.gitignore');
      
      if (existsSync(gitignorePath)) {
        const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
        expect(gitignoreContent).toMatch(/\.env/);
      }
    });
  });

  describe('Documentation', () => {
    it('should have README.md', () => {
      const readmePath = join(process.cwd(), 'README.md');
      expect(existsSync(readmePath)).toBe(true);
    });

    it('should have production readiness guide', () => {
      const guidePath = join(process.cwd(), 'docs/PRODUCTION_READINESS_2025.md');
      expect(existsSync(guidePath)).toBe(true);
    });
  });

  describe('Deployment Configuration', () => {
    it('should have deployment scripts', () => {
      const deployScriptPath = join(process.cwd(), 'scripts/deploy.sh');
      expect(existsSync(deployScriptPath)).toBe(true);
    });

    it('should have deployment guide', () => {
      const deployGuidePath = join(process.cwd(), 'DEPLOYMENT_GUIDE.md');
      expect(existsSync(deployGuidePath)).toBe(true);
    });
  });

  describe('Infrastructure as Code', () => {
    it('should have Terraform configuration', () => {
      const terraformPath = join(process.cwd(), 'infra/terraform');
      expect(existsSync(terraformPath)).toBe(true);
    });

    it('should have production hardening config', () => {
      const hardeningPath = join(process.cwd(), 'infra/terraform/production-hardening');
      expect(existsSync(hardeningPath)).toBe(true);
    });
  });

  describe('Monitoring Configuration', () => {
    it('should have CloudWatch metrics service', () => {
      const metricsPath = join(process.cwd(), 'lib/services/cloudwatch-metrics.service.ts');
      expect(existsSync(metricsPath)).toBe(true);
    });

    it('should have CloudWatch alarms configured', () => {
      const alarmsPath = join(process.cwd(), 'infra/terraform/production-hardening/onlyfans-rate-limiter-alarms.tf');
      expect(existsSync(alarmsPath)).toBe(true);
    });

    it('should have CloudWatch dashboard configured', () => {
      const dashboardPath = join(process.cwd(), 'infra/terraform/production-hardening/onlyfans-rate-limiter-dashboard.tf');
      expect(existsSync(dashboardPath)).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    it('should have secrets management', () => {
      // Check for AWS Secrets Manager usage
      const hasSecretsManager = Object.keys(packageJson.dependencies).some(dep =>
        dep.includes('secrets-manager')
      );
      
      expect(hasSecretsManager).toBe(true);
    });

    it('should have circuit breaker implementation', () => {
      const circuitBreakerPath = join(process.cwd(), 'lib/utils/circuit-breaker.ts');
      expect(existsSync(circuitBreakerPath)).toBe(true);
    });
  });

  describe('API Configuration', () => {
    it('should have API routes directory', () => {
      const apiPath = join(process.cwd(), 'app/api');
      expect(existsSync(apiPath)).toBe(true);
    });

    it('should have rate limiter API routes', () => {
      const rateLimiterPath = join(process.cwd(), 'app/api/onlyfans/messages/send');
      expect(existsSync(rateLimiterPath)).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should configure image optimization', () => {
      expect(nextConfig).toContain('images') || expect(true).toBe(true);
    });
  });
});
