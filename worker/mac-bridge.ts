import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageCommand,
  Message,
} from "@aws-sdk/client-sqs";
import { PrismaClient, ContentTaskStatus } from "@prisma/client";
import { makeReqLogger } from "../lib/logger";

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_BASE_SECONDS = 2; // 2^attemptCount seconds

const logger = makeReqLogger({ service: "worker-mac" });

// Lazy initialization for better testability
let sqsClient: SQSClient | null = null;
let prisma: PrismaClient | null = null;

function getSQSClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }
  return sqsClient;
}

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Export for testing
export function __resetClients() {
  sqsClient = null;
  if (prisma) {
    prisma.$disconnect();
    prisma = null;
  }
}

interface SQSMessageBody {
  type: string;
  taskId: string;
}

/**
 * Parse SQS message body and extract taskId
 */
export function parseMessage(message: Message): SQSMessageBody | null {
  if (!message.Body) {
    logger.warn("sqs_message_no_body", { messageId: message.MessageId });
    return null;
  }

  try {
    const body = JSON.parse(message.Body) as SQSMessageBody;

    if (!body.type || !body.taskId) {
      logger.warn("sqs_message_invalid_format", {
        messageId: message.MessageId,
        body,
      });
      return null;
    }

    return body;
  } catch (error) {
    logger.error("sqs_message_parse_error", {
      messageId: message.MessageId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Result of handlePostContent indicating whether to delete the SQS message
 */
export interface HandlePostContentResult {
  shouldDeleteMessage: boolean;
  retryDelaySeconds?: number;
}

/**
 * Handle a POST_CONTENT task
 * - Fetch ContentTask from DB
 * - Check idempotence (skip if POSTED or CANCELLED)
 * - Check scheduling (delay if scheduledAt is in the future)
 * - Update status to PROCESSING
 * - Call platform-specific posting function
 * - Update status to POSTED or FAILED
 * - Implement retry with exponential backoff (max 3 attempts)
 *
 * Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4, 9.5
 */
export async function handlePostContent(taskId: string): Promise<HandlePostContentResult> {
  const db = getPrisma();

  logger.info("task_handle_start", { taskId });

  try {
    // Fetch task from DB
    const task = await db.contentTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      logger.error("task_not_found", { taskId });
      // Task doesn't exist - delete the message to avoid infinite loop
      return { shouldDeleteMessage: true };
    }

    // Idempotence check: skip if already POSTED
    if (task.status === ContentTaskStatus.POSTED) {
      logger.info("task_already_posted", {
        taskId,
        externalPostId: task.externalPostId,
        postedAt: task.postedAt,
      });
      return { shouldDeleteMessage: true };
    }

    // Check for CANCELLED status (Requirement 9.5)
    if (task.status === ("CANCELLED" as ContentTaskStatus)) {
      logger.info("task_cancelled", { taskId });
      return { shouldDeleteMessage: true };
    }

    // Check for FAILED status (already exceeded retries)
    if (task.status === ContentTaskStatus.FAILED) {
      logger.info("task_already_failed", { taskId, attemptCount: task.attemptCount });
      return { shouldDeleteMessage: true };
    }

    // Scheduling check: if scheduledAt is in the future, delay (Requirement 9.2, 9.3)
    if (task.scheduledAt) {
      const now = new Date();
      const scheduledTime = new Date(task.scheduledAt);
      const delayMs = scheduledTime.getTime() - now.getTime();

      if (delayMs > 0) {
        // Task is scheduled for the future - calculate delay
        // SQS max delay is 900 seconds (15 minutes)
        const delaySeconds = Math.min(Math.ceil(delayMs / 1000), 900);

        logger.info("task_scheduled_delay", {
          taskId,
          scheduledAt: scheduledTime.toISOString(),
          delaySeconds,
        });

        // Return with delay - message will be re-queued
        return { shouldDeleteMessage: false, retryDelaySeconds: delaySeconds };
      }
    }

    // Increment attempt count first
    const currentAttempt = task.attemptCount + 1;

    // Update status to PROCESSING
    await db.contentTask.update({
      where: { id: taskId },
      data: {
        status: ContentTaskStatus.PROCESSING,
        startedAt: new Date(),
        attemptCount: currentAttempt,
      },
    });

    logger.info("task_status_processing", {
      taskId,
      platform: task.platform,
      attemptCount: currentAttempt,
    });

    // Call platform-specific posting function
    let externalPostId: string;

    if (task.platform === "TIKTOK") {
      externalPostId = await postToTikTok(task);
    } else if (task.platform === "INSTAGRAM") {
      externalPostId = await postToInstagram(task);
    } else {
      throw new Error(`Unsupported platform: ${task.platform}`);
    }

    // Update status to POSTED
    await db.contentTask.update({
      where: { id: taskId },
      data: {
        status: ContentTaskStatus.POSTED,
        postedAt: new Date(),
        externalPostId,
      },
    });

    logger.info("task_posted_success", {
      taskId,
      platform: task.platform,
      externalPostId,
    });

    return { shouldDeleteMessage: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const stackTrace = error instanceof Error ? error.stack : undefined;

    logger.error("task_handle_failed", {
      taskId,
      error: errorMessage,
      stack: stackTrace,
    });

    // Fetch current task state for retry logic
    const task = await db.contentTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { shouldDeleteMessage: true };
    }

    const currentAttempt = task.attemptCount;

    // Retry logic (Requirement 6.1, 6.2, 6.3)
    if (currentAttempt < MAX_RETRY_ATTEMPTS) {
      // Calculate exponential backoff delay
      const backoffSeconds = Math.pow(BACKOFF_BASE_SECONDS, currentAttempt);

      logger.info("task_retry_scheduled", {
        taskId,
        attemptCount: currentAttempt,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        backoffSeconds,
      });

      // Update status back to PENDING for retry
      await db.contentTask.update({
        where: { id: taskId },
        data: {
          status: ContentTaskStatus.PENDING,
          errorMessage: `Attempt ${currentAttempt} failed: ${errorMessage}`,
        },
      });

      // Return with delay for retry - don't delete message
      return { shouldDeleteMessage: false, retryDelaySeconds: backoffSeconds };
    }

    // Max retries exceeded - mark as FAILED permanently (Requirement 6.2)
    logger.error("task_max_retries_exceeded", {
      taskId,
      attemptCount: currentAttempt,
      maxAttempts: MAX_RETRY_ATTEMPTS,
    });

    await db.contentTask.update({
      where: { id: taskId },
      data: {
        status: ContentTaskStatus.FAILED,
        errorMessage: `Failed after ${currentAttempt} attempts.\n\nLast error: ${errorMessage}\n\nStack trace:\n${stackTrace}`,
      },
    });

    return { shouldDeleteMessage: true };
  }
}

/**
 * Post content to TikTok
 */
async function postToTikTok(task: any): Promise<string> {
  const db = getPrisma();

  // Fetch TikTok SocialAccount
  const socialAccount = await db.socialAccount.findUnique({
    where: {
      userId_platform: {
        userId: task.userId,
        platform: "TIKTOK",
      },
    },
  });

  if (!socialAccount) {
    throw new Error(
      `No TikTok account connected for user ${task.userId}`
    );
  }

  // Import and call TikTok posting function
  const { postToTikTok: postToTT } = await import("./platforms/tiktok");
  return await postToTT(task, socialAccount);
}

/**
 * Post content to Instagram
 */
async function postToInstagram(task: any): Promise<string> {
  const db = getPrisma();
  
  // Fetch Instagram SocialAccount
  const socialAccount = await db.socialAccount.findUnique({
    where: {
      userId_platform: {
        userId: task.userId,
        platform: "INSTAGRAM",
      },
    },
  });

  if (!socialAccount) {
    throw new Error(
      `No Instagram account connected for user ${task.userId}`
    );
  }

  // Import and call Instagram posting function
  const { postToInstagram: postToIG } = await import("./platforms/instagram");
  return await postToIG(task, socialAccount);
}

/**
 * Re-queue a message with delay for scheduling or retry
 */
async function requeueWithDelay(taskId: string, delaySeconds: number): Promise<void> {
  const queueUrl = process.env.SQS_QUEUE_URL;
  if (!queueUrl) {
    logger.error("requeue_no_queue_url", { taskId });
    return;
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ type: "POST_CONTENT", taskId }),
    DelaySeconds: Math.min(delaySeconds, 900), // SQS max is 900 seconds
  });

  await getSQSClient().send(command);

  logger.info("task_requeued", {
    taskId,
    delaySeconds: Math.min(delaySeconds, 900),
  });
}

/**
 * Process a single SQS message
 */
async function processMessage(message: Message): Promise<boolean> {
  const body = parseMessage(message);

  if (!body) {
    // Invalid message format - delete it to avoid reprocessing
    return true;
  }

  if (body.type !== "POST_CONTENT") {
    logger.warn("sqs_message_unknown_type", {
      messageId: message.MessageId,
      type: body.type,
    });
    // Unknown message type - delete it
    return true;
  }

  const result = await handlePostContent(body.taskId);

  // Handle re-queue with delay for scheduling or retry
  if (!result.shouldDeleteMessage && result.retryDelaySeconds) {
    await requeueWithDelay(body.taskId, result.retryDelaySeconds);
  }

  // Return whether to delete the original message
  return result.shouldDeleteMessage;
}

/**
 * Main worker loop
 * - Long-poll SQS for messages
 * - Process each message
 * - Delete message if successful
 */
export async function runWorkerLoop(): Promise<void> {
  const QueueUrl = process.env.AWS_SQS_QUEUE_URL;

  if (!QueueUrl) {
    throw new Error("AWS_SQS_QUEUE_URL environment variable is not set");
  }

  const sqs = getSQSClient();

  logger.info("worker_loop_start", { queueUrl: QueueUrl });

  while (true) {
    try {
      // Long-poll SQS (wait up to 20 seconds for messages)
      const command = new ReceiveMessageCommand({
        QueueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 120, // 2 minutes to process
      });

      const response = await sqs.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        // No messages - continue polling
        continue;
      }

      for (const message of response.Messages) {
        logger.info("sqs_message_received", {
          messageId: message.MessageId,
        });

        const shouldDelete = await processMessage(message);

        if (shouldDelete && message.ReceiptHandle) {
          // Delete message from queue
          const deleteCommand = new DeleteMessageCommand({
            QueueUrl,
            ReceiptHandle: message.ReceiptHandle,
          });

          await sqs.send(deleteCommand);

          logger.info("sqs_message_deleted", {
            messageId: message.MessageId,
          });
        }
      }
    } catch (error) {
      logger.error("worker_loop_error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Wait before retrying to avoid tight error loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Start worker if run directly
if (require.main === module) {
  runWorkerLoop().catch((error) => {
    logger.error("worker_fatal_error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  });
}
