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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRegistryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const webhook_service_1 = require("@infrastructure/webhook/webhook.service");
const client_1 = require("@prisma/client");
const nanoid_1 = require("nanoid");
const crypto_1 = require("crypto");
let AppRegistryService = class AppRegistryService {
    prisma;
    eventEmitter;
    cache;
    webhook;
    requiredScopes = {
        analytics: ['analytics:read'],
        marketing: ['campaigns:read', 'campaigns:write', 'fans:read'],
        content: ['products:read', 'products:write', 'media:upload'],
        finance: ['transactions:read', 'payouts:read'],
        productivity: ['tasks:read', 'tasks:write'],
        social: ['messages:read', 'messages:write', 'fans:read'],
        ai: ['content:analyze', 'content:generate']
    };
    constructor(prisma, eventEmitter, cache, webhook) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.cache = cache;
        this.webhook = webhook;
    }
    /**
     * Enregistre une nouvelle application
     */
    async registerApp(dto) {
        // Valider les scopes requis
        this.validateScopes(dto.category, dto.scopes);
        // Générer les clés API
        const apiKey = this.generateApiKey();
        const webhookSecret = this.generateWebhookSecret();
        const app = await this.prisma.app.create({
            data: {
                name: dto.name,
                slug: this.generateSlug(dto.name),
                description: dto.description,
                icon: dto.icon,
                developer: dto.developer,
                website: dto.website,
                category: dto.category,
                pricing: dto.pricing,
                price: dto.price,
                webhookUrl: dto.webhookUrl,
                scopes: dto.scopes,
                isPublished: false,
                isVerified: false
            }
        });
        // Stocker les secrets de manière sécurisée
        await this.storeAppSecrets(app.id, apiKey, webhookSecret);
        this.eventEmitter.emit('app.registered', {
            appId: app.id,
            developer: dto.developer
        });
        return app;
    }
    /**
     * Met à jour une application
     */
    async updateApp(appId, dto) {
        const app = await this.prisma.app.findUnique({
            where: { id: appId }
        });
        if (!app) {
            throw new Error('App not found');
        }
        if (dto.scopes) {
            this.validateScopes(app.category, dto.scopes);
        }
        const updated = await this.prisma.app.update({
            where: { id: appId },
            data: {
                name: dto.name,
                description: dto.description,
                icon: dto.icon,
                website: dto.website,
                pricing: dto.pricing,
                price: dto.price,
                webhookUrl: dto.webhookUrl,
                scopes: dto.scopes
            }
        });
        // Invalider le cache
        await this.cache.del(`app:${appId}`);
        await this.cache.del('apps:directory:*');
        return updated;
    }
    /**
     * Publie une application
     */
    async publishApp(appId) {
        const app = await this.prisma.app.findUnique({
            where: { id: appId }
        });
        if (!app) {
            throw new Error('App not found');
        }
        // Vérifier que l'app est prête pour la publication
        await this.validateAppForPublication(app);
        const published = await this.prisma.app.update({
            where: { id: appId },
            data: { isPublished: true }
        });
        this.eventEmitter.emit('app.published', {
            appId,
            app: published
        });
        return published;
    }
    /**
     * Obtient le catalogue d'applications
     */
    async getAppDirectory(filter, creatorId) {
        const cacheKey = `apps:directory:${JSON.stringify(filter)}:${creatorId || 'public'}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const where = {
            isPublished: true,
            ...(filter.category && { category: filter.category }),
            ...(filter.pricing && { pricing: filter.pricing }),
            ...(filter.search && {
                OR: [
                    { name: { contains: filter.search, mode: 'insensitive' } },
                    { description: { contains: filter.search, mode: 'insensitive' } },
                    { developer: { contains: filter.search, mode: 'insensitive' } }
                ]
            })
        };
        const [apps, total] = await Promise.all([
            this.prisma.app.findMany({
                where,
                skip: (filter.page - 1) * filter.limit,
                take: filter.limit,
                orderBy: { [filter.sortBy]: filter.sortOrder },
                include: {
                    _count: {
                        select: { installations: true }
                    }
                }
            }),
            this.prisma.app.count({ where })
        ]);
        // Si un créateur est spécifié, vérifier les installations
        let appsWithInstallation = apps.map(app => ({
            ...app,
            installCount: app._count.installations
        }));
        if (creatorId) {
            const installations = await this.prisma.installedApp.findMany({
                where: {
                    creatorId,
                    appId: { in: apps.map(a => a.id) }
                }
            });
            const installationMap = installations.reduce((acc, inst) => {
                acc[inst.appId] = inst;
                return acc;
            }, {});
            appsWithInstallation = appsWithInstallation.map(app => ({
                ...app,
                installation: installationMap[app.id]
            }));
        }
        // Compter par catégorie
        const categories = await this.prisma.app.groupBy({
            by: ['category'],
            where: { isPublished: true },
            _count: true
        });
        const categoryCount = categories.reduce((acc, cat) => {
            acc[cat.category] = cat._count;
            return acc;
        }, {});
        const result = {
            apps: appsWithInstallation,
            total,
            categories: categoryCount
        };
        // Cache pour 5 minutes
        await this.cache.set(cacheKey, result, 300);
        return result;
    }
    /**
     * Installe une application pour un créateur
     */
    async installApp(creatorId, dto) {
        const app = await this.prisma.app.findUnique({
            where: { id: dto.appId }
        });
        if (!app || !app.isPublished) {
            throw new Error('App not available');
        }
        // Vérifier si déjà installée
        const existing = await this.prisma.installedApp.findUnique({
            where: {
                creatorId_appId: {
                    creatorId,
                    appId: dto.appId
                }
            }
        });
        if (existing && existing.status === client_1.AppStatus.ACTIVE) {
            throw new Error('App already installed');
        }
        // Créer l'installation
        const installation = await this.prisma.installedApp.create({
            data: {
                creatorId,
                appId: dto.appId,
                status: client_1.AppStatus.ACTIVE,
                settings: dto.settings || {},
                billingCycle: app.pricing === client_1.AppPricing.SUBSCRIPTION ? client_1.BillingInterval.MONTH : null,
                nextBilling: app.pricing === client_1.AppPricing.SUBSCRIPTION
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    : null
            }
        });
        // Générer un token d'accès pour l'app
        const accessToken = await this.generateAppAccessToken(app.id, creatorId, app.scopes);
        // Notifier l'app de l'installation
        await this.sendWebhook(app, 'app.installed', {
            creatorId,
            installationId: installation.id,
            accessToken,
            settings: dto.settings
        });
        this.eventEmitter.emit('app.installed', {
            appId: app.id,
            creatorId,
            installationId: installation.id
        });
        return installation;
    }
    /**
     * Désinstalle une application
     */
    async uninstallApp(creatorId, appId) {
        const installation = await this.prisma.installedApp.findUnique({
            where: {
                creatorId_appId: {
                    creatorId,
                    appId
                }
            },
            include: { app: true }
        });
        if (!installation) {
            throw new Error('App not installed');
        }
        // Notifier l'app avant la désinstallation
        await this.sendWebhook(installation.app, 'app.uninstalling', {
            creatorId,
            installationId: installation.id
        });
        // Supprimer l'installation
        await this.prisma.installedApp.delete({
            where: { id: installation.id }
        });
        // Révoquer les tokens
        await this.revokeAppAccess(appId, creatorId);
        this.eventEmitter.emit('app.uninstalled', {
            appId,
            creatorId
        });
    }
    /**
     * Met à jour la configuration d'une app installée
     */
    async updateAppConfig(creatorId, appId, config) {
        const installation = await this.prisma.installedApp.findUnique({
            where: {
                creatorId_appId: {
                    creatorId,
                    appId
                }
            },
            include: { app: true }
        });
        if (!installation) {
            throw new Error('App not installed');
        }
        const updated = await this.prisma.installedApp.update({
            where: { id: installation.id },
            data: {
                settings: {
                    ...installation.settings,
                    ...config.settings
                }
            }
        });
        // Notifier l'app de la mise à jour
        await this.sendWebhook(installation.app, 'app.config_updated', {
            creatorId,
            installationId: installation.id,
            settings: updated.settings
        });
        return updated;
    }
    /**
     * Gère les webhooks entrants d'une app
     */
    async handleAppWebhook(appId, signature, payload) {
        // Vérifier la signature
        const app = await this.prisma.app.findUnique({
            where: { id: appId }
        });
        if (!app) {
            throw new Error('App not found');
        }
        const secret = await this.getAppWebhookSecret(appId);
        if (!this.verifyWebhookSignature(payload, signature, secret)) {
            throw new Error('Invalid webhook signature');
        }
        // Traiter l'événement selon son type
        switch (payload.event) {
            case 'content.created':
                await this.handleContentCreated(appId, payload.data);
                break;
            case 'analytics.report':
                await this.handleAnalyticsReport(appId, payload.data);
                break;
            case 'task.completed':
                await this.handleTaskCompleted(appId, payload.data);
                break;
            default:
                console.log(`Unhandled webhook event: ${payload.event}`);
        }
        // Émettre l'événement pour d'autres modules
        this.eventEmitter.emit(`app.webhook.${payload.event}`, {
            appId,
            data: payload.data
        });
    }
    /**
     * Obtient les permissions d'une app pour un créateur
     */
    async getAppPermissions(appId, creatorId) {
        const installation = await this.prisma.installedApp.findUnique({
            where: {
                creatorId_appId: {
                    creatorId,
                    appId
                }
            },
            include: { app: true }
        });
        if (!installation || installation.status !== client_1.AppStatus.ACTIVE) {
            throw new Error('App not installed or inactive');
        }
        const app = installation.app;
        return {
            appId: app.id,
            appName: app.name,
            scopes: app.scopes,
            grantedAt: installation.installedAt,
            expiresAt: null, // Les permissions n'expirent pas tant que l'app est installée
            restrictions: this.getAppRestrictions(app.category)
        };
    }
    /**
     * Suspend une app installée
     */
    async suspendApp(creatorId, appId, reason) {
        const installation = await this.prisma.installedApp.findUnique({
            where: {
                creatorId_appId: {
                    creatorId,
                    appId
                }
            }
        });
        if (!installation) {
            throw new Error('App not installed');
        }
        await this.prisma.installedApp.update({
            where: { id: installation.id },
            data: { status: client_1.AppStatus.PAUSED }
        });
        // Logger la suspension
        await this.prisma.auditLog.create({
            data: {
                creatorId,
                actorId: 'system',
                actorType: 'SYSTEM',
                action: 'app.suspended',
                resource: 'installed_app',
                resourceId: installation.id,
                metadata: { reason, appId }
            }
        });
    }
    // Méthodes privées
    validateScopes(category, scopes) {
        const requiredScopes = this.requiredScopes[category.toLowerCase()] || [];
        const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
        if (missingScopes.length > 0) {
            throw new Error(`Missing required scopes for ${category} apps: ${missingScopes.join(', ')}`);
        }
        // Vérifier que tous les scopes sont valides
        const validScopes = Object.values(this.requiredScopes).flat();
        const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
        if (invalidScopes.length > 0) {
            throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
        }
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    generateApiKey() {
        return `app_${(0, nanoid_1.nanoid)(32)}`;
    }
    generateWebhookSecret() {
        return `whsec_${(0, nanoid_1.nanoid)(32)}`;
    }
    async storeAppSecrets(appId, apiKey, webhookSecret) {
        // Stocker de manière sécurisée (en pratique, utiliser un service de gestion des secrets)
        await this.cache.set(`app:${appId}:apikey`, apiKey, 0); // Pas d'expiration
        await this.cache.set(`app:${appId}:webhook:secret`, webhookSecret, 0);
    }
    async validateAppForPublication(app) {
        const errors = [];
        if (!app.name || app.name.length < 3) {
            errors.push('App name must be at least 3 characters');
        }
        if (!app.description || app.description.length < 50) {
            errors.push('App description must be at least 50 characters');
        }
        if (!app.developer) {
            errors.push('Developer information is required');
        }
        if (!app.scopes || app.scopes.length === 0) {
            errors.push('App must request at least one scope');
        }
        if (app.pricing === client_1.AppPricing.PAID && !app.price) {
            errors.push('Paid apps must have a price');
        }
        if (errors.length > 0) {
            throw new Error(`App validation failed: ${errors.join(', ')}`);
        }
    }
    async generateAppAccessToken(appId, creatorId, scopes) {
        // Générer un JWT avec les scopes appropriés
        const token = this.webhook.generateToken({
            appId,
            creatorId,
            scopes,
            type: 'app_access',
            iat: Date.now(),
            exp: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 an
        });
        // Stocker pour révocation future
        await this.cache.set(`app:token:${appId}:${creatorId}`, token, 365 * 24 * 60 * 60 // 1 an
        );
        return token;
    }
    async sendWebhook(app, event, data) {
        if (!app.webhookUrl) {
            return;
        }
        const payload = {
            event,
            data,
            timestamp: new Date(),
            appId: app.id
        };
        const secret = await this.getAppWebhookSecret(app.id);
        const signature = this.generateWebhookSignature(payload, secret);
        try {
            await this.webhook.send(app.webhookUrl, payload, {
                headers: {
                    'X-App-Signature': signature,
                    'X-App-Event': event
                }
            });
        }
        catch (error) {
            console.error(`Failed to send webhook to app ${app.id}:`, error);
            // Optionnellement, désactiver l'app après plusieurs échecs
        }
    }
    async getAppWebhookSecret(appId) {
        const secret = await this.cache.get(`app:${appId}:webhook:secret`);
        if (!secret) {
            throw new Error('App webhook secret not found');
        }
        return secret;
    }
    generateWebhookSignature(payload, secret) {
        const hmac = (0, crypto_1.createHmac)('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return hmac.digest('hex');
    }
    verifyWebhookSignature(payload, signature, secret) {
        const expectedSignature = this.generateWebhookSignature(payload, secret);
        return signature === expectedSignature;
    }
    async revokeAppAccess(appId, creatorId) {
        await this.cache.del(`app:token:${appId}:${creatorId}`);
    }
    getAppRestrictions(category) {
        const restrictions = {
            [client_1.AppCategory.ANALYTICS]: ['Cannot modify data', 'Read-only access'],
            [client_1.AppCategory.MARKETING]: ['Cannot access payment data', 'Rate limited to 1000 requests/hour'],
            [client_1.AppCategory.CONTENT]: ['Cannot delete creator content', 'File size limited to 100MB'],
            [client_1.AppCategory.FINANCE]: ['Cannot initiate payouts', 'Read-only access to financial data'],
            [client_1.AppCategory.AI]: ['Content must be reviewed before publishing', 'Cannot access fan PII']
        };
        return restrictions[category] || ['Standard app restrictions apply'];
    }
    async handleContentCreated(appId, data) {
        // Traiter la création de contenu par une app
        console.log(`App ${appId} created content:`, data);
        // Vérifier les permissions et créer le contenu
        // À implémenter selon les besoins
    }
    async handleAnalyticsReport(appId, data) {
        // Traiter les rapports d'analytics d'une app
        console.log(`App ${appId} sent analytics report:`, data);
        // Stocker ou traiter les données d'analytics
        // À implémenter selon les besoins
    }
    async handleTaskCompleted(appId, data) {
        // Traiter la complétion de tâches par une app
        console.log(`App ${appId} completed task:`, data);
        // Mettre à jour le statut de la tâche
        // À implémenter selon les besoins
    }
};
exports.AppRegistryService = AppRegistryService;
exports.AppRegistryService = AppRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, event_emitter_1.EventEmitter2, typeof (_b = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _b : Object, typeof (_c = typeof webhook_service_1.WebhookService !== "undefined" && webhook_service_1.WebhookService) === "function" ? _c : Object])
], AppRegistryService);
//# sourceMappingURL=app-registry.service.js.map