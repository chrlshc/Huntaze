# Production Testing Suite - Design Document

## Overview

This design document outlines the architecture and implementation strategy for a comprehensive production-ready testing suite covering Integration Tests, End-to-End (E2E) Tests, and Load Testing. The suite builds upon existing test infrastructure (Vitest for unit/integration, Playwright for E2E) and adds critical missing coverage for production readiness.

### Goals

1. Achieve 85%+ test coverage for critical business logic
2. Validate all critical user workflows end-to-end
3. Verify system performance under expected and peak loads
4. Enable automated testing in CI/CD pipeline
5. Provide clear test documentation and examples

### Non-Goals

- UI component unit testing (already covered)
- Manual testing procedures
- Production monitoring (separate concern)

## Architecture

### Testing Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Load Testing Layer                    │
│  (k6 - Traffic simulation, performance benchmarks)      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   E2E Testing Layer                      │
│  (Playwright - Complete user workflows, browser tests)  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Integration Testing Layer                   │
│  (Vitest - API routes, service interactions, DB)        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                Unit Testing Layer                        │
│  (Vitest - Individual functions, utilities)             │
│  [ALREADY IMPLEMENTED - 71 tests passing]               │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Tool | Justification |
|-------|------|---------------|
| Integration Tests | Vitest | Already configured, fast, TypeScript support |
| E2E Tests | Playwright | Already configured, cross-browser, video/screenshot capture |
| Load Tests | k6 | Industry standard, JavaScript-based, Grafana integration |
| CI/CD | GitHub Actions | Native GitHub integration, parallel execution |
| Test Data | Fixtures + Factories | Reusable, maintainable test data |
| Mocking | Vitest mocks + MSW | API mocking, Redis mocking |

## Components and Interfaces

### 1. Integration Testing Infrastructure

#### 1.1 Test Organization

```
tests/integration/
├── setup/
│   ├── global-setup.ts          # Global test setup
│   ├── test-database.ts         # Test DB management
│   ├── mock-redis.ts            # Redis mocking (extend existing)
│   └── mock-external-apis.ts    # External API mocking
├── fixtures/
│   ├── users.ts                 # User test data
│   ├── content.ts               # Content test data
│   ├── revenue.ts               # Revenue test data
│   └── factories.ts             # Data factories
├── auth/
│   ├── session.test.ts          # Session management
│   ├── oauth-flows.test.ts      # OAuth integrations
│   └── permissions.test.ts      # Authorization
├── api/
│   ├── dashboard.test.ts        # Dashboard API (extend existing)
│   ├── content.test.ts          # Content API
│   ├── messages.test.ts         # Messages API (extend existing)
│   ├── revenue.test.ts          # Revenue API (extend existing)
│   ├── marketing.test.ts        # Marketing API (extend existing)
│   └── analytics.test.ts        # Analytics API
├── services/
│   ├── rate-limiter.test.ts     # Rate limiting (extend existing)
│   ├── content-service.test.ts  # Content service
│   ├── message-service.test.ts  # Message service
│   └── revenue-service.test.ts  # Revenue service
└── security/
    ├── authentication.test.ts   # Auth security
    ├── authorization.test.ts    # Access control
    ├── rate-limiting.test.ts    # Rate limit enforcement
    └── input-validation.test.ts # Input sanitization
```

#### 1.2 Test Configuration

```typescript
// vitest.config.integration.ts (enhanced)
export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['tests/integration/e2e/**'],
    globals: true,
    environment: 'node',
    setupFiles: ['tests/integration/setup/global-setup.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4, // Parallel execution
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'app/api/**/*.ts',
        'lib/services/**/*.ts',
        'lib/auth/**/*.ts',
      ],
      exclude: [
        'node_modules',
        'tests',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/integration-results.json',
      html: './test-results/integration-results.html',
    },
  },
});
```

#### 1.3 Test Utilities

```typescript
// tests/integration/setup/test-helpers.ts
export interface TestContext {
  userId: string;
  sessionToken: string;
  cleanup: () => Promise<void>;
}

export async function createTestUser(): Promise<TestContext> {
  // Create test user with session
}

export async function createAuthenticatedRequest(
  url: string,
  userId: string,
  options?: RequestInit
): Promise<Request> {
  // Create authenticated request
}

export async function cleanupTestData(userId: string): Promise<void> {
  // Clean up test data
}

export function mockExternalAPI(
  service: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit',
  responses: Record<string, any>
): void {
  // Mock external API responses
}
```

### 2. E2E Testing Infrastructure

#### 2.1 Test Organization

```
tests/e2e/
├── setup/
│   ├── global-setup.ts          # Start test server, seed data
│   ├── global-teardown.ts       # Cleanup
│   └── auth-helper.ts           # Authentication helpers
├── fixtures/
│   ├── test-users.ts            # E2E test users
│   └── test-data.ts             # E2E test data
├── workflows/
│   ├── authentication/
│   │   ├── login.spec.ts        # Login flow
│   │   ├── oauth-instagram.spec.ts
│   │   ├── oauth-tiktok.spec.ts
│   │   ├── oauth-reddit.spec.ts
│   │   └── logout.spec.ts
│   ├── content/
│   │   ├── create-content.spec.ts
│   │   ├── schedule-content.spec.ts
│   │   ├── publish-content.spec.ts
│   │   └── content-calendar.spec.ts
│   ├── messages/
│   │   ├── send-message.spec.ts
│   │   ├── message-threads.spec.ts
│   │   └── mass-messages.spec.ts
│   ├── revenue/
│   │   ├── pricing-changes.spec.ts
│   │   ├── upsell-workflow.spec.ts
│   │   ├── churn-detection.spec.ts
│   │   └── revenue-forecast.spec.ts
│   ├── marketing/
│   │   ├── create-campaign.spec.ts
│   │   ├── launch-campaign.spec.ts
│   │   └── campaign-analytics.spec.ts
│   └── analytics/
│       ├── dashboard-view.spec.ts
│       ├── revenue-analytics.spec.ts
│       └── fan-analytics.spec.ts
├── smoke/
│   ├── critical-paths.spec.ts   # Smoke tests for deployment
│   └── health-checks.spec.ts
└── visual/
    ├── dashboard.spec.ts        # Visual regression tests
    └── landing-page.spec.ts
```

#### 2.2 Enhanced Playwright Configuration

```typescript
// playwright.config.ts (enhanced)
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  globalSetup: './tests/e2e/setup/global-setup.ts',
  globalTeardown: './tests/e2e/setup/global-teardown.ts',
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 2.3 E2E Test Helpers

```typescript
// tests/e2e/setup/auth-helper.ts
export async function loginAsTestUser(
  page: Page,
  userType: 'creator' | 'admin' = 'creator'
): Promise<void> {
  // Login helper
}

export async function setupOAuthConnection(
  page: Page,
  platform: 'instagram' | 'tiktok' | 'reddit'
): Promise<void> {
  // OAuth connection helper
}

export async function waitForDashboardLoad(page: Page): Promise<void> {
  // Wait for dashboard to fully load
}

export async function captureNetworkRequests(
  page: Page
): Promise<Request[]> {
  // Capture network requests for debugging
}
```

### 3. Load Testing Infrastructure

#### 3.1 Test Organization

```
tests/load/
├── scenarios/
│   ├── baseline.js              # Normal traffic baseline
│   ├── peak-traffic.js          # Peak traffic simulation
│   ├── spike-test.js            # Sudden traffic spike
│   ├── stress-test.js           # Stress testing
│   └── soak-test.js             # Long-duration test
├── scripts/
│   ├── auth-flow.js             # Authentication load
│   ├── dashboard-load.js        # Dashboard load
│   ├── content-creation.js      # Content creation load
│   ├── message-sending.js       # Message sending load
│   └── api-endpoints.js         # API endpoint load
├── utils/
│   ├── auth.js                  # Auth utilities
│   ├── data-generators.js       # Test data generation
│   └── metrics.js               # Custom metrics
├── config/
│   ├── thresholds.js            # Performance thresholds
│   └── environments.js          # Environment configs
└── reports/
    └── .gitkeep
```

#### 3.2 k6 Configuration

```javascript
// tests/load/scenarios/baseline.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const dashboardLoadTime = new Trend('dashboard_load_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

export default function () {
  // Test scenarios
}
```

#### 3.3 Load Test Scenarios

**Baseline Test**: Normal traffic patterns
- 1000 concurrent users
- Mix of dashboard views, content creation, message sending
- 15-minute duration
- Target: 95th percentile < 500ms

**Peak Traffic Test**: Expected peak load
- 2500 concurrent users
- Simulates campaign launches, viral content
- 30-minute duration
- Target: 95th percentile < 1000ms

**Spike Test**: Sudden traffic increase
- 100 → 5000 users in 1 minute
- Tests auto-scaling and rate limiting
- 10-minute duration
- Target: No crashes, graceful degradation

**Stress Test**: Beyond capacity
- Gradually increase to 10,000+ users
- Find breaking point
- Identify bottlenecks
- Target: Identify max capacity

**Soak Test**: Long-duration stability
- 500 concurrent users
- 4-hour duration
- Tests memory leaks, resource exhaustion
- Target: Stable performance throughout

### 4. CI/CD Integration

#### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/test-suite.yml
name: Production Test Suite

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2 AM

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-test-results
          path: test-results/
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: integration

  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-results-${{ matrix.browser }}
          path: |
            test-results/
            playwright-report/

  load-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      - run: k6 run tests/load/scenarios/baseline.js
      - uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: tests/load/reports/

  security-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:security
      - uses: actions/upload-artifact@v4
        with:
          name: security-test-results
          path: test-results/security/
```

## Data Models

### Test Data Management

```typescript
// tests/integration/fixtures/factories.ts
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'admin';
  platforms: Platform[];
}

export interface TestContent {
  id: string;
  userId: string;
  platform: Platform;
  type: 'post' | 'story' | 'reel';
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: Date;
}

export interface TestMessage {
  id: string;
  userId: string;
  fanId: string;
  content: string;
  timestamp: Date;
}

// Factory functions
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: generateId(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    role: 'creator',
    platforms: [],
    ...overrides,
  };
}

export function createTestContent(overrides?: Partial<TestContent>): TestContent {
  return {
    id: generateId(),
    userId: '',
    platform: 'instagram',
    type: 'post',
    status: 'draft',
    ...overrides,
  };
}
```

### Test Database Schema

```typescript
// tests/integration/setup/test-database.ts
export interface TestDatabase {
  users: Map<string, TestUser>;
  content: Map<string, TestContent>;
  messages: Map<string, TestMessage>;
  sessions: Map<string, Session>;
}

export async function setupTestDatabase(): Promise<TestDatabase> {
  // Initialize test database
}

export async function seedTestData(db: TestDatabase): Promise<void> {
  // Seed with test data
}

export async function cleanupTestDatabase(db: TestDatabase): Promise<void> {
  // Clean up test data
}
```

## Error Handling

### Test Error Handling Strategy

```typescript
// tests/integration/setup/error-handling.ts
export class TestError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, any>
  ) {
    super(message);
    this.name = 'TestError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }
  
  throw new TestError('Max retries exceeded', {
    maxRetries,
    lastError: lastError!.message,
  });
}

export function handleTestFailure(
  error: Error,
  context: Record<string, any>
): void {
  console.error('Test failed:', {
    error: error.message,
    stack: error.stack,
    context,
  });
  
  // Capture additional debugging info
  if (process.env.CI) {
    // Upload logs, screenshots, etc.
  }
}
```

### E2E Error Handling

```typescript
// tests/e2e/setup/error-handling.ts
export async function captureFailureArtifacts(
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  // Capture screenshot
  await page.screenshot({
    path: `${testInfo.outputDir}/failure-${Date.now()}.png`,
    fullPage: true,
  });
  
  // Capture console logs
  const logs = await page.evaluate(() => {
    return (window as any).__testLogs || [];
  });
  
  // Capture network requests
  const requests = await page.evaluate(() => {
    return (window as any).__networkRequests || [];
  });
  
  // Save artifacts
  await testInfo.attach('console-logs', {
    body: JSON.stringify(logs, null, 2),
    contentType: 'application/json',
  });
  
  await testInfo.attach('network-requests', {
    body: JSON.stringify(requests, null, 2),
    contentType: 'application/json',
  });
}
```

## Testing Strategy

### Test Prioritization

**P0 - Critical (Must Pass)**:
- Authentication flows
- Payment/revenue operations
- Data integrity operations
- Rate limiting enforcement
- Security validations

**P1 - High Priority**:
- Content creation/publishing
- Message sending/receiving
- Dashboard loading
- Analytics data accuracy
- OAuth integrations

**P2 - Medium Priority**:
- UI interactions
- Search functionality
- Filtering/sorting
- Export operations
- Notification delivery

**P3 - Low Priority**:
- Visual regression
- Performance optimizations
- Edge cases
- Deprecated features

### Test Execution Strategy

**On Every Commit**:
- Unit tests (fast, < 2 minutes)
- Critical integration tests (P0 only)
- Linting and type checking

**On Pull Request**:
- All integration tests
- Smoke E2E tests (critical paths)
- Security tests

**On Merge to Main**:
- Full E2E test suite
- Visual regression tests
- Performance benchmarks

**Nightly**:
- Full test suite
- Load tests (baseline)
- Extended E2E tests

**Weekly**:
- Stress tests
- Soak tests
- Security audits

### Performance Baselines

```typescript
// tests/load/config/thresholds.js
export const PERFORMANCE_BASELINES = {
  api: {
    dashboard: { p95: 300, p99: 500 },
    content: { p95: 400, p99: 800 },
    messages: { p95: 200, p99: 400 },
    revenue: { p95: 500, p99: 1000 },
    analytics: { p95: 1000, p99: 2000 },
  },
  pages: {
    dashboard: { p95: 1500, p99: 3000 },
    content: { p95: 2000, p99: 4000 },
    messages: { p95: 1000, p99: 2000 },
  },
  database: {
    queries: { p95: 50, p99: 100 },
    writes: { p95: 100, p99: 200 },
  },
};
```

## Documentation

### Test Documentation Structure

```
docs/testing/
├── README.md                    # Testing overview
├── integration-tests.md         # Integration test guide
├── e2e-tests.md                 # E2E test guide
├── load-tests.md                # Load test guide
├── writing-tests.md             # How to write tests
├── test-data.md                 # Test data management
├── ci-cd.md                     # CI/CD integration
├── troubleshooting.md           # Common issues
└── examples/
    ├── integration-example.md
    ├── e2e-example.md
    └── load-test-example.md
```

### Test Reporting

```typescript
// tests/utils/reporting.ts
export interface TestReport {
  suite: 'integration' | 'e2e' | 'load';
  timestamp: Date;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: CoverageReport;
  performance?: PerformanceReport;
}

export async function generateTestReport(
  results: TestResult[]
): Promise<TestReport> {
  // Generate comprehensive test report
}

export async function publishTestReport(
  report: TestReport
): Promise<void> {
  // Publish to dashboard, Slack, etc.
}
```

## Security Considerations

### Test Security

1. **Test Data Isolation**: Each test uses isolated test data
2. **Credential Management**: Test credentials stored in secrets
3. **API Mocking**: External APIs mocked to prevent data leakage
4. **Cleanup**: All test data cleaned up after execution
5. **Rate Limiting**: Tests respect rate limits
6. **Authentication**: Tests use proper authentication flows

### Security Test Coverage

```typescript
// tests/integration/security/security-tests.ts
describe('Security Tests', () => {
  test('Unauthorized access returns 401', async () => {
    // Test unauthorized access
  });
  
  test('Cross-user access blocked', async () => {
    // Test authorization
  });
  
  test('Rate limiting enforced', async () => {
    // Test rate limiting
  });
  
  test('SQL injection prevented', async () => {
    // Test input validation
  });
  
  test('XSS attacks prevented', async () => {
    // Test XSS prevention
  });
});
```

## Performance Considerations

### Test Performance Optimization

1. **Parallel Execution**: Run tests in parallel where possible
2. **Test Isolation**: Each test is independent
3. **Fast Feedback**: Critical tests run first
4. **Caching**: Cache dependencies and build artifacts
5. **Selective Testing**: Run only affected tests when possible

### Resource Management

```typescript
// tests/integration/setup/resource-management.ts
export class ResourcePool<T> {
  private pool: T[] = [];
  private inUse = new Set<T>();
  
  async acquire(): Promise<T> {
    // Acquire resource from pool
  }
  
  async release(resource: T): Promise<void> {
    // Release resource back to pool
  }
  
  async cleanup(): Promise<void> {
    // Cleanup all resources
  }
}

// Usage
const userPool = new ResourcePool<TestUser>();
const dbPool = new ResourcePool<TestDatabase>();
```

## Monitoring and Observability

### Test Metrics

```typescript
// tests/utils/metrics.ts
export interface TestMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  databaseQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

export async function collectTestMetrics(): Promise<TestMetrics> {
  // Collect test execution metrics
}

export async function reportMetrics(
  metrics: TestMetrics
): Promise<void> {
  // Report to monitoring system
}
```

### Test Observability

1. **Logging**: Structured logging for all test operations
2. **Tracing**: Distributed tracing for E2E tests
3. **Metrics**: Performance metrics collection
4. **Alerts**: Automated alerts for test failures
5. **Dashboards**: Real-time test execution dashboards

## Migration Strategy

### Phase 1: Integration Tests (Week 1)
1. Set up enhanced integration test infrastructure
2. Implement API endpoint tests
3. Implement service integration tests
4. Implement security tests
5. Achieve 85% coverage target

### Phase 2: E2E Tests (Week 2)
1. Set up enhanced Playwright configuration
2. Implement critical workflow tests
3. Implement smoke tests
4. Set up CI/CD integration
5. Achieve critical path coverage

### Phase 3: Load Tests (Week 3)
1. Set up k6 infrastructure
2. Implement baseline load tests
3. Implement peak traffic tests
4. Implement spike/stress tests
5. Establish performance baselines

### Phase 4: CI/CD Integration (Week 3-4)
1. Configure GitHub Actions workflows
2. Set up test reporting
3. Configure automated alerts
4. Set up test dashboards
5. Document processes

## Success Metrics

### Coverage Metrics
- Integration test coverage: 85%+
- E2E critical path coverage: 100%
- API endpoint coverage: 90%+
- Security test coverage: 100% of auth/authz flows

### Performance Metrics
- Test suite execution time: < 15 minutes
- E2E test execution time: < 30 minutes
- Load test baseline: 1000 concurrent users
- API response time p95: < 500ms

### Quality Metrics
- Test flakiness rate: < 1%
- False positive rate: < 2%
- Test maintenance time: < 10% of dev time
- Bug escape rate: < 5%

### CI/CD Metrics
- Build success rate: > 95%
- Deployment frequency: Daily
- Mean time to recovery: < 1 hour
- Change failure rate: < 10%
