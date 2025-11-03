# Dependency Validation Tests

This directory contains comprehensive tests to ensure React and Three.js dependency compatibility and prevent future conflicts.

## Overview

The React Dependency Fix project resolved conflicts between React 19 and @react-three/drei by upgrading to compatible versions. These tests ensure the resolution remains stable and prevent regression.

## Test Files

### `dependency-validation.test.ts`
Core dependency validation tests that check:
- React and @react-three/drei version compatibility
- @react-three/fiber version compatibility  
- Peer dependency conflict detection
- Package lock integrity
- Build system compatibility
- TypeScript type compatibility
- Version constraint validation

### `threejs-components.test.tsx`
Three.js component functionality tests that verify:
- Basic Three.js Fiber integration with React 19
- @react-three/drei component imports and rendering
- React Fiber hooks compatibility (useFrame, useThree)
- Performance and memory management
- React concurrent features compatibility

## Scripts

### Validation Scripts
- `npm run validate:dependencies` - Full dependency validation
- `npm run check:conflicts` - Quick conflict check for commits
- `npm run precommit:deps` - Pre-commit validation hook

### Setup Scripts
- `npm run setup:hooks` - Configure git hooks for automatic validation

## Validation Features

### Automated Checks
- ✅ React 19 and @react-three/drei 10.x+ compatibility
- ✅ @react-three/fiber 9.x+ compatibility
- ✅ Peer dependency conflict detection
- ✅ TypeScript compilation validation
- ✅ Package lock consistency
- ✅ Version constraint validation

### Pre-commit Protection
- Automatically runs before each git commit
- Blocks commits if dependency conflicts detected
- Provides clear error messages and solutions
- Validates package.json changes

### Build Integration
- Integrates with CI/CD pipelines
- Validates dependencies during build process
- Prevents deployment of conflicting versions

## Usage

### Manual Validation
```bash
# Run full dependency validation
npm run validate:dependencies

# Quick conflict check
npm run check:conflicts
```

### Git Hook Setup
```bash
# Setup automatic pre-commit validation
npm run setup:hooks
```

### Test Execution
```bash
# Run dependency validation tests
npx vitest run tests/unit/dependencies/dependency-validation.test.ts

# Run Three.js component tests  
npx vitest run tests/unit/dependencies/threejs-components.test.tsx

# Run all dependency tests
npx vitest run tests/unit/dependencies/
```

## Compatibility Matrix

| Package | Minimum Version | React 19 Compatible |
|---------|----------------|-------------------|
| react | 19.2.0 | ✅ |
| react-dom | 19.2.0 | ✅ |
| @react-three/drei | 10.7.6 | ✅ |
| @react-three/fiber | 9.0.0 | ✅ |
| @types/react | 19.2.2 | ✅ |
| @types/react-dom | 19.2.2 | ✅ |

## Error Resolution

### Common Issues

#### Peer Dependency Conflicts
```bash
# Error: ERESOLVE unable to resolve dependency tree
npm install --legacy-peer-deps  # Temporary fix
npm run validate:dependencies   # Check for proper resolution
```

#### Version Mismatches
```bash
# Update to compatible versions
npm install @react-three/drei@^10.7.6
npm install @react-three/fiber@^9.0.0
```

#### Build Failures
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run validate:dependencies
```

### Prevention

1. **Always run validation before commits**
   ```bash
   npm run check:conflicts
   ```

2. **Update dependencies carefully**
   ```bash
   # Check compatibility before updating
   npm run validate:dependencies
   npm update package-name
   npm run validate:dependencies
   ```

3. **Monitor for new versions**
   - Check @react-three/drei releases for React 19 support
   - Validate compatibility before upgrading React versions
   - Test Three.js components after dependency updates

## Maintenance

### Adding New Dependency Checks
1. Add validation logic to `scripts/validate-dependencies.js`
2. Add conflict detection to `scripts/check-dependency-conflicts.js`
3. Create tests in `dependency-validation.test.ts`
4. Update compatibility matrix in this README

### Updating Version Requirements
1. Update minimum versions in validation scripts
2. Update compatibility matrix
3. Update test expectations
4. Test with new versions

## Integration

### CI/CD Pipeline
Add to your build pipeline:
```yaml
- name: Validate Dependencies
  run: npm run validate:dependencies
```

### Development Workflow
1. Install git hooks: `npm run setup:hooks`
2. Make dependency changes
3. Automatic validation on commit
4. Manual validation: `npm run validate:dependencies`
5. Fix any conflicts before proceeding

## Troubleshooting

### Hook Setup Issues
```bash
# Manual git hook setup
npm run setup:hooks

# Verify hook exists
ls -la .git/hooks/pre-commit
```

### Test Failures
```bash
# Check test environment
npx vitest --version

# Run with verbose output
npx vitest run tests/unit/dependencies/ --reporter=verbose
```

### Validation Script Errors
```bash
# Check Node.js version (requires Node 16+)
node --version

# Verify package.json exists
ls -la package.json

# Check npm installation
npm ls --depth=0
```