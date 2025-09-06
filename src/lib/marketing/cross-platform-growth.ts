// Cross-Platform Marketing - Le VRAI levier de croissance
// Instagram/TikTok/Twitter → OnlyFans funnel


export interface PlatformStrategy {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'reddit';
  contentType: 'teaser' | 'lifestyle' | 'bts' | 'trending';
  sfwLevel: 'strict' | 'moderate' | 'spicy';
  bestTimes: number[];
  bannedWords: string[];
  safeTags: string[];
}

export interface ContentPlan {
  id: string;
  platforms: string[];
  content: {
    media: string; // Image/video path
    caption: string;
    hashtags: string[];
    link?: string; // Linktree/Beacons
  };
  schedule: Date;
  performance?: {
    views: number;
    clicks: number;
    conversions: number;
  };
}

// PLATFORM-SPECIFIC RULES & STRATEGIES
export const PLATFORM_STRATEGIES: Record<string, PlatformStrategy> = {
  instagram: {
    platform: 'instagram',
    contentType: 'lifestyle',
    sfwLevel: 'strict',
    bestTimes: [12, 17, 19, 21], // Lunch, after work, evening
    bannedWords: [
      'onlyfans', 'OF', 'nude', 'naked', 'sex', 'porn', 'dick', 'pussy',
      'cum', 'fuck', 'link in bio' // IG détecte ça!
    ],
    safeTags: [
      '#model', '#fitnessgirl', '#lingerie', '#boudoir', '#exclusive',
      '#premiumcontent', '#vipaccess', '#behindthescenes', '#dailyphoto',
      '#instagood', '#photooftheday', '#beautiful', '#selfie'
    ]
  },
  
  tiktok: {
    platform: 'tiktok',
    contentType: 'trending',
    sfwLevel: 'strict',
    bestTimes: [6, 16, 19, 22], // Morning, after school, night
    bannedWords: [
      'onlyfans', 'adult', 'nude', 'NSFW', '18+', 'porn', 'sex',
      'spicy content', 'check my profile', // TikTok H2 2025 guidelines
      'sexual', 'explicit', 'intimate', 'bedroom' // Nouvelles restrictions
    ],
    safeTags: [
      '#fyp', '#foryoupage', '#viral', '#trending', '#dance',
      '#transition', '#grwm', '#dayinmylife', '#fitness', '#comedy'
    ]
  },
  
  reddit: {
    platform: 'reddit',
    contentType: 'teaser',
    sfwLevel: 'moderate', // Variable par subreddit
    bestTimes: [9, 12, 18, 22], // Peak Reddit hours
    bannedWords: [
      'escort', 'meet', 'meetup', 'service', // Site-wide bans
      'underage', 'teen', 'young', 'child', // Zero tolerance
      'paypal', 'cashapp', 'venmo' // Payment processors
    ],
    safeTags: [] // Reddit uses flair/subreddits, not hashtags
  }
};

// CONTENT GENERATION & ADAPTATION
export class CrossPlatformMarketing {
  
  // Generate safe captions that convert
  generateSafeCaption(
    platform: string,
    contentTheme: string,
    personality: string
  ): string {
    const strategy = PLATFORM_STRATEGIES[platform];
    const templates = this.getCaptionTemplates(platform, contentTheme);
    
    // Pick random template
    let caption = templates[Math.floor(Math.random() * templates.length)];
    
    // Clean banned words
    strategy.bannedWords.forEach(word => {
      caption = caption.replace(new RegExp(word, 'gi'), '');
    });
    
    return caption;
  }
  
  private getCaptionTemplates(platform: string, theme: string): string[] {
    const templates: Record<string, Record<string, string[]>> = {
      instagram: {
        workout: [
          "Gym mode activated 💪 Who's joining me today?",
          "Sweat today, slay tomorrow ✨",
          "Making gains and breaking hearts 😏",
          "Post-workout glow hits different 🔥"
        ],
        lingerie: [
          "Confidence is the best outfit 💋",
          "Feeling myself today... can you blame me? 😇",
          "New set, who dis? 🎀",
          "Life's too short for boring underwear ✨"
        ],
        lifestyle: [
          "Living my best life and it shows 🌟",
          "Sunshine mixed with a little hurricane 🌪️",
          "Catch flights, not feelings ✈️",
          "Main character energy only 💅"
        ]
      },
      
      tiktok: {
        transition: [
          "Wait for it... 😏 #fyp #transition",
          "POV: You almost scrolled past this 👀",
          "Rate the fit transformation 1-10 ⬇️",
          "This trend but make it spicy 🌶️"
        ],
        dance: [
          "Did I do this trend right? 🤔 #dance",
          "Your fav dancer is back 💃",
          "Vibes on 💯 today #fyp",
          "Learning this took forever 😅"
        ],
        grwm: [
          "Get ready with me for my shoot 💄",
          "Morning routine before content day",
          "GRWM for something special tonight",
          "Behind the scenes prep work"
        ]
      },
      
      reddit: {
        teaser: [
          "[F] New set from today's shoot",
          "First time posting here, be nice",
          "Feeling myself in this outfit",
          "What do you think of this angle?"
        ],
        question: [
          "Should I post more content like this?",
          "Which outfit wins - 1 or 2?",
          "Favorite pose from this set?",
          "Am I doing this right?"
        ]
      }
    };
    
    return templates[platform]?.[theme] || ["Check my profile for more 💕"];
  }
  
  // Smart hashtag selection (avoid shadowban)
  selectSafeHashtags(
    platform: string,
    contentType: string,
    limit: number = 10
  ): string[] {
    const strategy = PLATFORM_STRATEGIES[platform];
    const trending = this.getTrendingHashtags(platform);
    const niche = this.getNicheHashtags(contentType);
    
    // Mix trending + niche + safe
    const selected = [
      ...trending.slice(0, 3),
      ...niche.slice(0, 4),
      ...strategy.safeTags.slice(0, 3)
    ];
    
    // Remove duplicates and limit
    return [...new Set(selected)].slice(0, limit);
  }
  
  private getTrendingHashtags(platform: string): string[] {
    // In production, fetch from API or database
    const trending: Record<string, string[]> = {
      instagram: ['#reels', '#explore', '#viral', '#trending2024'],
      tiktok: ['#fyp', '#viral', '#trend', '#foryou'],
      twitter: ['#Friday', '#TGIF', '#mood', '#vibes']
    };
    
    return trending[platform] || [];
  }
  
  private getNicheHashtags(contentType: string): string[] {
    const niches: Record<string, string[]> = {
      workout: ['#fitgirl', '#gymlife', '#fitnessmotivation', '#workoutdone'],
      lingerie: ['#lingeriemodel', '#boudoirphotography', '#confidence', '#bodypositive'],
      lifestyle: ['#lifestyleblogger', '#dailylife', '#aesthetic', '#photoshoot']
    };
    
    return niches[contentType] || [];
  }
  
  // Create trackable links
  createTrackableLink(
    creatorId: string,
    platform: string,
    campaign?: string
  ): string {
    // Generate unique tracking code
    const trackingCode = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in database
    this.saveTrackingLink(creatorId, trackingCode, platform, campaign);
    
    // Return Linktree/Beacons style link
    return `https://link.huntaze.com/${creatorId}?ref=${trackingCode}`;
  }
  
  private async saveTrackingLink(
    creatorId: string,
    code: string,
    platform: string,
    campaign?: string
  ): Promise<void> {
    // Save to database for tracking
    // Track: clicks, conversions, revenue per source
  }
  
  // Instagram DM automation
  async automateInstagramDMs(
    messages: string[],
    responses: Record<string, string>
  ): Promise<void> {
    // Common Instagram DM patterns
    const templates = {
      pricing: "Hey babe! I don't share prices here but check my link for exclusive content 💕",
      content: "All my spicy stuff is on my premium page! Link in bio 😘",
      personal: "Thanks love! I do customs on my other page, check bio 💋",
      general: "Hey! Thanks for the message 🥰 All my content is on my special page (link up top)"
    };
    
    // Auto-categorize and respond
    // Redirect to OF without saying "OnlyFans"
  }
  
  // Content recycling strategy
  generateContentCalendar(
    existingContent: any[],
    days: number = 30
  ): ContentPlan[] {
    const calendar: ContentPlan[] = [];
    const platforms = ['instagram', 'tiktok', 'twitter'];
    
    // Spread content across platforms
    for (let day = 0; day < days; day++) {
      platforms.forEach(platform => {
        const bestTime = PLATFORM_STRATEGIES[platform].bestTimes[0];
        const date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(bestTime, 0, 0, 0);
        
        calendar.push({
          id: `plan_${day}_${platform}`,
          platforms: [platform],
          content: {
            media: this.selectMediaForPlatform(existingContent, platform),
            caption: this.generateSafeCaption(platform, 'teaser', 'flirty'),
            hashtags: this.selectSafeHashtags(platform, 'lifestyle'),
            link: this.createTrackableLink('creator_id', platform)
          },
          schedule: date
        });
      });
    }
    
    return calendar;
  }
  
  private selectMediaForPlatform(content: any[], platform: string): string {
    // Pick appropriate content based on platform rules
    const strategy = PLATFORM_STRATEGIES[platform];
    
    if (strategy.sfwLevel === 'strict') {
      // Pick most SFW content
      return content.find(c => c.type === 'lifestyle')?.url || '';
    }
    
    return content[0]?.url || '';
  }
  
  // Shadowban detection
  async checkShadowban(
    platform: string,
    username: string
  ): Promise<{
    isShadowbanned: boolean;
    reason?: string;
    solution?: string;
  }> {
    // Check engagement rates
    // If sudden drop in reach/engagement = likely shadowban
    
    return {
      isShadowbanned: false,
      reason: undefined,
      solution: undefined
    };
  }
  
  // Collaboration finder
  async findCollaborators(
    niche: string,
    followerRange: { min: number; max: number }
  ): Promise<Array<{
    username: string;
    platform: string;
    followers: number;
    engagementRate: number;
    niche: string;
  }>> {
    // Find similar creators for shoutouts/collabs
    // Filter by niche, size, engagement
    
    return [];
  }
}

// GROWTH HACKING STRATEGIES
export const GROWTH_TACTICS = {
  instagram: {
    stories: [
      "Use polls to boost engagement",
      "Countdown stickers for PPV drops",
      "Q&A to seem approachable",
      "Behind the scenes content",
      "Swipe up (10k+ followers)"
    ],
    reels: [
      "Jump on trending audio FAST",
      "Transitions are KEY",
      "Show personality, not just body",
      "Reply to comments with video",
      "Duet/remix other creators"
    ],
    bio: [
      "No direct OF mention",
      "Use 🔗 or 'exclusive content'",
      "Add backup accounts",
      "Email for 'collabs'",
      "Highlight fan testimonials"
    ]
  },
  
  tiktok: {
    algorithm: [
      "Post 3-5x daily",
      "Engage first 30 min after post",
      "Use 3-5 hashtags MAX",
      "Native features = more reach",
      "Complete profile 100%"
    ],
    content: [
      "First 3 seconds are CRUCIAL",
      "Text overlay for context",
      "Loop videos for watch time",
      "Reply to comments = new videos",
      "Go live weekly (1k+ followers)"
    ]
  },
  
  reddit: {
    subreddits: [
      "Find niche-specific subs",
      "Read rules CAREFULLY",
      "Engage before promoting",
      "Verification posts first",
      "Cross-post strategically"
    ],
    karma: [
      "Build karma in normal subs first",
      "Comment more than post",
      "Awards boost visibility",
      "Pinned posts on profile",
      "Custom feed for fans"
    ]
  }
};

export const crossPlatformMarketing = new CrossPlatformMarketing();
