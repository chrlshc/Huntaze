# NextAuth Migration Manual Testing Checklist

This document provides a comprehensive manual testing checklist for the NextAuth migration. Follow these steps to verify that all authentication functionality works correctly after the migration.

## Prerequisites

- [ ] Development server is running (`npm run dev`)
- [ ] Database is accessible and migrations are applied
- [ ] Browser DevTools are open (Console + Network tabs)
- [ ] Test user accounts are available (or can be created)

## Test Environment Setup

### Create Test Accounts

You'll need the following test accounts:

1. **New User** - Will be created during testing
2. **Existing User (Incomplete Onboarding)** - User with `onboarding_completed = false`
3. **Existing User (Completed Onboarding)** - User with `onboarding_completed = true`

### Browser Testing

Test in at least two browsers:
- [ ] Chrome/Edge
- [ ] Firefox or Safari

---

## Requirement 6.1: Registration and Onboarding Flow

### Test Case 1.1: New User Registration

**Steps:**
1. Navigate to `/auth`
2. Click "Sign Up" or switch to registration form
3. Fill in registration form:
   - Full Name: "Test User"
   - Email: `test-new-${Date.now()}@example.com`
   - Password: "SecurePassword123!"
4. Submit the form

**Expected Results:**
- [ ] Registration succeeds without errors
- [ ] User is redirected to `/onboarding` page
- [ ] Session is created (check DevTools Application > Cookies for `next-auth.session-token`)
- [ ] No errors in console
- [ ] Database: User has `onboarding_completed = false`

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 1.2: Complete Onboarding Flow

**Prerequisites:** User from Test Case 1.1 is on `/onboarding` page

**Steps:**
1. Complete onboarding steps (follow the onboarding wizard)
2. Click "Complete" or "Finish" button

**Expected Results:**
- [ ] Onboarding completes successfully
- [ ] User is redirected to `/dashboard`
- [ ] Session persists (same session token)
- [ ] Database: User has `onboarding_completed = true`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 1.3: Skip Onboarding

**Prerequisites:** Create a new user account

**Steps:**
1. Register a new user
2. On `/onboarding` page, click "Skip" button (if available)

**Expected Results:**
- [ ] User is redirected to `/dashboard`
- [ ] Database: User has `onboarding_completed = true`
- [ ] Session persists
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

## Requirement 6.2: Login with Existing Account

### Test Case 2.1: Login with Incomplete Onboarding

**Prerequisites:** User account with `onboarding_completed = false`

**Steps:**
1. Navigate to `/auth`
2. Enter email and password
3. Click "Sign In"

**Expected Results:**
- [ ] Login succeeds
- [ ] User is redirected to `/onboarding` page
- [ ] Session is created
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 2.2: Login with Completed Onboarding

**Prerequisites:** User account with `onboarding_completed = true`

**Steps:**
1. Navigate to `/auth`
2. Enter email and password
3. Click "Sign In"

**Expected Results:**
- [ ] Login succeeds
- [ ] User is redirected to `/dashboard` page
- [ ] Session is created
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 2.3: Login with Invalid Credentials

**Steps:**
1. Navigate to `/auth`
2. Enter valid email but wrong password
3. Click "Sign In"

**Expected Results:**
- [ ] Login fails
- [ ] Error message displayed: "Invalid email or password"
- [ ] User remains on `/auth` page
- [ ] No session created
- [ ] No errors in console (error is handled gracefully)

**Actual Results:**
```
[Record your observations here]
```

---

## Requirement 6.3: Navigation Across All Protected Pages

### Test Case 3.1: Dashboard Navigation

**Prerequisites:** Logged in user with completed onboarding

**Steps:**
1. Navigate to `/dashboard`
2. Verify page loads correctly
3. Check session in DevTools

**Expected Results:**
- [ ] Dashboard page loads without errors
- [ ] User data is displayed correctly
- [ ] Session token exists in cookies
- [ ] No redirect to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 3.2: Analytics Pages Navigation

**Prerequisites:** Logged in user with completed onboarding

**Steps:**
1. Navigate to `/analytics/advanced`
2. Verify page loads correctly
3. Navigate to other analytics pages (if any)

**Expected Results:**
- [ ] Analytics page loads without errors
- [ ] Data is displayed correctly
- [ ] Session persists (same token)
- [ ] No redirect to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 3.3: OnlyFans Pages Navigation

**Prerequisites:** Logged in user with completed onboarding

**Steps:**
1. Navigate to `/onlyfans-assisted` or other OnlyFans pages
2. Verify page loads correctly
3. Check that session persists

**Expected Results:**
- [ ] OnlyFans page loads without errors
- [ ] Content is displayed correctly
- [ ] Session persists
- [ ] No redirect to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 3.4: Content Creation Pages

**Prerequisites:** Logged in user with completed onboarding

**Steps:**
1. Navigate to `/content` or content creation pages
2. Verify page loads correctly

**Expected Results:**
- [ ] Content page loads without errors
- [ ] Session persists
- [ ] No redirect to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 3.5: Cross-Page Navigation

**Prerequisites:** Logged in user with completed onboarding

**Steps:**
1. Navigate to `/dashboard`
2. Click link to `/analytics/advanced`
3. Click link to `/content`
4. Click link to `/onlyfans-assisted`
5. Return to `/dashboard`

**Expected Results:**
- [ ] All pages load without errors
- [ ] Session persists across all navigation
- [ ] Same session token throughout
- [ ] No disconnections or re-login prompts
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

## Requirement 6.4: "Remember Me" Functionality

### Test Case 4.1: Login with "Remember Me" Checked

**Steps:**
1. Navigate to `/auth`
2. Enter credentials
3. Check "Remember Me" checkbox
4. Click "Sign In"
5. Close browser completely
6. Reopen browser and navigate to `/dashboard`

**Expected Results:**
- [ ] Login succeeds
- [ ] Session is created with 30-day expiration
- [ ] After browser restart, user is still logged in
- [ ] No redirect to `/auth`
- [ ] Session token persists

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 4.2: Login without "Remember Me"

**Steps:**
1. Navigate to `/auth`
2. Enter credentials
3. Leave "Remember Me" unchecked
4. Click "Sign In"
5. Close browser completely
6. Reopen browser and navigate to `/dashboard`

**Expected Results:**
- [ ] Login succeeds
- [ ] Session is created with 24-hour expiration
- [ ] After browser restart, session behavior depends on browser settings
- [ ] Session may or may not persist (browser-dependent)

**Actual Results:**
```
[Record your observations here]
```

---

## Requirement 6.5: Logout from Different Pages

### Test Case 5.1: Logout from Dashboard

**Prerequisites:** Logged in user on `/dashboard`

**Steps:**
1. Click logout button in header/navigation
2. Observe redirect behavior

**Expected Results:**
- [ ] Logout succeeds
- [ ] User is redirected to `/auth`
- [ ] Session token is removed from cookies
- [ ] Attempting to access `/dashboard` redirects to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 5.2: Logout from Analytics Page

**Prerequisites:** Logged in user on `/analytics/advanced`

**Steps:**
1. Click logout button
2. Observe redirect behavior

**Expected Results:**
- [ ] Logout succeeds
- [ ] User is redirected to `/auth`
- [ ] Session is cleared
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 5.3: Logout from Content Page

**Prerequisites:** Logged in user on `/content`

**Steps:**
1. Click logout button
2. Observe redirect behavior

**Expected Results:**
- [ ] Logout succeeds
- [ ] User is redirected to `/auth`
- [ ] Session is cleared
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

## Session Expiration Testing

### Test Case 6.1: Session Expiration Detection

**Note:** This test requires modifying session expiration time temporarily or waiting for actual expiration.

**Steps:**
1. Login with short session expiration (modify config temporarily)
2. Wait for session to expire
3. Try to navigate to a protected page

**Expected Results:**
- [ ] User is redirected to `/auth`
- [ ] Error message displayed: "Your session has expired. Please log in again."
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

## Browser Refresh Testing

### Test Case 7.1: Refresh on Dashboard

**Prerequisites:** Logged in user on `/dashboard`

**Steps:**
1. Press F5 or click browser refresh button
2. Observe page behavior

**Expected Results:**
- [ ] Page reloads successfully
- [ ] User remains logged in
- [ ] Session persists (same token)
- [ ] No redirect to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 7.2: Refresh on Protected Page

**Prerequisites:** Logged in user on any protected page

**Steps:**
1. Navigate to protected page
2. Press F5 to refresh
3. Observe behavior

**Expected Results:**
- [ ] Page reloads successfully
- [ ] User remains logged in
- [ ] Session persists
- [ ] No redirect to `/auth`
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

## API Route Protection Testing

### Test Case 8.1: Authenticated API Request

**Prerequisites:** Logged in user

**Steps:**
1. Open DevTools Network tab
2. Navigate to `/analytics/advanced`
3. Observe API requests to `/api/analytics/performance`

**Expected Results:**
- [ ] API request succeeds (200 status)
- [ ] Data is returned correctly
- [ ] No 401 errors
- [ ] Session is validated server-side

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 8.2: Unauthenticated API Request

**Prerequisites:** Not logged in (or logged out)

**Steps:**
1. Open DevTools Network tab
2. In console, run:
   ```javascript
   fetch('/api/analytics/performance').then(r => r.json()).then(console.log)
   ```

**Expected Results:**
- [ ] API request returns 401 Unauthorized
- [ ] Error message: "Unauthorized"
- [ ] No data is returned

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 8.3: OnlyFans API Protection

**Prerequisites:** Not logged in

**Steps:**
1. In console, run:
   ```javascript
   fetch('/api/onlyfans/messaging/status').then(r => r.json()).then(console.log)
   ```

**Expected Results:**
- [ ] API request returns 401 Unauthorized
- [ ] Error message: "Unauthorized"

**Actual Results:**
```
[Record your observations here]
```

---

## Error Handling Testing

### Test Case 9.1: Network Error During Login

**Steps:**
1. Open DevTools Network tab
2. Enable "Offline" mode
3. Try to login
4. Disable "Offline" mode

**Expected Results:**
- [ ] Error message displayed: "Connection error. Please try again."
- [ ] User remains on `/auth` page
- [ ] No console errors (error is handled gracefully)

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 9.2: Invalid Email Format

**Steps:**
1. Navigate to `/auth`
2. Enter invalid email: "notanemail"
3. Enter password
4. Click "Sign In"

**Expected Results:**
- [ ] Validation error displayed
- [ ] Login does not proceed
- [ ] User remains on `/auth` page

**Actual Results:**
```
[Record your observations here]
```

---

## Backward Compatibility Testing

### Test Case 10.1: Existing User Login

**Prerequisites:** User account created before migration

**Steps:**
1. Login with existing user credentials
2. Verify login works correctly

**Expected Results:**
- [ ] Login succeeds
- [ ] User is redirected appropriately based on onboarding status
- [ ] Session is created
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 10.2: Legacy Token Cleanup

**Prerequisites:** User with old localStorage token

**Steps:**
1. Manually set localStorage token:
   ```javascript
   localStorage.setItem('auth_token', 'old-legacy-token')
   ```
2. Login with NextAuth
3. Check localStorage after login

**Expected Results:**
- [ ] Login succeeds
- [ ] Old localStorage token is removed
- [ ] Only NextAuth session cookie exists
- [ ] No errors in console

**Actual Results:**
```
[Record your observations here]
```

---

## Performance Testing

### Test Case 11.1: Login Performance

**Steps:**
1. Open DevTools Performance tab
2. Start recording
3. Login
4. Stop recording

**Expected Results:**
- [ ] Login completes within 2 seconds
- [ ] No performance warnings
- [ ] Smooth redirect

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 11.2: Page Load Performance

**Prerequisites:** Logged in user

**Steps:**
1. Open DevTools Performance tab
2. Navigate to `/dashboard`
3. Measure load time

**Expected Results:**
- [ ] Page loads within 3 seconds
- [ ] Session validation is fast
- [ ] No performance bottlenecks

**Actual Results:**
```
[Record your observations here]
```

---

## Security Testing

### Test Case 12.1: Direct URL Access (Unauthenticated)

**Prerequisites:** Not logged in

**Steps:**
1. Directly navigate to `/dashboard` in address bar
2. Observe behavior

**Expected Results:**
- [ ] User is redirected to `/auth`
- [ ] No protected content is visible
- [ ] Error message may be shown

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 12.2: Session Token Manipulation

**Steps:**
1. Login successfully
2. Open DevTools Application > Cookies
3. Modify or delete `next-auth.session-token`
4. Try to access protected page

**Expected Results:**
- [ ] User is redirected to `/auth`
- [ ] Session is invalid
- [ ] No protected content is accessible

**Actual Results:**
```
[Record your observations here]
```

---

## Cross-Browser Testing

### Test Case 13.1: Chrome/Edge Testing

**Steps:**
1. Repeat key test cases in Chrome/Edge
2. Verify all functionality works

**Expected Results:**
- [ ] All tests pass in Chrome/Edge
- [ ] No browser-specific issues

**Actual Results:**
```
[Record your observations here]
```

---

### Test Case 13.2: Firefox Testing

**Steps:**
1. Repeat key test cases in Firefox
2. Verify all functionality works

**Expected Results:**
- [ ] All tests pass in Firefox
- [ ] No browser-specific issues

**Actual Results:**
```
[Record your observations here]
```

---

## Summary

### Test Results Overview

- Total Test Cases: 35
- Passed: ___
- Failed: ___
- Blocked: ___
- Not Tested: ___

### Critical Issues Found

```
[List any critical issues discovered during testing]
```

### Non-Critical Issues Found

```
[List any non-critical issues discovered during testing]
```

### Recommendations

```
[Provide recommendations based on test results]
```

### Sign-Off

- Tester Name: _______________
- Date: _______________
- Status: [ ] Approved for Production  [ ] Needs Fixes  [ ] Blocked

---

## Notes

- This checklist should be completed before deploying to production
- Document all issues found with screenshots if possible
- Retest failed cases after fixes are applied
- Keep this document updated with any new test cases discovered during testing
