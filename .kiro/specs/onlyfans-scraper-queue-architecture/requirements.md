# Requirements Document

## Introduction

This document specifies the requirements for integrating the existing Huntaze rate limiter Lambda with the hybrid workflows FIFO queue and ECS Playwright scraper. The system follows the pattern: Next.js API → `huntaze-rate-limiter-queue` → Lambda Rate Limiter (with Redis token bucket) → `huntaze-hybrid-workflows.fifo` → ECS Playwright Scraper. This ensures OnlyFans API rate compliance (10 msg/min), ordered processing per creator, and robust error handling.

## Glossary

- **Next_API**: Next.js API routes (`/api/onlyfans/*`) that receive user requests and enqueue messages to the rate limiter queue
- **Rate_Limiter_Queue**: Standard SQS queue (`huntaze-rate-limiter-queue`) that triggers the Lambda rate limiter
- **Rate_Limiter_Lambda**: AWS Lambda function (`huntaze-rate-limiter`) that enforces OnlyFans API rate limits using Redis token bucket and forwards approved messages to the workflows queue
- **Workflows_FIFO_Queue**: Existing SQS FIFO queue (`huntaze-hybrid-workflows.fifo`) that maintains message ordering per creator and provides exactly-once delivery semantics
- **Playwright_Scraper_Service**: AWS ECS Fargate service running Playwright that consumes messages from the workflows FIFO queue and executes OnlyFans scraping operations
- **Redis_Token_Bucket**: ElastiCache Redis cluster using Lua scripts for atomic token bucket operations (10 tokens per 60 seconds)
- **DLQ**: Dead Letter Queue - SQS queue that receives messages that fail processing after maximum retry attempts
- **MessageGroupId**: SQS FIFO attribute that ensures messages with the same ID are processed in order (set to creator_id or user_id)
- **Partial_Batch_Response**: SQS feature allowing selective message failure without reprocessing successful messages in the same batch
- **Back_Pressure**: Natural flow control mechanism where queue depth signals the need for scaling

## Requirements

### Requirement 1

**User Story:** As a system operator, I want the Lambda rate limiter to forward approved messages to the workflows FIFO queue, so that the ECS Playwright scraper can consume them in order while respecting OnlyFans API rate limits

#### Acceptance Criteria

1. WHEN the Rate_Limiter_Lambda receives a message from the Rate_Limiter_Queue, THE Rate_Limiter_Lambda SHALL validate the request against the Redis_Token_Bucket with a limit of 10 tokens per 60 seconds
2. IF a token is available, THE Rate_Limiter_Lambda SHALL send the message to the Workflows_FIFO_Queue with MessageGroupId set to the creator_id or user_id from the payload
3. IF no token is available, THE Rate_Limiter_Lambda SHALL change the message visibility timeout to the calculated retry_after value and SHALL NOT mark the message as failed
4. THE Rate_Limiter_Lambda SHALL use the existing Redis Lua script for atomic token bucket operations to ensure thread-safe rate limiting across concurrent Lambda invocations
5. THE Rate_Limiter_Lambda SHALL log all rate limit decisions to CloudWatch Logs with message_id, allowed status, retry_after value, and remaining tokens

### Requirement 2

**User Story:** As a system architect, I want the existing workflows FIFO queue to receive rate-limited messages with proper ordering, so that scraping operations for each creator execute sequentially while different creators process in parallel

#### Acceptance Criteria

1. WHEN the Rate_Limiter_Lambda forwards a message, THE Rate_Limiter_Lambda SHALL send it to the Workflows_FIFO_Queue with MessageGroupId set to the creator_id or user_id from the original payload
2. THE Rate_Limiter_Lambda SHALL include MessageDeduplicationId based on a hash of the message content to leverage the existing FIFO deduplication feature
3. THE Rate_Limiter_Lambda SHALL preserve all original message attributes and payload when forwarding to the Workflows_FIFO_Queue
4. THE Rate_Limiter_Lambda SHALL add metadata attributes including rate_limit_timestamp, tokens_remaining, and rate_limiter_version for observability
5. WHEN the SQS send operation fails, THE Rate_Limiter_Lambda SHALL mark the message as failed in the Partial Batch Response to trigger automatic retry

### Requirement 3

**User Story:** As a DevOps engineer, I want the Playwright scraper service to auto-scale based on workflows queue depth, so that processing capacity adjusts automatically to workload without manual intervention

#### Acceptance Criteria

1. THE Playwright_Scraper_Service SHALL configure Application Auto Scaling with target tracking based on the Workflows_FIFO_Queue ApproximateNumberOfMessagesVisible metric
2. WHEN ApproximateNumberOfMessagesVisible exceeds 100 messages, THE Playwright_Scraper_Service SHALL scale out by adding tasks up to a maximum of 10 concurrent tasks
3. WHEN ApproximateNumberOfMessagesVisible drops below 20 messages for 5 consecutive minutes, THE Playwright_Scraper_Service SHALL scale in by removing tasks down to a minimum of 1 task
4. THE Playwright_Scraper_Service SHALL use long polling with WaitTimeSeconds set to 20 seconds when consuming from the Workflows_FIFO_Queue
5. THE Playwright_Scraper_Service SHALL process messages in batches respecting FIFO ordering constraints (max 10 messages per MessageGroupId per batch)

### Requirement 4

**User Story:** As a reliability engineer, I want the Playwright scraper to handle message processing failures gracefully, so that only failed messages are retried without reprocessing successful messages from the same batch

#### Acceptance Criteria

1. WHEN the Playwright_Scraper_Service processes a batch of messages from the Workflows_FIFO_Queue, THE Playwright_Scraper_Service SHALL track success and failure status for each individual message
2. WHEN a message is successfully processed, THE Playwright_Scraper_Service SHALL delete it from the Workflows_FIFO_Queue immediately to prevent reprocessing
3. WHEN a message fails processing, THE Playwright_Scraper_Service SHALL NOT delete it from the queue and SHALL allow the visibility timeout to expire for automatic retry
4. THE Playwright_Scraper_Service SHALL log all processing outcomes to CloudWatch Logs with message_id, creator_id, success status, error details, and processing duration
5. THE Playwright_Scraper_Service SHALL implement exponential backoff by increasing visibility timeout on repeated failures up to a maximum of 12 hours

### Requirement 5

**User Story:** As a system operator, I want comprehensive monitoring and alerting for the queue-based architecture, so that I can detect and respond to processing issues before they impact users

#### Acceptance Criteria

1. THE System SHALL create CloudWatch alarms for Workflows_FIFO_Queue ApproximateAgeOfOldestMessage exceeding 600 seconds indicating processing delays
2. THE System SHALL create CloudWatch alarms for Workflows_FIFO_Queue ApproximateNumberOfMessagesVisible exceeding 500 messages indicating potential backlog
3. THE System SHALL create CloudWatch alarms for Rate_Limiter_Lambda errors exceeding 10 per 5 minutes indicating Lambda processing failures
4. THE System SHALL publish custom metrics for rate_limit_allowed_count, rate_limit_rejected_count, scraping_success_rate, and average_scraping_duration
5. WHEN any alarm threshold is breached, THE System SHALL send notifications to the existing huntaze-cost-alerts SNS topic for operator alerting

### Requirement 6

**User Story:** As a cost-conscious operator, I want the Playwright scraper to use optimized Fargate configurations, so that processing costs remain minimal while maintaining performance

#### Acceptance Criteria

1. THE Playwright_Scraper_Service SHALL use Fargate Spot instances with a fallback to On-Demand for cost optimization
2. THE Playwright_Scraper_Service SHALL configure task definitions with 1 vCPU and 2 GB memory as the baseline resource allocation for Playwright browser operations
3. THE Playwright_Scraper_Service SHALL enable Container Insights for detailed resource utilization monitoring
4. WHEN average CPU utilization exceeds 70% for 10 minutes, THE System SHALL trigger a CloudWatch alarm for potential right-sizing
5. THE Playwright_Scraper_Service SHALL implement graceful shutdown handling to complete in-flight messages and close browser instances before task termination

### Requirement 7

**User Story:** As a developer, I want the Playwright scraper to handle OnlyFans errors gracefully, so that transient failures don't result in data loss and systematic errors are identified quickly

#### Acceptance Criteria

1. WHEN the Playwright_Scraper_Service encounters a 429 rate limit response from OnlyFans, THE Playwright_Scraper_Service SHALL return the message to the queue for retry without incrementing the failure count
2. WHEN the Playwright_Scraper_Service encounters a 5xx server error from OnlyFans, THE Playwright_Scraper_Service SHALL retry the operation with exponential backoff up to 3 attempts within the same message processing
3. WHEN the Playwright_Scraper_Service encounters a 4xx client error (excluding 429), THE Playwright_Scraper_Service SHALL log the error and delete the message to prevent infinite retries
4. THE Playwright_Scraper_Service SHALL implement circuit breaker pattern to prevent cascading failures when OnlyFans is degraded
5. THE Playwright_Scraper_Service SHALL log all OnlyFans errors with request context, response status, creator_id, and correlation ID for debugging

### Requirement 8

**User Story:** As a security engineer, I want all components to follow AWS security best practices, so that the scraping infrastructure is protected against unauthorized access and data breaches

#### Acceptance Criteria

1. THE Rate_Limiter_Lambda SHALL use IAM roles with least-privilege permissions limited to SQS ReceiveMessage and DeleteMessage on Rate_Limiter_Queue, SQS SendMessage on Workflows_FIFO_Queue, and Secrets Manager GetSecretValue for Redis AUTH token
2. THE Playwright_Scraper_Service SHALL use IAM roles with least-privilege permissions limited to SQS ReceiveMessage and DeleteMessage on Workflows_FIFO_Queue, S3 PutObject for results storage, and Secrets Manager GetSecretValue for OnlyFans credentials
3. THE Workflows_FIFO_Queue SHALL enable server-side encryption using AWS KMS with automatic key rotation enabled
4. THE System SHALL enable VPC endpoints for SQS, S3, and Secrets Manager to keep traffic within AWS network
5. THE System SHALL store OnlyFans API credentials in AWS Secrets Manager with automatic rotation every 90 days and audit logging enabled
