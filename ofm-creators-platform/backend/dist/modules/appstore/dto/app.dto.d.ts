import { AppCategory, AppPricing } from '@prisma/client';
export declare class CreateAppDto {
    name: string;
    description: string;
    icon?: string;
    developer: string;
    website?: string;
    category: AppCategory;
    pricing: AppPricing;
    price?: number;
    webhookUrl?: string;
    scopes: string[];
    metadata?: {
        version?: string;
        minPlatformVersion?: string;
        maxPlatformVersion?: string;
        screenshots?: string[];
        videoUrl?: string;
        supportEmail?: string;
        privacyPolicyUrl?: string;
        termsOfServiceUrl?: string;
    };
}
export declare class UpdateAppDto {
    name?: string;
    description?: string;
    icon?: string;
    website?: string;
    pricing?: AppPricing;
    price?: number;
    webhookUrl?: string;
    scopes?: string[];
}
export declare class AppFilterDto {
    category?: AppCategory;
    pricing?: AppPricing;
    search?: string;
    verified?: boolean;
    developer?: string;
    sortBy?: 'name' | 'installs' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
}
export declare class InstallAppDto {
    appId: string;
    settings?: Record<string, any>;
    acceptTerms?: boolean;
}
export declare class AppConfigDto {
    settings?: Record<string, any>;
    enabled?: boolean;
    allowedWebhooks?: string[];
}
export declare class AppWebhookDto {
    event: string;
    creatorId?: string;
    data: any;
    idempotencyKey?: string;
}
export declare class AppPermissionsDto {
    appId: string;
    appName: string;
    scopes: string[];
    grantedAt: Date;
    expiresAt?: Date;
    restrictions?: string[];
}
export declare class AppResponseDto {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon?: string;
    developer: string;
    website?: string;
    category: AppCategory;
    pricing: AppPricing;
    price?: number;
    scopes: string[];
    isPublished: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    installCount?: number;
    rating?: number;
    installation?: {
        id: string;
        status: string;
        settings?: any;
        installedAt: Date;
    };
}
export declare class AppListDto {
    apps: AppResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    categories: Record<string, number>;
}
export declare class InstalledAppDto {
    id: string;
    app: {
        id: string;
        name: string;
        icon?: string;
        category: AppCategory;
    };
    status: string;
    settings?: any;
    billingCycle?: string;
    nextBilling?: Date;
    installedAt: Date;
    lastUsedAt?: Date;
}
export declare class AppEventDto {
    appId: string;
    event: string;
    data?: any;
    userId?: string;
}
export declare class AppBillingDto {
    appId: string;
    pricing: AppPricing;
    price?: number;
    billingCycle?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextBilling?: Date;
    usage?: {
        calls: number;
        storage: number;
        bandwidth: number;
    };
    costs?: {
        base: number;
        usage: number;
        total: number;
    };
}
export declare class AppReviewDto {
    appId: string;
    rating: number;
    comment?: string;
}
export declare class AppUsageDto {
    appId: string;
    period: {
        start: Date;
        end: Date;
    };
    metrics: {
        apiCalls: number;
        webhooksSent: number;
        webhooksReceived: number;
        storageUsed: number;
        bandwidthUsed: number;
        activeUsers: number;
    };
    limits?: {
        apiCalls: number;
        storage: number;
        bandwidth: number;
    };
    costs?: {
        computed: number;
        billed: number;
    };
}
export declare class DeveloperAppDto {
    developerId: string;
    status?: 'all' | 'published' | 'draft';
}
export declare class AppSecretRotateDto {
    appId: string;
    secretType: string;
    revokeOld?: boolean;
}
//# sourceMappingURL=app.dto.d.ts.map