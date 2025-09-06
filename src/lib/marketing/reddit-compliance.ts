// Reddit Compliance Engine - Éviter les bans et maximiser l'approbation
// Conforme aux règles site-wide + TikTok H2 2025 + Instagram Link Sticker

export interface ComplianceCheck {
  platform: 'tiktok' | 'instagram' | 'reddit';
  content: string;
  hasMedia: boolean;
  hasLink: boolean;
  score: number; // 0-1 risk score
  issues: ComplianceIssue[];
  rewriteSuggestion?: string;
}

export interface ComplianceIssue {
  type: 'banned_word' | 'solicitation' | 'format' | 'link_placement' | 'age_restriction';
  severity: 'block' | 'warning' | 'info';
  message: string;
  fix?: string;
}

// COMPLIANCE RULES BY PLATFORM
export const COMPLIANCE_RULES = {
  tiktok: {
    // H2 2025 Guidelines Update
    bannedWords: [
      'onlyfans', 'OF', 'adult', 'nude', 'NSFW', '18+', 
      'sexual', 'explicit', 'intimate', 'bedroom', 'spicy',
      'check bio', 'link in bio', 'DM me'
    ],
    ageRestrictedWords: [
      'lingerie', 'bikini', 'shower', 'bath', 'bed'
    ],
    maxSolicitation: 0, // Zero tolerance
    allowDirectLinks: false,
    requiresSFW: true
  },
  
  instagram: {
    bannedWords: [
      'onlyfans', 'nude', 'naked', 'porn', 'sex',
      'dick', 'pussy', 'cum', 'fuck'
    ],
    linkRules: {
      stories: 'link_sticker', // Not swipe up
      posts: 'bio_only',
      reels: 'bio_only',
      dm: 'no_direct_links'
    },
    maxHashtags: 30,
    requiresSFW: true
  },
  
  reddit: {
    siteWideBans: [
      'escort', 'meet', 'meetup', 'service', // Paid services
      'paypal', 'cashapp', 'venmo', 'payment', // Processors
      'underage', 'teen', 'young', 'child' // Zero tolerance
    ],
    formatRules: {
      titleRequired: ['[F]', '[M]', '[NB]'], // Many subs require
      noLinksInTitle: true,
      flairRequired: true // Varies by sub
    },
    requiresNSFW: true // For adult content
  }
};

export class ComplianceEngine {
  
  // Main compliance check
  async checkCompliance(
    platform: 'tiktok' | 'instagram' | 'reddit',
    content: {
      text: string;
      hasMedia?: boolean;
      hasLink?: boolean;
      subreddit?: string;
    }
  ): Promise<ComplianceCheck> {
    const issues: ComplianceIssue[] = [];
    const rules = COMPLIANCE_RULES[platform];
    
    // Check banned words
    const bannedWordsFound = this.checkBannedWords(
      content.text, 
      (rules as any).bannedWords || (rules as any).siteWideBans || []
    );
    
    if (bannedWordsFound.length > 0) {
      issues.push({
        type: 'banned_word',
        severity: 'block',
        message: `Banned words detected: ${bannedWordsFound.join(', ')}`,
        fix: 'Remove or replace these words'
      });
    }
    
    // Platform-specific checks
    if (platform === 'tiktok') {
      issues.push(...this.checkTikTokCompliance(content.text));
    } else if (platform === 'instagram') {
      issues.push(...this.checkInstagramCompliance(content));
    } else if (platform === 'reddit') {
      issues.push(...await this.checkRedditCompliance(content));
    }
    
    // Calculate risk score
    const score = this.calculateRiskScore(issues);
    
    // Generate rewrite suggestion if high risk
    const rewriteSuggestion = score > 0.6 
      ? this.generateSafeRewrite(platform, content.text)
      : undefined;
    
    return {
      platform,
      content: content.text,
      hasMedia: content.hasMedia || false,
      hasLink: content.hasLink || false,
      score,
      issues,
      rewriteSuggestion
    };
  }
  
  private checkBannedWords(text: string, bannedWords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return bannedWords.filter(word => lowerText.includes(word.toLowerCase()));
  }
  
  private checkTikTokCompliance(text: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const rules = COMPLIANCE_RULES.tiktok;
    
    // Check age-restricted words
    const ageRestricted = this.checkBannedWords(text, rules.ageRestrictedWords);
    if (ageRestricted.length > 0) {
      issues.push({
        type: 'age_restriction',
        severity: 'warning',
        message: 'Content may be age-restricted',
        fix: 'Consider more neutral language'
      });
    }
    
    // Check for any solicitation
    const solicitationPhrases = [
      'check my', 'visit my', 'link', 'subscribe', 'join',
      'available on', 'find me', 'DM for'
    ];
    
    const hasSolicitation = solicitationPhrases.some(phrase => 
      text.toLowerCase().includes(phrase)
    );
    
    if (hasSolicitation) {
      issues.push({
        type: 'solicitation',
        severity: 'block',
        message: 'Sexual solicitation detected (H2 2025 guidelines)',
        fix: 'Remove all promotional language'
      });
    }
    
    return issues;
  }
  
  private checkInstagramCompliance(content: any): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    
    // Check link placement
    if (content.hasLink && content.type !== 'story') {
      issues.push({
        type: 'link_placement',
        severity: 'warning',
        message: 'Links only work in bio or story stickers',
        fix: 'Use "link in bio" or Link Sticker for stories'
      });
    }
    
    // Check hashtag count
    const hashtags = (content.text.match(/#\w+/g) || []).length;
    if (hashtags > 30) {
      issues.push({
        type: 'format',
        severity: 'block',
        message: `Too many hashtags (${hashtags}/30 max)`,
        fix: 'Reduce to 30 or fewer hashtags'
      });
    }
    
    return issues;
  }
  
  private async checkRedditCompliance(content: any): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    const rules = COMPLIANCE_RULES.reddit;
    
    // Check title format
    if (content.isTitle) {
      const hasGenderTag = rules.formatRules.titleRequired.some(tag => 
        content.text.includes(tag)
      );
      
      if (!hasGenderTag && content.subreddit !== 'OnlyFansPromotions') {
        issues.push({
          type: 'format',
          severity: 'warning',
          message: 'Many NSFW subs require [F]/[M]/[NB] in title',
          fix: 'Add appropriate gender tag'
        });
      }
      
      if (content.hasLink) {
        issues.push({
          type: 'link_placement',
          severity: 'block',
          message: 'No links allowed in titles',
          fix: 'Place link in first comment instead'
        });
      }
    }
    
    return issues;
  }
  
  private calculateRiskScore(issues: ComplianceIssue[]): number {
    let score = 0;
    
    issues.forEach(issue => {
      if (issue.severity === 'block') score += 0.4;
      else if (issue.severity === 'warning') score += 0.2;
      else score += 0.1;
    });
    
    return Math.min(score, 1);
  }
  
  private generateSafeRewrite(platform: string, originalText: string): string {
    let rewrite = originalText;
    
    // Platform-specific rewrites
    if (platform === 'tiktok') {
      // Remove all promotional language
      rewrite = rewrite
        .replace(/check my.*/gi, '')
        .replace(/link.*/gi, '')
        .replace(/available.*/gi, '')
        .replace(/DM.*/gi, '');
      
      // Add safe CTA
      rewrite += '\n\n✨ New content tonight!';
    } else if (platform === 'instagram') {
      // Replace OF mentions
      rewrite = rewrite
        .replace(/onlyfans/gi, 'exclusive page')
        .replace(/\bOF\b/gi, 'my page')
        .replace(/link in bio/gi, 'check my page');
    } else if (platform === 'reddit') {
      // Clean for Reddit
      rewrite = rewrite
        .replace(/escort|service|meet/gi, '')
        .replace(/paypal|cashapp|venmo/gi, '')
        .replace(/DM me/gi, 'See comments');
    }
    
    return rewrite.trim();
  }
  
  // Get platform-specific safe templates
  getSafeTemplates(
    platform: string,
    contentType: string
  ): Array<{ title?: string; body?: string; firstComment?: string }> {
    const templates = {
      tiktok: [
        {
          body: 'New drop tonight 🎬 Details in my page',
          title: undefined,
          firstComment: undefined
        },
        {
          body: 'Behind the scenes from today ✨',
          title: undefined,
          firstComment: undefined
        }
      ],
      instagram: [
        {
          body: 'Exclusive content on my VIP page 💕 Link up top!',
          title: undefined,
          firstComment: undefined
        },
        {
          body: 'New set available! Check my special page 🔥',
          title: undefined,
          firstComment: undefined
        }
      ],
      reddit: [
        {
          title: '[F] New content from today\'s shoot',
          body: undefined,
          firstComment: 'My exclusive page → {link} | 50% off for Reddit fans!'
        },
        {
          title: '[F] First time posting, be nice 🥺',
          body: undefined,
          firstComment: 'Find more on my page: {link}'
        }
      ]
    };
    
    return templates[platform as keyof typeof templates] || [];
  }
}

// MULTI-LANGUAGE SAFE TEMPLATES
export const SAFE_TEMPLATES = {
  tiktok: {
    en: [
      'New drop tonight 🎬',
      'Behind the scenes ✨',
      'Midnight surprise 🌙'
    ]
  },
  
  instagram: {
    en: [
      'Exclusive content on my VIP page 💕',
      'New set available! Link in bio 🔥',
      'Special access in my bio ✨'
    ]
  },
  
  reddit: {
    titles: {
      en: [
        '[F] New set from today',
        '[F] First post here',
        '[F] What do you think?'
      ]
    },
    comments: {
      en: 'Exclusive page → {link} | 50% off for Reddit!'
    }
  }
};

export const complianceEngine = new ComplianceEngine();
