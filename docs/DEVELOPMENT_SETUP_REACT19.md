# Development Setup Guide - React 19 + Three.js

## Overview

This guide covers the development setup for the Huntaze application with React 19 and Three.js integration, including dependency management and validation tools.

## Prerequisites

### System Requirements
- **Node.js**: 18.17.0 or higher (recommended: 20.x LTS)
- **npm**: 9.0.0 or higher
- **Git**: 2.34.0 or higher
- **Operating System**: macOS, Linux, or Windows with WSL2

### Recommended Tools
- **VS Code** with React/TypeScript extensions
- **Chrome DevTools** for debugging
- **Git GUI** (optional): GitKraken, SourceTree, or GitHub Desktop

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd huntaze-site
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm run validate:dependencies
```

### 3. Setup Git Hooks
```bash
# Configure automatic dependency validation
npm run setup:hooks

# Verify hook installation
ls -la .git/hooks/pre-commit
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure required variables
# Edit .env with your specific values
```

## React 19 + Three.js Configuration

### Dependency Versions
The application uses these specific versions for React 19 compatibility:

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@react-three/drei": "^10.7.6",
    "@react-three/fiber": "^9.0.0",
    "three": "^0.160.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "@types/three": "^0.160.0"
  }
}
```

### Compatibility Matrix
| Package | Version | React 19 Support | Status |
|---------|---------|------------------|---------|
| @react-three/drei | 10.7.6+ | ✅ Full Support | ✅ Active |
| @react-three/fiber | 9.0.0+ | ✅ Full Support | ✅ Active |
| three.js | 0.160.0+ | ✅ Version Agnostic | ✅ Active |

## Development Workflow

### 1. Daily Development
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Validate dependencies (recommended daily)
npm run validate:dependencies
```

### 2. Before Committing
```bash
# Automatic validation (via git hooks)
git add .
git commit -m "Your commit message"
# Hook automatically runs: npm run precommit:deps

# Manual validation (if needed)
npm run check:conflicts
```

### 3. Dependency Updates
```bash
# Check for updates
npm outdated

# Update specific package (with validation)
npm install package-name@latest
npm run validate:dependencies

# If conflicts arise
npm run check:conflicts
```

## Three.js Development

### Component Structure
```typescript
// Example Three.js component with React 19
import { Canvas } from '@react-three/fiber';
import { Box, OrbitControls } from '@react-three/drei';

export default function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="orange" />
      </Box>
      <OrbitControls />
    </Canvas>
  );
}
```

### React 19 Features in Three.js
```typescript
// Using React 19 concurrent features
import { Suspense, use } from 'react';
import { Canvas } from '@react-three/fiber';

function AsyncModel() {
  // React 19 'use' hook for data fetching
  const model = use(loadModel('/path/to/model.gltf'));
  
  return <primitive object={model} />;
}

export default function Scene() {
  return (
    <Canvas>
      <Suspense fallback={<LoadingSpinner />}>
        <AsyncModel />
      </Suspense>
    </Canvas>
  );
}
```

## Testing Setup

### Test Environment
The project uses Vitest with jsdom for React component testing:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    environmentMatchGlobs: [
      ['tests/unit/dependencies/dependency-validation.test.ts', 'node'],
      ['tests/**/*.test.{ts,tsx}', 'jsdom']
    ]
  }
});
```

### Running Tests
```bash
# All tests
npm run test

# Dependency tests only
npx vitest run tests/unit/dependencies/

# Three.js component tests
npx vitest run tests/unit/dependencies/threejs-components.test.tsx

# Watch mode
npm run test:ui
```

## Build Configuration

### Next.js 15 + React 19
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    // React 19 features
    reactCompiler: true,
    ppr: true
  },
  // Three.js optimization
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil'
    });
    return config;
  }
};
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Validation Tools

### Available Commands
```bash
# Full dependency validation
npm run validate:dependencies

# Quick conflict check
npm run check:conflicts

# Pre-commit validation
npm run precommit:deps

# Setup git hooks
npm run setup:hooks
```

### Validation Features
- ✅ React 19 + Three.js compatibility check
- ✅ Peer dependency conflict detection
- ✅ TypeScript compilation validation
- ✅ Package lock integrity verification
- ✅ Build system compatibility check

## Troubleshooting

### Common Issues

#### Dependency Conflicts
```bash
# Error: ERESOLVE unable to resolve dependency tree
# Solution: Validate and fix conflicts
npm run validate:dependencies
npm run check:conflicts
```

#### Three.js Import Errors
```bash
# Error: Cannot resolve module '@react-three/drei'
# Solution: Verify installation and compatibility
npm ls @react-three/drei
npm run validate:dependencies
```

#### Build Failures
```bash
# Error: Build failed with dependency issues
# Solution: Clean and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

#### Git Hook Issues
```bash
# Error: Pre-commit hook not working
# Solution: Reinstall hooks
npm run setup:hooks
chmod +x .git/hooks/pre-commit
```

### Performance Optimization

#### Three.js Performance
```typescript
// Optimize Three.js rendering
import { Canvas } from '@react-three/fiber';

<Canvas
  gl={{ 
    antialias: false,
    alpha: false,
    powerPreference: "high-performance"
  }}
  dpr={[1, 2]}
  performance={{ min: 0.5 }}
>
  {/* Your scene */}
</Canvas>
```

#### React 19 Optimizations
```typescript
// Use React 19 compiler optimizations
'use client';

import { memo, useMemo } from 'react';

const OptimizedComponent = memo(function Component({ data }) {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});
```

## IDE Configuration

### VS Code Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.tsx": "typescriptreact"
  }
}
```

### Recommended Extensions
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**
- **Thunder Client** (for API testing)

## Deployment Preparation

### Pre-deployment Checklist
- [ ] All tests passing: `npm run test`
- [ ] Dependencies validated: `npm run validate:dependencies`
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Environment variables configured
- [ ] Git hooks active and working

### Production Build
```bash
# Create production build
npm run build

# Test production build locally
npm run start

# Validate production readiness
npm run validate:dependencies
```

## Support and Resources

### Documentation
- **React 19 Guide**: `docs/REACT_DEPENDENCY_RESOLUTION.md`
- **Dependency Tests**: `tests/unit/dependencies/README.md`
- **API Reference**: `docs/API_REFERENCE.md`

### Validation Scripts
- **Full Validation**: `scripts/validate-dependencies.js`
- **Conflict Check**: `scripts/check-dependency-conflicts.js`
- **Git Hooks Setup**: `scripts/setup-git-hooks.js`

### Getting Help
1. **Check validation output**: `npm run validate:dependencies`
2. **Review test results**: `npm run test`
3. **Consult documentation**: `docs/` directory
4. **Check git hooks**: `.husky/pre-commit`

This setup ensures a robust development environment with React 19 and Three.js, complete with automated validation and conflict prevention.