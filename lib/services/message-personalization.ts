import { getAIService } from './ai-service';
import { z } from 'zod';

// Fan profile schema
export const FanProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  subscriptionTier: z.enum(['basic', 'vip', 'premium']),
  totalSpent: z.number().min(0),
  lastActive: z.date(),
  averageSessionDuration: z.number().min(0).optional(),
  preferredContentTypes: z.array(z.string()).default([]),
  interactionHistory: z.array(z.object({
    type: z.enum(['message', 'tip', 'purchase', 'like', 'comment']),
    content: z.string().optional(),
    amount: z.number().optional(),
    timestamp: z.date(),
  })).default([]),
  demographics: z.object({
    timezone: z.string().optional(),
    language: z.string().default('en'),
    estimatedAge: z.number().optional(),
  }).default(() => ({ language: 'en' })),
  behaviorMetrics: z.object({
    responseRate: z.number().min(0).max(100).default(0),
    averageSpendPerSession: z.number().min(0).default(0),
    contentEngagementRate: z.number().min(0).max(100).default(0),
    loyaltyScore: z.number().min(0).max(100).default(50),
  }).default(() => ({
    responseRate: 0,
    averageSpendPerSession: 0,
    contentEngagementRate: 0,
    loyaltyScore: 50,
  })),
});

export type FanProfile = z.infer<typeof FanProfileSchema>;

// Message template types
export interface MessageTemplate {
  id: string;
  name: string;
  category: 'greeting' | 'upsell' | 'ppv_offer' | 'reactivation' | 'thank_you' | 'custom';
  template: string;
  variables: string[];
  toneOptions: ('friendly' | 'flirty' | 'professional' | 'playful' | 'intimate')[];
  targetAudience: {
    subscriptionTiers: string[];
    spendingLevels: ('low' | 'medium' | 'high')[];
    activityLevels: ('inactive' | 'moderate' | 'active')[];
  };
  performance: {
    responseRate: number;
    conversionRate: number;
    usageCount: number;
    lastUpdated: Date;
  };
}

// Message personalization service
export class MessagePersonalizationService {
  private templates: Map<string, MessageTemplate> = new Map();
  private aiService = getAIService();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const defaultTemplates: MessageTemplate[] = [
      {
        id: 'greeting-new-subscriber',
        name: 'New Subscriber Welcome',
        category: 'greeting',
        template: 'Hey {{fanName}}! 👋 Welcome to my exclusive world! I\'m so excited to have you here. What kind of content are you most excited to see? 😘',
        variables: ['fanName'],
        toneOptions: ['friendly', 'flirty', 'playful'],
        targetAudience: {
          subscriptionTiers: ['basic', 'vip', 'premium'],
          spendingLevels: ['low', 'medium', 'high'],
          activityLevels: ['active'],
        },
        performance: {
          responseRate: 65,
          conversionRate: 12,
          usageCount: 0,
          lastUpdated: new Date(),
        },
      },
      {
        id: 'upsell-vip',
        name: 'VIP Upgrade Offer',
        category: 'upsell',
        template: 'Hi {{fanName}}! I noticed you\'ve been really enjoying my content 💕 I have something special for my VIP members - exclusive behind-the-scenes content and personal messages. Want to upgrade and get even closer? 🌟',
        variables: ['fanName'],
        toneOptions: ['friendly', 'flirty', 'intimate'],
        targetAudience: {
          subscriptionTiers: ['basic'],
          spendingLevels: ['medium', 'high'],
          activityLevels: ['moderate', 'active'],
        },
        performance: {
          responseRate: 45,
          conversionRate: 28,
          usageCount: 0,
          lastUpdated: new Date(),
        },
      },
      {
        id: 'ppv-exclusive',
        name: 'Exclusive PPV Offer',
        category: 'ppv_offer',
        template: 'Hey {{fanName}}! 🔥 I just finished an amazing photoshoot and I think you\'d love it. It\'s some of my most exclusive content yet - only for my special fans like you. Interested in a sneak peek? 📸✨',
        variables: ['fanName'],
        toneOptions: ['flirty', 'playful', 'intimate'],
        targetAudience: {
          subscriptionTiers: ['vip', 'premium'],
          spendingLevels: ['medium', 'high'],
          activityLevels: ['moderate', 'active'],
        },
        performance: {
          responseRate: 38,
          conversionRate: 35,
          usageCount: 0,
          lastUpdated: new Date(),
        },
      },
      {
        id: 'reactivation-gentle',
        name: 'Gentle Reactivation',
        category: 'reactivation',
        template: 'Hi {{fanName}} 💕 I haven\'t seen you around lately and I miss chatting with you! I\'ve been creating some amazing new content that I think you\'d really enjoy. How have you been? 🌸',
        variables: ['fanName'],
        toneOptions: ['friendly'],
        targetAudience: {
          subscriptionTiers: ['basic', 'vip', 'premium'],
          spendingLevels: ['low', 'medium', 'high'],
          activityLevels: ['inactive'],
        },
        performance: {
          responseRate: 22,
          conversionRate: 15,
          usageCount: 0,
          lastUpdated: new Date(),
        },
      },
      {
        id: 'thank-you-purchase',
        name: 'Purchase Thank You',
        category: 'thank_you',
        template: 'Thank you so much {{fanName}}! 🙏💕 Your support means the world to me and helps me create even better content for amazing fans like you. I hope you love what you got! 😘',
        variables: ['fanName'],
        toneOptions: ['friendly'],
        targetAudience: {
          subscriptionTiers: ['basic', 'vip', 'premium'],
          spendingLevels: ['medium', 'high'],
          activityLevels: ['active'],
        },
        performance: {
          responseRate: 55,
          conversionRate: 8,
          usageCount: 0,
          lastUpdated: new Date(),
        },
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async generatePersonalizedMessage(
    fanProfile: FanProfile,
    messageType: MessageTemplate['category'],
    options: {
      tone?: 'friendly' | 'flirty' | 'professional' | 'playful' | 'intimate';
      customContext?: string;
      maxLength?: number;
      includeEmojis?: boolean;
      callToAction?: string;
    } = {}
  ): Promise<{
    message: string;
    template?: MessageTemplate;
    personalizationScore: number;
    suggestions: string[];
  }> {
    // Find best matching template
    const template = this.findBestTemplate(fanProfile, messageType);
    
    if (template && Math.random() > 0.3) { // 70% chance to use template, 30% to generate fresh
      return this.personalizeTemplate(template, fanProfile, options);
    } else {
      return this.generateFreshMessage(fanProfile, messageType, options);
    }
  }

  private findBestTemplate(fanProfile: FanProfile, messageType: MessageTemplate['category']): MessageTemplate | null {
    const candidates = Array.from(this.templates.values())
      .filter(template => template.category === messageType);

    if (candidates.length === 0) return null;

    // Score templates based on fan profile match
    const scoredTemplates = candidates.map(template => ({
      template,
      score: this.scoreTemplateMatch(template, fanProfile),
    }));

    // Sort by score and performance
    scoredTemplates.sort((a, b) => {
      const scoreA = a.score * 0.7 + (a.template.performance.responseRate / 100) * 0.3;
      const scoreB = b.score * 0.7 + (b.template.performance.responseRate / 100) * 0.3;
      return scoreB - scoreA;
    });

    return scoredTemplates[0]?.template || null;
  }

  private scoreTemplateMatch(template: MessageTemplate, fanProfile: FanProfile): number {
    let score = 0;

    // Subscription tier match
    if (template.targetAudience.subscriptionTiers.includes(fanProfile.subscriptionTier)) {
      score += 0.4;
    }

    // Spending level match
    const spendingLevel = this.getSpendingLevel(fanProfile.totalSpent);
    if (template.targetAudience.spendingLevels.includes(spendingLevel)) {
      score += 0.3;
    }

    // Activity level match
    const activityLevel = this.getActivityLevel(fanProfile.lastActive);
    if (template.targetAudience.activityLevels.includes(activityLevel)) {
      score += 0.3;
    }

    return score;
  }

  private async personalizeTemplate(
    template: MessageTemplate,
    fanProfile: FanProfile,
    options: any
  ): Promise<{
    message: string;
    template: MessageTemplate;
    personalizationScore: number;
    suggestions: string[];
  }> {
    let message = template.template;

    // Replace variables
    template.variables.forEach(variable => {
      const value = this.getVariableValue(variable, fanProfile);
      message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    // Apply tone adjustments if different from template default
    if (options.tone && !template.toneOptions.includes(options.tone)) {
      message = await this.adjustTone(message, options.tone, fanProfile);
    }

    // Add personalization based on fan history
    const personalizedMessage = await this.addPersonalization(message, fanProfile, options);

    return {
      message: personalizedMessage,
      template,
      personalizationScore: this.calculatePersonalizationScore(fanProfile, template),
      suggestions: this.generateSuggestions(fanProfile, template),
    };
  }

  private async generateFreshMessage(
    fanProfile: FanProfile,
    messageType: MessageTemplate['category'],
    options: any
  ): Promise<{
    message: string;
    personalizationScore: number;
    suggestions: string[];
  }> {
    const prompt = this.buildPersonalizationPrompt(fanProfile, messageType, options);

    const response = await this.aiService.generateText({
      prompt,
      context: {
        userId: fanProfile.id,
        contentType: 'message',
        metadata: {
          messageType,
          subscriptionTier: fanProfile.subscriptionTier,
          spendingLevel: this.getSpendingLevel(fanProfile.totalSpent),
        },
      },
      options: {
        temperature: 0.8,
        maxTokens: options.maxLength ? Math.ceil(options.maxLength * 1.5) : 300,
      },
    });

    return {
      message: response.content.trim(),
      personalizationScore: 85, // Fresh AI generation gets high personalization score
      suggestions: this.generateAISuggestions(fanProfile, messageType),
    };
  }

  private buildPersonalizationPrompt(
    fanProfile: FanProfile,
    messageType: MessageTemplate['category'],
    options: any
  ): string {
    let prompt = `Create a personalized message for ${fanProfile.name}.`;

    // Fan context
    prompt += `\n\nFan Profile:
- Name: ${fanProfile.name}
- Subscription: ${fanProfile.subscriptionTier}
- Total spent: $${fanProfile.totalSpent}
- Last active: ${fanProfile.lastActive.toLocaleDateString()}
- Loyalty score: ${fanProfile.behaviorMetrics.loyaltyScore}/100`;

    // Recent interactions
    if (fanProfile.interactionHistory.length > 0) {
      const recentInteractions = fanProfile.interactionHistory
        .slice(-3)
        .map((interaction: any) => `${interaction.type}: ${interaction.content || 'N/A'}`)
        .join(', ');
      prompt += `\n- Recent interactions: ${recentInteractions}`;
    }

    // Content preferences
    if (fanProfile.preferredContentTypes.length > 0) {
      prompt += `\n- Preferred content: ${fanProfile.preferredContentTypes.join(', ')}`;
    }

    // Message type context
    const messageTypeContext = {
      greeting: 'This is a friendly greeting message to welcome them or check in.',
      upsell: 'This is an upsell message to encourage subscription upgrade or premium content purchase.',
      ppv_offer: 'This is a pay-per-view offer for exclusive content.',
      reactivation: 'This is a reactivation message for a fan who has been inactive.',
      thank_you: 'This is a thank you message for their support or recent purchase.',
      custom: options.customContext || 'This is a custom message.',
    };

    prompt += `\n\nMessage Type: ${messageTypeContext[messageType]}`;

    // Tone and style
    if (options.tone) {
      const toneGuidance = {
        friendly: 'Use a warm, approachable tone that feels genuine and caring.',
        flirty: 'Use a playful, flirtatious tone that\'s engaging but respectful.',
        professional: 'Use a professional, polite tone that maintains boundaries.',
        playful: 'Use a fun, energetic tone with humor and personality.',
        intimate: 'Use a more personal, intimate tone that creates connection.',
      };
      prompt += `\n\nTone: ${toneGuidance[options.tone as keyof typeof toneGuidance]}`;
    }

    // Personalization requirements
    prompt += `\n\nPersonalization Requirements:
- Reference their subscription tier (${fanProfile.subscriptionTier}) appropriately
- Consider their spending level ($${fanProfile.totalSpent} total)
- Account for their loyalty score (${fanProfile.behaviorMetrics.loyaltyScore}/100)`;

    if (fanProfile.behaviorMetrics.responseRate > 0) {
      prompt += `\n- They typically respond to ${fanProfile.behaviorMetrics.responseRate}% of messages`;
    }

    // Formatting requirements
    prompt += `\n\nFormatting:
- Keep under ${options.maxLength || 200} characters
- Make it feel personal and authentic, not robotic`;

    if (options.includeEmojis !== false) {
      prompt += `\n- Include relevant emojis naturally`;
    }

    if (options.callToAction) {
      prompt += `\n- Include this call to action: ${options.callToAction}`;
    }

    prompt += `\n\nGenerate only the message content, no additional text.`;

    return prompt;
  }

  private async adjustTone(message: string, targetTone: string, fanProfile: FanProfile): Promise<string> {
    const prompt = `Adjust the tone of this message to be more ${targetTone} while keeping the same meaning and personalization:

Original message: "${message}"

Fan context: ${fanProfile.subscriptionTier} subscriber, loyalty score ${fanProfile.behaviorMetrics.loyaltyScore}/100

Adjusted message:`;

    const response = await this.aiService.generateText({
      prompt,
      context: {
        userId: fanProfile.id,
        contentType: 'message',
        metadata: { adjustment: 'tone', targetTone },
      },
      options: {
        temperature: 0.6,
        maxTokens: 200,
      },
    });

    return response.content.trim();
  }

  private async addPersonalization(message: string, fanProfile: FanProfile, options: any): Promise<string> {
    // Add subtle personalization based on fan behavior
    let personalizedMessage = message;

    // Add spending-based personalization
    if (fanProfile.totalSpent > 500) {
      personalizedMessage = personalizedMessage.replace(/\bfan\b/gi, 'VIP fan');
    }

    // Add activity-based personalization
    const daysSinceActive = Math.floor((Date.now() - fanProfile.lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 7 && daysSinceActive < 30) {
      // Add gentle acknowledgment of absence
      if (!personalizedMessage.toLowerCase().includes('miss') && Math.random() > 0.7) {
        personalizedMessage = personalizedMessage.replace(/^(Hi|Hey|Hello)/, '$1! I\'ve missed you');
      }
    }

    return personalizedMessage;
  }

  private getVariableValue(variable: string, fanProfile: FanProfile): string {
    switch (variable) {
      case 'fanName':
        return fanProfile.name;
      case 'subscriptionTier':
        return fanProfile.subscriptionTier;
      case 'totalSpent':
        return `$${fanProfile.totalSpent}`;
      case 'loyaltyScore':
        return `${fanProfile.behaviorMetrics.loyaltyScore}/100`;
      default:
        return `{{${variable}}}`;
    }
  }

  private getSpendingLevel(totalSpent: number): 'low' | 'medium' | 'high' {
    if (totalSpent < 50) return 'low';
    if (totalSpent < 200) return 'medium';
    return 'high';
  }

  private getActivityLevel(lastActive: Date): 'inactive' | 'moderate' | 'active' {
    const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 14) return 'inactive';
    if (daysSinceActive > 3) return 'moderate';
    return 'active';
  }

  private calculatePersonalizationScore(fanProfile: FanProfile, template: MessageTemplate): number {
    let score = 50; // Base score

    // Template match bonus
    score += this.scoreTemplateMatch(template, fanProfile) * 30;

    // Interaction history bonus
    if (fanProfile.interactionHistory.length > 0) {
      score += Math.min(20, fanProfile.interactionHistory.length * 2);
    }

    // Loyalty bonus
    score += (fanProfile.behaviorMetrics.loyaltyScore / 100) * 10;

    return Math.min(100, Math.max(0, score));
  }

  private generateSuggestions(fanProfile: FanProfile, template: MessageTemplate): string[] {
    const suggestions: string[] = [];

    // Timing suggestions
    if (fanProfile.demographics.timezone) {
      suggestions.push(`Send during peak hours in ${fanProfile.demographics.timezone} timezone`);
    }

    // Content suggestions
    if (fanProfile.preferredContentTypes.length > 0) {
      suggestions.push(`Reference their favorite content types: ${fanProfile.preferredContentTypes.join(', ')}`);
    }

    // Engagement suggestions
    if (fanProfile.behaviorMetrics.responseRate < 30) {
      suggestions.push('Add a compelling question to encourage response');
    }

    // Spending suggestions
    if (fanProfile.totalSpent > 100 && template.category !== 'thank_you') {
      suggestions.push('Acknowledge their loyalty and support');
    }

    return suggestions;
  }

  private generateAISuggestions(fanProfile: FanProfile, messageType: MessageTemplate['category']): string[] {
    const suggestions: string[] = [];

    // Type-specific suggestions
    switch (messageType) {
      case 'greeting':
        suggestions.push('Ask about their interests to start conversation');
        suggestions.push('Share what makes your content special');
        break;
      case 'upsell':
        suggestions.push('Highlight exclusive benefits clearly');
        suggestions.push('Create urgency with limited-time offers');
        break;
      case 'ppv_offer':
        suggestions.push('Tease content without revealing everything');
        suggestions.push('Mention why this content is exclusive');
        break;
      case 'reactivation':
        suggestions.push('Acknowledge their absence gently');
        suggestions.push('Share exciting updates they missed');
        break;
      case 'thank_you':
        suggestions.push('Be specific about what you\'re thanking them for');
        suggestions.push('Hint at upcoming content they might enjoy');
        break;
    }

    return suggestions;
  }

  // Template management methods
  addTemplate(template: Omit<MessageTemplate, 'performance'>): void {
    const fullTemplate: MessageTemplate = {
      ...template,
      performance: {
        responseRate: 0,
        conversionRate: 0,
        usageCount: 0,
        lastUpdated: new Date(),
      },
    };
    this.templates.set(template.id, fullTemplate);
  }

  updateTemplatePerformance(templateId: string, metrics: Partial<MessageTemplate['performance']>): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.performance = { ...template.performance, ...metrics, lastUpdated: new Date() };
    }
  }

  getTemplates(category?: MessageTemplate['category']): MessageTemplate[] {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  getTemplatePerformance(): Array<{ templateId: string; performance: MessageTemplate['performance'] }> {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      templateId: id,
      performance: template.performance,
    }));
  }
}

// Singleton instance
let messagePersonalizationService: MessagePersonalizationService | null = null;

export function getMessagePersonalizationService(): MessagePersonalizationService {
  if (!messagePersonalizationService) {
    messagePersonalizationService = new MessagePersonalizationService();
  }
  return messagePersonalizationService;
}