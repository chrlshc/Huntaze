// OnlyFans PPV (Pay-Per-View) Manager
// Handles PPV content creation, tracking, and analytics

import type { PPVContent, OfMassMessageCampaign, AudienceFilter } from '@/lib/types/onlyfans';
import { queueCampaignMessages } from '@/lib/queue/of-queue';

// Mock storage (replace with database)
const ppvContents = new Map<string, PPVContent[]>();
const ppvPurchases = new Map<string, Array<{
  contentId: string;
  fanId: string;
  price: number;
  purchasedAt: Date;
}>>();

export class PPVManager {
  // Create PPV content
  async createPPVContent(
    userId: string,
    data: Omit<PPVContent, 'id' | 'userId' | 'soldCount' | 'revenue' | 'createdAt' | 'updatedAt'>
  ): Promise<PPVContent> {
    const ppv: PPVContent = {
      id: `ppv_${Date.now()}`,
      userId,
      soldCount: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };

    const userContent = ppvContents.get(userId) || [];
    userContent.push(ppv);
    ppvContents.set(userId, userContent);

    return ppv;
  }

  // Get all PPV content for user
  async getPPVContent(userId: string): Promise<PPVContent[]> {
    return ppvContents.get(userId) || [];
  }

  // Get single PPV content
  async getPPVContentById(userId: string, contentId: string): Promise<PPVContent | null> {
    const userContent = ppvContents.get(userId) || [];
    return userContent.find(ppv => ppv.id === contentId) || null;
  }

  // Update PPV content
  async updatePPVContent(
    userId: string,
    contentId: string,
    updates: Partial<PPVContent>
  ): Promise<PPVContent | null> {
    const userContent = ppvContents.get(userId) || [];
    const index = userContent.findIndex(ppv => ppv.id === contentId);
    
    if (index === -1) return null;

    userContent[index] = {
      ...userContent[index],
      ...updates,
      updatedAt: new Date()
    };

    ppvContents.set(userId, userContent);
    return userContent[index];
  }

  // Create PPV campaign
  async createPPVCampaign(
    userId: string,
    ppvContentId: string,
    campaignData: {
      name: string;
      audienceFilter: AudienceFilter;
      scheduledAt?: Date;
      testMode?: boolean;
    }
  ): Promise<OfMassMessageCampaign | null> {
    const ppvContent = await this.getPPVContentById(userId, ppvContentId);
    if (!ppvContent) return null;

    // Create campaign with PPV content
    const campaign: OfMassMessageCampaign = {
      id: `campaign_ppv_${Date.now()}`,
      userId,
      name: campaignData.name,
      content: {
        text: ppvContent.content.text,
        media: ppvContent.content.media
      },
      audienceFilter: campaignData.audienceFilter,
      status: campaignData.scheduledAt ? 'scheduled' : 'draft',
      stats: {
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        queuedCount: 0
      },
      scheduledAt: campaignData.scheduledAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add PPV metadata to campaign
    const campaignWithPPV = {
      ...campaign,
      metadata: {
        type: 'ppv',
        ppvContentId,
        price: ppvContent.price,
        testMode: campaignData.testMode
      }
    };

    return campaignWithPPV;
  }

  // Track PPV purchase
  async trackPurchase(
    userId: string,
    contentId: string,
    fanId: string,
    price: number
  ): Promise<void> {
    // Record purchase
    const userPurchases = ppvPurchases.get(userId) || [];
    userPurchases.push({
      contentId,
      fanId,
      price,
      purchasedAt: new Date()
    });
    ppvPurchases.set(userId, userPurchases);

    // Update PPV content stats
    const ppvContent = await this.getPPVContentById(userId, contentId);
    if (ppvContent) {
      await this.updatePPVContent(userId, contentId, {
        soldCount: ppvContent.soldCount + 1,
        revenue: ppvContent.revenue + price
      });
    }
  }

  // Get PPV analytics
  async getPPVAnalytics(userId: string, period: '24h' | '7d' | '30d' | 'all'): Promise<{
    totalContent: number;
    totalRevenue: number;
    totalSold: number;
    averagePrice: number;
    conversionRate: number;
    topPerformers: Array<{
      content: PPVContent;
      revenue: number;
      conversionRate: number;
    }>;
    revenueByDay: Array<{
      date: string;
      revenue: number;
      sales: number;
    }>;
  }> {
    const content = ppvContents.get(userId) || [];
    const purchases = ppvPurchases.get(userId) || [];

    // Filter purchases by period
    const now = new Date();
    const filteredPurchases = purchases.filter(p => {
      if (period === 'all') return true;
      const daysAgo = period === '24h' ? 1 : period === '7d' ? 7 : 30;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return p.purchasedAt >= cutoff;
    });

    // Calculate metrics
    const totalRevenue = filteredPurchases.reduce((sum, p) => sum + p.price, 0);
    const totalSold = filteredPurchases.length;
    const averagePrice = totalSold > 0 ? totalRevenue / totalSold : 0;

    // Get top performers
    const contentStats = content.map(ppv => {
      const contentPurchases = filteredPurchases.filter(p => p.contentId === ppv.id);
      const revenue = contentPurchases.reduce((sum, p) => sum + p.price, 0);
      const sent = 100; // Mock - would come from campaign stats
      const conversionRate = sent > 0 ? (contentPurchases.length / sent) * 100 : 0;

      return {
        content: ppv,
        revenue,
        conversionRate
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Revenue by day
    const revenueByDay = this.calculateRevenueByDay(filteredPurchases, period);

    // Overall conversion rate (mock)
    const totalSent = 1000; // Would come from campaign stats
    const conversionRate = totalSent > 0 ? (totalSold / totalSent) * 100 : 0;

    return {
      totalContent: content.length,
      totalRevenue,
      totalSold,
      averagePrice,
      conversionRate,
      topPerformers: contentStats,
      revenueByDay
    };
  }

  // Calculate revenue by day
  private calculateRevenueByDay(
    purchases: Array<{ price: number; purchasedAt: Date }>,
    period: string
  ): Array<{ date: string; revenue: number; sales: number }> {
    const dayMap = new Map<string, { revenue: number; sales: number }>();

    purchases.forEach(purchase => {
      const dateKey = purchase.purchasedAt.toISOString().split('T')[0];
      const existing = dayMap.get(dateKey) || { revenue: 0, sales: 0 };
      dayMap.set(dateKey, {
        revenue: existing.revenue + purchase.price,
        sales: existing.sales + 1
      });
    });

    return Array.from(dayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get best performing PPV content
  async getBestPerformers(userId: string, limit: number = 5): Promise<PPVContent[]> {
    const content = ppvContents.get(userId) || [];
    return content
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // Get PPV templates
  getPPVTemplates(): Array<{
    name: string;
    category: string;
    priceRange: { min: number; max: number };
    template: {
      text: string;
      mediaCount: number;
    };
  }> {
    return [
      {
        name: 'Exclusive Photo Set',
        category: 'photos',
        priceRange: { min: 10, max: 30 },
        template: {
          text: `🔥 EXCLUSIVE CONTENT ALERT 🔥

I just created something special just for you... {count} never-before-seen photos that are way too hot for my feed 🥵

Unlock now for only {price} and see why everyone's been begging for more 😈

This deal won't last long babe! 💋`,
          mediaCount: 5
        }
      },
      {
        name: 'Premium Video',
        category: 'video',
        priceRange: { min: 20, max: 50 },
        template: {
          text: `🎥 NEW VIDEO DROP 🎥

You've been asking and I finally delivered... My hottest {duration} minute video yet! 

Trust me, this is exactly what you've been craving 🔥

Unlock for {price} and let me show you what you've been missing 😏

⏰ Limited time - price goes up tomorrow!`,
          mediaCount: 1
        }
      },
      {
        name: 'Custom Bundle',
        category: 'bundle',
        priceRange: { min: 40, max: 100 },
        template: {
          text: `💎 VIP BUNDLE DEAL 💎

I'm feeling generous today... Get my ENTIRE collection:
✨ {photoCount} exclusive photos
✨ {videoCount} full-length videos  
✨ Plus a special surprise just for you!

Normal price: {normalPrice}
Your price TODAY: {price} (Save {savings}!)

This is my best deal EVER - don't miss out! 🎁`,
          mediaCount: 10
        }
      }
    ];
  }
}

// Export singleton
export const ppvManager = new PPVManager();

// Helper function to format PPV message
export function formatPPVMessage(template: string, values: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return values[key] || match;
  });
}
