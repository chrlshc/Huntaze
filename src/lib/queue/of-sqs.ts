import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const QUEUE_URL = process.env.OF_SQS_SEND_QUEUE_URL as string;

const sqs = new SQSClient({ region: REGION });

export type SendJob = {
  id: string;
  userId: string;
  conversationId: string;
  content: { text: string };
  // Optional PPV fields (worker may ignore if unsupported)
  ppv?: {
    priceCents: number;
    caption?: string;
    mediaUrl?: string;
    variant?: 'A' | 'B' | 'C';
  };
};

export type LoginJob = {
  type: 'login';
  userId: string;
  otp?: string;
};

export async function enqueueSend(job: SendJob) {
  if (!QUEUE_URL) throw new Error('OF_SQS_SEND_QUEUE_URL not configured');
  const isFifo = /\.fifo$/i.test(QUEUE_URL || '');
  const params: any = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({ type: 'send', ...job }),
  };
  if (isFifo) {
    params.MessageGroupId = job.userId;
    params.MessageDeduplicationId = job.id;
  }
  await sqs.send(new SendMessageCommand(params));
}

export async function enqueueLogin(job: { userId: string; otp?: string }) {
  if (!QUEUE_URL) throw new Error('OF_SQS_SEND_QUEUE_URL not configured');
  const payload: LoginJob = { type: 'login', userId: job.userId, otp: job.otp };
  const isFifo = /\.fifo$/i.test(QUEUE_URL || '');
  const params: any = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  };
  if (isFifo) {
    params.MessageGroupId = job.userId;
    params.MessageDeduplicationId = `login:${job.userId}:${job.otp || 'none'}`;
  }
  await sqs.send(new SendMessageCommand(params));
}
