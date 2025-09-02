import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { StripeService } from '@infrastructure/stripe/stripe.service';
import { EmailService } from '@infrastructure/email/email.service';
import { SmsService } from '@infrastructure/sms/sms.service';
import { LedgerService } from './ledger.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';
export declare class DunningService {
    private readonly prisma;
    private readonly stripe;
    private readonly email;
    private readonly sms;
    private readonly ledger;
    private readonly cache;
    private readonly events;
    private readonly dunningSchedule;
    constructor(prisma: PrismaService, stripe: StripeService, email: EmailService, sms: SmsService, ledger: LedgerService, cache: CacheService, events: EventEmitter2);
    /**
     * Handle failed invoice payment
     */
    handleFailedInvoice(invoice: Stripe.Invoice): Promise<void>;
    /**
     * Execute a dunning attempt
     */
    private executeDunningAttempt;
    /**
     * Send dunning notifications
     */
    private sendDunningNotifications;
    /**
     * Retry payment with smart retry logic
     */
    private retryPayment;
    /**
     * Execute dunning actions
     */
    private executeDunningAction;
    /**
     * Downgrade creator to Starter plan
     */
    private downgradeCreatorPlan;
    /**
     * Suspend creator features
     */
    private suspendCreatorFeatures;
    /**
     * Write off invoice as bad debt
     */
    private writeOffInvoice;
    /**
     * Handle recovered payment
     */
    private handleRecoveredPayment;
    /**
     * Daily job to process scheduled dunning attempts
     */
    processDunningQueue(): Promise<void>;
    private getDunningState;
    private updateDunningState;
    private getCreatorFromInvoice;
    private findAlternativePaymentMethod;
    private send3DSNotification;
    private calculateDaysUntilSuspension;
    private generateShortLink;
    private disablePremiumFeatures;
    private pauseAllAutomations;
    private reactivateAutomations;
}
//# sourceMappingURL=dunning.service.d.ts.map