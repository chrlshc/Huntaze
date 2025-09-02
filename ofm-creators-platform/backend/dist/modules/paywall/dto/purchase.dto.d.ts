export declare class PurchaseProductDto {
    productId: string;
    paymentMethodId: string;
    couponCode?: string;
}
export declare class TipCreatorDto {
    creatorId: string;
    amount: number;
    currency?: string;
    paymentMethodId: string;
    message?: string;
}
export declare class PurchaseResponseDto {
    id: string;
    fanId: string;
    productId: string;
    amount: number;
    currency: string;
    status: string;
    downloadCount: number;
    lastDownloadAt?: Date;
    createdAt: Date;
    product?: {
        id: string;
        title: string;
        type: string;
        thumbnailUrl?: string;
        creator: {
            username: string;
            displayName: string;
        };
    };
}
export declare class PurchaseListDto {
    purchases: PurchaseResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export declare class DownloadResponseDto {
    downloadUrl: string;
    expiresAt: Date;
    remainingDownloads?: number;
}
export declare class RefundRequestDto {
    purchaseId: string;
    reason: string;
    details?: string;
}
export declare class RefundResponseDto {
    refundId: string;
    purchaseId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    reason: string;
    processedAt?: Date;
    createdAt: Date;
}
//# sourceMappingURL=purchase.dto.d.ts.map