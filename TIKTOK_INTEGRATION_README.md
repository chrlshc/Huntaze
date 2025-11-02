# TikTok Integration - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up and deploy the TikTok integration.

## Prerequisites

- Node.js 18+
- PostgreSQL database (AWS RDS recommended)
- TikTok Developer Account
- Environment variables configured

## 1. TikTok Developer Setup

### Create TikTok App

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Get your **Client Key** and **Client Secret**
4. Configure redirect URI: `https://your-domain.com/api/auth/tiktok/callback`
5. Request scopes: `user.info.basic`, `video.upload`, `video.publish`

### Configure Webhooks (Optional)

1. In TikTok Developer Portal, go to Webhooks
2. Set webhook URL: `https://your-domain.com/api/webhooks/tiktok`
3. Subscribe to events: `video.publish.complete`, `video.publish.failed`, `video.inbox.received`
4. Save your webhook secret

## 2. Environment Variables

Create or update your `.env` file:

```bash
# TikTok OAuth
TIKTOK_CLIENT_KEY=your-client-key-here
TIKTOK_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://your-domain.com/api/auth/tiktok/callback

# Token Encryption (generate with: openssl rand -hex 32)
TOKEN_ENCRYPTION_KEY=your-64-char-hex-key-here

# Webhooks (optional, from TikTok Developer Portal)
TIKTOK_WEBHOOK_SECRET=your-webhook-secret-here

# Workers (generate random secret)
WORKER_SECRET=your-worker-secret-here

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
```

## 3. Database Setup

### Run Migration

```bash
# Using the migration script
node scripts/migrate-social-integrations.js

# Or manually
psql $DATABASE_URL < lib/db/migrations/2024-10-31-social-integrations.sql
```

### Verify Tables

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('oauth_accounts', 'tiktok_posts', 'webhook_events');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('oauth_accounts', 'tiktok_posts', 'webhook_events');
```

## 4. Deploy Application

### Development

```bash
npm install
npm run dev
```

Visit: `http://localhost:3000/platforms/connect/tiktok`

### Production

```bash
npm run build
npm start
```

## 5. Setup Background Workers

### Option A: Cron Jobs (Recommended)

Add to your crontab:

```bash
# Token refresh (every 30 minutes)
*/30 * * * * curl -X POST https://your-domain.com/api/workers/token-refresh \
  -H "Authorization: Bearer $WORKER_SECRET" \
  >> /var/log/token-refresh.log 2>&1

# Webhook processing (every 5 minutes)
*/5 * * * * curl -X POST https://your-domain.com/api/workers/webhooks \
  -H "Authorization: Bearer $WORKER_SECRET" \
  >> /var/log/webhook-worker.log 2>&1
```

### Option B: Standalone Processes

```bash
# Terminal 1: Token refresh
node scripts/run-token-refresh.js --interval=1800000

# Terminal 2: Webhook worker
node scripts/run-webhook-worker.js --interval=300000
```

### Option C: AWS Lambda

1. Create two Lambda functions:
   - `tiktok-token-refresh`
   - `tiktok-webhook-worker`

2. Configure EventBridge rules:
   - Token refresh: `rate(30 minutes)`
   - Webhook worker: `rate(5 minutes)`

3. Set environment variables in Lambda

4. Configure HTTP trigger to call worker endpoints

## 6. Testing

### Run Tests

```bash
# All tests
npm test

# Specific test suites
npm test tests/unit/services/tokenEncryption.test.ts
npm test tests/unit/services/tiktokOAuth.test.ts
npm test tests/integration/api/tiktok-oauth-endpoints.test.ts
```

### Manual Testing

**1. Test OAuth Flow:**
```bash
# Visit in browser
https://your-domain.com/platforms/connect/tiktok

# Click "Connect TikTok Account"
# Authorize on TikTok
# Should redirect back with success message
```

**2. Test Upload:**
```bash
curl -X POST https://your-domain.com/api/tiktok/upload \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "source": "PULL_FROM_URL",
    "videoUrl": "https://example.com/video.mp4",
    "title": "Test Video",
    "privacy_level": "PUBLIC_TO_EVERYONE"
  }'
```

**3. Test Webhook:**
```bash
# Send test webhook
curl -X POST https://your-domain.com/api/webhooks/tiktok \
  -H "Content-Type: application/json" \
  -H "x-tiktok-signature: test-signature" \
  -d '{
    "event_type": "video.publish.complete",
    "event_id": "test_123",
    "publish_id": "v_pub_test",
    "post_id": "7123456789"
  }'
```

**4. Test Workers:**
```bash
# Trigger token refresh
curl -X POST https://your-domain.com/api/workers/token-refresh \
  -H "Authorization: Bearer $WORKER_SECRET"

# Trigger webhook worker
curl -X POST https://your-domain.com/api/workers/webhooks \
  -H "Authorization: Bearer $WORKER_SECRET"
```

## 7. Monitoring

### Check Logs

```bash
# Application logs
tail -f logs/app.log

# Worker logs
tail -f /var/log/token-refresh.log
tail -f /var/log/webhook-worker.log
```

### Database Queries

```sql
-- Check OAuth accounts
SELECT id, user_id, provider, open_id, expires_at, created_at 
FROM oauth_accounts 
WHERE provider = 'tiktok';

-- Check TikTok posts
SELECT id, user_id, publish_id, status, source, title, created_at 
FROM tiktok_posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check webhook events
SELECT id, provider, event_type, external_id, processed_at, created_at 
FROM webhook_events 
WHERE provider = 'tiktok' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check pending posts
SELECT COUNT(*) as pending_count 
FROM tiktok_posts 
WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX');

-- Check expiring tokens
SELECT id, user_id, provider, expires_at 
FROM oauth_accounts 
WHERE expires_at <= NOW() + INTERVAL '1 hour' 
AND expires_at > NOW();
```

### Health Checks

```bash
# Check worker endpoints
curl https://your-domain.com/api/workers/webhooks
curl https://your-domain.com/api/workers/token-refresh

# Check connection status
curl https://your-domain.com/api/platforms/tiktok/status \
  -H "Cookie: your-session-cookie"
```

## 8. Troubleshooting

### OAuth Issues

**Problem:** "Invalid redirect URI"
- **Solution:** Ensure `NEXT_PUBLIC_TIKTOK_REDIRECT_URI` matches exactly in TikTok Developer Portal

**Problem:** "Invalid client credentials"
- **Solution:** Verify `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` are correct

**Problem:** "Token expired"
- **Solution:** Check token refresh scheduler is running

### Upload Issues

**Problem:** "Rate limit exceeded"
- **Solution:** Wait 1 minute, TikTok allows 6 requests per minute

**Problem:** "Quota exceeded"
- **Solution:** Wait 24 hours, TikTok allows 5 pending uploads per day

**Problem:** "Access token invalid"
- **Solution:** Reconnect TikTok account

### Webhook Issues

**Problem:** "Invalid signature"
- **Solution:** Verify `TIKTOK_WEBHOOK_SECRET` matches TikTok Developer Portal

**Problem:** "Events not processing"
- **Solution:** Check webhook worker is running and logs for errors

### Worker Issues

**Problem:** "Unauthorized"
- **Solution:** Verify `WORKER_SECRET` is set and matches in request

**Problem:** "Workers not running"
- **Solution:** Check cron jobs or standalone processes are active

## 9. Security Best Practices

- ✅ Use HTTPS in production
- ✅ Rotate `TOKEN_ENCRYPTION_KEY` periodically
- ✅ Keep `WORKER_SECRET` secure
- ✅ Monitor failed login attempts
- ✅ Set up rate limiting
- ✅ Enable webhook signature verification
- ✅ Review logs regularly
- ✅ Keep dependencies updated

## 10. Performance Optimization

### Database Indexes

All necessary indexes are created by migration. Verify with:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('oauth_accounts', 'tiktok_posts', 'webhook_events');
```

### Worker Tuning

Adjust intervals based on your needs:

```bash
# High traffic: More frequent processing
*/2 * * * * # Every 2 minutes

# Low traffic: Less frequent processing
*/15 * * * * # Every 15 minutes
```

### Connection Pooling

Configure PostgreSQL connection pool in `lib/db/index.ts`:

```typescript
const pool = new Pool({
  max: 20,        // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 11. Documentation

- **Complete Overview:** `TIKTOK_INTEGRATION_COMPLETE.md`
- **Progress Tracking:** `SOCIAL_INTEGRATIONS_PROGRESS.md`
- **API Specs:** `.kiro/specs/social-integrations/`
- **Test Documentation:** `*_TESTS_COMPLETE.md` files

## 12. Support

### Common Commands

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# View recent logs
journalctl -u your-app -n 100 --no-pager

# Restart workers
systemctl restart tiktok-workers

# Check environment variables
env | grep TIKTOK
```

### Useful Queries

```sql
-- User's TikTok connection status
SELECT u.email, oa.provider, oa.expires_at, oa.created_at
FROM users u
LEFT JOIN oauth_accounts oa ON u.id = oa.user_id AND oa.provider = 'tiktok'
WHERE u.id = 1;

-- Upload statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds
FROM tiktok_posts
GROUP BY status;

-- Webhook processing stats
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
  COUNT(*) FILTER (WHERE processed_at IS NULL) as pending
FROM webhook_events
WHERE provider = 'tiktok'
GROUP BY event_type;
```

## 🎉 You're Ready!

Your TikTok integration is now set up and ready to use. Visit `/platforms/connect/tiktok` to start connecting accounts!

For questions or issues, refer to the documentation files or check the logs.
