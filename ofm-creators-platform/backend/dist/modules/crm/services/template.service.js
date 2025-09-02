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
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
let TemplateService = class TemplateService {
    cache;
    eventEmitter;
    defaultTemplates = [
        // Email Templates
        {
            id: 'welcome-email',
            name: 'Welcome Email',
            description: 'Welcome new subscribers with a personalized message',
            type: client_1.CampaignType.EMAIL,
            subject: 'Welcome to {{creatorName}}! 🎉',
            content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, {{displayName}}! 🎉</h1>
    </div>
    <p>Thank you for subscribing! I'm thrilled to have you as part of my exclusive community.</p>
    <p>As a subscriber, you'll get access to:</p>
    <ul>
      <li>Exclusive content posted regularly</li>
      <li>Behind-the-scenes updates</li>
      <li>Special subscriber-only offers</li>
      <li>Direct messages and interactions</li>
    </ul>
    <p>To get started, check out my latest content:</p>
    <center>
      <a href="{{contentUrl}}" class="button">View Exclusive Content</a>
    </center>
    <p>If you have any questions, feel free to message me directly!</p>
    <p>xoxo,<br>{{creatorName}}</p>
    <div class="footer">
      <p>You're receiving this because you subscribed to {{creatorName}}.</p>
      <p><a href="{{unsubscribeUrl}}">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`,
            variables: ['displayName', 'creatorName', 'contentUrl', 'unsubscribeUrl'],
            tags: ['welcome', 'onboarding', 'email'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'onboarding'
        },
        {
            id: 'reengagement-email',
            name: 'Re-engagement Email',
            description: 'Win back inactive subscribers',
            type: client_1.CampaignType.EMAIL,
            subject: 'I miss you, {{displayName}} 💔',
            content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .offer-box { background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hey {{displayName}}, I miss you! 💔</h1>
    </div>
    <p>I noticed you haven't been around lately, and I wanted to check in.</p>
    <p>I've been posting some amazing content that I think you'd love:</p>
    <ul>
      <li>{{recentContent1}}</li>
      <li>{{recentContent2}}</li>
      <li>{{recentContent3}}</li>
    </ul>
    <div class="offer-box">
      <h3>🎁 Special Offer Just for You!</h3>
      <p>Come back now and get <strong>{{discountPercent}}% off</strong> your next month!</p>
      <a href="{{offerUrl}}" class="button">Claim Your Discount</a>
      <p><small>Offer expires in 48 hours</small></p>
    </div>
    <p>I'd love to have you back in our community. Your support means the world to me!</p>
    <p>xoxo,<br>{{creatorName}}</p>
  </div>
</body>
</html>`,
            variables: ['displayName', 'creatorName', 'recentContent1', 'recentContent2', 'recentContent3', 'discountPercent', 'offerUrl'],
            tags: ['reengagement', 'winback', 'email'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'retention'
        },
        {
            id: 'new-content-email',
            name: 'New Content Notification',
            description: 'Notify subscribers about new content',
            type: client_1.CampaignType.EMAIL,
            subject: '🔥 New content from {{creatorName}}!',
            content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content-preview { border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>New Content Alert! 🔥</h1>
    <p>Hey {{displayName}},</p>
    <p>I just posted something special that I know you'll love!</p>
    <div class="content-preview">
      <h3>{{contentTitle}}</h3>
      <p>{{contentDescription}}</p>
      <center>
        <a href="{{contentUrl}}" class="button">View Now</a>
      </center>
    </div>
    <p>Don't miss out - this is exclusive content just for my subscribers!</p>
    <p>xoxo,<br>{{creatorName}}</p>
  </div>
</body>
</html>`,
            variables: ['displayName', 'creatorName', 'contentTitle', 'contentDescription', 'contentUrl'],
            tags: ['content', 'notification', 'email'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'content'
        },
        // SMS Templates
        {
            id: 'welcome-sms',
            name: 'Welcome SMS',
            description: 'Short welcome message for new subscribers',
            type: client_1.CampaignType.SMS,
            content: 'Welcome {{displayName}}! 🎉 Thanks for subscribing! Check out my exclusive content here: {{shortUrl}}',
            variables: ['displayName', 'shortUrl'],
            tags: ['welcome', 'onboarding', 'sms'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'onboarding'
        },
        {
            id: 'new-content-sms',
            name: 'New Content SMS',
            description: 'Quick notification about new content',
            type: client_1.CampaignType.SMS,
            content: '🔥 New post alert! {{contentTitle}} is live now. Check it out: {{shortUrl}}',
            variables: ['contentTitle', 'shortUrl'],
            tags: ['content', 'notification', 'sms'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'content'
        },
        // Push Notification Templates
        {
            id: 'new-message-push',
            name: 'New Message Push',
            description: 'Notify about new direct messages',
            type: client_1.CampaignType.PUSH,
            content: '{{creatorName}} sent you a message! 💬',
            variables: ['creatorName'],
            tags: ['message', 'notification', 'push'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'engagement'
        },
        // In-App Templates
        {
            id: 'special-offer-inapp',
            name: 'Special Offer In-App',
            description: 'Display special offers within the app',
            type: client_1.CampaignType.IN_APP,
            content: `
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
  <h2>🎁 Special Offer for You!</h2>
  <p>Get {{discountPercent}}% off your next purchase!</p>
  <p>Use code: <strong>{{promoCode}}</strong></p>
  <button style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; cursor: pointer;">Shop Now</button>
</div>`,
            variables: ['discountPercent', 'promoCode'],
            tags: ['offer', 'promotion', 'inapp'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: true,
            category: 'promotion'
        }
    ];
    constructor(cache, eventEmitter) {
        this.cache = cache;
        this.eventEmitter = eventEmitter;
        // Initialize default templates in cache
        this.initializeTemplates();
    }
    async initializeTemplates() {
        for (const template of this.defaultTemplates) {
            await this.cache.set(`template:${template.id}`, template, 86400 * 30 // 30 days
            );
        }
    }
    /**
     * Obtient un template par ID
     */
    async getTemplate(templateId) {
        const cached = await this.cache.get(`template:${templateId}`);
        if (cached) {
            return cached;
        }
        // Chercher dans les templates par défaut
        const defaultTemplate = this.defaultTemplates.find(t => t.id === templateId);
        if (defaultTemplate) {
            await this.cache.set(`template:${templateId}`, defaultTemplate, 86400 * 30);
            return defaultTemplate;
        }
        return null;
    }
    /**
     * Obtient tous les templates pour un créateur
     */
    async getTemplates(creatorId, type, category) {
        // Pour cette implémentation, on retourne les templates par défaut
        // Dans une version complète, on inclurait aussi les templates personnalisés du créateur
        let templates = [...this.defaultTemplates];
        if (type) {
            templates = templates.filter(t => t.type === type);
        }
        if (category) {
            templates = templates.filter(t => t.category === category);
        }
        // Ajouter les templates personnalisés du créateur depuis le cache
        const customTemplateKeys = await this.cache.keys(`template:custom:${creatorId}:*`);
        for (const key of customTemplateKeys) {
            const template = await this.cache.get(key);
            if (template && (!type || template.type === type) && (!category || template.category === category)) {
                templates.push(template);
            }
        }
        return templates;
    }
    /**
     * Crée un template personnalisé
     */
    async createTemplate(creatorId, dto) {
        const template = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: dto.name,
            description: dto.description,
            type: dto.type,
            subject: dto.subject,
            content: dto.content,
            variables: this.extractVariables(dto.content + (dto.subject || '')),
            thumbnailUrl: dto.thumbnailUrl,
            tags: dto.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: false,
            category: 'custom'
        };
        await this.cache.set(`template:custom:${creatorId}:${template.id}`, template, 86400 * 90 // 90 days
        );
        this.eventEmitter.emit('template.created', {
            templateId: template.id,
            creatorId,
            template
        });
        return template;
    }
    /**
     * Met à jour un template personnalisé
     */
    async updateTemplate(templateId, creatorId, updates) {
        const key = `template:custom:${creatorId}:${templateId}`;
        const template = await this.cache.get(key);
        if (!template) {
            throw new Error('Template not found');
        }
        const updated = {
            ...template,
            ...updates,
            variables: updates.content || updates.subject
                ? this.extractVariables((updates.content || template.content) + (updates.subject || template.subject || ''))
                : template.variables,
            updatedAt: new Date()
        };
        await this.cache.set(key, updated, 86400 * 90);
        this.eventEmitter.emit('template.updated', {
            templateId,
            creatorId,
            template: updated
        });
        return updated;
    }
    /**
     * Supprime un template personnalisé
     */
    async deleteTemplate(templateId, creatorId) {
        const key = `template:custom:${creatorId}:${templateId}`;
        const template = await this.cache.get(key);
        if (!template) {
            throw new Error('Template not found');
        }
        await this.cache.del(key);
        this.eventEmitter.emit('template.deleted', {
            templateId,
            creatorId
        });
    }
    /**
     * Clone un template
     */
    async cloneTemplate(templateId, creatorId, newName) {
        const original = await this.getTemplate(templateId);
        if (!original) {
            throw new Error('Template not found');
        }
        const cloned = {
            ...original,
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: newName,
            isDefault: false,
            category: 'custom',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.cache.set(`template:custom:${creatorId}:${cloned.id}`, cloned, 86400 * 90);
        return cloned;
    }
    /**
     * Prévisualise un template avec des données
     */
    async previewTemplate(templateId, variables) {
        const template = await this.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }
        let content = template.content;
        let subject = template.subject;
        const missingVariables = [];
        // Remplacer les variables
        for (const variable of template.variables) {
            const value = variables[variable];
            const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
            if (value) {
                content = content.replace(regex, value);
                if (subject) {
                    subject = subject.replace(regex, value);
                }
            }
            else {
                missingVariables.push(variable);
                // Utiliser une valeur par défaut pour la prévisualisation
                const defaultValue = `[${variable}]`;
                content = content.replace(regex, defaultValue);
                if (subject) {
                    subject = subject.replace(regex, defaultValue);
                }
            }
        }
        return {
            subject,
            content,
            missingVariables
        };
    }
    /**
     * Obtient les catégories de templates disponibles
     */
    async getCategories() {
        const categories = new Set();
        // Catégories par défaut
        this.defaultTemplates.forEach(t => categories.add(t.category));
        // Ajouter les catégories personnalisées
        // (simplifiée pour cet exemple)
        categories.add('custom');
        return Array.from(categories);
    }
    /**
     * Extrait les variables d'un contenu de template
     */
    extractVariables(content) {
        const regex = /\{\{(\w+)\}\}/g;
        const variables = new Set();
        let match;
        while ((match = regex.exec(content)) !== null) {
            variables.add(match[1]);
        }
        return Array.from(variables);
    }
    /**
     * Valide un template
     */
    validateTemplate(template) {
        const errors = [];
        // Vérifier la longueur du contenu selon le type
        if (template.type === client_1.CampaignType.SMS && template.content.length > 160) {
            errors.push('SMS content must be 160 characters or less');
        }
        if (template.type === client_1.CampaignType.PUSH && template.content.length > 100) {
            errors.push('Push notification content must be 100 characters or less');
        }
        // Vérifier que le subject est fourni pour les emails
        if (template.type === client_1.CampaignType.EMAIL && !template.subject) {
            errors.push('Email templates must have a subject');
        }
        // Vérifier la syntaxe des variables
        const variables = this.extractVariables(template.content + (template.subject || ''));
        const validVariableRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        for (const variable of variables) {
            if (!validVariableRegex.test(variable)) {
                errors.push(`Invalid variable name: ${variable}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _a : Object, event_emitter_1.EventEmitter2])
], TemplateService);
//# sourceMappingURL=template.service.js.map