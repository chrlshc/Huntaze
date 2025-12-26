# Instagram OAuth Integration

Complete implementation of Instagram Business/Creator account OAuth flow using Facebook OAuth 2.0.

## Overview

This implementation allows users to connect their Instagram Business or Creator accounts to Huntaze through Facebook OAuth. It handles the complete OAuth lifecycle including token exchange, long-lived token conversion, account validation, and secure token storage.

## Features

- ✅ Facebook OAuth 2.0 integration
- ✅ Instagram Business/Creator account validation
- ✅ Long-lived tokens (60 days)
- ✅ Automatic token refresh
- ✅ Page mapping (Facebook Page → Instagram Business Account)
- ✅ CSRF protection via state parameter
- ✅ AES-256-GCM token encryption
- ✅ Comprehensive error handling
- ✅ Rich metadata storage

## Setup

### 1. Create Facebook App

1. Go to https://developers.facebook.com
2. Create a new app (Business type)
3. Add products:
   - Instagram Basic Display
   - Instagram Graph API
4. Configure OAuth redirect URI:
   - `https://yourdomain.com/api/auth/instagram/callback`

### 2. Environment Variables

Add to your `.env` file:

```bash
# Instagram/Facebook OAuth
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback

# Token Encryption (required)
TOKEN_ENCRYPTION_KEY=your_32_byte_base64_key
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Database

Ensure the `oauth_accounts` table exists (should be created by migration):

```sql
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  open_id VARCHAR(255) NOT NULL,
  scope TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, open_id)
);
```

## Usage

### User Flow

1. User visits `/platforms/connect/instagram`
2. Clicks "Connect Instagram Business"
3. Redirected to Facebook OAuth
4. Authorizes permissions
5. Redirected back to callback
6. Success message displayed

### Programmatic Usage

```typescript
import { instagramOAuth } from '@/lib/services/instagramOAuth';
import { tokenManager } from '@/lib/services/tokenManager';

// Generate authorization URL
const { url, state } = instagramOAuth.getAuthorizationUrl();

// Store state in session/cookie for CSRF validation
// Redirect user to url

// In callback handler:
// 1. Validate state
// 2. Exchange code for tokens
const shortLivedToken = await instagramOAuth.exchangeCodeForTokens(code);

// 3. Convert to long-lived token
const longLivedToken = await instagramOAuth.getLongLivedToken(
  shortLivedToken.access_token
);

// 4. Get account info
const accountInfo = await instagramOAuth.getAccountInfo(
  longLivedToken.access_token
);

// 5. Validate Business account
if (!instagramOAuth.hasInstagramBusinessAccount(accountInfo.pages)) {
  throw new Error('No Instagram Business account found');
}

// 6. Get Instagram details
const page = accountInfo.pages.find(p => p.instagram_business_account);
const igDetails = await instagramOAuth.getInstagramAccountDetails(
  page.instagram_business_account.id,
  longLivedToken.access_token
);

// 7. Store tokens
await tokenManager.storeTokens({
  userId: currentUserId,
  provider: 'instagram',
  openId: accountInfo.user_id,
  tokens: {
    accessToken: longLivedToken.access_token,
    expiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000),
    scope: 'instagram_basic,instagram_content_publish,...',
    metadata: {
      page_id: page.id,
      ig_business_id: page.instagram_business_account.id,
      ig_username: page.instagram_business_account.username,
      // ... other metadata
    },
  },
});
```

### Retrieving Tokens

```typescript
import { tokenManager } from '@/lib/services/tokenManager';
import { instagramOAuth } from '@/lib/services/instagramOAuth';

// Get valid token (auto-refreshes if needed)
const accessToken = await tokenManager.getValidToken({
  userId: currentUserId,
  provider: 'instagram',
  refreshCallback: async (token) => {
    const refreshed = await instagramOAuth.refreshLongLivedToken(token);
    return {
      accessToken: refreshed.access_token,
      expiresIn: refreshed.expires_in,
    };
  },
});

// Use token for Instagram API calls
const response = await fetch(
  `https://graph.facebook.com/v18.0/${igBusinessId}/media`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

## API Endpoints

### GET /api/auth/instagram

Initiates OAuth flow.

**Response:** Redirects to Facebook OAuth

**Cookies Set:**
- `instagram_oauth_state` - CSRF protection token (10 min expiry)

### GET /api/auth/instagram/callback

Handles OAuth callback.

**Query Parameters:**
- `code` - Authorization code from Facebook
- `state` - CSRF protection token
- `error` - Error code (if authorization failed)
- `error_description` - Error description

**Response:** Redirects to `/platforms/connect/instagram` with:
- Success: `?success=true&username=<username>`
- Error: `?error=<code>&message=<message>`

## Error Handling

### Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `access_denied` | User denied authorization | Try again and grant permissions |
| `invalid_state` | CSRF validation failed | Try connecting again |
| `no_business_account` | No Instagram Business account | Convert account to Business/Creator |
| `callback_failed` | General callback error | Try again or contact support |
| `oauth_init_failed` | OAuth initialization error | Check configuration |

### Error Messages

All errors include user-friendly messages with actionable guidance:

```typescript
{
  error: 'no_business_account',
  message: 'No Instagram Business or Creator account found. Please convert your Instagram account to a Business or Creator account and link it to a Facebook Page.'
}
```

## Security

### CSRF Protection

State parameter is generated, stored in HTTP-only cookie, and validated on callback:

```typescript
// Generate state
const state = crypto.randomBytes(32).toString('hex');

// Store in cookie
cookies.set('instagram_oauth_state', state, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 600, // 10 minutes
});

// Validate on callback
if (storedState !== receivedState) {
  throw new Error('State validation failed');
}
```

### Token Encryption

All tokens are encrypted using AES-256-GCM before storage:

```typescript
const encrypted = tokenEncryption.encryptAccessToken(accessToken);
// Stored in database as encrypted string
```

### HTTPS Only

All OAuth redirects and API calls use HTTPS in production.

## Token Lifecycle

### Short-Lived Tokens

- Lifetime: ~2 hours
- Obtained from authorization code exchange
- Automatically converted to long-lived tokens

### Long-Lived Tokens

- Lifetime: 60 days
- Can be refreshed once per day
- Each refresh extends for another 60 days
- No refresh token (uses token refresh instead)

### Token Refresh

```typescript
// Refresh long-lived token
const refreshed = await instagramOAuth.refreshLongLivedToken(currentToken);

// Update in database
await tokenManager.updateTokens({
  accountId: account.id,
  accessToken: refreshed.access_token,
  expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
});
```

## Permissions

### Required Permissions

- `instagram_basic` - Basic profile information
- `instagram_content_publish` - Publish photos and videos
- `instagram_manage_insights` - View analytics and insights
- `instagram_manage_comments` - Manage comments
- `pages_show_list` - List Facebook Pages
- `pages_read_engagement` - Read Page engagement data

### Permission Scopes

Permissions are requested during OAuth authorization and stored with the token:

```typescript
scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,pages_show_list,pages_read_engagement'
```

## Metadata

### Stored Metadata

```typescript
{
  page_id: string;              // Facebook Page ID
  page_name: string;            // Facebook Page name
  ig_business_id: string;       // Instagram Business Account ID
  ig_username: string;          // Instagram username
  ig_name: string;              // Instagram display name
  ig_profile_picture_url: string; // Profile picture URL
  ig_followers_count: number;   // Follower count
  ig_follows_count: number;     // Following count
  ig_media_count: number;       // Media count
}
```

## Testing

### Unit Tests

```bash
npm test tests/unit/services/instagramOAuth.test.ts
```

### Manual Testing

1. Set up Facebook App and environment variables
2. Visit `/platforms/connect/instagram`
3. Click "Connect Instagram Business"
4. Authorize on Facebook
5. Verify success message
6. Check database for encrypted tokens

### Test Cases

- ✅ OAuth URL generation
- ✅ State parameter uniqueness
- ✅ Custom permissions
- ✅ Business account validation
- ✅ Token lifecycle methods
- ✅ Error handling

## Troubleshooting

### "No Instagram Business account found"

**Cause:** User's Instagram account is not a Business or Creator account, or not linked to a Facebook Page.

**Solution:**
1. Convert Instagram account to Business or Creator
2. Link to a Facebook Page
3. Ensure you're an admin of the Page

### "State validation failed"

**Cause:** CSRF token mismatch or expired.

**Solution:**
1. Clear cookies
2. Try connecting again
3. Ensure cookies are enabled

### "Token exchange failed"

**Cause:** Invalid authorization code or configuration error.

**Solution:**
1. Verify `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`
2. Check redirect URI matches Facebook App settings
3. Ensure authorization code hasn't expired

## Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login)
- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
- [Meta Developer Portal](https://developers.facebook.com)

## Support

For issues or questions:
1. Check error messages for actionable guidance
2. Review Facebook App configuration
3. Verify environment variables
4. Check database for stored tokens
5. Review server logs for detailed errors

## License

Part of Huntaze social integrations.
