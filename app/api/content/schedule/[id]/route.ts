import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Reschedule content
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'New scheduled date/time is required' },
        { status: 400 }
      );
    }

    // Validate that scheduled time is at least 5 minutes in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000);

    if (scheduledDate < minScheduleTime) {
      return NextResponse.json(
        { error: 'Scheduled time must be at least 5 minutes in the future' },
        { status: 400 }
      );
    }

    // Check if content exists and is scheduled
    const checkResult = await db.query(
      'SELECT status, scheduled_at FROM content_items WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const currentScheduledAt = new Date(checkResult.rows[0].scheduled_at);
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

    // Don't allow rescheduling if less than 1 minute until publication
    if (currentScheduledAt < oneMinuteFromNow) {
      return NextResponse.json(
        { error: 'Cannot reschedule content less than 1 minute before publication' },
        { status: 400 }
      );
    }

    // Update scheduled time
    await db.query(
      `UPDATE content_items 
       SET scheduled_at = $1, updated_at = NOW()
       WHERE id = $2`,
      [scheduledDate, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Content rescheduled successfully',
      scheduledAt: scheduledDate.toISOString()
    });
  } catch (error) {
    console.error('Rescheduling error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule content' },
      { status: 500 }
    );
  }
}

// Cancel scheduled content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if content exists and is scheduled
    const checkResult = await db.query(
      'SELECT status, scheduled_at FROM content_items WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Content is not scheduled' },
        { status: 400 }
      );
    }

    const scheduledAt = new Date(checkResult.rows[0].scheduled_at);
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

    // Don't allow cancellation if less than 1 minute until publication
    if (scheduledAt < oneMinuteFromNow) {
      return NextResponse.json(
        { error: 'Cannot cancel content less than 1 minute before publication' },
        { status: 400 }
      );
    }

    // Update status back to draft and clear scheduled time
    await db.query(
      `UPDATE content_items 
       SET status = 'draft', 
           scheduled_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Scheduled content cancelled successfully'
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel scheduled content' },
      { status: 500 }
    );
  }
}
