# 🔐 Security Module - Huntaze

This module provides comprehensive security features for the Huntaze application, including token generation, OAuth validation, and environment security management.

---

## 📦 Components

### 1. Security Token Generator

**File:** `securityTokenGenerator.ts`

Generates cryptographically secure tokens for production use.

**Features:**
- 256-bit entropy minimum
- Secure random generation using Node.js crypto
- Token validation and strength checking
- Entropy calculation

**Usage:**
```typescript
import { securityTokenGenerator } from './securityTokenGenerator';

// Generate tokens
const tokens = securityTokenGenerator.generateSecurityTokens();
console.log(tokens.adminToken);
console.log(tokens.debugToken);

// Validate tokens
const validation = securityTokenGenerator.validateExistingTokens(
  adminToken,
  debugToken
);
console.log(validation.overall); // true/false
```

### 2. Token Backup Service

**File:** `tokenBackupService.ts`

Provides backup and restore functionality for security tokens.

**Features:**
- Encrypted token storage
- Backup versioning
- Restore from backup
- Backup listing

**Usage:**
```typescript
import { tokenBackupService } from './tokenBackupService';

// Create backup
const backupId = await tokenBackupService.createBackup(tokens, 'production');

// List backups
const backups = await tokenBackupService.listBackups();

// Restore from backup
const restoredTokens = await tokenBackupService.restoreFromBackup(backupId);
```

### 3. OAuth Validators

**File:** `oauth-validators.ts`

Validates OAuth credentials for TikTok, Instagram, and Reddit.

**Features:**
- Credential format validation
- API connectivity testing
- Authorization flow testing
- Production readiness checking

**Usage:**
```typescript
import { OAuthValidators } from './oauth-validators';

// Validate all platforms
const report = await OAuthValidators.validateAll();
console.log(report.overall.isValid);

// Validate specific platform
const tiktokResult = await OAuthValidators.validateTikTok();
console.log(tiktokResult.isValid);

// Check production readiness
const readiness = await OAuthValidators.isProductionReady();
console.log(readiness.ready);
```

### 4. Security Token Service

**File:** `securityTokenService.ts`

High-level service for token management and validation.

**Features:**
- Production token validation
- Token rotation checking
- Configuration auditing
- Security health status

**Usage:**
```typescript
import { securityTokenService } from './securityTokenService';

// Validate production tokens
const validation = await securityTokenService.validateProductionTokens();

// Check if rotation needed
const rotationCheck = await securityTokenService.shouldRotateTokens();

// Get security health
const health = await securityTokenService.getSecurityHealthStatus();
```

---

## 🚀 CLI Tools

### Generate Security Tokens

```bash
npm run security:generate
```

Interactive CLI for:
- Generating new tokens
- Validating existing tokens
- Creating backups
- Restoring from backups

### Validate Security Tokens

```bash
npm run security:validate
```

Validates current production tokens and provides security score.

### Validate OAuth Credentials

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

### Setup Production Environment

```bash
npm run setup:production
```

Interactive wizard for complete production environment setup.

---

## 🔒 Security Best Practices

### Token Management

1. **Never commit tokens to version control**
   ```bash
   # Add to .gitignore
   .env.production.local
   .env.local
   ```

2. **Rotate tokens regularly**
   - Recommended: Every 90 days
   - Use backup service before rotation
   - Update all deployment platforms

3. **Use different tokens per environment**
   - Development: `.env.development.local`
   - Staging: `.env.staging.local`
   - Production: `.env.production.local`

### OAuth Security

1. **Validate credentials before deployment**
   ```bash
   npm run oauth:validate
   npm run oauth:ready
   ```

2. **Use HTTPS for redirect URIs**
   - Always use `https://` in production
   - Never use `http://` or wildcards

3. **Monitor OAuth health**
   - Set up automated validation
   - Alert on validation failures
   - Track success rates

### Environment Security

1. **Secure file permissions**
   ```bash
   chmod 600 .env.production.local
   ```

2. **Encrypt sensitive data**
   - Use encryption for backups
   - Secure credential storage
   - Protect environment variables

3. **Audit regularly**
   ```bash
   npm run security:validate
   npm run oauth:validate
   ```

---

## 📊 Validation Criteria

### Token Validation

A valid token must:
- ✅ Be at least 32 characters long
- ✅ Have minimum 128-bit entropy
- ✅ Not be a common default value
- ✅ Not contain repeated patterns
- ✅ Have sufficient character diversity

### OAuth Validation

Valid OAuth credentials must:
- ✅ Be properly formatted
- ✅ Pass API connectivity tests
- ✅ Generate valid authorization URLs
- ✅ Have correct redirect URIs configured

---

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit lib/security
```

### Integration Tests

```bash
# Test OAuth validation
npm run oauth:validate

# Test token generation
npm run security:generate

# Test complete setup
npm run setup:production
```

---

## 📚 Documentation

- [Production Deployment Guide](../../docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Security Completion Report](../../docs/PRODUCTION_ENV_SECURITY_COMPLETION.md)
- [Security Guide](../../scripts/PRODUCTION_ENV_SECURITY_GUIDE.md)

---

## 🔧 Troubleshooting

### Common Issues

#### Token Validation Fails

```bash
# Check token format
npm run security:validate

# Regenerate if needed
npm run security:generate
```

#### OAuth Validation Fails

```bash
# Check specific platform
npm run oauth:validate:tiktok

# Review error messages
npm run oauth:report
```

#### Environment Variables Not Set

```bash
# Run setup wizard
npm run setup:production

# Or set manually
export ADMIN_TOKEN=your_token_here
```

---

## 📈 Monitoring

### Automated Checks

```bash
# Daily OAuth validation (cron)
0 2 * * * cd /app && npm run oauth:validate

# Weekly security audit
0 3 * * 1 cd /app && npm run security:validate
```

### Metrics to Track

- Token validation success rate
- OAuth connection success rate
- API response times
- Error rates
- Security audit scores

---

## 🎯 Quick Reference

### Environment Variables

```bash
# Security Tokens
ADMIN_TOKEN=<generated>
DEBUG_TOKEN=<generated>

# OAuth - TikTok
TIKTOK_CLIENT_KEY=<from_tiktok_dev>
TIKTOK_CLIENT_SECRET=<from_tiktok_dev>
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback

# OAuth - Instagram
FACEBOOK_APP_ID=<from_facebook_dev>
FACEBOOK_APP_SECRET=<from_facebook_dev>
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback

# OAuth - Reddit
REDDIT_CLIENT_ID=<from_reddit>
REDDIT_CLIENT_SECRET=<from_reddit>
REDDIT_USER_AGENT=Huntaze/1.0.0
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://yourdomain.com/auth/reddit/callback
```

### NPM Scripts

```bash
# Security
npm run security:generate    # Generate tokens
npm run security:validate    # Validate tokens

# OAuth
npm run oauth:validate       # Validate all
npm run oauth:ready          # Check readiness
npm run oauth:report         # Generate report

# Setup
npm run setup:production     # Interactive setup
```

---

**Version:** 1.0.0  
**Last Updated:** 2024-11-14  
**Status:** Production Ready
