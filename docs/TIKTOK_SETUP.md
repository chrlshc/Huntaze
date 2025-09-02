# TikTok API Integration Guide

## Overview

TikTok provides OAuth 2.0 authentication and APIs for accessing user data, videos, and analytics.

## Setup Steps

### 1. Create TikTok Developer App

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Create a new app in the developer portal
4. Select "Web" as platform type

### 2. App Configuration

In your TikTok app settings:

**Redirect URIs:**
- Production: `https://huntaze.com/auth/tiktok/callback`
- Development: `http://localhost:3001/auth/tiktok/callback`

**Required Scopes:**
- `user.info.basic` - Basic profile information
- `user.info.stats` - Follower count, likes, etc.
- `video.list` - Access to user's videos

### 3. Environment Variables

```bash
TIKTOK_CLIENT_KEY=your-client-key-from-tiktok
TIKTOK_CLIENT_SECRET=your-client-secret-from-tiktok
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback

# For local development:
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=http://localhost:3001/auth/tiktok/callback
```

## API Endpoints

### Get User Info
```javascript
GET https://open.tiktokapis.com/v2/user/info/
Authorization: Bearer {access_token}

// Request body
{
  "fields": {
    "user_info": ["display_name", "avatar_url", "follower_count", "likes_count"]
  }
}
```

### Get User Videos
```javascript
POST https://open.tiktokapis.com/v2/video/list/
Authorization: Bearer {access_token}

{
  "max_count": 20,
  "fields": {
    "cover_image_url": true,
    "id": true,
    "title": true,
    "view_count": true
  }
}
```

## Implementation Details

### OAuth Flow

1. User clicks "Connect TikTok"
2. Redirect to TikTok authorization page
3. User approves permissions
4. TikTok redirects back with authorization code
5. Exchange code for access token
6. Store tokens securely

### PKCE Security

The implementation uses PKCE (Proof Key for Code Exchange) for enhanced security:
- Code verifier generated client-side
- Stored in sessionStorage
- Sent with token exchange request

## Rate Limits

- **User Info**: 600 requests per minute
- **Video List**: 600 requests per minute
- **Token Refresh**: No limit

## Testing

1. Navigate to `/platforms/connect`
2. Click "Connect TikTok"
3. Authorize the app on TikTok
4. Verify successful connection

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**: Ensure exact match in app settings
2. **Invalid scope**: Check requested scopes are approved
3. **Token expired**: Implement token refresh logic

### Debug Mode

Enable debug logging:
```javascript
console.log('TikTok OAuth State:', sessionStorage.getItem('tiktok_oauth_state'));
console.log('Code Verifier:', sessionStorage.getItem('tiktok_code_verifier'));
```

## Future Features

- [ ] Video analytics dashboard
- [ ] Content scheduling
- [ ] Comment management
- [ ] Hashtag tracking
- [ ] Competitor analysis