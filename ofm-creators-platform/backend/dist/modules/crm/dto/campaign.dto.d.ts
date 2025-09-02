import { CampaignType, CampaignStatus } from '@prisma/client';
export declare class CreateCampaignDto {
    name: string;
    type: CampaignType;
    subject?: string;
    content: string;
    targetTags?: string[];
    targetSegment?: {
        minLifetimeValue?: number;
        maxLifetimeValue?: number;
        minEngagementScore?: number;
        maxEngagementScore?: number;
        hasActiveSubscription?: boolean;
        customCriteria?: Record<string, any>;
    };
    scheduledFor?: Date;
    templateId?: string;
    metadata?: Record<string, any>;
}
export declare class UpdateCampaignDto {
    name?: string;
    type?: CampaignType;
    subject?: string;
    content?: string;
    targetTags?: string[];
    targetSegment?: Record<string, any>;
    scheduledFor?: Date;
}
export declare class SendTestCampaignDto {
    testEmail?: string;
    testPhone?: string;
}
export declare class CampaignFilterDto {
    status?: CampaignStatus;
    type?: CampaignType;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: 'createdAt' | 'sentAt' | 'openRate' | 'clickRate';
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
}
export declare class CampaignMetricsDto {
    campaignId: string;
    totalRecipients: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    conversions?: number;
    conversionRate?: number;
    revenue?: number;
    averageOrderValue?: number;
    timeline: {
        created: Date;
        scheduled?: Date;
        started?: Date;
        completed?: Date;
    };
    segmentBreakdown?: Array<{
        segment: string;
        sent: number;
        opened: number;
        clicked: number;
        openRate: number;
        clickRate: number;
    }>;
    deviceBreakdown?: {
        desktop: number;
        mobile: number;
        tablet: number;
    };
    linkPerformance?: Array<{
        url: string;
        clicks: number;
        uniqueClicks: number;
    }>;
}
export declare class CampaignTemplateDto {
    name: string;
    description?: string;
    type: CampaignType;
    subject?: string;
    content: string;
    variables?: string[];
    thumbnailUrl?: string;
    tags?: string[];
}
export declare class CampaignResponseDto {
    id: string;
    creatorId: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    subject?: string;
    content: string;
    targetTags: string[];
    targetSegment: any;
    scheduledFor?: Date;
    sentAt?: Date;
    sentCount: number;
    openCount: number;
    clickCount: number;
    recipientCount?: number;
    createdAt: Date;
    updatedAt: Date;
    openRate?: number;
    clickRate?: number;
    isEditable: boolean;
}
export declare class CampaignListDto {
    campaigns: CampaignResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export declare class TrackingPixelDto {
    campaignId: string;
    fanId: string;
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
}
export declare class TrackingLinkDto {
    campaignId: string;
    fanId: string;
    originalUrl: string;
    clickedAt: Date;
    userAgent?: string;
    ipAddress?: string;
}
export declare class CampaignABTestDto {
    name: string;
    variants: Array<{
        name: string;
        subject?: string;
        content: string;
        percentage: number;
    }>;
    winningMetric?: 'opens' | 'clicks' | 'conversions';
    testDurationHours?: number;
    testSampleSize?: number;
}
export declare class AutomationTriggerDto {
    triggerType: string;
    conditions?: {
        tags?: string[];
        minLifetimeValue?: number;
        daysSinceJoined?: number;
        customField?: Record<string, any>;
    };
    delayMinutes?: number;
    campaignTemplateId: string;
}
//# sourceMappingURL=campaign.dto.d.ts.map