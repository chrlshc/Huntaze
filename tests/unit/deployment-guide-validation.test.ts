import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md
 * Valide la structure, le contenu et la cohérence du guide de déploiement
 */

describe('Deployment Guide Validation', () => {
  let guideContent: string;

  beforeEach(() => {
    if (existsSync('HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md')) {
      guideContent = readFileSync('HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md', 'utf-8');
    }
  });

  describe('File Structure', () => {
    it('should have deployment guide file', () => {
      expect(existsSync('HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md')).toBe(true);
    });

    it('should have proper markdown structure', () => {
      expect(guideContent).toContain('# 🚀 Guide Complet de Déploiement Huntaze');
      expect(guideContent).toContain('## 📋 Table des Matières');
    });

    it('should have all main sections', () => {
      const requiredSections = [
        '## 🏗️ Architecture Globale',
        '## ⚙️ Configuration Environnement',
        '## ☁️ Services Azure',
        '## 🔧 Infrastructure AWS',
        '## 🔄 CI/CD Pipeline',
        '## 💾 Base de Données',
        '## 🔌 Services Externes',
        '## 🚀 Déploiement Production'
      ];

      requiredSections.forEach(section => {
        expect(guideContent).toContain(section);
      });
    });
  });

  describe('Architecture Section', () => {
    it('should document complete tech stack', () => {
      expect(guideContent).toContain('Frontend:  Next.js 14 + React 18 + TypeScript');
      expect(guideContent).toContain('Backend:   Next.js API Routes + Serverless');
      expect(guideContent).toContain('Database:  PostgreSQL');
      expect(guideContent).toContain('AI:        Azure OpenAI');
      expect(guideContent).toContain('Payment:   Stripe');
    });

    it('should include architecture diagram', () => {
      expect(guideContent).toContain('Users / Clients');
      expect(guideContent).toContain('CloudFront CDN');
      expect(guideContent).toContain('Next.js App');
      expect(guideContent).toContain('Azure OpenAI');
      expect(guideContent).toContain('PostgreSQL');
    });

    it('should document all infrastructure components', () => {
      const components = [
        'Vercel',
        'AWS Amplify',
        'CloudFront',
        'S3',
        'Supabase',
        'Stripe'
      ];

      components.forEach(component => {
        expect(guideContent).toContain(component);
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should document all environment types', () => {
      expect(guideContent).toContain('.env.production');
      expect(guideContent).toContain('.env.staging');
      expect(guideContent).toContain('.env.local');
    });

    it('should include all critical environment variables', () => {
      const criticalVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_URL',
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_ENDPOINT',
        'DATABASE_URL',
        'STRIPE_SECRET_KEY',
        'AWS_REGION',
        'NEXTAUTH_SECRET'
      ];

      criticalVars.forEach(varName => {
        expect(guideContent).toContain(varName);
      });
    });

    it('should document Azure OpenAI configuration', () => {
      expect(guideContent).toContain('AZURE_OPENAI_API_KEY');
      expect(guideContent).toContain('AZURE_OPENAI_ENDPOINT');
      expect(guideContent).toContain('AZURE_OPENAI_API_VERSION');
      expect(guideContent).toContain('AZURE_OPENAI_DEPLOYMENT');
    });

    it('should document AI routing configuration', () => {
      expect(guideContent).toContain('DEFAULT_AI_MODEL');
      expect(guideContent).toContain('DEFAULT_AI_PROVIDER');
      expect(guideContent).toContain('ENABLE_AI_ROUTING');
      expect(guideContent).toContain('ENABLE_PROMPT_CACHING');
    });

    it('should document multi-agent configuration', () => {
      expect(guideContent).toContain('AZURE_SUBSCRIPTION_ID');
      expect(guideContent).toContain('AZURE_RESOURCE_GROUP');
      expect(guideContent).toContain('AZURE_PROJECT_NAME');
      expect(guideContent).toContain('ENABLE_AZURE_AI_TEAM');
    });

    it('should document Stripe configuration', () => {
      expect(guideContent).toContain('STRIPE_SECRET_KEY');
      expect(guideContent).toContain('STRIPE_PUBLISHABLE_KEY');
      expect(guideContent).toContain('STRIPE_WEBHOOK_SECRET');
      expect(guideContent).toContain('STRIPE_PRO_MONTHLY_PRICE_ID');
    });

    it('should document AWS configuration', () => {
      expect(guideContent).toContain('AWS_REGION');
      expect(guideContent).toContain('AWS_ACCESS_KEY_ID');
      expect(guideContent).toContain('AWS_SECRET_ACCESS_KEY');
      expect(guideContent).toContain('AWS_S3_BUCKET');
    });

    it('should include next.config.js configuration', () => {
      expect(guideContent).toContain('next.config.js');
      expect(guideContent).toContain('Image optimization');
      expect(guideContent).toContain('Headers de sécurité');
      expect(guideContent).toContain('X-Frame-Options');
      expect(guideContent).toContain('Strict-Transport-Security');
    });
  });

  describe('Azure Services Configuration', () => {
    it('should document Azure OpenAI setup', () => {
      expect(guideContent).toContain('Resource Group: huntaze-ai-rg');
      expect(guideContent).toContain('Location: East US 2');
      expect(guideContent).toContain('huntaze-ai-eus2-29796');
    });

    it('should document AI deployments', () => {
      expect(guideContent).toContain('gpt-4o');
      expect(guideContent).toContain('gpt-4o-mini');
      expect(guideContent).toContain('100K TPM');
      expect(guideContent).toContain('500K TPM');
    });

    it('should include Azure CLI commands', () => {
      expect(guideContent).toContain('az cognitiveservices');
      expect(guideContent).toContain('curl https://huntaze-ai-eus2-29796.openai.azure.com');
    });

    it('should document multi-agent system', () => {
      expect(guideContent).toContain('Azure AI Team');
      expect(guideContent).toContain('Content Creator Agent');
      expect(guideContent).toContain('Analytics Agent');
      expect(guideContent).toContain('Moderation Agent');
      expect(guideContent).toContain('Strategy Agent');
    });
  });

  describe('AWS Infrastructure Configuration', () => {
    it('should document CodeBuild configuration', () => {
      expect(guideContent).toContain('AWS CodeBuild');
      expect(guideContent).toContain('huntaze-simple-services');
      expect(guideContent).toContain('BUILD_GENERAL1_MEDIUM');
      expect(guideContent).toContain('buildspec.yml');
    });

    it('should document build phases', () => {
      expect(guideContent).toContain('install:');
      expect(guideContent).toContain('pre_build:');
      expect(guideContent).toContain('build:');
      expect(guideContent).toContain('post_build:');
    });

    it('should document S3 buckets', () => {
      expect(guideContent).toContain('huntaze-media-prod');
      expect(guideContent).toContain('huntaze-backups');
      expect(guideContent).toContain('huntaze-test-artifacts');
    });

    it('should document Secrets Manager', () => {
      expect(guideContent).toContain('AWS Secrets Manager');
      expect(guideContent).toContain('huntaze/stripe-secrets');
      expect(guideContent).toContain('huntaze/database');
      expect(guideContent).toContain('huntaze/azure');
    });

    it('should document CloudFront CDN', () => {
      expect(guideContent).toContain('AWS CloudFront');
      expect(guideContent).toContain('huntaze-media-prod.s3.amazonaws.com');
      expect(guideContent).toContain('CacheTTL');
    });
  });

  describe('CI/CD Pipeline Configuration', () => {
    it('should document GitHub Actions workflow', () => {
      expect(guideContent).toContain('GitHub Actions');
      expect(guideContent).toContain('.github/workflows/ci.yml');
      expect(guideContent).toContain('on:');
      expect(guideContent).toContain('jobs:');
    });

    it('should include test job configuration', () => {
      expect(guideContent).toContain('test:');
      expect(guideContent).toContain('runs-on: ubuntu-latest');
      expect(guideContent).toContain('services:');
      expect(guideContent).toContain('postgres:');
    });

    it('should include deployment workflow', () => {
      expect(guideContent).toContain('deploy:');
      expect(guideContent).toContain('needs: test');
      expect(guideContent).toContain('Deploy to Vercel');
    });

    it('should document deployment flow', () => {
      expect(guideContent).toContain('Push code → GitHub');
      expect(guideContent).toContain('Trigger →');
      expect(guideContent).toContain('Tests →');
      expect(guideContent).toContain('Build →');
      expect(guideContent).toContain('Deploy →');
    });
  });

  describe('Database Configuration', () => {
    it('should document PostgreSQL setup', () => {
      expect(guideContent).toContain('PostgreSQL (Supabase)');
      expect(guideContent).toContain('PostgreSQL 15');
      expect(guideContent).toContain('db.t3.medium');
    });

    it('should include database schema', () => {
      expect(guideContent).toContain('CREATE TABLE users');
      expect(guideContent).toContain('CREATE TABLE subscriptions');
      expect(guideContent).toContain('CREATE TABLE content');
      expect(guideContent).toContain('CREATE TABLE analytics');
    });

    it('should document migration commands', () => {
      expect(guideContent).toContain('npx prisma migrate dev');
      expect(guideContent).toContain('npx prisma migrate deploy');
      expect(guideContent).toContain('npx prisma migrate reset');
    });

    it('should document Redis cache', () => {
      expect(guideContent).toContain('Redis (Cache)');
      expect(guideContent).toContain('AWS ElastiCache');
      expect(guideContent).toContain('Session storage');
      expect(guideContent).toContain('API rate limiting');
    });
  });

  describe('External Services Configuration', () => {
    it('should document Stripe integration', () => {
      expect(guideContent).toContain('Stripe (Payments)');
      expect(guideContent).toContain('Webhook Endpoint');
      expect(guideContent).toContain('customer.subscription.created');
      expect(guideContent).toContain('invoice.payment_succeeded');
    });

    it('should document pricing plans', () => {
      expect(guideContent).toContain('Pro Monthly');
      expect(guideContent).toContain('$29/month');
      expect(guideContent).toContain('Pro Yearly');
      expect(guideContent).toContain('$290/year');
      expect(guideContent).toContain('Enterprise Monthly');
      expect(guideContent).toContain('$99/month');
    });

    it('should document monitoring services', () => {
      expect(guideContent).toContain('Sentry (Error Tracking)');
      expect(guideContent).toContain('DataDog (APM)');
      expect(guideContent).toContain('Sentry.init');
      expect(guideContent).toContain('dd-trace');
    });
  });

  describe('Production Deployment', () => {
    it('should include pre-deployment checklist', () => {
      expect(guideContent).toContain('Checklist Pré-Déploiement');
      expect(guideContent).toContain('Tests passent à 100%');
      expect(guideContent).toContain('Coverage > 80%');
      expect(guideContent).toContain('Type check OK');
      expect(guideContent).toContain('Secrets configurés');
    });

    it('should document deployment commands', () => {
      expect(guideContent).toContain('npm run build');
      expect(guideContent).toContain('vercel --prod');
      expect(guideContent).toContain('deploy-aws-infrastructure.sh');
      expect(guideContent).toContain('prisma:migrate:deploy');
    });

    it('should include rollback procedure', () => {
      expect(guideContent).toContain('Rollback Procedure');
      expect(guideContent).toContain('vercel rollback');
      expect(guideContent).toContain('aws amplify start-deployment');
      expect(guideContent).toContain('prisma migrate resolve');
    });

    it('should document monitoring metrics', () => {
      expect(guideContent).toContain('Métriques Clés');
      expect(guideContent).toContain('Response time < 200ms');
      expect(guideContent).toContain('Error rate < 0.1%');
      expect(guideContent).toContain('Uptime > 99.9%');
    });

    it('should document alerting', () => {
      expect(guideContent).toContain('Alertes');
      expect(guideContent).toContain('PagerDuty');
      expect(guideContent).toContain('Slack');
      expect(guideContent).toContain('Email');
    });
  });

  describe('Security Best Practices', () => {
    it('should document security headers', () => {
      expect(guideContent).toContain('X-Frame-Options');
      expect(guideContent).toContain('X-Content-Type-Options');
      expect(guideContent).toContain('Strict-Transport-Security');
      expect(guideContent).toContain('Referrer-Policy');
    });

    it('should use secure secret management', () => {
      expect(guideContent).toContain('AWS Secrets Manager');
      expect(guideContent).not.toMatch(/sk_live_[a-zA-Z0-9]{24,}/);
      expect(guideContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    it('should document SSL/TLS configuration', () => {
      expect(guideContent).toContain('SSL');
      expect(guideContent).toContain('ACM Certificate');
      expect(guideContent).toContain('DATABASE_SSL=true');
    });
  });

  describe('Consistency with Existing Infrastructure', () => {
    it('should match buildspec.yml configuration', () => {
      if (existsSync('buildspec.yml')) {
        const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
        
        // Verify Node.js version consistency
        if (buildspecContent.includes('nodejs: 20')) {
          expect(guideContent).toContain('Node.js 20');
        }
        
        // Verify PostgreSQL version consistency
        if (buildspecContent.includes('postgres:15')) {
          expect(guideContent).toContain('PostgreSQL 15');
        }
      }
    });

    it('should match package.json scripts', () => {
      if (existsSync('package.json')) {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
        
        // Verify documented scripts exist
        if (guideContent.includes('npm run build')) {
          expect(packageJson.scripts.build).toBeDefined();
        }
        
        if (guideContent.includes('npm run type-check')) {
          expect(packageJson.scripts['type-check']).toBeDefined();
        }
      }
    });

    it('should match Azure configuration in docs', () => {
      if (existsSync('docs/AZURE_OPENAI_SETUP.md')) {
        const azureDoc = readFileSync('docs/AZURE_OPENAI_SETUP.md', 'utf-8');
        
        // Verify endpoint consistency
        if (azureDoc.includes('huntaze-ai-eus2-29796')) {
          expect(guideContent).toContain('huntaze-ai-eus2-29796');
        }
      }
    });

    it('should reference existing deployment scripts', () => {
      if (existsSync('scripts/deploy-aws-infrastructure.sh')) {
        expect(guideContent).toContain('deploy-aws-infrastructure.sh');
      }
    });
  });

  describe('Documentation Quality', () => {
    it('should have proper code block formatting', () => {
      const codeBlocks = guideContent.match(/```[\s\S]*?```/g);
      expect(codeBlocks).toBeDefined();
      expect(codeBlocks!.length).toBeGreaterThan(10);
    });

    it('should have proper YAML formatting', () => {
      const yamlBlocks = guideContent.match(/```yaml[\s\S]*?```/g);
      expect(yamlBlocks).toBeDefined();
      expect(yamlBlocks!.length).toBeGreaterThan(5);
    });

    it('should have proper bash/shell formatting', () => {
      const bashBlocks = guideContent.match(/```bash[\s\S]*?```/g);
      expect(bashBlocks).toBeDefined();
      expect(bashBlocks!.length).toBeGreaterThan(3);
    });

    it('should have proper SQL formatting', () => {
      const sqlBlocks = guideContent.match(/```sql[\s\S]*?```/g);
      expect(sqlBlocks).toBeDefined();
      expect(sqlBlocks!.length).toBeGreaterThan(0);
    });

    it('should use emojis for visual organization', () => {
      expect(guideContent).toContain('🚀');
      expect(guideContent).toContain('📋');
      expect(guideContent).toContain('🏗️');
      expect(guideContent).toContain('⚙️');
    });

    it('should have proper internal links', () => {
      expect(guideContent).toContain('#architecture-globale');
      expect(guideContent).toContain('#configuration-environnement');
      expect(guideContent).toContain('#services-azure');
    });
  });

  describe('Completeness Checks', () => {
    it('should cover all deployment environments', () => {
      expect(guideContent).toContain('production');
      expect(guideContent).toContain('staging');
      expect(guideContent).toContain('development');
    });

    it('should document all critical services', () => {
      const services = [
        'Next.js',
        'PostgreSQL',
        'Azure OpenAI',
        'Stripe',
        'AWS S3',
        'CloudFront',
        'Vercel',
        'Sentry',
        'DataDog'
      ];

      services.forEach(service => {
        expect(guideContent).toContain(service);
      });
    });

    it('should provide troubleshooting guidance', () => {
      expect(guideContent).toContain('Rollback');
      expect(guideContent).toContain('Monitoring');
      expect(guideContent).toContain('Alertes');
    });

    it('should have conclusion', () => {
      expect(guideContent).toContain('prête pour la production');
    });
  });
});
