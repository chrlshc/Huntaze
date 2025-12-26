import { PrismaService } from '@infrastructure/database/prisma.service';
import { StripeService } from '@infrastructure/payment/stripe.service';
import { CommissionService } from './commission.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionPlan, Subscription } from '@prisma/client';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plan.dto';
import { SubscribeDto } from '../dto/subscription.dto';
import Stripe from 'stripe';
export declare class SubscriptionService {
    private readonly prisma;
    private readonly stripe;
    private readonly commission;
    private readonly eventEmitter;
    constructor(prisma: PrismaService, stripe: StripeService, commission: CommissionService, eventEmitter: EventEmitter2);
    /**
     * Crée un nouveau plan d'abonnement
     */
    createSubscriptionPlan(creatorId: string, dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan>;
    /**
     * Met à jour un plan d'abonnement
     */
    updateSubscriptionPlan(planId: string, creatorId: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan>;
    /**
     * Souscrit un fan à un plan
     */
    subscribe(fanId: string, dto: SubscribeDto): Promise<Subscription>;
    /**
     * Annule un abonnement
     */
    cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<Subscription>;
    /**
     * Réactive un abonnement annulé
     */
    reactivateSubscription(subscriptionId: string): Promise<Subscription>;
    /**
     * Gère les webhooks Stripe pour les souscriptions
     */
    handleStripeWebhook(event: Stripe.Event): Promise<void>;
    /**
     * Synchronise une souscription depuis Stripe
     */
    private syncSubscriptionFromStripe;
    /**
     * Gère un paiement réussi
     */
    private handleSuccessfulPayment;
    /**
     * Gère un paiement échoué
     */
    private handleFailedPayment;
    /**
     * Obtient le total des commissions du mois en cours
     */
    private getMonthlyCommissionToDate;
    /**
     * Convertit le statut Stripe en statut interne
     */
    private mapStripeStatus;
    /**
     * Convertit l'intervalle de facturation pour Stripe
     */
    private mapBillingInterval;
    /**
     * Calcule le pourcentage de frais d'application basé sur le tier
     */
    private getApplicationFeePercent;
}
//# sourceMappingURL=subscription.service.d.ts.map