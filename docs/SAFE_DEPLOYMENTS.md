# Safe Deployments Documentation

## Overview
The safe deployments system provides enterprise-grade release safety through canary deployments, blue-green deployments, and error budget gating.

## Deployment Strategies

### 1. Canary Deployments
Progressive traffic rollouts with automated analysis and rollback.

**Use Cases:**
- API services with high traffic
- Services with complex business logic
- When you want gradual risk exposure

**Traffic Progression:** 5% → 25% → 50% → 100%

**Example:**
```bash
# Start canary deployment
npm run deploy:canary api-gateway v1.2.3 -- --watch

# Manual promotion
node scripts/deploy-cli.js promote <deployment-id>

# Manual rollback
node scripts/deploy-cli.js rollback <deployment-id> "Performance issues"
```

### 2. Blue-Green Deployments
Zero-downtime deployments with instant traffic switching.

**Use Cases:**
- Database schema changes
- Infrastructure updates
- Services requiring full validation before traffic

**Example:**
```bash
# Start blue-green deployment
npm run deploy:blue-green user-service v2.0.0

# Manual traffic switch
node scripts/deploy-cli.js switch <deployment-id>

# Rollback if needed
node scripts/deploy-cli.js rollback <deployment-id> "Health checks failed"
```

### 3. Error Budget Gating
Prevents deployments when SLO error budget is exhausted.

**Thresholds:**
- **Freeze:** < 10% error budget remaining
- **Warning:** < 25% error budget remaining
- **Critical Fixes Only:** < 5% error budget remaining

**Example:**
```bash
# Check error budget before deployment
node scripts/deploy-cli.js status api-gateway

# Deploy critical fix even when frozen
npm run deploy:canary api-gateway v1.2.4 -- --critical
```

## Configuration

### Service Configuration
Edit `deployment.config.json` to customize deployment strategies per service:

```json
{
  "strategies": {
    "canary": {
      "api-gateway": {
        "trafficSteps": [5, 25, 50, 100],
        "analysisDuration": 300,
        "autoPromote": true
      }
    }
  }
}
```

### Error Budget Configuration
```json
{
  "errorBudget": {
    "services": {
      "api-gateway": {
        "sloTarget": 0.999,
        "freezeThreshold": 0.05
      }
    }
  }
}
```

## Monitoring & Metrics

### Success Criteria (Auto-Promotion)
- Error rate < 1%
- P95 latency < 500ms
- P99 latency < 1000ms
- Success rate > 99%
- Minimum analysis duration: 5 minutes

### Rollback Triggers (Auto-Rollback)
- Error rate > 5%
- P95 latency > 1000ms
- P99 latency > 2000ms
- Success rate < 95%
- Health checks < 80%

### Dashboard
Access the deployments dashboard at: `/deployments/dashboard`

## CLI Commands

### Deploy
```bash
# Canary deployment with monitoring
node scripts/deploy-cli.js deploy api-gateway v1.2.3 canary --watch

# Blue-green deployment
node scripts/deploy-cli.js deploy user-service v2.0.0 blue-green

# Critical fix deployment
node scripts/deploy-cli.js deploy api-gateway v1.2.4 canary --critical
```

### Monitor
```bash
# Check overall status
node scripts/deploy-cli.js status

# Check specific service
node scripts/deploy-cli.js status api-gateway
```

### Control
```bash
# Manual rollback
node scripts/deploy-cli.js rollback <deployment-id> "Performance degradation"

# Check deployment status
curl http://localhost:3000/api/deployments/status
```

## Best Practices

### Canary Deployments
1. **Start Small:** Begin with 5% traffic
2. **Monitor Closely:** Watch metrics during each stage
3. **Have Rollback Ready:** Prepare rollback plan before deployment
4. **Test Thoroughly:** Validate in staging first

### Blue-Green Deployments
1. **Validate Green:** Ensure green environment is fully healthy
2. **Quick Switch:** Keep traffic switch time under 1 second
3. **Monitor Post-Switch:** Watch for issues after traffic switch
4. **Keep Blue Ready:** Maintain blue environment for quick rollback

### Error Budget Management
1. **Respect Budgets:** Don't deploy when budget is exhausted
2. **Fix Issues First:** Address reliability problems before new features
3. **Monitor Consumption:** Track error budget usage trends
4. **Plan Capacity:** Reserve budget for emergency fixes

## Troubleshooting

### Common Issues
1. **Deployment blocked by error budget:** Wait for budget recovery or deploy critical fix
2. **Canary stuck at stage:** Check metrics and consider manual promotion/rollback
3. **Blue-green validation failed:** Review health checks and fix issues
4. **Rollback not working:** Check rollback triggers and manual override

### Debug Commands
```bash
# Check deployment system status
npm run deploy:status

# Test deployment system
npm run test:safe-deployments

# View deployment logs
curl http://localhost:3000/api/deployments/status?history=true&metrics=true
```

## Integration

### CI/CD Pipeline Integration
```yaml
# Example GitHub Actions workflow
- name: Deploy with Canary
  run: |
    deployment_id=$(node scripts/deploy-cli.js deploy $SERVICE $VERSION canary)
    echo "deployment_id=$deployment_id" >> $GITHUB_OUTPUT

- name: Monitor Deployment
  run: node scripts/deploy-cli.js watch ${{ steps.deploy.outputs.deployment_id }}
```

### Prometheus Metrics
The system exports metrics for monitoring:
- `deployment_duration_seconds`
- `deployment_success_rate`
- `rollback_duration_seconds`
- `error_budget_remaining`

## Security

### Deployment Approvals
Production deployments can require manual approval:
```json
{
  "environments": {
    "production": {
      "approvalRequired": true
    }
  }
}
```

### Access Control
Implement role-based access control for deployment operations:
- **Developers:** Can deploy to staging
- **SREs:** Can deploy to production and perform rollbacks
- **On-call:** Can deploy critical fixes during incidents
