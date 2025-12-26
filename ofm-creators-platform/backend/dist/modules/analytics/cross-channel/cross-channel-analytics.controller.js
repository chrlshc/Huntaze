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
exports.CrossChannelAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@modules/auth/guards/roles.guard");
const roles_decorator_1 = require("@modules/auth/decorators/roles.decorator");
const cross_channel_analytics_service_1 = require("./cross-channel-analytics.service");
let CrossChannelAnalyticsController = class CrossChannelAnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getOverview(req, range) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.analyticsService.getOverviewMetrics(creatorId, range || '7d');
    }
    async getCampaigns(req, range) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.analyticsService.getCampaignMetrics(creatorId, range || '7d');
    }
    async getSocial(req, range) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.analyticsService.getSocialMetrics(creatorId, range || '7d');
    }
    async getCRM(req) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.analyticsService.getCRMSegments(creatorId);
    }
};
exports.CrossChannelAnalyticsController = CrossChannelAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overview analytics metrics' }),
    (0, swagger_1.ApiQuery)({ name: 'range', enum: ['7d', '28d'], required: false }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Overview metrics retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CrossChannelAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign analytics' }),
    (0, swagger_1.ApiQuery)({ name: 'range', enum: ['7d', '28d'], required: false }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Campaign metrics retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CrossChannelAnalyticsController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('social'),
    (0, swagger_1.ApiOperation)({ summary: 'Get social media analytics' }),
    (0, swagger_1.ApiQuery)({ name: 'range', enum: ['7d', '28d'], required: false }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Social metrics retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CrossChannelAnalyticsController.prototype, "getSocial", null);
__decorate([
    (0, common_1.Get)('crm'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CRM segmentation data' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'CRM segments retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CrossChannelAnalyticsController.prototype, "getCRM", null);
exports.CrossChannelAnalyticsController = CrossChannelAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics - Cross Channel'),
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [cross_channel_analytics_service_1.CrossChannelAnalyticsService])
], CrossChannelAnalyticsController);
//# sourceMappingURL=cross-channel-analytics.controller.js.map