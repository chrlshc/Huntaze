# Implementation Plan - AWS Production Hardening

## Overview

Ce plan implémente le hardening production AWS en 2 semaines avec 3 phases : Semaine 1 (Foundation), Semaine 2 (Optimization), et Validation finale.

---

## Phase 1: Foundation - Security & Infrastructure (Week 1)

- [x] 1. Create Terraform infrastructure for missing resources
  - Create Terraform module structure in `infra/terraform/production-hardening/`
  - Define SQS queues (workflows FIFO + rate-limiter Standard) with DLQs
  - Define DynamoDB tables (ai-costs + cost-alerts) with TTL and encryption
  - Define SNS topic (cost-alerts) with Budgets policy
  - Define AWS Budget with 80%/100% alerts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 1.1 Implement SQS queues with DLQs
  - Create `huntaze-hybrid-workflows.fifo` with high-throughput mode
  - Create `huntaze-hybrid-workflows-dlq.fifo` for failed messages
  - Create `huntaze-rate-limiter-queue` Standard with long polling 20s
  - Create `huntaze-rate-limiter-queue-dlq` for failed rate limit messages
  - Configure visibility timeout, receive wait time, and redrive policy
  - _Requirements: 4.1, 4.2_

- [x] 1.2 Implement DynamoDB tables with TTL
  - Create `huntaze-ai-costs-production` with pk/sk schema
  - Create `huntaze-cost-alerts-production` with pk/sk schema
  - Enable TTL on both tables (90 days for costs, 30 days for alerts)
  - Enable point-in-time recovery
  - Enable server-side encryption
  - _Requirements: 4.3, 4.4, 9.2, 9.5_

- [x] 1.3 Implement SNS topic and AWS Budget
  - Create `huntaze-cost-alerts` SNS topic
  - Add policy allowing AWS Budgets to publish
  - Create monthly budget ($500) with 80% forecasted alert
  - Create monthly budget ($500) with 100% actual alert
  - Subscribe email and Slack webhook to SNS topic
  - _Requirements: 4.5, 3.1, 3.2, 9.3, 9.4_

- [x] 1.4 Apply Terraform and validate resources
  - Run `terraform plan` and review changes
  - Run `terraform apply` to create resources
  - Validate SQS queues created and accessible
  - Validate DynamoDB tables created with correct schema
  - Validate SNS topic and Budget configured
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Migrate ElastiCache Redis to encrypted cluster
  - Create new replication group with encryption enabled (at-rest + transit)
  - Take snapshot of current `huntaze-redis-production` cluster
  - Restore snapshot to new encrypted replication group
  - Update application environment variables with new endpoint
  - Test application connectivity to encrypted Redis
  - Delete old unencrypted cluster after 24h validation
  - _Requirements: 1.1, 1.2, 10.1_

- [x] 2.1 Create encrypted ElastiCache replication group
  - Define replication group with `--at-rest-encryption-enabled`
  - Define replication group with `--transit-encryption-enabled`
  - Enable AUTH token for authentication
  - Configure automatic failover
  - Set node type to `cache.t3.micro` (same as current)
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Migrate data and update endpoints
  - Take snapshot of `huntaze-redis-production`
  - Restore snapshot to encrypted replication group
  - Update `REDIS_URL` environment variable in ECS task definitions
  - Update `REDIS_AUTH_TOKEN` in AWS Secrets Manager
  - Deploy updated ECS services with new endpoints
  - _Requirements: 1.2, 1.5_

- [x] 2.3 Validate and cleanup
  - Test rate limiter functionality with encrypted Redis
  - Test cache operations (get/set/delete)
  - Monitor for 24 hours for any issues
  - Delete old unencrypted cluster
  - Update documentation with new endpoint
  - _Requirements: 1.1, 1.2_

- [x] 3. Enable security services (GuardDuty, Security Hub, CloudTrail)
  - Enable GuardDuty for threat detection
  - Enable Security Hub with FSBP standard
  - Enable CloudTrail multi-region with S3 logging
  - Configure SNS notifications for high/critical findings
  - _Requirements: 2.1, 2.2, 2.3, 10.2_

- [x] 3.1 Enable GuardDuty
  - Enable GuardDuty in us-east-1
  - Configure S3 protection
  - Configure EKS protection (if applicable)
  - Create SNS topic for GuardDuty findings
  - Create EventBridge rule for high/critical findings
  - _Requirements: 2.2_

- [x] 3.2 Enable Security Hub FSBP
  - Enable Security Hub in us-east-1
  - Enable AWS Foundational Security Best Practices standard
  - Configure finding aggregation
  - Create SNS topic for compliance failures
  - Review initial findings and create remediation plan
  - _Requirements: 2.3_

- [x] 3.3 Enable CloudTrail multi-region
  - Create CloudTrail trail with multi-region enabled
  - Configure S3 bucket for logs (encrypted)
  - Enable log file validation
  - Configure CloudWatch Logs integration
  - Test API call logging
  - _Requirements: 2.1_

- [x] 4. Configure S3 and RDS security
  - Enable S3 Block Public Access at account level
  - Enable S3 default encryption (SSE-S3)
  - Configure RDS parameter group with `rds.force_ssl = 1`
  - Update application connection strings with `sslmode=require`
  - _Requirements: 1.3, 1.4_

- [x] 4.1 Secure S3 buckets
  - Enable Block Public Access at account level
  - Enable default encryption SSE-S3 on all buckets
  - Add bucket policies denying non-HTTPS requests
  - Enable versioning on critical buckets
  - Review and remove any public access grants
  - _Requirements: 1.3_

- [x] 4.2 Secure RDS PostgreSQL
  - Create parameter group with `rds.force_ssl = 1`
  - Apply parameter group to `huntaze-postgres-production`
  - Update application DATABASE_URL with `sslmode=require`
  - Test database connectivity with TLS
  - Verify encryption at rest enabled
  - _Requirements: 1.4_

- [x] 5. Enable Container Insights and configure log retention
  - Enable Container Insights on `ai-team` cluster
  - Enable Container Insights on `huntaze-cluster`
  - Enable Container Insights on `huntaze-of-fargate` cluster
  - Set CloudWatch Logs retention to 30-90 days for all log groups
  - _Requirements: 2.4, 3.4, 10.3_

- [x] 5.1 Enable Container Insights on ECS clusters
  - Enable Container Insights on `ai-team` cluster
  - Enable Container Insights on `huntaze-cluster`
  - Enable Container Insights on `huntaze-of-fargate` cluster
  - Verify metrics appearing in CloudWatch
  - Create dashboard for ECS metrics
  - _Requirements: 2.4, 10.3_

- [x] 5.2 Configure CloudWatch Logs retention
  - List all CloudWatch Log groups
  - Set retention to 30 days for non-critical logs
  - Set retention to 90 days for audit/security logs
  - Verify retention policies applied
  - Estimate cost savings from retention policies
  - _Requirements: 3.4_

- [x] 6. Create CloudWatch alarms for ECS, RDS, and SQS
  - Create ECS alarms (CPU > 70%, Memory > 80%, TaskCount < 1)
  - Create RDS alarms (CPU > 80%, FreeableMemory < 1GB, Connections > 80%)
  - Create SQS alarms (AgeOfOldestMessage > 300s, DLQ depth > 10)
  - Configure SNS notifications for all alarms
  - _Requirements: 2.4, 6.5_

- [x] 6.1 Create ECS CloudWatch alarms
  - Create CPUUtilization > 70% alarm for each service
  - Create MemoryUtilization > 80% alarm for each service
  - Create TaskCount < 1 alarm for each service
  - Configure SNS topic `huntaze-ops-alerts` for notifications
  - Test alarm triggering
  - _Requirements: 2.4, 6.5_

- [x] 6.2 Create RDS CloudWatch alarms
  - Create CPUUtilization > 80% alarm
  - Create FreeableMemory < 1GB alarm
  - Create DatabaseConnections > 80% max alarm
  - Create ReadLatency > 100ms alarm
  - Create WriteLatency > 100ms alarm
  - _Requirements: 6.4_

- [x] 6.3 Create SQS CloudWatch alarms
  - Create ApproximateAgeOfOldestMessage > 300s alarm for each queue
  - Create ApproximateNumberOfMessagesVisible > 1000 alarm
  - Create DLQ depth > 10 alarm for each DLQ
  - Configure SNS notifications
  - Test alarm triggering with test messages
  - _Requirements: 6.5_

---

## Phase 2: Optimization - Rate Limiting & Auto Scaling (Week 2)

- [x] 7. Implement rate limiter Lambda with token bucket
  - Create Lambda function for rate limiting (10 msg/min)
  - Implement token bucket algorithm in Redis using Lua script
  - Configure SQS trigger on `huntaze-rate-limiter-queue`
  - Set reserved concurrency to 1
  - Implement idempotency with messageId
  - Configure DLQ routing after 5 retries
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.4_

- [x] 7.1 Create rate limiter Lambda function
  - Create Lambda function in `lib/lambda/rate-limiter/`
  - Implement token bucket algorithm interface
  - Configure environment variables (REDIS_URL, REDIS_AUTH_TOKEN)
  - Set timeout to 30 seconds
  - Set memory to 256 MB
  - Set reserved concurrency to 1
  - _Requirements: 5.2, 10.4_

- [x] 7.2 Implement token bucket in Redis
  - Create Lua script for atomic token bucket operations
  - Implement refill logic (10 tokens/minute)
  - Implement burst handling (3 tokens)
  - Store state in Redis key `rate_limit:onlyfans:${userId}`
  - Set TTL on keys (1 hour)
  - _Requirements: 5.3_

- [x] 7.3 Configure SQS trigger and DLQ
  - Add SQS trigger to Lambda function
  - Configure batch size to 1 (process one message at a time)
  - Set visibility timeout to 90 seconds
  - Configure DLQ redrive policy (maxReceiveCount = 5)
  - Implement idempotency check with messageId
  - _Requirements: 5.1, 5.4_

- [ ]* 7.4 Test rate limiter end-to-end
  - Send 10 messages in 1 minute (should all succeed)
  - Send 11th message (should be rate limited)
  - Verify HTTP 429 response with Retry-After header
  - Test burst handling (3 messages in 1 second)
  - Test DLQ routing after 5 failures
  - _Requirements: 5.5_

- [x] 8. Enable RDS Performance Insights and create alarms
  - Enable Performance Insights on `huntaze-postgres-production`
  - Configure 7-day retention
  - Create alarms for slow queries (> 1s)
  - Create dashboard for database performance
  - _Requirements: 6.4, 10.5_

- [x] 8.1 Enable RDS Performance Insights
  - Enable Performance Insights on RDS instance
  - Configure 7-day retention (free tier)
  - Enable enhanced monitoring (60-second granularity)
  - Verify metrics appearing in console
  - _Requirements: 6.4, 10.5_

- [x] 8.2 Create Performance Insights alarms
  - Create alarm for DBLoad > 80% of vCPU
  - Create alarm for top SQL query duration > 1s
  - Create alarm for lock waits > 100ms
  - Configure SNS notifications
  - _Requirements: 6.4_

- [x] 9. Configure ECS Service Auto Scaling and circuit breaker
  - Configure target tracking scaling (CPU 70%, Memory 80%)
  - Enable deployment circuit breaker for automatic rollback
  - Test scaling policies with load
  - Test circuit breaker with failed deployment
  - _Requirements: 6.1, 6.2, 6.3, 10.6_

- [x] 9.1 Configure ECS Service Auto Scaling
  - Create target tracking scaling policy for CPU (target 70%)
  - Create target tracking scaling policy for Memory (target 80%)
  - Set min tasks to 1, max tasks to 10
  - Configure scale-in cooldown (300 seconds)
  - Configure scale-out cooldown (60 seconds)
  - _Requirements: 6.1, 6.2, 10.6_

- [x] 9.2 Enable deployment circuit breaker
  - Enable circuit breaker on all ECS services
  - Configure rollback on failure
  - Set failure threshold to 2 failed tasks
  - Test with intentionally broken deployment
  - Verify automatic rollback
  - _Requirements: 6.3_

- [ ]* 9.3 Test auto scaling end-to-end
  - Generate load to trigger CPU > 70%
  - Verify tasks scale out
  - Reduce load and verify scale in
  - Test memory-based scaling
  - Monitor scaling metrics in CloudWatch
  - _Requirements: 6.1, 6.2_

- [x] 10. Implement cost optimization (VPC endpoints, S3 tiering, TTL)
  - Create VPC endpoints for S3 and DynamoDB
  - Enable S3 Intelligent-Tiering on infrequent access buckets
  - Configure DynamoDB TTL on volatile tables
  - Run Trusted Advisor and implement recommendations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.7_

- [x] 10.1 Create VPC endpoints
  - Create VPC endpoint for S3 (gateway endpoint)
  - Create VPC endpoint for DynamoDB (gateway endpoint)
  - Update route tables to use endpoints
  - Test connectivity from ECS tasks
  - Measure NAT Gateway cost reduction
  - _Requirements: 7.2_

- [x] 10.2 Enable S3 Intelligent-Tiering
  - Identify buckets with infrequent access patterns
  - Enable Intelligent-Tiering on selected buckets
  - Configure archive tiers (90-day, 180-day)
  - Monitor storage class transitions
  - Estimate cost savings
  - _Requirements: 7.1_

- [x] 10.3 Configure DynamoDB TTL
  - Enable TTL on `huntaze-ai-costs-production` (90 days)
  - Enable TTL on `huntaze-cost-alerts-production` (30 days)
  - Enable TTL on `huntaze-analytics-events` (90 days)
  - Verify TTL deletions occurring
  - Estimate storage cost savings
  - _Requirements: 7.4_

- [x] 10.4 Run Trusted Advisor and optimize
  - Run Trusted Advisor cost optimization checks
  - Review idle resources (ECS tasks, RDS instances)
  - Review underutilized resources
  - Implement top 5 recommendations
  - Document cost savings achieved
  - _Requirements: 7.5_

- [x] 11. Create security runbook script
  - Implement automated security checks (ElastiCache, RDS, S3, CloudTrail)
  - Create CLI script `scripts/security-runbook.sh`
  - Test all security checks
  - Document runbook usage
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11.1 Implement security runbook script
  - Create `scripts/security-runbook.sh` with all checks
  - Check ElastiCache encryption (at-rest + transit)
  - Check RDS force_ssl parameter
  - Check S3 Block Public Access
  - Check CloudTrail multi-region status
  - Check GuardDuty enabled
  - Check Security Hub FSBP enabled
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11.2 Test and document runbook
  - Run runbook and verify all checks pass
  - Test failure scenarios (disable a security control)
  - Verify exit codes (0 = pass, 1 = critical, 2 = warning)
  - Create documentation in `docs/runbooks/security-runbook.md`
  - Schedule daily automated runs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Implement enhanced cost monitoring service
  - Create `EnhancedCostMonitoring` service class
  - Implement DynamoDB write operations for cost tracking
  - Implement cost aggregation queries (by provider, agent, date)
  - Implement budget threshold checks
  - Integrate with existing orchestrator
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 12.1 Create EnhancedCostMonitoring service
  - Create `lib/services/enhanced-cost-monitoring.ts`
  - Implement `trackCost()` method for DynamoDB writes
  - Implement `getDailyCosts()` for daily aggregation
  - Implement `getCostsByProvider()` for provider breakdown
  - Implement `getCostsByAgent()` for agent breakdown
  - Implement `checkBudgetThreshold()` for alerts
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12.2 Integrate with hybrid orchestrator
  - Update `ProductionHybridOrchestrator` to use `EnhancedCostMonitoring`
  - Track costs for every AI request (Azure + OpenAI)
  - Include metadata (provider, agent, tokens, timestamp)
  - Set TTL to 90 days (epoch seconds)
  - Test cost tracking end-to-end
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 3: Validation & Documentation

- [x] 13. Run comprehensive security validation
  - Run security runbook and verify 100% pass rate
  - Review Security Hub FSBP findings (target 0 high/critical)
  - Review GuardDuty findings (target 0 high/critical)
  - Verify all encryption enabled (ElastiCache, RDS, S3)
  - Verify CloudTrail logging all API calls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [ ] 14. Validate cost optimization and budgets
  - Verify AWS Budget alerts configured (80% + 100%)
  - Verify Cost Anomaly Detection enabled
  - Measure cost reduction from VPC endpoints
  - Measure cost reduction from S3 Intelligent-Tiering
  - Measure cost reduction from DynamoDB TTL
  - Verify monthly cost < $500 target
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Validate observability and monitoring
  - Verify Container Insights enabled on 3 clusters
  - Verify CloudWatch alarms configured and working
  - Verify SNS notifications delivered
  - Test MTTD (Mean Time To Detect) < 5 minutes
  - Test MTTR (Mean Time To Resolve) < 15 minutes
  - _Requirements: 2.4, 6.5_

- [ ] 16. Validate rate limiter functionality
  - Test 10 msg/min limit enforcement
  - Test burst handling (3 messages)
  - Test DLQ routing after 5 failures
  - Measure p50/p99 latency (target < 100ms / < 500ms)
  - Verify 0 OnlyFans account bans
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 17. Create documentation and runbooks
  - Document ElastiCache migration procedure
  - Document rate limiter troubleshooting
  - Document cost alert response procedure
  - Document security incident response
  - Create architecture diagrams (security, observability, FinOps)
  - _Requirements: All requirements_

- [ ] 18. Final production readiness review
  - Review all requirements met (10 requirements, 50 acceptance criteria)
  - Review success metrics achieved
  - Review rollback procedures documented
  - Review monitoring and alerting configured
  - Get stakeholder sign-off for production deployment
  - _Requirements: All requirements_

---

## Notes

- Tasks marked with `*` are optional testing tasks
- All tasks reference specific requirements from requirements.md
- Estimated timeline: 2 weeks (10 business days)
- Critical path: ElastiCache migration (Day 3) and rate limiter deployment (Day 6-7)
- Rollback procedures documented in design.md
