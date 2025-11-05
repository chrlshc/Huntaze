# Load Shedding & Overload Management Documentation

## Overview
The load shedding system protects SLOs during overload by intelligently rejecting non-critical requests early, preventing cascade failures and maintaining system stability.

## Components

### 1. Admission Control
Edge-level request filtering based on system resources and load conditions.

**Triggers:**
- CPU usage thresholds (70% warning, 80% shed best-effort, 90% shed important)
- Memory usage thresholds (75% warning, 85% shed best-effort, 92% shed important)
- Latency thresholds (P95 > 1s, P99 > 2s)
- Queue depth limits

**Priority Classes:**
- **Critical**: Authentication, payments, health checks (never shed)
- **Important**: User operations, content creation (shed at high load)
- **Best-effort**: Analytics, reports (shed first)

### 2. Client-side Throttling
Adaptive rate limiting based on server responses and load conditions.

**Features:**
- Exponential backoff on 429/503 responses
- Circuit breaker integration
- Jitter and randomization
- Recovery based on success rate

### 3. Middleware Integration
Next.js middleware for seamless load shedding integration.

**Capabilities:**
- Automatic request classification
- Custom headers for debugging
- Path-based exclusions
- Metrics collection

## Configuration

### Admission Control
```json
{
  "admissionControl": {
    "enabled": true,
    "triggers": {
      "cpu": {
        "warning": 70,
        "shedBestEffort": 80,
        "shedImportant": 90,
        "emergency": 95
      }
    }
  }
}
```

### Client Throttling
```json
{
  "clientThrottling": {
    "api": {
      "enabled": true,
      "baseDelay": 1000,
      "maxDelay": 30000,
      "throttleThreshold": 20
    }
  }
}
```

## Usage

### Initialization
```typescript
import { initializeLoadShedding } from '@/lib/load-shedding/init';
await initializeLoadShedding();
```

### Manual Priority Setting
```typescript
// Set request priority
const response = await fetch('/api/endpoint', {
  headers: {
    'X-Priority-Class': 'CRITICAL'
  }
});
```

### Client Throttling
```typescript
import { executeWithAPIThrottling } from '@/lib/load-shedding/clientThrottling';

const result = await executeWithAPIThrottling(async () => {
  return await fetch('/api/data');
});
```

## Load Testing

### Run Load Tests
```bash
# Normal load baseline
npm run load-test:normal

# Test 2x load
npm run load-test:2x

# Test 3x load
npm run load-test:3x

# Spike test
npm run load-test:spike
```

### Validation
```bash
# Validate load shedding system
node scripts/validate-load-shedding.js

# Check system status
npm run load-shedding:status
```

## Monitoring

### Key Metrics
- **Shed Level**: Current load shedding level (0-4)
- **Rejection Rate**: % of requests rejected by priority class
- **Throttling Status**: Client-side throttling activity
- **Resource Utilization**: CPU, memory, latency metrics

### API Endpoints
- `GET /api/load-shedding/status` - System status and metrics
- `POST /api/load-shedding/status` - Configuration updates

### Dashboard
Access the load shedding dashboard at: `/load-shedding/dashboard`

## Best Practices

### Priority Classification
1. **Critical**: Never shed, essential for system operation
2. **Important**: Shed only under high load, user-facing operations
3. **Best-effort**: Shed first, background/analytics operations

### Load Testing
1. **Baseline**: Establish normal load patterns
2. **Gradual Increase**: Test 2x, 3x, 5x normal load
3. **Spike Testing**: Sudden load increases
4. **Sustained Load**: Long-duration overload scenarios

### Monitoring
1. **Real-time Alerts**: Set up alerts for shed level changes
2. **SLO Tracking**: Monitor P95/P99 latency during load shedding
3. **Client Behavior**: Track throttling effectiveness
4. **Resource Correlation**: Correlate shedding with resource usage

## Troubleshooting

### Common Issues
1. **Excessive shedding**: Check resource thresholds and system capacity
2. **Client throttling loops**: Verify backoff configuration
3. **Priority misclassification**: Review endpoint priority mapping
4. **Metrics collection**: Ensure monitoring system is functioning

### Debug Commands
```bash
# Check load shedding status
curl http://localhost:3000/api/load-shedding/status?metrics=true

# Test specific priority class
curl -H "X-Priority-Class: CRITICAL" http://localhost:3000/api/health

# Run validation
node scripts/validate-load-shedding.js
```

## Integration

### With Monitoring (Task 4)
- Load shedding metrics integrate with Golden Signals dashboard
- Overload alerts feed into existing alerting system
- SLO compliance includes load shedding effectiveness

### With Recovery (Task 5)
- Circuit breakers coordinate with admission control
- Auto-healing includes overload recovery
- Graceful degradation works with priority classes

### With Deployments (Task 6)
- Canary deployments monitor load shedding impact
- Error budget includes load shedding in calculations
- Blue-green switches consider current load conditions

## Performance Targets

### Under 2x Load
- P95 latency ≤ SLO targets
- Shed rate < 20% for best-effort traffic
- No critical request failures

### Under 3x Load
- P95 latency ≤ 1.5x SLO targets
- Shed rate < 50% for non-critical traffic
- System remains stable

### Under 5x Load
- System does not crash
- Critical requests continue to be served
- Graceful degradation maintains core functionality
