/**
 * Automation Engine
 * Executes automation flows step-by-step with resilience
 * 
 * @module lib/automations/automation-engine
 */

import {
  AutomationFlow,
  AutomationStep,
  TriggerContext,
  ExecutionResult,
  ExecutionStatus,
  ActionType,
  SendMessageConfig,
  CreateOfferConfig,
  AddTagConfig,
  WaitConfig,
  ActionStep
} from './types';
import { getEventSystem, EventSystem } from './event-system';

// ============================================
// Types
// ============================================

export interface ActionResult {
  stepId: string;
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
  duration: number;
}

export interface ExecutionContext {
  automation: AutomationFlow;
  trigger: TriggerContext;
  variables: Record<string, unknown>;
  stepResults: ActionResult[];
}

export interface ActionHandler {
  type: ActionType;
  execute: (
    step: ActionStep,
    context: ExecutionContext
  ) => Promise<ActionResult>;
}

export interface AutomationEngineConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  maxStepsPerExecution?: number;
  onStepComplete?: (result: ActionResult, context: ExecutionContext) => void;
  onExecutionComplete?: (result: ExecutionResult) => void;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<AutomationEngineConfig> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  maxStepsPerExecution: 50,
  onStepComplete: () => {},
  onExecutionComplete: () => {}
};

// ============================================
// Action Handlers
// ============================================

/**
 * Send Message Action Handler
 */
export async function executeSendMessage(
  step: ActionStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const startTime = Date.now();
  const config = step.config as SendMessageConfig;
  
  try {
    // Replace placeholders in template
    let message = config.template;
    const placeholders = config.placeholders || {};
    
    // Add context variables as placeholders
    const allPlaceholders = {
      ...placeholders,
      fanId: context.trigger.fanId,
      fanUsername: context.trigger.data.fanUsername as string || '',
      ...context.variables
    };
    
    for (const [key, value] of Object.entries(allPlaceholders)) {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    // In production, this would call the OnlyFans API
    // For now, we simulate the action
    console.log(`[AutomationEngine] Sending message to fan ${context.trigger.fanId}: ${message}`);
    
    return {
      stepId: step.id,
      success: true,
      data: { message, recipientId: context.trigger.fanId },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      stepId: step.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Create Offer Action Handler
 */
export async function executeCreateOffer(
  step: ActionStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const startTime = Date.now();
  const config = step.config as CreateOfferConfig;
  
  try {
    // In production, this would create an offer via the Offers service
    const offer = {
      id: `offer_${Date.now()}`,
      fanId: context.trigger.fanId,
      discountType: config.discountType,
      discountValue: config.discountValue,
      validUntil: new Date(Date.now() + config.validDays * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };
    
    console.log(`[AutomationEngine] Creating offer for fan ${context.trigger.fanId}:`, offer);
    
    // Store offer ID in context for subsequent steps
    context.variables.lastOfferId = offer.id;
    
    return {
      stepId: step.id,
      success: true,
      data: { offer },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      stepId: step.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Add Tag Action Handler
 */
export async function executeAddTag(
  step: ActionStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const startTime = Date.now();
  const config = step.config as AddTagConfig;
  
  try {
    // In production, this would add a tag to the fan via the CRM
    console.log(`[AutomationEngine] Adding tag "${config.tagName}" to fan ${context.trigger.fanId}`);
    
    return {
      stepId: step.id,
      success: true,
      data: { tagName: config.tagName, fanId: context.trigger.fanId },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      stepId: step.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Wait Action Handler
 */
export async function executeWait(
  step: ActionStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const startTime = Date.now();
  const config = step.config as WaitConfig;
  
  try {
    // Convert duration to milliseconds
    let durationMs = config.duration;
    switch (config.unit) {
      case 'seconds':
        durationMs *= 1000;
        break;
      case 'minutes':
        durationMs *= 60 * 1000;
        break;
      case 'hours':
        durationMs *= 60 * 60 * 1000;
        break;
      case 'days':
        durationMs *= 24 * 60 * 60 * 1000;
        break;
    }
    
    // For long waits, we would schedule a job instead of blocking
    // For short waits (< 10 seconds), we can wait inline
    if (durationMs <= 10000) {
      await new Promise(resolve => setTimeout(resolve, durationMs));
    } else {
      // In production, schedule a delayed job
      console.log(`[AutomationEngine] Scheduling delayed execution for ${durationMs}ms`);
    }
    
    return {
      stepId: step.id,
      success: true,
      data: { waitedMs: Math.min(durationMs, 10000), scheduledMs: durationMs > 10000 ? durationMs : 0 },
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      stepId: step.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

// ============================================
// Action Handler Registry
// ============================================

const actionHandlers: Map<ActionType, ActionHandler['execute']> = new Map([
  ['send_message', executeSendMessage],
  ['create_offer', executeCreateOffer],
  ['add_tag', executeAddTag],
  ['wait', executeWait]
]);

/**
 * Register a custom action handler
 */
export function registerActionHandler(
  type: ActionType,
  handler: ActionHandler['execute']
): void {
  actionHandlers.set(type, handler);
}

/**
 * Get an action handler by type
 */
export function getActionHandler(type: ActionType): ActionHandler['execute'] | undefined {
  return actionHandlers.get(type);
}

// ============================================
// Automation Engine Class
// ============================================

export class AutomationEngine {
  private config: Required<AutomationEngineConfig>;
  private eventSystem: EventSystem;
  private executionCount: number;

  constructor(config: AutomationEngineConfig = {}, eventSystem?: EventSystem) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventSystem = eventSystem || getEventSystem();
    this.executionCount = 0;
  }

  /**
   * Execute an automation flow
   */
  async executeFlow(
    automation: AutomationFlow,
    trigger: TriggerContext
  ): Promise<ExecutionResult> {
    const executionId = `exec_${++this.executionCount}_${Date.now()}`;
    const startTime = Date.now();
    
    const context: ExecutionContext = {
      automation,
      trigger,
      variables: {},
      stepResults: []
    };

    let stepsExecuted = 0;
    let lastError: string | undefined;
    let status: ExecutionStatus = 'success';

    try {
      // Get action steps (skip trigger step)
      const actionSteps = automation.steps.filter(
        step => step.type === 'action'
      ) as ActionStep[];

      // Check max steps limit
      if (actionSteps.length > this.config.maxStepsPerExecution) {
        throw new Error(
          `Automation has ${actionSteps.length} steps, exceeding max of ${this.config.maxStepsPerExecution}`
        );
      }

      // Execute each action step
      for (const step of actionSteps) {
        const result = await this.executeStep(step, context);
        context.stepResults.push(result);
        stepsExecuted++;

        // Call step complete callback
        this.config.onStepComplete(result, context);

        if (!result.success) {
          lastError = result.error;
          status = 'partial';
          // Continue to next step even on failure (resilience)
        }
      }

      // If all steps failed, mark as failed
      if (stepsExecuted > 0 && context.stepResults.every(r => !r.success)) {
        status = 'failed';
      }
    } catch (error) {
      status = 'failed';
      lastError = error instanceof Error ? error.message : String(error);
    }

    const result: ExecutionResult = {
      id: executionId,
      automationId: automation.id,
      triggerType: trigger.type,
      triggerData: trigger.data,
      status,
      stepsExecuted,
      error: lastError,
      executedAt: new Date()
    };

    // Call execution complete callback
    this.config.onExecutionComplete(result);

    return result;
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStep(
    step: ActionStep,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const handler = actionHandlers.get(step.name as ActionType);
    
    if (!handler) {
      return {
        stepId: step.id,
        success: false,
        error: `Unknown action type: ${step.name}`,
        duration: 0
      };
    }

    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await handler(step, context);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        
        // Don't retry on the last attempt
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    return {
      stepId: step.id,
      success: false,
      error: `Failed after ${this.config.maxRetries} attempts: ${lastError}`,
      duration: 0
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution statistics
   */
  getStats(): { executionCount: number } {
    return { executionCount: this.executionCount };
  }

  /**
   * Reset execution count (for testing)
   */
  resetStats(): void {
    this.executionCount = 0;
  }
}

// ============================================
// Singleton Instance
// ============================================

let engineInstance: AutomationEngine | null = null;

/**
 * Get the singleton AutomationEngine instance
 */
export function getAutomationEngine(config?: AutomationEngineConfig): AutomationEngine {
  if (!engineInstance) {
    engineInstance = new AutomationEngine(config);
  }
  return engineInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetAutomationEngine(): void {
  engineInstance = null;
}
