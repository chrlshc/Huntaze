import { ConfigService } from '@nestjs/config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { HttpService } from '@nestjs/axios';
interface Translation {
    [key: string]: string | Translation;
}
export declare class I18nService {
    private readonly config;
    private readonly cache;
    private readonly http;
    private translations;
    private localeConfigs;
    private currencyRates;
    private dateLocales;
    private readonly supportedLocales;
    private readonly currencyPrecision;
    constructor(config: ConfigService, cache: CacheService, http: HttpService);
    /**
     * Initialise les configurations de locale
     */
    private initializeLocales;
    /**
     * Charge les traductions
     */
    private loadTranslations;
    /**
     * Met à jour les taux de change
     */
    private updateCurrencyRates;
    /**
     * Traduit une clé
     */
    translate(key: string, locale?: string, params?: Record<string, any>): string;
    /**
     * Traduit avec pluralisation
     */
    translatePlural(key: string, count: number, locale?: string, params?: Record<string, any>): string;
    /**
     * Formate une date selon la locale
     */
    formatDate(date: Date | string | number, locale?: string, formatStr?: string): string;
    /**
     * Formate une heure selon la locale
     */
    formatTime(date: Date | string | number, locale?: string, formatStr?: string): string;
    /**
     * Formate un nombre selon la locale
     */
    formatNumber(value: number, locale?: string, decimals?: number): string;
    /**
     * Formate une devise
     */
    formatCurrency(amount: number, currency: string, locale?: string): string;
    /**
     * Convertit une devise
     */
    convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
    /**
     * Obtient la liste des locales supportées
     */
    getSupportedLocales(): Array<{
        code: string;
        name: string;
        nativeName: string;
        direction: 'ltr' | 'rtl';
    }>;
    /**
     * Obtient la liste des devises supportées
     */
    getSupportedCurrencies(): Array<{
        code: string;
        symbol: string;
        name: string;
    }>;
    /**
     * Détecte la locale depuis les headers HTTP
     */
    detectLocale(acceptLanguageHeader?: string): string;
    /**
     * Obtient les traductions pour une locale
     */
    getTranslations(locale?: string): Translation;
    /**
     * Ajoute ou met à jour une traduction
     */
    setTranslation(locale: string, key: string, value: string): Promise<void>;
    /**
     * Obtient les métadonnées de localisation pour un pays
     */
    getCountryInfo(countryCode: string): {
        name: string;
        currency: string;
        languages: string[];
        timezone: string;
        phoneCode: string;
    } | null;
    private getNestedTranslation;
    private getPluralKey;
    private getCurrencyConfig;
    private setDefaultCurrencyRates;
    private loadTranslationFile;
}
export {};
//# sourceMappingURL=i18n.service.d.ts.map