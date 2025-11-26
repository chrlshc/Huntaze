# ✅ AWS SES Email Verification - Code Updates Complete

**Date:** November 25, 2024  
**Status:** ✅ Code Ready - Configuration Required  
**Environment:** Staging (staging.huntaze.com)

---

## 🎯 What Was Done

### Code Changes

I've updated the email sending system to support flexible configuration:

#### 1. **Updated `lib/auth/magic-link.ts`**
- ✅ Now checks `AWS_SES_REGION`, `SES_REGION`, and `AWS_REGION` (in that order)
- ✅ Now checks `AWS_SES_FROM_EMAIL`, `SES_FROM_EMAIL`, and `EMAIL_FROM` (in that order)
- ✅ Added support for `AWS_SESSION_TOKEN` (for temporary credentials)
- ✅ Enhanced error logging with specific hints for common issues
- ✅ Logs provider, region, and configuration details on errors

#### 2. **Created Debug Endpoint** (`app/api/debug/email/route.ts`)
- ✅ Test email sending without full signup flow
- ✅ Returns detailed error messages and configuration info
- ✅ Provides specific hints for common SES issues
- ✅ Shows current configuration (region, from email, credentials status)

#### 3. **Created Documentation**
- ✅ `SES_EMAIL_VERIFICATION_CHECKLIST.md` - Complete setup guide
- ✅ `scripts/setup-ses-staging.sh` - Automated setup script

---

## 🔧 What You Need to Do Now

### Step 1: Add Environment Variables to Amplify (5 minutes)

Go to **AWS Amplify Console** → Your App → Environment Variables

Add these variables:

```bash
# AWS Credentials (configure in Amplify Console)
AWS_ACCESS_KEY_ID=REDACTED_access_key_id
AWS_SECRET_ACCESS_KEY=REDACTED_secret_access_key
AWS_SESSION_TOKEN=REDACTED_session_token_if_needed

# AWS Region
AWS_REGION=us-east-1
AWS_SES_REGION=us-east-1

# SES Email Configuration
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
SES_FROM_EMAIL=no-reply@huntaze.com
EMAIL_FROM=no-reply@huntaze.com

# NextAuth
NEXTAUTH_URL=https://staging.huntaze.com
```

**Or use the automated script:**
```bash
./scripts/setup-ses-staging.sh
```

### Step 2: Verify Emails in SES (2 minutes)

Since you're in **SANDBOX MODE**, you need to verify recipient emails:

1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click "Create identity"
3. Select "Email address"
4. Enter your test email (e.g., `charles@huntaze.com`)
5. Check inbox and click verification link

**Already Verified:**
- ✅ `huntaze.com` (domain)
- ✅ `no-reply@huntaze.com` (sender)
- ✅ `charles@huntaze.com` (recipient)

### Step 3: Deploy Changes (1 minute)

```bash
git add .
git commit -m "feat: enhance SES email configuration with flexible env vars"
git push origin main
```

Wait for Amplify to build and deploy (~5 minutes).

### Step 4: Test Email Sending (2 minutes)

**Test 1: Debug Endpoint**
```bash
curl -X POST https://staging.huntaze.com/api/debug/email \
  -H "Content-Type: application/json" \
  -d '{"to":"charles@huntaze.com"}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "provider": "ses",
  "message": "Test email sent successfully",
  "to": "charles@huntaze.com",
  "config": {
    "region": "us-east-1",
    "from": "no-reply@huntaze.com",
    "hasCredentials": true,
    "hasSessionToken": true
  }
}
```

**Test 2: Signup Flow**
1. Go to: https://staging.huntaze.com/signup
2. Enter: `charles@huntaze.com`
3. Click "Continue with Email"
4. Check inbox for magic link
5. Click link and verify it works

### Step 5: Check Logs (if issues occur)

**Amplify Logs:**
1. Go to: https://console.aws.amazon.com/amplify/
2. Select your app → Hosting → Logs
3. Search for: `"Failed to send magic link email"`

**CloudWatch Logs:**
1. Go to: https://console.aws.amazon.com/cloudwatch/
2. Navigate to Log Groups
3. Find your Amplify app logs
4. Search for error messages

---

## 🔍 Troubleshooting Guide

### Error: "Email address is not verified"

**Cause:** Recipient email not verified in SES (sandbox mode)

**Solution:**
1. Go to SES Console → Verified Identities
2. Add the recipient email
3. Verify it via the email link
4. Try again

### Error: "Could not load credentials"

**Cause:** AWS credentials not set or incorrect

**Solution:**
1. Check Amplify environment variables
2. Ensure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` are set
3. Verify no typos in the values
4. Redeploy after adding variables

### Error: "Access Denied"

**Cause:** IAM policy doesn't allow SES operations

**Solution:**
1. Check IAM policy for the credentials
2. Ensure it allows: `ses:SendEmail`, `ses:SendRawEmail`
3. Verify the policy is for region `us-east-1`
4. Check for any explicit `Deny` statements

### Error: "MessageRejected"

**Cause:** Multiple possible reasons

**Solution:**
1. Verify sender email (`no-reply@huntaze.com`) is verified
2. Verify recipient email (if in sandbox)
3. Check email format is valid
4. Ensure you're in the correct region (`us-east-1`)

---

## 📊 Current SES Status

### Account Information
- **Account ID:** 317805897534
- **Region:** us-east-1
- **Status:** ⚠️ SANDBOX MODE

### Sandbox Limitations
- ✅ Can send FROM verified emails only
- ⚠️ Can send TO verified emails only
- ⚠️ Max 200 emails per 24 hours
- ⚠️ Max 1 email per second

### Verified Identities
- ✅ Domain: `huntaze.com`
- ✅ Email: `no-reply@huntaze.com`
- ✅ Email: `charles@huntaze.com`

### To Exit Sandbox Mode

**Request Production Access:**
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1
2. Click "Account Dashboard" → "Request production access"
3. Fill out form:
   - **Mail Type:** Transactional
   - **Website:** https://huntaze.com
   - **Use Case:** "Magic link authentication for user signup"
   - **Volume:** "1,000/day initially, scaling to 10,000/day"
4. Submit and wait 24-48 hours

**After Approval:**
- ✅ Send to ANY email address
- ✅ Higher limits (50,000/day, 14/second)
- ✅ No recipient verification needed

---

## 📋 Quick Reference

### Environment Variables Priority

**Region:**
1. `AWS_SES_REGION` (highest priority)
2. `SES_REGION`
3. `AWS_REGION`
4. `us-east-1` (default)

**From Email:**
1. `AWS_SES_FROM_EMAIL` (highest priority)
2. `SES_FROM_EMAIL`
3. `EMAIL_FROM`
4. `noreply@huntaze.com` (default)

### Useful Links

- **SES Console:** https://console.aws.amazon.com/ses/home?region=us-east-1
- **Verified Identities:** https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
- **Amplify Console:** https://console.aws.amazon.com/amplify/
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/

### Test Commands

**Debug endpoint:**
```bash
curl -X POST https://staging.huntaze.com/api/debug/email \
  -H "Content-Type: application/json" \
  -d '{"to":"charles@huntaze.com"}'
```

**Check configuration:**
```bash
curl https://staging.huntaze.com/api/debug/email
```

---

## ✅ Summary

### What's Complete
- ✅ Code updated to support flexible env vars
- ✅ Enhanced error logging with specific hints
- ✅ Debug endpoint created for easy testing
- ✅ Documentation and scripts created
- ✅ Support for temporary credentials (session token)

### What You Need to Do
1. ⏳ Add environment variables to Amplify (5 min)
2. ⏳ Verify test email in SES (2 min)
3. ⏳ Deploy changes (1 min + 5 min build)
4. ⏳ Test email sending (2 min)
5. ⏳ Request production access (10 min + 24-48h wait)

### Total Time
- **Setup:** ~10 minutes
- **Build/Deploy:** ~5 minutes
- **Testing:** ~2 minutes
- **Production Access:** 24-48 hours (optional, for removing sandbox limits)

---

## 🎯 Next Steps

### Immediate (Today)
1. Add environment variables to Amplify Console
2. Deploy the code changes
3. Test with the debug endpoint
4. Test the signup flow

### Short-term (This Week)
1. Request SES production access
2. Monitor email delivery metrics
3. Set up bounce/complaint handling

### Long-term (Next Week)
1. Configure SNS notifications
2. Set up CloudWatch alarms
3. Implement DMARC monitoring

---

**Status:** ✅ Code Ready - Awaiting Configuration  
**Last Updated:** November 25, 2024  
**Region:** us-east-1  
**Account:** 317805897534

**Ready to test once environment variables are configured in Amplify!** 🚀
