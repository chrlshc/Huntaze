# 🚀 Production Deployment Guide - Huntaze

**Version:** 1.0.0  
**Last Updated:** 2024-11-14  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Security Setup](#security-setup)
4. [OAuth Configuration](#oauth-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment Platforms](#deployment-platforms)
7. [Validation & Testing](#validation--testing)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide covers the complete production deployment process for Huntaze, including:

- ✅ Security token generation and management
- ✅ OAuth credentials configuration for all platforms
- ✅ Environment variable setup and validation
- ✅ Platform-specific deployment instructions
- ✅ Post-deployment validation and monitoring

---

## 📦 Prerequisites

### Required Tools

```bash
# Node.js 18+ and npm
node --version  # Should be 18.x or higher
npm --version

# TypeScript execution (tsx)
npm install -g tsx

# Git
git --version
```

### Required Accounts

- [ ] AWS Account (for Amplify deployment)
- [ ] TikTok Developer Account
- [ ] Facebook Developer Account (for Instagram)
- [ ] Reddit Developer Account
- [ ] Database hosting (PostgreSQL)
- [ ] Redis hosting (optional but recommended)

---

## 🔐 Security Setup

### Step 1: Generate Security Tokens

Use the interactive token generator:

```bash
npm run security:generate
```

This will:
1. Generate cryptographically secure tokens
2. Validate token strength (entropy checking)
3. Save tokens to `.env` file
4. Create backup for recovery

**Manual Generation (if needed):**

```bash
# Generate a secure token manually
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Validate Security Tokens

```bash
npm run security:validate
```

Expected output:
```
✅ Admin Token: Valid (Length: 64, Entropy: 256.00 bits)
✅ Debug Token: Valid (Length: 64, Entropy: 256.00 bits)
✅ Security Score: 100/100
```

### Security Best Practices

1. **Never commit tokens to version control**
   ```bash
   # Add to .gitignore
   echo ".env.production.local" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Rotate tokens every 90 days**
   - Set calendar reminder
   - Use token backup service
   - Update all deployment platforms

3. **Use different tokens for each environment**
   - Development: `.env.development.local`
   - Staging: `.env.staging.local`
   - Production: `.env.production.local`

---

## 🔗 OAuth Configuration

### TikTok OAuth Setup

1. **Create TikTok App**
   - Go to [TikTok Developers](https://developers.tiktok.com/apps/)
   - Click "Create App"
   - Fill in app details
   - Enable "Login Kit"

2. **Get Credentials**
   ```
   Client Key: awxxxxxxxxxx
   Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Configure Redirect URI**
   ```
   https://yourdomain.com/auth/tiktok/callback
   ```

4. **Set Environment Variables**
   ```bash
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback
   ```

### Instagram OAuth Setup

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/apps/)
   - Create new app
   - Add "Instagram Basic Display" product

2. **Get Credentials**
   ```
   App ID: 1234567890123456
   App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Configure Redirect URI**
   ```
   https://yourdomain.com/auth/instagram/callback
   ```

4. **Set Environment Variables**
   ```bash
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback
   ```

### Reddit OAuth Setup

1. **Create Reddit App**
   - Go to [Reddit Apps](https://www.reddit.com/prefs/apps/)
   - Click "create another app"
   - Select "web app"

2. **Get Credentials**
   ```
   Client ID: xxxxxxxxxxxx
   Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Configure Redirect URI**
   ```
   https://yourdomain.com/auth/reddit/callback
   ```

4. **Set Environment Variables**
   ```bash
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=Huntaze/1.0.0
   NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://yourdomain.com/auth/reddit/callback
   ```

### Validate OAuth Configuration

```bash
# Validate all platforms
npm run oauth:validate

# Validate specific platform
npm run oauth:validate:tiktok
npm run oauth:validate:instagram
npm run oauth:validate:reddit

# Generate detailed report
npm run oauth:report

# Check production readiness
npm run oauth:ready
```

---

## ⚙️ Environment Variables

### Complete Environment Setup

Use the interactive setup wizard:

```bash
npm run setup:production
```

This wizard will guide you through:
1. Security token generation
2. OAuth credentials configuration
3. Database and AWS setup
4. Validation and testing

### Manual Configuration

Create `.env.production.local`:

```bash
# Security Tokens
ADMIN_TOKEN=your_secure_admin_token_here
DEBUG_TOKEN=your_secure_debug_token_here

# OAuth - TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback

# OAuth - Instagram/Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback

# OAuth - Reddit
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=Huntaze/1.0.0
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://yourdomain.com/auth/reddit/callback

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret

# Database
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://user:password@host:port

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint

# Monitoring
SENTRY_DSN=your_sentry_dsn
VERCEL_ANALYTICS_ID=your_vercel_analytics_id

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

---

## 🚀 Deployment Platforms

### AWS Amplify Deployment

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   ```

3. **Add Environment Variables**
   ```bash
   # Via Amplify Console
   # Go to: App Settings > Environment Variables
   # Add all variables from .env.production.local
   ```

4. **Deploy**
   ```bash
   amplify push
   amplify publish
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Add Environment Variables**
   ```bash
   # Via Vercel Dashboard
   # Go to: Project Settings > Environment Variables
   # Or use CLI:
   vercel env add ADMIN_TOKEN production
   vercel env add DEBUG_TOKEN production
   # ... add all variables
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Add Environment Variables**
   ```bash
   # Via Netlify Dashboard
   # Go to: Site Settings > Environment Variables
   # Or use CLI:
   netlify env:set ADMIN_TOKEN "your_token"
   netlify env:set DEBUG_TOKEN "your_token"
   # ... add all variables
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Docker Deployment

1. **Build Image**
   ```bash
   docker build -t huntaze:latest .
   ```

2. **Run with Environment File**
   ```bash
   docker run --env-file .env.production.local -p 3000:3000 huntaze:latest
   ```

3. **Or with Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       image: huntaze:latest
       env_file:
         - .env.production.local
       ports:
         - "3000:3000"
   ```

---

## ✅ Validation & Testing

### Pre-Deployment Checklist

```bash
# 1. Security validation
npm run security:validate
# Expected: ✅ All tokens valid, Score: 100/100

# 2. OAuth validation
npm run oauth:validate
# Expected: ✅ All platforms valid

# 3. Production readiness
npm run oauth:ready
# Expected: ✅ Production Ready: Yes

# 4. Build test
npm run build
# Expected: ✅ Build successful

# 5. Type checking
npm run type-check
# Expected: ✅ No TypeScript errors

# 6. Unit tests
npm run test:unit
# Expected: ✅ All tests passing

# 7. Integration tests
npm run test:integration
# Expected: ✅ All tests passing
```

### Post-Deployment Validation

```bash
# Test OAuth endpoints
curl -I https://yourdomain.com/auth/tiktok
curl -I https://yourdomain.com/auth/instagram
curl -I https://yourdomain.com/auth/reddit

# Test API health
curl https://yourdomain.com/api/health

# Test with admin token
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://yourdomain.com/api/admin/status
```

### Smoke Tests

1. **User Registration**
   - Create new account
   - Verify email confirmation
   - Check database entry

2. **OAuth Flows**
   - Connect TikTok account
   - Connect Instagram account
   - Connect Reddit account
   - Verify tokens stored correctly

3. **Content Publishing**
   - Create post
   - Schedule post
   - Publish to platforms
   - Verify delivery

---

## 📊 Monitoring & Maintenance

### Health Checks

Set up automated health checks:

```bash
# Cron job for daily validation
0 2 * * * cd /app && npm run oauth:validate >> /var/log/oauth-validation.log 2>&1

# Weekly security audit
0 3 * * 1 cd /app && npm run security:validate >> /var/log/security-audit.log 2>&1
```

### Monitoring Metrics

Track these key metrics:

1. **OAuth Success Rate**
   - TikTok connection success rate
   - Instagram connection success rate
   - Reddit connection success rate

2. **API Response Times**
   - Average response time
   - 95th percentile
   - 99th percentile

3. **Error Rates**
   - OAuth failures
   - API errors
   - Database errors

4. **Security Events**
   - Failed authentication attempts
   - Token validation failures
   - Suspicious activity

### Alerts Configuration

Set up alerts for:

- OAuth validation failures
- Security token issues
- High error rates (>5%)
- Slow response times (>2s)
- Database connection issues

---

## 🔧 Troubleshooting

### Common Issues

#### 1. OAuth "Invalid Redirect URI" Error

**Problem:** OAuth callback fails with redirect URI mismatch

**Solution:**
```bash
# Check environment variable
echo $NEXT_PUBLIC_TIKTOK_REDIRECT_URI

# Verify in OAuth app settings
# Must match exactly (including https://)

# Update if needed
export NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback
```

#### 2. "Missing ADMIN_TOKEN" Error

**Problem:** Application fails to start due to missing token

**Solution:**
```bash
# Generate new token
npm run security:generate

# Or set manually
export ADMIN_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

#### 3. OAuth Validation Fails

**Problem:** `npm run oauth:validate` shows errors

**Solution:**
```bash
# Check specific platform
npm run oauth:validate:tiktok

# Review error messages
# Common issues:
# - Credentials not set
# - Invalid format
# - API connectivity issues

# Fix and re-validate
npm run oauth:validate
```

#### 4. Build Fails with Environment Errors

**Problem:** Build process fails due to missing environment variables

**Solution:**
```bash
# Check all required variables are set
npm run oauth:validate

# Verify .env file syntax
cat .env.production.local | grep -E '^[A-Z_]+=.+'

# Check for typos in variable names
```

#### 5. Database Connection Issues

**Problem:** Cannot connect to database

**Solution:**
```bash
# Test database connection
psql $DATABASE_URL

# Check connection string format
# postgresql://user:password@host:port/database

# Verify network access
# - Check firewall rules
# - Verify security groups
# - Test from deployment environment
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=huntaze:*

# Run with verbose output
DEBUG=1 npm run oauth:validate

# Check application logs
tail -f /var/log/huntaze/app.log
```

### Getting Help

1. **Check Documentation**
   - Review this guide
   - Check OAuth platform docs
   - Review error messages

2. **Run Diagnostics**
   ```bash
   npm run oauth:report > diagnostics.md
   npm run security:validate >> diagnostics.md
   ```

3. **Contact Support**
   - Include diagnostics report
   - Describe steps to reproduce
   - Share relevant logs (redact sensitive data)

---

## 📚 Additional Resources

### Documentation

- [TikTok Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Reddit OAuth2 Documentation](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)

### Security Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

### Tools

- [JWT Debugger](https://jwt.io/)
- [OAuth Playground](https://www.oauth.com/playground/)
- [Postman](https://www.postman.com/) - API testing

---

## ✅ Final Checklist

### Before Going Live

- [ ] All security tokens generated and validated
- [ ] All OAuth credentials configured and tested
- [ ] Environment variables set in deployment platform
- [ ] Database migrations completed
- [ ] Redis cache configured
- [ ] Monitoring and alerts configured
- [ ] Backup procedures documented
- [ ] Incident response plan ready
- [ ] Team trained on deployment process
- [ ] Rollback procedure tested

### After Going Live

- [ ] Smoke tests completed successfully
- [ ] OAuth flows tested manually
- [ ] Monitoring dashboards reviewed
- [ ] Error rates within acceptable limits
- [ ] Performance metrics acceptable
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team notified of successful deployment

---

**Document Version:** 1.0.0  
**Last Updated:** 2024-11-14  
**Next Review:** 2024-12-14

**Maintainer:** Huntaze DevOps Team  
**Contact:** devops@huntaze.com
