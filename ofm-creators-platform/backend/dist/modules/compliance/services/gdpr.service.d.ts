import { PrismaService } from '@infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageService } from '@infrastructure/storage/storage.service';
import { CryptoService } from '@infrastructure/crypto/crypto.service';
import { DataExportRequestDto, DataDeletionRequestDto, ConsentUpdateDto, PrivacyReportDto, DataBreachNotificationDto } from '../dto/gdpr.dto';
interface DataExportJob {
    id: string;
    userId: string;
    userType: 'creator' | 'fan';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    error?: string;
}
export declare class GdprService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly storage;
    private readonly crypto;
    private readonly consentTypes;
    private readonly dataRetentionPolicies;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, storage: StorageService, crypto: CryptoService);
    /**
     * Enregistre ou met à jour le consentement d'un utilisateur
     */
    updateConsent(userId: string, userType: 'creator' | 'fan', dto: ConsentUpdateDto, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * Exporte toutes les données d'un utilisateur
     */
    requestDataExport(userId: string, userType: 'creator' | 'fan', dto: DataExportRequestDto): Promise<DataExportJob>;
    /**
     * Supprime toutes les données d'un utilisateur
     */
    requestDataDeletion(userId: string, userType: 'creator' | 'fan', dto: DataDeletionRequestDto, verificationToken: string): Promise<void>;
    /**
     * Génère un rapport de confidentialité
     */
    generatePrivacyReport(userId: string, userType: 'creator' | 'fan'): Promise<PrivacyReportDto>;
    /**
     * Notifie une violation de données
     */
    reportDataBreach(dto: DataBreachNotificationDto): Promise<void>;
    /**
     * Vérifie la conformité CCPA
     */
    verifyCcpaCompliance(userId: string, userType: 'creator' | 'fan'): Promise<{
        compliant: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    private processDataExport;
    private collectUserData;
    private anonymizeUserData;
    private deleteDataCategory;
    private checkDeletionEligibility;
    private updateFanPreferences;
    private updateCreatorPreferences;
    private verifyDeletionToken;
    private updateExportJobStatus;
    private generateExportReadme;
    private getUserBasicInfo;
    private getUserConsents;
    private getStoredDataCategories;
    private getThirdPartyDataSharing;
    private getDataRetentionInfo;
    private getUserRights;
    private getPrivacyContactInfo;
    private formatDuration;
    private getRetentionReason;
    private identifyAffectedUsers;
    private notifyUserOfBreach;
    private notifyDataProtectionAuthority;
    private hasOptedOutOfDataSale;
    private getPrivacyPolicyVersion;
    private isDataExportAvailable;
    private checkActiveLegalCases;
    private getScheduledDeletions;
    private collectProfileData;
    private collectTransactionData;
    private collectContentData;
    private collectMessageData;
    private collectAnalyticsData;
    private collectAuditLogs;
    private anonymizeRelatedData;
    private deleteProfileData;
    private deleteContentData;
    private deleteMessageData;
    private deleteAnalyticsData;
    private deleteAuditLogs;
    private notifyExportReady;
}
export {};
//# sourceMappingURL=gdpr.service.d.ts.map