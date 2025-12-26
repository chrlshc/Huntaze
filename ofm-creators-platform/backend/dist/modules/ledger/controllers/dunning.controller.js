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
exports.DunningController = void 0;
const common_1 = require("@nestjs/common");
const dunning_service_1 = require("../services/dunning.service");
const jwt_auth_guard_1 = require("@infrastructure/auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("@infrastructure/auth/decorators/current-user.decorator");
const dunning_dto_1 = require("../dto/dunning.dto");
let DunningController = class DunningController {
    dunningService;
    constructor(dunningService) {
        this.dunningService = dunningService;
    }
    /**
     * Get dunning metrics
     */
    async getMetrics(user, startDate, endDate) {
        return this.dunningService.getMetrics(user.creatorId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
    /**
     * Get active dunning cases
     */
    async getActiveCases(user, page = 1, limit = 20) {
        return this.dunningService.getActiveCases(user.creatorId, page, limit);
    }
    /**
     * Get dunning history for a specific invoice
     */
    async getInvoiceHistory(user, invoiceId) {
        return this.dunningService.getInvoiceHistory(user.creatorId, invoiceId);
    }
    /**
     * Update payment method and retry
     */
    async updatePaymentMethod(user, dto) {
        return this.dunningService.updatePaymentMethodAndRetry(user.creatorId, dto.paymentMethodId, dto.setAsDefault);
    }
    /**
     * Manually retry a failed payment
     */
    async retryPayment(user, invoiceId) {
        return this.dunningService.manualRetry(user.creatorId, invoiceId);
    }
    /**
     * Bulk dunning actions (admin)
     */
    async bulkAction(user, dto) {
        // This would typically require admin permissions
        return this.dunningService.bulkAction(dto);
    }
    /**
     * Get dunning configuration
     */
    async getConfig(user) {
        return this.dunningService.getConfig(user.creatorId);
    }
    /**
     * Update dunning configuration
     */
    async updateConfig(user, dto) {
        return this.dunningService.updateConfig(user.creatorId, dto);
    }
    /**
     * Get recovery predictions
     */
    async getRecoveryPredictions(user) {
        return this.dunningService.getRecoveryPredictions(user.creatorId);
    }
    /**
     * Request payment plan (for large outstanding amounts)
     */
    async requestPaymentPlan(user, dto) {
        return this.dunningService.createPaymentPlan(user.creatorId, dto.invoiceIds, dto.installments);
    }
};
exports.DunningController = DunningController;
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "getActiveCases", null);
__decorate([
    (0, common_1.Get)('invoice/:invoiceId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "getInvoiceHistory", null);
__decorate([
    (0, common_1.Post)('update-payment'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dunning_dto_1.UpdatePaymentMethodDto]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "updatePaymentMethod", null);
__decorate([
    (0, common_1.Post)('retry/:invoiceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "retryPayment", null);
__decorate([
    (0, common_1.Post)('bulk-action'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dunning_dto_1.BulkDunningActionDto]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "bulkAction", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dunning_dto_1.DunningConfigDto]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('predictions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "getRecoveryPredictions", null);
__decorate([
    (0, common_1.Post)('payment-plan'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DunningController.prototype, "requestPaymentPlan", null);
exports.DunningController = DunningController = __decorate([
    (0, common_1.Controller)('dunning'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dunning_service_1.DunningService])
], DunningController);
//# sourceMappingURL=dunning.controller.js.map