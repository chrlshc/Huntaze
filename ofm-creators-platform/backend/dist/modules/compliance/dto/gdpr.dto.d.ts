export declare class ConsentUpdateDto {
    consents: Record<string, boolean>;
    version?: string;
    metadata?: Record<string, any>;
}
export declare class DataExportRequestDto {
    categories?: string[];
    format?: 'json' | 'csv' | 'xml';
    password?: string;
    includeMetadata?: boolean;
}
export declare class DataDeletionRequestDto {
    categories: string[];
    reason: string;
    anonymize?: boolean;
    immediate?: boolean;
}
export declare class PrivacyReportDto {
    generatedAt: Date;
    user: {
        id: string;
        email: string;
        username?: string;
        createdAt: Date;
    };
    consents: Array<{
        type: string;
        granted: boolean;
        timestamp: Date;
        version: string;
    }>;
    dataCategories: string[];
    thirdPartySharing: Array<{
        name: string;
        purpose: string;
        dataTypes: string[];
        legalBasis: string;
    }>;
    retentionInfo: {
        policies: Array<{
            dataType: string;
            retentionPeriod: string;
            reason: string;
        }>;
        deletionSchedule?: any[];
    };
    rights: string[];
    contactInfo: {
        dataProtectionOfficer: {
            email: string;
            phone: string;
        };
        privacyTeam: {
            email: string;
            address: string;
        };
        supervisoryAuthority: {
            name: string;
            website: string;
            email: string;
        };
    };
}
export declare class DataBreachNotificationDto {
    severity: string;
    affectedDataTypes: string[];
    discoveredAt: Date;
    description: string;
    affectedUserCriteria?: {
        createdAfter?: Date;
        createdBefore?: Date;
        userTypes?: string[];
        geoLocations?: string[];
    };
    recommendations?: string[];
}
export declare class ConsentHistoryDto {
    userId: string;
    userType: 'creator' | 'fan';
    history: Array<{
        consentType: string;
        granted: boolean;
        timestamp: Date;
        version: string;
        ip: string;
        userAgent: string;
    }>;
    currentConsents: Record<string, boolean>;
}
export declare class DataAccessRequestDto {
    requestId: string;
    userId: string;
    userType: 'creator' | 'fan';
    purpose: string;
    dataCategories: string[];
    requestedAt: Date;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    approvedBy?: string;
    completedAt?: Date;
}
export declare class DataRetentionPolicyDto {
    dataType: string;
    retentionPeriod: string;
    legalBasis: string;
    automaticDeletion?: boolean;
    exceptions?: string[];
}
export declare class PrivacyImpactAssessmentDto {
    projectName: string;
    description: string;
    dataTypes: string[];
    purposes: string[];
    riskLevel: string;
    risks: PrivacyRiskDto[];
    mitigations: string[];
    assessmentDate: Date;
    assessedBy: string;
}
export declare class PrivacyRiskDto {
    risk: string;
    severity: string;
    likelihood: string;
    impact: string;
    mitigation?: string;
}
export declare class CookieConsentDto {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    consentId?: string;
    expiresAt?: Date;
}
export declare class DataPortabilityRequestDto {
    userId: string;
    userType: 'creator' | 'fan';
    targetService?: string;
    transferMethod: string;
    dataCategories?: string[];
    format?: 'json' | 'csv' | 'xml';
}
export declare class RightToObjectDto {
    userId: string;
    userType: 'creator' | 'fan';
    objectionType: string;
    reason: string;
    specificProcessing?: string[];
}
export declare class DataMinimizationReportDto {
    reportId: string;
    generatedAt: Date;
    summary: {
        totalDataPoints: number;
        necessaryDataPoints: number;
        redundantDataPoints: number;
        minimizationScore: number;
    };
    byCategory: Record<string, {
        collected: number;
        necessary: number;
        redundant: number;
        recommendations: string[];
    }>;
    recommendations: string[];
}
//# sourceMappingURL=gdpr.dto.d.ts.map