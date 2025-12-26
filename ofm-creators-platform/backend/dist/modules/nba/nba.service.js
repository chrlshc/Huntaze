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
var NBAService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBAService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const date_fns_1 = require("date-fns");
let NBAService = NBAService_1 = class NBAService {
    prisma;
    configService;
    logger = new common_1.Logger(NBAService_1.name);
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async getNextBestActions(context) {
        const maxActions = context.maxActions || 3;
        // Gather creator metrics
        const metrics = await this.gatherCreatorMetrics(context.creatorId);
        // Generate candidate actions
        const candidates = await this.generateCandidateActions(context.creatorId, metrics);
        // Score and rank actions
        const scored = candidates.map(action => ({
            ...action,
            score: this.calculateScore(action),
        }));
        // Sort by score and return top N
        const ranked = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, maxActions);
        // Log NBA recommendations for monitoring
        this.logger.log(`NBA recommendations for creator ${context.creatorId}:`, {
            metrics,
            recommendations: ranked.map(r => ({ id: r.id, score: r.score })),
        });
        return ranked;
    }
    async gatherCreatorMetrics(creatorId) {
        const now = new Date();
        const days7Ago = (0, date_fns_1.subDays)(now, 7);
        const days28Ago = (0, date_fns_1.subDays)(now, 28);
        const [revenue7d, revenue28d, activeFans, segments, avgOrder, subscriptions, content, lastPost,] = await Promise.all([
            // 7-day GMV
            this.prisma.order.aggregate({
                where: {
                    creatorId,
                    createdAt: { gte: days7Ago },
                },
                _sum: { amountCents: true },
            }),
            // 28-day GMV
            this.prisma.order.aggregate({
                where: {
                    creatorId,
                    createdAt: { gte: days28Ago },
                },
                _sum: { amountCents: true },
            }),
            // Active fans count
            this.prisma.fan.count({
                where: {
                    creatorId,
                    OR: [
                        { orders: { some: { createdAt: { gte: days28Ago } } } },
                        { subscriptions: { some: { status: 'active' } } },
                    ],
                },
            }),
            // Segment counts
            this.prisma.fanSegment.groupBy({
                by: ['label'],
                where: { creatorId },
                _count: { fanId: true },
            }),
            // Average order value
            this.prisma.order.aggregate({
                where: {
                    creatorId,
                    createdAt: { gte: days28Ago },
                },
                _avg: { amountCents: true },
            }),
            // Active subscriptions revenue
            this.prisma.subscription.aggregate({
                where: {
                    creatorId,
                    status: 'active',
                },
                _sum: { planPriceCents: true },
                _count: { id: true },
            }),
            // Content count
            this.prisma.asset.count({
                where: {
                    creatorId,
                    createdAt: { gte: days28Ago },
                },
            }),
            // Days since last post
            this.prisma.asset.findFirst({
                where: { creatorId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            }),
        ]);
        const segmentCounts = segments.reduce((acc, seg) => ({
            ...acc,
            [seg.label.toLowerCase()]: seg._count.fanId,
        }), { vip: 0, dormant: 0, churn_risk: 0, recent: 0, core: 0 });
        return {
            gmv7d: (revenue7d._sum.amountCents || 0) / 100,
            gmv28d: (revenue28d._sum.amountCents || 0) / 100,
            activeFans,
            vipCount: segmentCounts.vip,
            dormantCount: segmentCounts.dormant,
            churnRisk: segmentCounts.churn_risk,
            avgOrderValue: (avgOrder._avg.amountCents || 0) / 100,
            subscriptionRevenue: (subscriptions._sum.planPriceCents || 0) / 100,
            contentCount: content,
            lastPostDays: lastPost
                ? Math.floor((now.getTime() - lastPost.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : 999,
        };
    }
    async generateCandidateActions(creatorId, metrics) {
        const actions = [];
        // 1. Retention Pre-Expiry Campaign
        if (metrics.subscriptionRevenue > 0) {
            const expiringCount = await this.getExpiringSubscriptions(creatorId, 2);
            if (expiringCount > 0) {
                actions.push({
                    id: 'retention_pre_expiry',
                    title: 'Retention Offer for Expiring Subscribers',
                    description: `Send retention offers to ${expiringCount} subscribers expiring in 2 days`,
                    priority: 1,
                    impact: 0.7,
                    probability: 0.6,
                    confidence: 0.7,
                    effort: 0.2,
                    risk: 0.2,
                    score: 0,
                    reason: `Reduce churn for ${expiringCount} expiring subscriptions`,
                    params: {
                        discountPercent: 10,
                        windowDays: 2,
                        targetCount: expiringCount,
                    },
                    expectedRevenue: expiringCount * metrics.avgOrderValue * 0.6,
                    affectedFans: expiringCount,
                });
            }
        }
        // 2. VIP Reactivation
        if (metrics.vipCount > 0) {
            const inactiveVips = await this.getInactiveVips(creatorId, 7);
            if (inactiveVips > 0) {
                actions.push({
                    id: 'reactivate_vip',
                    title: 'Reactivate Inactive VIP Fans',
                    description: `Personalized campaign for ${inactiveVips} VIP fans inactive for 7+ days`,
                    priority: 1,
                    impact: Math.min(1, inactiveVips / 20),
                    probability: 0.55,
                    confidence: 0.65,
                    effort: 0.3,
                    risk: 0.3,
                    score: 0,
                    reason: `${inactiveVips} VIP fans with high spend potential`,
                    params: {
                        segment: 'VIP',
                        inactivityDays: 7,
                        targetCount: inactiveVips,
                    },
                    expectedRevenue: inactiveVips * metrics.avgOrderValue * 2.5 * 0.55,
                    affectedFans: inactiveVips,
                });
            }
        }
        // 3. Flash Sale on Top Content
        if (metrics.contentCount > 5 && metrics.gmv7d > 500) {
            const topAsset = await this.getTopPerformingAsset(creatorId);
            if (topAsset) {
                actions.push({
                    id: 'flash_sale_top_asset',
                    title: '48-Hour Flash Sale on Top Content',
                    description: `Limited-time discount on "${topAsset.title}"`,
                    priority: 2,
                    impact: metrics.gmv7d > 1000 ? 0.6 : 0.4,
                    probability: 0.5,
                    confidence: 0.6,
                    effort: 0.3,
                    risk: 0.3,
                    score: 0,
                    reason: 'Monetization opportunity on proven content',
                    params: {
                        assetId: topAsset.id,
                        assetTitle: topAsset.title,
                        discountPercent: 15,
                        durationHours: 48,
                    },
                    expectedRevenue: metrics.activeFans * 0.1 * (topAsset.priceCents / 100) * 0.85,
                    affectedFans: Math.floor(metrics.activeFans * 0.1),
                });
            }
        }
        // 4. Dormant Fan Reactivation
        if (metrics.dormantCount > 10) {
            actions.push({
                id: 'best_of_dormants',
                title: 'Best-Of Bundle for Dormant Fans',
                description: `Curated content bundle for ${metrics.dormantCount} dormant fans`,
                priority: 3,
                impact: Math.min(1, metrics.dormantCount / 50),
                probability: 0.4,
                confidence: 0.6,
                effort: 0.2,
                risk: 0.2,
                score: 0,
                reason: `${metrics.dormantCount} dormant fans to re-engage`,
                params: {
                    segment: 'DORMANT',
                    bundleSize: 3,
                    targetCount: metrics.dormantCount,
                },
                expectedRevenue: metrics.dormantCount * metrics.avgOrderValue * 0.4,
                affectedFans: metrics.dormantCount,
            });
        }
        // 5. Content Creation Reminder
        if (metrics.lastPostDays > 3) {
            actions.push({
                id: 'content_reminder',
                title: 'Create New Content',
                description: `It's been ${metrics.lastPostDays} days since your last post`,
                priority: 2,
                impact: 0.8,
                probability: 0.9,
                confidence: 0.9,
                effort: 0.5,
                risk: 0.1,
                score: 0,
                reason: 'Fresh content drives engagement and revenue',
                params: {
                    daysSinceLastPost: metrics.lastPostDays,
                    suggestedTypes: ['photo_set', 'video', 'live_stream'],
                },
            });
        }
        // 6. Churn Risk Campaign
        if (metrics.churnRisk > 5) {
            actions.push({
                id: 'churn_prevention',
                title: 'Churn Prevention Campaign',
                description: `Target ${metrics.churnRisk} fans at risk of churning`,
                priority: 1,
                impact: 0.6,
                probability: 0.5,
                confidence: 0.6,
                effort: 0.3,
                risk: 0.2,
                score: 0,
                reason: `Prevent loss of ${metrics.churnRisk} active fans`,
                params: {
                    segment: 'CHURN_RISK',
                    offerType: 'exclusive_content',
                    targetCount: metrics.churnRisk,
                },
                expectedRevenue: metrics.churnRisk * metrics.avgOrderValue * 0.5,
                affectedFans: metrics.churnRisk,
            });
        }
        // 7. Subscription Push
        const nonSubscribers = await this.getNonSubscribedActiveFans(creatorId);
        if (nonSubscribers > 10) {
            actions.push({
                id: 'subscription_push',
                title: 'Convert PPV Buyers to Subscribers',
                description: `Target ${nonSubscribers} active non-subscribers`,
                priority: 2,
                impact: 0.7,
                probability: 0.4,
                confidence: 0.6,
                effort: 0.3,
                risk: 0.2,
                score: 0,
                reason: 'Increase recurring revenue base',
                params: {
                    targetCount: nonSubscribers,
                    trialDays: 3,
                    discountPercent: 20,
                },
                expectedRevenue: nonSubscribers * 30 * 0.4, // Assuming $30/month subscription
                affectedFans: nonSubscribers,
            });
        }
        return actions;
    }
    calculateScore(action) {
        // Score = (Impact × Probability × Confidence) - (Effort × 0.3) - (Risk × 0.2)
        const baseScore = action.impact * action.probability * action.confidence;
        const penalties = (action.effort * 0.3) + (action.risk * 0.2);
        const score = Math.max(0, baseScore - penalties);
        // Apply priority boost
        const priorityBoost = action.priority === 1 ? 1.2 : action.priority === 2 ? 1.1 : 1.0;
        return Number((score * priorityBoost).toFixed(3));
    }
    async getExpiringSubscriptions(creatorId, days) {
        const futureDate = (0, date_fns_1.subDays)(new Date(), -days); // Add days
        const count = await this.prisma.subscription.count({
            where: {
                creatorId,
                status: 'active',
                endedAt: {
                    gte: new Date(),
                    lte: futureDate,
                },
            },
        });
        return count;
    }
    async getInactiveVips(creatorId, days) {
        const cutoffDate = (0, date_fns_1.subDays)(new Date(), days);
        const result = await this.prisma.$queryRaw `
      SELECT COUNT(DISTINCT fs.fan_id) as count
      FROM fan_segments fs
      LEFT JOIN orders o ON o.fan_id = fs.fan_id 
        AND o.creator_id = fs.creator_id
        AND o.created_at > ${cutoffDate}
      WHERE fs.creator_id = ${creatorId}::uuid
        AND fs.label = 'VIP'
        AND o.id IS NULL
    `;
        return Number(result[0]?.count || 0);
    }
    async getTopPerformingAsset(creatorId) {
        const asset = await this.prisma.$queryRaw `
      SELECT 
        a.id,
        a.title,
        a.price_cents,
        COUNT(o.id) as order_count,
        SUM(o.amount_cents) as revenue
      FROM assets a
      JOIN orders o ON o.asset_id = a.id
      WHERE a.creator_id = ${creatorId}::uuid
        AND o.created_at >= NOW() - INTERVAL '28 days'
      GROUP BY a.id, a.title, a.price_cents
      ORDER BY revenue DESC
      LIMIT 1
    `;
        return asset[0] ? {
            id: asset[0].id,
            title: asset[0].title,
            priceCents: Number(asset[0].price_cents),
            orderCount: Number(asset[0].order_count),
            revenue: Number(asset[0].revenue),
        } : null;
    }
    async getNonSubscribedActiveFans(creatorId) {
        const result = await this.prisma.$queryRaw `
      SELECT COUNT(DISTINCT f.id) as count
      FROM fans f
      LEFT JOIN subscriptions s ON s.fan_id = f.id 
        AND s.creator_id = f.creator_id
        AND s.status = 'active'
      WHERE f.creator_id = ${creatorId}::uuid
        AND s.id IS NULL
        AND EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.fan_id = f.id 
            AND o.creator_id = f.creator_id
            AND o.created_at >= NOW() - INTERVAL '28 days'
        )
    `;
        return Number(result[0]?.count || 0);
    }
    async executeAction(creatorId, actionId, params) {
        // This would integrate with campaign service to actually execute the action
        this.logger.log(`Executing NBA action ${actionId} for creator ${creatorId}`, params);
        // Track NBA execution
        await this.prisma.nbaExecution.create({
            data: {
                creatorId,
                actionId,
                params,
                status: 'pending',
            },
        });
        // Return execution ID for tracking
        return {
            actionId,
            status: 'scheduled',
            message: 'Action has been scheduled for execution',
        };
    }
};
exports.NBAService = NBAService;
exports.NBAService = NBAService = NBAService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NBAService);
//# sourceMappingURL=nba.service.js.map