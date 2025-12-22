import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { Pool } from 'pg';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const DATABASE_URL = process.env.DATABASE_URL;

const s3Client = new S3Client({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}) : null;

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  checks: {
    s3: boolean;
    sqs: boolean;
    database: boolean;
    ffmpeg: boolean;
  };
  timestamp: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const checks = {
    s3: false,
    sqs: false,
    database: false,
    ffmpeg: false,
  };

  // Check S3 access
  if (BUCKET) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
      checks.s3 = true;
    } catch (error) {
      console.error('S3 health check failed:', error);
    }
  }

  // Check SQS access
  if (SQS_QUEUE_URL) {
    try {
      await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: SQS_QUEUE_URL,
          AttributeNames: ['ApproximateNumberOfMessages'],
        })
      );
      checks.sqs = true;
    } catch (error) {
      console.error('SQS health check failed:', error);
    }
  }

  // Check database
  if (pool) {
    try {
      await pool.query('SELECT 1');
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }
  }

  // Check ffmpeg
  try {
    const { spawn } = await import('child_process');
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => {
      if (code === 0) checks.ffmpeg = true;
    });
    // Wait a bit for the check
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('FFmpeg health check failed:', error);
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
}
