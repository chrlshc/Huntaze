# Design Document - AWS Security & Cost Optimization

## Overview

Cette feature étend le production hardening existant avec 4 optimisations stratégiques AWS. L'approche est modulaire : chaque composant peut être déployé indépendamment via CloudFormation/SAM, avec des scripts d'activation et de vérification. L'objectif est d'obtenir un ROI rapide (< 1 semaine) avec un effort minimal (< 4h total).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS Account (Huntaze)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Cost Management │         │  Security Center │             │
│  ├──────────────────┤         ├──────────────────┤             │
│  │ • AWS Budgets    │         │ • Security Hub   │             │
│  │ • Cost Anomaly   │────────▶│ • GuardDuty      │             │
│  │   Detection      │  Alert  │ • Findings       │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                        │
│           │                            │                        │
│           ▼                            ▼                        │
│  ┌─────────────────────────────────────────────┐               │
│  │         SNS Topic (Alerts)                  │               │
│  │  • Cost alerts                              │               │
│  │  • Security findings                        │               │
│  │  • WAF blocks                               │               │
│  │  • Backup failures                          │               │
│  └────────────────┬────────────────────────────┘               │
│                   │                                             │
│                   ▼                                             │
│         Email / Slack / PagerDuty                               │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │   API Gateway    │────────▶│       WAF        │            │
│  │  (REST API)      │         │  • Rate limits   │            │
│  │                  │         │  • IP blocking   │            │
│  └──────────────────┘         │  • Attack rules  │            │
│                                └──────────────────┘            │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │   RDS Instance   │────────▶│  Automated       │            │
│  │  (PostgreSQL)    │         │  Backups         │            │
│  │  • PITR enabled  │         │  • 7-day retain  │            │
│  │  • Auto backups  │         │  • Monthly test  │            │
│  └──────────────────┘         └──────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Integration with Existing Stack

Le design s'intègre avec l'infrastructure existante définie dans `sam/template.yaml` :

- Réutilise le SNS topic `ErrorRateAlarmTopic` pour les nouvelles alertes
- Étend le CloudWatch Dashboard `huntaze-prisma-migration` avec de nouvelles métriques
- S'appuie sur les tags existants pour le cost tracking
- Utilise les mêmes conventions de nommage (`huntaze-*`)

## Components and Interfaces

### 1. Cost Monitoring Component

#### AWS Budgets

**Resource Type:** `AWS::Budgets::Budget`

**Configuration:**
```yaml
BudgetAmount: 100  # USD per month
TimeUnit: MONTHLY
BudgetType: COST
Thresholds:
  - 50%  # Warning
  - 80%  # Alert
  - 100% # Critical
```

**Notifications:**
- Email via SNS topic existant
- Inclut breakdown par service
- Forecast si dépassement prévu

#### Cost Anomaly Detection

**Resource Type:** `AWS::CE::AnomalyMonitor` + `AWS::CE::AnomalySubscription`

**Configuration:**
```yaml
MonitorType: DIMENSIONAL
MonitorDimension: SERVICE
Threshold: 
  Amount: 10  # USD
  Type: ABSOLUTE_VALUE
```

**Detection Logic:**
- Machine learning AWS natif
- Détection basée sur patterns historiques
- Alerte si déviation > $10 ou > 20% de la normale

### 2. Security Posture Component

#### Security Hub

**Activation:** Via AWS CLI (pas de ressource CloudFormation)

**Standards:**
- AWS Foundational Security Best Practices
- CIS AWS Foundations Benchmark (optionnel)

**Integration:**
```bash
aws securityhub enable-security-hub \
    --enable-default-standards \
    --region us-east-1
```

**Findings Aggregation:**
- Centralisé dans Security Hub console
- Export vers SNS pour alertes critiques (severity >= 70)
- Dashboard CloudWatch avec métriques de conformité

#### GuardDuty

**Activation:** Via AWS CLI

**Detection Types:**
- Reconnaissance (port scanning, unusual API calls)
- Instance compromise (malware, crypto mining)
- Account compromise (credential exfiltration)
- Bucket compromise (suspicious S3 access)

**Configuration:**
```bash
aws guardduty create-detector \
    --enable \
    --finding-publishing-frequency FIFTEEN_MINUTES \
    --region us-east-1
```

**Alert Routing:**
- EventBridge rule pour findings severity HIGH/CRITICAL
- SNS notification immédiate
- Logs dans CloudWatch pour audit

### 3. API Protection Component

#### WAF Web ACL

**Resource Type:** `AWS::WAFv2::WebACL`

**Rules (Priority Order):**

1. **IP Whitelist Rule** (Priority 1)
   - Action: Allow
   - IPs: Liste configurable (CI/CD, monitoring tools)

2. **Rate Limit Rule** (Priority 10)
   - Action: Block
   - Limit: 2000 requests per 5 minutes per IP
   - Scope: All requests

3. **AWS Managed Rules** (Priority 20-30)
   - Core Rule Set (SQL injection, XSS, etc.)
   - Known Bad Inputs
   - Amazon IP Reputation List

4. **Geo Blocking** (Priority 40, optionnel)
   - Block countries with no legitimate traffic

**Association:**
```yaml
WebACLAssociation:
  Type: AWS::WAFv2::WebACLAssociation
  Properties:
    ResourceArn: !Ref ApiGatewayStage
    WebACLArn: !GetAtt WebACL.Arn
```

**Metrics:**
- Blocked requests count
- Allowed requests count
- Rate limit triggers
- Rule match counts

### 4. Database Backup Component

#### RDS Automated Backups

**Configuration via CLI:**
```bash
aws rds modify-db-instance \
    --db-instance-identifier huntaze-prod \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --enable-cloudwatch-logs-exports '["postgresql"]' \
    --apply-immediately
```

**PITR (Point-In-Time Recovery):**
- Automatiquement activé avec automated backups
- Granularité: 1 seconde
- Fenêtre: 7 jours (configurable jusqu'à 35 jours)

#### Backup Testing Automation

**Resource Type:** `AWS::Events::Rule` + Lambda

**Schedule:** Monthly (1st of month at 2 AM)

**Test Process:**
1. Créer snapshot manuel
2. Restaurer dans instance temporaire
3. Vérifier connectivité et intégrité
4. Supprimer instance temporaire
5. Alerter si échec

**Lambda Function:**
```typescript
export async function testBackupRestore(event: ScheduledEvent) {
  const snapshotId = await createSnapshot();
  const testInstanceId = await restoreSnapshot(snapshotId);
  const isHealthy = await verifyInstance(testInstanceId);
  await cleanupInstance(testInstanceId);
  
  if (!isHealthy) {
    await sendAlert('Backup restore test failed');
  }
}
```

## Data Models

### Cost Alert Event

```typescript
interface CostAlertEvent {
  type: 'BUDGET_THRESHOLD' | 'ANOMALY_DETECTION';
  severity: 'WARNING' | 'ALERT' | 'CRITICAL';
  amount: {
    actual: number;
    forecasted: number;
    threshold: number;
  };
  service?: string;
  timestamp: string;
  details: {
    period: string;
    breakdown: Record<string, number>;
  };
}
```

### Security Finding Event

```typescript
interface SecurityFindingEvent {
  source: 'SECURITY_HUB' | 'GUARDDUTY';
  severity: number; // 0-100
  title: string;
  description: string;
  resourceType: string;
  resourceId: string;
  remediation?: {
    recommendation: string;
    url: string;
  };
  timestamp: string;
}
```

### WAF Block Event

```typescript
interface WAFBlockEvent {
  action: 'BLOCK' | 'COUNT';
  rule: string;
  clientIp: string;
  httpRequest: {
    uri: string;
    method: string;
    headers: Record<string, string>;
  };
  timestamp: string;
  rateLimit?: {
    current: number;
    limit: number;
  };
}
```

## Error Handling

### Cost Monitoring Errors

**Scenario:** Budget API rate limit exceeded

**Handling:**
- Retry avec exponential backoff
- Cache budget status localement
- Fallback sur Cost Explorer API

**Scenario:** Anomaly detection false positive

**Handling:**
- Configurer threshold plus élevé
- Exclure services spécifiques (ex: one-time migrations)
- Feedback loop pour améliorer ML model

### Security Errors

**Scenario:** Security Hub findings overload

**Handling:**
- Filter par severity (>= 70 seulement)
- Batch notifications (max 1 par heure)
- Suppression rules pour findings connus

**Scenario:** GuardDuty false positive

**Handling:**
- Whitelist trusted IPs
- Suppression rules pour patterns légitimes
- Manual review process

### WAF Errors

**Scenario:** Legitimate traffic blocked

**Handling:**
- IP whitelist pour clients connus
- Rate limit exception rules
- Monitoring dashboard pour review

**Scenario:** WAF rule misconfiguration

**Handling:**
- Test en mode COUNT avant BLOCK
- Gradual rollout (1 rule at a time)
- Rollback automatique si error rate spike

### Backup Errors

**Scenario:** Backup test fails

**Handling:**
- Immediate SNS alert
- Retry test après 1 heure
- Escalate si 3 échecs consécutifs

**Scenario:** PITR restore fails

**Handling:**
- Fallback sur snapshot manuel le plus récent
- Document RTO/RPO impact
- Post-mortem analysis

## Testing Strategy

### Unit Tests

**Cost Monitoring:**
- Mock AWS Budgets API responses
- Verify threshold calculations
- Test SNS notification formatting

**Security:**
- Mock Security Hub findings
- Verify severity filtering
- Test alert deduplication

**WAF:**
- Mock rate limit scenarios
- Verify rule priority logic
- Test IP whitelist matching

**Backups:**
- Mock RDS API responses
- Verify restore process logic
- Test cleanup procedures

### Integration Tests

**Cost Flow:**
1. Create test budget with low threshold
2. Generate test spend
3. Verify SNS notification received
4. Cleanup test resources

**Security Flow:**
1. Enable Security Hub in test account
2. Trigger test finding
3. Verify EventBridge routing
4. Verify SNS notification

**WAF Flow:**
1. Deploy WAF to test API
2. Send burst of requests
3. Verify rate limit triggered
4. Verify metrics in CloudWatch

**Backup Flow:**
1. Create test RDS instance
2. Trigger backup
3. Restore to new instance
4. Verify data integrity
5. Cleanup

### Manual Testing

**Pre-Deployment Checklist:**
- [ ] Verify SNS topic subscription confirmed
- [ ] Test email delivery
- [ ] Review WAF rules in COUNT mode
- [ ] Verify RDS backup window doesn't conflict with peak traffic

**Post-Deployment Validation:**
- [ ] Trigger test cost alert (lower threshold temporarily)
- [ ] Review Security Hub findings
- [ ] Monitor WAF metrics for 24h
- [ ] Verify automated backup completed

### Monitoring & Validation

**CloudWatch Dashboards:**

1. **Cost Dashboard**
   - Current spend vs budget
   - Forecast
   - Anomaly detection alerts
   - Top 5 services by cost

2. **Security Dashboard**
   - Security Hub compliance score
   - GuardDuty findings count by severity
   - Open findings age distribution
   - Remediation status

3. **WAF Dashboard**
   - Requests allowed vs blocked
   - Top blocked IPs
   - Rule match distribution
   - Rate limit triggers

4. **Backup Dashboard**
   - Last backup timestamp
   - Backup size trend
   - PITR window status
   - Test restore success rate

**Alarms:**

- Budget threshold exceeded (50%, 80%, 100%)
- Cost anomaly detected (> $10 or > 20%)
- Security finding severity >= 70
- WAF block rate > 10% of traffic
- Backup failed
- Backup test failed
- PITR window < 24h remaining

## Deployment Strategy

### Phase 1: Cost Monitoring (Day 1)

**Effort:** 30 minutes

**Steps:**
1. Deploy budget via CloudFormation
2. Enable Cost Anomaly Detection
3. Configure SNS notifications
4. Verify alerts

**Validation:**
- Lower budget threshold temporarily
- Verify email received
- Restore normal threshold

### Phase 2: Security Posture (Day 2)

**Effort:** 45 minutes

**Steps:**
1. Enable Security Hub
2. Enable GuardDuty
3. Configure EventBridge rules
4. Review initial findings

**Validation:**
- Review Security Hub dashboard
- Verify GuardDuty active
- Check for critical findings

### Phase 3: WAF Protection (Day 3-4)

**Effort:** 2 hours

**Steps:**
1. Deploy WAF in COUNT mode
2. Monitor for 24h
3. Review blocked requests
4. Switch to BLOCK mode
5. Monitor for 24h

**Validation:**
- Verify no legitimate traffic blocked
- Test rate limit with load test
- Review metrics

### Phase 4: Backup Hardening (Day 5)

**Effort:** 1 hour

**Steps:**
1. Configure RDS backup retention
2. Verify PITR enabled
3. Deploy backup test Lambda
4. Run manual test
5. Schedule monthly tests

**Validation:**
- Verify backup completed
- Test PITR restore manually
- Verify test Lambda successful

## Performance Considerations

### Cost Impact

**New Monthly Costs:**
- AWS Budgets: $0.02 per budget = $0.02
- Cost Anomaly Detection: Free
- Security Hub: $0.0010 per check = ~$5-10
- GuardDuty: $4.60 per million events = ~$5-15
- WAF: $5 + $1 per million requests = ~$6-10
- RDS Backups: $0.095 per GB-month = ~$2-5 (7 days)

**Total Additional Cost:** ~$18-40/month

**Cost Savings:**
- Early detection of cost anomalies: Potential $100s saved
- Prevention of security incidents: Priceless
- Reduced downtime from backups: $1000s saved

**ROI:** Positive within first month if prevents 1 incident

### Performance Impact

**API Latency:**
- WAF adds ~1-5ms per request (negligible)
- No impact on Lambda execution

**RDS Performance:**
- Automated backups use I/O during backup window (off-peak)
- PITR has minimal overhead (<1%)

**Monitoring Overhead:**
- Security Hub scans: Minimal, asynchronous
- GuardDuty: No performance impact (analyzes logs)

## Security Considerations

### IAM Permissions

**Principle of Least Privilege:**

```yaml
CostMonitoringRole:
  Permissions:
    - budgets:ViewBudget
    - ce:GetAnomalies
    - sns:Publish

SecurityMonitoringRole:
  Permissions:
    - securityhub:GetFindings
    - guardduty:GetFindings
    - sns:Publish

WAFManagementRole:
  Permissions:
    - wafv2:GetWebACL
    - wafv2:UpdateWebACL
    - cloudwatch:PutMetricData

BackupManagementRole:
  Permissions:
    - rds:CreateDBSnapshot
    - rds:RestoreDBInstanceFromDBSnapshot
    - rds:DeleteDBInstance
    - sns:Publish
```

### Secrets Management

**No new secrets required** - all services use IAM roles

**Existing secrets:**
- RDS credentials: Already in Secrets Manager
- SNS topic ARN: Exported from existing stack

### Compliance

**Standards Addressed:**
- SOC 2: Cost monitoring, security monitoring, backup testing
- ISO 27001: Security Hub compliance checks
- PCI DSS: WAF protection, GuardDuty threat detection
- GDPR: Data backup and recovery procedures

## Operational Runbooks

### Runbook 1: Cost Alert Response

**Trigger:** Budget threshold exceeded or anomaly detected

**Steps:**
1. Review Cost Explorer for breakdown
2. Identify unexpected service/resource
3. Check for misconfiguration or attack
4. Take corrective action (stop resource, adjust config)
5. Update budget if legitimate increase
6. Document incident

**SLA:** Respond within 4 hours

### Runbook 2: Security Finding Response

**Trigger:** Security Hub/GuardDuty HIGH/CRITICAL finding

**Steps:**
1. Review finding details in console
2. Assess impact and scope
3. Follow remediation recommendation
4. Verify fix applied
5. Mark finding as resolved
6. Document incident

**SLA:** Respond within 1 hour for CRITICAL, 24h for HIGH

### Runbook 3: WAF Block Investigation

**Trigger:** Legitimate user reports access blocked

**Steps:**
1. Identify user IP in WAF logs
2. Review block reason (rate limit, rule match)
3. Verify legitimacy
4. Add to whitelist if legitimate
5. Notify user
6. Monitor for recurrence

**SLA:** Respond within 30 minutes during business hours

### Runbook 4: Backup Restore

**Trigger:** Data corruption or loss detected

**Steps:**
1. Identify target restore time
2. Verify PITR window covers target time
3. Create final snapshot before restore
4. Initiate PITR restore to new instance
5. Verify data integrity
6. Update application connection string
7. Monitor for issues
8. Delete old instance after 24h

**SLA:** RTO 2 hours, RPO 5 minutes

## Documentation Requirements

### User Documentation

1. **Cost Monitoring Guide**
   - How to read budget reports
   - How to investigate anomalies
   - How to adjust thresholds

2. **Security Response Guide**
   - How to access Security Hub
   - How to interpret findings
   - How to remediate common issues

3. **WAF Management Guide**
   - How to whitelist IPs
   - How to adjust rate limits
   - How to review blocked requests

4. **Backup & Recovery Guide**
   - How to verify backups
   - How to perform PITR restore
   - RTO/RPO expectations

### Technical Documentation

1. **Architecture Diagrams**
   - Component interactions
   - Data flows
   - Alert routing

2. **Configuration Reference**
   - All thresholds and limits
   - IAM roles and permissions
   - Resource naming conventions

3. **Troubleshooting Guide**
   - Common issues and solutions
   - Log locations
   - Support contacts

## Success Metrics

### Immediate (Week 1)

- [ ] All 4 components deployed successfully
- [ ] SNS alerts configured and tested
- [ ] No false positives in first 24h
- [ ] No legitimate traffic blocked by WAF

### Short-term (Month 1)

- [ ] Zero cost overruns detected early
- [ ] Security Hub compliance score > 80%
- [ ] Zero successful attacks blocked by WAF
- [ ] Backup test success rate 100%

### Long-term (Quarter 1)

- [ ] Cost savings from early anomaly detection
- [ ] Reduced security incident response time
- [ ] Zero data loss incidents
- [ ] Improved security posture score

## Future Enhancements

### Phase 2 (Optional)

1. **Advanced WAF Rules**
   - Bot detection
   - Geo-blocking
   - Custom rules per endpoint

2. **Automated Remediation**
   - Lambda functions to auto-fix common findings
   - Auto-scaling based on WAF blocks
   - Automated backup restore testing

3. **Enhanced Monitoring**
   - Grafana dashboards
   - Slack integration
   - PagerDuty escalation

4. **Cost Optimization**
   - Reserved Instance recommendations
   - Savings Plans analysis
   - Resource right-sizing

## References

### AWS Documentation

- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)
- [Security Hub](https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html)
- [GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)
- [AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html)
- [RDS Backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [RDS PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)

### Best Practices

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-standards-fsbp.html)
- [Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
