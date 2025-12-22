/**
 * POST /api/content/create
 * Create content posting tasks for TikTok/Instagram
 * 
 * Requirements: 1.1, 1.2, 7.2
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse, errorResponse, badRequest, internalServerError } from '@/lib/api/utils/response';
import { getPrismaClient } from '@/lib/db-client';
import { enqueuePostContent } from '@/lib/sqs';
import { makeReqLogger } from '@/lib/logger';
import { validateAssetExists } from '@/lib/s3/validate-asset';
import { ContentPlatform, ContentSourceType, ContentTaskStatus } from '@prisma/client';

const logger = makeReqLogger({ service: 'content-create-api' });

// ============================================================================
// Validation Schema
// ============================================================================

const createContentSchema = z.object({
  platforms: z.array(z.enum(['TIKTOK', 'INSTAGRAM'])).min(1, 'At least one platform is required'),
  asset: z.object({
    sourceType: z.enum(['UPLOAD', 'URL']),
    assetKey: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }).refine(
    (data) => {
      if (data.sourceType === 'UPLOAD') {
        return !!data.assetKey;
      }
      if (data.sourceType === 'URL') {
        return !!data.sourceUrl;
      }
      return false;
    },
    {
      message: 'assetKey is required for UPLOAD, sourceUrl is required for URL',
    }
  ),
  script: z.object({
    hook: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    caption: z.string().min(1, 'Caption is required').max(2200, 'Caption too long'),
  }),
  trendLabel: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

type CreateContentInput = z.infer<typeof createContentSchema>;

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/content/create
 * Creates ContentTask records for each platform and enqueues them to SQS
 */
export const POST = withRateLimit(
  withAuth(async (req: AuthenticatedRequest) => {
    const startTime = Date.now();
    const correlationId = crypto.randomUUID();
    
    logger.info('content_create_start', {
      correlationId,
      userId: req.user.id,
    });

    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = createContentSchema.safeParse(body);

      if (!validationResult.success) {
        const formattedErrors = validationResult.error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('content_create_validation_failed', {
          correlationId,
          userId: req.user.id,
          errors: formattedErrors,
        });

        return badRequest(
          'Validation failed',
          { errors: formattedErrors },
          { correlationId, startTime }
        );
      }

      const input: CreateContentInput = validationResult.data;
      const prisma = getPrismaClient();

      if (!prisma) {
        logger.error('content_create_db_unavailable', {
          correlationId,
          userId: req.user.id,
        });
        return internalServerError('Database unavailable', { correlationId, startTime });
      }

      // Parse scheduledAt if provided
      const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;

      // Validate S3 asset exists if using UPLOAD source type (Requirement 7.5)
      if (input.asset.sourceType === 'UPLOAD' && input.asset.assetKey) {
        const validationResult = await validateAssetExists(input.asset.assetKey);

        if (!validationResult.exists) {
          logger.warn('content_create_asset_not_found', {
            correlationId,
            userId: req.user.id,
            assetKey: input.asset.assetKey,
            error: validationResult.error,
          });

          return badRequest(
            'Asset not found in S3. Please upload the file first.',
            { assetKey: input.asset.assetKey, error: validationResult.error },
            { correlationId, startTime }
          );
        }

        logger.info('content_create_asset_validated', {
          correlationId,
          userId: req.user.id,
          assetKey: input.asset.assetKey,
          contentType: validationResult.contentType,
          contentLength: validationResult.contentLength,
        });
      }

      // Create tasks for each platform
      const createdTasks: any[] = [];
      const failedPlatforms: string[] = [];

      for (const platform of input.platforms) {
        try {
          // Create ContentTask in DB with PENDING status
          const task = await prisma.contentTask.create({
            data: {
              userId: parseInt(req.user.id),
              platform: platform as ContentPlatform,
              status: ContentTaskStatus.PENDING,
              sourceType: input.asset.sourceType as ContentSourceType,
              sourceUrl: input.asset.sourceUrl || null,
              assetKey: input.asset.assetKey || null,
              caption: input.script.caption,
              hook: input.script.hook || null,
              body: input.script.body || null,
              cta: input.script.cta || null,
              trendLabel: input.trendLabel || null,
              scheduledAt: scheduledAt,
              attemptCount: 0,
            },
          });

          logger.info('content_task_created', {
            correlationId,
            userId: req.user.id,
            taskId: task.id,
            platform: task.platform,
          });

          // Enqueue to SQS
          try {
            await enqueuePostContent(task.id);

            logger.info('content_task_enqueued', {
              correlationId,
              userId: req.user.id,
              taskId: task.id,
              platform: task.platform,
            });

            createdTasks.push(task);
          } catch (sqsError) {
            // SQS failed - rollback the task
            logger.error('content_task_enqueue_failed', {
              correlationId,
              userId: req.user.id,
              taskId: task.id,
              platform: task.platform,
              error: sqsError instanceof Error ? sqsError.message : 'Unknown error',
            });

            // Delete the task since we couldn't enqueue it
            await prisma.contentTask.delete({
              where: { id: task.id },
            });

            failedPlatforms.push(platform);
          }
        } catch (dbError) {
          logger.error('content_task_creation_failed', {
            correlationId,
            userId: req.user.id,
            platform,
            error: dbError instanceof Error ? dbError.message : 'Unknown error',
          });

          failedPlatforms.push(platform);
        }
      }

      // If all platforms failed, return error
      if (createdTasks.length === 0) {
        logger.error('content_create_all_failed', {
          correlationId,
          userId: req.user.id,
          failedPlatforms,
        });

        return internalServerError(
          'Failed to create tasks for all platforms',
          { failedPlatforms },
          { correlationId, startTime }
        );
      }

      // If some platforms failed, include warning in response
      const response = {
        tasks: createdTasks.map((task) => ({
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
          createdAt: task.createdAt.toISOString(),
        })),
        ...(failedPlatforms.length > 0 && {
          warnings: [
            {
              message: 'Some platforms failed to create tasks',
              failedPlatforms,
            },
          ],
        }),
      };

      logger.info('content_create_success', {
        correlationId,
        userId: req.user.id,
        tasksCreated: createdTasks.length,
        failedPlatforms: failedPlatforms.length,
        duration: Date.now() - startTime,
      });

      return Response.json(
        successResponse(response, { correlationId, startTime }),
        { status: 201 }
      );
    } catch (error) {
      logger.error('content_create_unexpected_error', {
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
