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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const storage_service_1 = require("@infrastructure/storage/storage.service");
const crypto_service_1 = require("@infrastructure/crypto/crypto.service");
const fs_1 = require("fs");
const archiver_1 = __importDefault(require("archiver"));
const nanoid_1 = require("nanoid");
let GdprService = class GdprService {
    prisma;
    eventEmitter;
    storage;
    crypto;
    consentTypes = [
        'marketing_emails',
        'marketing_sms',
        'analytics',
        'third_party_sharing',
        'personalization',
        'cookies_functional',
        'cookies_analytics',
        'cookies_marketing'
    ];
    dataRetentionPolicies = {
        transactions: 7 * 365 * 24 * 60 * 60 * 1000, // 7 ans pour les données financières
        analytics: 2 * 365 * 24 * 60 * 60 * 1000, // 2 ans pour les analytics
        logs: 1 * 365 * 24 * 60 * 60 * 1000, // 1 an pour les logs
        messages: 6 * 30 * 24 * 60 * 60 * 1000, // 6 mois pour les messages
        inactive_accounts: 3 * 365 * 24 * 60 * 60 * 1000 // 3 ans pour les comptes inactifs
    };
    constructor(prisma, eventEmitter, storage, crypto) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.storage = storage;
        this.crypto = crypto;
    }
    /**
     * Enregistre ou met à jour le consentement d'un utilisateur
     */
    async updateConsent(userId, userType, dto, ipAddress, userAgent) {
        // Valider les types de consentement
        for (const type of Object.keys(dto.consents)) {
            if (!this.consentTypes.includes(type)) {
                throw new Error(`Invalid consent type: ${type}`);
            }
        }
        // Enregistrer chaque consentement
        const consentRecords = [];
        for (const [type, granted] of Object.entries(dto.consents)) {
            const record = {
                userId,
                userType,
                consentType: type,
                granted,
                version: dto.version || '1.0',
                timestamp: new Date(),
                ip: ipAddress,
                userAgent,
                metadata: dto.metadata
            };
            consentRecords.push(record);
            // Stocker dans la base de données
            await this.prisma.auditLog.create({
                data: {
                    creatorId: userType === 'creator' ? userId : null,
                    actorId: userId,
                    actorType: userType.toUpperCase(),
                    action: 'consent.update',
                    resource: 'consent',
                    resourceId: `${userId}:${type}`,
                    ipAddress,
                    userAgent,
                    metadata: {
                        consentType: type,
                        granted,
                        version: dto.version,
                        ...dto.metadata
                    }
                }
            });
        }
        // Mettre à jour les préférences de l'utilisateur
        if (userType === 'fan') {
            await this.updateFanPreferences(userId, dto.consents);
        }
        else {
            await this.updateCreatorPreferences(userId, dto.consents);
        }
        this.eventEmitter.emit('consent.updated', {
            userId,
            userType,
            consents: consentRecords
        });
    }
    /**
     * Exporte toutes les données d'un utilisateur
     */
    async requestDataExport(userId, userType, dto) {
        const jobId = (0, nanoid_1.nanoid)();
        const job = {
            id: jobId,
            userId,
            userType,
            status: 'pending',
            requestedAt: new Date()
        };
        // Stocker le job dans le cache ou la base de données
        await this.storage.storeDataExportJob(job);
        // Traiter de manière asynchrone
        this.processDataExport(job, dto).catch(error => {
            console.error('Data export failed:', error);
            this.updateExportJobStatus(jobId, 'failed', error.message);
        });
        this.eventEmitter.emit('data.export.requested', {
            jobId,
            userId,
            userType
        });
        return job;
    }
    /**
     * Supprime toutes les données d'un utilisateur
     */
    async requestDataDeletion(userId, userType, dto, verificationToken) {
        // Vérifier le token
        if (!await this.verifyDeletionToken(userId, verificationToken)) {
            throw new Error('Invalid verification token');
        }
        // Vérifier qu'il n'y a pas de blocages légaux
        const canDelete = await this.checkDeletionEligibility(userId, userType);
        if (!canDelete.eligible) {
            throw new Error(`Cannot delete data: ${canDelete.reason}`);
        }
        // Anonymiser d'abord les données
        if (dto.anonymize) {
            await this.anonymizeUserData(userId, userType);
        }
        // Supprimer les données selon les catégories demandées
        for (const category of dto.categories) {
            await this.deleteDataCategory(userId, userType, category);
        }
        // Logger la suppression
        await this.prisma.auditLog.create({
            data: {
                actorId: userId,
                actorType: userType.toUpperCase(),
                action: 'data.deletion',
                resource: 'user_data',
                resourceId: userId,
                metadata: {
                    categories: dto.categories,
                    anonymized: dto.anonymize,
                    reason: dto.reason
                }
            }
        });
        this.eventEmitter.emit('data.deleted', {
            userId,
            userType,
            categories: dto.categories
        });
    }
    /**
     * Génère un rapport de confidentialité
     */
    async generatePrivacyReport(userId, userType) {
        const [userData, consents, dataCategories, thirdPartySharing, retentionInfo] = await Promise.all([
            this.getUserBasicInfo(userId, userType),
            this.getUserConsents(userId),
            this.getStoredDataCategories(userId, userType),
            this.getThirdPartyDataSharing(userId),
            this.getDataRetentionInfo(userId, userType)
        ]);
        return {
            generatedAt: new Date(),
            user: userData,
            consents,
            dataCategories,
            thirdPartySharing,
            retentionInfo,
            rights: this.getUserRights(),
            contactInfo: this.getPrivacyContactInfo()
        };
    }
    /**
     * Notifie une violation de données
     */
    async reportDataBreach(dto) {
        // Identifier les utilisateurs affectés
        const affectedUsers = await this.identifyAffectedUsers(dto);
        // Créer l'enregistrement de violation
        const breach = await this.prisma.auditLog.create({
            data: {
                actorId: 'system',
                actorType: 'SYSTEM',
                action: 'data.breach',
                resource: 'security',
                resourceId: (0, nanoid_1.nanoid)(),
                metadata: {
                    severity: dto.severity,
                    dataTypes: dto.affectedDataTypes,
                    discoveredAt: dto.discoveredAt,
                    description: dto.description,
                    affectedCount: affectedUsers.length
                }
            }
        });
        // Notifier les utilisateurs affectés
        for (const user of affectedUsers) {
            await this.notifyUserOfBreach(user, dto);
        }
        // Notifier les autorités si nécessaire
        if (dto.severity === 'high' || affectedUsers.length > 100) {
            await this.notifyDataProtectionAuthority(breach, dto, affectedUsers.length);
        }
        this.eventEmitter.emit('data.breach.reported', {
            breachId: breach.id,
            severity: dto.severity,
            affectedCount: affectedUsers.length
        });
    }
    /**
     * Vérifie la conformité CCPA
     */
    async verifyCcpaCompliance(userId, userType) {
        const issues = [];
        const recommendations = [];
        // Vérifier le consentement pour la vente de données
        const hasOptOut = await this.hasOptedOutOfDataSale(userId);
        if (!hasOptOut) {
            issues.push('No opt-out mechanism for data sale found');
            recommendations.push('Implement clear opt-out option for data sale');
        }
        // Vérifier la divulgation des catégories de données
        const privacyPolicy = await this.getPrivacyPolicyVersion();
        if (!privacyPolicy.includesCcpaDisclosures) {
            issues.push('Privacy policy lacks CCPA-required disclosures');
            recommendations.push('Update privacy policy with CCPA disclosures');
        }
        // Vérifier les droits d'accès aux données
        const exportAvailable = await this.isDataExportAvailable(userId);
        if (!exportAvailable) {
            issues.push('Data export functionality not available');
            recommendations.push('Enable self-service data export');
        }
        return {
            compliant: issues.length === 0,
            issues,
            recommendations
        };
    }
    // Méthodes privées
    async processDataExport(job, dto) {
        try {
            await this.updateExportJobStatus(job.id, 'processing');
            // Collecter toutes les données
            const data = await this.collectUserData(job.userId, job.userType, dto.categories || ['all']);
            // Créer l'archive
            const archivePath = `/tmp/export_${job.id}.zip`;
            const output = (0, fs_1.createWriteStream)(archivePath);
            const archive = (0, archiver_1.default)('zip', {
                zlib: { level: 9 },
                password: dto.password // Optionnel : protection par mot de passe
            });
            archive.pipe(output);
            // Ajouter les données à l'archive
            for (const [category, content] of Object.entries(data)) {
                const filename = `${category}.json`;
                archive.append(JSON.stringify(content, null, 2), { name: filename });
            }
            // Ajouter un README
            archive.append(this.generateExportReadme(job), { name: 'README.txt' });
            await archive.finalize();
            // Upload vers le stockage sécurisé
            const downloadUrl = await this.storage.uploadSecure(archivePath, `exports/${job.userId}/${job.id}.zip`, {
                expiresIn: 7 * 24 * 60 * 60 // 7 jours
            });
            // Mettre à jour le job
            await this.updateExportJobStatus(job.id, 'completed', null, {
                downloadUrl,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            // Notifier l'utilisateur
            await this.notifyExportReady(job.userId, job.userType, downloadUrl);
        }
        catch (error) {
            await this.updateExportJobStatus(job.id, 'failed', error.message);
            throw error;
        }
    }
    async collectUserData(userId, userType, categories) {
        const data = {};
        if (categories.includes('all') || categories.includes('profile')) {
            data.profile = await this.collectProfileData(userId, userType);
        }
        if (categories.includes('all') || categories.includes('transactions')) {
            data.transactions = await this.collectTransactionData(userId, userType);
        }
        if (categories.includes('all') || categories.includes('content')) {
            data.content = await this.collectContentData(userId, userType);
        }
        if (categories.includes('all') || categories.includes('messages')) {
            data.messages = await this.collectMessageData(userId, userType);
        }
        if (categories.includes('all') || categories.includes('analytics')) {
            data.analytics = await this.collectAnalyticsData(userId, userType);
        }
        if (categories.includes('all') || categories.includes('logs')) {
            data.logs = await this.collectAuditLogs(userId, userType);
        }
        return data;
    }
    async anonymizeUserData(userId, userType) {
        const anonymizedId = `anon_${(0, nanoid_1.nanoid)(16)}`;
        if (userType === 'fan') {
            await this.prisma.fan.update({
                where: { id: userId },
                data: {
                    email: `${anonymizedId}@anonymized.local`,
                    username: anonymizedId,
                    displayName: 'Anonymous User',
                    phoneNumber: null,
                    avatar: null
                }
            });
        }
        else {
            await this.prisma.creator.update({
                where: { id: userId },
                data: {
                    email: `${anonymizedId}@anonymized.local`,
                    username: anonymizedId,
                    displayName: 'Anonymous Creator',
                    bio: null,
                    avatar: null
                }
            });
        }
        // Anonymiser les données liées
        await this.anonymizeRelatedData(userId, userType);
    }
    async deleteDataCategory(userId, userType, category) {
        switch (category) {
            case 'profile':
                await this.deleteProfileData(userId, userType);
                break;
            case 'content':
                await this.deleteContentData(userId, userType);
                break;
            case 'messages':
                await this.deleteMessageData(userId, userType);
                break;
            case 'analytics':
                await this.deleteAnalyticsData(userId, userType);
                break;
            case 'logs':
                await this.deleteAuditLogs(userId, userType);
                break;
            default:
                throw new Error(`Unknown data category: ${category}`);
        }
    }
    async checkDeletionEligibility(userId, userType) {
        // Vérifier les obligations légales
        if (userType === 'creator') {
            // Vérifier s'il y a des transactions récentes
            const recentTransactions = await this.prisma.transaction.count({
                where: {
                    creatorId: userId,
                    createdAt: {
                        gte: new Date(Date.now() - this.dataRetentionPolicies.transactions)
                    }
                }
            });
            if (recentTransactions > 0) {
                return {
                    eligible: false,
                    reason: 'Financial records must be retained for 7 years'
                };
            }
            // Vérifier s'il y a des litiges en cours
            const activeCases = await this.checkActiveLegalCases(userId);
            if (activeCases > 0) {
                return {
                    eligible: false,
                    reason: 'Data must be retained due to ongoing legal proceedings'
                };
            }
        }
        return { eligible: true };
    }
    async updateFanPreferences(fanId, consents) {
        // Mettre à jour les préférences de communication
        const updates = {};
        if ('marketing_emails' in consents) {
            const relations = await this.prisma.fanRelation.findMany({
                where: { fanId }
            });
            for (const relation of relations) {
                await this.prisma.fanRelation.update({
                    where: { id: relation.id },
                    data: { emailOptIn: consents.marketing_emails }
                });
            }
        }
        if ('marketing_sms' in consents) {
            const relations = await this.prisma.fanRelation.findMany({
                where: { fanId }
            });
            for (const relation of relations) {
                await this.prisma.fanRelation.update({
                    where: { id: relation.id },
                    data: { smsOptIn: consents.marketing_sms }
                });
            }
        }
    }
    async updateCreatorPreferences(creatorId, consents) {
        const settings = await this.prisma.creatorSettings.findUnique({
            where: { creatorId }
        });
        if (!settings) {
            return;
        }
        const updates = {};
        if ('marketing_emails' in consents) {
            updates.emailNotifications = consents.marketing_emails;
        }
        if ('marketing_sms' in consents) {
            updates.smsNotifications = consents.marketing_sms;
        }
        await this.prisma.creatorSettings.update({
            where: { creatorId },
            data: updates
        });
    }
    async verifyDeletionToken(userId, token) {
        // Vérifier le token de suppression (implémentation simplifiée)
        const expectedToken = await this.crypto.generateToken(userId, 'deletion');
        return token === expectedToken;
    }
    async updateExportJobStatus(jobId, status, error, additionalData) {
        await this.storage.updateDataExportJob(jobId, {
            status,
            error,
            ...additionalData,
            ...(status === 'completed' && { completedAt: new Date() })
        });
    }
    generateExportReadme(job) {
        return `
Data Export for User ${job.userId}
Generated on: ${new Date().toISOString()}
Export ID: ${job.id}

This archive contains all personal data associated with your account.
The data is organized in JSON format for easy reading and processing.

Files included:
- profile.json: Your profile information
- transactions.json: Transaction history (if applicable)
- content.json: Content you've created or purchased
- messages.json: Message history
- analytics.json: Analytics and usage data
- logs.json: Activity logs

For questions about this export, please contact privacy@ofm-creators.com

This export will be available for download for 7 days.
`;
    }
    async getUserBasicInfo(userId, userType) {
        if (userType === 'fan') {
            return this.prisma.fan.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    createdAt: true
                }
            });
        }
        else {
            return this.prisma.creator.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    createdAt: true
                }
            });
        }
    }
    async getUserConsents(userId) {
        const logs = await this.prisma.auditLog.findMany({
            where: {
                actorId: userId,
                action: 'consent.update'
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return logs.map(log => ({
            type: log.metadata?.consentType,
            granted: log.metadata?.granted,
            timestamp: log.createdAt,
            version: log.metadata?.version
        }));
    }
    async getStoredDataCategories(userId, userType) {
        const categories = ['profile', 'authentication'];
        // Vérifier chaque type de données
        const hasTransactions = await this.prisma.transaction.count({
            where: userType === 'fan' ? { fanId: userId } : { creatorId: userId }
        });
        if (hasTransactions > 0)
            categories.push('financial');
        const hasContent = userType === 'creator'
            ? await this.prisma.product.count({ where: { creatorId: userId } })
            : await this.prisma.purchase.count({ where: { fanId: userId } });
        if (hasContent > 0)
            categories.push('content');
        // Ajouter d'autres catégories selon les besoins
        return categories;
    }
    async getThirdPartyDataSharing(userId) {
        // Liste des tiers avec lesquels les données sont partagées
        return [
            {
                name: 'Stripe',
                purpose: 'Payment processing',
                dataTypes: ['name', 'email', 'payment_info'],
                legalBasis: 'Contract performance'
            },
            {
                name: 'AWS',
                purpose: 'Content storage and delivery',
                dataTypes: ['content', 'metadata'],
                legalBasis: 'Legitimate interest'
            }
            // Ajouter d'autres tiers selon la configuration
        ];
    }
    async getDataRetentionInfo(userId, userType) {
        return {
            policies: Object.entries(this.dataRetentionPolicies).map(([type, duration]) => ({
                dataType: type,
                retentionPeriod: this.formatDuration(duration),
                reason: this.getRetentionReason(type)
            })),
            deletionSchedule: await this.getScheduledDeletions(userId)
        };
    }
    getUserRights() {
        return [
            'Right to access your personal data',
            'Right to rectification of inaccurate data',
            'Right to erasure ("right to be forgotten")',
            'Right to restrict processing',
            'Right to data portability',
            'Right to object to processing',
            'Right to withdraw consent',
            'Right to lodge a complaint with a supervisory authority'
        ];
    }
    getPrivacyContactInfo() {
        return {
            dataProtectionOfficer: {
                email: 'dpo@ofm-creators.com',
                phone: '+1-555-DPO-HELP'
            },
            privacyTeam: {
                email: 'privacy@ofm-creators.com',
                address: '123 Privacy Street, Data City, DC 12345'
            },
            supervisoryAuthority: {
                name: 'Your Local Data Protection Authority',
                website: 'https://www.dataprotection.gov',
                email: 'complaints@dataprotection.gov'
            }
        };
    }
    formatDuration(milliseconds) {
        const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
        if (days < 365) {
            return `${days} days`;
        }
        else {
            const years = Math.floor(days / 365);
            return `${years} year${years > 1 ? 's' : ''}`;
        }
    }
    getRetentionReason(dataType) {
        const reasons = {
            transactions: 'Legal requirement for financial records',
            analytics: 'Business analytics and improvement',
            logs: 'Security and audit purposes',
            messages: 'User experience and support',
            inactive_accounts: 'Account recovery and reactivation'
        };
        return reasons[dataType] || 'Business operations';
    }
    async identifyAffectedUsers(dto) {
        // Logique pour identifier les utilisateurs affectés basée sur les critères
        // Implémentation simplifiée
        return [];
    }
    async notifyUserOfBreach(user, breach) {
        // Envoyer une notification à l'utilisateur
        await this.eventEmitter.emit('notification.send', {
            userId: user.id,
            type: 'data_breach',
            channel: 'email',
            priority: 'high',
            data: {
                severity: breach.severity,
                affectedData: breach.affectedDataTypes,
                recommendations: breach.recommendations
            }
        });
    }
    async notifyDataProtectionAuthority(breach, dto, affectedCount) {
        // Notification aux autorités de protection des données
        // À implémenter selon les exigences locales
        console.log('Notifying DPA of breach:', {
            breachId: breach.id,
            severity: dto.severity,
            affectedCount
        });
    }
    async hasOptedOutOfDataSale(userId) {
        const consent = await this.prisma.auditLog.findFirst({
            where: {
                actorId: userId,
                action: 'consent.update',
                metadata: {
                    path: ['consentType'],
                    equals: 'third_party_sharing'
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return consent?.metadata?.granted === false;
    }
    async getPrivacyPolicyVersion() {
        // Récupérer la version actuelle de la politique de confidentialité
        return {
            version: '2.0',
            lastUpdated: new Date('2024-01-01'),
            includesCcpaDisclosures: true,
            includesGdprDisclosures: true
        };
    }
    async isDataExportAvailable(userId) {
        // Vérifier si l'export de données est disponible pour l'utilisateur
        return true; // Toujours disponible dans cette implémentation
    }
    async checkActiveLegalCases(userId) {
        // Vérifier s'il y a des cas légaux actifs
        // Implémentation simplifiée
        return 0;
    }
    async getScheduledDeletions(userId) {
        // Récupérer les suppressions programmées
        return [];
    }
    async collectProfileData(userId, userType) {
        if (userType === 'fan') {
            return this.prisma.fan.findUnique({
                where: { id: userId },
                include: {
                    subscriptions: true,
                    purchases: true
                }
            });
        }
        else {
            return this.prisma.creator.findUnique({
                where: { id: userId },
                include: {
                    subscriptionPlans: true,
                    products: true,
                    settings: true
                }
            });
        }
    }
    async collectTransactionData(userId, userType) {
        return this.prisma.transaction.findMany({
            where: userType === 'fan' ? { fanId: userId } : { creatorId: userId },
            include: {
                purchase: true,
                payout: true
            }
        });
    }
    async collectContentData(userId, userType) {
        if (userType === 'creator') {
            return this.prisma.product.findMany({
                where: { creatorId: userId }
            });
        }
        else {
            return this.prisma.purchase.findMany({
                where: { fanId: userId },
                include: { product: true }
            });
        }
    }
    async collectMessageData(userId, userType) {
        // Collecter les messages (à implémenter selon le système de messagerie)
        return [];
    }
    async collectAnalyticsData(userId, userType) {
        if (userType === 'creator') {
            return this.prisma.analytics.findMany({
                where: { creatorId: userId }
            });
        }
        return [];
    }
    async collectAuditLogs(userId, userType) {
        return this.prisma.auditLog.findMany({
            where: {
                OR: [
                    { actorId: userId },
                    { creatorId: userType === 'creator' ? userId : undefined }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 1000
        });
    }
    async anonymizeRelatedData(userId, userType) {
        // Anonymiser les données liées
        if (userType === 'fan') {
            // Anonymiser les relations avec les créateurs
            await this.prisma.fanRelation.updateMany({
                where: { fanId: userId },
                data: { notes: null }
            });
        }
        else {
            // Anonymiser les produits
            await this.prisma.product.updateMany({
                where: { creatorId: userId },
                data: {
                    title: 'Anonymous Content',
                    description: null
                }
            });
        }
    }
    async deleteProfileData(userId, userType) {
        if (userType === 'fan') {
            await this.prisma.fan.delete({ where: { id: userId } });
        }
        else {
            await this.prisma.creator.delete({ where: { id: userId } });
        }
    }
    async deleteContentData(userId, userType) {
        if (userType === 'creator') {
            await this.prisma.product.deleteMany({ where: { creatorId: userId } });
        }
    }
    async deleteMessageData(userId, userType) {
        // Supprimer les messages (à implémenter)
    }
    async deleteAnalyticsData(userId, userType) {
        if (userType === 'creator') {
            await this.prisma.analytics.deleteMany({ where: { creatorId: userId } });
        }
    }
    async deleteAuditLogs(userId, userType) {
        await this.prisma.auditLog.deleteMany({
            where: {
                OR: [
                    { actorId: userId },
                    { creatorId: userType === 'creator' ? userId : undefined }
                ]
            }
        });
    }
    async notifyExportReady(userId, userType, downloadUrl) {
        await this.eventEmitter.emit('notification.send', {
            userId,
            type: 'data_export_ready',
            channel: 'email',
            data: {
                downloadUrl,
                expiresIn: '7 days'
            }
        });
    }
};
exports.GdprService = GdprService;
exports.GdprService = GdprService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, event_emitter_1.EventEmitter2, typeof (_b = typeof storage_service_1.StorageService !== "undefined" && storage_service_1.StorageService) === "function" ? _b : Object, typeof (_c = typeof crypto_service_1.CryptoService !== "undefined" && crypto_service_1.CryptoService) === "function" ? _c : Object])
], GdprService);
//# sourceMappingURL=gdpr.service.js.map