# Recovery System Documentation

## Overview
The recovery system provides comprehensive resilience mechanisms to ensure system reliability and automatic healing from failures.

## Components

### 1. Circuit Breakers
- **Purpose**: Prevent cascade failures by monitoring service health
- **States**: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
- **Configuration**: `recovery.config.json`

### 2. Retry Manager
- **Purpose**: Handle transient failures with intelligent retry logic
- **Features**: Exponential backoff, jitter, configurable conditions
- **Policies**: Database, cache, external API specific

### 3. Health Checker
- **Purpose**: Continuous service health monitoring
- **Checks**: Database, cache, memory, disk
- **Types**: Readiness probes, liveness probes, deep health checks

### 4. Graceful Degradation
- **Purpose**: Maintain core functionality during service failures
- **Levels**: None (0) → Minimal (1) → Moderate (2) → Severe (3) → Emergency (4)
- **Actions**: Disable features, use cache, simplify UI, reduce quality

### 5. Auto-Healing
- **Purpose**: Automatic recovery from common failure scenarios
- **Actions**: Database reconnect, cache restart, memory cleanup
- **Policies**: Cooldown periods, max attempts, priority-based execution

## Usage

### Initialization
```typescript
import { initializeRecoverySystem } from '@/lib/recovery/init';
await initializeRecoverySystem();
```

### Circuit Breaker
```typescript
import { executeWithCircuitBreaker } from '@/lib/recovery/circuitBreaker';

const result = await executeWithCircuitBreaker('database', async () => {
  return await db.query('SELECT * FROM users');
});
```

### Retry Logic
```typescript
import { retryDatabaseOperation } from '@/lib/recovery/retryManager';

const result = await retryDatabaseOperation(async () => {
  return await db.query('SELECT * FROM users');
});
```

### Health Checks
```typescript
import { checkSystemHealth } from '@/lib/recovery/healthChecker';

const health = await checkSystemHealth();
console.log(`System status: ${health.status}`);
```

### Graceful Degradation
```typescript
import { isFeatureEnabled } from '@/lib/recovery/gracefulDegradation';

if (isFeatureEnabled('analytics_real_time')) {
  // Show real-time analytics
} else {
  // Show cached analytics
}
```

### Auto-Healing
```typescript
import { triggerAutoHealing } from '@/lib/recovery/autoHealing';

// Trigger specific healing action
await triggerAutoHealing('database_reconnect');

// Trigger all applicable actions
await triggerAutoHealing();
```

## API Endpoints

### Recovery Status
- **GET** `/api/recovery/status` - Get recovery system status
- **POST** `/api/recovery/status` - Trigger recovery actions

### Parameters
- `?history=true` - Include healing history
- `?metrics=true` - Include detailed metrics

### Actions
- `trigger_healing` - Execute healing actions
- `reset_circuit_breaker` - Reset circuit breakers
- `reset_retry_metrics` - Reset retry metrics
- `force_degradation_check` - Force degradation evaluation

## Dashboard

Access the recovery dashboard at: `/recovery/dashboard`

Features:
- Real-time system status
- Circuit breaker monitoring
- Health check results
- Auto-healing history
- Manual action triggers

## Configuration

Edit `recovery.config.json` to customize:
- Circuit breaker thresholds
- Retry policies
- Health check intervals
- Degradation rules
- Auto-healing actions

## Monitoring

The recovery system integrates with the monitoring system to provide:
- Recovery metrics collection
- Alert generation
- Performance tracking
- Historical analysis

## Best Practices

1. **Circuit Breakers**: Set appropriate failure thresholds for each service
2. **Retry Logic**: Use exponential backoff with jitter
3. **Health Checks**: Monitor critical dependencies
4. **Degradation**: Define clear degradation levels and actions
5. **Auto-Healing**: Implement cooldown periods to prevent thrashing

## Troubleshooting

### Common Issues
1. **Circuit breaker stuck open**: Check service health and reset manually
2. **Excessive retries**: Adjust retry policies or fix underlying issues
3. **Health checks failing**: Verify service connectivity and timeouts
4. **Degradation not working**: Check rule conditions and priorities

### Debug Commands
```bash
# Check recovery status
npm run recovery:status

# Test recovery system
npm run recovery:test

# Open recovery dashboard
npm run recovery:dashboard
```
