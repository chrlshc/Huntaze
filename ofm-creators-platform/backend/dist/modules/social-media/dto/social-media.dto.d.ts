export declare enum SocialPlatform {
    INSTAGRAM = "instagram",
    TIKTOK = "tiktok",
    TWITTER = "twitter",
    REDDIT = "reddit"
}
export declare class AccountCustomizationDto {
    caption?: string;
    hashtags?: string[];
    mentions?: string[];
}
export declare class CrossPostAccountDto {
    id: string;
    platform: SocialPlatform;
    customizations?: AccountCustomizationDto;
}
export declare class StaggerPostingOptionsDto {
    enabled: boolean;
    intervalMinutes: number;
}
export declare class CrossPostOptionsDto {
    autoHashtags?: boolean;
    watermark?: boolean;
    trackingLink?: boolean;
    staggerPosting?: StaggerPostingOptionsDto;
}
export declare class MediaDto {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
}
export declare class PostContentDto {
    caption: string;
    media?: MediaDto[];
    hashtags?: string[];
    mentions?: string[];
    scheduledFor?: string;
}
export declare class CrossPostRequestDto {
    content: PostContentDto;
    accounts: CrossPostAccountDto[];
    options?: CrossPostOptionsDto;
}
export declare class CreateAccountGroupDto {
    name: string;
    description?: string;
    accountIds?: string[];
}
export declare class PostToGroupDto {
    groupId: string;
    content: PostContentDto;
}
//# sourceMappingURL=social-media.dto.d.ts.map