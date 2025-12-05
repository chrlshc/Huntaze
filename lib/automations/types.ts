/**
 * Automation Types
 * TypeScript interfaces for the Automations feature
 */

// ============================================
// Trigger Types
// ============================================

export type TriggerType =
  | 'new_subscriber'
  | 'message_received'
  | 'purchase_completed'
  | 'subscription_expiring';

export interface TriggerContext {
  type: TriggerType;
  userId: number;
  fanId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// ============================================
// Action Types
// ============================================

export type ActionType = 'send_message' | 'create_offer' | 'add_tag' | 'wait';

export interface SendMessageConfig {
  template: string;
  placeholders?: Record<string, string>;
}

export interface CreateOfferConfig {
  discountType: 'percentage' | 'fixed' | 'bogo';
  discountValue: number;
  validDays: number;
}

export interface AddTagConfig {
  tagName: string;
}

export interface WaitConfig {
  duration: number; // in milliseconds
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export type ActionConfig =
  | SendMessageConfig
  | CreateOfferConfig
  | AddTagConfig
  | WaitConfig;

// ============================================
// Automation Step Types
// ============================================

export type StepType = 'trigger' | 'condition' | 'action';

export interface AutomationStep {
  id: string;
  type: StepType;
  name: string;
  config: Record<string, unknown>;
}


export interface TriggerStep extends AutomationStep {
  type: 'trigger';
  name: TriggerType;
  config: {
    conditions?: Record<string, unknown>;
  };
}

export interface ActionStep extends AutomationStep {
  type: 'action';
  name: ActionType;
  config: ActionConfig;
}

export interface ConditionStep extends AutomationStep {
  type: 'condition';
  name: string;
  config: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: unknown;
  };
}

// ============================================
// Automation Flow Types
// ============================================

export type AutomationStatus = 'active' | 'paused' | 'draft';

export interface AutomationFlow {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  steps: AutomationStep[];
  status: AutomationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAutomationInput {
  name: string;
  description?: string;
  steps: AutomationStep[];
  status?: AutomationStatus;
}

export interface UpdateAutomationInput {
  name?: string;
  description?: string;
  steps?: AutomationStep[];
  status?: AutomationStatus;
}

// ============================================
// Execution Types
// ============================================

export type ExecutionStatus = 'success' | 'failed' | 'partial';

export interface ExecutionResult {
  id: string;
  automationId: string;
  triggerType: TriggerType;
  triggerData: Record<string, unknown>;
  status: ExecutionStatus;
  stepsExecuted: number;
  error?: string;
  executedAt: Date;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  successRate: number;
  averageStepsExecuted: number;
}

// ============================================
// AI Builder Types
// ============================================

export interface BuildAutomationRequest {
  description: string;
  userId: number;
}

export interface BuildAutomationResponse {
  name: string;
  description: string;
  steps: AutomationStep[];
  confidence: number;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  stepId: string;
  field: string;
  message: string;
}
