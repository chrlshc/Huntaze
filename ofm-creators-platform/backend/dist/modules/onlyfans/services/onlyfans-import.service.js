"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OnlyFansImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyFansImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const off_platform_service_1 = require("@modules/ledger/services/off-platform.service");
const csv_import_dto_1 = require("../dto/csv-import.dto");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let OnlyFansImportService = OnlyFansImportService_1 = class OnlyFansImportService {
    prisma;
    offPlatformService;
    logger = new common_1.Logger(OnlyFansImportService_1.name);
    constructor(prisma, offPlatformService) {
        this.prisma = prisma;
        this.offPlatformService = offPlatformService;
    }
    async importCSV(dto) {
        // Verify source exists and is OnlyFans
        const source = await this.prisma.externalEarningsSource.findUnique({
            where: { id: dto.sourceId }
        });
        if (!source || source.platform !== client_1.ExternalPlatform.OF) {
            throw new common_1.BadRequestException('Invalid OnlyFans source');
        }
        switch (dto.type) {
            case csv_import_dto_1.OnlyFansCSVType.SUBSCRIBERS:
                return this.importSubscribers(source, dto.rows);
            case csv_import_dto_1.OnlyFansCSVType.REVENUE:
                return this.importRevenue(source, dto.rows, dto.periodStart, dto.periodEnd);
            case csv_import_dto_1.OnlyFansCSVType.CONTENT:
                return this.importContent(source, dto.rows);
            default:
                throw new common_1.BadRequestException('Invalid CSV type');
        }
    }
    async importSubscribers(source, rows) {
        const result = {
            type: csv_import_dto_1.OnlyFansCSVType.SUBSCRIBERS,
            totalRows: rows.length,
            processedRows: 0,
            skippedRows: 0,
            errors: [],
            subscribersImported: 0,
            engagementScoresUpdated: 0,
            tiersAssigned: {
                VIP: 0,
                PREMIUM: 0,
                ACTIVE: 0,
                BASIC: 0
            }
        };
        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                // Create or update Fan
                const fan = await this.prisma.fan.upsert({
                    where: {
                        username: `of_${row.username}`
                    },
                    create: {
                        username: `of_${row.username}`,
                        displayName: row.name || row.username,
                        email: row.email || `${row.username}@of.huntaze`,
                        metadata: {
                            platform: 'onlyfans',
                            originalUsername: row.username,
                            importedAt: new Date()
                        }
                    },
                    update: {
                        displayName: row.name || row.username,
                        updatedAt: new Date()
                    }
                });
                // Create or update FanRelation
                const fanRelation = await this.prisma.fanRelation.upsert({
                    where: {
                        creatorId_fanId: {
                            creatorId: source.creatorId,
                            fanId: fan.id
                        }
                    },
                    create: {
                        creatorId: source.creatorId,
                        fanId: fan.id,
                        lifetimeValue: parseFloat(row.total_spent) * 100, // Convert to cents
                        lastInteraction: new Date(row.last_active),
                        tags: ['onlyfans', row.status],
                        notes: `Imported from OnlyFans CSV`
                    },
                    update: {
                        lifetimeValue: parseFloat(row.total_spent) * 100,
                        lastInteraction: new Date(row.last_active),
                        updatedAt: new Date()
                    }
                });
                // Calculate engagement score
                const engagementScore = await this.calculateEngagementScore(fan.id, source.creatorId, row);
                // Update engagement score and tier
                const tier = this.getTierFromScore(engagementScore.score);
                await this.prisma.fanRelation.update({
                    where: { id: fanRelation.id },
                    data: {
                        engagementScore: engagementScore.score,
                        tags: {
                            set: [...fanRelation.tags.filter(t => !['VIP', 'PREMIUM', 'ACTIVE', 'BASIC'].includes(t)), tier]
                        }
                    }
                });
                result.subscribersImported++;
                result.engagementScoresUpdated++;
                result.tiersAssigned[tier]++;
                result.processedRows++;
            }
            catch (error) {
                result.errors.push({
                    row: i + 1,
                    message: error.message,
                    data: rows[i]
                });
                result.skippedRows++;
            }
        }
        return result;
    }
    async importRevenue(source, rows, periodStart, periodEnd) {
        const result = {
            type: csv_import_dto_1.OnlyFansCSVType.REVENUE,
            totalRows: rows.length,
            processedRows: 0,
            skippedRows: 0,
            errors: [],
            revenueImported: {
                transactions: 0,
                totalGross: 0,
                totalNet: 0
            }
        };
        // Group by date for batch processing
        const revenueByDate = new Map();
        for (const row of rows) {
            const date = row.date.split('T')[0]; // Extract YYYY-MM-DD
            if (!revenueByDate.has(date)) {
                revenueByDate.set(date, []);
            }
            revenueByDate.get(date).push(row);
        }
        // Process each date batch
        for (const [date, dateRows] of revenueByDate) {
            try {
                // Calculate hash for idempotency
                const rawData = JSON.stringify(dateRows);
                const hash = crypto.createHash('sha256').update(rawData).digest('hex');
                // Check if already imported
                const existing = await this.prisma.externalEarningsImport.findUnique({
                    where: {
                        sourceId_periodStart_periodEnd_rawHash: {
                            sourceId: source.id,
                            periodStart: new Date(date),
                            periodEnd: new Date(date),
                            rawHash: hash
                        }
                    }
                });
                if (existing) {
                    result.skippedRows += dateRows.length;
                    continue;
                }
                // Create import record
                const importRecord = await this.prisma.externalEarningsImport.create({
                    data: {
                        sourceId: source.id,
                        periodStart: new Date(date),
                        periodEnd: new Date(date),
                        rawHash: hash,
                        rawJson: { rows: dateRows },
                        processedAt: new Date()
                    }
                });
                // Process each revenue row
                for (const row of dateRows) {
                    try {
                        const grossCents = Math.round(parseFloat(row.gross_amount) * 100);
                        const feesCents = Math.round(parseFloat(row.platform_fee) * 100);
                        const netCents = Math.round(parseFloat(row.net_amount) * 100);
                        // Create normalized earning
                        await this.prisma.normalizedEarning.create({
                            data: {
                                sourceId: source.id,
                                occurredAt: new Date(row.date),
                                currency: row.currency,
                                grossCents: BigInt(grossCents),
                                feesCents: BigInt(feesCents),
                                netCents: BigInt(netCents),
                                extRef: row.message_id || row.post_id || row.stream_id,
                                metadata: {
                                    type: row.type,
                                    username: row.username,
                                    description: row.description,
                                    status: row.status
                                }
                            }
                        });
                        result.revenueImported.transactions++;
                        result.revenueImported.totalGross += grossCents;
                        result.revenueImported.totalNet += netCents;
                        result.processedRows++;
                    }
                    catch (error) {
                        result.errors.push({
                            row: result.processedRows + result.skippedRows + 1,
                            message: error.message,
                            data: row
                        });
                    }
                }
            }
            catch (error) {
                result.errors.push({
                    row: -1,
                    message: `Failed to process date ${date}: ${error.message}`,
                    data: { date, count: dateRows.length }
                });
                result.skippedRows += dateRows.length;
            }
        }
        // Trigger commission calculation for the period
        if (result.revenueImported.transactions > 0) {
            await this.offPlatformService.processNormalizedEarnings(source.creatorId);
        }
        return result;
    }
    async importContent(source, rows) {
        const result = {
            type: csv_import_dto_1.OnlyFansCSVType.CONTENT,
            totalRows: rows.length,
            processedRows: 0,
            skippedRows: 0,
            errors: [],
            contentImported: 0
        };
        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];
                // Store content metadata for analytics
                await this.prisma.$executeRaw `
          INSERT INTO analytics_content_performance (
            creator_id,
            platform,
            content_id,
            content_type,
            created_at,
            visibility,
            price_cents,
            likes,
            comments,
            revenue_cents,
            metadata
          ) VALUES (
            ${source.creatorId},
            'onlyfans',
            ${row.post_id},
            ${row.type},
            ${new Date(row.created_at)},
            ${row.visibility},
            ${row.price ? Math.round(parseFloat(row.price) * 100) : null},
            ${parseInt(row.likes)},
            ${parseInt(row.comments)},
            ${Math.round(parseFloat(row.total_revenue) * 100)},
            ${JSON.stringify({
                    tips: parseInt(row.tips),
                    ppvPurchases: parseInt(row.ppv_purchases)
                })}::jsonb
          )
          ON CONFLICT (creator_id, platform, content_id) 
          DO UPDATE SET
            likes = EXCLUDED.likes,
            comments = EXCLUDED.comments,
            revenue_cents = EXCLUDED.revenue_cents,
            updated_at = NOW()
        `;
                result.contentImported++;
                result.processedRows++;
            }
            catch (error) {
                result.errors.push({
                    row: i + 1,
                    message: error.message,
                    data: rows[i]
                });
                result.skippedRows++;
            }
        }
        return result;
    }
    async calculateEngagementScore(fanId, creatorId, subscriberData) {
        // Recency Score (0-30 points)
        const lastActive = new Date(subscriberData.last_active);
        const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        const recencyScore = Math.max(0, 30 - Math.floor(daysSinceActive / 3));
        // Frequency Score (0-25 points)
        const messagesSent = parseInt(subscriberData.messages_sent) || 0;
        const monthsSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(subscriberData.join_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const messagesPerMonth = messagesSent / monthsSinceJoin;
        const frequencyScore = Math.min(25, Math.floor(messagesPerMonth * 2.5));
        // Monetary Score (0-25 points)
        const totalSpent = parseFloat(subscriberData.total_spent) || 0;
        const monetaryScore = Math.min(25, Math.floor(totalSpent / 20)); // $20 = 1 point
        // Interaction Score (0-20 points)
        const tipsSent = parseInt(subscriberData.tips_sent) || 0;
        const ppvPurchased = parseInt(subscriberData.ppv_purchased) || 0;
        const interactions = tipsSent + ppvPurchased;
        const interactionScore = Math.min(20, Math.floor(interactions * 2));
        const totalScore = recencyScore + frequencyScore + monetaryScore + interactionScore;
        return {
            score: totalScore,
            components: {
                recency: recencyScore,
                frequency: frequencyScore,
                monetary: monetaryScore,
                interaction: interactionScore
            }
        };
    }
    getTierFromScore(score) {
        if (score >= 80)
            return 'VIP';
        if (score >= 60)
            return 'PREMIUM';
        if (score >= 40)
            return 'ACTIVE';
        return 'BASIC';
    }
    async getEngagementAnalytics(creatorId) {
        const fanRelations = await this.prisma.fanRelation.findMany({
            where: { creatorId },
            include: { fan: true }
        });
        const tiers = {
            VIP: fanRelations.filter(f => f.tags.includes('VIP')),
            PREMIUM: fanRelations.filter(f => f.tags.includes('PREMIUM')),
            ACTIVE: fanRelations.filter(f => f.tags.includes('ACTIVE')),
            BASIC: fanRelations.filter(f => f.tags.includes('BASIC'))
        };
        const avgEngagement = fanRelations.reduce((sum, f) => sum + f.engagementScore, 0) / fanRelations.length;
        const totalLifetimeValue = fanRelations.reduce((sum, f) => sum + Number(f.lifetimeValue), 0);
        return {
            totalFans: fanRelations.length,
            averageEngagementScore: Math.round(avgEngagement),
            totalLifetimeValue: totalLifetimeValue / 100, // Convert to dollars
            tierDistribution: {
                VIP: { count: tiers.VIP.length, percentage: (tiers.VIP.length / fanRelations.length * 100).toFixed(1) },
                PREMIUM: { count: tiers.PREMIUM.length, percentage: (tiers.PREMIUM.length / fanRelations.length * 100).toFixed(1) },
                ACTIVE: { count: tiers.ACTIVE.length, percentage: (tiers.ACTIVE.length / fanRelations.length * 100).toFixed(1) },
                BASIC: { count: tiers.BASIC.length, percentage: (tiers.BASIC.length / fanRelations.length * 100).toFixed(1) }
            },
            topFans: tiers.VIP.slice(0, 10).map(f => ({
                username: f.fan.username,
                score: f.engagementScore,
                lifetimeValue: Number(f.lifetimeValue) / 100,
                lastInteraction: f.lastInteraction
            }))
        };
    }
};
exports.OnlyFansImportService = OnlyFansImportService;
exports.OnlyFansImportService = OnlyFansImportService = OnlyFansImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        off_platform_service_1.OffPlatformService])
], OnlyFansImportService);
//# sourceMappingURL=onlyfans-import.service.js.map