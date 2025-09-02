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
var AttributionWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributionWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const date_fns_1 = require("date-fns");
let AttributionWorker = AttributionWorker_1 = class AttributionWorker {
    prisma;
    logger = new common_1.Logger(AttributionWorker_1.name);
    // Attribution windows by order type
    attributionWindows = [
        { orderType: 'ppv', windowHours: 24 },
        { orderType: 'tip', windowHours: 24 },
        { orderType: 'subscription', windowHours: 168 }, // 7 days
        { orderType: 'bundle', windowHours: 72 }, // 3 days
    ];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processAttributions() {
        this.logger.debug('Starting attribution processing');
        try {
            // Get unattributed orders from the last 7 days
            const cutoffDate = (0, date_fns_1.subHours)(new Date(), 168); // 7 days
            const unattributedOrders = await this.prisma.order.findMany({
                where: {
                    createdAt: { gte: cutoffDate },
                    fanId: { not: null },
                    attribution: null,
                },
                include: {
                    fan: true,
                },
                take: 100, // Process in batches
            });
            this.logger.log(`Found ${unattributedOrders.length} unattributed orders to process`);
            for (const order of unattributedOrders) {
                await this.attributeOrder(order);
            }
            // Update fan segments periodically
            await this.updateFanSegments();
        }
        catch (error) {
            this.logger.error('Attribution processing failed', error);
        }
    }
    async attributeOrder(order) {
        const window = this.attributionWindows.find(w => w.orderType === order.orderKind);
        if (!window) {
            this.logger.warn(`No attribution window defined for order type: ${order.orderKind}`);
            return;
        }
        // Find clicks within attribution window
        const windowStart = (0, date_fns_1.subHours)(order.createdAt, window.windowHours);
        const eligibleClicks = await this.prisma.click.findMany({
            where: {
                fanId: order.fanId,
                creatorId: order.creatorId,
                timestamp: {
                    gte: windowStart,
                    lte: order.createdAt,
                },
            },
            orderBy: {
                timestamp: 'desc', // Last click attribution
            },
            take: 1,
        });
        if (eligibleClicks.length === 0) {
            return; // No clicks to attribute
        }
        const attributedClick = eligibleClicks[0];
        try {
            await this.prisma.attribution.create({
                data: {
                    creatorId: order.creatorId,
                    clickId: attributedClick.id,
                    orderId: order.id,
                    rule: 'last_click',
                    windowSeconds: window.windowHours * 3600,
                },
            });
            this.logger.debug(`Attributed order ${order.id} to click ${attributedClick.id}`);
        }
        catch (error) {
            // Handle unique constraint violation (already attributed)
            if (error.code === 'P2002') {
                return;
            }
            throw error;
        }
    }
    async updateFanSegments() {
        this.logger.debug('Updating fan segments');
        try {
            // Get all creators with recent activity
            const activeCreators = await this.prisma.creator.findMany({
                where: {
                    orders: {
                        some: {
                            createdAt: {
                                gte: (0, date_fns_1.subHours)(new Date(), 24),
                            },
                        },
                    },
                },
                select: { id: true },
            });
            for (const creator of activeCreators) {
                await this.updateCreatorSegments(creator.id);
            }
            this.logger.log(`Updated segments for ${activeCreators.length} creators`);
        }
        catch (error) {
            this.logger.error('Fan segment update failed', error);
        }
    }
    async updateCreatorSegments(creatorId) {
        // Calculate RFM scores and update segments
        await this.prisma.$executeRaw `
      WITH rfm_scores AS (
        SELECT 
          f.id as fan_id,
          f.creator_id,
          -- Recency score (days since last order)
          CASE 
            WHEN MAX(o.created_at) >= NOW() - INTERVAL '7 days' THEN 5
            WHEN MAX(o.created_at) >= NOW() - INTERVAL '14 days' THEN 4
            WHEN MAX(o.created_at) >= NOW() - INTERVAL '30 days' THEN 3
            WHEN MAX(o.created_at) >= NOW() - INTERVAL '60 days' THEN 2
            ELSE 1
          END as r_score,
          -- Frequency score (order count in last 90 days)
          CASE 
            WHEN COUNT(o.id) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 20 THEN 5
            WHEN COUNT(o.id) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 10 THEN 4
            WHEN COUNT(o.id) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 5 THEN 3
            WHEN COUNT(o.id) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 2 THEN 2
            ELSE 1
          END as f_score,
          -- Monetary score (total spend in last 90 days)
          CASE 
            WHEN SUM(o.amount_cents) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 100000 THEN 5
            WHEN SUM(o.amount_cents) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 50000 THEN 4
            WHEN SUM(o.amount_cents) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 20000 THEN 3
            WHEN SUM(o.amount_cents) FILTER (WHERE o.created_at >= NOW() - INTERVAL '90 days') >= 5000 THEN 2
            ELSE 1
          END as m_score,
          MAX(o.created_at) as last_order_date,
          COUNT(o.id) as total_orders,
          SUM(o.amount_cents) as total_spent
        FROM fans f
        LEFT JOIN orders o ON o.fan_id = f.id AND o.creator_id = f.creator_id
        WHERE f.creator_id = ${creatorId}::uuid
        GROUP BY f.id, f.creator_id
      ),
      segments AS (
        SELECT 
          fan_id,
          creator_id,
          r_score,
          f_score,
          m_score,
          CASE
            -- VIP: High value, frequent, recent
            WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'VIP'
            -- Recent: New or recently active
            WHEN r_score >= 4 AND total_orders <= 3 THEN 'RECENT'
            -- Churn Risk: Was active but declining
            WHEN r_score <= 2 AND f_score >= 3 AND last_order_date >= NOW() - INTERVAL '90 days' THEN 'CHURN_RISK'
            -- Dormant: Inactive for a while
            WHEN r_score <= 2 OR last_order_date < NOW() - INTERVAL '60 days' THEN 'DORMANT'
            -- Core: Everyone else
            ELSE 'CORE'
          END::segment_label as label
        FROM rfm_scores
      )
      INSERT INTO fan_segments (fan_id, creator_id, label, r_score, f_score, m_score, updated_at)
      SELECT fan_id, creator_id, label, r_score, f_score, m_score, NOW()
      FROM segments
      ON CONFLICT (fan_id) 
      DO UPDATE SET 
        label = EXCLUDED.label,
        r_score = EXCLUDED.r_score,
        f_score = EXCLUDED.f_score,
        m_score = EXCLUDED.m_score,
        updated_at = NOW()
      WHERE fan_segments.label != EXCLUDED.label
         OR fan_segments.r_score != EXCLUDED.r_score
         OR fan_segments.f_score != EXCLUDED.f_score
         OR fan_segments.m_score != EXCLUDED.m_score
    `;
    }
    async cleanupOldData() {
        this.logger.debug('Starting cleanup of old attribution data');
        try {
            // Clean up clicks older than 90 days
            const deletedClicks = await this.prisma.click.deleteMany({
                where: {
                    timestamp: {
                        lt: (0, date_fns_1.subHours)(new Date(), 2160), // 90 days
                    },
                },
            });
            // Clean up campaign events older than 90 days
            const deletedEvents = await this.prisma.campaignEvent.deleteMany({
                where: {
                    timestamp: {
                        lt: (0, date_fns_1.subHours)(new Date(), 2160), // 90 days
                    },
                },
            });
            this.logger.log(`Cleaned up ${deletedClicks.count} old clicks and ${deletedEvents.count} old campaign events`);
        }
        catch (error) {
            this.logger.error('Cleanup failed', error);
        }
    }
};
exports.AttributionWorker = AttributionWorker;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttributionWorker.prototype, "processAttributions", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttributionWorker.prototype, "updateFanSegments", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttributionWorker.prototype, "cleanupOldData", null);
exports.AttributionWorker = AttributionWorker = AttributionWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttributionWorker);
//# sourceMappingURL=attribution.worker.js.map