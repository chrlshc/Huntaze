import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { CreateSmartLinkDto, UpdateSmartLinkDto } from './dto/smart-link.dto';
export declare class SmartLinksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    /**
     * Create a new smart link
     */
    create(creatorId: string, dto: CreateSmartLinkDto): Promise<any>;
    /**
     * Get smart link by slug (for redirect)
     */
    getBySlug(slug: string): Promise<any>;
    /**
     * Track click on smart link
     */
    trackClick(smartLinkId: string, data: {
        sessionId?: string;
        fanId?: string;
        ipAddress?: string;
        userAgent?: string;
        referrer?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
    }): Promise<any>;
    /**
     * Get smart links for creator
     */
    findAll(creatorId: string, params?: {
        campaignId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Get link analytics
     */
    getAnalytics(creatorId: string, smartLinkId: string, days?: number): Promise<{
        link: any;
        metrics: {
            totalClicks: any;
            uniqueClicks: number;
            totalRevenue: any;
            conversions: any;
            conversionRate: number;
            revenuePerClick: number;
        };
        timeSeries: {
            clicks: {
                date: string;
                value: number;
            }[];
            revenue: {
                date: string;
                value: number;
            }[];
        };
        breakdown: {
            device: {
                name: string;
                value: number;
            }[];
            browser: {
                name: string;
                value: number;
            }[];
            country: {
                name: string;
                value: number;
            }[];
        };
        topReferrers: {
            referrer: string;
            clicks: number;
        }[];
    }>;
    /**
     * Update smart link
     */
    update(creatorId: string, smartLinkId: string, dto: UpdateSmartLinkDto): Promise<any>;
    /**
     * Delete smart link
     */
    delete(creatorId: string, smartLinkId: string): Promise<void>;
    /**
     * Helper methods
     */
    private generateUniqueSlug;
    private isValidSlug;
    private getShortUrl;
    private isUniqueClick;
    private parseUserAgent;
    private groupByDay;
    private getBreakdown;
    private getTopReferrers;
}
//# sourceMappingURL=smart-links.service.d.ts.map