/**
 * Marketing Service
 * 
 * Handles campaign management, statistics calculations, and marketing operations.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 7.3
 * 
 * Features:
 * - Error handling with retry logic
 * - Type-safe API responses
 * - Structured logging
 * - Input validation
 * - Performance optimization
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { 
  ApiError, 
  createApiError, 
  isRetryableError 
} from '@/lib/api/utils/errors';

const logger = createLogger('marketing-service');

// ============================================================================
// Types
// ============================================================================

export interface CampaignFilters {
  user_id: number;
  status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  channel?: 'email' | 'dm' | 'sms' | 'push';
  limit?: number;
  offset?: number;
}

export interface CreateCampaignData {
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  channel: 'email' | 'dm' | 'sms' | 'push';
  goal: 'engagement' | 'conversion' | 'retention';
  audienceSegment: string;
  audienceSize: number;
  message: Record<string, any>;
  schedule?: Record<string, any>;
}

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface Campaign {
  id: string;
  user_id: number;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  channel: 'email' | 'dm' | 'sms' | 'push';
  goal: 'engagement' | 'conversion' | 'retention';
  audienceSegment: string;
  audienceSize: number;
  message: Record<string, any>;
  schedule?: Record<string, any>;
  stats: CampaignStats;
  createdAt: Date;
  updated_at: Date;
}

export interface CampaignListResponse {
  items: Campaign[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operation: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = isRetryableError(error);

    if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
      logger.error(`${operation} failed after ${attempt} attempts`, error, {
        attempt,
        isRetryable,
      });
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn(`${operation} failed, retrying`, {
      attempt,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, operation, attempt + 1);
  }
}

/**
 * Validate campaign data
 */
function validateCampaignData(data: CreateCampaignData): void {
  if (!data.name || data.name.trim().length === 0) {
    throw createApiError('VALIDATION_ERROR', 'Campaign name is required', 400);
  }

  if (data.name.length > 255) {
    throw createApiError('VALIDATION_ERROR', 'Campaign name too long (max 255 characters)', 400);
  }

  if (data.audienceSize < 0) {
    throw createApiError('VALIDATION_ERROR', 'Audience size must be non-negative', 400);
  }

  if (!data.message || Object.keys(data.message).length === 0) {
    throw createApiError('VALIDATION_ERROR', 'Campaign message is required', 400);
  }
}

// ============================================================================
// Marketing Service
// ============================================================================

export class MarketingService {
  /**
   * List campaigns with filters and pagination
   * Requirements: 3.1, 3.5
   * 
   * @param filters - Campaign filters
   * @returns Campaign list with pagination
   * @throws ApiError on database failure
   */
  async listCampaigns(filters: CampaignFilters): Promise<CampaignListResponse> {
    const startTime = Date.now();
    const {
      user_id,
      status,
      channel,
      limit = 50,
      offset = 0,
    } = filters;

    try {
      logger.info('Listing campaigns', {
        user_id,
        status,
        channel,
        limit,
        offset,
      });

      // Validate pagination
      if (limit < 1 || limit > 100) {
        throw createApiError('VALIDATION_ERROR', 'Limit must be between 1 and 100', 400);
      }

      if (offset < 0) {
        throw createApiError('VALIDATION_ERROR', 'Offset must be non-negative', 400);
      }

      const where: Prisma.marketing_campaignsWhereInput = { user_id };

      if (status) where.status = status;
      if (channel) where.channel = channel;

      const [items, total] = await retryWithBackoff(
        () => Promise.all([
          prisma.marketing_campaigns.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
          }),
          prisma.marketing_campaigns.count({ where }),
        ]),
        'listCampaigns'
      );

      // Calculate stats for each campaign and map fields
      const itemsWithStats = items.map((campaign) => ({
        ...campaign,
        audienceSegment: campaign.audience_segment,
        audienceSize: campaign.audience_size,
        createdAt: campaign.created_at,
        stats: this.calculateCampaignStats(campaign.stats as any),
      }));

      const duration = Date.now() - startTime;
      logger.info('Campaigns listed successfully', {
        user_id,
        count: items.length,
        total,
        duration,
      });

      return {
        items: itemsWithStats as Campaign[],
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to list campaigns', error as Error, {
        user_id,
        duration,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw createApiError(
        'DATABASE_ERROR',
        'Failed to retrieve campaigns',
        500,
        true
      );
    }
  }

  /**
   * Create a new campaign
   * Requirements: 3.2
   * 
   * @param userId - User ID
   * @param data - Campaign data
   * @returns Created campaign
   * @throws ApiError on validation or database failure
   */
  async createCampaign(user_id: number, data: CreateCampaignData): Promise<Campaign> {
    const startTime = Date.now();

    try {
      logger.info('Creating campaign', {
        user_id,
        name: data.name,
        status: data.status,
        channel: data.channel,
      });

      // Validate input
      validateCampaignData(data);

      // Initialize stats
      const initialStats = {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      };

      const campaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.create({
          data: {
            id: crypto.randomUUID(),
            user_id: user_id,
            name: data.name,
            status: data.status,
            channel: data.channel,
            goal: data.goal,
            audience_segment: data.audienceSegment,
            audience_size: data.audienceSize,
            message: data.message,
            schedule: data.schedule,
            stats: initialStats,
          },
        }),
        'createCampaign'
      );

      const duration = Date.now() - startTime;
      logger.info('Campaign created successfully', {
        user_id,
        campaignId: (campaign as any).id,
        duration,
      });

      return {
        ...(campaign as any),
        stats: this.calculateCampaignStats((campaign as any).stats),
      } as Campaign;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create campaign', error as Error, {
        user_id,
        duration,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw createApiError(
        'DATABASE_ERROR',
        'Failed to create campaign',
        500,
        true
      );
    }
  }

  /**
   * Update an existing campaign
   * Requirements: 3.3
   * 
   * @param userId - User ID
   * @param campaignId - Campaign ID
   * @param data - Updated campaign data
   * @returns Updated campaign
   * @throws ApiError on not found or database failure
   */
  async updateCampaign(
    user_id: number,
    campaignId: string,
    data: Partial<CreateCampaignData>
  ): Promise<Campaign> {
    const startTime = Date.now();

    try {
      logger.info('Updating campaign', {
        user_id,
        campaignId,
        updates: Object.keys(data),
      });

      // Validate partial data
      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
          throw createApiError('VALIDATION_ERROR', 'Campaign name cannot be empty', 400);
        }
        if (data.name.length > 255) {
          throw createApiError('VALIDATION_ERROR', 'Campaign name too long', 400);
        }
      }

      if (data.audienceSize !== undefined && data.audienceSize < 0) {
        throw createApiError('VALIDATION_ERROR', 'Audience size must be non-negative', 400);
      }

      // Verify ownership
      const campaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.findFirst({
          where: { id: campaignId, user_id },
        }),
        'updateCampaign:findFirst'
      );

      if (!campaign) {
        throw createApiError('NOT_FOUND', 'Campaign not found or access denied', 404);
      }

      // Update campaign stats if status changes
      const updateData: any = {
        ...data,
        updated_at: new Date(),
      };

      // If status is changing to 'active', update stats
      if (data.status === 'active' && (campaign as any).status !== 'active') {
        const currentStats = ((campaign as any).stats as any) || { sent: 0, opened: 0, clicked: 0, converted: 0 };
        updateData.stats = {
          ...currentStats,
          lastActivatedAt: new Date().toISOString(),
        };
      }

      const updatedCampaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.update({
          where: { id: campaignId },
          data: updateData,
        }),
        'updateCampaign:update'
      );

      const duration = Date.now() - startTime;
      logger.info('Campaign updated successfully', {
        user_id,
        campaignId,
        duration,
      });

      return {
        ...(updatedCampaign as any),
        stats: this.calculateCampaignStats((updatedCampaign as any).stats),
      } as Campaign;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update campaign', error as Error, {
        user_id,
        campaignId,
        duration,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw createApiError(
        'DATABASE_ERROR',
        'Failed to update campaign',
        500,
        true
      );
    }
  }

  /**
   * Delete a campaign
   * Requirements: 3.4
   * 
   * @param userId - User ID
   * @param campaignId - Campaign ID
   * @returns Deleted campaign
   * @throws ApiError on not found or database failure
   */
  async deleteCampaign(user_id: number, campaignId: string): Promise<Campaign> {
    const startTime = Date.now();

    try {
      logger.info('Deleting campaign', {
        user_id,
        campaignId,
      });

      // Verify ownership
      const campaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.findFirst({
          where: { id: campaignId, user_id },
        }),
        'deleteCampaign:findFirst'
      );

      if (!campaign) {
        throw createApiError('NOT_FOUND', 'Campaign not found or access denied', 404);
      }

      const deletedCampaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.delete({
          where: { id: campaignId },
        }),
        'deleteCampaign:delete'
      );

      const duration = Date.now() - startTime;
      logger.info('Campaign deleted successfully', {
        user_id,
        campaignId,
        duration,
      });

      return {
        ...(deletedCampaign as any),
        stats: this.calculateCampaignStats((deletedCampaign as any).stats),
      } as Campaign;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to delete campaign', error as Error, {
        user_id,
        campaignId,
        duration,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw createApiError(
        'DATABASE_ERROR',
        'Failed to delete campaign',
        500,
        true
      );
    }
  }

  /**
   * Get a single campaign by ID
   * Requirements: 3.1
   * 
   * @param userId - User ID
   * @param campaignId - Campaign ID
   * @returns Campaign or null if not found
   * @throws ApiError on database failure
   */
  async getCampaign(user_id: number, campaignId: string): Promise<Campaign | null> {
    const startTime = Date.now();

    try {
      logger.info('Getting campaign', {
        user_id,
        campaignId,
      });

      const campaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.findFirst({
          where: { id: campaignId, user_id },
        }),
        'getCampaign'
      );

      const duration = Date.now() - startTime;

      if (!campaign) {
        logger.info('Campaign not found', {
          user_id,
          campaignId,
          duration,
        });
        return null;
      }

      logger.info('Campaign retrieved successfully', {
        user_id,
        campaignId,
        duration,
      });

      return {
        ...(campaign as any),
        stats: this.calculateCampaignStats((campaign as any).stats),
      } as Campaign;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get campaign', error as Error, {
        user_id,
        campaignId,
        duration,
      });

      throw createApiError(
        'DATABASE_ERROR',
        'Failed to retrieve campaign',
        500,
        true
      );
    }
  }

  /**
   * Calculate campaign statistics with rates
   * Requirements: 3.6
   * 
   * @param rawStats - Raw statistics from database
   * @returns Calculated statistics with rates
   */
  private calculateCampaignStats(rawStats: any): CampaignStats {
    const stats = rawStats || { sent: 0, opened: 0, clicked: 0, converted: 0 };

    const sent = stats.sent || 0;
    const opened = stats.opened || 0;
    const clicked = stats.clicked || 0;
    const converted = stats.converted || 0;

    return {
      sent,
      opened,
      clicked,
      converted,
      openRate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
      clickRate: opened > 0 ? Math.round((clicked / opened) * 10000) / 100 : 0,
      conversionRate: sent > 0 ? Math.round((converted / sent) * 10000) / 100 : 0,
    };
  }

  /**
   * Update campaign statistics
   * Requirements: 3.6
   * 
   * @param userId - User ID
   * @param campaignId - Campaign ID
   * @param statsUpdate - Statistics to update
   * @returns Updated campaign
   * @throws ApiError on not found or database failure
   */
  async updateCampaignStats(
    user_id: number,
    campaignId: string,
    statsUpdate: Partial<{ sent: number; opened: number; clicked: number; converted: number }>
  ): Promise<Campaign> {
    const startTime = Date.now();

    try {
      logger.info('Updating campaign stats', {
        user_id,
        campaignId,
        updates: Object.keys(statsUpdate),
      });

      // Validate stats
      for (const [key, value] of Object.entries(statsUpdate)) {
        if (typeof value !== 'number' || value < 0) {
          throw createApiError('VALIDATION_ERROR', `Invalid stat value for ${key}`, 400);
        }
      }

      const campaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.findFirst({
          where: { id: campaignId, user_id },
        }),
        'updateCampaignStats:findFirst'
      );

      if (!campaign) {
        throw createApiError('NOT_FOUND', 'Campaign not found or access denied', 404);
      }

      const currentStats = ((campaign as any).stats as any) || { sent: 0, opened: 0, clicked: 0, converted: 0 };
      const updatedStats = {
        ...currentStats,
        ...statsUpdate,
      };

      const updatedCampaign = await retryWithBackoff(
        () => prisma.marketing_campaigns.update({
          where: { id: campaignId },
          data: {
            stats: updatedStats,
            updated_at: new Date(),
          },
        }),
        'updateCampaignStats:update'
      );

      const duration = Date.now() - startTime;
      logger.info('Campaign stats updated successfully', {
        user_id,
        campaignId,
        duration,
      });

      return {
        ...(updatedCampaign as any),
        stats: this.calculateCampaignStats((updatedCampaign as any).stats),
      } as Campaign;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update campaign stats', error as Error, {
        user_id,
        campaignId,
        duration,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw createApiError(
        'DATABASE_ERROR',
        'Failed to update campaign statistics',
        500,
        true
      );
    }
  }
}

export const marketingService = new MarketingService();
