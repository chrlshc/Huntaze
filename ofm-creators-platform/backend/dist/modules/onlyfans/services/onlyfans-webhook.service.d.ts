import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface OnlyFansWebhookEvent {
    type: 'fan.subscribed' | 'fan.unsubscribed' | 'fan.renewed' | 'payment.tip' | 'payment.ppv' | 'message.sent' | 'content.liked';
    creatorHandle: string;
    timestamp: Date;
    data: any;
}
export declare class OnlyFansWebhookService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    /**
     * Process webhook event from OnlyFans (when available via API)
     */
    processWebhook(event: OnlyFansWebhookEvent): Promise<void>;
    private handleFanSubscribed;
    private handleFanRenewed;
    private handlePayment;
    private updateEngagementMetrics;
    private recalculateEngagementScore;
    /**
     * Scheduled job to sync OnlyFans data (when API is available)
     */
    syncOnlyFansData(): Promise<void>;
}
//# sourceMappingURL=onlyfans-webhook.service.d.ts.map