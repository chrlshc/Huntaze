import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export interface SocialAccount {
    id: string;
    platform: 'instagram' | 'tiktok' | 'twitter' | 'reddit';
    username: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    isActive: boolean;
}
export interface PostContent {
    caption: string;
    media?: Array<{
        type: 'image' | 'video';
        url: string;
        thumbnail?: string;
    }>;
    hashtags?: string[];
    mentions?: string[];
    scheduledFor?: Date;
}
export interface CrossPostRequest {
    content: PostContent;
    accounts: Array<{
        id: string;
        platform: string;
        customizations?: {
            caption?: string;
            hashtags?: string[];
            mentions?: string[];
        };
    }>;
    options?: {
        autoHashtags?: boolean;
        watermark?: boolean;
        trackingLink?: boolean;
        staggerPosting?: {
            enabled: boolean;
            intervalMinutes: number;
        };
    };
}
export declare class SocialMediaService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly ofmSocialOsUrl;
    constructor(prisma: PrismaService, configService: ConfigService);
    /**
     * Connect a social media account
     */
    connectAccount(creatorId: string, platform: string, authCode: string): Promise<number>;
    /**
     * Get all connected social accounts for a creator
     */
    getConnectedAccounts(creatorId: string): Promise<SocialAccount[]>;
    /**
     * Cross-post content to multiple accounts (same or different platforms)
     */
    crossPost(creatorId: string, request: CrossPostRequest): Promise<any>;
    /**
     * Get posting analytics across platforms
     */
    getPostingAnalytics(creatorId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        platforms: unknown;
        topPosts: unknown;
        period: {
            start: Date;
            end: Date;
        };
    }>;
    /**
     * Schedule a post for later
     */
    schedulePost(creatorId: string, request: CrossPostRequest): Promise<any>;
    /**
     * Get optimal posting times based on engagement data
     */
    getOptimalPostingTimes(creatorId: string, platform: string): Promise<{
        platform: string;
        optimalTimes: any;
        recommendation: string;
    }>;
    /**
     * Multi-account management
     */
    getAccountGroups(creatorId: string): Promise<unknown>;
    private validateAccountOwnership;
    private prepareMediaForPlatforms;
    private storePostRecord;
    private generatePostingRecommendation;
    /**
     * Staggered cross-posting for multiple accounts
     */
    private staggeredCrossPost;
    /**
     * Summarize results by platform
     */
    private summarizeByPlatform;
    /**
     * Create account group for easier multi-account management
     */
    createAccountGroup(creatorId: string, name: string, description?: string, accountIds?: string[]): Promise<any>;
    /**
     * Add accounts to a group
     */
    addAccountsToGroup(groupId: string, accountIds: string[]): Promise<void>;
    /**
     * Get accounts by platform for a creator
     */
    getAccountsByPlatform(creatorId: string, platform: string): Promise<unknown>;
    /**
     * Quick post to specific account group
     */
    postToGroup(creatorId: string, groupId: string, content: PostContent): Promise<any>;
}
//# sourceMappingURL=social-media.service.d.ts.map