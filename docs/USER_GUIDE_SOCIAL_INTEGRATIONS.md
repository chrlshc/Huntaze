# User Guide - Social Media Integrations

## 🎯 Overview

Huntaze allows you to connect and publish content to TikTok, Instagram, and Reddit from one central platform. This guide will help you get started.

## 📱 Supported Platforms

- **TikTok** - Upload videos to your TikTok account
- **Instagram** - Publish photos, videos, and carousels to Instagram Business/Creator accounts
- **Reddit** - Submit link and text posts to your favorite subreddits

## 🔗 Connecting Your Accounts

### TikTok

1. Navigate to **Platforms → Connect TikTok**
2. Click **"Connect with TikTok"**
3. Log in to your TikTok account
4. Authorize Huntaze to access:
   - Basic profile information
   - Video upload permissions
5. You'll be redirected back to Huntaze
6. Your TikTok account is now connected!

**Requirements:**
- Active TikTok account
- Account must be in good standing

### Instagram

1. Navigate to **Platforms → Connect Instagram**
2. Click **"Connect with Instagram"**
3. Log in to your Facebook account
4. Select the Facebook Page linked to your Instagram Business/Creator account
5. Authorize Huntaze to access:
   - Basic Instagram information
   - Content publishing
   - Insights and analytics
6. You'll be redirected back to Huntaze
7. Your Instagram account is now connected!

**Requirements:**
- Instagram Business or Creator account
- Account must be linked to a Facebook Page
- Facebook Page admin access

**Note:** Personal Instagram accounts cannot publish via API. You must convert to a Business or Creator account first.

### Reddit

1. Navigate to **Platforms → Connect Reddit**
2. Click **"Connect with Reddit"**
3. Log in to your Reddit account
4. Authorize Huntaze to access:
   - Your identity
   - Submit posts
   - Edit and delete posts
   - Read posts and comments
   - Access subscribed subreddits
5. You'll be redirected back to Huntaze
6. Your Reddit account is now connected!

**Requirements:**
- Active Reddit account
- Account must be in good standing
- Respect subreddit rules when posting

## 📤 Publishing Content

### TikTok - Upload Videos

1. Go to **Platforms → TikTok → Upload**
2. Choose upload method:
   - **File Upload**: Upload video from your computer
   - **URL**: Provide a URL to your video
3. Add video details:
   - Title/Caption
   - Privacy level (Public, Friends, Private)
   - Enable/disable Duet, Comments, Stitch
4. Click **"Upload Video"**
5. Video will be processed and sent to your TikTok Inbox
6. Open TikTok app to finalize and publish

**Limits:**
- Maximum 5 pending videos per 24 hours
- Rate limit: 6 uploads per minute

### Instagram - Publish Media

1. Go to **Platforms → Instagram → Publish**
2. Select media type:
   - **Photo**: Single image
   - **Video**: Video post or Reel
   - **Carousel**: Multiple images/videos
3. Upload your media file(s)
4. Add caption (optional)
5. Add location (optional)
6. Click **"Publish"**
7. Huntaze will:
   - Create media container
   - Wait for processing
   - Publish to your Instagram feed

**Requirements:**
- Images: JPG or PNG, max 8MB
- Videos: MP4, max 100MB, 3-60 seconds
- Carousel: 2-10 items

**Note:** Publishing happens in two steps (container creation → publish). This may take a few seconds.

### Reddit - Submit Posts

1. Go to **Platforms → Reddit → Publish**
2. Select post type:
   - **Link**: Share a URL
   - **Text**: Write a text post
3. Choose subreddit from dropdown
4. Enter post title (required, max 300 characters)
5. For link posts: Enter URL
6. For text posts: Write content (Markdown supported)
7. Optional settings:
   - Mark as NSFW
   - Mark as Spoiler
8. Click **"Publish Post"**
9. Post will appear immediately on Reddit

**Important:**
- Respect subreddit rules
- Some subreddits require specific flair
- Some subreddits have karma/age requirements
- Avoid spam - follow Reddit's content policy

## 📊 Viewing Your Content

### Dashboard Widgets

Each connected platform has a dashboard widget showing:
- Recent posts
- Performance metrics (views, likes, karma, comments)
- Quick actions (publish, view all)

### Platform Pages

Visit individual platform pages for detailed views:
- **TikTok**: `/platforms/tiktok` - All your TikTok uploads
- **Instagram**: `/platforms/instagram` - All your Instagram posts
- **Reddit**: `/platforms/reddit` - All your Reddit submissions

## 🔄 Managing Connections

### Disconnect Account

1. Go to platform connect page
2. Click **"Disconnect"** button
3. Confirm disconnection
4. Your data will remain in Huntaze but you won't be able to publish new content

### Reconnect Account

Simply go through the connection process again. Your previous posts will still be visible.

## ⚠️ Troubleshooting

### TikTok Issues

**"Upload failed"**
- Check video format (MP4 recommended)
- Ensure video meets TikTok's requirements
- Check if you've reached the 5 pending videos limit

**"Token expired"**
- Reconnect your TikTok account
- Tokens expire after 24 hours

### Instagram Issues

**"Not a Business/Creator account"**
- Convert your Instagram account to Business or Creator
- Link it to a Facebook Page
- Reconnect

**"Container creation failed"**
- Check media format and size
- Ensure media URL is accessible
- Try again in a few minutes

**"Permission denied"**
- Ensure you granted all required permissions
- Reconnect and accept all permissions

### Reddit Issues

**"Subreddit not found"**
- Check subreddit name spelling
- Ensure subreddit exists and is public

**"Rate limit exceeded"**
- Wait a few minutes before posting again
- Reddit has rate limits to prevent spam

**"Post removed"**
- Check subreddit rules
- Your post may have violated community guidelines
- Contact subreddit moderators

## 📋 Best Practices

### TikTok
- Upload high-quality videos
- Use engaging titles
- Post during peak hours for your audience
- Engage with comments

### Instagram
- Use high-resolution images
- Write compelling captions
- Use relevant hashtags
- Post consistently

### Reddit
- Read subreddit rules before posting
- Contribute to discussions, don't just promote
- Use appropriate flair
- Respect community guidelines
- Avoid cross-posting the same content to many subreddits

## 🔒 Privacy & Security

- Your OAuth tokens are encrypted and stored securely
- We never store your passwords
- You can revoke access anytime
- We only request minimum required permissions
- Your content is never shared without your permission

## 📞 Support

Need help?
- Check our FAQ
- Contact support: support@huntaze.com
- Join our community forum

---

**Last Updated**: October 31, 2024
**Version**: 1.0
