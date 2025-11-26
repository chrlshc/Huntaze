# 🚀 AWS SES Quick Start - 5 Minutes

**Goal:** Get email verification working on staging

---

## ⚡ Quick Setup (5 minutes)

### 1. Add Environment Variables (2 min)

Go to **AWS Amplify Console** → Environment Variables → Add:

```
AWS_ACCESS_KEY_ID=REDACTED_access_key_id
AWS_SECRET_ACCESS_KEY=REDACTED_secret_access_key
AWS_SESSION_TOKEN=REDACTED_session_token_if_needed
AWS_REGION=us-east-1
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
EMAIL_FROM=no-reply@huntaze.com
NEXTAUTH_URL=https://staging.huntaze.com
```

### 2. Verify Test Email (1 min)

1. Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Click "Create identity" → Email address
3. Enter: `charles@huntaze.com`
4. Check inbox → Click verification link

### 3. Deploy (1 min)

```bash
git add .
git commit -m "feat: enhance SES configuration"
git push origin main
```

Wait 5 minutes for build.

### 4. Test (1 min)

```bash
curl -X POST https://staging.huntaze.com/api/debug/email \
  -H "Content-Type: application/json" \
  -d '{"to":"charles@huntaze.com"}'
```

**Success?** ✅ Check your inbox!

**Error?** See troubleshooting below.

---

## 🔍 Quick Troubleshooting

### "Email address is not verified"
→ Verify recipient in SES Console (step 2 above)

### "Could not load credentials"
→ Check environment variables are set in Amplify

### "Access Denied"
→ Check IAM policy allows `ses:SendEmail`

### Still stuck?
→ Check CloudWatch logs in Amplify Console

---

## 📚 Full Documentation

- **Complete Guide:** `SES_STAGING_SETUP_COMPLETE.md`
- **Detailed Checklist:** `SES_EMAIL_VERIFICATION_CHECKLIST.md`
- **Automated Script:** `scripts/setup-ses-staging.sh`

---

## ⚠️ Important: Sandbox Mode

You're in **SANDBOX MODE**:
- ✅ Can send to verified emails only
- ⚠️ Max 200 emails/day
- ⚠️ Max 1 email/second

**To remove limits:**
Request production access: https://console.aws.amazon.com/ses/ → Account Dashboard → Request production access

---

**That's it! 🎉**

Total time: ~5 minutes + 5 minute build
