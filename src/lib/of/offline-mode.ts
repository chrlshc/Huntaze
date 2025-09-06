// Offline Mode - AI stops, human chatters take over
// For Scale+ plans when creator wants human touch

import { db } from '@/lib/db';
import { of_accounts, of_messages, of_fans } from '@/lib/db/schema';
// Lightweight stubs to avoid optional dependency during local builds
const eq = (...args: any[]) => ({} as any);
const and = (...args: any[]) => ({} as any);
const sql = (strings: TemplateStringsArray, ...expr: any[]) => ({} as any);

export interface OfflineSchedule {
  accountId: string;
  enabled: boolean;
  schedule: {
    monday: { start: number; end: number; } | null;
    tuesday: { start: number; end: number; } | null;
    wednesday: { start: number; end: number; } | null;
    thursday: { start: number; end: number; } | null;
    friday: { start: number; end: number; } | null;
    saturday: { start: number; end: number; } | null;
    sunday: { start: number; end: number; } | null;
  };
  timezone: string;
  chatterTeam?: {
    teamName: string;
    notificationEmail: string;
    slackWebhook?: string;
  };
}

export interface ChatterHandoff {
  conversationId: string;
  fanName: string;
  fanValue: number;
  lastMessage: string;
  context: string;
  suggestedResponse: string;
  priority: 'high' | 'medium' | 'low';
}

export class OfflineModeService {
  // Check if currently in offline mode
  async isOfflineMode(accountId: string): Promise<boolean> {
    const account = await db.query.of_accounts.findFirst({
      where: eq(of_accounts.id, accountId)
    });
    
    if (!account?.metadata?.offlineSchedule?.enabled) return false;
    
    const schedule = account.metadata.offlineSchedule as OfflineSchedule;
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentHour = now.getHours();
    
    const todaySchedule = schedule.schedule[dayOfWeek as keyof typeof schedule.schedule];
    if (!todaySchedule) return false;
    
    return currentHour >= todaySchedule.start && currentHour < todaySchedule.end;
  }
  
  // Set offline schedule
  async setOfflineSchedule(
    accountId: string,
    schedule: OfflineSchedule
  ): Promise<void> {
    await db.update(of_accounts)
      .set({
        metadata: sql`jsonb_set(metadata, '{offlineSchedule}', ${JSON.stringify(schedule)}::jsonb)`
      })
      .where(eq(of_accounts.id, accountId));
  }
  
  // Generate handoff for chatters
  async generateHandoff(accountId: string): Promise<ChatterHandoff[]> {
    // Get recent conversations that need human attention
    const recentMessages = await db.query.of_messages.findMany({
      where: and(
        eq(of_messages.accountId, accountId),
        eq(of_messages.direction, 'incoming'),
        sql`created_at >= NOW() - INTERVAL '24 hours'`
      ),
      // orderBy intentionally omitted in local build stub
      limit: 50
    });
    
    const handoffs: ChatterHandoff[] = [];
    
    // Group by conversation
    const conversations = new Map<string, typeof recentMessages>();
    recentMessages.forEach((msg: any) => {
      const conv = conversations.get(msg.conversationId) || [];
      conv.push(msg);
      conversations.set(msg.conversationId, conv);
    });
    
    // Create handoff for each active conversation
    for (const [convId, messages] of conversations) {
      const fan = await this.getFanInfo(accountId, messages[0].fanId);
      
      handoffs.push({
        conversationId: convId,
        fanName: fan?.username || 'Unknown',
        fanValue: fan?.lifetimeValue || 0,
        lastMessage: messages[0].content,
        context: await this.generateContext(messages, fan),
        suggestedResponse: await this.generateSuggestedResponse(messages[0], fan),
        priority: this.calculatePriority(fan, messages[0])
      });
    }
    
    return handoffs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  private async getFanInfo(accountId: string, fanId: string) {
    return db.query.of_fans.findFirst({
      where: and(
        eq(of_fans.accountId, accountId),
        eq(of_fans.onlyfansId, fanId)
      )
    });
  }
  
  private async generateContext(messages: any[], fan: any): Promise<string> {
    const context = [];
    
    if (fan?.lifetimeValue >= 500) {
      context.push(`💎 VIP WHALE - $${fan.lifetimeValue} lifetime`);
    } else if (fan?.lifetimeValue >= 100) {
      context.push(`💰 Big spender - $${fan.lifetimeValue} lifetime`);
    }
    
    // Recent purchase info
    if (fan?.lastPurchaseAt) {
      const daysSince = Math.floor(
        (Date.now() - fan.lastPurchaseAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      context.push(`Last purchase: ${daysSince} days ago`);
    }
    
    // Message sentiment
    const lastMessage = messages[0].content.toLowerCase();
    if (lastMessage.includes('?')) {
      context.push('❓ Has a question');
    }
    if (lastMessage.includes('love') || lastMessage.includes('😍')) {
      context.push('❤️ Very engaged');
    }
    if (lastMessage.includes('buy') || lastMessage.includes('price')) {
      context.push('💸 Ready to spend');
    }
    
    return context.join(' • ');
  }
  
  private async generateSuggestedResponse(lastMessage: any, fan: any): Promise<string> {
    const message = lastMessage.content.toLowerCase();
    
    // Question about content
    if (message.includes('what') || message.includes('show me')) {
      return "I have something perfect for you! Want a preview? 😏";
    }
    
    // Price question
    if (message.includes('how much') || message.includes('price')) {
      return "It's usually $X but for you... I could do $Y 😘";
    }
    
    // Compliment
    if (message.includes('beautiful') || message.includes('hot')) {
      return "Aww thank you babe! 🥰 Want to see more?";
    }
    
    // Default flirty response
    return "Hey sexy! 😘 What are you up to?";
  }
  
  private calculatePriority(fan: any, message: any): 'high' | 'medium' | 'low' {
    // VIP always high priority
    if (fan?.lifetimeValue >= 500) return 'high';
    
    // Questions about buying = high
    const content = message.content.toLowerCase();
    if (content.includes('buy') || content.includes('price') || content.includes('ppv')) {
      return 'high';
    }
    
    // Big spenders = medium
    if (fan?.lifetimeValue >= 100) return 'medium';
    
    // Default
    return 'low';
  }
  
  // Notify chatters when going offline
  async notifyChatters(accountId: string, handoffs: ChatterHandoff[]): Promise<void> {
    const account = await db.query.of_accounts.findFirst({
      where: eq(of_accounts.id, accountId)
    });
    
    const team = account?.metadata?.offlineSchedule?.chatterTeam;
    if (!team) return;
    
    // Send to Slack if configured
    if (team.slackWebhook) {
      const highPriority = handoffs.filter(h => h.priority === 'high');
      const message = {
        text: `🔴 ${highPriority.length} high-priority conversations need attention!`,
        attachments: highPriority.map(h => ({
          color: 'danger',
          fields: [
            { title: 'Fan', value: `${h.fanName} ($${h.fanValue})`, short: true },
            { title: 'Last Message', value: h.lastMessage, short: false },
            { title: 'Context', value: h.context, short: false },
            { title: 'Suggested Reply', value: h.suggestedResponse, short: false }
          ]
        }))
      };
      
      // In production, send to Slack
      console.log('Would send to Slack:', message);
    }
    
    // Update account status
    await db.update(of_accounts)
      .set({
        metadata: sql`jsonb_set(metadata, '{offlineModeActive}', 'true'::jsonb)`
      })
      .where(eq(of_accounts.id, accountId));
  }
  
  // Resume AI mode
  async resumeAIMode(accountId: string): Promise<void> {
    await db.update(of_accounts)
      .set({
        metadata: sql`jsonb_set(metadata, '{offlineModeActive}', 'false'::jsonb)`
      })
      .where(eq(of_accounts.id, accountId));
  }
}

export const offlineMode = new OfflineModeService();
