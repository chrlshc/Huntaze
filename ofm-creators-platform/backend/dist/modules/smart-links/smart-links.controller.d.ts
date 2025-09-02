import { Request, Response } from 'express';
import { SmartLinksService } from './smart-links.service';
import { CreateSmartLinkDto } from './dto/smart-link.dto';
export declare class SmartLinksController {
    private readonly smartLinksService;
    constructor(smartLinksService: SmartLinksService);
    createSmartLink(req: any, dto: CreateSmartLinkDto): Promise<any>;
    getSmartLinks(req: any, page?: number, limit?: number, campaignId?: string): Promise<{
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getSmartLinkAnalytics(req: any, id: string, days?: number): Promise<{
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
    redirectSmartLink(slug: string, req: Request, res: Response, query: any): Promise<void>;
}
//# sourceMappingURL=smart-links.controller.d.ts.map