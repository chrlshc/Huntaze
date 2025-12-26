import { PrismaService } from '@infrastructure/prisma/prisma.service';
export interface OverviewMetrics {
    gmv: number;
    netRevenue: number;
    activeFans: number;
    engagement: number;
    period: '7d' | '28d';
    comparison?: {
        gmv: number;
        netRevenue: number;
        activeFans: number;
        engagement: number;
    };
}
export interface CampaignMetrics {
    campaigns: Array<{
        id: string;
        channel: string;
        sent: number;
        openRate?: number;
        clickRate?: number;
        convRate?: number;
        revenue: number;
        roas?: number;
        cost?: number;
    }>;
    totals: {
        sent: number;
        revenue: number;
        cost: number;
        avgRoas: number;
    };
}
export interface SocialMetrics {
    platforms: Array<{
        platform: string;
        followers: number;
        impressions: number;
        linkClicks: number;
        revenue: number;
    }>;
    timeSeries: Array<{
        date: string;
        followers: number;
        impressions: number;
        linkClicks: number;
    }>;
}
export interface CRMSegments {
    segments: Array<{
        label: 'VIP' | 'RECENT' | 'DORMANT' | 'CHURN_RISK' | 'CORE';
        fans: number;
        arpu: number;
        propension?: number;
    }>;
    totalFans: number;
    totalRevenue: number;
}
export declare class CrossChannelAnalyticsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getOverviewMetrics(creatorId: string, range?: '7d' | '28d'): Promise<OverviewMetrics>;
    getCampaignMetrics(creatorId: string, range?: '7d' | '28d'): Promise<CampaignMetrics>;
    getSocialMetrics(creatorId: string, range?: '7d' | '28d'): Promise<SocialMetrics>;
    getCRMSegments(creatorId: string): Promise<CRMSegments>;
    updateFanSegments(creatorId: string): Promise<void>;
}
//# sourceMappingURL=cross-channel-analytics.service.d.ts.map