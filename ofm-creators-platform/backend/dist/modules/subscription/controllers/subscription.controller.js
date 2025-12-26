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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const subscription_service_1 = require("../services/subscription.service");
const jwt_auth_guard_1 = require("@core/auth/guards/jwt-auth.guard");
const creator_guard_1 = require("@core/auth/guards/creator.guard");
const fan_guard_1 = require("@core/auth/guards/fan.guard");
const subscription_plan_dto_1 = require("../dto/subscription-plan.dto");
const subscription_dto_1 = require("../dto/subscription.dto");
let SubscriptionController = class SubscriptionController {
    subscriptionService;
    constructor(subscriptionService) {
        this.subscriptionService = subscriptionService;
    }
    // Creator endpoints
    async createPlan(req, dto) {
        const plan = await this.subscriptionService.createSubscriptionPlan(req.user.creatorId, dto);
        return this.mapToSubscriptionPlanResponse(plan);
    }
    async updatePlan(req, planId, dto) {
        const plan = await this.subscriptionService.updateSubscriptionPlan(planId, req.user.creatorId, dto);
        return this.mapToSubscriptionPlanResponse(plan);
    }
    async getCreatorPlans(creatorId) {
        const plans = await this.subscriptionService.getCreatorPlans(creatorId);
        return plans.map(plan => this.mapToSubscriptionPlanResponse(plan));
    }
    async getPlanAnalytics(req, planId) {
        return this.subscriptionService.getPlanAnalytics(planId, req.user.creatorId);
    }
    async deactivatePlan(req, planId) {
        await this.subscriptionService.deactivatePlan(planId, req.user.creatorId);
    }
    // Fan endpoints
    async subscribe(req, dto) {
        const subscription = await this.subscriptionService.subscribe(req.user.fanId, dto);
        return this.mapToSubscriptionResponse(subscription);
    }
    async updateSubscription(req, subscriptionId, dto) {
        const subscription = await this.subscriptionService.updateSubscription(subscriptionId, req.user.fanId, dto);
        return this.mapToSubscriptionResponse(subscription);
    }
    async cancelSubscription(req, subscriptionId, dto) {
        // Verify ownership
        await this.subscriptionService.verifySubscriptionOwnership(subscriptionId, req.user.fanId);
        const subscription = await this.subscriptionService.cancelSubscription(subscriptionId, dto.immediately);
        // Log cancellation reason
        if (dto.reason || dto.feedback) {
            await this.subscriptionService.logCancellationFeedback(subscriptionId, dto.reason, dto.feedback);
        }
        return this.mapToSubscriptionResponse(subscription);
    }
    async reactivateSubscription(req, subscriptionId) {
        // Verify ownership
        await this.subscriptionService.verifySubscriptionOwnership(subscriptionId, req.user.fanId);
        const subscription = await this.subscriptionService.reactivateSubscription(subscriptionId);
        return this.mapToSubscriptionResponse(subscription);
    }
    async getFanSubscriptions(req, filter) {
        return this.subscriptionService.getFanSubscriptions(req.user.fanId, filter);
    }
    async getCreatorSubscribers(req, filter) {
        return this.subscriptionService.getCreatorSubscribers(req.user.creatorId, filter);
    }
    async getMetrics(req, startDate, endDate) {
        return this.subscriptionService.getSubscriptionMetrics(req.user.creatorId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
    async getSubscription(req, subscriptionId) {
        const subscription = await this.subscriptionService.getSubscription(subscriptionId);
        // Verify access
        if (req.user.fanId && subscription.fanId !== req.user.fanId) {
            throw new Error('Unauthorized');
        }
        if (req.user.creatorId && subscription.creatorId !== req.user.creatorId) {
            throw new Error('Unauthorized');
        }
        return this.mapToSubscriptionResponse(subscription);
    }
    // Webhook endpoint
    async handleStripeWebhook(body, req) {
        const sig = req.headers['stripe-signature'];
        await this.subscriptionService.handleStripeWebhook(body, sig);
        return { received: true };
    }
    // Helper methods
    mapToSubscriptionPlanResponse(plan) {
        return {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price.toNumber(),
            currency: plan.currency,
            interval: plan.interval,
            intervalCount: plan.intervalCount,
            features: plan.features,
            maxDownloads: plan.maxDownloads,
            earlyAccess: plan.earlyAccess,
            exclusiveContent: plan.exclusiveContent,
            trialPeriodDays: plan.trialPeriodDays,
            isActive: plan.isActive,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        };
    }
    mapToSubscriptionResponse(subscription) {
        return {
            id: subscription.id,
            fanId: subscription.fanId,
            creatorId: subscription.creatorId,
            planId: subscription.planId,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
            endedAt: subscription.endedAt,
            totalSpent: subscription.totalSpent.toNumber(),
            renewalCount: subscription.renewalCount,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
            plan: subscription.plan ? {
                name: subscription.plan.name,
                price: subscription.plan.price.toNumber(),
                currency: subscription.plan.currency,
                interval: subscription.plan.interval
            } : undefined,
            creator: subscription.creator ? {
                username: subscription.creator.username,
                displayName: subscription.creator.displayName,
                avatar: subscription.creator.avatar
            } : undefined
        };
    }
};
exports.SubscriptionController = SubscriptionController;
__decorate([
    (0, common_1.Post)('plans'),
    (0, common_1.UseGuards)(creator_guard_1.CreatorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: subscription_plan_dto_1.SubscriptionPlanResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscription_plan_dto_1.CreateSubscriptionPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('plans/:planId'),
    (0, common_1.UseGuards)(creator_guard_1.CreatorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_plan_dto_1.SubscriptionPlanResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subscription_plan_dto_1.UpdateSubscriptionPlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription plans for a creator' }),
    (0, swagger_1.ApiQuery)({ name: 'creatorId', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [subscription_plan_dto_1.SubscriptionPlanResponseDto] }),
    __param(0, (0, common_1.Query)('creatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getCreatorPlans", null);
__decorate([
    (0, common_1.Get)('plans/:planId/analytics'),
    (0, common_1.UseGuards)(creator_guard_1.CreatorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics for a subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_plan_dto_1.SubscriptionPlanAnalyticsDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getPlanAnalytics", null);
__decorate([
    (0, common_1.Delete)('plans/:planId'),
    (0, common_1.UseGuards)(creator_guard_1.CreatorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a subscription plan' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "deactivatePlan", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to a plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: subscription_dto_1.SubscriptionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscription_dto_1.SubscribeDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Put)(':subscriptionId'),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('subscriptionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "updateSubscription", null);
__decorate([
    (0, common_1.Post)(':subscriptionId/cancel'),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('subscriptionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subscription_dto_1.CancelSubscriptionDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Post)(':subscriptionId/reactivate'),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reactivate a canceled subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "reactivateSubscription", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get fan subscriptions' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionListDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscription_dto_1.SubscriptionFilterDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getFanSubscriptions", null);
__decorate([
    (0, common_1.Get)('creator'),
    (0, common_1.UseGuards)(creator_guard_1.CreatorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get creator subscribers' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionListDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscription_dto_1.SubscriptionFilterDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getCreatorSubscribers", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, common_1.UseGuards)(creator_guard_1.CreatorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionMetricsDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)(':subscriptionId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription details' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: subscription_dto_1.SubscriptionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Post)('webhook/stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Handle Stripe webhooks' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "handleStripeWebhook", null);
exports.SubscriptionController = SubscriptionController = __decorate([
    (0, swagger_1.ApiTags)('subscriptions'),
    (0, common_1.Controller)('api/v1/subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService])
], SubscriptionController);
//# sourceMappingURL=subscription.controller.js.map