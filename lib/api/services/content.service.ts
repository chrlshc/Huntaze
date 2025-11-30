/**
 * Content Service
 * 
 * Handles content management operations with:
 * - Error handling and retry logic
 * - Type-safe responses
 * - Structured logging
 * - Ownership verification
 * - Performance optimization
 * 
 * @see docs/api/content-service.md
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { ApiError, createApiError } from '@/lib/api/utils/errors';
import crypto from 'crypto';

const logger = createLogger('content-service');

// ============================================================================
// Types
// ============================================================================

export type ContentStatus = 'draft' | 'scheduled' | 'published';
export type ContentType = 'image' | 'video' | 'text';
export type ContentPlatform = 'onlyfans' | 'fansly' | 'instagram' | 'tiktok';

export interface ContentFilters {
  userId: number;
  status?: ContentStatus;
  platform?: ContentPlatform;
  type?: ContentType;
  limit?: number;
  offset?: number;
}

export interface CreateContentData {
  title: string;
  text?: string;
  type: ContentType;
  platform: ContentPlatform;
  status: ContentStatus;
  category?: string;
  tags?: string[];
  mediaIds?: string[];
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateContentData {
  title?: string;
  text?: string;
  type?: ContentType;
  platform?: ContentPlatform;
  status?: ContentStatus;
  category?: string;
  tags?: string[];
  mediaIds?: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ContentItem {
  id: string;
  userId: number;
  title: string;
  text?: string;
  type: ContentType;
  platform: ContentPlatform;
  status: ContentStatus;
  category?: string;
  tags: string[];
  media_ids: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentListResponse {
  items: ContentItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export enum ContentErrorType {
  NOT_FOUND = 'CONTENT_NOT_FOUND',
  ACCESS_DENIED = 'CONTENT_ACCESS_DENIED',
  VALIDATION_ERROR = 'CONTENT_VALIDATION_ERROR',
  DATABASE_ERROR = 'CONTENT_DATABASE_ERROR',
  INTERNAL_ERROR = 'CONTENT_INTERNAL_ERROR',
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'P2024', // Prisma connection timeout
    'P2034', // Prisma transaction conflict
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorCode = error.code || error.message || '';
  return RETRY_CONFIG.retryableErrors.some(code => 
    errorCode.includes(code)
  );
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (!isRetryableError(error) || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Retrying content operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Content Service
// ============================================================================

export class ContentService {
  /**
   * List content with filters and pagination
   * 
   * @param filters - Filter and pagination options
   * @returns Paginated content list
   * @throws ApiError on database or validation errors
   */
  async listContent(filters: ContentFilters): Promise<ContentListResponse> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const {
        userId,
        status,
        platform,
        type,
        limit = 50,
        offset = 0,
      } = filters;

      // Validate pagination
      if (limit < 1 || limit > 100) {
        throw createApiError(
          ContentErrorType.VALIDATION_ERROR,
          'Limit must be between 1 and 100',
          400,
          false,
          correlationId
        );
      }

      if (offset < 0) {
        throw createApiError(
          ContentErrorType.VALIDATION_ERROR,
          'Offset must be non-negative',
          400,
          false,
          correlationId
        );
      }

      logger.info('Listing content', {
        correlationId,
        userId,
        status,
        platform,
        type,
        limit,
        offset,
      });

      const where: any = { userId };
      if (status) where.status = status;
      if (platform) where.platform = platform;
      if (type) where.type = type;

      const [items, total] = await retryWithBackoff(
        () => Promise.all([
          prisma.content.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
          }),
          prisma.content.count({ where }),
        ]),
        correlationId
      );

      const duration = Date.now() - startTime;

      logger.info('Content listed successfully', {
        correlationId,
        userId,
        itemCount: items.length,
        total,
        duration,
      });

      return {
        items: items.map(item => ({
          ...item,
          userId: item.user_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          scheduledAt: item.scheduled_at || undefined,
          publishedAt: item.published_at || undefined,
        })) as ContentItem[],
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('Failed to list content', error, {
        correlationId,
        userId: filters.userId,
        duration,
      });

      throw createApiError(
        ContentErrorType.DATABASE_ERROR,
        'Failed to retrieve content',
        500,
        isRetryableError(error),
        correlationId
      );
    }
  }

  /**
   * Create new content
   * 
   * @param userId - User ID
   * @param data - Content data
   * @returns Created content
   * @throws ApiError on validation or database errors
   */
  async createContent(userId: number, data: CreateContentData): Promise<ContentItem> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Validate required fields
      if (!data.title || data.title.trim().length === 0) {
        throw createApiError(
          ContentErrorType.VALIDATION_ERROR,
          'Title is required',
          400,
          false,
          correlationId
        );
      }

      if (data.title.length > 200) {
        throw createApiError(
          ContentErrorType.VALIDATION_ERROR,
          'Title must be 200 characters or less',
          400,
          false,
          correlationId
        );
      }

      logger.info('Creating content', {
        correlationId,
        userId,
        title: data.title,
        type: data.type,
        platform: data.platform,
        status: data.status,
      });

      const content = await retryWithBackoff(
        () => prisma.content.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            title: data.title,
            text: data.text,
            type: data.type,
            platform: data.platform,
            status: data.status,
            category: data.category,
            tags: data.tags || [],
            media_ids: data.mediaIds || [],
            scheduled_at: data.scheduledAt,
            metadata: data.metadata,
          },
        }),
        correlationId
      );

      const duration = Date.now() - startTime;

      logger.info('Content created successfully', {
        correlationId,
        userId,
        contentId: content.id,
        duration,
      });

      return {
        ...content,
        userId: content.user_id,
        createdAt: content.created_at,
        updatedAt: content.updated_at,
        scheduledAt: content.scheduled_at || undefined,
        publishedAt: content.published_at || undefined,
      } as ContentItem;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('Failed to create content', error, {
        correlationId,
        userId,
        duration,
      });

      throw createApiError(
        ContentErrorType.DATABASE_ERROR,
        'Failed to create content',
        500,
        isRetryableError(error),
        correlationId
      );
    }
  }

  /**
   * Get single content by ID with ownership verification
   * 
   * @param userId - User ID
   * @param contentId - Content ID
   * @returns Content item
   * @throws ApiError if not found or access denied
   */
  async getContent(userId: number, contentId: string): Promise<ContentItem> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      logger.info('Getting content', {
        correlationId,
        userId,
        contentId,
      });

      const content = await retryWithBackoff(
        () => prisma.content.findFirst({
          where: { id: contentId, user_id: userId },
        }),
        correlationId
      );

      if (!content) {
        logger.warn('Content not found or access denied', {
          correlationId,
          userId,
          contentId,
        });

        throw createApiError(
          ContentErrorType.NOT_FOUND,
          'Content not found or access denied',
          404,
          false,
          correlationId
        );
      }

      const duration = Date.now() - startTime;

      logger.info('Content retrieved successfully', {
        correlationId,
        userId,
        contentId,
        duration,
      });

      return {
        ...content,
        userId: content.user_id,
        createdAt: content.created_at,
        updatedAt: content.updated_at,
        scheduledAt: content.scheduled_at || undefined,
        publishedAt: content.published_at || undefined,
      } as ContentItem;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('Failed to get content', error, {
        correlationId,
        userId,
        contentId,
        duration,
      });

      throw createApiError(
        ContentErrorType.DATABASE_ERROR,
        'Failed to retrieve content',
        500,
        isRetryableError(error),
        correlationId
      );
    }
  }

  /**
   * Update content with ownership verification
   * 
   * @param userId - User ID
   * @param contentId - Content ID
   * @param data - Update data
   * @returns Updated content
   * @throws ApiError if not found or access denied
   */
  async updateContent(
    userId: number,
    contentId: string,
    data: UpdateContentData
  ): Promise<ContentItem> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Validate title if provided
      if (data.title !== undefined) {
        if (data.title.trim().length === 0) {
          throw createApiError(
            ContentErrorType.VALIDATION_ERROR,
            'Title cannot be empty',
            400,
            false,
            correlationId
          );
        }

        if (data.title.length > 200) {
          throw createApiError(
            ContentErrorType.VALIDATION_ERROR,
            'Title must be 200 characters or less',
            400,
            false,
            correlationId
          );
        }
      }

      logger.info('Updating content', {
        correlationId,
        userId,
        contentId,
        updates: Object.keys(data),
      });

      // Verify ownership
      const content = await retryWithBackoff(
        () => prisma.content.findFirst({
          where: { id: contentId, user_id: userId },
        }),
        correlationId
      );

      if (!content) {
        logger.warn('Content not found or access denied', {
          correlationId,
          userId,
          contentId,
        });

        throw createApiError(
          ContentErrorType.NOT_FOUND,
          'Content not found or access denied',
          404,
          false,
          correlationId
        );
      }

      // Update publishedAt if status changes to published
      const updateData: any = { ...data };
      if (data.status === 'published' && content.status !== 'published') {
        updateData.publishedAt = new Date();
        logger.info('Setting publishedAt timestamp', {
          correlationId,
          contentId,
        });
      }

      const updatedContent = await retryWithBackoff(
        () => prisma.content.update({
          where: { id: contentId },
          data: updateData,
        }),
        correlationId
      );

      const duration = Date.now() - startTime;

      logger.info('Content updated successfully', {
        correlationId,
        userId,
        contentId,
        duration,
      });

      return {
        ...updatedContent,
        userId: updatedContent.user_id,
        createdAt: updatedContent.created_at,
        updatedAt: updatedContent.updated_at,
        scheduledAt: updatedContent.scheduled_at || undefined,
        publishedAt: updatedContent.published_at || undefined,
      } as ContentItem;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('Failed to update content', error, {
        correlationId,
        userId,
        contentId,
        duration,
      });

      throw createApiError(
        ContentErrorType.DATABASE_ERROR,
        'Failed to update content',
        500,
        isRetryableError(error),
        correlationId
      );
    }
  }

  /**
   * Delete content with ownership verification
   * 
   * @param userId - User ID
   * @param contentId - Content ID
   * @returns Deleted content
   * @throws ApiError if not found or access denied
   */
  async deleteContent(userId: number, contentId: string): Promise<ContentItem> {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      logger.info('Deleting content', {
        correlationId,
        userId,
        contentId,
      });

      // Verify ownership
      const content = await retryWithBackoff(
        () => prisma.content.findFirst({
          where: { id: contentId, user_id: userId },
        }),
        correlationId
      );

      if (!content) {
        logger.warn('Content not found or access denied', {
          correlationId,
          userId,
          contentId,
        });

        throw createApiError(
          ContentErrorType.NOT_FOUND,
          'Content not found or access denied',
          404,
          false,
          correlationId
        );
      }

      const deletedContent = await retryWithBackoff(
        () => prisma.content.delete({
          where: { id: contentId },
        }),
        correlationId
      );

      const duration = Date.now() - startTime;

      logger.info('Content deleted successfully', {
        correlationId,
        userId,
        contentId,
        duration,
      });

      return {
        ...deletedContent,
        userId: deletedContent.user_id,
        createdAt: deletedContent.created_at,
        updatedAt: deletedContent.updated_at,
        scheduledAt: deletedContent.scheduled_at || undefined,
        publishedAt: deletedContent.published_at || undefined,
      } as ContentItem;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('Failed to delete content', error, {
        correlationId,
        userId,
        contentId,
        duration,
      });

      throw createApiError(
        ContentErrorType.DATABASE_ERROR,
        'Failed to delete content',
        500,
        isRetryableError(error),
        correlationId
      );
    }
  }
}

export const contentService = new ContentService();
