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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const queue_service_1 = require("@infrastructure/queue/queue.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const email_service_1 = require("@infrastructure/email/email.service");
const sms_service_1 = require("@infrastructure/sms/sms.service");
const client_1 = require("@prisma/client");
const fan_management_service_1 = require("./fan-management.service");
const template_service_1 = require("./template.service");
const date_fns_1 = require("date-fns");
let CampaignService = class CampaignService {
    prisma;
    queue;
    eventEmitter;
    email;
    sms;
    fanManagement;
    templates;
    constructor(prisma, queue, eventEmitter, email, sms, fanManagement, templates) {
        this.prisma = prisma;
        this.queue = queue;
        this.eventEmitter = eventEmitter;
        this.email = email;
        this.sms = sms;
        this.fanManagement = fanManagement;
        this.templates = templates;
    }
    /**
     * Crée une nouvelle campagne
     */
    async createCampaign(creatorId, dto) {
        // Valider le ciblage
        const targetCount = await this.estimateTargetAudience(creatorId, dto.targetTags, dto.targetSegment);
        if (targetCount === 0) {
            throw new Error('No recipients match the targeting criteria');
        }
        // Créer la campagne
        const campaign = await this.prisma.campaign.create({
            data: {
                creatorId,
                name: dto.name,
                type: dto.type,
                status: client_1.CampaignStatus.DRAFT,
                subject: dto.subject,
                content: dto.content,
                targetTags: dto.targetTags || [],
                targetSegment: dto.targetSegment || {},
                scheduledFor: dto.scheduledFor
            }
        });
        // Si template fourni, appliquer le template
        if (dto.templateId) {
            await this.applyTemplate(campaign.id, dto.templateId);
        }
        this.eventEmitter.emit('campaign.created', {
            campaignId: campaign.id,
            creatorId,
            targetCount
        });
        return campaign;
    }
    /**
     * Met à jour une campagne
     */
    async updateCampaign(campaignId, creatorId, dto) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, creatorId }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        if (campaign.status !== client_1.CampaignStatus.DRAFT) {
            throw new Error('Only draft campaigns can be updated');
        }
        // Re-estimer l'audience si le ciblage change
        let targetCount = undefined;
        if (dto.targetTags || dto.targetSegment) {
            targetCount = await this.estimateTargetAudience(creatorId, dto.targetTags || campaign.targetTags, dto.targetSegment || campaign.targetSegment);
        }
        const updated = await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                name: dto.name,
                type: dto.type,
                subject: dto.subject,
                content: dto.content,
                targetTags: dto.targetTags,
                targetSegment: dto.targetSegment,
                scheduledFor: dto.scheduledFor
            }
        });
        return updated;
    }
    /**
     * Envoie une campagne de test
     */
    async sendTestCampaign(campaignId, creatorId, dto) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, creatorId }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        // Envoyer selon le type
        switch (campaign.type) {
            case client_1.CampaignType.EMAIL:
                await this.email.send({
                    to: dto.testEmail,
                    subject: `[TEST] ${campaign.subject}`,
                    html: campaign.content,
                    tags: ['test', 'campaign', campaign.id]
                });
                break;
            case client_1.CampaignType.SMS:
                await this.sms.send({
                    to: dto.testPhone,
                    message: `[TEST] ${campaign.content}`,
                    tags: ['test', 'campaign', campaign.id]
                });
                break;
            default:
                throw new Error(`Test not supported for campaign type: ${campaign.type}`);
        }
        this.eventEmitter.emit('campaign.test.sent', {
            campaignId,
            creatorId,
            recipient: dto.testEmail || dto.testPhone
        });
    }
    /**
     * Lance l'envoi d'une campagne
     */
    async sendCampaign(campaignId, creatorId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, creatorId },
            include: { _count: { select: { recipients: true } } }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        if (campaign.status !== client_1.CampaignStatus.DRAFT) {
            throw new Error('Campaign has already been sent or scheduled');
        }
        // Préparer les destinataires
        const recipients = await this.prepareRecipients(campaign.id, creatorId, campaign.targetTags, campaign.targetSegment);
        if (recipients.length === 0) {
            throw new Error('No valid recipients found');
        }
        // Mettre à jour le statut
        const updated = await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: campaign.scheduledFor && (0, date_fns_1.isAfter)(campaign.scheduledFor, new Date())
                    ? client_1.CampaignStatus.SCHEDULED
                    : client_1.CampaignStatus.SENDING,
                sentAt: campaign.scheduledFor || new Date()
            }
        });
        // Planifier ou envoyer immédiatement
        if (updated.status === client_1.CampaignStatus.SCHEDULED) {
            await this.queue.add('campaign.send', { campaignId }, { delay: updated.scheduledFor.getTime() - Date.now() });
        }
        else {
            await this.queue.add('campaign.send', { campaignId });
        }
        this.eventEmitter.emit('campaign.launched', {
            campaignId,
            creatorId,
            recipientCount: recipients.length,
            status: updated.status
        });
        return updated;
    }
    /**
     * Process l'envoi d'une campagne (appelé par le worker)
     */
    async processCampaignSend(campaignId) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                recipients: {
                    where: { status: client_1.RecipientStatus.PENDING },
                    take: 100, // Batch de 100
                    include: {
                        fan: true
                    }
                }
            }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        // Mettre à jour le statut si nécessaire
        if (campaign.status !== client_1.CampaignStatus.SENDING) {
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { status: client_1.CampaignStatus.SENDING }
            });
        }
        // Envoyer aux destinataires du batch
        const sendPromises = campaign.recipients.map(recipient => this.sendToRecipient(campaign, recipient));
        await Promise.allSettled(sendPromises);
        // Vérifier s'il reste des destinataires
        const pendingCount = await this.prisma.campaignRecipient.count({
            where: {
                campaignId,
                status: client_1.RecipientStatus.PENDING
            }
        });
        if (pendingCount > 0) {
            // Programmer le prochain batch
            await this.queue.add('campaign.send', { campaignId }, { delay: 1000 } // 1 seconde entre les batchs
            );
        }
        else {
            // Campagne terminée
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { status: client_1.CampaignStatus.SENT }
            });
            // Calculer les métriques finales
            const metrics = await this.getCampaignMetrics(campaignId);
            this.eventEmitter.emit('campaign.completed', {
                campaignId,
                metrics
            });
        }
    }
    /**
     * Obtient les métriques d'une campagne
     */
    async getCampaignMetrics(campaignId) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                _count: {
                    select: {
                        recipients: true
                    }
                }
            }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        const recipientStats = await this.prisma.campaignRecipient.groupBy({
            by: ['status'],
            where: { campaignId },
            _count: true
        });
        const statusCounts = recipientStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
        }, {});
        // Calculer les taux
        const totalRecipients = campaign._count.recipients;
        const sent = statusCounts.SENT || 0;
        const opened = statusCounts.OPENED || 0;
        const clicked = statusCounts.CLICKED || 0;
        const failed = statusCounts.FAILED || 0;
        const metrics = {
            campaignId,
            totalRecipients,
            sent,
            delivered: sent - failed,
            opened,
            clicked,
            failed,
            deliveryRate: totalRecipients > 0 ? ((sent - failed) / totalRecipients) * 100 : 0,
            openRate: sent > 0 ? (opened / sent) * 100 : 0,
            clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
            // Revenus générés (si tracking activé)
            revenue: await this.calculateCampaignRevenue(campaignId),
            // Timeline
            timeline: {
                created: campaign.createdAt,
                scheduled: campaign.scheduledFor,
                started: campaign.sentAt,
                completed: campaign.status === client_1.CampaignStatus.SENT ? campaign.updatedAt : undefined
            }
        };
        return metrics;
    }
    /**
     * Enregistre l'ouverture d'une campagne
     */
    async trackOpen(campaignId, fanId) {
        const recipient = await this.prisma.campaignRecipient.findUnique({
            where: {
                campaignId_fanId: {
                    campaignId,
                    fanId
                }
            }
        });
        if (!recipient || recipient.status === client_1.RecipientStatus.OPENED || recipient.status === client_1.RecipientStatus.CLICKED) {
            return; // Déjà ouvert
        }
        await this.prisma.campaignRecipient.update({
            where: {
                campaignId_fanId: {
                    campaignId,
                    fanId
                }
            },
            data: {
                status: client_1.RecipientStatus.OPENED,
                openedAt: new Date()
            }
        });
        // Mettre à jour les métriques de la campagne
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                openCount: { increment: 1 }
            }
        });
        this.eventEmitter.emit('campaign.opened', {
            campaignId,
            fanId
        });
    }
    /**
     * Enregistre un clic dans une campagne
     */
    async trackClick(campaignId, fanId, link) {
        await this.prisma.campaignRecipient.update({
            where: {
                campaignId_fanId: {
                    campaignId,
                    fanId
                }
            },
            data: {
                status: client_1.RecipientStatus.CLICKED,
                clickedAt: new Date()
            }
        });
        // Mettre à jour les métriques
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                clickCount: { increment: 1 }
            }
        });
        this.eventEmitter.emit('campaign.clicked', {
            campaignId,
            fanId,
            link
        });
    }
    /**
     * Obtient les campagnes d'un créateur
     */
    async getCampaigns(creatorId, filter) {
        const where = {
            creatorId,
            ...(filter.status && { status: filter.status }),
            ...(filter.type && { type: filter.type }),
            ...(filter.search && {
                OR: [
                    { name: { contains: filter.search, mode: 'insensitive' } },
                    { subject: { contains: filter.search, mode: 'insensitive' } }
                ]
            })
        };
        const [campaigns, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where,
                skip: (filter.page - 1) * filter.limit,
                take: filter.limit,
                orderBy: { [filter.sortBy]: filter.sortOrder },
                include: {
                    _count: {
                        select: {
                            recipients: true
                        }
                    }
                }
            }),
            this.prisma.campaign.count({ where })
        ]);
        return { campaigns, total };
    }
    /**
     * Clone une campagne
     */
    async cloneCampaign(campaignId, creatorId, name) {
        const original = await this.prisma.campaign.findFirst({
            where: { id: campaignId, creatorId }
        });
        if (!original) {
            throw new Error('Campaign not found');
        }
        const cloned = await this.prisma.campaign.create({
            data: {
                creatorId,
                name,
                type: original.type,
                status: client_1.CampaignStatus.DRAFT,
                subject: original.subject,
                content: original.content,
                targetTags: original.targetTags,
                targetSegment: original.targetSegment
            }
        });
        return cloned;
    }
    // Méthodes privées
    async estimateTargetAudience(creatorId, tags, segment) {
        const where = {
            creatorId,
            ...(tags && tags.length > 0 && { tags: { hasSome: tags } })
        };
        // Ajouter les critères de segment
        if (segment) {
            if (segment.minLifetimeValue) {
                where.lifetimeValue = { gte: segment.minLifetimeValue };
            }
            if (segment.minEngagementScore) {
                where.engagementScore = { gte: segment.minEngagementScore };
            }
            // Ajouter d'autres critères selon les besoins
        }
        // Filtrer selon les opt-ins
        return this.prisma.fanRelation.count({
            where: {
                ...where,
                OR: [
                    { emailOptIn: true },
                    { smsOptIn: true }
                ]
            }
        });
    }
    async prepareRecipients(campaignId, creatorId, tags, segment) {
        // Obtenir les fans ciblés
        const where = {
            creatorId,
            ...(tags.length > 0 && { tags: { hasSome: tags } })
        };
        // Appliquer les critères de segment
        if (segment) {
            if (segment.minLifetimeValue) {
                where.lifetimeValue = { gte: segment.minLifetimeValue };
            }
            if (segment.minEngagementScore) {
                where.engagementScore = { gte: segment.minEngagementScore };
            }
        }
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        // Filtrer selon le type de campagne et les opt-ins
        if (campaign.type === client_1.CampaignType.EMAIL) {
            where.emailOptIn = true;
        }
        else if (campaign.type === client_1.CampaignType.SMS) {
            where.smsOptIn = true;
        }
        const fanRelations = await this.prisma.fanRelation.findMany({
            where,
            include: {
                fan: {
                    select: {
                        id: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            }
        });
        // Créer les enregistrements de destinataires
        const recipientData = fanRelations
            .filter(fr => {
            if (campaign.type === client_1.CampaignType.EMAIL && !fr.fan.email)
                return false;
            if (campaign.type === client_1.CampaignType.SMS && !fr.fan.phoneNumber)
                return false;
            return true;
        })
            .map(fr => ({
            campaignId,
            fanId: fr.fan.id,
            status: client_1.RecipientStatus.PENDING
        }));
        // Insérer en batch
        await this.prisma.campaignRecipient.createMany({
            data: recipientData,
            skipDuplicates: true
        });
        return this.prisma.campaignRecipient.findMany({
            where: { campaignId }
        });
    }
    async sendToRecipient(campaign, recipient) {
        try {
            // Personnaliser le contenu
            const personalizedContent = await this.personalizeContent(campaign.content, recipient.fan);
            switch (campaign.type) {
                case client_1.CampaignType.EMAIL:
                    await this.email.send({
                        to: recipient.fan.email,
                        subject: campaign.subject,
                        html: personalizedContent,
                        tags: ['campaign', campaign.id],
                        trackingId: `${campaign.id}:${recipient.fanId}`
                    });
                    break;
                case client_1.CampaignType.SMS:
                    await this.sms.send({
                        to: recipient.fan.phoneNumber,
                        message: personalizedContent,
                        tags: ['campaign', campaign.id]
                    });
                    break;
                case client_1.CampaignType.PUSH:
                    // À implémenter avec un service de push notifications
                    break;
                case client_1.CampaignType.IN_APP:
                    // Stocker pour affichage in-app
                    await this.storeInAppMessage(campaign, recipient.fanId);
                    break;
            }
            // Marquer comme envoyé
            await this.prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: {
                    status: client_1.RecipientStatus.SENT,
                    sentAt: new Date()
                }
            });
            // Incrémenter le compteur
            await this.prisma.campaign.update({
                where: { id: campaign.id },
                data: { sentCount: { increment: 1 } }
            });
        }
        catch (error) {
            // Marquer comme échoué
            await this.prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: { status: client_1.RecipientStatus.FAILED }
            });
            console.error(`Failed to send campaign ${campaign.id} to ${recipient.fanId}:`, error);
        }
    }
    async personalizeContent(content, fan) {
        // Remplacer les variables de personnalisation
        return content
            .replace(/\{\{email\}\}/g, fan.email || '')
            .replace(/\{\{username\}\}/g, fan.username || '')
            .replace(/\{\{displayName\}\}/g, fan.displayName || fan.username || 'Fan');
    }
    async calculateCampaignRevenue(campaignId) {
        // Calculer les revenus générés dans les 7 jours suivant la campagne
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId }
        });
        if (!campaign || !campaign.sentAt) {
            return 0;
        }
        const endDate = (0, date_fns_1.addHours)(campaign.sentAt, 168); // 7 jours
        const recipients = await this.prisma.campaignRecipient.findMany({
            where: {
                campaignId,
                status: { in: [client_1.RecipientStatus.OPENED, client_1.RecipientStatus.CLICKED] }
            },
            select: { fanId: true }
        });
        const fanIds = recipients.map(r => r.fanId);
        const result = await this.prisma.transaction.aggregate({
            where: {
                creatorId: campaign.creatorId,
                fanId: { in: fanIds },
                createdAt: {
                    gte: campaign.sentAt,
                    lte: endDate
                },
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount?.toNumber() || 0;
    }
    async applyTemplate(campaignId, templateId) {
        const template = await this.templates.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                subject: template.subject,
                content: template.content
            }
        });
    }
    async storeInAppMessage(campaign, fanId) {
        // Stocker le message pour affichage in-app
        // Cette fonctionnalité nécessiterait une table dédiée pour les messages in-app
        await this.cache.set(`inapp:${fanId}:${campaign.id}`, {
            campaignId: campaign.id,
            content: campaign.content,
            createdAt: new Date()
        }, 86400 * 30 // 30 jours
        );
    }
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof queue_service_1.QueueService !== "undefined" && queue_service_1.QueueService) === "function" ? _b : Object, event_emitter_1.EventEmitter2, typeof (_c = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _c : Object, typeof (_d = typeof sms_service_1.SmsService !== "undefined" && sms_service_1.SmsService) === "function" ? _d : Object, fan_management_service_1.FanManagementService,
        template_service_1.TemplateService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map