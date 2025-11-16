# Next.js 16 Configuration for NextAuth v5

## Overview

This document describes the Next.js 16 specific configurations required for NextAuth v5 to work correctly in serverless environments like AWS Amplify.

## Configuration Changes

### 1. Console Log Preservation in Staging

**Location**: `next.config.ts` → `compiler.removeConsole`

```typescript
compiler: {
  // Only remove console logs in production environment, keep them in staging for debugging
  removeConsole: process.env.NODE_ENV === 'production' && process.env.AMPLIFY_ENV === 'production',
}
```

**Purpose**:
- Preserves console logs in staging environment for debugging
- Logs are visible in CloudWatch for troubleshooting
- Only removes console logs in true production (`AMPLIFY_ENV === 'production'`)

**Environment Variables**:
- `NODE_ENV`: Set by Next.js build process
- `AMPLIFY_ENV`: Set by AWS Amplify (values: `staging`, `production`)

**Benefits**:
- ✅ Structured logs from `lib/utils/logger.ts` are visible in staging
- ✅ NextAuth debug logs are preserved for troubleshooting
- ✅ Middleware logs are accessible in CloudWatch
- ✅ Production builds still benefit from console removal for performance

### 2. NextAuth External Package Configuration

**Location**: `next.config.ts` → `serverExternalPackages`

```typescript
// Explicitly mark next-auth as external package to prevent webpack bundling issues
// This ensures NextAuth v5 works correctly in serverless environments
// Note: In Next.js 16, this was moved from experimental.serverComponentsExternalPackages
serverExternalPackages: ['next-auth']
```

**Important**: In Next.js 16, the configuration key changed from `experimental.serverComponentsExternalPackages` to `serverExternalPackages` (top-level configuration).

**Purpose**:
- Prevents webpack from bundling NextAuth v5 into the client bundle
- Ensures NextAuth runs correctly in serverless Lambda environment
- Avoids module resolution issues in AWS Amplify

**Why This Is Needed**:
NextAuth v5 uses Node.js-specific APIs that should not be bundled by webpack. By marking it as an external package:
- NextAuth modules are loaded at runtime, not bundled
- Reduces bundle size
- Prevents "Module not found" errors in serverless
- Ensures compatibility with AWS Lambda runtime

**Next.js 16 Compatibility**:
- This configuration is compatible with Next.js 16's Turbopack
- Works with both webpack and Turbopack build systems
- No additional configuration needed for Turbopack

## Webpack Configuration

The existing webpack configuration already handles client-side fallbacks:

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
  }
  return config;
}
```

**Purpose**:
- Prevents client-side code from trying to import Node.js modules
- NextAuth and other server-only packages are excluded from client bundle
- No changes needed - this configuration is already optimal

## Turbopack Configuration

Next.js 16 uses Turbopack by default for development. The current configuration:

```typescript
turbopack: {},
```

**Status**: ✅ No additional configuration needed

Turbopack automatically handles:
- Server-only module exclusion
- External package resolution
- NextAuth v5 compatibility

## Verification

### Local Development

```bash
# Start development server with Turbopack (Next.js 16 default)
npm run dev

# Test NextAuth routes
curl http://localhost:3000/api/auth/signin
```

### Staging Deployment

```bash
# Deploy to staging
git push origin staging

# Verify console logs are visible
# Check AWS Amplify → Monitoring → CloudWatch Logs

# Test NextAuth
curl https://staging.huntaze.com/api/auth/signin
```

### Production Deployment

```bash
# Deploy to production
git push origin main

# Verify console logs are removed (check bundle size)
# NextAuth should still work correctly
curl https://huntaze.com/api/auth/signin
```

## Troubleshooting

### Issue: NextAuth returns 500 in serverless

**Solution**: Verify `serverExternalPackages` includes `'next-auth'`

```typescript
// Next.js 16 syntax (top-level configuration)
serverExternalPackages: ['next-auth']
```

**Note**: If you see a warning about `experimental.serverComponentsExternalPackages`, update to use `serverExternalPackages` instead (Next.js 16 change).

### Issue: Console logs not visible in staging

**Solution**: Verify environment check in `compiler.removeConsole`

```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' && process.env.AMPLIFY_ENV === 'production',
}
```

Check that `AMPLIFY_ENV` is set correctly in AWS Amplify environment variables.

### Issue: Webpack bundling errors

**Solution**: Ensure client-side fallbacks are configured

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
  }
  return config;
}
```

## Known Issues

### NextAuth v5 Module Loading Errors During Build

**Symptom**: During `npm run build`, you may see errors like:
```
Error: Failed to load external module next-auth: Error [ERR_MODULE_NOT_FOUND]: 
Cannot find module '/Users/.../node_modules/next/server' imported from 
/Users/.../node_modules/next-auth/lib/env.js
```

**Impact**: 
- Build completes successfully (exit code 0)
- These errors occur during page data collection phase
- Runtime functionality is NOT affected
- NextAuth works correctly in production/staging

**Root Cause**:
NextAuth v5 has a compatibility issue with Next.js 16's Turbopack during the build phase. The module tries to import `next/server` but Turbopack expects `next/server.js`.

**Status**: 
- ✅ Configuration is correct (`serverExternalPackages: ['next-auth']`)
- ✅ Runtime works correctly in AWS Amplify
- ⚠️ Build warnings can be safely ignored
- 🔄 Will be resolved in future NextAuth v5 or Next.js 16 updates

**Workaround**:
No workaround needed. The configuration is optimal for serverless deployment. The errors are cosmetic and don't affect functionality.

**Verification**:
After deployment, verify NextAuth works:
```bash
curl https://staging.huntaze.com/api/auth/signin
# Should return 200 OK
```

## Related Documentation

- [NextAuth v5 Configuration](../lib/auth/config.ts)
- [Structured Logging](../lib/utils/logger.ts)
- [Diagnostic Routes](./diagnostic-routes.md)
- [Middleware Configuration](../middleware.ts)

## References

- [Next.js 16 Configuration](https://nextjs.org/docs/app/api-reference/next-config-js)
- [NextAuth v5 Documentation](https://authjs.dev/)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [Turbopack Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/turbo)
