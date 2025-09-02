# Threads API Integration Guide

## Overview

Threads uses the Instagram Graph API infrastructure with additional scopes for Threads-specific features.

## Setup Steps

### 1. Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app or use existing Instagram app
3. Add "Instagram Basic Display" product
4. Add "Threads API" (when available)

### 2. Configure OAuth

Add these redirect URIs:
- Production: `https://huntaze.com/auth/threads/callback`
- Development: `http://localhost:3001/auth/threads/callback`

### 3. Required Scopes

```
user_profile          - Basic profile info
user_media           - Access to media
threads_basic        - Threads profile access
threads_content_publish - Post to Threads
```

### 4. Environment Variables

```bash
# Can reuse Instagram credentials
THREADS_CLIENT_ID=your-instagram-app-id
THREADS_CLIENT_SECRET=your-instagram-app-secret
NEXT_PUBLIC_THREADS_REDIRECT_URI=https://huntaze.com/auth/threads/callback
```

## API Endpoints

### Get Threads Profile
```javascript
GET https://graph.threads.net/v1.0/me
Authorization: Bearer {access_token}
```

### Post to Threads
```javascript
POST https://graph.threads.net/v1.0/me/threads
{
  "text": "Hello Threads!",
  "media_type": "TEXT"
}
```

### Get Threads Posts
```javascript
GET https://graph.threads.net/v1.0/me/threads
```

## Current Status

- ✅ OAuth flow implemented
- ✅ Uses Instagram Graph API
- ⏳ Waiting for full Threads API access
- 📝 Currently stores Instagram token for future Threads access

## Notes

1. **Business Verification Required**: Need Meta Business Verification for API access
2. **Rate Limits**: Same as Instagram Basic Display API
3. **Content Types**: Text, images, and videos supported
4. **No DMs**: Direct messaging not available via API

## Testing

1. Click "Connect Threads" on `/platforms/connect`
2. Authorize with Meta account
3. Token stored for when Threads API fully launches

## Future Features

- Post scheduling
- Analytics dashboard
- Reply management
- Multi-media threads
- Cross-posting from other platforms