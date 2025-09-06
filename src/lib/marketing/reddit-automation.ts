// Reddit Marketing Automation - Le canal sous-estimé pour OF
// Respect des règles site-wide + règles par subreddit

import { 
  REDDIT_TEMPLATES, 
  formatFirstComment, 
  getRandomTitle, 
  isTitleSafe,
  generateTitleVariations 
} from './reddit-templates';
import { redditRulesLoader, getSubredditRules } from './reddit-rules-loader';

export interface SubredditRules {
  name: string;
  requiresNSFW: boolean;
  requiresFlair: string | null;
  allowsLinks: boolean;
  linkInFirstCommentOnly: boolean;
  requiresVerification: boolean;
  verificationFormat?: string;
  minAccountAge?: number; // days
  minKarma?: number;
  cooldownHours?: number;
  bannedWords: string[];
  titleFormat?: string; // e.g. "[F] Title here"
  allowsCrosspost: boolean;
  bestPostingTimes: number[];
}

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  content?: string;
  mediaUrl?: string;
  linkUrl?: string;
  flair?: string;
  nsfw: boolean;
  status: 'pending' | 'approved' | 'removed' | 'shadowbanned';
  removalReason?: string;
  performance?: {
    upvotes: number;
    comments: number;
    clicks: number;
    conversions: number;
  };
  postedAt?: Date;
}

// SUBREDDIT RULES DATABASE
export const SUBREDDIT_RULES: Record<string, SubredditRules> = {
  'OnlyFansPromotions': {
    name: 'OnlyFansPromotions',
    requiresNSFW: true,
    requiresFlair: 'Promotion',
    allowsLinks: false,
    linkInFirstCommentOnly: true,
    requiresVerification: false,
    bannedWords: ['meet', 'escort', 'service'],
    allowsCrosspost: true,
    bestPostingTimes: [9, 12, 18, 22]
  },
  'OnlyFans101': {
    name: 'OnlyFans101',
    requiresNSFW: true,
    requiresFlair: null,
    allowsLinks: false,
    linkInFirstCommentOnly: true,
    requiresVerification: true,
    verificationFormat: 'Photo with username/date',
    minAccountAge: 30,
    minKarma: 100,
    bannedWords: ['ppv', 'price', 'cost', 'cheap'],
    allowsCrosspost: false,
    bestPostingTimes: [10, 15, 20, 23]
  },
  'RealGirls': {
    name: 'RealGirls',
    requiresNSFW: true,
    requiresFlair: null,
    allowsLinks: false,
    linkInFirstCommentOnly: false, // No links at all
    requiresVerification: true,
    minAccountAge: 90,
    minKarma: 500,
    cooldownHours: 24,
    bannedWords: ['onlyfans', 'OF', 'subscribe', 'link'],
    titleFormat: '[F] Your title',
    allowsCrosspost: false,
    bestPostingTimes: [8, 17, 21]
  },
  'GoneWild': {
    name: 'GoneWild',
    requiresNSFW: true,
    requiresFlair: null,
    allowsLinks: false,
    linkInFirstCommentOnly: false,
    requiresVerification: true,
    verificationFormat: '3 photos with handwritten sign',
    minAccountAge: 180,
    minKarma: 1000,
    cooldownHours: 48,
    bannedWords: ['seller', 'selling', 'buy', 'payment', 'onlyfans'],
    titleFormat: '[F] Age + descriptive title',
    allowsCrosspost: false,
    bestPostingTimes: [19, 22, 1]
  },
  'AdorableOnlyfans': {
    name: 'AdorableOnlyfans',
    requiresNSFW: true,
    requiresFlair: 'Cute',
    allowsLinks: true,
    linkInFirstCommentOnly: false,
    requiresVerification: false,
    bannedWords: ['meetup', 'escort'],
    allowsCrosspost: true,
    bestPostingTimes: [11, 16, 20]
  },
  'NSFW_Social': {
    name: 'NSFW_Social',
    requiresNSFW: true,
    requiresFlair: null,
    allowsLinks: true,
    linkInFirstCommentOnly: false,
    requiresVerification: false,
    minKarma: 50,
    bannedWords: ['underage', 'teen', 'young'],
    allowsCrosspost: true,
    bestPostingTimes: [12, 18, 23]
  }
};

// REDDIT MARKETING ENGINE
export class RedditAutomation {
  
  // Parse subreddit rules (from wiki/sidebar)
  async parseSubredditRules(subredditName: string): Promise<SubredditRules> {
    // First try YAML config
    const yamlRules = getSubredditRules(subredditName);
    if (yamlRules) return yamlRules;
    
    // Then check hardcoded rules
    const cached = SUBREDDIT_RULES[subredditName];
    if (cached) return cached;
    
    // In production: scrape actual rules from reddit.com/r/{sub}/wiki/rules
    // For now, return defaults
    return {
      name: subredditName,
      requiresNSFW: true,
      requiresFlair: null,
      allowsLinks: false,
      linkInFirstCommentOnly: true,
      requiresVerification: false,
      bannedWords: ['escort', 'meetup', 'service'],
      allowsCrosspost: false,
      bestPostingTimes: [10, 15, 20]
    };
  }
  
  // Pre-flight check before posting
  async preflightCheck(
    subreddit: string,
    post: {
      title: string;
      hasLink: boolean;
      hasMedia: boolean;
      flair?: string;
      nsfw?: boolean;
    }
  ): Promise<{
    canPost: boolean;
    risk: number; // 0-1
    blockers: string[];
    warnings: string[];
  }> {
    const rules = await this.parseSubredditRules(subreddit);
    const blockers: string[] = [];
    const warnings: string[] = [];
    
    // Check NSFW requirement
    if (rules.requiresNSFW && !post.nsfw) {
      blockers.push('NSFW_TAG_REQUIRED');
    }
    
    // Check flair requirement
    if (rules.requiresFlair && post.flair !== rules.requiresFlair) {
      blockers.push(`FLAIR_REQUIRED: ${rules.requiresFlair}`);
    }
    
    // Check link rules
    if (post.hasLink && !rules.allowsLinks && !rules.linkInFirstCommentOnly) {
      blockers.push('NO_LINKS_ALLOWED');
    }
    
    // Check banned words in title
    const lowerTitle = post.title.toLowerCase();
    const foundBannedWords = rules.bannedWords.filter(word => 
      lowerTitle.includes(word.toLowerCase())
    );
    if (foundBannedWords.length > 0) {
      blockers.push(`BANNED_WORDS: ${foundBannedWords.join(', ')}`);
    }
    
    // Check title format
    if (rules.titleFormat && !this.matchesTitleFormat(post.title, rules.titleFormat)) {
      warnings.push(`TITLE_FORMAT: Expected "${rules.titleFormat}"`);
    }
    
    // Check verification
    if (rules.requiresVerification) {
      warnings.push('VERIFICATION_REQUIRED: Complete before posting');
    }
    
    // Calculate risk score
    const risk = this.calculateRisk(blockers.length, warnings.length);
    
    return {
      canPost: blockers.length === 0,
      risk,
      blockers,
      warnings
    };
  }
  
  private matchesTitleFormat(title: string, format: string): boolean {
    // Simple format matching
    if (format.includes('[F]') && !title.includes('[F]')) return false;
    if (format.includes('[M]') && !title.includes('[M]')) return false;
    if (format.includes('Age') && !(/\d{2}/.test(title))) return false;
    return true;
  }
  
  private calculateRisk(blockers: number, warnings: number): number {
    const base = blockers * 0.3 + warnings * 0.1;
    return Math.min(base, 1);
  }
  
  // Create optimized post
  async createPost(
    subreddit: string,
    content: {
      title: string;
      body?: string;
      mediaUrl?: string;
      ofLink: string;
    }
  ): Promise<RedditPost> {
    const rules = await this.parseSubredditRules(subreddit);
    
    // Clean title
    let cleanTitle = content.title;
    rules.bannedWords.forEach(word => {
      cleanTitle = cleanTitle.replace(new RegExp(word, 'gi'), '');
    });
    
    // Prepare post
    const post: RedditPost = {
      id: `reddit_${Date.now()}`,
      subreddit,
      title: cleanTitle,
      content: content.body,
      mediaUrl: content.mediaUrl,
      linkUrl: rules.allowsLinks ? content.ofLink : undefined,
      flair: rules.requiresFlair || undefined,
      nsfw: rules.requiresNSFW,
      status: 'pending'
    };
    
    return post;
  }
  
  // Generate first comment with link
  generateFirstComment(
    ofLink: string,
    subreddit: string,
    niche: string = 'amateur'
  ): string {
    // Use templates from reddit-templates.ts
    return formatFirstComment(niche, ofLink, subreddit);
  }
  
  // Track post performance
  async trackPerformance(
    postId: string,
    metrics: {
      upvotes?: number;
      comments?: number;
      clicks?: number;
      conversions?: number;
      removed?: boolean;
      removalReason?: string;
    }
  ): Promise<void> {
    // Update post metrics
    // Calculate success rate per subreddit
    // Learn from removals
  }
  
  // Find best subreddits for niche
  async findBestSubreddits(
    niche: string,
    currentKarma: number
  ): Promise<Array<{
    name: string;
    subscribers: number;
    difficulty: 'easy' | 'medium' | 'hard';
    avgUpvotes: number;
    conversionRate: number;
  }>> {
    const nicheMap: Record<string, string[]> = {
      fitness: ['FitGirls', 'AthleticBabes', 'Workoutgonewild'],
      milf: ['Milfs', 'HotMoms', 'Maturemilf'],
      petite: ['PetiteGoneWild', 'xsmallgirls', 'funsized'],
      curvy: ['curvy', 'chubby', 'thick'],
      alt: ['altgonewild', 'GirlswithNeonHair', 'PunkGirls'],
      general: ['OnlyFansPromotions', 'OnlyFans101', 'NSFW_Social']
    };
    
    const subreddits = nicheMap[niche] || nicheMap.general;
    
    // Return with difficulty based on karma requirements
    return subreddits.map(name => ({
      name,
      subscribers: Math.floor(Math.random() * 500000) + 10000,
      difficulty: currentKarma < 100 ? 'hard' : currentKarma < 500 ? 'medium' : 'easy',
      avgUpvotes: Math.floor(Math.random() * 500) + 50,
      conversionRate: Math.random() * 5 + 1
    }));
  }
  
  // Generate Reddit-safe titles
  generateSafeTitle(niche: string): string {
    // Use templates from reddit-templates.ts
    const title = getRandomTitle(niche);
    
    // Verify it's safe
    const safety = isTitleSafe(title);
    if (!safety.safe) {
      console.warn('Unsafe title generated:', safety.issues);
      // Fallback to a basic safe title
      return '[F] New content from today';
    }
    
    return title;
  }
  
  // Generate multiple title variations for A/B testing
  generateTitleVariations(niche: string, count: number = 3): string[] {
    const variations = generateTitleVariations(niche, count);
    return variations.map(v => v.title);
  }
}

// REDDIT BEST PRACTICES
export const REDDIT_BEST_PRACTICES = {
  karma_building: [
    'Start in smaller, niche subreddits',
    'Comment before posting (build karma)',
    'Post non-promotional content first',
    'Engage genuinely with community',
    'Follow 9:1 rule (9 normal posts per 1 promo)'
  ],
  
  posting_strategy: [
    'Verify in high-value subs first',
    'Post at peak times (check subredditstats)',
    'Use imgur/redgifs for media hosting',
    'Never spam multiple subs at once',
    'Wait 24-48h between same-sub posts'
  ],
  
  title_optimization: [
    'Include [F] tag when required',
    'Be descriptive but not salesy',
    'Ask questions to boost engagement',
    'Avoid all banned words',
    'Match subreddit culture/tone'
  ],
  
  link_strategy: [
    'First comment if links banned',
    'Use tracking UTMs always',
    'Offer Reddit-exclusive discounts',
    'Free trial links perform best',
    'Pin your profile for easy access'
  ],
  
  avoid_bans: [
    'Never mention prices in title/post',
    'No "selling" language',
    'Respect cooldown periods',
    'Don\'t delete/repost',
    'Report harassment, don\'t engage'
  ]
};

// TEMPLATES PAR NICHE
export const REDDIT_TITLE_TEMPLATES = {
  fitness: {
    en: [
      '[F] Post-workout glow',
      'Gym done, time to play',
      'Progress pic, what do you think?'
    ]
  },
  
  general: {
    en: [
      '[F] First time posting here',
      'New content dropping tonight',
      'Should I post more?'
    ]
  }
};

// FIRST COMMENT TEMPLATES
export const REDDIT_COMMENT_TEMPLATES = {
  promo_allowed: {
    en: 'Link to my exclusive page → {link} | 50% off for Reddit fans!',
  },
  
  subtle: {
    en: 'More content on my profile 💕',
  }
};

export const redditAutomation = new RedditAutomation();
