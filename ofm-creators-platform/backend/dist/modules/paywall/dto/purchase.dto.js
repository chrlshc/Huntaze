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
exports.RefundResponseDto = exports.RefundRequestDto = exports.DownloadResponseDto = exports.PurchaseListDto = exports.PurchaseResponseDto = exports.TipCreatorDto = exports.PurchaseProductDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PurchaseProductDto {
    productId;
    paymentMethodId;
    couponCode;
}
exports.PurchaseProductDto = PurchaseProductDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchaseProductDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchaseProductDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PurchaseProductDto.prototype, "couponCode", void 0);
class TipCreatorDto {
    creatorId;
    amount;
    currency = 'USD';
    paymentMethodId;
    message;
}
exports.TipCreatorDto = TipCreatorDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TipCreatorDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], TipCreatorDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TipCreatorDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TipCreatorDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TipCreatorDto.prototype, "message", void 0);
class PurchaseResponseDto {
    id;
    fanId;
    productId;
    amount;
    currency;
    status;
    downloadCount;
    lastDownloadAt;
    createdAt;
    // Relations
    product;
}
exports.PurchaseResponseDto = PurchaseResponseDto;
class PurchaseListDto {
    purchases;
    total;
    page;
    pageSize;
    hasMore;
}
exports.PurchaseListDto = PurchaseListDto;
class DownloadResponseDto {
    downloadUrl;
    expiresAt;
    remainingDownloads;
}
exports.DownloadResponseDto = DownloadResponseDto;
class RefundRequestDto {
    purchaseId;
    reason;
    details;
}
exports.RefundRequestDto = RefundRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundRequestDto.prototype, "purchaseId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundRequestDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RefundRequestDto.prototype, "details", void 0);
class RefundResponseDto {
    refundId;
    purchaseId;
    amount;
    currency;
    status;
    reason;
    processedAt;
    createdAt;
}
exports.RefundResponseDto = RefundResponseDto;
//# sourceMappingURL=purchase.dto.js.map