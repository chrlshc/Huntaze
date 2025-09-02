export declare enum OnlyFansCSVType {
    SUBSCRIBERS = "subscribers",
    REVENUE = "revenue",
    CONTENT = "content"
}
export declare class OnlyFansSubscriberRow {
    username: string;
    name: string;
    email: string;
    status: string;
    subscription_price: string;
    subscription_start: string;
    subscription_end: string;
    rebill_status: string;
    total_spent: string;
    messages_sent: string;
    tips_sent: string;
    ppv_purchased: string;
    join_date: string;
    last_active: string;
}
export declare class OnlyFansRevenueRow {
    date: string;
    type: string;
    username: string;
    gross_amount: string;
    platform_fee: string;
    net_amount: string;
    currency: string;
    status: string;
    description: string;
    message_id?: string;
    post_id?: string;
    stream_id?: string;
}
export declare class OnlyFansContentRow {
    post_id: string;
    created_at: string;
    type: string;
    visibility: string;
    price?: string;
    likes: string;
    comments: string;
    tips: string;
    ppv_purchases: string;
    total_revenue: string;
}
export declare class OnlyFansCSVImportDto {
    type: OnlyFansCSVType;
    sourceId: string;
    periodStart?: string;
    periodEnd?: string;
    rows: any[];
}
export declare class OnlyFansImportResultDto {
    type: OnlyFansCSVType;
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    errors: Array<{
        row: number;
        message: string;
        data?: any;
    }>;
    subscribersImported?: number;
    revenueImported?: {
        transactions: number;
        totalGross: number;
        totalNet: number;
    };
    contentImported?: number;
    engagementScoresUpdated?: number;
    tiersAssigned?: {
        VIP: number;
        PREMIUM: number;
        ACTIVE: number;
        BASIC: number;
    };
}
export declare class OnlyFansEngagementMetrics {
    fanId: string;
    score: number;
    components: {
        recency: number;
        frequency: number;
        monetary: number;
        interaction: number;
    };
    tier: 'VIP' | 'PREMIUM' | 'ACTIVE' | 'BASIC';
    lastCalculated: Date;
}
//# sourceMappingURL=csv-import.dto.d.ts.map