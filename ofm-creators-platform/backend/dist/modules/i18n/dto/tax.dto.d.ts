export declare class TaxCalculationDto {
    amount: number;
    country: string;
    state?: string;
    type: 'product' | 'service' | 'digital_service' | 'subscription';
    sellerCountry?: string;
    sellerState?: string;
    vatNumber?: string;
    productType?: string;
    annualRevenue?: number;
    isB2B?: boolean;
}
export declare class TaxRateDto {
    country: string;
    state?: string;
    rate: number;
    type: 'vat' | 'gst' | 'sales' | 'digital';
    digitalServicesRate?: number;
    threshold?: number;
    exemptions?: string[];
    effectiveDate?: Date;
    notes?: string;
}
export declare class TaxReportDto {
    reportId: string;
    creatorId: string;
    period: {
        start: Date;
        end: Date;
    };
    generatedAt: Date;
    summary: {
        totalRevenue: number;
        totalTaxCollected: number;
        totalTaxOwed: number;
        totalTaxPaid: number;
    };
    byCountry: Record<string, {
        revenue: number;
        taxCollected: number;
        taxRate: number;
        transactionCount: number;
    }>;
    byTaxType: Record<string, {
        amount: number;
        count: number;
    }>;
    remittance: Array<{
        jurisdiction: string;
        dueDate: Date;
        amount: number;
        status: 'pending' | 'paid' | 'overdue';
        reference?: string;
    }>;
    forms: {
        required: string[];
        completed: string[];
        pending: string[];
    };
    nexus?: Array<{
        country: string;
        state?: string;
        type: 'physical' | 'economic';
        threshold?: number;
        currentAmount?: number;
    }>;
}
export declare class TaxConfigDto {
    creatorId: string;
    businessCountry: string;
    businessState?: string;
    vatNumber?: string | null;
    taxIdNumber?: string | null;
    nexus: Array<{
        country: string;
        state?: string;
        type: 'physical' | 'economic';
        establishedDate?: Date;
    }>;
    settings: {
        autoCalculate: boolean;
        includeTaxInPrice: boolean;
        roundingMode: 'normal' | 'round_up' | 'round_down';
        defaultTaxCode?: string;
    };
    exemptions: Array<{
        type: string;
        reason: string;
        validUntil?: Date;
        certificate?: string;
    }>;
}
export declare class VatValidationDto {
    vatNumber: string;
    countryCode: string;
    requesterVatNumber?: string;
}
export declare class TaxExemptionDto {
    certificateId?: string;
    type: string;
    reason: string;
    jurisdiction?: string;
    validFrom?: Date;
    validUntil?: Date;
    documentUrl?: string;
}
export declare class TaxInvoiceDto {
    invoiceId: string;
    invoiceNumber: string;
    issueDate: Date;
    seller: {
        name: string;
        address: string;
        taxId?: string;
        vatNumber?: string;
    };
    buyer: {
        name: string;
        address: string;
        taxId?: string;
        vatNumber?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        taxAmount: number;
        total: number;
    }>;
    totals: {
        subtotal: number;
        taxAmount: number;
        total: number;
    };
    taxBreakdown: Array<{
        taxType: string;
        rate: number;
        taxableAmount: number;
        taxAmount: number;
    }>;
    currency: string;
    language: string;
    notes?: string;
}
export declare class TaxRateUpdateDto {
    country: string;
    state?: string;
    rate: number;
    type: string;
    digitalServicesRate?: number;
    effectiveDate?: Date;
    notes?: string;
}
export declare class NexusDto {
    country: string;
    state?: string;
    type: string;
    establishedDate: Date;
    economicThreshold?: number;
    transactionThreshold?: number;
    autoMonitor?: boolean;
}
export declare class TaxComplianceCheckDto {
    creatorId: string;
    countries?: string[];
    includeUpcoming?: boolean;
    asOfDate?: Date;
}
export declare class TaxSettingsDto {
    autoCalculate?: boolean;
    includeTaxInPrice?: boolean;
    roundingMode?: string;
    defaultTaxCode?: string;
    collectTaxId?: boolean;
    enabledCountries?: string[];
}
export declare class TaxTransactionDto {
    transactionId: string;
    creatorId: string;
    date: Date;
    amount: {
        subtotal: number;
        tax: number;
        total: number;
        currency: string;
    };
    location: {
        country: string;
        state?: string;
        city?: string;
        postalCode?: string;
    };
    taxDetails: {
        rate: number;
        type: string;
        jurisdiction: string;
        taxId?: string;
    };
    customer: {
        type: 'individual' | 'business';
        vatNumber?: string;
        taxExempt?: boolean;
    };
    invoice?: {
        number: string;
        url: string;
    };
}
export declare class MarketplaceFacilitatorDto {
    marketplaceId: string;
    name: string;
    jurisdictions: JurisdictionDto[];
    settings?: {
        collectsOnBehalf: boolean;
        remitsOnBehalf: boolean;
        providesReporting: boolean;
    };
}
export declare class JurisdictionDto {
    country: string;
    state?: string;
    threshold?: number;
    isActive: boolean;
}
//# sourceMappingURL=tax.dto.d.ts.map