# Deployment Guide - Task 1: Diagnostic Routes

## Quick Deployment Steps

### 1. Commit Changes

```bash
git add lib/utils/logger.ts
git add app/api/ping/route.ts
git add app/api/health-check/route.ts
git add app/api/test-env/route.ts
git add middleware.ts
git add scripts/test-diagnostic-routes.sh
git add docs/diagnostic-routes.md
git add .kiro/specs/nextauth-staging-500-fix/TASK_1_COMPLETION.md
git add .kiro/specs/nextauth-staging-500-fix/DEPLOYMENT_GUIDE_TASK_1.md

git commit -m "feat(nextauth): add diagnostic routes for staging 500 error isolation

- Add centralized logger utility with correlation ID support
- Create /api/ping route (ultra-simple, no dependencies)
- Create /api/health-check route (bypasses middleware)
- Update /api/test-env with structured logging
- Update middleware with structured logging for bypasses
- Add test script for diagnostic routes
- Add comprehensive documentation

Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 5.1, 5.2"
```

### 2. Push to Staging

```bash
git push origin staging
```

### 3. Monitor Amplify Build

1. Go to AWS Amplify Console
2. Navigate to the staging environment
3. Watch the build progress
4. Wait for "Deployed" status

### 4. Test Diagnostic Routes

Once deployed, run the test script:

```bash
./scripts/test-diagnostic-routes.sh staging
```

Expected output:
```
==========================================
Testing Diagnostic Routes
==========================================

Testing on STAGING environment
Base URL: https://staging.huntaze.com

Test 1: /api/ping (ultra-simple route)
----------------------------------------
Status: 200
Response: {"status":"ok","timestamp":"...","runtime":"lambda",...}
✅ PASS: /api/ping returned 200

Test 2: /api/health-check (middleware bypass)
----------------------------------------
Status: 200
Response: {"status":"healthy","timestamp":"...","env":{...}}
✅ PASS: /api/health-check returned 200

Test 3: /api/test-env (with middleware)
----------------------------------------
Status: 200
Response: {"status":"ok","timestamp":"...","env":{...}}
✅ PASS: /api/test-env returned 200

Test 4: Correlation ID headers
----------------------------------------
✅ PASS: Correlation ID found: 550e8400-e29b-41d4-a716-446655440000

==========================================
All diagnostic route tests passed! ✅
==========================================
```

### 5. Verify CloudWatch Logs

1. Go to AWS CloudWatch Console
2. Navigate to Log Groups
3. Find the Amplify log group for staging
4. Run this query:

```
fields @timestamp, @message
| filter @message like /ping-api|health-check-api|test-env-api/
| sort @timestamp desc
| limit 20
```

Expected results:
- Structured JSON log entries
- Correlation IDs present
- Timestamps in ISO 8601 format
- Service names (ping-api, health-check-api, test-env-api)

### 6. Manual Verification

Test each route manually:

```bash
# Test ping
curl -i https://staging.huntaze.com/api/ping

# Test health check
curl -i https://staging.huntaze.com/api/health-check

# Test environment
curl -i https://staging.huntaze.com/api/test-env
```

Check for:
- ✅ 200 status code
- ✅ `X-Correlation-ID` header present
- ✅ JSON response with expected structure
- ✅ No 500 errors

## Troubleshooting

### Build Fails

If the Amplify build fails:

1. Check build logs in Amplify Console
2. Look for TypeScript errors
3. Verify all imports are correct
4. Check that logger is Edge Runtime compatible

### Routes Return 500

If routes return 500:

1. Check CloudWatch logs for the correlation ID
2. Look for error stack traces
3. Verify environment variables are set
4. Check middleware bypass logic

### No Correlation ID in Response

If correlation ID is missing:

1. Check if route is being intercepted by middleware
2. Verify logger is imported correctly
3. Check CloudWatch logs for initialization errors

### Middleware Not Bypassing Routes

If middleware is not bypassing diagnostic routes:

1. Verify middleware matcher configuration
2. Check middleware logs for bypass messages
3. Ensure pathname matching is correct

## Success Criteria

Before proceeding to Task 2, verify:

- ✅ `/api/ping` returns 200 on staging
- ✅ `/api/health-check` returns 200 on staging
- ✅ `/api/test-env` returns 200 on staging
- ✅ All routes include `X-Correlation-ID` header
- ✅ Structured logs visible in CloudWatch
- ✅ Correlation IDs traceable in logs
- ✅ Middleware bypass logs present
- ✅ No 500 errors in any diagnostic route

## Next Steps

Once all success criteria are met:

1. Document any findings from CloudWatch logs
2. Note any environment variable issues
3. Proceed to Task 2: Implement structured logging system
4. Continue with Task 3: Update middleware with fail-safe error handling

## Rollback Plan

If issues occur after deployment:

```bash
# Revert the commit
git revert HEAD

# Push to staging
git push origin staging
```

Or manually revert specific files if needed.

## Support

If you encounter issues:

1. Check the documentation: `docs/diagnostic-routes.md`
2. Review the completion summary: `.kiro/specs/nextauth-staging-500-fix/TASK_1_COMPLETION.md`
3. Check CloudWatch logs with correlation IDs
4. Review middleware bypass logic in `middleware.ts`
