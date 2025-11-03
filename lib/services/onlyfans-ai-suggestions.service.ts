/**
 * OnlyFans AI Message Suggestions Service
 * Génère des suggestions de messages intelligentes basées sur le contexte
 */

import { logger } from '@/lib/utils/logger';

export interface MessageContext {
  fanName: string;
  fanHandle?: string;
  lastMessage?: string;
  lastMessageDate?: Date;
  fanValueCents?: number;
  messageCount?: number;
  conversationHistory?: Array<{
    direction: 'in' | 'out';
    text: string;
    createdAt: Date;
  }>;
}

export interface MessageSuggestion {
  id: string;
  text: string;
  tone: 'friendly' | 'flirty' | 'professional' | 'grateful' | 'engaging';
  confidence: number;
  category: 'greeting' | 'follow-up' | 'thank-you' | 'engagement' | 'promotional';
  emoji?: string;
}

export class OnlyFansAISuggestionsService {
  /**
   * Génère des suggestions de messages basées sur le contexte
   */
  async generateSuggestions(context: MessageContext): Promise<MessageSuggestion[]> {
    try {
      logger.info('Generating AI message suggestions', { fanName: context.fanName });

      const suggestions: MessageSuggestion[] = [];

      // Analyser le contexte pour déterminer les meilleures suggestions
      const isNewConversation = !context.lastMessage || context.messageCount === 0;
      const isHighValueFan = (context.fanValueCents || 0) > 10000; // > 100€
      const daysSinceLastMessage = context.lastMessageDate 
        ? Math.floor((Date.now() - context.lastMessageDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // 1. Suggestions de salutation (si nouvelle conversation ou longue absence)
      if (isNewConversation || daysSinceLastMessage > 7) {
        suggestions.push(...this.getGreetingSuggestions(context, isHighValueFan));
      }

      // 2. Suggestions de suivi (si message récent)
      if (context.lastMessage && daysSinceLastMessage <= 3) {
        suggestions.push(...this.getFollowUpSuggestions(context));
      }

      // 3. Suggestions de remerciement (pour fans à haute valeur)
      if (isHighValueFan) {
        suggestions.push(...this.getThankYouSuggestions(context));
      }

      // 4. Suggestions d'engagement
      suggestions.push(...this.getEngagementSuggestions(context));

      // 5. Suggestions promotionnelles (avec modération)
      if (suggestions.length < 5) {
        suggestions.push(...this.getPromotionalSuggestions(context));
      }

      // Limiter à 5 suggestions et trier par confiance
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

    } catch (error) {
      logger.error('Failed to generate AI suggestions', { error });
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Greeting suggestions
   */
  private getGreetingSuggestions(context: MessageContext, isHighValue: boolean): MessageSuggestion[] {
    const suggestions: MessageSuggestion[] = [
      {
        id: 'greeting-1',
        text: `Hey ${context.fanName}! 😊 How are you doing today?`,
        tone: 'friendly',
        confidence: 0.9,
        category: 'greeting',
        emoji: '😊'
      },
      {
        id: 'greeting-2',
        text: `Hi ${context.fanName}! 💕 So good to see you here!`,
        tone: 'flirty',
        confidence: 0.85,
        category: 'greeting',
        emoji: '💕'
      }
    ];

    if (isHighValue) {
      suggestions.push({
        id: 'greeting-vip',
        text: `${context.fanName}! 🌟 My favorite VIP! How are you?`,
        tone: 'grateful',
        confidence: 0.95,
        category: 'greeting',
        emoji: '🌟'
      });
    }

    return suggestions;
  }

  /**
   * Follow-up suggestions
   */
  private getFollowUpSuggestions(context: MessageContext): MessageSuggestion[] {
    const suggestions: MessageSuggestion[] = [];

    if (context.lastMessage) {
      // Analyze last message to generate contextual response
      const lastMsg = context.lastMessage.toLowerCase();

      if (lastMsg.includes('how') || lastMsg.includes('?')) {
        suggestions.push({
          id: 'follow-up-1',
          text: `I'm doing great, thanks! 😊 How's your day going?`,
          tone: 'friendly',
          confidence: 0.88,
          category: 'follow-up',
          emoji: '😊'
        });
      }

      if (lastMsg.includes('thank') || lastMsg.includes('thanks')) {
        suggestions.push({
          id: 'follow-up-2',
          text: `You're welcome! 💕 Always a pleasure chatting with you!`,
          tone: 'grateful',
          confidence: 0.9,
          category: 'follow-up',
          emoji: '💕'
        });
      }

      // Generic follow-up suggestion
      suggestions.push({
        id: 'follow-up-generic',
        text: `Haha I love it! 😄 Tell me more!`,
        tone: 'engaging',
        confidence: 0.75,
        category: 'follow-up',
        emoji: '😄'
      });
    }

    return suggestions;
  }

  /**
   * Thank you suggestions
   */
  private getThankYouSuggestions(context: MessageContext): MessageSuggestion[] {
    return [
      {
        id: 'thank-1',
        text: `Thank you so much for your support ${context.fanName}! 🙏💕 You're amazing!`,
        tone: 'grateful',
        confidence: 0.92,
        category: 'thank-you',
        emoji: '🙏'
      },
      {
        id: 'thank-2',
        text: `You're truly one of my favorite fans! 🌟 Thanks for everything!`,
        tone: 'grateful',
        confidence: 0.88,
        category: 'thank-you',
        emoji: '🌟'
      }
    ];
  }

  /**
   * Engagement suggestions
   */
  private getEngagementSuggestions(context: MessageContext): MessageSuggestion[] {
    return [
      {
        id: 'engage-1',
        text: `What are you up to today? 😊`,
        tone: 'friendly',
        confidence: 0.8,
        category: 'engagement',
        emoji: '😊'
      },
      {
        id: 'engage-2',
        text: `I was thinking about you today! 💭 How are you?`,
        tone: 'flirty',
        confidence: 0.82,
        category: 'engagement',
        emoji: '💭'
      },
      {
        id: 'engage-3',
        text: `Did you have a good week? 🌸`,
        tone: 'friendly',
        confidence: 0.78,
        category: 'engagement',
        emoji: '🌸'
      }
    ];
  }

  /**
   * Promotional suggestions
   */
  private getPromotionalSuggestions(context: MessageContext): MessageSuggestion[] {
    return [
      {
        id: 'promo-1',
        text: `I have some exclusive new content you might like! 🔥 Interested?`,
        tone: 'professional',
        confidence: 0.7,
        category: 'promotional',
        emoji: '🔥'
      },
      {
        id: 'promo-2',
        text: `I'm preparing something special for my VIP fans... 😏 Want to know more?`,
        tone: 'flirty',
        confidence: 0.72,
        category: 'promotional',
        emoji: '😏'
      }
    ];
  }

  /**
   * Fallback suggestions in case of error
   */
  private getFallbackSuggestions(): MessageSuggestion[] {
    return [
      {
        id: 'fallback-1',
        text: `Hey! How's it going? 😊`,
        tone: 'friendly',
        confidence: 0.7,
        category: 'greeting',
        emoji: '😊'
      },
      {
        id: 'fallback-2',
        text: `Thanks for your message! 💕`,
        tone: 'grateful',
        confidence: 0.7,
        category: 'thank-you',
        emoji: '💕'
      },
      {
        id: 'fallback-3',
        text: `What are you up to? 🌸`,
        tone: 'friendly',
        confidence: 0.7,
        category: 'engagement',
        emoji: '🌸'
      }
    ];
  }

  /**
   * Personalize a suggestion with fan name
   */
  personalizeSuggestion(suggestion: MessageSuggestion, fanName: string): MessageSuggestion {
    return {
      ...suggestion,
      text: suggestion.text.replace(/\{name\}/g, fanName)
    };
  }

  /**
   * Analyze message sentiment
   */
  analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['thank', 'thanks', 'great', 'awesome', 'love', 'perfect', 'excellent', 'amazing'];
    const negativeWords = ['not', 'no', 'never', 'bad', 'terrible', 'disappointed', 'hate'];

    const lowerMsg = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMsg.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMsg.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

// Export singleton instance
export const onlyFansAISuggestions = new OnlyFansAISuggestionsService();
