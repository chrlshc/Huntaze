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
exports.AutomationTriggerDto = exports.CampaignABTestDto = exports.TrackingLinkDto = exports.TrackingPixelDto = exports.CampaignListDto = exports.CampaignResponseDto = exports.CampaignTemplateDto = exports.CampaignMetricsDto = exports.CampaignFilterDto = exports.SendTestCampaignDto = exports.UpdateCampaignDto = exports.CreateCampaignDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateCampaignDto {
    name;
    type;
    subject;
    content;
    targetTags;
    targetSegment;
    scheduledFor;
    templateId;
    metadata;
}
exports.CreateCampaignDto = CreateCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCampaignDto.prototype, "targetTags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateCampaignDto.prototype, "targetSegment", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateCampaignDto.prototype, "scheduledFor", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateCampaignDto.prototype, "metadata", void 0);
class UpdateCampaignDto {
    name;
    type;
    subject;
    content;
    targetTags;
    targetSegment;
    scheduledFor;
}
exports.UpdateCampaignDto = UpdateCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], UpdateCampaignDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateCampaignDto.prototype, "targetTags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateCampaignDto.prototype, "targetSegment", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], UpdateCampaignDto.prototype, "scheduledFor", void 0);
class SendTestCampaignDto {
    testEmail;
    testPhone;
}
exports.SendTestCampaignDto = SendTestCampaignDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendTestCampaignDto.prototype, "testEmail", void 0);
__decorate([
    (0, class_validator_1.IsPhoneNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendTestCampaignDto.prototype, "testPhone", void 0);
class CampaignFilterDto {
    status;
    type;
    search;
    startDate;
    endDate;
    sortBy = 'createdAt';
    sortOrder = 'desc';
    page = 1;
    limit = 20;
}
exports.CampaignFilterDto = CampaignFilterDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CampaignStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignFilterDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CampaignFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CampaignFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CampaignFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CampaignFilterDto.prototype, "limit", void 0);
class CampaignMetricsDto {
    campaignId;
    // Delivery metrics
    totalRecipients;
    sent;
    delivered;
    failed;
    deliveryRate;
    // Engagement metrics
    opened;
    clicked;
    openRate;
    clickRate;
    // Conversion metrics
    conversions;
    conversionRate;
    revenue;
    averageOrderValue;
    // Time metrics
    timeline;
    // Breakdown by segment
    segmentBreakdown;
    // Device breakdown
    deviceBreakdown;
    // Link performance
    linkPerformance;
}
exports.CampaignMetricsDto = CampaignMetricsDto;
class CampaignTemplateDto {
    name;
    description;
    type;
    subject;
    content;
    variables;
    thumbnailUrl;
    tags;
}
exports.CampaignTemplateDto = CampaignTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CampaignTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CampaignTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CampaignType),
    __metadata("design:type", String)
], CampaignTemplateDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CampaignTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CampaignTemplateDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CampaignTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignTemplateDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CampaignTemplateDto.prototype, "tags", void 0);
class CampaignResponseDto {
    id;
    creatorId;
    name;
    type;
    status;
    subject;
    content;
    targetTags;
    targetSegment;
    // Schedule
    scheduledFor;
    sentAt;
    // Metrics
    sentCount;
    openCount;
    clickCount;
    recipientCount;
    // Timestamps
    createdAt;
    updatedAt;
    // Calculated fields
    openRate;
    clickRate;
    isEditable;
}
exports.CampaignResponseDto = CampaignResponseDto;
class CampaignListDto {
    campaigns;
    total;
    page;
    pageSize;
    hasMore;
}
exports.CampaignListDto = CampaignListDto;
class TrackingPixelDto {
    campaignId;
    fanId;
    timestamp;
    userAgent;
    ipAddress;
}
exports.TrackingPixelDto = TrackingPixelDto;
class TrackingLinkDto {
    campaignId;
    fanId;
    originalUrl;
    clickedAt;
    userAgent;
    ipAddress;
}
exports.TrackingLinkDto = TrackingLinkDto;
class CampaignABTestDto {
    name;
    variants;
    winningMetric = 'opens';
    testDurationHours = 24;
    testSampleSize = 20; // Percentage
}
exports.CampaignABTestDto = CampaignABTestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CampaignABTestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CampaignABTestDto.prototype, "variants", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CampaignABTestDto.prototype, "winningMetric", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CampaignABTestDto.prototype, "testDurationHours", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(10),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CampaignABTestDto.prototype, "testSampleSize", void 0);
class AutomationTriggerDto {
    triggerType;
    conditions;
    delayMinutes = 0;
    campaignTemplateId;
}
exports.AutomationTriggerDto = AutomationTriggerDto;
__decorate([
    (0, class_validator_1.IsEnum)(['fan_joined', 'subscription_started', 'subscription_ended', 'purchase_made', 'tag_added', 'custom']),
    __metadata("design:type", String)
], AutomationTriggerDto.prototype, "triggerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AutomationTriggerDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AutomationTriggerDto.prototype, "delayMinutes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AutomationTriggerDto.prototype, "campaignTemplateId", void 0);
//# sourceMappingURL=campaign.dto.js.map