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
exports.OnlyFansEngagementMetrics = exports.OnlyFansImportResultDto = exports.OnlyFansCSVImportDto = exports.OnlyFansContentRow = exports.OnlyFansRevenueRow = exports.OnlyFansSubscriberRow = exports.OnlyFansCSVType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var OnlyFansCSVType;
(function (OnlyFansCSVType) {
    OnlyFansCSVType["SUBSCRIBERS"] = "subscribers";
    OnlyFansCSVType["REVENUE"] = "revenue";
    OnlyFansCSVType["CONTENT"] = "content";
})(OnlyFansCSVType || (exports.OnlyFansCSVType = OnlyFansCSVType = {}));
class OnlyFansSubscriberRow {
    username;
    name;
    email;
    status;
    subscription_price;
    subscription_start;
    subscription_end;
    rebill_status;
    total_spent;
    messages_sent;
    tips_sent;
    ppv_purchased;
    join_date;
    last_active;
}
exports.OnlyFansSubscriberRow = OnlyFansSubscriberRow;
class OnlyFansRevenueRow {
    date;
    type; // 'subscription', 'tip', 'ppv', 'stream'
    username;
    gross_amount;
    platform_fee;
    net_amount;
    currency;
    status;
    description;
    message_id;
    post_id;
    stream_id;
}
exports.OnlyFansRevenueRow = OnlyFansRevenueRow;
class OnlyFansContentRow {
    post_id;
    created_at;
    type; // 'photo', 'video', 'audio', 'text'
    visibility; // 'all', 'subscribers', 'ppv'
    price;
    likes;
    comments;
    tips;
    ppv_purchases;
    total_revenue;
}
exports.OnlyFansContentRow = OnlyFansContentRow;
class OnlyFansCSVImportDto {
    type;
    sourceId; // ExternalEarningsSource ID
    periodStart; // YYYY-MM-DD
    periodEnd; // YYYY-MM-DD
    rows; // Will be validated based on type
}
exports.OnlyFansCSVImportDto = OnlyFansCSVImportDto;
__decorate([
    (0, class_validator_1.IsEnum)(OnlyFansCSVType),
    __metadata("design:type", String)
], OnlyFansCSVImportDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnlyFansCSVImportDto.prototype, "sourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OnlyFansCSVImportDto.prototype, "periodStart", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OnlyFansCSVImportDto.prototype, "periodEnd", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Array)
], OnlyFansCSVImportDto.prototype, "rows", void 0);
class OnlyFansImportResultDto {
    type;
    totalRows;
    processedRows;
    skippedRows;
    errors;
    // Type-specific results
    subscribersImported;
    revenueImported;
    contentImported;
    engagementScoresUpdated;
    tiersAssigned;
}
exports.OnlyFansImportResultDto = OnlyFansImportResultDto;
class OnlyFansEngagementMetrics {
    fanId;
    score; // 0-100
    components;
    tier;
    lastCalculated;
}
exports.OnlyFansEngagementMetrics = OnlyFansEngagementMetrics;
//# sourceMappingURL=csv-import.dto.js.map