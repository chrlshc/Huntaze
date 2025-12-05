/**
 * AI Automation Builder Service
 * 
 * Uses DeepSeek R1 to generate automation flows from natural language descriptions.
 * Integrates with the existing AI infrastructure (router/coordinator).
 * 
 * Requirements: 1.1, 4.1, 4.2, 4.3
 */

import { getAIService, AIService } from './service';
import {
  AutomationStep,
  BuildAutomationRequest,
  BuildAutomationResponse,
  TriggerType,
  ActionType,
  StepType,
} from '../automations/types';

// ============================================
// Constants
// ============================================

const AVAILABLE_TRIGGERS: TriggerType[] = [
  'new_subscriber',
  'message_received',
  'purchase_completed',
  'subscription_expiring',
];

const AVAILABLE_ACTIONS: ActionType[] = [
  'send_message',
  'create_offer',
  'add_tag',
  'wait',
];

const VALID_PLACEHOLDERS = [
  '{{fan_name}}',
  '{{fan_username}}',
  '{{creator_name}}',
  '{{purchase_amount}}',
  '{{subscription_days_left}}',
  '{{offer_discount}}',
  '{{offer_name}}',
  '{{content_title}}',
  '{{date}}',
  '{{time}}',
];

// ============================================
// Types
// ============================================

export interface GenerateTemplateRequest {
  triggerType: TriggerType;
  actionType: ActionType;
  context?: {
    tone?: 'friendly' | 'professional' | 'casual' | 'flirty';
    purpose?: string;
    fanData?: Record<string, unknown>;
  };
}

export interface GenerateTemplateResponse {
  template: string;
  placeholders: string[];
  confidence: number;
}

interface AIGeneratedFlow {
  name: string;
  description: string;
  steps: Array<{
    id: string;
    type: string;
    name: string;
    config: Record<string, unknown>;
  }>;
  confidence: number;
}

// ============================================
// AI Automation Builder Service
// ============================================

export class AutomationBuilderService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || getAIService();
  }

  /**
   * Build an automation flow from natural language description
   * Uses DeepSeek R1 for complex reasoning
   * 
   * Requirement 1.1: Generate structured flow from natural language
   */
  async buildAutomationFlow(
    request: BuildAutomationRequest
  ): Promise<BuildAutomationResponse> {
    const prompt = this.buildFlowPrompt(request.description);

    try {
      // Use 'math' type to route to DeepSeek R1 for complex reasoning
      const result = await this.aiService.request({
        prompt,
        type: 'math', // DeepSeek R1 for reasoning tasks
        systemPrompt: this.getSystemPrompt(),
      });

      const parsed = this.parseAIResponse(result.content);
      const validated = this.validateAndNormalizeFlow(parsed);

      return validated;
    } catch (error) {
      console.error('[AutomationBuilder] Error building flow:', error);
      // Return a fallback basic flow
      return this.createFallbackFlow(request.description);
    }
  }

  /**
   * Generate a response template for an automation action
   * 
   * Requirements 4.1, 4.2: Generate contextual message content
   */
  async generateResponseTemplate(
    request: GenerateTemplateRequest
  ): Promise<GenerateTemplateResponse> {
    const prompt = this.buildTemplatePrompt(request);

    try {
      const result = await this.aiService.request({
        prompt,
        type: 'creative', // Creative writing for templates
        systemPrompt: this.getTemplateSystemPrompt(),
      });

      const template = this.parseTemplateResponse(result.content);
      const placeholders = this.extractPlaceholders(template);
      const validatedPlaceholders = this.validatePlaceholders(placeholders);

      return {
        template,
        placeholders: validatedPlaceholders,
        confidence: this.calculateTemplateConfidence(template, validatedPlaceholders),
      };
    } catch (error) {
      console.error('[AutomationBuilder] Error generating template:', error);
      return this.createFallbackTemplate(request);
    }
  }

  /**
   * Validate that all placeholders in a template are valid
   * 
   * Requirement 4.3: Support placeholders for dynamic content
   */
  validateTemplatePlaceholders(template: string): {
    valid: boolean;
    invalidPlaceholders: string[];
    validPlaceholders: string[];
  } {
    const placeholders = this.extractPlaceholders(template);
    const validPlaceholders: string[] = [];
    const invalidPlaceholders: string[] = [];

    for (const placeholder of placeholders) {
      if (VALID_PLACEHOLDERS.includes(placeholder)) {
        validPlaceholders.push(placeholder);
      } else {
        invalidPlaceholders.push(placeholder);
      }
    }

    return {
      valid: invalidPlaceholders.length === 0,
      invalidPlaceholders,
      validPlaceholders,
    };
  }

  /**
   * Get list of available placeholders
   */
  getAvailablePlaceholders(): string[] {
    return [...VALID_PLACEHOLDERS];
  }

  /**
   * Get available triggers
   */
  getAvailableTriggers(): TriggerType[] {
    return [...AVAILABLE_TRIGGERS];
  }

  /**
   * Get available actions
   */
  getAvailableActions(): ActionType[] {
    return [...AVAILABLE_ACTIONS];
  }

  // ============================================
  // Private Methods - Prompt Building
  // ============================================

  private getSystemPrompt(): string {
    return `You are an automation flow builder for OnlyFans creators. 
Your task is to convert natural language descriptions into structured automation flows.

Available triggers: ${AVAILABLE_TRIGGERS.join(', ')}
Available actions: ${AVAILABLE_ACTIONS.join(', ')}

Rules:
1. Every flow must start with exactly one trigger
2. Actions must follow the trigger
3. Use realistic configurations
4. Return valid JSON only

Response format (JSON only, no markdown):
{
  "name": "Flow name",
  "description": "Brief description",
  "steps": [
    { "id": "step-1", "type": "trigger", "name": "trigger_name", "config": {} },
    { "id": "step-2", "type": "action", "name": "action_name", "config": {} }
  ],
  "confidence": 0.0-1.0
}`;
  }

  private buildFlowPrompt(description: string): string {
    return `Create an automation flow from this description:

"${description}"

Action configurations:
- send_message: { "template": "message text with {{placeholders}}", "placeholders": {} }
- create_offer: { "discountType": "percentage|fixed|bogo", "discountValue": number, "validDays": number }
- add_tag: { "tagName": "tag name" }
- wait: { "duration": number, "unit": "seconds|minutes|hours|days" }

Available placeholders: ${VALID_PLACEHOLDERS.join(', ')}

Return only valid JSON.`;
  }

  private getTemplateSystemPrompt(): string {
    return `You are a message template generator for OnlyFans creators.
Generate engaging, personalized message templates.

Available placeholders: ${VALID_PLACEHOLDERS.join(', ')}

Rules:
1. Use appropriate placeholders for personalization
2. Keep messages concise but engaging
3. Match the requested tone
4. Return only the message template text`;
  }

  private buildTemplatePrompt(request: GenerateTemplateRequest): string {
    const toneDesc = request.context?.tone || 'friendly';
    const purpose = request.context?.purpose || 'general engagement';

    return `Generate a message template for:
- Trigger: ${request.triggerType}
- Action: ${request.actionType}
- Tone: ${toneDesc}
- Purpose: ${purpose}

The template should be personalized and engaging.
Use placeholders like {{fan_name}} for dynamic content.
Return only the message text.`;
  }

  // ============================================
  // Private Methods - Response Parsing
  // ============================================

  private parseAIResponse(content: string): AIGeneratedFlow {
    // Try to extract JSON from the response
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return parsed as AIGeneratedFlow;
    } catch {
      // Try to find JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as AIGeneratedFlow;
        } catch {
          throw new Error('Failed to parse AI response as JSON');
        }
      }
      throw new Error('No valid JSON found in AI response');
    }
  }

  private parseTemplateResponse(content: string): string {
    // Remove any markdown formatting
    let template = content.trim();
    
    // Remove quotes if wrapped
    if ((template.startsWith('"') && template.endsWith('"')) ||
        (template.startsWith("'") && template.endsWith("'"))) {
      template = template.slice(1, -1);
    }

    return template;
  }

  // ============================================
  // Private Methods - Validation
  // ============================================

  private validateAndNormalizeFlow(
    parsed: AIGeneratedFlow
  ): BuildAutomationResponse {
    const steps: AutomationStep[] = [];
    let hasTrigger = false;

    for (const step of parsed.steps) {
      const normalizedStep = this.normalizeStep(step);
      
      if (normalizedStep) {
        if (normalizedStep.type === 'trigger') {
          if (hasTrigger) continue; // Only one trigger allowed
          hasTrigger = true;
        }
        steps.push(normalizedStep);
      }
    }

    // Ensure we have at least a trigger
    if (!hasTrigger && steps.length > 0) {
      steps.unshift({
        id: 'step-0',
        type: 'trigger',
        name: 'new_subscriber',
        config: {},
      });
    }

    return {
      name: parsed.name || 'Untitled Automation',
      description: parsed.description || '',
      steps,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  }

  private normalizeStep(
    step: AIGeneratedFlow['steps'][0]
  ): AutomationStep | null {
    const type = this.normalizeStepType(step.type);
    if (!type) return null;

    if (type === 'trigger') {
      const triggerName = this.normalizeTriggerName(step.name);
      if (!triggerName) return null;
      
      return {
        id: step.id || `step-${Date.now()}`,
        type: 'trigger',
        name: triggerName,
        config: step.config || {},
      };
    }

    if (type === 'action') {
      const actionName = this.normalizeActionName(step.name);
      if (!actionName) return null;

      return {
        id: step.id || `step-${Date.now()}`,
        type: 'action',
        name: actionName,
        config: this.normalizeActionConfig(actionName, step.config),
      };
    }

    if (type === 'condition') {
      return {
        id: step.id || `step-${Date.now()}`,
        type: 'condition',
        name: step.name || 'condition',
        config: step.config || {},
      };
    }

    return null;
  }

  private normalizeStepType(type: string): StepType | null {
    const normalized = type?.toLowerCase();
    if (['trigger', 'condition', 'action'].includes(normalized)) {
      return normalized as StepType;
    }
    return null;
  }

  private normalizeTriggerName(name: string): TriggerType | null {
    const normalized = name?.toLowerCase().replace(/\s+/g, '_');
    if (AVAILABLE_TRIGGERS.includes(normalized as TriggerType)) {
      return normalized as TriggerType;
    }
    // Try to match partial names
    for (const trigger of AVAILABLE_TRIGGERS) {
      if (normalized?.includes(trigger) || trigger.includes(normalized)) {
        return trigger;
      }
    }
    return null;
  }

  private normalizeActionName(name: string): ActionType | null {
    const normalized = name?.toLowerCase().replace(/\s+/g, '_');
    if (AVAILABLE_ACTIONS.includes(normalized as ActionType)) {
      return normalized as ActionType;
    }
    // Try to match partial names
    for (const action of AVAILABLE_ACTIONS) {
      if (normalized?.includes(action) || action.includes(normalized)) {
        return action;
      }
    }
    return null;
  }

  private normalizeActionConfig(
    actionName: ActionType,
    config: Record<string, unknown>
  ): Record<string, unknown> {
    switch (actionName) {
      case 'send_message':
        return {
          template: config.template || config.message || 'Hello {{fan_name}}!',
          placeholders: config.placeholders || {},
        };
      
      case 'create_offer':
        return {
          discountType: config.discountType || 'percentage',
          discountValue: Number(config.discountValue) || 10,
          validDays: Number(config.validDays) || 7,
        };
      
      case 'add_tag':
        return {
          tagName: config.tagName || config.tag || 'new',
        };
      
      case 'wait':
        return {
          duration: Number(config.duration) || 1,
          unit: config.unit || 'hours',
        };
      
      default:
        return config;
    }
  }

  // ============================================
  // Private Methods - Placeholders
  // ============================================

  private extractPlaceholders(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      placeholders.push(`{{${match[1]}}}`);
    }

    return [...new Set(placeholders)];
  }

  private validatePlaceholders(placeholders: string[]): string[] {
    return placeholders.filter(p => VALID_PLACEHOLDERS.includes(p));
  }

  private calculateTemplateConfidence(
    template: string,
    validPlaceholders: string[]
  ): number {
    let confidence = 0.5;

    // Boost for having placeholders
    if (validPlaceholders.length > 0) {
      confidence += 0.2;
    }

    // Boost for reasonable length
    if (template.length >= 20 && template.length <= 500) {
      confidence += 0.2;
    }

    // Boost for having fan_name placeholder
    if (validPlaceholders.includes('{{fan_name}}')) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  // ============================================
  // Private Methods - Fallbacks
  // ============================================

  private createFallbackFlow(description: string): BuildAutomationResponse {
    // Detect intent from description
    const lower = description.toLowerCase();
    
    let triggerType: TriggerType = 'new_subscriber';
    let actionType: ActionType = 'send_message';
    let actionConfig: Record<string, unknown> = {
      template: 'Hey {{fan_name}}! Thanks for your support! 💕',
      placeholders: {},
    };

    // Detect trigger
    if (lower.includes('message') || lower.includes('dm')) {
      triggerType = 'message_received';
    } else if (lower.includes('purchase') || lower.includes('buy')) {
      triggerType = 'purchase_completed';
    } else if (lower.includes('expir') || lower.includes('renew')) {
      triggerType = 'subscription_expiring';
    }

    // Detect action
    if (lower.includes('offer') || lower.includes('discount')) {
      actionType = 'create_offer';
      actionConfig = {
        discountType: 'percentage',
        discountValue: 20,
        validDays: 7,
      };
    } else if (lower.includes('tag')) {
      actionType = 'add_tag';
      actionConfig = { tagName: 'engaged' };
    } else if (lower.includes('wait') || lower.includes('delay')) {
      actionType = 'wait';
      actionConfig = { duration: 1, unit: 'hours' };
    }

    return {
      name: 'Auto-generated Flow',
      description: `Generated from: "${description.slice(0, 100)}"`,
      steps: [
        {
          id: 'step-1',
          type: 'trigger',
          name: triggerType,
          config: {},
        },
        {
          id: 'step-2',
          type: 'action',
          name: actionType,
          config: actionConfig,
        },
      ],
      confidence: 0.3, // Low confidence for fallback
    };
  }

  private createFallbackTemplate(
    request: GenerateTemplateRequest
  ): GenerateTemplateResponse {
    const templates: Record<TriggerType, string> = {
      new_subscriber: 'Hey {{fan_name}}! Welcome to my page! 💕 So happy to have you here!',
      message_received: 'Thanks for reaching out {{fan_name}}! I appreciate you! 💋',
      purchase_completed: 'Thank you so much for your purchase {{fan_name}}! You\'re amazing! 🎉',
      subscription_expiring: 'Hey {{fan_name}}! I noticed your subscription is expiring soon. I\'d love to keep you around! 💕',
    };

    const template = templates[request.triggerType] || templates.new_subscriber;

    return {
      template,
      placeholders: ['{{fan_name}}'],
      confidence: 0.4,
    };
  }
}

// ============================================
// Singleton & Factory
// ============================================

let automationBuilderInstance: AutomationBuilderService | null = null;

/**
 * Get the singleton AutomationBuilderService instance
 */
export function getAutomationBuilderService(): AutomationBuilderService {
  if (!automationBuilderInstance) {
    automationBuilderInstance = new AutomationBuilderService();
  }
  return automationBuilderInstance;
}

/**
 * Create a new AutomationBuilderService with custom AI service
 */
export function createAutomationBuilderService(
  aiService: AIService
): AutomationBuilderService {
  return new AutomationBuilderService(aiService);
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Build automation flow from description
 */
export async function buildAutomationFlow(
  description: string,
  userId: number
): Promise<BuildAutomationResponse> {
  return getAutomationBuilderService().buildAutomationFlow({
    description,
    userId,
  });
}

/**
 * Generate response template
 */
export async function generateResponseTemplate(
  request: GenerateTemplateRequest
): Promise<GenerateTemplateResponse> {
  return getAutomationBuilderService().generateResponseTemplate(request);
}

/**
 * Validate template placeholders
 */
export function validateTemplatePlaceholders(template: string): {
  valid: boolean;
  invalidPlaceholders: string[];
  validPlaceholders: string[];
} {
  return getAutomationBuilderService().validateTemplatePlaceholders(template);
}
