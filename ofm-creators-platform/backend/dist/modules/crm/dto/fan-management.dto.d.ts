export declare enum FanValueSegment {
    VIP = "vip",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    NEW = "new"
}
export declare enum FanEngagementLevel {
    VERY_ACTIVE = "very_active",
    ACTIVE = "active",
    PASSIVE = "passive",
    INACTIVE = "inactive",
    CHURNED = "churned"
}
export declare class CreateFanDto {
    email: string;
    username?: string;
    displayName?: string;
    phoneNumber?: string;
    source?: string;
    metadata?: Record<string, any>;
}
export declare class UpdateFanDto {
    displayName?: string;
    phoneNumber?: string;
    notes?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}
export declare class FanTagDto {
    tags: string[];
}
export declare class FanSegmentDto {
    name: string;
    description?: string;
    tags?: string[];
    minLifetimeValue?: number;
    maxLifetimeValue?: number;
    minEngagementScore?: number;
    maxEngagementScore?: number;
    subscriptionStatus?: string[];
    daysSinceLastPurchase?: {
        min?: number;
        max?: number;
    };
    source?: string[];
    location?: string[];
    customCriteria?: Record<string, any>;
}
export declare class FanFilterDto {
    search?: string;
    tags?: string[];
    minLifetimeValue?: number;
    maxLifetimeValue?: number;
    minEngagementScore?: number;
    maxEngagementScore?: number;
    hasActiveSubscription?: boolean;
    lastInteractionDays?: number;
    valueSegment?: FanValueSegment;
    engagementLevel?: FanEngagementLevel;
    sortBy?: 'engagementScore' | 'lifetimeValue' | 'lastInteraction' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class FanCommunicationPreferencesDto {
    emailOptIn?: boolean;
    smsOptIn?: boolean;
    pushOptIn?: boolean;
    preferredChannel?: 'email' | 'sms' | 'push' | 'in_app';
    notificationTypes?: string[];
}
export declare class BulkFanActionDto {
    fanIds: string[];
    action: string;
    payload?: {
        tags?: string[];
        segment?: string;
        format?: 'csv' | 'json';
    };
}
export declare class FanEngagementDto {
    summary: {
        totalFans: number;
        activeFans: number;
        vipFans: number;
        churnedFans: number;
        averageEngagementScore: number;
        averageLifetimeValue: number;
    };
    segmentDistribution: Record<string, {
        count: number;
        percentage: number;
    }>;
    topFans: Array<{
        id: string;
        email: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        lifetimeValue: number;
        engagementScore: number;
        tags: string[];
    }>;
    engagementTrends: {
        averageScoreTrend: Array<{
            date: string;
            score: number;
        }>;
        activeUsersTrend: Array<{
            date: string;
            count: number;
        }>;
        churnTrend: Array<{
            date: string;
            rate: number;
        }>;
    };
    communicationOptIns: {
        emailOptInRate: number;
        smsOptInRate: number;
        totalEmailOptIns: number;
        totalSmsOptIns: number;
    };
}
export declare class FanTimelineEventDto {
    id: string;
    type: 'subscription' | 'purchase' | 'message' | 'campaign' | 'tag_added' | 'tag_removed';
    timestamp: Date;
    details: Record<string, any>;
}
export declare class FanProfileDto {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    phoneNumber?: string;
    engagementScore: number;
    lifetimeValue: number;
    tags: string[];
    notes?: string;
    hasActiveSubscription: boolean;
    currentPlan?: string;
    subscriptionStartDate?: Date;
    subscriptionStatus?: string;
    totalPurchases: number;
    totalSpent: number;
    lastInteraction: Date;
    joinedAt: Date;
    emailOptIn: boolean;
    smsOptIn: boolean;
    preferredChannel?: string;
    segments: string[];
    valueSegment: FanValueSegment;
    engagementLevel: FanEngagementLevel;
    recentPurchases: Array<{
        id: string;
        productTitle: string;
        amount: number;
        date: Date;
    }>;
    timeline: FanTimelineEventDto[];
}
//# sourceMappingURL=fan-management.dto.d.ts.map