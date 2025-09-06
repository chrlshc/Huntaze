// Instagram DM Automation - Convert IG followers to OF subscribers
// Sans dire "OnlyFans" pour éviter les bans


export interface IGDMStrategy {
  messageType: 'welcome' | 'pricing' | 'content' | 'custom' | 'collab';
  response: string;
  followUpDelay?: number; // Hours
  followUpMessage?: string;
  includeLink: boolean;
}

export interface IGFanProfile {
  username: string;
  followerCount: number;
  isVerified: boolean;
  messageHistory: Array<{
    type: 'sent' | 'received';
    message: string;
    timestamp: Date;
  }>;
  tags: string[]; // 'potential_vip', 'time_waster', 'converted'
  conversionStatus: 'cold' | 'warm' | 'hot' | 'converted';
}

// SMART DM RESPONSES (Sans mentionner OF directement)
export const IG_DM_TEMPLATES: Record<string, IGDMStrategy> = {
  // New follower welcome
  welcome_new: {
    messageType: 'welcome',
    response: "Hey babe! Thanks for the follow 😘 I post my exclusive content on my VIP page - link in my bio if you want to see more of me 💕",
    followUpDelay: 24,
    followUpMessage: "Hope you're having an amazing day! Did you check out my special page yet? I just posted something HOT 🔥",
    includeLink: false // IG détecte les liens
  },
  
  // Pricing questions (NEVER share prices on IG!)
  pricing_inquiry: {
    messageType: 'pricing',
    response: "Hey love! I keep all my spicy content and prices on my exclusive platform 😏 Check the link up top and I'll send you something special when you join 💋",
    includeLink: false
  },
  
  // Content requests
  content_request: {
    messageType: 'content',
    response: "Mmm I'd love to show you more! 😈 All my naughty content is on my premium page (link in bio). I post daily and do customs too!",
    followUpDelay: 48,
    followUpMessage: "Still thinking about it babe? I just dropped new content that I think you'd LOVE 🔥 Don't miss out!",
    includeLink: false
  },
  
  // Custom content inquiry
  custom_request: {
    messageType: 'custom',
    response: "Yes I do customs! 🎬 But I handle all that on my exclusive platform for privacy. Join me there (link up top) and we can discuss your fantasy 😘",
    includeLink: false
  },
  
  // Fake collab requests
  collab_spam: {
    messageType: 'collab',
    response: "Thanks for reaching out! For all business inquiries, please join my exclusive platform first (link in bio) so I know you're serious 💼",
    includeLink: false
  }
};

// MESSAGE CATEGORIZATION AI
export class InstagramDMAutomation {
  
  // Analyze message intent
  categorizeMessage(message: string): {
    type: string;
    confidence: number;
    suggestedResponse: IGDMStrategy;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Pricing indicators
    if (this.containsAny(lowerMessage, [
      'how much', 'price', 'cost', 'rate', '$', 'pay', 'charge',
      'combien', 'prix', 'cuanto', 'cuesta'
    ])) {
      return {
        type: 'pricing',
        confidence: 0.9,
        suggestedResponse: IG_DM_TEMPLATES.pricing_inquiry
      };
    }
    
    // Content requests
    if (this.containsAny(lowerMessage, [
      'see more', 'show me', 'pics', 'videos', 'content', 'nude',
      'sexy', 'hot', 'naughty', 'ver mas', 'montrer'
    ])) {
      return {
        type: 'content',
        confidence: 0.85,
        suggestedResponse: IG_DM_TEMPLATES.content_request
      };
    }
    
    // Custom requests
    if (this.containsAny(lowerMessage, [
      'custom', 'personal', 'special', 'request', 'fetish', 'kink',
      'can you', 'would you', 'do you'
    ])) {
      return {
        type: 'custom',
        confidence: 0.8,
        suggestedResponse: IG_DM_TEMPLATES.custom_request
      };
    }
    
    // Collab spam
    if (this.containsAny(lowerMessage, [
      'collab', 'promotion', 'shoutout', 'partnership', 'work together',
      'brand', 'sponsor', 'ambassador'
    ])) {
      return {
        type: 'collab',
        confidence: 0.95,
        suggestedResponse: IG_DM_TEMPLATES.collab_spam
      };
    }
    
    // Default to welcome
    return {
      type: 'general',
      confidence: 0.5,
      suggestedResponse: IG_DM_TEMPLATES.welcome_new
    };
  }
  
  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
  
  // Generate personalized response
  personalizeResponse(
    template: IGDMStrategy,
    fanProfile: IGFanProfile
  ): string {
    let response = template.response;
    
    // Add personalization based on profile
    if (fanProfile.isVerified || fanProfile.followerCount > 10000) {
      response = "OMG hi! 😍 " + response;
    }
    
    if (fanProfile.conversionStatus === 'warm') {
      response += " I remember you from before! 💕";
    }
    
    // Add urgency for hot leads
    if (fanProfile.conversionStatus === 'hot') {
      response += " BTW I'm running a special for the next 24h only 👀";
    }
    
    return response;
  }
  
  // Track conversation flow
  async updateFanProfile(
    username: string,
    interaction: {
      messageReceived: string;
      messageSent: string;
      responseType: string;
    }
  ): Promise<void> {
    // Update fan profile with interaction
    // Track: response rate, interest level, conversion potential
    
    // Move through funnel: cold → warm → hot → converted
  }
  
  // Smart follow-up scheduling
  scheduleFollowUp(
    fanProfile: IGFanProfile,
    strategy: IGDMStrategy
  ): Date | null {
    if (!strategy.followUpDelay) return null;
    
    const followUpTime = new Date();
    followUpTime.setHours(followUpTime.getHours() + strategy.followUpDelay);
    
    // Adjust based on fan status
    if (fanProfile.conversionStatus === 'hot') {
      // Follow up sooner for hot leads
      followUpTime.setHours(followUpTime.getHours() - 12);
    }
    
    return followUpTime;
  }
  
  // Bulk DM campaigns (careful with limits!)
  async sendBulkWelcome(
    newFollowers: string[],
    dailyLimit: number = 50 // IG limits
  ): Promise<{
    sent: number;
    scheduled: number;
    errors: string[];
  }> {
    const results = {
      sent: 0,
      scheduled: 0,
      errors: [] as string[]
    };
    
    // Respect IG limits
    const toSendToday = newFollowers.slice(0, dailyLimit);
    const toSchedule = newFollowers.slice(dailyLimit);
    
    // Add natural delays between messages
    for (let i = 0; i < toSendToday.length; i++) {
      const delay = this.calculateNaturalDelay(i);
      
      setTimeout(async () => {
        try {
          // Send welcome message
          await this.sendMessage(toSendToday[i], IG_DM_TEMPLATES.welcome_new);
          results.sent++;
        } catch (error) {
          results.errors.push(toSendToday[i]);
        }
      }, delay);
    }
    
    results.scheduled = toSchedule.length;
    
    return results;
  }
  
  private calculateNaturalDelay(index: number): number {
    // Natural delays to avoid detection
    const baseDelay = 30000; // 30 seconds
    const randomDelay = Math.random() * 60000; // 0-60 seconds
    return (index * baseDelay) + randomDelay;
  }
  
  private async sendMessage(username: string, strategy: IGDMStrategy): Promise<void> {
    // In production, integrate with Instagram API/automation
    console.log(`Would send to ${username}: ${strategy.response}`);
  }
  
  // Conversion tracking
  async trackConversion(
    igUsername: string,
    ofUsername: string,
    source: 'dm' | 'bio_link' | 'story'
  ): Promise<void> {
    // Link IG follower to OF subscriber
    // Calculate: DM conversion rate, time to convert, LTV
  }
  
  // Response templates for common scenarios
  getQuickReplies(): Array<{
    trigger: string;
    response: string;
    category: string;
  }> {
    return [
      {
        trigger: "hey",
        response: "Hey babe! 😘 Check my bio for all my exclusive content 💕",
        category: "greeting"
      },
      {
        trigger: "beautiful",
        response: "Aww thank you love! You should see my exclusive content 😏 Link up top!",
        category: "compliment"
      },
      {
        trigger: "onlyfans",
        response: "I have an exclusive page! Check my bio link 💋",
        category: "direct_ask"
      },
      {
        trigger: "meet",
        response: "I only connect online babe! Join my exclusive page for the best experience 💕",
        category: "meetup"
      },
      {
        trigger: "free",
        response: "I put a lot of work into my content! My exclusive page has tons of content at great prices 😘",
        category: "freebie_hunter"
      }
    ];
  }
}

// INSTAGRAM GROWTH HACKS
export const IG_GROWTH_TACTICS = {
  bio_optimization: [
    "Use 🔗 instead of 'link'",
    "Say 'exclusive content' not OF",
    "'18+ page' is safer than 'adult content'",
    "Add backup account @",
    "Email for 'business' (catches DMs)"
  ],
  
  story_tactics: [
    "Polls: 'Should I post this?' → Bio link",
    "Countdown: 'New drop in 3h' → Drive urgency",
    "Questions: Let fans feel heard",
    "Behind scenes: Build connection",
    "Link Sticker: Available for all accounts now"
  ],
  
  reel_strategy: [
    "Transition from clothed to lingerie",
    "Use trending audio within 24h",
    "Text overlay with CTA",
    "Reply to comments with video",
    "Duet other creators for reach"
  ],
  
  dm_conversion: [
    "Never share prices in DM",
    "Always redirect to 'exclusive page'",
    "Use voice messages (more personal)",
    "Send preview pics (censored)",
    "Create urgency with 'limited time'"
  ],
  
  avoid_shadowban: [
    "No spam hashtags (#follow4follow)",
    "Vary hashtags each post",
    "No banned words in captions",
    "Engage genuinely with others",
    "Post consistently, not in bursts"
  ]
};

// Analytics to track
export interface IGAnalytics {
  followers: {
    total: number;
    dailyGrowth: number;
    unfollowRate: number;
  };
  engagement: {
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    rate: number; // (likes + comments) / followers
  };
  dmConversion: {
    messagesReceived: number;
    messagesAnswered: number;
    clickThroughRate: number;
    conversionRate: number; // Became OF subscriber
  };
  content: {
    bestPostingTimes: number[];
    topPerformingTypes: string[];
    hashtagPerformance: Record<string, number>;
  };
}

export const igDMAutomation = new InstagramDMAutomation();
