import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentContentId, variationName, text, mediaIds, audiencePercentage } = body;

    if (!parentContentId) {
      return NextResponse.json(
        { error: 'Parent content ID is required' },
        { status: 400 }
      );
    }

    if (!variationName || !text) {
      return NextResponse.json(
        { error: 'Variation name and text are required' },
        { status: 400 }
      );
    }

    if (!audiencePercentage || audiencePercentage < 1 || audiencePercentage > 100) {
      return NextResponse.json(
        { error: 'Audience percentage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Check if parent content exists
    const parentCheck = await query(
      'SELECT id FROM content_items WHERE id = $1',
      [parentContentId]
    );

    if (parentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Parent content not found' },
        { status: 404 }
      );
    }

    // Check total variations count (max 5)
    const variationsCount = await query(
      'SELECT COUNT(*) as count FROM content_variations WHERE parent_content_id = $1',
      [parentContentId]
    );

    if (parseInt(variationsCount.rows[0].count) >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 variations allowed per content' },
        { status: 400 }
      );
    }

    // Check total audience percentage doesn't exceed 100%
    const totalPercentage = await query(
      'SELECT COALESCE(SUM(audience_percentage), 0) as total FROM content_variations WHERE parent_content_id = $1',
      [parentContentId]
    );

    const currentTotal = parseInt(totalPercentage.rows[0].total);
    if (currentTotal + audiencePercentage > 100) {
      return NextResponse.json(
        { error: `Total audience percentage would exceed 100% (current: ${currentTotal}%)` },
        { status: 400 }
      );
    }

    // Create variation
    const result = await query(
      `INSERT INTO content_variations (parent_content_id, variation_name, text, media_ids, audience_percentage)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parentContentId, variationName, text, mediaIds || [], audiencePercentage]
    );

    return NextResponse.json({
      success: true,
      variation: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating variation:', error);
    return NextResponse.json(
      { error: 'Failed to create variation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentContentId = searchParams.get('parentContentId');

    if (!parentContentId) {
      return NextResponse.json(
        { error: 'Parent content ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT * FROM content_variations 
       WHERE parent_content_id = $1 
       ORDER BY created_at ASC`,
      [parentContentId]
    );

    return NextResponse.json({
      success: true,
      variations: result.rows
    });
  } catch (error) {
    console.error('Error fetching variations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variations' },
      { status: 500 }
    );
  }
}
