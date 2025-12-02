/**
 * Azure Prompt Optimizer Service
 * Optimizes prompts for Azure OpenAI with caching, truncation, and few-shot examples
 * 
 * Implements:
 * - Property 34: Azure OpenAI prompt formatting
 * - Property 35: JSON mode for structured output
 * - Property 36: Prompt caching
 * - Property 37: Intelligent prompt truncation
 * - Property 38: Few-shot example inclusion
 */

import { createHash } from 'crypto';
import type { ChatMessage, GenerationOptions } from './azure-openai.types';
import { AZURE_OPENAI_MODELS, type AzureDeployment } from './azure-openai.config';

// ============================================================================
// Types
// ============================================================================

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  fewShotExamples?: FewShotExample[];
  outputFormat?: 'text' | 'json';
  jsonSchema?: Record<string, unknown>;
  maxContextTokens?: number;
  preserveKeys?: string[];
}

export interface FewShotExample {
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface OptimizedPrompt {
  messages: ChatMessage[];
  options: GenerationOptions;
  cacheKey: string;
  tokenEstimate: number;
  wasTruncated: boolean;
  truncationDetails?: TruncationDetails;
}

export interface TruncationDetails {
  originalTokens: number;
  truncatedTokens: number;
  preservedSections: string[];
  removedSections: string[];
}

export interface CacheEntry {
  prompt: OptimizedPrompt;
  timestamp: number;
  hits: number;
}

export interface PromptOptimizerConfig {
  cacheTTL: number; // milliseconds
  maxCacheSize: number;
  defaultMaxTokens: number;
  tokenBuffer: number; // Reserve tokens for response
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: PromptOptimizerConfig = {
  cacheTTL: 3600000, // 1 hour
  maxCacheSize: 1000,
  defaultMaxTokens: 4096,
  tokenBuffer: 1024,
};

// ============================================================================
// Azure Prompt Optimizer Service
// ============================================================================

export class AzurePromptOptimizerService {
  private cache: Map<string, CacheEntry> = new Map();
  private config: PromptOptimizerConfig;
  private templates: Map<string, PromptTemplate> = new Map();

  constructor(config: Partial<PromptOptimizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDefaultTemplates();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Optimize a prompt for Azure OpenAI
   * Applies formatting, caching, truncation, and few-shot examples
   */
  optimizePrompt(
    userPrompt: string,
    templateId: string,
    context?: Record<string, unknown>,
    deployment: AzureDeployment = 'gpt-4-turbo-prod'
  ): OptimizedPrompt {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(userPrompt, templateId, context);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Build optimized prompt
    const optimized = this.buildOptimizedPrompt(
      userPrompt,
      template,
      context,
      deployment
    );

    // Store in cache
    this.storeInCache(cacheKey, optimized);

    return optimized;
  }

  /**
   * Format prompt for Azure OpenAI specific requirements
   * Property 34: Azure OpenAI prompt formatting
   */
  formatForAzure(prompt: string, options: FormatOptions = {}): string {
    let formatted = prompt;

    // Apply Azure-specific formatting
    formatted = this.applyAzureFormatting(formatted);

    // Add instruction markers if needed
    if (options.addInstructionMarkers) {
      formatted = this.addInstructionMarkers(formatted);
    }

    // Normalize whitespace
    formatted = this.normalizeWhitespace(formatted);

    return formatted;
  }

  /**
   * Configure JSON mode for structured output
   * Property 35: JSON mode for structured output
   */
  configureJsonMode(
    schema?: Record<string, unknown>
  ): GenerationOptions {
    const options: GenerationOptions = {
      responseFormat: { type: 'json_object' },
    };

    return options;
  }

  /**
   * Build JSON mode system prompt
   */
  buildJsonModeSystemPrompt(
    basePrompt: string,
    schema?: Record<string, unknown>
  ): string {
    let systemPrompt = basePrompt;

    // Add JSON instruction
    systemPrompt += '\n\nYou must respond with valid JSON only.';

    // Add schema if provided
    if (schema) {
      systemPrompt += `\n\nYour response must follow this JSON schema:\n${JSON.stringify(schema, null, 2)}`;
    }

    return systemPrompt;
  }

  /**
   * Truncate prompt while preserving key context
   * Property 37: Intelligent prompt truncation
   */
  truncatePrompt(
    prompt: string,
    maxTokens: number,
    preserveKeys: string[] = []
  ): { text: string; details: TruncationDetails } {
    const originalTokens = this.estimateTokens(prompt);

    if (originalTokens <= maxTokens) {
      return {
        text: prompt,
        details: {
          originalTokens,
          truncatedTokens: originalTokens,
          preservedSections: [],
          removedSections: [],
        },
      };
    }

    // Parse prompt into sections
    const sections = this.parsePromptSections(prompt);
    const preservedSections: string[] = [];
    const removedSections: string[] = [];

    // Identify sections to preserve
    const toPreserve = sections.filter(s => 
      preserveKeys.some(key => s.toLowerCase().includes(key.toLowerCase()))
    );
    preservedSections.push(...toPreserve.map(s => s.substring(0, 50) + '...'));

    // Calculate available tokens
    const preservedTokens = toPreserve.reduce(
      (sum, s) => sum + this.estimateTokens(s),
      0
    );
    const availableTokens = Math.max(0, maxTokens - preservedTokens);

    // If we have preserved sections that exceed the limit, truncate them too
    if (preservedTokens > maxTokens) {
      const truncatedPreserved = this.truncateToTokens(toPreserve.join('\n'), maxTokens);
      return {
        text: truncatedPreserved,
        details: {
          originalTokens,
          truncatedTokens: this.estimateTokens(truncatedPreserved),
          preservedSections,
          removedSections: sections.filter(s => !toPreserve.includes(s)).map(s => s.substring(0, 50) + '...'),
        },
      };
    }

    // Truncate remaining sections
    const otherSections = sections.filter(s => !toPreserve.includes(s));
    let truncatedOthers = '';
    let currentTokens = 0;

    for (const section of otherSections) {
      const sectionTokens = this.estimateTokens(section);
      if (currentTokens + sectionTokens <= availableTokens) {
        truncatedOthers += section + '\n';
        currentTokens += sectionTokens;
      } else {
        // Partial truncation of this section
        const remainingTokens = availableTokens - currentTokens;
        if (remainingTokens > 10) {
          const truncated = this.truncateToTokens(section, remainingTokens);
          truncatedOthers += truncated;
        }
        removedSections.push(section.substring(0, 50) + '...');
        break;
      }
    }

    // Combine preserved and truncated sections
    let result = [...toPreserve, truncatedOthers].join('\n').trim();
    
    // Final safety check - ensure we're within limits
    let resultTokens = this.estimateTokens(result);
    while (resultTokens > maxTokens && result.length > 10) {
      result = result.substring(0, Math.floor(result.length * 0.9));
      resultTokens = this.estimateTokens(result);
    }

    return {
      text: result || prompt.substring(0, maxTokens * 4), // Fallback
      details: {
        originalTokens,
        truncatedTokens: this.estimateTokens(result),
        preservedSections,
        removedSections,
      },
    };
  }

  /**
   * Add few-shot examples to prompt
   * Property 38: Few-shot example inclusion
   */
  addFewShotExamples(
    messages: ChatMessage[],
    examples: FewShotExample[],
    maxExamples: number = 3
  ): ChatMessage[] {
    if (!examples || examples.length === 0) {
      return messages;
    }

    // Select best examples (up to maxExamples)
    const selectedExamples = examples.slice(0, maxExamples);

    // Build example messages
    const exampleMessages: ChatMessage[] = [];
    for (const example of selectedExamples) {
      exampleMessages.push(
        { role: 'user', content: example.input },
        { role: 'assistant', content: example.output }
      );
    }

    // Insert examples after system message
    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const result: ChatMessage[] = [];
    if (systemMessage) {
      result.push(systemMessage);
    }
    result.push(...exampleMessages);
    result.push(...otherMessages);

    return result;
  }

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a registered template
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    return {
      size: this.cache.size,
      hits: totalHits,
      misses: 0, // Would need separate tracking
    };
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Estimate token count for text
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    // More accurate would use tiktoken
    return Math.ceil(text.length / 4);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildOptimizedPrompt(
    userPrompt: string,
    template: PromptTemplate,
    context: Record<string, unknown> | undefined,
    deployment: AzureDeployment
  ): OptimizedPrompt {
    const modelConfig = AZURE_OPENAI_MODELS[deployment];
    const maxContextTokens = template.maxContextTokens || 
      (modelConfig.maxTokens ? modelConfig.maxTokens - this.config.tokenBuffer : this.config.defaultMaxTokens);

    // Build system prompt
    let systemPrompt = this.formatForAzure(template.systemPrompt);

    // Configure JSON mode if needed
    const options: GenerationOptions = {};
    if (template.outputFormat === 'json') {
      systemPrompt = this.buildJsonModeSystemPrompt(systemPrompt, template.jsonSchema);
      options.responseFormat = { type: 'json_object' };
    }

    // Inject context into system prompt
    if (context) {
      systemPrompt = this.injectContext(systemPrompt, context);
    }

    // Build initial messages
    let messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: this.formatForAzure(userPrompt) },
    ];

    // Add few-shot examples
    if (template.fewShotExamples && template.fewShotExamples.length > 0) {
      messages = this.addFewShotExamples(messages, template.fewShotExamples);
    }

    // Calculate current token usage
    let tokenEstimate = this.estimateMessagesTokens(messages);
    let wasTruncated = false;
    let truncationDetails: TruncationDetails | undefined;

    // Truncate if needed
    if (tokenEstimate > maxContextTokens) {
      const truncateResult = this.truncateMessages(
        messages,
        maxContextTokens,
        template.preserveKeys || []
      );
      messages = truncateResult.messages;
      tokenEstimate = truncateResult.tokenEstimate;
      wasTruncated = true;
      truncationDetails = truncateResult.details;
    }

    return {
      messages,
      options,
      cacheKey: this.generateCacheKey(userPrompt, template.id, context),
      tokenEstimate,
      wasTruncated,
      truncationDetails,
    };
  }

  private generateCacheKey(
    prompt: string,
    templateId: string,
    context?: Record<string, unknown>
  ): string {
    const data = JSON.stringify({ prompt, templateId, context });
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private getFromCache(key: string): OptimizedPrompt | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.prompt;
  }

  private storeInCache(key: string, prompt: OptimizedPrompt): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldestEntries();
    }

    this.cache.set(key, {
      prompt,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  private evictOldestEntries(): void {
    // Remove 10% of oldest entries
    const toRemove = Math.ceil(this.config.maxCacheSize * 0.1);
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private applyAzureFormatting(prompt: string): string {
    // Azure OpenAI specific formatting
    let formatted = prompt;

    // Ensure proper line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Remove excessive whitespace
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Trim
    formatted = formatted.trim();

    return formatted;
  }

  private addInstructionMarkers(prompt: string): string {
    // Add clear instruction markers for Azure OpenAI
    if (!prompt.includes('[INSTRUCTIONS]')) {
      return `[INSTRUCTIONS]\n${prompt}\n[/INSTRUCTIONS]`;
    }
    return prompt;
  }

  private normalizeWhitespace(text: string): string {
    return text
      .replace(/[ \t]+/g, ' ')
      .replace(/\n /g, '\n')
      .replace(/ \n/g, '\n')
      .trim();
  }

  private injectContext(prompt: string, context: Record<string, unknown>): string {
    let result = prompt;
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      result = result.replace(new RegExp(placeholder, 'g'), stringValue);
    }
    return result;
  }

  private parsePromptSections(prompt: string): string[] {
    // Split by double newlines or markdown headers
    return prompt
      .split(/\n\n+|(?=^#{1,3}\s)/m)
      .filter(s => s.trim().length > 0);
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const targetChars = maxTokens * 4; // Rough estimate
    if (text.length <= targetChars) {
      return text;
    }
    return text.substring(0, targetChars);
  }

  private estimateMessagesTokens(messages: ChatMessage[]): number {
    let total = 0;
    for (const msg of messages) {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : msg.content.filter(p => p.type === 'text').map(p => p.text).join(' ');
      total += this.estimateTokens(content);
      total += 4; // Message overhead
    }
    return total;
  }

  private truncateMessages(
    messages: ChatMessage[],
    maxTokens: number,
    preserveKeys: string[]
  ): { messages: ChatMessage[]; tokenEstimate: number; details: TruncationDetails } {
    const originalTokens = this.estimateMessagesTokens(messages);
    const preservedSections: string[] = [];
    const removedSections: string[] = [];

    // Always preserve system message and last user message
    const systemMsg = messages.find(m => m.role === 'system');
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const otherMsgs = messages.filter(m => m !== systemMsg && m !== lastUserMsg);

    // Calculate base tokens
    let baseTokens = 0;
    if (systemMsg) baseTokens += this.estimateTokens(systemMsg.content as string) + 4;
    if (lastUserMsg) baseTokens += this.estimateTokens(lastUserMsg.content as string) + 4;

    const availableTokens = maxTokens - baseTokens;

    // Truncate other messages (few-shot examples)
    const truncatedOthers: ChatMessage[] = [];
    let currentTokens = 0;

    for (const msg of otherMsgs) {
      const msgTokens = this.estimateTokens(msg.content as string) + 4;
      if (currentTokens + msgTokens <= availableTokens) {
        truncatedOthers.push(msg);
        currentTokens += msgTokens;
      } else {
        removedSections.push(`${msg.role}: ${(msg.content as string).substring(0, 30)}...`);
      }
    }

    // Rebuild messages
    const result: ChatMessage[] = [];
    if (systemMsg) result.push(systemMsg);
    result.push(...truncatedOthers);
    if (lastUserMsg) result.push(lastUserMsg);

    return {
      messages: result,
      tokenEstimate: baseTokens + currentTokens,
      details: {
        originalTokens,
        truncatedTokens: baseTokens + currentTokens,
        preservedSections,
        removedSections,
      },
    };
  }

  private initializeDefaultTemplates(): void {
    // Messaging AI template
    this.registerTemplate({
      id: 'messaging-ai',
      name: 'Messaging AI',
      systemPrompt: `You are Emma, a friendly and engaging messaging assistant for content creators.
Your personality: {{personality}}
Creator context: {{creatorContext}}

Guidelines:
- Match the creator's tone and style
- Be warm, authentic, and engaging
- Keep responses concise but meaningful
- Consider the fan's emotional state: {{emotionalState}}`,
      outputFormat: 'text',
      fewShotExamples: [
        {
          input: 'Hey! Love your content 😍',
          output: 'Aww thank you so much! 💕 That means the world to me! What kind of content do you enjoy most?',
        },
        {
          input: 'When is your next post?',
          output: 'I\'ve got something special coming tomorrow! 🔥 Make sure you have notifications on so you don\'t miss it!',
        },
      ],
      preserveKeys: ['personality', 'creatorContext'],
    });

    // Analytics AI template
    this.registerTemplate({
      id: 'analytics-ai',
      name: 'Analytics AI',
      systemPrompt: `You are Alex, an analytics expert for content creators.
Analyze the provided data and generate actionable insights.

Data context: {{dataContext}}

Provide your analysis in the following JSON format:
{
  "insights": [{"title": string, "description": string, "impact": "high"|"medium"|"low"}],
  "predictions": [{"metric": string, "prediction": string, "confidence": number}],
  "recommendations": [{"action": string, "expectedOutcome": string, "priority": number}]
}`,
      outputFormat: 'json',
      jsonSchema: {
        type: 'object',
        properties: {
          insights: { type: 'array' },
          predictions: { type: 'array' },
          recommendations: { type: 'array' },
        },
        required: ['insights', 'predictions', 'recommendations'],
      },
      preserveKeys: ['dataContext'],
    });

    // Sales AI template
    this.registerTemplate({
      id: 'sales-ai',
      name: 'Sales AI',
      systemPrompt: `You are Sarah, a sales optimization assistant for content creators.
Help optimize pricing and upsell strategies.

Creator pricing: {{pricing}}
Fan purchase history: {{purchaseHistory}}

Generate persuasive but authentic upsell messages.`,
      outputFormat: 'text',
      fewShotExamples: [
        {
          input: 'Fan interested in exclusive content',
          output: 'I\'ve got something really special just for my VIPs! 💎 Want a sneak peek? I think you\'ll love it!',
        },
        {
          input: 'Fan asking about custom content',
          output: 'Custom content is my favorite to create! 🎨 Let me know what you have in mind and I\'ll make something just for you!',
        },
        {
          input: 'Fan hesitating on purchase',
          output: 'No pressure at all! 💕 But just so you know, this one\'s been super popular. Let me know if you have any questions!',
        },
      ],
      preserveKeys: ['pricing', 'purchaseHistory'],
    });

    // Compliance AI template
    this.registerTemplate({
      id: 'compliance-ai',
      name: 'Compliance AI',
      systemPrompt: `You are Claire, a content compliance checker.
Review content for policy violations and suggest compliant alternatives.

Platform policies: {{policies}}

Respond in JSON format:
{
  "isCompliant": boolean,
  "violations": [{"type": string, "description": string, "severity": "high"|"medium"|"low"}],
  "suggestions": [{"original": string, "suggested": string, "reason": string}]
}`,
      outputFormat: 'json',
      jsonSchema: {
        type: 'object',
        properties: {
          isCompliant: { type: 'boolean' },
          violations: { type: 'array' },
          suggestions: { type: 'array' },
        },
        required: ['isCompliant', 'violations', 'suggestions'],
      },
      preserveKeys: ['policies'],
    });

    // Content Generation template
    this.registerTemplate({
      id: 'content-generation',
      name: 'Content Generation',
      systemPrompt: `You are a creative content assistant for social media creators.
Generate engaging captions and content based on visual analysis.

Visual context: {{visualContext}}
Creator style: {{creatorStyle}}
Trending topics: {{trendingTopics}}

Create authentic, engaging content that matches the creator's voice.`,
      outputFormat: 'text',
      fewShotExamples: [
        {
          input: 'Beach photo at sunset',
          output: 'Golden hour hits different 🌅✨ Sometimes you just need to stop and appreciate the view. What\'s your favorite time of day?',
        },
        {
          input: 'Workout selfie at gym',
          output: 'No excuses, just results 💪🔥 Another day, another step closer to my goals. Who else is grinding today?',
        },
      ],
      preserveKeys: ['visualContext', 'creatorStyle'],
    });
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface FormatOptions {
  addInstructionMarkers?: boolean;
}

// ============================================================================
// Singleton Export
// ============================================================================

let instance: AzurePromptOptimizerService | null = null;

export function getAzurePromptOptimizer(): AzurePromptOptimizerService {
  if (!instance) {
    instance = new AzurePromptOptimizerService();
  }
  return instance;
}
