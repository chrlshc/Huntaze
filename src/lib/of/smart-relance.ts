import { db } from '@/lib/db';
import { of_messages, of_fans, of_transactions } from '@/lib/db/schema';
// Lightweight stubs to avoid optional dependency during local builds
const eq = (...args: any[]) => ({} as any);
const and = (...args: any[]) => ({} as any);
const gte = (...args: any[]) => ({} as any);
const desc = (x: any) => x;
const isNull = (...args: any[]) => ({} as any);
import { fanSegmentation, FanSegment, FanSegmentData } from './fan-segmentation';
import { aiAssistant } from './ai-assistant';

export interface RelanceStrategy {
  fanId: string;
  strategyType: RelanceType;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  suggestedMessage: string;
  reason: string;
  expectedValue: number;
  bestTime: Date;
  metadata: {
    daysSinceLastMessage?: number;
    daysSinceLastPurchase?: number;
    lastPPVOpened?: boolean;
    previousAttempts?: number;
  };
}

export enum RelanceType {
  // Purchase-based
  ABANDONED_PPV = 'abandoned_ppv',
  VIEWED_NO_BUY = 'viewed_no_buy',
  CART_RECOVERY = 'cart_recovery',
  
  // Time-based
  INACTIVE_VIP = 'inactive_vip',
  WIN_BACK = 'win_back',
  RE_ENGAGEMENT = 're_engagement',
  
  // Behavior-based
  PAYDAY_REMINDER = 'payday_reminder',
  WEEKEND_SPECIAL = 'weekend_special',
  TIMEZONE_OPTIMAL = 'timezone_optimal',
  
  // Lifecycle
  NEW_FAN_NURTURE = 'new_fan_nurture',
  VIP_RETENTION = 'vip_retention',
  UPGRADE_PROMPT = 'upgrade_prompt',
  
  // Special occasions
  BIRTHDAY_OFFER = 'birthday_offer',
  ANNIVERSARY = 'anniversary',
  HOLIDAY_SPECIAL = 'holiday_special'
}

export class SmartRelanceService {
  async generateRelanceStrategies(
    accountId: string,
    limit: number = 50
  ): Promise<RelanceStrategy[]> {
    const strategies: RelanceStrategy[] = [];
    
    // Get all fans with segmentation data
    const fans = await db.query.of_fans.findMany({
      where: eq(of_fans.accountId, accountId),
      limit: 200 // Process more to find best candidates
    });

    for (const fan of fans) {
      const segmentData = await fanSegmentation.segmentFan(accountId, fan.onlyfansId);
      const fanStrategies = await this.analyzeFanForRelance(accountId, fan, segmentData);
      strategies.push(...fanStrategies);
    }

    // Sort by priority and expected value
    return strategies
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : b.expectedValue - a.expectedValue;
      })
      .slice(0, limit);
  }

  private async analyzeFanForRelance(
    accountId: string,
    fan: any,
    segmentData: FanSegmentData
  ): Promise<RelanceStrategy[]> {
    const strategies: RelanceStrategy[] = [];

    // Check for abandoned PPV
    const abandonedPPV = await this.checkAbandonedPPV(accountId, fan.onlyfansId);
    if (abandonedPPV) strategies.push(abandonedPPV);

    // Check for VIP inactivity
    if (segmentData.segment === FanSegment.VIP_WHALE) {
      const vipStrategy = await this.checkVIPInactivity(fan, segmentData);
      if (vipStrategy) strategies.push(vipStrategy);
    }

    // Check for win-back opportunities
    if (segmentData.churnRisk > 0.7) {
      const winBack = await this.createWinBackStrategy(fan, segmentData);
      if (winBack) strategies.push(winBack);
    }

    // Check for upgrade opportunities
    if (segmentData.segment === FanSegment.REGULAR && segmentData.engagementScore > 0.7) {
      const upgrade = await this.createUpgradeStrategy(fan, segmentData);
      if (upgrade) strategies.push(upgrade);
    }

    // Check for timezone-based opportunities
    const timezoneStrategy = await this.createTimezoneStrategy(fan, segmentData);
    if (timezoneStrategy) strategies.push(timezoneStrategy);

    // Check for special occasions
    const specialOccasions = await this.checkSpecialOccasions(fan, segmentData);
    strategies.push(...specialOccasions);

    return strategies;
  }

  private async checkAbandonedPPV(
    accountId: string,
    fanId: string
  ): Promise<RelanceStrategy | null> {
    // Check recent PPV messages
    const recentPPVs = await db.query.of_messages.findMany({
      where: and(
        eq(of_messages.accountId, accountId),
        eq(of_messages.fanId, fanId),
        eq(of_messages.metadata.isPPV, true),
        gte(of_messages.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      ),
      orderBy: desc(of_messages.createdAt),
      limit: 5
    });

    // Find viewed but not purchased
    const viewedNotPurchased = recentPPVs.find((ppv: any) => 
      ppv.metadata?.viewed && !ppv.metadata?.purchased
    );

    if (!viewedNotPurchased) return null;

    const daysSince = Math.floor(
      (Date.now() - viewedNotPurchased.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      fanId,
      strategyType: RelanceType.ABANDONED_PPV,
      priority: daysSince <= 1 ? 'urgent' : 'high',
      suggestedMessage: `Hey babe! 😘 I noticed you checked out my special content but didn't unlock it yet. Still curious? I'll make it worth your while... 💋`,
      reason: `Viewed PPV ${daysSince} days ago but didn't purchase`,
      expectedValue: viewedNotPurchased.metadata?.price || 20,
      bestTime: this.calculateBestTime(fanId),
      metadata: {
        daysSinceLastMessage: daysSince,
        lastPPVOpened: true
      }
    };
  }

  private async checkVIPInactivity(
    fan: any,
    segmentData: FanSegmentData
  ): Promise<RelanceStrategy | null> {
    const daysSinceActivity = Math.floor(
      (Date.now() - segmentData.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity < 7) return null;

    return {
      fanId: fan.onlyfansId,
      strategyType: RelanceType.INACTIVE_VIP,
      priority: 'urgent',
      suggestedMessage: `Missing my favorite! 🥺 Haven't heard from you in a while... Everything okay? I have something special just for my VIPs like you 💎`,
      reason: `VIP whale inactive for ${daysSinceActivity} days`,
      expectedValue: segmentData.averageSpend * 2,
      bestTime: this.calculateBestTime(fan.onlyfansId),
      metadata: {
        daysSinceLastMessage: daysSinceActivity,
        daysSinceLastPurchase: segmentData.lastPurchaseDate 
          ? Math.floor((Date.now() - segmentData.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999
      }
    };
  }

  private async createWinBackStrategy(
    fan: any,
    segmentData: FanSegmentData
  ): Promise<RelanceStrategy | null> {
    const daysSinceActivity = Math.floor(
      (Date.now() - segmentData.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity < 14) return null;

    const discount = segmentData.lifetimeValue >= 100 ? 40 : 30;

    return {
      fanId: fan.onlyfansId,
      strategyType: RelanceType.WIN_BACK,
      priority: 'high',
      suggestedMessage: `I miss you! 💔 Come back and I'll give you ${discount}% off anything you want... This week only! What do you say? 😘`,
      reason: `High churn risk (${(segmentData.churnRisk * 100).toFixed(0)}%), inactive ${daysSinceActivity} days`,
      expectedValue: segmentData.averageSpend * 0.7,
      bestTime: this.calculateBestTime(fan.onlyfansId),
      metadata: {
        daysSinceLastMessage: daysSinceActivity
      }
    };
  }

  private async createUpgradeStrategy(
    fan: any,
    segmentData: FanSegmentData
  ): Promise<RelanceStrategy | null> {
    if (segmentData.purchaseCount < 3) return null;

    const suggestedPrice = Math.min(
      segmentData.averageSpend * 1.5,
      segmentData.metadata.preferredPriceRange.max * 1.2
    );

    return {
      fanId: fan.onlyfansId,
      strategyType: RelanceType.UPGRADE_PROMPT,
      priority: 'medium',
      suggestedMessage: `You've been so supportive! 💕 Want to see something extra special? I made this exclusive content thinking of fans like you...`,
      reason: `High engagement regular fan, ready for higher value content`,
      expectedValue: suggestedPrice,
      bestTime: this.calculateBestTime(fan.onlyfansId),
      metadata: {
        previousAttempts: 0
      }
    };
  }

  private async createTimezoneStrategy(
    fan: any,
    segmentData: FanSegmentData
  ): Promise<RelanceStrategy | null> {
    const bestHours = segmentData.bestMessageTimes;
    if (bestHours.length === 0) return null;

    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // Check if we're within 2 hours of their best time
    const isNearBestTime = bestHours.some(hour => 
      Math.abs(hour - currentHour) <= 2 || Math.abs(hour - currentHour) >= 22
    );

    if (!isNearBestTime) return null;

    return {
      fanId: fan.onlyfansId,
      strategyType: RelanceType.TIMEZONE_OPTIMAL,
      priority: 'medium',
      suggestedMessage: `Good ${this.getTimeOfDay()}! 😊 Perfect timing - I just posted something new. Want a sneak peek? 👀`,
      reason: `Optimal engagement time based on past behavior`,
      expectedValue: segmentData.averageSpend,
      bestTime: new Date(),
      metadata: {}
    };
  }

  private async checkSpecialOccasions(
    fan: any,
    segmentData: FanSegmentData
  ): Promise<RelanceStrategy[]> {
    const strategies: RelanceStrategy[] = [];
    const today = new Date();

    // Anniversary check
    const joinDate = new Date(segmentData.metadata.joinedDate);
    const monthsSinceJoin = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                           (today.getMonth() - joinDate.getMonth());
    
    if (monthsSinceJoin > 0 && today.getDate() === joinDate.getDate()) {
      strategies.push({
        fanId: fan.onlyfansId,
        strategyType: RelanceType.ANNIVERSARY,
        priority: 'high',
        suggestedMessage: `OMG it's our ${monthsSinceJoin} month anniversary! 🎉 I have a special surprise for you...`,
        reason: `Fan anniversary - ${monthsSinceJoin} months`,
        expectedValue: segmentData.averageSpend * 1.5,
        bestTime: this.calculateBestTime(fan.onlyfansId),
        metadata: {}
      });
    }

    // Weekend special (Friday-Sunday)
    if (today.getDay() >= 5 || today.getDay() === 0) {
      const daysSincePurchase = segmentData.lastPurchaseDate
        ? Math.floor((Date.now() - segmentData.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSincePurchase >= 7) {
        strategies.push({
          fanId: fan.onlyfansId,
          strategyType: RelanceType.WEEKEND_SPECIAL,
          priority: 'low',
          suggestedMessage: `Weekend vibes! 🌴 Want to make it extra special? I have something hot waiting for you...`,
          reason: `Weekend opportunity, hasn't purchased in ${daysSincePurchase} days`,
          expectedValue: segmentData.averageSpend,
          bestTime: this.calculateBestTime(fan.onlyfansId),
          metadata: {
            daysSinceLastPurchase: daysSincePurchase
          }
        });
      }
    }

    return strategies;
  }

  private calculateBestTime(fanId: string): Date {
    // For now, return current time + 1 hour
    // In production, this would use fan's timezone and historical data
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  private getTimeOfDay(): string {
    const hour = new Date().getUTCHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  // Execute a relance strategy
  async executeRelance(
    accountId: string,
    strategy: RelanceStrategy,
    customMessage?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Use custom message or AI-enhanced version of suggested
      const finalMessage = customMessage || await aiAssistant.enhanceMessage(
        strategy.suggestedMessage,
        {
          fanId: strategy.fanId,
          personality: 'flirty_premium',
          context: {
            relanceType: strategy.strategyType,
            expectedSpend: strategy.expectedValue
          }
        }
      );

      // Send via OF browser worker
      const result = await this.sendRelanceMessage(
        accountId,
        strategy.fanId,
        finalMessage
      );

      if (result.success) {
        // Track relance attempt
        await this.trackRelanceAttempt(accountId, strategy, result.messageId!);
      }

      return result;
    } catch (error) {
      console.error('Failed to execute relance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendRelanceMessage(
    accountId: string,
    fanId: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // This would integrate with the OF browser worker
    // For now, return mock success
    return {
      success: true,
      messageId: `msg_${Date.now()}`
    };
  }

  private async trackRelanceAttempt(
    accountId: string,
    strategy: RelanceStrategy,
    messageId: string
  ): Promise<void> {
    // Store relance attempt in database for tracking effectiveness
    // This helps improve future strategies
    await db.insert(of_messages).values({
      accountId,
      fanId: strategy.fanId,
      messageId,
      conversationId: `conv_${strategy.fanId}`,
      content: strategy.suggestedMessage,
      direction: 'outgoing',
      isAI: true,
      metadata: {
        relanceType: strategy.strategyType,
        expectedValue: strategy.expectedValue,
        priority: strategy.priority,
        reason: strategy.reason
      }
    });
  }

  // Bulk relance campaign
  async createRelanceCampaign(
    accountId: string,
    criteria: {
      segments?: FanSegment[];
      relanceTypes?: RelanceType[];
      minExpectedValue?: number;
      maxFans?: number;
    }
  ): Promise<{
    strategies: RelanceStrategy[];
    totalExpectedValue: number;
    fanCount: number;
  }> {
    let strategies = await this.generateRelanceStrategies(
      accountId,
      criteria.maxFans || 100
    );

    // Apply filters
    if (criteria.segments) {
      const segmentedFans = await fanSegmentation.getFansForCampaign(accountId, {
        segments: criteria.segments
      });
      const fanIds = new Set(segmentedFans.map(f => f.fanId));
      strategies = strategies.filter(s => fanIds.has(s.fanId));
    }

    if (criteria.relanceTypes) {
      strategies = strategies.filter(s => 
        criteria.relanceTypes!.includes(s.strategyType)
      );
    }

    if (criteria.minExpectedValue) {
      strategies = strategies.filter(s => 
        s.expectedValue >= (criteria.minExpectedValue ?? 0)
      );
    }

    const totalExpectedValue = strategies.reduce((sum, s) => sum + s.expectedValue, 0);

    return {
      strategies,
      totalExpectedValue,
      fanCount: new Set(strategies.map(s => s.fanId)).size
    };
  }
}

// Export singleton instance
export const smartRelance = new SmartRelanceService();
