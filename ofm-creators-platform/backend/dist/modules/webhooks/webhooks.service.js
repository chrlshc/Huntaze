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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    configService;
    logger = new common_1.Logger(WebhooksService_1.name);
    webhookSecrets;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        // Initialize webhook secrets for different providers
        this.webhookSecrets = new Map([
            ['sendgrid', this.configService.get('SENDGRID_WEBHOOK_SECRET', '')],
            ['mailgun', this.configService.get('MAILGUN_WEBHOOK_SECRET', '')],
            ['twilio', this.configService.get('TWILIO_WEBHOOK_SECRET', '')],
            ['postmark', this.configService.get('POSTMARK_WEBHOOK_SECRET', '')],
        ]);
    }
    async handleESPWebhook(provider, payload, signature) {
        // Verify webhook signature if provided
        if (signature && !this.verifyWebhookSignature(provider, payload, signature)) {
            throw new Error('Invalid webhook signature');
        }
        // Handle batch or single payload
        const events = Array.isArray(payload) ? payload : [payload];
        for (const event of events) {
            try {
                await this.processESPEvent(event);
            }
            catch (error) {
                this.logger.error(`Failed to process ESP event: ${error.message}`, {
                    event,
                    error,
                });
            }
        }
        return {
            processed: events.length,
            status: 'ok',
        };
    }
    async handleSMSWebhook(provider, payload, signature) {
        // Verify webhook signature if provided
        if (signature && !this.verifyWebhookSignature(provider, payload, signature)) {
            throw new Error('Invalid webhook signature');
        }
        // Handle batch or single payload
        const events = Array.isArray(payload) ? payload : [payload];
        for (const event of events) {
            try {
                await this.processSMSEvent(event);
            }
            catch (error) {
                this.logger.error(`Failed to process SMS event: ${error.message}`, {
                    event,
                    error,
                });
            }
        }
        return {
            processed: events.length,
            status: 'ok',
        };
    }
    async processESPEvent(event) {
        // Find campaign and fan
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: event.campaignId },
        });
        if (!campaign) {
            this.logger.warn(`Campaign not found: ${event.campaignId}`);
            return;
        }
        const fan = await this.prisma.fan.findFirst({
            where: {
                creatorId: campaign.creatorId,
                email: event.recipientEmail,
            },
        });
        // Map ESP events to our event types
        const eventTypeMap = {
            sent: 'sent',
            open: 'open',
            click: 'click',
            bounce: 'bounce',
            unsubscribe: 'unsubscribe',
            complaint: 'unsubscribe', // Treat complaints as unsubscribes
        };
        const eventType = eventTypeMap[event.event];
        if (!eventType) {
            this.logger.warn(`Unknown ESP event type: ${event.event}`);
            return;
        }
        // Record campaign event
        await this.prisma.campaignEvent.create({
            data: {
                creatorId: campaign.creatorId,
                campaignId: campaign.id,
                fanId: fan?.id,
                eventType: eventType,
                timestamp: new Date(event.timestamp),
                metadata: {
                    provider: 'email',
                    originalEvent: event.event,
                    ...event.metadata,
                },
            },
        });
        // Handle special cases
        if (event.event === 'unsubscribe' || event.event === 'complaint') {
            if (fan) {
                await this.prisma.fan.update({
                    where: { id: fan.id },
                    data: { consentEmail: false },
                });
            }
        }
        if (event.event === 'click' && event.url) {
            // Extract smart link slug from URL if present
            const urlMatch = event.url.match(/\/s\/([a-zA-Z0-9]+)/);
            if (urlMatch) {
                const slug = urlMatch[1];
                // Track as smart link click
                await this.recordSmartLinkClick(slug, fan?.id, campaign.id);
            }
        }
    }
    async processSMSEvent(event) {
        // Find campaign and fan
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: event.campaignId },
        });
        if (!campaign) {
            this.logger.warn(`Campaign not found: ${event.campaignId}`);
            return;
        }
        const fan = await this.prisma.fan.findFirst({
            where: {
                creatorId: campaign.creatorId,
                phone: event.recipientPhone,
            },
        });
        // Map SMS events to our event types
        const eventTypeMap = {
            sent: 'sent',
            delivered: 'sent', // SMS doesn't have separate delivered
            failed: 'bounce',
            clicked: 'click',
        };
        const eventType = eventTypeMap[event.event];
        if (!eventType) {
            this.logger.warn(`Unknown SMS event type: ${event.event}`);
            return;
        }
        // Record campaign event
        await this.prisma.campaignEvent.create({
            data: {
                creatorId: campaign.creatorId,
                campaignId: campaign.id,
                fanId: fan?.id,
                eventType: eventType,
                timestamp: new Date(event.timestamp),
                metadata: {
                    provider: 'sms',
                    originalEvent: event.event,
                    ...event.metadata,
                },
            },
        });
        // Handle click tracking
        if (event.event === 'clicked' && event.shortUrl) {
            const urlMatch = event.shortUrl.match(/\/s\/([a-zA-Z0-9]+)/);
            if (urlMatch) {
                const slug = urlMatch[1];
                await this.recordSmartLinkClick(slug, fan?.id, campaign.id);
            }
        }
    }
    async recordSmartLinkClick(slug, fanId, campaignId) {
        const smartLink = await this.prisma.smartLink.findUnique({
            where: { slug },
        });
        if (!smartLink) {
            return;
        }
        // Create click record
        await this.prisma.click.create({
            data: {
                creatorId: smartLink.creatorId,
                campaignId,
                fanId,
                smartLinkSlug: slug,
                targetUrl: smartLink.targetUrl,
                sessionId: `webhook-${Date.now()}`,
                ipHash: 'webhook-click',
                userAgent: 'webhook',
                utmSource: 'webhook',
                utmMedium: campaignId.includes('email') ? 'email' : 'sms',
                utmCampaign: campaignId,
            },
        });
    }
    verifyWebhookSignature(provider, payload, signature) {
        const secret = this.webhookSecrets.get(provider);
        if (!secret) {
            this.logger.warn(`No webhook secret configured for provider: ${provider}`);
            return true; // Allow if no secret configured
        }
        // Different providers use different signature methods
        switch (provider) {
            case 'sendgrid': {
                // SendGrid uses HMAC-SHA256 with timestamp
                const timestamp = signature.split(' ')[0];
                const expectedSig = signature.split(' ')[1];
                const payloadStr = timestamp + JSON.stringify(payload);
                const computedSig = (0, crypto_1.createHmac)('sha256', secret)
                    .update(payloadStr)
                    .digest('base64');
                return computedSig === expectedSig;
            }
            case 'mailgun': {
                // Mailgun uses HMAC-SHA256
                const computedSig = (0, crypto_1.createHmac)('sha256', secret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                return computedSig === signature;
            }
            case 'twilio': {
                // Twilio uses HMAC-SHA1 with URL
                // This is simplified - real implementation would need full URL
                const computedSig = (0, crypto_1.createHmac)('sha1', secret)
                    .update(JSON.stringify(payload))
                    .digest('base64');
                return computedSig === signature;
            }
            default:
                this.logger.warn(`Unknown provider for signature verification: ${provider}`);
                return true;
        }
    }
    async getWebhookStats(creatorId, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const stats = await this.prisma.campaignEvent.groupBy({
            by: ['eventType', 'metadata'],
            where: {
                creatorId,
                timestamp: { gte: since },
            },
            _count: { id: true },
        });
        // Process stats by provider
        const byProvider = {};
        stats.forEach(stat => {
            const provider = stat.metadata?.provider || 'unknown';
            if (!byProvider[provider]) {
                byProvider[provider] = {};
            }
            byProvider[provider][stat.eventType] = stat._count.id;
        });
        return {
            period: `${days}d`,
            stats: byProvider,
            total: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map