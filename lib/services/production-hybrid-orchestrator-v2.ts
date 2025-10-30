/**
 * Production Hybrid Orchestrator - AWS Integration
 * 
 * Orchestrateur production-ready utilisant:
 * - PostgreSQL RDS pour persistence
 * - SQS pour message queuing
 * - CloudWatch pour monitoring
 * - Distributed tracing avec X-Ray
 * 
 * @module production-hybrid-orchestrator-v2
 */

import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { PrismaClient } from '@prisma/client';
import { azurePlannerAgent, PlannedContent } from '@/src/lib/agents/azure-planner';
import { AIRouter } from '@/lib/services/ai-router';
import { OnlyFansGateway } from '@/lib/services/onlyfans/gateway';
import { costMonitoringService } from '@/lib/services/cost-monitoring-service';
import { v4 as uuidv4 } from 'uuid';

// ==================== CUSTOM ERROR TYPES ====================

/**
 * Erreur d'exécution OpenAI avec contexte
 */
export class OpenAIExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'OpenAIExecutionError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de timeout
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur d'exécution Azure avec contexte
 */
export class AzureExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AzureExecutionError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== TYPE DEFINITIONS ====================

/**
 * Résultat d'exécution OpenAI typé
 */
export interface OpenAIExecutionResult {
  content: string;
  fullResult: any;
  provider: 'openai';
  traceContext: TraceContext;
  costInfo: {
    tokens: number;
    cost: number;
    duration: number;
  };
  metadata: {
    attempt: number;
    totalRetries: number;
    success: boolean;
  };
}

/**
 * Résultat d'exécution Azure typé
 */
export interface AzureExecutionResult {
  content: string;
  fullResult: PlannedContent;
  provider: 'azure';
  traceContext: TraceContext;
  costInfo: {
    tokens: number;
    cost: number;
    duration: number;
  };
  metadata: {
    attempt: number;
    totalRetries: number;
    success: boolean;
  };
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  userId: string;
  workflowId: string;
  timestamp: Date;
}

export interface ProductionWorkflowIntent {
  type: 'content_planning' | 'message_generation' | 'content_validation' | 'campaign_execution';
  userId: string;
  data: Record<string, any>;
  platforms?: string[];
  contentType?: string;
  sendToOnlyFans?: boolean;
  recipientId?: string;
  requiresMultiPlatform?: boolean;
  forceProvider?: 'azure' | 'openai';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  traceContext?: TraceContext;
}

export interface HybridWorkflowState {
  workflowId: string;
  userId: string;
  traceId: string;
  currentProvider: 'azure' | 'openai' | 'hybrid';
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
}

export interface FallbackMatrix {
  scenarios: {
    'azure_timeout': { fallback: 'openai'; maxRetries: 2; delayMs: 5000 };
    'azure_rate_limited': { fallback: 'openai'; maxRetries: 1; delayMs: 1000 };
    'openai_timeout': { fallback: 'azure'; maxRetries: 2; delayMs: 5000 };
    'openai_rate_limited': { fallback: 'queue'; maxRetries: 0; delayMs: 60000 };
    'onlyfans_rate_limited': { fallback: 'queue'; maxRetries: 0; delayMs: 45000 };
    'rate_limiter_down': { fallback: 'bypass_with_warning'; maxRetries: 1; delayMs: 2000 };
  };
}

export class ProductionHybridOrchestrator {
  private readonly sqsClient: SQSClient;
  private readonly cloudWatchClient: CloudWatchClient;
  private readonly prisma: PrismaClient;
  
  // Configuration SQS basée sur ton infrastructure réelle
  private readonly SQS_QUEUES = {
    ONLYFANS_MESSAGES: 'https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo',
    RETRY_QUEUE: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-dlq-production',
    DLQ: 'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-dlq-production'
  };

  private readonly FALLBACK_MATRIX: FallbackMatrix = {
    scenarios: {
      'azure_timeout': { fallback: 'openai', maxRetries: 2, delayMs: 5000 },
      'azure_rate_limited': { fallback: 'openai', maxRetries: 1, delayMs: 1000 },
      'openai_timeout': { fallback: 'azure', maxRetries: 2, delayMs: 5000 },
      'openai_rate_limited': { fallback: 'queue', maxRetries: 0, delayMs: 60000 },
      'onlyfans_rate_limited': { fallback: 'queue', maxRetries: 0, delayMs: 45000 },
      'rate_limiter_down': { fallback: 'bypass_with_warning', maxRetries: 1, delayMs: 2000 }
    }
  };

  constructor(
    private aiRouter: AIRouter,
    private ofGateway: OnlyFansGateway,
    region: string = 'us-east-1'
  ) {
    this.sqsClient = new SQSClient({ region });
    this.cloudWatchClient = new CloudWatchClient({ region });
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze_production'
        }
      }
    });
  }

  /**
   * Exécute un workflow avec distributed tracing et fallback
   */
  async executeWorkflow(
    userId: string,
    intent: ProductionWorkflowIntent
  ): Promise<any> {
    const traceContext = this.createTraceContext(userId, intent);
    const workflowState = await this.initializeWorkflowState(userId, traceContext);

    try {
      // Log début du workflow
      await this.logTrace(traceContext, 'workflow_started', { intent });

      // Sélectionner le provider optimal
      const provider = this.selectProvider(intent);
      workflowState.currentProvider = provider;

      // Exécuter avec le provider sélectionné
      let result;
      if (provider === 'azure') {
        result = await this.executeWithAzure(intent, traceContext, workflowState);
      } else {
        result = await this.executeWithOpenAI(intent, traceContext, workflowState);
      }

      // Si besoin d'envoyer sur OnlyFans
      if (intent.sendToOnlyFans && intent.recipientId) {
        await this.scheduleOnlyFansMessage(
          userId,
          intent.recipientId,
          result.content,
          traceContext,
          workflowState
        );
      }

      // Marquer comme complété
      await this.completeWorkflow(workflowState);
      await this.logTrace(traceContext, 'workflow_completed', { result });

      return result;

    } catch (error) {
      await this.handleWorkflowError(error, traceContext, workflowState, intent);
      throw error;
    }
  }

  /**
   * Crée un contexte de tracing distribué
   */
  private createTraceContext(userId: string, intent: ProductionWorkflowIntent): TraceContext {
    return {
      traceId: intent.traceContext?.traceId || uuidv4(),
      spanId: uuidv4(),
      parentSpanId: intent.traceContext?.spanId,
      userId,
      workflowId: uuidv4(),
      timestamp: new Date()
    };
  }

  /**
   * Initialise l'état du workflow en RDS PostgreSQL
   */
  private async initializeWorkflowState(
    userId: string,
    traceContext: TraceContext
  ): Promise<HybridWorkflowState> {
    const workflowState: HybridWorkflowState = {
      workflowId: traceContext.workflowId,
      userId,
      traceId: traceContext.traceId,
      currentProvider: 'hybrid',
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
      }
    };

    // Persister en RDS PostgreSQL
    await this.prisma.hybridWorkflow.create({
      data: {
        userId,
        workflowId: traceContext.workflowId,
        traceId: traceContext.traceId,
        currentProvider: 'hybrid',
        providerStates: workflowState.providerStates,
        checkpointData: workflowState
      }
    });

    return workflowState;
  }

  /**
   * Sélectionne le provider optimal basé sur le type de tâche
   */
  private selectProvider(intent: ProductionWorkflowIntent): 'azure' | 'openai' {
    // Force provider si spécifié
    if (intent.forceProvider) {
      return intent.forceProvider;
    }

    // Règles de routage intelligent
    switch (intent.type) {
      case 'content_planning':
        // Azure excellent pour planning multi-plateforme
        return 'azure';
      
      case 'campaign_execution':
        // Azure pour coordination multi-plateforme
        return intent.requiresMultiPlatform ? 'azure' : 'openai';
      
      case 'content_validation':
        // OpenAI meilleur pour validation et compliance
        return 'openai';
      
      case 'message_generation':
        // OpenAI pour génération de messages personnalisés
        return 'openai';
      
      default:
        // Par défaut, utiliser OpenAI
        return 'openai';
    }
  }

  /**
   * Exécute avec Azure Planner + fallback avec retry strategy
   * 
   * @param intent - Intent du workflow
   * @param traceContext - Contexte de tracing distribué
   * @param workflowState - État actuel du workflow
   * @returns Résultat de l'exécution avec informations de coût
   * @throws {AzureExecutionError} Si l'exécution échoue après tous les retries
   */
  private async executeWithAzure(
    intent: ProductionWorkflowIntent,
    traceContext: TraceContext,
    workflowState: HybridWorkflowState
  ): Promise<AzureExecutionResult> {
    const childTrace = { ...traceContext, spanId: uuidv4(), parentSpanId: traceContext.spanId };
    const startTime = Date.now();
    const maxRetries = 3;
    const retryDelays = [1000, 2000, 5000]; // Exponential backoff
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.logTrace(childTrace, 'azure_execution_started', { 
          attempt: attempt + 1, 
          maxRetries: maxRetries + 1 
        });
        
        workflowState.providerStates.azure = 'executing';
        await this.updateWorkflowState(workflowState);

        // Exécuter avec timeout de 45 secondes (Azure peut être plus lent)
        const result = await this.executeWithTimeout(
          azurePlannerAgent({
            platforms: intent.platforms || ['instagram'],
            period: 'weekly',
            userId: intent.userId,
            ...intent.data
          }),
          45000, // 45s timeout
          'Azure request timeout'
        );

        // Calculer les coûts et tokens
        const duration = Date.now() - startTime;
        const estimatedTokens = this.estimateTokenUsage(result);
        const estimatedCost = this.calculateAzureCost(estimatedTokens);

        // Tracker les coûts avec gestion d'erreur
        try {
          await costMonitoringService.trackUsage(
            'azure',
            estimatedTokens,
            estimatedCost,
            intent.userId,
            traceContext.workflowId,
            intent.type,
            {
              traceId: childTrace.traceId,
              duration,
              model: 'gpt-4-turbo',
              region: 'eastus',
              cacheHit: false,
              retryAttempt: attempt
            }
          );
        } catch (costError) {
          // Log mais ne pas bloquer le workflow
          console.error('[Azure] Cost tracking failed:', costError);
          await this.logTrace(childTrace, 'cost_tracking_failed', { 
            error: costError instanceof Error ? costError.message : String(costError) 
          });
        }

        workflowState.providerStates.azure = 'completed';
        await this.updateWorkflowState(workflowState);
        
        await this.logTrace(childTrace, 'azure_execution_completed', { 
          result: this.sanitizeResultForLogging(result),
          cost: estimatedCost, 
          tokens: estimatedTokens,
          duration,
          attempt: attempt + 1
        });

        return {
          content: result.contents?.[0]?.text || 'Generated content',
          fullResult: result,
          provider: 'azure',
          traceContext: childTrace,
          costInfo: {
            tokens: estimatedTokens,
            cost: estimatedCost,
            duration
          },
          metadata: {
            attempt: attempt + 1,
            totalRetries: attempt,
            success: true
          }
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Déterminer si l'erreur est retryable
        const isRetryable = this.isRetryableError(error);
        const errorType = this.classifyError(error);
        
        await this.logTrace(childTrace, 'azure_execution_error', { 
          error: lastError.message,
          errorType,
          isRetryable,
          attempt: attempt + 1,
          willRetry: isRetryable && attempt < maxRetries
        });

        // Si non retryable ou dernier attempt, sortir
        if (!isRetryable || attempt === maxRetries) {
          workflowState.providerStates.azure = 'failed';
          workflowState.retryAttempts.azure = attempt + 1;
          await this.updateWorkflowState(workflowState);
          
          await this.logTrace(childTrace, 'azure_execution_failed', { 
            error: lastError.message,
            errorType,
            totalAttempts: attempt + 1
          });

          // Appliquer fallback strategy
          return await this.applyFallbackStrategy(
            errorType === 'rate_limit' ? 'azure_rate_limited' : 'azure_timeout',
            intent,
            traceContext,
            workflowState
          );
        }

        // Attendre avant retry avec exponential backoff
        const delay = retryDelays[attempt] || 5000;
        await this.logTrace(childTrace, 'azure_retry_scheduled', { 
          delay,
          nextAttempt: attempt + 2
        });
        
        await this.sleep(delay);
      }
    }

    // Ne devrait jamais arriver ici, mais par sécurité
    throw new AzureExecutionError(
      `Azure execution failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      lastError
    );
  }

  /**
   * Exécute avec OpenAI Router + fallback avec retry strategy
   * 
   * @param intent - Intent du workflow
   * @param traceContext - Contexte de tracing distribué
   * @param workflowState - État actuel du workflow
   * @returns Résultat de l'exécution avec informations de coût
   * @throws {OpenAIExecutionError} Si l'exécution échoue après tous les retries
   */
  private async executeWithOpenAI(
    intent: ProductionWorkflowIntent,
    traceContext: TraceContext,
    workflowState: HybridWorkflowState
  ): Promise<OpenAIExecutionResult> {
    const childTrace = { ...traceContext, spanId: uuidv4(), parentSpanId: traceContext.spanId };
    const startTime = Date.now();
    const maxRetries = 3;
    const retryDelays = [1000, 2000, 5000]; // Exponential backoff
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.logTrace(childTrace, 'openai_execution_started', { 
          attempt: attempt + 1, 
          maxRetries: maxRetries + 1 
        });
        
        workflowState.providerStates.openai = 'executing';
        await this.updateWorkflowState(workflowState);

        // Exécuter avec timeout de 30 secondes
        const result = await this.executeWithTimeout(
          this.aiRouter.routeRequest({
            type: intent.type,
            data: intent.data,
            context: { 
              userId: intent.userId,
              priority: intent.priority,
              traceId: childTrace.traceId
            }
          }),
          30000, // 30s timeout
          'OpenAI request timeout'
        );

        // Calculer les coûts et tokens
        const duration = Date.now() - startTime;
        const estimatedTokens = this.estimateTokenUsage(result);
        const estimatedCost = this.calculateOpenAICost(estimatedTokens);

        // Tracker les coûts avec gestion d'erreur
        try {
          await costMonitoringService.trackUsage(
            'openai',
            estimatedTokens,
            estimatedCost,
            intent.userId,
            traceContext.workflowId,
            intent.type,
            {
              traceId: childTrace.traceId,
              duration,
              model: 'gpt-3.5-turbo',
              cacheHit: false,
              retryAttempt: attempt
            }
          );
        } catch (costError) {
          // Log mais ne pas bloquer le workflow
          console.error('[OpenAI] Cost tracking failed:', costError);
          await this.logTrace(childTrace, 'cost_tracking_failed', { 
            error: costError instanceof Error ? costError.message : String(costError) 
          });
        }

        workflowState.providerStates.openai = 'completed';
        await this.updateWorkflowState(workflowState);
        
        await this.logTrace(childTrace, 'openai_execution_completed', { 
          result: this.sanitizeResultForLogging(result),
          cost: estimatedCost,
          tokens: estimatedTokens,
          duration,
          attempt: attempt + 1
        });

        return {
          content: result.data?.content || result.data,
          fullResult: result,
          provider: 'openai',
          traceContext: childTrace,
          costInfo: {
            tokens: estimatedTokens,
            cost: estimatedCost,
            duration
          },
          metadata: {
            attempt: attempt + 1,
            totalRetries: attempt,
            success: true
          }
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Déterminer si l'erreur est retryable
        const isRetryable = this.isRetryableError(error);
        const errorType = this.classifyError(error);
        
        await this.logTrace(childTrace, 'openai_execution_error', { 
          error: lastError.message,
          errorType,
          isRetryable,
          attempt: attempt + 1,
          willRetry: isRetryable && attempt < maxRetries
        });

        // Si non retryable ou dernier attempt, sortir
        if (!isRetryable || attempt === maxRetries) {
          workflowState.providerStates.openai = 'failed';
          workflowState.retryAttempts.openai = attempt + 1;
          await this.updateWorkflowState(workflowState);
          
          await this.logTrace(childTrace, 'openai_execution_failed', { 
            error: lastError.message,
            errorType,
            totalAttempts: attempt + 1
          });

          // Appliquer fallback strategy
          return await this.applyFallbackStrategy(
            errorType === 'rate_limit' ? 'openai_rate_limited' : 'openai_timeout',
            intent,
            traceContext,
            workflowState
          );
        }

        // Attendre avant retry avec exponential backoff
        const delay = retryDelays[attempt] || 5000;
        await this.logTrace(childTrace, 'openai_retry_scheduled', { 
          delay,
          nextAttempt: attempt + 2
        });
        
        await this.sleep(delay);
      }
    }

    // Ne devrait jamais arriver ici, mais par sécurité
    throw new OpenAIExecutionError(
      `OpenAI execution failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      lastError
    );
  }

  /**
   * Exécute une promesse avec timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new TimeoutError(timeoutMessage)), timeoutMs)
      )
    ]);
  }

  /**
   * Détermine si une erreur est retryable
   */
  private isRetryableError(error: any): boolean {
    // Erreurs réseau retryables
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }

    // Erreurs HTTP retryables (5xx, 429)
    if (error.status >= 500 || error.status === 429) {
      return true;
    }

    // Timeout errors
    if (error instanceof TimeoutError) {
      return true;
    }

    // Erreurs OpenAI spécifiques
    if (error.message?.includes('timeout') || 
        error.message?.includes('rate limit')) {
      return true;
    }

    return false;
  }

  /**
   * Classifie le type d'erreur
   */
  private classifyError(error: any): 'timeout' | 'rate_limit' | 'auth' | 'validation' | 'unknown' {
    if (error instanceof TimeoutError || error.message?.includes('timeout')) {
      return 'timeout';
    }
    
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return 'rate_limit';
    }
    
    if (error.status === 401 || error.status === 403) {
      return 'auth';
    }
    
    if (error.status === 400 || error.status === 422) {
      return 'validation';
    }
    
    return 'unknown';
  }

  /**
   * Sanitize result pour logging (éviter de logger des données sensibles)
   */
  private sanitizeResultForLogging(result: any): any {
    if (!result) return null;
    
    return {
      hasData: !!result.data,
      dataType: typeof result.data,
      dataKeys: result.data ? Object.keys(result.data).slice(0, 5) : [],
      success: result.success,
      // Ne pas logger le contenu complet
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Applique la stratégie de fallback
   */
  private async applyFallbackStrategy(
    scenario: keyof FallbackMatrix['scenarios'],
    intent: ProductionWorkflowIntent,
    traceContext: TraceContext,
    workflowState: HybridWorkflowState
  ): Promise<any> {
    const strategy = this.FALLBACK_MATRIX.scenarios[scenario];
    
    if (strategy.fallback === 'openai') {
      // Enregistrer le fallback
      workflowState.fallbackHistory.push({
        from: 'azure',
        to: 'openai',
        reason: scenario,
        timestamp: new Date()
      });
      
      await this.updateWorkflowState(workflowState);
      return await this.executeWithOpenAI(intent, traceContext, workflowState);
    }
    
    if (strategy.fallback === 'azure') {
      // Enregistrer le fallback
      workflowState.fallbackHistory.push({
        from: 'openai',
        to: 'azure',
        reason: scenario,
        timestamp: new Date()
      });
      
      await this.updateWorkflowState(workflowState);
      return await this.executeWithAzure(intent, traceContext, workflowState);
    }
    
    if (strategy.fallback === 'queue') {
      // Programmer pour plus tard
      await this.scheduleRetry(intent, traceContext, strategy.delayMs);
      throw new Error(`Workflow queued for retry in ${strategy.delayMs}ms due to ${scenario}`);
    }

    throw new Error(`No fallback available for scenario: ${scenario}`);
  }

  /**
   * Programme un message OnlyFans via SQS FIFO
   */
  private async scheduleOnlyFansMessage(
    userId: string,
    recipientId: string,
    content: string,
    traceContext: TraceContext,
    workflowState: HybridWorkflowState
  ): Promise<void> {
    const messagePayload = {
      workflowId: traceContext.workflowId,
      traceId: traceContext.traceId,
      userId,
      recipientId,
      content,
      attempts: 0,
      maxRetries: 3,
      scheduledFor: new Date(Date.now() + 45000).toISOString() // 45s delay OnlyFans compliance
    };

    // Envoyer à SQS FIFO (ta queue existante)
    const sqsResult = await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: this.SQS_QUEUES.ONLYFANS_MESSAGES,
      MessageBody: JSON.stringify(messagePayload),
      MessageGroupId: userId, // FIFO grouping par user
      MessageDeduplicationId: `${traceContext.workflowId}-${Date.now()}`, // Déduplication
      DelaySeconds: 45 // OnlyFans compliance
    }));

    // Persister en RDS PostgreSQL
    await this.prisma.onlyFansMessage.create({
      data: {
        workflowId: traceContext.workflowId,
        userId,
        recipientId,
        content,
        scheduledFor: new Date(Date.now() + 45000),
        sqsMessageId: sqsResult.MessageId,
        status: 'queued'
      }
    });

    workflowState.providerStates.onlyFans = 'sending';
    await this.updateWorkflowState(workflowState);
    
    await this.logTrace(traceContext, 'onlyfans_message_scheduled', { 
      recipientId, 
      sqsMessageId: sqsResult.MessageId 
    });
  }

  /**
   * Met à jour l'état du workflow en RDS
   */
  private async updateWorkflowState(workflowState: HybridWorkflowState): Promise<void> {
    await this.prisma.hybridWorkflow.update({
      where: { workflowId: workflowState.workflowId },
      data: {
        currentProvider: workflowState.currentProvider,
        providerStates: workflowState.providerStates,
        checkpointData: workflowState
      }
    });
  }

  /**
   * Marque le workflow comme complété
   */
  private async completeWorkflow(workflowState: HybridWorkflowState): Promise<void> {
    await this.prisma.hybridWorkflow.update({
      where: { workflowId: workflowState.workflowId },
      data: {
        currentProvider: 'completed',
        checkpointData: { ...workflowState, completedAt: new Date() }
      }
    });
  }

  /**
   * Gère les erreurs de workflow
   */
  private async handleWorkflowError(
    error: any,
    traceContext: TraceContext,
    workflowState: HybridWorkflowState,
    intent: ProductionWorkflowIntent
  ): Promise<void> {
    await this.logTrace(traceContext, 'workflow_error', { 
      error: error.message,
      stack: error.stack,
      workflowState 
    });

    // Marquer comme failed en base
    await this.prisma.hybridWorkflow.update({
      where: { workflowId: workflowState.workflowId },
      data: {
        currentProvider: 'failed',
        checkpointData: { 
          ...workflowState, 
          error: error.message,
          failedAt: new Date() 
        }
      }
    });
  }

  /**
   * Programme un retry via SQS
   */
  private async scheduleRetry(
    intent: ProductionWorkflowIntent,
    traceContext: TraceContext,
    delayMs: number
  ): Promise<void> {
    const retryPayload = {
      ...intent,
      traceContext,
      retryAttempt: (intent as any).retryAttempt ? (intent as any).retryAttempt + 1 : 1,
      scheduledFor: new Date(Date.now() + delayMs).toISOString()
    };

    await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: this.SQS_QUEUES.RETRY_QUEUE,
      MessageBody: JSON.stringify(retryPayload),
      DelaySeconds: Math.floor(delayMs / 1000)
    }));
  }

  /**
   * Log distribué avec CloudWatch
   */
  private async logTrace(
    traceContext: TraceContext,
    event: string,
    data?: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      parentSpanId: traceContext.parentSpanId,
      userId: traceContext.userId,
      workflowId: traceContext.workflowId,
      event,
      data
    };

    console.log('[TRACE]', JSON.stringify(logEntry));

    // Envoyer métriques à CloudWatch
    try {
      await this.cloudWatchClient.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/HybridOrchestrator',
        MetricData: [{
          MetricName: event,
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'UserId', Value: traceContext.userId },
            { Name: 'WorkflowId', Value: traceContext.workflowId }
          ]
        }]
      }));
    } catch (error) {
      console.error('Failed to send CloudWatch metrics:', error);
    }
  }

  /**
   * Health check de l'orchestrateur
   */
  async healthCheck(): Promise<{
    azure: boolean;
    openai: boolean;
    database: boolean;
    sqs: boolean;
  }> {
    const checks = await Promise.allSettled([
      // Test Azure (simple ping)
      azurePlannerAgent({
        platforms: ['instagram'],
        period: 'weekly',
        userId: 'health-check'
      }).then(() => true).catch(() => false),
      
      // Test OpenAI
      this.aiRouter.routeRequest({
        type: 'test',
        data: { message: 'health check' },
        context: { userId: 'health-check' }
      }).then(() => true).catch(() => false),
      
      // Test Database
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      
      // Test SQS
      this.sqsClient.send(new SendMessageCommand({
        QueueUrl: this.SQS_QUEUES.RETRY_QUEUE,
        MessageBody: JSON.stringify({ healthCheck: true }),
        DelaySeconds: 1
      })).then(() => true).catch(() => false)
    ]);

    return {
      azure: checks[0].status === 'fulfilled' ? checks[0].value : false,
      openai: checks[1].status === 'fulfilled' ? checks[1].value : false,
      database: checks[2].status === 'fulfilled' ? checks[2].value : false,
      sqs: checks[3].status === 'fulfilled' ? checks[3].value : false
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // ==================== COST TRACKING UTILITIES ====================

  /**
   * Estime l'usage de tokens basé sur le résultat
   */
  private estimateTokenUsage(result: any): number {
    try {
      // Si le résultat contient des infos de tokens
      if (result.usage?.total_tokens) {
        return result.usage.total_tokens;
      }

      // Sinon, estimer basé sur la longueur du contenu
      const content = JSON.stringify(result);
      // Approximation: 1 token ≈ 4 caractères pour l'anglais
      return Math.ceil(content.length / 4);
    } catch (error) {
      console.warn('[ProductionHybridOrchestrator] Error estimating token usage:', error);
      return 1000; // Valeur par défaut conservative
    }
  }

  /**
   * Calcule le coût Azure basé sur les tokens
   */
  private calculateAzureCost(tokens: number): number {
    // Coûts Azure (en dollars par 1K tokens)
    const AZURE_COST_PER_1K = 0.01; // GPT-4 Turbo
    return (tokens / 1000) * AZURE_COST_PER_1K;
  }

  /**
   * Calcule le coût OpenAI basé sur les tokens
   */
  private calculateOpenAICost(tokens: number): number {
    // Coûts OpenAI (en dollars par 1K tokens)
    const OPENAI_COST_PER_1K = 0.002; // GPT-3.5 Turbo
    return (tokens / 1000) * OPENAI_COST_PER_1K;
  }
}

/**
 * Factory pour créer l'orchestrateur avec les dépendances
 */
export class ProductionHybridOrchestratorFactory {
  static async create(): Promise<ProductionHybridOrchestrator> {
    // Import dynamique pour éviter les dépendances circulaires
    const { AIRouter } = await import('@/lib/services/ai-router');
    const { createOnlyFansGateway } = await import('@/lib/services/onlyfans/gateway');

    // Créer les instances
    const aiRouter = new AIRouter();
    const ofGateway = createOnlyFansGateway({
      auth: {
        sessionToken: process.env.ONLYFANS_SESSION_TOKEN || ''
      },
      retry: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2
      },
      cache: {
        ttlMs: 300000, // 5 minutes
        maxSize: 1000
      },
      rateLimit: {
        maxPerMinute: 10, // OnlyFans compliance
        maxPerHour: 100
      }
    });

    return new ProductionHybridOrchestrator(aiRouter, ofGateway);
  }
}

/**
 * Singleton instance pour l'app
 */
let orchestratorInstance: ProductionHybridOrchestrator | null = null;

export async function getProductionHybridOrchestrator(): Promise<ProductionHybridOrchestrator> {
  if (!orchestratorInstance) {
    orchestratorInstance = await ProductionHybridOrchestratorFactory.create();
  }
  return orchestratorInstance;
}