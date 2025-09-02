import { PrismaService } from '@infrastructure/database/prisma.service';
import { StripeService } from '@infrastructure/payment/stripe.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageService } from '@infrastructure/storage/storage.service';
import { KycStatus } from '@prisma/client';
import { KycVerificationDto, KycDocumentDto, AmlScreeningDto, RiskAssessmentDto, SuspiciousActivityDto, ComplianceReportDto } from '../dto/kyc-aml.dto';
interface KycDocument {
    type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';
    status: 'pending' | 'verified' | 'rejected';
    url: string;
    uploadedAt: Date;
    verifiedAt?: Date;
    rejectionReason?: string;
    metadata?: any;
}
interface RiskProfile {
    creatorId: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: RiskFactor[];
    score: number;
    lastAssessment: Date;
    nextReview: Date;
    restrictions?: string[];
}
interface RiskFactor {
    category: string;
    factor: string;
    weight: number;
    score: number;
    details?: string;
}
export declare class KycAmlService {
    private readonly prisma;
    private readonly stripe;
    private readonly eventEmitter;
    private readonly storage;
    private readonly kycThresholds;
    private readonly amlRules;
    constructor(prisma: PrismaService, stripe: StripeService, eventEmitter: EventEmitter2, storage: StorageService);
    /**
     * Initie la vérification KYC pour un créateur
     */
    initiateKycVerification(creatorId: string, dto: KycVerificationDto): Promise<{
        verificationId: string;
        status: KycStatus;
        requiredDocuments: string[];
        stripeVerificationUrl?: string;
    }>;
    /**
     * Upload un document KYC
     */
    uploadKycDocument(creatorId: string, dto: KycDocumentDto, file: Express.Multer.File): Promise<KycDocument>;
    /**
     * Effectue un screening AML
     */
    performAmlScreening(creatorId: string, dto?: AmlScreeningDto): Promise<{
        passed: boolean;
        riskLevel: string;
        issues: string[];
        recommendations: string[];
    }>;
    /**
     * Évalue le profil de risque d'un créateur
     */
    assessRiskProfile(creatorId: string, dto?: RiskAssessmentDto): Promise<RiskProfile>;
    /**
     * Signale une activité suspecte
     */
    reportSuspiciousActivity(dto: SuspiciousActivityDto): Promise<{
        reportId: string;
        status: string;
        actions: string[];
    }>;
    /**
     * Génère un rapport de conformité
     */
    generateComplianceReport(creatorId: string, startDate: Date, endDate: Date): Promise<ComplianceReportDto>;
    /**
     * Vérifie la conformité pour les taxes
     */
    verifyTaxCompliance(creatorId: string): Promise<{
        compliant: boolean;
        issues: string[];
        requiredForms: string[];
    }>;
    private determineVerificationLevel;
    private getRequiredDocuments;
    private isValidDocumentType;
    private createVerificationRecord;
    private storeDocumentRecord;
    private submitToVerificationProvider;
    private checkSanctionLists;
    private checkPepStatus;
    private analyzeTransactionPatterns;
    private checkGeographicRisk;
    private calculateAmlRiskScore;
    private getRiskLevel;
    private createAmlReport;
    private getTransactionStatistics;
    private getComplianceHistory;
    private analyzeBehaviorPatterns;
    private assessVolumeRisk;
    private assessKycRisk;
    private assessGeographicRisk;
    private assessBehaviorRisk;
    private assessComplianceRisk;
    private calculateNextReviewDate;
    private getRestrictions;
    private storeRiskProfile;
    private applyRestrictions;
    private determineSarActions;
    private executeSarAction;
    private requiresRegulatorNotification;
    private notifyFinancialIntelligenceUnit;
    private getTransactionsForPeriod;
    private getVerificationHistory;
    private getRiskAssessmentHistory;
    private getSuspiciousActivityReports;
    private summarizeTransactions;
    private identifyRedFlags;
    private calculateComplianceMetrics;
    private generateComplianceRecommendations;
    private storeComplianceReport;
    private getYearlyRevenue;
    private checkInternationalTaxCompliance;
    private groupTransactionsByHour;
    private identifyRapidTransactions;
    private holdPayouts;
    private freezeAccount;
    private lowerTransactionLimits;
    private notifyComplianceTeam;
}
export {};
//# sourceMappingURL=kyc-aml.service.d.ts.map