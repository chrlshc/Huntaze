import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'eu-west-3';
const QUEUE_URL = process.env.OF_SQS_SEND_QUEUE_URL as string;

const sqs = new SQSClient({ region: REGION });

export type SendJob = {
  id: string;
  userId: string;
  conversationId: string;
  content: { text: string };
};

export type LoginJob = {
  type: 'login';
  userId: string;
  otp?: string;
};

export async function enqueueSend(job: SendJob) {
  if (!QUEUE_URL) throw new Error('OF_SQS_SEND_QUEUE_URL not configured');
  await sqs.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(job),
  }));
}

export async function enqueueLogin(job: { userId: string; otp?: string }) {
  if (!QUEUE_URL) throw new Error('OF_SQS_SEND_QUEUE_URL not configured');
  const payload: LoginJob = { type: 'login', userId: job.userId, otp: job.otp };
  await sqs.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  }));
}
