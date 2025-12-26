/**
 * Integration Tests - Production Readiness Validation
 * 
 * Tests to validate that the system meets production readiness requirements
 * Based on: docs/PRODUCTION_READINESS_CHECKLIST.md
 * 
 * Coverage:
 * - Environment variables configuration
 * - Database tables existence
 * - OAuth endpoints availability
 * - Worker scripts existence
 * - Security configurations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Production Readiness - Integration Validation', () => {
  describe('Environment Variables Configuration', () => {
    it('should have .env.example with all required variables', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      expect(existsSync(envExamplePath)).toBe(true);
      
      const envExample = readFileSync(envExamplePath, 'utf-8');
      
      // Core variables
      expect(envExample).toContain('TOKEN_ENCRYPTION_KEY');
      expect(envExample).toContain('DATABASE_URL');
      
      // TikTok
      expect(envExample).toContain('TIKTOK_CLIENT_KEY');
      expect(envExample).toContain('TIKTOK_CLIENT_SECRET');
      expect(envExample).toContain('NEXT_PUBLIC_TIKTOK_REDIRECT_URI');
      
      // Instagram
      expect(envExample).toContain('FACEBOOK_APP_ID');
      expect(envExample).toContain('FACEBOOK_APP_SECRET');
      expect(envExample).toContain('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI');
      
      // Reddit
      expect(envExample).toContain('REDDIT_CLIENT_ID');
      expect(envExample).toContain('REDDIT_CLIENT_SECRET');
      expect(envExample).toContain('NEXT_PUBLIC_REDDIT_REDIRECT_URI');
    });

    it('should have webhook secrets in .env.example', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      const envExample = readFileSync(envExamplePath, 'utf-8');
      
      expect(envExample).toContain('TIKTOK_WEBHOOK_SECRET');
      expect(envExample).toContain('INSTAGRAM_WEBHOOK_SECRET');
    });
  });

  describe('Database Migration Files', () => {
    it('should have social integrations migration file', () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      expect(existsSync(migrationPath)).toBe(true);
    });

    it('should create oauth_accounts table', () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const migration = readFileSync(migrationPath, 'utf-8');
      
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS oauth_accounts');
      expect(migration).toContain('platform VARCHAR(50) NOT NULL');
      expect(migration).toContain('access_token_encrypted TEXT NOT NULL');
    });

    it('should create tiktok_posts table', () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const migration = readFileSync(migrationPath, 'utf-8');
      
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS tiktok_posts');
      expect(migration).toContain('share_id VARCHAR(255)');
      expect(migration).toContain('publish_status VARCHAR(50)');
    });

    it('should create instagram_accounts table', () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const migration = readFileSync(migrationPath, 'utf-8');
      
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS instagram_accounts');
      expect(migration).toContain('instagram_user_id VARCHAR(255) UNIQUE NOT NULL');
    });

    it('should create reddit_posts table', () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const migration = readFileSync(migrationPath, 'utf-8');
      
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS reddit_posts');
      expect(migration).toContain('reddit_post_id VARCHAR(255) UNIQUE');
    });
  });

  describe('OAuth Endpoints', () => {
    it('should have TikTok OAuth route', () => {
      const routePath = join(process.cwd(), 'app/api/auth/tiktok/route.ts');
      expect(existsSync(routePath)).toBe(true);
    });

    it('should have TikTok OAuth callback route', () => {
      const callbackPath = join(process.cwd(), 'app/api/auth/tiktok/callback/route.ts');
      expect(existsSync(callbackPath)).toBe(true);
    });

    it('should have Instagram OAuth route', () => {
      const routePath = join(process.cwd(), 'app/api/auth/instagram/route.ts');
      expect(existsSync(routePath)).toBe(true);
    });

    it('should have Instagram OAuth callback route', () => {
      const callbackPath = join(process.cwd(), 'app/api/auth/instagram/callback/route.ts');
      expect(existsSync(callbackPath)).toBe(true);
    });

    it('should have Reddit OAuth route', () => {
      const routePath = join(process.cwd(), 'app/api/auth/reddit/route.ts');
      expect(existsSync(routePath)).toBe(true);
    });

    it('should have Reddit OAuth callback route', () => {
      const callbackPath = join(process.cwd(), 'app/api/auth/reddit/callback/route.ts');
      expect(existsSync(callbackPath)).toBe(true);
    });
  });

  describe('Publishing Endpoints', () => {
    it('should have TikTok upload endpoint', () => {
      const uploadPath = join(process.cwd(), 'app/api/tiktok/upload/route.ts');
      expect(existsSync(uploadPath)).toBe(true);
    });

    it('should have Instagram publish endpoint', () => {
      const publishPath = join(process.cwd(), 'app/api/instagram/publish/route.ts');
      expect(existsSync(publishPath)).toBe(true);
    });

    it('should have Reddit publish endpoint', () => {
      const publishPath = join(process.cwd(), 'app/api/reddit/publish/route.ts');
      expect(existsSync(publishPath)).toBe(true);
    });
  });

  describe('Webhook Endpoints', () => {
    it('should have TikTok webhook endpoint', () => {
      const webhookPath = join(process.cwd(), 'app/api/webhooks/tiktok/route.ts');
      expect(existsSync(webhookPath)).toBe(true);
    });

    it('should have Instagram webhook endpoint', () => {
      const webhookPath = join(process.cwd(), 'app/api/webhooks/instagram/route.ts');
      expect(existsSync(webhookPath)).toBe(true);
    });

    it('should verify TikTok webhook signature', () => {
      const webhookPath = join(process.cwd(), 'app/api/webhooks/tiktok/route.ts');
      const webhook = readFileSync(webhookPath, 'utf-8');
      
      expect(webhook).toContain('x-tiktok-signature');
    });

    it('should verify Instagram webhook signature', () => {
      const webhookPath = join(process.cwd(), 'app/api/webhooks/instagram/route.ts');
      const webhook = readFileSync(webhookPath, 'utf-8');
      
      expect(webhook).toContain('x-hub-signature');
    });
  });

  describe('Worker Scripts', () => {
    it('should have token refresh worker', () => {
      const workerPath = join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      expect(existsSync(workerPath)).toBe(true);
    });

    it('should have webhook processor worker', () => {
      const workerPath = join(process.cwd(), 'lib/workers/webhookWorker.ts');
      expect(existsSync(workerPath)).toBe(true);
    });

    it('should have Reddit sync worker', () => {
      const workerPath = join(process.cwd(), 'lib/workers/redditSyncWorker.ts');
      expect(existsSync(workerPath)).toBe(true);
    });

    it('should have token refresh API endpoint', () => {
      const endpointPath = join(process.cwd(), 'app/api/workers/token-refresh/route.ts');
      expect(existsSync(endpointPath)).toBe(true);
    });

    it('should have webhook worker API endpoint', () => {
      const endpointPath = join(process.cwd(), 'app/api/workers/webhooks/route.ts');
      expect(existsSync(endpointPath)).toBe(true);
    });

    it('should have token refresh script', () => {
      const scriptPath = join(process.cwd(), 'scripts/run-token-refresh.js');
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should have webhook worker script', () => {
      const scriptPath = join(process.cwd(), 'scripts/run-webhook-worker.js');
      expect(existsSync(scriptPath)).toBe(true);
    });
  });

  describe('Service Layer', () => {
    it('should have TikTok OAuth service', () => {
      const servicePath = join(process.cwd(), 'lib/services/tiktokOAuth.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have TikTok upload service', () => {
      const servicePath = join(process.cwd(), 'lib/services/tiktokUpload.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have Instagram OAuth service', () => {
      const servicePath = join(process.cwd(), 'lib/services/instagramOAuth.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have Instagram publish service', () => {
      const servicePath = join(process.cwd(), 'lib/services/instagramPublish.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have Reddit OAuth service', () => {
      const servicePath = join(process.cwd(), 'lib/services/redditOAuth.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have Reddit publish service', () => {
      const servicePath = join(process.cwd(), 'lib/services/redditPublish.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have token encryption service', () => {
      const servicePath = join(process.cwd(), 'lib/services/tokenEncryption.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have token manager service', () => {
      const servicePath = join(process.cwd(), 'lib/services/tokenManager.ts');
      expect(existsSync(servicePath)).toBe(true);
    });

    it('should have webhook processor service', () => {
      const servicePath = join(process.cwd(), 'lib/services/webhookProcessor.ts');
      expect(existsSync(servicePath)).toBe(true);
    });
  });

  describe('Database Repositories', () => {
    it('should have OAuth accounts repository', () => {
      const repoPath = join(process.cwd(), 'lib/db/repositories/oauthAccountsRepository.ts');
      expect(existsSync(repoPath)).toBe(true);
    });

    it('should have TikTok posts repository', () => {
      const repoPath = join(process.cwd(), 'lib/db/repositories/tiktokPostsRepository.ts');
      expect(existsSync(repoPath)).toBe(true);
    });

    it('should have Instagram accounts repository', () => {
      const repoPath = join(process.cwd(), 'lib/db/repositories/instagramAccountsRepository.ts');
      expect(existsSync(repoPath)).toBe(true);
    });

    it('should have Reddit posts repository', () => {
      const repoPath = join(process.cwd(), 'lib/db/repositories/redditPostsRepository.ts');
      expect(existsSync(repoPath)).toBe(true);
    });
  });

  describe('Security Implementation', () => {
    it('should implement token encryption with AES-256-GCM', () => {
      const encryptionPath = join(process.cwd(), 'lib/services/tokenEncryption.ts');
      const encryption = readFileSync(encryptionPath, 'utf-8');
      
      expect(encryption).toContain('aes-256-gcm');
    });

    it('should use HTTPS in redirect URIs', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      const envExample = readFileSync(envExamplePath, 'utf-8');
      
      const redirectUris = envExample.match(/REDIRECT_URI=.*/g) || [];
      redirectUris.forEach(uri => {
        if (!uri.includes('localhost')) {
          expect(uri).toContain('https://');
        }
      });
    });

    it('should implement CSRF protection with state parameter', () => {
      const tiktokOAuthPath = join(process.cwd(), 'lib/services/tiktokOAuth.ts');
      const tiktokOAuth = readFileSync(tiktokOAuthPath, 'utf-8');
      
      expect(tiktokOAuth).toContain('state');
    });
  });

  describe('Error Handling', () => {
    it('should have try-catch blocks in OAuth services', () => {
      const tiktokOAuthPath = join(process.cwd(), 'lib/services/tiktokOAuth.ts');
      const tiktokOAuth = readFileSync(tiktokOAuthPath, 'utf-8');
      
      expect(tiktokOAuth).toContain('try');
      expect(tiktokOAuth).toContain('catch');
    });

    it('should implement exponential backoff', () => {
      const tiktokUploadPath = join(process.cwd(), 'lib/services/tiktokUpload.ts');
      const tiktokUpload = readFileSync(tiktokUploadPath, 'utf-8');
      
      // Check for retry logic or backoff implementation
      const hasRetryLogic = tiktokUpload.includes('retry') || 
                            tiktokUpload.includes('backoff') ||
                            tiktokUpload.includes('delay');
      expect(hasRetryLogic).toBe(true);
    });
  });

  describe('Documentation', () => {
    it('should have user guide', () => {
      const guidePath = join(process.cwd(), 'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md');
      expect(existsSync(guidePath)).toBe(true);
    });

    it('should have developer guide', () => {
      const guidePath = join(process.cwd(), 'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md');
      expect(existsSync(guidePath)).toBe(true);
    });

    it('should have API reference', () => {
      const apiRefPath = join(process.cwd(), 'docs/API_REFERENCE.md');
      expect(existsSync(apiRefPath)).toBe(true);
    });

    it('should have production readiness checklist', () => {
      const checklistPath = join(process.cwd(), 'docs/PRODUCTION_READINESS_CHECKLIST.md');
      expect(existsSync(checklistPath)).toBe(true);
    });

    it('should have Instagram webhook guide', () => {
      const guidePath = join(process.cwd(), 'docs/api/INSTAGRAM_WEBHOOK_GUIDE.md');
      expect(existsSync(guidePath)).toBe(true);
    });
  });

  describe('UI Components', () => {
    it('should have TikTok dashboard widget', () => {
      const widgetPath = join(process.cwd(), 'components/platforms/TikTokDashboardWidget.tsx');
      expect(existsSync(widgetPath)).toBe(true);
    });

    it('should have Instagram dashboard widget', () => {
      const widgetPath = join(process.cwd(), 'components/platforms/InstagramDashboardWidget.tsx');
      expect(existsSync(widgetPath)).toBe(true);
    });

    it('should have Reddit dashboard widget', () => {
      const widgetPath = join(process.cwd(), 'components/platforms/RedditDashboardWidget.tsx');
      expect(existsSync(widgetPath)).toBe(true);
    });

    it('should have TikTok upload page', () => {
      const pagePath = join(process.cwd(), 'app/platforms/tiktok/upload/page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });

    it('should have Reddit publish page', () => {
      const pagePath = join(process.cwd(), 'app/platforms/reddit/publish/page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });
  });

  describe('Test Coverage', () => {
    it('should have unit tests for OAuth services', () => {
      expect(existsSync(join(process.cwd(), 'tests/unit/services/tiktokOAuth.test.ts'))).toBe(true);
      expect(existsSync(join(process.cwd(), 'tests/unit/services/instagramOAuth.test.ts'))).toBe(true);
    });

    it('should have integration tests for OAuth flows', () => {
      expect(existsSync(join(process.cwd(), 'tests/integration/api/tiktok-oauth-endpoints.test.ts'))).toBe(true);
      expect(existsSync(join(process.cwd(), 'tests/integration/api/instagram-oauth-endpoints.test.ts'))).toBe(true);
    });

    it('should have unit tests for token encryption', () => {
      const testPath = join(process.cwd(), 'tests/unit/services/tokenEncryption.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });

    it('should have database migration tests', () => {
      const testPath = join(process.cwd(), 'tests/integration/db/social-integrations-migration.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Package Dependencies', () => {
    it('should have required dependencies in package.json', () => {
      const packagePath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      // Check for crypto (built-in Node.js module, not in package.json)
      // Check for database driver
      expect(packageJson.dependencies).toHaveProperty('pg');
    });
  });

  describe('Configuration Files', () => {
    it('should have TypeScript configuration', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });

    it('should have Next.js configuration', () => {
      const nextConfigPath = join(process.cwd(), 'next.config.mjs');
      expect(existsSync(nextConfigPath)).toBe(true);
    });

    it('should have Vitest configuration', () => {
      const packagePath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      expect(packageJson.devDependencies).toHaveProperty('vitest');
    });
  });
});
