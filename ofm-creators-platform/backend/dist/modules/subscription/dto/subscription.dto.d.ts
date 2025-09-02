import { SubscriptionStatus } from '@prisma/client';
export declare class SubscribeDto {
    planId: string;
    paymentMethodId: string;
    couponCode?: string;
}
export declare class UpdateSubscriptionDto {
    planId?: string;
    paymentMethodId?: string;
}
export declare class CancelSubscriptionDto {
    immediately?: boolean;
    reason?: string;
    feedback?: string;
}
export declare class SubscriptionResponseDto {
    id: string;
    fanId: string;
    creatorId: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
    endedAt?: Date;
    totalSpent: number;
    renewalCount: number;
    createdAt: Date;
    updatedAt: Date;
    plan?: {
        name: string;
        price: number;
        currency: string;
        interval: string;
    };
    creator?: {
        username: string;
        displayName: string;
        avatar?: string;
    };
}
export declare class SubscriptionListDto {
    subscriptions: SubscriptionResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export declare class SubscriptionFilterDto {
    status?: SubscriptionStatus;
    creatorId?: string;
    planId?: string;
    search?: string;
    sortBy?: 'createdAt' | 'totalSpent' | 'renewalCount';
    sortOrder?: 'asc' | 'desc';
    page?: string;
    pageSize?: string;
}
export declare class SubscriptionMetricsDto {
    totalActive: number;
    totalCanceled: number;
    totalRevenue: number;
    averageLifetimeValue: number;
    churnRate: number;
    growthRate: number;
    revenueByMonth: Array<{
        month: string;
        revenue: number;
    }>;
    subscribersByMonth: Array<{
        month: string;
        count: number;
    }>;
}
//# sourceMappingURL=subscription.dto.d.ts.map