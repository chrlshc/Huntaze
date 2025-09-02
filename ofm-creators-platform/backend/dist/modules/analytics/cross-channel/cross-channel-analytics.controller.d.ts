import { CrossChannelAnalyticsService } from './cross-channel-analytics.service';
export declare class CrossChannelAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: CrossChannelAnalyticsService);
    getOverview(req: any, range?: '7d' | '28d'): Promise<import("./cross-channel-analytics.service").OverviewMetrics>;
    getCampaigns(req: any, range?: '7d' | '28d'): Promise<import("./cross-channel-analytics.service").CampaignMetrics>;
    getSocial(req: any, range?: '7d' | '28d'): Promise<import("./cross-channel-analytics.service").SocialMetrics>;
    getCRM(req: any): Promise<import("./cross-channel-analytics.service").CRMSegments>;
}
//# sourceMappingURL=cross-channel-analytics.controller.d.ts.map