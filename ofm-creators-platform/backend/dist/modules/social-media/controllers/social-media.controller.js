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
exports.SocialMediaController = void 0;
const common_1 = require("@nestjs/common");
const social_media_service_1 = require("../services/social-media.service");
const social_media_dto_1 = require("../dto/social-media.dto");
const jwt_auth_guard_1 = require("@infrastructure/auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("@infrastructure/auth/decorators/current-user.decorator");
let SocialMediaController = class SocialMediaController {
    socialMediaService;
    constructor(socialMediaService) {
        this.socialMediaService = socialMediaService;
    }
    /**
     * Connect a social media account
     */
    async connectAccount(user, platform, body) {
        return this.socialMediaService.connectAccount(user.creatorId, platform, body.authCode);
    }
    /**
     * Get connected accounts
     */
    async getAccounts(user) {
        return this.socialMediaService.getConnectedAccounts(user.creatorId);
    }
    /**
     * Cross-post to multiple accounts (same or different platforms)
     */
    async crossPost(user, request) {
        return this.socialMediaService.crossPost(user.creatorId, request);
    }
    /**
     * Schedule a post
     */
    async schedulePost(user, request) {
        return this.socialMediaService.schedulePost(user.creatorId, request);
    }
    /**
     * Get posting analytics
     */
    async getAnalytics(user, startDate, endDate) {
        const dateRange = startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate)
        } : undefined;
        return this.socialMediaService.getPostingAnalytics(user.creatorId, dateRange);
    }
    /**
     * Get optimal posting times
     */
    async getOptimalTimes(user, platform) {
        return this.socialMediaService.getOptimalPostingTimes(user.creatorId, platform);
    }
    /**
     * Get account groups for multi-account management
     */
    async getAccountGroups(user) {
        return this.socialMediaService.getAccountGroups(user.creatorId);
    }
    /**
     * Create a new account group
     */
    async createAccountGroup(user, dto) {
        return this.socialMediaService.createAccountGroup(user.creatorId, dto.name, dto.description, dto.accountIds);
    }
    /**
     * Add accounts to an existing group
     */
    async addAccountsToGroup(user, groupId, body) {
        await this.socialMediaService.addAccountsToGroup(groupId, body.accountIds);
        return { success: true };
    }
    /**
     * Post to all accounts in a group
     */
    async postToGroup(user, groupId, dto) {
        return this.socialMediaService.postToGroup(user.creatorId, groupId, dto.content);
    }
    /**
     * Get accounts by platform
     */
    async getAccountsByPlatform(user, platform) {
        return this.socialMediaService.getAccountsByPlatform(user.creatorId, platform);
    }
    /**
     * Example: Post to all Instagram accounts
     */
    async quickPostToPlatform(user, platform, body) {
        // Get accounts for platform if not specified
        let accounts = [];
        if (body.accountIds && body.accountIds.length > 0) {
            accounts = body.accountIds.map(id => ({ id, platform }));
        }
        else {
            const platformAccounts = await this.socialMediaService.getAccountsByPlatform(user.creatorId, platform);
            accounts = platformAccounts.map((acc) => ({
                id: acc.id,
                platform
            }));
        }
        const request = {
            content: body.content,
            accounts,
            options: {
                staggerPosting: {
                    enabled: true,
                    intervalMinutes: 5
                }
            }
        };
        return this.socialMediaService.crossPost(user.creatorId, request);
    }
};
exports.SocialMediaController = SocialMediaController;
__decorate([
    (0, common_1.Post)('connect/:platform'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('platform')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "connectAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)('cross-post'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, social_media_dto_1.CrossPostRequestDto]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "crossPost", null);
__decorate([
    (0, common_1.Post)('schedule'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, social_media_dto_1.CrossPostRequestDto]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "schedulePost", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('optimal-times/:platform'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "getOptimalTimes", null);
__decorate([
    (0, common_1.Get)('account-groups'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "getAccountGroups", null);
__decorate([
    (0, common_1.Post)('account-groups'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, social_media_dto_1.CreateAccountGroupDto]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "createAccountGroup", null);
__decorate([
    (0, common_1.Put)('account-groups/:groupId/accounts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "addAccountsToGroup", null);
__decorate([
    (0, common_1.Post)('account-groups/:groupId/post'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, social_media_dto_1.PostToGroupDto]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "postToGroup", null);
__decorate([
    (0, common_1.Get)('accounts/:platform'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "getAccountsByPlatform", null);
__decorate([
    (0, common_1.Post)('quick-post/:platform'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('platform')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SocialMediaController.prototype, "quickPostToPlatform", null);
exports.SocialMediaController = SocialMediaController = __decorate([
    (0, common_1.Controller)('social-media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [social_media_service_1.SocialMediaService])
], SocialMediaController);
//# sourceMappingURL=social-media.controller.js.map