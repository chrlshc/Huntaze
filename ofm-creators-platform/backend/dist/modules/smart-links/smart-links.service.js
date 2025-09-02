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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartLinksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let SmartLinksService = class SmartLinksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create a new smart link
     */
    async create(creatorId, dto) {
        // Generate unique slug if not provided
        const slug = dto.slug || await this.generateUniqueSlug();
        // Validate slug format
        if (dto.slug && !this.isValidSlug(dto.slug)) {
            throw new common_1.BadRequestException('Invalid slug format. Use only letters, numbers, and hyphens');
        }
        // Check if slug is already taken
        if (dto.slug) {
            const existing = await this.prisma.smartLink.findUnique({
                where: { slug: dto.slug }
            });
            if (existing) {
                throw new common_1.BadRequestException('Slug already taken');
            }
        }
        const smartLink = await this.prisma.smartLink.create({
            data: {
                creatorId,
                slug,
                title: dto.title,
                targetUrl: dto.targetUrl,
                campaignId: dto.campaignId,
                assetId: dto.assetId,
                fanId: dto.fanId,
                expiresAt: dto.expiresAt,
                metadata: dto.metadata || {},
            },
        });
        return {
            ...smartLink,
            shortUrl: this.getShortUrl(smartLink.slug),
        };
    }
    /**
     * Get smart link by slug (for redirect)
     */
    async getBySlug(slug) {
        const smartLink = await this.prisma.smartLink.findUnique({
            where: { slug },
            include: {
                campaign: true,
                asset: true,
            },
        });
        if (!smartLink) {
            throw new common_1.NotFoundException('Link not found');
        }
        // Check if expired
        if (smartLink.expiresAt && new Date() > smartLink.expiresAt) {
            throw new common_1.BadRequestException('Link has expired');
        }
        return smartLink;
    }
    /**
     * Track click on smart link
     */
    async trackClick(smartLinkId, data) {
        const smartLink = await this.prisma.smartLink.findUnique({
            where: { id: smartLinkId },
        });
        if (!smartLink) {
            return;
        }
        // Hash IP address for privacy
        const ipHash = data.ipAddress ?
            crypto.createHash('sha256')
                .update(process.env.IP_HASH_SALT + data.ipAddress)
                .digest('hex') : null;
        // Parse user agent for device info
        const deviceInfo = this.parseUserAgent(data.userAgent);
        // Create click record
        const click = await this.prisma.linkClick.create({
            data: {
                smartLinkId,
                sessionId: data.sessionId,
                fanId: data.fanId,
                ipHash,
                userAgent: data.userAgent,
                referrer: data.referrer,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                utmSource: data.utmSource,
                utmMedium: data.utmMedium,
                utmCampaign: data.utmCampaign,
            },
        });
        // Update click counts
        await this.prisma.smartLink.update({
            where: { id: smartLinkId },
            data: {
                clickCount: { increment: 1 },
                uniqueClicks: {
                    increment: data.sessionId ?
                        await this.isUniqueClick(smartLinkId, data.sessionId) ? 1 : 0 : 0
                },
            },
        });
        // Trigger campaign event if linked to campaign
        if (smartLink.campaignId) {
            await this.prisma.campaignEvent.create({
                data: {
                    campaignId: smartLink.campaignId,
                    fanId: data.fanId,
                    eventType: 'clicked',
                    ipHash,
                    userAgent: data.userAgent,
                    metadata: {
                        smartLinkId,
                        clickId: click.id,
                    },
                },
            });
        }
        return click;
    }
    /**
     * Get smart links for creator
     */
    async findAll(creatorId, params) {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            creatorId,
            ...(params?.campaignId && { campaignId: params.campaignId }),
        };
        const [links, total] = await Promise.all([
            this.prisma.smartLink.findMany({
                where,
                include: {
                    campaign: true,
                    asset: true,
                    _count: {
                        select: { clicks: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.smartLink.count({ where }),
        ]);
        return {
            data: links.map(link => ({
                ...link,
                shortUrl: this.getShortUrl(link.slug),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get link analytics
     */
    async getAnalytics(creatorId, smartLinkId, days = 30) {
        const smartLink = await this.prisma.smartLink.findFirst({
            where: { id: smartLinkId, creatorId },
        });
        if (!smartLink) {
            throw new common_1.NotFoundException('Smart link not found');
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Get click data
        const clicks = await this.prisma.linkClick.findMany({
            where: {
                smartLinkId,
                clickedAt: { gte: startDate },
            },
            orderBy: { clickedAt: 'asc' },
        });
        // Get attributed revenue
        const attributions = await this.prisma.attribution.findMany({
            where: {
                smartLinkId,
                attributedAt: { gte: startDate },
            },
            include: {
                order: true,
            },
        });
        // Calculate metrics
        const totalClicks = clicks.length;
        const uniqueClicks = new Set(clicks.map(c => c.sessionId || c.ipHash)).size;
        const totalRevenue = attributions.reduce((sum, a) => sum + (a.order?.amountCents || 0), 0);
        const conversions = attributions.length;
        // Group by day
        const clicksByDay = this.groupByDay(clicks, 'clickedAt');
        const revenueByDay = this.groupByDay(attributions.map(a => ({
            ...a,
            value: a.order?.amountCents || 0
        })), 'attributedAt');
        // Device breakdown
        const deviceBreakdown = this.getBreakdown(clicks, 'deviceType');
        const browserBreakdown = this.getBreakdown(clicks, 'browser');
        const countryBreakdown = this.getBreakdown(clicks, 'country');
        // Top referrers
        const topReferrers = this.getTopReferrers(clicks);
        return {
            link: {
                ...smartLink,
                shortUrl: this.getShortUrl(smartLink.slug),
            },
            metrics: {
                totalClicks,
                uniqueClicks,
                totalRevenue,
                conversions,
                conversionRate: totalClicks > 0 ? (conversions / totalClicks) * 100 : 0,
                revenuePerClick: totalClicks > 0 ? totalRevenue / totalClicks : 0,
            },
            timeSeries: {
                clicks: clicksByDay,
                revenue: revenueByDay,
            },
            breakdown: {
                device: deviceBreakdown,
                browser: browserBreakdown,
                country: countryBreakdown,
            },
            topReferrers,
        };
    }
    /**
     * Update smart link
     */
    async update(creatorId, smartLinkId, dto) {
        const smartLink = await this.prisma.smartLink.findFirst({
            where: { id: smartLinkId, creatorId },
        });
        if (!smartLink) {
            throw new common_1.NotFoundException('Smart link not found');
        }
        return this.prisma.smartLink.update({
            where: { id: smartLinkId },
            data: {
                title: dto.title,
                targetUrl: dto.targetUrl,
                expiresAt: dto.expiresAt,
                metadata: dto.metadata,
            },
        });
    }
    /**
     * Delete smart link
     */
    async delete(creatorId, smartLinkId) {
        const smartLink = await this.prisma.smartLink.findFirst({
            where: { id: smartLinkId, creatorId },
        });
        if (!smartLink) {
            throw new common_1.NotFoundException('Smart link not found');
        }
        await this.prisma.smartLink.delete({
            where: { id: smartLinkId },
        });
    }
    /**
     * Helper methods
     */
    async generateUniqueSlug(length = 6) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let slug;
        let attempts = 0;
        do {
            slug = '';
            for (let i = 0; i < length; i++) {
                slug += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;
            if (attempts > 10) {
                length++; // Increase length if too many collisions
                attempts = 0;
            }
        } while (await this.prisma.smartLink.findUnique({ where: { slug } }));
        return slug;
    }
    isValidSlug(slug) {
        return /^[a-zA-Z0-9-]+$/.test(slug);
    }
    getShortUrl(slug) {
        const baseUrl = process.env.SHORT_LINK_BASE_URL || process.env.APP_URL || 'https://app.huntaze.com';
        return `${baseUrl}/s/${slug}`;
    }
    async isUniqueClick(smartLinkId, sessionId) {
        const existingClick = await this.prisma.linkClick.findFirst({
            where: { smartLinkId, sessionId },
        });
        return !existingClick;
    }
    parseUserAgent(userAgent) {
        // Simple UA parsing - in production use ua-parser-js
        const deviceType = userAgent?.includes('Mobile') ? 'mobile' : 'desktop';
        const browser = userAgent?.includes('Chrome') ? 'Chrome' :
            userAgent?.includes('Safari') ? 'Safari' :
                userAgent?.includes('Firefox') ? 'Firefox' : 'Other';
        const os = userAgent?.includes('Windows') ? 'Windows' :
            userAgent?.includes('Mac') ? 'macOS' :
                userAgent?.includes('Linux') ? 'Linux' :
                    userAgent?.includes('Android') ? 'Android' :
                        userAgent?.includes('iOS') ? 'iOS' : 'Other';
        return { deviceType, browser, os };
    }
    groupByDay(items, dateField) {
        const grouped = new Map();
        items.forEach(item => {
            const date = new Date(item[dateField]).toISOString().split('T')[0];
            const current = grouped.get(date) || 0;
            grouped.set(date, current + (item.value || 1));
        });
        return Array.from(grouped.entries()).map(([date, value]) => ({
            date,
            value,
        }));
    }
    getBreakdown(items, field) {
        const counts = new Map();
        items.forEach(item => {
            const value = item[field] || 'Unknown';
            counts.set(value, (counts.get(value) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }
    getTopReferrers(clicks, limit = 5) {
        const referrers = new Map();
        clicks.forEach(click => {
            if (click.referrer) {
                try {
                    const url = new URL(click.referrer);
                    const domain = url.hostname;
                    referrers.set(domain, (referrers.get(domain) || 0) + 1);
                }
                catch {
                    referrers.set(click.referrer, (referrers.get(click.referrer) || 0) + 1);
                }
            }
        });
        return Array.from(referrers.entries())
            .map(([referrer, clicks]) => ({ referrer, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, limit);
    }
};
exports.SmartLinksService = SmartLinksService;
exports.SmartLinksService = SmartLinksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SmartLinksService);
//# sourceMappingURL=smart-links.service.js.map