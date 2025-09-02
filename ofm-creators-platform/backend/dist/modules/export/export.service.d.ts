import { CrossChannelAnalyticsService } from '../analytics/cross-channel/cross-channel-analytics.service';
export type ExportFormat = 'csv' | 'json' | 'pdf';
export type ExportView = 'overview' | 'campaigns' | 'social' | 'crm';
export declare class ExportService {
    private analyticsService;
    private readonly logger;
    constructor(analyticsService: CrossChannelAnalyticsService);
    exportData(creatorId: string, view: ExportView, format: ExportFormat, range?: '7d' | '28d'): Promise<Buffer>;
    private fetchDataForView;
    private exportToCSV;
    private exportToJSON;
    private exportToPDF;
    private addOverviewToPDF;
    private addCampaignsToPDF;
    private addSocialToPDF;
    private addCRMToPDF;
    private getViewTitle;
    private calculateChange;
}
//# sourceMappingURL=export.service.d.ts.map