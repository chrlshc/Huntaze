# TikTok Sandbox Guide and Demo Video

## 1. Configure the TikTok Sandbox

### Access the Sandbox
1. Go to the [TikTok Developer Portal](https://developers.tiktok.com/)
2. In your Huntaze app, click the "Sandbox" tab
3. You’ll see a separate testing environment

### Create test accounts
1. In the Sandbox section, click "Test Users"
2. Click "Create Test User"
3. Create at least 2 test accounts:
   - A creator account (to post)
   - A viewer account (optional, to view posts)

### Get sandbox credentials
In the Sandbox tab, you’ll have:
- Sandbox Client Key (different from production)
- Sandbox Client Secret (different from production)
- OAuth URLs are the same but point to the sandbox environment

## 2. Configure Huntaze for the Sandbox

### Create a .env.sandbox file
```bash
# TikTok Sandbox Credentials
TIKTOK_CLIENT_KEY=your-sandbox-client-key
TIKTOK_CLIENT_SECRET=your-sandbox-client-secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
TIKTOK_SANDBOX_MODE=true
```

### Update OAuth code to support sandbox
Create or edit `/app/auth/tiktok/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://huntaze.com/auth/tiktok/callback';
  const isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
  
  if (!clientKey) {
    return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 });
  }

  const state = Math.random().toString(36).substring(7);
  
  // Different base URL for sandbox vs production
  const baseUrl = isSandbox 
    ? 'https://open-sandbox.tiktok.com' 
    : 'https://www.tiktok.com';
  
  const scope = 'user.info.basic,user.info.stats,video.list';
  const authUrl = `${baseUrl}/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  return NextResponse.redirect(authUrl);
}
```

## 3. Record the Demo Video

### Recommended tools
- Mac: QuickTime Player (Cmd+Shift+5) or OBS Studio
- Windows: OBS Studio or Windows Game Bar (Win+G)
- Chrome: Loom or Screencastify

### Demo script (step by step)

1. Intro (0:00–0:10)
   - Open your browser at https://huntaze.com
   - Show you are signed out

2. Sign in to Huntaze (0:10–0:20)
   - Click "Sign In"
   - Sign in with a test account

3. Navigate to Social Media (0:20–0:30)
   - Go to the Dashboard
   - Click "Social Media Management"
   - Show the TikTok section

4. TikTok OAuth (0:30–0:50)
   - Click "Connect TikTok Account"
   - You will be redirected to the TikTok Sandbox login page
   - Sign in with your sandbox test account
   - Show the authorization page with permissions
   - Click "Authorize"

5. Back to Huntaze (0:50–1:00)
   - Show the redirect back to Huntaze
   - Show that the TikTok account is now connected
   - Display the TikTok username

6. Video upload (1:00–1:20)
   - Click "Create Post" or "Upload Video"
   - Select a video file (prepare a short .mp4)
   - Show the preview

7. Add caption (1:20–1:40)
   - Enter a title/caption
   - Add hashtags (#test #huntaze #demo)
   - Show the available options

8. Publish (1:40–2:00)
   - Click "Publish to TikTok"
   - Show loading/progress
   - Show the success message
   - (Optional) Show the created post ID

### Test video
Prepare a short video (10–30 seconds) for upload:
- Format: MP4
- Resolution: 720p or 1080p
- Content: A simple colored screen with “Test Huntaze” text is fine

## 4. Important points for the demo

### ✅ Must show:
- huntaze.com visible in the address bar
- TikTok authorization page with the 3 scopes
- Complete, uncut flow
- Success messages

### ❌ Avoid:
- Showing real credentials
- Using real accounts
- Cutting the video during OAuth
- Speeding up the video

## 5. Test locally with sandbox

To test locally before the demo:

```bash
# Use sandbox credentials
cp .env.sandbox .env.local

# Run locally
npm run dev

# Temporarily set the redirect URI in TikTok sandbox to:
# http://localhost:3002/auth/tiktok/callback
```

## 6. After recording

1. Export as MP4 (avoid MOV if possible)
2. Ensure the file is under 50MB
3. Review the video:
   - No credentials visible
   - All scopes demonstrated
   - The flow is clear and complete

## 7. Alternative: Mockup video

If you can’t get the sandbox working:

1. Record the flow up to the TikTok redirect
2. Create mockups/screenshots of:
   - TikTok login page (blur credentials)
   - Authorization page
   - Return to Huntaze
3. Edit the sequences together
4. Add annotations explaining each step

## Additional notes

- The sandbox does not actually post to TikTok
- Videos uploaded in sandbox are not public
- You can reuse the same test accounts many times
- The sandbox API uses the same endpoints with different limits
