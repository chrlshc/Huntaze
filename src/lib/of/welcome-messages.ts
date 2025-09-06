// OnlyFans Welcome Messages Manager
// Handles automated welcome messages for new subscribers

import type { WelcomeMessage, OfConversation, AudienceFilter } from '@/lib/types/onlyfans';
import { queueDmMessage } from '@/lib/queue/of-queue';

// Mock storage (replace with database)
const welcomeMessages = new Map<string, WelcomeMessage[]>();
const sentWelcomes = new Map<string, Set<string>>(); // userId -> Set of platformUserIds

export class WelcomeMessageManager {
  // Create a new welcome message template
  async createWelcomeMessage(
    userId: string,
    data: Omit<WelcomeMessage, 'id' | 'userId' | 'sentCount' | 'createdAt' | 'updatedAt'>
  ): Promise<WelcomeMessage> {
    const welcomeMessage: WelcomeMessage = {
      id: `welcome_${Date.now()}`,
      userId,
      sentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };

    const userMessages = welcomeMessages.get(userId) || [];
    userMessages.push(welcomeMessage);
    welcomeMessages.set(userId, userMessages);

    return welcomeMessage;
  }

  // Get all welcome messages for a user
  async getWelcomeMessages(userId: string): Promise<WelcomeMessage[]> {
    return welcomeMessages.get(userId) || [];
  }

  // Update welcome message
  async updateWelcomeMessage(
    userId: string,
    messageId: string,
    updates: Partial<WelcomeMessage>
  ): Promise<WelcomeMessage | null> {
    const userMessages = welcomeMessages.get(userId) || [];
    const index = userMessages.findIndex(msg => msg.id === messageId);
    
    if (index === -1) return null;

    userMessages[index] = {
      ...userMessages[index],
      ...updates,
      updatedAt: new Date()
    };

    welcomeMessages.set(userId, userMessages);
    return userMessages[index];
  }

  // Delete welcome message
  async deleteWelcomeMessage(userId: string, messageId: string): Promise<boolean> {
    const userMessages = welcomeMessages.get(userId) || [];
    const filtered = userMessages.filter(msg => msg.id !== messageId);
    
    if (filtered.length === userMessages.length) return false;
    
    welcomeMessages.set(userId, filtered);
    return true;
  }

  // Process new subscriber
  async processNewSubscriber(
    userId: string,
    subscriber: OfConversation,
    trigger: 'new_subscriber' | 'new_follower' | 'resubscribe'
  ): Promise<void> {
    // Check if we already sent a welcome to this subscriber
    const userSentSet = sentWelcomes.get(userId) || new Set();
    if (userSentSet.has(subscriber.platformUserId)) {
      console.log(`Welcome already sent to ${subscriber.username}`);
      return;
    }

    // Get enabled welcome messages for this trigger
    const userMessages = welcomeMessages.get(userId) || [];
    const applicableMessages = userMessages.filter(msg => 
      msg.enabled && msg.trigger === trigger
    );

    if (applicableMessages.length === 0) {
      console.log(`No welcome messages configured for trigger: ${trigger}`);
      return;
    }

    // Find the best matching message based on audience filter
    const message = this.selectBestMessage(applicableMessages, subscriber);
    if (!message) {
      console.log('No matching welcome message for subscriber profile');
      return;
    }

    // Queue the welcome message with delay
    const delayMs = message.delay * 60 * 1000; // Convert minutes to ms
    
    await queueDmMessage(
      userId,
      subscriber.id,
      message.content
    );

    // Mark as sent
    userSentSet.add(subscriber.platformUserId);
    sentWelcomes.set(userId, userSentSet);

    // Update sent count
    await this.updateWelcomeMessage(userId, message.id, {
      sentCount: message.sentCount + 1
    });

    console.log(`Welcome message queued for ${subscriber.username} with ${message.delay}min delay`);
  }

  // Select best message based on audience filter
  private selectBestMessage(
    messages: WelcomeMessage[],
    subscriber: OfConversation
  ): WelcomeMessage | null {
    // If no filters, return first message
    const noFilterMessages = messages.filter(msg => !msg.audienceFilter);
    if (noFilterMessages.length > 0) {
      return noFilterMessages[0];
    }

    // Check each message's audience filter
    for (const message of messages) {
      if (this.matchesAudienceFilter(subscriber, message.audienceFilter)) {
        return message;
      }
    }

    return null;
  }

  // Check if subscriber matches audience filter
  private matchesAudienceFilter(
    subscriber: OfConversation,
    filter?: AudienceFilter
  ): boolean {
    if (!filter || filter.type === 'all') return true;

    if (filter.type === 'segment' && filter.segments) {
      // Check segment matching
      for (const segment of filter.segments) {
        if (this.matchesSegment(subscriber, segment)) {
          return true;
        }
      }
    }

    if (filter.type === 'custom' && filter.customFilters) {
      // Check custom filters
      const logic = filter.combinationLogic || 'AND';
      const results = filter.customFilters.map(f => 
        this.matchesCustomFilter(subscriber, f)
      );

      if (logic === 'AND') {
        return results.every(r => r);
      } else {
        return results.some(r => r);
      }
    }

    return false;
  }

  // Check if subscriber matches segment
  private matchesSegment(subscriber: OfConversation, segment: string): boolean {
    switch (segment) {
      case 'paid_subscribers':
        return subscriber.isSubscribed && (subscriber.subscriptionPrice || 0) > 0;
      case 'free_subscribers':
        return subscriber.isSubscribed && (subscriber.subscriptionPrice || 0) === 0;
      case 'big_spenders':
        return subscriber.totalSpent >= 100;
      case 'whales':
        return subscriber.totalSpent >= 500;
      case 'vip_fans':
        return subscriber.tags.includes('VIP');
      case 'never_purchased':
        return subscriber.totalPPVPurchases === 0 && subscriber.totalTips === 0;
      default:
        return false;
    }
  }

  // Check if subscriber matches custom filter
  private matchesCustomFilter(subscriber: OfConversation, filter: any): boolean {
    let value: number;
    
    switch (filter.field) {
      case 'spent_total':
        value = subscriber.totalSpent;
        break;
      case 'subscription_price':
        value = subscriber.subscriptionPrice || 0;
        break;
      default:
        return false;
    }

    switch (filter.operator) {
      case 'gt': return value > filter.value;
      case 'gte': return value >= filter.value;
      case 'lt': return value < filter.value;
      case 'lte': return value <= filter.value;
      case 'eq': return value === filter.value;
      default: return false;
    }
  }

  // Get statistics
  async getStatistics(userId: string): Promise<{
    totalMessages: number;
    enabledMessages: number;
    totalSent: number;
    byTrigger: Record<string, number>;
  }> {
    const messages = welcomeMessages.get(userId) || [];
    const stats = {
      totalMessages: messages.length,
      enabledMessages: messages.filter(m => m.enabled).length,
      totalSent: messages.reduce((sum, m) => sum + m.sentCount, 0),
      byTrigger: {} as Record<string, number>
    };

    messages.forEach(msg => {
      stats.byTrigger[msg.trigger] = (stats.byTrigger[msg.trigger] || 0) + msg.sentCount;
    });

    return stats;
  }
}

// Export singleton
export const welcomeMessageManager = new WelcomeMessageManager();

// Example welcome messages templates
export const WELCOME_MESSAGE_TEMPLATES = [
  {
    name: 'Standard Welcome',
    trigger: 'new_subscriber' as const,
    delay: 5, // 5 minutes
    content: {
      text: `Hey babe! 😘 Welcome to my page! I'm so excited you're here! 

Check out my pinned posts for my hottest content, and don't forget to turn on notifications so you never miss anything special I send you 🔔

What kind of content are you most interested in? Let me know and I'll make sure to send you my best stuff! 💕`
    }
  },
  {
    name: 'VIP Welcome',
    trigger: 'new_subscriber' as const,
    delay: 3,
    content: {
      text: `OMG! Welcome to my exclusive world! 🌟 

You just joined at the perfect time - I have some incredible new content dropping this week that I think you're going to LOVE! 

As a special welcome gift, check your DMs in the next 24 hours for an exclusive surprise just for you 🎁

Can't wait to get to know you better! What brings you to my page? 💋`
    },
    audienceFilter: {
      type: 'segment',
      segments: ['paid_subscribers']
    }
  },
  {
    name: 'Resubscriber Welcome Back',
    trigger: 'resubscribe' as const,
    delay: 1,
    content: {
      text: `Welcome back babe! I missed you! 😍

So much has happened since you were last here - I've been working on some amazing new content that I can't wait to share with you!

As a welcome back gift, keep an eye on your DMs - I'll be sending you something special to show how much I appreciate you coming back 💝

What have you been up to?`
    }
  }
];
