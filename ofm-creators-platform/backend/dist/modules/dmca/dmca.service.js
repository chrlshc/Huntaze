"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DmcaService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmcaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const s3_service_1 = require("@infrastructure/s3/s3.service");
const email_service_1 = require("@infrastructure/email/email.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const Handlebars = __importStar(require("handlebars"));
const pdf_lib_1 = require("pdf-lib");
let DmcaService = DmcaService_1 = class DmcaService {
    prisma;
    s3;
    emailService;
    eventEmitter;
    logger = new common_1.Logger(DmcaService_1.name);
    constructor(prisma, s3, emailService, eventEmitter) {
        this.prisma = prisma;
        this.s3 = s3;
        this.emailService = emailService;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Create a new DMCA notice
     */
    async createNotice(creatorId, dto, userId) {
        // Validate asset ownership
        if (dto.assetId) {
            const asset = await this.prisma.asset.findUnique({
                where: { id: dto.assetId }
            });
            if (!asset || asset.creatorId !== creatorId) {
                throw new common_1.BadRequestException('Asset not found or unauthorized');
            }
        }
        // Get target info if known
        const targetInfo = await this.prisma.piracyTarget.findFirst({
            where: { domain: this.extractDomain(dto.targetSite) }
        });
        const notice = await this.prisma.dmcaNotice.create({
            data: {
                creatorId,
                assetId: dto.assetId,
                type: dto.type || 'copyright',
                title: dto.title,
                description: dto.description,
                targetSite: dto.targetSite,
                targetUrls: dto.targetUrls,
                evidenceUrls: dto.evidenceUrls || [],
                abuseEmail: dto.abuseEmail || targetInfo?.abuseEmail,
                abuseFormUrl: dto.abuseFormUrl || targetInfo?.abuseFormUrl,
                metadata: {
                    createdBy: userId,
                    targetInfo: targetInfo ? {
                        name: targetInfo.name,
                        responseTimeDays: targetInfo.responseTimeDays,
                        successRate: targetInfo.successRate
                    } : null
                }
            }
        });
        // Audit event
        await this.auditEvent(notice.id, userId, 'create_notice', null, 'draft', {
            notice: notice
        });
        return notice;
    }
    /**
     * Generate DMCA notice document
     */
    async generateNoticeDocument(noticeId, userId) {
        const notice = await this.prisma.dmcaNotice.findUnique({
            where: { id: noticeId },
            include: {
                creator: true,
                asset: true
            }
        });
        if (!notice) {
            throw new common_1.NotFoundException('Notice not found');
        }
        // Get template
        const template = await this.prisma.dmcaTemplate.findFirst({
            where: {
                id: notice.metadata?.templateId || 'default_copyright_en',
                active: true
            }
        });
        if (!template) {
            throw new common_1.BadRequestException('Template not found');
        }
        // Prepare template data
        const templateData = {
            creator_name: notice.creator.businessName || notice.creator.name,
            asset_title: notice.asset?.title || notice.title,
            original_url: notice.asset?.publicUrl || notice.metadata?.originalUrl,
            publication_date: notice.asset?.createdAt.toISOString().split('T')[0],
            infringing_urls: notice.targetUrls.join('\n'),
            target_site: notice.targetSite,
            sender_name: notice.creator.legalName || notice.creator.name,
            sender_email: notice.creator.email,
            sender_phone: notice.creator.phone || 'N/A',
            sender_address: notice.creator.address || 'On file',
            electronic_signature: `/s/ ${notice.creator.legalName || notice.creator.name}`,
            date: new Date().toISOString().split('T')[0],
            deadline: notice.metadata?.deadline || '48'
        };
        // Compile templates
        const subjectTemplate = Handlebars.compile(template.subjectTemplate);
        const bodyTemplate = Handlebars.compile(template.bodyTemplate);
        const subject = subjectTemplate(templateData);
        const body = bodyTemplate(templateData);
        // Generate PDF
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        // Add content to PDF
        page.drawText('DMCA TAKEDOWN NOTICE', {
            x: 50,
            y: height - 50,
            size: 20,
            color: (0, pdf_lib_1.rgb)(0, 0, 0)
        });
        // Split body into lines and add to PDF
        const lines = body.split('\n');
        let yPosition = height - 100;
        for (const line of lines) {
            if (yPosition < 50) {
                // Add new page if needed
                const newPage = pdfDoc.addPage();
                yPosition = newPage.getSize().height - 50;
            }
            page.drawText(line, {
                x: 50,
                y: yPosition,
                size: 12,
                color: (0, pdf_lib_1.rgb)(0, 0, 0)
            });
            yPosition -= 20;
        }
        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const pdfKey = `dmca/${noticeId}/notice_${Date.now()}.pdf`;
        const uploadResult = await this.s3.uploadFile({
            Key: pdfKey,
            Body: Buffer.from(pdfBytes),
            ContentType: 'application/pdf',
            Metadata: {
                noticeId,
                creatorId: notice.creatorId
            }
        });
        // Update notice with document
        await this.prisma.dmcaNotice.update({
            where: { id: noticeId },
            data: {
                attachmentsS3: {
                    push: {
                        key: pdfKey,
                        bucket: uploadResult.bucket,
                        size: pdfBytes.length,
                        type: 'notice_pdf',
                        uploadedAt: new Date()
                    }
                }
            }
        });
        // Audit event
        await this.auditEvent(noticeId, userId, 'generate_document', null, null, {
            documentKey: pdfKey
        });
        return {
            subject,
            body,
            pdfUrl: await this.s3.getSignedUrl(pdfKey, 3600), // 1 hour expiry
            pdfKey
        };
    }
    /**
     * Submit DMCA notice
     */
    async submitNotice(noticeId, dto, userId) {
        const notice = await this.prisma.dmcaNotice.findUnique({
            where: { id: noticeId }
        });
        if (!notice) {
            throw new common_1.NotFoundException('Notice not found');
        }
        if (notice.status !== 'draft') {
            throw new common_1.BadRequestException('Notice already submitted');
        }
        // Generate document if not exists
        const document = await this.generateNoticeDocument(noticeId, userId);
        let submissionResult;
        switch (dto.method) {
            case 'email':
                submissionResult = await this.submitViaEmail(notice, document, dto);
                break;
            case 'form':
                submissionResult = await this.submitViaForm(notice, document, dto);
                break;
            case 'api':
                submissionResult = await this.submitViaApi(notice, document, dto);
                break;
            default:
                throw new common_1.BadRequestException('Invalid submission method');
        }
        // Update notice
        await this.prisma.dmcaNotice.update({
            where: { id: noticeId },
            data: {
                status: 'submitted',
                submittedAt: new Date(),
                submittedBy: userId,
                submittedMethod: dto.method,
                metadata: {
                    ...notice.metadata,
                    submissionResult
                }
            }
        });
        // Update target stats
        if (notice.targetSite) {
            await this.prisma.piracyTarget.update({
                where: { domain: this.extractDomain(notice.targetSite) },
                data: {
                    totalNoticesSent: { increment: 1 }
                }
            });
        }
        // Audit event
        await this.auditEvent(noticeId, userId, 'submit_notice', 'draft', 'submitted', {
            method: dto.method,
            result: submissionResult
        });
        // Schedule follow-up
        this.scheduleFollowUp(noticeId);
        return submissionResult;
    }
    /**
     * Submit via email
     */
    async submitViaEmail(notice, document, dto) {
        const toEmail = dto.recipientEmail || notice.abuseEmail;
        if (!toEmail) {
            throw new common_1.BadRequestException('No recipient email specified');
        }
        const result = await this.emailService.send({
            to: toEmail,
            subject: document.subject,
            text: document.body,
            attachments: [
                {
                    filename: `DMCA_Notice_${notice.id}.pdf`,
                    path: document.pdfUrl
                }
            ],
            headers: {
                'X-DMCA-Notice-ID': notice.id,
                'X-Priority': '1 (Highest)'
            }
        });
        return {
            method: 'email',
            recipient: toEmail,
            messageId: result.messageId,
            timestamp: new Date()
        };
    }
    /**
     * Submit via form (placeholder for headless browser automation)
     */
    async submitViaForm(notice, document, dto) {
        // TODO: Implement Puppeteer/Playwright automation
        this.logger.warn('Form submission not yet implemented');
        return {
            method: 'form',
            formUrl: notice.abuseFormUrl,
            status: 'manual_required',
            instructions: 'Please submit manually using the generated document',
            documentUrl: document.pdfUrl
        };
    }
    /**
     * Submit via API (placeholder for platform-specific APIs)
     */
    async submitViaApi(notice, document, dto) {
        // TODO: Implement platform-specific APIs
        this.logger.warn('API submission not yet implemented');
        return {
            method: 'api',
            endpoint: notice.metadata?.apiEndpoint,
            status: 'not_implemented'
        };
    }
    /**
     * Handle acknowledgment
     */
    async acknowledgeNotice(noticeId, acknowledgmentRef, userId) {
        const notice = await this.prisma.dmcaNotice.findUnique({
            where: { id: noticeId }
        });
        if (!notice) {
            throw new common_1.NotFoundException('Notice not found');
        }
        await this.prisma.dmcaNotice.update({
            where: { id: noticeId },
            data: {
                status: 'acknowledged',
                acknowledgedAt: new Date(),
                acknowledgmentRef
            }
        });
        await this.auditEvent(noticeId, userId, 'acknowledge_notice', notice.status, 'acknowledged', {
            acknowledgmentRef
        });
        return { success: true };
    }
    /**
     * Mark as taken down
     */
    async markTakenDown(noticeId, evidence, userId) {
        const notice = await this.prisma.dmcaNotice.findUnique({
            where: { id: noticeId }
        });
        if (!notice) {
            throw new common_1.NotFoundException('Notice not found');
        }
        const takenDownAt = new Date();
        await this.prisma.dmcaNotice.update({
            where: { id: noticeId },
            data: {
                status: 'taken_down',
                takenDownAt,
                metadata: {
                    ...notice.metadata,
                    takedownEvidence: evidence
                }
            }
        });
        // Calculate response time and update target stats
        if (notice.submittedAt && notice.targetSite) {
            const responseDays = Math.ceil((takenDownAt.getTime() - notice.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
            await this.updateTargetStats(notice.targetSite, true, responseDays);
        }
        await this.auditEvent(noticeId, userId, 'mark_taken_down', notice.status, 'taken_down', {
            evidence
        });
        return { success: true };
    }
    /**
     * Export notice package
     */
    async exportNoticePackage(noticeId, userId) {
        const notice = await this.prisma.dmcaNotice.findUnique({
            where: { id: noticeId },
            include: {
                creator: true,
                asset: true,
                dmcaEvents: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!notice) {
            throw new common_1.NotFoundException('Notice not found');
        }
        // Create export package
        const exportData = {
            notice: {
                ...notice,
                creator: {
                    name: notice.creator.name,
                    email: notice.creator.email
                }
            },
            events: notice.dmcaEvents,
            exportedAt: new Date(),
            exportedBy: userId
        };
        // Generate export JSON
        const jsonKey = `dmca/${noticeId}/export_${Date.now()}.json`;
        await this.s3.uploadFile({
            Key: jsonKey,
            Body: JSON.stringify(exportData, null, 2),
            ContentType: 'application/json'
        });
        // TODO: Create ZIP with all attachments
        await this.auditEvent(noticeId, userId, 'export_package', null, null, {
            exportKey: jsonKey
        });
        return {
            downloadUrl: await this.s3.getSignedUrl(jsonKey, 3600),
            expiresIn: 3600
        };
    }
    /**
     * Audit trail
     */
    async auditEvent(noticeId, actorId, action, previousStatus, newStatus, payload = {}) {
        // Set current user for trigger
        await this.prisma.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${actorId}'`);
        await this.prisma.dmcaEvent.create({
            data: {
                noticeId,
                actorId,
                action,
                previousStatus,
                newStatus,
                payload
            }
        });
        // Emit event for webhooks
        this.eventEmitter.emit('dmca.event', {
            noticeId,
            action,
            actorId,
            timestamp: new Date()
        });
    }
    /**
     * Schedule follow-up reminders
     */
    scheduleFollowUp(noticeId) {
        // TODO: Implement with BullMQ
        setTimeout(() => {
            this.checkNoticeStatus(noticeId);
        }, 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    /**
     * Check notice status for follow-up
     */
    async checkNoticeStatus(noticeId) {
        const notice = await this.prisma.dmcaNotice.findUnique({
            where: { id: noticeId }
        });
        if (notice && notice.status === 'submitted') {
            // Send reminder
            this.eventEmitter.emit('dmca.reminder', {
                noticeId,
                daysSinceSubmission: 7
            });
        }
    }
    /**
     * Update target statistics
     */
    async updateTargetStats(targetSite, success, responseDays) {
        const domain = this.extractDomain(targetSite);
        const target = await this.prisma.piracyTarget.findUnique({
            where: { domain }
        });
        if (target) {
            const newSuccessCount = success ? (target.totalNoticesSent * (target.successRate || 0) / 100) + 1 :
                (target.totalNoticesSent * (target.successRate || 0) / 100);
            const newSuccessRate = (newSuccessCount / target.totalNoticesSent) * 100;
            const updates = {
                successRate: newSuccessRate
            };
            if (responseDays !== undefined) {
                const currentAvg = target.avgResponseDays || 0;
                const currentCount = Math.floor(target.totalNoticesSent * (target.successRate || 0) / 100);
                updates.avgResponseDays = ((currentAvg * currentCount) + responseDays) / (currentCount + 1);
            }
            await this.prisma.piracyTarget.update({
                where: { domain },
                data: updates
            });
        }
    }
    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return urlObj.hostname.replace('www.', '');
        }
        catch {
            return url;
        }
    }
};
exports.DmcaService = DmcaService;
exports.DmcaService = DmcaService = DmcaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _a : Object, typeof (_b = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _b : Object, event_emitter_1.EventEmitter2])
], DmcaService);
//# sourceMappingURL=dmca.service.js.map