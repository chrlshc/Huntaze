import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { makeReqLogger } from "./logger";

// Lazy initialization of SQS client for better testability
let sqsClient: SQSClient | null = null;

function getSQSClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({ 
      region: process.env.AWS_REGION || "us-east-1" 
    });
  }
  return sqsClient;
}

// Export for testing purposes
export const sqs = getSQSClient();

const logger = makeReqLogger({ service: "sqs" });

/**
 * Enqueue a content posting task to SQS
 * @param taskId - The ContentTask ID to process
 * @throws Error if SQS is unavailable or message send fails
 */
export async function enqueuePostContent(taskId: string): Promise<void> {
  const QueueUrl = process.env.AWS_SQS_QUEUE_URL;
  
  if (!QueueUrl) {
    const error = new Error("AWS_SQS_QUEUE_URL environment variable is not set");
    logger.error("sqs_config_missing", { error: error.message });
    throw error;
  }

  const messageBody = JSON.stringify({ 
    type: "POST_CONTENT", 
    taskId 
  });

  try {
    logger.info("sqs_enqueue_start", { taskId, queueUrl: QueueUrl });

    const command = new SendMessageCommand({
      QueueUrl,
      MessageBody: messageBody,
    });

    const client = getSQSClient();
    const response = await client.send(command);

    logger.info("sqs_enqueue_success", { 
      taskId, 
      messageId: response.MessageId,
      queueUrl: QueueUrl 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("sqs_enqueue_failed", { 
      taskId, 
      error: errorMessage,
      queueUrl: QueueUrl 
    });
    throw new Error(`Failed to enqueue task ${taskId}: ${errorMessage}`);
  }
}

// For testing: reset the client
export function __resetSQSClient() {
  sqsClient = null;
}
