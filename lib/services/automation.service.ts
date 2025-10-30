import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { CampaignService } from './campaign.service';
import { SegmentationService } from './segmentation.service';

// Types and Interfaces
export interface CreateWorkflowParams {
  userId: string;
  name: string;
  description?: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  isActive?: boolean;
}

export interface UpdateWorkflowParams {
  name?: string;
  description?: string;
  trigger?: TriggerConfig;
  actions?: ActionConfig[];
  isActive?: boolean;
}

export interface TriggerConfig {
  type: 'time' | 'event' | 'behavior';
  config: Record<string, any>;
}

export interface ActionConfig {
  type: 'send_message' | 'update_segment' | 'create_campaign' | 'notify_creator';
  config: Record<string, any>;
  delay?: number; // seconds
}

export interface WorkflowFilters {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedWorkflows {
  workflows: any[];
  total: number;
  hasMore: boolean;
}

export interface TriggerContext {
  userId?: string;
  eventType?: string;
  eventData?: Record<string, any>;
  timestamp: Date;
}

export interface ExecutionContext {
  userId: string;
  workflowId: string;
  triggerData: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  actionsExecuted: number;
  errors?: string[];
}

export interface ActionResult {
  success: boolean;
  actionType: string;
  result?: any;
  error?: string;
}

export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  successRate: number;
}

/**
 * Service for managing marketing automation workflows
 * Handles workflow creation, trigger evaluation, and action execution
 */
export class AutomationService {
  constructor(
    private prisma: PrismaClient,
    private campaignService: CampaignService,
    private segmentService: SegmentationService,
    private eventEmitter: EventEmitter
  ) {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for automation triggers
   */
  private setupEventListeners() {
    this.eventEmitter.on('user.subscribed', (data) => {
      this.handleEvent('user.subscribed', data);
    });

    this.eventEmitter.on('user.inactive', (data) => {
      this.handleEvent('user.inactive', data);
    });

    this.eventEmitter.on('user.milestone', (data) => {
      this.handleEvent('user.milestone', data);
    });
  }

  /**
   * Handle incoming events and trigger workflows
   */
  private async handleEvent(eventType: string, data: any) {
    try {
      const workflows = await this.prisma.automation.findMany({
        where: {
          isActive: true,
          trigger: {
            path: ['type'],
            equals: 'event',
          },
        },
      });

      for (const workflow of workflows) {
        const trigger = workflow.trigger as any;
        if (trigger.config?.eventType === eventType) {
          await this.executeWorkflow(workflow.id, {
            userId: data.userId,
            workflowId: workflow.id,
            triggerData: data,
          });
        }
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  // ============================================
  // WORKFLOW MANAGEMENT
  // ============================================

  /**
   * Create a new automation workflow
   */
  async createWorkflow(params: CreateWorkflowParams) {
    try {
      const workflow = await this.prisma.automation.create({
        data: {
          userId: params.userId,
          name: params.name,
          description: params.description,
          trigger: params.trigger,
          actions: params.actions,
          isActive: params.isActive ?? false,
          status: 'inactive',
        },
        include: {
          user: true,
          executions: {
            take: 5,
            orderBy: { executedAt: 'desc' },
          },
        },
      });

      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string) {
    try {
      const workflow = await this.prisma.automation.findUnique({
        where: { id },
        include: {
          user: true,
          executions: {
            orderBy: { executedAt: 'desc' },
            take: 20,
          },
        },
      });

      return workflow;
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw error;
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, data: UpdateWorkflowParams) {
    try {
      const workflow = await this.prisma.automation.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      return workflow;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string) {
    try {
      // Deactivate first
      await this.deactivateWorkflow(id);

      // Then delete
      await this.prisma.automation.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  /**
   * List workflows with filters
   */
  async listWorkflows(filters: WorkflowFilters): Promise<PaginatedWorkflows> {
    try {
      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.type) {
        where.trigger = {
          path: ['type'],
          equals: filters.type,
        };
      }

      const [workflows, total] = await Promise.all([
        this.prisma.automation.findMany({
          where,
          include: {
            user: true,
            executions: {
              take: 1,
              orderBy: { executedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 20,
          skip: filters.offset || 0,
        }),
        this.prisma.automation.count({ where }),
      ]);

      return {
        workflows,
        total,
        hasMore: (filters.offset || 0) + workflows.length < total,
      };
    } catch (error) {
      console.error('Error listing workflows:', error);
      throw error;
    }
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(id: string) {
    try {
      const workflow = await this.prisma.automation.update({
        where: { id },
        data: {
          isActive: true,
          status: 'active',
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      return workflow;
    } catch (error) {
      console.error('Error activating workflow:', error);
      throw error;
    }
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(id: string) {
    try {
      const workflow = await this.prisma.automation.update({
        where: { id },
        data: {
          isActive: false,
          status: 'inactive',
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      return workflow;
    } catch (error) {
      console.error('Error deactivating workflow:', error);
      throw error;
    }
  }

  // ============================================
  // TRIGGER MANAGEMENT
  // ============================================

  /**
   * Register trigger for workflow
   */
  async registerTrigger(workflowId: string, trigger: TriggerConfig) {
    try {
      await this.prisma.automation.update({
        where: { id: workflowId },
        data: {
          trigger,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error registering trigger:', error);
      throw error;
    }
  }

  /**
   * Evaluate if trigger conditions are met
   */
  async evaluateTrigger(
    trigger: TriggerConfig,
    context: TriggerContext
  ): Promise<boolean> {
    try {
      switch (trigger.type) {
        case 'time':
          return this.evaluateTimeTrigger(trigger.config, context);

        case 'event':
          return this.evaluateEventTrigger(trigger.config, context);

        case 'behavior':
          return await this.evaluateBehaviorTrigger(trigger.config, context);

        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating trigger:', error);
      return false;
    }
  }

  /**
   * Evaluate time-based trigger
   */
  private evaluateTimeTrigger(config: any, context: TriggerContext): boolean {
    const now = context.timestamp;

    if (config.schedule === 'daily') {
      const hour = now.getHours();
      return hour === config.hour;
    }

    if (config.schedule === 'weekly') {
      const day = now.getDay();
      const hour = now.getHours();
      return day === config.dayOfWeek && hour === config.hour;
    }

    if (config.schedule === 'monthly') {
      const date = now.getDate();
      const hour = now.getHours();
      return date === config.dayOfMonth && hour === config.hour;
    }

    return false;
  }

  /**
   * Evaluate event-based trigger
   */
  private evaluateEventTrigger(config: any, context: TriggerContext): boolean {
    if (!context.eventType) return false;

    if (config.eventType !== context.eventType) return false;

    // Check additional conditions
    if (config.conditions) {
      for (const [key, value] of Object.entries(config.conditions)) {
        if (context.eventData?.[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate behavior-based trigger
   */
  private async evaluateBehaviorTrigger(
    config: any,
    context: TriggerContext
  ): Promise<boolean> {
    if (!context.userId) return false;

    // Check inactivity
    if (config.behaviorType === 'inactive') {
      const daysSinceLastActivity = config.daysSinceLastActivity || 7;
      // TODO: Implement actual activity check
      return true;
    }

    // Check spending level
    if (config.behaviorType === 'spending') {
      const threshold = config.threshold || 0;
      // TODO: Implement actual spending check
      return true;
    }

    // Check engagement
    if (config.behaviorType === 'engagement') {
      const threshold = config.threshold || 0;
      // TODO: Implement actual engagement check
      return true;
    }

    return false;
  }

  // ============================================
  // WORKFLOW EXECUTION
  // ============================================

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let actionsExecuted = 0;

    try {
      const workflow = await this.prisma.automation.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.isActive) {
        throw new Error('Workflow is not active');
      }

      // Create execution record
      const execution = await this.prisma.automationExecution.create({
        data: {
          automationId: workflowId,
          status: 'running',
          context: context.triggerData,
          executedAt: new Date(),
        },
      });

      // Execute actions
      const actions = workflow.actions as any[];
      for (const action of actions) {
        try {
          // Apply delay if specified
          if (action.delay) {
            await new Promise((resolve) => setTimeout(resolve, action.delay * 1000));
          }

          const result = await this.executeAction(action, context);

          if (result.success) {
            actionsExecuted++;
          } else {
            errors.push(`Action ${action.type} failed: ${result.error}`);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Action ${action.type} error: ${errorMsg}`);
        }
      }

      // Update execution record
      const executionTime = Date.now() - startTime;
      await this.prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: errors.length === 0 ? 'completed' : 'failed',
          result: {
            actionsExecuted,
            errors,
          },
          executionTime,
        },
      });

      return {
        success: errors.length === 0,
        executionId: execution.id,
        actionsExecuted,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Execute single action
   */
  async executeAction(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      switch (action.type) {
        case 'send_message':
          return await this.executeSendMessage(action.config, context);

        case 'update_segment':
          return await this.executeUpdateSegment(action.config, context);

        case 'create_campaign':
          return await this.executeCreateCampaign(action.config, context);

        case 'notify_creator':
          return await this.executeNotifyCreator(action.config, context);

        default:
          return {
            success: false,
            actionType: action.type,
            error: 'Unknown action type',
          };
      }
    } catch (error) {
      return {
        success: false,
        actionType: action.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute send message action
   */
  private async executeSendMessage(
    config: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Integrate with messaging service
    console.log('Sending message:', config.message, 'to user:', context.userId);

    return {
      success: true,
      actionType: 'send_message',
      result: { messageId: `msg_${Date.now()}` },
    };
  }

  /**
   * Execute update segment action
   */
  private async executeUpdateSegment(
    config: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      if (config.action === 'add') {
        await this.segmentService.addUserToSegment(
          context.userId,
          config.segmentId
        );
      } else if (config.action === 'remove') {
        await this.segmentService.removeUserFromSegment(
          context.userId,
          config.segmentId
        );
      }

      return {
        success: true,
        actionType: 'update_segment',
        result: { segmentId: config.segmentId },
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'update_segment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute create campaign action
   */
  private async executeCreateCampaign(
    config: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const campaign = await this.campaignService.createCampaign({
        userId: context.userId,
        name: config.name,
        type: config.type,
        platforms: config.platforms,
        content: config.content,
      });

      return {
        success: true,
        actionType: 'create_campaign',
        result: { campaignId: campaign.id },
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'create_campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute notify creator action
   */
  private async executeNotifyCreator(
    config: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    // TODO: Integrate with notification service
    console.log('Notifying creator:', context.userId, 'with:', config.message);

    return {
      success: true,
      actionType: 'notify_creator',
      result: { notificationId: `notif_${Date.now()}` },
    };
  }

  // ============================================
  // EXECUTION HISTORY
  // ============================================

  /**
   * Get execution history for workflow
   */
  async getExecutionHistory(workflowId: string) {
    try {
      const executions = await this.prisma.automationExecution.findMany({
        where: { automationId: workflowId },
        orderBy: { executedAt: 'desc' },
        take: 50,
      });

      return executions;
    } catch (error) {
      console.error('Error getting execution history:', error);
      throw error;
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(workflowId: string): Promise<ExecutionStats> {
    try {
      const executions = await this.prisma.automationExecution.findMany({
        where: { automationId: workflowId },
      });

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(
        (e: any) => e.status === 'completed'
      ).length;
      const failedExecutions = executions.filter(
        (e: any) => e.status === 'failed'
      ).length;

      const avgExecutionTime =
        executions.length > 0
          ? executions.reduce((sum: number, e: any) => sum + (e.executionTime || 0), 0) /
            executions.length
          : 0;

      const successRate =
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        avgExecutionTime,
        successRate,
      };
    } catch (error) {
      console.error('Error getting execution stats:', error);
      throw error;
    }
  }
}

// Singleton instance
let automationService: AutomationService | null = null;

export function getAutomationService(): AutomationService {
  if (!automationService) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { getCampaignService } = require('./campaign.service');
    const { getSegmentationService } = require('./segmentation.service');
    const campaignService = getCampaignService();
    const segmentService = getSegmentationService();
    const eventEmitter = new EventEmitter();

    automationService = new AutomationService(
      prisma,
      campaignService,
      segmentService,
      eventEmitter
    );
  }
  return automationService;
}
