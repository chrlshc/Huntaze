import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { DashboardOverviewDto, RevenueAnalyticsDto, SubscriberAnalyticsDto, ContentAnalyticsDto } from '../dto/analytics.dto';
export declare class AnalyticsService {
    private readonly prisma;
    private readonly cache;
    constructor(prisma: PrismaService, cache: CacheService);
    /**
     * Obtient le dashboard overview pour un créateur
     */
    getDashboardOverview(creatorId: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<DashboardOverviewDto>;
    /**
     * Obtient les analytics de revenus détaillés
     */
    getRevenueAnalytics(creatorId: string, startDate?: Date, endDate?: Date, groupBy?: 'day' | 'week' | 'month'): Promise<RevenueAnalyticsDto>;
    /**
     * Obtient les analytics des abonnés
     */
    getSubscriberAnalytics(creatorId: string, startDate?: Date, endDate?: Date): Promise<SubscriberAnalyticsDto>;
    /**
     * Obtient les analytics de contenu
     */
    getContentAnalytics(creatorId: string, startDate?: Date, endDate?: Date): Promise<ContentAnalyticsDto>;
    private getPeriodDates;
    private getPreviousPeriodDates;
    private calculateGrowthRate;
    private getRevenueMetrics;
    private getSubscriberMetrics;
    private getEngagementMetrics;
    private getTopProducts;
    private getRecentTransactions;
    private getPendingPayouts;
    private getAvailableBalance;
    private getTotalFans;
    private getContentCount;
    private getRevenueTimeSeries;
    private getTopRevenueSources;
    private calculateRevenueProjection;
    private getCommissionMetrics;
    private getSubscriberGrowthTimeSeries;
    private getRetentionAnalysis;
    private calculateLifetimeValue;
    private getSubscribersByPlan;
    private predictChurn;
    private getCohortAnalysis;
    private segmentSubscribersByValue;
    private segmentSubscribersByEngagement;
    private segmentSubscribersByDuration;
    private getContentEngagementMetrics;
    private getPublishingPatterns;
    private getContentRecommendations;
}
//# sourceMappingURL=analytics.service.d.ts.map