# AWS SES Email Verification - Staging Checklist

**Date:** November 25, 2024  
**Environment:** Staging (staging.huntaze.com)  
**Status:** ⏳ Verification Required

---

## ✅ What's Already Fixed in Code

The email sending code has been updated to:
- ✅ Use AWS SES for email delivery
- ✅ Log errors when email sending fails
- ✅ Support multiple environment variable names

**Current Implementation:**
- Uses `EMAIL_FROM` environment variable
- Uses `AWS_REGION` for SES region
- Uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for credentials

---

## 🔧 Required Environment Variables (Staging)

Add these to **AWS Amplify Console → Environment Variables**:

### Core AWS Credentials
```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SESSION_TOKEN=your_session_token_if_needed
```

### SES Configuration
```bash
AWS_REGION=us-east-1
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
SES_FROM_EMAIL=no-reply@huntaze.com
EMAIL_FROM=no-reply@huntaze.com
```

### NextAuth
```bash
NEXTAUTH_URL=https://staging.huntaze.com
```

---

## ⚠️ Important: SES Sandbox Mode

Your AWS SES account is currently in **SANDBOX MODE**:

### Current Limitations
- ✅ Can send FROM: `no-reply@huntaze.com` (verified)
- ✅ Can send FROM: `charles@huntaze.com` (verified)
- ⚠️ Can ONLY send TO verified email addresses
- ⚠️ Maximum 200 emails per 24 hours
- ⚠️ Maximum 1 email per second

### For Testing in Sandbox
You must verify the recipient email address first:

1. **Go to AWS SES Console:**
   ```
   https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
   ```

2. **Click "Create identity"**

3. **Select "Email address"**

4. **Enter your test email** (e.g., `your-test@email.com`)

5. **Check your inbox** and click the verification link

6. **Now you can test** sending to that email

### To Exit Sandbox Mode
1. Go to AWS SES Console → Account Dashboard
2. Click "Request production access"
3. Fill out the form:
   - **Mail Type:** Transactional
   - **Website URL:** https://huntaze.com
   - **Use Case:** "Magic link authentication emails for user signup and login"
   - **Expected Volume:** "Start with 1,000/day, scale to 10,000/day"
4. Wait 24-48 hours for approval

---

## 🧪 Quick Test (No Code Changes Needed)

### Test 1: Check if email endpoint works

```bash
curl -X POST https://staging.huntaze.com/api/debug/email \
  -H "Content-Type: application/json" \
  -d '{"to":"charles@huntaze.com"}'
```

**Expected Response:**
- ✅ Success: `{"success": true, "provider": "ses"}`
- ❌ Error: Will show the specific error message

### Test 2: Test signup flow

1. Go to: `https://staging.huntaze.com/signup`
2. Enter a **verified email address** (e.g., `charles@huntaze.com`)
3. Click "Continue with Email"
4. Check your inbox for the magic link

---

## 🔍 Troubleshooting

### Check CloudWatch Logs

1. **Go to AWS Amplify Console:**
   ```
   https://console.aws.amazon.com/amplify/
   ```

2. **Select your app → Hosting → Logs**

3. **Search for:**
   - `"Verification email not sent"`
   - `"Failed to send verification email"`
   - `"Magic link email sent"`

### Common Issues & Solutions

#### Issue: "Email address is not verified"
**Solution:** Add the recipient email to SES verified identities (see Sandbox section above)

#### Issue: "Invalid AWS credentials"
**Solution:** 
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Check if `AWS_SESSION_TOKEN` is required (for temporary credentials)
- Ensure credentials have `ses:SendEmail` permission

#### Issue: "Could not find credentials"
**Solution:** Ensure all three AWS credential variables are set in Amplify

#### Issue: "Access Denied"
**Solution:** Check IAM policy allows `ses:SendEmail` and `ses:SendRawEmail` in `us-east-1`

#### Issue: "MessageRejected: Email address is not verified"
**Solution:** 
- Verify the FROM address (`no-reply@huntaze.com`) is verified in SES
- Verify the TO address is verified (if in sandbox mode)
- Ensure you're using the same region (`us-east-1`)

---

## 📋 Verification Checklist

### Before Testing
- [ ] AWS credentials added to Amplify environment variables
- [ ] `AWS_REGION=us-east-1` set
- [ ] `EMAIL_FROM=no-reply@huntaze.com` set
- [ ] `NEXTAUTH_URL=https://staging.huntaze.com` set
- [ ] Sender email (`no-reply@huntaze.com`) is verified in SES
- [ ] Test recipient email is verified in SES (if in sandbox)

### During Testing
- [ ] Run curl test to `/api/debug/email`
- [ ] Check response for success or error details
- [ ] Test signup flow with verified email
- [ ] Check inbox for magic link email
- [ ] Click magic link and verify it works

### After Testing
- [ ] Check CloudWatch logs for any errors
- [ ] Verify email delivery in SES console
- [ ] Monitor bounce/complaint rates
- [ ] Request production access if needed

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Add environment variables to Amplify Console
2. ✅ Verify sender email in SES (already done: `no-reply@huntaze.com`)
3. ✅ Verify test recipient email in SES
4. ✅ Run curl test
5. ✅ Test signup flow

### Short-term (This Week)
1. ⏳ Request SES production access
2. ⏳ Wait for approval (24-48h)
3. ⏳ Test with unverified email addresses
4. ⏳ Monitor email delivery metrics

### Long-term (Next Week)
1. ⏳ Set up SNS notifications for bounces/complaints
2. ⏳ Configure CloudWatch alarms
3. ⏳ Implement bounce handling
4. ⏳ Set up DMARC monitoring

---

## 📞 Quick Reference

### AWS Console Links
- **SES Console:** https://console.aws.amazon.com/ses/home?region=us-east-1
- **Verified Identities:** https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
- **Amplify Console:** https://console.aws.amazon.com/amplify/
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/

### Verified Identities (us-east-1)
- ✅ Domain: `huntaze.com`
- ✅ Email: `no-reply@huntaze.com`
- ✅ Email: `charles@huntaze.com`

### Current Limits (Sandbox)
- **Max per day:** 200 emails
- **Max per second:** 1 email
- **Can send to:** Verified addresses only

---

## ✅ Summary

**What you need to do:**

1. **Add environment variables to Amplify** (5 minutes)
2. **Verify test email in SES** (2 minutes)
3. **Run curl test** (1 minute)
4. **Test signup flow** (2 minutes)
5. **Request production access** (10 minutes)

**Total time:** ~20 minutes + 24-48h wait for production access

**Status:** Ready to test once environment variables are configured!

---

**Last Updated:** November 25, 2024  
**Region:** us-east-1  
**Account:** 317805897534
