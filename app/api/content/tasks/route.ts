/**
 * GET /api/content/tasks
 * Retrieve content posting tasks for the authenticated user
 * 
 * Requirements: 3.1, 3.2
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse, badRequest, internalServerError } from '@/lib/api/utils/response';
import { getPrismaClient } from '@/lib/db-client';
import { makeReqLogger } from '@/lib/logger';
import { ContentPlatform, ContentTaskStatus } from '@prisma/client';

const logger = makeReqLogger({ service: 'content-tasks-api' });

// ============================================================================
// Route Handler
// ============================================================================

/**
 * GET /api/content/tasks
 * Retrieves ContentTask records for the authenticated user
 * 
 * Query params:
 * - status: Filter by status (PENDING, PROCESSING, POSTED, FAILED)
 * - platform: Filter by platform (TIKTOK, INSTAGRAM)
 * - limit: Max results (default 200)
 */
export const GET = withRateLimit(
  withAuth(async (req: AuthenticatedRequest) => {
    const startTime = Date.now();
    const correlationId = crypto.randomUUID();
    
    logger.info('content_tasks_fetch_start', {
      correlationId,
      userId: req.user.id,
    });

    try {
      const { searchParams } = new URL(req.url);
      
      // Parse query parameters
      const statusParam = searchParams.get('status');
      const platformParam = searchParams.get('platform');
      const limitParam = searchParams.get('limit');

      // Validate status parameter
      let status: ContentTaskStatus | undefined;
      if (statusParam) {
        const validStatuses: ContentTaskStatus[] = ['PENDING', 'PROCESSING', 'POSTED', 'FAILED'];
        if (!validStatuses.includes(statusParam as ContentTaskStatus)) {
          logger.warn('content_tasks_invalid_status', {
            correlationId,
            userId: req.user.id,
            status: statusParam,
          });
          return badRequest(
            'Invalid status parameter',
            { validStatuses },
            { correlationId, startTime }
          );
        }
        status = statusParam as ContentTaskStatus;
      }

      // Validate platform parameter
      let platform: ContentPlatform | undefined;
      if (platformParam) {
        const validPlatforms: ContentPlatform[] = ['TIKTOK', 'INSTAGRAM'];
        if (!validPlatforms.includes(platformParam as ContentPlatform)) {
          logger.warn('content_tasks_invalid_platform', {
            correlationId,
            userId: req.user.id,
            platform: platformParam,
          });
          return badRequest(
            'Invalid platform parameter',
            { validPlatforms },
            { correlationId, startTime }
          );
        }
        platform = platformParam as ContentPlatform;
      }

      // Parse limit parameter
      const limit = limitParam ? parseInt(limitParam, 10) : 200;
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        logger.warn('content_tasks_invalid_limit', {
          correlationId,
          userId: req.user.id,
          limit: limitParam,
        });
        return badRequest(
          'Invalid limit parameter',
          { message: 'Limit must be between 1 and 1000' },
          { correlationId, startTime }
        );
      }

      const prisma = getPrismaClient();

      if (!prisma) {
        logger.error('content_tasks_db_unavailable', {
          correlationId,
          userId: req.user.id,
        });
        return internalServerError('Database unavailable', { correlationId, startTime });
      }

      // Build where clause
      const where: any = {
        userId: parseInt(req.user.id),
      };

      if (status) {
        where.status = status;
      }

      if (platform) {
        where.platform = platform;
      }

      // Fetch tasks from database
      const tasks = await prisma.contentTask.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      logger.info('content_tasks_fetch_success', {
        correlationId,
        userId: req.user.id,
        count: tasks.length,
        filters: { status, platform, limit },
        duration: Date.now() - startTime,
      });

      // Format response
      const response = {
        tasks: tasks.map((task) => ({
          id: task.id,
          userId: task.userId,
          platform: task.platform,
          status: task.status,
          sourceType: task.sourceType,
          sourceUrl: task.sourceUrl,
          assetKey: task.assetKey,
          caption: task.caption,
          hook: task.hook,
          body: task.body,
          cta: task.cta,
          trendLabel: task.trendLabel,
          scheduledAt: task.scheduledAt?.toISOString() || null,
          startedAt: task.startedAt?.toISOString() || null,
          postedAt: task.postedAt?.toISOString() || null,
          externalPostId: task.externalPostId,
          errorMessage: task.errorMessage,
          attemptCount: task.attemptCount,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
      };

      return Response.json(
        successResponse(response, { correlationId, startTime })
      );
    } catch (error) {
      logger.error('content_tasks_unexpected_error', {
        correlationId,
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return internalServerError(
        'An unexpected error occurred',
        undefined,
        { correlationId, startTime }
      );
    }
  })
);
