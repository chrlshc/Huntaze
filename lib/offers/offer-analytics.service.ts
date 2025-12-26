/**
 * Offer Analytics Service
 * Provides metrics, comparisons, and exports for offers
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 * @module lib/offers/offer-analytics
 */

import { PrismaClient } from '@prisma/client';
import type {
  OfferAnalytics,
  OfferComparison,
  RedemptionMetrics,
  AnalyticsExport
} from './types';

// Use global prisma instance or create new one
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================
// Types
// ============================================

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface RedemptionLogEntry {
  id: string;
  offerId: string;
  fanId: string;
  amount: number;
  redeemedAt: Date;
}

export interface OfferPerformance {
  offerId: string;
  name: string;
  metrics: RedemptionMetrics;
  rank: number;
}

export interface TrendDataPoint {
  date: string;
  redemptions: number;
  revenue: number;
}


// ============================================
// Offer Analytics Service Class
// ============================================

export class OfferAnalyticsService {
  /**
   * Get redemption metrics for a specific offer
   * Requirements: 10.1
   */
  async getRedemptionMetrics(offerId: string): Promise<RedemptionMetrics> {
    const redemptions = await prisma.offerRedemption.findMany({
      where: { offerId }
    });

    const offer = await prisma.offer.findUnique({
      where: { id: offerId }
    });

    return this.calculateRedemptionMetrics(redemptions, offer?.redemptionCount || 0);
  }

  /**
   * Get redemption metrics for all offers of a user
   * Requirements: 10.1
   */
  async getUserRedemptionMetrics(userId: number): Promise<RedemptionMetrics> {
    const redemptions = await prisma.offerRedemption.findMany({
      where: {
        offer: { userId }
      }
    });

    const offers = await prisma.offer.findMany({
      where: { userId }
    });

    const totalViews = offers.reduce((sum, o) => sum + (o.redemptionCount || 0), 0);

    return this.calculateRedemptionMetrics(redemptions, totalViews);
  }

  /**
   * Compare multiple offers by performance
   * Requirements: 10.3
   */
  async compareOffers(
    userId: number,
    offerIds?: string[]
  ): Promise<OfferComparison> {
    // Get offers
    const where: Record<string, unknown> = { userId };
    if (offerIds && offerIds.length > 0) {
      where.id = { in: offerIds };
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        redemptions: true
      }
    });

    // Calculate analytics for each offer
    const offerAnalytics: OfferAnalytics[] = offers.map(offer => {
      const totalRevenue = offer.redemptions.reduce((sum, r) => sum + r.amount, 0);
      const redemptionCount = offer.redemptions.length;
      
      return {
        offerId: offer.id,
        redemptionCount,
        totalRevenue,
        conversionRate: offer.redemptionCount > 0 
          ? (redemptionCount / offer.redemptionCount) * 100 
          : 0,
        averageOrderValue: redemptionCount > 0 
          ? totalRevenue / redemptionCount 
          : 0
      };
    });

    // Find best performer by revenue
    const bestPerformer = offerAnalytics.length > 0
      ? offerAnalytics.reduce((best, current) => 
          current.totalRevenue > best.totalRevenue ? current : best
        ).offerId
      : '';

    // Generate insights
    const insights = this.generateInsights(offerAnalytics);

    return {
      offers: offerAnalytics,
      bestPerformer,
      insights
    };
  }

  /**
   * Redeem an offer and log the redemption
   * Requirements: 10.2
   */
  async redeemOffer(
    offerId: string,
    fanId: string,
    amount: number
  ): Promise<RedemptionLogEntry> {
    const redemption = await prisma.offerRedemption.create({
      data: {
        offerId,
        fanId,
        amount,
        redeemedAt: new Date()
      }
    });

    // Update redemption count on offer
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        redemptionCount: { increment: 1 }
      }
    });

    return {
      id: redemption.id,
      offerId: redemption.offerId,
      fanId: redemption.fanId,
      amount: redemption.amount,
      redeemedAt: redemption.redeemedAt
    };
  }

  /**
   * Get redemption history for an offer
   * Requirements: 10.2
   */
  async getRedemptionHistory(
    offerId: string,
    limit: number = 100
  ): Promise<RedemptionLogEntry[]> {
    const redemptions = await prisma.offerRedemption.findMany({
      where: { offerId },
      orderBy: { redeemedAt: 'desc' },
      take: limit
    });

    return redemptions.map(r => ({
      id: r.id,
      offerId: r.offerId,
      fanId: r.fanId,
      amount: r.amount,
      redeemedAt: r.redeemedAt
    }));
  }


  /**
   * Export analytics report
   * Requirements: 10.4
   */
  async exportReport(
    userId: number,
    format: 'csv' | 'json' | 'pdf' = 'json',
    timeRange?: TimeRange
  ): Promise<AnalyticsExport> {
    const where: Record<string, unknown> = { userId };

    const offers = await prisma.offer.findMany({
      where,
      include: {
        redemptions: timeRange ? {
          where: {
            redeemedAt: {
              gte: timeRange.startDate,
              lte: timeRange.endDate
            }
          }
        } : true
      }
    });

    const data: OfferAnalytics[] = offers.map(offer => {
      const totalRevenue = offer.redemptions.reduce((sum, r) => sum + r.amount, 0);
      const redemptionCount = offer.redemptions.length;
      
      return {
        offerId: offer.id,
        redemptionCount,
        totalRevenue,
        conversionRate: offer.redemptionCount > 0 
          ? (redemptionCount / offer.redemptionCount) * 100 
          : 0,
        averageOrderValue: redemptionCount > 0 
          ? totalRevenue / redemptionCount 
          : 0
      };
    });

    return {
      format,
      data,
      generatedAt: new Date()
    };
  }

  /**
   * Get redemption trends over time
   * Requirements: 10.1
   */
  async getRedemptionTrends(
    userId: number,
    timeRange: TimeRange,
    offerId?: string
  ): Promise<TrendDataPoint[]> {
    const where: Record<string, unknown> = {
      redeemedAt: {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      }
    };

    if (offerId) {
      where.offerId = offerId;
    } else {
      where.offer = { userId };
    }

    const redemptions = await prisma.offerRedemption.findMany({
      where,
      orderBy: { redeemedAt: 'asc' }
    });

    // Group by date
    const groupedByDate = new Map<string, typeof redemptions>();
    
    for (const redemption of redemptions) {
      const dateKey = redemption.redeemedAt.toISOString().split('T')[0];
      const existing = groupedByDate.get(dateKey) || [];
      existing.push(redemption);
      groupedByDate.set(dateKey, existing);
    }

    // Calculate trends for each date
    const trends: TrendDataPoint[] = [];
    
    for (const [date, dayRedemptions] of groupedByDate) {
      const revenue = dayRedemptions.reduce((sum, r) => sum + r.amount, 0);
      
      trends.push({
        date,
        redemptions: dayRedemptions.length,
        revenue
      });
    }

    return trends;
  }

  /**
   * Calculate redemption metrics from data
   */
   
  private calculateRedemptionMetrics(
    redemptions: any[],
    totalViews: number
  ): RedemptionMetrics {
    if (redemptions.length === 0) {
      return {
        totalRedemptions: 0,
        totalRevenue: 0,
        averageAmount: 0,
        conversionRate: 0
      };
    }

    const totalRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0);

    return {
      totalRedemptions: redemptions.length,
      totalRevenue,
      averageAmount: totalRevenue / redemptions.length,
      conversionRate: totalViews > 0 
        ? (redemptions.length / totalViews) * 100 
        : 0
    };
  }

  /**
   * Generate insights from offer analytics
   */
  private generateInsights(analytics: OfferAnalytics[]): string[] {
    const insights: string[] = [];

    if (analytics.length === 0) {
      return ['No offers to analyze'];
    }

    // Best performer insight
    const bestByRevenue = analytics.reduce((best, current) => 
      current.totalRevenue > best.totalRevenue ? current : best
    );
    if (bestByRevenue.totalRevenue > 0) {
      insights.push(`Top revenue generator: ${bestByRevenue.offerId} with $${bestByRevenue.totalRevenue.toFixed(2)}`);
    }

    // Best conversion rate
    const bestByConversion = analytics.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    if (bestByConversion.conversionRate > 0) {
      insights.push(`Best conversion rate: ${bestByConversion.offerId} at ${bestByConversion.conversionRate.toFixed(1)}%`);
    }

    // Average order value insight
    const avgAOV = analytics.reduce((sum, a) => sum + a.averageOrderValue, 0) / analytics.length;
    if (avgAOV > 0) {
      insights.push(`Average order value across offers: $${avgAOV.toFixed(2)}`);
    }

    return insights;
  }
}

// ============================================
// Singleton Instance
// ============================================

let serviceInstance: OfferAnalyticsService | null = null;

/**
 * Get the singleton OfferAnalyticsService instance
 */
export function getOfferAnalyticsService(): OfferAnalyticsService {
  if (!serviceInstance) {
    serviceInstance = new OfferAnalyticsService();
  }
  return serviceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetOfferAnalyticsService(): void {
  serviceInstance = null;
}


// ============================================
// Pure Functions for Testing
// ============================================

/**
 * Calculate redemption metrics from data (pure function for property testing)
 */
export function calculateRedemptionMetricsFromData(
  redemptions: Array<{ amount: number }>,
  totalViews: number
): RedemptionMetrics {
  if (redemptions.length === 0) {
    return {
      totalRedemptions: 0,
      totalRevenue: 0,
      averageAmount: 0,
      conversionRate: 0
    };
  }

  const totalRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0);

  return {
    totalRedemptions: redemptions.length,
    totalRevenue,
    averageAmount: totalRevenue / redemptions.length,
    conversionRate: totalViews > 0 
      ? (redemptions.length / totalViews) * 100 
      : 0
  };
}

/**
 * Log a redemption (pure function for property testing)
 * Returns the redemption entry that would be created
 */
export function createRedemptionEntry(
  offerId: string,
  fanId: string,
  amount: number
): RedemptionLogEntry {
  return {
    id: `redemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    offerId,
    fanId,
    amount,
    redeemedAt: new Date()
  };
}

/**
 * Validate that a redemption was logged correctly
 */
export function validateRedemptionLogging(
  entry: RedemptionLogEntry,
  offerId: string,
  fanId: string,
  amount: number
): boolean {
  // Entry must have an ID
  if (!entry.id || entry.id.length === 0) {
    return false;
  }

  // Offer ID must match
  if (entry.offerId !== offerId) {
    return false;
  }

  // Fan ID must match
  if (entry.fanId !== fanId) {
    return false;
  }

  // Amount must match
  if (entry.amount !== amount) {
    return false;
  }

  // Must have a redemption date
  if (!entry.redeemedAt || !(entry.redeemedAt instanceof Date)) {
    return false;
  }

  return true;
}

/**
 * Validate redemption metrics consistency
 */
export function validateRedemptionMetrics(metrics: RedemptionMetrics): boolean {
  // All values must be non-negative
  if (metrics.totalRedemptions < 0) return false;
  if (metrics.totalRevenue < 0) return false;
  if (metrics.averageAmount < 0) return false;
  if (metrics.conversionRate < 0) return false;

  // Conversion rate can exceed 100% if redemptions > views (e.g., multiple redemptions per view)
  // So we only check it's non-negative

  // If no redemptions, average must be 0
  if (metrics.totalRedemptions === 0 && metrics.averageAmount !== 0) {
    return false;
  }

  // Average amount must equal totalRevenue / totalRedemptions
  if (metrics.totalRedemptions > 0) {
    const expectedAvg = metrics.totalRevenue / metrics.totalRedemptions;
    if (Math.abs(metrics.averageAmount - expectedAvg) > 0.001) {
      return false;
    }
  }

  return true;
}
