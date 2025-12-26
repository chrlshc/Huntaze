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
var OnlyFansAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyFansAutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
let OnlyFansAutomationService = OnlyFansAutomationService_1 = class OnlyFansAutomationService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(OnlyFansAutomationService_1.name);
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Handle fan subscribed event
     */
    async handleFanSubscribed(event) {
        this.logger.log(`Fan subscribed: ${event.fanId}`);
        const automations = await this.getActiveAutomations(event.creatorId, client_1.AutomationTrigger.FAN_JOINED);
        for (const automation of automations) {
            await this.executeAutomation(automation, event);
        }
    }
    /**
     * Handle subscription renewed event
     */
    async handleSubscriptionRenewed(event) {
        this.logger.log(`Subscription renewed: ${event.fanId}`);
        const automations = await this.getActiveAutomations(event.creatorId, client_1.AutomationTrigger.SUBSCRIPTION_STARTED);
        for (const automation of automations) {
            await this.executeAutomation(automation, event);
        }
    }
    /**
     * Handle purchase made event
     */
    async handlePurchaseMade(event) {
        this.logger.log(`Purchase made by: ${event.fanId}`);
        const automations = await this.getActiveAutomations(event.creatorId, client_1.AutomationTrigger.PURCHASE_MADE);
        for (const automation of automations) {
            await this.executeAutomation(automation, event);
        }
    }
    /**
     * Get active automations for a trigger
     */
    async getActiveAutomations(creatorId, trigger) {
        return this.prisma.automation.findMany({
            where: {
                creatorId,
                triggerType: trigger,
                status: 'ACTIVE'
            }
        });
    }
    /**
     * Execute an automation
     */
    async executeAutomation(automation, event) {
        try {
            // Check conditions if any
            if (automation.conditions) {
                const conditionsMet = await this.evaluateConditions(automation.conditions, event);
                if (!conditionsMet) {
                    this.logger.debug(`Conditions not met for automation ${automation.id}`);
                    return;
                }
            }
            // Execute actions
            const actions = automation.actions;
            for (const action of actions) {
                await this.executeAction(action, event);
            }
            // Update automation stats
            await this.prisma.automation.update({
                where: { id: automation.id },
                data: {
                    lastRun: new Date(),
                    runCount: { increment: 1 }
                }
            });
        }
        catch (error) {
            this.logger.error(`Failed to execute automation ${automation.id}: ${error.message}`);
        }
    }
    /**
     * Evaluate automation conditions
     */
    async evaluateConditions(conditions, event) {
        // Example conditions:
        // - Fan tier is VIP
        // - Lifetime value > $100
        // - Previous purchases > 5
        if (conditions.fanTier) {
            const fanRelation = await this.prisma.fanRelation.findUnique({
                where: {
                    creatorId_fanId: {
                        creatorId: event.creatorId,
                        fanId: event.fanId
                    }
                }
            });
            if (!fanRelation?.tags.includes(conditions.fanTier)) {
                return false;
            }
        }
        if (conditions.minLifetimeValue) {
            const fanRelation = await this.prisma.fanRelation.findUnique({
                where: {
                    creatorId_fanId: {
                        creatorId: event.creatorId,
                        fanId: event.fanId
                    }
                }
            });
            if (!fanRelation || Number(fanRelation.lifetimeValue) < conditions.minLifetimeValue * 100) {
                return false;
            }
        }
        return true;
    }
    /**
     * Execute a single action
     */
    async executeAction(action, event) {
        switch (action.type) {
            case 'TAG_FAN':
                await this.tagFan(event.creatorId, event.fanId, action.tags);
                break;
            case 'SEND_MESSAGE':
                await this.sendMessage(event.creatorId, event.fanId, action.message);
                break;
            case 'CREATE_OFFER':
                await this.createOffer(event.creatorId, event.fanId, action.offer);
                break;
            case 'UPDATE_TIER':
                await this.updateFanTier(event.creatorId, event.fanId, action.tier);
                break;
            case 'WEBHOOK':
                await this.callWebhook(action.url, event);
                break;
        }
    }
    /**
     * Tag a fan
     */
    async tagFan(creatorId, fanId, tags) {
        await this.prisma.fanRelation.update({
            where: {
                creatorId_fanId: { creatorId, fanId }
            },
            data: {
                tags: {
                    push: tags
                }
            }
        });
    }
    /**
     * Send a message to a fan
     */
    async sendMessage(creatorId, fanId, message) {
        // Queue message for sending via OnlyFans
        this.eventEmitter.emit('queue.message', {
            creatorId,
            fanId,
            platform: 'onlyfans',
            message: {
                text: message.text,
                media: message.media,
                price: message.price
            }
        });
    }
    /**
     * Create an offer for a fan
     */
    async createOffer(creatorId, fanId, offer) {
        // Create PPV offer
        this.eventEmitter.emit('create.offer', {
            creatorId,
            fanId,
            platform: 'onlyfans',
            offer: {
                title: offer.title,
                description: offer.description,
                price: offer.price,
                content: offer.content,
                expiresIn: offer.expiresIn
            }
        });
    }
    /**
     * Update fan tier
     */
    async updateFanTier(creatorId, fanId, newTier) {
        const fanRelation = await this.prisma.fanRelation.findUnique({
            where: {
                creatorId_fanId: { creatorId, fanId }
            }
        });
        if (fanRelation) {
            const tags = fanRelation.tags.filter(t => !['VIP', 'PREMIUM', 'ACTIVE', 'BASIC'].includes(t));
            tags.push(newTier);
            await this.prisma.fanRelation.update({
                where: { id: fanRelation.id },
                data: { tags }
            });
        }
    }
    /**
     * Call external webhook
     */
    async callWebhook(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Huntaze-Event': 'automation.action'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status}`);
            }
        }
        catch (error) {
            this.logger.error(`Webhook call failed: ${error.message}`);
        }
    }
    /**
     * Create default automations for OnlyFans
     */
    async createDefaultAutomations(creatorId) {
        const defaults = [
            {
                name: 'Welcome New Subscribers',
                triggerType: client_1.AutomationTrigger.FAN_JOINED,
                conditions: { platform: 'onlyfans' },
                actions: [
                    {
                        type: 'SEND_MESSAGE',
                        message: {
                            text: 'Welcome! Thanks for subscribing 💕 Check out my exclusive content and feel free to message me anytime!'
                        }
                    },
                    {
                        type: 'TAG_FAN',
                        tags: ['new_subscriber', 'welcome_sent']
                    }
                ]
            },
            {
                name: 'VIP Tier Upgrade',
                triggerType: client_1.AutomationTrigger.CUSTOM,
                conditions: {
                    minLifetimeValue: 100,
                    platform: 'onlyfans'
                },
                actions: [
                    {
                        type: 'UPDATE_TIER',
                        tier: 'VIP'
                    },
                    {
                        type: 'SEND_MESSAGE',
                        message: {
                            text: "You've been upgraded to VIP! 🌟 Enjoy exclusive perks and priority access to my content!"
                        }
                    }
                ]
            },
            {
                name: 'Re-engagement Campaign',
                triggerType: client_1.AutomationTrigger.INACTIVITY,
                conditions: {
                    daysInactive: 14,
                    platform: 'onlyfans'
                },
                actions: [
                    {
                        type: 'CREATE_OFFER',
                        offer: {
                            title: 'Miss you! 💕',
                            description: 'Come back for an exclusive offer',
                            price: 9.99,
                            expiresIn: 72 // hours
                        }
                    }
                ]
            }
        ];
        for (const automation of defaults) {
            await this.prisma.automation.upsert({
                where: {
                    creatorId_name: {
                        creatorId,
                        name: automation.name
                    }
                },
                create: {
                    creatorId,
                    ...automation,
                    status: 'ACTIVE'
                },
                update: {}
            });
        }
    }
};
exports.OnlyFansAutomationService = OnlyFansAutomationService;
__decorate([
    (0, event_emitter_1.OnEvent)('fan.subscribed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnlyFansAutomationService.prototype, "handleFanSubscribed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('subscription.renewed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnlyFansAutomationService.prototype, "handleSubscriptionRenewed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('purchase.made'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnlyFansAutomationService.prototype, "handlePurchaseMade", null);
exports.OnlyFansAutomationService = OnlyFansAutomationService = OnlyFansAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], OnlyFansAutomationService);
//# sourceMappingURL=onlyfans-automation.service.js.map