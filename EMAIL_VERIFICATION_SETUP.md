# 📧 Email Verification System - Setup Guide

**Date:** 15 novembre 2025  
**Status:** ✅ Code Deployed - Requires AWS SES Configuration

---

## 🎯 What Was Added

### 1. AWS SES Email Service ✅
**File:** `lib/services/email/ses.ts`

**Features:**
- ✅ Verification email with 24-hour token
- ✅ Welcome email after verification
- ✅ Password reset email (ready for future use)
- ✅ Beautiful HTML templates with branding
- ✅ Plain text fallback
- ✅ Non-blocking email sending

### 2. Email Verification Flow ✅
**Files:**
- `lib/services/auth/register.ts` - Updated to send verification email
- `app/api/auth/verify-email/route.ts` - Verification endpoint

**Flow:**
```
1. User registers → Verification token generated
2. Email sent with verification link
3. User clicks link → Email verified
4. Welcome email sent
5. User can now login
```

### 3. Database Migration ✅
**File:** `scripts/migrations/add-email-verification.sql`

**New Columns:**
- `email_verified` - Timestamp when verified
- `email_verification_token` - Verification token
- `email_verification_expires` - Token expiry (24h)

---

## 🔧 AWS SES Configuration

### Step 1: Verify Your Domain in AWS SES

```bash
1. Go to AWS SES Console
2. Click "Verified identities"
3. Click "Create identity"
4. Select "Domain"
5. Enter: huntaze.com
6. Enable DKIM signing
7. Click "Create identity"
8. Add DNS records to your domain:
   - DKIM records (3 CNAME records)
   - SPF record (TXT)
   - DMARC record (TXT)
```

### Step 2: Request Production Access

```bash
# By default, SES is in sandbox mode (can only send to verified emails)
# Request production access:

1. Go to AWS SES Console
2. Click "Account dashboard"
3. Click "Request production access"
4. Fill out the form:
   - Use case: Transactional emails
   - Website URL: https://huntaze.com
   - Describe use case: User registration verification emails
   - Compliance: Yes, we have opt-in process
5. Submit request (usually approved in 24 hours)
```

### Step 3: Set Environment Variables

**In AWS Amplify Console:**

```bash
# Required
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=REDACTED-access-key-id
AWS_SECRET_ACCESS_KEY=REDACTED-secret-access-key
AWS_SESSION_TOKEN=REDACTED-session-token  # Only if using temporary credentials

# Optional (defaults to noreply@huntaze.com)
FROM_EMAIL=noreply@huntaze.com
```

**Note:** Pour la production, utilisez des credentials IAM permanents ou un rôle IAM attaché à l'instance Amplify.

---

## 🗄️ Database Migration

### Run Migration

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration
\i scripts/migrations/add-email-verification.sql

# Verify columns were added
\d users
```

### Expected Output

```sql
Column                        | Type                        | Nullable
------------------------------+-----------------------------+----------
email_verified                | timestamp without time zone | YES
email_verification_token      | character varying(255)      | YES
email_verification_expires    | timestamp without time zone | YES
```

---

## 🧪 Testing

### Test 1: Registration with Email
```bash
# Register a new user
POST /api/auth/register
{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!"
}

# Expected Response:
{
  "success": true,
  "user": {
    "id": "123",
    "email": "test@example.com",
    "name": "Test User"
  },
  "message": "Account created successfully. Please check your email to verify your account."
}

# Check email inbox for verification email
```

### Test 2: Email Verification
```bash
# Click link in email or visit:
GET /api/auth/verify-email?token=abc123...

# Expected:
- Redirect to /auth?verified=success
- Welcome email sent
- User can now login
```

### Test 3: Check Database
```sql
-- Check user was created with verification token
SELECT 
  id, 
  email, 
  email_verified, 
  email_verification_token IS NOT NULL as has_token,
  email_verification_expires
FROM users 
WHERE email = 'test@example.com';

-- After verification:
-- email_verified should have a timestamp
-- email_verification_token should be NULL
```

---

## 📧 Email Templates

### Verification Email
- **Subject:** "Verify your Huntaze account"
- **Content:** Welcome message + verification button
- **Expiry:** 24 hours
- **Design:** Purple/Indigo gradient, modern layout

### Welcome Email
- **Subject:** "Welcome to Huntaze!"
- **Content:** Feature highlights, getting started
- **Sent:** After email verification
- **Design:** Branded, professional

### Password Reset Email (Future)
- **Subject:** "Reset your Huntaze password"
- **Content:** Reset link + security notice
- **Expiry:** 1 hour
- **Design:** Security-focused

---

## 🔒 Security Features

### Token Security
- ✅ 32-byte random tokens (crypto.randomBytes)
- ✅ 24-hour expiry
- ✅ Single-use (deleted after verification)
- ✅ Indexed for fast lookup

### Email Security
- ✅ DKIM signing (AWS SES)
- ✅ SPF records
- ✅ DMARC policy
- ✅ HTTPS links only
- ✅ No sensitive data in emails

### Rate Limiting
- ✅ Retry logic with exponential backoff
- ✅ Non-blocking email sending
- ✅ Error logging
- ✅ Graceful degradation

---

## 🐛 Troubleshooting

### Issue: Emails not sending

**Check 1: SES Sandbox Mode**
```bash
# If in sandbox, can only send to verified emails
# Solution: Request production access (see Step 2 above)
```

**Check 2: Environment Variables**
```bash
# Verify in Amplify Console
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=REDACTED...
AWS_SECRET_ACCESS_KEY=REDACTED...
AWS_SESSION_TOKEN=REDACTED...  # If using temporary credentials
```

**Check 3: Domain Verification**
```bash
# In AWS SES Console, check domain status
# Should show: "Verified" with green checkmark
```

**Check 4: Application Logs**
```bash
# Look for in Amplify logs:
[Email] Sent successfully: { to: '...', messageId: '...' }

# Or errors:
[Email] Failed to send: { error: '...' }
```

### Issue: Verification link expired

**Solution:**
```sql
-- Generate new token manually (or add resend endpoint)
UPDATE users 
SET email_verification_token = 'new-token-here',
    email_verification_expires = NOW() + INTERVAL '24 hours'
WHERE email = 'user@example.com';
```

### Issue: User already verified

**Expected behavior:**
- Clicking verification link again redirects to `/auth?verified=already`
- No error, just informational message

---

## 📊 Monitoring

### Email Metrics (AWS SES Console)

```bash
1. Go to AWS SES Console
2. Click "Reputation dashboard"
3. Monitor:
   - Bounce rate (should be < 5%)
   - Complaint rate (should be < 0.1%)
   - Delivery rate (should be > 95%)
```

### Application Logs

```bash
# Successful verification
[Auth] Email verified: { userId: '123', email: '...' }

# Email sent
[Email] Sent successfully: { to: '...', messageId: '...' }

# Email failed
[Email] Failed to send: { error: '...' }
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] ✅ Email service created
- [x] ✅ Verification flow implemented
- [x] ✅ Database migration ready
- [x] ✅ Code pushed to staging

### AWS SES Setup
- [ ] ⏳ Domain verified in SES
- [ ] ⏳ DNS records added (DKIM, SPF, DMARC)
- [ ] ⏳ Production access requested
- [ ] ⏳ Environment variables set in Amplify

### Database Setup
- [ ] ⏳ Migration script executed
- [ ] ⏳ Columns verified
- [ ] ⏳ Indexes created

### Testing
- [ ] ⏳ Test registration sends email
- [ ] ⏳ Test verification link works
- [ ] ⏳ Test welcome email sent
- [ ] ⏳ Test expired token handling
- [ ] ⏳ Test already verified handling

---

## 🎉 Success Criteria

System is working when:
- ✅ User registers and receives verification email
- ✅ Verification link works and verifies email
- ✅ Welcome email sent after verification
- ✅ User can login after verification
- ✅ Emails have proper branding
- ✅ No errors in logs
- ✅ Bounce rate < 5%
- ✅ Delivery rate > 95%

---

## 📝 Next Steps

1. **Immediate:**
   - Configure AWS SES domain verification
   - Add DNS records
   - Request production access
   - Run database migration

2. **Short-term:**
   - Test email flow on staging
   - Monitor delivery rates
   - Add resend verification email endpoint

3. **Future Enhancements:**
   - Password reset flow
   - Email preferences
   - Notification emails
   - Marketing emails (with opt-in)

---

**Status:** ✅ Code Ready - Awaiting AWS SES Configuration  
**Next Action:** Configure AWS SES and run database migration
