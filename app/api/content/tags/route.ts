import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let queryText = `
      SELECT 
        ct.tag,
        COUNT(*) as usage_count,
        MAX(ci.created_at) as last_used
      FROM content_tags ct
      JOIN content_items ci ON ct.content_id = ci.id
      WHERE ci.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (search) {
      queryText += ` AND ct.tag ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY ct.tag
      ORDER BY usage_count DESC, ct.tag ASC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await query(queryText, params);

    return NextResponse.json({
      success: true,
      tags: result.rows
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, tags } = body;

    if (!contentId || !tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Content ID and tags array are required' },
        { status: 400 }
      );
    }

    // Remove existing tags
    await query('DELETE FROM content_tags WHERE content_id = $1', [contentId]);

    // Add new tags
    for (const tag of tags) {
      await query(
        'INSERT INTO content_tags (content_id, tag) VALUES ($1, $2)',
        [contentId, tag.toLowerCase().trim()]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully'
    });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    );
  }
}
