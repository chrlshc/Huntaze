import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AuditLogService } from '@/modules/audit/services/audit-log.service';
import { MediaProcessorService } from '@/modules/media/services/media-processor.service';
import { EmailService } from '@/modules/email/services/email.service';
export interface DmcaTakedownRequest {
    contentUrl: string;
    platform: string;
    description: string;
    evidenceUrls: string[];
    originalMediaId?: string;
}
export interface DmcaTakedownUpdate {
    status?: 'processing' | 'completed' | 'rejected';
    responseNotes?: string;
    processedBy?: string;
}
export declare class DmcaService {
    private readonly prisma;
    private readonly auditLog;
    private readonly mediaProcessor;
    private readonly emailService;
    constructor(prisma: PrismaService, auditLog: AuditLogService, mediaProcessor: MediaProcessorService, emailService: EmailService);
    /**
     * Create a new DMCA takedown request
     */
    createTakedownRequest(userId: string, request: DmcaTakedownRequest): Promise<string>;
    /**
     * Get takedown requests for a user
     */
    getUserTakedowns(userId: string, status?: string): Promise<any[]>;
    /**
     * Update takedown status (admin only)
     */
    updateTakedownStatus(adminId: string, takedownId: string, update: DmcaTakedownUpdate): Promise<void>;
    /**
     * Generate DMCA notice template
     */
    generateDmcaNotice(takedown: any): string;
    /**
     * Check if content matches known hashes
     */
    checkContentMatch(contentHash: string, userId: string): Promise<boolean>;
    /**
     * Get DMCA statistics
     */
    getDmcaStats(userId?: string): Promise<{
        total: number;
        pending: number;
        completed: number;
        rejected: number;
        averageResponseTime: number;
    }>;
    /**
     * Notify DMCA team of new request
     */
    private notifyDmcaTeam;
    /**
     * Notify reporter of status update
     */
    private notifyReporter;
    /**
     * Generate runbook for DMCA incidents
     */
    getIncidentRunbook(type: 'leak' | 'doxxing' | 'harassment'): string;
}
//# sourceMappingURL=dmca.service.d.ts.map