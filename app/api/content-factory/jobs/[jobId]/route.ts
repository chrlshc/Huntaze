import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { auth } from '@/lib/auth/config';

const DATABASE_URL = process.env.DATABASE_URL;

// Database connection
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}) : null;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Try to get from database first
    if (pool) {
      const result = await pool.query(
        `SELECT id, status, progress, created_content_ids, error, created_at, updated_at
         FROM production_jobs 
         WHERE id = $1 AND user_id = $2`,
        [jobId, session.user.id]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return NextResponse.json({
          id: row.id,
          status: row.status,
          progress: row.progress,
          createdContentIds: JSON.parse(row.created_content_ids || '[]'),
          error: row.error,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    }

    // If no database configured, job not found
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured and job not found' },
        { status: 404 }
      );
    }

    // Job not found in database
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
