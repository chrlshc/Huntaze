import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth/jwt';

/**
 * POST /api/content/variations/:id/track
 * Track engagement with a variation
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.payload.userId;
    const variationId = params.id;
    const body = await request.json();
    const { eventType, metadata } = body;

    // Validate event type
    const validEvents = ['view', 'click', 'like', 'share', 'comment', 'conversion'];
    if (!eventType || !validEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify variation exists
    const variationResult = await query(
      'SELECT * FROM content_variations WHERE id = $1',
      [variationId]
    );

    if (variationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      );
    }

    // Track the event
    await query(
      `INSERT INTO variation_events (variation_id, user_id, event_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [variationId, userId, eventType, JSON.stringify(metadata || {})]
    );

    // Update engagement count on variation
    if (['click', 'like', 'share', 'comment', 'conversion'].includes(eventType)) {
      await query(
        'UPDATE content_variations SET engagements = engagements + 1 WHERE id = $1',
        [variationId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });

  } catch (error) {
    console.error('Error tracking variation event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to track event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
