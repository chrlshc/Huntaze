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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/database/prisma.service");
const cache_service_1 = require("@infrastructure/cache/cache.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let AnalyticsService = class AnalyticsService {
    prisma;
    cache;
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    /**
     * Obtient le dashboard overview pour un créateur
     */
    async getDashboardOverview(creatorId, period = 'month') {
        const cacheKey = `dashboard:${creatorId}:${period}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { startDate, endDate } = this.getPeriodDates(period);
        const { startDate: prevStartDate, endDate: prevEndDate } = this.getPreviousPeriodDates(period);
        // Métriques actuelles
        const [revenue, subscribers, engagement, topProducts, recentTransactions] = await Promise.all([
            this.getRevenueMetrics(creatorId, startDate, endDate),
            this.getSubscriberMetrics(creatorId, startDate, endDate),
            this.getEngagementMetrics(creatorId, startDate, endDate),
            this.getTopProducts(creatorId, startDate, endDate, 5),
            this.getRecentTransactions(creatorId, 10)
        ]);
        // Métriques de la période précédente pour comparaison
        const [prevRevenue, prevSubscribers] = await Promise.all([
            this.getRevenueMetrics(creatorId, prevStartDate, prevEndDate),
            this.getSubscriberMetrics(creatorId, prevStartDate, prevEndDate)
        ]);
        // Calculer les variations
        const revenueGrowth = this.calculateGrowthRate(revenue.total, prevRevenue.total);
        const subscriberGrowth = this.calculateGrowthRate(subscribers.active, prevSubscribers.active);
        const overview = {
            period,
            dateRange: { start: startDate, end: endDate },
            // KPIs principaux
            totalRevenue: revenue.total,
            revenueGrowth,
            activeSubscribers: subscribers.active,
            subscriberGrowth,
            conversionRate: engagement.conversionRate,
            averageOrderValue: revenue.averageOrderValue,
            // Détails revenus
            revenue: {
                total: revenue.total,
                subscription: revenue.subscription,
                products: revenue.products,
                tips: revenue.tips,
                growth: revenueGrowth
            },
            // Détails abonnés
            subscribers: {
                total: subscribers.total,
                active: subscribers.active,
                new: subscribers.new,
                churned: subscribers.churned,
                churnRate: subscribers.churnRate,
                growth: subscriberGrowth
            },
            // Engagement
            engagement: {
                pageViews: engagement.pageViews,
                uniqueVisitors: engagement.uniqueVisitors,
                avgSessionDuration: engagement.avgSessionDuration,
                conversionRate: engagement.conversionRate
            },
            // Top content
            topProducts,
            recentTransactions,
            // Quick stats
            quickStats: {
                pendingPayouts: await this.getPendingPayouts(creatorId),
                availableBalance: await this.getAvailableBalance(creatorId),
                totalFans: await this.getTotalFans(creatorId),
                contentPublished: await this.getContentCount(creatorId)
            }
        };
        // Cache pour 5 minutes
        await this.cache.set(cacheKey, overview, 300);
        return overview;
    }
    /**
     * Obtient les analytics de revenus détaillés
     */
    async getRevenueAnalytics(creatorId, startDate, endDate, groupBy = 'day') {
        const start = startDate || (0, date_fns_1.subDays)(new Date(), 30);
        const end = endDate || new Date();
        // Revenus par type
        const revenueByType = await this.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                creatorId,
                status: client_1.TransactionStatus.COMPLETED,
                createdAt: { gte: start, lte: end }
            },
            _sum: {
                amount: true,
                netAmount: true,
                platformFee: true
            },
            _count: true
        });
        // Série temporelle des revenus
        const timeSeries = await this.getRevenueTimeSeries(creatorId, start, end, groupBy);
        // Top sources de revenus
        const topSources = await this.getTopRevenueSources(creatorId, start, end);
        // Projections
        const projection = this.calculateRevenueProjection(timeSeries);
        // Métriques de commission
        const commissionMetrics = await this.getCommissionMetrics(creatorId, start, end);
        return {
            period: { start, end },
            summary: {
                total: revenueByType.reduce((sum, r) => sum + (r._sum.amount?.toNumber() || 0), 0),
                net: revenueByType.reduce((sum, r) => sum + (r._sum.netAmount?.toNumber() || 0), 0),
                fees: revenueByType.reduce((sum, r) => sum + (r._sum.platformFee?.toNumber() || 0), 0),
                transactionCount: revenueByType.reduce((sum, r) => sum + r._count, 0)
            },
            byType: revenueByType.map(r => ({
                type: r.type,
                amount: r._sum.amount?.toNumber() || 0,
                net: r._sum.netAmount?.toNumber() || 0,
                fees: r._sum.platformFee?.toNumber() || 0,
                count: r._count
            })),
            timeSeries,
            topSources,
            projection,
            commissionMetrics
        };
    }
    /**
     * Obtient les analytics des abonnés
     */
    async getSubscriberAnalytics(creatorId, startDate, endDate) {
        const start = startDate || (0, date_fns_1.subDays)(new Date(), 30);
        const end = endDate || new Date();
        // Métriques actuelles
        const currentMetrics = await this.getSubscriberMetrics(creatorId, start, end);
        // Croissance des abonnés
        const growthTimeSeries = await this.getSubscriberGrowthTimeSeries(creatorId, start, end);
        // Analyse de la rétention
        const retentionAnalysis = await this.getRetentionAnalysis(creatorId);
        // Valeur vie client (LTV)
        const lifetimeValue = await this.calculateLifetimeValue(creatorId);
        // Distribution par plan
        const planDistribution = await this.getSubscribersByPlan(creatorId);
        // Prédiction du churn
        const churnPrediction = await this.predictChurn(creatorId);
        return {
            period: { start, end },
            summary: currentMetrics,
            growth: growthTimeSeries,
            retention: retentionAnalysis,
            lifetimeValue,
            planDistribution,
            churnPrediction,
            // Cohortes
            cohorts: await this.getCohortAnalysis(creatorId, 6), // 6 derniers mois
            // Segmentation
            segments: {
                byValue: await this.segmentSubscribersByValue(creatorId),
                byEngagement: await this.segmentSubscribersByEngagement(creatorId),
                byDuration: await this.segmentSubscribersByDuration(creatorId)
            }
        };
    }
    /**
     * Obtient les analytics de contenu
     */
    async getContentAnalytics(creatorId, startDate, endDate) {
        const start = startDate || (0, date_fns_1.subDays)(new Date(), 30);
        const end = endDate || new Date();
        // Performance par type de contenu
        const performanceByType = await this.prisma.product.groupBy({
            by: ['type'],
            where: {
                creatorId,
                isPublished: true,
                publishedAt: { gte: start, lte: end }
            },
            _sum: {
                viewCount: true,
                purchaseCount: true
            },
            _count: true,
            _avg: {
                price: true
            }
        });
        // Top performing content
        const topContent = await this.prisma.product.findMany({
            where: {
                creatorId,
                isPublished: true
            },
            orderBy: [
                { viewCount: 'desc' },
                { purchaseCount: 'desc' }
            ],
            take: 10,
            select: {
                id: true,
                title: true,
                type: true,
                viewCount: true,
                purchaseCount: true,
                price: true,
                publishedAt: true
            }
        });
        // Engagement metrics
        const engagementMetrics = await this.getContentEngagementMetrics(creatorId, start, end);
        // Publishing patterns
        const publishingPatterns = await this.getPublishingPatterns(creatorId);
        return {
            period: { start, end },
            summary: {
                totalContent: await this.getContentCount(creatorId),
                publishedInPeriod: performanceByType.reduce((sum, p) => sum + p._count, 0),
                totalViews: performanceByType.reduce((sum, p) => sum + (p._sum.viewCount || 0), 0),
                totalPurchases: performanceByType.reduce((sum, p) => sum + (p._sum.purchaseCount || 0), 0)
            },
            performanceByType: performanceByType.map(p => ({
                type: p.type,
                count: p._count,
                views: p._sum.viewCount || 0,
                purchases: p._sum.purchaseCount || 0,
                avgPrice: p._avg.price?.toNumber() || 0,
                conversionRate: p._sum.viewCount
                    ? ((p._sum.purchaseCount || 0) / p._sum.viewCount) * 100
                    : 0
            })),
            topContent: topContent.map(c => ({
                id: c.id,
                title: c.title,
                type: c.type,
                views: c.viewCount,
                purchases: c.purchaseCount,
                revenue: (c.price?.toNumber() || 0) * c.purchaseCount,
                conversionRate: c.viewCount > 0
                    ? (c.purchaseCount / c.viewCount) * 100
                    : 0,
                publishedAt: c.publishedAt
            })),
            engagement: engagementMetrics,
            publishingPatterns,
            // Recommandations
            recommendations: await this.getContentRecommendations(creatorId)
        };
    }
    // Méthodes privées helper
    getPeriodDates(period) {
        const endDate = (0, date_fns_1.endOfDay)(new Date());
        let startDate;
        switch (period) {
            case 'day':
                startDate = (0, date_fns_1.startOfDay)(new Date());
                break;
            case 'week':
                startDate = (0, date_fns_1.subDays)(endDate, 7);
                break;
            case 'month':
                startDate = (0, date_fns_1.subDays)(endDate, 30);
                break;
            case 'year':
                startDate = (0, date_fns_1.subDays)(endDate, 365);
                break;
        }
        return { startDate, endDate };
    }
    getPreviousPeriodDates(period) {
        const { startDate, endDate } = this.getPeriodDates(period);
        const duration = endDate.getTime() - startDate.getTime();
        return {
            startDate: new Date(startDate.getTime() - duration),
            endDate: new Date(endDate.getTime() - duration)
        };
    }
    calculateGrowthRate(current, previous) {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }
    async getRevenueMetrics(creatorId, startDate, endDate) {
        const transactions = await this.prisma.transaction.aggregate({
            where: {
                creatorId,
                status: client_1.TransactionStatus.COMPLETED,
                createdAt: { gte: startDate, lte: endDate }
            },
            _sum: {
                amount: true,
                netAmount: true,
                platformFee: true
            },
            _count: true,
            _avg: {
                amount: true
            }
        });
        // Par type
        const byType = await this.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                creatorId,
                status: client_1.TransactionStatus.COMPLETED,
                createdAt: { gte: startDate, lte: endDate }
            },
            _sum: {
                amount: true
            }
        });
        const typeMap = byType.reduce((acc, t) => {
            acc[t.type.toLowerCase()] = t._sum.amount?.toNumber() || 0;
            return acc;
        }, {});
        return {
            total: transactions._sum.amount?.toNumber() || 0,
            net: transactions._sum.netAmount?.toNumber() || 0,
            fees: transactions._sum.platformFee?.toNumber() || 0,
            subscription: typeMap['subscription'] || 0,
            products: typeMap['purchase'] || 0,
            tips: typeMap['tip'] || 0,
            transactionCount: transactions._count,
            averageOrderValue: transactions._avg.amount?.toNumber() || 0
        };
    }
    async getSubscriberMetrics(creatorId, startDate, endDate) {
        // Total actifs
        const activeCount = await this.prisma.subscription.count({
            where: {
                creatorId,
                status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] }
            }
        });
        // Nouveaux dans la période
        const newCount = await this.prisma.subscription.count({
            where: {
                creatorId,
                createdAt: { gte: startDate, lte: endDate }
            }
        });
        // Churned dans la période
        const churnedCount = await this.prisma.subscription.count({
            where: {
                creatorId,
                status: client_1.SubscriptionStatus.CANCELED,
                canceledAt: { gte: startDate, lte: endDate }
            }
        });
        // Total tous statuts
        const totalCount = await this.prisma.subscription.count({
            where: { creatorId }
        });
        const churnRate = activeCount > 0 ? (churnedCount / activeCount) * 100 : 0;
        return {
            total: totalCount,
            active: activeCount,
            new: newCount,
            churned: churnedCount,
            churnRate
        };
    }
    async getEngagementMetrics(creatorId, startDate, endDate) {
        // Récupérer depuis la table Analytics
        const analytics = await this.prisma.analytics.aggregate({
            where: {
                creatorId,
                date: { gte: startDate, lte: endDate }
            },
            _sum: {
                pageViews: true,
                uniqueVisitors: true,
                contentViews: true
            },
            _avg: {
                conversionRate: true
            }
        });
        return {
            pageViews: analytics._sum.pageViews || 0,
            uniqueVisitors: analytics._sum.uniqueVisitors || 0,
            contentViews: analytics._sum.contentViews || 0,
            conversionRate: analytics._avg.conversionRate?.toNumber() || 0,
            avgSessionDuration: 0 // À implémenter avec un système de tracking
        };
    }
    async getTopProducts(creatorId, startDate, endDate, limit) {
        const products = await this.prisma.product.findMany({
            where: {
                creatorId,
                isPublished: true,
                publishedAt: { gte: startDate, lte: endDate }
            },
            orderBy: [
                { purchaseCount: 'desc' },
                { viewCount: 'desc' }
            ],
            take: limit,
            select: {
                id: true,
                title: true,
                type: true,
                thumbnailUrl: true,
                price: true,
                viewCount: true,
                purchaseCount: true
            }
        });
        return products.map(p => ({
            id: p.id,
            title: p.title,
            type: p.type,
            thumbnailUrl: p.thumbnailUrl,
            metrics: {
                views: p.viewCount,
                purchases: p.purchaseCount,
                revenue: (p.price?.toNumber() || 0) * p.purchaseCount,
                conversionRate: p.viewCount > 0 ? (p.purchaseCount / p.viewCount) * 100 : 0
            }
        }));
    }
    async getRecentTransactions(creatorId, limit) {
        const transactions = await this.prisma.transaction.findMany({
            where: {
                creatorId,
                status: client_1.TransactionStatus.COMPLETED
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                fan: {
                    select: {
                        username: true,
                        displayName: true,
                        avatar: true
                    }
                }
            }
        });
        return transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount.toNumber(),
            currency: t.currency,
            fan: t.fan ? {
                username: t.fan.username,
                displayName: t.fan.displayName,
                avatar: t.fan.avatar
            } : null,
            createdAt: t.createdAt
        }));
    }
    async getPendingPayouts(creatorId) {
        const result = await this.prisma.payout.aggregate({
            where: {
                creatorId,
                status: 'PENDING'
            },
            _sum: {
                amount: true
            }
        });
        return result._sum.amount?.toNumber() || 0;
    }
    async getAvailableBalance(creatorId) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            select: { availableBalance: true }
        });
        return creator?.availableBalance.toNumber() || 0;
    }
    async getTotalFans(creatorId) {
        return this.prisma.fanRelation.count({
            where: { creatorId }
        });
    }
    async getContentCount(creatorId) {
        return this.prisma.product.count({
            where: {
                creatorId,
                isPublished: true
            }
        });
    }
    async getRevenueTimeSeries(creatorId, startDate, endDate, groupBy) {
        // Pour simplifier, on fait par jour et on agrège si nécessaire
        const days = (0, date_fns_1.eachDayOfInterval)({ start: startDate, end: endDate });
        const dailyRevenue = await Promise.all(days.map(async (day) => {
            const dayStart = (0, date_fns_1.startOfDay)(day);
            const dayEnd = (0, date_fns_1.endOfDay)(day);
            const result = await this.prisma.transaction.aggregate({
                where: {
                    creatorId,
                    status: client_1.TransactionStatus.COMPLETED,
                    createdAt: { gte: dayStart, lte: dayEnd }
                },
                _sum: {
                    amount: true
                }
            });
            return {
                date: (0, date_fns_1.format)(day, 'yyyy-MM-dd'),
                value: result._sum.amount?.toNumber() || 0
            };
        }));
        return dailyRevenue;
    }
    async getTopRevenueSources(creatorId, startDate, endDate) {
        // Top fans par revenus
        const topFans = await this.prisma.transaction.groupBy({
            by: ['fanId'],
            where: {
                creatorId,
                status: client_1.TransactionStatus.COMPLETED,
                createdAt: { gte: startDate, lte: endDate },
                fanId: { not: null }
            },
            _sum: {
                amount: true
            },
            _count: true,
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            take: 10
        });
        // Enrichir avec les infos des fans
        const fanIds = topFans.map(f => f.fanId).filter(Boolean);
        const fans = await this.prisma.fan.findMany({
            where: { id: { in: fanIds } },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
            }
        });
        const fanMap = fans.reduce((acc, f) => {
            acc[f.id] = f;
            return acc;
        }, {});
        return topFans.map(tf => ({
            fanId: tf.fanId,
            fan: fanMap[tf.fanId] || null,
            totalRevenue: tf._sum.amount?.toNumber() || 0,
            transactionCount: tf._count
        }));
    }
    calculateRevenueProjection(timeSeries) {
        if (timeSeries.length < 7) {
            return { nextMonth: 0, nextQuarter: 0, nextYear: 0 };
        }
        // Calcul simple basé sur la moyenne mobile
        const recentDays = timeSeries.slice(-30);
        const avgDailyRevenue = recentDays.reduce((sum, d) => sum + d.value, 0) / recentDays.length;
        return {
            nextMonth: avgDailyRevenue * 30,
            nextQuarter: avgDailyRevenue * 90,
            nextYear: avgDailyRevenue * 365
        };
    }
    async getCommissionMetrics(creatorId, startDate, endDate) {
        const creator = await this.prisma.creator.findUnique({
            where: { id: creatorId },
            select: {
                commissionTier: true,
                totalRevenue: true
            }
        });
        const transactions = await this.prisma.transaction.aggregate({
            where: {
                creatorId,
                status: client_1.TransactionStatus.COMPLETED,
                createdAt: { gte: startDate, lte: endDate }
            },
            _sum: {
                platformFee: true
            },
            _avg: {
                platformFeeRate: true
            }
        });
        return {
            currentTier: creator?.commissionTier || 'STARTER',
            totalFeesPaid: transactions._sum.platformFee?.toNumber() || 0,
            averageFeeRate: transactions._avg.platformFeeRate?.toNumber() || 0,
            lifetimeRevenue: creator?.totalRevenue.toNumber() || 0
        };
    }
    async getSubscriberGrowthTimeSeries(creatorId, startDate, endDate) {
        const days = (0, date_fns_1.eachDayOfInterval)({ start: startDate, end: endDate });
        const growth = await Promise.all(days.map(async (day) => {
            const count = await this.prisma.subscription.count({
                where: {
                    creatorId,
                    status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] },
                    createdAt: { lte: (0, date_fns_1.endOfDay)(day) }
                }
            });
            return {
                date: (0, date_fns_1.format)(day, 'yyyy-MM-dd'),
                value: count
            };
        }));
        return growth;
    }
    async getRetentionAnalysis(creatorId) {
        // Analyse de rétention par cohorte mensuelle
        const sixMonthsAgo = (0, date_fns_1.subDays)(new Date(), 180);
        const subscriptions = await this.prisma.subscription.findMany({
            where: {
                creatorId,
                createdAt: { gte: sixMonthsAgo }
            },
            select: {
                id: true,
                createdAt: true,
                status: true,
                canceledAt: true
            }
        });
        // Calcul simplifié de la rétention
        const totalSubscriptions = subscriptions.length;
        const activeSubscriptions = subscriptions.filter(s => s.status === client_1.SubscriptionStatus.ACTIVE || s.status === client_1.SubscriptionStatus.TRIALING).length;
        const retentionRate = totalSubscriptions > 0
            ? (activeSubscriptions / totalSubscriptions) * 100
            : 0;
        // Durée moyenne d'abonnement
        const durations = subscriptions
            .filter(s => s.canceledAt)
            .map(s => {
            const duration = s.canceledAt.getTime() - s.createdAt.getTime();
            return duration / (1000 * 60 * 60 * 24); // En jours
        });
        const avgDuration = durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;
        return {
            retentionRate,
            averageSubscriptionDuration: avgDuration,
            monthlyRetention: [] // À implémenter avec une analyse plus détaillée
        };
    }
    async calculateLifetimeValue(creatorId) {
        const result = await this.prisma.subscription.aggregate({
            where: { creatorId },
            _avg: {
                totalSpent: true
            }
        });
        return result._avg.totalSpent?.toNumber() || 0;
    }
    async getSubscribersByPlan(creatorId) {
        const distribution = await this.prisma.subscription.groupBy({
            by: ['planId'],
            where: {
                creatorId,
                status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] }
            },
            _count: true
        });
        // Enrichir avec les infos des plans
        const planIds = distribution.map(d => d.planId);
        const plans = await this.prisma.subscriptionPlan.findMany({
            where: { id: { in: planIds } },
            select: {
                id: true,
                name: true,
                price: true
            }
        });
        const planMap = plans.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {});
        return distribution.map(d => ({
            planId: d.planId,
            planName: planMap[d.planId]?.name || 'Unknown',
            price: planMap[d.planId]?.price.toNumber() || 0,
            count: d._count
        }));
    }
    async predictChurn(creatorId) {
        // Prédiction simplifiée basée sur les patterns historiques
        const thirtyDaysAgo = (0, date_fns_1.subDays)(new Date(), 30);
        const recentChurn = await this.prisma.subscription.count({
            where: {
                creatorId,
                status: client_1.SubscriptionStatus.CANCELED,
                canceledAt: { gte: thirtyDaysAgo }
            }
        });
        const activeCount = await this.prisma.subscription.count({
            where: {
                creatorId,
                status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] }
            }
        });
        const predictedChurnRate = activeCount > 0
            ? (recentChurn / activeCount) * 100
            : 0;
        return {
            predictedChurnRate,
            atRiskSubscribers: Math.round(activeCount * predictedChurnRate / 100),
            confidence: 0.7 // Placeholder
        };
    }
    async getCohortAnalysis(creatorId, months) {
        // Analyse de cohorte simplifiée
        const cohorts = [];
        for (let i = 0; i < months; i++) {
            const cohortStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), i * 30));
            const cohortEnd = (0, date_fns_1.endOfDay)((0, date_fns_1.subDays)(new Date(), (i - 1) * 30));
            const cohortSize = await this.prisma.subscription.count({
                where: {
                    creatorId,
                    createdAt: { gte: cohortStart, lte: cohortEnd }
                }
            });
            const retained = await this.prisma.subscription.count({
                where: {
                    creatorId,
                    createdAt: { gte: cohortStart, lte: cohortEnd },
                    status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] }
                }
            });
            cohorts.push({
                month: (0, date_fns_1.format)(cohortStart, 'yyyy-MM'),
                size: cohortSize,
                retained,
                retentionRate: cohortSize > 0 ? (retained / cohortSize) * 100 : 0
            });
        }
        return cohorts;
    }
    async segmentSubscribersByValue(creatorId) {
        const subscribers = await this.prisma.subscription.findMany({
            where: {
                creatorId,
                status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] }
            },
            select: {
                fanId: true,
                totalSpent: true
            }
        });
        const segments = {
            high: subscribers.filter(s => s.totalSpent.toNumber() > 500).length,
            medium: subscribers.filter(s => {
                const spent = s.totalSpent.toNumber();
                return spent > 100 && spent <= 500;
            }).length,
            low: subscribers.filter(s => s.totalSpent.toNumber() <= 100).length
        };
        return segments;
    }
    async segmentSubscribersByEngagement(creatorId) {
        // Placeholder - nécessiterait un système de tracking d'engagement
        return {
            veryActive: 0,
            active: 0,
            passive: 0,
            inactive: 0
        };
    }
    async segmentSubscribersByDuration(creatorId) {
        const now = new Date();
        const subscribers = await this.prisma.subscription.findMany({
            where: {
                creatorId,
                status: { in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.TRIALING] }
            },
            select: {
                createdAt: true
            }
        });
        const segments = {
            newSubscribers: 0, // < 30 jours
            regular: 0, // 30-180 jours
            loyal: 0, // 180-365 jours
            vip: 0 // > 365 jours
        };
        subscribers.forEach(s => {
            const daysSubscribed = (now.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSubscribed < 30)
                segments.newSubscribers++;
            else if (daysSubscribed < 180)
                segments.regular++;
            else if (daysSubscribed < 365)
                segments.loyal++;
            else
                segments.vip++;
        });
        return segments;
    }
    async getContentEngagementMetrics(creatorId, startDate, endDate) {
        const products = await this.prisma.product.findMany({
            where: {
                creatorId,
                isPublished: true,
                publishedAt: { gte: startDate, lte: endDate }
            },
            select: {
                viewCount: true,
                purchaseCount: true,
                type: true
            }
        });
        const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
        const totalPurchases = products.reduce((sum, p) => sum + p.purchaseCount, 0);
        return {
            totalViews,
            totalPurchases,
            averageConversionRate: totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0,
            viewsPerContent: products.length > 0 ? totalViews / products.length : 0,
            purchasesPerContent: products.length > 0 ? totalPurchases / products.length : 0
        };
    }
    async getPublishingPatterns(creatorId) {
        const lastThreeMonths = (0, date_fns_1.subDays)(new Date(), 90);
        const publications = await this.prisma.product.findMany({
            where: {
                creatorId,
                isPublished: true,
                publishedAt: { gte: lastThreeMonths }
            },
            select: {
                publishedAt: true,
                type: true
            }
        });
        // Analyser les patterns par jour de la semaine et heure
        const dayPattern = {};
        const hourPattern = {};
        publications.forEach(p => {
            if (p.publishedAt) {
                const day = p.publishedAt.getDay();
                const hour = p.publishedAt.getHours();
                dayPattern[day] = (dayPattern[day] || 0) + 1;
                hourPattern[hour] = (hourPattern[hour] || 0) + 1;
            }
        });
        return {
            totalPublished: publications.length,
            averagePerWeek: publications.length / 12, // Sur 3 mois
            bestDays: Object.entries(dayPattern)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([day]) => parseInt(day)),
            bestHours: Object.entries(hourPattern)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([hour]) => parseInt(hour))
        };
    }
    async getContentRecommendations(creatorId) {
        const recommendations = [];
        // Analyser les performances récentes
        const recentProducts = await this.prisma.product.findMany({
            where: {
                creatorId,
                isPublished: true,
                publishedAt: { gte: (0, date_fns_1.subDays)(new Date(), 30) }
            },
            orderBy: { purchaseCount: 'desc' },
            take: 10
        });
        // Recommandations basées sur les performances
        if (recentProducts.length > 0) {
            const avgConversion = recentProducts.reduce((sum, p) => {
                return sum + (p.viewCount > 0 ? p.purchaseCount / p.viewCount : 0);
            }, 0) / recentProducts.length;
            if (avgConversion < 0.02) {
                recommendations.push({
                    type: 'pricing',
                    message: 'Consider adjusting your pricing strategy',
                    priority: 'high'
                });
            }
            // Identifier le type de contenu le plus performant
            const typePerformance = recentProducts.reduce((acc, p) => {
                if (!acc[p.type]) {
                    acc[p.type] = { count: 0, purchases: 0 };
                }
                acc[p.type].count++;
                acc[p.type].purchases += p.purchaseCount;
                return acc;
            }, {});
            const bestType = Object.entries(typePerformance)
                .sort(([, a], [, b]) => b.purchases - a.purchases)[0];
            if (bestType) {
                recommendations.push({
                    type: 'content',
                    message: `Focus on ${bestType[0]} content - it performs best`,
                    priority: 'medium'
                });
            }
        }
        // Recommandation de fréquence de publication
        const publicationCount = await this.prisma.product.count({
            where: {
                creatorId,
                isPublished: true,
                publishedAt: { gte: (0, date_fns_1.subDays)(new Date(), 7) }
            }
        });
        if (publicationCount < 3) {
            recommendations.push({
                type: 'frequency',
                message: 'Increase your posting frequency to boost engagement',
                priority: 'medium'
            });
        }
        return recommendations;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof cache_service_1.CacheService !== "undefined" && cache_service_1.CacheService) === "function" ? _b : Object])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map