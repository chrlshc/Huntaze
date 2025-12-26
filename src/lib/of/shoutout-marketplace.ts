// Shoutout Marketplace - S4S & Paid Collaborations
// Le VRAI levier de croissance sur OnlyFans
// 
// RECÂBLÉ: Utilise Prisma pour stocker les deals et récupérer les créateurs

import { prisma } from '@/lib/prisma';

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
    duration?: number;
    caption?: string;
    hashtags?: string[];
    scheduledDate: Date;
    price?: number;
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
  
  async findMatches(
    creator: Creator,
    preferences: {
      minFollowers?: number;
      maxFollowers?: number;
      niches?: string[];
      type?: 'S4S' | 'paid' | 'both';
      platforms?: string[];
    }
  ): Promise<Array<{ creator: Creator; compatibility: number; reason: string }>> {
    const matches: Array<{ creator: Creator; compatibility: number; reason: string }> = [];
    const potentials = await this.getPotentialPartners(creator, preferences);
    
    for (const potential of potentials) {
      const compatibility = this.calculateCompatibility(creator, potential);
      const reason = this.generateMatchReason(creator, potential);
      if (compatibility > 0.5) {
        matches.push({ creator: potential, compatibility, reason });
      }
    }
    
    return matches.sort((a, b) => b.compatibility - a.compatibility);
  }
  
  private async getPotentialPartners(
    creator: Creator,
    _preferences: { minFollowers?: number; maxFollowers?: number; niches?: string[]; platforms?: string[] }
  ): Promise<Creator[]> {
    try {
      const users = await prisma.users.findMany({
        where: {
          of_linked_at: { not: null },
          NOT: { id: parseInt(creator.id, 10) || -1 },
        },
        include: { user_stats: true },
        take: 50,
      });
      return users.map(user => this.transformUserToCreator(user));
    } catch (error) {
      console.error('[ShoutoutMarketplace] Error fetching partners:', error);
      return [];
    }
  }

  private transformUserToCreator(user: any): Creator {
    const stats = user.user_stats;
    const revenue = stats?.revenue || 0;
    const estimatedFollowers = Math.max(100, Math.round(revenue * 10));
    let priceRange = '$';
    if (revenue >= 10000) priceRange = '$$$';
    else if (revenue >= 1000) priceRange = '$$';

    return {
      id: user.id.toString(),
      username: user.name || user.email.split('@')[0],
      platform: 'onlyfans',
      stats: {
        followers: estimatedFollowers,
        avgLikes: Math.round(estimatedFollowers * 0.05),
        engagementRate: stats?.response_rate || 5.0,
        niche: user.content_types || ['lifestyle'],
        priceRange,
      },
      shoutoutRates: {
        story: Math.round(revenue * 0.01) || 25,
        post: Math.round(revenue * 0.03) || 75,
        reel: Math.round(revenue * 0.05) || 125,
      },
      verified: !!user.of_linked_at,
      lastActive: user.updated_at || new Date(),
    };
  }
  
  private calculateCompatibility(creator1: Creator, creator2: Creator): number {
    let score = 0;
    const followerRatio = Math.min(
      creator1.stats.followers / creator2.stats.followers,
      creator2.stats.followers / creator1.stats.followers
    );
    if (followerRatio > 0.5) score += 0.3;
    
    const sharedNiches = creator1.stats.niche.filter(n => creator2.stats.niche.includes(n));
    score += sharedNiches.length * 0.2;
    
    const engagementDiff = Math.abs(creator1.stats.engagementRate - creator2.stats.engagementRate);
    if (engagementDiff < 2) score += 0.2;
    if (creator1.verified && creator2.verified) score += 0.1;
    
    const daysSinceActive = Math.floor((Date.now() - creator2.lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive < 7) score += 0.2;
    
    return Math.min(score, 1);
  }
  
  private generateMatchReason(creator1: Creator, creator2: Creator): string {
    const reasons = [];
    const followerRatio = creator2.stats.followers / creator1.stats.followers;
    if (followerRatio > 0.8 && followerRatio < 1.2) reasons.push('Similar audience size');
    
    const sharedNiches = creator1.stats.niche.filter(n => creator2.stats.niche.includes(n));
    if (sharedNiches.length > 0) reasons.push(`Both in ${sharedNiches.join(' & ')}`);
    if (creator2.stats.engagementRate > 5) reasons.push(`High engagement (${creator2.stats.engagementRate}%)`);
    
    return reasons.join(' • ') || 'Potential match';
  }
  
  async createProposal(from: Creator, to: Creator, terms: ShoutoutDeal['terms']): Promise<ShoutoutDeal> {
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
    
    await this.saveDeal(deal);
    await this.notifyCreator(to, deal);
    return deal;
  }
  
  private generateProposalMessage(from: Creator, to: Creator, terms: ShoutoutDeal['terms']): string {
    if (terms.price) {
      return `Hey ${to.username}! Love your content! 😍 I'd like to book a ${terms.contentType} shoutout for $${terms.price}. Let me know if you're interested 💕`;
    }
    return `Hey! Your content is 🔥! Want to do S4S? I can do a ${terms.contentType} for you if you do the same 🤝`;
  }
  
  async trackPerformance(dealId: string, metrics: { views?: number; newFollowers?: number; clicks?: number; revenue?: number }): Promise<void> {
    await this.updateDealPerformance(dealId, metrics);
    const deal = await this.getDeal(dealId);
    if (deal?.terms.price) {
      const roi = ((metrics.revenue || 0) - deal.terms.price) / deal.terms.price * 100;
      console.log(`[ShoutoutMarketplace] ROI for ${dealId}: ${roi.toFixed(1)}%`);
    }
  }
  
  async negotiateTerms(deal: ShoutoutDeal, counterOffer: Partial<ShoutoutDeal['terms']>): Promise<{ accepted: boolean; finalTerms?: ShoutoutDeal['terms']; message: string }> {
    const original = deal.terms;
    if (counterOffer.price) {
      const priceDiff = Math.abs((counterOffer.price - (original.price || 0)) / (original.price || 1));
      if (priceDiff < 0.2) {
        return { accepted: true, finalTerms: { ...original, ...counterOffer }, message: 'Deal! Let\'s do this 🤝' };
      }
      const middlePrice = ((original.price || 0) + counterOffer.price) / 2;
      return { accepted: false, finalTerms: { ...original, price: middlePrice }, message: `How about $${middlePrice}?` };
    }
    return { accepted: true, finalTerms: { ...original, ...counterOffer }, message: 'Sounds good!' };
  }
  
  getShoutoutTemplates(type: 'story' | 'post' | 'reel'): { caption: string; hashtags: string[]; cta: string }[] {
    const templates = {
      story: [
        { caption: "OMG you guys NEED to check out @{username} 😍", hashtags: [], cta: "Swipe up! 🔥" },
        { caption: "My girl @{username} is KILLING IT 💕", hashtags: [], cta: "Link in her bio!" }
      ],
      post: [
        { caption: "Obsessed with @{username}! 😍 She's got that {niche} content that hits different 🔥", hashtags: ['#girlsupportgirls', '#contentcreator'], cta: "Check her page! 💋" }
      ],
      reel: [
        { caption: "POV: You haven't discovered @{username} yet 👀 {niche} queen! 👑", hashtags: ['#creator', '#fyp', '#trending'], cta: "RUN to her page!" }
      ]
    };
    return templates[type] || templates.story;
  }
  
  async getSuccessMetrics(creatorId: string): Promise<{ totalDeals: number; successfulDeals: number; avgNewFollowers: number; avgROI: number; bestPartners: Array<{ username: string; performance: number }> }> {
    const deals = await this.getCreatorDeals(creatorId, 'completed');
    if (deals.length === 0) {
      return { totalDeals: 0, successfulDeals: 0, avgNewFollowers: 0, avgROI: 0, bestPartners: [] };
    }
    
    const successful = deals.filter(d => d.performance && d.performance.newFollowers > 50);
    const avgNewFollowers = successful.length > 0 ? successful.reduce((sum, d) => sum + (d.performance?.newFollowers || 0), 0) / successful.length : 0;
    
    const paidDeals = successful.filter(d => d.terms.price && d.performance?.revenue);
    const avgROI = paidDeals.length > 0 ? paidDeals.reduce((sum, d) => sum + ((d.performance!.revenue - d.terms.price!) / d.terms.price!), 0) / paidDeals.length * 100 : 0;
    
    const partnerPerformance = new Map<string, number[]>();
    successful.forEach(d => {
      const partner = d.initiator.id === creatorId ? d.partner : d.initiator;
      const perf = partnerPerformance.get(partner.username) || [];
      perf.push(d.performance?.newFollowers || 0);
      partnerPerformance.set(partner.username, perf);
    });
    
    const bestPartners = Array.from(partnerPerformance.entries())
      .map(([username, perfs]) => ({ username, performance: perfs.reduce((a, b) => a + b, 0) / perfs.length }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
    
    return { totalDeals: deals.length, successfulDeals: successful.length, avgNewFollowers: Math.round(avgNewFollowers), avgROI: Math.round(avgROI), bestPartners };
  }
  
  private async saveDeal(deal: ShoutoutDeal): Promise<void> {
    try {
      const creatorId = parseInt(deal.initiator.id, 10);
      if (!Number.isFinite(creatorId)) return;
      await prisma.aIInsight.create({
        data: {
          creatorId,
          source: 'shoutout_marketplace',
          type: 'shoutout_deal',
          confidence: deal.status === 'completed' ? 1.0 : 0.5,
          data: { dealId: deal.id, type: deal.type, partnerId: deal.partner.id, partnerUsername: deal.partner.username, status: deal.status, terms: deal.terms, performance: deal.performance, messages: deal.messages, createdAt: deal.createdAt.toISOString() },
        },
      });
    } catch (error) {
      console.error('[ShoutoutMarketplace] Error saving deal:', error);
    }
  }
  
  private async notifyCreator(_creator: Creator, deal: ShoutoutDeal): Promise<void> {
    console.log(`[ShoutoutMarketplace] Notification for deal ${deal.id}`);
  }
  
  private async updateDealPerformance(dealId: string, metrics: any): Promise<void> {
    try {
      const insights = await prisma.aIInsight.findMany({
        where: { source: 'shoutout_marketplace', type: 'shoutout_deal' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const insight = insights.find(i => (i.data as any)?.dealId === dealId);
      if (insight) {
        const data = insight.data as any;
        await prisma.aIInsight.update({
          where: { id: insight.id },
          data: { data: { ...data, performance: { ...data.performance, ...metrics } }, confidence: 1.0 },
        });
      }
    } catch (error) {
      console.error('[ShoutoutMarketplace] Error updating deal:', error);
    }
  }
  
  private async getDeal(dealId: string): Promise<ShoutoutDeal | null> {
    try {
      const insights = await prisma.aIInsight.findMany({
        where: { source: 'shoutout_marketplace', type: 'shoutout_deal' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const insight = insights.find(i => (i.data as any)?.dealId === dealId);
      return insight ? this.transformInsightToDeal(insight) : null;
    } catch (error) {
      console.error('[ShoutoutMarketplace] Error getting deal:', error);
      return null;
    }
  }
  
  private async getCreatorDeals(creatorId: string, status?: string): Promise<ShoutoutDeal[]> {
    try {
      const creatorIdNum = parseInt(creatorId, 10);
      if (!Number.isFinite(creatorIdNum)) return [];
      const insights = await prisma.aIInsight.findMany({
        where: { creatorId: creatorIdNum, source: 'shoutout_marketplace', type: 'shoutout_deal' },
        orderBy: { createdAt: 'desc' },
      });
      let deals = insights.map(i => this.transformInsightToDeal(i)).filter(Boolean) as ShoutoutDeal[];
      if (status) deals = deals.filter(d => d.status === status);
      return deals;
    } catch (error) {
      console.error('[ShoutoutMarketplace] Error getting creator deals:', error);
      return [];
    }
  }

  private transformInsightToDeal(insight: any): ShoutoutDeal | null {
    try {
      const data = insight.data as any;
      const emptyCreator: Creator = { id: '0', username: '', platform: 'onlyfans', stats: { followers: 0, avgLikes: 0, engagementRate: 0, niche: [], priceRange: '$' }, verified: true, lastActive: new Date() };
      return {
        id: data.dealId,
        type: data.type,
        initiator: { ...emptyCreator, id: insight.creatorId.toString(), username: 'self' },
        partner: { ...emptyCreator, id: data.partnerId, username: data.partnerUsername },
        status: data.status,
        terms: data.terms,
        performance: data.performance,
        messages: data.messages || [],
        createdAt: new Date(data.createdAt),
      };
    } catch { return null; }
  }
}

// SHOUTOUT BEST PRACTICES
export const SHOUTOUT_TIPS = {
  timing: ["Post when BOTH audiences are active", "Stories: 6-9pm weekdays", "Posts: Tuesday-Thursday perform best"],
  content: ["Use authentic excitement", "Show personality match", "Include clear CTA"],
  selection: ["Similar follower count = fair trade", "Check engagement rate", "Verify they're active"],
  tracking: ["Screenshot follower count before/after", "Use unique link tracking", "Follow up 24-48h after"]
};

export const shoutoutMarketplace = new ShoutoutMarketplace();
