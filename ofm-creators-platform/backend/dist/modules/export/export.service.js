"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const json2csv_1 = require("json2csv");
const PDFDocument = __importStar(require("pdfkit"));
const cross_channel_analytics_service_1 = require("../analytics/cross-channel/cross-channel-analytics.service");
let ExportService = ExportService_1 = class ExportService {
    analyticsService;
    logger = new common_1.Logger(ExportService_1.name);
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async exportData(creatorId, view, format, range = '7d') {
        // Fetch data based on view
        const data = await this.fetchDataForView(creatorId, view, range);
        // Export in requested format
        switch (format) {
            case 'csv':
                return this.exportToCSV(data, view);
            case 'json':
                return this.exportToJSON(data, view);
            case 'pdf':
                return this.exportToPDF(data, view, range);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    async fetchDataForView(creatorId, view, range) {
        switch (view) {
            case 'overview':
                return this.analyticsService.getOverviewMetrics(creatorId, range);
            case 'campaigns':
                return this.analyticsService.getCampaignMetrics(creatorId, range);
            case 'social':
                return this.analyticsService.getSocialMetrics(creatorId, range);
            case 'crm':
                return this.analyticsService.getCRMSegments(creatorId);
            default:
                throw new Error(`Unknown view: ${view}`);
        }
    }
    exportToCSV(data, view) {
        let csvData;
        switch (view) {
            case 'overview': {
                const rows = [{
                        metric: 'GMV',
                        value: data.gmv,
                        previous: data.comparison?.gmv,
                        change: this.calculateChange(data.gmv, data.comparison?.gmv),
                    }, {
                        metric: 'Net Revenue',
                        value: data.netRevenue,
                        previous: data.comparison?.netRevenue,
                        change: this.calculateChange(data.netRevenue, data.comparison?.netRevenue),
                    }, {
                        metric: 'Active Fans',
                        value: data.activeFans,
                        previous: data.comparison?.activeFans,
                        change: this.calculateChange(data.activeFans, data.comparison?.activeFans),
                    }, {
                        metric: 'Engagement',
                        value: data.engagement,
                        previous: data.comparison?.engagement,
                        change: this.calculateChange(data.engagement, data.comparison?.engagement),
                    }];
                csvData = (0, json2csv_1.parse)(rows, {
                    fields: ['metric', 'value', 'previous', 'change'],
                });
                break;
            }
            case 'campaigns': {
                csvData = (0, json2csv_1.parse)(data.campaigns, {
                    fields: ['id', 'channel', 'sent', 'openRate', 'clickRate', 'convRate', 'revenue', 'cost', 'roas'],
                });
                break;
            }
            case 'social': {
                csvData = (0, json2csv_1.parse)(data.platforms, {
                    fields: ['platform', 'followers', 'impressions', 'linkClicks', 'revenue'],
                });
                break;
            }
            case 'crm': {
                csvData = (0, json2csv_1.parse)(data.segments, {
                    fields: ['label', 'fans', 'arpu', 'propension'],
                });
                break;
            }
            default:
                throw new Error(`CSV export not implemented for view: ${view}`);
        }
        return Buffer.from(csvData, 'utf8');
    }
    exportToJSON(data, view) {
        const exportData = {
            view,
            exportedAt: new Date().toISOString(),
            data,
        };
        return Buffer.from(JSON.stringify(exportData, null, 2), 'utf8');
    }
    async exportToPDF(data, view, range) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Header
            doc.fontSize(20)
                .fillColor('#7C3AED')
                .text('Huntaze Analytics Report', { align: 'center' });
            doc.fontSize(12)
                .fillColor('#666')
                .text(`${this.getViewTitle(view)} - ${range === '7d' ? 'Last 7 Days' : 'Last 28 Days'}`, { align: 'center' });
            doc.moveDown(2);
            // Content based on view
            switch (view) {
                case 'overview':
                    this.addOverviewToPDF(doc, data);
                    break;
                case 'campaigns':
                    this.addCampaignsToPDF(doc, data);
                    break;
                case 'social':
                    this.addSocialToPDF(doc, data);
                    break;
                case 'crm':
                    this.addCRMToPDF(doc, data);
                    break;
            }
            // Footer
            doc.fontSize(10)
                .fillColor('#999')
                .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, doc.page.height - 50, {
                align: 'center',
            });
            doc.end();
        });
    }
    addOverviewToPDF(doc, data) {
        doc.fontSize(14).fillColor('#333').text('Key Metrics', { underline: true });
        doc.moveDown();
        const metrics = [
            { name: 'Gross Merchandise Value (GMV)', value: `$${data.gmv.toLocaleString()}`, change: this.calculateChange(data.gmv, data.comparison?.gmv) },
            { name: 'Net Revenue', value: `$${data.netRevenue.toLocaleString()}`, change: this.calculateChange(data.netRevenue, data.comparison?.netRevenue) },
            { name: 'Active Fans', value: data.activeFans.toLocaleString(), change: this.calculateChange(data.activeFans, data.comparison?.activeFans) },
            { name: 'Engagement Rate', value: `${(data.engagement * 100).toFixed(1)}%`, change: this.calculateChange(data.engagement, data.comparison?.engagement) },
        ];
        doc.fontSize(12).fillColor('#000');
        metrics.forEach(metric => {
            doc.text(`${metric.name}: ${metric.value}`, { continued: true });
            if (metric.change !== null) {
                const color = metric.change >= 0 ? '#10B981' : '#EF4444';
                doc.fillColor(color).text(` (${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%)`);
            }
            else {
                doc.text('');
            }
            doc.fillColor('#000');
        });
    }
    addCampaignsToPDF(doc, data) {
        doc.fontSize(14).fillColor('#333').text('Campaign Performance', { underline: true });
        doc.moveDown();
        // Summary
        doc.fontSize(12).fillColor('#000');
        doc.text(`Total Campaigns: ${data.campaigns.length}`);
        doc.text(`Total Sent: ${data.totals.sent.toLocaleString()}`);
        doc.text(`Total Revenue: $${data.totals.revenue.toLocaleString()}`);
        doc.text(`Average ROAS: ${data.totals.avgRoas.toFixed(2)}x`);
        doc.moveDown();
        // Top campaigns
        doc.fontSize(12).fillColor('#333').text('Top Campaigns by Revenue:', { underline: true });
        doc.fontSize(11).fillColor('#000');
        data.campaigns
            .slice(0, 5)
            .forEach((campaign) => {
            doc.text(`${campaign.channel} - ${campaign.id.substring(0, 8)}: $${campaign.revenue.toFixed(2)} (${campaign.sent} sent, ${(campaign.convRate * 100).toFixed(1)}% conv)`);
        });
    }
    addSocialToPDF(doc, data) {
        doc.fontSize(14).fillColor('#333').text('Social Media Performance', { underline: true });
        doc.moveDown();
        doc.fontSize(12).fillColor('#000');
        data.platforms.forEach((platform) => {
            doc.text(`${platform.platform}:`, { underline: true });
            doc.text(`  Followers: ${platform.followers.toLocaleString()}`);
            doc.text(`  Impressions: ${platform.impressions.toLocaleString()}`);
            doc.text(`  Link Clicks: ${platform.linkClicks.toLocaleString()}`);
            doc.text(`  Attributed Revenue: $${platform.revenue.toFixed(2)}`);
            doc.moveDown(0.5);
        });
    }
    addCRMToPDF(doc, data) {
        doc.fontSize(14).fillColor('#333').text('Fan Segmentation', { underline: true });
        doc.moveDown();
        doc.fontSize(12).fillColor('#000');
        doc.text(`Total Fans: ${data.totalFans.toLocaleString()}`);
        doc.text(`Total Revenue: $${data.totalRevenue.toFixed(2)}`);
        doc.moveDown();
        doc.fontSize(12).fillColor('#333').text('Segments:', { underline: true });
        doc.fontSize(11).fillColor('#000');
        data.segments.forEach((segment) => {
            doc.text(`${segment.label}: ${segment.fans} fans, $${segment.arpu.toFixed(2)} ARPU, ${(segment.propension * 100).toFixed(0)}% purchase propensity`);
        });
    }
    getViewTitle(view) {
        const titles = {
            overview: 'Overview Metrics',
            campaigns: 'Campaign Analytics',
            social: 'Social Media Analytics',
            crm: 'CRM Segmentation',
        };
        return titles[view] || view;
    }
    calculateChange(current, previous) {
        if (!previous || previous === 0)
            return null;
        return ((current - previous) / previous) * 100;
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cross_channel_analytics_service_1.CrossChannelAnalyticsService])
], ExportService);
//# sourceMappingURL=export.service.js.map