// OnlyFans AI Assistant
// Integrates Huntaze's powerful AI with OF-specific features

import type { OfConversation, OfMessage } from '@/lib/types/onlyfans';

export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  traits: string[];
  tone: 'flirty' | 'friendly' | 'professional' | 'playful' | 'dominant';
  responseStyle: {
    useEmojis: boolean;
    emojiFrequency: 'low' | 'medium' | 'high';
    messageLengthPreference: 'short' | 'medium' | 'long';
    punctuation: 'casual' | 'proper';
  };
  contentStrategy: {
    pushPPV: boolean;
    ppvFrequency: 'low' | 'medium' | 'high';
    tippingReminders: boolean;
    customContentOffers: boolean;
  };
}

export interface AIContext {
  conversation: OfConversation;
  recentMessages: OfMessage[];
  fanProfile: {
    spendingTier: 'whale' | 'big_spender' | 'regular' | 'low' | 'non_spender';
    interests: string[];
    purchaseHistory: Array<{ type: 'ppv' | 'tip' | 'custom'; amount: number; date: Date }>;
    engagementLevel: 'high' | 'medium' | 'low';
    lastActive: Date;
  };
}

export class HuntazeAIAssistant {
  private personality: AIPersonality;
  private contextMemory = new Map<string, any>();

  constructor(personality: AIPersonality) {
    this.personality = personality;
  }

  // Simple enhancer placeholder
  async enhanceMessage(text: string, _context?: any): Promise<string> {
    return text;
  }

  // Generate AI response based on context
  async generateResponse(
    message: string,
    context: AIContext
  ): Promise<{
    text: string;
    suggestedPPV?: { contentId: string; price: number };
    suggestedActions?: string[];
  }> {
    // Analyze message intent
    const intent = this.analyzeIntent(message);
    
    // Get fan spending profile
    const fanProfile = context.fanProfile;
    
    // Build response based on personality and context
    let response = await this.buildResponse(message, intent, fanProfile);
    
    // Add personality-specific elements
    response = this.addPersonalityElements(response);
    
    // Check for upsell opportunities
    const upsellSuggestions = this.checkUpsellOpportunities(intent, fanProfile, context);
    
    return {
      text: response,
      suggestedPPV: upsellSuggestions.ppv,
      suggestedActions: upsellSuggestions.actions
    };
  }

  // Analyze message intent
  private analyzeIntent(message: string): {
    type: 'greeting' | 'question' | 'compliment' | 'request' | 'purchase_interest' | 'general';
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
  } {
    const lowerMessage = message.toLowerCase();
    
    // Simple intent detection (would use NLP in production)
    let type: any = 'general';
    if (lowerMessage.match(/^(hey|hi|hello|good)/)) type = 'greeting';
    else if (lowerMessage.includes('?')) type = 'question';
    else if (lowerMessage.match(/(love|amazing|beautiful|hot|sexy)/)) type = 'compliment';
    else if (lowerMessage.match(/(want|need|can i|could|would)/)) type = 'request';
    else if (lowerMessage.match(/(buy|purchase|how much|price|cost)/)) type = 'purchase_interest';
    
    // Sentiment analysis
    const positiveWords = ['love', 'amazing', 'beautiful', 'great', 'awesome', 'perfect'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'disgusting'];
    
    let sentiment: any = 'neutral';
    if (positiveWords.some(word => lowerMessage.includes(word))) sentiment = 'positive';
    else if (negativeWords.some(word => lowerMessage.includes(word))) sentiment = 'negative';
    
    // Topic extraction
    const topics = [];
    if (lowerMessage.match(/(photo|pic|picture)/)) topics.push('photos');
    if (lowerMessage.match(/(video|clip|content)/)) topics.push('videos');
    if (lowerMessage.match(/(custom|personal|special)/)) topics.push('custom');
    
    return { type, sentiment, topics };
  }

  // Build response based on context
  private async buildResponse(
    message: string,
    intent: any,
    fanProfile: any
  ): Promise<string> {
    // This would connect to your actual AI model
    // For now, return contextual templates
    
    const templates = {
      greeting: {
        whale: "Hey babe! 😍 So amazing to see you here! You always make my day better. How have you been?",
        regular: "Hey there! 💕 Thanks for stopping by! What's on your mind today?",
        new: "Hey! Welcome to my page! 😊 I'm so excited you're here! Feel free to tell me what kind of content you love most!"
      },
      compliment: {
        whale: "Aww you're always so sweet to me! 🥰 That means the world coming from you. You really know how to make a girl blush!",
        regular: "Thank you so much babe! 😘 You just made my whole day! You're amazing!",
        new: "Omg thank you! 💖 You're so sweet! I love connecting with fans like you!"
      },
      purchase_interest: {
        whale: "I have something EXTRA special just for my VIPs like you 😈 Let me show you my exclusive collection...",
        regular: "Ooh I love your enthusiasm! 🔥 I just dropped some new content that I think you'd absolutely love!",
        new: "I'm so glad you asked! I have some amazing content that my fans can't get enough of! Want to see what everyone's talking about?"
      }
    };

    const tier = fanProfile.spendingTier === 'whale' ? 'whale' : 
                 fanProfile.spendingTier === 'non_spender' ? 'new' : 'regular';
    
    const t: any = templates;
    return t[intent.type]?.[tier] || "Hey babe! 💕 Tell me more!";
  }

  // Add personality-specific elements
  private addPersonalityElements(response: string): string {
    // Add emojis based on personality settings
    if (this.personality.responseStyle.useEmojis) {
      const emojiSets = {
        flirty: ['😘', '😏', '🔥', '💋', '😈'],
        friendly: ['😊', '💕', '🤗', '✨', '💖'],
        playful: ['😜', '🤪', '😂', '🎉', '💃']
      };
      
      const emojis = (emojiSets as any)[this.personality.tone] || emojiSets.friendly;
      
      // Add emojis if not already present
      if (!response.includes('😍') && !response.includes('💕')) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        response += ' ' + randomEmoji;
      }
    }
    
    return response;
  }

  // Check for upsell opportunities
  private checkUpsellOpportunities(
    intent: any,
    fanProfile: any,
    context: AIContext
  ): {
    ppv?: { contentId: string; price: number };
    actions: string[];
  } {
    const actions: string[] = [];
    let ppv = undefined;
    
    // Purchase intent = immediate PPV opportunity
    if (intent.type === 'purchase_interest') {
      actions.push('send_ppv');
      ppv = { contentId: 'latest_ppv', price: fanProfile.spendingTier === 'whale' ? 50 : 25 };
    }
    
    // Compliment = good time for content offer
    if (intent.type === 'compliment' && this.personality.contentStrategy.pushPPV) {
      actions.push('soft_ppv_mention');
    }
    
    // Check last purchase date
    const lastPurchase = fanProfile.purchaseHistory[0];
    const daysSinceLastPurchase = lastPurchase 
      ? (Date.now() - lastPurchase.date.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    
    if (daysSinceLastPurchase > 7 && fanProfile.spendingTier !== 'non_spender') {
      actions.push('re_engagement_offer');
    }
    
    return { ppv, actions };
  }

  // Get conversation suggestions
  async getConversationSuggestions(context: AIContext): Promise<{
    responses: string[];
    actions: Array<{ type: string; description: string }>;
  }> {
    const suggestions = [];
    const actions = [];
    
    // Based on fan profile, suggest appropriate responses
    if (context.fanProfile.spendingTier === 'whale') {
      suggestions.push("Thanks for always being so amazing! I have something special just for you 😘");
      suggestions.push("You know you're my favorite, right? 💕 Let me spoil you today!");
      actions.push({ type: 'send_exclusive_ppv', description: 'Send VIP-priced exclusive content' });
    } else if (context.fanProfile.engagementLevel === 'low') {
      suggestions.push("Hey babe! I've missed chatting with you! How have you been? 💕");
      suggestions.push("Just wanted to check in on you! Hope you're having an amazing day 😊");
      actions.push({ type: 're_engagement', description: 'Send re-engagement message with special offer' });
    }
    
    return { responses: suggestions, actions };
  }
}

// Export a simple default singleton for modules that import `aiAssistant`
export const aiAssistant = new HuntazeAIAssistant({
  id: 'default',
  name: 'Default',
  description: 'Default AI personality',
  traits: ['friendly'],
  tone: 'friendly',
  responseStyle: {
    useEmojis: true,
    emojiFrequency: 'medium',
    messageLengthPreference: 'medium',
    punctuation: 'casual',
  },
  contentStrategy: {
    pushPPV: true,
    ppvFrequency: 'medium',
    tippingReminders: false,
    customContentOffers: true,
  },
});

// Pre-configured AI personalities
export const AI_PERSONALITIES: Record<string, AIPersonality> = {
  flirty_premium: {
    id: 'flirty_premium',
    name: 'Flirty Premium',
    description: 'Confident, flirty, and great at converting',
    traits: ['confident', 'flirty', 'engaging', 'persuasive'],
    tone: 'flirty',
    responseStyle: {
      useEmojis: true,
      emojiFrequency: 'high',
      messageLengthPreference: 'medium',
      punctuation: 'casual'
    },
    contentStrategy: {
      pushPPV: true,
      ppvFrequency: 'medium',
      tippingReminders: true,
      customContentOffers: true
    }
  },
  
  friendly_girl_next_door: {
    id: 'friendly_gnd',
    name: 'Friendly Girl Next Door',
    description: 'Sweet, approachable, builds genuine connections',
    traits: ['friendly', 'sweet', 'genuine', 'caring'],
    tone: 'friendly',
    responseStyle: {
      useEmojis: true,
      emojiFrequency: 'medium',
      messageLengthPreference: 'medium',
      punctuation: 'proper'
    },
    contentStrategy: {
      pushPPV: true,
      ppvFrequency: 'low',
      tippingReminders: false,
      customContentOffers: true
    }
  },
  
  playful_tease: {
    id: 'playful_tease',
    name: 'Playful Tease',
    description: 'Fun, playful, keeps fans wanting more',
    traits: ['playful', 'teasing', 'fun', 'mysterious'],
    tone: 'playful',
    responseStyle: {
      useEmojis: true,
      emojiFrequency: 'high',
      messageLengthPreference: 'short',
      punctuation: 'casual'
    },
    contentStrategy: {
      pushPPV: true,
      ppvFrequency: 'high',
      tippingReminders: true,
      customContentOffers: false
    }
  }
};

// Initialize AI with personality
export function createAIAssistant(personalityId: string): HuntazeAIAssistant {
  const personality = AI_PERSONALITIES[personalityId] || AI_PERSONALITIES.friendly_girl_next_door;
  return new HuntazeAIAssistant(personality);
}
