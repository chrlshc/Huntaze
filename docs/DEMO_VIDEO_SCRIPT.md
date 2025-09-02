# TikTok Demo Video Script — Step by Step

## Preparation before recording

1. Open 3 tabs in your browser:
   - Tab 1: Huntaze Dashboard (https://huntaze.com or http://localhost:3002)
   - Tab 2: TikTok (to sign in with your sandbox account)
   - Tab 3: TikTok Developer Portal (to show sandbox context)

2. Prepare a test video:
   - Short MP4 (10–30 seconds)
   - Name: "test-huntaze-demo.mp4"

3. Make sure you are signed out of both Huntaze and TikTok

## Demo script (2–3 minutes max)

### Intro (0:00–0:10)
```
"Hi, this is a demonstration of the TikTok integration in Huntaze, 
our content management platform for creators."
```
- Show the Huntaze homepage

### Sign in to Huntaze (0:10–0:20)
- Click "Sign In"
- Sign in to Huntaze
- Land on the Dashboard

### Navigate to Social Media (0:20–0:30)
- Show the Dashboard
- Click "Social Media Management"
- Show the TikTok section with the "Connect Account" button

### TikTok OAuth (0:30–1:00)
```
"I’m going to connect my TikTok account now"
```
- Click "Connect TikTok Account"
- You’re redirected to TikTok
- Sign in with your sandbox account
- Show the authorization page with the 3 permissions:
  - user.info.basic
  - video.upload
  - video.publish
- Click "Authorize"

### Back to Huntaze (1:00–1:20)
```
"TikTok is now connected to Huntaze"
```
- Show the redirect back to Huntaze
- Show that the account is connected (username visible)
- Show the "Create Post" or "Upload Video" button

### Upload and publish (1:20–2:00)
```
"I’m going to publish a video to TikTok now"
```
- Click "Create Post" / "Upload Video"
- Select your test file
- Enter a caption: "Huntaze demo test #huntaze #demo #test"
- Show available options
- Click "Publish to TikTok"
- Show the success message

### Conclusion (2:00–2:10)
```
"The video was successfully published to TikTok using the Content Posting API"
```
- Show the confirmation message
- (Optional) Show the created video ID

## Important points to show

✅ Must show:
- The huntaze.com URL visible
- The TikTok authorization page with all 3 scopes
- The complete, uncut flow
- The final success message

❌ Avoid:
- Showing credentials
- Using real accounts (use sandbox)
- Cutting during OAuth
- Speeding up the video

## If you run into issues

### Redirect error:
1. Ensure the TikTok redirect URI matches exactly
2. For local: `http://localhost:3002/auth/tiktok/callback`
3. For production: `https://huntaze.com/auth/tiktok/callback`

### Token error:
1. Verify you’re using the correct credentials (sandbox vs production)
2. Ensure `TIKTOK_SANDBOX_MODE=true` in .env.local

### Video doesn’t upload:
- This is expected in sandbox; you can simulate success
- Or mock the API response

## Recording commands

### On macOS:
```bash
# Option 1: QuickTime
Cmd + Shift + 5
# Select "Record entire screen" or a region

# Option 2: Terminal with ffmpeg
ffmpeg -f avfoundation -i "1:0" -t 180 demo-tiktok.mp4
```

### Final export:
- Format: MP4 (not MOV)
- Size: < 50MB
- Resolution: 720p or 1080p minimum
