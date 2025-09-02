import { CacheService } from '@infrastructure/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CampaignType } from '@prisma/client';
import { CampaignTemplateDto } from '../dto/campaign.dto';
interface Template {
    id: string;
    name: string;
    description?: string;
    type: CampaignType;
    subject?: string;
    content: string;
    variables: string[];
    thumbnailUrl?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    isDefault: boolean;
    category: string;
}
export declare class TemplateService {
    private readonly cache;
    private readonly eventEmitter;
    private readonly defaultTemplates;
    constructor(cache: CacheService, eventEmitter: EventEmitter2);
    private initializeTemplates;
    /**
     * Obtient un template par ID
     */
    getTemplate(templateId: string): Promise<Template | null>;
    /**
     * Obtient tous les templates pour un créateur
     */
    getTemplates(creatorId: string, type?: CampaignType, category?: string): Promise<Template[]>;
    /**
     * Crée un template personnalisé
     */
    createTemplate(creatorId: string, dto: CampaignTemplateDto): Promise<Template>;
    /**
     * Met à jour un template personnalisé
     */
    updateTemplate(templateId: string, creatorId: string, updates: Partial<CampaignTemplateDto>): Promise<Template>;
    /**
     * Supprime un template personnalisé
     */
    deleteTemplate(templateId: string, creatorId: string): Promise<void>;
    /**
     * Clone un template
     */
    cloneTemplate(templateId: string, creatorId: string, newName: string): Promise<Template>;
    /**
     * Prévisualise un template avec des données
     */
    previewTemplate(templateId: string, variables: Record<string, string>): Promise<{
        subject?: string;
        content: string;
        missingVariables: string[];
    }>;
    /**
     * Obtient les catégories de templates disponibles
     */
    getCategories(): Promise<string[]>;
    /**
     * Extrait les variables d'un contenu de template
     */
    private extractVariables;
    /**
     * Valide un template
     */
    validateTemplate(template: CampaignTemplateDto): {
        isValid: boolean;
        errors: string[];
    };
}
export {};
//# sourceMappingURL=template.service.d.ts.map