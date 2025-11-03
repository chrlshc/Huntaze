# Three.js Dependencies Troubleshooting Guide

## Quick Diagnostic Commands

Run these commands to quickly diagnose Three.js dependency issues:

```bash
# Check current versions
npm list three @react-three/fiber @react-three/drei

# Validate compatibility
npm run test:three

# Check for peer dependency issues
npm run three:validate

# Test Amplify build compatibility
node scripts/validate-amplify-build.js
```

## Common Issues and Solutions

### 1. Peer Dependency Conflicts

#### Symptoms
- npm install warnings about peer dependencies
- Build failures with dependency resolution errors
- Runtime errors about missing React versions

#### Diagnosis
```bash
npm ls --depth=0
npm outdated
```

#### Solutions

**Option A: Update React (Recommended)**
```bash
npm install react@^19.2.0 react-dom@^19.2.0
```

**Option B: Force Resolution (Temporary)**
```bash
npm install --legacy-peer-deps
```

**Option C: Clean Install**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. Three.js Import Errors

#### Symptoms
- "Cannot resolve module 'three'" errors
- TypeScript compilation errors
- Runtime errors about missing Three.js exports

#### Diagnosis
```bash
# Check if Three.js is properly installed
node -e "console.log(require('three').REVISION)"

# Verify TypeScript types
npm list @types/three
```

#### Solutions

**Update Three.js and Types**
```bash
npm install three@^0.181.0 @types/three@^0.181.0
```

**Clear TypeScript Cache**
```bash
rm -rf .next
npx tsc --build --clean
```

### 3. React Three Fiber Compatibility Issues

#### Symptoms
- "Canvas" component not rendering
- Hooks not working in 3D components
- React 19 concurrent features causing issues

#### Diagnosis
```bash
# Test fiber compatibility
npm run test:three:unit

# Check React version compatibility
node -e "console.log(require('react').version)"
```

#### Solutions

**Ensure Compatible Versions**
```bash
npm install @react-three/fiber@^9.4.0
```

**Check Component Usage**
```jsx
// Correct usage with React 19
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

function Scene() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        {/* 3D content */}
      </Suspense>
    </Canvas>
  )
}
```

### 4. Drei Components Not Working

#### Symptoms
- Drei helper components not importing
- Runtime errors with Drei utilities
- Performance issues with Drei components

#### Diagnosis
```bash
# Test Drei imports
node -e "console.log(Object.keys(require('@react-three/drei')))"

# Run Drei-specific tests
npm test tests/unit/three-js/three-components-validation.test.ts
```

#### Solutions

**Update Drei Package**
```bash
npm install @react-three/drei@^10.7.6
```

**Check Import Syntax**
```jsx
// Correct imports
import { Float, PerspectiveCamera, Environment } from '@react-three/drei'

// Avoid default imports for Drei components
// ❌ import Float from '@react-three/drei/Float'
// ✅ import { Float } from '@react-three/drei'
```

### 5. Build and Deployment Issues

#### Symptoms
- Next.js build failures
- Amplify deployment errors
- SSR/SSG issues with Three.js

#### Diagnosis
```bash
# Test local build
npm run build

# Validate Amplify compatibility
node scripts/validate-amplify-build.js

# Check for SSR issues
npm run dev
```

#### Solutions

**Dynamic Imports for SSR**
```jsx
// Use dynamic imports for 3D components
import dynamic from 'next/dynamic'

const PhoneMockup3D = dynamic(() => import('./PhoneMockup3D'), {
  ssr: false,
  loading: () => <div>Loading 3D...</div>
})
```

**Update Next.js Configuration**
```javascript
// next.config.js
module.exports = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  experimental: {
    optimizeCss: true
  }
}
```

### 6. Performance Issues

#### Symptoms
- Slow 3D rendering
- High memory usage
- Frame rate drops

#### Diagnosis
```bash
# Run performance benchmarks
npm run test:three:performance

# Check bundle size
npm run build
npx @next/bundle-analyzer
```

#### Solutions

**Optimize Imports**
```jsx
// ❌ Import entire library
import * as THREE from 'three'

// ✅ Import only what you need
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
```

**Use Performance Monitoring**
```jsx
import { Perf } from 'r3f-perf'

function Scene() {
  return (
    <Canvas>
      {process.env.NODE_ENV === 'development' && <Perf />}
      {/* Your 3D content */}
    </Canvas>
  )
}
```

### 7. TypeScript Issues

#### Symptoms
- Type errors with Three.js objects
- Missing type definitions
- Compilation errors

#### Diagnosis
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Verify types installation
npm list @types/three
```

#### Solutions

**Update Type Definitions**
```bash
npm install --save-dev @types/three@^0.181.0
```

**Configure TypeScript**
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Environment-Specific Issues

### Development Environment

**Hot Reload Issues**
```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

**Memory Leaks in Development**
```jsx
// Proper cleanup in useEffect
useEffect(() => {
  const scene = new THREE.Scene()
  
  return () => {
    scene.dispose()
  }
}, [])
```

### Production Environment

**Bundle Size Optimization**
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'three/examples/jsm': 'three/examples/jsm'
    }
    return config
  }
}
```

**Amplify Deployment**
```yaml
# amplify.yml - ensure no legacy flags
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --no-audit --no-fund
    build:
      commands:
        - npm run build
```

## Validation Scripts

### Quick Health Check
```bash
#!/bin/bash
# scripts/three-health-check.sh

echo "🔍 Three.js Health Check"
echo "========================"

# Check versions
echo "📦 Package Versions:"
npm list three @react-three/fiber @react-three/drei --depth=0

# Run tests
echo "🧪 Running Tests:"
npm run test:three

# Check build
echo "🏗️ Testing Build:"
npm run build

echo "✅ Health check complete!"
```

### Dependency Audit
```bash
#!/bin/bash
# scripts/three-audit.sh

echo "🔍 Three.js Dependency Audit"
echo "============================="

# Check for vulnerabilities
npm audit --audit-level moderate

# Check for outdated packages
npm outdated three @react-three/fiber @react-three/drei

# Validate peer dependencies
npm ls --depth=1 | grep -E "(three|react-three)"

echo "✅ Audit complete!"
```

## Emergency Procedures

### Complete Reset
```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
npm test
```

### Rollback to Previous Versions
```bash
# Rollback script
npm uninstall three @react-three/fiber @react-three/drei
npm install three@^0.169.0 @react-three/fiber@^8.17.10 @react-three/drei@^9.114.3
npm test
```

### Version Lock
```json
// package.json - lock to specific versions if needed
{
  "dependencies": {
    "three": "0.181.0",
    "@react-three/fiber": "9.4.0", 
    "@react-three/drei": "10.7.6"
  }
}
```

## Getting Help

### Internal Resources
- Test suite: `tests/unit/three-js/` and `tests/integration/three-js/`
- Validation scripts: `scripts/validate-*.js`
- Performance benchmarks: `npm run test:three:performance`

### External Resources
- [Three.js Forum](https://discourse.threejs.org/)
- [React Three Fiber Discord](https://discord.gg/ZZjjNvJ)
- [GitHub Issues](https://github.com/pmndrs/react-three-fiber/issues)

### Escalation Path
1. Run diagnostic commands
2. Check this troubleshooting guide
3. Review test results and error logs
4. Consult external resources
5. Create minimal reproduction case
6. File issue with relevant repositories

---

**Last Updated**: November 3, 2025  
**Version**: 1.0  
**Compatibility**: React 19 + Next.js 15