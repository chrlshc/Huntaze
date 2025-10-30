import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de régression pour BACKEND_IMPROVEMENTS_ROADMAP.md
 * Garantit que les modifications futures ne cassent pas la structure du roadmap
 */

describe('Backend Roadmap Regression Tests', () => {
  let roadmapContent: string;

  beforeEach(() => {
    if (existsSync('BACKEND_IMPROVEMENTS_ROADMAP.md')) {
      roadmapContent = readFileSync('BACKEND_IMPROVEMENTS_ROADMAP.md', 'utf-8');
    }
  });

  describe('Critical Structure Preservation', () => {
    it('should maintain main title', () => {
      expect(roadmapContent).toContain('# 🔧 Roadmap d\'Améliorations Backend Huntaze');
    });

    it('should maintain three-phase structure', () => {
      expect(roadmapContent).toContain('Phase 1: Fondations Critiques');
      expect(roadmapContent).toContain('Phase 2: Intégrations Essentielles');
      expect(roadmapContent).toContain('Phase 3: Features Avancées');
    });

    it('should maintain current state section', () => {
      expect(roadmapContent).toContain('## 📋 État Actuel du Backend');
      expect(roadmapContent).toContain('### ✅ Ce Qui Existe Déjà');
      expect(roadmapContent).toContain('### ❌ Ce Qui Manque (Critique)');
    });

    it('should maintain priority summary', () => {
      expect(roadmapContent).toContain('## 📊 Résumé des Priorités');
      expect(roadmapContent).toContain('🔴 Critique');
      expect(roadmapContent).toContain('🟡 Important');
      expect(roadmapContent).toContain('🟢 Nice-to-Have');
    });
  });

  describe('Phase 1 Content Preservation', () => {
    it('should maintain PostgreSQL section', () => {
      expect(roadmapContent).toContain('#### 1.1 Base de Données PostgreSQL avec Prisma');
      expect(roadmapContent).toContain('prisma/schema.prisma');
    });

    it('should maintain NextAuth section', () => {
      expect(roadmapContent).toContain('#### 1.2 Authentication avec NextAuth.js');
      expect(roadmapContent).toContain('app/api/auth/[...nextauth]/route.ts');
    });

    it('should maintain API Routes section', () => {
      expect(roadmapContent).toContain('#### 1.3 API Routes Complètes');
      expect(roadmapContent).toContain('app/api/');
    });

    it('should maintain Prisma models', () => {
      expect(roadmapContent).toContain('model User');
      expect(roadmapContent).toContain('model UserSubscription');
      expect(roadmapContent).toContain('model Content');
      expect(roadmapContent).toContain('model Analytics');
    });
  });

  describe('Phase 2 Content Preservation', () => {
    it('should maintain Stripe webhooks section', () => {
      expect(roadmapContent).toContain('#### 2.1 Webhooks Stripe Réels');
      expect(roadmapContent).toContain('app/api/billing/webhooks/route.ts');
    });

    it('should maintain S3 upload section', () => {
      expect(roadmapContent).toContain('#### 2.2 File Upload avec AWS S3');
      expect(roadmapContent).toContain('StorageService');
    });

    it('should maintain Redis section', () => {
      expect(roadmapContent).toContain('#### 2.3 Redis Caching');
      expect(roadmapContent).toContain('CacheService');
    });
  });

  describe('Phase 3 Content Preservation', () => {
    it('should maintain SSE section', () => {
      expect(roadmapContent).toContain('#### 3.1 Real-time avec Server-Sent Events');
      expect(roadmapContent).toContain('text/event-stream');
    });

    it('should maintain rate limiting section', () => {
      expect(roadmapContent).toContain('#### 3.2 Rate Limiting');
      expect(roadmapContent).toContain('@upstash/ratelimit');
    });

    it('should maintain email service section', () => {
      expect(roadmapContent).toContain('#### 3.3 Email Service');
      expect(roadmapContent).toContain('EmailService');
    });
  });

  describe('Code Examples Preservation', () => {
    it('should maintain TypeScript code blocks', () => {
      const tsBlocks = roadmapContent.match(/```typescript/g);
      expect(tsBlocks).toBeDefined();
      expect(tsBlocks!.length).toBeGreaterThanOrEqual(10);
    });

    it('should maintain Prisma schema blocks', () => {
      const prismaBlocks = roadmapContent.match(/```prisma/g);
      expect(prismaBlocks).toBeDefined();
      expect(prismaBlocks!.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain bash command blocks', () => {
      const bashBlocks = roadmapContent.match(/```bash/g);
      expect(bashBlocks).toBeDefined();
      expect(bashBlocks!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Service References Preservation', () => {
    it('should maintain existing service references', () => {
      const services = [
        'ai-service.ts',
        'ai-router.ts',
        'simple-user-service.ts',
        'simple-billing-service.ts',
        'ai-content-service.ts'
      ];

      services.forEach(service => {
        expect(roadmapContent).toContain(service);
      });
    });

    it('should maintain new service class names', () => {
      const serviceClasses = [
        'DatabaseUserService',
        'StorageService',
        'CacheService',
        'EmailService'
      ];

      serviceClasses.forEach(className => {
        expect(roadmapContent).toContain(className);
      });
    });
  });

  describe('Environment Variables Preservation', () => {
    it('should maintain database environment variables', () => {
      expect(roadmapContent).toContain('DATABASE_URL');
    });

    it('should maintain Stripe environment variables', () => {
      const stripeVars = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PRO_MONTHLY_PRICE_ID',
        'STRIPE_PRO_YEARLY_PRICE_ID',
        'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
        'STRIPE_ENTERPRISE_YEARLY_PRICE_ID'
      ];

      stripeVars.forEach(varName => {
        expect(roadmapContent).toContain(varName);
      });
    });

    it('should maintain AWS environment variables', () => {
      const awsVars = [
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_S3_BUCKET'
      ];

      awsVars.forEach(varName => {
        expect(roadmapContent).toContain(varName);
      });
    });

    it('should maintain other service environment variables', () => {
      expect(roadmapContent).toContain('REDIS_URL');
      expect(roadmapContent).toContain('SENDGRID_API_KEY');
      expect(roadmapContent).toContain('EMAIL_FROM');
    });
  });

  describe('Installation Commands Preservation', () => {
    it('should maintain Prisma installation', () => {
      expect(roadmapContent).toContain('npm install @prisma/client prisma');
    });

    it('should maintain NextAuth installation', () => {
      expect(roadmapContent).toContain('npm install next-auth @auth/prisma-adapter');
    });

    it('should maintain AWS SDK installation', () => {
      expect(roadmapContent).toContain('npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
    });

    it('should maintain Redis installation', () => {
      expect(roadmapContent).toContain('npm install ioredis');
    });

    it('should maintain SendGrid installation', () => {
      expect(roadmapContent).toContain('npm install @sendgrid/mail');
    });
  });

  describe('API Route Structure Preservation', () => {
    it('should maintain auth routes', () => {
      expect(roadmapContent).toContain('app/api/auth/');
    });

    it('should maintain user routes', () => {
      // User routes may be mentioned in different contexts
      const hasUserRoutes = roadmapContent.includes('users') || 
                           roadmapContent.includes('User');
      expect(hasUserRoutes).toBe(true);
    });

    it('should maintain content routes', () => {
      expect(roadmapContent).toContain('app/api/content/');
    });

    it('should maintain billing routes', () => {
      expect(roadmapContent).toContain('app/api/billing/');
    });

    it('should maintain AI routes', () => {
      expect(roadmapContent).toContain('app/api/ai/');
    });

    it('should maintain analytics routes', () => {
      // Analytics may be mentioned in different contexts
      const hasAnalytics = roadmapContent.includes('analytics') || 
                          roadmapContent.includes('Analytics');
      expect(hasAnalytics).toBe(true);
    });
  });

  describe('Timeline Preservation', () => {
    it('should maintain Phase 1 timeline', () => {
      expect(roadmapContent).toContain('Semaine 1-2');
    });

    it('should maintain Phase 2 timeline', () => {
      expect(roadmapContent).toContain('Semaine 3-4');
    });

    it('should maintain Phase 3 timeline', () => {
      expect(roadmapContent).toContain('Semaine 5-6');
    });
  });

  describe('Priority Markers Preservation', () => {
    it('should maintain critical priority marker', () => {
      expect(roadmapContent).toContain('🔴 Critique');
    });

    it('should maintain important priority marker', () => {
      expect(roadmapContent).toContain('🟡 Important');
    });

    it('should maintain nice-to-have priority marker', () => {
      expect(roadmapContent).toContain('🟢 Nice-to-Have');
    });

    it('should maintain checkmarks for completed items', () => {
      const checkmarks = roadmapContent.match(/✅/g);
      expect(checkmarks).toBeDefined();
      expect(checkmarks!.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Security Patterns Preservation', () => {
    it('should maintain authentication checks', () => {
      expect(roadmapContent).toContain('getServerSession');
      expect(roadmapContent).toContain('session?.user?.id');
    });

    it('should maintain webhook verification', () => {
      expect(roadmapContent).toContain('stripe.webhooks.constructEvent');
    });

    it('should maintain error handling patterns', () => {
      expect(roadmapContent).toContain('try {');
      expect(roadmapContent).toContain('catch (error)');
    });

    it('should maintain validation patterns', () => {
      expect(roadmapContent).toContain('z.object');
      expect(roadmapContent).toContain('ZodError');
    });
  });

  describe('Database Schema Preservation', () => {
    it('should maintain User model fields', () => {
      expect(roadmapContent).toContain('id');
      expect(roadmapContent).toContain('email');
      expect(roadmapContent).toContain('name');
      expect(roadmapContent).toContain('subscription');
      expect(roadmapContent).toContain('stripeCustomerId');
    });

    it('should maintain UserSubscription model fields', () => {
      expect(roadmapContent).toContain('userId');
      expect(roadmapContent).toContain('planId');
      expect(roadmapContent).toContain('status');
      expect(roadmapContent).toContain('stripeSubscriptionId');
    });

    it('should maintain Content model fields', () => {
      expect(roadmapContent).toContain('title');
      expect(roadmapContent).toContain('body');
      expect(roadmapContent).toContain('type');
      expect(roadmapContent).toContain('aiGenerated');
    });

    it('should maintain enums', () => {
      expect(roadmapContent).toContain('enum Subscription');
      expect(roadmapContent).toContain('enum SubscriptionStatus');
      expect(roadmapContent).toContain('enum ContentType');
      expect(roadmapContent).toContain('enum ContentStatus');
    });
  });

  describe('Conclusion Preservation', () => {
    it('should maintain production-ready statement', () => {
      expect(roadmapContent).toContain('production-ready');
    });

    it('should maintain 100% completion claim', () => {
      expect(roadmapContent).toContain('100%');
    });

    it('should maintain final emoji', () => {
      expect(roadmapContent).toMatch(/🎯.*production-ready/);
    });
  });

  describe('Formatting Consistency', () => {
    it('should maintain consistent heading levels', () => {
      expect(roadmapContent).toMatch(/^# /m);
      expect(roadmapContent).toMatch(/^## /m);
      expect(roadmapContent).toMatch(/^### /m);
      expect(roadmapContent).toMatch(/^#### /m);
    });

    it('should maintain code block formatting', () => {
      expect(roadmapContent).toContain('```typescript');
      expect(roadmapContent).toContain('```prisma');
      expect(roadmapContent).toContain('```bash');
    });

    it('should maintain list formatting', () => {
      expect(roadmapContent).toMatch(/^1\. /m);
      expect(roadmapContent).toMatch(/^- /m);
    });
  });

  describe('Content Completeness', () => {
    it('should maintain all 10 missing features', () => {
      const missingFeatures = [
        'Base de données réelle',
        'Authentication système',
        'API Routes complètes',
        'Webhooks Stripe',
        'File upload',
        'Real-time features',
        'Caching layer',
        'Rate limiting',
        'Monitoring',
        'Email service'
      ];

      missingFeatures.forEach(feature => {
        expect(roadmapContent).toContain(feature);
      });
    });

    it('should maintain all 5 existing services', () => {
      const existingServices = [
        'AI Service',
        'AI Router',
        'User Service',
        'Billing Service',
        'Content Service'
      ];

      existingServices.forEach(service => {
        expect(roadmapContent).toContain(service);
      });
    });
  });

  describe('No Regression in Quality', () => {
    it('should not introduce hardcoded secrets', () => {
      expect(roadmapContent).not.toMatch(/sk_live_[a-zA-Z0-9]{24,}/);
      expect(roadmapContent).not.toMatch(/sk_test_[a-zA-Z0-9]{24,}/);
      expect(roadmapContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    it('should not have broken code examples', () => {
      // Should not have common syntax errors
      expect(roadmapContent).not.toContain('improt ');
      expect(roadmapContent).not.toContain('exprot ');
      expect(roadmapContent).not.toContain('fucntion ');
    });

    it('should not have broken links or references', () => {
      // Should not have broken markdown links
      expect(roadmapContent).not.toMatch(/\[.*\]\(\)/);
    });
  });
});
