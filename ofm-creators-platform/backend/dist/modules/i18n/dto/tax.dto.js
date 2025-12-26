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
exports.JurisdictionDto = exports.MarketplaceFacilitatorDto = exports.TaxTransactionDto = exports.TaxSettingsDto = exports.TaxComplianceCheckDto = exports.NexusDto = exports.TaxRateUpdateDto = exports.TaxInvoiceDto = exports.TaxExemptionDto = exports.VatValidationDto = exports.TaxConfigDto = exports.TaxReportDto = exports.TaxRateDto = exports.TaxCalculationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TaxCalculationDto {
    amount;
    country;
    state;
    type;
    sellerCountry;
    sellerState;
    vatNumber;
    productType;
    annualRevenue;
    isB2B;
}
exports.TaxCalculationDto = TaxCalculationDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], TaxCalculationDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['product', 'service', 'digital_service', 'subscription']),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "sellerCountry", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "sellerState", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "vatNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxCalculationDto.prototype, "productType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TaxCalculationDto.prototype, "annualRevenue", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaxCalculationDto.prototype, "isB2B", void 0);
class TaxRateDto {
    country;
    state;
    rate;
    type;
    digitalServicesRate;
    threshold;
    exemptions;
    effectiveDate;
    notes;
}
exports.TaxRateDto = TaxRateDto;
class TaxReportDto {
    reportId;
    creatorId;
    period;
    generatedAt;
    summary;
    byCountry;
    byTaxType;
    remittance;
    forms;
    nexus;
}
exports.TaxReportDto = TaxReportDto;
class TaxConfigDto {
    creatorId;
    businessCountry;
    businessState;
    vatNumber;
    taxIdNumber;
    nexus;
    settings;
    exemptions;
}
exports.TaxConfigDto = TaxConfigDto;
class VatValidationDto {
    vatNumber;
    countryCode;
    requesterVatNumber;
}
exports.VatValidationDto = VatValidationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VatValidationDto.prototype, "vatNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VatValidationDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VatValidationDto.prototype, "requesterVatNumber", void 0);
class TaxExemptionDto {
    certificateId;
    type;
    reason;
    jurisdiction;
    validFrom;
    validUntil;
    documentUrl;
}
exports.TaxExemptionDto = TaxExemptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxExemptionDto.prototype, "certificateId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['resale', 'nonprofit', 'government', 'education', 'other']),
    __metadata("design:type", String)
], TaxExemptionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaxExemptionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxExemptionDto.prototype, "jurisdiction", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], TaxExemptionDto.prototype, "validFrom", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], TaxExemptionDto.prototype, "validUntil", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxExemptionDto.prototype, "documentUrl", void 0);
class TaxInvoiceDto {
    invoiceId;
    invoiceNumber;
    issueDate;
    seller;
    buyer;
    items;
    totals;
    taxBreakdown;
    currency;
    language;
    notes;
}
exports.TaxInvoiceDto = TaxInvoiceDto;
class TaxRateUpdateDto {
    country;
    state;
    rate;
    type;
    digitalServicesRate;
    effectiveDate;
    notes;
}
exports.TaxRateUpdateDto = TaxRateUpdateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaxRateUpdateDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxRateUpdateDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    Max(100),
    __metadata("design:type", Number)
], TaxRateUpdateDto.prototype, "rate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['vat', 'gst', 'sales', 'digital']),
    __metadata("design:type", String)
], TaxRateUpdateDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TaxRateUpdateDto.prototype, "digitalServicesRate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], TaxRateUpdateDto.prototype, "effectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxRateUpdateDto.prototype, "notes", void 0);
class NexusDto {
    country;
    state;
    type;
    establishedDate;
    economicThreshold;
    transactionThreshold;
    autoMonitor;
}
exports.NexusDto = NexusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NexusDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NexusDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['physical', 'economic', 'click_through', 'marketplace']),
    __metadata("design:type", String)
], NexusDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], NexusDto.prototype, "establishedDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], NexusDto.prototype, "economicThreshold", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], NexusDto.prototype, "transactionThreshold", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], NexusDto.prototype, "autoMonitor", void 0);
class TaxComplianceCheckDto {
    creatorId;
    countries;
    includeUpcoming;
    asOfDate;
}
exports.TaxComplianceCheckDto = TaxComplianceCheckDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaxComplianceCheckDto.prototype, "creatorId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TaxComplianceCheckDto.prototype, "countries", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaxComplianceCheckDto.prototype, "includeUpcoming", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], TaxComplianceCheckDto.prototype, "asOfDate", void 0);
class TaxSettingsDto {
    autoCalculate;
    includeTaxInPrice;
    roundingMode;
    defaultTaxCode;
    collectTaxId;
    enabledCountries;
}
exports.TaxSettingsDto = TaxSettingsDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaxSettingsDto.prototype, "autoCalculate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaxSettingsDto.prototype, "includeTaxInPrice", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['normal', 'round_up', 'round_down']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxSettingsDto.prototype, "roundingMode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaxSettingsDto.prototype, "defaultTaxCode", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaxSettingsDto.prototype, "collectTaxId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TaxSettingsDto.prototype, "enabledCountries", void 0);
class TaxTransactionDto {
    transactionId;
    creatorId;
    date;
    amount;
    location;
    taxDetails;
    customer;
    invoice;
}
exports.TaxTransactionDto = TaxTransactionDto;
class MarketplaceFacilitatorDto {
    marketplaceId;
    name;
    jurisdictions;
    settings;
}
exports.MarketplaceFacilitatorDto = MarketplaceFacilitatorDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketplaceFacilitatorDto.prototype, "marketplaceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketplaceFacilitatorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JurisdictionDto),
    __metadata("design:type", Array)
], MarketplaceFacilitatorDto.prototype, "jurisdictions", void 0);
__decorate([
    IsObject(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MarketplaceFacilitatorDto.prototype, "settings", void 0);
class JurisdictionDto {
    country;
    state;
    threshold;
    isActive;
}
exports.JurisdictionDto = JurisdictionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JurisdictionDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], JurisdictionDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], JurisdictionDto.prototype, "threshold", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], JurisdictionDto.prototype, "isActive", void 0);
//# sourceMappingURL=tax.dto.js.map