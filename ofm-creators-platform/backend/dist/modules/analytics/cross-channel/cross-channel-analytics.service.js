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
var CrossChannelAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChannelAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const date_fns_1 = require("date-fns");
let CrossChannelAnalyticsService = CrossChannelAnalyticsService_1 = class CrossChannelAnalyticsService {
    prisma;
    logger = new common_1.Logger(CrossChannelAnalyticsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverviewMetrics(creatorId, range = '7d') {
        const endDate = (0, date_fns_1.endOfDay)(new Date());
        const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, range === '7d' ? 7 : 28));
        // Previous period for comparison
        const prevEndDate = (0, date_fns_1.subDays)(startDate, 1);
        const prevStartDate = (0, date_fns_1.subDays)(startDate, range === '7d' ? 7 : 28);
        // Current period metrics
        const [gmv, activeFans, engagement] = await Promise.all([
            // GMV
            this.prisma.order.aggregate({
                where: {
                    creatorId,
                    createdAt: { gte: startDate, lte: endDate },
                },
                _sum: { amountCents: true },
            }),
            // Active fans (with at least 1 action)
            this.prisma.$queryRaw `
        SELECT COUNT(DISTINCT fan_id) as count
        FROM (
          SELECT fan_id FROM orders 
          WHERE creator_id = ${creatorId}::uuid 
            AND created_at >= ${startDate} 
            AND created_at <= ${endDate}
          UNION
          SELECT fan_id FROM subscriptions 
          WHERE creator_id = ${creatorId}::uuid 
            AND status = 'active'
            AND (started_at <= ${endDate} AND (ended_at IS NULL OR ended_at >= ${startDate}))
          UNION
          SELECT fan_id FROM messages 
          WHERE creator_id = ${creatorId}::uuid 
            AND created_at >= ${startDate} 
            AND created_at <= ${endDate}
        ) active_fans
      `,
            // Engagement (messages + purchases + likes / active fans)
            this.prisma.$queryRaw `
        WITH active_fans AS (
          SELECT COUNT(DISTINCT fan_id) as fan_count
          FROM (
            SELECT fan_id FROM orders WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${startDate} AND created_at <= ${endDate}
            UNION
            SELECT fan_id FROM subscriptions WHERE creator_id = ${creatorId}::uuid 
              AND status = 'active'
          ) af
        ),
        actions AS (
          SELECT COUNT(*) as action_count
          FROM (
            SELECT id FROM messages WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${startDate} AND created_at <= ${endDate}
            UNION ALL
            SELECT id FROM orders WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${startDate} AND created_at <= ${endDate}
            UNION ALL
            SELECT id FROM likes WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${startDate} AND created_at <= ${endDate}
          ) a
        )
        SELECT 
          CASE 
            WHEN (SELECT fan_count FROM active_fans) > 0 
            THEN (SELECT action_count FROM actions)::float / (SELECT fan_count FROM active_fans)
            ELSE 0
          END as engagement
      `,
        ]);
        // Previous period metrics for comparison
        const [prevGmv, prevActiveFans, prevEngagement] = await Promise.all([
            // Previous GMV
            this.prisma.order.aggregate({
                where: {
                    creatorId,
                    createdAt: { gte: prevStartDate, lte: prevEndDate },
                },
                _sum: { amountCents: true },
            }),
            // Previous active fans
            this.prisma.$queryRaw `
        SELECT COUNT(DISTINCT fan_id) as count
        FROM (
          SELECT fan_id FROM orders 
          WHERE creator_id = ${creatorId}::uuid 
            AND created_at >= ${prevStartDate} 
            AND created_at <= ${prevEndDate}
          UNION
          SELECT fan_id FROM subscriptions 
          WHERE creator_id = ${creatorId}::uuid 
            AND status = 'active'
            AND (started_at <= ${prevEndDate} AND (ended_at IS NULL OR ended_at >= ${prevStartDate}))
        ) active_fans
      `,
            // Previous engagement
            this.prisma.$queryRaw `
        WITH active_fans AS (
          SELECT COUNT(DISTINCT fan_id) as fan_count
          FROM (
            SELECT fan_id FROM orders WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${prevStartDate} AND created_at <= ${prevEndDate}
            UNION
            SELECT fan_id FROM subscriptions WHERE creator_id = ${creatorId}::uuid 
              AND status = 'active'
          ) af
        ),
        actions AS (
          SELECT COUNT(*) as action_count
          FROM (
            SELECT id FROM messages WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${prevStartDate} AND created_at <= ${prevEndDate}
            UNION ALL
            SELECT id FROM orders WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${prevStartDate} AND created_at <= ${prevEndDate}
            UNION ALL
            SELECT id FROM likes WHERE creator_id = ${creatorId}::uuid 
              AND created_at >= ${prevStartDate} AND created_at <= ${prevEndDate}
          ) a
        )
        SELECT 
          CASE 
            WHEN (SELECT fan_count FROM active_fans) > 0 
            THEN (SELECT action_count FROM actions)::float / (SELECT fan_count FROM active_fans)
            ELSE 0
          END as engagement
      `,
        ]);
        const gmvCents = Number(gmv._sum.amountCents || 0);
        const netRevenue = gmvCents * 0.8; // 80% after platform fees
        const activeFansCount = Number(activeFans[0]?.count || 0);
        const engagementRate = engagement[0]?.engagement || 0;
        const prevGmvCents = Number(prevGmv._sum.amountCents || 0);
        const prevNetRevenue = prevGmvCents * 0.8;
        const prevActiveFansCount = Number(prevActiveFans[0]?.count || 0);
        const prevEngagementRate = prevEngagement[0]?.engagement || 0;
        return {
            gmv: gmvCents / 100,
            netRevenue: netRevenue / 100,
            activeFans: activeFansCount,
            engagement: engagementRate,
            period: range,
            comparison: {
                gmv: prevGmvCents / 100,
                netRevenue: prevNetRevenue / 100,
                activeFans: prevActiveFansCount,
                engagement: prevEngagementRate,
            },
        };
    }
    async getCampaignMetrics(creatorId, range = '7d') {
        const endDate = (0, date_fns_1.endOfDay)(new Date());
        const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, range === '7d' ? 7 : 28));
        // Get campaigns with metrics
        const campaigns = await this.prisma.$queryRaw `
      WITH campaign_metrics AS (
        SELECT 
          c.id,
          c.channel,
          c.cost_cents,
          COUNT(DISTINCT ce.fan_id) FILTER (WHERE ce.event_type = 'sent') as sent,
          COUNT(DISTINCT ce.fan_id) FILTER (WHERE ce.event_type = 'open') as opened,
          COUNT(DISTINCT ce.fan_id) FILTER (WHERE ce.event_type = 'click') as clicked,
          COUNT(DISTINCT a.order_id) as conversions,
          COALESCE(SUM(o.amount_cents), 0) as revenue_cents
        FROM campaigns c
        LEFT JOIN campaign_events ce ON ce.campaign_id = c.id
        LEFT JOIN clicks cl ON cl.campaign_id = c.id
        LEFT JOIN attributions a ON a.click_id = cl.id
        LEFT JOIN orders o ON o.id = a.order_id
        WHERE c.creator_id = ${creatorId}::uuid
          AND c.sent_at >= ${startDate}
          AND c.sent_at <= ${endDate}
        GROUP BY c.id, c.channel, c.cost_cents
      )
      SELECT 
        id,
        channel,
        sent,
        CASE WHEN sent > 0 THEN opened::float / sent ELSE 0 END as open_rate,
        CASE WHEN sent > 0 THEN clicked::float / sent ELSE 0 END as click_rate,
        CASE WHEN clicked > 0 THEN conversions::float / clicked ELSE 0 END as conv_rate,
        revenue_cents,
        cost_cents,
        CASE WHEN cost_cents > 0 THEN revenue_cents::float / cost_cents ELSE NULL END as roas
      FROM campaign_metrics
      ORDER BY revenue_cents DESC
    `;
        // Calculate totals
        const totals = campaigns.reduce((acc, campaign) => ({
            sent: acc.sent + Number(campaign.sent),
            revenue: acc.revenue + Number(campaign.revenue_cents),
            cost: acc.cost + Number(campaign.cost_cents || 0),
        }), { sent: 0, revenue: 0, cost: 0 });
        return {
            campaigns: campaigns.map(c => ({
                id: c.id,
                channel: c.channel,
                sent: Number(c.sent),
                openRate: Number(c.open_rate),
                clickRate: Number(c.click_rate),
                convRate: Number(c.conv_rate),
                revenue: Number(c.revenue_cents) / 100,
                cost: Number(c.cost_cents || 0) / 100,
                roas: c.roas ? Number(c.roas) : undefined,
            })),
            totals: {
                sent: totals.sent,
                revenue: totals.revenue / 100,
                cost: totals.cost / 100,
                avgRoas: totals.cost > 0 ? totals.revenue / totals.cost : 0,
            },
        };
    }
    async getSocialMetrics(creatorId, range = '7d') {
        const endDate = (0, date_fns_1.endOfDay)(new Date());
        const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(endDate, range === '7d' ? 7 : 28));
        // Get platform metrics
        const platformMetrics = await this.prisma.$queryRaw `
      SELECT 
        sm.platform,
        MAX(sm.followers) as followers,
        SUM(sm.impressions) as impressions,
        SUM(sm.link_clicks) as link_clicks,
        COALESCE(SUM(o.amount_cents), 0) as revenue_cents
      FROM social_metrics sm
      LEFT JOIN clicks c ON c.utm_source = sm.platform::text
        AND c.creator_id = sm.creator_id
        AND c.ts >= ${startDate}
        AND c.ts <= ${endDate}
      LEFT JOIN attributions a ON a.click_id = c.id
      LEFT JOIN orders o ON o.id = a.order_id
      WHERE sm.creator_id = ${creatorId}::uuid
        AND sm.date >= ${startDate}::date
        AND sm.date <= ${endDate}::date
      GROUP BY sm.platform
    `;
        // Get time series data
        const timeSeries = await this.prisma.$queryRaw `
      SELECT 
        date,
        SUM(followers) as followers,
        SUM(impressions) as impressions,
        SUM(link_clicks) as link_clicks
      FROM social_metrics
      WHERE creator_id = ${creatorId}::uuid
        AND date >= ${startDate}::date
        AND date <= ${endDate}::date
      GROUP BY date
      ORDER BY date
    `;
        return {
            platforms: platformMetrics.map(p => ({
                platform: p.platform,
                followers: Number(p.followers),
                impressions: Number(p.impressions),
                linkClicks: Number(p.link_clicks),
                revenue: Number(p.revenue_cents) / 100,
            })),
            timeSeries: timeSeries.map(t => ({
                date: t.date.toISOString().split('T')[0],
                followers: Number(t.followers),
                impressions: Number(t.impressions),
                linkClicks: Number(t.link_clicks),
            })),
        };
    }
    async getCRMSegments(creatorId) {
        // Get segment data
        const segments = await this.prisma.$queryRaw `
      WITH segment_metrics AS (
        SELECT 
          fs.label,
          COUNT(DISTINCT fs.fan_id) as fan_count,
          COALESCE(SUM(o.amount_cents), 0) as revenue_cents,
          COUNT(DISTINCT o.id) as order_count
        FROM fan_segments fs
        LEFT JOIN orders o ON o.fan_id = fs.fan_id 
          AND o.creator_id = fs.creator_id
          AND o.created_at >= NOW() - INTERVAL '28 days'
        WHERE fs.creator_id = ${creatorId}::uuid
        GROUP BY fs.label
      )
      SELECT 
        label,
        fan_count as fans,
        CASE WHEN fan_count > 0 
          THEN revenue_cents::float / fan_count / 100 
          ELSE 0 
        END as arpu,
        CASE WHEN fan_count > 0 
          THEN order_count::float / fan_count 
          ELSE 0 
        END as propension
      FROM segment_metrics
      ORDER BY 
        CASE label
          WHEN 'VIP' THEN 1
          WHEN 'RECENT' THEN 2
          WHEN 'CORE' THEN 3
          WHEN 'DORMANT' THEN 4
          WHEN 'CHURN_RISK' THEN 5
        END
    `;
        const totals = segments.reduce((acc, seg) => ({
            fans: acc.fans + Number(seg.fans),
            revenue: acc.revenue + Number(seg.fans) * Number(seg.arpu),
        }), { fans: 0, revenue: 0 });
        return {
            segments: segments.map(s => ({
                label: s.label,
                fans: Number(s.fans),
                arpu: Number(s.arpu),
                propension: Number(s.propension),
            })),
            totalFans: totals.fans,
            totalRevenue: totals.revenue,
        };
    }
    async updateFanSegments(creatorId) {
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
          -- Frequency score (order count)
          CASE 
            WHEN COUNT(o.id) >= 20 THEN 5
            WHEN COUNT(o.id) >= 10 THEN 4
            WHEN COUNT(o.id) >= 5 THEN 3
            WHEN COUNT(o.id) >= 2 THEN 2
            ELSE 1
          END as f_score,
          -- Monetary score (total spend)
          CASE 
            WHEN SUM(o.amount_cents) >= 100000 THEN 5  -- $1000+
            WHEN SUM(o.amount_cents) >= 50000 THEN 4   -- $500+
            WHEN SUM(o.amount_cents) >= 20000 THEN 3   -- $200+
            WHEN SUM(o.amount_cents) >= 5000 THEN 2    -- $50+
            ELSE 1
          END as m_score
        FROM fans f
        LEFT JOIN orders o ON o.fan_id = f.id
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
            WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'VIP'
            WHEN r_score >= 4 THEN 'RECENT'
            WHEN r_score <= 2 AND f_score >= 3 THEN 'CHURN_RISK'
            WHEN r_score <= 2 THEN 'DORMANT'
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
    `;
    }
};
exports.CrossChannelAnalyticsService = CrossChannelAnalyticsService;
exports.CrossChannelAnalyticsService = CrossChannelAnalyticsService = CrossChannelAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrossChannelAnalyticsService);
//# sourceMappingURL=cross-channel-analytics.service.js.map