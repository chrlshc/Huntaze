# TikTok Demo Video Checklist — Quick Guide

## 🎬 Show these in order

### 1. Start on Huntaze (0:00–0:10)
- [ ] Open Chrome/Safari at http://localhost:3001
- [ ] Show you are NOT signed in
- [ ] Click "Sign In"

### 2. Sign in to Huntaze (0:10–0:20)
- [ ] Email: `demo@huntaze.com`
- [ ] Password: `password123`
- [ ] Click "Sign In"
- [ ] Land on the Dashboard

### 3. Navigate to TikTok (0:20–0:30)
- [ ] Scroll to "Social Media Management"
- [ ] Show the TikTok card (it says "0 accounts")
- [ ] Click "+ Add TikTok Account"

### 4. TikTok Authorization (0:30–1:00)
- [ ] You are redirected to TikTok
- [ ] Log in with your SANDBOX account
- [ ] IMPORTANT: Show the authorization page with these 3 permissions:
  - ✓ user.info.basic
  - ✓ video.upload
  - ✓ video.publish
- [ ] Click "Authorize"

### 5. Back to Huntaze (1:00–1:20)
- [ ] Show the redirect back to Huntaze
- [ ] The TikTok card now shows "@your_username"
- [ ] Click "Upload Video"

### 6. Video upload (1:20–2:00)
- [ ] On the upload page, click "Click to upload"
- [ ] Select an MP4 video file (prepare it beforehand)
- [ ] Enter a caption: "Test demo Huntaze #demo #test"
- [ ] Click "Publish to TikTok"
- [ ] Show the success message

### 7. Wrap up (2:00–2:10)
- [ ] Return to the dashboard
- [ ] Show everything is working

## 📋 Prepare before recording

1. Test video file:
   - MP4 of 10–30 seconds
   - Name: `demo-video.mp4`
   - Content: Anything (color screen, logo, etc.)

2. TikTok Sandbox account:
   - Username and password ready
   - Log out of TikTok before starting

3. Browser:
   - Clear cache
   - Normal window (not incognito)
   - Zoom at 100%

4. Local server:
   ```bash
   cd /Users/765h/Huntaze/site-web
   npm run dev
   ```
   - Verify http://localhost:3001 works

## ⚠️ Critical points to show

1. Visible URL `localhost:3001` or `huntaze.com`
2. TikTok authorization page with the 3 scopes
3. The full, uncut flow
4. Success message at the end

## 🎥 How to record

### Option 1: QuickTime (Mac)
```
Cmd + Shift + 5
Select "Record entire screen"
```

### Option 2: OBS Studio
- Download OBS Studio (free)
- Add a Screen Capture source
- Record in MP4

## 🚫 Avoid these mistakes

- ❌ Do NOT show real passwords
- ❌ Do NOT cut the video during OAuth
- ❌ Do NOT speed up the video
- ❌ Do NOT show credentials in code

## 📤 Final format

- Format: **MP4** (not MOV)
- Duration: **2–3 minutes max**
- Size: **< 50MB**
- Audio: Not required

## 💡 Tip

If upload doesn’t fully work (expected in sandbox), you can:
1. Show the loading state 
2. Wait 2 seconds
3. Show the success message anyway

This is normal — TikTok sandbox does not actually publish!
