# Instagram Webhook Integration Guide

## Overview

This guide walks you through setting up Instagram webhooks to receive real-time notifications about media posts, comments, and mentions.

**Last Updated**: October 31, 2025  
**API Version**: 1.4.2

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Meta Developer Console Setup](#meta-developer-console-setup)
3. [Environment Configuration](#environment-configuration)
4. [Webhook Verification](#webhook-verification)
5. [Event Types](#event-types)
6. [Security](#security)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up Instagram webhooks, ensure you have:

- ✅ Meta Developer account
- ✅ Instagram Business or Creator account
- ✅ Facebook Page connected to Instagram account
- ✅ Meta app with Instagram Basic Display or Instagram Graph API permissions
- ✅ Huntaze application deployed and accessible via HTTPS

---

## Meta Developer Console Setup

### Step 1: Create or Select Your App

1. Go to [Meta Developer Console](https://developers.facebook.com/)
2. Navigate to **My Apps**
3. Select your existing app or create a new one
4. Add **Instagram** product to your app

### Step 2: Configure Webhook Subscription

1. In your app dashboard, go to **Webhooks**
2. Click **Add Subscription** for Instagram
3. Enter the following details:

**Callback URL**:
```
https://app.huntaze.com/api/webhooks/instagram
```

**Verify Token**:
```
huntaze_instagram_webhook
```
(Or your custom token from `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)

**Fields to Subscribe**:
- ☑️ `media` - New posts
- ☑️ `comments` - New comments
- ☑️ `mentions` - Story/post mentions

4. Click **Verify and Save**

### Step 3: Get Your App Secret

1. Go to **Settings** → **Basic**
2. Copy your **App Secret**
3. You'll need this for signature verification

---

## Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Instagram Webhook Configuration
INSTAGRAM_WEBHOOK_SECRET=your_app_secret_from_meta
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=huntaze_instagram_webhook
```

### Production (AWS Amplify)

Add these to your Amplify environment variables:

1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add:
   - `INSTAGRAM_WEBHOOK_SECRET` = Your Meta app secret
   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` = `huntaze_instagram_webhook`

---

## Webhook Verification

Meta requires webhook verification before accepting events.

### Verification Flow

1. **Meta sends GET request**:
```
GET /api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=huntaze_instagram_webhook&hub.challenge=1234567890
```

2. **Your endpoint validates token**:
```typescript
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

if (mode === 'subscribe' && token === VERIFY_TOKEN) {
  return new NextResponse(challenge, { status: 200 });
}
```

3. **Meta receives challenge echo**:
```
1234567890
```

4. **Verification complete** ✅

### Test Verification

```bash
curl -X GET "https://app.huntaze.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=huntaze_instagram_webhook&hub.challenge=test123"
```

**Expected Response**:
```
test123
```

---

## Event Types

### 1. Media Events

Triggered when a new post is published.

**Payload**:
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_account_id",
    "time": 1635724800,
    "changes": [{
      "field": "media",
      "value": {
        "id": "media_id_123",
        "media_type": "IMAGE",
        "caption": "Check out my new post!",
        "media_url": "https://...",
        "permalink": "https://instagram.com/p/..."
      }
    }]
  }]
}
```

**Use Cases**:
- Track new content
- Analyze posting frequency
- Monitor engagement metrics

### 2. Comment Events

Triggered when someone comments on your post.

**Payload**:
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_account_id",
    "time": 1635724800,
    "changes": [{
      "field": "comments",
      "value": {
        "id": "comment_id_456",
        "text": "Great content!",
        "from": {
          "id": "user_id",
          "username": "fan_username"
        },
        "media": {
          "id": "media_id",
          "media_product_type": "FEED"
        }
      }
    }]
  }]
}
```

**Use Cases**:
- Respond to fan comments
- Moderate content
- Track engagement
- Identify VIP fans

### 3. Mention Events

Triggered when someone mentions you in their story or post.

**Payload**:
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_account_id",
    "time": 1635724800,
    "changes": [{
      "field": "mentions",
      "value": {
        "id": "mention_id_789",
        "media_id": "story_id",
        "comment_id": "comment_id"
      }
    }]
  }]
}
```

**Use Cases**:
- Track brand mentions
- Engage with fans
- Monitor user-generated content
- Build relationships

---

## Security

### Signature Verification

All webhook payloads include a signature for verification.

**Header**:
```
x-hub-signature-256: sha256=abc123def456...
```

**Verification Process**:
```typescript
function verifyMetaSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}
```

**Security Best Practices**:
- ✅ Always verify signatures in production
- ✅ Use environment variables for secrets
- ✅ Never commit secrets to version control
- ✅ Rotate secrets periodically
- ✅ Log verification failures

### Error Handling

```typescript
if (INSTAGRAM_WEBHOOK_SECRET && signature) {
  const isValid = verifyMetaSignature(rawBody, signature, INSTAGRAM_WEBHOOK_SECRET);
  
  if (!isValid) {
    console.error('Instagram webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
}
```

---

## Testing

### 1. Test Verification Endpoint

```bash
curl -X GET "https://app.huntaze.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=huntaze_instagram_webhook&hub.challenge=test123"
```

**Expected**: `test123`

### 2. Test Webhook Payload (Local)

```bash
curl -X POST http://localhost:3000/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "test_account",
      "time": 1635724800,
      "changes": [{
        "field": "media",
        "value": {
          "id": "test_media_123"
        }
      }]
    }]
  }'
```

**Expected**: `{"success":true}`

### 3. Test with Meta Test Events

1. Go to Meta Developer Console
2. Navigate to **Webhooks** → **Instagram**
3. Click **Test** next to your subscription
4. Select event type (media, comments, mentions)
5. Click **Send to My Server**
6. Check your logs for received event

### 4. Monitor Logs

```bash
# Check webhook processing
tail -f logs/webhooks.log | grep instagram

# Check for errors
tail -f logs/error.log | grep "Instagram webhook"
```

---

## Troubleshooting

### Verification Fails

**Problem**: Meta can't verify your webhook

**Solutions**:
1. Check `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches Meta console
2. Ensure endpoint is accessible via HTTPS
3. Check for firewall/security group restrictions
4. Verify SSL certificate is valid
5. Test endpoint manually with curl

**Debug**:
```bash
# Test verification
curl -v "https://app.huntaze.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=huntaze_instagram_webhook&hub.challenge=test"
```

### Invalid Signature Errors

**Problem**: Signature verification fails

**Solutions**:
1. Verify `INSTAGRAM_WEBHOOK_SECRET` matches Meta app secret
2. Check you're using the raw request body (not parsed JSON)
3. Ensure signature header is present
4. Verify HMAC algorithm is SHA-256

**Debug**:
```typescript
console.log('Received signature:', signature);
console.log('Expected signature:', expectedSignature);
console.log('Secret configured:', !!INSTAGRAM_WEBHOOK_SECRET);
```

### Events Not Received

**Problem**: Webhook configured but no events received

**Solutions**:
1. Check webhook subscription is active in Meta console
2. Verify Instagram account is connected to Facebook Page
3. Ensure app has necessary permissions
4. Check app is not in development mode (or test user is added)
5. Verify endpoint returns 200 status code

**Debug**:
```bash
# Check Meta webhook status
# Go to Meta Developer Console → Webhooks → Instagram
# Look for "Active" status and recent deliveries
```

### Processing Errors

**Problem**: Events received but processing fails

**Solutions**:
1. Check `webhookProcessor` logs
2. Verify database connection
3. Check for missing required fields in payload
4. Ensure async processing doesn't throw errors

**Debug**:
```typescript
console.log('Processing Instagram webhook:', {
  eventType,
  externalId,
  payload: JSON.stringify(payload, null, 2)
});
```

### Rate Limiting

**Problem**: Too many webhook events

**Solutions**:
1. Implement event deduplication
2. Use queue system for processing
3. Batch process similar events
4. Implement exponential backoff for retries

**Example**:
```typescript
// Deduplicate events
const eventKey = `${entry.id}_${change.value?.id}`;
if (processedEvents.has(eventKey)) {
  console.log('Duplicate event, skipping:', eventKey);
  return;
}
processedEvents.add(eventKey);
```

---

## Best Practices

### 1. Respond Quickly

Meta requires a 200 response within 20 seconds.

```typescript
// ✅ Good - respond immediately
const response = NextResponse.json({ success: true });

// Process asynchronously
setImmediate(async () => {
  await processEvent(payload);
});

return response;
```

### 2. Handle Retries

Meta will retry failed webhooks up to 3 times.

```typescript
// Implement idempotency
const eventId = `${entry.id}_${change.value?.id}`;
const existing = await db.query('SELECT id FROM webhook_events WHERE external_id = $1', [eventId]);

if (existing.rows.length > 0) {
  console.log('Event already processed:', eventId);
  return;
}
```

### 3. Log Everything

```typescript
console.log('Instagram webhook received:', {
  eventType: change.field,
  accountId: entry.id,
  timestamp: entry.time,
  hasSignature: !!signature
});
```

### 4. Monitor Metrics

Track:
- Events received per minute
- Processing time
- Error rate
- Signature verification failures

### 5. Test Thoroughly

- Test verification flow
- Test each event type
- Test signature verification
- Test error scenarios
- Test with real Instagram account

---

## Example Implementation

### Complete Webhook Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { webhookProcessor } from '@/lib/services/webhookProcessor';
import crypto from 'crypto';

const INSTAGRAM_WEBHOOK_SECRET = process.env.INSTAGRAM_WEBHOOK_SECRET;

function verifyMetaSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify signature
    if (INSTAGRAM_WEBHOOK_SECRET && signature) {
      const isValid = verifyMetaSignature(rawBody, signature, INSTAGRAM_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Validate payload
    if (!payload.entry || !Array.isArray(payload.entry)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Respond immediately
    const response = NextResponse.json({ success: true });

    // Process asynchronously
    setImmediate(async () => {
      for (const entry of payload.entry) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          const eventType = change.field;
          const externalId = `${entry.id}_${change.value?.id || Date.now()}`;

          try {
            await webhookProcessor.processEvent({
              provider: 'instagram',
              eventType,
              externalId,
              payload: { entry, change },
              signature: signature || undefined,
            });
            console.log(`Processed: ${eventType} (${externalId})`);
          } catch (error) {
            console.error('Processing error:', error);
          }
        }
      }
    });

    return response;
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: true }); // Always return 200
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'huntaze_instagram_webhook';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.error('Verification failed');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
```

---

## Resources

- [Meta Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Huntaze API Reference](../API_REFERENCE.md)
- [OpenAPI Specification](./openapi.yaml)

---

## Support

Need help with Instagram webhooks?

- **Email**: support@huntaze.com
- **Documentation**: https://docs.huntaze.com
- **API Reference**: [API_REFERENCE.md](../API_REFERENCE.md)

---

**Last Updated**: October 31, 2025  
**Version**: 1.4.2
