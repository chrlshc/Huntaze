"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DunningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const stripe_service_1 = require("@infrastructure/stripe/stripe.service");
const email_service_1 = require("@infrastructure/email/email.service");
const sms_service_1 = require("@infrastructure/sms/sms.service");
const ledger_service_1 = require("./ledger.service");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const date_fns_1 = require("date-fns");
let DunningService = class DunningService {
    prisma;
    stripe;
    email;
    sms;
    ledger;
    cache;
    events;
    dunningSchedule = [
        { attemptNumber: 1, delayHours: 0, emailTemplate: 'payment_failed_immediate' },
        { attemptNumber: 2, delayHours: 6, emailTemplate: 'payment_failed_reminder' },
        { attemptNumber: 3, delayHours: 24, emailTemplate: 'payment_failed_urgent' },
        { attemptNumber: 4, delayHours: 72, emailTemplate: 'payment_failed_final', smsTemplate: 'payment_failed_sms' },
        { attemptNumber: 5, delayHours: 168, emailTemplate: 'payment_failed_downgrade', action: 'downgrade' },
        { attemptNumber: 6, delayHours: 336, emailTemplate: 'payment_failed_collection', action: 'suspend' },
        { attemptNumber: 7, delayHours: 720, emailTemplate: 'payment_failed_write_off', action: 'write_off' }
    ];
    constructor(prisma, stripe, email, sms, ledger, cache, events) {
        this.prisma = prisma;
        this.stripe = stripe;
        this.email = email;
        this.sms = sms;
        this.ledger = ledger;
        this.cache = cache;
        this.events = events;
    }
    /**
     * Handle failed invoice payment
     */
    async handleFailedInvoice(invoice) {
        const dunningKey = `dunning:invoice:${invoice.id}`;
        // Get or create dunning state
        const state = await this.getDunningState(invoice.id);
        // Find next attempt
        const nextSchedule = this.dunningSchedule.find(s => s.attemptNumber === state.attemptCount + 1);
        if (!nextSchedule) {
            console.error(`No more dunning attempts for invoice ${invoice.id}`);
            return;
        }
        // Execute dunning attempt
        const result = await this.executeDunningAttempt(invoice, nextSchedule, state);
        // Update state
        await this.updateDunningState(invoice.id, {
            attemptCount: state.attemptCount + 1,
            lastAttempt: new Date(),
            nextAttempt: result.nextAttempt,
            status: result.success ? 'recovered' : 'active'
        });
        // Emit event
        this.events.emit('dunning.attempt', {
            invoiceId: invoice.id,
            attemptNumber: nextSchedule.attemptNumber,
            result
        });
    }
    /**
     * Execute a dunning attempt
     */
    async executeDunningAttempt(invoice, schedule, state) {
        try {
            // Get creator info
            const creator = await this.getCreatorFromInvoice(invoice);
            if (!creator) {
                throw new Error('Creator not found');
            }
            // Send notifications
            await this.sendDunningNotifications(creator, invoice, schedule);
            // Execute action if defined
            if (schedule.action) {
                await this.executeDunningAction(creator, invoice, schedule.action);
            }
            // Retry payment (except for write-off)
            if (schedule.action !== 'write_off') {
                const paymentResult = await this.retryPayment(invoice);
                if (paymentResult.success) {
                    // Payment succeeded!
                    await this.handleRecoveredPayment(invoice, state);
                    return { success: true };
                }
            }
            // Schedule next attempt
            const nextSchedule = this.dunningSchedule.find(s => s.attemptNumber === schedule.attemptNumber + 1);
            return {
                success: false,
                nextAttempt: nextSchedule
                    ? (0, date_fns_1.addHours)(new Date(), nextSchedule.delayHours - schedule.delayHours)
                    : undefined,
                action: schedule.action
            };
        }
        catch (error) {
            console.error(`Dunning attempt failed for invoice ${invoice.id}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Send dunning notifications
     */
    async sendDunningNotifications(creator, invoice, schedule) {
        const amount = (invoice.amount_due / 100).toFixed(2);
        const currency = invoice.currency.toUpperCase();
        // Email notification
        await this.email.send({
            to: creator.email,
            template: schedule.emailTemplate,
            data: {
                firstName: creator.displayName || 'Creator',
                amount,
                currency,
                invoiceId: invoice.id,
                updatePaymentUrl: `${process.env.APP_URL}/billing/update-payment?invoice=${invoice.id}`,
                daysUntilSuspension: this.calculateDaysUntilSuspension(schedule.attemptNumber)
            }
        });
        // SMS notification (if enabled and phone available)
        if (schedule.smsTemplate && creator.phoneNumber && creator.smsOptIn) {
            await this.sms.send({
                to: creator.phoneNumber,
                template: schedule.smsTemplate,
                data: {
                    amount,
                    currency,
                    updateUrl: `${process.env.APP_URL}/p/${this.generateShortLink(invoice.id)}`
                }
            });
        }
    }
    /**
     * Retry payment with smart retry logic
     */
    async retryPayment(invoice) {
        try {
            // Check if we should use a different payment method
            const alternativePaymentMethod = await this.findAlternativePaymentMethod(invoice.customer);
            if (alternativePaymentMethod) {
                // Update invoice with alternative payment method
                await this.stripe.invoices.update(invoice.id, {
                    default_payment_method: alternativePaymentMethod.id
                });
            }
            // Retry payment
            const paid = await this.stripe.invoices.pay(invoice.id, {
                forgive: false,
                off_session: true
            });
            return { success: paid.status === 'paid' };
        }
        catch (error) {
            // Handle specific error types
            if (error.type === 'StripeCardError') {
                return { success: false, error: error.code };
            }
            // For 3DS required, send customer to hosted invoice page
            if (error.code === 'payment_intent_authentication_failure') {
                await this.send3DSNotification(invoice);
            }
            return { success: false, error: error.message };
        }
    }
    /**
     * Execute dunning actions
     */
    async executeDunningAction(creator, invoice, action) {
        switch (action) {
            case 'downgrade':
                await this.downgradeCreatorPlan(creator);
                break;
            case 'suspend':
                await this.suspendCreatorFeatures(creator);
                break;
            case 'write_off':
                await this.writeOffInvoice(creator, invoice);
                break;
        }
    }
    /**
     * Downgrade creator to Starter plan
     */
    async downgradeCreatorPlan(creator) {
        await this.prisma.creator.update({
            where: { id: creator.id },
            data: {
                currentPlan: 'STARTER',
                planDowngradedAt: new Date(),
                planDowngradeReason: 'payment_failure'
            }
        });
        // Disable premium features
        await this.disablePremiumFeatures(creator.id);
        this.events.emit('creator.downgraded', {
            creatorId: creator.id,
            reason: 'payment_failure'
        });
    }
    /**
     * Suspend creator features
     */
    async suspendCreatorFeatures(creator) {
        await this.prisma.creator.update({
            where: { id: creator.id },
            data: {
                accountStatus: 'SUSPENDED',
                suspendedAt: new Date(),
                suspensionReason: 'payment_failure'
            }
        });
        // Pause all automations
        await this.pauseAllAutomations(creator.id);
        this.events.emit('creator.suspended', {
            creatorId: creator.id,
            reason: 'payment_failure'
        });
    }
    /**
     * Write off invoice as bad debt
     */
    async writeOffInvoice(creator, invoice) {
        const amountCents = BigInt(invoice.amount_due);
        // Create write-off entry in ledger
        await this.ledger.createTransaction({
            tenantId: 'default',
            kind: 'AR_WRITE_OFF',
            currency: invoice.currency.toUpperCase(),
            occurredAt: new Date(),
            memo: `Write-off invoice ${invoice.id}`,
            extRef: invoice.id,
            entries: [
                {
                    accountType: 'ALLOWANCE_DOUBTFUL',
                    direction: 'DEBIT',
                    amountCents
                },
                {
                    accountType: 'AR_COMMISSION',
                    direction: 'CREDIT',
                    amountCents,
                    ownerId: creator.id
                }
            ]
        });
        // Mark invoice as uncollectible in Stripe
        await this.stripe.invoices.markUncollectible(invoice.id);
        this.events.emit('invoice.written_off', {
            creatorId: creator.id,
            invoiceId: invoice.id,
            amount: amountCents
        });
    }
    /**
     * Handle recovered payment
     */
    async handleRecoveredPayment(invoice, dunningState) {
        const creator = await this.getCreatorFromInvoice(invoice);
        // Restore account if suspended
        if (creator.accountStatus === 'SUSPENDED') {
            await this.prisma.creator.update({
                where: { id: creator.id },
                data: {
                    accountStatus: 'ACTIVE',
                    suspendedAt: null,
                    suspensionReason: null
                }
            });
            // Reactivate automations
            await this.reactivateAutomations(creator.id);
        }
        // Send recovery confirmation
        await this.email.send({
            to: creator.email,
            template: 'payment_recovered',
            data: {
                firstName: creator.displayName || 'Creator',
                amount: (invoice.amount_due / 100).toFixed(2),
                currency: invoice.currency.toUpperCase()
            }
        });
        this.events.emit('payment.recovered', {
            creatorId: creator.id,
            invoiceId: invoice.id,
            attemptCount: dunningState.attemptCount
        });
    }
    /**
     * Daily job to process scheduled dunning attempts
     */
    async processDunningQueue() {
        const pendingAttempts = await this.prisma.dunningState.findMany({
            where: {
                status: 'active',
                nextAttempt: {
                    lte: new Date()
                }
            }
        });
        for (const state of pendingAttempts) {
            try {
                const invoice = await this.stripe.invoices.retrieve(state.invoiceId);
                if (invoice.status === 'open') {
                    await this.handleFailedInvoice(invoice);
                }
            }
            catch (error) {
                console.error(`Failed to process dunning for ${state.invoiceId}:`, error);
            }
        }
    }
    // Helper methods
    async getDunningState(invoiceId) {
        let state = await this.prisma.dunningState.findUnique({
            where: { invoiceId }
        });
        if (!state) {
            state = await this.prisma.dunningState.create({
                data: {
                    invoiceId,
                    attemptCount: 0,
                    status: 'active',
                    createdAt: new Date()
                }
            });
        }
        return state;
    }
    async updateDunningState(invoiceId, data) {
        await this.prisma.dunningState.update({
            where: { invoiceId },
            data
        });
    }
    async getCreatorFromInvoice(invoice) {
        const customerId = invoice.customer;
        return this.prisma.creator.findFirst({
            where: { stripeCustomerId: customerId }
        });
    }
    async findAlternativePaymentMethod(customerId) {
        const paymentMethods = await this.stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });
        // Find a different card that hasn't failed recently
        return paymentMethods.data.find(pm => {
            const failureKey = `payment_failure:${pm.id}`;
            return !this.cache.get(failureKey);
        });
    }
    async send3DSNotification(invoice) {
        const creator = await this.getCreatorFromInvoice(invoice);
        await this.email.send({
            to: creator.email,
            template: 'payment_3ds_required',
            data: {
                firstName: creator.displayName || 'Creator',
                amount: (invoice.amount_due / 100).toFixed(2),
                currency: invoice.currency.toUpperCase(),
                hostedInvoiceUrl: invoice.hosted_invoice_url
            }
        });
    }
    calculateDaysUntilSuspension(attemptNumber) {
        const suspensionAttempt = this.dunningSchedule.find(s => s.action === 'suspend');
        const currentAttempt = this.dunningSchedule.find(s => s.attemptNumber === attemptNumber);
        if (!suspensionAttempt || !currentAttempt)
            return 0;
        const hoursUntilSuspension = suspensionAttempt.delayHours - currentAttempt.delayHours;
        return Math.ceil(hoursUntilSuspension / 24);
    }
    generateShortLink(invoiceId) {
        // Simple hash for short link
        return Buffer.from(invoiceId).toString('base64').substring(0, 8);
    }
    async disablePremiumFeatures(creatorId) {
        // Disable features based on downgrade
        // This would interact with your feature flag system
    }
    async pauseAllAutomations(creatorId) {
        await this.prisma.automation.updateMany({
            where: { creatorId },
            data: { status: 'PAUSED' }
        });
    }
    async reactivateAutomations(creatorId) {
        await this.prisma.automation.updateMany({
            where: {
                creatorId,
                status: 'PAUSED'
            },
            data: { status: 'ACTIVE' }
        });
    }
};
exports.DunningService = DunningService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DunningService.prototype, "processDunningQueue", null);
exports.DunningService = DunningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof stripe_service_1.StripeService !== "undefined" && stripe_service_1.StripeService) === "function" ? _a : Object, typeof (_b = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _b : Object, typeof (_c = typeof sms_service_1.SmsService !== "undefined" && sms_service_1.SmsService) === "function" ? _c : Object, ledger_service_1.LedgerService, typeof (_d = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _d : Object, event_emitter_1.EventEmitter2])
], DunningService);
//# sourceMappingURL=dunning.service.js.map