import { SocialMediaService } from '../services/social-media.service';
import { CrossPostRequestDto, CreateAccountGroupDto, PostToGroupDto } from '../dto/social-media.dto';
export declare class SocialMediaController {
    private readonly socialMediaService;
    constructor(socialMediaService: SocialMediaService);
    /**
     * Connect a social media account
     */
    connectAccount(user: any, platform: string, body: {
        authCode: string;
    }): Promise<number>;
    /**
     * Get connected accounts
     */
    getAccounts(user: any): Promise<import("../services/social-media.service").SocialAccount[]>;
    /**
     * Cross-post to multiple accounts (same or different platforms)
     */
    crossPost(user: any, request: CrossPostRequestDto): Promise<any>;
    /**
     * Schedule a post
     */
    schedulePost(user: any, request: CrossPostRequestDto): Promise<any>;
    /**
     * Get posting analytics
     */
    getAnalytics(user: any, startDate?: string, endDate?: string): Promise<{
        platforms: unknown;
        topPosts: unknown;
        period: {
            start: Date;
            end: Date;
        };
    }>;
    /**
     * Get optimal posting times
     */
    getOptimalTimes(user: any, platform: string): Promise<{
        platform: string;
        optimalTimes: any;
        recommendation: string;
    }>;
    /**
     * Get account groups for multi-account management
     */
    getAccountGroups(user: any): Promise<unknown>;
    /**
     * Create a new account group
     */
    createAccountGroup(user: any, dto: CreateAccountGroupDto): Promise<any>;
    /**
     * Add accounts to an existing group
     */
    addAccountsToGroup(user: any, groupId: string, body: {
        accountIds: string[];
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Post to all accounts in a group
     */
    postToGroup(user: any, groupId: string, dto: PostToGroupDto): Promise<any>;
    /**
     * Get accounts by platform
     */
    getAccountsByPlatform(user: any, platform: string): Promise<unknown>;
    /**
     * Example: Post to all Instagram accounts
     */
    quickPostToPlatform(user: any, platform: string, body: {
        content: any;
        accountIds?: string[];
    }): Promise<any>;
}
//# sourceMappingURL=social-media.controller.d.ts.map