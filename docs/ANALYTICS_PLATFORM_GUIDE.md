# Analytics Platform Guide - Huntaze

## Overview

This document provides technical specifications and implementation guidelines for analytics data collection across TikTok, Instagram, and Reddit platforms.

## Platform Capabilities & Limitations

### TikTok

**Available Metrics:**
- Profile: `follower_count`, `likes_count`, `video_count` via Open API v2 `/v2/user/info/`
- Posts: `view_count`, `like_count`, `comment_count`, `share_count` via `/v2/video/query/`

**Rate Limits:**
- 600 requests/minute per endpoint (1-minute window)
- Returns 429 on limit exceeded

**References:**
- [TikTok Display API - User Info](https://developers.tiktok.com/doc/display-api-get-user-info)
- [TikTok Display API - Query Videos](https://developers.tiktok.com/doc/display-api-query-videos)
- [TikTok Server API - Rate Limits](https://developers.tiktok.com/doc/server-api-rate-limits)

### Instagram

**Available Metrics:**
- Insights (reach, impressions, interactions) available for Professional accounts (Business/Creator) only
- Accessible via Meta Graph API / Business Suite

**Requirements:**
- Professional account (Business or Creator)
- Account connected to Facebook Page
- Proper OAuth scopes

**References:**
- [Instagram Insights Requirements](https://www.facebook.com/business/help/1533933820244654)
- [Instagram Graph API Publishing](https://www.postman.com/meta/instagram-graph-api/documentation)

### Reddit

**Available Metrics:**
- Post data: score (upvotes), `num_comments`, NSFW/spoiler flags, flair
- Accessible via Data API + OAuth

**Limitations:**
- Organic impressions/reach NOT exposed via public API
- Follower count for users NOT available via public API
- Reddit Pro provides views/followers via UI (CSV export possible)

**Rate Limits:**
- 100 queries per minute (QPM) per client_id
- Monitor `X-Ratelimit-*` headers

**References:**
- [Reddit Data API](https://www.reddit.com/dev/api)
- [Reddit API Wiki](https://github.com/reddit-archive/reddit/wiki/API)
- [Reddit Pro Features](https://support.reddithelp.com/hc/en-us/articles/23511859482388-Reddit-Pro)

## Metrics Normalization

### Followers

**TikTok:** `follower_count` from Open API  
**Instagram:** `followers` from Insights (Professional account required)  
**Reddit:** Not available via API
- Option A: Display "—" or "N/A"
- Option B: Import from Reddit Pro CSV if available

### Engagement

**Formula:**
```
engagement_total = likes + comments + shares + saves (when available)
```

**Platform Mapping:**
- TikTok: `like_count + comment_count + share_count`
- Instagram: `likes + comments + shares + saves`
- Reddit: `score + num_comments` (upvotes as "likes")

### Engagement Rate

Two calculation methods to avoid industry debates:

**ER by Followers:**
```
ER_followers = (total_engagement / followers) × 100
```
Reference: [Sprout Social - Engagement Rate](https://sproutsocial.com/insights/engagement-rate/)

**ER by Impressions:**
```
ER_impressions = (total_engagement / impressions) × 100
```
Reference: [Social Media Dashboard - Engagement Rate](https://www.socialmedia-dashboard.com/engagement-rate)

**Recommendation:** Display both options with toggle in UI.

## Database Schema

```sql
-- Daily aggregated snapshots per account
CREATE TABLE analytics_snapshots (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','reddit')),
  snapshot_date DATE NOT NULL,
  
  -- Core metrics
  followers INTEGER,
  impressions BIGINT,
  reach BIGINT,
  posts_count INTEGER,
  
  -- Engagement breakdown
  engagement_count BIGINT,  -- Total: likes+comments+shares+saves
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  saves BIGINT,
  video_views BIGINT,
  
  -- Metadata
  source TEXT,              -- 'api', 'reddit_pro_csv', etc.
  calc_method TEXT,         -- 'er_followers' | 'er_impressions'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account_id, platform, snapshot_date)
);

CREATE INDEX idx_snapshots_account_platform ON analytics_snapshots(account_id, platform);
CREATE INDEX idx_snapshots_date ON analytics_snapshots(snapshot_date DESC);
```

## Data Collection Pipeline

### Daily Worker Process

**Schedule:** Run daily at 02:00 UTC (configurable)

**TikTok Collection:**
1. GET `/v2/user/info/?fields=follower_count,video_count,likes_count`
2. POST `/v2/video/query/?fields=view_count,like_count,comment_count,share_count` (batch 20 IDs)
3. Respect 600 rpm/endpoint limit
4. Implement exponential backoff on 429

**Instagram Collection:**
1. Verify account is Professional (Business/Creator)
2. Fetch Insights via Graph API for period
3. Retrieve reach, impressions, interactions per media
4. Handle rate limits gracefully

**Reddit Collection:**
1. Use OAuth with proper User-Agent
2. Fetch submissions via listings
3. Extract score, num_comments, metadata
4. Stay under 100 QPM per client_id
5. Optional: Accept Reddit Pro CSV upload for views/followers

### Error Handling

```typescript
// Rate limit handling
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || 60;
  await sleep(retryAfter * 1000);
  // Retry with exponential backoff
}

// Missing data handling
const followers = data.follower_count ?? null;
const impressions = data.impressions ?? null;

// Store with source indicator
await createSnapshot({
  ...metrics,
  source: 'api',
  calc_method: impressions ? 'er_impressions' : 'er_followers'
});
```

## Analytics Dashboard Calculations

### Total Followers
```typescript
const totalFollowers = 
  tiktokFollowers + 
  instagramFollowers + 
  (redditFollowers ?? 0); // Reddit optional
```

### Total Engagement
```typescript
const totalEngagement = snapshots.reduce((sum, snapshot) => 
  sum + (snapshot.engagement_count || 0), 0
);
```

### Average Engagement Rate
```typescript
// Default: ER by followers
const avgER = totalFollowers > 0
  ? (totalEngagement / totalFollowers) * 100
  : 0;

// Alternative: ER by impressions (when available)
const avgERImpressions = totalImpressions > 0
  ? (totalEngagement / totalImpressions) * 100
  : 0;
```

### Week-over-Week Growth
```typescript
const wow = previousWeek > 0
  ? ((currentWeek - previousWeek) / previousWeek) * 100
  : 0;
```

## Compliance & Best Practices

### Rate Limit Management

**TikTok:**
- 600 requests/minute per endpoint
- Implement circuit breaker pattern
- Queue requests with rate limiter

**Reddit:**
- 100 QPM per client_id
- Monitor `X-Ratelimit-Used`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`
- Use proper User-Agent format

**Instagram:**
- Respect Graph API limits (not publicly documented)
- Implement request budgeting per user
- Handle 429 with backoff

### Token Management

- Refresh tokens server-side before expiration
- Encrypt tokens at rest (AES-256)
- Implement token rotation policy
- Store refresh tokens securely

### Data Deletion (Reddit)

Per Reddit Data API Terms:
- If content is deleted on Reddit, purge from Huntaze database
- Implement webhook or periodic sync to detect deletions
- Comply with user data deletion requests

Reference: [Reddit Data API Terms](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)

## API Endpoints

### Analytics Overview
```
GET /api/analytics/overview?timeRange=30d
```

Returns unified metrics across all platforms.

### Platform-Specific
```
GET /api/analytics/platform/tiktok?timeRange=7d
GET /api/analytics/platform/instagram?timeRange=7d
GET /api/analytics/platform/reddit?timeRange=7d
```

### Content Performance
```
GET /api/analytics/content?limit=10&sortBy=engagement
```

### Trends
```
GET /api/analytics/trends?timeRange=30d&metric=followers
```

## Monitoring & Observability

### Key Metrics

- **Success Rate:** % of successful API calls per platform
- **Latency:** p95 response time for data collection
- **Quota Usage:** Current vs. limit for each platform
- **Data Freshness:** Time since last successful snapshot

### Alerts

- Rate limit approaching (>80% usage)
- Failed authentication (401/403)
- Data collection failures (>5% error rate)
- Stale data (>48 hours since last snapshot)

## References

### Official Documentation

**TikTok:**
- [Display API Documentation](https://developers.tiktok.com/doc/display-api-overview)
- [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-overview)
- [Rate Limits](https://developers.tiktok.com/doc/server-api-rate-limits)

**Instagram:**
- [Graph API Publishing](https://www.postman.com/meta/instagram-graph-api/documentation)
- [Professional Account Requirements](https://www.facebook.com/business/help/1533933820244654)

**Reddit:**
- [Data API Documentation](https://www.reddit.com/dev/api)
- [API Wiki](https://github.com/reddit-archive/reddit/wiki/API)
- [Reddit Pro Features](https://support.reddithelp.com/hc/en-us/articles/23511859482388-Reddit-Pro)

### Industry Standards

- [Sprout Social - Engagement Rate](https://sproutsocial.com/insights/engagement-rate/)
- [Social Media Dashboard - ER Calculation](https://www.socialmedia-dashboard.com/engagement-rate)

---

**Last Updated:** October 31, 2024  
**Version:** 1.0  
**Maintainer:** Huntaze Development Team
