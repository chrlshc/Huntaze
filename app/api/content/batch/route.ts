import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

const MAX_BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, contentIds, data } = body;

    if (!operation || !contentIds || !Array.isArray(contentIds)) {
      return NextResponse.json(
        { error: 'Operation and contentIds array are required' },
        { status: 400 }
      );
    }

    if (contentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one content ID is required' },
        { status: 400 }
      );
    }

    if (contentIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum batch size is ${MAX_BATCH_SIZE} items` },
        { status: 400 }
      );
    }

    let results: any = {
      successful: [],
      failed: []
    };

    switch (operation) {
      case 'delete':
        results = await batchDelete(contentIds);
        break;
      
      case 'schedule':
        if (!data?.scheduledAt) {
          return NextResponse.json(
            { error: 'scheduledAt is required for schedule operation' },
            { status: 400 }
          );
        }
        results = await batchSchedule(contentIds, data.scheduledAt);
        break;
      
      case 'duplicate':
        results = await batchDuplicate(contentIds);
        break;
      
      case 'tag':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: 'tags array is required for tag operation' },
            { status: 400 }
          );
        }
        results = await batchTag(contentIds, data.tags);
        break;
      
      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'status is required for updateStatus operation' },
            { status: 400 }
          );
        }
        results = await batchUpdateStatus(contentIds, data.status);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported: delete, schedule, duplicate, tag, updateStatus' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      totalProcessed: contentIds.length,
      successCount: results.successful.length,
      failureCount: results.failed.length,
      results
    });
  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch operation' },
      { status: 500 }
    );
  }
}

async function batchDelete(contentIds: string[]) {
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    for (const id of contentIds) {
      try {
        // Delete related data first
        await client.query('DELETE FROM content_media WHERE content_id = $1', [id]);
        await client.query('DELETE FROM content_platforms WHERE content_id = $1', [id]);
        await client.query('DELETE FROM content_tags WHERE content_id = $1', [id]);
        await client.query('DELETE FROM content_variations WHERE parent_content_id = $1', [id]);
        
        // Delete the content item
        const result = await client.query('DELETE FROM content_items WHERE id = $1', [id]);
        
        if (result.rowCount && result.rowCount > 0) {
          successful.push(id);
        } else {
          failed.push({ id, error: 'Content not found' });
        }
      } catch (error) {
        failed.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { successful, failed };
}

async function batchSchedule(contentIds: string[], scheduledAt: string) {
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Validate scheduled time
  const scheduledDate = new Date(scheduledAt);
  const minScheduleTime = new Date(Date.now() + 5 * 60 * 1000);

  if (scheduledDate < minScheduleTime) {
    return {
      successful: [],
      failed: contentIds.map(id => ({ id, error: 'Scheduled time must be at least 5 minutes in the future' }))
    };
  }

  for (const id of contentIds) {
    try {
      const result = await query(
        `UPDATE content_items 
         SET status = 'scheduled', scheduled_at = $1, updated_at = NOW()
         WHERE id = $2 AND status = 'draft'`,
        [scheduledDate, id]
      );

      if (result.rowCount && result.rowCount > 0) {
        successful.push(id);
      } else {
        failed.push({ id, error: 'Content not found or not in draft status' });
      }
    } catch (error) {
      failed.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { successful, failed };
}

async function batchDuplicate(contentIds: string[]) {
  const successful: Array<{ originalId: string; newId: string }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  const client = await getClient();

  try {
    await client.query('BEGIN');

    for (const id of contentIds) {
      try {
        // Get original content
        const contentResult = await client.query(
          'SELECT * FROM content_items WHERE id = $1',
          [id]
        );

        if (contentResult.rows.length === 0) {
          failed.push({ id, error: 'Content not found' });
          continue;
        }

        const original = contentResult.rows[0];

        // Create duplicate
        const duplicateResult = await client.query(
          `INSERT INTO content_items (user_id, text, status, category, metadata)
           VALUES ($1, $2, 'draft', $3, $4)
           RETURNING id`,
          [original.user_id, original.text + ' (Copy)', original.category, original.metadata]
        );

        const newId = duplicateResult.rows[0].id;

        // Copy media associations
        await client.query(
          `INSERT INTO content_media (content_id, media_id, position)
           SELECT $1, media_id, position FROM content_media WHERE content_id = $2`,
          [newId, id]
        );

        // Copy platform associations
        await client.query(
          `INSERT INTO content_platforms (content_id, platform)
           SELECT $1, platform FROM content_platforms WHERE content_id = $2`,
          [newId, id]
        );

        // Copy tags
        await client.query(
          `INSERT INTO content_tags (content_id, tag)
           SELECT $1, tag FROM content_tags WHERE content_id = $2`,
          [newId, id]
        );

        successful.push({ originalId: id, newId });
      } catch (error) {
        failed.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { successful, failed };
}

async function batchTag(contentIds: string[], tags: string[]) {
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  const client = await getClient();

  try {
    await client.query('BEGIN');

    for (const id of contentIds) {
      try {
        // Check if content exists
        const checkResult = await client.query(
          'SELECT id FROM content_items WHERE id = $1',
          [id]
        );

        if (checkResult.rows.length === 0) {
          failed.push({ id, error: 'Content not found' });
          continue;
        }

        // Add tags
        for (const tag of tags) {
          await client.query(
            `INSERT INTO content_tags (content_id, tag)
             VALUES ($1, $2)
             ON CONFLICT (content_id, tag) DO NOTHING`,
            [id, tag]
          );
        }

        successful.push(id);
      } catch (error) {
        failed.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { successful, failed };
}

async function batchUpdateStatus(contentIds: string[], status: string) {
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  const validStatuses = ['draft', 'scheduled', 'published', 'archived'];
  if (!validStatuses.includes(status)) {
    return {
      successful: [],
      failed: contentIds.map(id => ({ id, error: 'Invalid status' }))
    };
  }

  for (const id of contentIds) {
    try {
      const result = await query(
        `UPDATE content_items 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [status, id]
      );

      if (result.rowCount && result.rowCount > 0) {
        successful.push(id);
      } else {
        failed.push({ id, error: 'Content not found' });
      }
    } catch (error) {
      failed.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { successful, failed };
}
