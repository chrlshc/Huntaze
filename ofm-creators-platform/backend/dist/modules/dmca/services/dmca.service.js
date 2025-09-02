"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmcaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/infrastructure/database/prisma.service");
const audit_log_service_1 = require("@/modules/audit/services/audit-log.service");
const media_processor_service_1 = require("@/modules/media/services/media-processor.service");
const email_service_1 = require("@/modules/email/services/email.service");
let DmcaService = class DmcaService {
    prisma;
    auditLog;
    mediaProcessor;
    emailService;
    constructor(prisma, auditLog, mediaProcessor, emailService) {
        this.prisma = prisma;
        this.auditLog = auditLog;
        this.mediaProcessor = mediaProcessor;
        this.emailService = emailService;
    }
    /**
     * Create a new DMCA takedown request
     */
    async createTakedownRequest(userId, request) {
        // Get original content hash if media ID provided
        let originalHash;
        if (request.originalMediaId) {
            const media = await this.prisma.media.findUnique({
                where: { id: request.originalMediaId },
                select: { hash: true, userId: true },
            });
            // Verify ownership
            if (media && media.userId === userId) {
                originalHash = media.hash;
            }
        }
        // Create takedown request
        const takedown = await this.prisma.dmcaTakedown.create({
            data: {
                reporterId: userId,
                contentUrl: request.contentUrl,
                platform: request.platform,
                description: request.description,
                evidenceUrls: request.evidenceUrls,
                originalHash,
                status: 'pending',
            },
        });
        // Log the request
        await this.auditLog.log({
            userId,
            action: 'dmca_takedown_create',
            resource: 'dmca',
            resourceId: takedown.id,
            details: {
                platform: request.platform,
                url: request.contentUrl,
            },
        });
        // Send notification email
        await this.notifyDmcaTeam(takedown.id, request);
        return takedown.id;
    }
    /**
     * Get takedown requests for a user
     */
    async getUserTakedowns(userId, status) {
        return this.prisma.dmcaTakedown.findMany({
            where: {
                reporterId: userId,
                ...(status && { status }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Update takedown status (admin only)
     */
    async updateTakedownStatus(adminId, takedownId, update) {
        const takedown = await this.prisma.dmcaTakedown.findUnique({
            where: { id: takedownId },
        });
        if (!takedown) {
            throw new Error('Takedown request not found');
        }
        // Update the takedown
        await this.prisma.dmcaTakedown.update({
            where: { id: takedownId },
            data: {
                ...update,
                processedBy: adminId,
                processedAt: new Date(),
            },
        });
        // Log the update
        await this.auditLog.log({
            userId: adminId,
            action: 'dmca_takedown_update',
            resource: 'dmca',
            resourceId: takedownId,
            details: update,
        });
        // Notify the reporter
        if (update.status === 'completed' || update.status === 'rejected') {
            await this.notifyReporter(takedownId, update.status);
        }
    }
    /**
     * Generate DMCA notice template
     */
    generateDmcaNotice(takedown) {
        const date = new Date().toISOString().split('T')[0];
        return `
DMCA TAKEDOWN NOTICE

Date: ${date}
Reference: ${takedown.id}

To: ${takedown.platform} Legal Department

I am writing to notify you of copyright infringement on your platform.

1. IDENTIFICATION OF COPYRIGHTED WORK
Original content created and owned by user ID: ${takedown.reporterId}
${takedown.originalHash ? `Content Hash: ${takedown.originalHash}` : ''}

2. INFRINGING MATERIAL
URL: ${takedown.contentUrl}
Platform: ${takedown.platform}
Description: ${takedown.description}

3. EVIDENCE
The following URLs contain evidence of the original work:
${takedown.evidenceUrls.map((url) => `- ${url}`).join('\n')}

4. STATEMENT OF GOOD FAITH
I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

5. STATEMENT OF ACCURACY
The information in this notification is accurate, and under penalty of perjury, I am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

6. CONTACT INFORMATION
Huntaze Platform
Email: dmca@huntaze.com
Address: [Your Company Address]

Please remove the infringing content within 24 hours to avoid further legal action.

Sincerely,
Huntaze DMCA Team
On behalf of User ${takedown.reporterId}
    `.trim();
    }
    /**
     * Check if content matches known hashes
     */
    async checkContentMatch(contentHash, userId) {
        const match = await this.prisma.media.findFirst({
            where: {
                hash: contentHash,
                userId,
            },
        });
        return !!match;
    }
    /**
     * Get DMCA statistics
     */
    async getDmcaStats(userId) {
        const where = userId ? { reporterId: userId } : {};
        const [total, pending, completed, rejected, responseTimeData] = await Promise.all([
            this.prisma.dmcaTakedown.count({ where }),
            this.prisma.dmcaTakedown.count({ where: { ...where, status: 'pending' } }),
            this.prisma.dmcaTakedown.count({ where: { ...where, status: 'completed' } }),
            this.prisma.dmcaTakedown.count({ where: { ...where, status: 'rejected' } }),
            this.prisma.$queryRaw `
        SELECT AVG(EXTRACT(EPOCH FROM (processed_at - created_at))/3600) as avg_hours
        FROM dmca_takedowns
        WHERE processed_at IS NOT NULL
        ${userId ? `AND reporter_id = ${userId}` : ''}
      `,
        ]);
        return {
            total,
            pending,
            completed,
            rejected,
            averageResponseTime: responseTimeData[0]?.avg_hours || 0,
        };
    }
    /**
     * Notify DMCA team of new request
     */
    async notifyDmcaTeam(takedownId, request) {
        await this.emailService.sendEmail({
            to: process.env.DMCA_TEAM_EMAIL || 'dmca@huntaze.com',
            subject: `New DMCA Takedown Request - ${request.platform}`,
            template: 'dmca-new-request',
            data: {
                takedownId,
                platform: request.platform,
                url: request.contentUrl,
                description: request.description,
                evidenceCount: request.evidenceUrls.length,
            },
        });
    }
    /**
     * Notify reporter of status update
     */
    async notifyReporter(takedownId, status) {
        const takedown = await this.prisma.dmcaTakedown.findUnique({
            where: { id: takedownId },
            include: {
                reporter: {
                    select: { email: true, name: true },
                },
            },
        });
        if (!takedown)
            return;
        await this.emailService.sendEmail({
            to: takedown.reporter.email,
            subject: `DMCA Takedown Update - ${status === 'completed' ? 'Completed' : 'Rejected'}`,
            template: 'dmca-status-update',
            data: {
                name: takedown.reporter.name,
                status,
                platform: takedown.platform,
                url: takedown.contentUrl,
                responseNotes: takedown.responseNotes,
            },
        });
    }
    /**
     * Generate runbook for DMCA incidents
     */
    getIncidentRunbook(type) {
        const runbooks = {
            leak: `
CONTENT LEAK INCIDENT RUNBOOK

1. IMMEDIATE ACTIONS (0-1 hour)
   □ Document all leaked content URLs
   □ Take screenshots for evidence
   □ Check content hash against database
   □ Identify potential source (watermark analysis)

2. TAKEDOWN PROCESS (1-4 hours)
   □ Submit DMCA notices to all platforms
   □ Contact platform abuse teams directly
   □ Use automated takedown services if available
   □ Document all communication

3. INVESTIGATION (4-24 hours)
   □ Review access logs for suspicious activity
   □ Check for compromised accounts
   □ Analyze watermarks to identify leaker
   □ Review recent subscribers/transactions

4. MITIGATION (ongoing)
   □ Enhance watermarking
   □ Review and update security measures
   □ Consider legal action if source identified
   □ Update content distribution strategy

5. FOLLOW-UP
   □ Monitor for re-uploads
   □ Update DMCA database
   □ Report to law enforcement if applicable
   □ Review and update security protocols
      `,
            doxxing: `
DOXXING INCIDENT RUNBOOK

1. IMMEDIATE SAFETY (0-15 minutes)
   □ Contact local law enforcement
   □ Document all doxxing content
   □ Alert platform security teams
   □ Enable maximum privacy settings

2. EVIDENCE COLLECTION (15-60 minutes)
   □ Screenshot all instances
   □ Save URLs and timestamps
   □ Document threats or harassment
   □ Identify source if possible

3. PLATFORM ACTIONS (1-4 hours)
   □ Report to all platforms
   □ Request expedited review
   □ Contact platform safety teams directly
   □ Request IP bans for perpetrators

4. LEGAL ACTIONS
   □ File police report
   □ Contact attorney
   □ Consider restraining order
   □ Document financial damages

5. ONGOING PROTECTION
   □ Monitor for new instances
   □ Update security measures
   □ Consider professional security consultation
   □ Support resources for affected creator
      `,
            harassment: `
HARASSMENT INCIDENT RUNBOOK

1. IMMEDIATE RESPONSE (0-30 minutes)
   □ Block harassing accounts
   □ Document all harassment
   □ Report to platforms
   □ Assess threat level

2. ESCALATION CRITERIA
   □ Physical threats → Contact law enforcement
   □ Coordinated harassment → Platform security team
   □ Financial extortion → FBI IC3 report
   □ Minors involved → NCMEC report

3. PLATFORM ACTIONS (30 min - 2 hours)
   □ Mass report coordinated harassment
   □ Request IP-level bans
   □ Enable comment filtering
   □ Restrict messaging to subscribers only

4. SUPPORT MEASURES
   □ Provide creator support resources
   □ Consider temporary content pause
   □ Mental health resources
   □ Legal consultation if needed

5. PREVENTION
   □ Update moderation settings
   □ Review fan interaction policies
   □ Implement stricter verification
   □ Education on security best practices
      `,
        };
        return runbooks[type] || 'Runbook not found';
    }
};
exports.DmcaService = DmcaService;
exports.DmcaService = DmcaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, audit_log_service_1.AuditLogService,
        media_processor_service_1.MediaProcessorService,
        email_service_1.EmailService])
], DmcaService);
//# sourceMappingURL=dmca.service.js.map