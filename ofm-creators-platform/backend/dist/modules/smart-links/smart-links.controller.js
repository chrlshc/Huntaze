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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartLinksController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@modules/auth/guards/roles.guard");
const roles_decorator_1 = require("@modules/auth/decorators/roles.decorator");
const smart_links_service_1 = require("./smart-links.service");
const smart_link_dto_1 = require("./dto/smart-link.dto");
const crypto_1 = require("crypto");
let SmartLinksController = class SmartLinksController {
    smartLinksService;
    constructor(smartLinksService) {
        this.smartLinksService = smartLinksService;
    }
    async createSmartLink(req, dto) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.smartLinksService.create(creatorId, dto);
    }
    async getSmartLinks(req, page, limit, campaignId) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.smartLinksService.findAll(creatorId, {
            page,
            limit,
            campaignId,
        });
    }
    async getSmartLinkAnalytics(req, id, days) {
        const creatorId = req.user.creatorId || req.user.id;
        return this.smartLinksService.getAnalytics(creatorId, id, days);
    }
    async redirectSmartLink(slug, req, res, query) {
        try {
            // Get or create session ID
            const sessionId = req.cookies['h_sid'] || (0, crypto_1.randomUUID)();
            // Get IP address
            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket.remoteAddress
                || '';
            // Get smart link
            const smartLink = await this.smartLinksService.getBySlug(slug);
            // Track click
            const clickResult = await this.smartLinksService.trackClick(smartLink.id, {
                sessionId,
                fanId: smartLink.fanId,
                ipAddress: ip,
                userAgent: req.headers['user-agent'],
                referrer: req.headers['referer'],
                utmSource: query.utm_source,
                utmMedium: query.utm_medium,
                utmCampaign: query.utm_campaign,
            });
            // Set session cookie if new
            if (!req.cookies['h_sid']) {
                res.cookie('h_sid', sessionId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                });
            }
            // Build target URL with preserved UTM params
            const targetUrl = new URL(smartLink.targetUrl);
            if (query.utm_source)
                targetUrl.searchParams.set('utm_source', query.utm_source);
            if (query.utm_medium)
                targetUrl.searchParams.set('utm_medium', query.utm_medium);
            if (query.utm_campaign)
                targetUrl.searchParams.set('utm_campaign', query.utm_campaign);
            // Redirect
            res.redirect(302, targetUrl.toString());
        }
        catch (error) {
            // Redirect to fallback URL on error
            const fallbackUrl = process.env.FALLBACK_URL || 'https://huntaze.com';
            res.redirect(302, fallbackUrl);
        }
    }
};
exports.SmartLinksController = SmartLinksController;
__decorate([
    (0, common_1.Post)('smart-links'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new smart link' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Smart link created successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof smart_link_dto_1.CreateSmartLinkDto !== "undefined" && smart_link_dto_1.CreateSmartLinkDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], SmartLinksController.prototype, "createSmartLink", null);
__decorate([
    (0, common_1.Get)('smart-links'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all smart links for creator' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], SmartLinksController.prototype, "getSmartLinks", null);
__decorate([
    (0, common_1.Get)('smart-links/:id/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('creator', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics for a smart link' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], SmartLinksController.prototype, "getSmartLinkAnalytics", null);
__decorate([
    (0, common_1.Get)('s/:slug'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _b : Object, typeof (_c = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], SmartLinksController.prototype, "redirectSmartLink", null);
exports.SmartLinksController = SmartLinksController = __decorate([
    (0, swagger_1.ApiTags)('Smart Links'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [smart_links_service_1.SmartLinksService])
], SmartLinksController);
//# sourceMappingURL=smart-links.controller.js.map