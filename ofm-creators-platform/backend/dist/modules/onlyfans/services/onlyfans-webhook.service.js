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
var OnlyFansWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyFansWebhookService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
let OnlyFansWebhookService = OnlyFansWebhookService_1 = class OnlyFansWebhookService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(OnlyFansWebhookService_1.name);
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Process webhook event from OnlyFans (when available via API)
     */
    async processWebhook(event) {
        this.logger.log(`Processing OnlyFans webhook: ${event.type}`);
        const source = await this.prisma.externalEarningsSource.findFirst({
            where: {
                platform: 'OF',
                externalHandle: event.creatorHandle,
                active: true
            }
        });
        if (!source) {
            this.logger.warn(`No active source found for handle: ${event.creatorHandle}`);
            return;
        }
        switch (event.type) {
            case 'fan.subscribed':
                await this.handleFanSubscribed(source, event.data);
                break;
            case 'fan.renewed':
                await this.handleFanRenewed(source, event.data);
                break;
            case 'payment.tip':
            case 'payment.ppv':
                await this.handlePayment(source, event);
                break;
            case 'message.sent':
                await this.updateEngagementMetrics(source, event.data.fanUsername, 'message');
                break;
            case 'content.liked':
                await this.updateEngagementMetrics(source, event.data.fanUsername, 'like');
                break;
        }
        // Update last sync timestamp
        await this.prisma.externalEarningsSource.update({
            where: { id: source.id },
            data: { lastSync: new Date() }
        });
    }
    async handleFanSubscribed(source, data) {
        // Create or update fan
        const fan = await this.prisma.fan.upsert({
            where: { username: `of_${data.username}` },
            create: {
                username: `of_${data.username}`,
                displayName: data.displayName || data.username,
                email: `${data.username}@of.huntaze`,
                metadata: {
                    platform: 'onlyfans',
                    subscribedAt: new Date()
                }
            },
            update: {}
        });
        // Create fan relation
        await this.prisma.fanRelation.upsert({
            where: {
                creatorId_fanId: {
                    creatorId: source.creatorId,
                    fanId: fan.id
                }
            },
            create: {
                creatorId: source.creatorId,
                fanId: fan.id,
                tags: ['onlyfans', 'subscriber', 'active'],
                lastInteraction: new Date()
            },
            update: {
                tags: ['onlyfans', 'subscriber', 'active'],
                lastInteraction: new Date()
            }
        });
        // Emit event for automations
        this.eventEmitter.emit('fan.subscribed', {
            creatorId: source.creatorId,
            fanId: fan.id,
            platform: 'onlyfans',
            data
        });
    }
    async handleFanRenewed(source, data) {
        const fan = await this.prisma.fan.findUnique({
            where: { username: `of_${data.username}` }
        });
        if (fan) {
            // Update renewal count
            await this.prisma.fanRelation.update({
                where: {
                    creatorId_fanId: {
                        creatorId: source.creatorId,
                        fanId: fan.id
                    }
                },
                data: {
                    metadata: {
                        renewalCount: data.renewalCount || 1,
                        lastRenewal: new Date()
                    }
                }
            });
            // Emit event
            this.eventEmitter.emit('subscription.renewed', {
                creatorId: source.creatorId,
                fanId: fan.id,
                platform: 'onlyfans',
                data
            });
        }
    }
    async handlePayment(source, event) {
        const fan = await this.prisma.fan.findUnique({
            where: { username: `of_${event.data.fanUsername}` }
        });
        if (!fan)
            return;
        // Create normalized earning
        const grossCents = Math.round(event.data.amount * 100);
        const feesCents = Math.round(event.data.platformFee * 100);
        const netCents = grossCents - feesCents;
        await this.prisma.normalizedEarning.create({
            data: {
                sourceId: source.id,
                occurredAt: event.timestamp,
                currency: event.data.currency || 'USD',
                grossCents: BigInt(grossCents),
                feesCents: BigInt(feesCents),
                netCents: BigInt(netCents),
                extRef: event.data.transactionId,
                metadata: {
                    type: event.type.split('.')[1], // 'tip' or 'ppv'
                    fanUsername: event.data.fanUsername,
                    message: event.data.message
                }
            }
        });
        // Update fan lifetime value
        const fanRelation = await this.prisma.fanRelation.findUnique({
            where: {
                creatorId_fanId: {
                    creatorId: source.creatorId,
                    fanId: fan.id
                }
            }
        });
        if (fanRelation) {
            await this.prisma.fanRelation.update({
                where: { id: fanRelation.id },
                data: {
                    lifetimeValue: fanRelation.lifetimeValue + BigInt(netCents),
                    lastInteraction: new Date()
                }
            });
        }
    }
    async updateEngagementMetrics(source, fanUsername, action) {
        const fan = await this.prisma.fan.findUnique({
            where: { username: `of_${fanUsername}` }
        });
        if (!fan)
            return;
        const fanRelation = await this.prisma.fanRelation.findUnique({
            where: {
                creatorId_fanId: {
                    creatorId: source.creatorId,
                    fanId: fan.id
                }
            }
        });
        if (fanRelation) {
            // Update interaction metrics
            const metrics = fanRelation.metadata || {};
            const interactions = metrics.interactions || {};
            interactions[action] = (interactions[action] || 0) + 1;
            interactions.lastAction = action;
            interactions.lastActionAt = new Date();
            await this.prisma.fanRelation.update({
                where: { id: fanRelation.id },
                data: {
                    lastInteraction: new Date(),
                    metadata: {
                        ...metrics,
                        interactions
                    }
                }
            });
            // Recalculate engagement score if needed
            if (interactions.total % 10 === 0) {
                await this.recalculateEngagementScore(fanRelation.id);
            }
        }
    }
    async recalculateEngagementScore(fanRelationId) {
        // This would recalculate based on recent activity
        // Implementation depends on scoring algorithm
        this.logger.debug(`Recalculating engagement score for relation ${fanRelationId}`);
    }
    /**
     * Scheduled job to sync OnlyFans data (when API is available)
     */
    async syncOnlyFansData() {
        this.logger.log('Starting OnlyFans sync job');
        const activeSources = await this.prisma.externalEarningsSource.findMany({
            where: {
                platform: 'OF',
                active: true
            }
        });
        for (const source of activeSources) {
            try {
                // When OnlyFans API is available, implement sync here
                this.logger.log(`Syncing data for ${source.externalHandle}`);
                // Update last sync
                await this.prisma.externalEarningsSource.update({
                    where: { id: source.id },
                    data: { lastSync: new Date() }
                });
            }
            catch (error) {
                this.logger.error(`Failed to sync ${source.externalHandle}: ${error.message}`);
            }
        }
    }
};
exports.OnlyFansWebhookService = OnlyFansWebhookService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OnlyFansWebhookService.prototype, "syncOnlyFansData", null);
exports.OnlyFansWebhookService = OnlyFansWebhookService = OnlyFansWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], OnlyFansWebhookService);
//# sourceMappingURL=onlyfans-webhook.service.js.map