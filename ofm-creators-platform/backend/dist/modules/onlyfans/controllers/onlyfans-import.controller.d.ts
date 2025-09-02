import { OnlyFansImportService } from '../services/onlyfans-import.service';
import { OnlyFansCSVImportDto } from '../dto/csv-import.dto';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
export declare class OnlyFansImportController {
    private readonly onlyFansImportService;
    private readonly prisma;
    constructor(onlyFansImportService: OnlyFansImportService, prisma: PrismaService);
    /**
     * Import CSV data from OnlyFans
     */
    importCSV(user: any, dto: OnlyFansCSVImportDto): Promise<import("../dto/csv-import.dto").OnlyFansImportResultDto>;
    /**
     * Get engagement analytics
     */
    getEngagementAnalytics(user: any): Promise<{
        totalFans: number;
        averageEngagementScore: number;
        totalLifetimeValue: number;
        tierDistribution: {
            VIP: {
                count: number;
                percentage: string;
            };
            PREMIUM: {
                count: number;
                percentage: string;
            };
            ACTIVE: {
                count: number;
                percentage: string;
            };
            BASIC: {
                count: number;
                percentage: string;
            };
        };
        topFans: {
            username: string | null;
            score: number;
            lifetimeValue: number;
            lastInteraction: Date | null;
        }[];
    }>;
    /**
     * Parse CSV file and preview import
     */
    previewImport(user: any, body: {
        type: string;
        csvContent: string;
        delimiter?: string;
    }): Promise<{
        type: string;
        headers: string[];
        requiredHeaders: string[];
        missingHeaders: string[];
        isValid: boolean;
        sampleRows: any[];
        totalRows: number;
    }>;
    /**
     * Get CSV templates
     */
    getTemplates(): Promise<{
        subscribers: {
            name: string;
            headers: string[];
            sample: {
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
            }[];
        };
        revenue: {
            name: string;
            headers: string[];
            sample: {
                date: string;
                type: string;
                username: string;
                gross_amount: string;
                platform_fee: string;
                net_amount: string;
                currency: string;
                status: string;
                description: string;
                message_id: string;
                post_id: string;
                stream_id: string;
            }[];
        };
        content: {
            name: string;
            headers: string[];
            sample: {
                post_id: string;
                created_at: string;
                type: string;
                visibility: string;
                price: string;
                likes: string;
                comments: string;
                tips: string;
                ppv_purchases: string;
                total_revenue: string;
            }[];
        };
    }>;
    /**
     * Get source connections
     */
    getSources(user: any): Promise<{
        id: string;
        active: boolean;
        currency: string;
        externalHandle: string;
        connectedAt: Date;
        lastSync: Date | null;
    }[]>;
    /**
     * Create new OnlyFans source
     */
    createSource(user: any, body: {
        externalHandle: string;
        currency: string;
    }): Promise<{
        id: string;
        creatorId: string;
        active: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        platform: import(".prisma/client").$Enums.ExternalPlatform;
        currency: string;
        externalHandle: string;
        connectedAt: Date;
        lastSync: Date | null;
    }>;
    private getRequiredHeaders;
}
//# sourceMappingURL=onlyfans-import.controller.d.ts.map