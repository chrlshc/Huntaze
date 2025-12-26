# 🛡️ Huntaze Security Pre-Launch Roadmap

**Date:** 2025-12-25  
**Status:** ✅ COMPLETED

---

## 🔴 Critical Security Fixes (DONE)

### 1. IDOR Vulnerability - Link Account
**File:** `app/api/of/link-account/route.ts`  
**Risk:** User could link OF account to another user's profile  
**Fix:** Changed from `userId` in request body to `getServerSession()` server-side auth

```typescript
// BEFORE (vulnerable)
const { userId, cookies } = await req.json();

// AFTER (secure)
const session = await getServerSession(authOptions);
const userId = session?.user?.id;
```

### 2. OF Cookies Encryption
**File:** `lib/security/crypto.ts`  
**Risk:** Cookies stored in plain text in database  
**Fix:** AES-256-CBC encryption with ENCRYPTION_KEY env var

```typescript
// Usage
import { encrypt, decrypt } from '@/lib/security/crypto';
const encrypted = encrypt(cookies);
const decrypted = decrypt(encrypted);
```

### 3. Azure AI Cost Control
**File:** `src/lib/ai/providers/azure-ai.ts`  
**Risk:** Unbounded token usage = surprise $$$  
**Fix:** Added `maxTokens` limits to all AI calls

```typescript
maxTokens: options.maxTokens || 2000  // Safety cap
```

---

## 🟡 Scraper Stealth Mode (DONE)

### Problem Analysis
OnlyFans détecte les bots via:
- `navigator.webdriver = true`
- Signatures WebGL headless
- User-Agent statique
- App-Token hardcodé expiré

### Solution Implemented
**File:** `of-scraper-service/server.js`

```javascript
// 1. Playwright Extra + Stealth Plugin
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(stealthPlugin());

// 2. Anti-detection flags
const browser = await chromium.launch({
  args: ['--disable-blink-features=AutomationControlled']
});

// 3. User-Agent rotation
const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1...",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6...",
  "Mozilla/5.0 (Linux; Android 14; SM-S918B)..."
];

// 4. In-page fetch (native OF signatures)
const result = await page.evaluate(async ({ url }) => {
  return await fetch(url).then(r => r.json());
}, { url: targetUrl });
```

---

## 🟡 Async Queue Architecture (DONE)

### Problem
Vercel timeout 10-60s → scraping fails

### Solution: BullMQ + AWS

**Architecture:**
```
Next.js API → BullMQ Queue → AWS App Runner Worker → Callback
     ↓              ↓                    ↓
  Vercel      ElastiCache Redis     Playwright Stealth
```

**Files Created:**
- `lib/of-scraper/queue.ts` - Queue service
- `lib/of-scraper/types.ts` - Shared types
- `app/api/of/scrape-async/route.ts` - Async endpoint
- `app/api/of/scrape-callback/route.ts` - Webhook receiver
- `of-scraper-service/worker.js` - BullMQ worker

---

## ☁️ AWS Infrastructure (us-east-2)

| Service | Resource | Status |
|---------|----------|--------|
| App Runner | `huntaze-of-scraper` | ✅ RUNNING |
| ElastiCache | `huntaze-redis` (Serverless) | ✅ available |
| ECR | `huntaze-of-scraper` | ✅ Image pushed |

**URLs:**
- Worker: `https://zzcbnuqak6.us-east-2.awsapprunner.com`
- Redis: `rediss://huntaze-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379`

---

## 📋 Vercel Environment Variables

```bash
# Add to Vercel Dashboard → Settings → Environment Variables
OF_SCRAPER_WORKER_URL=https://zzcbnuqak6.us-east-2.awsapprunner.com
REDIS_URL=rediss://huntaze-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379
SCRAPER_CALLBACK_SECRET=huntaze-scraper-callback-2025
```

---

## 🧪 Test Commands

```bash
# Health check
curl https://zzcbnuqak6.us-east-2.awsapprunner.com/health

# Test scrape (needs valid OF cookies)
curl -X POST https://zzcbnuqak6.us-east-2.awsapprunner.com/scrape \
  -H 'Content-Type: application/json' \
  -d '{"cookies":"sess=xxx","endpoint":"/api2/v2/users/me"}'
```

---

## 🚀 Deployment Script

```bash
cd of-scraper-service
./deploy-all.sh
```

This script:
1. Builds Docker image with Playwright
2. Pushes to ECR
3. Creates/updates ElastiCache Redis
4. Deploys to App Runner
5. Tests health endpoint
6. Updates `.env.local`

---

## ✅ Security Checklist

- [x] IDOR fix (session-based auth)
- [x] OF cookies encrypted (AES-256)
- [x] Stealth scraper (Playwright Extra)
- [x] BullMQ async queue (no timeouts)
- [x] Azure AI maxTokens limits
- [x] AWS infrastructure deployed
- [x] Add env vars to Vercel (manual step)

---

## 📁 Key Files Reference

| Purpose | File |
|---------|------|
| Encryption | `lib/security/crypto.ts` |
| IDOR Fix | `app/api/of/link-account/route.ts` |
| Azure AI | `src/lib/ai/providers/azure-ai.ts` |
| Stealth Scraper | `of-scraper-service/server.js` |
| BullMQ Worker | `of-scraper-service/worker.js` |
| Queue Service | `lib/of-scraper/queue.ts` |
| Async API | `app/api/of/scrape-async/route.ts` |
| Callback | `app/api/of/scrape-callback/route.ts` |
| Deploy Script | `of-scraper-service/deploy-all.sh` |
