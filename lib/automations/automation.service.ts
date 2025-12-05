/**
 * Automation Service
 * CRUD operations for automation workflows
 * 
 * Requirements: 1.4, 1.5
 */

import { PrismaClient } from '@prisma/client';
import type {
  AutomationFlow,
  AutomationStep,
  AutomationStatus,
  CreateAutomationInput,
  UpdateAutomationInput,
  ValidationResult,
  ValidationError,
} from './types';

// Use global prisma instance or create new one
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================
// Validation Functions
// ============================================

const VALID_TRIGGER_TYPES = ['new_subscriber', 'message_received', 'purchase_completed', 'subscription_expiring'];
const VALID_ACTION_TYPES = ['send_message', 'create_offer', 'add_tag', 'wait'];
const VALID_STEP_TYPES = ['trigger', 'condition', 'action'];

/**
 * Validates an automation flow
 * Requirements: 1.2
 */
export function validateAutomationFlow(steps: AutomationStep[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(steps) || steps.length === 0) {
    return {
      valid: false,
      errors: [{ stepId: '', field: 'steps', message: 'Flow must have at least one step' }],
    };
  }

  // Check for at least one trigger
  const triggers = steps.filter(s => s.type === 'trigger');
  if (triggers.length === 0) {
    errors.push({ stepId: '', field: 'steps', message: 'Flow must have at least one trigger' });
  }

  // Validate each step
  for (const step of steps) {
    // Validate step ID
    if (!step.id || typeof step.id !== 'string') {
      errors.push({ stepId: step.id || 'unknown', field: 'id', message: 'Step must have a valid ID' });
    }

    // Validate step type
    if (!VALID_STEP_TYPES.includes(step.type)) {
      errors.push({ stepId: step.id, field: 'type', message: `Invalid step type: ${step.type}` });
    }

    // Validate step name based on type
    if (step.type === 'trigger' && !VALID_TRIGGER_TYPES.includes(step.name)) {
      errors.push({ stepId: step.id, field: 'name', message: `Invalid trigger type: ${step.name}` });
    }

    if (step.type === 'action' && !VALID_ACTION_TYPES.includes(step.name)) {
      errors.push({ stepId: step.id, field: 'name', message: `Invalid action type: ${step.name}` });
    }

    // Validate config exists
    if (!step.config || typeof step.config !== 'object') {
      errors.push({ stepId: step.id, field: 'config', message: 'Step must have a config object' });
    }

    // Validate specific action configs
    if (step.type === 'action') {
      validateActionConfig(step, errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateActionConfig(step: AutomationStep, errors: ValidationError[]): void {
  const config = step.config;

  switch (step.name) {
    case 'send_message':
      if (!config.template || typeof config.template !== 'string') {
        errors.push({ stepId: step.id, field: 'config.template', message: 'send_message requires a template string' });
      }
      break;

    case 'create_offer':
      if (!config.discountType || !['percentage', 'fixed', 'bogo'].includes(config.discountType as string)) {
        errors.push({ stepId: step.id, field: 'config.discountType', message: 'create_offer requires a valid discountType' });
      }
      if (typeof config.discountValue !== 'number' || config.discountValue <= 0) {
        errors.push({ stepId: step.id, field: 'config.discountValue', message: 'create_offer requires a positive discountValue' });
      }
      break;

    case 'add_tag':
      if (!config.tagName || typeof config.tagName !== 'string') {
        errors.push({ stepId: step.id, field: 'config.tagName', message: 'add_tag requires a tagName string' });
      }
      break;

    case 'wait':
      if (typeof config.duration !== 'number' || config.duration <= 0) {
        errors.push({ stepId: step.id, field: 'config.duration', message: 'wait requires a positive duration' });
      }
      if (!config.unit || !['seconds', 'minutes', 'hours', 'days'].includes(config.unit as string)) {
        errors.push({ stepId: step.id, field: 'config.unit', message: 'wait requires a valid unit' });
      }
      break;
  }
}

// ============================================
// Service Class
// ============================================

export class AutomationService {
  /**
   * Create a new automation flow
   * Requirements: 1.4
   */
  async createFlow(userId: number, input: CreateAutomationInput): Promise<AutomationFlow> {
    // Validate the flow
    const validation = validateAutomationFlow(input.steps);
    if (!validation.valid) {
      throw new Error(`Invalid automation flow: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const automation = await prisma.automation.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        steps: input.steps as unknown as object,
        status: input.status || 'draft',
      },
    });

    return this.mapToAutomationFlow(automation);
  }

  /**
   * Get an automation flow by ID
   * Requirements: 1.4
   */
  async getFlow(id: string): Promise<AutomationFlow | null> {
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return null;
    }

    return this.mapToAutomationFlow(automation);
  }

  /**
   * Update an automation flow
   * Requirements: 1.5
   */
  async updateFlow(id: string, updates: UpdateAutomationInput): Promise<AutomationFlow> {
    // If steps are being updated, validate them
    if (updates.steps) {
      const validation = validateAutomationFlow(updates.steps);
      if (!validation.valid) {
        throw new Error(`Invalid automation flow: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.steps !== undefined && { steps: updates.steps as unknown as object }),
        ...(updates.status !== undefined && { status: updates.status }),
      },
    });

    return this.mapToAutomationFlow(automation);
  }

  /**
   * Delete an automation flow
   * Requirements: 1.5
   */
  async deleteFlow(id: string): Promise<void> {
    await prisma.automation.delete({
      where: { id },
    });
  }

  /**
   * List all automation flows for a user
   * Requirements: 1.4
   */
  async listFlows(userId: number, status?: AutomationStatus): Promise<AutomationFlow[]> {
    const automations = await prisma.automation.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return automations.map(a => this.mapToAutomationFlow(a));
  }

  /**
   * Get flows by status
   */
  async getFlowsByStatus(status: AutomationStatus): Promise<AutomationFlow[]> {
    const automations = await prisma.automation.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return automations.map(a => this.mapToAutomationFlow(a));
  }

  /**
   * Map Prisma model to AutomationFlow type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToAutomationFlow(automation: any): AutomationFlow {
    return {
      id: automation.id,
      userId: automation.userId,
      name: automation.name,
      description: automation.description,
      steps: automation.steps as AutomationStep[],
      status: automation.status as AutomationStatus,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
    };
  }
}

// Export singleton instance
export const automationService = new AutomationService();
