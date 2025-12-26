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
var SocialMediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialMediaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@infrastructure/prisma/prisma.service");
const config_1 = require("@nestjs/config");
let SocialMediaService = SocialMediaService_1 = class SocialMediaService {
    prisma;
    configService;
    logger = new common_1.Logger(SocialMediaService_1.name);
    ofmSocialOsUrl;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.ofmSocialOsUrl = this.configService.get('OFM_SOCIAL_OS_URL') || 'http://localhost:4000';
    }
    /**
     * Connect a social media account
     */
    async connectAccount(creatorId, platform, authCode) {
        this.logger.log(`Connecting ${platform} account for creator ${creatorId}`);
        // Call OFM Social OS API to complete OAuth
        const response = await fetch(`${this.ofmSocialOsUrl}/api/auth/${platform}/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Creator-Id': creatorId
            },
            body: JSON.stringify({ code: authCode })
        });
        if (!response.ok) {
            throw new Error(`Failed to connect ${platform} account`);
        }
        const accountData = await response.json();
        // Store account in database
        return this.prisma.$executeRaw `
      INSERT INTO social_accounts (
        creator_id,
        platform,
        username,
        access_token,
        refresh_token,
        expires_at,
        is_active,
        metadata
      ) VALUES (
        ${creatorId},
        ${platform},
        ${accountData.username},
        ${accountData.accessToken},
        ${accountData.refreshToken},
        ${accountData.expiresAt ? new Date(accountData.expiresAt) : null},
        true,
        ${JSON.stringify(accountData.metadata)}::jsonb
      )
      ON CONFLICT (creator_id, platform, username) 
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        is_active = true,
        updated_at = NOW()
      RETURNING id, platform, username
    `;
    }
    /**
     * Get all connected social accounts for a creator
     */
    async getConnectedAccounts(creatorId) {
        return this.prisma.$queryRaw `
      SELECT 
        id,
        platform,
        username,
        is_active as "isActive",
        expires_at as "expiresAt",
        created_at as "connectedAt"
      FROM social_accounts
      WHERE creator_id = ${creatorId}
        AND is_active = true
      ORDER BY platform, username
    `;
    }
    /**
     * Cross-post content to multiple accounts (same or different platforms)
     */
    async crossPost(creatorId, request) {
        this.logger.log(`Cross-posting to ${request.accounts.length} accounts`);
        // Group accounts by platform
        const accountsByPlatform = request.accounts.reduce((acc, account) => {
            if (!acc[account.platform])
                acc[account.platform] = [];
            acc[account.platform].push(account);
            return acc;
        }, {});
        this.logger.log(`Platforms involved: ${Object.keys(accountsByPlatform).join(', ')}`);
        // Validate all accounts belong to creator
        const accountIds = request.accounts.map(a => a.id);
        const validAccounts = await this.validateAccountOwnership(creatorId, accountIds);
        // Map valid accounts with customizations
        const accountsWithAuth = validAccounts.map(acc => {
            const requestAccount = request.accounts.find(a => a.id === acc.id);
            return {
                ...acc,
                customizations: requestAccount?.customizations
            };
        });
        // Prepare media for all unique platforms
        const platforms = Object.keys(accountsByPlatform);
        const preparedMedia = await this.prepareMediaForPlatforms(request.content.media, platforms);
        // Handle staggered posting if enabled
        if (request.options?.staggerPosting?.enabled) {
            return this.staggeredCrossPost(creatorId, accountsWithAuth, request, preparedMedia);
        }
        // Call OFM Social OS to handle the actual posting
        const response = await fetch(`${this.ofmSocialOsUrl}/api/posts/cross-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Creator-Id': creatorId
            },
            body: JSON.stringify({
                accounts: accountsWithAuth,
                content: {
                    ...request.content,
                    media: preparedMedia
                },
                options: request.options
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cross-post failed: ${error.message}`);
        }
        const result = await response.json();
        // Store post records
        for (const platformResult of result.results) {
            await this.storePostRecord(creatorId, platformResult);
        }
        return {
            ...result,
            summary: {
                totalAccounts: request.accounts.length,
                successCount: result.results.filter((r) => r.status === 'success').length,
                failureCount: result.results.filter((r) => r.status === 'failed').length,
                byPlatform: this.summarizeByPlatform(result.results)
            }
        };
    }
    /**
     * Get posting analytics across platforms
     */
    async getPostingAnalytics(creatorId, dateRange) {
        const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = dateRange?.end || new Date();
        const analytics = await this.prisma.$queryRaw `
      SELECT 
        platform,
        COUNT(*) as "postCount",
        SUM(engagement_count) as "totalEngagement",
        AVG(engagement_rate) as "avgEngagementRate",
        MAX(engagement_count) as "bestPost",
        COUNT(DISTINCT DATE(posted_at)) as "activeDays"
      FROM social_posts
      WHERE creator_id = ${creatorId}
        AND posted_at BETWEEN ${startDate} AND ${endDate}
        AND status = 'published'
      GROUP BY platform
      ORDER BY "totalEngagement" DESC
    `;
        // Get best performing content
        const topPosts = await this.prisma.$queryRaw `
      SELECT 
        id,
        platform,
        caption,
        engagement_count as "engagementCount",
        engagement_rate as "engagementRate",
        posted_at as "postedAt",
        post_url as "postUrl"
      FROM social_posts
      WHERE creator_id = ${creatorId}
        AND posted_at BETWEEN ${startDate} AND ${endDate}
        AND status = 'published'
      ORDER BY engagement_rate DESC
      LIMIT 10
    `;
        return {
            platforms: analytics,
            topPosts,
            period: { start: startDate, end: endDate }
        };
    }
    /**
     * Schedule a post for later
     */
    async schedulePost(creatorId, request) {
        if (!request.content.scheduledFor) {
            throw new Error('scheduledFor is required for scheduled posts');
        }
        // Store in queue
        const scheduledPost = await this.prisma.$queryRaw `
      INSERT INTO scheduled_posts (
        creator_id,
        content,
        platforms,
        account_ids,
        scheduled_for,
        status,
        options
      ) VALUES (
        ${creatorId},
        ${JSON.stringify(request.content)}::jsonb,
        ${request.platforms},
        ${request.accountIds},
        ${request.content.scheduledFor},
        'pending',
        ${JSON.stringify(request.options || {})}::jsonb
      )
      RETURNING id, scheduled_for
    `;
        // Schedule with OFM Social OS
        await fetch(`${this.ofmSocialOsUrl}/api/posts/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Creator-Id': creatorId
            },
            body: JSON.stringify({
                postId: scheduledPost[0].id,
                scheduledFor: request.content.scheduledFor,
                request
            })
        });
        return scheduledPost[0];
    }
    /**
     * Get optimal posting times based on engagement data
     */
    async getOptimalPostingTimes(creatorId, platform) {
        const engagementByHour = await this.prisma.$queryRaw `
      SELECT 
        EXTRACT(HOUR FROM posted_at AT TIME ZONE 'UTC') as hour,
        EXTRACT(DOW FROM posted_at AT TIME ZONE 'UTC') as day_of_week,
        AVG(engagement_rate) as avg_engagement,
        COUNT(*) as post_count
      FROM social_posts
      WHERE creator_id = ${creatorId}
        AND platform = ${platform}
        AND status = 'published'
        AND posted_at > NOW() - INTERVAL '90 days'
      GROUP BY hour, day_of_week
      HAVING COUNT(*) >= 3
      ORDER BY avg_engagement DESC
    `;
        return {
            platform,
            optimalTimes: engagementByHour.slice(0, 5),
            recommendation: this.generatePostingRecommendation(engagementByHour)
        };
    }
    /**
     * Multi-account management
     */
    async getAccountGroups(creatorId) {
        return this.prisma.$queryRaw `
      SELECT 
        g.id,
        g.name,
        g.description,
        COUNT(ga.account_id) as account_count,
        array_agg(
          json_build_object(
            'id', sa.id,
            'platform', sa.platform,
            'username', sa.username
          )
        ) as accounts
      FROM account_groups g
      LEFT JOIN group_accounts ga ON g.id = ga.group_id
      LEFT JOIN social_accounts sa ON ga.account_id = sa.id
      WHERE g.creator_id = ${creatorId}
      GROUP BY g.id, g.name, g.description
      ORDER BY g.name
    `;
    }
    // Private helper methods
    async validateAccountOwnership(creatorId, accountIds) {
        const accounts = await this.prisma.$queryRaw `
      SELECT id, platform, username, access_token, refresh_token
      FROM social_accounts
      WHERE creator_id = ${creatorId}
        AND id = ANY(${accountIds}::uuid[])
        AND is_active = true
    `;
        if (accounts.length !== accountIds.length) {
            throw new Error('Some accounts not found or not active');
        }
        return accounts;
    }
    async prepareMediaForPlatforms(media, platforms) {
        if (!media || media.length === 0)
            return [];
        // Different platforms have different requirements
        const platformSpecs = {
            instagram: { maxVideo: 60, maxImages: 10, aspectRatio: [1, 1.91] },
            tiktok: { maxVideo: 180, maxImages: 0, aspectRatio: [0.56, 1] },
            twitter: { maxVideo: 140, maxImages: 4, aspectRatio: [0.5, 2] },
            reddit: { maxVideo: 900, maxImages: 20, aspectRatio: null }
        };
        // Call OFM Social OS media pipeline
        const response = await fetch(`${this.ofmSocialOsUrl}/api/media/prepare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                media,
                platforms,
                specs: platforms.map(p => platformSpecs[p])
            })
        });
        return response.json();
    }
    async storePostRecord(creatorId, platformResult) {
        await this.prisma.$executeRaw `
      INSERT INTO social_posts (
        creator_id,
        platform,
        account_id,
        post_id,
        caption,
        media_urls,
        posted_at,
        status,
        post_url,
        initial_metrics
      ) VALUES (
        ${creatorId},
        ${platformResult.platform},
        ${platformResult.accountId},
        ${platformResult.postId},
        ${platformResult.caption},
        ${platformResult.mediaUrls},
        ${new Date()},
        ${platformResult.status},
        ${platformResult.postUrl},
        ${JSON.stringify(platformResult.metrics || {})}::jsonb
      )
    `;
    }
    generatePostingRecommendation(engagementData) {
        if (engagementData.length === 0) {
            return 'Not enough data to generate recommendations';
        }
        const topTime = engagementData[0];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Best time to post: ${dayNames[topTime.day_of_week]} at ${topTime.hour}:00 UTC (${topTime.avg_engagement.toFixed(2)}% avg engagement)`;
    }
    /**
     * Staggered cross-posting for multiple accounts
     */
    async staggeredCrossPost(creatorId, accounts, request, preparedMedia) {
        const results = [];
        const intervalMinutes = request.options?.staggerPosting?.intervalMinutes || 5;
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const delay = i * intervalMinutes * 60 * 1000; // Convert to milliseconds
            // Schedule each post with delay
            const scheduledTime = new Date(Date.now() + delay);
            const response = await fetch(`${this.ofmSocialOsUrl}/api/posts/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Creator-Id': creatorId
                },
                body: JSON.stringify({
                    account,
                    content: {
                        ...request.content,
                        ...account.customizations,
                        media: preparedMedia
                    },
                    scheduledFor: scheduledTime,
                    options: request.options
                })
            });
            if (response.ok) {
                const result = await response.json();
                results.push({
                    accountId: account.id,
                    platform: account.platform,
                    username: account.username,
                    status: 'scheduled',
                    scheduledFor: scheduledTime,
                    ...result
                });
            }
            else {
                results.push({
                    accountId: account.id,
                    platform: account.platform,
                    username: account.username,
                    status: 'failed',
                    error: await response.text()
                });
            }
        }
        return {
            type: 'staggered',
            results,
            summary: {
                totalAccounts: accounts.length,
                scheduledCount: results.filter(r => r.status === 'scheduled').length,
                failedCount: results.filter(r => r.status === 'failed').length,
                intervalMinutes
            }
        };
    }
    /**
     * Summarize results by platform
     */
    summarizeByPlatform(results) {
        return results.reduce((summary, result) => {
            const platform = result.platform;
            if (!summary[platform]) {
                summary[platform] = {
                    total: 0,
                    success: 0,
                    failed: 0
                };
            }
            summary[platform].total++;
            if (result.status === 'success' || result.status === 'scheduled') {
                summary[platform].success++;
            }
            else {
                summary[platform].failed++;
            }
            return summary;
        }, {});
    }
    /**
     * Create account group for easier multi-account management
     */
    async createAccountGroup(creatorId, name, description, accountIds) {
        const group = await this.prisma.$queryRaw `
      INSERT INTO account_groups (creator_id, name, description)
      VALUES (${creatorId}, ${name}, ${description})
      RETURNING id, name, description
    `;
        if (accountIds && accountIds.length > 0) {
            await this.addAccountsToGroup(group[0].id, accountIds);
        }
        return group[0];
    }
    /**
     * Add accounts to a group
     */
    async addAccountsToGroup(groupId, accountIds) {
        const values = accountIds.map(accountId => `('${groupId}', '${accountId}')`).join(',');
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO group_accounts (group_id, account_id)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);
    }
    /**
     * Get accounts by platform for a creator
     */
    async getAccountsByPlatform(creatorId, platform) {
        return this.prisma.$queryRaw `
      SELECT 
        id,
        username,
        is_active as "isActive",
        created_at as "connectedAt",
        CASE 
          WHEN expires_at IS NULL THEN true
          WHEN expires_at > NOW() THEN true
          ELSE false
        END as "tokenValid"
      FROM social_accounts
      WHERE creator_id = ${creatorId}
        AND platform = ${platform}
        AND is_active = true
      ORDER BY username
    `;
    }
    /**
     * Quick post to specific account group
     */
    async postToGroup(creatorId, groupId, content) {
        // Get all accounts in the group
        const groupAccounts = await this.prisma.$queryRaw `
      SELECT 
        sa.id,
        sa.platform,
        sa.username
      FROM group_accounts ga
      JOIN social_accounts sa ON ga.account_id = sa.id
      WHERE ga.group_id = ${groupId}
        AND sa.creator_id = ${creatorId}
        AND sa.is_active = true
    `;
        if (groupAccounts.length === 0) {
            throw new Error('No active accounts in group');
        }
        // Create cross-post request
        const request = {
            content,
            accounts: groupAccounts.map((acc) => ({
                id: acc.id,
                platform: acc.platform
            })),
            options: {
                staggerPosting: {
                    enabled: true,
                    intervalMinutes: 3
                }
            }
        };
        return this.crossPost(creatorId, request);
    }
};
exports.SocialMediaService = SocialMediaService;
exports.SocialMediaService = SocialMediaService = SocialMediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SocialMediaService);
//# sourceMappingURL=social-media.service.js.map