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
exports.AppSecretRotateDto = exports.DeveloperAppDto = exports.AppUsageDto = exports.AppReviewDto = exports.AppBillingDto = exports.AppEventDto = exports.InstalledAppDto = exports.AppListDto = exports.AppResponseDto = exports.AppPermissionsDto = exports.AppWebhookDto = exports.AppConfigDto = exports.InstallAppDto = exports.AppFilterDto = exports.UpdateAppDto = exports.CreateAppDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateAppDto {
    name;
    description;
    icon;
    developer;
    website;
    category;
    pricing;
    price;
    webhookUrl;
    scopes;
    metadata;
}
exports.CreateAppDto = CreateAppDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateAppDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateAppDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "developer", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AppCategory),
    __metadata("design:type", String)
], CreateAppDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AppPricing),
    __metadata("design:type", String)
], CreateAppDto.prototype, "pricing", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAppDto.prototype, "scopes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAppDto.prototype, "metadata", void 0);
class UpdateAppDto {
    name;
    description;
    icon;
    website;
    pricing;
    price;
    webhookUrl;
    scopes;
}
exports.UpdateAppDto = UpdateAppDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AppPricing),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "pricing", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateAppDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateAppDto.prototype, "scopes", void 0);
class AppFilterDto {
    category;
    pricing;
    search;
    verified;
    developer;
    sortBy = 'installs';
    sortOrder = 'desc';
    page = 1;
    limit = 20;
}
exports.AppFilterDto = AppFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AppCategory),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppFilterDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AppPricing),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppFilterDto.prototype, "pricing", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AppFilterDto.prototype, "verified", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppFilterDto.prototype, "developer", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AppFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AppFilterDto.prototype, "limit", void 0);
class InstallAppDto {
    appId;
    settings;
    acceptTerms = true;
}
exports.InstallAppDto = InstallAppDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstallAppDto.prototype, "appId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InstallAppDto.prototype, "settings", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InstallAppDto.prototype, "acceptTerms", void 0);
class AppConfigDto {
    settings;
    enabled;
    allowedWebhooks;
}
exports.AppConfigDto = AppConfigDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AppConfigDto.prototype, "settings", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AppConfigDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AppConfigDto.prototype, "allowedWebhooks", void 0);
class AppWebhookDto {
    event;
    creatorId;
    data;
    idempotencyKey;
}
exports.AppWebhookDto = AppWebhookDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppWebhookDto.prototype, "event", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppWebhookDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AppWebhookDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppWebhookDto.prototype, "idempotencyKey", void 0);
class AppPermissionsDto {
    appId;
    appName;
    scopes;
    grantedAt;
    expiresAt;
    restrictions;
}
exports.AppPermissionsDto = AppPermissionsDto;
class AppResponseDto {
    id;
    name;
    slug;
    description;
    icon;
    developer;
    website;
    category;
    pricing;
    price;
    scopes;
    isPublished;
    isVerified;
    createdAt;
    updatedAt;
    // Computed fields
    installCount;
    rating;
    installation;
}
exports.AppResponseDto = AppResponseDto;
class AppListDto {
    apps;
    total;
    page;
    pageSize;
    hasMore;
    categories;
}
exports.AppListDto = AppListDto;
class InstalledAppDto {
    id;
    app;
    status;
    settings;
    billingCycle;
    nextBilling;
    installedAt;
    lastUsedAt;
}
exports.InstalledAppDto = InstalledAppDto;
class AppEventDto {
    appId;
    event;
    data;
    userId;
}
exports.AppEventDto = AppEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppEventDto.prototype, "appId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppEventDto.prototype, "event", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AppEventDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AppEventDto.prototype, "userId", void 0);
class AppBillingDto {
    appId;
    pricing;
    price;
    billingCycle;
    currentPeriodStart;
    currentPeriodEnd;
    nextBilling;
    usage;
    costs;
}
exports.AppBillingDto = AppBillingDto;
class AppReviewDto {
    appId;
    rating;
    comment;
}
exports.AppReviewDto = AppReviewDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppReviewDto.prototype, "appId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AppReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AppReviewDto.prototype, "comment", void 0);
class AppUsageDto {
    appId;
    period;
    metrics;
    limits;
    costs;
}
exports.AppUsageDto = AppUsageDto;
class DeveloperAppDto {
    developerId;
    status = 'all';
}
exports.DeveloperAppDto = DeveloperAppDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeveloperAppDto.prototype, "developerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeveloperAppDto.prototype, "status", void 0);
class AppSecretRotateDto {
    appId;
    secretType;
    revokeOld = true;
}
exports.AppSecretRotateDto = AppSecretRotateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AppSecretRotateDto.prototype, "appId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['api_key', 'webhook_secret']),
    __metadata("design:type", String)
], AppSecretRotateDto.prototype, "secretType", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AppSecretRotateDto.prototype, "revokeOld", void 0);
//# sourceMappingURL=app.dto.js.map