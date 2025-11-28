# Configuration Files Guide

This guide documents all configuration files in the Huntaze project and their purposes.

## TypeScript Configurations

### `tsconfig.json` (Base Configuration)
**Purpose**: Main TypeScript configuration for the entire project
**Used by**: Next.js build process, IDE type checking
**Key settings**:
- Target: ESNext (modern JavaScript)
- Module: ESNext (ES modules)
- Strict mode enabled for type safety
- Path aliases: `@/*` maps to project root
- Includes: All app, components, pages, and src files

**When to modify**: 
- Adding new path aliases
- Changing compiler options project-wide
- Updating included/excluded directories

### `tsconfig.typecheck.json` (Type Checking)
**Purpose**: Specialized configuration for type checking without building
**Used by**: CI/CD type checking, pre-commit hooks
**Extends**: `tsconfig.json`
**Key differences**:
- Excludes test files, scripts, and external projects
- Excludes problematic files during migration
- Focuses on production code type safety

**Usage**: `tsc --noEmit --project tsconfig.typecheck.json`

### `tsconfig.typecheck.api-proactive.json` (API Type Checking)
**Purpose**: Type checking for smart-onboarding API routes
**Used by**: Isolated type checking of specific API endpoints
**Key features**:
- Explicitly lists all smart-onboarding API files
- Includes facade services and utilities
- Allows granular type checking of complex API routes

**Usage**: `tsc --noEmit --project tsconfig.typecheck.api-proactive.json`

### `tsconfig.typecheck.api-smart-onboarding.json` (Smart Onboarding API)
**Purpose**: Minimal type checking for smart-onboarding intervention API
**Used by**: Quick validation of specific API route
**Extends**: `tsconfig.json`
**Key features**:
- Single file focus for fast checking
- Skip lib check for performance

**Usage**: `tsc --noEmit --project tsconfig.typecheck.api-smart-onboarding.json`

## Test Configurations

### `vitest.config.ts` (Unit Tests)
**Purpose**: Main configuration for unit tests
**Used by**: `npm run test`, `npm run test:unit`
**Test location**: `tests/unit/**/*.test.ts`
**Features**:
- Fast execution with in-memory testing
- Code coverage reporting
- Mock support for external dependencies

### `vitest.config.integration.ts` (Integration Tests)
**Purpose**: Configuration for integration tests
**Used by**: `npm run test:integration`
**Test location**: `tests/integration/**/*.test.ts`
**Features**:
- Database connection testing
- API endpoint testing
- External service integration testing
**Note**: Requires database and services to be running

### `vitest.config.integration.api.ts` (API Integration Tests)
**Purpose**: Specialized configuration for API integration tests
**Used by**: API-specific integration testing
**Test location**: `tests/integration/api/**/*.test.ts`
**Features**:
- API route testing
- Request/response validation
- Authentication flow testing

### `vitest.config.e2e.ts` (End-to-End Tests)
**Purpose**: Configuration for end-to-end tests
**Used by**: `npm run test:e2e`
**Test location**: `tests/e2e/**/*.spec.ts`
**Features**:
- Full application flow testing
- Browser automation (if using Playwright)
- User journey validation

### `vitest.config.beta.ts` (Beta Testing)
**Purpose**: Configuration for beta feature tests
**Used by**: `npm run test:beta`
**Test location**: Beta-specific test files
**Features**:
- Memory-optimized (1GB limit)
- Beta feature validation
- Experimental feature testing

### `vitest.config.rate-limiter.ts` (Rate Limiter Tests)
**Purpose**: Specialized tests for rate limiting functionality
**Used by**: Rate limiter validation
**Features**:
- Rate limit boundary testing
- Throttling behavior validation

### `vitest.setup.ts` (Test Setup)
**Purpose**: Global test setup and teardown
**Used by**: All Vitest configurations
**Features**:
- Mock initialization
- Test environment setup
- Global test utilities

### `vitest.setup.integration.ts` (Integration Test Setup)
**Purpose**: Setup specific to integration tests
**Used by**: Integration test configurations
**Features**:
- Database connection setup
- Test data seeding
- Service initialization

## Build Configurations

### `buildspec.yml` (Main Build)
**Purpose**: AWS CodeBuild specification for main builds
**Used by**: AWS CodeBuild, CI/CD pipeline
**Stages**:
1. Install dependencies
2. Run tests
3. Build application
4. Deploy artifacts

**When triggered**: Push to main branch, pull requests

### `buildspec-loadtest.yml` (Load Testing)
**Purpose**: AWS CodeBuild specification for load testing
**Used by**: Performance testing pipeline
**Features**:
- K6 load test execution
- Performance metrics collection
- Load test reporting

**When triggered**: Scheduled or manual load tests

## Performance & Quality Configurations

### `.lighthouserc.json` (Lighthouse CI)
**Purpose**: Configuration for Lighthouse performance audits
**Used by**: `npm run lighthouse`, `npm run lighthouse:collect`, `npm run lighthouse:assert`
**Metrics tracked**:
- Performance score (min 90%)
- Accessibility score (min 90%)
- Best practices score (min 90%)
- SEO score (min 90%)
- Core Web Vitals (FCP, LCP, CLS, TBT)

**Thresholds**: 
- First Contentful Paint: < 2000ms
- Largest Contentful Paint: < 2500ms
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 300ms
- Speed Index: < 3500ms
- Time to Interactive: < 4000ms

**Output**: Reports saved to `.kiro/reports/lighthouse/`

### `performance-budget.json` (Performance Budget)
**Purpose**: Defines performance budgets for the application
**Used by**: `npm run validate:budget`
**Budgets**:
- JavaScript bundle size
- CSS bundle size
- Image sizes
- Total page weight
- Request counts

### `playwright.config.ts` (E2E Testing)
**Purpose**: Configuration for Playwright browser testing
**Used by**: Visual regression tests, E2E tests
**Features**:
- Multi-browser testing (Chrome, Firefox, Safari)
- Screenshot comparison
- Video recording on failure
- Parallel test execution

## Other Configurations

### `next.config.ts` (Next.js)
**Purpose**: Next.js framework configuration
**Key settings**:
- Webpack customization
- Image optimization
- Environment variables
- Redirects and rewrites
- Performance optimizations

### `postcss.config.mjs` (PostCSS)
**Purpose**: CSS processing configuration
**Plugins**:
- Tailwind CSS
- Autoprefixer
- CSS minification

### `jest.config.js` (Jest - Legacy)
**Purpose**: Jest testing configuration
**Status**: May be legacy if using Vitest
**Action**: Verify if still needed, consider removing if fully migrated to Vitest

### `amplify.yml` (AWS Amplify)
**Purpose**: AWS Amplify deployment configuration
**Used by**: AWS Amplify hosting
**Stages**:
- Pre-build (environment setup)
- Build (application build)
- Post-build (deployment)

### `vercel.json` (Vercel)
**Purpose**: Vercel deployment configuration
**Status**: May not be active if using AWS Amplify
**Action**: Verify deployment platform and remove if not using Vercel

### `docker-compose.yml` (Docker)
**Purpose**: Local development environment with Docker
**Services**:
- PostgreSQL database
- Redis cache
- Application container

### `Dockerfile` (Docker Image)
**Purpose**: Docker image definition for containerized deployment
**Stages**:
- Dependencies installation
- Application build
- Production runtime

## AWS Infrastructure Configurations

### `aws-infrastructure.yaml` (CloudFormation)
**Purpose**: AWS infrastructure as code
**Resources**:
- S3 buckets
- CloudFront distributions
- Lambda functions
- RDS databases
- ElastiCache clusters

### `cdk.context.json` (AWS CDK)
**Purpose**: AWS CDK context values
**Contains**: Account IDs, regions, resource names

### `ecr-lifecycle.json` (ECR Lifecycle)
**Purpose**: Docker image lifecycle policy for ECR
**Rules**: Image retention and cleanup policies

### `lifecycle.json` (S3 Lifecycle)
**Purpose**: S3 bucket lifecycle rules
**Rules**: Object expiration and transition policies

## Configuration Best Practices

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Document changes**: Update this guide when adding new configs
3. **Version control**: Commit all config files (except those with secrets)
4. **Validate configs**: Test configuration changes in development first
5. **Keep configs DRY**: Use extends/inheritance where possible
6. **Comment complex settings**: Explain non-obvious configuration choices

## Quick Reference

### Type Checking
```bash
# Check all TypeScript files
npm run typecheck

# Check specific API routes
tsc --noEmit --project tsconfig.typecheck.api-proactive.json
```

### Testing
```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

### Performance Audits
```bash
# Run Lighthouse audit
npm run lighthouse

# Validate performance budget
npm run validate:budget

# Analyze bundle size
npm run analyze:bundle
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to AWS (via Amplify)
# Configured in amplify.yml
```

## Troubleshooting

### TypeScript errors in IDE but not in build
- Check which tsconfig your IDE is using
- Ensure IDE is using `tsconfig.json` not a specialized config
- Restart TypeScript server in IDE

### Tests failing locally but passing in CI
- Check Node version matches CI environment
- Verify all dependencies are installed
- Check for environment-specific configurations

### Build succeeds but Lighthouse fails
- Check performance budgets in `performance-budget.json`
- Review Lighthouse thresholds in `.lighthouserc.json`
- Optimize assets and code splitting

## Maintenance

- Review and update configs quarterly
- Remove unused configurations
- Keep dependencies in configs up to date
- Document any custom or non-standard settings
