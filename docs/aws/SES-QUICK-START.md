# 🚀 AWS SES Quick Start - 5 Minutes

**Goal**: Get email verification working on staging

**Time**: ~5 minutes

---

## Step 1: Add Environment Variables (2 min)

Go to **AWS Amplify Console** → Environment Variables → Add:

```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SESSION_TOKEN=your_session_token_if_needed
AWS_REGION=us-east-1
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
EMAIL_FROM=no-reply@huntaze.com
```

---

## Step 2: Deploy (1 min)

```bash
git push huntaze production-ready
```

Wait ~5 minutes for Amplify to build and deploy.

---

## Step 3: Test (2 min)

### Test 1: Debug Endpoint
```bash
curl -X POST https://staging.huntaze.com/api/debug/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-verified-email@example.com"}'
```

**Expected Result**:
```json
{
  "success": true,
  "provider": "ses",
  "message": "Test email sent successfully"
}
```

### Test 2: Signup Flow
1. Go to: https://staging.huntaze.com/signup
2. Enter your verified email
3. Click "Continue with Email"
4. Check your inbox
5. Click the magic link

---

## ⚠️ Important: Sandbox Mode

You're in **sandbox mode**, so:
- ✅ Can send to verified emails only
- ❌ Cannot send to unverified emails
- 📊 Limit: 200 emails/day

### To Test with Other Emails

**Option A: Verify Email in SES**
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click "Create identity" → Email address
3. Enter test email
4. Verify in inbox

**Option B: Request Production Access (Recommended)**
1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
2. Click "Request production access"
3. Fill form
4. Wait 24-48h

---

## 🔍 Troubleshooting

### Error: "Email address is not verified"
→ Email not verified in SES (sandbox mode)  
→ Solution: Verify email or request production access

### Error: "Could not load credentials"
→ Environment variables not configured in Amplify  
→ Solution: Check Step 1

### Error: "Access Denied"
→ IAM permissions issue  
→ Solution: Verify credentials have `ses:SendEmail` permission

### No Email Received
→ Check CloudWatch logs in Amplify Console  
→ Look for "Failed to send magic link email"

---

## ✅ Quick Checklist

- [ ] Environment variables added in Amplify
- [ ] Code deployed to staging
- [ ] Test with `/api/debug/email` successful
- [ ] Email received
- [ ] Signup flow test successful
- [ ] Magic link works

---

**Total Time**: ~5 minutes  
**Ready to start!** 🚀

For more details, see [SES-SETUP.md](SES-SETUP.md)
