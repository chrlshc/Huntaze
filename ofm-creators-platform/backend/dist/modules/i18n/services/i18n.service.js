"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const path = __importStar(require("path"));
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
let I18nService = class I18nService {
    config;
    cache;
    http;
    translations = new Map();
    localeConfigs = new Map();
    currencyRates = new Map();
    dateLocales = new Map();
    supportedLocales = [
        'en-US', 'en-GB', 'fr-FR', 'es-ES', 'de-DE',
        'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN',
        'ar-SA', 'ru-RU'
    ];
    currencyPrecision = {
        USD: 2, EUR: 2, GBP: 2, JPY: 0, CAD: 2,
        AUD: 2, CHF: 2, CNY: 2, SEK: 2, NZD: 2,
        MXN: 2, SGD: 2, HKD: 2, NOK: 2, KRW: 0,
        TRY: 2, RUB: 2, INR: 2, BRL: 2, ZAR: 2
    };
    constructor(config, cache, http) {
        this.config = config;
        this.cache = cache;
        this.http = http;
        this.initializeLocales();
        this.loadTranslations();
        this.updateCurrencyRates();
    }
    /**
     * Initialise les configurations de locale
     */
    initializeLocales() {
        // Date locales
        this.dateLocales.set('en-US', locale_1.enUS);
        this.dateLocales.set('fr-FR', locale_1.fr);
        this.dateLocales.set('es-ES', locale_1.es);
        this.dateLocales.set('de-DE', locale_1.de);
        this.dateLocales.set('it-IT', locale_1.it);
        this.dateLocales.set('pt-BR', locale_1.pt);
        this.dateLocales.set('ja-JP', locale_1.ja);
        this.dateLocales.set('ko-KR', locale_1.ko);
        this.dateLocales.set('zh-CN', locale_1.zhCN);
        this.dateLocales.set('ar-SA', locale_1.ar);
        this.dateLocales.set('ru-RU', locale_1.ru);
        // Locale configs
        const configs = [
            {
                code: 'en-US',
                name: 'English (US)',
                nativeName: 'English',
                direction: 'ltr',
                dateFormat: 'MM/dd/yyyy',
                timeFormat: 'h:mm a',
                currency: {
                    code: 'USD',
                    symbol: '$',
                    position: 'before',
                    decimals: 2,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                },
                numberFormat: {
                    decimals: 2,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                }
            },
            {
                code: 'en-GB',
                name: 'English (UK)',
                nativeName: 'English',
                direction: 'ltr',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                currency: {
                    code: 'GBP',
                    symbol: '£',
                    position: 'before',
                    decimals: 2,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                },
                numberFormat: {
                    decimals: 2,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                }
            },
            {
                code: 'fr-FR',
                name: 'French',
                nativeName: 'Français',
                direction: 'ltr',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                currency: {
                    code: 'EUR',
                    symbol: '€',
                    position: 'after',
                    decimals: 2,
                    thousandSeparator: ' ',
                    decimalSeparator: ','
                },
                numberFormat: {
                    decimals: 2,
                    thousandSeparator: ' ',
                    decimalSeparator: ','
                }
            },
            {
                code: 'es-ES',
                name: 'Spanish',
                nativeName: 'Español',
                direction: 'ltr',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                currency: {
                    code: 'EUR',
                    symbol: '€',
                    position: 'after',
                    decimals: 2,
                    thousandSeparator: '.',
                    decimalSeparator: ','
                },
                numberFormat: {
                    decimals: 2,
                    thousandSeparator: '.',
                    decimalSeparator: ','
                }
            },
            {
                code: 'de-DE',
                name: 'German',
                nativeName: 'Deutsch',
                direction: 'ltr',
                dateFormat: 'dd.MM.yyyy',
                timeFormat: 'HH:mm',
                currency: {
                    code: 'EUR',
                    symbol: '€',
                    position: 'after',
                    decimals: 2,
                    thousandSeparator: '.',
                    decimalSeparator: ','
                },
                numberFormat: {
                    decimals: 2,
                    thousandSeparator: '.',
                    decimalSeparator: ','
                }
            },
            {
                code: 'ja-JP',
                name: 'Japanese',
                nativeName: '日本語',
                direction: 'ltr',
                dateFormat: 'yyyy/MM/dd',
                timeFormat: 'HH:mm',
                currency: {
                    code: 'JPY',
                    symbol: '¥',
                    position: 'before',
                    decimals: 0,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                },
                numberFormat: {
                    decimals: 0,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                }
            },
            {
                code: 'ar-SA',
                name: 'Arabic',
                nativeName: 'العربية',
                direction: 'rtl',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                currency: {
                    code: 'SAR',
                    symbol: 'ر.س',
                    position: 'after',
                    decimals: 2,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                },
                numberFormat: {
                    decimals: 2,
                    thousandSeparator: ',',
                    decimalSeparator: '.'
                }
            }
        ];
        configs.forEach(config => {
            this.localeConfigs.set(config.code, config);
        });
    }
    /**
     * Charge les traductions
     */
    async loadTranslations() {
        for (const locale of this.supportedLocales) {
            try {
                const translationPath = path.join(__dirname, '..', 'locales', `${locale}.json`);
                // En production, charger depuis un CDN ou une base de données
                const translations = await this.loadTranslationFile(locale);
                this.translations.set(locale, translations);
            }
            catch (error) {
                console.error(`Failed to load translations for ${locale}:`, error);
            }
        }
    }
    /**
     * Met à jour les taux de change
     */
    async updateCurrencyRates() {
        try {
            // Utiliser un service de taux de change (ex: exchangerate-api.com)
            const response = await (0, rxjs_1.firstValueFrom)(this.http.get(`https://api.exchangerate-api.com/v4/latest/USD`));
            const rates = response.data.rates;
            const updatedAt = new Date();
            Object.entries(rates).forEach(([code, rate]) => {
                this.currencyRates.set(code, {
                    code,
                    rate: rate,
                    updatedAt
                });
            });
            // Mettre en cache
            await this.cache.set('currency:rates', rates, 3600); // 1 heure
            // Programmer la prochaine mise à jour
            setTimeout(() => this.updateCurrencyRates(), 3600000); // 1 heure
        }
        catch (error) {
            console.error('Failed to update currency rates:', error);
            // Utiliser des taux par défaut en cas d'erreur
            this.setDefaultCurrencyRates();
        }
    }
    /**
     * Traduit une clé
     */
    translate(key, locale = 'en-US', params) {
        const translations = this.translations.get(locale) || this.translations.get('en-US');
        if (!translations) {
            return key;
        }
        let translation = this.getNestedTranslation(translations, key);
        if (typeof translation !== 'string') {
            return key;
        }
        // Remplacer les paramètres
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                translation = translation.replace(`{{${param}}}`, String(value));
            });
        }
        return translation;
    }
    /**
     * Traduit avec pluralisation
     */
    translatePlural(key, count, locale = 'en-US', params) {
        const pluralKey = this.getPluralKey(key, count, locale);
        return this.translate(pluralKey, locale, { count, ...params });
    }
    /**
     * Formate une date selon la locale
     */
    formatDate(date, locale = 'en-US', formatStr) {
        const dateObj = new Date(date);
        const localeConfig = this.localeConfigs.get(locale) || this.localeConfigs.get('en-US');
        const dateLocale = this.dateLocales.get(locale) || locale_1.enUS;
        const format = formatStr || localeConfig.dateFormat;
        return (0, date_fns_1.format)(dateObj, format, { locale: dateLocale });
    }
    /**
     * Formate une heure selon la locale
     */
    formatTime(date, locale = 'en-US', formatStr) {
        const dateObj = new Date(date);
        const localeConfig = this.localeConfigs.get(locale) || this.localeConfigs.get('en-US');
        const dateLocale = this.dateLocales.get(locale) || locale_1.enUS;
        const format = formatStr || localeConfig.timeFormat;
        return (0, date_fns_1.format)(dateObj, format, { locale: dateLocale });
    }
    /**
     * Formate un nombre selon la locale
     */
    formatNumber(value, locale = 'en-US', decimals) {
        const localeConfig = this.localeConfigs.get(locale) || this.localeConfigs.get('en-US');
        const format = localeConfig.numberFormat;
        const decimalPlaces = decimals ?? format.decimals;
        const parts = value.toFixed(decimalPlaces).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandSeparator);
        return parts.join(format.decimalSeparator);
    }
    /**
     * Formate une devise
     */
    formatCurrency(amount, currency, locale = 'en-US') {
        const localeConfig = this.localeConfigs.get(locale) || this.localeConfigs.get('en-US');
        const currencyConfig = this.getCurrencyConfig(currency, locale);
        const decimals = this.currencyPrecision[currency] ?? 2;
        const formattedNumber = this.formatNumber(amount, locale, decimals);
        if (currencyConfig.position === 'before') {
            return `${currencyConfig.symbol}${formattedNumber}`;
        }
        else {
            return `${formattedNumber} ${currencyConfig.symbol}`;
        }
    }
    /**
     * Convertit une devise
     */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }
        const fromRate = this.currencyRates.get(fromCurrency);
        const toRate = this.currencyRates.get(toCurrency);
        if (!fromRate || !toRate) {
            throw new Error(`Currency rate not found for ${fromCurrency} or ${toCurrency}`);
        }
        // Convertir via USD
        const amountInUSD = amount / fromRate.rate;
        return amountInUSD * toRate.rate;
    }
    /**
     * Obtient la liste des locales supportées
     */
    getSupportedLocales() {
        return Array.from(this.localeConfigs.values()).map(config => ({
            code: config.code,
            name: config.name,
            nativeName: config.nativeName,
            direction: config.direction
        }));
    }
    /**
     * Obtient la liste des devises supportées
     */
    getSupportedCurrencies() {
        return [
            { code: 'USD', symbol: '$', name: 'US Dollar' },
            { code: 'EUR', symbol: '€', name: 'Euro' },
            { code: 'GBP', symbol: '£', name: 'British Pound' },
            { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
            { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
            { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
            { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
            { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
            { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
            { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
        ];
    }
    /**
     * Détecte la locale depuis les headers HTTP
     */
    detectLocale(acceptLanguageHeader) {
        if (!acceptLanguageHeader) {
            return 'en-US';
        }
        const languages = acceptLanguageHeader
            .split(',')
            .map(lang => {
            const [locale, q = '1'] = lang.trim().split(';q=');
            return {
                locale: locale.trim(),
                quality: parseFloat(q.replace('q=', ''))
            };
        })
            .sort((a, b) => b.quality - a.quality);
        for (const { locale } of languages) {
            // Exact match
            if (this.supportedLocales.includes(locale)) {
                return locale;
            }
            // Language match (e.g., 'en' matches 'en-US')
            const language = locale.split('-')[0];
            const match = this.supportedLocales.find(supported => supported.startsWith(language + '-'));
            if (match) {
                return match;
            }
        }
        return 'en-US';
    }
    /**
     * Obtient les traductions pour une locale
     */
    getTranslations(locale = 'en-US') {
        return this.translations.get(locale) || this.translations.get('en-US') || {};
    }
    /**
     * Ajoute ou met à jour une traduction
     */
    async setTranslation(locale, key, value) {
        let translations = this.translations.get(locale);
        if (!translations) {
            translations = {};
            this.translations.set(locale, translations);
        }
        // Définir la valeur imbriquée
        const keys = key.split('.');
        let current = translations;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        // Invalider le cache
        await this.cache.del(`translations:${locale}`);
    }
    /**
     * Obtient les métadonnées de localisation pour un pays
     */
    getCountryInfo(countryCode) {
        const countryInfo = {
            US: {
                name: 'United States',
                currency: 'USD',
                languages: ['en-US'],
                timezone: 'America/New_York',
                phoneCode: '+1'
            },
            GB: {
                name: 'United Kingdom',
                currency: 'GBP',
                languages: ['en-GB'],
                timezone: 'Europe/London',
                phoneCode: '+44'
            },
            FR: {
                name: 'France',
                currency: 'EUR',
                languages: ['fr-FR'],
                timezone: 'Europe/Paris',
                phoneCode: '+33'
            },
            DE: {
                name: 'Germany',
                currency: 'EUR',
                languages: ['de-DE'],
                timezone: 'Europe/Berlin',
                phoneCode: '+49'
            },
            ES: {
                name: 'Spain',
                currency: 'EUR',
                languages: ['es-ES'],
                timezone: 'Europe/Madrid',
                phoneCode: '+34'
            },
            JP: {
                name: 'Japan',
                currency: 'JPY',
                languages: ['ja-JP'],
                timezone: 'Asia/Tokyo',
                phoneCode: '+81'
            }
        };
        return countryInfo[countryCode] || null;
    }
    // Méthodes privées
    getNestedTranslation(translations, key) {
        const keys = key.split('.');
        let current = translations;
        for (const k of keys) {
            if (typeof current === 'object' && k in current) {
                current = current[k];
            }
            else {
                return key;
            }
        }
        return current;
    }
    getPluralKey(key, count, locale) {
        // Règles de pluralisation simplifiées
        const language = locale.split('-')[0];
        switch (language) {
            case 'fr':
            case 'es':
            case 'it':
            case 'pt':
                return count <= 1 ? `${key}.one` : `${key}.other`;
            case 'ru':
                if (count % 10 === 1 && count % 100 !== 11) {
                    return `${key}.one`;
                }
                else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
                    return `${key}.few`;
                }
                else {
                    return `${key}.other`;
                }
            case 'ja':
            case 'ko':
            case 'zh':
                return `${key}.other`; // Pas de pluriel
            default: // en
                return count === 1 ? `${key}.one` : `${key}.other`;
        }
    }
    getCurrencyConfig(currency, locale) {
        const localeConfig = this.localeConfigs.get(locale);
        // Si la devise correspond à celle de la locale, utiliser la config locale
        if (localeConfig && localeConfig.currency.code === currency) {
            return localeConfig.currency;
        }
        // Sinon, utiliser une config par défaut pour la devise
        const currencySymbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CAD: 'C$',
            AUD: 'A$',
            CHF: 'Fr',
            CNY: '¥',
            SEK: 'kr',
            NZD: 'NZ$'
        };
        return {
            code: currency,
            symbol: currencySymbols[currency] || currency,
            position: 'before',
            decimals: this.currencyPrecision[currency] ?? 2,
            thousandSeparator: ',',
            decimalSeparator: '.'
        };
    }
    setDefaultCurrencyRates() {
        // Taux par défaut en cas d'échec de l'API
        const defaultRates = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.0,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92,
            CNY: 6.45,
            SEK: 8.50,
            NZD: 1.42
        };
        const updatedAt = new Date();
        Object.entries(defaultRates).forEach(([code, rate]) => {
            this.currencyRates.set(code, {
                code,
                rate,
                updatedAt
            });
        });
    }
    async loadTranslationFile(locale) {
        // En développement, charger depuis des fichiers locaux
        // En production, charger depuis un CDN ou une base de données
        // Pour cette implémentation, retourner des traductions de base
        const baseTranslations = {
            'en-US': {
                common: {
                    welcome: 'Welcome',
                    login: 'Login',
                    logout: 'Logout',
                    save: 'Save',
                    cancel: 'Cancel',
                    delete: 'Delete',
                    edit: 'Edit',
                    create: 'Create',
                    search: 'Search',
                    loading: 'Loading...',
                    error: 'Error',
                    success: 'Success'
                },
                subscription: {
                    title: 'Subscription Plans',
                    subscribe: 'Subscribe',
                    unsubscribe: 'Unsubscribe',
                    monthly: 'Monthly',
                    yearly: 'Yearly',
                    trial: 'Free Trial',
                    benefits: 'Benefits'
                },
                dashboard: {
                    title: 'Dashboard',
                    revenue: 'Revenue',
                    subscribers: 'Subscribers',
                    growth: 'Growth',
                    analytics: 'Analytics'
                },
                payment: {
                    title: 'Payment',
                    amount: 'Amount',
                    currency: 'Currency',
                    method: 'Payment Method',
                    confirm: 'Confirm Payment',
                    success: 'Payment Successful',
                    failed: 'Payment Failed'
                }
            },
            'fr-FR': {
                common: {
                    welcome: 'Bienvenue',
                    login: 'Connexion',
                    logout: 'Déconnexion',
                    save: 'Enregistrer',
                    cancel: 'Annuler',
                    delete: 'Supprimer',
                    edit: 'Modifier',
                    create: 'Créer',
                    search: 'Rechercher',
                    loading: 'Chargement...',
                    error: 'Erreur',
                    success: 'Succès'
                },
                subscription: {
                    title: 'Plans d\'abonnement',
                    subscribe: 'S\'abonner',
                    unsubscribe: 'Se désabonner',
                    monthly: 'Mensuel',
                    yearly: 'Annuel',
                    trial: 'Essai gratuit',
                    benefits: 'Avantages'
                },
                dashboard: {
                    title: 'Tableau de bord',
                    revenue: 'Revenus',
                    subscribers: 'Abonnés',
                    growth: 'Croissance',
                    analytics: 'Analytiques'
                },
                payment: {
                    title: 'Paiement',
                    amount: 'Montant',
                    currency: 'Devise',
                    method: 'Moyen de paiement',
                    confirm: 'Confirmer le paiement',
                    success: 'Paiement réussi',
                    failed: 'Échec du paiement'
                }
            }
        };
        return baseTranslations[locale] || baseTranslations['en-US'];
    }
};
exports.I18nService = I18nService;
exports.I18nService = I18nService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _a : Object, typeof (_b = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _b : Object])
], I18nService);
//# sourceMappingURL=i18n.service.js.map