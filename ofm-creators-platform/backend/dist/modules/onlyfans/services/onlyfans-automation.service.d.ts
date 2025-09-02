import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
interface OnlyFansAutomationEvent {
    creatorId: string;
    fanId: string;
    platform: string;
    data: any;
}
export declare class OnlyFansAutomationService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    /**
     * Handle fan subscribed event
     */
    handleFanSubscribed(event: OnlyFansAutomationEvent): Promise<void>;
    /**
     * Handle subscription renewed event
     */
    handleSubscriptionRenewed(event: OnlyFansAutomationEvent): Promise<void>;
    /**
     * Handle purchase made event
     */
    handlePurchaseMade(event: OnlyFansAutomationEvent): Promise<void>;
    /**
     * Get active automations for a trigger
     */
    private getActiveAutomations;
    /**
     * Execute an automation
     */
    private executeAutomation;
    /**
     * Evaluate automation conditions
     */
    private evaluateConditions;
    /**
     * Execute a single action
     */
    private executeAction;
    /**
     * Tag a fan
     */
    private tagFan;
    /**
     * Send a message to a fan
     */
    private sendMessage;
    /**
     * Create an offer for a fan
     */
    private createOffer;
    /**
     * Update fan tier
     */
    private updateFanTier;
    /**
     * Call external webhook
     */
    private callWebhook;
    /**
     * Create default automations for OnlyFans
     */
    createDefaultAutomations(creatorId: string): Promise<void>;
}
export {};
//# sourceMappingURL=onlyfans-automation.service.d.ts.map