import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Reschedule content
export const PATCH = withRateLimit(
  withAuth(async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      const { scheduledAt } = body ?? {};
      const userId = Number.parseInt(request.user.id, 10);

      if (!Number.isFinite(userId)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'New scheduled date/time is required' },
          { status: 400 }
        );
      }

      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Scheduled date/time is invalid' },
          { status: 400 }
        );
      }

      // Validate that scheduled time is at least 5 minutes in the future
      const now = new Date();
      const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000);

      if (scheduledDate < minScheduleTime) {
        return NextResponse.json(
          { error: 'Scheduled time must be at least 5 minutes in the future' },
          { status: 400 }
        );
      }

      const content = await prisma.content.findFirst({
        where: { id, user_id: userId },
      });

      if (!content) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }

      if (content.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Content is not scheduled' },
          { status: 400 }
        );
      }

      if (content.scheduled_at) {
        const currentScheduledAt = new Date(content.scheduled_at);
        const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

        if (currentScheduledAt < oneMinuteFromNow) {
          return NextResponse.json(
            { error: 'Cannot reschedule content less than 1 minute before publication' },
            { status: 400 }
          );
        }
      }

      await prisma.content.update({
        where: { id },
        data: {
          scheduled_at: scheduledDate,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Content rescheduled successfully',
        scheduledAt: scheduledDate.toISOString(),
      });
    } catch (error) {
      console.error('Rescheduling error:', error);
      return NextResponse.json(
        { error: 'Failed to reschedule content' },
        { status: 500 }
      );
    }
  })
);

// Cancel scheduled content
export const DELETE = withRateLimit(
  withAuth(async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const userId = Number.parseInt(request.user.id, 10);

      if (!Number.isFinite(userId)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      const content = await prisma.content.findFirst({
        where: { id, user_id: userId },
      });

      if (!content) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }

      if (content.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Content is not scheduled' },
          { status: 400 }
        );
      }

      if (content.scheduled_at) {
        const scheduledAt = new Date(content.scheduled_at);
        const now = new Date();
        const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

        if (scheduledAt < oneMinuteFromNow) {
          return NextResponse.json(
            { error: 'Cannot cancel content less than 1 minute before publication' },
            { status: 400 }
          );
        }
      }

      await prisma.content.update({
        where: { id },
        data: {
          status: 'draft',
          scheduled_at: null,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Scheduled content cancelled successfully',
      });
    } catch (error) {
      console.error('Cancellation error:', error);
      return NextResponse.json(
        { error: 'Failed to cancel scheduled content' },
        { status: 500 }
      );
    }
  })
);
