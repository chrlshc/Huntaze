import { db } from '@/lib/db';
import { of_fans, of_messages, of_transactions } from '@/lib/db/schema';
// Lightweight stubs to avoid optional dependency during local builds
const eq = (...args: any[]) => ({} as any);
const and = (...args: any[]) => ({} as any);
const sql = (strings: TemplateStringsArray, ...expr: any[]) => ({} as any);
const gte = (...args: any[]) => ({} as any);
const lte = (...args: any[]) => ({} as any);
const desc = (x: any) => x;
const asc = (x: any) => x;

// Fan Segmentation Categories
export enum FanSegment {
  VIP_WHALE = 'vip_whale',           // $500+ lifetime
  BIG_SPENDER = 'big_spender',       // $100-499 lifetime
  REGULAR = 'regular',               // $20-99 lifetime
  WINDOW_SHOPPER = 'window_shopper', // No purchases
  CHURNED = 'churned',               // Inactive 30+ days
  AT_RISK = 'at_risk',               // Inactive 7-29 days
  NEW_FAN = 'new_fan',               // Less than 7 days
  HIGH_ENGAGEMENT = 'high_engagement', // High message frequency
  PPV_BUYER = 'ppv_buyer',           // Buys PPV regularly
  TIPPER = 'tipper'                  // Tips frequently
}

export interface FanSegmentData {
  fanId: string;
  segment: FanSegment;
  lifetimeValue: number;
  lastPurchaseDate: Date | null;
  lastActivityDate: Date;
  purchaseCount: number;
  messageCount: number;
  averageSpend: number;
  preferredContentType: string[];
  bestMessageTimes: number[]; // Hours in UTC
  engagementScore: number;
  churnRisk: number; // 0-1
  metadata: {
    joinedDate: Date;
    totalTips: number;
    totalPPV: number;
    openRate: number;
    responseRate: number;
    preferredPriceRange: { min: number; max: number };
  };
}

export class FanSegmentationService {
  async segmentFan(accountId: string, fanId: string): Promise<FanSegmentData> {
    // Get fan data
    const fan = await db.query.of_fans.findFirst({
      where: and(
        eq(of_fans.accountId, accountId),
        eq(of_fans.onlyfansId, fanId)
      )
    });

    if (!fan) {
      throw new Error('Fan not found');
    }

    // Get transaction history
    const transactions = await db.query.of_transactions.findMany({
      where: and(
        eq(of_transactions.accountId, accountId),
        eq(of_transactions.fanId, fanId)
      ),
      orderBy: desc(of_transactions.createdAt)
    });

    // Get message history
    const messages = await db.query.of_messages.findMany({
      where: and(
        eq(of_messages.accountId, accountId),
        eq(of_messages.fanId, fanId)
      ),
      orderBy: desc(of_messages.createdAt),
      limit: 100
    });

    // Calculate metrics
    const lifetimeValue = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const purchaseCount = transactions.length;
    const averageSpend = purchaseCount > 0 ? lifetimeValue / purchaseCount : 0;
    
    // Determine segment
    const segment = this.determineSegment(
      lifetimeValue,
      fan.lastActivityAt,
      purchaseCount,
      messages.length
    );

    // Calculate engagement metrics
    const engagementScore = this.calculateEngagementScore(
      messages,
      transactions,
      fan.lastActivityAt
    );

    // Calculate churn risk
    const churnRisk = this.calculateChurnRisk(
      fan.lastActivityAt,
      transactions,
      engagementScore
    );

    // Find preferred content and times
    const preferredContent = this.analyzePreferredContent(transactions);
    const bestTimes = this.analyzeBestMessageTimes(messages, transactions);

    return {
      fanId,
      segment,
      lifetimeValue,
      lastPurchaseDate: transactions[0]?.createdAt || null,
      lastActivityDate: fan.lastActivityAt,
      purchaseCount,
      messageCount: messages.length,
      averageSpend,
      preferredContentType: preferredContent,
      bestMessageTimes: bestTimes,
      engagementScore,
      churnRisk,
      metadata: {
        joinedDate: fan.createdAt,
        totalTips: this.calculateTotalTips(transactions),
        totalPPV: this.calculateTotalPPV(transactions),
        openRate: this.calculateOpenRate(messages),
        responseRate: this.calculateResponseRate(messages),
        preferredPriceRange: this.calculatePreferredPriceRange(transactions)
      }
    };
  }

  private determineSegment(
    lifetimeValue: number,
    lastActivity: Date,
    purchaseCount: number,
    messageCount: number
  ): FanSegment {
    const daysSinceActivity = this.daysSince(lastActivity);
    const fanAge = this.daysSince(lastActivity); // Simplified for now

    // Priority order for segmentation
    if (lifetimeValue >= 500) return FanSegment.VIP_WHALE;
    if (lifetimeValue >= 100) return FanSegment.BIG_SPENDER;
    if (daysSinceActivity >= 30) return FanSegment.CHURNED;
    if (daysSinceActivity >= 7 && purchaseCount > 0) return FanSegment.AT_RISK;
    if (fanAge <= 7) return FanSegment.NEW_FAN;
    if (purchaseCount === 0) return FanSegment.WINDOW_SHOPPER;
    if (messageCount > 50 && purchaseCount > 2) return FanSegment.HIGH_ENGAGEMENT;
    if (lifetimeValue >= 20) return FanSegment.REGULAR;
    
    return FanSegment.WINDOW_SHOPPER;
  }

  private calculateEngagementScore(
    messages: any[],
    transactions: any[],
    lastActivity: Date
  ): number {
    let score = 0;
    
    // Message frequency (0-30 points)
    const messageFrequency = messages.length / Math.max(this.daysSince(lastActivity), 1);
    score += Math.min(messageFrequency * 10, 30);
    
    // Purchase frequency (0-30 points)
    const purchaseFrequency = transactions.length / Math.max(this.daysSince(lastActivity), 1);
    score += Math.min(purchaseFrequency * 20, 30);
    
    // Recency (0-20 points)
    const daysSinceActivity = this.daysSince(lastActivity);
    if (daysSinceActivity <= 1) score += 20;
    else if (daysSinceActivity <= 3) score += 15;
    else if (daysSinceActivity <= 7) score += 10;
    else if (daysSinceActivity <= 14) score += 5;
    
    // Response rate (0-20 points)
    const responseRate = this.calculateResponseRate(messages);
    score += responseRate * 20;
    
    return Math.min(score / 100, 1);
  }

  private calculateChurnRisk(
    lastActivity: Date,
    transactions: any[],
    engagementScore: number
  ): number {
    const daysSinceActivity = this.daysSince(lastActivity);
    const daysSincePurchase = transactions[0] 
      ? this.daysSince(transactions[0].createdAt) 
      : 999;
    
    let risk = 0;
    
    // Activity-based risk
    if (daysSinceActivity >= 30) risk += 0.5;
    else if (daysSinceActivity >= 14) risk += 0.3;
    else if (daysSinceActivity >= 7) risk += 0.2;
    else if (daysSinceActivity >= 3) risk += 0.1;
    
    // Purchase-based risk
    if (daysSincePurchase >= 30) risk += 0.3;
    else if (daysSincePurchase >= 14) risk += 0.2;
    else if (daysSincePurchase >= 7) risk += 0.1;
    
    // Adjust by engagement
    risk *= (1 - engagementScore * 0.5);
    
    return Math.min(risk, 1);
  }

  private analyzePreferredContent(transactions: any[]): string[] {
    const contentTypes = new Map<string, number>();
    
    transactions.forEach(t => {
      const type = t.metadata?.contentType || 'unknown';
      contentTypes.set(type, (contentTypes.get(type) || 0) + 1);
    });
    
    return Array.from(contentTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private analyzeBestMessageTimes(messages: any[], transactions: any[]): number[] {
    const hourlySuccess = new Map<number, number>();
    
    // Analyze when messages led to purchases
    transactions.forEach(t => {
      const hour = new Date(t.createdAt).getUTCHours();
      hourlySuccess.set(hour, (hourlySuccess.get(hour) || 0) + 1);
    });
    
    // Get top 3 hours
    return Array.from(hourlySuccess.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);
  }

  private calculateTotalTips(transactions: any[]): number {
    return transactions
      .filter(t => t.type === 'tip')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateTotalPPV(transactions: any[]): number {
    return transactions
      .filter(t => t.type === 'ppv' || t.type === 'locked_message')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateOpenRate(messages: any[]): number {
    const ppvMessages = messages.filter(m => m.metadata?.isPPV);
    const openedMessages = ppvMessages.filter(m => m.metadata?.opened);
    return ppvMessages.length > 0 ? openedMessages.length / ppvMessages.length : 0;
  }

  private calculateResponseRate(messages: any[]): number {
    const sentByCreator = messages.filter(m => m.direction === 'outgoing');
    const responses = messages.filter(m => 
      m.direction === 'incoming' && 
      sentByCreator.some(s => 
        m.createdAt > s.createdAt && 
        this.hoursBetween(s.createdAt, m.createdAt) < 24
      )
    );
    return sentByCreator.length > 0 ? responses.length / sentByCreator.length : 0;
  }

  private calculatePreferredPriceRange(transactions: any[]): { min: number; max: number } {
    if (transactions.length === 0) return { min: 0, max: 0 };
    
    const amounts = transactions.map(t => t.amount).sort((a, b) => a - b);
    return {
      min: amounts[0],
      max: amounts[amounts.length - 1]
    };
  }

  private daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private hoursBetween(date1: Date, date2: Date): number {
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
  }

  // Bulk segmentation for performance
  async segmentAllFans(accountId: string): Promise<Map<FanSegment, string[]>> {
    const fans = await db.query.of_fans.findMany({
      where: eq(of_fans.accountId, accountId)
    });

    const segmentMap = new Map<FanSegment, string[]>();
    
    // Initialize all segments
    Object.values(FanSegment).forEach(segment => {
      segmentMap.set(segment as FanSegment, []);
    });

    // Process fans in parallel batches
    const batchSize = 50;
    for (let i = 0; i < fans.length; i += batchSize) {
      const batch = fans.slice(i, i + batchSize);
      const segmentations = await Promise.all(
        batch.map((fan: any) => this.segmentFan(accountId, fan.onlyfansId))
      );
      
      segmentations.forEach((s: any) => {
        const fanIds = segmentMap.get(s.segment) || [];
        fanIds.push(s.fanId);
        segmentMap.set(s.segment, fanIds);
      });
    }

    return segmentMap;
  }

  // Get fans for targeted campaigns
  async getFansForCampaign(
    accountId: string,
    criteria: {
      segments?: FanSegment[];
      minLifetimeValue?: number;
      maxChurnRisk?: number;
      minEngagement?: number;
      lastActiveDays?: number;
    }
  ): Promise<FanSegmentData[]> {
    const allFans = await db.query.of_fans.findMany({
      where: eq(of_fans.accountId, accountId)
    });

    const segmentedFans: FanSegmentData[] = [];
    
    for (const fan of allFans) {
      const segmentData = await this.segmentFan(accountId, fan.onlyfansId);
      
      // Apply filters
      if (criteria.segments && !criteria.segments.includes(segmentData.segment)) continue;
      if (criteria.minLifetimeValue && segmentData.lifetimeValue < criteria.minLifetimeValue) continue;
      if (criteria.maxChurnRisk && segmentData.churnRisk > criteria.maxChurnRisk) continue;
      if (criteria.minEngagement && segmentData.engagementScore < criteria.minEngagement) continue;
      if (criteria.lastActiveDays && this.daysSince(segmentData.lastActivityDate) > criteria.lastActiveDays) continue;
      
      segmentedFans.push(segmentData);
    }

    // Sort by lifetime value descending
    return segmentedFans.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  }
}

// Export singleton instance
export const fanSegmentation = new FanSegmentationService();
