import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CacheService } from '@infrastructure/cache/cache.service';
import { TaxCalculationDto, TaxRateDto, TaxReportDto, TaxConfigDto } from '../dto/tax.dto';
interface TaxCalculation {
    subtotal: number;
    taxAmount: number;
    total: number;
    taxRate: number;
    taxType: string;
    breakdown: Array<{
        type: string;
        rate: number;
        amount: number;
    }>;
}
export declare class TaxService {
    private readonly config;
    private readonly http;
    private readonly cache;
    private taxRules;
    private vatNumberCache;
    private readonly digitalServiceCountries;
    constructor(config: ConfigService, http: HttpService, cache: CacheService);
    /**
     * Initialise les règles fiscales
     */
    private initializeTaxRules;
    /**
     * Calcule les taxes pour une transaction
     */
    calculateTax(dto: TaxCalculationDto): Promise<TaxCalculation>;
    /**
     * Obtient les taux de taxe pour un pays
     */
    getTaxRates(country: string, state?: string): Promise<TaxRateDto[]>;
    /**
     * Valide un numéro de TVA
     */
    validateVatNumber(vatNumber: string, country: string): Promise<boolean>;
    /**
     * Génère un rapport fiscal
     */
    generateTaxReport(creatorId: string, startDate: Date, endDate: Date): Promise<TaxReportDto>;
    /**
     * Obtient la configuration fiscale pour un créateur
     */
    getTaxConfig(creatorId: string): Promise<TaxConfigDto>;
    /**
     * Détermine si des taxes doivent être collectées
     */
    shouldCollectTax(sellerCountry: string, sellerState: string | undefined, buyerCountry: string, buyerState: string | undefined, productType: string): Promise<{
        shouldCollect: boolean;
        reason: string;
        taxType?: string;
    }>;
    /**
     * Calcule les taxes pour plusieurs juridictions
     */
    calculateMultiJurisdictionTax(amount: number, jurisdictions: Array<{
        country: string;
        state?: string;
        type: string;
    }>): Promise<TaxCalculation>;
    private addTaxRule;
    private getApplicableTaxRules;
    private getApplicableRate;
    private createTaxCalculation;
    private isEuCountry;
    private getTaxType;
    private getMarketplaceThreshold;
}
export {};
//# sourceMappingURL=tax.service.d.ts.map