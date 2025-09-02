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
exports.SubscriptionMetricsDto = exports.SubscriptionFilterDto = exports.SubscriptionListDto = exports.SubscriptionResponseDto = exports.CancelSubscriptionDto = exports.UpdateSubscriptionDto = exports.SubscribeDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class SubscribeDto {
    planId;
    paymentMethodId;
    couponCode;
}
exports.SubscribeDto = SubscribeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubscribeDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubscribeDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscribeDto.prototype, "couponCode", void 0);
class UpdateSubscriptionDto {
    planId; // Pour changer de plan
    paymentMethodId; // Pour changer de méthode de paiement
}
exports.UpdateSubscriptionDto = UpdateSubscriptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSubscriptionDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSubscriptionDto.prototype, "paymentMethodId", void 0);
class CancelSubscriptionDto {
    immediately = false;
    reason;
    feedback;
}
exports.CancelSubscriptionDto = CancelSubscriptionDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CancelSubscriptionDto.prototype, "immediately", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CancelSubscriptionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CancelSubscriptionDto.prototype, "feedback", void 0);
class SubscriptionResponseDto {
    id;
    fanId;
    creatorId;
    planId;
    status;
    currentPeriodStart;
    currentPeriodEnd;
    cancelAtPeriodEnd;
    canceledAt;
    endedAt;
    totalSpent;
    renewalCount;
    createdAt;
    updatedAt;
    // Relations
    plan;
    creator;
}
exports.SubscriptionResponseDto = SubscriptionResponseDto;
class SubscriptionListDto {
    subscriptions;
    total;
    page;
    pageSize;
    hasMore;
}
exports.SubscriptionListDto = SubscriptionListDto;
class SubscriptionFilterDto {
    status;
    creatorId;
    planId;
    search;
    sortBy = 'createdAt';
    sortOrder = 'desc';
    page = '1';
    pageSize = '20';
}
exports.SubscriptionFilterDto = SubscriptionFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubscriptionFilterDto.prototype, "pageSize", void 0);
class SubscriptionMetricsDto {
    totalActive;
    totalCanceled;
    totalRevenue;
    averageLifetimeValue;
    churnRate;
    growthRate;
    // Time series data
    revenueByMonth;
    subscribersByMonth;
}
exports.SubscriptionMetricsDto = SubscriptionMetricsDto;
//# sourceMappingURL=subscription.dto.js.map