# Design Document

## Overview

This design document outlines the technical approach to make the Huntaze Onboarding system production-ready by implementing comprehensive testing, security hardening, observability, backup strategies, and GDPR compliance. The system is currently functional in staging but requires 23 P0 items to be completed before handling real production traffic.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Feature Flags  │  Kill Switch  │  Rate Limiting  │  CSRF   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Existing Onboarding System                 │
├─────────────────────────────────────────────────────────────┤
│  API Routes  │  Middleware  │  Repositories  │  Components  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Observability Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Metrics  │  Tracing  │  Logging  │  Alerting  │  Dashboard │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
User Request
    ↓
Feature Flag Check → Kill Switch Check
    ↓
Rate Limiter → CSRF Validation
    ↓
Onboarding Middleware (existing)
    ↓
API Handler (existing)
    ↓
Repository Layer (existing)
    ↓
Database (with backups)
    ↓
Analytics & Tracing
```

## Components and Interfaces

### 1. Testing Infrastructure

#### Unit Test Framework

**Technology**: Jest with TypeScript support

**Structure**:
```
tests/unit/onboarding/
├── progress-calculation.test.ts
├── gating-logic.test.ts
├── step-transitions.test.ts
├── repositories/
│   ├── step-definitions.test.ts
│   ├── user-onboarding.test.ts
│   └── events.test.ts
└── middleware/
    └── onboarding-gating.test.ts
```

**Coverage Requirements**:
- 80% line coverage minimum
- 80% branch coverage minimum
- CI integration with fail-fast on coverage drop

#### Integration Test Framework

**Technology**: Jest with supertest for API testing

**Structure**:
```
tests/integration/api/onboarding/
├── get-onboarding.test.ts
├── patch-step.test.ts
├── snooze.test.ts
├── gating-409.test.ts
└── flows/
    ├── skip-flow.test.ts
    ├── done-flow.test.ts
    └── snooze-flow.test.ts
```

**Test Database**: Separate test database with migrations and seed data

#### E2E Test Framework

**Technology**: Playwright

**Structure**:
```
tests/e2e/onboarding/
├── new-user-flow.spec.ts
├── skip-flow.spec.ts
├── gating-flow.spec.ts
└── mobile-flow.spec.ts
```

**Browsers**: Chromium, Firefox, WebKit (mobile)

### 2. Feature Flag System

**Interface**:
```typescript
interface OnboardingFlags {
  enabled: boolean;
  rolloutPercentage: number;  // 0-100
  markets: string[];          // ['FR', 'US'] or ['*']
  userWhitelist: string[];    // User IDs
}

function isOnboardingEnabled(
  userId: string,
  market: string
): Promise<boolean>
```

**Storage**: Redis for fast access with fallback to environment variables

**Rollout Strategy**:
- 0% → Internal testing
- 5% → Early adopters
- 25% → Validation phase
- 50% → Monitoring phase
- 100% → Full rollout

**Consistent Hashing**: Use user ID hash to ensure same user always gets same experience

### 3. Kill Switch System

**Interface**:
```typescript
function checkKillSwitch(): Promise<boolean>
function activateKillSwitch(): Promise<void>
function deactivateKillSwitch(): Promise<void>
```

**Storage**: Redis with pub/sub for instant propagation

**Behavior When Activated**:
- Disable all gating middleware (fail-open)
- Hide all onboarding UI components
- Return empty/default responses from APIs
- Log all kill switch activations

**Access Control**: Admin API endpoint with authentication

### 4. Security Layer

#### Rate Limiting

**Technology**: Redis-based rate limiter with sliding window

**Limits**:
```typescript
const RATE_LIMITS = {
  'PATCH /api/onboarding/steps/:id': {
    window: 60_000,  // 1 minute
    max: 20
  },
  'POST /api/onboarding/snooze': {
    window: 86400_000,  // 1 day
    max: 3
  }
}
```

**Key Strategy**: `rate_limit:{userId}:{endpoint}` or `rate_limit:{ip}:{endpoint}`

#### CSRF Protection

**Strategy**: Double-submit cookie pattern

**Implementation**:
```typescript
// Generate token on session creation
const csrfToken = crypto.randomUUID();
setCookie('csrf-token', csrfToken, { 
  httpOnly: true, 
  secure: true, 
  sameSite: 'lax' 
});

// Validate on mutative requests
function validateCSRF(req: Request): boolean {
  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = getCookie(req, 'csrf-token');
  return headerToken === cookieToken;
}
```

#### Security Headers

**Configuration** (next.config.js):
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]
```

#### Role-Based Access Control

**Middleware**:
```typescript
function requireOwner(req: Request): void {
  if (req.user.role !== 'owner') {
    throw new ForbiddenError('Owner role required');
  }
}

// Apply to sensitive routes
app.patch('/api/onboarding/steps/payments', requireOwner, handler);
```

**Audit Logging**:
```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
}
```

### 5. Observability Infrastructure

#### Metrics Collection

**Technology**: Prometheus-compatible metrics

**Key Metrics**:
```typescript
// Latency
onboarding_api_latency_ms{route, method, status}

// Error rates
onboarding_api_errors_total{route, method, status}

// 409 responses
onboarding_gating_blocked_total{route, step}

// Cache performance
onboarding_cache_hits_total
onboarding_cache_misses_total

// Active users
onboarding_active_users_gauge
```

#### Service Level Objectives

**Definitions**:
```yaml
slos:
  - name: API Latency
    metric: onboarding_api_latency_ms_p95
    target: 300
    window: 5m
    
  - name: Error Rate
    metric: onboarding_api_errors_rate
    target: 0.005  # 0.5%
    window: 5m
    
  - name: Availability
    metric: onboarding_uptime_percent
    target: 99.9
    window: 30d
```

#### Dashboard Layout

**Sections**:
1. Overview: Progress, active users, completion rate
2. Performance: Latency percentiles, throughput
3. Errors: 4xx/5xx rates, error types
4. Gating: 409 rates by step, modal interactions
5. Infrastructure: Cache hit rate, DB query time

#### Alerting Rules

**Critical Alerts** (PagerDuty):
- 5xx rate > 1% for 5 minutes
- p95 latency > 1000ms for 5 minutes
- Availability < 99% for 10 minutes

**Warning Alerts** (Slack):
- 5xx rate > 0.5% for 10 minutes
- p95 latency > 500ms for 10 minutes
- 409 rate > 10% for 10 minutes
- Cache hit rate < 80% for 15 minutes

#### Distributed Tracing

**Implementation**:
```typescript
// Middleware to generate/propagate correlation ID
function correlationMiddleware(req: Request, res: Response, next: Function) {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  // Add to logger context
  req.logger = logger.child({ correlationId });
  
  next();
}

// Use in all logs and queries
logger.info('Step updated', { 
  userId, 
  stepId, 
  correlationId: req.correlationId 
});
```

### 6. Backup and Recovery

#### Backup Strategy

**Pre-Migration Backup**:
```bash
#!/bin/bash
BACKUP_FILE="backups/pre-onboarding-$(date +%Y%m%d-%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE
```

**Continuous Backups**:
- Daily snapshots at 2 AM UTC
- Point-in-time recovery enabled
- 30-day retention policy
- Weekly backup integrity verification

#### Rollback Procedure

**SQL Rollback Script**:
```sql
-- lib/db/migrations/rollback-onboarding.sql
BEGIN;

-- Drop tables in reverse order
DROP TABLE IF EXISTS onboarding_events CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;
DROP TABLE IF EXISTS onboarding_step_definitions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_onboarding_progress CASCADE;
DROP FUNCTION IF EXISTS has_step_done CASCADE;
DROP FUNCTION IF EXISTS can_transition_to CASCADE;

COMMIT;
```

**Rollback Steps**:
1. Activate kill switch
2. Stop application
3. Restore database backup
4. Deploy previous application version
5. Verify system health
6. Deactivate kill switch
7. Monitor for issues

**Time Target**: Complete rollback in < 15 minutes

#### Migration Testing

**Dry-Run Process**:
```bash
# 1. Copy production data to staging (anonymized)
pg_dump $PROD_DB | anonymize-pii > staging-dump.sql
psql $STAGING_DB < staging-dump.sql

# 2. Run migration
psql $STAGING_DB < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql

# 3. Verify
psql $STAGING_DB -c "SELECT COUNT(*) FROM onboarding_step_definitions;"
psql $STAGING_DB -c "SELECT * FROM onboarding_step_definitions LIMIT 5;"

# 4. Seed data
node scripts/seed-huntaze-onboarding.js

# 5. Run integration tests
npm run test:integration
```

### 7. Step Versioning System

#### Version Migration

**Interface**:
```typescript
async function migrateStepVersion(
  stepId: string,
  fromVersion: number,
  toVersion: number
): Promise<void>
```

**Process**:
1. Create new version in `onboarding_step_definitions`
2. Copy completed user progress to new version
3. Reset in-progress steps to `todo`
4. Recalculate all user progress percentages
5. Mark old version as inactive (`active_to = NOW()`)

**Transaction Safety**: All operations in single transaction

#### Optimistic Locking

**Schema Addition**:
```sql
ALTER TABLE user_onboarding 
ADD COLUMN row_version INTEGER DEFAULT 1;
```

**Update Logic**:
```sql
UPDATE user_onboarding
SET 
  status = $1,
  row_version = row_version + 1,
  updated_at = NOW()
WHERE user_id = $2 
  AND step_id = $3 
  AND row_version = $4
RETURNING *;
```

**Conflict Handling**:
- If `row_version` mismatch → Return 409 with current state
- Client can retry with updated version
- Prevents lost updates from concurrent requests

### 8. GDPR Compliance

#### Data Processing Registry

**Document Structure**:
```markdown
## Processing Activity: Onboarding Progress Tracking

- **Purpose**: Guide new users through account setup
- **Legal Basis**: Legitimate interest
- **Data Categories**: User ID, step completion status, timestamps
- **Retention**: 2 years after last activity
- **Recipients**: Internal product team
- **Transfers**: None outside EU
- **Security**: Encrypted at rest and in transit
```

#### Data Retention

**Cleanup Script**:
```typescript
// scripts/cleanup-old-onboarding-data.ts
async function cleanupOldData() {
  const retentionDays = 365;
  
  await db.query(`
    DELETE FROM onboarding_events
    WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
  `);
  
  // Log deletion
  logger.info('Cleaned up old onboarding events', { retentionDays });
}
```

**Cron Schedule**: Daily at 2 AM UTC

#### Data Subject Rights

**Export Endpoint**:
```typescript
// app/api/admin/dsr/export/route.ts
export async function POST(req: Request) {
  const { userId } = await req.json();
  
  const data = {
    onboarding_progress: await db('user_onboarding')
      .where({ user_id: userId }),
    events: await db('onboarding_events')
      .where({ user_id: userId })
  };
  
  return Response.json(data);
}
```

**Deletion Endpoint**:
```typescript
// app/api/admin/dsr/delete/route.ts
export async function POST(req: Request) {
  const { userId } = await req.json();
  
  await db.transaction(async (trx) => {
    await trx('onboarding_events').where({ user_id: userId }).delete();
    await trx('user_onboarding').where({ user_id: userId }).delete();
  });
  
  return Response.json({ success: true });
}
```

#### Cookie Consent

**Component**:
```typescript
// components/CookieConsent.tsx
export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('analytics_consent');
    if (stored) setConsent(stored === 'true');
  }, []);
  
  if (consent !== null) return null;
  
  return (
    <div className="cookie-banner">
      <p>Nous utilisons des cookies pour améliorer votre expérience.</p>
      <button onClick={() => handleConsent(true)}>Accepter</button>
      <button onClick={() => handleConsent(false)}>Refuser</button>
    </div>
  );
}
```

## Data Models

### Feature Flags

```typescript
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  markets: string[];
  userWhitelist: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Rate Limit State

```typescript
interface RateLimitState {
  key: string;
  count: number;
  windowStart: number;
  expiresAt: number;
}
```

### Audit Log

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata: Record<string, any>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}
```

### Metrics

```typescript
interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}
```

## Error Handling

### Error Types

```typescript
class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
  }
}

class CSRFError extends Error {
  constructor() {
    super('CSRF token validation failed');
  }
}

class FeatureDisabledError extends Error {
  constructor(public feature: string) {
    super(`Feature ${feature} is disabled`);
  }
}
```

### Error Responses

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  correlationId: string;
  retryAfter?: number;
  details?: any;
}
```

## Testing Strategy

### Unit Tests

**Focus**: Business logic, calculations, validations

**Mocking**: Database, Redis, external APIs

**Coverage Target**: 80% lines and branches

### Integration Tests

**Focus**: API endpoints, database interactions, middleware

**Setup**: Test database with migrations and seed data

**Cleanup**: Reset database after each test

### E2E Tests

**Focus**: User flows, UI interactions, cross-browser compatibility

**Setup**: Staging environment with test data

**Browsers**: Chromium (desktop), WebKit (mobile)

### Performance Tests

**Focus**: Latency, throughput, concurrent requests

**Tools**: k6 or Artillery

**Scenarios**:
- 100 concurrent users fetching onboarding
- 50 concurrent step updates
- Cache hit/miss ratios

## Deployment Strategy

### Phase 1: Testing (Week 1)
- Implement all unit tests
- Implement integration tests
- Implement E2E tests
- Achieve 80% coverage
- CI integration

### Phase 2: Security (Week 2)
- Implement feature flags
- Implement kill switch
- Implement rate limiting
- Implement CSRF protection
- Configure security headers
- Audit role permissions

### Phase 3: Observability (Week 2)
- Define SLOs
- Create dashboards
- Configure alerts
- Implement distributed tracing
- Test alerting

### Phase 4: Backup & Recovery (Week 3)
- Configure automated backups
- Create rollback scripts
- Test rollback procedure
- Dry-run migration on staging
- Document recovery procedures

### Phase 5: Versioning & GDPR (Week 3)
- Implement step versioning
- Add optimistic locking
- Test concurrent updates
- Create GDPR documentation
- Implement DSR endpoints
- Add cookie consent

### Phase 6: Production Rollout
- 0% rollout (internal testing)
- 5% rollout (early adopters)
- Monitor metrics and alerts
- 25% rollout (validation)
- 50% rollout (monitoring)
- 100% rollout (full deployment)

## Monitoring and Maintenance

### Daily Checks
- Review error rates
- Check SLO compliance
- Verify backup completion
- Review audit logs

### Weekly Checks
- Analyze performance trends
- Review feature flag usage
- Test backup restoration
- Update GDPR documentation

### Monthly Checks
- Review and update SLOs
- Analyze user completion rates
- Optimize slow queries
- Update security headers

## Success Criteria

- ✅ 80% test coverage achieved
- ✅ All security measures implemented
- ✅ SLOs defined and monitored
- ✅ Backup and rollback tested
- ✅ GDPR compliance documented
- ✅ Zero critical incidents in first month
- ✅ p95 latency < 300ms
- ✅ Error rate < 0.5%
- ✅ Availability > 99.9%
