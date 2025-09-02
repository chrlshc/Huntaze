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
exports.DataMinimizationReportDto = exports.RightToObjectDto = exports.DataPortabilityRequestDto = exports.CookieConsentDto = exports.PrivacyRiskDto = exports.PrivacyImpactAssessmentDto = exports.DataRetentionPolicyDto = exports.DataAccessRequestDto = exports.ConsentHistoryDto = exports.DataBreachNotificationDto = exports.PrivacyReportDto = exports.DataDeletionRequestDto = exports.DataExportRequestDto = exports.ConsentUpdateDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ConsentUpdateDto {
    consents;
    version;
    metadata;
}
exports.ConsentUpdateDto = ConsentUpdateDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ConsentUpdateDto.prototype, "consents", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConsentUpdateDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsentUpdateDto.prototype, "metadata", void 0);
class DataExportRequestDto {
    categories = ['all'];
    format = 'json';
    password;
    includeMetadata = true;
}
exports.DataExportRequestDto = DataExportRequestDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DataExportRequestDto.prototype, "categories", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DataExportRequestDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DataExportRequestDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DataExportRequestDto.prototype, "includeMetadata", void 0);
class DataDeletionRequestDto {
    categories;
    reason;
    anonymize = true;
    immediate = false;
}
exports.DataDeletionRequestDto = DataDeletionRequestDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DataDeletionRequestDto.prototype, "categories", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataDeletionRequestDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DataDeletionRequestDto.prototype, "anonymize", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DataDeletionRequestDto.prototype, "immediate", void 0);
class PrivacyReportDto {
    generatedAt;
    user;
    consents;
    dataCategories;
    thirdPartySharing;
    retentionInfo;
    rights;
    contactInfo;
}
exports.PrivacyReportDto = PrivacyReportDto;
class DataBreachNotificationDto {
    severity;
    affectedDataTypes;
    discoveredAt;
    description;
    affectedUserCriteria;
    recommendations;
}
exports.DataBreachNotificationDto = DataBreachNotificationDto;
__decorate([
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], DataBreachNotificationDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DataBreachNotificationDto.prototype, "affectedDataTypes", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], DataBreachNotificationDto.prototype, "discoveredAt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataBreachNotificationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], DataBreachNotificationDto.prototype, "affectedUserCriteria", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DataBreachNotificationDto.prototype, "recommendations", void 0);
class ConsentHistoryDto {
    userId;
    userType;
    history;
    currentConsents;
}
exports.ConsentHistoryDto = ConsentHistoryDto;
class DataAccessRequestDto {
    requestId;
    userId;
    userType;
    purpose;
    dataCategories;
    requestedAt;
    status;
    approvedBy;
    completedAt;
}
exports.DataAccessRequestDto = DataAccessRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataAccessRequestDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataAccessRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataAccessRequestDto.prototype, "userType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataAccessRequestDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DataAccessRequestDto.prototype, "dataCategories", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], DataAccessRequestDto.prototype, "requestedAt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataAccessRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DataAccessRequestDto.prototype, "approvedBy", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], DataAccessRequestDto.prototype, "completedAt", void 0);
class DataRetentionPolicyDto {
    dataType;
    retentionPeriod;
    legalBasis;
    automaticDeletion = false;
    exceptions;
}
exports.DataRetentionPolicyDto = DataRetentionPolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataRetentionPolicyDto.prototype, "dataType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataRetentionPolicyDto.prototype, "retentionPeriod", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataRetentionPolicyDto.prototype, "legalBasis", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DataRetentionPolicyDto.prototype, "automaticDeletion", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DataRetentionPolicyDto.prototype, "exceptions", void 0);
class PrivacyImpactAssessmentDto {
    projectName;
    description;
    dataTypes;
    purposes;
    riskLevel;
    risks;
    mitigations;
    assessmentDate;
    assessedBy;
}
exports.PrivacyImpactAssessmentDto = PrivacyImpactAssessmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrivacyImpactAssessmentDto.prototype, "projectName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrivacyImpactAssessmentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PrivacyImpactAssessmentDto.prototype, "dataTypes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PrivacyImpactAssessmentDto.prototype, "purposes", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high']),
    __metadata("design:type", String)
], PrivacyImpactAssessmentDto.prototype, "riskLevel", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PrivacyRiskDto),
    __metadata("design:type", Array)
], PrivacyImpactAssessmentDto.prototype, "risks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PrivacyImpactAssessmentDto.prototype, "mitigations", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], PrivacyImpactAssessmentDto.prototype, "assessmentDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrivacyImpactAssessmentDto.prototype, "assessedBy", void 0);
class PrivacyRiskDto {
    risk;
    severity;
    likelihood;
    impact;
    mitigation;
}
exports.PrivacyRiskDto = PrivacyRiskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrivacyRiskDto.prototype, "risk", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], PrivacyRiskDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['unlikely', 'possible', 'likely', 'certain']),
    __metadata("design:type", String)
], PrivacyRiskDto.prototype, "likelihood", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PrivacyRiskDto.prototype, "impact", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrivacyRiskDto.prototype, "mitigation", void 0);
class CookieConsentDto {
    necessary = true; // Always true
    functional;
    analytics;
    marketing;
    consentId;
    expiresAt;
}
exports.CookieConsentDto = CookieConsentDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CookieConsentDto.prototype, "necessary", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CookieConsentDto.prototype, "functional", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CookieConsentDto.prototype, "analytics", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CookieConsentDto.prototype, "marketing", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CookieConsentDto.prototype, "consentId", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CookieConsentDto.prototype, "expiresAt", void 0);
class DataPortabilityRequestDto {
    userId;
    userType;
    targetService;
    transferMethod;
    dataCategories;
    format = 'json';
}
exports.DataPortabilityRequestDto = DataPortabilityRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataPortabilityRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DataPortabilityRequestDto.prototype, "userType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DataPortabilityRequestDto.prototype, "targetService", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['direct_download', 'transfer_to_service']),
    __metadata("design:type", String)
], DataPortabilityRequestDto.prototype, "transferMethod", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DataPortabilityRequestDto.prototype, "dataCategories", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DataPortabilityRequestDto.prototype, "format", void 0);
class RightToObjectDto {
    userId;
    userType;
    objectionType;
    reason;
    specificProcessing;
}
exports.RightToObjectDto = RightToObjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RightToObjectDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RightToObjectDto.prototype, "userType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['processing', 'direct_marketing', 'profiling', 'automated_decision']),
    __metadata("design:type", String)
], RightToObjectDto.prototype, "objectionType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RightToObjectDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], RightToObjectDto.prototype, "specificProcessing", void 0);
class DataMinimizationReportDto {
    reportId;
    generatedAt;
    summary;
    byCategory;
    recommendations;
}
exports.DataMinimizationReportDto = DataMinimizationReportDto;
//# sourceMappingURL=gdpr.dto.js.map