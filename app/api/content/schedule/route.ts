import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { contentService } from '@/lib/api/services/content.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = withRateLimit(
  withAuth(async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { contentId, scheduledAt, platforms } = body ?? {};
      const userId = Number.parseInt(request.user.id, 10);

      if (!Number.isFinite(userId)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      if (!contentId || typeof contentId !== 'string') {
        return NextResponse.json(
          { error: 'Content ID is required' },
          { status: 400 }
        );
      }

      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'Scheduled date/time is required' },
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

      const updateData: any = {
        status: 'scheduled',
        scheduledAt: scheduledDate,
      };

      if (Array.isArray(platforms) && platforms.length > 0 && typeof platforms[0] === 'string') {
        updateData.platform = platforms[0];
      }

      const content = await contentService.updateContent(userId, contentId, updateData);

      return NextResponse.json({
        success: true,
        message: 'Content scheduled successfully',
        scheduledAt: scheduledDate.toISOString(),
        data: content,
      });
    } catch (error) {
      console.error('Scheduling error:', error);
      return NextResponse.json(
        { error: 'Failed to schedule content' },
        { status: 500 }
      );
    }
  })
);

export const GET = withRateLimit(
  withAuth(async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const userIdParam = searchParams.get('userId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const userId = Number.parseInt(request.user.id, 10);

      if (!Number.isFinite(userId)) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
      }

      if (userIdParam && userIdParam !== request.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const scheduledAtFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (Number.isNaN(parsedStart.getTime())) {
          return NextResponse.json(
            { error: 'Invalid start date' },
            { status: 400 }
          );
        }
        scheduledAtFilter.gte = parsedStart;
      }

      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (Number.isNaN(parsedEnd.getTime())) {
          return NextResponse.json(
            { error: 'Invalid end date' },
            { status: 400 }
          );
        }
        scheduledAtFilter.lte = parsedEnd;
      }

      const where: Record<string, any> = {
        user_id: userId,
        status: 'scheduled',
      };

      if (Object.keys(scheduledAtFilter).length > 0) {
        where.scheduled_at = scheduledAtFilter;
      }

      const items = await prisma.content.findMany({
        where,
        orderBy: { scheduled_at: 'asc' },
      });

      const scheduledContent = items
        .filter((item) => item.scheduled_at)
        .map((item) => ({
          id: item.id,
          text: item.text ?? item.title,
          scheduled_at: item.scheduled_at?.toISOString(),
          status: item.status,
          platforms: item.platform ? [{ platform: item.platform }] : [],
          media: [],
        }));

      return NextResponse.json({
        success: true,
        scheduledContent,
      });
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled content' },
        { status: 500 }
      );
    }
  })
);
