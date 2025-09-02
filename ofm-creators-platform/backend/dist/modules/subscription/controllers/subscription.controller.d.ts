import { SubscriptionService } from '../services/subscription.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto, SubscriptionPlanResponseDto, SubscriptionPlanAnalyticsDto } from '../dto/subscription-plan.dto';
import { SubscribeDto, UpdateSubscriptionDto, CancelSubscriptionDto, SubscriptionResponseDto, SubscriptionFilterDto, SubscriptionListDto, SubscriptionMetricsDto } from '../dto/subscription.dto';
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    createPlan(req: any, dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto>;
    updatePlan(req: any, planId: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto>;
    getCreatorPlans(creatorId: string): Promise<SubscriptionPlanResponseDto[]>;
    getPlanAnalytics(req: any, planId: string): Promise<SubscriptionPlanAnalyticsDto>;
    deactivatePlan(req: any, planId: string): Promise<void>;
    subscribe(req: any, dto: SubscribeDto): Promise<SubscriptionResponseDto>;
    updateSubscription(req: any, subscriptionId: string, dto: UpdateSubscriptionDto): Promise<SubscriptionResponseDto>;
    cancelSubscription(req: any, subscriptionId: string, dto: CancelSubscriptionDto): Promise<SubscriptionResponseDto>;
    reactivateSubscription(req: any, subscriptionId: string): Promise<SubscriptionResponseDto>;
    getFanSubscriptions(req: any, filter: SubscriptionFilterDto): Promise<SubscriptionListDto>;
    getCreatorSubscribers(req: any, filter: SubscriptionFilterDto): Promise<SubscriptionListDto>;
    getMetrics(req: any, startDate?: string, endDate?: string): Promise<SubscriptionMetricsDto>;
    getSubscription(req: any, subscriptionId: string): Promise<SubscriptionResponseDto>;
    handleStripeWebhook(body: any, req: any): Promise<{
        received: boolean;
    }>;
    private mapToSubscriptionPlanResponse;
    private mapToSubscriptionResponse;
}
//# sourceMappingURL=subscription.controller.d.ts.map