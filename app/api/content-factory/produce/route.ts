import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Pool } from 'pg';
import { auth } from '@/lib/auth/config';

const BUCKET = process.env.S3_BUCKET || 'huntaze-videos-production';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const DATABASE_URL = process.env.DATABASE_URL;

// Extract region from SQS queue URL if AWS_REGION not set
const getRegionFromUrl = (url: string) => {
  const match = url.match(/https:\/\/sqs\.([^.]+)\.amazonaws\.com/);
  return match ? match[1] : 'us-east-1';
};

const REGION = process.env.AWS_REGION || (SQS_QUEUE_URL ? getRegionFromUrl(SQS_QUEUE_URL) : 'us-east-1');

// Initialize AWS clients
const s3Client = new S3Client({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });

// Database connection
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}) : null;

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const tiktokUrl = formData.get('tiktokUrl') as string | null;
    const s3Key = formData.get('s3Key') as string | null; // For direct S3 uploads
    const idea = formData.get('idea') as string | null;
    const targets = formData.get('targets') as string || 'all';
    const variants = parseInt(formData.get('variants') as string || '3', 10);
    const optionsStr = formData.get('options') as string | null;
    const scriptStr = formData.get('script') as string | null;
    const packagingStr = formData.get('packaging') as string | null;

    // Parse options
    let options = {
      removeWatermark: false,
      autoCaptions: true,
      smartCuts: true,
      sendToMarketing: true,
    };
    if (optionsStr) {
      try {
        options = { ...options, ...JSON.parse(optionsStr) };
      } catch {
        // ignore parse errors
      }
    }

    // Parse script
    let script = null;
    if (scriptStr) {
      try {
        script = JSON.parse(scriptStr);
      } catch {
        // ignore parse errors
      }
    }

    // Parse packaging
    let packaging = null;
    if (packagingStr) {
      try {
        packaging = JSON.parse(packagingStr);
      } catch {
        // ignore parse errors
      }
    }

    // Validate source
    if (!file && !tiktokUrl?.trim() && !s3Key) {
      return NextResponse.json(
        { error: 'Either file, tiktokUrl, or s3Key is required' },
        { status: 400 }
      );
    }

    // Create job ID
    const jobId = generateJobId();
    let finalS3Key = s3Key;

    // Handle file upload to S3
    if (file) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).slice(2, 8);
      const extension = file.name.split('.').pop() || 'mp4';
      finalS3Key = `uploads/${timestamp}_${randomId}.${extension}`;

      // Convert File to Buffer for S3 upload
      const buffer = await file.arrayBuffer();
      
      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: finalS3Key,
          Body: Buffer.from(buffer),
          ContentType: file.type,
        })
      );
    }

    // Create job in database if available
    if (pool) {
      await pool.query(
        `INSERT INTO production_jobs (id, user_id, s3_key, tiktok_url, idea, targets, variants, options, script, packaging, status, progress, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          jobId,
          userId,
          finalS3Key,
          tiktokUrl?.trim() || null,
          idea?.trim() || null,
          targets,
          variants,
          JSON.stringify(options),
          JSON.stringify(script),
          JSON.stringify(packaging),
          'queued',
          10,
        ]
      );
    }

    // Send message to SQS queue
    if (SQS_QUEUE_URL) {
      const message = {
        jobId,
        s3Key: finalS3Key,
        tiktokUrl: tiktokUrl?.trim() || null,
        userId,
        idea: idea?.trim() || null,
        targets,
        variants,
        options,
        script,
        packaging,
      };

      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MessageBody: JSON.stringify(message),
        })
      );
    } else {
      // Fallback to simulation if no SQS configured
      console.warn('SQS_QUEUE_URL not configured, using simulation mode');
    }

    // Log for debugging
    console.log('Content Factory - Production started:', {
      jobId,
      hasFile: !!file,
      s3Key: finalS3Key,
      tiktokUrl: tiktokUrl?.slice(0, 50),
      idea: idea?.slice(0, 50),
      targets,
      variants,
      options,
      hasScript: !!script,
      hasPackaging: !!packaging,
    });

    return NextResponse.json({
      jobId,
      status: 'queued',
      progress: 10,
      message: 'Job queued for processing',
    });
  } catch (error) {
    console.error('Content Factory produce error:', error);
    return NextResponse.json(
      { error: 'Failed to start production' },
      { status: 500 }
    );
  }
}
