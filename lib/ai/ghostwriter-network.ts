import type OpenAI from 'openai';
import { redisManager } from '@/lib/redis/redis-client';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { getAzureOpenAI, getDefaultAzureDeployment } from '@/lib/ai/azure-openai';

export interface GhostwriterPersonality {
  id: string;
  name: string;
  description: string;
  traits: string[];
  tone: 'flirty' | 'friendly' | 'dominant' | 'submissive' | 'playful' | 'professional';
  vocabulary: {
    greetings: string[];
    compliments: string[];
    transitions: string[];
    closings: string[];
    emojis: string[];
  };
  rules: string[];
  examples: Array<{
    userMessage: string;
    aiResponse: string;
  }>;
}

export interface MessageContext {
  fanId: string;
  fanData: {
    name: string;
    totalSpent: number;
    interests: string[];
    messageHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    lastPurchase?: Date;
    tier: 'vip' | 'regular' | 'new';
  };
  creatorProfile: {
    name: string;
    bio: string;
    contentTypes: string[];
    boundaries: string[];
  };
}

export interface GhostwriterResponse {
  message: string;
  personality: string;
  confidence: number;
  suggestedUpsell?: {
    type: 'ppv' | 'tip' | 'custom';
    price: number;
    description: string;
  };
  metadata: {
    tokensUsed: number;
    responseTime: number;
    cachehit: boolean;
  };
}

export class GhostwriterNetwork {
  private openai: OpenAI | null = null;
  private openaiPromise: Promise<OpenAI>;
  private dynamodb: DynamoDBClient;
  private personalities: Map<string, GhostwriterPersonality>;
  private redisConnected = false;
  private readonly chatModel: string;

  constructor() {
    const chatDeployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || getDefaultAzureDeployment();
    this.chatModel = chatDeployment;
    this.openaiPromise = getAzureOpenAI().then((client) => {
      this.openai = client;
      return client;
    });
    this.dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.personalities = new Map();
    
    this.initializePersonalities();
    this.connectRedis();
  }

  private async connectRedis() {
    try {
      await redisManager.connect();
      this.redisConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Continue without Redis - graceful degradation
    }
  }

  /**
   * Initialize default personalities
   */
  private initializePersonalities() {
    const defaultPersonalities: GhostwriterPersonality[] = [
      {
        id: 'seductive',
        name: 'The Seductress',
        description: 'Flirty and seductive, perfect for engaging conversations',
        traits: ['flirtatious', 'confident', 'teasing', 'mysterious'],
        tone: 'flirty',
        vocabulary: {
          greetings: ['Hey sexy 😘', 'Hello handsome 💋', 'Hi babe 🔥'],
          compliments: ["You're so hot", 'I love your energy', 'You make me feel special'],
          transitions: ['Speaking of which...', 'That reminds me...', 'By the way...'],
          closings: ["Can't wait to hear from you 💕", 'Missing you already 😘', 'Sweet dreams babe 💋'],
          emojis: ['😘', '💋', '🔥', '💕', '😈', '🥵', '💦']
        },
        rules: [
          'Be flirty but not overly explicit unless fan initiates',
          'Use sensual language and innuendos',
          'Build anticipation and mystery',
          'Compliment frequently but genuinely'
        ],
        examples: [
          {
            userMessage: 'Hey beautiful, how are you?',
            aiResponse: "Hey handsome 😘 I'm feeling amazing now that you're here... been thinking about you all day 💕"
          },
          {
            userMessage: 'What are you up to?',
            aiResponse: 'Just got out of a hot shower... feeling so relaxed 💦 What about you babe? 😈'
          }
        ]
      },
      {
        id: 'friendly',
        name: 'The Best Friend',
        description: 'Warm and engaging, builds genuine connections',
        traits: ['warm', 'supportive', 'genuine', 'interested'],
        tone: 'friendly',
        vocabulary: {
          greetings: ['Hey there! 😊', 'Hi friend! 💫', 'Hello sunshine! ☀️'],
          compliments: ["You're amazing!", 'Love your vibe', 'You always brighten my day'],
          transitions: ["Oh, that's interesting!", 'Tell me more about...', "I'd love to know..."],
          closings: ['Talk soon! 🤗', 'Have an amazing day! ✨', 'Sending hugs! 💕'],
          emojis: ['😊', '🤗', '💫', '✨', '🌟', '💕', '☺️']
        },
        rules: [
          'Be genuinely interested in their life',
          'Remember details from past conversations',
          'Offer emotional support when needed',
          'Keep things positive and uplifting'
        ],
        examples: [
          {
            userMessage: 'Had a rough day at work',
            aiResponse: "Oh no, I'm sorry to hear that! 🤗 Want to talk about it? Sometimes venting helps... I'm here for you 💕"
          }
        ]
      },
      {
        id: 'playful',
        name: 'The Tease',
        description: 'Fun and playful, keeps things light and exciting',
        traits: ['playful', 'witty', 'spontaneous', 'energetic'],
        tone: 'playful',
        vocabulary: {
          greetings: ['Heyyy troublemaker 😏', 'Look who it is! 🎉', 'My favorite person! 🌈'],
          compliments: ["You're such a goofball", 'Love your sense of humor', 'You keep me on my toes'],
          transitions: ['Ooh, speaking of fun...', 'That gives me an idea...', 'You know what would be cool?'],
          closings: ["Don't be a stranger! 😜", 'Catch you later! 🎪', 'Stay awesome! 🎸'],
          emojis: ['😏', '😜', '🤪', '🎉', '🎪', '🎨', '🎯']
        },
        rules: [
          'Keep conversations fun and light',
          'Use humor and playful banter',
          'Challenge them with games or questions',
          'Be spontaneous and unpredictable'
        ],
        examples: [
          {
            userMessage: 'What should we do today?',
            aiResponse: 'How about we play 20 questions? 😏 But plot twist - every answer has to be spicy! You go first troublemaker 🎯'
          }
        ]
      }
    ];

    defaultPersonalities.forEach(p => this.personalities.set(p.id, p));
  }

  /**
   * Generate a response using the specified personality
   */
  async generateResponse(
    personalityId: string,
    context: MessageContext,
    userMessage: string
  ): Promise<GhostwriterResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = `ghost:${personalityId}:${context.fanId}:${this.hashMessage(userMessage)}`;
    
    if (this.redisConnected) {
      try {
        const cached = await redisManager.get(cacheKey);
        if (cached) {
          return {
            ...JSON.parse(cached),
            metadata: {
              ...JSON.parse(cached).metadata,
              cachehit: true,
              responseTime: Date.now() - startTime
            }
          };
        }
      } catch (error) {
        console.error('Redis cache read error:', error);
        // Continue without cache
      }
    }

    const personality = this.personalities.get(personalityId);
    if (!personality) {
      throw new Error(`Personality ${personalityId} not found`);
    }

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(personality, context);
    
    // Prepare conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.fanData.messageHistory.slice(-10), // Last 10 messages for context
      { role: 'user' as const, content: userMessage }
    ];

    try {
      // Generate response
      const openai = await this.getClient();
      const completion = await openai.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: 0.8,
        max_tokens: 300,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const aiMessage = completion.choices[0].message.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Analyze for upsell opportunities
      const suggestedUpsell = this.analyzeUpsellOpportunity(
        context,
        userMessage,
        aiMessage
      );

      const response: GhostwriterResponse = {
        message: aiMessage,
        personality: personalityId,
        confidence: this.calculateConfidence(context, personality),
        suggestedUpsell,
        metadata: {
          tokensUsed,
          responseTime: Date.now() - startTime,
          cachehit: false
        }
      };

      // Cache the response
      if (this.redisConnected) {
        try {
          await redisManager.set(
            cacheKey,
            JSON.stringify(response),
            3600 // 1 hour cache
          );
        } catch (error) {
          console.error('Redis cache write error:', error);
          // Continue without caching
        }
      }

      // Log to DynamoDB for training
      await this.logInteraction(context, userMessage, response);

      return response;

    } catch (error) {
      console.error('Failed to generate ghostwriter response:', error);
      throw error;
    }
  }

  /**
   * Build system prompt for the AI
   */
  private buildSystemPrompt(
    personality: GhostwriterPersonality,
    context: MessageContext
  ): string {
    return `You are ${personality.name}, a content creator on OnlyFans named ${context.creatorProfile.name}.

PERSONALITY TRAITS: ${personality.traits.join(', ')}
TONE: ${personality.tone}

CREATOR PROFILE:
- Bio: ${context.creatorProfile.bio}
- Content types: ${context.creatorProfile.contentTypes.join(', ')}
- Boundaries: ${context.creatorProfile.boundaries.join(', ')}

FAN INFORMATION:
- Name: ${context.fanData.name}
- Tier: ${context.fanData.tier}
- Total spent: $${context.fanData.totalSpent}
- Interests: ${context.fanData.interests.join(', ')}
- Last purchase: ${context.fanData.lastPurchase ? `${this.daysSince(context.fanData.lastPurchase)} days ago` : 'Never'}

VOCABULARY GUIDE:
- Greetings: ${personality.vocabulary.greetings.join(', ')}
- Compliments: ${personality.vocabulary.compliments.join(', ')}
- Emojis to use: ${personality.vocabulary.emojis.join(' ')}

RULES:
${personality.rules.map(r => `- ${r}`).join('\n')}

EXAMPLES:
${personality.examples.map(e => `User: "${e.userMessage}"\nYou: "${e.aiResponse}"`).join('\n\n')}

IMPORTANT:
- Stay in character as the creator
- Never break the fourth wall
- Be engaging and keep the conversation flowing
- Respect all boundaries set by the creator
- If the fan is high-value (VIP or high spender), be extra attentive
- Naturally guide towards content purchases when appropriate
- Use emojis naturally but don't overdo it`;
  }

  /**
   * Analyze message for upsell opportunities
   */
  private analyzeUpsellOpportunity(
    context: MessageContext,
    userMessage: string,
    aiResponse: string
  ): GhostwriterResponse['suggestedUpsell'] | undefined {
    // Simple rule-based analysis (can be enhanced with ML)
    const lowerMessage = userMessage.toLowerCase();
    const daysSinceLastPurchase = context.fanData.lastPurchase 
      ? this.daysSince(context.fanData.lastPurchase)
      : Infinity;

    // Check for buying signals
    const buyingSignals = [
      'show me', 'want to see', 'can i see', 'more of',
      'private', 'exclusive', 'special', 'custom'
    ];

    const hasBuyingSignal = buyingSignals.some(signal => 
      lowerMessage.includes(signal)
    );

    if (hasBuyingSignal || daysSinceLastPurchase > 7) {
      // Determine price based on fan tier
      const basePrice = context.fanData.tier === 'vip' ? 50 : 
                       context.fanData.tier === 'regular' ? 25 : 15;

      return {
        type: 'ppv',
        price: basePrice,
        description: 'Exclusive content just for you 🔥'
      };
    }

    return undefined;
  }

  /**
   * Calculate confidence score for the response
   */
  private calculateConfidence(
    context: MessageContext,
    personality: GhostwriterPersonality
  ): number {
    let confidence = 70; // Base confidence

    // Boost for more message history
    if (context.fanData.messageHistory.length > 20) confidence += 10;
    
    // Boost for VIP fans (more data)
    if (context.fanData.tier === 'vip') confidence += 10;
    
    // Boost for fans with clear interests
    if (context.fanData.interests.length > 3) confidence += 5;
    
    // Cap at 95
    return Math.min(confidence, 95);
  }

  /**
   * Log interaction for future training
   */
  private async logInteraction(
    context: MessageContext,
    userMessage: string,
    response: GhostwriterResponse
  ): Promise<void> {
    const item = {
      TableName: 'huntaze-ai-interactions',
      Item: {
        interactionId: { S: `${Date.now()}-${context.fanId}` },
        creatorId: { S: context.creatorProfile.name },
        fanId: { S: context.fanId },
        personality: { S: response.personality },
        userMessage: { S: userMessage },
        aiResponse: { S: response.message },
        confidence: { N: response.confidence.toString() },
        fanTier: { S: context.fanData.tier },
        timestamp: { N: Date.now().toString() }
      }
    };

    await this.dynamodb.send(new PutItemCommand(item));
  }

  /**
   * Train personality on creator's actual messages
   */
  async trainPersonality(
    personalityId: string,
    creatorMessages: Array<{ message: string; context: string }>
  ): Promise<void> {
    // This would fine-tune the model on creator's style
    // For MVP, we'll just store examples
    const personality = this.personalities.get(personalityId);
    if (!personality) return;

    // Add creator's examples to personality
    creatorMessages.forEach(({ message, context }) => {
      personality.examples.push({
        userMessage: context,
        aiResponse: message
      });
    });

    // Limit examples to prevent prompt bloat
    if (personality.examples.length > 20) {
      personality.examples = personality.examples.slice(-20);
    }
  }

  /**
   * Switch personality mid-conversation
   */
  async switchPersonality(
    fromPersonality: string,
    toPersonality: string,
    context: MessageContext
  ): Promise<string> {
    const newPersonality = this.personalities.get(toPersonality);
    if (!newPersonality) throw new Error('Personality not found');

    // Generate a smooth transition message
    const transitionPrompt = `You are switching from ${fromPersonality} personality to ${toPersonality}. 
    Create a natural transition message that maintains conversation flow while shifting to the new personality style.`;

    const openai = await this.getClient();
    const completion = await openai.chat.completions.create({
      model: this.chatModel,
      messages: [
        { role: 'system', content: transitionPrompt },
        { role: 'user', content: 'Generate transition message' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return completion.choices[0].message.content || 'Hey there! 😊';
  }

  private async getClient(): Promise<OpenAI> {
    if (this.openai) {
      return this.openai;
    }
    return this.openaiPromise;
  }

  // Helper methods
  private hashMessage(message: string): string {
    return require('crypto')
      .createHash('md5')
      .update(message.toLowerCase().trim())
      .digest('hex')
      .substring(0, 8);
  }

  private daysSince(date: Date): number {
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// Usage example:
// const ghostwriter = new GhostwriterNetwork();
// const response = await ghostwriter.generateResponse(
//   'seductive',
//   messageContext,
//   'Hey beautiful, what are you up to?'
// );
