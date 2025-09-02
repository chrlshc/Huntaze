export declare class TranslateDto {
    key: string;
    locale?: string;
    params?: Record<string, any>;
}
export declare class TranslatePluralDto extends TranslateDto {
    count: number;
}
export declare class FormatDateDto {
    date: string;
    locale?: string;
    format?: string;
}
export declare class FormatNumberDto {
    value: number;
    locale?: string;
    decimals?: number;
}
export declare class FormatCurrencyDto {
    amount: number;
    currency: string;
    locale?: string;
}
export declare class ConvertCurrencyDto {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
}
export declare class LocaleDto {
    code: string;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
    isDefault?: boolean;
}
export declare class CurrencyDto {
    code: string;
    symbol: string;
    name: string;
    precision: number;
    rate?: number;
    updatedAt?: Date;
}
export declare class TranslationDto {
    locale: string;
    key: string;
    value: string;
    context?: string;
    namespace?: string;
}
export declare class BulkTranslationDto {
    locale: string;
    translations: Array<{
        key: string;
        value: string;
        context?: string;
    }>;
}
export declare class LocalePreferenceDto {
    locale?: string;
    currency?: string;
    timezone?: string;
    timeFormat?: '12h' | '24h';
    dateFormat?: string;
}
export declare class CountryInfoDto {
    code: string;
    name: string;
    nativeName: string;
    capital: string;
    region: string;
    currency: string;
    languages: string[];
    timezones: string[];
    phoneCode: string;
    flag: string;
}
export declare class TimezoneDto {
    name: string;
    offset: string;
    offsetMinutes: number;
    isDst: boolean;
    abbreviation: string;
}
export declare class LanguageDetectionDto {
    text: string;
    hints?: string[];
}
export declare class TranslationImportDto {
    locale: string;
    format: string;
    content: string;
    overwrite?: boolean;
}
export declare class TranslationExportDto {
    locale: string;
    format: string;
    namespace?: string;
    keys?: string[];
}
export declare class LocalizationContextDto {
    locale: string;
    currency: string;
    timezone: string;
    country: string;
    region?: string;
    user?: {
        id: string;
        type: 'creator' | 'fan';
        preferences?: LocalePreferenceDto;
    };
    device?: {
        type: 'desktop' | 'mobile' | 'tablet';
        os: string;
        browser: string;
    };
    location?: {
        country: string;
        region?: string;
        city?: string;
        ip?: string;
    };
}
export declare class PricingLocalizationDto {
    basePrice: number;
    baseCurrency: string;
    targetCurrencies: string[];
    strategy?: 'fixed' | 'dynamic' | 'ppp';
    adjustments?: Record<string, number>;
}
export declare class LocalizedContentDto {
    contentId: string;
    contentType: 'product' | 'plan' | 'campaign' | 'page';
    translations: Record<string, {
        title?: string;
        description?: string;
        content?: string;
        metadata?: Record<string, any>;
    }>;
    defaultLocale: string;
}
export declare class GeoLocationDto {
    ip?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    region?: string;
    city?: string;
    postalCode?: string;
}
export declare class LocalizationValidationDto {
    locale: string;
    data: {
        phoneNumber?: string;
        postalCode?: string;
        vatNumber?: string;
        bankAccount?: string;
        nationalId?: string;
    };
}
//# sourceMappingURL=i18n.dto.d.ts.map