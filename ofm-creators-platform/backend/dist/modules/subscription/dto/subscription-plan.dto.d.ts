import { BillingInterval } from '@prisma/client';
export declare class CreateSubscriptionPlanDto {
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: BillingInterval;
    intervalCount?: number;
    features?: string[];
    maxDownloads?: number;
    earlyAccess?: boolean;
    exclusiveContent?: boolean;
    trialPeriodDays?: number;
}
export declare class UpdateSubscriptionPlanDto {
    name?: string;
    description?: string;
    price?: number;
    features?: string[];
    maxDownloads?: number;
    earlyAccess?: boolean;
    exclusiveContent?: boolean;
    trialPeriodDays?: number;
    isActive?: boolean;
}
export declare class SubscriptionPlanResponseDto {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: BillingInterval;
    intervalCount: number;
    features: string[];
    maxDownloads?: number;
    earlyAccess: boolean;
    exclusiveContent: boolean;
    trialPeriodDays?: number;
    isActive: boolean;
    subscriberCount?: number;
    monthlyRevenue?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SubscriptionPlanAnalyticsDto {
    planId: string;
    planName: string;
    activeSubscribers: number;
    totalSubscribers: number;
    churnRate: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
    subscriberGrowthRate: number;
    newSubscribersThisMonth: number;
    canceledThisMonth: number;
    averageSubscriptionLength: number;
    renewalRate: number;
}
//# sourceMappingURL=subscription-plan.dto.d.ts.map