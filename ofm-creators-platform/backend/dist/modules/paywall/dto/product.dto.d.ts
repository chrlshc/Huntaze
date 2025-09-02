import { ProductType, ContentAccess } from '@prisma/client';
export declare class CreateProductDto {
    type: ProductType;
    title: string;
    description?: string;
    price?: number;
    currency?: string;
    contentUrl?: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    accessType: ContentAccess;
    requiresSubscription?: boolean;
    tags?: string[];
    isPublished?: boolean;
    contentFile?: Express.Multer.File;
    thumbnailFile?: Express.Multer.File;
    previewFile?: Express.Multer.File;
}
export declare class UpdateProductDto {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    accessType?: ContentAccess;
    requiresSubscription?: boolean;
    tags?: string[];
    isPublished?: boolean;
    contentFile?: Express.Multer.File;
    thumbnailFile?: Express.Multer.File;
    previewFile?: Express.Multer.File;
}
export declare class ProductResponseDto {
    id: string;
    creatorId: string;
    type: ProductType;
    title: string;
    description?: string;
    price?: number;
    currency: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    accessType: ContentAccess;
    requiresSubscription: boolean;
    tags: string[];
    isPublished: boolean;
    publishedAt?: Date;
    viewCount: number;
    purchaseCount: number;
    createdAt: Date;
    updatedAt: Date;
    creator?: {
        username: string;
        displayName: string;
        avatar?: string;
    };
    hasAccess?: boolean;
    accessType?: string;
    requiresPurchase?: boolean;
}
export declare class ProductListDto {
    products: ProductResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export declare class ProductFilterDto {
    type?: ProductType;
    accessType?: ContentAccess;
    search?: string;
    tags?: string[];
    isPublished?: boolean;
    creatorId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'createdAt' | 'price' | 'viewCount' | 'purchaseCount';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}
export declare class ProductStatsDto {
    productId: string;
    views: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
    avgViewDuration?: number;
    viewsByDay: Array<{
        date: string;
        views: number;
    }>;
    purchasesByDay: Array<{
        date: string;
        purchases: number;
        revenue: number;
    }>;
    topCountries: Array<{
        country: string;
        count: number;
    }>;
    trafficSources: Array<{
        source: string;
        count: number;
        conversionRate: number;
    }>;
}
export declare class BulkProductActionDto {
    productIds: string[];
    action: string;
    payload?: {
        price?: number;
        accessType?: ContentAccess;
    };
}
//# sourceMappingURL=product.dto.d.ts.map