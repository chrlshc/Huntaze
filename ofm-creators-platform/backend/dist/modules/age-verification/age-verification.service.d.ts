import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { S3Service } from '@infrastructure/s3/s3.service';
import { AuditService } from '@infrastructure/audit/audit.service';
import { CreateAgeVerificationDto } from './dto/age-verification.dto';
export declare class AgeVerificationService {
    private readonly prisma;
    private readonly s3;
    private readonly auditService;
    private readonly logger;
    private readonly MIN_AGE;
    private readonly VERIFICATION_METHODS;
    constructor(prisma: PrismaService, s3: S3Service, auditService: AuditService);
    /**
     * Create age verification record
     */
    createVerification(userId: string, dto: CreateAgeVerificationDto): Promise<any>;
    /**
     * Verify age with document
     */
    verifyWithDocument(verificationId: string, documentKey: string, documentType: string, userId: string): Promise<any>;
    /**
     * Verify with credit card
     */
    verifyWithCreditCard(verificationId: string, last4: string, userId: string): Promise<any>;
    /**
     * Verify with third-party service
     */
    verifyWithThirdParty(verificationId: string, provider: string, token: string, userId: string): Promise<any>;
    /**
     * Self declaration (only for certain jurisdictions)
     */
    verifySelfDeclaration(verificationId: string, dateOfBirth: Date, consent: boolean, userId: string): Promise<any>;
    /**
     * Check if user is verified
     */
    isUserVerified(userId: string): Promise<boolean>;
    /**
     * Get verification status
     */
    getVerificationStatus(userId: string): Promise<{
        status: string;
        required: boolean;
        expiresAt?: undefined;
        method?: undefined;
        reason?: undefined;
        canRetry?: undefined;
    } | {
        status: string;
        expiresAt: any;
        method: any;
        required?: undefined;
        reason?: undefined;
        canRetry?: undefined;
    } | {
        status: string;
        reason: any;
        canRetry: boolean;
        required?: undefined;
        expiresAt?: undefined;
        method?: undefined;
    } | {
        status: any;
        required?: undefined;
        expiresAt?: undefined;
        method?: undefined;
        reason?: undefined;
        canRetry?: undefined;
    }>;
    /**
     * Block access for unverified users
     */
    enforceAgeGate(userId: string, resource: string): Promise<boolean>;
    /**
     * Helper methods
     */
    private calculateAge;
    private validateDocument;
    private hashDocument;
    private callThirdPartyProvider;
    private failVerification;
    private canRetryVerification;
    /**
     * Compliance reporting
     */
    generateComplianceReport(startDate: Date, endDate: Date): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        verifications: any;
        totalBlocked: number;
        generatedAt: Date;
    }>;
}
//# sourceMappingURL=age-verification.service.d.ts.map