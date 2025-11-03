# React Dependency Troubleshooting Guide

## Overview

This guide provides solutions for common React 19 and Three.js dependency issues in the Huntaze application.

## Quick Diagnostics

### Run Validation Commands
```bash
# Full dependency validation
npm run validate:dependencies

# Quick conflict check
npm run check:conflicts

# Deployment validation
npm run validate:deployment

# Test dependency compatibility
npm run test tests/unit/dependencies/
```

### Check System Status
```bash
# Node.js and npm versions
node --version  # Should be 18.x+ (recommended: 20.x)
npm --version   # Should be 9.x+

# Package versions
npm ls react react-dom @react-three/drei @react-three/fiber

# Build status
npm run build
```

## Common Issues and Solutions

### 1. Peer Dependency Conflicts

#### Symptom
```
npm ERR! peer dep missing: react@"^19.0.0", required by @react-three/drei@10.7.6
npm ERR! ERESOLVE unable to resolve dependency tree
```

#### Diagnosis
```bash
npm ls --depth=0
npm run check:conflicts
```

#### Solutions

**Option A: Update to Compatible Versions (Recommended)**
```bash
# Update to React 19 compatible versions
npm install @react-three/drei@^10.7.6 @react-three/fiber@^9.0.0

# Verify compatibility
npm run validate:dependencies
```

**Option B: Clean Installation**
```bash
# Remove and reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Validate after reinstall
npm run validate:dependencies
```

**Option C: Force Resolution (Temporary)**
```bash
# Use legacy peer deps (not recommended for production)
npm install --legacy-peer-deps

# Then fix properly with compatible versions
npm install @react-three/drei@^10.7.6
```

### 2. React Version Mismatches

#### Symptom
```
Error: React version mismatch between react@19.2.0 and react-dom@18.2.0
```

#### Diagnosis
```bash
npm ls react react-dom @types/react @types/react-dom
```

#### Solution
```bash
# Ensure all React packages use the same version
npm install react@^19.2.0 react-dom@^19.2.0 @types/react@^19.2.2 @types/react-dom@^19.2.2

# Verify versions match
npm ls react react-dom
npm run validate:dependencies
```

### 3. Three.js Import Errors

#### Symptom
```
Module not found: Can't resolve '@react-three/drei'
TypeError: Cannot read properties of undefined (reading 'Canvas')
```

#### Diagnosis
```bash
# Check if packages are installed
npm ls @react-three/drei @react-three/fiber three

# Check for TypeScript errors
npx tsc --noEmit --skipLibCheck
```

#### Solutions

**Missing Packages**
```bash
# Install missing Three.js packages
npm install @react-three/drei@^10.7.6 @react-three/fiber@^9.0.0 three@^0.160.0

# Install TypeScript types
npm install --save-dev @types/three@^0.160.0
```

**Import Issues**
```typescript
// Correct imports
import { Canvas } from '@react-three/fiber';
import { Box, OrbitControls } from '@react-three/drei';

// Not this (incorrect)
import Canvas from '@react-three/fiber';
```

**Component Usage**
```typescript
// Correct usage with React 19
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Box } from '@react-three/drei';

function Scene() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Box args={[1, 1, 1]} />
      </Suspense>
    </Canvas>
  );
}
```

### 4. Build Failures

#### Symptom
```
Build failed with exit code 1
Type error: Cannot find module '@react-three/drei'
```

#### Diagnosis
```bash
# Check build process
npm run build

# Check TypeScript compilation
npx tsc --noEmit

# Validate dependencies
npm run validate:dependencies
```

#### Solutions

**TypeScript Configuration**
```json
// tsconfig.json - ensure proper module resolution
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Next.js Configuration**
```typescript
// next.config.ts - Three.js optimization
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil'
    });
    return config;
  }
};
```

**Clear Build Cache**
```bash
# Clear all caches and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### 5. Git Hook Issues

#### Symptom
```
Pre-commit hook failed: dependency validation error
Hook not executing automatically
```

#### Diagnosis
```bash
# Check if hooks are installed
ls -la .git/hooks/pre-commit

# Test hook manually
npm run precommit:deps

# Check hook permissions
ls -la .git/hooks/pre-commit
```

#### Solutions

**Reinstall Hooks**
```bash
# Reinstall git hooks
npm run setup:hooks

# Make executable (Unix/macOS)
chmod +x .git/hooks/pre-commit

# Verify installation
ls -la .git/hooks/pre-commit
```

**Manual Hook Setup**
```bash
# If automatic setup fails, create manually
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npm run precommit:deps
EOF

chmod +x .git/hooks/pre-commit
```

**Bypass Hook (Emergency)**
```bash
# Skip hooks for emergency commits (not recommended)
git commit --no-verify -m "Emergency commit"

# Then fix issues and commit properly
npm run validate:dependencies
git add .
git commit -m "Fix dependency issues"
```

### 6. Development Server Issues

#### Symptom
```
Error: This browser does not support ResizeObserver
Canvas component not rendering
```

#### Diagnosis
```bash
# Check development environment
npm run dev

# Test component rendering
npm run test tests/unit/dependencies/threejs-components.test.tsx
```

#### Solutions

**Browser Compatibility**
```typescript
// Add ResizeObserver polyfill if needed
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
```

**Canvas Configuration**
```typescript
// Optimize Canvas for development
<Canvas
  gl={{ 
    antialias: false,
    alpha: false 
  }}
  dpr={[1, 2]}
  performance={{ min: 0.5 }}
>
  {/* Your scene */}
</Canvas>
```

### 7. Production Deployment Issues

#### Symptom
```
Deployment failed: dependency resolution error
Build successful locally but fails in production
```

#### Diagnosis
```bash
# Test production build locally
npm run build
npm run start

# Validate deployment readiness
npm run validate:deployment

# Check environment differences
node --version
npm --version
```

#### Solutions

**Environment Consistency**
```bash
# Ensure Node.js version consistency
# In package.json
{
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  }
}
```

**Production Dependencies**
```bash
# Ensure production dependencies are correct
npm install --production
npm run validate:deployment
```

**Amplify Configuration**
```yaml
# amplify.yml - ensure proper validation
preBuild:
  commands:
    - nvm install 20 && nvm use 20
    - npm ci --no-audit --no-fund
    - npm run validate:dependencies
```

## Advanced Troubleshooting

### Debug Dependency Tree
```bash
# Analyze dependency tree
npm ls --all | grep react
npm ls --all | grep three

# Check for duplicate packages
npm ls --depth=0 | grep -E "(react|three)"

# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

### Version Compatibility Matrix
```bash
# Test specific version combinations
npm install react@19.2.0 @react-three/drei@10.7.6
npm run validate:dependencies

# Check peer dependency requirements
npm info @react-three/drei peerDependencies
npm info @react-three/fiber peerDependencies
```

### Performance Debugging
```bash
# Monitor build performance
npm run build -- --profile

# Check bundle size
npm run build
du -sh .next/

# Analyze dependencies impact
npm ls --depth=0 --long
```

## Prevention Strategies

### 1. Automated Validation
```bash
# Setup git hooks
npm run setup:hooks

# Enable CI/CD validation
# See .github/workflows/dependency-validation.yml
```

### 2. Regular Maintenance
```bash
# Weekly dependency check
npm outdated
npm audit

# Monthly compatibility validation
npm run validate:dependencies
npm run test tests/unit/dependencies/
```

### 3. Version Pinning
```json
// package.json - pin critical versions
{
  "dependencies": {
    "react": "19.2.0",
    "@react-three/drei": "10.7.6",
    "@react-three/fiber": "9.0.0"
  }
}
```

## Emergency Procedures

### Complete Reset
```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json .next
git checkout HEAD -- package.json package-lock.json
npm install
npm run validate:dependencies
npm run build
```

### Rollback to Working State
```bash
# Rollback to last working commit
git log --oneline -10
git checkout <working-commit-hash> -- package.json package-lock.json
npm install
npm run validate:dependencies
```

### Temporary Workarounds
```bash
# Use legacy peer deps (temporary only)
npm install --legacy-peer-deps

# Skip validation (emergency only)
git commit --no-verify

# Force build (not recommended)
npm run build --force
```

## Getting Help

### Diagnostic Information
When seeking help, provide:

```bash
# System information
node --version
npm --version
uname -a  # or systeminfo on Windows

# Dependency information
npm ls react react-dom @react-three/drei @react-three/fiber
npm run validate:dependencies

# Error logs
npm run build 2>&1 | tee build.log
```

### Support Resources
- **Validation Scripts**: `scripts/validate-*.js`
- **Test Suite**: `tests/unit/dependencies/`
- **Documentation**: `docs/REACT_DEPENDENCY_RESOLUTION.md`
- **CI/CD Config**: `.github/workflows/dependency-validation.yml`

### Community Resources
- **React 19 Documentation**: https://react.dev/
- **@react-three/drei Issues**: https://github.com/pmndrs/drei/issues
- **@react-three/fiber Issues**: https://github.com/pmndrs/react-three-fiber/issues
- **Three.js Documentation**: https://threejs.org/docs/

Remember: Always validate dependencies after making changes and test thoroughly before deploying to production.