# NextAuth v4 Rollback - Staging Testing Guide

## Overview

This guide provides step-by-step instructions for testing authentication functionality on staging.huntaze.com after the NextAuth v4 rollback deployment.

## Prerequisites

- ✅ Subtask 8.1 Complete: Changes committed and pushed
- ✅ Subtask 8.2 Complete: Amplify build successful
- → Subtask 8.3 In Progress: Testing staging authentication

## Testing Checklist

### Test 1: Sign-In Page Access

**Requirement:** 6.1 - Sign-in page displays correctly

**Steps:**
1. Navigate to: https://staging.huntaze.com/auth
2. Verify the page loads without errors
3. Verify sign-in form is visible
4. Verify Google OAuth button is present

**Expected Results:**
- ✅ Page loads successfully (200 status)
- ✅ Sign-in form displays with email/password fields
- ✅ "Sign in with Google" button is visible
- ✅ No console errors in browser DevTools
- ✅ No hydration errors

**Pass Criteria:** All expected results met

---

### Test 2: Credential Authentication

**Requirement:** 6.2 - Credential sign-in works correctly

**Steps:**
1. On https://staging.huntaze.com/auth
2. Enter valid test credentials:
   - Email: [use existing test account]
   - Password: [use test password]
3. Click "Sign In" button
4. Observe the authentication flow

**Expected Results:**
- ✅ Form submits without errors
- ✅ Authentication succeeds
- ✅ Session is created (check cookies in DevTools)
- ✅ Redirect to dashboard or home page
- ✅ User is shown as authenticated

**Pass Criteria:** Successful authentication and redirect

**Test Invalid Credentials:**
1. Enter invalid credentials
2. Verify appropriate error message displays
3. Verify no sensitive data leaked in error

---

### Test 3: Google OAuth Authentication

**Requirement:** 6.3 - OAuth authentication works correctly

**Steps:**
1. On https://staging.huntaze.com/auth
2. Click "Sign in with Google" button
3. Complete Google OAuth flow
4. Return to application

**Expected Results:**
- ✅ Redirect to Google OAuth consent screen
- ✅ OAuth flow completes successfully
- ✅ Redirect back to staging.huntaze.com
- ✅ User is authenticated
- ✅ Session is created
- ✅ User profile data is populated

**Pass Criteria:** Successful OAuth flow and authentication

**Note:** Ensure Google OAuth credentials are configured in Amplify environment variables:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

---

### Test 4: Protected Routes Access

**Requirement:** 6.4, 6.5 - Protected routes enforce authentication

**Test 4a: Authenticated Access**
1. Sign in using Test 2 or Test 3
2. Navigate to protected routes:
   - https://staging.huntaze.com/dashboard
   - https://staging.huntaze.com/profile
   - https://staging.huntaze.com/content
3. Verify access is granted

**Expected Results:**
- ✅ Protected pages load successfully
- ✅ User data is displayed correctly
- ✅ No authentication errors
- ✅ Session persists across page navigation

**Test 4b: Unauthenticated Access**
1. Sign out (or use incognito window)
2. Attempt to access protected routes directly
3. Observe redirect behavior

**Expected Results:**
- ✅ Redirect to /auth sign-in page
- ✅ Return URL is preserved (e.g., ?callbackUrl=/dashboard)
- ✅ After sign-in, redirect to original protected page

**Pass Criteria:** Both authenticated and unauthenticated scenarios work correctly

---

### Test 5: Session Persistence

**Requirement:** Session management works correctly

**Steps:**
1. Sign in to staging.huntaze.com
2. Refresh the page
3. Navigate to different pages
4. Close and reopen browser tab
5. Verify session persists

**Expected Results:**
- ✅ Session persists across page refreshes
- ✅ Session persists across navigation
- ✅ Session persists for configured duration (30 days)
- ✅ Session cookie is httpOnly and secure

**Pass Criteria:** Session remains active as expected

---

### Test 6: Sign Out

**Requirement:** Sign-out functionality works correctly

**Steps:**
1. While signed in, click sign-out button
2. Verify sign-out completes
3. Attempt to access protected route
4. Verify redirect to sign-in

**Expected Results:**
- ✅ Sign-out completes successfully
- ✅ Session is cleared
- ✅ Cookies are removed
- ✅ Redirect to sign-in page
- ✅ Protected routes no longer accessible

**Pass Criteria:** Complete sign-out and session termination

---

## Security Verification

### Cookie Security Check

**Using Browser DevTools:**
1. Sign in to staging.huntaze.com
2. Open DevTools → Application → Cookies
3. Find NextAuth session cookies
4. Verify cookie attributes:

**Expected Cookie Settings:**
- ✅ `httpOnly: true` (prevents JavaScript access)
- ✅ `secure: true` (HTTPS only)
- ✅ `sameSite: lax` or `strict` (CSRF protection)
- ✅ Cookie name: `next-auth.session-token` or similar
- ✅ Domain: `.huntaze.com` or `staging.huntaze.com`

### Error Handling Check

**Test Error Scenarios:**
1. Invalid credentials → User-friendly error message
2. Network error → Graceful error handling
3. OAuth failure → Appropriate error page
4. Session expired → Redirect to sign-in

**Expected:**
- ✅ No sensitive data in error messages
- ✅ Correlation IDs in server logs (check Amplify logs)
- ✅ User-friendly error messages
- ✅ No stack traces exposed to users

---

## API Endpoint Testing

### Test NextAuth API Endpoints

**Test Session Endpoint:**
```bash
curl https://staging.huntaze.com/api/auth/session
```
Expected: Session data or null (if not authenticated)

**Test Providers Endpoint:**
```bash
curl https://staging.huntaze.com/api/auth/providers
```
Expected: List of configured providers (Google, Credentials)

**Test CSRF Token:**
```bash
curl https://staging.huntaze.com/api/auth/csrf
```
Expected: CSRF token object

---

## Troubleshooting

### Common Issues

**Issue: Sign-in page doesn't load**
- Check Amplify build logs for errors
- Verify route is deployed correctly
- Check browser console for errors

**Issue: OAuth redirect fails**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Amplify
- Check OAuth redirect URI matches staging URL
- Verify NEXTAUTH_URL is set to https://staging.huntaze.com

**Issue: Session not persisting**
- Check NEXTAUTH_SECRET is set in Amplify
- Verify cookies are being set (DevTools)
- Check cookie domain settings

**Issue: Protected routes accessible without auth**
- Verify middleware.ts is deployed
- Check route protection logic
- Review session validation

---

## Test Results Template

```markdown
## Staging Authentication Test Results

**Date:** [Date]
**Tester:** [Name]
**Commit:** 2eb261e41
**Environment:** staging.huntaze.com

### Test Results

- [ ] Test 1: Sign-in page access - PASS/FAIL
- [ ] Test 2: Credential authentication - PASS/FAIL
- [ ] Test 3: Google OAuth authentication - PASS/FAIL
- [ ] Test 4a: Protected routes (authenticated) - PASS/FAIL
- [ ] Test 4b: Protected routes (unauthenticated) - PASS/FAIL
- [ ] Test 5: Session persistence - PASS/FAIL
- [ ] Test 6: Sign out - PASS/FAIL

### Security Verification

- [ ] Cookie security settings - PASS/FAIL
- [ ] Error handling - PASS/FAIL
- [ ] API endpoints - PASS/FAIL

### Overall Status

- [ ] All tests passed - Ready for production
- [ ] Some tests failed - Issues to address
- [ ] Critical failures - Rollback required

### Notes

[Add any observations, issues, or recommendations]
```

---

## Success Criteria

All tests must pass for subtask 8.3 to be complete:

✅ Sign-in page loads correctly
✅ Credential authentication works
✅ Google OAuth authentication works
✅ Protected routes enforce authentication
✅ Session persists correctly
✅ Sign-out works correctly
✅ Security features verified
✅ No console errors or warnings

## Requirements Satisfied

- **6.1:** Sign-in page displays
- **6.2:** Credential authentication succeeds
- **6.3:** OAuth authentication succeeds
- **6.4:** Authenticated users can access protected routes
- **6.5:** Unauthenticated users are redirected to sign-in

---

**Next Steps:** After all tests pass, mark subtask 8.3 and task 8 as complete!
