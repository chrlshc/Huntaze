/**
 * Content Calendar Scheduler
 * 
 * Runs periodically (cron or interval) to:
 * 1. Find content_items where schedule_at <= now
 * 2. Create platform_publications for each target platform
 * 3. Enqueue idempotent publish jobs
 * 
 * Architecture:
 * - content_items = source of truth (calendar)
 * - platform_publications = per-platform status tracking
 * - publish_jobs = durable queue with idempotency
 */

// TODO: Replace with your actual database module
// import { db } from '@/lib/db';

// Database abstraction (implement with your actual DB client)
const db = {
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> {
    console.log(`[db] Query: ${sql.slice(0, 100)}...`, params);
    return { rows: [] as T[] };
  },
};

interface ContentItem {
  id: string;
  owner_user_id: string;
  asset_id: string;
  title: string;
  caption: string;
  hashtags: string[];
  schedule_at: Date;
  targets: Record<string, unknown>;
  status: string;
}

interface EnqueueOptions {
  idempotencyKey: string;
  runAt?: Date;
}

/**
 * Enqueue a job to the publish queue.
 * In production, use BullMQ, Temporal, or similar.
 */
async function enqueue(
  queueName: string,
  data: {
    kind: string;
    contentItemId: string;
    platformPublicationId: string;
    idempotencyKey: string;
  },
  options: EnqueueOptions
): Promise<void> {
  // TODO: Replace with actual queue implementation
  // Example with BullMQ:
  // const queue = new Queue(queueName, { connection: redis });
  // await queue.add(data.kind, data, {
  //   jobId: options.idempotencyKey,
  //   delay: options.runAt ? options.runAt.getTime() - Date.now() : 0,
  // });

  // For now, insert into publish_jobs table as durable queue
  await db.query(`
    INSERT INTO publish_jobs (
      kind, content_item_id, platform_publication_id, 
      run_at, idempotency_key, status
    ) VALUES ($1, $2, $3, $4, $5, 'queued')
    ON CONFLICT (idempotency_key) DO NOTHING
  `, [
    data.kind,
    data.contentItemId,
    data.platformPublicationId,
    options.runAt || new Date(),
    options.idempotencyKey,
  ]);

  console.log(`[scheduler] Enqueued job: ${data.kind} for ${data.contentItemId}`);
}

/**
 * Upsert a platform publication record.
 */
async function upsertPlatformPublication(
  contentItemId: string,
  platform: string,
  socialAccountId: string
): Promise<{ id: string }> {
  const result = await db.query<{ id: string }>(`
    INSERT INTO platform_publications (content_item_id, platform, social_account_id, status)
    VALUES ($1, $2, $3, 'scheduled')
    ON CONFLICT (content_item_id, platform) 
    DO UPDATE SET updated_at = now()
    RETURNING id
  `, [contentItemId, platform, socialAccountId]);

  return result.rows[0];
}

/**
 * Get the default social account for a platform and user.
 */
async function getDefaultSocialAccount(
  userId: string,
  platform: string
): Promise<{ id: string } | null> {
  const result = await db.query<{ id: string }>(`
    SELECT id FROM social_accounts
    WHERE user_id = $1 AND platform = $2
    ORDER BY created_at ASC
    LIMIT 1
  `, [userId, platform]);

  return result.rows[0] || null;
}

/**
 * Main scheduler function.
 * Call this periodically (every 1-5 minutes).
 */
export async function scheduleDueContent(now = new Date()): Promise<number> {
  console.log(`[scheduler] Running at ${now.toISOString()}`);

  // Find content items due for publishing
  const itemsResult = await db.query<ContentItem>(`
    SELECT * FROM content_items
    WHERE status IN ('scheduled', 'in_progress')
      AND schedule_at <= $1
    ORDER BY schedule_at ASC
    LIMIT 100
  `, [now]);

  const items = itemsResult.rows;
  console.log(`[scheduler] Found ${items.length} items to process`);

  let jobsCreated = 0;

  for (const item of items) {
    const targets = item.targets ?? {};

    // Update item status to in_progress
    await db.query(`
      UPDATE content_items SET status = 'in_progress', updated_at = now()
      WHERE id = $1 AND status = 'scheduled'
    `, [item.id]);

    for (const platform of Object.keys(targets)) {
      // Get the social account for this platform
      const socialAccount = await getDefaultSocialAccount(item.owner_user_id, platform);
      
      if (!socialAccount) {
        console.warn(`[scheduler] No social account found for ${platform}, user ${item.owner_user_id}`);
        continue;
      }

      // Create or get platform publication
      const pub = await upsertPlatformPublication(item.id, platform, socialAccount.id);

      // Create idempotent job
      const idempotencyKey = `publish:${item.id}:${platform}`;
      const kind = platform === 'tiktok' 
        ? 'PUBLISH_TIKTOK_DIRECT_POST' 
        : 'PUBLISH_INSTAGRAM_REELS';

      await enqueue('PUBLISH', {
        kind,
        contentItemId: item.id,
        platformPublicationId: pub.id,
        idempotencyKey,
      }, {
        idempotencyKey,
        runAt: item.schedule_at,
      });

      jobsCreated++;
    }
  }

  console.log(`[scheduler] Created ${jobsCreated} jobs`);
  return jobsCreated;
}

/**
 * Start the scheduler as an interval.
 * In production, use a proper cron system or serverless functions.
 */
export function startScheduler(intervalMs = 60000): NodeJS.Timeout {
  console.log(`[scheduler] Starting with interval ${intervalMs}ms`);
  
  // Run immediately
  scheduleDueContent().catch(console.error);
  
  // Then run on interval
  return setInterval(() => {
    scheduleDueContent().catch(console.error);
  }, intervalMs);
}

/**
 * Stop the scheduler.
 */
export function stopScheduler(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('[scheduler] Stopped');
}
