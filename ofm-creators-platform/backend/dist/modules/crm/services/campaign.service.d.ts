import { PrismaService } from '@infrastructure/database/prisma.service';
import { QueueService } from '@infrastructure/queue/queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailService } from '@infrastructure/email/email.service';
import { SmsService } from '@infrastructure/sms/sms.service';
import { Campaign } from '@prisma/client';
import { CreateCampaignDto, UpdateCampaignDto, CampaignFilterDto, CampaignMetricsDto, SendTestCampaignDto } from '../dto/campaign.dto';
import { FanManagementService } from './fan-management.service';
import { TemplateService } from './template.service';
export declare class CampaignService {
    private readonly prisma;
    private readonly queue;
    private readonly eventEmitter;
    private readonly email;
    private readonly sms;
    private readonly fanManagement;
    private readonly templates;
    constructor(prisma: PrismaService, queue: QueueService, eventEmitter: EventEmitter2, email: EmailService, sms: SmsService, fanManagement: FanManagementService, templates: TemplateService);
    /**
     * Crée une nouvelle campagne
     */
    createCampaign(creatorId: string, dto: CreateCampaignDto): Promise<Campaign>;
    /**
     * Met à jour une campagne
     */
    updateCampaign(campaignId: string, creatorId: string, dto: UpdateCampaignDto): Promise<Campaign>;
    /**
     * Envoie une campagne de test
     */
    sendTestCampaign(campaignId: string, creatorId: string, dto: SendTestCampaignDto): Promise<void>;
    /**
     * Lance l'envoi d'une campagne
     */
    sendCampaign(campaignId: string, creatorId: string): Promise<Campaign>;
    /**
     * Process l'envoi d'une campagne (appelé par le worker)
     */
    processCampaignSend(campaignId: string): Promise<void>;
    /**
     * Obtient les métriques d'une campagne
     */
    getCampaignMetrics(campaignId: string): Promise<CampaignMetricsDto>;
    /**
     * Enregistre l'ouverture d'une campagne
     */
    trackOpen(campaignId: string, fanId: string): Promise<void>;
    /**
     * Enregistre un clic dans une campagne
     */
    trackClick(campaignId: string, fanId: string, link: string): Promise<void>;
    /**
     * Obtient les campagnes d'un créateur
     */
    getCampaigns(creatorId: string, filter: CampaignFilterDto): Promise<{
        campaigns: Campaign[];
        total: number;
    }>;
    /**
     * Clone une campagne
     */
    cloneCampaign(campaignId: string, creatorId: string, name: string): Promise<Campaign>;
    private estimateTargetAudience;
    private prepareRecipients;
    private sendToRecipient;
    private personalizeContent;
    private calculateCampaignRevenue;
    private applyTemplate;
    private storeInAppMessage;
}
//# sourceMappingURL=campaign.service.d.ts.map