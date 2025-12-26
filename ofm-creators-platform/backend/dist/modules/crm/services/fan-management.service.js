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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FanManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const date_fns_1 = require("date-fns");
const library_1 = require("@prisma/client/runtime/library");
let FanManagementService = class FanManagementService {
    prisma;
    eventEmitter;
    cache;
    segmentDefinitions = {
        vip: {
            minLifetimeValue: 500,
            minEngagementScore: 80,
            subscriptionStatus: ['ACTIVE']
        },
        active: {
            minEngagementScore: 50,
            daysSinceLastPurchase: { max: 30 }
        },
        atrisk: {
            subscriptionStatus: ['ACTIVE'],
            daysSinceLastPurchase: { min: 30, max: 60 },
            minEngagementScore: 20
        },
        churned: {
            subscriptionStatus: ['CANCELED'],
            daysSinceLastPurchase: { min: 60 }
        },
        new: {
            daysSinceLastPurchase: { max: 7 }
        }
    };
    constructor(prisma, eventEmitter, cache) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.cache = cache;
    }
    /**
     * Crée ou met à jour une relation fan-créateur
     */
    async upsertFanRelation(creatorId, fanId, data) {
        const fanRelation = await this.prisma.fanRelation.upsert({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            },
            create: {
                creatorId,
                fanId,
                tags: data.tags || [],
                notes: data.notes,
                engagementScore: data.engagementScore || 0,
                lifetimeValue: data.lifetimeValue || new library_1.Decimal(0),
                lastInteraction: data.lastInteraction || new Date(),
                emailOptIn: data.emailOptIn ?? true,
                smsOptIn: data.smsOptIn ?? false
            },
            update: {
                tags: data.tags,
                notes: data.notes,
                engagementScore: data.engagementScore,
                lifetimeValue: data.lifetimeValue,
                lastInteraction: data.lastInteraction,
                emailOptIn: data.emailOptIn,
                smsOptIn: data.smsOptIn
            }
        });
        // Invalider le cache
        await this.cache.del(`fan:${fanId}:relations`);
        await this.cache.del(`creator:${creatorId}:fans:*`);
        return fanRelation;
    }
    /**
     * Ajoute des tags à un fan
     */
    async addTags(creatorId, fanId, tags) {
        const fanRelation = await this.prisma.fanRelation.findUnique({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            }
        });
        if (!fanRelation) {
            return this.upsertFanRelation(creatorId, fanId, { tags });
        }
        const updatedTags = Array.from(new Set([...fanRelation.tags, ...tags]));
        const updated = await this.prisma.fanRelation.update({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            },
            data: { tags: updatedTags }
        });
        this.eventEmitter.emit('fan.tags.added', {
            creatorId,
            fanId,
            tags,
            allTags: updatedTags
        });
        return updated;
    }
    /**
     * Retire des tags d'un fan
     */
    async removeTags(creatorId, fanId, tags) {
        const fanRelation = await this.prisma.fanRelation.findUnique({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            }
        });
        if (!fanRelation) {
            throw new Error('Fan relation not found');
        }
        const updatedTags = fanRelation.tags.filter(tag => !tags.includes(tag));
        return this.prisma.fanRelation.update({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            },
            data: { tags: updatedTags }
        });
    }
    /**
     * Calcule et met à jour le score d'engagement
     */
    async updateEngagementScore(creatorId, fanId) {
        // Récupérer les métriques d'engagement
        const [subscriptionData, purchaseData, interactionData] = await Promise.all([
            this.getSubscriptionMetrics(creatorId, fanId),
            this.getPurchaseMetrics(creatorId, fanId),
            this.getInteractionMetrics(creatorId, fanId)
        ]);
        // Calculer le score (0-100)
        let score = 0;
        // Abonnement actif : 30 points
        if (subscriptionData.isActive) {
            score += 30;
            // Bonus pour la durée
            if (subscriptionData.durationDays > 365)
                score += 10;
            else if (subscriptionData.durationDays > 180)
                score += 5;
        }
        // Achats : jusqu'à 40 points
        if (purchaseData.totalPurchases > 0) {
            const purchaseScore = Math.min(40, purchaseData.totalPurchases * 4);
            score += purchaseScore;
        }
        // Récence : jusqu'à 20 points
        const daysSinceLastActivity = interactionData.daysSinceLastActivity;
        if (daysSinceLastActivity <= 7)
            score += 20;
        else if (daysSinceLastActivity <= 30)
            score += 15;
        else if (daysSinceLastActivity <= 60)
            score += 10;
        else if (daysSinceLastActivity <= 90)
            score += 5;
        // Valeur vie client : jusqu'à 10 points
        const ltv = purchaseData.lifetimeValue;
        if (ltv >= 1000)
            score += 10;
        else if (ltv >= 500)
            score += 7;
        else if (ltv >= 200)
            score += 5;
        else if (ltv >= 100)
            score += 3;
        // Mettre à jour le score
        await this.prisma.fanRelation.update({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            },
            data: {
                engagementScore: Math.round(score),
                lifetimeValue: new library_1.Decimal(purchaseData.lifetimeValue),
                lastInteraction: new Date()
            }
        });
        return Math.round(score);
    }
    /**
     * Obtient les fans par segment
     */
    async getFansBySegment(creatorId, segmentId, options) {
        const segment = this.getSegmentDefinition(segmentId);
        const criteria = segment.criteria;
        // Construire la requête Prisma
        const where = {
            creatorId,
            ...(criteria.tags && { tags: { hasSome: criteria.tags } }),
            ...(criteria.minLifetimeValue && {
                lifetimeValue: { gte: criteria.minLifetimeValue }
            }),
            ...(criteria.maxLifetimeValue && {
                lifetimeValue: { lte: criteria.maxLifetimeValue }
            }),
            ...(criteria.minEngagementScore && {
                engagementScore: { gte: criteria.minEngagementScore }
            })
        };
        // Ajouter les critères d'abonnement si nécessaire
        if (criteria.subscriptionStatus) {
            where.fan = {
                subscriptions: {
                    some: {
                        creatorId,
                        status: { in: criteria.subscriptionStatus }
                    }
                }
            };
        }
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;
        const [fans, total] = await Promise.all([
            this.prisma.fanRelation.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [options?.sortBy || 'engagementScore']: options?.sortOrder || 'desc'
                },
                include: {
                    fan: {
                        include: {
                            subscriptions: {
                                where: { creatorId },
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            },
                            purchases: {
                                where: { product: { creatorId } },
                                orderBy: { createdAt: 'desc' },
                                take: 5
                            }
                        }
                    }
                }
            }),
            this.prisma.fanRelation.count({ where })
        ]);
        return {
            fans: fans.map(fr => this.enrichFanData(fr)),
            total,
            segment: {
                ...segment,
                fanCount: total
            }
        };
    }
    /**
     * Crée un segment personnalisé
     */
    async createCustomSegment(creatorId, name, description, criteria) {
        // Stocker le segment personnalisé (dans Redis ou une table dédiée)
        const segmentId = `custom_${Date.now()}`;
        const segment = {
            id: segmentId,
            name,
            description,
            criteria
        };
        await this.cache.set(`creator:${creatorId}:segments:${segmentId}`, segment, 86400 * 30 // 30 jours
        );
        // Compter les fans correspondants
        const fanCount = await this.countFansInSegment(creatorId, criteria);
        segment.fanCount = fanCount;
        this.eventEmitter.emit('segment.created', {
            creatorId,
            segmentId,
            segment
        });
        return segment;
    }
    /**
     * Met à jour les opt-ins de communication
     */
    async updateCommunicationPreferences(creatorId, fanId, preferences) {
        const updated = await this.prisma.fanRelation.update({
            where: {
                creatorId_fanId: {
                    creatorId,
                    fanId
                }
            },
            data: {
                emailOptIn: preferences.emailOptIn,
                smsOptIn: preferences.smsOptIn,
                updatedAt: new Date()
            }
        });
        // Logger le consentement pour la conformité
        await this.logConsentUpdate(fanId, creatorId, preferences);
        return updated;
    }
    /**
     * Obtient les statistiques d'engagement des fans
     */
    async getFanEngagementStats(creatorId, period = 'month') {
        const dateRange = this.getDateRange(period);
        // Statistiques globales
        const [totalFans, activeFans, vipFans, churnedFans, averageEngagement, averageLTV] = await Promise.all([
            this.prisma.fanRelation.count({ where: { creatorId } }),
            this.countActiveFans(creatorId, dateRange),
            this.countVIPFans(creatorId),
            this.countChurnedFans(creatorId, dateRange),
            this.getAverageEngagementScore(creatorId),
            this.getAverageLTV(creatorId)
        ]);
        // Distribution par segment
        const segmentDistribution = await this.getSegmentDistribution(creatorId);
        // Top fans
        const topFans = await this.getTopFans(creatorId, 10);
        // Tendances d'engagement
        const engagementTrends = await this.getEngagementTrends(creatorId, dateRange.start, dateRange.end);
        return {
            summary: {
                totalFans,
                activeFans,
                vipFans,
                churnedFans,
                averageEngagementScore: averageEngagement,
                averageLifetimeValue: averageLTV
            },
            segmentDistribution,
            topFans,
            engagementTrends,
            communicationOptIns: await this.getCommunicationOptInStats(creatorId)
        };
    }
    /**
     * Recherche avancée de fans
     */
    async searchFans(creatorId, filter) {
        // Construire la requête complexe
        const where = {
            creatorId,
            ...(filter.search && {
                OR: [
                    { fan: { email: { contains: filter.search, mode: 'insensitive' } } },
                    { fan: { username: { contains: filter.search, mode: 'insensitive' } } },
                    { fan: { displayName: { contains: filter.search, mode: 'insensitive' } } },
                    { notes: { contains: filter.search, mode: 'insensitive' } }
                ]
            }),
            ...(filter.tags && { tags: { hasSome: filter.tags } }),
            ...(filter.minLifetimeValue && {
                lifetimeValue: { gte: filter.minLifetimeValue }
            }),
            ...(filter.maxLifetimeValue && {
                lifetimeValue: { lte: filter.maxLifetimeValue }
            }),
            ...(filter.minEngagementScore && {
                engagementScore: { gte: filter.minEngagementScore }
            }),
            ...(filter.maxEngagementScore && {
                engagementScore: { lte: filter.maxEngagementScore }
            }),
            ...(filter.hasActiveSubscription !== undefined && {
                fan: {
                    subscriptions: filter.hasActiveSubscription
                        ? { some: { creatorId, status: { in: ['ACTIVE', 'TRIALING'] } } }
                        : { none: { creatorId, status: { in: ['ACTIVE', 'TRIALING'] } } }
                }
            }),
            ...(filter.lastInteractionDays && {
                lastInteraction: {
                    gte: (0, date_fns_1.subDays)(new Date(), filter.lastInteractionDays)
                }
            })
        };
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const skip = (page - 1) * limit;
        const [fans, total] = await Promise.all([
            this.prisma.fanRelation.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [filter.sortBy || 'engagementScore']: filter.sortOrder || 'desc'
                },
                include: {
                    fan: {
                        include: {
                            subscriptions: {
                                where: { creatorId },
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            },
                            _count: {
                                select: {
                                    purchases: true,
                                    transactions: true
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.fanRelation.count({ where })
        ]);
        // Calculer les facettes pour les filtres
        const facets = await this.calculateFacets(creatorId, where);
        return {
            fans: fans.map(fr => this.enrichFanData(fr)),
            total,
            facets
        };
    }
    /**
     * Exporte les données des fans
     */
    async exportFans(creatorId, format, filter) {
        const { fans } = await this.searchFans(creatorId, {
            ...filter,
            page: 1,
            limit: 10000 // Limite pour l'export
        });
        if (format === 'json') {
            return Buffer.from(JSON.stringify(fans, null, 2));
        }
        // Format CSV
        const headers = [
            'Email',
            'Username',
            'Display Name',
            'Tags',
            'Engagement Score',
            'Lifetime Value',
            'Active Subscription',
            'Total Purchases',
            'Last Interaction',
            'Email Opt-In',
            'SMS Opt-In',
            'Notes'
        ];
        const rows = fans.map(fan => [
            fan.email,
            fan.username || '',
            fan.displayName || '',
            fan.tags.join(', '),
            fan.engagementScore,
            fan.lifetimeValue,
            fan.hasActiveSubscription ? 'Yes' : 'No',
            fan.totalPurchases,
            fan.lastInteraction,
            fan.emailOptIn ? 'Yes' : 'No',
            fan.smsOptIn ? 'Yes' : 'No',
            fan.notes || ''
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        return Buffer.from(csvContent);
    }
    // Méthodes privées helper
    getSegmentDefinition(segmentId) {
        const criteria = this.segmentDefinitions[segmentId];
        if (!criteria) {
            throw new Error(`Unknown segment: ${segmentId}`);
        }
        return {
            id: segmentId,
            name: segmentId.charAt(0).toUpperCase() + segmentId.slice(1),
            description: this.getSegmentDescription(segmentId),
            criteria
        };
    }
    getSegmentDescription(segmentId) {
        const descriptions = {
            vip: 'High-value fans with strong engagement',
            active: 'Recently engaged fans',
            atrisk: 'Fans showing signs of disengagement',
            churned: 'Inactive fans who have churned',
            new: 'Recently acquired fans'
        };
        return descriptions[segmentId] || '';
    }
    async getSubscriptionMetrics(creatorId, fanId) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                creatorId,
                fanId,
                status: { in: ['ACTIVE', 'TRIALING'] }
            },
            orderBy: { createdAt: 'desc' }
        });
        return {
            isActive: !!subscription,
            durationDays: subscription
                ? (0, date_fns_1.differenceInDays)(new Date(), subscription.createdAt)
                : 0
        };
    }
    async getPurchaseMetrics(creatorId, fanId) {
        const result = await this.prisma.transaction.aggregate({
            where: {
                creatorId,
                fanId,
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            },
            _count: true
        });
        return {
            totalPurchases: result._count,
            lifetimeValue: result._sum.amount?.toNumber() || 0
        };
    }
    async getInteractionMetrics(creatorId, fanId) {
        const lastTransaction = await this.prisma.transaction.findFirst({
            where: {
                creatorId,
                fanId
            },
            orderBy: { createdAt: 'desc' }
        });
        const daysSinceLastActivity = lastTransaction
            ? (0, date_fns_1.differenceInDays)(new Date(), lastTransaction.createdAt)
            : 999;
        return {
            daysSinceLastActivity,
            lastActivityDate: lastTransaction?.createdAt
        };
    }
    enrichFanData(fanRelation) {
        const subscription = fanRelation.fan.subscriptions[0];
        return {
            id: fanRelation.fanId,
            email: fanRelation.fan.email,
            username: fanRelation.fan.username,
            displayName: fanRelation.fan.displayName,
            avatar: fanRelation.fan.avatar,
            tags: fanRelation.tags,
            notes: fanRelation.notes,
            engagementScore: fanRelation.engagementScore,
            lifetimeValue: fanRelation.lifetimeValue.toNumber(),
            lastInteraction: fanRelation.lastInteraction,
            emailOptIn: fanRelation.emailOptIn,
            smsOptIn: fanRelation.smsOptIn,
            hasActiveSubscription: subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING',
            subscriptionPlan: subscription?.plan?.name,
            totalPurchases: fanRelation.fan._count?.purchases || 0,
            joinedAt: fanRelation.createdAt
        };
    }
    async countFansInSegment(creatorId, criteria) {
        // Implémentation simplifiée
        const where = {
            creatorId,
            ...(criteria.tags && { tags: { hasSome: criteria.tags } }),
            ...(criteria.minLifetimeValue && {
                lifetimeValue: { gte: criteria.minLifetimeValue }
            })
        };
        return this.prisma.fanRelation.count({ where });
    }
    async logConsentUpdate(fanId, creatorId, preferences) {
        await this.prisma.auditLog.create({
            data: {
                creatorId,
                actorId: fanId,
                actorType: 'FAN',
                action: 'consent.update',
                resource: 'fan_relation',
                resourceId: `${creatorId}:${fanId}`,
                metadata: {
                    preferences,
                    timestamp: new Date().toISOString(),
                    ip: '0.0.0.0' // À récupérer depuis le contexte
                }
            }
        });
    }
    getDateRange(period) {
        const end = new Date();
        let start;
        switch (period) {
            case 'day':
                start = (0, date_fns_1.subDays)(end, 1);
                break;
            case 'week':
                start = (0, date_fns_1.subDays)(end, 7);
                break;
            case 'month':
                start = (0, date_fns_1.subDays)(end, 30);
                break;
            case 'year':
                start = (0, date_fns_1.subDays)(end, 365);
                break;
        }
        return { start, end };
    }
    async countActiveFans(creatorId, dateRange) {
        return this.prisma.fanRelation.count({
            where: {
                creatorId,
                lastInteraction: { gte: dateRange.start }
            }
        });
    }
    async countVIPFans(creatorId) {
        return this.prisma.fanRelation.count({
            where: {
                creatorId,
                engagementScore: { gte: 80 },
                lifetimeValue: { gte: 500 }
            }
        });
    }
    async countChurnedFans(creatorId, dateRange) {
        return this.prisma.subscription.count({
            where: {
                creatorId,
                status: 'CANCELED',
                canceledAt: { gte: dateRange.start }
            }
        });
    }
    async getAverageEngagementScore(creatorId) {
        const result = await this.prisma.fanRelation.aggregate({
            where: { creatorId },
            _avg: { engagementScore: true }
        });
        return Math.round(result._avg.engagementScore || 0);
    }
    async getAverageLTV(creatorId) {
        const result = await this.prisma.fanRelation.aggregate({
            where: { creatorId },
            _avg: { lifetimeValue: true }
        });
        return result._avg.lifetimeValue?.toNumber() || 0;
    }
    async getSegmentDistribution(creatorId) {
        const segments = ['vip', 'active', 'atrisk', 'churned', 'new'];
        const distribution = {};
        for (const segmentId of segments) {
            const segment = this.getSegmentDefinition(segmentId);
            const count = await this.countFansInSegment(creatorId, segment.criteria);
            distribution[segmentId] = {
                count,
                percentage: 0 // À calculer
            };
        }
        return distribution;
    }
    async getTopFans(creatorId, limit) {
        const fans = await this.prisma.fanRelation.findMany({
            where: { creatorId },
            orderBy: [
                { lifetimeValue: 'desc' },
                { engagementScore: 'desc' }
            ],
            take: limit,
            include: {
                fan: {
                    select: {
                        email: true,
                        username: true,
                        displayName: true,
                        avatar: true
                    }
                }
            }
        });
        return fans.map(fr => ({
            ...fr.fan,
            lifetimeValue: fr.lifetimeValue.toNumber(),
            engagementScore: fr.engagementScore,
            tags: fr.tags
        }));
    }
    async getEngagementTrends(creatorId, startDate, endDate) {
        // Implémentation simplifiée - devrait utiliser des agrégations temporelles
        return {
            averageScoreTrend: [],
            activeUsersTrend: [],
            churnTrend: []
        };
    }
    async getCommunicationOptInStats(creatorId) {
        const [emailOptIns, smsOptIns] = await Promise.all([
            this.prisma.fanRelation.count({
                where: { creatorId, emailOptIn: true }
            }),
            this.prisma.fanRelation.count({
                where: { creatorId, smsOptIn: true }
            })
        ]);
        const total = await this.prisma.fanRelation.count({
            where: { creatorId }
        });
        return {
            emailOptInRate: total > 0 ? (emailOptIns / total) * 100 : 0,
            smsOptInRate: total > 0 ? (smsOptIns / total) * 100 : 0,
            totalEmailOptIns: emailOptIns,
            totalSmsOptIns: smsOptIns
        };
    }
    async calculateFacets(creatorId, baseWhere) {
        // Calculer les facettes pour améliorer l'UX de recherche
        const [tagCounts, engagementRanges, valueRanges] = await Promise.all([
            this.getTagCounts(creatorId),
            this.getEngagementRanges(creatorId),
            this.getValueRanges(creatorId)
        ]);
        return {
            tags: tagCounts,
            engagementScoreRanges: engagementRanges,
            lifetimeValueRanges: valueRanges
        };
    }
    async getTagCounts(creatorId) {
        // Requête pour obtenir tous les tags et leur fréquence
        const fanRelations = await this.prisma.fanRelation.findMany({
            where: { creatorId },
            select: { tags: true }
        });
        const tagCounts = {};
        fanRelations.forEach(fr => {
            fr.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));
    }
    async getEngagementRanges(creatorId) {
        const ranges = [
            { label: '0-20', min: 0, max: 20 },
            { label: '21-40', min: 21, max: 40 },
            { label: '41-60', min: 41, max: 60 },
            { label: '61-80', min: 61, max: 80 },
            { label: '81-100', min: 81, max: 100 }
        ];
        const counts = await Promise.all(ranges.map(range => this.prisma.fanRelation.count({
            where: {
                creatorId,
                engagementScore: { gte: range.min, lte: range.max }
            }
        })));
        return ranges.map((range, index) => ({
            ...range,
            count: counts[index]
        }));
    }
    async getValueRanges(creatorId) {
        const ranges = [
            { label: '$0-50', min: 0, max: 50 },
            { label: '$51-200', min: 51, max: 200 },
            { label: '$201-500', min: 201, max: 500 },
            { label: '$501-1000', min: 501, max: 1000 },
            { label: '$1000+', min: 1001, max: null }
        ];
        const counts = await Promise.all(ranges.map(range => this.prisma.fanRelation.count({
            where: {
                creatorId,
                lifetimeValue: {
                    gte: range.min,
                    ...(range.max && { lte: range.max })
                }
            }
        })));
        return ranges.map((range, index) => ({
            ...range,
            count: counts[index]
        }));
    }
};
exports.FanManagementService = FanManagementService;
exports.FanManagementService = FanManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, event_emitter_1.EventEmitter2, typeof (_b = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _b : Object])
], FanManagementService);
//# sourceMappingURL=fan-management.service.js.map