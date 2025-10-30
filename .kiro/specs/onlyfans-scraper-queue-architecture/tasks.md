# Implementation Plan

This implementation plan breaks down the OnlyFans scraper queue architecture into discrete, actionable coding tasks. Each task builds incrementally on previous work and references specific requirements from the requirements document.

## Task List

- [ ] 1. Modify Lambda Rate Limiter to forward to workflows FIFO queue
  - Update `lib/lambda/rate-limiter/index.mjs` to replace direct API calls with SQS SendMessage
  - Implement `sendToWorkflowsQueue()` function with MessageGroupId and MessageDeduplicationId logic
  - Add WORKFLOWS_QUEUE_URL environment variable to Lambda configuration
  - Update IAM role to include SQS SendMessage permission for workflows queue
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 8.1_

- [ ] 1.1 Implement sendToWorkflowsQueue function
  - Write function to send messages to workflows FIFO queue using AWS SDK v3
  - Generate MessageGroupId from creator_id or user_id in payload
  - Generate MessageDeduplicationId using SHA-256 hash of action + creator_id + timestamp
  - Add message attributes for rate_limit_timestamp, tokens_remaining, rate_limiter_version
  - Handle SQS SendMessage errors and mark as failed in Partial Batch Response
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 1.2 Update Lambda handler to use new queue forwarding
  - Replace `sendToOnlyFansAPI()` calls with `sendToWorkflowsQueue()` calls
  - Preserve existing token bucket logic and rate limiting behavior
  - Maintain Partial Batch Response for failed messages
  - Update logging to include queue forwarding status
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.3 Update Terraform configuration for Lambda
  - Add WORKFLOWS_QUEUE_URL environment variable to `infra/terraform/production-hardening/rate-limiter-lambda.tf`
  - Update IAM policy to include SQS SendMessage permission for workflows queue ARN
  - Add dependency on workflows queue resource
  - _Requirements: 8.1_

- [ ] 1.4 Write unit tests for Lambda modifications
  - Test sendToWorkflowsQueue with valid payload
  - Test MessageGroupId generation logic
  - Test MessageDeduplicationId generation and uniqueness
  - Test message attributes are correctly set
  - Test error handling for SQS SendMessage failures
  - Test Partial Batch Response includes failed messages
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Create Playwright scraper Docker image
  - Create `lib/scraper/Dockerfile` with Node.js and Playwright dependencies
  - Install Playwright browsers (Chromium) for ARM64 architecture
  - Configure container for ECS Fargate (1 vCPU, 2 GB memory)
  - Add health check endpoint for ECS health monitoring
  - _Requirements: 6.2, 6.5_

- [ ] 2.1 Create Dockerfile with Playwright
  - Use Node.js 20 ARM64 base image
  - Install Playwright and Chromium browser
  - Set PLAYWRIGHT_BROWSERS_PATH to /tmp/browsers for Fargate ephemeral storage
  - Configure NODE_OPTIONS for memory optimization (--max-old-space-size=1024)
  - Add non-root user for security
  - _Requirements: 6.2_

- [ ] 2.2 Implement scraper application entry point
  - Create `lib/scraper/src/index.ts` as main entry point
  - Initialize Playwright browser on startup
  - Start SQS queue polling loop
  - Implement graceful shutdown handler for SIGTERM
  - Add health check HTTP endpoint on port 3000
  - _Requirements: 6.5_

- [ ] 3. Implement SQS consumer for workflows queue
  - Create `lib/scraper/src/queue-consumer.ts` to poll workflows FIFO queue
  - Implement long polling with WaitTimeSeconds=20
  - Process messages in batches respecting FIFO ordering
  - Delete successful messages immediately
  - Handle visibility timeout for failed messages
  - _Requirements: 3.4, 3.5, 4.2, 4.3_

- [ ] 3.1 Implement queue polling logic
  - Use AWS SDK v3 SQS ReceiveMessageCommand with long polling
  - Set MaxNumberOfMessages to 10 for batch processing
  - Set WaitTimeSeconds to 20 for long polling
  - Parse message body and attributes
  - Validate message schema before processing
  - _Requirements: 3.4, 3.5_

- [ ] 3.2 Implement message deletion logic
  - Delete messages immediately after successful processing using DeleteMessageCommand
  - Log deletion status with message_id and creator_id
  - Handle deletion errors gracefully (message will retry on visibility timeout)
  - _Requirements: 4.2_

- [ ] 3.3 Implement visibility timeout handling for failures
  - Do NOT delete messages that fail processing
  - Allow visibility timeout to expire for automatic retry
  - Implement exponential backoff by tracking retry count in message attributes
  - Change visibility timeout for repeated failures (up to 12 hours max)
  - _Requirements: 4.3, 4.5_

- [ ] 4. Implement OnlyFans scraping logic with Playwright
  - Create `lib/scraper/src/onlyfans-scraper.ts` with Playwright browser automation
  - Implement authentication using credentials from Secrets Manager
  - Implement action handlers: send_message, scrape_profile, download_media, get_messages
  - Add request/response logging for debugging
  - Store results in S3 bucket
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 4.1 Implement Playwright browser initialization
  - Launch Chromium browser with headless mode
  - Configure browser context with OnlyFans cookies and headers
  - Implement browser page pool for concurrent operations
  - Add browser crash detection and restart logic
  - _Requirements: 7.4_

- [ ] 4.2 Implement OnlyFans authentication
  - Retrieve OnlyFans API credentials from AWS Secrets Manager
  - Implement login flow with Playwright
  - Handle 2FA if required
  - Store session cookies for reuse
  - Refresh authentication on 401 errors
  - _Requirements: 8.2, 8.5_

- [ ] 4.3 Implement send_message action handler
  - Navigate to creator's message page
  - Fill message input field with content from payload
  - Click send button and wait for confirmation
  - Capture response status and message ID
  - Handle rate limit errors (429) gracefully
  - _Requirements: 7.1, 7.5_

- [ ] 4.4 Implement scrape_profile action handler
  - Navigate to creator's profile URL
  - Extract profile data (name, bio, stats, media count)
  - Take screenshot for verification
  - Store profile data in structured format
  - _Requirements: 7.5_

- [ ] 4.5 Implement download_media action handler
  - Navigate to media URLs from payload
  - Download media files using Playwright
  - Upload files to S3 bucket with creator_id prefix
  - Return S3 URLs in result
  - _Requirements: 8.2_

- [ ] 5. Implement error handling and circuit breaker
  - Create `lib/scraper/src/circuit-breaker.ts` with circuit breaker pattern
  - Implement error classification (rate_limit, server_error, client_error, network_error)
  - Add retry logic with exponential backoff for 5xx errors
  - Implement circuit breaker to pause processing on repeated failures
  - Log all errors with full context for debugging
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5.1 Implement CircuitBreaker class
  - Track failure count and state (CLOSED, OPEN, HALF_OPEN)
  - Open circuit after 5 consecutive failures
  - Close circuit after timeout (60 seconds)
  - Transition to HALF_OPEN for testing recovery
  - Log state transitions to CloudWatch
  - _Requirements: 7.4_

- [ ] 5.2 Implement error classification logic
  - Classify OnlyFans 429 as rate_limit (retry without failure count)
  - Classify OnlyFans 5xx as server_error (retry with exponential backoff)
  - Classify OnlyFans 4xx (except 429) as client_error (no retry, delete message)
  - Classify network timeouts as network_error (retry with increased timeout)
  - Classify Playwright crashes as unknown (retry with browser restart)
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 5.3 Implement exponential backoff retry logic
  - Retry 5xx errors up to 3 times with delays: 1s, 2s, 4s
  - Retry network timeouts up to 3 times with increased timeout: 30s, 60s, 120s
  - Do NOT retry 4xx client errors (except 429)
  - Log each retry attempt with attempt number and delay
  - _Requirements: 7.2_

- [ ] 6. Implement CloudWatch metrics and logging
  - Create `lib/scraper/src/metrics.ts` to publish custom metrics
  - Publish scraping_success_rate, scraping_duration_ms, onlyfans_429_count, onlyfans_5xx_count, onlyfans_4xx_count
  - Log all processing events to CloudWatch Logs with structured JSON
  - Add correlation_id to all logs for request tracing
  - _Requirements: 4.4, 5.4_

- [ ] 6.1 Implement CloudWatch metrics publisher
  - Use AWS SDK v3 CloudWatch PutMetricDataCommand
  - Publish metrics to namespace "Huntaze/OnlyFans"
  - Add dimensions: action, creator_id, status
  - Batch metrics to reduce API calls
  - _Requirements: 5.4_

- [ ] 6.2 Implement structured logging
  - Use Winston or Pino for structured JSON logging
  - Include message_id, creator_id, action, status, duration_ms in all logs
  - Add correlation_id from message metadata for tracing
  - Log to stdout for CloudWatch Logs capture
  - _Requirements: 4.4, 7.5_

- [ ] 7. Create ECS task definition and service
  - Create `infra/terraform/onlyfans-scraper/task-definition.tf` for ECS task
  - Configure task with 1 vCPU, 2 GB memory, ARM64 architecture
  - Create ECS service with auto-scaling based on queue depth
  - Configure Fargate Spot capacity provider (70% Spot, 30% On-Demand)
  - Add IAM roles for task execution and task permissions
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 8.2_

- [ ] 7.1 Create ECS task definition
  - Define task family "huntaze-onlyfans-scraper"
  - Set CPU to 1024 (1 vCPU) and memory to 2048 MB (2 GB)
  - Use ARM64 platform for Graviton2 cost savings
  - Configure container with ECR image URL
  - Add environment variables: WORKFLOWS_QUEUE_URL, AWS_REGION, NODE_ENV
  - Add secrets: ONLYFANS_API_KEY from Secrets Manager
  - Configure CloudWatch Logs with log group "/huntaze/production/onlyfans-scraper"
  - _Requirements: 6.1, 6.2, 8.2, 8.5_

- [ ] 7.2 Create ECS service with auto-scaling
  - Create ECS service "huntaze-onlyfans-scraper-service"
  - Set desired count to 1 (minimum)
  - Configure Application Auto Scaling with target tracking
  - Set target value to 100 messages (ApproximateNumberOfMessagesVisible)
  - Set min capacity to 1, max capacity to 10
  - Set scale-in cooldown to 300 seconds, scale-out cooldown to 60 seconds
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7.3 Configure Fargate Spot capacity provider
  - Create capacity provider strategy with FARGATE_SPOT (weight 4) and FARGATE (weight 1)
  - Set base to 1 for minimum On-Demand task
  - Configure service to use capacity provider strategy
  - _Requirements: 6.1_

- [ ] 7.4 Create IAM roles for ECS task
  - Create task execution role with ECR pull permissions and Secrets Manager access
  - Create task role with SQS ReceiveMessage/DeleteMessage permissions for workflows queue
  - Add S3 PutObject permission for results storage
  - Add CloudWatch PutMetricData permission for custom metrics
  - Add Secrets Manager GetSecretValue permission for OnlyFans credentials
  - _Requirements: 8.2_

- [ ] 8. Create CloudWatch alarms and dashboard
  - Create `infra/terraform/onlyfans-scraper/cloudwatch.tf` for monitoring
  - Create alarms for queue depth, queue age, Lambda errors, scraper failure rate, DLQ messages
  - Create CloudWatch dashboard with key metrics and logs insights queries
  - Configure SNS notifications to huntaze-cost-alerts topic
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.1 Create CloudWatch alarms
  - Create alarm for workflows_queue_age_critical (> 1800 seconds)
  - Create alarm for workflows_queue_depth_high (> 500 messages)
  - Create alarm for lambda_errors_critical (> 50 in 5 minutes)
  - Create alarm for scraper_failure_rate_critical (> 50% for 10 minutes)
  - Create alarm for dlq_messages_critical (> 100 messages)
  - Configure all alarms to send to huntaze-cost-alerts SNS topic
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 8.2 Create CloudWatch dashboard
  - Create dashboard "Huntaze-OnlyFans-Scraper"
  - Add widget for rate limiter metrics (allowed vs rejected)
  - Add widget for queue depth and age
  - Add widget for Lambda performance (duration, errors, throttles)
  - Add widget for scraper success rate
  - Add widget for OnlyFans API errors (429, 4xx, 5xx)
  - Add widget for ECS auto-scaling (running vs desired tasks)
  - Add widget for ECS resource usage (CPU, memory)
  - Add logs insights widget for recent rate limit decisions
  - Add logs insights widget for scraping performance
  - _Requirements: 5.4_

- [ ] 9. Create deployment scripts and documentation
  - Create `scripts/deploy-onlyfans-scraper.sh` for automated deployment
  - Create `scripts/build-scraper-image.sh` to build and push Docker image
  - Create `docs/runbooks/onlyfans-scraper-operations.md` with operational procedures
  - Create `docs/runbooks/onlyfans-scraper-troubleshooting.md` with common issues
  - _Requirements: All_

- [ ] 9.1 Create Docker image build script
  - Write script to build Playwright scraper Docker image
  - Tag image with version and "latest"
  - Push image to ECR repository
  - Verify image size and layers
  - _Requirements: 6.2_

- [ ] 9.2 Create deployment script
  - Write script to deploy Lambda changes (update function code)
  - Deploy Terraform infrastructure (ECS task definition, service, alarms)
  - Verify deployment with health checks
  - Run smoke tests to validate end-to-end flow
  - _Requirements: All_

- [ ] 9.3 Create operations runbook
  - Document how to monitor the system (dashboard, alarms, logs)
  - Document how to scale manually (update desired count)
  - Document how to pause processing (scale to zero)
  - Document how to replay DLQ messages
  - Document how to rotate OnlyFans credentials
  - _Requirements: All_

- [ ] 9.4 Create troubleshooting runbook
  - Document common issues: high queue depth, Lambda errors, scraper failures
  - Document how to investigate errors using CloudWatch Logs Insights
  - Document how to identify rate limiting issues
  - Document how to handle OnlyFans API changes
  - Document rollback procedures
  - _Requirements: All_

- [ ] 10. Write integration tests
  - Create `tests/integration/onlyfans-scraper-e2e.test.ts` for end-to-end testing
  - Test message flow from rate limiter queue to workflows queue to scraper
  - Test rate limiting behavior (10 msg/min)
  - Test error handling and DLQ
  - Test auto-scaling behavior
  - _Requirements: All_

- [ ] 10.1 Write end-to-end integration test
  - Send test message to rate limiter queue
  - Verify Lambda processes and forwards to workflows queue
  - Verify scraper consumes and processes message
  - Verify results stored in S3
  - Verify metrics published to CloudWatch
  - _Requirements: All_

- [ ] 10.2 Write rate limiting integration test
  - Send 20 messages rapidly to rate limiter queue
  - Verify only 10 processed in first minute
  - Verify remaining 10 processed in second minute
  - Verify no messages lost
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 10.3 Write error handling integration test
  - Simulate OnlyFans 429 response
  - Verify message retries without failure count increment
  - Simulate OnlyFans 5xx response
  - Verify exponential backoff retry behavior
  - Simulate OnlyFans 4xx response
  - Verify message deleted without retry
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10.4 Write auto-scaling integration test
  - Send 500 messages to workflows queue
  - Verify ECS service scales out to handle load
  - Verify queue depth decreases as messages processed
  - Verify service scales back down after processing complete
  - _Requirements: 3.1, 3.2, 3.3_
