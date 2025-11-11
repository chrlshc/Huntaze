# Build Troubleshooting Guide

This guide helps you diagnose and fix common build errors in the Next.js application, with a focus on standalone output issues.

## Quick Reference

| Error Type | Quick Fix | Details |
|------------|-----------|---------|
| ENOENT client manifest | Run `npm run build:validate` | [See below](#enoent-client-manifest-errors) |
| Route group issues | Check route structure | [See below](#route-group-issues) |
| File tracing errors | Verify Next.js config | [See below](#file-tracing-problems) |
| Standalone output missing | Check output directory | [See below](#standalone-output-validation) |

## Common Build Errors

### ENOENT Client Manifest Errors

**Symptom:**
```
Error: ENOENT: no such file or directory, copyfile
'.next/server/app/(landing)/page_client-reference-manifest.js'
```

**Cause:** Next.js standalone output mode cannot find client reference manifest files for route groups.

**Solutions:**

1. **Use Build Validation (Recommended)**
   ```bash
   npm run build:validate
   ```
   This checks your configuration before building.

2. **Update Next.js Configuration**
   Add experimental file tracing options to `next.config.ts`:
   ```typescript
   experimental: {
     outputFileTracingRoot: path.join(__dirname, '../../'),
     outputFileTracingIncludes: {
       '/': ['./node_modules/**'],
       '/(landing)': ['./app/(landing)/**']
     }
   }
   ```

3. **Refactor Route Structure**
   Move pages out of route groups:
   - Move `app/(landing)/page.tsx` to `app/page.tsx`
   - Convert to server component with client children

### Route Group Issues

**Symptom:** Build fails when using parentheses in folder names like `(landing)`.

**Diagnosis:**
```bash
# Check for route groups
find app -type d -name "(*)"
```

**Solutions:**

1. **Remove Route Groups**
   - Simplify structure by removing parentheses
   - Move pages to standard routes

2. **Use Server Components**
   - Remove `'use client'` from page components
   - Move client logic to child components

### File Tracing Problems

**Symptom:** Build completes but standalone output is missing files.

**Diagnosis:**
```bash
npm run build:verify
```

**Solutions:**

1. **Check outputFileTracingIncludes**
   Ensure all required paths are included in `next.config.ts`

2. **Verify File Paths**
   Check that all imports use correct relative paths

3. **Review .gitignore**
   Ensure required files aren't excluded

### Standalone Output Validation

**Symptom:** `.next/standalone` directory is incomplete or missing.

**Diagnosis:**
```bash
# Check if standalone directory exists
ls -la .next/standalone

# Verify required files
npm run build:verify
```

**Required Files:**
- `.next/standalone/server.js`
- `.next/standalone/package.json`
- `.next/standalone/.next/`
- `.next/standalone/public/`

**Solutions:**

1. **Verify Output Configuration**
   ```typescript
   // next.config.ts
   output: 'standalone'
   ```

2. **Check Build Process**
   ```bash
   # Use error handling wrapper
   npm run build
   
   # Or run Next.js directly
   npm run build:next
   ```

3. **Manual Verification**
   ```bash
   # Check standalone structure
   tree -L 3 .next/standalone
   ```

## Build Scripts

### Available Commands

```bash
# Validate configuration before building
npm run build:validate

# Build with error handling
npm run build

# Build without wrapper (direct Next.js)
npm run build:next

# Verify standalone output after build
npm run build:verify
```

### Build Script Workflow

```
build:validate → build → build:verify
     ↓              ↓          ↓
  Pre-check    Build app   Post-check
```

## Debugging Steps

### Step 1: Pre-Build Validation

```bash
npm run build:validate
```

This checks:
- Next.js configuration syntax
- Route group structure
- Output mode settings
- Environment compatibility

### Step 2: Build with Error Handling

```bash
npm run build
```

This provides:
- Detailed error messages
- Suggested fixes
- Build progress logging

### Step 3: Post-Build Verification

```bash
npm run build:verify
```

This validates:
- Standalone directory structure
- Required files presence
- Manifest file integrity
- Deployment package completeness

## Advanced Troubleshooting

### Enable Debug Logging

```bash
# Set debug environment variable
DEBUG=next:* npm run build:next
```

### Check Next.js Version

```bash
# Verify Next.js version
npm list next

# Update if needed
npm install next@latest
```

### Clean Build

```bash
# Remove build artifacts
rm -rf .next

# Clear cache
rm -rf node_modules/.cache

# Rebuild
npm run build
```

### Inspect Build Output

```bash
# Check build size
du -sh .next/standalone

# List all files
find .next/standalone -type f

# Check for missing dependencies
cd .next/standalone && npm ls
```

## Environment-Specific Issues

### Development vs Production

- Development builds may work while production fails
- Always test with `NODE_ENV=production`
- Use `npm run build` to simulate production

### CI/CD Environments

Common issues in CI/CD:
- Missing environment variables
- Insufficient memory
- File permission issues
- Node version mismatches

**Solutions:**
```bash
# Set memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Verify Node version
node --version  # Should match .nvmrc or package.json engines

# Check permissions
ls -la .next
```

## Getting Help

If you're still experiencing issues:

1. Check the error output from `npm run build`
2. Review the validation report from `npm run build:validate`
3. Inspect the verification results from `npm run build:verify`
4. Check Next.js documentation for your version
5. Search for similar issues in Next.js GitHub repository

## Related Documentation

- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Next.js Configuration](https://nextjs.org/docs/api-reference/next.config.js/introduction)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
