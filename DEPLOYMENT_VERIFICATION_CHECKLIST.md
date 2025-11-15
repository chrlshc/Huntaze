# ✅ Deployment Verification Checklist

**Date:** 15 novembre 2025  
**Feature:** Modern Auth UI + NextAuth + PostgreSQL Integration  
**Status:** 🚀 Ready for Staging Verification

---

## 📋 Pre-Deployment Verification

### Code Status
- [x] ✅ Modern auth UI created (`app/auth/page.tsx`)
- [x] ✅ Registration API implemented (`app/api/auth/register/route.ts`)
- [x] ✅ NextAuth updated with PostgreSQL (`app/api/auth/[...nextauth]/route.ts`)
- [x] ✅ Code pushed to staging branch
- [x] ✅ No TypeScript errors
- [x] ✅ bcryptjs dependency confirmed

---

## 🔐 AWS Amplify Environment Variables

### Required Variables (Critical)

#### 1. DATABASE_URL ⚠️
```bash
# Format:
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Example:
DATABASE_URL=postgresql://huntaze_user:SecurePass123@huntaze-db.xxxxx.us-east-1.rds.amazonaws.com:5432/huntaze_prod?sslmode=require
```

**Verification:**
```bash
# In AWS Amplify Console:
1. Go to App Settings > Environment variables
2. Check if DATABASE_URL exists
3. Verify it points to correct RDS instance
4. Test connection from Amplify build logs
```

#### 2. NEXTAUTH_SECRET ⚠️
```bash
# Generate a secure secret (32+ characters):
NEXTAUTH_SECRET=your-super-secure-random-string-here-min-32-chars

# Generate one:
openssl rand -base64 32
```

**Verification:**
```bash
# In AWS Amplify Console:
1. Check if NEXTAUTH_SECRET exists
2. Verify it's at least 32 characters
3. Ensure it's marked as "Secret" (hidden)
```

#### 3. NEXTAUTH_URL ⚠️
```bash
# Production URL:
NEXTAUTH_URL=https://huntaze.com

# Staging URL:
NEXTAUTH_URL=https://staging.huntaze.com
```

**Verification:**
```bash
# In AWS Amplify Console:
1. Check if NEXTAUTH_URL exists
2. Verify it matches your domain
3. Ensure it uses HTTPS
```

### Optional Variables (Google OAuth)

#### 4. GOOGLE_CLIENT_ID (Optional)
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

#### 5. GOOGLE_CLIENT_SECRET (Optional)
```bash
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup Google OAuth:**
```bash
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI:
   https://your-domain.com/api/auth/callback/google
4. Copy Client ID and Secret to Amplify
```

---

## 🗄️ Database Verification

### 1. Check Users Table Exists

```sql
-- Connect to your PostgreSQL database
psql $DATABASE_URL

-- Check if users table exists
\dt users

-- If not, create it:
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'creator',
  creator_id INTEGER,
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
```

### 2. Verify Table Structure

```sql
-- Check columns
\d users

-- Expected columns:
-- id, email, name, password, role, creator_id, 
-- email_verified, created_at, updated_at
```

### 3. Test Database Connection

```bash
# From Amplify build logs, look for:
[NextAuth] Authentication attempt: { email: '...', correlationId: '...' }

# Should NOT see:
# - "database does not exist"
# - "connection refused"
# - "authentication failed"
```

---

## 🧪 Post-Deployment Testing

### Test 1: Access Auth Page
```bash
URL: https://your-domain.com/auth

Expected:
✅ Page loads without errors
✅ Split-screen layout visible (desktop)
✅ Mobile layout works (hero hidden)
✅ Login/Register toggle works
✅ Google OAuth button visible
```

### Test 2: Registration Flow
```bash
Steps:
1. Click "Register" tab
2. Fill form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPassword123!
   - Check "I agree to terms"
3. Click "Create Account"

Expected:
✅ Password strength indicator shows "Strong"
✅ Loading spinner appears
✅ Redirect to /onboarding
✅ User created in database
✅ Session cookie set

Verify in Database:
SELECT * FROM users WHERE email = 'test@example.com';
-- Should see hashed password starting with $2a$12$
```

### Test 3: Login Flow
```bash
Steps:
1. Click "Sign In" tab
2. Fill form:
   - Email: test@example.com
   - Password: TestPassword123!
3. Click "Sign In"

Expected:
✅ Loading spinner appears
✅ Redirect to /dashboard
✅ Session cookie set
✅ User authenticated

Check Session:
// In browser console:
fetch('/api/auth/session').then(r => r.json()).then(console.log)
// Should see user data
```

### Test 4: Google OAuth (if configured)
```bash
Steps:
1. Click "Sign in with Google"
2. Complete Google consent flow
3. Return to app

Expected:
✅ Redirect to Google
✅ Return to app after consent
✅ User logged in
✅ Redirect to /dashboard or /onboarding
```

### Test 5: Error Handling
```bash
Test Invalid Login:
- Email: wrong@example.com
- Password: wrongpassword

Expected:
✅ Error message: "Invalid email or password"
✅ No redirect
✅ Form stays filled

Test Duplicate Registration:
- Use existing email

Expected:
✅ Error message: "User with this email already exists"
✅ No redirect
```

---

## 🔍 Monitoring & Logs

### Check Amplify Build Logs
```bash
1. Go to AWS Amplify Console
2. Click on your app
3. Go to "Build history"
4. Check latest build logs

Look for:
✅ "Build succeeded"
✅ No TypeScript errors
✅ No missing dependencies
❌ Any auth-related errors
```

### Check Application Logs
```bash
# In Amplify Console > Monitoring > Logs

Look for:
✅ [NextAuth] Authentication attempt: ...
✅ [NextAuth] Authentication successful: ...
✅ [Auth] User registered: ...

Red flags:
❌ Database connection errors
❌ NEXTAUTH_SECRET missing
❌ Invalid credentials errors (if unexpected)
```

### Check Database Logs
```bash
# In RDS Console > Logs

Look for:
✅ Successful connections from Amplify
✅ SELECT queries on users table
✅ INSERT queries for new users

Red flags:
❌ Connection timeouts
❌ Authentication failures
❌ Table not found errors
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "NEXTAUTH_SECRET is required"
**Cause:** Environment variable not set  
**Fix:**
```bash
1. Go to Amplify Console > Environment variables
2. Add NEXTAUTH_SECRET
3. Generate: openssl rand -base64 32
4. Redeploy
```

### Issue 2: "Database connection failed"
**Cause:** Invalid DATABASE_URL or network issue  
**Fix:**
```bash
1. Verify DATABASE_URL format
2. Check RDS security group allows Amplify
3. Test connection from Amplify build
4. Verify SSL mode if required
```

### Issue 3: "Invalid credentials" on valid login
**Cause:** Password not hashed or wrong hash  
**Fix:**
```sql
-- Check password hash format
SELECT password FROM users WHERE email = 'test@example.com';
-- Should start with $2a$12$ or $2b$12$

-- If not, user was created incorrectly
-- Delete and re-register through UI
DELETE FROM users WHERE email = 'test@example.com';
```

### Issue 4: "User already exists" but can't login
**Cause:** User created without password or with wrong format  
**Fix:**
```sql
-- Check user record
SELECT id, email, password, created_at FROM users WHERE email = 'test@example.com';

-- If password is NULL or not hashed:
DELETE FROM users WHERE email = 'test@example.com';
-- Then re-register through UI
```

### Issue 5: Google OAuth redirect error
**Cause:** Callback URL mismatch  
**Fix:**
```bash
1. Go to Google Cloud Console
2. OAuth 2.0 Credentials
3. Add authorized redirect URI:
   https://your-domain.com/api/auth/callback/google
4. Wait 5 minutes for propagation
5. Try again
```

---

## ✅ Final Checklist

### Before Going Live
- [ ] All environment variables set in Amplify
- [ ] DATABASE_URL points to production RDS
- [ ] NEXTAUTH_SECRET is secure (32+ chars)
- [ ] NEXTAUTH_URL matches production domain
- [ ] Users table exists in database
- [ ] Email index created for performance
- [ ] Test registration works
- [ ] Test login works
- [ ] Test Google OAuth (if enabled)
- [ ] Error messages display correctly
- [ ] Mobile UI works properly
- [ ] Loading states work
- [ ] Session persists after refresh

### Post-Launch Monitoring
- [ ] Monitor Amplify build logs
- [ ] Monitor application logs for auth errors
- [ ] Monitor database connections
- [ ] Check user registration rate
- [ ] Verify no failed login spikes
- [ ] Test from different devices/browsers

---

## 📞 Support

If issues persist:
1. Check `AUTH_INTEGRATION_VERIFICATION.md` for detailed info
2. Review Amplify build logs
3. Check database connection
4. Verify all environment variables
5. Test locally with same env vars

---

## 🎉 Success Criteria

System is working correctly when:
- ✅ Users can register with email/password
- ✅ Users can login with credentials
- ✅ Google OAuth works (if configured)
- ✅ Sessions persist correctly
- ✅ Passwords are hashed in database
- ✅ Error messages are user-friendly
- ✅ Mobile UI is responsive
- ✅ No console errors
- ✅ Database queries are fast (<100ms)
- ✅ No authentication failures in logs

**Status:** Ready for verification on staging! 🚀
