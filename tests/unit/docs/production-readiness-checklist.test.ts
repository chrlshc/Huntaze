/**
 * Unit Tests - Production Readiness Checklist
 * 
 * Tests to validate the production readiness checklist document
 * Based on: docs/PRODUCTION_READINESS_CHECKLIST.md
 * 
 * Coverage:
 * - Document structure and completeness
 * - OAuth configuration requirements
 * - Environment variables validation
 * - Security checklist items
 * - Monitoring requirements
 * - Compliance sections
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Production Readiness Checklist - Document Validation', () => {
  let checklistContent: string;

  beforeAll(() => {
    const checklistPath = join(process.cwd(), 'docs/PRODUCTION_READINESS_CHECKLIST.md');
    expect(existsSync(checklistPath)).toBe(true);
    checklistContent = readFileSync(checklistPath, 'utf-8');
  });

  describe('Document Structure', () => {
    it('should have main title', () => {
      expect(checklistContent).toContain('# Production Readiness Checklist - Social Integrations');
    });

    it('should have pre-production checklist section', () => {
      expect(checklistContent).toContain('## 🎯 Pre-Production Checklist');
    });

    it('should have deployment steps section', () => {
      expect(checklistContent).toContain('## 🚀 Deployment Steps');
    });

    it('should have monitoring dashboards section', () => {
      expect(checklistContent).toContain('## 📊 Monitoring Dashboards');
    });

    it('should have security checklist section', () => {
      expect(checklistContent).toContain('## 🔒 Security Checklist');
    });

    it('should have sign-off section', () => {
      expect(checklistContent).toContain('## ✅ Sign-Off');
    });
  });

  describe('OAuth Configuration - TikTok', () => {
    it('should include TikTok OAuth requirements', () => {
      expect(checklistContent).toContain('#### TikTok');
      expect(checklistContent).toContain('App registered in TikTok Developer Portal');
      expect(checklistContent).toContain('Content Posting API enabled');
      expect(checklistContent).toContain('Login Kit activated');
    });

    it('should specify TikTok redirect URI requirement', () => {
      expect(checklistContent).toContain('Redirect URI configured (HTTPS required)');
    });

    it('should list required TikTok scopes', () => {
      expect(checklistContent).toContain('user.info.basic');
      expect(checklistContent).toContain('video.upload');
    });

    it('should mention TikTok secrets', () => {
      expect(checklistContent).toContain('Client Key & Secret in production secrets');
    });
  });

  describe('OAuth Configuration - Instagram', () => {
    it('should include Instagram OAuth requirements', () => {
      expect(checklistContent).toContain('#### Instagram');
      expect(checklistContent).toContain('Facebook App created');
      expect(checklistContent).toContain('Instagram Graph API enabled');
    });

    it('should mention app review requirement', () => {
      expect(checklistContent).toContain('App Review completed for `instagram_content_publish`');
    });

    it('should list required Instagram scopes', () => {
      expect(checklistContent).toContain('instagram_basic');
      expect(checklistContent).toContain('instagram_content_publish');
      expect(checklistContent).toContain('instagram_manage_insights');
      expect(checklistContent).toContain('pages_show_list');
    });

    it('should mention business account requirement', () => {
      expect(checklistContent).toContain('Business/Creator account linked to Facebook Page');
    });
  });

  describe('OAuth Configuration - Reddit', () => {
    it('should include Reddit OAuth requirements', () => {
      expect(checklistContent).toContain('#### Reddit');
      expect(checklistContent).toContain('App registered at reddit.com/prefs/apps');
      expect(checklistContent).toContain('App type: "web app"');
    });

    it('should list required Reddit scopes', () => {
      expect(checklistContent).toContain('identity');
      expect(checklistContent).toContain('submit');
      expect(checklistContent).toContain('edit');
      expect(checklistContent).toContain('read');
      expect(checklistContent).toContain('mysubreddits');
    });

    it('should emphasize Reddit terms review', () => {
      expect(checklistContent).toContain('**IMPORTANT**: Review Reddit Data API Terms');
      expect(checklistContent).toContain('Commercial usage agreement if applicable');
    });
  });

  describe('Environment Variables', () => {
    it('should list required core variables', () => {
      expect(checklistContent).toContain('TOKEN_ENCRYPTION_KEY');
      expect(checklistContent).toContain('DATABASE_URL');
    });

    it('should list TikTok environment variables', () => {
      expect(checklistContent).toContain('TIKTOK_CLIENT_KEY');
      expect(checklistContent).toContain('TIKTOK_CLIENT_SECRET');
      expect(checklistContent).toContain('NEXT_PUBLIC_TIKTOK_REDIRECT_URI');
      expect(checklistContent).toContain('TIKTOK_WEBHOOK_SECRET');
    });

    it('should list Instagram environment variables', () => {
      expect(checklistContent).toContain('FACEBOOK_APP_ID');
      expect(checklistContent).toContain('FACEBOOK_APP_SECRET');
      expect(checklistContent).toContain('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI');
      expect(checklistContent).toContain('INSTAGRAM_WEBHOOK_SECRET');
    });

    it('should list Reddit environment variables', () => {
      expect(checklistContent).toContain('REDDIT_CLIENT_ID');
      expect(checklistContent).toContain('REDDIT_CLIENT_SECRET');
      expect(checklistContent).toContain('NEXT_PUBLIC_REDDIT_REDIRECT_URI');
    });

    it('should use production domain in examples', () => {
      expect(checklistContent).toContain('https://huntaze.com');
    });
  });

  describe('Database Migration', () => {
    it('should include migration command', () => {
      expect(checklistContent).toContain('psql $DATABASE_URL -f lib/db/migrations/2024-10-31-social-integrations.sql');
    });

    it('should include verification commands', () => {
      expect(checklistContent).toContain('psql $DATABASE_URL -c "\\dt oauth_accounts"');
      expect(checklistContent).toContain('psql $DATABASE_URL -c "\\dt tiktok_posts"');
      expect(checklistContent).toContain('psql $DATABASE_URL -c "\\dt instagram_accounts"');
      expect(checklistContent).toContain('psql $DATABASE_URL -c "\\dt reddit_posts"');
    });
  });

  describe('Rate Limits & Quotas', () => {
    it('should document TikTok rate limits', () => {
      expect(checklistContent).toContain('Rate limit: 6 requests/minute per access_token');
      expect(checklistContent).toContain('Max 5 pending shares per 24 hours');
      expect(checklistContent).toContain('Implement exponential backoff for 429 errors');
    });

    it('should document Instagram rate limits', () => {
      expect(checklistContent).toContain('Container creation rate limits');
      expect(checklistContent).toContain('Monitor container status polling');
    });

    it('should document Reddit rate limits', () => {
      expect(checklistContent).toContain('OAuth rate limits (60 requests/minute when authenticated)');
      expect(checklistContent).toContain('Respect `x-ratelimit-*` headers');
    });
  });

  describe('Error Handling', () => {
    it('should include error handling checklist', () => {
      expect(checklistContent).toContain('All API calls have try-catch blocks');
      expect(checklistContent).toContain('Errors logged with correlation IDs');
      expect(checklistContent).toContain('User-friendly error messages');
      expect(checklistContent).toContain('No sensitive data in error responses');
    });

    it('should mention retry logic', () => {
      expect(checklistContent).toContain('Retry logic with exponential backoff');
      expect(checklistContent).toContain('Circuit breaker for failing services');
    });
  });

  describe('Security', () => {
    it('should include token encryption requirement', () => {
      expect(checklistContent).toContain('All tokens encrypted at rest (AES-256-GCM)');
    });

    it('should require HTTPS', () => {
      expect(checklistContent).toContain('HTTPS enforced for all OAuth callbacks');
    });

    it('should mention CSRF protection', () => {
      expect(checklistContent).toContain('CSRF protection with state parameter');
    });

    it('should require webhook signature verification', () => {
      expect(checklistContent).toContain('Webhook signature verification enabled');
    });

    it('should mention secrets management', () => {
      expect(checklistContent).toContain('Secrets stored in secure vault (not in code)');
    });

    it('should require rate limiting', () => {
      expect(checklistContent).toContain('Rate limiting on all endpoints');
    });

    it('should require input validation', () => {
      expect(checklistContent).toContain('Input validation on all user inputs');
    });
  });

  describe('Monitoring & Observability', () => {
    it('should require structured logging', () => {
      expect(checklistContent).toContain('Structured logging with correlation IDs');
    });

    it('should list required metrics', () => {
      expect(checklistContent).toContain('Metrics for OAuth success rates');
      expect(checklistContent).toContain('Metrics for publish success rates');
      expect(checklistContent).toContain('Metrics for webhook processing latency');
    });

    it('should define alert thresholds', () => {
      expect(checklistContent).toContain('Alerts for high error rates (>5%)');
      expect(checklistContent).toContain('Alerts for webhook backlog (>100 events)');
      expect(checklistContent).toContain('Alerts for token refresh failures');
    });

    it('should require dashboard', () => {
      expect(checklistContent).toContain('Dashboard for platform health');
    });
  });

  describe('Workers & Background Jobs', () => {
    it('should list required workers', () => {
      expect(checklistContent).toContain('Token refresh scheduler running (every 30 min)');
      expect(checklistContent).toContain('Webhook processor queue configured');
      expect(checklistContent).toContain('Reddit sync worker scheduled (every 15-30 min)');
    });

    it('should mention dead letter queue', () => {
      expect(checklistContent).toContain('Dead letter queue for failed jobs');
    });

    it('should require health checks', () => {
      expect(checklistContent).toContain('Worker health checks');
    });
  });

  describe('Compliance & Legal', () => {
    it('should have Reddit-specific compliance section', () => {
      expect(checklistContent).toContain('#### Reddit Specific');
      expect(checklistContent).toContain('Review Reddit Data API Terms');
      expect(checklistContent).toContain('https://www.redditinc.com/policies/data-api-terms');
    });

    it('should mention commercial use agreement', () => {
      expect(checklistContent).toContain('Commercial use requires separate agreement');
      expect(checklistContent).toContain('Add "Reddit API Usage" section to Terms of Service');
    });

    it('should mention subreddit rules', () => {
      expect(checklistContent).toContain('Respect subreddit rules (flair, NSFW, limits)');
    });

    it('should have Instagram-specific compliance', () => {
      expect(checklistContent).toContain('#### Instagram Specific');
      expect(checklistContent).toContain('Meta Platform Terms accepted');
      expect(checklistContent).toContain('App Review completed for publishing permissions');
    });

    it('should have TikTok-specific compliance', () => {
      expect(checklistContent).toContain('#### TikTok Specific');
      expect(checklistContent).toContain('TikTok Developer Terms accepted');
      expect(checklistContent).toContain('Content Posting API terms reviewed');
    });
  });

  describe('Testing Requirements', () => {
    it('should list smoke tests', () => {
      expect(checklistContent).toContain('#### Smoke Tests');
      expect(checklistContent).toContain('TikTok OAuth flow end-to-end');
      expect(checklistContent).toContain('Instagram OAuth flow end-to-end');
      expect(checklistContent).toContain('Reddit OAuth flow end-to-end');
    });

    it('should list load tests', () => {
      expect(checklistContent).toContain('#### Load Tests');
      expect(checklistContent).toContain('Concurrent OAuth flows');
      expect(checklistContent).toContain('Webhook burst handling');
    });

    it('should mention token refresh testing', () => {
      expect(checklistContent).toContain('Token refresh for all platforms');
    });

    it('should mention webhook testing', () => {
      expect(checklistContent).toContain('Webhook processing for TikTok & Instagram');
    });
  });

  describe('Deployment Steps', () => {
    it('should include pre-deployment checks', () => {
      expect(checklistContent).toContain('### 1. Pre-Deployment');
      expect(checklistContent).toContain('npm test');
      expect(checklistContent).toContain('npm run build');
      expect(checklistContent).toContain('npm run type-check');
    });

    it('should include database backup', () => {
      expect(checklistContent).toContain('### 2. Database');
      expect(checklistContent).toContain('pg_dump $DATABASE_URL');
    });

    it('should include deployment commands', () => {
      expect(checklistContent).toContain('### 3. Deploy Application');
      expect(checklistContent).toContain('vercel --prod');
      expect(checklistContent).toContain('git push origin main');
    });

    it('should include post-deployment verification', () => {
      expect(checklistContent).toContain('### 4. Post-Deployment Verification');
      expect(checklistContent).toContain('curl https://huntaze.com/api/health');
    });

    it('should include worker enablement', () => {
      expect(checklistContent).toContain('### 5. Enable Workers');
      expect(checklistContent).toContain('*/30 * * * *');
      expect(checklistContent).toContain('*/15 * * * *');
    });
  });

  describe('Monitoring Dashboards', () => {
    it('should list key metrics to track', () => {
      expect(checklistContent).toContain('### Key Metrics to Track');
      expect(checklistContent).toContain('**OAuth Success Rate** by platform');
      expect(checklistContent).toContain('**Publish Success Rate** by platform');
      expect(checklistContent).toContain('**Token Refresh Success Rate**');
    });

    it('should define alert thresholds', () => {
      expect(checklistContent).toContain('### Alerts to Configure');
      expect(checklistContent).toContain('OAuth success rate < 95% for 5 minutes');
      expect(checklistContent).toContain('Publish success rate < 90% for 5 minutes');
    });

    it('should mention percentiles for latency', () => {
      expect(checklistContent).toContain('(P50, P95, P99)');
    });
  });

  describe('Security Checklist', () => {
    it('should include secrets rotation', () => {
      expect(checklistContent).toContain('Secrets rotation plan in place');
    });

    it('should mention encryption key backup', () => {
      expect(checklistContent).toContain('Encryption keys backed up securely');
    });

    it('should require audit trail', () => {
      expect(checklistContent).toContain('Audit trail for OAuth connections');
    });

    it('should mention security scans', () => {
      expect(checklistContent).toContain('Regular security scans scheduled');
      expect(checklistContent).toContain('Dependency vulnerability scanning');
    });

    it('should require HTTPS certificate renewal', () => {
      expect(checklistContent).toContain('HTTPS certificate auto-renewal configured');
    });
  });

  describe('Documentation Requirements', () => {
    it('should list required documentation', () => {
      expect(checklistContent).toContain('## 📝 Documentation');
      expect(checklistContent).toContain('User guide published');
      expect(checklistContent).toContain('Developer documentation complete');
      expect(checklistContent).toContain('API reference available');
    });

    it('should require troubleshooting guide', () => {
      expect(checklistContent).toContain('Troubleshooting guide created');
      expect(checklistContent).toContain('Runbook for common issues');
    });

    it('should require incident response plan', () => {
      expect(checklistContent).toContain('Incident response plan documented');
    });
  });

  describe('Sign-Off Requirements', () => {
    it('should require technical approval', () => {
      expect(checklistContent).toContain('Technical lead approval');
    });

    it('should require security review', () => {
      expect(checklistContent).toContain('Security review completed');
    });

    it('should require legal review', () => {
      expect(checklistContent).toContain('Legal review completed (especially Reddit terms)');
    });

    it('should require product owner approval', () => {
      expect(checklistContent).toContain('Product owner approval');
    });

    it('should require stakeholder notification', () => {
      expect(checklistContent).toContain('Stakeholder notification sent');
    });
  });

  describe('Metadata', () => {
    it('should have last updated date', () => {
      expect(checklistContent).toContain('**Last Updated**:');
    });

    it('should have next review date', () => {
      expect(checklistContent).toContain('**Next Review**:');
    });

    it('should mention production deployment', () => {
      expect(checklistContent).toContain('Before production deployment');
    });
  });

  describe('Checklist Format', () => {
    it('should use checkbox format', () => {
      const checkboxPattern = /- \[ \]/g;
      const checkboxes = checklistContent.match(checkboxPattern);
      expect(checkboxes).toBeTruthy();
      expect(checkboxes!.length).toBeGreaterThan(50);
    });

    it('should have organized sections with headers', () => {
      const h3Headers = checklistContent.match(/### \d+\./g);
      expect(h3Headers).toBeTruthy();
      expect(h3Headers!.length).toBeGreaterThan(5);
    });

    it('should use code blocks for commands', () => {
      expect(checklistContent).toContain('```bash');
      expect(checklistContent).toContain('```');
    });

    it('should use emojis for section markers', () => {
      expect(checklistContent).toContain('🎯');
      expect(checklistContent).toContain('🚀');
      expect(checklistContent).toContain('📊');
      expect(checklistContent).toContain('🔒');
      expect(checklistContent).toContain('✅');
    });
  });

  describe('Completeness Validation', () => {
    it('should cover all three platforms', () => {
      expect(checklistContent).toContain('TikTok');
      expect(checklistContent).toContain('Instagram');
      expect(checklistContent).toContain('Reddit');
    });

    it('should have at least 10 main sections', () => {
      const mainSections = checklistContent.match(/^## /gm);
      expect(mainSections).toBeTruthy();
      expect(mainSections!.length).toBeGreaterThanOrEqual(10);
    });

    it('should reference migration file', () => {
      expect(checklistContent).toContain('2024-10-31-social-integrations.sql');
    });

    it('should reference all OAuth tables', () => {
      expect(checklistContent).toContain('oauth_accounts');
      expect(checklistContent).toContain('tiktok_posts');
      expect(checklistContent).toContain('instagram_accounts');
      expect(checklistContent).toContain('reddit_posts');
    });

    it('should mention all worker types', () => {
      expect(checklistContent).toContain('token refresh');
      expect(checklistContent).toContain('webhook processor');
      expect(checklistContent).toContain('Reddit sync worker');
    });
  });

  describe('Best Practices', () => {
    it('should emphasize HTTPS requirement', () => {
      const httpsMatches = checklistContent.match(/HTTPS/gi);
      expect(httpsMatches).toBeTruthy();
      expect(httpsMatches!.length).toBeGreaterThan(3);
    });

    it('should mention exponential backoff multiple times', () => {
      const backoffMatches = checklistContent.match(/exponential backoff/gi);
      expect(backoffMatches).toBeTruthy();
      expect(backoffMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should emphasize monitoring', () => {
      const monitoringMatches = checklistContent.match(/monitor/gi);
      expect(monitoringMatches).toBeTruthy();
      expect(monitoringMatches!.length).toBeGreaterThan(5);
    });

    it('should mention correlation IDs', () => {
      expect(checklistContent).toContain('correlation IDs');
    });
  });
});
