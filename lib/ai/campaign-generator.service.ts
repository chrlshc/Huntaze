/**
 * AI Campaign Generator Service
 * 
 * Generates complete marketing campaigns using Mistral Large.
 * - Full campaign structure
 * - Subject line optimization
 * - Content variations
 * - Audience targeting suggestions
 */

import { getAIService, AIService } from './service';

// ============================================
// Types
// ============================================

export type CampaignType = 
  | 'promotion'
  | 'reengagement'
  | 'announcement'
  | 'upsell'
  | 'welcome'
  | 'seasonal';

export type CampaignChannel = 'email' | 'dm' | 'mass_message' | 'ppv';

export interface GenerateCampaignRequest {
  creatorId: number;
  type: CampaignType;
  goal: string;
  targetAudience?: string;
  tone?: 'friendly' | 'professional' | 'flirty' | 'urgent';
  includeOffer?: boolean;
  offerDetails?: {
    discountPercent?: number;
    validDays?: number;
  };
}

export interface GeneratedCampaign {
  name: string;
  description: string;
  type: CampaignType;
  channels: CampaignChannel[];
  subject: string;
  subjectVariations: string[];
  body: string;
  bodyVariations: string[];
  callToAction: string;
  targetingTips: string[];
  bestSendTime: string;
  estimatedEngagement: number;
  confidence: number;
}

export interface OptimizeSubjectRequest {
  originalSubject: string;
  campaignType: CampaignType;
  tone?: string;
  maxLength?: number;
}

export interface OptimizeSubjectResponse {
  optimized: string;
  variations: string[];
  improvements: string[];
  confidence: number;
}

// ============================================
// AI Campaign Generator Service
// ============================================

export class AICampaignGeneratorService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || getAIService();
  }

  /**
   * Generate a complete marketing campaign
   */
  async generateCampaign(
    request: GenerateCampaignRequest
  ): Promise<GeneratedCampaign> {
    const prompt = this.buildCampaignPrompt(request);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative', // Mistral Large for creative content
        systemPrompt: this.getCampaignSystemPrompt(),
      });

      return this.parseCampaignResponse(result.content, request);
    } catch (error) {
      console.error('[CampaignGenerator] Error:', error);
      return this.generateFallbackCampaign(request);
    }
  }

  /**
   * Optimize email/message subject lines
   */
  async optimizeSubjectLine(
    request: OptimizeSubjectRequest
  ): Promise<OptimizeSubjectResponse> {
    const prompt = this.buildSubjectPrompt(request);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative',
        systemPrompt: this.getSubjectSystemPrompt(),
      });

      return this.parseSubjectResponse(result.content, request.originalSubject);
    } catch (error) {
      console.error('[CampaignGenerator] Subject optimization error:', error);
      return this.generateFallbackSubject(request);
    }
  }

  /**
   * Generate multiple campaign variations for A/B testing
   */
  async generateCampaignVariations(
    request: GenerateCampaignRequest,
    count: number = 3
  ): Promise<GeneratedCampaign[]> {
    const campaigns: GeneratedCampaign[] = [];
    
    // Generate base campaign
    const base = await this.generateCampaign(request);
    campaigns.push(base);

    // Generate variations with different tones
    const tones: Array<'friendly' | 'professional' | 'flirty' | 'urgent'> = 
      ['friendly', 'professional', 'flirty', 'urgent'];
    
    for (let i = 1; i < count && i < tones.length; i++) {
      const variation = await this.generateCampaign({
        ...request,
        tone: tones[i],
      });
      campaigns.push(variation);
    }

    return campaigns;
  }

  // ============================================
  // Private - Prompt Building
  // ============================================

  private getCampaignSystemPrompt(): string {
    return `You are a marketing expert for OnlyFans creators.
Generate engaging, high-converting campaigns.

Rules:
1. Be creative but appropriate for the platform
2. Include multiple subject line variations
3. Suggest optimal send times
4. Provide targeting tips
5. Return valid JSON only

Response format:
{
  "name": "Campaign name",
  "description": "Brief description",
  "channels": ["dm", "email"],
  "subject": "Main subject line",
  "subjectVariations": ["Alt 1", "Alt 2", "Alt 3"],
  "body": "Full message body with {{placeholders}}",
  "bodyVariations": ["Variation 1", "Variation 2"],
  "callToAction": "CTA text",
  "targetingTips": ["Tip 1", "Tip 2"],
  "bestSendTime": "Tuesday 7-9 PM",
  "estimatedEngagement": 0.15,
  "confidence": 0.85
}`;
  }

  private buildCampaignPrompt(request: GenerateCampaignRequest): string {
    const { type, goal, targetAudience, tone, includeOffer, offerDetails } = request;

    let prompt = `Create a ${type} campaign for an OnlyFans creator.

GOAL: ${goal}
TONE: ${tone || 'friendly'}
TARGET: ${targetAudience || 'all subscribers'}
`;

    if (includeOffer && offerDetails) {
      prompt += `
OFFER DETAILS:
- Discount: ${offerDetails.discountPercent || 20}%
- Valid for: ${offerDetails.validDays || 7} days
`;
    }

    prompt += `
Available placeholders: {{fan_name}}, {{creator_name}}, {{offer_discount}}, {{offer_expiry}}

Generate a complete campaign with:
1. Catchy subject line + 3 variations
2. Engaging message body + 2 variations
3. Clear call-to-action
4. Targeting tips
5. Best send time

Return JSON only.`;

    return prompt;
  }

  private getSubjectSystemPrompt(): string {
    return `You are an email subject line optimization expert.
Create high-open-rate subject lines for OnlyFans creators.

Rules:
1. Keep under 50 characters when possible
2. Create curiosity or urgency
3. Personalize when appropriate
4. Avoid spam trigger words
5. Return valid JSON only

Response format:
{
  "optimized": "Best subject line",
  "variations": ["Alt 1", "Alt 2", "Alt 3", "Alt 4"],
  "improvements": ["What was improved 1", "What was improved 2"]
}`;
  }

  private buildSubjectPrompt(request: OptimizeSubjectRequest): string {
    return `Optimize this subject line for a ${request.campaignType} campaign:

Original: "${request.originalSubject}"
Tone: ${request.tone || 'engaging'}
Max length: ${request.maxLength || 50} characters

Create an optimized version and 4 variations.
Explain what improvements were made.

Return JSON only.`;
  }

  // ============================================
  // Private - Response Parsing
  // ============================================

  private parseCampaignResponse(
    content: string,
    request: GenerateCampaignRequest
  ): GeneratedCampaign {
    try {
      const json = this.extractJSON(content);
      const parsed = JSON.parse(json);

      return {
        name: parsed.name || `${request.type} Campaign`,
        description: parsed.description || request.goal,
        type: request.type,
        channels: this.validateChannels(parsed.channels),
        subject: parsed.subject || 'Special message for you 💕',
        subjectVariations: Array.isArray(parsed.subjectVariations) 
          ? parsed.subjectVariations.slice(0, 5) 
          : [],
        body: parsed.body || 'Hey {{fan_name}}! Check this out...',
        bodyVariations: Array.isArray(parsed.bodyVariations) 
          ? parsed.bodyVariations.slice(0, 3) 
          : [],
        callToAction: parsed.callToAction || 'Check it out!',
        targetingTips: Array.isArray(parsed.targetingTips) 
          ? parsed.targetingTips 
          : [],
        bestSendTime: parsed.bestSendTime || 'Evening (7-9 PM)',
        estimatedEngagement: Math.min(1, Math.max(0, Number(parsed.estimatedEngagement) || 0.1)),
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
      };
    } catch {
      return this.generateFallbackCampaign(request);
    }
  }

  private parseSubjectResponse(
    content: string,
    original: string
  ): OptimizeSubjectResponse {
    try {
      const json = this.extractJSON(content);
      const parsed = JSON.parse(json);

      return {
        optimized: parsed.optimized || original,
        variations: Array.isArray(parsed.variations) 
          ? parsed.variations.slice(0, 5) 
          : [original],
        improvements: Array.isArray(parsed.improvements) 
          ? parsed.improvements 
          : [],
        confidence: 0.8,
      };
    } catch {
      return this.generateFallbackSubject({ originalSubject: original, campaignType: 'promotion' });
    }
  }

  // ============================================
  // Private - Helpers
  // ============================================

  private extractJSON(content: string): string {
    let json = content.trim();
    if (json.startsWith('```')) {
      const match = json.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) json = match[1].trim();
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : json;
  }

  private validateChannels(channels: any): CampaignChannel[] {
    const valid: CampaignChannel[] = ['email', 'dm', 'mass_message', 'ppv'];
    if (!Array.isArray(channels)) return ['dm'];
    return channels.filter(c => valid.includes(c));
  }

  private generateFallbackCampaign(request: GenerateCampaignRequest): GeneratedCampaign {
    const templates: Record<CampaignType, Partial<GeneratedCampaign>> = {
      promotion: {
        name: 'Special Promotion',
        subject: '🔥 Special offer just for you!',
        body: 'Hey {{fan_name}}! I have something special for you today...',
        callToAction: 'Claim your discount!',
      },
      reengagement: {
        name: 'We Miss You',
        subject: 'I miss you {{fan_name}} 💕',
        body: 'Hey {{fan_name}}! It\'s been a while and I wanted to check in...',
        callToAction: 'Come back and see what\'s new!',
      },
      announcement: {
        name: 'Big Announcement',
        subject: '📢 Big news!',
        body: 'Hey {{fan_name}}! I have some exciting news to share...',
        callToAction: 'Check it out!',
      },
      upsell: {
        name: 'Exclusive Content',
        subject: 'Unlock exclusive content 🔓',
        body: 'Hey {{fan_name}}! I just dropped something special...',
        callToAction: 'Get access now!',
      },
      welcome: {
        name: 'Welcome Message',
        subject: 'Welcome to my page! 💕',
        body: 'Hey {{fan_name}}! Thank you so much for subscribing...',
        callToAction: 'Explore my content!',
      },
      seasonal: {
        name: 'Seasonal Special',
        subject: '🎉 Limited time offer!',
        body: 'Hey {{fan_name}}! To celebrate, I\'m offering something special...',
        callToAction: 'Don\'t miss out!',
      },
    };

    const template = templates[request.type] || templates.promotion;

    return {
      name: template.name || 'Campaign',
      description: request.goal,
      type: request.type,
      channels: ['dm'],
      subject: template.subject || 'Special message for you',
      subjectVariations: [],
      body: template.body || 'Hey {{fan_name}}!',
      bodyVariations: [],
      callToAction: template.callToAction || 'Check it out!',
      targetingTips: ['Target active subscribers first'],
      bestSendTime: 'Evening (7-9 PM)',
      estimatedEngagement: 0.1,
      confidence: 0.4,
    };
  }

  private generateFallbackSubject(request: OptimizeSubjectRequest): OptimizeSubjectResponse {
    return {
      optimized: request.originalSubject,
      variations: [
        `🔥 ${request.originalSubject}`,
        `Hey! ${request.originalSubject}`,
        `Don't miss: ${request.originalSubject}`,
      ],
      improvements: ['Added emoji for visibility', 'Made more personal'],
      confidence: 0.4,
    };
  }
}

// ============================================
// Singleton & Exports
// ============================================

let campaignGeneratorInstance: AICampaignGeneratorService | null = null;

export function getAICampaignGeneratorService(): AICampaignGeneratorService {
  if (!campaignGeneratorInstance) {
    campaignGeneratorInstance = new AICampaignGeneratorService();
  }
  return campaignGeneratorInstance;
}

export async function generateCampaign(
  request: GenerateCampaignRequest
): Promise<GeneratedCampaign> {
  return getAICampaignGeneratorService().generateCampaign(request);
}

export async function optimizeSubjectLine(
  request: OptimizeSubjectRequest
): Promise<OptimizeSubjectResponse> {
  return getAICampaignGeneratorService().optimizeSubjectLine(request);
}
