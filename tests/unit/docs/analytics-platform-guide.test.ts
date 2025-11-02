/**
 * Unit Tests - Analytics Platform Guide Documentation
 * 
 * Tests to validate the Analytics Platform Guide documentation
 * 
 * Coverage:
 * - Documentation structure and completeness
 * - Platform capabilities and limitations
 * - Metrics normalization specifications
 * - Database schema validation
 * - API endpoint specifications
 * - Rate limit documentation
 * - Compliance requirements
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Analytics Platform Guide - Documentation', () => {
  let guideContent: string;

  beforeAll(() => {
    const guidePath = join(process.cwd(), 'docs/ANALYTICS_PLATFORM_GUIDE.md');
    guideContent = readFileSync(guidePath, 'utf-8');
  });

  describe('Document Structure', () => {
    it('should have main title', () => {
      expect(guideContent).toContain('# Analytics Platform Guide - Huntaze');
    });

    it('should have overview section', () => {
      expect(guideContent).toContain('## Overview');
    });

    it('should have platform capabilities section', () => {
      expect(guideContent).toContain('## Platform Capabilities & Limitations');
    });

    it('should have metrics normalization section', () => {
      expect(guideContent).toContain('## Metrics Normalization');
    });

    it('should have database schema section', () => {
      expect(guideContent).toContain('## Database Schema');
    });

    it('should have data collection pipeline section', () => {
      expect(guideContent).toContain('## Data Collection Pipeline');
    });

    it('should have compliance section', () => {
      expect(guideContent).toContain('## Compliance & Best Practices');
    });

    it('should have API endpoints section', () => {
      expect(guideContent).toContain('## API Endpoints');
    });

    it('should have monitoring section', () => {
      expect(guideContent).toContain('## Monitoring & Observability');
    });

    it('should have references section', () => {
      expect(guideContent).toContain('## References');
    });
  });

  describe('TikTok Platform Specifications', () => {
    it('should document TikTok available metrics', () => {
      expect(guideContent).toContain('### TikTok');
      expect(guideContent).toContain('follower_count');
      expect(guideContent).toContain('likes_count');
      expect(guideContent).toContain('video_count');
      expect(guideContent).toContain('view_count');
      expect(guideContent).toContain('like_count');
      expect(guideContent).toContain('comment_count');
      expect(guideContent).toContain('share_count');
    });

    it('should document TikTok API endpoints', () => {
      expect(guideContent).toContain('/v2/user/info/');
      expect(guideContent).toContain('/v2/video/query/');
    });

    it('should document TikTok rate limits', () => {
      expect(guideContent).toContain('600 requests/minute');
      expect(guideContent).toContain('429');
    });

    it('should include TikTok API references', () => {
      expect(guideContent).toContain('developers.tiktok.com');
      expect(guideContent).toContain('Display API');
    });
  });

  describe('Instagram Platform Specifications', () => {
    it('should document Instagram available metrics', () => {
      expect(guideContent).toContain('### Instagram');
      expect(guideContent).toContain('reach');
      expect(guideContent).toContain('impressions');
      expect(guideContent).toContain('interactions');
    });

    it('should document Instagram requirements', () => {
      expect(guideContent).toContain('Professional account');
      expect(guideContent).toContain('Business or Creator');
      expect(guideContent).toContain('Facebook Page');
      expect(guideContent).toContain('OAuth scopes');
    });

    it('should include Instagram API references', () => {
      expect(guideContent).toContain('Graph API');
      expect(guideContent).toContain('facebook.com/business');
    });
  });

  describe('Reddit Platform Specifications', () => {
    it('should document Reddit available metrics', () => {
      expect(guideContent).toContain('### Reddit');
      expect(guideContent).toContain('score');
      expect(guideContent).toContain('num_comments');
      expect(guideContent).toContain('NSFW');
      expect(guideContent).toContain('flair');
    });

    it('should document Reddit limitations', () => {
      expect(guideContent).toContain('impressions/reach NOT exposed');
      expect(guideContent).toContain('Follower count for users NOT available');
      expect(guideContent).toContain('Reddit Pro');
    });

    it('should document Reddit rate limits', () => {
      expect(guideContent).toContain('100 queries per minute');
      expect(guideContent).toContain('QPM');
      expect(guideContent).toContain('X-Ratelimit-');
    });

    it('should include Reddit API references', () => {
      expect(guideContent).toContain('reddit.com/dev/api');
      expect(guideContent).toContain('Data API');
    });
  });

  describe('Metrics Normalization', () => {
    it('should document followers normalization', () => {
      expect(guideContent).toContain('### Followers');
      expect(guideContent).toContain('follower_count');
      expect(guideContent).toContain('followers');
    });

    it('should document engagement calculation', () => {
      expect(guideContent).toContain('### Engagement');
      expect(guideContent).toContain('engagement_total = likes + comments + shares + saves');
    });

    it('should document engagement rate formulas', () => {
      expect(guideContent).toContain('### Engagement Rate');
      expect(guideContent).toContain('ER_followers');
      expect(guideContent).toContain('ER_impressions');
      expect(guideContent).toContain('(total_engagement / followers) × 100');
      expect(guideContent).toContain('(total_engagement / impressions) × 100');
    });

    it('should reference industry standards', () => {
      expect(guideContent).toContain('Sprout Social');
      expect(guideContent).toContain('Social Media Dashboard');
    });

    it('should recommend displaying both ER options', () => {
      expect(guideContent).toContain('Display both options with toggle');
    });
  });

  describe('Database Schema', () => {
    it('should define analytics_snapshots table', () => {
      expect(guideContent).toContain('CREATE TABLE analytics_snapshots');
    });

    it('should include required columns', () => {
      expect(guideContent).toContain('id BIGSERIAL PRIMARY KEY');
      expect(guideContent).toContain('account_id TEXT NOT NULL');
      expect(guideContent).toContain('platform TEXT NOT NULL');
      expect(guideContent).toContain('snapshot_date DATE NOT NULL');
    });

    it('should include core metrics columns', () => {
      expect(guideContent).toContain('followers INTEGER');
      expect(guideContent).toContain('impressions BIGINT');
      expect(guideContent).toContain('reach BIGINT');
      expect(guideContent).toContain('posts_count INTEGER');
    });

    it('should include engagement breakdown columns', () => {
      expect(guideContent).toContain('engagement_count BIGINT');
      expect(guideContent).toContain('likes BIGINT');
      expect(guideContent).toContain('comments BIGINT');
      expect(guideContent).toContain('shares BIGINT');
      expect(guideContent).toContain('saves BIGINT');
      expect(guideContent).toContain('video_views BIGINT');
    });

    it('should include metadata columns', () => {
      expect(guideContent).toContain('source TEXT');
      expect(guideContent).toContain('calc_method TEXT');
      expect(guideContent).toContain('created_at TIMESTAMP');
    });

    it('should define platform constraint', () => {
      expect(guideContent).toContain("CHECK (platform IN ('tiktok','instagram','reddit'))");
    });

    it('should define unique constraint', () => {
      expect(guideContent).toContain('UNIQUE (account_id, platform, snapshot_date)');
    });

    it('should define indexes', () => {
      expect(guideContent).toContain('CREATE INDEX idx_snapshots_account_platform');
      expect(guideContent).toContain('CREATE INDEX idx_snapshots_date');
    });
  });

  describe('Data Collection Pipeline', () => {
    it('should document daily worker schedule', () => {
      expect(guideContent).toContain('Daily Worker Process');
      expect(guideContent).toContain('02:00 UTC');
    });

    it('should document TikTok collection steps', () => {
      expect(guideContent).toContain('TikTok Collection:');
      expect(guideContent).toContain('/v2/user/info/');
      expect(guideContent).toContain('/v2/video/query/');
      expect(guideContent).toContain('batch 20');
    });

    it('should document Instagram collection steps', () => {
      expect(guideContent).toContain('Instagram Collection:');
      expect(guideContent).toContain('Verify account is Professional');
      expect(guideContent).toContain('Fetch Insights via Graph API');
    });

    it('should document Reddit collection steps', () => {
      expect(guideContent).toContain('Reddit Collection:');
      expect(guideContent).toContain('Use OAuth');
      expect(guideContent).toContain('User-Agent');
      expect(guideContent).toContain('100 QPM');
    });

    it('should document error handling', () => {
      expect(guideContent).toContain('### Error Handling');
      expect(guideContent).toContain('response.status === 429');
      expect(guideContent).toContain('Retry-After');
      expect(guideContent).toContain('exponential backoff');
    });

    it('should document missing data handling', () => {
      expect(guideContent).toContain('?? null');
      expect(guideContent).toContain('source indicator');
    });
  });

  describe('Analytics Dashboard Calculations', () => {
    it('should document total followers calculation', () => {
      expect(guideContent).toContain('### Total Followers');
      expect(guideContent).toContain('tiktokFollowers');
      expect(guideContent).toContain('instagramFollowers');
    });

    it('should document total engagement calculation', () => {
      expect(guideContent).toContain('### Total Engagement');
      expect(guideContent).toContain('snapshots.reduce');
      expect(guideContent).toContain('engagement_count');
    });

    it('should document average engagement rate calculation', () => {
      expect(guideContent).toContain('### Average Engagement Rate');
      expect(guideContent).toContain('totalEngagement / totalFollowers');
      expect(guideContent).toContain('totalEngagement / totalImpressions');
    });

    it('should document week-over-week growth calculation', () => {
      expect(guideContent).toContain('### Week-over-Week Growth');
      expect(guideContent).toContain('currentWeek - previousWeek');
      expect(guideContent).toContain('previousWeek');
    });
  });

  describe('Compliance & Best Practices', () => {
    it('should document rate limit management', () => {
      expect(guideContent).toContain('### Rate Limit Management');
      expect(guideContent).toContain('circuit breaker');
      expect(guideContent).toContain('rate limiter');
    });

    it('should document token management', () => {
      expect(guideContent).toContain('### Token Management');
      expect(guideContent).toContain('Refresh tokens server-side');
      expect(guideContent).toContain('Encrypt tokens at rest');
      expect(guideContent).toContain('AES-256');
    });

    it('should document data deletion requirements', () => {
      expect(guideContent).toContain('### Data Deletion');
      expect(guideContent).toContain('Reddit Data API Terms');
      expect(guideContent).toContain('deleted on Reddit');
      expect(guideContent).toContain('purge from Huntaze');
    });
  });

  describe('API Endpoints', () => {
    it('should document analytics overview endpoint', () => {
      expect(guideContent).toContain('GET /api/analytics/overview');
      expect(guideContent).toContain('timeRange=30d');
    });

    it('should document platform-specific endpoints', () => {
      expect(guideContent).toContain('GET /api/analytics/platform/tiktok');
      expect(guideContent).toContain('GET /api/analytics/platform/instagram');
      expect(guideContent).toContain('GET /api/analytics/platform/reddit');
    });

    it('should document content performance endpoint', () => {
      expect(guideContent).toContain('GET /api/analytics/content');
      expect(guideContent).toContain('limit=10');
      expect(guideContent).toContain('sortBy=engagement');
    });

    it('should document trends endpoint', () => {
      expect(guideContent).toContain('GET /api/analytics/trends');
      expect(guideContent).toContain('metric=followers');
    });
  });

  describe('Monitoring & Observability', () => {
    it('should document key metrics', () => {
      expect(guideContent).toContain('### Key Metrics');
      expect(guideContent).toContain('Success Rate');
      expect(guideContent).toContain('Latency');
      expect(guideContent).toContain('Quota Usage');
      expect(guideContent).toContain('Data Freshness');
    });

    it('should document alerts', () => {
      expect(guideContent).toContain('### Alerts');
      expect(guideContent).toContain('Rate limit approaching');
      expect(guideContent).toContain('Failed authentication');
      expect(guideContent).toContain('Data collection failures');
      expect(guideContent).toContain('Stale data');
    });
  });

  describe('References', () => {
    it('should include TikTok documentation links', () => {
      expect(guideContent).toContain('developers.tiktok.com/doc/display-api-overview');
      expect(guideContent).toContain('developers.tiktok.com/doc/content-posting-api-overview');
      expect(guideContent).toContain('developers.tiktok.com/doc/server-api-rate-limits');
    });

    it('should include Instagram documentation links', () => {
      expect(guideContent).toContain('postman.com/meta/instagram-graph-api');
      expect(guideContent).toContain('facebook.com/business/help');
    });

    it('should include Reddit documentation links', () => {
      expect(guideContent).toContain('reddit.com/dev/api');
      expect(guideContent).toContain('github.com/reddit-archive/reddit/wiki/API');
      expect(guideContent).toContain('reddithelp.com');
    });

    it('should include industry standards links', () => {
      expect(guideContent).toContain('sproutsocial.com/insights/engagement-rate');
      expect(guideContent).toContain('socialmedia-dashboard.com/engagement-rate');
    });
  });

  describe('Code Examples', () => {
    it('should include TypeScript code examples', () => {
      expect(guideContent).toContain('```typescript');
    });

    it('should include SQL code examples', () => {
      expect(guideContent).toContain('```sql');
    });

    it('should include rate limit handling example', () => {
      expect(guideContent).toContain('if (response.status === 429)');
      expect(guideContent).toContain('await sleep');
    });

    it('should include data storage example', () => {
      expect(guideContent).toContain('await createSnapshot');
    });
  });

  describe('Metadata', () => {
    it('should have last updated date', () => {
      expect(guideContent).toContain('**Last Updated:**');
      expect(guideContent).toContain('October 31, 2024');
    });

    it('should have version number', () => {
      expect(guideContent).toContain('**Version:**');
      expect(guideContent).toContain('1.0');
    });

    it('should have maintainer information', () => {
      expect(guideContent).toContain('**Maintainer:**');
      expect(guideContent).toContain('Huntaze Development Team');
    });
  });

  describe('Completeness Validation', () => {
    it('should cover all three platforms', () => {
      const tiktokCount = (guideContent.match(/TikTok/gi) || []).length;
      const instagramCount = (guideContent.match(/Instagram/gi) || []).length;
      const redditCount = (guideContent.match(/Reddit/gi) || []).length;

      expect(tiktokCount).toBeGreaterThan(10);
      expect(instagramCount).toBeGreaterThan(10);
      expect(redditCount).toBeGreaterThan(10);
    });

    it('should document all required sections', () => {
      const requiredSections = [
        'Overview',
        'Platform Capabilities',
        'Metrics Normalization',
        'Database Schema',
        'Data Collection Pipeline',
        'Analytics Dashboard Calculations',
        'Compliance & Best Practices',
        'API Endpoints',
        'Monitoring & Observability',
        'References',
      ];

      requiredSections.forEach(section => {
        expect(guideContent).toContain(section);
      });
    });

    it('should have sufficient technical detail', () => {
      // Check for technical terms
      const technicalTerms = [
        'rate limit',
        'OAuth',
        'API',
        'endpoint',
        'metric',
        'engagement',
        'follower',
        'impression',
        'reach',
      ];

      technicalTerms.forEach(term => {
        expect(guideContent.toLowerCase()).toContain(term.toLowerCase());
      });
    });

    it('should provide actionable guidance', () => {
      // Check for actionable verbs
      const actionableVerbs = [
        'implement',
        'use',
        'fetch',
        'store',
        'monitor',
        'handle',
      ];

      actionableVerbs.forEach(verb => {
        expect(guideContent.toLowerCase()).toContain(verb.toLowerCase());
      });
    });
  });
});
