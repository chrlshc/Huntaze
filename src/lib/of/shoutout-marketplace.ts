// Shoutout Marketplace - S4S & Paid Collaborations
// Le VRAI levier de croissance sur OnlyFans

import { db } from '@/lib/db';

export interface Creator {
  id: string;
  username: string;
  platform: 'onlyfans' | 'instagram' | 'tiktok';
  stats: {
    followers: number;
    avgLikes: number;
    engagementRate: number;
    niche: string[];
    priceRange: string; // '$', '$$', '$$$'
  };
  shoutoutRates?: {
    story: number;
    post: number;
    reel: number;
  };
  verified: boolean;
  lastActive: Date;
}

export interface ShoutoutDeal {
  id: string;
  type: 'S4S' | 'paid' | 'bundle';
  initiator: Creator;
  partner: Creator;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  terms: {
    platform: string;
    contentType: 'story' | 'post' | 'reel' | 'live';
    duration?: number; // hours for story
    caption?: string;
    hashtags?: string[];
    scheduledDate: Date;
    price?: number; // For paid shoutouts
  };
  performance?: {
    views: number;
    newFollowers: number;
    clicks: number;
    revenue: number;
  };
  messages: ShoutoutMessage[];
  createdAt: Date;
}

export interface ShoutoutMessage {
  from: string;
  to: string;
  message: string;
  timestamp: Date;
}

// SMART MATCHMAKING ENGINE
export class ShoutoutMarketplace {
  
  // Find compatible creators for S4S
  async findMatches(
    creator: Creator,
    preferences: {
      minFollowers?: number;
      maxFollowers?: number;
      niches?: string[];
      type?: 'S4S' | 'paid' | 'both';
      platforms?: string[];
    }
  ): Promise<Array<{
    creator: Creator;
    compatibility: number;
    reason: string;
  }>> {
    const matches: Array<{
      creator: Creator;
      compatibility: number;
      reason: string;
    }> = [];
    
    // Get potential partners from database
    const potentials = await this.getPotentialPartners(creator, preferences);
    
    for (const potential of potentials) {
      const compatibility = this.calculateCompatibility(creator, potential);
      const reason = this.generateMatchReason(creator, potential);
      
      if (compatibility > 0.5) {
        matches.push({
          creator: potential,
          compatibility,
          reason
        });
      }
    }
    
    // Sort by compatibility
    return matches.sort((a, b) => b.compatibility - a.compatibility);
  }
  
  private async getPotentialPartners(
    creator: Creator,
    preferences: any
  ): Promise<Creator[]> {
    // Mock data - in production, query database
    return [
      {
        id: 'creator_2',
        username: 'FitnessBabe23',
        platform: 'onlyfans',
        stats: {
          followers: 45000,
          avgLikes: 2200,
          engagementRate: 4.9,
          niche: ['fitness', 'lifestyle'],
          priceRange: '$$'
        },
        shoutoutRates: {
          story: 50,
          post: 150,
          reel: 200
        },
        verified: true,
        lastActive: new Date()
      },
      {
        id: 'creator_3',
        username: 'GamerGirlXO',
        platform: 'onlyfans',
        stats: {
          followers: 38000,
          avgLikes: 3100,
          engagementRate: 8.2,
          niche: ['gaming', 'cosplay'],
          priceRange: '$$'
        },
        verified: true,
        lastActive: new Date()
      }
    ];
  }
  
  private calculateCompatibility(creator1: Creator, creator2: Creator): number {
    let score = 0;
    
    // Similar follower count (within 50%)
    const followerRatio = Math.min(
      creator1.stats.followers / creator2.stats.followers,
      creator2.stats.followers / creator1.stats.followers
    );
    if (followerRatio > 0.5) score += 0.3;
    
    // Niche overlap
    const sharedNiches = creator1.stats.niche.filter(n => 
      creator2.stats.niche.includes(n)
    );
    score += sharedNiches.length * 0.2;
    
    // Similar engagement rate
    const engagementDiff = Math.abs(
      creator1.stats.engagementRate - creator2.stats.engagementRate
    );
    if (engagementDiff < 2) score += 0.2;
    
    // Both verified
    if (creator1.verified && creator2.verified) score += 0.1;
    
    // Active recently
    const daysSinceActive = Math.floor(
      (Date.now() - creator2.lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActive < 7) score += 0.2;
    
    return Math.min(score, 1);
  }
  
  private generateMatchReason(creator1: Creator, creator2: Creator): string {
    const reasons = [];
    
    const followerRatio = creator2.stats.followers / creator1.stats.followers;
    if (followerRatio > 0.8 && followerRatio < 1.2) {
      reasons.push('Similar audience size');
    }
    
    const sharedNiches = creator1.stats.niche.filter(n => 
      creator2.stats.niche.includes(n)
    );
    if (sharedNiches.length > 0) {
      reasons.push(`Both in ${sharedNiches.join(' & ')}`);
    }
    
    if (creator2.stats.engagementRate > 5) {
      reasons.push(`High engagement (${creator2.stats.engagementRate}%)`);
    }
    
    return reasons.join(' • ');
  }
  
  // Create shoutout proposal
  async createProposal(
    from: Creator,
    to: Creator,
    terms: ShoutoutDeal['terms']
  ): Promise<ShoutoutDeal> {
    const deal: ShoutoutDeal = {
      id: `deal_${Date.now()}`,
      type: terms.price ? 'paid' : 'S4S',
      initiator: from,
      partner: to,
      status: 'pending',
      terms,
      messages: [{
        from: from.id,
        to: to.id,
        message: this.generateProposalMessage(from, to, terms),
        timestamp: new Date()
      }],
      createdAt: new Date()
    };
    
    // Save to database
    await this.saveDeal(deal);
    
    // Send notification
    await this.notifyCreator(to, deal);
    
    return deal;
  }
  
  private generateProposalMessage(
    from: Creator,
    to: Creator,
    terms: ShoutoutDeal['terms']
  ): string {
    if (terms.price) {
      return `Hey ${to.username}! Love your content! 😍 I'd like to book a ${terms.contentType} shoutout for $${terms.price}. My audience would love your ${to.stats.niche.join('/')} content! Let me know if you're interested 💕`;
    } else {
      return `Hey babe! Your content is 🔥! Want to do S4S? We have similar audience sizes and I think our fans would love each other! I can do a ${terms.contentType} for you if you do the same 🤝`;
    }
  }
  
  // Track shoutout performance
  async trackPerformance(
    dealId: string,
    metrics: {
      views?: number;
      newFollowers?: number;
      clicks?: number;
      revenue?: number;
    }
  ): Promise<void> {
    // Update deal with performance metrics
    await this.updateDealPerformance(dealId, metrics);
    
    // Calculate ROI
    const deal = await this.getDeal(dealId);
    if (deal && deal.terms.price) {
      const roi = ((metrics.revenue || 0) - deal.terms.price) / deal.terms.price * 100;
      console.log(`ROI: ${roi.toFixed(1)}%`);
    }
  }
  
  // Auto-negotiate terms
  async negotiateTerms(
    deal: ShoutoutDeal,
    counterOffer: Partial<ShoutoutDeal['terms']>
  ): Promise<{
    accepted: boolean;
    finalTerms?: ShoutoutDeal['terms'];
    message: string;
  }> {
    const original = deal.terms;
    
    // Simple negotiation logic
    if (counterOffer.price) {
      const priceDiff = Math.abs((counterOffer.price - (original.price || 0)) / (original.price || 1));
      
      if (priceDiff < 0.2) {
        // Accept if within 20%
        return {
          accepted: true,
          finalTerms: { ...original, ...counterOffer },
          message: 'Deal! Let\'s do this 🤝'
        };
      } else {
        // Counter with middle ground
        const middlePrice = ((original.price || 0) + counterOffer.price) / 2;
        return {
          accepted: false,
          finalTerms: { ...original, price: middlePrice },
          message: `How about $${middlePrice}? That works for both of us!`
        };
      }
    }
    
    return {
      accepted: true,
      finalTerms: { ...original, ...counterOffer },
      message: 'Sounds good to me!'
    };
  }
  
  // Templates for different shoutout types
  getShoutoutTemplates(type: 'story' | 'post' | 'reel'): {
    caption: string;
    hashtags: string[];
    cta: string;
  }[] {
    const templates = {
      story: [
        {
          caption: "OMG you guys NEED to check out @{username} 😍",
          hashtags: [],
          cta: "Swipe up for her page! 🔥"
        },
        {
          caption: "My girl @{username} is KILLING IT 💕",
          hashtags: [],
          cta: "Link in her bio! Trust me on this one"
        }
      ],
      post: [
        {
          caption: "Obsessed with @{username}! 😍 If you love my content, you'll LOVE hers even more! She's got that {niche} content that hits different 🔥",
          hashtags: ['#girlsupportgirls', '#contentcreator', '#mustfollow'],
          cta: "Check her page - link in her bio! 💋"
        }
      ],
      reel: [
        {
          caption: "POV: You haven't discovered @{username} yet 👀 Your feed is about to get SO much better! {niche} queen! 👑",
          hashtags: ['#creator', '#fyp', '#mustsee', '#trending'],
          cta: "Don't walk, RUN to her page!"
        }
      ]
    };
    
    return templates[type] || templates.story;
  }
  
  // Success tracking
  async getSuccessMetrics(creatorId: string): Promise<{
    totalDeals: number;
    successfulDeals: number;
    avgNewFollowers: number;
    avgROI: number;
    bestPartners: Array<{ username: string; performance: number }>;
  }> {
    // Get all completed deals
    const deals = await this.getCreatorDeals(creatorId, 'completed');
    
    const successful = deals.filter(d => 
      d.performance && d.performance.newFollowers > 50
    );
    
    const avgNewFollowers = successful.reduce((sum, d) => 
      sum + (d.performance?.newFollowers || 0), 0
    ) / successful.length;
    
    const avgROI = successful.reduce((sum, d) => {
      if (d.terms.price && d.performance?.revenue) {
        return sum + ((d.performance.revenue - d.terms.price) / d.terms.price);
      }
      return sum;
    }, 0) / successful.length * 100;
    
    // Find best performing partners
    const partnerPerformance = new Map<string, number[]>();
    successful.forEach(d => {
      const partner = d.initiator.id === creatorId ? d.partner : d.initiator;
      const perf = partnerPerformance.get(partner.username) || [];
      perf.push(d.performance?.newFollowers || 0);
      partnerPerformance.set(partner.username, perf);
    });
    
    const bestPartners = Array.from(partnerPerformance.entries())
      .map(([username, perfs]) => ({
        username,
        performance: perfs.reduce((a, b) => a + b, 0) / perfs.length
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
    
    return {
      totalDeals: deals.length,
      successfulDeals: successful.length,
      avgNewFollowers: Math.round(avgNewFollowers),
      avgROI: Math.round(avgROI),
      bestPartners
    };
  }
  
  private async saveDeal(deal: ShoutoutDeal): Promise<void> {
    // Save to database
  }
  
  private async notifyCreator(creator: Creator, deal: ShoutoutDeal): Promise<void> {
    // Send notification via platform
  }
  
  private async updateDealPerformance(dealId: string, metrics: any): Promise<void> {
    // Update in database
  }
  
  private async getDeal(dealId: string): Promise<ShoutoutDeal | null> {
    // Get from database
    return null;
  }
  
  private async getCreatorDeals(creatorId: string, status?: string): Promise<ShoutoutDeal[]> {
    // Get from database
    return [];
  }
}

// SHOUTOUT BEST PRACTICES
export const SHOUTOUT_TIPS = {
  timing: [
    "Post shoutouts when BOTH audiences are active",
    "Stories: 6-9pm weekdays, 2-5pm weekends",
    "Posts: Tuesday-Thursday perform best",
    "Avoid Mondays and late Sundays"
  ],
  
  content: [
    "Use authentic excitement - not salesy",
    "Show personality match with partner",
    "Include clear CTA but make it natural",
    "Use each other's content style/aesthetic"
  ],
  
  selection: [
    "Similar follower count = fair trade",
    "Check engagement rate, not just followers",
    "Verify they're active (posted < 7 days)",
    "Niche overlap but not identical"
  ],
  
  tracking: [
    "Screenshot follower count before/after",
    "Use unique link tracking",
    "Check new subs source in OF analytics",
    "Follow up 24-48h after posting"
  ]
};

export const shoutoutMarketplace = new ShoutoutMarketplace();