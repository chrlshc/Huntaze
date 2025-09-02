export declare class KycVerificationDto {
    verificationType: string;
    level?: string;
    personalInfo?: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: Date;
        nationality?: string;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
    };
    referenceId?: string;
}
export declare class KycDocumentDto {
    documentType: string;
    documentNumber?: string;
    expiryDate?: Date;
    issuingCountry?: string;
    metadata?: Record<string, any>;
}
export declare class AmlScreeningDto {
    creatorId: string;
    screeningType?: string;
    additionalNames?: string[];
    countries?: string[];
    includePep?: boolean;
    includeSanctions?: boolean;
    includeAdverseMedia?: boolean;
}
export declare class RiskAssessmentDto {
    assessmentType?: 'initial' | 'periodic' | 'triggered';
    riskFactors?: string[];
    additionalData?: {
        businessType?: string;
        expectedMonthlyVolume?: number;
        sourceOfFunds?: string;
        purposeOfAccount?: string;
    };
}
export declare class SuspiciousActivityDto {
    creatorId: string;
    activityType: string;
    description: string;
    severity: string;
    occurredAt: Date;
    evidence?: {
        transactionIds?: string[];
        totalAmount?: number;
        frequency?: number;
        involvedParties?: string[];
        screenshots?: string[];
    };
    reportedBy?: string;
    transactionIds?: string[];
}
export declare class ComplianceReportDto {
    reportId: string;
    creatorId: string;
    period: {
        start: Date;
        end: Date;
    };
    generatedAt: Date;
    kycStatus: {
        current: string;
        lastVerified?: Date;
        documents: number;
        verificationLevel?: string;
    };
    amlStatus: {
        riskLevel: string;
        lastScreening?: Date;
        alerts: number;
        clearedAlerts?: number;
    };
    transactionSummary: {
        count: number;
        totalVolume: number;
        averageAmount: number;
        byType: Record<string, number>;
        largeTransactions?: number;
    };
    suspiciousActivities: Array<{
        id: string;
        type: string;
        date: Date;
        status: string;
        severity: string;
    }>;
    redFlags: string[];
    complianceMetrics: {
        verificationRate: number;
        screeningFrequency: string;
        alertsResolved: number;
        falsePositiveRate: number;
    };
    recommendations: string[];
}
export declare class TransactionMonitoringDto {
    transactionId: string;
    creatorId: string;
    amount: number;
    currency: string;
    direction: string;
    counterparty?: string;
    metadata?: {
        ip?: string;
        device?: string;
        location?: string;
        sessionId?: string;
    };
}
export declare class EnhancedDueDiligenceDto {
    creatorId: string;
    reason: string;
    checks: DueDiligenceCheckDto[];
    sourceOfWealth?: {
        description: string;
        verified: boolean;
        documents?: string[];
    };
    businessStructure?: {
        type: string;
        beneficialOwners: Array<{
            name: string;
            percentage: number;
            verified: boolean;
        }>;
    };
}
export declare class DueDiligenceCheckDto {
    checkType: string;
    status: string;
    performedAt: Date;
    notes?: string;
    documents?: string[];
}
export declare class SanctionScreeningResultDto {
    screeningId: string;
    creatorId: string;
    performedAt: Date;
    results: {
        sanctionLists: Array<{
            listName: string;
            matches: number;
            details?: Array<{
                name: string;
                similarity: number;
                reason: string;
            }>;
        }>;
        pepStatus: {
            isPep: boolean;
            level?: 'senior' | 'middle' | 'junior';
            positions?: string[];
            lastUpdated?: Date;
        };
        adverseMedia: {
            found: boolean;
            articles: number;
            categories?: string[];
        };
    };
    overallRisk: 'clear' | 'low' | 'medium' | 'high' | 'critical';
    requiresManualReview: boolean;
}
export declare class TaxComplianceDto {
    creatorId: string;
    taxYear: string;
    taxInformation: {
        taxId?: string;
        taxType: 'individual' | 'business';
        country: string;
        state?: string;
    };
    forms?: {
        w9?: boolean;
        w8ben?: boolean;
        other?: string[];
    };
    reportableIncome?: number;
    withholdingRequired?: boolean;
}
export declare class ComplianceAuditDto {
    auditId: string;
    creatorId: string;
    auditType: string;
    startDate: Date;
    endDate: Date;
    findings: AuditFindingDto[];
    auditor: string;
    result: string;
    recommendations: string[];
}
export declare class AuditFindingDto {
    area: string;
    severity: string;
    description: string;
    remediation?: string;
    dueDate?: Date;
}
export declare class MoneyLaunderingRiskDto {
    creatorId: string;
    assessmentDate: Date;
    riskFactors: {
        geographicRisk: {
            score: number;
            factors: string[];
        };
        productRisk: {
            score: number;
            factors: string[];
        };
        customerRisk: {
            score: number;
            factors: string[];
        };
        transactionRisk: {
            score: number;
            factors: string[];
        };
    };
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'unacceptable';
    mitigationMeasures: string[];
    monitoringFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextReviewDate: Date;
}
//# sourceMappingURL=kyc-aml.dto.d.ts.map