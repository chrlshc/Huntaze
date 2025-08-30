# TikTok App Submission Guide

## Changes Required in TikTok Developer Portal

### 1. Update Redirect URI
- Change from: `https://huntaze.com/auth/callback`
- Change to: `https://huntaze.com/auth/tiktok/callback`

### 2. URLs are now correct:
- Terms of Service: `https://huntaze.com/terms` ✓ (redirects to /terms-of-service)
- Privacy Policy: `https://huntaze.com/privacy` ✓ (redirects to /privacy-policy)

### 3. App Icon Requirements
You need to create and upload an app icon with these specifications:
- Size: 1024x1024 pixels
- Format: JPEG, JPG, or PNG
- File size: Up to 5MB
- Design tip: Use the Huntaze logo on a clean background

### 4. Demo Video Requirements
Create a video showing the complete flow:

**Required elements to demonstrate:**
1. Start at Huntaze dashboard (https://huntaze.com)
2. Show user clicking "Connect TikTok" button
3. Show TikTok OAuth authorization page
4. Show redirect back to Huntaze after authorization
5. Show user selecting/uploading a video file
6. Show user entering caption and hashtags
7. Show user clicking "Publish" button
8. Show success message after posting

**Technical requirements:**
- Format: MP4 or MOV
- Maximum: 5 files, up to 50MB each
- Must use TikTok sandbox environment for demo
- Must clearly show all UI interactions
- Must demonstrate all requested scopes (user.info.basic, video.upload, video.publish)

### 5. Additional App Details to Verify
- App Name: Huntaze ✓
- Category: Business ✓
- Description: Already provided ✓
- Web/Desktop URL: https://huntaze.com ✓
- Products: Login Kit + Content Posting API ✓
- Scopes: user.info.basic, video.upload, video.publish ✓

## Environment Variables Needed
Add these to your .env.local and AWS Amplify:
```
TIKTOK_CLIENT_KEY=Acdg4lRaNSTnQvXFreYzaHEnH8QYHi1K
TIKTOK_CLIENT_SECRET=[Get from TikTok Developer Portal]
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
```

## Demo Video Script Suggestion
1. "Welcome to Huntaze, the AI-powered content management platform for creators"
2. "Let me show you how to connect your TikTok account"
3. Click on Social Media Management → TikTok → "Connect Account"
4. "You'll be redirected to TikTok to authorize Huntaze"
5. Show authorization page and click "Authorize"
6. "Now back in Huntaze, let's publish a video to TikTok"
7. Click "Upload Video" and select a file
8. Enter caption: "Check out my latest content! #creator #content"
9. Click "Publish to TikTok"
10. "Success! Your video has been posted to TikTok"

## After Approval
Once TikTok approves your app:
1. Update from sandbox to production endpoints
2. Test with real accounts
3. Monitor error rates and API usage
4. Implement rate limiting if needed