# 🚀 Huntaze Social Integrations - Ready for Production

## ✅ Implementation Complete

**3 platforms fully implemented and tested:**
- ✅ TikTok (OAuth, Publishing, Webhooks, CRM, UI)
- ✅ Instagram (OAuth, Publishing, Webhooks, CRM, UI)
- ✅ Reddit (OAuth, Publishing, CRM, UI)

## 📋 Pre-Deployment Checklist

### Critical Items

- [ ] Review `docs/PRODUCTION_READINESS_CHECKLIST.md`
- [ ] Configure all environment variables
- [ ] Run database migration
- [ ] Set up OAuth apps on each platform
- [ ] Configure HTTPS callbacks
- [ ] Review Reddit Data API Terms (commercial use)
- [ ] Set up monitoring and alerts
- [ ] Configure background workers

### Documentation

✅ **User Guide**: `docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md`
- How to connect accounts
- How to publish content
- Troubleshooting

✅ **Developer Guide**: `docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md`
- Architecture overview
- OAuth implementation details
- Publishing workflows
- Security best practices

✅ **Production Checklist**: `docs/PRODUCTION_READINESS_CHECKLIST.md`
- Complete pre-deployment checklist
- Environment configuration
- Monitoring setup
- Compliance requirements

## 🔑 Environment Variables Required

```bash
# Core
TOKEN_ENCRYPTION_KEY=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
DATABASE_URL=postgresql://...

# TikTok
TIKTOK_CLIENT_KEY=<from TikTok Developer Portal>
TIKTOK_CLIENT_SECRET=<from TikTok Developer Portal>
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/api/auth/tiktok/callback
TIKTOK_WEBHOOK_SECRET=<from TikTok Developer Portal>

# Instagram/Facebook
FACEBOOK_APP_ID=<from Meta Developer Portal>
FACEBOOK_APP_SECRET=<from Meta Developer Portal>
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://huntaze.com/api/auth/instagram/callback
INSTAGRAM_WEBHOOK_SECRET=<App Secret from Meta>

# Reddit
REDDIT_CLIENT_ID=<from reddit.com/prefs/apps>
REDDIT_CLIENT_SECRET=<from reddit.com/prefs/apps>
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://huntaze.com/api/auth/reddit/callback
```

## 🗄️ Database Migration

```bash
# Backup first!
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migration
psql $DATABASE_URL -f lib/db/migrations/2024-10-31-social-integrations.sql

# Verify
psql $DATABASE_URL -c "\dt oauth_accounts"
psql $DATABASE_URL -c "\dt tiktok_posts"
psql $DATABASE_URL -c "\dt instagram_accounts"
psql $DATABASE_URL -c "\dt reddit_posts"
```

## 🔧 Platform Setup

### TikTok
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create app or use existing
3. Enable **Login Kit** and **Content Posting API**
4. Add redirect URI: `https://huntaze.com/api/auth/tiktok/callback`
5. Copy Client Key and Client Secret
6. Configure webhook URL (optional): `https://huntaze.com/api/webhooks/tiktok`

### Instagram
1. Go to [Meta Developer Portal](https://developers.facebook.com/)
2. Create app or use existing
3. Add **Instagram Graph API** product
4. Submit for **App Review** for `instagram_content_publish` permission
5. Add redirect URI: `https://huntaze.com/api/auth/instagram/callback`
6. Copy App ID and App Secret
7. Configure webhook URL: `https://huntaze.com/api/webhooks/instagram`

### Reddit
1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Create app (type: "web app")
3. Add redirect URI: `https://huntaze.com/api/auth/reddit/callback`
4. Copy Client ID and Client Secret
5. **Important**: Review [Reddit Data API Terms](https://www.redditinc.com/policies/data-api-terms)
6. For commercial use, contact Reddit for agreement

## ⚠️ Critical Compliance Notes

### Reddit Commercial Use
Reddit's Data API has specific terms for commercial applications:
- Review: https://www.redditinc.com/policies/data-api-terms
- Commercial use may require separate agreement
- Add "Reddit API Usage" section to your Terms of Service
- Implement rate limiting and respect API guidelines

### Instagram Business Accounts
- Only Business/Creator accounts can publish via API
- Accounts must be linked to Facebook Pages
- App Review required for publishing permissions

### TikTok Content Policy
- Respect TikTok's content guidelines
- Implement spam prevention
- Monitor for policy violations

## 🔄 Background Workers Setup

### Token Refresh Scheduler
```bash
# Cron: Every 30 minutes
*/30 * * * * curl -X POST https://huntaze.com/api/workers/token-refresh \
  -H "Authorization: Bearer $WORKER_SECRET"
```

### Reddit Sync Worker
```bash
# Cron: Every 15 minutes
*/15 * * * * curl -X POST https://huntaze.com/api/workers/reddit-sync \
  -H "Authorization: Bearer $WORKER_SECRET"
```

### Webhook Processor
```bash
# Queue consumer (continuous)
node scripts/run-webhook-worker.js
```

## 📊 Monitoring Setup

### Key Metrics
1. OAuth success rate by platform
2. Publish success rate by platform
3. Token refresh success rate
4. Webhook processing latency
5. API error rates
6. Database connection pool usage

### Alerts
1. OAuth success rate < 95% for 5 min
2. Publish success rate < 90% for 5 min
3. Webhook backlog > 100 events
4. Token refresh failures > 10/hour
5. API error rate > 5% for 5 min

## 🧪 Smoke Tests

After deployment, test each platform:

### TikTok
```bash
# 1. OAuth flow
curl -I https://huntaze.com/api/auth/tiktok

# 2. Upload video (requires auth)
# Test via UI: /platforms/tiktok/upload

# 3. Check status
# Test via UI: /platforms/tiktok
```

### Instagram
```bash
# 1. OAuth flow
curl -I https://huntaze.com/api/auth/instagram

# 2. Publish image (requires auth)
# Test via UI: /platforms/instagram/publish

# 3. Check posts
# Test via UI: /platforms/instagram
```

### Reddit
```bash
# 1. OAuth flow
curl -I https://huntaze.com/api/auth/reddit

# 2. Submit post (requires auth)
# Test via UI: /platforms/reddit/publish

# 3. Check posts
# Test via UI: /platforms/reddit
```

## 📦 Deployment Commands

```bash
# 1. Run tests
npm test

# 2. Build
npm run build

# 3. Type check
npm run type-check

# 4. Deploy (example with Vercel)
vercel --prod

# 5. Run migration
psql $DATABASE_URL -f lib/db/migrations/2024-10-31-social-integrations.sql

# 6. Verify deployment
curl https://huntaze.com/api/health

# 7. Monitor logs for 30 minutes
# Watch for errors
```

## 🎯 Success Criteria

- [ ] All OAuth flows working
- [ ] All publish endpoints working
- [ ] Webhooks receiving events (TikTok, Instagram)
- [ ] Background workers running
- [ ] No critical errors in logs
- [ ] Monitoring dashboards showing data
- [ ] User can connect and publish to all platforms

## 📞 Support Contacts

- **Technical Issues**: dev-team@huntaze.com
- **Platform API Issues**: 
  - TikTok: developers.tiktok.com/support
  - Instagram: developers.facebook.com/support
  - Reddit: reddit.com/contact

## 🎉 Ready to Deploy!

All code is complete, tested, and documented. Follow the checklists above for a smooth deployment.

**Good luck! 🚀**

---

**Prepared**: October 31, 2024
**Status**: Production Ready
**Platforms**: TikTok ✅ | Instagram ✅ | Reddit ✅
