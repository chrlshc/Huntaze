/**
 * Rate Limiter Lambda - Token Bucket Algorithm
 * 
 * Implements token bucket rate limiting using Redis with Lua scripts
 * for atomic operations. Integrates with SQS for message processing.
 * 
 * References:
 * - AWS Lambda + SQS: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
 * - Partial Batch Response: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting
 * - Token Bucket Algorithm: https://en.wikipedia.org/wiki/Token_bucket
 */

import { SQSClient, ChangeMessageVisibilityCommand } from "@aws-sdk/client-sqs";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import Redis from "ioredis";

// Environment variables
const {
  QUEUE_URL,
  REDIS_HOST,
  REDIS_PORT = "6379",
  REDIS_AUTH_TOKEN_SECRET_ARN,
  REDIS_AUTH_TOKEN,
  TOKENS_PER_WINDOW = "10",    // 10 messages per window
  WINDOW_SECONDS = "60",        // 60 seconds (1 minute)
  BUCKET_CAPACITY = "10",       // Max burst capacity
  AWS_REGION = "us-east-1"
} = process.env;

// AWS clients
const sqs = new SQSClient({ region: AWS_REGION });
const secretsManager = new SecretsManagerClient({ region: AWS_REGION });

// Redis client (initialized lazily)
let redis = null;
let redisAuthToken = null;

/**
 * Get Redis AUTH token from Secrets Manager or environment
 */
async function getRedisAuthToken() {
  if (redisAuthToken) {
    return redisAuthToken;
  }

  if (REDIS_AUTH_TOKEN) {
    redisAuthToken = REDIS_AUTH_TOKEN;
    return redisAuthToken;
  }

  if (REDIS_AUTH_TOKEN_SECRET_ARN) {
    try {
      const command = new GetSecretValueCommand({
        SecretId: REDIS_AUTH_TOKEN_SECRET_ARN
      });
      const response = await secretsManager.send(command);
      redisAuthToken = response.SecretString;
      return redisAuthToken;
    } catch (error) {
      console.error("Failed to get Redis AUTH token from Secrets Manager:", error);
      throw error;
    }
  }

  throw new Error("No Redis AUTH token configured");
}

/**
 * Initialize Redis connection with TLS
 */
async function getRedisClient() {
  if (redis && redis.status === "ready") {
    return redis;
  }

  const authToken = await getRedisAuthToken();

  redis = new Redis({
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT),
    password: authToken,
    tls: {
      servername: REDIS_HOST
    },
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  });

  // Define Lua script for token bucket algorithm
  // This ensures atomic operations in Redis
  redis.defineCommand("tokenBucket", {
    numberOfKeys: 1,
    lua: `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local tokens_per_window = tonumber(ARGV[3])
      local window_seconds = tonumber(ARGV[4])
      local tokens_needed = tonumber(ARGV[5])
      
      -- Get current state
      local data = redis.call("HMGET", key, "tokens", "timestamp")
      local tokens = tonumber(data[1]) or capacity
      local last_timestamp = tonumber(data[2]) or now
      
      -- Calculate token refill
      local elapsed = math.max(0, now - last_timestamp)
      local refill = tokens_per_window * (elapsed / window_seconds)
      tokens = math.min(capacity, tokens + refill)
      
      -- Check if we have enough tokens
      local allowed = 0
      local retry_after = 0
      
      if tokens >= tokens_needed then
        -- Consume tokens
        tokens = tokens - tokens_needed
        allowed = 1
      else
        -- Calculate retry delay
        local missing = tokens_needed - tokens
        retry_after = math.ceil((missing / tokens_per_window) * window_seconds)
      end
      
      -- Update state
      redis.call("HMSET", key, "tokens", tokens, "timestamp", now)
      redis.call("EXPIRE", key, math.ceil(window_seconds * 2))
      
      return {allowed, retry_after, tokens}
    `
  });

  // Wait for connection
  await redis.connect();

  console.log("Redis client initialized successfully");
  return redis;
}

/**
 * Send message to OnlyFans API
 * TODO: Replace with actual OnlyFans API integration
 */
async function sendToOnlyFansAPI(payload) {
  console.log("Sending to OnlyFans API:", JSON.stringify(payload));
  
  // Simulate API call
  // In production, this would be the actual OnlyFans API call
  // throw new Error("OnlyFans API error"); // Uncomment to test error handling
  
  return {
    success: true,
    messageId: payload.messageId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Lambda handler
 * 
 * Processes SQS messages with token bucket rate limiting.
 * Uses Partial Batch Response to only retry failed messages.
 */
export const handler = async (event) => {
  console.log("Processing batch:", JSON.stringify({
    recordCount: event.Records.length,
    timestamp: new Date().toISOString()
  }));

  const failures = [];
  const redisClient = await getRedisClient();
  
  const now = Math.floor(Date.now() / 1000);
  const capacity = Number(BUCKET_CAPACITY);
  const tokensPerWindow = Number(TOKENS_PER_WINDOW);
  const windowSeconds = Number(WINDOW_SECONDS);

  for (const record of event.Records) {
    const messageId = record.messageId;
    const receiptHandle = record.receiptHandle;
    
    try {
      const payload = JSON.parse(record.body);
      
      // Determine bucket key (global or per-user)
      // For OnlyFans, we use a global bucket to respect platform limits
      const bucketKey = `rate_limit:onlyfans:global`;
      
      // Try to consume a token
      const [allowed, retryAfter, remainingTokens] = await redisClient.tokenBucket(
        bucketKey,
        now,
        capacity,
        tokensPerWindow,
        windowSeconds,
        1 // tokens needed per message
      );

      console.log("Token bucket result:", {
        messageId,
        allowed: allowed === 1,
        retryAfter,
        remainingTokens
      });

      if (allowed === 1) {
        // Token available - send message
        try {
          await sendToOnlyFansAPI(payload);
          console.log(`✓ Message ${messageId} sent successfully`);
          // Success - Lambda will automatically delete the message
        } catch (apiError) {
          // API call failed - mark for retry
          console.error(`✗ API error for message ${messageId}:`, apiError);
          failures.push({ itemIdentifier: messageId });
        }
      } else {
        // No token available - reschedule message
        console.log(`⏳ Rate limited message ${messageId}, retry after ${retryAfter}s`);
        
        // Change message visibility to retry after calculated delay
        // Max visibility timeout is 12 hours (43200 seconds)
        const visibilityTimeout = Math.min(retryAfter, 600); // Cap at 10 minutes
        
        await sqs.send(new ChangeMessageVisibilityCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: receiptHandle,
          VisibilityTimeout: visibilityTimeout
        }));
        
        // Don't mark as failure - it will be retried automatically
      }
    } catch (error) {
      // Unexpected error - mark for retry
      console.error(`✗ Error processing message ${messageId}:`, error);
      failures.push({ itemIdentifier: messageId });
    }
  }

  // Return Partial Batch Response
  // Only failed messages will be retried by SQS
  const response = failures.length > 0 
    ? { batchItemFailures: failures }
    : {};

  console.log("Batch processing complete:", {
    total: event.Records.length,
    failures: failures.length,
    success: event.Records.length - failures.length
  });

  return response;
};

/**
 * Health check handler (for testing)
 */
export const healthCheck = async () => {
  try {
    const redisClient = await getRedisClient();
    const pong = await redisClient.ping();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "healthy",
        redis: pong === "PONG" ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
