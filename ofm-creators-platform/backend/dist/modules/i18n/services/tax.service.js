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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const rxjs_1 = require("rxjs");
let TaxService = class TaxService {
    config;
    http;
    cache;
    taxRules = new Map();
    vatNumberCache = new Map();
    digitalServiceCountries = [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
        'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
        'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    constructor(config, http, cache) {
        this.config = config;
        this.http = http;
        this.cache = cache;
        this.initializeTaxRules();
    }
    /**
     * Initialise les règles fiscales
     */
    initializeTaxRules() {
        // TVA européenne
        const euVatRates = [
            { country: 'AT', rate: 20, type: 'vat', digitalServicesRate: 20 },
            { country: 'BE', rate: 21, type: 'vat', digitalServicesRate: 21 },
            { country: 'BG', rate: 20, type: 'vat', digitalServicesRate: 20 },
            { country: 'HR', rate: 25, type: 'vat', digitalServicesRate: 25 },
            { country: 'CY', rate: 19, type: 'vat', digitalServicesRate: 19 },
            { country: 'CZ', rate: 21, type: 'vat', digitalServicesRate: 21 },
            { country: 'DK', rate: 25, type: 'vat', digitalServicesRate: 25 },
            { country: 'EE', rate: 20, type: 'vat', digitalServicesRate: 20 },
            { country: 'FI', rate: 24, type: 'vat', digitalServicesRate: 24 },
            { country: 'FR', rate: 20, type: 'vat', digitalServicesRate: 20 },
            { country: 'DE', rate: 19, type: 'vat', digitalServicesRate: 19 },
            { country: 'GR', rate: 24, type: 'vat', digitalServicesRate: 24 },
            { country: 'HU', rate: 27, type: 'vat', digitalServicesRate: 27 },
            { country: 'IE', rate: 23, type: 'vat', digitalServicesRate: 23 },
            { country: 'IT', rate: 22, type: 'vat', digitalServicesRate: 22 },
            { country: 'LV', rate: 21, type: 'vat', digitalServicesRate: 21 },
            { country: 'LT', rate: 21, type: 'vat', digitalServicesRate: 21 },
            { country: 'LU', rate: 17, type: 'vat', digitalServicesRate: 17 },
            { country: 'MT', rate: 18, type: 'vat', digitalServicesRate: 18 },
            { country: 'NL', rate: 21, type: 'vat', digitalServicesRate: 21 },
            { country: 'PL', rate: 23, type: 'vat', digitalServicesRate: 23 },
            { country: 'PT', rate: 23, type: 'vat', digitalServicesRate: 23 },
            { country: 'RO', rate: 19, type: 'vat', digitalServicesRate: 19 },
            { country: 'SK', rate: 20, type: 'vat', digitalServicesRate: 20 },
            { country: 'SI', rate: 22, type: 'vat', digitalServicesRate: 22 },
            { country: 'ES', rate: 21, type: 'vat', digitalServicesRate: 21 },
            { country: 'SE', rate: 25, type: 'vat', digitalServicesRate: 25 }
        ];
        euVatRates.forEach(rule => {
            this.addTaxRule(rule.country, rule);
        });
        // Taxes US par état
        const usSalesTax = [
            { country: 'US', state: 'CA', rate: 7.25, type: 'sales' },
            { country: 'US', state: 'NY', rate: 8.0, type: 'sales' },
            { country: 'US', state: 'TX', rate: 6.25, type: 'sales' },
            { country: 'US', state: 'FL', rate: 6.0, type: 'sales' },
            { country: 'US', state: 'WA', rate: 6.5, type: 'sales' },
            { country: 'US', state: 'IL', rate: 6.25, type: 'sales' },
            { country: 'US', state: 'PA', rate: 6.0, type: 'sales' },
            { country: 'US', state: 'OH', rate: 5.75, type: 'sales' },
            { country: 'US', state: 'GA', rate: 4.0, type: 'sales' },
            { country: 'US', state: 'NC', rate: 4.75, type: 'sales' },
            // États sans taxe de vente
            { country: 'US', state: 'OR', rate: 0, type: 'sales' },
            { country: 'US', state: 'MT', rate: 0, type: 'sales' },
            { country: 'US', state: 'NH', rate: 0, type: 'sales' },
            { country: 'US', state: 'DE', rate: 0, type: 'sales' },
            { country: 'US', state: 'AK', rate: 0, type: 'sales' }
        ];
        usSalesTax.forEach(rule => {
            this.addTaxRule('US', rule);
        });
        // Autres pays
        this.addTaxRule('GB', { country: 'GB', rate: 20, type: 'vat' });
        this.addTaxRule('CA', { country: 'CA', rate: 5, type: 'gst' }); // GST fédérale
        this.addTaxRule('AU', { country: 'AU', rate: 10, type: 'gst' });
        this.addTaxRule('NZ', { country: 'NZ', rate: 15, type: 'gst' });
        this.addTaxRule('JP', { country: 'JP', rate: 10, type: 'vat' });
        this.addTaxRule('KR', { country: 'KR', rate: 10, type: 'vat' });
        this.addTaxRule('SG', { country: 'SG', rate: 7, type: 'gst' });
        this.addTaxRule('IN', { country: 'IN', rate: 18, type: 'gst' });
        this.addTaxRule('BR', { country: 'BR', rate: 17, type: 'vat' });
        this.addTaxRule('MX', { country: 'MX', rate: 16, type: 'vat' });
    }
    /**
     * Calcule les taxes pour une transaction
     */
    async calculateTax(dto) {
        const cacheKey = `tax:${dto.country}:${dto.state}:${dto.amount}:${dto.type}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        // Vérifier si exemption B2B (TVA européenne)
        if (dto.vatNumber && this.isEuCountry(dto.country)) {
            const isValid = await this.validateVatNumber(dto.vatNumber, dto.country);
            if (isValid && dto.sellerCountry !== dto.country) {
                // Autoliquidation de la TVA pour B2B transfrontalier
                return this.createTaxCalculation(dto.amount, 0, 'vat', 'B2B reverse charge');
            }
        }
        // Obtenir les règles fiscales applicables
        const applicableRules = this.getApplicableTaxRules(dto.country, dto.state, dto.type, dto.sellerCountry);
        if (applicableRules.length === 0) {
            return this.createTaxCalculation(dto.amount, 0, 'none', 'No tax applicable');
        }
        // Calculer les taxes
        let totalTaxAmount = 0;
        const breakdown = [];
        for (const rule of applicableRules) {
            // Vérifier le seuil si applicable
            if (rule.threshold && dto.annualRevenue && dto.annualRevenue < rule.threshold) {
                continue;
            }
            // Vérifier les exemptions
            if (rule.exemptions && dto.productType && rule.exemptions.includes(dto.productType)) {
                continue;
            }
            const rate = this.getApplicableRate(rule, dto.type);
            const taxAmount = (dto.amount * rate) / 100;
            totalTaxAmount += taxAmount;
            breakdown.push({
                type: rule.type,
                rate,
                amount: taxAmount
            });
        }
        const calculation = this.createTaxCalculation(dto.amount, totalTaxAmount, applicableRules[0]?.type || 'none', '', breakdown);
        // Mettre en cache pour 1 heure
        await this.cache.set(cacheKey, calculation, 3600);
        return calculation;
    }
    /**
     * Obtient les taux de taxe pour un pays
     */
    async getTaxRates(country, state) {
        const rules = this.taxRules.get(country) || [];
        return rules
            .filter(rule => !state || rule.state === state)
            .map(rule => ({
            country: rule.country,
            state: rule.state,
            rate: rule.rate,
            type: rule.type,
            digitalServicesRate: rule.digitalServicesRate,
            threshold: rule.threshold,
            exemptions: rule.exemptions
        }));
    }
    /**
     * Valide un numéro de TVA
     */
    async validateVatNumber(vatNumber, country) {
        const cacheKey = `vat:${vatNumber}`;
        const cached = this.vatNumberCache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        try {
            // Utiliser le service VIES de l'UE
            const response = await (0, rxjs_1.firstValueFrom)(this.http.get(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${vatNumber}`));
            const isValid = response.data.valid === true;
            this.vatNumberCache.set(cacheKey, isValid);
            // Expirer après 24h
            setTimeout(() => this.vatNumberCache.delete(cacheKey), 86400000);
            return isValid;
        }
        catch (error) {
            console.error('VAT validation error:', error);
            return false;
        }
    }
    /**
     * Génère un rapport fiscal
     */
    async generateTaxReport(creatorId, startDate, endDate) {
        // Cette méthode nécessiterait l'accès aux transactions
        // Implémentation simplifiée pour l'exemple
        const report = {
            reportId: `tax_${Date.now()}`,
            creatorId,
            period: { start: startDate, end: endDate },
            generatedAt: new Date(),
            summary: {
                totalRevenue: 0,
                totalTaxCollected: 0,
                totalTaxOwed: 0,
                totalTaxPaid: 0
            },
            byCountry: {},
            byTaxType: {},
            remittance: [],
            forms: {
                required: [],
                completed: [],
                pending: []
            }
        };
        return report;
    }
    /**
     * Obtient la configuration fiscale pour un créateur
     */
    async getTaxConfig(creatorId) {
        // Récupérer la configuration depuis la base de données
        // Implémentation simplifiée
        return {
            creatorId,
            businessCountry: 'US',
            businessState: 'CA',
            vatNumber: null,
            taxIdNumber: null,
            nexus: [
                { country: 'US', state: 'CA', type: 'physical' }
            ],
            settings: {
                autoCalculate: true,
                includeTaxInPrice: false,
                roundingMode: 'normal'
            },
            exemptions: []
        };
    }
    /**
     * Détermine si des taxes doivent être collectées
     */
    async shouldCollectTax(sellerCountry, sellerState, buyerCountry, buyerState, productType) {
        // Vérifier si même pays
        if (sellerCountry === buyerCountry) {
            // Taxes domestiques
            if (sellerCountry === 'US') {
                // Vérifier le nexus pour les états US
                if (sellerState === buyerState) {
                    return {
                        shouldCollect: true,
                        reason: 'Same state sales tax',
                        taxType: 'sales'
                    };
                }
                // Vérifier les règles de nexus économique
                // Simplifiée pour cet exemple
                return {
                    shouldCollect: false,
                    reason: 'No nexus in buyer state'
                };
            }
            return {
                shouldCollect: true,
                reason: 'Domestic transaction',
                taxType: this.getTaxType(sellerCountry)
            };
        }
        // Vérifier les règles internationales
        if (this.isEuCountry(sellerCountry) && this.isEuCountry(buyerCountry)) {
            // Règles MOSS/OSS pour services numériques
            return {
                shouldCollect: true,
                reason: 'EU digital services',
                taxType: 'vat'
            };
        }
        // Vérifier les seuils pour les marketplaces
        const threshold = await this.getMarketplaceThreshold(buyerCountry);
        if (threshold) {
            return {
                shouldCollect: true,
                reason: 'Marketplace facilitator rules',
                taxType: this.getTaxType(buyerCountry)
            };
        }
        return {
            shouldCollect: false,
            reason: 'No tax obligation'
        };
    }
    /**
     * Calcule les taxes pour plusieurs juridictions
     */
    async calculateMultiJurisdictionTax(amount, jurisdictions) {
        let totalTaxAmount = 0;
        const breakdown = [];
        for (const jurisdiction of jurisdictions) {
            const calc = await this.calculateTax({
                amount,
                country: jurisdiction.country,
                state: jurisdiction.state,
                type: jurisdiction.type,
                sellerCountry: jurisdiction.country
            });
            totalTaxAmount += calc.taxAmount;
            breakdown.push(...calc.breakdown);
        }
        return this.createTaxCalculation(amount, totalTaxAmount, 'multi', 'Multiple jurisdictions', breakdown);
    }
    // Méthodes privées
    addTaxRule(country, rule) {
        if (!this.taxRules.has(country)) {
            this.taxRules.set(country, []);
        }
        this.taxRules.get(country).push(rule);
    }
    getApplicableTaxRules(country, state, transactionType, sellerCountry) {
        const countryRules = this.taxRules.get(country) || [];
        return countryRules.filter(rule => {
            // Filtrer par état si applicable
            if (rule.state && rule.state !== state) {
                return false;
            }
            // Règles spéciales pour les services numériques EU
            if (this.isEuCountry(country) &&
                transactionType === 'digital_service' &&
                sellerCountry &&
                !this.isEuCountry(sellerCountry)) {
                return true;
            }
            return true;
        });
    }
    getApplicableRate(rule, transactionType) {
        if (transactionType === 'digital_service' && rule.digitalServicesRate) {
            return rule.digitalServicesRate;
        }
        return rule.rate;
    }
    createTaxCalculation(subtotal, taxAmount, taxType, note = '', breakdown = []) {
        return {
            subtotal,
            taxAmount,
            total: subtotal + taxAmount,
            taxRate: subtotal > 0 ? (taxAmount / subtotal) * 100 : 0,
            taxType,
            breakdown
        };
    }
    isEuCountry(country) {
        return this.digitalServiceCountries.includes(country);
    }
    getTaxType(country) {
        if (this.isEuCountry(country))
            return 'vat';
        if (country === 'US')
            return 'sales';
        if (['CA', 'AU', 'NZ', 'SG', 'IN'].includes(country))
            return 'gst';
        return 'vat';
    }
    async getMarketplaceThreshold(country) {
        // Seuils simplifiés pour les marketplaces
        const thresholds = {
            US: 100000, // Varie par état
            GB: 135000,
            AU: 75000,
            JP: 10000000 // 10M JPY
        };
        return thresholds[country] || null;
    }
};
exports.TaxService = TaxService;
exports.TaxService = TaxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, typeof (_b = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _b : Object])
], TaxService);
//# sourceMappingURL=tax.service.js.map