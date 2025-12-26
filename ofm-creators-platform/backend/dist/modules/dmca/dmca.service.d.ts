import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { S3Service } from '@infrastructure/s3/s3.service';
import { EmailService } from '@infrastructure/email/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateDmcaNoticeDto, SubmitDmcaNoticeDto } from './dto/dmca.dto';
export declare class DmcaService {
    private readonly prisma;
    private readonly s3;
    private readonly emailService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, s3: S3Service, emailService: EmailService, eventEmitter: EventEmitter2);
    /**
     * Create a new DMCA notice
     */
    createNotice(creatorId: string, dto: CreateDmcaNoticeDto, userId: string): Promise<any>;
    /**
     * Generate DMCA notice document
     */
    generateNoticeDocument(noticeId: string, userId: string): Promise<{
        subject: string;
        body: string;
        pdfUrl: any;
        pdfKey: string;
    }>;
    /**
     * Submit DMCA notice
     */
    submitNotice(noticeId: string, dto: SubmitDmcaNoticeDto, userId: string): Promise<{
        method: string;
        recipient: any;
        messageId: any;
        timestamp: Date;
    } | {
        method: string;
        formUrl: any;
        status: string;
        instructions: string;
        documentUrl: any;
    } | {
        method: string;
        endpoint: any;
        status: string;
    }>;
    /**
     * Submit via email
     */
    private submitViaEmail;
    /**
     * Submit via form (placeholder for headless browser automation)
     */
    private submitViaForm;
    /**
     * Submit via API (placeholder for platform-specific APIs)
     */
    private submitViaApi;
    /**
     * Handle acknowledgment
     */
    acknowledgeNotice(noticeId: string, acknowledgmentRef: string, userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Mark as taken down
     */
    markTakenDown(noticeId: string, evidence: any, userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Export notice package
     */
    exportNoticePackage(noticeId: string, userId: string): Promise<{
        downloadUrl: any;
        expiresIn: number;
    }>;
    /**
     * Audit trail
     */
    private auditEvent;
    /**
     * Schedule follow-up reminders
     */
    private scheduleFollowUp;
    /**
     * Check notice status for follow-up
     */
    private checkNoticeStatus;
    /**
     * Update target statistics
     */
    private updateTargetStats;
    /**
     * Extract domain from URL
     */
    private extractDomain;
}
//# sourceMappingURL=dmca.service.d.ts.map