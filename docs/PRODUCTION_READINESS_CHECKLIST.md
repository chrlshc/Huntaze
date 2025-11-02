# Production Readiness Checklist - Social Integrations

## 🎯 Pre-Production Checklist

### 1. OAuth Configuration

#### TikTok
- [ ] App registered in TikTok Developer Portal
- [ ] Content Posting API enabled
- [ ] Login Kit activated
- [ ] Redirect URI configured (HTTPS required)
- [ ] Client Key & Secret in production secrets
- [ ] Scopes: `user.info.basic`, `video.upload`

#### Instagram
- [ ] Facebook App created
- [ ] Instagram Graph API enabled
- [ ] App Review completed for `instagram_content_publish`
- [ ] Business/Creator account linked to Facebook Page
- [ ] Redirect URI configured (HTTPS required)
- [ ] App ID & Secret in production secrets
- [ ] Scopes: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`

#### Reddit
- [ ] App registered at reddit.com/prefs/apps
- [ ] App type: "web app"
- [ ] Redirect URI configured (HTTPS required)
- [ ] Client ID & Secret in production secrets
- [ ] Scopes: `identity`, `submit`, `edit`, `read`, `mysubreddits`
- [ ] **IMPORTANT**: Review Reddit Data API Terms for commercial use
- [ ] Commercial usage agreement if applicable

### 2. Environment Variables

```bash
# Required in production
TOKEN_ENCRYPTION_KEY=<32-byte base64 key>
DATABASE_URL=<production postgres URL>

# TikTok
TIKTOK_CLIENT_KEY=<production key>
TIKTOK_CLIENT_SECRET=<production secret>
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/api/auth/tiktok/callback
TIKTOK_WEBHOOK_SECRET=<webhook secret>

# Instagram/Facebook
FACEBOOK_APP_ID=<production app id>
FACEBOOK_APP_SECRET=<production secret>
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://huntaze.com/api/auth/instagram/callback
INSTAGRAM_WEBHOOK_SECRET=<app secret for verification>

# Reddit
REDDIT_CLIENT_ID=<production client id>
REDDIT_CLIENT_SECRET=<production secret>
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://huntaze.com/api/auth/reddit/callback
```

### 3. Database Migration

```bash
# Run migration
psql $DATABASE_URL -f lib/db/migrations/2024-10-31-social-integrations.sql

# Verify tables
psql $DATABASE_URL -c "\dt oauth_accounts"
psql $DATABASE_URL -c "\dt tiktok_posts"
psql $DATABASE_URL -c "\dt instagram_accounts"
psql $DATABASE_URL -c "\dt reddit_posts"
```

### 4. Rate Limits & Quotas

#### TikTok
- [ ] Rate limit: 6 requests/minute per access_token
- [ ] Max 5 pending shares per 24 hours
- [ ] Implement exponential backoff for 429 errors
- [ ] Log `x-ratelimit-*` headers

#### Instagram
- [ ] Container creation rate limits
- [ ] Monitor container status polling
- [ ] Implement backoff for failed containers
- [ ] Track Graph API rate limits

#### Reddit
- [ ] OAuth rate limits (60 requests/minute when authenticated)
- [ ] Implement exponential backoff for 429 errors
- [ ] Respect `x-ratelimit-*` headers
- [ ] Monitor quota usage

### 5. Error Handling

- [ ] All API calls have try-catch blocks
- [ ] Errors logged with correlation IDs
- [ ] User-friendly error messages
- [ ] No sensitive data in error responses
- [ ] Retry logic with exponential backoff
- [ ] Circuit breaker for failing services

### 6. Security

- [ ] All tokens encrypted at rest (AES-256-GCM)
- [ ] HTTPS enforced for all OAuth callbacks
- [ ] CSRF protection with state parameter
- [ ] Webhook signature verification enabled
- [ ] Secrets stored in secure vault (not in code)
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all user inputs

### 7. Monitoring & Observability

- [ ] Structured logging with correlation IDs
- [ ] Metrics for OAuth success rates
- [ ] Metrics for publish success rates
- [ ] Metrics for webhook processing latency
- [ ] Alerts for high error rates (>5%)
- [ ] Alerts for webhook backlog (>100 events)
- [ ] Alerts for token refresh failures
- [ ] Dashboard for platform health

### 8. Workers & Background Jobs

- [ ] Token refresh scheduler running (every 30 min)
- [ ] Webhook processor queue configured
- [ ] Reddit sync worker scheduled (every 15-30 min)
- [ ] Dead letter queue for failed jobs
- [ ] Worker health checks

### 9. Compliance & Legal

#### Reddit Specific
- [ ] Review Reddit Data API Terms: https://www.redditinc.com/policies/data-api-terms
- [ ] Commercial use requires separate agreement
- [ ] Add "Reddit API Usage" section to Terms of Service
- [ ] Respect subreddit rules (flair, NSFW, limits)
- [ ] Implement content moderation if required

#### Instagram Specific
- [ ] Meta Platform Terms accepted
- [ ] App Review completed for publishing permissions
- [ ] Business/Creator account requirements documented
- [ ] Container→Publish workflow documented

#### TikTok Specific
- [ ] TikTok Developer Terms accepted
- [ ] Content Posting API terms reviewed
- [ ] Spam prevention measures in place

### 10. Testing

#### Smoke Tests
- [ ] TikTok OAuth flow end-to-end
- [ ] TikTok video upload (Draft + Direct Post)
- [ ] Instagram OAuth flow end-to-end
- [ ] Instagram publish (Image + Video + Carousel)
- [ ] Reddit OAuth flow end-to-end
- [ ] Reddit publish (Link + Text posts)
- [ ] Token refresh for all platforms
- [ ] Webhook processing for TikTok & Instagram
- [ ] Metrics sync for Reddit

#### Load Tests
- [ ] Concurrent OAuth flows
- [ ] Concurrent publish requests
- [ ] Webhook burst handling
- [ ] Database connection pool under load

## 🚀 Deployment Steps

### 1. Pre-Deployment
```bash
# Run all tests
npm test

# Build production
npm run build

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

### 2. Database
```bash
# Backup production database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migration
psql $DATABASE_URL -f lib/db/migrations/2024-10-31-social-integrations.sql

# Verify migration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM oauth_accounts"
```

### 3. Deploy Application
```bash
# Deploy to production (example with Vercel)
vercel --prod

# Or AWS Amplify
git push origin main
```

### 4. Post-Deployment Verification
```bash
# Health check
curl https://huntaze.com/api/health

# Test OAuth redirects
curl -I https://huntaze.com/api/auth/tiktok
curl -I https://huntaze.com/api/auth/instagram
curl -I https://huntaze.com/api/auth/reddit

# Check logs
# Monitor for errors in first 30 minutes
```

### 5. Enable Workers
```bash
# Start token refresh scheduler
# Configure cron: */30 * * * * (every 30 minutes)

# Start webhook processor
# Configure queue consumer

# Start Reddit sync worker
# Configure cron: */15 * * * * (every 15 minutes)
```

## 📊 Monitoring Dashboards

### Key Metrics to Track
1. **OAuth Success Rate** by platform
2. **Publish Success Rate** by platform
3. **Token Refresh Success Rate**
4. **Webhook Processing Latency** (P50, P95, P99)
5. **API Error Rates** by endpoint
6. **Database Connection Pool Usage**
7. **Worker Queue Depth**

### Alerts to Configure
1. OAuth success rate < 95% for 5 minutes
2. Publish success rate < 90% for 5 minutes
3. Webhook backlog > 100 events
4. Token refresh failures > 10 in 1 hour
5. API error rate > 5% for 5 minutes
6. Database connection pool > 80% for 5 minutes

## 🔒 Security Checklist

- [ ] Secrets rotation plan in place
- [ ] Encryption keys backed up securely
- [ ] Access logs enabled
- [ ] Audit trail for OAuth connections
- [ ] Regular security scans scheduled
- [ ] Dependency vulnerability scanning
- [ ] HTTPS certificate auto-renewal configured

## 📝 Documentation

- [ ] User guide published
- [ ] Developer documentation complete
- [ ] API reference available
- [ ] Troubleshooting guide created
- [ ] Runbook for common issues
- [ ] Incident response plan documented

## ✅ Sign-Off

- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Legal review completed (especially Reddit terms)
- [ ] Product owner approval
- [ ] Stakeholder notification sent

---

**Last Updated**: October 31, 2024
**Next Review**: Before production deployment
