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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const stripe_service_1 = require("@infrastructure/payment/stripe.service");
const commission_service_1 = require("./commission.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
let SubscriptionService = class SubscriptionService {
    prisma;
    stripe;
    commission;
    eventEmitter;
    constructor(prisma, stripe, commission, eventEmitter) {
        this.prisma = prisma;
        this.stripe = stripe;
        this.commission = commission;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Crée un nouveau plan d'abonnement
     */
    async createSubscriptionPlan(creatorId, dto) {
        // Créer le prix dans Stripe
        const stripePrice = await this.stripe.prices.create({
            unit_amount: Math.round(dto.price * 100), // Stripe utilise les centimes
            currency: dto.currency.toLowerCase(),
            recurring: {
                interval: this.mapBillingInterval(dto.interval),
                interval_count: dto.intervalCount || 1
            },
            product_data: {
                name: dto.name,
                metadata: {
                    creatorId,
                    planType: 'subscription'
                }
            }
        });
        // Créer le plan dans la base de données
        const plan = await this.prisma.subscriptionPlan.create({
            data: {
                creatorId,
                name: dto.name,
                description: dto.description,
                price: dto.price,
                currency: dto.currency,
                interval: dto.interval,
                intervalCount: dto.intervalCount || 1,
                features: dto.features || [],
                maxDownloads: dto.maxDownloads,
                earlyAccess: dto.earlyAccess || false,
                exclusiveContent: dto.exclusiveContent || true,
                trialPeriodDays: dto.trialPeriodDays,
                stripePriceId: stripePrice.id,
                isActive: true
            }
        });
        // Émettre un événement
        this.eventEmitter.emit('subscription.plan.created', {
            creatorId,
            planId: plan.id,
            plan
        });
        return plan;
    }
    /**
     * Met à jour un plan d'abonnement
     */
    async updateSubscriptionPlan(planId, creatorId, dto) {
        const plan = await this.prisma.subscriptionPlan.findFirst({
            where: { id: planId, creatorId }
        });
        if (!plan) {
            throw new Error('Plan not found');
        }
        // Si le prix change, créer un nouveau prix Stripe
        let newStripePriceId = plan.stripePriceId;
        if (dto.price && dto.price !== plan.price.toNumber()) {
            const stripePrice = await this.stripe.prices.create({
                unit_amount: Math.round(dto.price * 100),
                currency: plan.currency.toLowerCase(),
                recurring: {
                    interval: this.mapBillingInterval(plan.interval),
                    interval_count: plan.intervalCount
                },
                product_data: {
                    name: dto.name || plan.name,
                    metadata: {
                        creatorId,
                        planType: 'subscription'
                    }
                }
            });
            newStripePriceId = stripePrice.id;
            // Archiver l'ancien prix
            if (plan.stripePriceId) {
                await this.stripe.prices.update(plan.stripePriceId, {
                    active: false
                });
            }
        }
        // Mettre à jour le plan
        const updatedPlan = await this.prisma.subscriptionPlan.update({
            where: { id: planId },
            data: {
                name: dto.name,
                description: dto.description,
                price: dto.price,
                stripePriceId: newStripePriceId,
                features: dto.features,
                maxDownloads: dto.maxDownloads,
                earlyAccess: dto.earlyAccess,
                exclusiveContent: dto.exclusiveContent,
                trialPeriodDays: dto.trialPeriodDays,
                isActive: dto.isActive
            }
        });
        this.eventEmitter.emit('subscription.plan.updated', {
            creatorId,
            planId: plan.id,
            plan: updatedPlan
        });
        return updatedPlan;
    }
    /**
     * Souscrit un fan à un plan
     */
    async subscribe(fanId, dto) {
        // Vérifier le plan
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id: dto.planId },
            include: { creator: true }
        });
        if (!plan || !plan.isActive) {
            throw new Error('Plan not available');
        }
        // Vérifier si déjà abonné
        const existingSubscription = await this.prisma.subscription.findFirst({
            where: {
                fanId,
                creatorId: plan.creatorId,
                status: { in: ['ACTIVE', 'TRIALING'] }
            }
        });
        if (existingSubscription) {
            throw new Error('Already subscribed to this creator');
        }
        // Obtenir ou créer le customer Stripe
        const fan = await this.prisma.fan.findUnique({
            where: { id: fanId }
        });
        if (!fan) {
            throw new Error('Fan not found');
        }
        let stripeCustomerId = fan.stripeCustomerId;
        if (!stripeCustomerId) {
            const stripeCustomer = await this.stripe.customers.create({
                email: fan.email,
                metadata: { fanId }
            });
            stripeCustomerId = stripeCustomer.id;
            await this.prisma.fan.update({
                where: { id: fanId },
                data: { stripeCustomerId }
            });
        }
        // Créer la souscription Stripe
        const stripeSubscription = await this.stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: plan.stripePriceId }],
            payment_method: dto.paymentMethodId,
            default_payment_method: dto.paymentMethodId,
            trial_period_days: plan.trialPeriodDays || undefined,
            metadata: {
                fanId,
                creatorId: plan.creatorId,
                planId: plan.id
            },
            application_fee_percent: this.getApplicationFeePercent(plan.creator),
            transfer_data: {
                destination: plan.creator.stripeAccountId
            }
        });
        // Créer la souscription dans la base
        const subscription = await this.prisma.subscription.create({
            data: {
                fanId,
                creatorId: plan.creatorId,
                planId: plan.id,
                status: this.mapStripeStatus(stripeSubscription.status),
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                stripeSubscriptionId: stripeSubscription.id
            }
        });
        // Émettre l'événement
        this.eventEmitter.emit('subscription.created', {
            subscription,
            fanId,
            creatorId: plan.creatorId,
            planId: plan.id
        });
        return subscription;
    }
    /**
     * Annule un abonnement
     */
    async cancelSubscription(subscriptionId, immediately = false) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });
        if (!subscription || !subscription.stripeSubscriptionId) {
            throw new Error('Subscription not found');
        }
        // Annuler dans Stripe
        const stripeSubscription = await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: !immediately
        });
        if (immediately) {
            await this.stripe.subscriptions.del(subscription.stripeSubscriptionId);
        }
        // Mettre à jour dans la base
        const updatedSubscription = await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                cancelAtPeriodEnd: !immediately,
                canceledAt: new Date(),
                status: immediately ? 'CANCELED' : subscription.status,
                endedAt: immediately ? new Date() : undefined
            }
        });
        this.eventEmitter.emit('subscription.canceled', {
            subscriptionId,
            immediately,
            subscription: updatedSubscription
        });
        return updatedSubscription;
    }
    /**
     * Réactive un abonnement annulé
     */
    async reactivateSubscription(subscriptionId) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });
        if (!subscription || !subscription.stripeSubscriptionId) {
            throw new Error('Subscription not found');
        }
        if (!subscription.cancelAtPeriodEnd) {
            throw new Error('Subscription is not scheduled for cancellation');
        }
        // Réactiver dans Stripe
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: false
        });
        // Mettre à jour dans la base
        const updatedSubscription = await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                cancelAtPeriodEnd: false,
                canceledAt: null
            }
        });
        this.eventEmitter.emit('subscription.reactivated', {
            subscriptionId,
            subscription: updatedSubscription
        });
        return updatedSubscription;
    }
    /**
     * Gère les webhooks Stripe pour les souscriptions
     */
    async handleStripeWebhook(event) {
        switch (event.type) {
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await this.syncSubscriptionFromStripe(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await this.handleSuccessfulPayment(event.data.object);
                break;
            case 'invoice.payment_failed':
                await this.handleFailedPayment(event.data.object);
                break;
        }
    }
    /**
     * Synchronise une souscription depuis Stripe
     */
    async syncSubscriptionFromStripe(stripeSubscription) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: stripeSubscription.id }
        });
        if (!subscription) {
            return;
        }
        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: this.mapStripeStatus(stripeSubscription.status),
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                canceledAt: stripeSubscription.canceled_at
                    ? new Date(stripeSubscription.canceled_at * 1000)
                    : null,
                endedAt: stripeSubscription.ended_at
                    ? new Date(stripeSubscription.ended_at * 1000)
                    : null
            }
        });
    }
    /**
     * Gère un paiement réussi
     */
    async handleSuccessfulPayment(invoice) {
        if (!invoice.subscription || typeof invoice.subscription !== 'string') {
            return;
        }
        const subscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription },
            include: { plan: true, creator: true }
        });
        if (!subscription) {
            return;
        }
        // Calculer la commission
        const amount = new Decimal(invoice.amount_paid / 100);
        const monthlyCommission = await this.getMonthlyCommissionToDate(subscription.creatorId);
        const commissionResult = this.commission.calculateCommission(amount, subscription.creator.commissionTier, monthlyCommission);
        // Créer la transaction
        await this.prisma.transaction.create({
            data: {
                creatorId: subscription.creatorId,
                fanId: subscription.fanId,
                type: 'SUBSCRIPTION',
                amount,
                currency: invoice.currency.toUpperCase(),
                platformFee: commissionResult.platformFee,
                platformFeeRate: commissionResult.platformFeeRate,
                netAmount: commissionResult.netAmount,
                status: 'COMPLETED',
                metadata: {
                    subscriptionId: subscription.id,
                    invoiceId: invoice.id,
                    capReached: commissionResult.capReached
                }
            }
        });
        // Mettre à jour les métriques de l'abonnement
        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                totalSpent: { increment: amount },
                renewalCount: { increment: 1 }
            }
        });
        // Mettre à jour le revenu total du créateur
        await this.prisma.creator.update({
            where: { id: subscription.creatorId },
            data: {
                totalRevenue: { increment: amount },
                availableBalance: { increment: commissionResult.netAmount }
            }
        });
        // Vérifier si le tier doit être mis à jour
        const creator = await this.prisma.creator.findUnique({
            where: { id: subscription.creatorId }
        });
        if (creator) {
            const tierUpdate = this.commission.shouldUpdateTier(creator.commissionTier, creator.totalRevenue);
            if (tierUpdate.shouldUpdate && tierUpdate.newTier) {
                await this.prisma.creator.update({
                    where: { id: subscription.creatorId },
                    data: { commissionTier: tierUpdate.newTier }
                });
                this.eventEmitter.emit('creator.tier.updated', {
                    creatorId: subscription.creatorId,
                    oldTier: creator.commissionTier,
                    newTier: tierUpdate.newTier
                });
            }
        }
    }
    /**
     * Gère un paiement échoué
     */
    async handleFailedPayment(invoice) {
        if (!invoice.subscription || typeof invoice.subscription !== 'string') {
            return;
        }
        const subscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription }
        });
        if (!subscription) {
            return;
        }
        // Mettre à jour le statut
        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' }
        });
        this.eventEmitter.emit('subscription.payment.failed', {
            subscriptionId: subscription.id,
            invoiceId: invoice.id
        });
    }
    /**
     * Obtient le total des commissions du mois en cours
     */
    async getMonthlyCommissionToDate(creatorId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const result = await this.prisma.transaction.aggregate({
            where: {
                creatorId,
                createdAt: { gte: startOfMonth },
                status: 'COMPLETED'
            },
            _sum: {
                platformFee: true
            }
        });
        return result._sum.platformFee || new Decimal(0);
    }
    /**
     * Convertit le statut Stripe en statut interne
     */
    mapStripeStatus(stripeStatus) {
        const statusMap = {
            'active': client_1.SubscriptionStatus.ACTIVE,
            'past_due': client_1.SubscriptionStatus.PAST_DUE,
            'canceled': client_1.SubscriptionStatus.CANCELED,
            'incomplete': client_1.SubscriptionStatus.INCOMPLETE,
            'incomplete_expired': client_1.SubscriptionStatus.CANCELED,
            'trialing': client_1.SubscriptionStatus.TRIALING,
            'unpaid': client_1.SubscriptionStatus.PAST_DUE,
            'paused': client_1.SubscriptionStatus.PAUSED
        };
        return statusMap[stripeStatus] || client_1.SubscriptionStatus.CANCELED;
    }
    /**
     * Convertit l'intervalle de facturation pour Stripe
     */
    mapBillingInterval(interval) {
        const intervalMap = {
            DAY: 'day',
            WEEK: 'week',
            MONTH: 'month',
            YEAR: 'year'
        };
        return intervalMap[interval];
    }
    /**
     * Calcule le pourcentage de frais d'application basé sur le tier
     */
    getApplicationFeePercent(creator) {
        const tierInfo = this.commission.getTierInfo(creator.commissionTier);
        return tierInfo ? tierInfo.rate * 100 : 20; // Par défaut 20%
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof stripe_service_1.StripeService !== "undefined" && stripe_service_1.StripeService) === "function" ? _b : Object, commission_service_1.CommissionService,
        event_emitter_1.EventEmitter2])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map