import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export interface ESPWebhookPayload {
    event: 'sent' | 'open' | 'click' | 'bounce' | 'unsubscribe' | 'complaint';
    campaignId: string;
    recipientEmail: string;
    timestamp: string;
    metadata?: Record<string, any>;
    url?: string;
}
export interface SMSWebhookPayload {
    event: 'sent' | 'delivered' | 'failed' | 'clicked';
    campaignId: string;
    recipientPhone: string;
    timestamp: string;
    metadata?: Record<string, any>;
    shortUrl?: string;
}
export declare class WebhooksService {
    private prisma;
    private configService;
    private readonly logger;
    private readonly webhookSecrets;
    constructor(prisma: PrismaService, configService: ConfigService);
    handleESPWebhook(provider: string, payload: ESPWebhookPayload | ESPWebhookPayload[], signature?: string): Promise<{
        processed: number;
        status: string;
    }>;
    handleSMSWebhook(provider: string, payload: SMSWebhookPayload | SMSWebhookPayload[], signature?: string): Promise<{
        processed: number;
        status: string;
    }>;
    private processESPEvent;
    private processSMSEvent;
    private recordSmartLinkClick;
    private verifyWebhookSignature;
    getWebhookStats(creatorId: string, days?: number): Promise<{
        period: string;
        stats: Record<string, Record<string, number>>;
        total: any;
    }>;
}
//# sourceMappingURL=webhooks.service.d.ts.map