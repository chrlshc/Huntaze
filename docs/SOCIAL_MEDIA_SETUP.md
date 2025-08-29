# Social Media Integration Setup Guide

## Overview
This guide will help you set up OAuth integrations for each social media platform in Huntaze.

## Instagram Setup

1. **Create an Instagram App:**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use existing
   - Add Instagram Basic Display product
   - Configure OAuth Redirect URI: `https://huntaze.com/auth/instagram/callback`

2. **Required Permissions:**
   - `user_profile` - Read access to profile
   - `user_media` - Read access to media

3. **Environment Variables:**
   ```bash
   INSTAGRAM_CLIENT_ID=your-app-id-here
   INSTAGRAM_CLIENT_SECRET=your-app-secret-here
   NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://huntaze.com/auth/instagram/callback
   ```

## TikTok Setup

1. **Create a TikTok App:**
   - Go to [TikTok for Developers](https://developers.tiktok.com/)
   - Create new app in TikTok for Developers portal
   - Set Redirect URI: `https://huntaze.com/auth/tiktok/callback`

2. **Required Scopes:**
   - `user.info.basic` - Read basic user info
   - `user.info.stats` - Read user statistics
   - `video.list` - Read user's videos

3. **Environment Variables:**
   ```bash
   TIKTOK_CLIENT_KEY=your-client-key-here
   TIKTOK_CLIENT_SECRET=your-client-secret-here
   NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
   ```

## Reddit Setup

1. **Create a Reddit App:**
   - Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
   - Click "Create App" or "Create Another App"
   - Choose "web app" as the app type
   - Set redirect URI: `https://huntaze.com/auth/reddit/callback`

2. **Required Scopes:**
   - `identity` - Read user identity
   - `read` - Read user data
   - `mysubreddits` - Read user's subreddits

3. **Environment Variables:**
   ```bash
   REDDIT_CLIENT_ID=your-client-id-here
   REDDIT_CLIENT_SECRET=your-client-secret-here
   REDDIT_USER_AGENT=Huntaze:v1.0.0 (by /u/YourUsername)
   NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://huntaze.com/auth/reddit/callback
   ```

## Twitter/X Setup (Coming Soon)

Twitter integration is planned for a future release.

## OnlyFans Setup

Contact OnlyFans for API access as they have a closed API system.

## Fansly Setup

1. **Get API Access:**
   - Apply for Fansly API access through their developer portal
   - Wait for approval

2. **Environment Variables:**
   ```bash
   FANSLY_API_KEY=your-api-key-here
   FANSLY_API_SECRET=your-api-secret-here
   ```

## AWS Amplify Configuration

Add all these environment variables to your AWS Amplify app:

1. Go to AWS Amplify Console
2. Select your app
3. Go to "App settings" → "Environment variables"
4. Add each variable with its value

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your app IDs and secrets
3. For local testing, update redirect URIs to use `http://localhost:3002`

## Security Notes

- Never commit `.env.local` or any file containing real credentials
- Use AWS Secrets Manager or Parameter Store for production secrets
- Rotate secrets regularly
- Use different apps/credentials for development and production