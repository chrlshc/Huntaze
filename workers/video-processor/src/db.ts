import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function updateJobStatus(
  jobId: string,
  status: 'queued' | 'running' | 'finished' | 'failed',
  progress: number,
  createdContentIds: string[] = [],
  error?: string
): Promise<void> {
  const query = `
    UPDATE production_jobs
    SET 
      status = $2,
      progress = $3,
      created_content_ids = $4,
      error = $5,
      updated_at = NOW()
    WHERE id = $1
  `;

  await pool.query(query, [
    jobId,
    status,
    progress,
    JSON.stringify(createdContentIds),
    error || null,
  ]);

  console.log(`Job ${jobId} status updated: ${status} (${progress}%)`);
}

interface CreateDraftsParams {
  jobId: string;
  userId: string;
  outputs: Array<{
    id: string;
    s3Key: string;
    variant: string;
    duration: number;
  }>;
  targets: string[];
  script?: {
    variants: Array<{ hook?: string; body?: string; cta?: string }>;
  };
  sendToMarketing: boolean;
}

export async function createDrafts(params: CreateDraftsParams): Promise<string[]> {
  const { jobId, userId, outputs, targets, script, sendToMarketing } = params;
  const createdIds: string[] = [];

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const scriptVariant = script?.variants?.[i];
      
      // Create content record
      const contentQuery = `
        INSERT INTO content (
          id, user_id, job_id, title, s3_key, variant, duration,
          caption, hook, cta, platforms, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id
      `;

      const title = `${output.variant.charAt(0).toUpperCase() + output.variant.slice(1)} - ${jobId.slice(-6)}`;
      const caption = scriptVariant?.body || '';
      const hook = scriptVariant?.hook || '';
      const cta = scriptVariant?.cta || '';

      await client.query(contentQuery, [
        output.id,
        userId,
        jobId,
        title,
        output.s3Key,
        output.variant,
        output.duration,
        caption,
        hook,
        cta,
        JSON.stringify(targets),
        'draft',
      ]);

      createdIds.push(output.id);

      // Add to marketing queue if requested
      if (sendToMarketing) {
        const queueQuery = `
          INSERT INTO content_queue (
            id, content_id, user_id, title, platforms, status,
            scheduled_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW(), NOW())
        `;

        const queueId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        await client.query(queueQuery, [
          queueId,
          output.id,
          userId,
          title,
          JSON.stringify(targets),
          'scheduled',
        ]);
      }
    }

    await client.query('COMMIT');
    console.log(`Created ${createdIds.length} drafts for job ${jobId}`);
    
    return createdIds;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getJob(jobId: string): Promise<{
  id: string;
  status: string;
  progress: number;
  createdContentIds: string[];
  error?: string;
} | null> {
  const result = await pool.query(
    'SELECT id, status, progress, created_content_ids, error FROM production_jobs WHERE id = $1',
    [jobId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    status: row.status,
    progress: row.progress,
    createdContentIds: JSON.parse(row.created_content_ids || '[]'),
    error: row.error,
  };
}
