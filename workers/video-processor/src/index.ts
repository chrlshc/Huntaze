import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { processVideoJob } from './processor';
import { updateJobStatus } from './db';

const REGION = process.env.AWS_REGION || 'us-east-1';
const QUEUE_URL = process.env.SQS_QUEUE_URL;

if (!QUEUE_URL) {
  console.error('SQS_QUEUE_URL environment variable is required');
  process.exit(1);
}

const sqsClient = new SQSClient({ region: REGION });

interface VideoJobMessage {
  jobId: string;
  s3Key: string;
  userId: string;
  options: {
    autoCaptions: boolean;
    smartCuts: boolean;
    removeWatermark: boolean;
    sendToMarketing: boolean;
  };
  targets: string[];
  variants: number;
  script?: {
    variants: Array<{ hook?: string; body?: string; cta?: string }>;
  };
}

async function pollQueue(): Promise<void> {
  console.log('Polling SQS queue for messages...');

  while (true) {
    try {
      const response = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 900, // 15 min for processing
        })
      );

      if (!response.Messages || response.Messages.length === 0) {
        continue;
      }

      for (const message of response.Messages) {
        if (!message.Body || !message.ReceiptHandle) continue;

        const job: VideoJobMessage = JSON.parse(message.Body);
        console.log(`Processing job: ${job.jobId}`);

        try {
          await updateJobStatus(job.jobId, 'running', 10);

          const result = await processVideoJob(job);

          await updateJobStatus(job.jobId, 'finished', 100, result.createdContentIds);

          // Delete message from queue on success
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            })
          );

          console.log(`Job ${job.jobId} completed successfully`);
        } catch (error) {
          console.error(`Job ${job.jobId} failed:`, error);
          await updateJobStatus(
            job.jobId,
            'failed',
            0,
            [],
            error instanceof Error ? error.message : 'Unknown error'
          );
          // Message will return to queue after visibility timeout for retry
        }
      }
    } catch (error) {
      console.error('Queue polling error:', error);
      await sleep(5000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log('Huntaze Video Processor Worker starting...');
console.log(`Region: ${REGION}`);
console.log(`Queue: ${QUEUE_URL}`);

pollQueue().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
