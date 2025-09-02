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
exports.FanProfileDto = exports.FanTimelineEventDto = exports.FanEngagementDto = exports.BulkFanActionDto = exports.FanCommunicationPreferencesDto = exports.FanFilterDto = exports.FanSegmentDto = exports.FanTagDto = exports.UpdateFanDto = exports.CreateFanDto = exports.FanEngagementLevel = exports.FanValueSegment = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var FanValueSegment;
(function (FanValueSegment) {
    FanValueSegment["VIP"] = "vip";
    FanValueSegment["HIGH"] = "high";
    FanValueSegment["MEDIUM"] = "medium";
    FanValueSegment["LOW"] = "low";
    FanValueSegment["NEW"] = "new";
})(FanValueSegment || (exports.FanValueSegment = FanValueSegment = {}));
var FanEngagementLevel;
(function (FanEngagementLevel) {
    FanEngagementLevel["VERY_ACTIVE"] = "very_active";
    FanEngagementLevel["ACTIVE"] = "active";
    FanEngagementLevel["PASSIVE"] = "passive";
    FanEngagementLevel["INACTIVE"] = "inactive";
    FanEngagementLevel["CHURNED"] = "churned";
})(FanEngagementLevel || (exports.FanEngagementLevel = FanEngagementLevel = {}));
class CreateFanDto {
    email;
    username;
    displayName;
    phoneNumber;
    source;
    metadata;
}
exports.CreateFanDto = CreateFanDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateFanDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFanDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFanDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFanDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFanDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateFanDto.prototype, "metadata", void 0);
class UpdateFanDto {
    displayName;
    phoneNumber;
    notes;
    tags;
    customFields;
}
exports.UpdateFanDto = UpdateFanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFanDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFanDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFanDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateFanDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateFanDto.prototype, "customFields", void 0);
class FanTagDto {
    tags;
}
exports.FanTagDto = FanTagDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FanTagDto.prototype, "tags", void 0);
class FanSegmentDto {
    name;
    description;
    tags;
    minLifetimeValue;
    maxLifetimeValue;
    minEngagementScore;
    maxEngagementScore;
    subscriptionStatus;
    daysSinceLastPurchase;
    source;
    location;
    customCriteria;
}
exports.FanSegmentDto = FanSegmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FanSegmentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanSegmentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], FanSegmentDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FanSegmentDto.prototype, "minLifetimeValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FanSegmentDto.prototype, "maxLifetimeValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], FanSegmentDto.prototype, "minEngagementScore", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], FanSegmentDto.prototype, "maxEngagementScore", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], FanSegmentDto.prototype, "subscriptionStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], FanSegmentDto.prototype, "daysSinceLastPurchase", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], FanSegmentDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], FanSegmentDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], FanSegmentDto.prototype, "customCriteria", void 0);
class FanFilterDto {
    search;
    tags;
    minLifetimeValue;
    maxLifetimeValue;
    minEngagementScore;
    maxEngagementScore;
    hasActiveSubscription;
    lastInteractionDays;
    valueSegment;
    engagementLevel;
    sortBy = 'engagementScore';
    sortOrder = 'desc';
    page = 1;
    limit = 20;
}
exports.FanFilterDto = FanFilterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], FanFilterDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "minLifetimeValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "maxLifetimeValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "minEngagementScore", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "maxEngagementScore", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FanFilterDto.prototype, "hasActiveSubscription", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "lastInteractionDays", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FanValueSegment),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanFilterDto.prototype, "valueSegment", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FanEngagementLevel),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanFilterDto.prototype, "engagementLevel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FanFilterDto.prototype, "limit", void 0);
class FanCommunicationPreferencesDto {
    emailOptIn;
    smsOptIn;
    pushOptIn;
    preferredChannel;
    notificationTypes;
}
exports.FanCommunicationPreferencesDto = FanCommunicationPreferencesDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FanCommunicationPreferencesDto.prototype, "emailOptIn", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FanCommunicationPreferencesDto.prototype, "smsOptIn", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FanCommunicationPreferencesDto.prototype, "pushOptIn", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FanCommunicationPreferencesDto.prototype, "preferredChannel", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], FanCommunicationPreferencesDto.prototype, "notificationTypes", void 0);
class BulkFanActionDto {
    fanIds;
    action;
    payload;
}
exports.BulkFanActionDto = BulkFanActionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkFanActionDto.prototype, "fanIds", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['add_tags', 'remove_tags', 'update_segment', 'export']),
    __metadata("design:type", String)
], BulkFanActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BulkFanActionDto.prototype, "payload", void 0);
class FanEngagementDto {
    summary;
    segmentDistribution;
    topFans;
    engagementTrends;
    communicationOptIns;
}
exports.FanEngagementDto = FanEngagementDto;
class FanTimelineEventDto {
    id;
    type;
    timestamp;
    details;
}
exports.FanTimelineEventDto = FanTimelineEventDto;
class FanProfileDto {
    // Basic info
    id;
    email;
    username;
    displayName;
    avatar;
    phoneNumber;
    // Engagement metrics
    engagementScore;
    lifetimeValue;
    tags;
    notes;
    // Subscription info
    hasActiveSubscription;
    currentPlan;
    subscriptionStartDate;
    subscriptionStatus;
    // Activity metrics
    totalPurchases;
    totalSpent;
    lastInteraction;
    joinedAt;
    // Communication preferences
    emailOptIn;
    smsOptIn;
    preferredChannel;
    // Segments
    segments;
    valueSegment;
    engagementLevel;
    // Recent activity
    recentPurchases;
    // Timeline
    timeline;
}
exports.FanProfileDto = FanProfileDto;
//# sourceMappingURL=fan-management.dto.js.map