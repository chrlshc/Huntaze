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
exports.LocalizationValidationDto = exports.GeoLocationDto = exports.LocalizedContentDto = exports.PricingLocalizationDto = exports.LocalizationContextDto = exports.TranslationExportDto = exports.TranslationImportDto = exports.LanguageDetectionDto = exports.TimezoneDto = exports.CountryInfoDto = exports.LocalePreferenceDto = exports.BulkTranslationDto = exports.TranslationDto = exports.CurrencyDto = exports.LocaleDto = exports.ConvertCurrencyDto = exports.FormatCurrencyDto = exports.FormatNumberDto = exports.FormatDateDto = exports.TranslatePluralDto = exports.TranslateDto = void 0;
const class_validator_1 = require("class-validator");
class TranslateDto {
    key;
    locale;
    params;
}
exports.TranslateDto = TranslateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslateDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranslateDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TranslateDto.prototype, "params", void 0);
class TranslatePluralDto extends TranslateDto {
    count;
}
exports.TranslatePluralDto = TranslatePluralDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], TranslatePluralDto.prototype, "count", void 0);
class FormatDateDto {
    date;
    locale;
    format;
}
exports.FormatDateDto = FormatDateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormatDateDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormatDateDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormatDateDto.prototype, "format", void 0);
class FormatNumberDto {
    value;
    locale;
    decimals;
}
exports.FormatNumberDto = FormatNumberDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FormatNumberDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormatNumberDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], FormatNumberDto.prototype, "decimals", void 0);
class FormatCurrencyDto {
    amount;
    currency;
    locale;
}
exports.FormatCurrencyDto = FormatCurrencyDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FormatCurrencyDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormatCurrencyDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormatCurrencyDto.prototype, "locale", void 0);
class ConvertCurrencyDto {
    amount;
    fromCurrency;
    toCurrency;
}
exports.ConvertCurrencyDto = ConvertCurrencyDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConvertCurrencyDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertCurrencyDto.prototype, "fromCurrency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConvertCurrencyDto.prototype, "toCurrency", void 0);
class LocaleDto {
    code;
    name;
    nativeName;
    direction;
    isDefault;
}
exports.LocaleDto = LocaleDto;
class CurrencyDto {
    code;
    symbol;
    name;
    precision;
    rate;
    updatedAt;
}
exports.CurrencyDto = CurrencyDto;
class TranslationDto {
    locale;
    key;
    value;
    context;
    namespace;
}
exports.TranslationDto = TranslationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslationDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslationDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslationDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranslationDto.prototype, "context", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranslationDto.prototype, "namespace", void 0);
class BulkTranslationDto {
    locale;
    translations;
}
exports.BulkTranslationDto = BulkTranslationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkTranslationDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BulkTranslationDto.prototype, "translations", void 0);
class LocalePreferenceDto {
    locale;
    currency;
    timezone;
    timeFormat;
    dateFormat;
}
exports.LocalePreferenceDto = LocalePreferenceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LocalePreferenceDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LocalePreferenceDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LocalePreferenceDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['12h', '24h']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LocalePreferenceDto.prototype, "timeFormat", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LocalePreferenceDto.prototype, "dateFormat", void 0);
class CountryInfoDto {
    code;
    name;
    nativeName;
    capital;
    region;
    currency;
    languages;
    timezones;
    phoneCode;
    flag;
}
exports.CountryInfoDto = CountryInfoDto;
class TimezoneDto {
    name;
    offset;
    offsetMinutes;
    isDst;
    abbreviation;
}
exports.TimezoneDto = TimezoneDto;
class LanguageDetectionDto {
    text;
    hints;
}
exports.LanguageDetectionDto = LanguageDetectionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LanguageDetectionDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LanguageDetectionDto.prototype, "hints", void 0);
class TranslationImportDto {
    locale;
    format;
    content;
    overwrite = false;
}
exports.TranslationImportDto = TranslationImportDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslationImportDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['json', 'csv', 'xliff', 'po']),
    __metadata("design:type", String)
], TranslationImportDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslationImportDto.prototype, "content", void 0);
__decorate([
    IsBoolean(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TranslationImportDto.prototype, "overwrite", void 0);
class TranslationExportDto {
    locale;
    format;
    namespace;
    keys;
}
exports.TranslationExportDto = TranslationExportDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslationExportDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['json', 'csv', 'xliff', 'po']),
    __metadata("design:type", String)
], TranslationExportDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranslationExportDto.prototype, "namespace", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TranslationExportDto.prototype, "keys", void 0);
class LocalizationContextDto {
    locale;
    currency;
    timezone;
    country;
    region;
    user;
    device;
    location;
}
exports.LocalizationContextDto = LocalizationContextDto;
class PricingLocalizationDto {
    basePrice;
    baseCurrency;
    targetCurrencies;
    strategy = 'dynamic';
    adjustments; // Country-specific adjustments
}
exports.PricingLocalizationDto = PricingLocalizationDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PricingLocalizationDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PricingLocalizationDto.prototype, "baseCurrency", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PricingLocalizationDto.prototype, "targetCurrencies", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['fixed', 'dynamic', 'ppp']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PricingLocalizationDto.prototype, "strategy", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PricingLocalizationDto.prototype, "adjustments", void 0);
class LocalizedContentDto {
    contentId;
    contentType;
    translations;
    defaultLocale;
}
exports.LocalizedContentDto = LocalizedContentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LocalizedContentDto.prototype, "contentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LocalizedContentDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LocalizedContentDto.prototype, "translations", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LocalizedContentDto.prototype, "defaultLocale", void 0);
class GeoLocationDto {
    ip;
    latitude;
    longitude;
    country;
    region;
    city;
    postalCode;
}
exports.GeoLocationDto = GeoLocationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GeoLocationDto.prototype, "ip", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GeoLocationDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GeoLocationDto.prototype, "region", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GeoLocationDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GeoLocationDto.prototype, "postalCode", void 0);
class LocalizationValidationDto {
    locale;
    data;
}
exports.LocalizationValidationDto = LocalizationValidationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LocalizationValidationDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LocalizationValidationDto.prototype, "data", void 0);
//# sourceMappingURL=i18n.dto.js.map