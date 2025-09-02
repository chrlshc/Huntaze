import { ProductType, CommissionTier } from '@prisma/client';
export interface TimeSeriesDataPoint {
    date: string;
    value: number;
}
export interface PeriodRange {
    start: Date;
    end: Date;
}
export interface TopPerformerDto {
    id: string;
    title: string;
    type: ProductType;
    thumbnailUrl?: string;
    metrics: {
        views: number;
        purchases: number;
        revenue: number;
        conversionRate: number;
    };
}
export interface RecentTransactionDto {
    id: string;
    type: string;
    amount: number;
    currency: string;
    fan: {
        username?: string;
        displayName?: string;
        avatar?: string;
    } | null;
    createdAt: Date;
}
export declare class DashboardOverviewDto {
    period: 'day' | 'week' | 'month' | 'year';
    dateRange: PeriodRange;
    totalRevenue: number;
    revenueGrowth: number;
    activeSubscribers: number;
    subscriberGrowth: number;
    conversionRate: number;
    averageOrderValue: number;
    revenue: {
        total: number;
        subscription: number;
        products: number;
        tips: number;
        growth: number;
    };
    subscribers: {
        total: number;
        active: number;
        new: number;
        churned: number;
        churnRate: number;
        growth: number;
    };
    engagement: {
        pageViews: number;
        uniqueVisitors: number;
        avgSessionDuration: number;
        conversionRate: number;
    };
    topProducts: TopPerformerDto[];
    recentTransactions: RecentTransactionDto[];
    quickStats: {
        pendingPayouts: number;
        availableBalance: number;
        totalFans: number;
        contentPublished: number;
    };
}
export declare class RevenueAnalyticsDto {
    period: PeriodRange;
    summary: {
        total: number;
        net: number;
        fees: number;
        transactionCount: number;
    };
    byType: Array<{
        type: string;
        amount: number;
        net: number;
        fees: number;
        count: number;
    }>;
    timeSeries: TimeSeriesDataPoint[];
    topSources: Array<{
        fanId: string;
        fan: {
            username?: string;
            displayName?: string;
            avatar?: string;
        } | null;
        totalRevenue: number;
        transactionCount: number;
    }>;
    projection: {
        nextMonth: number;
        nextQuarter: number;
        nextYear: number;
    };
    commissionMetrics: {
        currentTier: CommissionTier;
        totalFeesPaid: number;
        averageFeeRate: number;
        lifetimeRevenue: number;
    };
}
export declare class SubscriberAnalyticsDto {
    period: PeriodRange;
    summary: {
        total: number;
        active: number;
        new: number;
        churned: number;
        churnRate: number;
    };
    growth: TimeSeriesDataPoint[];
    retention: {
        retentionRate: number;
        averageSubscriptionDuration: number;
        monthlyRetention: Array<{
            month: string;
            rate: number;
        }>;
    };
    lifetimeValue: number;
    planDistribution: Array<{
        planId: string;
        planName: string;
        price: number;
        count: number;
    }>;
    churnPrediction: {
        predictedChurnRate: number;
        atRiskSubscribers: number;
        confidence: number;
    };
    cohorts: Array<{
        month: string;
        size: number;
        retained: number;
        retentionRate: number;
    }>;
    segments: {
        byValue: {
            high: number;
            medium: number;
            low: number;
        };
        byEngagement: {
            veryActive: number;
            active: number;
            passive: number;
            inactive: number;
        };
        byDuration: {
            newSubscribers: number;
            regular: number;
            loyal: number;
            vip: number;
        };
    };
}
export declare class ContentAnalyticsDto {
    period: PeriodRange;
    summary: {
        totalContent: number;
        publishedInPeriod: number;
        totalViews: number;
        totalPurchases: number;
    };
    performanceByType: Array<{
        type: ProductType;
        count: number;
        views: number;
        purchases: number;
        avgPrice: number;
        conversionRate: number;
    }>;
    topContent: Array<{
        id: string;
        title: string;
        type: ProductType;
        views: number;
        purchases: number;
        revenue: number;
        conversionRate: number;
        publishedAt?: Date;
    }>;
    engagement: {
        totalViews: number;
        totalPurchases: number;
        averageConversionRate: number;
        viewsPerContent: number;
        purchasesPerContent: number;
    };
    publishingPatterns: {
        totalPublished: number;
        averagePerWeek: number;
        bestDays: number[];
        bestHours: number[];
    };
    recommendations: Array<{
        type: 'pricing' | 'content' | 'frequency' | 'timing';
        message: string;
        priority: 'high' | 'medium' | 'low';
    }>;
}
export declare class PeriodComparisonDto {
    current: {
        period: PeriodRange;
        metrics: Record<string, number>;
    };
    previous: {
        period: PeriodRange;
        metrics: Record<string, number>;
    };
    changes: Record<string, {
        absolute: number;
        percentage: number;
    }>;
}
export declare class ExportAnalyticsDto {
    format: 'csv' | 'json' | 'pdf';
    type: 'revenue' | 'subscribers' | 'content' | 'full';
    period: PeriodRange;
    includeDetails: boolean;
}
export declare class AnalyticsFilterDto {
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month' | 'year' | 'custom';
    groupBy?: 'day' | 'week' | 'month';
    metrics?: string[];
    includeComparison?: boolean;
}
//# sourceMappingURL=analytics.dto.d.ts.map