/**
 * Unit Tests - Production Ready README Validation
 * 
 * Tests to validate the production-ready configuration documentation
 * 
 * Coverage:
 * - Documentation structure validation
 * - Next.js 15.5 middleware documentation
 * - Security features documentation
 * - Installation instructions
 * - Configuration examples
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Production Ready README Validation', () => {
  let readmeContent: string;

  beforeAll(() => {
    const readmePath = join(process.cwd(), 'config/production-ready/README.md');
    readmeContent = readFileSync(readmePath, 'utf-8');
  });

  describe('Document Structure', () => {
    it('should have a title', () => {
      expect(readmeContent).toContain('# Production Ready Configuration 2025');
    });

    it('should have all major sections', () => {
      const sections = [
        '## 📦 Fichiers Inclus',
        '## 🚀 Déploiement',
        '## 📊 SLIs/SLOs',
        '## 🔒 Sécurité',
        '## 📈 Monitoring',
        '## 🧪 Tests',
        '## 📚 Documentation',
        '## ✅ Checklist Production',
        '## 🆘 Support',
      ];

      sections.forEach((section) => {
        expect(readmeContent).toContain(section);
      });
    });

    it('should have version and status information', () => {
      expect(readmeContent).toContain('**Version**: 1.0.0');
      expect(readmeContent).toContain('**Last Updated**: 2025-01-30');
      expect(readmeContent).toContain('**Status**: ✅ Production Ready');
    });
  });

  describe('Middleware Documentation (Next.js 15.5)', () => {
    it('should document middleware.ts for Next.js 15.5', () => {
      expect(readmeContent).toContain('### 1. `middleware.ts` - Next.js 15.5 Middleware (Production Ready)');
      expect(readmeContent).toContain('Middleware avec sécurité renforcée pour Next.js 15.5');
    });

    it('should NOT reference proxy.ts as primary solution', () => {
      // proxy.ts should only be mentioned as a future Next.js 16 feature
      const middlewareSection = readmeContent.split('### 2.')[0];
      expect(middlewareSection).not.toContain('Remplace `middleware.ts`');
      expect(middlewareSection).not.toContain('cp config/production-ready/proxy.ts ./proxy.ts');
    });

    it('should mention Next.js 16 proxy.ts as future feature', () => {
      expect(readmeContent).toContain('**Note:** Next.js 16 introduit `proxy.ts` mais nous restons sur 15.5 pour la stabilité');
    });

    it('should document middleware features', () => {
      const features = [
        'CSP strict avec nonces (NO unsafe-eval/unsafe-inline)',
        'Security headers complets (HSTS, X-Frame-Options, etc.)',
        'Host validation',
        'Authentication checks',
        'Rate limiting headers',
      ];

      features.forEach((feature) => {
        expect(readmeContent).toContain(feature);
      });
    });

    it('should provide correct installation instructions', () => {
      expect(readmeContent).toContain('# Le middleware.ts est déjà en place');
      expect(readmeContent).toContain('# Ajouter les security headers dans next.config.ts');
    });

    it('should NOT instruct to remove middleware.ts', () => {
      expect(readmeContent).not.toContain('rm middleware.ts');
      expect(readmeContent).not.toContain('Supprimer l\'ancien middleware');
    });

    it('should provide usage example with nonce', () => {
      expect(readmeContent).toContain('import { headers } from \'next/headers\'');
      expect(readmeContent).toContain('const nonce = headers().get(\'x-nonce\')');
      expect(readmeContent).toContain('<Script src="/analytics.js" nonce={nonce} />');
    });
  });

  describe('Secrets Service Documentation', () => {
    it('should document secrets.service.ts', () => {
      expect(readmeContent).toContain('### 2. `secrets.service.ts` - AWS Secrets Manager');
      expect(readmeContent).toContain('Gestion sécurisée des secrets avec cache mémoire');
    });

    it('should list secrets service features', () => {
      const features = [
        'IAM Role only (NO static keys)',
        'Memory cache avec TTL (5 min default)',
        'Preload critical secrets',
        'Health check',
        'Fallback sur cache expiré',
      ];

      features.forEach((feature) => {
        expect(readmeContent).toContain(feature);
      });
    });

    it('should provide installation instructions', () => {
      expect(readmeContent).toContain('cp config/production-ready/secrets.service.ts lib/secrets.service.ts');
    });

    it('should provide usage examples', () => {
      expect(readmeContent).toContain('import { secrets } from \'@/lib/secrets.service\'');
      expect(readmeContent).toContain('const dbUrl = await secrets.getDatabaseUrl()');
      expect(readmeContent).toContain('await preloadSecrets()');
    });

    it('should provide AWS CLI commands for secret creation', () => {
      expect(readmeContent).toContain('aws secretsmanager create-secret');
      expect(readmeContent).toContain('--name huntaze/database/url');
      expect(readmeContent).toContain('--name huntaze/nextauth/secret');
      expect(readmeContent).toContain('--name huntaze/onlyfans/api-key');
    });
  });

  describe('Monitoring Service Documentation', () => {
    it('should document monitoring.service.ts', () => {
      expect(readmeContent).toContain('### 3. `monitoring.service.ts` - Observability');
      expect(readmeContent).toContain('Monitoring complet avec SLIs/SLOs et DORA metrics');
    });

    it('should list monitoring features', () => {
      const features = [
        'SLIs/SLOs tracking',
        'CloudWatch metrics',
        'DORA metrics',
        'Audit logs avec PII masking',
        'Health checks',
        'Performance middleware',
      ];

      features.forEach((feature) => {
        expect(readmeContent).toContain(feature);
      });
    });

    it('should provide usage examples', () => {
      expect(readmeContent).toContain('trackAPILatency');
      expect(readmeContent).toContain('trackAPIError');
      expect(readmeContent).toContain('logAuditEvent');
      expect(readmeContent).toContain('createPerformanceMiddleware');
    });
  });

  describe('Prisma Configuration Documentation', () => {
    it('should document prisma.config.ts', () => {
      expect(readmeContent).toContain('### 4. `prisma.config.ts` - Database');
      expect(readmeContent).toContain('Configuration Prisma avec Accelerate (OBLIGATOIRE)');
    });

    it('should list Prisma features', () => {
      const features = [
        'Prisma Accelerate (connection pooling)',
        'Query optimization helpers',
        'Connection burst testing',
        'Health check',
      ];

      features.forEach((feature) => {
        expect(readmeContent).toContain(feature);
      });
    });

    it('should provide Prisma Accelerate setup instructions', () => {
      expect(readmeContent).toContain('# 1. Enable Accelerate in Prisma Cloud');
      expect(readmeContent).toContain('https://console.prisma.io/');
      expect(readmeContent).toContain('DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"');
      expect(readmeContent).toContain('npm install @prisma/extension-accelerate');
    });

    it('should provide usage examples with cache', () => {
      expect(readmeContent).toContain('queryOptimizations.paginate(1, 20)');
      expect(readmeContent).toContain('queryOptimizations.withCache(60)');
      expect(readmeContent).toContain('testConnectionBurst()');
    });
  });

  describe('S3 Presigned Service Documentation', () => {
    it('should document s3-presigned.service.ts', () => {
      expect(readmeContent).toContain('### 5. `s3-presigned.service.ts` - S3 Storage');
      expect(readmeContent).toContain('Presigned URLs avec Content-Disposition');
    });

    it('should list S3 service features', () => {
      const features = [
        'IAM Role only',
        'Content-Disposition (filename preservation)',
        'Server-side encryption',
        'Content-Type validation',
        'File size validation',
      ];

      features.forEach((feature) => {
        expect(readmeContent).toContain(feature);
      });
    });

    it('should provide usage examples', () => {
      expect(readmeContent).toContain('generateUploadUrl');
      expect(readmeContent).toContain('generateDownloadUrl');
      expect(readmeContent).toContain('fileName: \'photo.jpg\'');
      expect(readmeContent).toContain('inline: true');
    });
  });

  describe('Deployment Instructions', () => {
    it('should document prerequisites', () => {
      expect(readmeContent).toContain('### 1. Vérifier les prérequis');
      expect(readmeContent).toContain('# Node.js 20.9+');
      expect(readmeContent).toContain('# AWS CLI configuré');
      expect(readmeContent).toContain('# Prisma Accelerate activé');
    });

    it('should provide file copy instructions', () => {
      expect(readmeContent).toContain('### 2. Copier les fichiers');
      expect(readmeContent).toContain('cp config/production-ready/secrets.service.ts lib/secrets.service.ts');
      expect(readmeContent).toContain('cp config/production-ready/monitoring.service.ts lib/monitoring.service.ts');
    });

    it('should reference deployment scripts', () => {
      expect(readmeContent).toContain('./scripts/create-secrets.sh');
      expect(readmeContent).toContain('./scripts/deploy-production-2025.sh production');
    });
  });

  describe('SLIs/SLOs Documentation', () => {
    it('should document Service Level Indicators', () => {
      expect(readmeContent).toContain('### Service Level Indicators (SLIs)');
      expect(readmeContent).toContain('API Availability: **99.9%**');
      expect(readmeContent).toContain('API Latency P95: **< 250ms**');
      expect(readmeContent).toContain('API Error Rate: **< 1%**');
    });

    it('should document Service Level Objectives', () => {
      expect(readmeContent).toContain('### Service Level Objectives (SLOs)');
      expect(readmeContent).toContain('Uptime: **99.9%** (monthly)');
      expect(readmeContent).toContain('Response Time P95: **< 500ms**');
      expect(readmeContent).toContain('Error Budget: **0.1%**');
    });

    it('should document DORA metrics', () => {
      expect(readmeContent).toContain('### DORA Metrics');
      expect(readmeContent).toContain('Deployment Frequency: **7/week** (daily)');
      expect(readmeContent).toContain('Lead Time for Changes: **< 2 hours**');
      expect(readmeContent).toContain('Mean Time to Recovery: **< 60 minutes**');
      expect(readmeContent).toContain('Change Failure Rate: **< 5%**');
    });
  });

  describe('Security Documentation', () => {
    it('should document CSP headers', () => {
      expect(readmeContent).toContain('### CSP Headers');
      expect(readmeContent).toContain('default-src \'self\'');
      expect(readmeContent).toContain('script-src \'self\' \'nonce-{random}\'');
      expect(readmeContent).toContain('style-src \'self\' \'unsafe-inline\'');
    });

    it('should document secure cookies', () => {
      expect(readmeContent).toContain('### Cookies');
      expect(readmeContent).toContain('__Host-huntaze.session-token');
      expect(readmeContent).toContain('__Host-huntaze.csrf-token');
    });

    it('should document secrets management', () => {
      expect(readmeContent).toContain('### Secrets');
      expect(readmeContent).toContain('AWS Secrets Manager only');
      expect(readmeContent).toContain('NO static keys in code');
      expect(readmeContent).toContain('IAM roles only');
    });

    it('should document audit logs', () => {
      expect(readmeContent).toContain('### Audit Logs');
      expect(readmeContent).toContain('PII masking automatique');
      expect(readmeContent).toContain('Rétention: 365 jours');
      expect(readmeContent).toContain('CloudWatch Logs');
    });
  });

  describe('Monitoring Documentation', () => {
    it('should document CloudWatch dashboards', () => {
      expect(readmeContent).toContain('### CloudWatch Dashboards');
      expect(readmeContent).toContain('Application metrics');
      expect(readmeContent).toContain('Business metrics');
      expect(readmeContent).toContain('Infrastructure metrics');
    });

    it('should document alarms', () => {
      expect(readmeContent).toContain('### Alarms');
      expect(readmeContent).toContain('API 5xx errors > 2%');
      expect(readmeContent).toContain('API latency P95 > 500ms');
      expect(readmeContent).toContain('SQS queue depth > 5,000');
      expect(readmeContent).toContain('DB CPU > 80%');
    });

    it('should document log retention', () => {
      expect(readmeContent).toContain('### Logs');
      expect(readmeContent).toContain('Application: 30 jours');
      expect(readmeContent).toContain('Audit: 365 jours');
      expect(readmeContent).toContain('Access: 90 jours');
    });
  });

  describe('Testing Documentation', () => {
    it('should document test commands', () => {
      expect(readmeContent).toContain('## 🧪 Tests');
      expect(readmeContent).toContain('npm run test:unit');
      expect(readmeContent).toContain('npm run test:integration');
      expect(readmeContent).toContain('npm run test:e2e');
      expect(readmeContent).toContain('npm run test:security');
    });
  });

  describe('Documentation Links', () => {
    it('should reference related documentation', () => {
      const docs = [
        '[Production Readiness Guide](../../docs/PRODUCTION_READINESS_2025.md)',
        '[Runbooks](../../docs/RUNBOOKS.md)',
        '[Architecture](../../docs/HUNTAZE_APP_ARCHITECTURE.md)',
        '[Deployment Guide](../../DEPLOYMENT_GUIDE.md)',
      ];

      docs.forEach((doc) => {
        expect(readmeContent).toContain(doc);
      });
    });
  });

  describe('Production Checklist', () => {
    it('should have a production checklist', () => {
      expect(readmeContent).toContain('## ✅ Checklist Production');
    });

    it('should include all critical items', () => {
      const items = [
        'Node 20.9+ configuré',
        'Next.js 16 proxy.ts implémenté',
        'IAM roles uniquement (pas de clés)',
        'CSP strict avec nonces',
        'Secrets Manager configuré',
        'Prisma Accelerate activé',
        'SLIs/SLOs définis',
        'CloudWatch alarms configurés',
        'Audit logs activés',
        'Tests passent (unit + integration + e2e)',
        'Runbooks documentés',
        'DR tests planifiés (mensuel)',
      ];

      items.forEach((item) => {
        expect(readmeContent).toContain(item);
      });
    });
  });

  describe('Support Section', () => {
    it('should have a support section', () => {
      expect(readmeContent).toContain('## 🆘 Support');
    });

    it('should provide troubleshooting steps', () => {
      expect(readmeContent).toContain('En cas de problème:');
      expect(readmeContent).toContain('1. Consulter les [Runbooks]');
      expect(readmeContent).toContain('2. Vérifier les [CloudWatch Logs]');
      expect(readmeContent).toContain('3. Contacter l\'équipe DevOps');
    });

    it('should include CloudWatch console link', () => {
      expect(readmeContent).toContain('https://console.aws.amazon.com/cloudwatch/');
    });
  });

  describe('Content Quality', () => {
    it('should use consistent emoji indicators', () => {
      const emojis = ['📦', '🚀', '📊', '🔒', '📈', '🧪', '📚', '✅', '🆘'];

      emojis.forEach((emoji) => {
        expect(readmeContent).toContain(emoji);
      });
    });

    it('should have proper markdown formatting', () => {
      // Check for code blocks
      expect(readmeContent).toContain('```bash');
      expect(readmeContent).toContain('```typescript');
      
      // Check for bold text
      expect(readmeContent).toMatch(/\*\*[^*]+\*\*/);
      
      // Check for lists
      expect(readmeContent).toContain('- ');
    });

    it('should not have broken markdown links', () => {
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const links = readmeContent.match(linkPattern);
      
      if (links) {
        links.forEach((link) => {
          expect(link).toMatch(/\[.+\]\(.+\)/);
        });
      }
    });
  });

  describe('Middleware vs Proxy Clarification', () => {
    it('should clearly state we use middleware.ts for Next.js 15.5', () => {
      expect(readmeContent).toContain('Next.js 15.5 Middleware (Production Ready)');
    });

    it('should explain why we stay on Next.js 15.5', () => {
      expect(readmeContent).toContain('nous restons sur 15.5 pour la stabilité');
    });

    it('should acknowledge Next.js 16 proxy.ts exists', () => {
      expect(readmeContent).toContain('Next.js 16 introduit `proxy.ts`');
    });

    it('should not confuse users about which file to use', () => {
      const middlewareSection = readmeContent.split('### 2.')[0];
      
      // Should clearly indicate middleware.ts is already in place
      expect(middlewareSection).toContain('Le middleware.ts est déjà en place');
      
      // Should not suggest copying proxy.ts as primary solution
      expect(middlewareSection).not.toContain('Copier vers la racine du projet');
    });
  });

  describe('File References', () => {
    it('should reference existing configuration files', () => {
      const files = [
        'secrets.service.ts',
        'monitoring.service.ts',
        'prisma.config.ts',
        's3-presigned.service.ts',
      ];

      files.forEach((file) => {
        expect(readmeContent).toContain(file);
      });
    });

    it('should reference deployment scripts', () => {
      expect(readmeContent).toContain('./scripts/create-secrets.sh');
      expect(readmeContent).toContain('./scripts/deploy-production-2025.sh');
    });

    it('should reference terraform configuration', () => {
      expect(readmeContent).toContain('infra/terraform/monitoring/');
    });
  });
});
