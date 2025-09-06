export interface LLMProvider {
  name: string;
  generateDraft(params: LLMDraftParams): Promise<LLMDraftResponse>;
  validateContent(content: string, guardrails: ContentGuardrails): Promise<ValidationResult>;
}

export interface LLMDraftParams {
  fanMessage: string;
  fanData: {
    name: string;
    rfmSegment: 'WHALE' | 'VIP' | 'CASUAL' | 'CHURN_RISK' | 'UNKNOWN';
    lastActive: string;
    totalSpent: number;
    messageCount: number;
    propensityScore?: number;
  };
  persona: {
    name: string;
    style_guide: string;
    tone_keywords: string[];
    templates?: {
      welcome?: string;
      upsell?: string;
      reactivation?: string;
    };
  };
  conversationHistory?: string[];
  platform?: string;
}

export interface ContentGuardrails {
  forbidden_words: string[];
  escalation_triggers: string[];
  frequency_limits?: {
    max_per_hour: number;
    cooldown_minutes: number;
  };
  max_length?: number;
  require_cta?: boolean;
  block_external_links?: boolean;
}

export interface LLMDraftResponse {
  draft: string;
  confidence: number;
  reasoning: string;
  upsell_opportunity: boolean;
  recommended_ppv_price?: number;
  persona_elements_used: string[];
  tone_analysis: {
    warmth: number;
    playfulness: number;
    professionalism: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  triggered_rules: string[];
  suggestions?: string[];
}

// Claude Provider
export class ClaudeProvider implements LLMProvider {
  name = 'Claude 3.5 Sonnet';
  private apiKey: string;
  private apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDraft(params: LLMDraftParams): Promise<LLMDraftResponse> {
    const systemPrompt = this.buildSystemPrompt(params.persona);
    const userPrompt = this.buildUserPrompt(params);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userPrompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseClaudeResponse(data.content[0].text, params);
    } catch (error) {
      console.error('Claude API error:', error);
      return this.fallbackResponse(params);
    }
  }

  async validateContent(content: string, guardrails: ContentGuardrails): Promise<ValidationResult> {
    const triggered: string[] = [];
    const contentLower = content.toLowerCase();

    // Check forbidden words
    guardrails.forbidden_words.forEach(word => {
      if (contentLower.includes(word.toLowerCase())) {
        triggered.push(`forbidden:${word}`);
      }
    });

    // Check escalation triggers
    guardrails.escalation_triggers.forEach(trigger => {
      if (contentLower.includes(trigger.toLowerCase())) {
        triggered.push(`escalation:${trigger}`);
      }
    });

    // Check max length
    if (guardrails.max_length && content.length > guardrails.max_length) {
      triggered.push(`length:exceeds_${guardrails.max_length}`);
    }

    // Check for external links
    if (guardrails.block_external_links && /https?:\/\/(?!huntaze\.com)/i.test(content)) {
      triggered.push('external_link_detected');
    }

    return {
      valid: triggered.length === 0,
      triggered_rules: triggered,
      suggestions: triggered.length > 0 ? ['Revise content to comply with guardrails'] : undefined
    };
  }

  private buildSystemPrompt(persona: any): string {
    return `You are ${persona.name}, a content creator. Your communication style:
${persona.style_guide}

Key tone attributes: ${persona.tone_keywords.join(', ')}

Guidelines:
- Be authentic and conversational
- Match the fan's energy and interest level
- Subtly guide towards premium content when appropriate
- Never mention technical details or that you're an AI
- Keep responses concise (2-3 sentences max)
- Use emojis sparingly and appropriately`;
  }

  private buildUserPrompt(params: LLMDraftParams): string {
    const { fanMessage, fanData } = params;
    
    return `Fan "${fanData.name}" (${fanData.rfmSegment} segment) says: "${fanMessage}"

Context:
- Total spent: $${fanData.totalSpent}
- Last active: ${this.getRelativeTime(fanData.lastActive)}
- Message count: ${fanData.messageCount}
- Propensity score: ${fanData.propensityScore || 'unknown'}

Craft an appropriate response that:
1. Addresses their message naturally
2. Maintains your persona
3. ${fanData.rfmSegment === 'WHALE' || fanData.rfmSegment === 'VIP' ? 'Shows appreciation for their support' : 'Builds connection'}
4. ${fanData.propensityScore && fanData.propensityScore > 0.7 ? 'Includes subtle upsell opportunity' : 'Focuses on engagement'}`;
  }

  private parseClaudeResponse(response: string, params: LLMDraftParams): LLMDraftResponse {
    // Extract and analyze the response
    const draft = response.trim();
    const hasUpsell = /premium|exclusive|special|private|custom|personal/i.test(draft);
    
    return {
      draft,
      confidence: 0.85,
      reasoning: `Generated response for ${params.fanData.rfmSegment} segment fan with Claude 3.5 Sonnet`,
      upsell_opportunity: hasUpsell && (params.fanData.propensityScore ?? 0) > 0.6,
      recommended_ppv_price: hasUpsell ? this.calculatePPVPrice(params.fanData) : undefined,
      persona_elements_used: params.persona.tone_keywords.filter(kw => 
        new RegExp(kw, 'i').test(draft)
      ),
      tone_analysis: {
        warmth: 0.8,
        playfulness: 0.6,
        professionalism: 0.7
      }
    };
  }

  protected fallbackResponse(params: LLMDraftParams): LLMDraftResponse {
    const templates = params.persona.templates || {};
    let template = templates.welcome || "Hey ${name}! Thanks for your message 💕";
    
    if (params.fanData.rfmSegment === 'WHALE' || params.fanData.rfmSegment === 'VIP') {
      template = templates.upsell || "Hey ${name}! I have something special just for you... interested? 😘";
    } else if (params.fanData.rfmSegment === 'CHURN_RISK') {
      template = templates.reactivation || "Hey ${name}! Haven't heard from you in a while. Miss chatting with you! 💭";
    }

    const draft = template.replace('${name}', params.fanData.name);

    return {
      draft,
      confidence: 0.5,
      reasoning: 'Fallback template used',
      upsell_opportunity: false,
      persona_elements_used: [],
      tone_analysis: {
        warmth: 0.5,
        playfulness: 0.5,
        professionalism: 0.5
      }
    };
  }

  private getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  private calculatePPVPrice(fanData: any): number {
    const basePrice = 10;
    const spentMultiplier = Math.min(fanData.totalSpent / 100, 3);
    const propensityBonus = (fanData.propensityScore || 0.5) * 10;
    
    return Math.round((basePrice + propensityBonus) * spentMultiplier);
  }
}

// OpenAI Provider
export class OpenAIProvider extends ClaudeProvider {
  name = 'GPT-4';
  private openAIApiKey: string;
  private openAIApiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    super('');
    this.openAIApiKey = apiKey;
  }

  async generateDraft(params: LLMDraftParams): Promise<LLMDraftResponse> {
    // Similar implementation to Claude but using OpenAI API
    // For brevity, returning fallback for now
    return this.fallbackResponse(params);
  }

  async validateContent(content: string, guardrails: ContentGuardrails): Promise<ValidationResult> {
    return super.validateContent(content, guardrails);
  }
}

// Factory function to get provider
export function getLLMProvider(providerName?: string): LLMProvider {
  const provider = providerName || process.env.LLM_PROVIDER || 'claude';
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || '';

  switch (provider.toLowerCase()) {
    case 'claude':
      return new ClaudeProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    default:
      // Return Claude as default
      return new ClaudeProvider(apiKey);
  }
}