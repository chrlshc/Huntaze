import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests d'intégration pour la configuration de déploiement
 * Valide la cohérence entre le guide et les fichiers de configuration réels
 */

// Simple YAML parser for basic key-value extraction
function parseSimpleYaml(content: string): any {
  const lines = content.split('\n');
  const result: any = {};
  let currentKey = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        if (value) {
          result[key] = value;
        }
        currentKey = key;
      }
    }
  }
  
  return result;
}

describe('Deployment Configuration Integration', () => {
  let guideContent: string;

  beforeEach(() => {
    if (existsSync('HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md')) {
      guideContent = readFileSync('HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md', 'utf-8');
    }
  });

  describe('BuildSpec Integration', () => {
    it('should match buildspec.yml Node.js version', () => {
      if (!existsSync('buildspec.yml')) return;

      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Extract Node.js version from buildspec
      const nodeMatch = buildspecContent.match(/nodejs:\s*(\d+)/);
      
      if (nodeMatch) {
        const nodeVersion = nodeMatch[1];
        expect(guideContent).toContain(`Node.js ${nodeVersion}`);
      }
    });

    it('should reference correct buildspec phases', () => {
      if (!existsSync('buildspec.yml')) return;

      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Check for main phases
      const phases = ['install', 'pre_build', 'build', 'post_build'];
      
      phases.forEach(phase => {
        if (buildspecContent.includes(`${phase}:`)) {
          expect(guideContent).toContain(phase);
        }
      });
    });

    it('should document correct artifact configuration', () => {
      if (!existsSync('buildspec.yml')) return;

      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Extract artifact name
      const artifactMatch = buildspecContent.match(/name:\s*([^\n]+)/);
      
      if (artifactMatch) {
        const artifactName = artifactMatch[1].trim();
        expect(guideContent).toContain(artifactName);
      }
    });
  });

  describe('Package.json Integration', () => {
    it('should reference existing npm scripts', () => {
      if (!existsSync('package.json')) return;

      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Extract script references from guide
      const scriptMatches = guideContent.match(/npm run [\w:-]+/g) || [];
      
      scriptMatches.forEach(match => {
        const scriptName = match.replace('npm run ', '');
        
        // Verify script exists in package.json
        if (scriptName !== 'start' && scriptName !== 'build') {
          // These are standard scripts that might not be in package.json
          const scriptExists = packageJson.scripts?.[scriptName] !== undefined;
          
          if (!scriptExists) {
            console.warn(`Script referenced in guide but not found: ${scriptName}`);
          }
        }
      });
    });

    it('should match Next.js version', () => {
      if (!existsSync('package.json')) return;

      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const nextVersion = packageJson.dependencies?.next;

      if (nextVersion) {
        const majorVersion = nextVersion.match(/\d+/)?.[0];
        if (majorVersion) {
          expect(guideContent).toContain(`Next.js ${majorVersion}`);
        }
      }
    });

    it('should reference correct Node.js version', () => {
      if (!existsSync('package.json')) return;

      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const nodeVersion = packageJson.engines?.node;

      if (nodeVersion) {
        // Extract major version
        const majorVersion = nodeVersion.match(/\d+/)?.[0];
        if (majorVersion) {
          expect(guideContent).toContain(`nodejs: ${majorVersion}`);
        }
      }
    });
  });

  describe('Docker Configuration Integration', () => {
    it('should match docker-compose services', () => {
      if (!existsSync('docker/test.yml')) return;

      const dockerContent = readFileSync('docker/test.yml', 'utf-8');
      
      // Check for services
      if (dockerContent.includes('postgres')) {
        expect(guideContent).toContain('PostgreSQL');
      }
      if (dockerContent.includes('redis')) {
        expect(guideContent).toContain('Redis');
      }
      if (dockerContent.includes('stripe-mock')) {
        expect(guideContent).toContain('Stripe Mock');
      }
    });

    it('should reference correct PostgreSQL version', () => {
      if (!existsSync('docker/test.yml')) return;

      const dockerContent = readFileSync('docker/test.yml', 'utf-8');
      
      const postgresMatch = dockerContent.match(/postgres:(\d+)/);
      if (postgresMatch) {
        const version = postgresMatch[1];
        expect(guideContent).toContain(`PostgreSQL ${version}`);
      }
    });
  });

  describe('Azure Configuration Integration', () => {
    it('should match Azure OpenAI endpoint', () => {
      const azureDocs = [
        'docs/AZURE_OPENAI_SETUP.md',
        'AZURE_COMPLETE_SETUP.md',
        'AZURE_OPENAI_INTEGRATION_COMPLETE.md'
      ];

      azureDocs.forEach(docPath => {
        if (existsSync(docPath)) {
          const docContent = readFileSync(docPath, 'utf-8');
          
          const endpointMatch = docContent.match(/https:\/\/[\w-]+\.openai\.azure\.com/);
          if (endpointMatch) {
            expect(guideContent).toContain(endpointMatch[0]);
          }
        }
      });
    });

    it('should reference correct Azure resource group', () => {
      if (existsSync('docs/AZURE_MULTI_AGENTS_SETUP.md')) {
        const azureDoc = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
        
        const rgMatch = azureDoc.match(/Resource Group:\s*([\w-]+)/);
        if (rgMatch) {
          expect(guideContent).toContain(rgMatch[1]);
        }
      }
    });

    it('should document correct AI models', () => {
      expect(guideContent).toContain('gpt-4o');
      expect(guideContent).toContain('gpt-4o-mini');
    });
  });

  describe('AWS Configuration Integration', () => {
    it('should match CloudFormation template', () => {
      if (!existsSync('cloudformation/codebuild-simple-services.yml')) return;

      const cfContent = readFileSync('cloudformation/codebuild-simple-services.yml', 'utf-8');
      
      // Extract project name
      const projectMatch = cfContent.match(/Default:\s*huntaze-[\w-]+/);
      if (projectMatch) {
        const projectName = projectMatch[0].replace('Default:', '').trim();
        expect(guideContent).toContain(projectName);
      }
    });

    it('should reference correct S3 bucket names', () => {
      const bucketNames = [
        'huntaze-media-prod',
        'huntaze-backups',
        'huntaze-test-artifacts'
      ];

      bucketNames.forEach(bucket => {
        expect(guideContent).toContain(bucket);
      });
    });

    it('should document correct AWS regions', () => {
      expect(guideContent).toContain('us-east-1');
      expect(guideContent).toContain('East US 2');
    });
  });

  describe('Environment Variables Consistency', () => {
    it('should document all critical environment variables', () => {
      const criticalVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_URL',
        'DATABASE_URL',
        'AZURE_OPENAI_API_KEY',
        'STRIPE_SECRET_KEY',
        'AWS_REGION'
      ];

      criticalVars.forEach(varName => {
        expect(guideContent).toContain(varName);
      });
    });

    it('should match example environment files', () => {
      const envFiles = [
        '.env.example',
        '.env.production.example',
        '.env.local.example'
      ];

      envFiles.forEach(envFile => {
        if (existsSync(envFile)) {
          const envContent = readFileSync(envFile, 'utf-8');
          
          // Extract variable names
          const varMatches = envContent.match(/^[A-Z_][A-Z0-9_]*=/gm) || [];
          
          varMatches.forEach(match => {
            const varName = match.replace('=', '');
            
            // Check if important variables are documented
            if (['DATABASE_URL', 'AZURE_OPENAI_API_KEY', 'STRIPE_SECRET_KEY'].includes(varName)) {
              expect(guideContent).toContain(varName);
            }
          });
        }
      });
    });
  });

  describe('Database Schema Consistency', () => {
    it('should match Prisma schema if exists', () => {
      if (!existsSync('prisma/schema.prisma')) return;

      const schemaContent = readFileSync('prisma/schema.prisma', 'utf-8');
      
      // Check for main tables
      const tables = ['User', 'Subscription', 'Content'];
      
      tables.forEach(table => {
        if (schemaContent.includes(`model ${table}`)) {
          expect(guideContent).toContain(table.toLowerCase());
        }
      });
    });

    it('should document correct migration commands', () => {
      expect(guideContent).toContain('prisma migrate');
      expect(guideContent).toContain('prisma migrate deploy');
    });
  });

  describe('CI/CD Workflow Consistency', () => {
    it('should match GitHub Actions workflow if exists', () => {
      const workflowPath = '.github/workflows/ci.yml';
      
      if (existsSync(workflowPath)) {
        const workflowContent = readFileSync(workflowPath, 'utf-8');
        
        // Check for common job names
        const jobs = ['test', 'build', 'deploy'];
        
        jobs.forEach(job => {
          if (workflowContent.includes(`${job}:`)) {
            expect(guideContent).toContain(job);
          }
        });
      }
    });

    it('should document correct deployment platforms', () => {
      const platforms = ['Vercel', 'AWS Amplify'];
      
      platforms.forEach(platform => {
        expect(guideContent).toContain(platform);
      });
    });
  });

  describe('Security Configuration Consistency', () => {
    it('should reference AWS Secrets Manager', () => {
      expect(guideContent).toContain('AWS Secrets Manager');
      expect(guideContent).toContain('huntaze/stripe-secrets');
    });

    it('should not contain hardcoded secrets', () => {
      // Check for common secret patterns
      expect(guideContent).not.toMatch(/sk_live_[a-zA-Z0-9]{24,}/);
      expect(guideContent).not.toMatch(/sk_test_[a-zA-Z0-9]{24,}/);
      expect(guideContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      
      // Should use placeholders
      expect(guideContent).toContain('<your-');
      expect(guideContent).toContain('<id>');
    });

    it('should document security headers', () => {
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Strict-Transport-Security',
        'Referrer-Policy'
      ];

      securityHeaders.forEach(header => {
        expect(guideContent).toContain(header);
      });
    });
  });

  describe('Monitoring and Observability', () => {
    it('should document monitoring services', () => {
      const services = ['Sentry', 'DataDog', 'CloudWatch'];
      
      services.forEach(service => {
        expect(guideContent).toContain(service);
      });
    });

    it('should define SLOs and metrics', () => {
      expect(guideContent).toContain('Response time');
      expect(guideContent).toContain('Error rate');
      expect(guideContent).toContain('Uptime');
    });

    it('should document alerting configuration', () => {
      expect(guideContent).toContain('Alertes');
      expect(guideContent).toContain('PagerDuty');
      expect(guideContent).toContain('Slack');
    });
  });

  describe('Deployment Procedures', () => {
    it('should reference existing deployment scripts', () => {
      // Only check for scripts that are actually referenced in the guide
      if (existsSync('scripts/deploy-aws-infrastructure.sh')) {
        expect(guideContent).toContain('deploy-aws-infrastructure.sh');
      }
    });

    it('should document rollback procedures', () => {
      expect(guideContent).toContain('Rollback');
      expect(guideContent).toContain('vercel rollback');
    });

    it('should include pre-deployment checklist', () => {
      expect(guideContent).toContain('Checklist');
      expect(guideContent).toContain('Tests passent');
      expect(guideContent).toContain('Coverage');
    });
  });

  describe('Documentation Cross-References', () => {
    it('should be consistent with other deployment docs', () => {
      const relatedDocs = [
        'AWS_DEPLOYMENT_GUIDE.md',
        'HUNTAZE_DEPLOYMENT_QUICK_REFERENCE.md'
      ];

      relatedDocs.forEach(doc => {
        if (existsSync(doc)) {
          const docContent = readFileSync(doc, 'utf-8');
          
          // Check for common configuration values
          if (docContent.includes('huntaze-simple-services')) {
            expect(guideContent).toContain('huntaze-simple-services');
          }
        }
      });
    });

    it('should reference architecture documentation', () => {
      if (existsSync('ARCHITECTURE_COMPLETE.md')) {
        expect(guideContent).toContain('Architecture');
      }
    });
  });
});
