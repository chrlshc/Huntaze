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
exports.DunningConfigDto = exports.BulkDunningActionDto = exports.InvoiceRecoveryDto = exports.DunningMetricsDto = exports.UpdatePaymentMethodDto = exports.PaymentAttemptDto = exports.DunningStateDto = void 0;
const class_validator_1 = require("class-validator");
class DunningStateDto {
    id;
    invoiceId;
    creatorId;
    attemptCount;
    status;
    lastAttempt;
    nextAttempt;
    recoveredAt;
    writeOffAt;
    metadata;
    createdAt;
    updatedAt;
}
exports.DunningStateDto = DunningStateDto;
class PaymentAttemptDto {
    id;
    invoiceId;
    attemptNumber;
    status;
    errorCode;
    errorMessage;
    paymentMethodId;
    amount;
    currency;
    createdAt;
}
exports.PaymentAttemptDto = PaymentAttemptDto;
class UpdatePaymentMethodDto {
    paymentMethodId;
    setAsDefault;
}
exports.UpdatePaymentMethodDto = UpdatePaymentMethodDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaymentMethodDto.prototype, "paymentMethodId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePaymentMethodDto.prototype, "setAsDefault", void 0);
class DunningMetricsDto {
    totalInvoices;
    activeCount;
    recoveredCount;
    writtenOffCount;
    suspendedCount;
    totalAmountDue;
    totalRecovered;
    totalWrittenOff;
    recoveryRate;
    averageRecoveryTime; // in hours
    byAttempt;
    recentActivity;
}
exports.DunningMetricsDto = DunningMetricsDto;
class InvoiceRecoveryDto {
    invoiceId;
    creatorId;
    amount;
    currency;
    attemptCount;
    nextAttempt;
    daysOverdue;
    creator;
    history;
}
exports.InvoiceRecoveryDto = InvoiceRecoveryDto;
class BulkDunningActionDto {
    invoiceIds;
    action;
    reason;
}
exports.BulkDunningActionDto = BulkDunningActionDto;
__decorate([
    IsArray(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkDunningActionDto.prototype, "invoiceIds", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['retry', 'pause', 'write_off', 'send_reminder']),
    __metadata("design:type", String)
], BulkDunningActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkDunningActionDto.prototype, "reason", void 0);
class DunningConfigDto {
    enableAutoDunning;
    maxAttempts;
    suspensionDelayDays;
    writeOffDelayDays;
    enableSmsNotifications;
    customSchedule;
}
exports.DunningConfigDto = DunningConfigDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DunningConfigDto.prototype, "enableAutoDunning", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], DunningConfigDto.prototype, "maxAttempts", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], DunningConfigDto.prototype, "suspensionDelayDays", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], DunningConfigDto.prototype, "writeOffDelayDays", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DunningConfigDto.prototype, "enableSmsNotifications", void 0);
__decorate([
    IsArray(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DunningConfigDto.prototype, "customSchedule", void 0);
//# sourceMappingURL=dunning.dto.js.map