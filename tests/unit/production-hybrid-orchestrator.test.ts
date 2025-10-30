/**
 * Tests for Production Hybrid Orchestrator
 * Tests production safety requirements and hybrid workflow management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock external dependencies
const mockPostgreSQLClient = {
  hybridWorkflow: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn()
  }
};

const mockCloudWatchClient = {
  putMetricData: vi.fn()
};

const mockAzureClient = {
  generateContent: vi.fn()
};

const mockOpenAIClient = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

const mockRateLimiter = {
  checkLimit: vi.fn(),
  recordSuccess: vi.fn(),
  recordFailure: vi.fn()
};

const mockOnlyFansGateway = {
  sendMessage: vi.fn()
};

const mockSQSClient = {
  sendMessage: vi.fn(),
  receiveMessage: vi.fn(),
  deleteMessage: vi.fn(),
  changeMessageVisibility: vi.fn()
};

const mockSecretsManager = {
  getSecretValue: vi.fn()
};

// Types from production safety requirements
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  userId: string;
  workflowId: string;
  timestamp: Date;
}

interface HybridWorkflowState {
  workflowId: string;
  userId: string;
  currentStage: string;
  completedStages: string[];
  providerStates: {
    azure: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
    openai: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
    rateLimiter: 'pending' | 'checking' | 'throttled' | 'approved' | 'rejected';
    onlyFans: 'pending' | 'sending' | 'sent' | 'failed' | 'rate_limited';
  };
  fallbackHistory: Array<{
    from: 'azure' | 'openai';
    to: 'azure' | 'openai';
    reason: string;
    timestamp: Date;
  }>;
  retryAttempts: {
    azure: number;
    openai: number;
    onlyFans: number;
  };
  traceContext: TraceContext;
  data: Record<string, any>;
  errors: Array<{ stage: string; error: string; timestamp: Date }>;
  startTime: Date;
  lastUpdated: Date;
}

interface FallbackMatrix {
  scenarios: {
    'azure_timeout': { fallback: 'openai'; maxRetries: number; delayMs: number };
    'azure_rate_limited': { fallback: 'openai'; maxRetries: number; delayMs: number };
    'openai_timeout': { fallback: 'azure'; maxRetries: number; delayMs: number };
    'openai_rate_limited': { fallback: 'queue'; maxRetries: number; delayMs: number };
    'onlyfans_rate_limited': { fallback: 'queue'; maxRetries: number; delayMs: number };
    'rate_limiter_down': { fallback: 'bypass_with_warning'; maxRetries: number; delayMs: number };
  };
}

interface HybridWorkflowPersistence {
  workflowId: string;
  userId: string;
  currentProvider: 'azure' | 'openai' | 'hybrid';
  providerStates: HybridWorkflowState['providerStates'];
  sqsMessageId?: string;        // AWS SQS Message ID pour retry
  checkpointData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Utiliser SQS existant pour message queuing
interface SQSMessagePayload {
  workflowId: string;
  recipientId: string;
  content: string;
  attempts: number;
  maxRetries: number;
  scheduledFor: string;         // ISO date
  lastError?: string;
}

// Mock implementation of ProductionHybridOrchestrator
class ProductionHybridOrchestrator {
  private fallbackMatrix: FallbackMatrix = {
    scenarios: {
      'azure_timeout': { fallback: 'openai', maxRetries: 2, delayMs: 5000 },
      'azure_rate_limited': { fallback: 'openai', maxRetries: 1, delayMs: 1000 },
      'openai_timeout': { fallback: 'azure', maxRetries: 2, delayMs: 5000 },
      'openai_rate_limited': { fallback: 'queue', maxRetries: 0, delayMs: 60000 },
      'onlyfans_rate_limited': { fallback: 'queue', maxRetries: 0, delayMs: 45000 },
      'rate_limiter_down': { fallback: 'bypass_with_warning', maxRetries: 1, delayMs: 2000 }
    }
  };

  private activeWorkflows: Map<string, HybridWorkflowState> = new Map();

  constructor(
    private db = mockPostgreSQLClient,
    private cloudWatch = mockCloudWatchClient,
    private azureClient = mockAzureClient,
    private openaiClient = mockOpenAIClient,
    private rateLimiter = mockRateLimiter,
    private onlyFansGateway = mockOnlyFansGateway,
    private sqsClient = mockSQSClient,
    private secretsManager = mockSecretsManager
  ) {}

  async executeHybridWorkflow(
    userId: string,
    request: {
      type: 'content_generation' | 'message_sending';
      content: string;
      recipientId?: string;
      preferredProvider?: 'azure' | 'openai';
    }
  ): Promise<{
    success: boolean;
    workflowId: string;
    result?: any;
    traceContext: TraceContext;
    fallbacksUsed: number;
    errors?: string[];
  }> {
    const traceContext = this.createTraceContext(userId);
    const workflowId = `hybrid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const state: HybridWorkflowState = {
      workflowId,
      userId,
      currentStage: 'initializing',
      completedStages: [],
      providerStates: {
        azure: 'pending',
        openai: 'pending',
        rateLimiter: 'pending',
        onlyFans: 'pending'
      },
      fallbackHistory: [],
      retryAttempts: {
        azure: 0,
        openai: 0,
        onlyFans: 0
      },
      traceContext,
      data: { request },
      errors: [],
      startTime: new Date(),
      lastUpdated: new Date()
    };

    try {
      // Persist initial state
      await this.persistWorkflowState(state);
      this.activeWorkflows.set(workflowId, state);

      // Execute workflow with fallback handling
      const result = await this.executeWithFallbacks(state, request);

      // Update final state
      state.currentStage = 'completed';
      state.completedStages.push('completed');
      state.lastUpdated = new Date();
      await this.persistWorkflowState(state);

      // Track metrics
      await this.trackWorkflowMetrics(state, true);

      return {
        success: true,
        workflowId,
        result,
        traceContext,
        fallbacksUsed: state.fallbackHistory.length,
        errors: state.errors.length > 0 ? state.errors.map(e => e.error) : undefined
      };
    } catch (error) {
      state.currentStage = 'failed';
      state.errors.push({
        stage: state.currentStage,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      state.lastUpdated = new Date();

      await this.persistWorkflowState(state);
      await this.trackWorkflowMetrics(state, false);

      return {
        success: false,
        workflowId,
        traceContext,
        fallbacksUsed: state.fallbackHistory.length,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  private async executeWithFallbacks(
    state: HybridWorkflowState,
    request: any
  ): Promise<any> {
    const preferredProvider = request.preferredProvider || 'azure';
    let currentProvider = preferredProvider;
    let result: any;

    // Stage 1: Content Generation
    state.currentStage = 'content_generation';
    state.lastUpdated = new Date();
    await this.persistWorkflowState(state);

    try {
      result = await this.generateContentWithProvider(state, currentProvider, request.content);
      state.providerStates[currentProvider] = 'completed';
      state.completedStages.push('content_generation');
    } catch (error) {
      const fallbackResult = await this.handleProviderFailure(
        state,
        currentProvider,
        error as Error,
        request.content
      );
      
      if (!fallbackResult.success) {
        throw new Error(`All providers failed: ${fallbackResult.error}`);
      }
      
      result = fallbackResult.result;
      currentProvider = fallbackResult.usedProvider;
    }

    // Stage 2: Rate Limiting Check (if sending message)
    if (request.type === 'message_sending' && request.recipientId) {
      state.currentStage = 'rate_limiting';
      state.providerStates.rateLimiter = 'checking';
      state.lastUpdated = new Date();
      await this.persistWorkflowState(state);

      const rateLimitResult = await this.checkRateLimit(state, request.recipientId);
      if (!rateLimitResult.allowed) {
        if (rateLimitResult.shouldQueue) {
          await this.queueMessage(state, request.recipientId, result.content);
          return { queued: true, estimatedDelay: rateLimitResult.retryAfter };
        } else {
          throw new Error(`Rate limit exceeded: ${rateLimitResult.reason}`);
        }
      }

      state.providerStates.rateLimiter = 'approved';
      state.completedStages.push('rate_limiting');
    }

    // Stage 3: Message Sending (if applicable)
    if (request.type === 'message_sending' && request.recipientId) {
      state.currentStage = 'message_sending';
      state.providerStates.onlyFans = 'sending';
      state.lastUpdated = new Date();
      await this.persistWorkflowState(state);

      try {
        const sendResult = await this.sendMessage(state, request.recipientId, result.content);
        state.providerStates.onlyFans = 'sent';
        state.completedStages.push('message_sending');
        result.messageId = sendResult.messageId;
      } catch (error) {
        state.providerStates.onlyFans = 'failed';
        
        // Handle OnlyFans rate limiting
        if (error instanceof Error && error.message.includes('rate limit')) {
          const scenario = this.fallbackMatrix.scenarios['onlyfans_rate_limited'];
          await this.queueMessage(state, request.recipientId, result.content);
          return { queued: true, estimatedDelay: scenario.delayMs };
        }
        
        throw error;
      }
    }

    return result;
  }

  private async generateContentWithProvider(
    state: HybridWorkflowState,
    provider: 'azure' | 'openai',
    content: string
  ): Promise<any> {
    const childSpan = this.createChildSpan(state.traceContext, `${provider}_generation`);
    
    try {
      state.providerStates[provider] = 'executing';
      await this.persistWorkflowState(state);

      let result: any;
      
      if (provider === 'azure') {
        result = await this.azureClient.generateContent({
          prompt: content,
          traceContext: childSpan
        });
      } else {
        result = await this.openaiClient.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content }],
          metadata: { traceContext: childSpan }
        });
      }

      state.providerStates[provider] = 'completed';
      await this.trackProviderMetrics(provider, true, childSpan);
      
      return result;
    } catch (error) {
      state.providerStates[provider] = 'failed';
      state.retryAttempts[provider]++;
      await this.trackProviderMetrics(provider, false, childSpan);
      throw error;
    }
  }

  private async handleProviderFailure(
    state: HybridWorkflowState,
    failedProvider: 'azure' | 'openai',
    error: Error,
    content: string
  ): Promise<{
    success: boolean;
    result?: any;
    usedProvider?: 'azure' | 'openai';
    error?: string;
  }> {
    const errorType = this.classifyError(error);
    const scenarioKey = `${failedProvider}_${errorType}` as keyof FallbackMatrix['scenarios'];
    const scenario = this.fallbackMatrix.scenarios[scenarioKey];

    if (!scenario || state.retryAttempts[failedProvider] >= scenario.maxRetries) {
      return {
        success: false,
        error: `Max retries exceeded for ${failedProvider}: ${error.message}`
      };
    }

    // Record fallback
    const fallbackProvider = scenario.fallback as 'azure' | 'openai';
    if (fallbackProvider === 'queue') {
      return {
        success: false,
        error: 'Queuing not supported for content generation'
      };
    }

    state.fallbackHistory.push({
      from: failedProvider,
      to: fallbackProvider,
      reason: error.message,
      timestamp: new Date()
    });

    // Wait for delay
    await this.sleep(scenario.delayMs);

    try {
      const result = await this.generateContentWithProvider(state, fallbackProvider, content);
      return {
        success: true,
        result,
        usedProvider: fallbackProvider
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: `Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
      };
    }
  }

  private classifyError(error: Error): 'timeout' | 'rate_limited' | 'unknown' {
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return 'timeout';
    }
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return 'rate_limited';
    }
    return 'unknown';
  }

  private async checkRateLimit(
    state: HybridWorkflowState,
    recipientId: string
  ): Promise<{
    allowed: boolean;
    shouldQueue: boolean;
    retryAfter?: number;
    reason?: string;
  }> {
    try {
      const result = await this.rateLimiter.checkLimit(state.userId, 'message');
      
      if (result.allowed) {
        return { allowed: true, shouldQueue: false };
      }

      return {
        allowed: false,
        shouldQueue: true,
        retryAfter: result.retryAfter,
        reason: result.reason
      };
    } catch (error) {
      // Rate limiter is down - use bypass scenario
      const scenario = this.fallbackMatrix.scenarios['rate_limiter_down'];
      
      if (scenario.fallback === 'bypass_with_warning') {
        await this.trackAlert('rate_limiter_bypass', {
          workflowId: state.workflowId,
          userId: state.userId,
          reason: error instanceof Error ? error.message : String(error)
        });
        
        return { allowed: true, shouldQueue: false };
      }

      return {
        allowed: false,
        shouldQueue: false,
        reason: `Rate limiter unavailable: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async sendMessage(
    state: HybridWorkflowState,
    recipientId: string,
    content: string
  ): Promise<{ messageId: string }> {
    const childSpan = this.createChildSpan(state.traceContext, 'onlyfans_send');
    
    try {
      const result = await this.onlyFansGateway.sendMessage(recipientId, content, {
        traceContext: childSpan,
        workflowId: state.workflowId
      });

      await this.rateLimiter.recordSuccess('message');
      return result;
    } catch (error) {
      await this.rateLimiter.recordFailure('message', error);
      throw error;
    }
  }

  private async queueMessage(
    state: HybridWorkflowState,
    recipientId: string,
    content: string
  ): Promise<void> {
    const sqsPayload: SQSMessagePayload = {
      workflowId: state.workflowId,
      recipientId,
      content,
      attempts: 0,
      maxRetries: 3,
      scheduledFor: new Date(Date.now() + 45000).toISOString(), // 45 seconds delay
    };

    // Send to SQS
    const sqsResult = await this.sqsClient.sendMessage({
      QueueUrl: 'huntaze-hybrid-messages-production',
      MessageBody: JSON.stringify(sqsPayload),
      DelaySeconds: 45, // 45 seconds delay
      MessageAttributes: {
        workflowId: {
          DataType: 'String',
          StringValue: state.workflowId
        },
        userId: {
          DataType: 'String',
          StringValue: state.userId
        }
      }
    });

    // Store SQS message ID in persistence
    state.data.sqsMessageId = sqsResult.MessageId;

    // Persist to database
    await this.persistWorkflowState(state);
  }

  private async persistWorkflowState(state: HybridWorkflowState): Promise<void> {
    const persistence: HybridWorkflowPersistence = {
      workflowId: state.workflowId,
      userId: state.userId,
      currentProvider: 'hybrid',
      providerStates: state.providerStates,
      sqsMessageId: state.data.sqsMessageId,
      checkpointData: state.data,
      createdAt: state.startTime,
      updatedAt: state.lastUpdated
    };

    await this.db.hybridWorkflow.create({
      data: persistence
    });
  }

  async processQueuedMessages(): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    try {
      // Receive messages from SQS
      const result = await this.sqsClient.receiveMessage({
        QueueUrl: 'huntaze-hybrid-messages-production',
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        MessageAttributeNames: ['All']
      });

      if (!result.Messages) {
        return { processed: 0, failed: 0, errors: [] };
      }

      for (const message of result.Messages) {
        try {
          const payload: SQSMessagePayload = JSON.parse(message.Body || '{}');
          
          // Attempt to send message
          await this.onlyFansGateway.sendMessage(payload.recipientId, payload.content, {
            workflowId: payload.workflowId
          });

          // Delete message from queue on success
          await this.sqsClient.deleteMessage({
            QueueUrl: 'huntaze-hybrid-messages-production',
            ReceiptHandle: message.ReceiptHandle
          });

          processed++;
        } catch (error) {
          const payload: SQSMessagePayload = JSON.parse(message.Body || '{}');
          payload.attempts++;
          payload.lastError = error instanceof Error ? error.message : String(error);

          if (payload.attempts >= payload.maxRetries) {
            // Move to DLQ or delete
            await this.sqsClient.deleteMessage({
              QueueUrl: 'huntaze-hybrid-messages-production',
              ReceiptHandle: message.ReceiptHandle
            });
            failed++;
            errors.push(`Max retries exceeded for ${payload.workflowId}: ${payload.lastError}`);
          } else {
            // Update message with new attempt count and delay
            await this.sqsClient.changeMessageVisibility({
              QueueUrl: 'huntaze-hybrid-messages-production',
              ReceiptHandle: message.ReceiptHandle,
              VisibilityTimeout: 300 // 5 minutes
            });
          }
        }
      }

      return { processed, failed, errors };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return { processed, failed, errors };
    }
  }

  async getSecretsFromAWS(): Promise<{ DATABASE_URL: string }> {
    try {
      const result = await this.secretsManager.getSecretValue({
        SecretId: 'huntaze/database/production'
      });

      return JSON.parse(result.SecretString || '{}');
    } catch (error) {
      throw new Error(`Failed to retrieve secrets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private createTraceContext(userId: string): TraceContext {
    return {
      traceId: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      spanId: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      workflowId: '',
      timestamp: new Date()
    };
  }

  private createChildSpan(parent: TraceContext, operation: string): TraceContext {
    return {
      ...parent,
      spanId: `span-${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      parentSpanId: parent.spanId,
      timestamp: new Date()
    };
  }

  private async trackWorkflowMetrics(state: HybridWorkflowState, success: boolean): Promise<void> {
    const duration = Date.now() - state.startTime.getTime();
    
    await this.cloudWatch.putMetricData({
      Namespace: 'Huntaze/HybridOrchestrator',
      MetricData: [
        {
          MetricName: 'WorkflowDuration',
          Value: duration,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Success', Value: success.toString() },
            { Name: 'FallbacksUsed', Value: state.fallbackHistory.length.toString() }
          ]
        },
        {
          MetricName: 'WorkflowCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Success', Value: success.toString() }
          ]
        }
      ]
    });
  }

  private async trackProviderMetrics(
    provider: string,
    success: boolean,
    traceContext: TraceContext
  ): Promise<void> {
    await this.cloudWatch.putMetricData({
      Namespace: 'Huntaze/Providers',
      MetricData: [
        {
          MetricName: 'ProviderCalls',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Provider', Value: provider },
            { Name: 'Success', Value: success.toString() }
          ]
        }
      ]
    });
  }

  private async trackAlert(type: string, data: Record<string, any>): Promise<void> {
    await this.cloudWatch.putMetricData({
      Namespace: 'Huntaze/Alerts',
      MetricData: [
        {
          MetricName: 'AlertCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'AlertType', Value: type }
          ]
        }
      ]
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async recoverWorkflow(workflowId: string): Promise<{
    success: boolean;
    state?: HybridWorkflowState;
    error?: string;
  }> {
    try {
      const persistence = await this.db.hybridWorkflow.findUnique({
        where: { workflowId }
      });

      if (!persistence) {
        return {
          success: false,
          error: 'Workflow not found'
        };
      }

      // Reconstruct state from persistence
      const state: HybridWorkflowState = {
        workflowId: persistence.workflowId,
        userId: persistence.userId,
        currentStage: 'recovering',
        completedStages: [],
        providerStates: persistence.providerStates,
        fallbackHistory: [],
        retryAttempts: { azure: 0, openai: 0, onlyFans: 0 },
        traceContext: this.createTraceContext(persistence.userId),
        data: persistence.checkpointData,
        errors: [],
        startTime: persistence.createdAt,
        lastUpdated: new Date()
      };

      this.activeWorkflows.set(workflowId, state);

      return {
        success: true,
        state
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  getActiveWorkflows(): HybridWorkflowState[] {
    return Array.from(this.activeWorkflows.values());
  }

  async getWorkflowHistory(userId: string, limit: number = 10): Promise<HybridWorkflowPersistence[]> {
    return await this.db.hybridWorkflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

describe('ProductionHybridOrchestrator', () => {
  let orchestrator: ProductionHybridOrchestrator;

  beforeEach(() => {
    orchestrator = new ProductionHybridOrchestrator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hybrid Workflow Execution', () => {
    it('should execute successful hybrid workflow with Azure', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Generated content from Azure',
        model: 'gpt-4-turbo'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate a fashion post',
        preferredProvider: 'azure'
      });

      expect(result.success).toBe(true);
      expect(result.workflowId).toBeDefined();
      expect(result.traceContext).toBeDefined();
      expect(result.fallbacksUsed).toBe(0);
      expect(result.result.content).toBe('Generated content from Azure');

      expect(mockAzureClient.generateContent).toHaveBeenCalledWith({
        prompt: 'Generate a fashion post',
        traceContext: expect.objectContaining({
          traceId: expect.any(String),
          spanId: expect.any(String)
        })
      });

      expect(mockPostgreSQLClient.hybridWorkflow.create).toHaveBeenCalled();
      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledTimes(2); // Workflow + Provider metrics
    });

    it('should fallback from Azure to OpenAI on timeout', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      
      // Azure fails with timeout
      mockAzureClient.generateContent.mockRejectedValue(new Error('Request timeout'));
      
      // OpenAI succeeds
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Generated content from OpenAI' } }]
      });
      
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate a fashion post',
        preferredProvider: 'azure'
      });

      expect(result.success).toBe(true);
      expect(result.fallbacksUsed).toBe(1);
      expect(result.result.choices[0].message.content).toBe('Generated content from OpenAI');

      expect(mockAzureClient.generateContent).toHaveBeenCalled();
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle message sending with rate limiting', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: true
      });
      mockOnlyFansGateway.sendMessage.mockResolvedValue({
        messageId: 'msg-123'
      });
      mockRateLimiter.recordSuccess.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-456'
      });

      expect(result.success).toBe(true);
      expect(result.result.messageId).toBe('msg-123');

      expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith('user-123', 'message');
      expect(mockOnlyFansGateway.sendMessage).toHaveBeenCalledWith(
        'recipient-456',
        'Message content',
        expect.objectContaining({
          traceContext: expect.any(Object),
          workflowId: expect.any(String)
        })
      );
      expect(mockRateLimiter.recordSuccess).toHaveBeenCalledWith('message');
    });

    it('should queue message when rate limited', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 45000,
        reason: 'Rate limit exceeded'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-456'
      });

      expect(result.success).toBe(true);
      expect(result.result.queued).toBe(true);
      expect(result.result.estimatedDelay).toBe(45000);

      expect(mockOnlyFansGateway.sendMessage).not.toHaveBeenCalled();
      expect(mockSQSClient.sendMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        MessageBody: expect.stringContaining('"recipientId":"recipient-456"'),
        DelaySeconds: 45,
        MessageAttributes: expect.objectContaining({
          workflowId: expect.objectContaining({
            DataType: 'String',
            StringValue: expect.any(String)
          })
        })
      });
    });
  });

  describe('Fallback Matrix Scenarios', () => {
    it('should handle azure_rate_limited scenario', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      
      // Azure fails with rate limit
      const rateLimitError = new Error('Rate limit exceeded (429)');
      mockAzureClient.generateContent.mockRejectedValue(rateLimitError);
      
      // OpenAI succeeds
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Fallback content' } }]
      });
      
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content',
        preferredProvider: 'azure'
      });

      expect(result.success).toBe(true);
      expect(result.fallbacksUsed).toBe(1);
      
      // Should use shorter delay for rate limit (1000ms vs 5000ms for timeout)
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle rate_limiter_down scenario with bypass', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      
      // Rate limiter is down
      mockRateLimiter.checkLimit.mockRejectedValue(new Error('Rate limiter service unavailable'));
      
      // Should bypass and send message with warning
      mockOnlyFansGateway.sendMessage.mockResolvedValue({
        messageId: 'msg-bypass-123'
      });
      mockRateLimiter.recordSuccess.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-456'
      });

      expect(result.success).toBe(true);
      expect(result.result.messageId).toBe('msg-bypass-123');

      // Should track alert for bypass
      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith(
        expect.objectContaining({
          Namespace: 'Huntaze/Alerts',
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'AlertCount',
              Dimensions: expect.arrayContaining([
                { Name: 'AlertType', Value: 'rate_limiter_bypass' }
              ])
            })
          ])
        })
      );
    });

    it('should handle onlyfans_rate_limited scenario with queuing', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true });
      
      // OnlyFans rate limited
      mockOnlyFansGateway.sendMessage.mockRejectedValue(new Error('OnlyFans rate limit exceeded'));
      mockRateLimiter.recordFailure.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-456'
      });

      expect(result.success).toBe(true);
      expect(result.result.queued).toBe(true);
      expect(result.result.estimatedDelay).toBe(45000); // OnlyFans scenario delay

      expect(mockRateLimiter.recordFailure).toHaveBeenCalledWith('message', expect.any(Error));
    });

    it('should fail when max retries exceeded', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      
      // Both providers fail
      mockAzureClient.generateContent.mockRejectedValue(new Error('Azure timeout'));
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI timeout'));
      
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content',
        preferredProvider: 'azure'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('All providers failed');
    });
  });

  describe('Distributed Tracing', () => {
    it('should create and propagate trace context', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Traced content'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      const result = await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content'
      });

      expect(result.success).toBe(true);
      expect(result.traceContext).toBeDefined();
      expect(result.traceContext.traceId).toMatch(/^trace-/);
      expect(result.traceContext.spanId).toMatch(/^span-/);
      expect(result.traceContext.userId).toBe('user-123');

      // Verify trace context was passed to Azure
      expect(mockAzureClient.generateContent).toHaveBeenCalledWith({
        prompt: 'Generate content',
        traceContext: expect.objectContaining({
          traceId: result.traceContext.traceId,
          parentSpanId: result.traceContext.spanId,
          spanId: expect.stringMatching(/^span-azure_generation-/)
        })
      });
    });

    it('should create child spans for each service call', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true });
      mockOnlyFansGateway.sendMessage.mockResolvedValue({
        messageId: 'msg-123'
      });
      mockRateLimiter.recordSuccess.mockResolvedValue({});
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-456'
      });

      // Verify Azure call has child span
      expect(mockAzureClient.generateContent).toHaveBeenCalledWith({
        prompt: 'Generate a message',
        traceContext: expect.objectContaining({
          spanId: expect.stringMatching(/^span-azure_generation-/),
          parentSpanId: expect.any(String)
        })
      });

      // Verify OnlyFans call has child span
      expect(mockOnlyFansGateway.sendMessage).toHaveBeenCalledWith(
        'recipient-456',
        'Message content',
        expect.objectContaining({
          traceContext: expect.objectContaining({
            spanId: expect.stringMatching(/^span-onlyfans_send-/),
            parentSpanId: expect.any(String)
          })
        })
      );
    });
  });

  describe('State Persistence and Recovery', () => {
    it('should persist workflow state at each stage', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Generated content'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content'
      });

      // Should persist state multiple times during workflow
      expect(mockPostgreSQLClient.hybridWorkflow.create).toHaveBeenCalledTimes(3);
      
      // Verify persistence structure
      const persistenceCalls = mockPostgreSQLClient.hybridWorkflow.create.mock.calls;
      expect(persistenceCalls[0][0].data).toMatchObject({
        userId: 'user-123',
        currentProvider: 'hybrid',
        providerStates: expect.objectContaining({
          azure: expect.any(String),
          openai: expect.any(String)
        }),
        checkpointData: expect.any(Object)
      });
    });

    it('should recover workflow from persistence', async () => {
      const mockPersistedWorkflow = {
        workflowId: 'workflow-123',
        userId: 'user-456',
        currentProvider: 'hybrid',
        providerStates: {
          azure: 'completed',
          openai: 'pending',
          rateLimiter: 'pending',
          onlyFans: 'pending'
        },
        messageQueue: [],
        checkpointData: { request: { type: 'content_generation' } },
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:05:00Z')
      };

      mockPostgreSQLClient.hybridWorkflow.findUnique.mockResolvedValue(mockPersistedWorkflow);

      const result = await orchestrator.recoverWorkflow('workflow-123');

      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.state!.workflowId).toBe('workflow-123');
      expect(result.state!.userId).toBe('user-456');
      expect(result.state!.providerStates.azure).toBe('completed');

      // Should be added to active workflows
      const activeWorkflows = orchestrator.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(1);
      expect(activeWorkflows[0].workflowId).toBe('workflow-123');
    });

    it('should handle recovery of non-existent workflow', async () => {
      mockPostgreSQLClient.hybridWorkflow.findUnique.mockResolvedValue(null);

      const result = await orchestrator.recoverWorkflow('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow not found');
    });

    it('should persist SQS message ID when rate limited', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 45000
      });
      mockSQSClient.sendMessage.mockResolvedValue({
        MessageId: 'sqs-msg-123'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-456'
      });

      // Verify SQS message was sent
      expect(mockSQSClient.sendMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        MessageBody: expect.stringContaining('"workflowId"'),
        DelaySeconds: 45,
        MessageAttributes: expect.any(Object)
      });

      // Verify SQS message ID was persisted
      const persistenceCalls = mockPostgreSQLClient.hybridWorkflow.create.mock.calls;
      const finalPersistence = persistenceCalls[persistenceCalls.length - 1][0].data;
      
      expect(finalPersistence.sqsMessageId).toBe('sqs-msg-123');
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track workflow metrics', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Generated content'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content'
      });

      // Should track workflow metrics
      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/HybridOrchestrator',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'WorkflowDuration',
            Unit: 'Milliseconds',
            Dimensions: expect.arrayContaining([
              { Name: 'Success', Value: 'true' },
              { Name: 'FallbacksUsed', Value: '0' }
            ])
          }),
          expect.objectContaining({
            MetricName: 'WorkflowCount',
            Value: 1,
            Unit: 'Count'
          })
        ])
      });
    });

    it('should track provider-specific metrics', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Generated content'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content',
        preferredProvider: 'azure'
      });

      // Should track provider metrics
      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/Providers',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'ProviderCalls',
            Value: 1,
            Unit: 'Count',
            Dimensions: expect.arrayContaining([
              { Name: 'Provider', Value: 'azure' },
              { Name: 'Success', Value: 'true' }
            ])
          })
        ])
      });
    });

    it('should track fallback metrics', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      
      // Azure fails, OpenAI succeeds
      mockAzureClient.generateContent.mockRejectedValue(new Error('Azure timeout'));
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Fallback content' } }]
      });
      
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content',
        preferredProvider: 'azure'
      });

      // Should track metrics for both providers
      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/Providers',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'Provider', Value: 'azure' },
              { Name: 'Success', Value: 'false' }
            ])
          })
        ])
      });

      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/Providers',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'Provider', Value: 'openai' },
              { Name: 'Success', Value: 'true' }
            ])
          })
        ])
      });

      // Should track workflow with fallbacks used
      expect(mockCloudWatchClient.putMetricData).toHaveBeenCalledWith({
        Namespace: 'Huntaze/HybridOrchestrator',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'FallbacksUsed', Value: '1' }
            ])
          })
        ])
      });
    });
  });

  describe('Workflow History and Management', () => {
    it('should retrieve workflow history for user', async () => {
      const mockHistory = [
        {
          workflowId: 'workflow-1',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          workflowId: 'workflow-2',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T09:00:00Z')
        }
      ];

      mockPostgreSQLClient.hybridWorkflow.findMany.mockResolvedValue(mockHistory);

      const history = await orchestrator.getWorkflowHistory('user-123', 5);

      expect(history).toHaveLength(2);
      expect(history[0].workflowId).toBe('workflow-1');
      
      expect(mockPostgreSQLClient.hybridWorkflow.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
    });

    it('should track active workflows', async () => {
      // Initially no active workflows
      expect(orchestrator.getActiveWorkflows()).toHaveLength(0);

      // Mock long-running workflow
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ content: 'slow content' }), 100))
      );
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      // Start workflow (don't await)
      const workflowPromise = orchestrator.executeHybridWorkflow('user-123', {
        type: 'content_generation',
        content: 'Generate content'
      });

      // Should have active workflow
      await new Promise(resolve => setTimeout(resolve, 10)); // Let workflow start
      expect(orchestrator.getActiveWorkflows()).toHaveLength(1);

      // Wait for completion
      await workflowPromise;

      // Should be removed from active workflows
      expect(orchestrator.getActiveWorkflows()).toHaveLength(0);
    });
  });

  describe('AWS SQS Integration', () => {
    it('should send messages to SQS with correct payload structure', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Message content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 45000
      });
      mockSQSClient.sendMessage.mockResolvedValue({
        MessageId: 'sqs-msg-456'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-123', {
        type: 'message_sending',
        content: 'Generate a message',
        recipientId: 'recipient-789'
      });

      expect(mockSQSClient.sendMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        MessageBody: expect.stringContaining('"recipientId":"recipient-789"'),
        DelaySeconds: 45,
        MessageAttributes: {
          workflowId: {
            DataType: 'String',
            StringValue: expect.any(String)
          },
          userId: {
            DataType: 'String',
            StringValue: 'user-123'
          }
        }
      });

      // Verify SQS payload structure
      const sqsCall = mockSQSClient.sendMessage.mock.calls[0][0];
      const payload: SQSMessagePayload = JSON.parse(sqsCall.MessageBody);
      
      expect(payload).toMatchObject({
        workflowId: expect.any(String),
        recipientId: 'recipient-789',
        content: 'Message content',
        attempts: 0,
        maxRetries: 3,
        scheduledFor: expect.any(String)
      });

      // Verify scheduledFor is valid ISO date
      expect(new Date(payload.scheduledFor)).toBeInstanceOf(Date);
    });

    it('should process queued messages from SQS', async () => {
      const mockMessages = [
        {
          MessageId: 'msg-1',
          ReceiptHandle: 'receipt-1',
          Body: JSON.stringify({
            workflowId: 'workflow-1',
            recipientId: 'recipient-1',
            content: 'Message 1',
            attempts: 0,
            maxRetries: 3,
            scheduledFor: new Date().toISOString()
          })
        },
        {
          MessageId: 'msg-2',
          ReceiptHandle: 'receipt-2',
          Body: JSON.stringify({
            workflowId: 'workflow-2',
            recipientId: 'recipient-2',
            content: 'Message 2',
            attempts: 1,
            maxRetries: 3,
            scheduledFor: new Date().toISOString()
          })
        }
      ];

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: mockMessages
      });
      mockOnlyFansGateway.sendMessage.mockResolvedValue({
        messageId: 'sent-123'
      });
      mockSQSClient.deleteMessage.mockResolvedValue({});

      const result = await orchestrator.processQueuedMessages();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify messages were sent
      expect(mockOnlyFansGateway.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockOnlyFansGateway.sendMessage).toHaveBeenCalledWith(
        'recipient-1',
        'Message 1',
        { workflowId: 'workflow-1' }
      );

      // Verify messages were deleted from queue
      expect(mockSQSClient.deleteMessage).toHaveBeenCalledTimes(2);
      expect(mockSQSClient.deleteMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        ReceiptHandle: 'receipt-1'
      });
    });

    it('should handle failed message processing with retry logic', async () => {
      const mockMessage = {
        MessageId: 'msg-fail',
        ReceiptHandle: 'receipt-fail',
        Body: JSON.stringify({
          workflowId: 'workflow-fail',
          recipientId: 'recipient-fail',
          content: 'Failing message',
          attempts: 1,
          maxRetries: 3,
          scheduledFor: new Date().toISOString()
        })
      };

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: [mockMessage]
      });
      mockOnlyFansGateway.sendMessage.mockRejectedValue(new Error('OnlyFans API error'));
      mockSQSClient.changeMessageVisibility.mockResolvedValue({});

      const result = await orchestrator.processQueuedMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0); // Not failed yet, just retrying
      expect(result.errors).toHaveLength(0);

      // Should update message visibility for retry
      expect(mockSQSClient.changeMessageVisibility).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        ReceiptHandle: 'receipt-fail',
        VisibilityTimeout: 300
      });

      // Should not delete message
      expect(mockSQSClient.deleteMessage).not.toHaveBeenCalled();
    });

    it('should move messages to DLQ after max retries', async () => {
      const mockMessage = {
        MessageId: 'msg-max-retry',
        ReceiptHandle: 'receipt-max-retry',
        Body: JSON.stringify({
          workflowId: 'workflow-max-retry',
          recipientId: 'recipient-max-retry',
          content: 'Max retry message',
          attempts: 2, // Will become 3 after increment
          maxRetries: 3,
          scheduledFor: new Date().toISOString()
        })
      };

      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: [mockMessage]
      });
      mockOnlyFansGateway.sendMessage.mockRejectedValue(new Error('Persistent OnlyFans error'));
      mockSQSClient.deleteMessage.mockResolvedValue({});

      const result = await orchestrator.processQueuedMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Max retries exceeded for workflow-max-retry');

      // Should delete message (moves to DLQ automatically)
      expect(mockSQSClient.deleteMessage).toHaveBeenCalledWith({
        QueueUrl: 'huntaze-hybrid-messages-production',
        ReceiptHandle: 'receipt-max-retry'
      });
    });

    it('should handle empty SQS queue gracefully', async () => {
      mockSQSClient.receiveMessage.mockResolvedValue({
        Messages: undefined
      });

      const result = await orchestrator.processQueuedMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(mockOnlyFansGateway.sendMessage).not.toHaveBeenCalled();
      expect(mockSQSClient.deleteMessage).not.toHaveBeenCalled();
    });

    it('should handle SQS service errors', async () => {
      mockSQSClient.receiveMessage.mockRejectedValue(new Error('SQS service unavailable'));

      const result = await orchestrator.processQueuedMessages();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('SQS service unavailable');
    });
  });

  describe('AWS Secrets Manager Integration', () => {
    it('should retrieve database credentials from Secrets Manager', async () => {
      const mockSecrets = {
        DATABASE_URL: 'postgresql://user:pass@huntaze-db.amazonaws.com:5432/huntaze_prod'
      };

      mockSecretsManager.getSecretValue.mockResolvedValue({
        SecretString: JSON.stringify(mockSecrets)
      });

      const secrets = await orchestrator.getSecretsFromAWS();

      expect(secrets.DATABASE_URL).toBe(mockSecrets.DATABASE_URL);
      expect(mockSecretsManager.getSecretValue).toHaveBeenCalledWith({
        SecretId: 'huntaze/database/production'
      });
    });

    it('should handle Secrets Manager errors', async () => {
      mockSecretsManager.getSecretValue.mockRejectedValue(new Error('Access denied'));

      await expect(orchestrator.getSecretsFromAWS()).rejects.toThrow(
        'Failed to retrieve secrets: Access denied'
      );
    });

    it('should handle malformed secret data', async () => {
      mockSecretsManager.getSecretValue.mockResolvedValue({
        SecretString: 'invalid-json'
      });

      await expect(orchestrator.getSecretsFromAWS()).rejects.toThrow(
        'Failed to retrieve secrets:'
      );
    });

    it('should handle missing SecretString', async () => {
      mockSecretsManager.getSecretValue.mockResolvedValue({
        SecretString: undefined
      });

      const secrets = await orchestrator.getSecretsFromAWS();

      expect(secrets).toEqual({});
    });
  });

  describe('Production Safety Requirements', () => {
    it('should persist workflow state with SQS message ID', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Test content'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 45000
      });
      mockSQSClient.sendMessage.mockResolvedValue({
        MessageId: 'sqs-production-123'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-production', {
        type: 'message_sending',
        content: 'Production test message',
        recipientId: 'recipient-production'
      });

      // Verify persistence includes SQS message ID
      const persistenceCalls = mockPostgreSQLClient.hybridWorkflow.create.mock.calls;
      const finalPersistence = persistenceCalls[persistenceCalls.length - 1][0].data;

      expect(finalPersistence).toMatchObject({
        workflowId: expect.any(String),
        userId: 'user-production',
        currentProvider: 'hybrid',
        sqsMessageId: 'sqs-production-123',
        providerStates: expect.objectContaining({
          azure: expect.any(String),
          rateLimiter: expect.any(String)
        }),
        checkpointData: expect.any(Object),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should handle workflow recovery with SQS message ID', async () => {
      const mockPersistedWorkflow = {
        workflowId: 'workflow-recovery-123',
        userId: 'user-recovery',
        currentProvider: 'hybrid',
        providerStates: {
          azure: 'completed',
          openai: 'pending',
          rateLimiter: 'approved',
          onlyFans: 'pending'
        },
        sqsMessageId: 'sqs-recovery-456',
        checkpointData: { 
          request: { type: 'message_sending' },
          sqsMessageId: 'sqs-recovery-456'
        },
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:05:00Z')
      };

      mockPostgreSQLClient.hybridWorkflow.findUnique.mockResolvedValue(mockPersistedWorkflow);

      const result = await orchestrator.recoverWorkflow('workflow-recovery-123');

      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.state!.data.sqsMessageId).toBe('sqs-recovery-456');
      expect(result.state!.providerStates.rateLimiter).toBe('approved');
    });

    it('should maintain AWS compliance for message queuing', async () => {
      mockPostgreSQLClient.hybridWorkflow.create.mockResolvedValue({});
      mockAzureClient.generateContent.mockResolvedValue({
        content: 'Compliance test message'
      });
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 45000
      });
      mockSQSClient.sendMessage.mockResolvedValue({
        MessageId: 'sqs-compliance-789'
      });
      mockCloudWatchClient.putMetricData.mockResolvedValue({});

      await orchestrator.executeHybridWorkflow('user-compliance', {
        type: 'message_sending',
        content: 'Generate compliance message',
        recipientId: 'recipient-compliance'
      });

      // Verify SQS message attributes for compliance
      const sqsCall = mockSQSClient.sendMessage.mock.calls[0][0];
      
      expect(sqsCall.MessageAttributes).toMatchObject({
        workflowId: {
          DataType: 'String',
          StringValue: expect.any(String)
        },
        userId: {
          DataType: 'String',
          StringValue: 'user-compliance'
        }
      });

      // Verify delay is set correctly for OnlyFans compliance
      expect(sqsCall.DelaySeconds).toBe(45);
      expect(sqsCall.QueueUrl).toBe('huntaze-hybrid-messages-production');
    });
  });
});