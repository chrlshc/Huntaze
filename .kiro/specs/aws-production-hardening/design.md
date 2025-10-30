# Design Document - AWS Production Hardening

## Overview

Cette spec implémente un plan d'atterrissage production en 2 semaines pour sécuriser, observer et optimiser l'infrastructure AWS Huntaze. Le design couvre 3 piliers : Sécurité (encryption, IAM, secrets), Observabilité (CloudWatch, GuardDuty, Security Hub) et FinOps (budgets, alertes, optimisation coûts).

**Objectifs:**
- Combler les 20% manquants de l'infrastructure (tables DynamoDB, queues SQS, SNS topics)
- Corriger les risques sécurité critiques (Redis non chiffré, S3 public access)
- Implémenter observabilité complète (Container Insights, CloudTrail, GuardDuty)
- Optimiser les coûts (VPC endpoints, TTL, rétention logs)
- Déployer rate limiting OnlyFans robuste (10 msg/min avec token bucket)

**Contraintes:**
- Compte AWS: 317805897534, région us-east-1
- Budget mensuel cible: $500 (actuellement ~$750/mois incohérent)
- Downtime acceptable: < 5 minutes pour migration Redis
- Terraform provider v5+ requis
- Compatibilité avec stack existante (Next.js, ECS Fargate, RDS PostgreSQL)

## Architecture

### High-Level Architecture


```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                                │
│  GuardDuty │ Security Hub FSBP │ CloudTrail │ Secrets Manager   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  OBSERVABILITY LAYER                             │
│  Container Insights │ CloudWatch Alarms │ Performance Insights  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FINOPS LAYER                                  │
│  AWS Budgets │ Cost Anomaly Detection │ Trusted Advisor         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  COMPUTE & DATA LAYER                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ECS Fargate  │  │ RDS Postgres │  │ ElastiCache  │          │
│  │ (3 clusters) │  │ (encrypted)  │  │ (encrypted)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ DynamoDB     │  │ SQS Queues   │  │ S3 Buckets   │          │
│  │ (23 tables)  │  │ (24 queues)  │  │ (encrypted)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  RATE LIMITING LAYER                             │
│                                                                   │
│  Request → SQS (rate-limiter-queue) → Lambda (concurrency=1)    │
│           → Redis Token Bucket (Lua) → OnlyFans API              │
│                                                                   │
│  Limit: 10 msg/min │ Burst: 3 │ DLQ: 5 retries                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Architecture

**1. ElastiCache Redis Encryption**


Migration strategy (< 5 min downtime):
- Create new replication group with encryption enabled
- Take snapshot of current cluster
- Restore snapshot to new encrypted cluster
- Update application endpoints (environment variables)
- Delete old cluster

**2. S3 Security**
- Block Public Access at account level
- Default encryption SSE-S3 (or KMS for sensitive data)
- Bucket policies deny non-HTTPS requests
- Versioning enabled for critical buckets

**3. RDS PostgreSQL TLS**
- Parameter group: rds.force_ssl = 1
- Application connection strings include sslmode=require
- Certificate validation enabled

**4. IAM & Secrets**
- Task execution role: pull images, read secrets
- Task role: access AWS services (DynamoDB, SQS, S3)
- Secrets Manager: API keys, passwords with auto-rotation
- Least privilege principle

### Observability Architecture

**1. CloudWatch Container Insights**


Metrics collected per cluster:
- CPU/Memory utilization (task and service level)
- Network bytes in/out
- Task count (running, pending, stopped)
- Service average requests per target

Alarms configured:
- CPUUtilization > 70% for 5 minutes
- MemoryUtilization > 80% for 5 minutes
- TaskCount < 1 (service down)

**2. CloudTrail Multi-Region**
- All API calls logged to S3 (encrypted)
- Log file validation enabled
- Integration with CloudWatch Logs for real-time analysis

**3. GuardDuty & Security Hub**
- GuardDuty: threat detection (compromised instances, unusual API calls)
- Security Hub FSBP: continuous compliance checks
- SNS notifications for high/critical findings

### FinOps Architecture

**1. AWS Budgets**


Monthly budget: $500
- Alert at 80% forecasted ($400)
- Alert at 100% actual ($500)
- SNS topic: huntaze-cost-alerts
- Subscribers: email, Slack webhook

**2. Cost Optimization**
- S3 Intelligent-Tiering for infrequent access
- VPC endpoints for S3/DynamoDB (avoid NAT Gateway costs)
- CloudWatch Logs retention: 30-90 days
- DynamoDB TTL: auto-delete old records
- Trusted Advisor: weekly cost optimization recommendations

**3. Cost Tracking**
- DynamoDB table: huntaze-ai-costs-production
- Schema: pk=COST#date#provider, sk=agent#type
- TTL: 90 days retention
- Indexed by provider, agent, date for analytics

## Components and Interfaces

### 1. Terraform Infrastructure Module

**File:** `infra/terraform/production-hardening/main.tf`

Key resources:
- aws_sqs_queue: hybrid-workflows.fifo, rate-limiter-queue (+ DLQs)
- aws_dynamodb_table: ai-costs-production, cost-alerts-production
- aws_sns_topic: cost-alerts (+ policy for Budgets)
- aws_budgets_budget: monthly budget with notifications
- aws_elasticache_replication_group: encrypted Redis cluster

**Outputs:**
- sqs_workflow_queue_url
- sqs_rate_limiter_queue_url
- dynamodb_costs_table_name
- sns_cost_alerts_arn
- redis_encrypted_endpoint

### 2. Rate Limiter Lambda

**File:** `lib/lambda/rate-limiter/index.ts`



Interface:
```typescript
interface RateLimiterEvent {
  messageId: string;
  userId: string;
  fanId: string;
  message: string;
  timestamp: number;
}

interface RateLimiterResponse {
  allowed: boolean;
  retryAfter?: number;
  tokensRemaining: number;
}
```

Token bucket algorithm (Redis Lua script):
- Capacity: 10 tokens
- Refill rate: 10 tokens/minute (1 token every 6 seconds)
- Burst: 3 tokens
- Key: `rate_limit:onlyfans:${userId}`

### 3. Security Runbook Script

**File:** `scripts/security-runbook.sh`

Checks performed:
- ElastiCache encryption (at-rest + transit)
- RDS force_ssl parameter
- S3 Block Public Access
- CloudTrail multi-region status
- GuardDuty enabled
- Security Hub FSBP enabled
- IAM roles for ECS tasks

Exit codes:
- 0: All checks passed
- 1: Critical security issue found
- 2: Warning (non-critical)

### 4. Cost Monitoring Service

**File:** `lib/services/enhanced-cost-monitoring.ts`



Interface:
```typescript
interface CostEntry {
  pk: string;  // COST#2025-10-28#openai
  sk: string;  // agent#content
  amount: number;
  tokens: number;
  requests: number;
  ttl: number;  // epoch seconds
}

class EnhancedCostMonitoring {
  async trackCost(entry: CostEntry): Promise<void>;
  async getDailyCosts(date: string): Promise<number>;
  async getCostsByProvider(provider: string): Promise<CostEntry[]>;
  async getCostsByAgent(agent: string): Promise<CostEntry[]>;
  async checkBudgetThreshold(): Promise<boolean>;
}
```

## Data Models

### DynamoDB: huntaze-ai-costs-production

```
pk (String, Hash Key): COST#YYYY-MM-DD#provider
sk (String, Range Key): agent#type
amount (Number): cost in USD
tokens (Number): tokens consumed
requests (Number): number of requests
provider (String): openai | azure
agent (String): content | chatbot | marketing | analytics
type (String): gpt-4 | gpt-3.5-turbo
timestamp (String): ISO 8601
ttl (Number): epoch seconds (90 days)
```

### DynamoDB: huntaze-cost-alerts-production

```
pk (String, Hash Key): ALERT#uuid
sk (String, Range Key): YYYY-MM-DDTHH:mm:ssZ
alertType (String): budget_threshold | anomaly | daily_limit
severity (String): warning | critical
message (String): alert description
amount (Number): cost amount
threshold (Number): threshold exceeded
notified (Boolean): SNS notification sent
ttl (Number): epoch seconds (30 days)
```

### SQS: huntaze-hybrid-workflows.fifo

```
Message attributes:
- workflowId (String): unique workflow identifier
- step (Number): current step in workflow
- agentType (String): content | chatbot | marketing
- priority (Number): 1-10
- messageGroupId (String): for FIFO ordering

Message body:
{
  "workflowId": "wf-123",
  "userId": "user-456",
  "campaignId": "camp-789",
  "data": { ... },
  "metadata": { ... }
}
```

### SQS: huntaze-rate-limiter-queue

```
Message attributes:
- userId (String): creator user ID
- fanId (String): OnlyFans fan ID
- priority (Number): 1-10

Message body:
{
  "messageId": "msg-123",
  "userId": "user-456",
  "fanId": "fan-789",
  "message": "Hey! Thanks for subscribing",
  "timestamp": 1698508800
}
```

## Error Handling

### ElastiCache Migration Errors

**Scenario:** Snapshot restore fails
- Rollback: Keep old cluster running
- Retry: Attempt restore with different snapshot
- Alert: SNS notification to ops team
- Timeout: 30 minutes max

### Rate Limiter Errors

**Scenario:** Redis unavailable
- Fallback: In-memory rate limiting (per Lambda instance)
- DLQ: Move message to DLQ after 5 retries
- Alert: CloudWatch alarm on DLQ depth > 10
- Recovery: Auto-retry when Redis available

### Budget Alert Errors

**Scenario:** SNS publish fails
- Retry: 3 attempts with exponential backoff
- Fallback: Write to DynamoDB cost-alerts table
- Alert: CloudWatch alarm on SNS publish failures
- Manual check: Daily budget review

### Terraform Apply Errors

**Scenario:** Resource creation fails
- State: Terraform state preserved
- Rollback: Manual rollback of partial changes
- Validation: Pre-apply plan review required
- Testing: Apply in staging environment first

## Testing Strategy

### Unit Tests

**Security:**
- Test ElastiCache encryption validation
- Test S3 Block Public Access check
- Test RDS force_ssl parameter check
- Test IAM role policy validation

**Rate Limiter:**
- Test token bucket algorithm
- Test burst handling
- Test DLQ routing
- Test idempotency

**Cost Monitoring:**
- Test DynamoDB writes
- Test TTL expiration
- Test budget threshold checks
- Test SNS notifications

### Integration Tests

**Infrastructure:**
- Test Terraform apply (staging)
- Test ElastiCache migration
- Test VPC endpoint connectivity
- Test CloudWatch alarms triggering

**Rate Limiter:**
- Test end-to-end message flow
- Test 10 msg/min limit enforcement
- Test Redis failover
- Test Lambda concurrency

**Observability:**
- Test Container Insights metrics
- Test GuardDuty findings
- Test Security Hub compliance
- Test CloudTrail logging

### Performance Tests

**Rate Limiter:**
- Load test: 1000 msg/min sustained
- Burst test: 100 msg in 1 second
- Latency: p50 < 100ms, p99 < 500ms
- Throughput: 10 msg/min per user

**Cost Monitoring:**
- Write throughput: 1000 entries/second
- Query latency: < 100ms
- TTL cleanup: verify 90-day deletion
- DynamoDB capacity: on-demand scaling

### Security Tests

**Penetration Testing:**
- Test S3 public access blocked
- Test RDS TLS enforcement
- Test Redis AUTH required
- Test Secrets Manager access

**Compliance Testing:**
- Security Hub FSBP: 100% pass rate
- GuardDuty: no high/critical findings
- CloudTrail: all API calls logged
- IAM: least privilege validated

## Deployment Strategy

### Week 1: Foundation (Days 1-5)

**Day 1-2: Terraform Resources**
- Apply Terraform for SQS, DynamoDB, SNS, Budgets
- Validate resource creation
- Test connectivity

**Day 3: ElastiCache Migration**
- Create encrypted replication group
- Take snapshot of current cluster
- Restore to encrypted cluster
- Update application endpoints
- Validate functionality
- Delete old cluster

**Day 4: Security Services**
- Enable GuardDuty
- Enable Security Hub FSBP
- Enable CloudTrail multi-region
- Configure SNS notifications

**Day 5: Observability**
- Enable Container Insights on 3 clusters
- Set CloudWatch Logs retention (30-90 days)
- Create CloudWatch alarms
- Test alerting

### Week 2: Optimization (Days 6-10)

**Day 6-7: Rate Limiter**
- Deploy Lambda function
- Configure SQS trigger
- Implement token bucket in Redis
- Test 10 msg/min limit
- Test DLQ handling

**Day 8: RDS & Monitoring**
- Enable Performance Insights
- Create RDS alarms
- Configure slow query logging
- Test query profiling

**Day 9: ECS Auto Scaling**
- Configure Service Auto Scaling
- Enable deployment circuit breaker
- Test scaling policies
- Test rollback

**Day 10: Cost Optimization**
- Enable S3 Intelligent-Tiering
- Create VPC endpoints
- Configure DynamoDB TTL
- Run Trusted Advisor
- Validate cost savings

### Rollback Plan

**ElastiCache:**
- Keep old cluster for 24 hours
- Revert endpoints if issues
- Restore from snapshot

**Lambda:**
- Keep previous version
- Use Lambda aliases
- Instant rollback via alias update

**Terraform:**
- Terraform state backup
- Manual resource deletion if needed
- Staging environment validation first

## Monitoring & Alerts

### CloudWatch Alarms

**ECS:**
- CPUUtilization > 70% (5 min)
- MemoryUtilization > 80% (5 min)
- TaskCount < 1 (1 min)

**RDS:**
- CPUUtilization > 80% (5 min)
- FreeableMemory < 1GB (5 min)
- DatabaseConnections > 80% max (5 min)

**SQS:**
- ApproximateAgeOfOldestMessage > 300s (5 min)
- ApproximateNumberOfMessagesVisible > 1000 (5 min)
- DLQ depth > 10 (1 min)

**Lambda:**
- Errors > 5% (5 min)
- Duration > 10s (5 min)
- Throttles > 0 (1 min)

### SNS Topics

**huntaze-cost-alerts:**
- Budget threshold alerts
- Cost anomaly alerts
- Daily cost summary

**huntaze-security-alerts:**
- GuardDuty high/critical findings
- Security Hub compliance failures
- CloudTrail unusual activity

**huntaze-ops-alerts:**
- ECS service down
- RDS connection issues
- Lambda errors

## Success Metrics

**Security:**
- 100% encryption (ElastiCache, RDS, S3)
- 0 high/critical Security Hub findings
- 0 public S3 buckets
- 100% API calls logged (CloudTrail)

**Observability:**
- Container Insights enabled on 3 clusters
- < 5 min MTTD (Mean Time To Detect)
- < 15 min MTTR (Mean Time To Resolve)
- 99.9% uptime

**FinOps:**
- Monthly cost < $500
- 0 budget overruns
- 20% cost reduction via VPC endpoints
- 30% storage cost reduction via TTL

**Rate Limiting:**
- 100% compliance with 10 msg/min limit
- < 1% DLQ rate
- p99 latency < 500ms
- 0 OnlyFans account bans

## Documentation

**Runbooks:**
- ElastiCache migration procedure
- Rate limiter troubleshooting
- Cost alert response
- Security incident response

**Architecture Diagrams:**
- Security architecture
- Observability architecture
- FinOps architecture
- Rate limiting flow

**API Documentation:**
- Cost monitoring service API
- Rate limiter Lambda API
- Security runbook CLI

**Training Materials:**
- Security best practices
- Cost optimization guide
- Observability dashboard guide
- Incident response procedures
