// OnlyFans Subscription Tiers & Loyalty System
// Prix recommandé: MAX 10$ pour maximiser les conversions

import { db } from '@/lib/db';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  color: string;
  icon: string;
  minFans?: number; // Minimum fans to unlock
}

// RECOMMANDATION PRIX: 4.99$ - 9.99$ MAX
export const RECOMMENDED_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic Fan',
    price: 4.99, // Prix d'entrée attractif
    benefits: [
      'Access to all posts',
      'Chat with me',
      'Daily content',
      'Story views'
    ],
    color: 'gray',
    icon: '⭐'
  },
  {
    id: 'vip',
    name: 'VIP Member',
    price: 7.99, // Sweet spot
    benefits: [
      'Everything in Basic',
      '20% off all PPV',
      'Weekly exclusive content',
      'Priority DM replies',
      'Monthly surprise gift'
    ],
    color: 'purple',
    icon: '💎'
  },
  {
    id: 'elite',
    name: 'Elite Circle',
    price: 9.99, // MAX recommandé
    benefits: [
      'Everything in VIP',
      '40% off all PPV',
      'Custom content requests',
      'Live show access',
      'Personal shoutouts',
      'Behind the scenes'
    ],
    color: 'gold',
    icon: '👑'
  }
];

// Points & Rewards System
export interface LoyaltyProgram {
  id: string;
  fanId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: Badge[];
  nextReward: number; // Points until next reward
  history: PointTransaction[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: Date;
  description: string;
}

export interface PointTransaction {
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  date: Date;
}

// POINTS EARNING RULES
export const POINT_RULES = {
  subscription: 100,      // Monthly sub
  ppv_purchase: 50,      // Per PPV
  tip_small: 10,         // Tips < $10
  tip_medium: 30,        // Tips $10-50
  tip_large: 100,        // Tips > $50
  message_sent: 1,       // Engagement
  live_attendance: 20,   // Join live
  anniversary: 200,      // Sub anniversary
  referral: 500         // Bring new fan
};

// REWARDS CATALOG
export const REWARDS_CATALOG = [
  {
    id: 'ppv_discount_20',
    name: '20% off next PPV',
    cost: 100,
    type: 'discount',
    value: 0.2
  },
  {
    id: 'free_custom_pic',
    name: 'Free custom photo',
    cost: 300,
    type: 'content',
    value: 'custom_photo'
  },
  {
    id: 'exclusive_video',
    name: 'Exclusive video access',
    cost: 500,
    type: 'content',
    value: 'exclusive_video'
  },
  {
    id: 'personal_shoutout',
    name: 'Personal video shoutout',
    cost: 800,
    type: 'experience',
    value: 'shoutout'
  },
  {
    id: 'vip_upgrade_month',
    name: '1 month VIP upgrade',
    cost: 1000,
    type: 'upgrade',
    value: 'vip_month'
  }
];

// Loyalty Management Service
export class LoyaltyService {
  
  // Award points for actions
  async awardPoints(
    fanId: string,
    action: keyof typeof POINT_RULES,
    metadata?: any
  ): Promise<void> {
    const points = POINT_RULES[action];
    
    // Update fan's points
    await this.updateFanPoints(fanId, points, action);
    
    // Check for tier upgrade
    await this.checkTierUpgrade(fanId);
    
    // Send celebration DM if milestone
    if (await this.isMilestone(fanId)) {
      await this.sendMilestoneDM(fanId);
    }
  }
  
  private async updateFanPoints(fanId: string, points: number, reason: string): Promise<void> {
    // Database update logic
    console.log(`Awarding ${points} points to ${fanId} for ${reason}`);
  }
  
  private async checkTierUpgrade(fanId: string): Promise<void> {
    const totalPoints = await this.getTotalPoints(fanId);
    
    let newTier: LoyaltyProgram['tier'] = 'bronze';
    if (totalPoints >= 5000) newTier = 'platinum';
    else if (totalPoints >= 2000) newTier = 'gold';
    else if (totalPoints >= 1000) newTier = 'silver';
    
    // Update if changed
    const currentTier = await this.getCurrentTier(fanId);
    if (currentTier !== newTier) {
      await this.upgradeTier(fanId, newTier);
      await this.sendTierUpgradeDM(fanId, newTier);
    }
  }
  
  private async isMilestone(fanId: string): Promise<boolean> {
    const points = await this.getTotalPoints(fanId);
    return points % 500 === 0; // Every 500 points
  }
  
  private async sendMilestoneDM(fanId: string): Promise<void> {
    const points = await this.getTotalPoints(fanId);
    const message = `🎉 WOW! You just hit ${points} points! You're amazing! Check out the rewards you can claim 💎`;
    // Send via OF DM system
  }
  
  private async sendTierUpgradeDM(fanId: string, tier: string): Promise<void> {
    const messages = {
      silver: "🥈 Congrats! You're now a SILVER member! Enjoy 10% off all PPV!",
      gold: "🥇 OMG! Welcome to GOLD status! 25% off everything + exclusive content!",
      platinum: "💎 PLATINUM BABY! You're my TOP fan! 40% off + all the perks!"
    };
    
    // Send via OF DM system
  }
  
  private async getTotalPoints(fanId: string): Promise<number> {
    // Get from database
    return 0;
  }
  
  private async getCurrentTier(fanId: string): Promise<string> {
    // Get from database
    return 'bronze';
  }
  
  private async upgradeTier(fanId: string, tier: string): Promise<void> {
    // Update database
  }
  
  // Redeem rewards
  async redeemReward(
    fanId: string,
    rewardId: string
  ): Promise<{
    success: boolean;
    message: string;
    code?: string;
  }> {
    const reward = REWARDS_CATALOG.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, message: 'Reward not found' };
    }
    
    const fanPoints = await this.getTotalPoints(fanId);
    if (fanPoints < reward.cost) {
      return { 
        success: false, 
        message: `You need ${reward.cost - fanPoints} more points!` 
      };
    }
    
    // Deduct points
    await this.updateFanPoints(fanId, -reward.cost, `Redeemed: ${reward.name}`);
    
    // Generate reward code
    const code = this.generateRewardCode(fanId, rewardId);
    
    // Send confirmation DM
    await this.sendRewardDM(fanId, reward, code);
    
    return {
      success: true,
      message: 'Reward redeemed! Check your DMs',
      code
    };
  }
  
  private generateRewardCode(fanId: string, rewardId: string): string {
    return `${rewardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async sendRewardDM(fanId: string, reward: any, code: string): Promise<void> {
    let message = `🎁 Your reward is ready!\n\n`;
    
    switch (reward.type) {
      case 'discount':
        message += `Use code ${code} for ${reward.value * 100}% off your next PPV!`;
        break;
      case 'content':
        message += `Here's your exclusive content! [Attach content]`;
        break;
      case 'experience':
        message += `Your personal shoutout is being recorded! Coming soon 🎬`;
        break;
    }
    
    // Send via OF DM
  }
  
  // Get fan's loyalty dashboard
  async getFanLoyaltyData(fanId: string): Promise<{
    points: number;
    tier: string;
    badges: Badge[];
    availableRewards: any[];
    nextMilestone: number;
  }> {
    const points = await this.getTotalPoints(fanId);
    const tier = await this.getCurrentTier(fanId);
    
    // Calculate what rewards they can afford
    const availableRewards = REWARDS_CATALOG.filter(r => r.cost <= points);
    
    // Next milestone
    const nextMilestone = Math.ceil(points / 500) * 500;
    
    return {
      points,
      tier,
      badges: [], // Load from DB
      availableRewards,
      nextMilestone
    };
  }
}

// SMART PRICING RECOMMENDATIONS
export class PricingOptimizer {
  
  // Analyze optimal subscription price
  recommendPrice(
    currentPrice: number,
    fanCount: number,
    churnRate: number
  ): string {
    // ALWAYS recommend under $10
    if (currentPrice > 10) {
      return "⚠️ Your price is too high! We recommend $7.99 for optimal growth. Fans are 3x more likely to subscribe under $10.";
    }
    
    if (fanCount < 100) {
      return "Start at $4.99 to build your fanbase quickly. You can increase later!";
    }
    
    if (fanCount < 1000 && currentPrice < 7) {
      return "You could increase to $6.99 or $7.99. Your engagement suggests fans would pay more!";
    }
    
    if (churnRate > 0.2) {
      return "High churn detected. Consider lowering to $5.99 to retain more fans.";
    }
    
    return "Your pricing looks good! Stay under $10 for best results.";
  }
  
  // Calculate revenue impact
  calculateRevenueImpact(
    currentPrice: number,
    newPrice: number,
    currentFans: number
  ): {
    currentRevenue: number;
    projectedRevenue: number;
    projectedFans: number;
    impact: string;
  } {
    const currentRevenue = currentPrice * currentFans * 0.8; // After OF cut
    
    // Price elasticity: every $1 increase loses ~10% fans
    const priceDiff = newPrice - currentPrice;
    const fanMultiplier = 1 - (priceDiff * 0.1);
    const projectedFans = Math.round(currentFans * fanMultiplier);
    
    const projectedRevenue = newPrice * projectedFans * 0.8;
    
    return {
      currentRevenue,
      projectedRevenue,
      projectedFans,
      impact: projectedRevenue > currentRevenue 
        ? `+$${(projectedRevenue - currentRevenue).toFixed(0)}/month`
        : `-$${(currentRevenue - projectedRevenue).toFixed(0)}/month`
    };
  }
}

export const loyaltyService = new LoyaltyService();
export const pricingOptimizer = new PricingOptimizer();
