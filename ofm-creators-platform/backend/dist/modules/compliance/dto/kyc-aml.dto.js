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
exports.MoneyLaunderingRiskDto = exports.AuditFindingDto = exports.ComplianceAuditDto = exports.TaxComplianceDto = exports.SanctionScreeningResultDto = exports.DueDiligenceCheckDto = exports.EnhancedDueDiligenceDto = exports.TransactionMonitoringDto = exports.ComplianceReportDto = exports.SuspiciousActivityDto = exports.RiskAssessmentDto = exports.AmlScreeningDto = exports.KycDocumentDto = exports.KycVerificationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class KycVerificationDto {
    verificationType;
    level;
    personalInfo;
    referenceId;
}
exports.KycVerificationDto = KycVerificationDto;
__decorate([
    (0, class_validator_1.IsEnum)(['basic', 'enhanced', 'full']),
    __metadata("design:type", String)
], KycVerificationDto.prototype, "verificationType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KycVerificationDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], KycVerificationDto.prototype, "personalInfo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KycVerificationDto.prototype, "referenceId", void 0);
class KycDocumentDto {
    documentType;
    documentNumber;
    expiryDate;
    issuingCountry;
    metadata;
}
exports.KycDocumentDto = KycDocumentDto;
__decorate([
    (0, class_validator_1.IsEnum)(['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement', 'business_license']),
    __metadata("design:type", String)
], KycDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KycDocumentDto.prototype, "documentNumber", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], KycDocumentDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KycDocumentDto.prototype, "issuingCountry", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], KycDocumentDto.prototype, "metadata", void 0);
class AmlScreeningDto {
    creatorId;
    screeningType = 'standard';
    additionalNames;
    countries;
    includePep = true;
    includeSanctions = true;
    includeAdverseMedia = true;
}
exports.AmlScreeningDto = AmlScreeningDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmlScreeningDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['standard', 'enhanced', 'continuous']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AmlScreeningDto.prototype, "screeningType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AmlScreeningDto.prototype, "additionalNames", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AmlScreeningDto.prototype, "countries", void 0);
__decorate([
    IsBoolean(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AmlScreeningDto.prototype, "includePep", void 0);
__decorate([
    IsBoolean(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AmlScreeningDto.prototype, "includeSanctions", void 0);
__decorate([
    IsBoolean(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AmlScreeningDto.prototype, "includeAdverseMedia", void 0);
class RiskAssessmentDto {
    assessmentType = 'periodic';
    riskFactors;
    additionalData;
}
exports.RiskAssessmentDto = RiskAssessmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RiskAssessmentDto.prototype, "assessmentType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], RiskAssessmentDto.prototype, "riskFactors", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RiskAssessmentDto.prototype, "additionalData", void 0);
class SuspiciousActivityDto {
    creatorId;
    activityType;
    description;
    severity;
    occurredAt;
    evidence;
    reportedBy;
    transactionIds;
}
exports.SuspiciousActivityDto = SuspiciousActivityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuspiciousActivityDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['unusual_pattern', 'large_transaction', 'rapid_movement', 'suspicious_parties', 'money_laundering', 'terrorist_financing', 'other']),
    __metadata("design:type", String)
], SuspiciousActivityDto.prototype, "activityType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuspiciousActivityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], SuspiciousActivityDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], SuspiciousActivityDto.prototype, "occurredAt", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SuspiciousActivityDto.prototype, "evidence", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SuspiciousActivityDto.prototype, "reportedBy", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SuspiciousActivityDto.prototype, "transactionIds", void 0);
class ComplianceReportDto {
    reportId;
    creatorId;
    period;
    generatedAt;
    kycStatus;
    amlStatus;
    transactionSummary;
    suspiciousActivities;
    redFlags;
    complianceMetrics;
    recommendations;
}
exports.ComplianceReportDto = ComplianceReportDto;
class TransactionMonitoringDto {
    transactionId;
    creatorId;
    amount;
    currency;
    direction;
    counterparty;
    metadata;
}
exports.TransactionMonitoringDto = TransactionMonitoringDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionMonitoringDto.prototype, "transactionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionMonitoringDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransactionMonitoringDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionMonitoringDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['incoming', 'outgoing']),
    __metadata("design:type", String)
], TransactionMonitoringDto.prototype, "direction", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TransactionMonitoringDto.prototype, "counterparty", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TransactionMonitoringDto.prototype, "metadata", void 0);
class EnhancedDueDiligenceDto {
    creatorId;
    reason;
    checks;
    sourceOfWealth;
    businessStructure;
}
exports.EnhancedDueDiligenceDto = EnhancedDueDiligenceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnhancedDueDiligenceDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnhancedDueDiligenceDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DueDiligenceCheckDto),
    __metadata("design:type", Array)
], EnhancedDueDiligenceDto.prototype, "checks", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EnhancedDueDiligenceDto.prototype, "sourceOfWealth", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EnhancedDueDiligenceDto.prototype, "businessStructure", void 0);
class DueDiligenceCheckDto {
    checkType;
    status;
    performedAt;
    notes;
    documents;
}
exports.DueDiligenceCheckDto = DueDiligenceCheckDto;
__decorate([
    (0, class_validator_1.IsEnum)(['identity', 'address', 'source_of_funds', 'business_verification', 'reference_check']),
    __metadata("design:type", String)
], DueDiligenceCheckDto.prototype, "checkType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['pending', 'passed', 'failed', 'requires_review']),
    __metadata("design:type", String)
], DueDiligenceCheckDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], DueDiligenceCheckDto.prototype, "performedAt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DueDiligenceCheckDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DueDiligenceCheckDto.prototype, "documents", void 0);
class SanctionScreeningResultDto {
    screeningId;
    creatorId;
    performedAt;
    results;
    overallRisk;
    requiresManualReview;
}
exports.SanctionScreeningResultDto = SanctionScreeningResultDto;
class TaxComplianceDto {
    creatorId;
    taxYear;
    taxInformation;
    forms;
    reportableIncome;
    withholdingRequired;
}
exports.TaxComplianceDto = TaxComplianceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaxComplianceDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaxComplianceDto.prototype, "taxYear", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TaxComplianceDto.prototype, "taxInformation", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TaxComplianceDto.prototype, "forms", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TaxComplianceDto.prototype, "reportableIncome", void 0);
__decorate([
    IsBoolean(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaxComplianceDto.prototype, "withholdingRequired", void 0);
class ComplianceAuditDto {
    auditId;
    creatorId;
    auditType;
    startDate;
    endDate;
    findings;
    auditor;
    result;
    recommendations;
}
exports.ComplianceAuditDto = ComplianceAuditDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceAuditDto.prototype, "auditId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceAuditDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['routine', 'triggered', 'regulatory']),
    __metadata("design:type", String)
], ComplianceAuditDto.prototype, "auditType", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ComplianceAuditDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ComplianceAuditDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AuditFindingDto),
    __metadata("design:type", Array)
], ComplianceAuditDto.prototype, "findings", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceAuditDto.prototype, "auditor", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['passed', 'passed_with_conditions', 'failed']),
    __metadata("design:type", String)
], ComplianceAuditDto.prototype, "result", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ComplianceAuditDto.prototype, "recommendations", void 0);
class AuditFindingDto {
    area;
    severity;
    description;
    remediation;
    dueDate;
}
exports.AuditFindingDto = AuditFindingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditFindingDto.prototype, "area", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['compliant', 'minor_issue', 'major_issue', 'critical']),
    __metadata("design:type", String)
], AuditFindingDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditFindingDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AuditFindingDto.prototype, "remediation", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], AuditFindingDto.prototype, "dueDate", void 0);
class MoneyLaunderingRiskDto {
    creatorId;
    assessmentDate;
    riskFactors;
    overallRiskScore;
    riskLevel;
    mitigationMeasures;
    monitoringFrequency;
    nextReviewDate;
}
exports.MoneyLaunderingRiskDto = MoneyLaunderingRiskDto;
//# sourceMappingURL=kyc-aml.dto.js.map