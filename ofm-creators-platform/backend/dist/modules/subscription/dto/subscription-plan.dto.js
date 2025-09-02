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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlanAnalyticsDto = exports.SubscriptionPlanResponseDto = exports.UpdateSubscriptionPlanDto = exports.CreateSubscriptionPlanDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateSubscriptionPlanDto {
    name;
    description;
    price;
    currency = 'USD';
    interval;
    intervalCount = 1;
    features;
    maxDownloads;
    earlyAccess = false;
    exclusiveContent = true;
    trialPeriodDays;
}
exports.CreateSubscriptionPlanDto = CreateSubscriptionPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.99),
    (0, class_validator_1.Max)(999999.99),
    __metadata("design:type", Number)
], CreateSubscriptionPlanDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.BillingInterval),
    __metadata("design:type", String)
], CreateSubscriptionPlanDto.prototype, "interval", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateSubscriptionPlanDto.prototype, "intervalCount", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateSubscriptionPlanDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSubscriptionPlanDto.prototype, "maxDownloads", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSubscriptionPlanDto.prototype, "earlyAccess", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSubscriptionPlanDto.prototype, "exclusiveContent", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateSubscriptionPlanDto.prototype, "trialPeriodDays", void 0);
class UpdateSubscriptionPlanDto {
    name;
    description;
    price;
    features;
    maxDownloads;
    earlyAccess;
    exclusiveContent;
    trialPeriodDays;
    isActive;
}
exports.UpdateSubscriptionPlanDto = UpdateSubscriptionPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSubscriptionPlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0.99),
    (0, class_validator_1.Max)(999999.99),
    __metadata("design:type", Number)
], UpdateSubscriptionPlanDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSubscriptionPlanDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateSubscriptionPlanDto.prototype, "maxDownloads", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSubscriptionPlanDto.prototype, "earlyAccess", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSubscriptionPlanDto.prototype, "exclusiveContent", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], UpdateSubscriptionPlanDto.prototype, "trialPeriodDays", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSubscriptionPlanDto.prototype, "isActive", void 0);
class SubscriptionPlanResponseDto {
    id;
    name;
    description;
    price;
    currency;
    interval;
    intervalCount;
    features;
    maxDownloads;
    earlyAccess;
    exclusiveContent;
    trialPeriodDays;
    isActive;
    subscriberCount;
    monthlyRevenue;
    createdAt;
    updatedAt;
}
exports.SubscriptionPlanResponseDto = SubscriptionPlanResponseDto;
class SubscriptionPlanAnalyticsDto {
    planId;
    planName;
    // Metrics
    activeSubscribers;
    totalSubscribers;
    churnRate;
    // Revenue
    monthlyRecurringRevenue;
    averageRevenuePerUser;
    lifetimeValue;
    // Growth
    subscriberGrowthRate;
    newSubscribersThisMonth;
    canceledThisMonth;
    // Engagement
    averageSubscriptionLength;
    renewalRate;
}
exports.SubscriptionPlanAnalyticsDto = SubscriptionPlanAnalyticsDto;
//# sourceMappingURL=subscription-plan.dto.js.map