import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleESPWebhook(provider: string, signature: string, payload: any): Promise<{
        processed: number;
        status: string;
    }>;
    handleSMSWebhook(provider: string, signature: string, payload: any): Promise<{
        processed: number;
        status: string;
    }>;
    handleSendGrid(signature: string, payload: any): Promise<{
        processed: number;
        status: string;
    }>;
    handleMailgun(signature: string, payload: any): Promise<{
        processed: number;
        status: string;
    }>;
    handleTwilio(signature: string, payload: any): Promise<{
        processed: number;
        status: string;
    }>;
}
//# sourceMappingURL=webhooks.controller.d.ts.map