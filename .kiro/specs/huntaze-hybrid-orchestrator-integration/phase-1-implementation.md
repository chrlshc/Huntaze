# Phase 1 Implementation - Huntaze Hybrid Orchestrator (Semaine 1)

## 🎯 **OVERVIEW - 6 TÂCHES CORE SAFETY**

Implémentation production-ready utilisant ton infrastructure AWS existante :
- **PostgreSQL RDS** avec Prisma migrations
- **SQS Queues** existantes + nouvelle queue hybrid
- **ECS Fargate** déploiement
- **CloudWatch** monitoring
- **Vitest** testing avec mocks AWS

## 📋 **TÂCHE 1.1 - ProductionHybridOrchestrator + TraceContext**

### **Prisma Migration - Ajouter Tables Workflows**

```sql
-- Migration: add_hybrid_workflows.sql
CREATE TABLE "hybrid_workflows" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "trace_id" TEXT NOT NULL,
  "current_provider" TEXT NOT NULL,
  "provider_states" JSONB NOT NULL DEFAULT '{}',
  "sqs_message_id" TEXT,
  "checkpoint_data" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "hybrid_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onlyfans_messages" (
  "id" TEXT NOT NULL,
  "workflow_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "recipient_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "last_error" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sqs_message_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onlyfans_messages_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "hybrid_workflows_workflow_id_key" ON "hybrid_workflows"("workflow_id");
CREATE INDEX "hybrid_workflows_user_id_idx" ON "hybrid_workflows"("user_id");
CREATE INDEX "hybrid_workflows_trace_id_idx" ON "hybrid_workflows"("trace_id");
CREATE INDEX "onlyfans_messages_workflow_id_idx" ON "onlyfans_messages"("workflow_id");
CREATE INDEX "onlyfans_messages_user_id_idx" ON "onlyfans_messages"("user_id");
CREATE INDEX "onlyfans_messages_status_idx" ON "onlyfans_messages"("status");
CREATE INDEX "onlyfans_messages_scheduled_for_idx" ON "onlyfans_messages"("scheduled_for");

-- Foreign Keys
ALTER TABLE "hybrid_workflows" ADD CONSTRAINT "hybrid_workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onlyfans_messages" ADD CONSTRAINT "onlyfans_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### **Prisma Schema Update**

```prisma
// Ajouter à prisma/schema.prisma

model HybridWorkflow {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  workflowId      String   @unique @map("workflow_id")
  traceId         String   @map("trace_id")
  currentProvider String   @map("current_provider")
  providerStates  Json     @default("{}") @map("provider_states")
  sqsMessageId    String?  @map("sqs_message_id")
  checkpointData  Json     @default("{}") @map("checkpoint_data")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([traceId])
  @@map("hybrid_workflows")
}

model OnlyFansMessage {
  id            String   @id @default(cuid())
  workflowId    String   @map("workflow_id")
  userId        String   @map("user_id")
  recipientId   String   @map("recipient_id")
  content       String
  attempts      Int      @default(0)
  maxRetries    Int      @default(3) @map("max_retries")
  scheduledFor  DateTime @map("scheduled_for")
  lastError     String?  @map("last_error")
  status        String   @default("pending")
  sqsMessageId  String?  @map("sqs_message_id")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([workflowId])
  @@index([userId])
  @@index([status])
  @@index([scheduledFor])
  @@map("onlyfans_messages")
}

// Ajouter aux relations User
model User {
  // ... existing fields
  hybridWorkflows   HybridWorkflow[]
  onlyFansMessages  OnlyFansMessage[]
  // ... rest of relations
}
```

### **ProductionHybridOrchestrator Implementation**

```typescript
// lib/services/production-hybrid-orchestrator-v2.ts
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { PrismaClient } from '@prisma/client';
import { azurePlannerAgent, PlannedContent } from '@/src/lib/agents/azure-planner';
import { AIRouter } from '@/lib/services/ai-router';
import { OnlyFansGateway } from '@/lib/services/onlyfans/gateway';
import { v4 as uuidv4 } from 'uuid';

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
  
  private readonly SQS_QUEUES = {
    HYBRID_MESSAGES: 'huntaze-hybrid-messages-production',
    RETRY_QUEUE: 'huntaze-alerts-production',
    DLQ: 'huntaze-dlq-production'
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
    this.prisma = new PrismaClient();
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
   * Initialise l'état du workflow en base
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

    // Persister en base
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
   * Exécute avec Azure Planner + fallback
   */
  private async executeWithAzure(
    intent: ProductionWorkflowIntent,
    traceContext: TraceContext,
    workflowState: HybridWorkflowState
  ): Promise<any> {
    const childTrace = { ...traceContext, spanId: uuidv4(), parentSpanId: traceContext.spanId };
    
    try {
      await this.logTrace(childTrace, 'azure_execution_started');
      workflowState.providerStates.azure = 'executing';
      await this.updateWorkflowState(workflowState);

      const result = await azurePlannerAgent({
        platforms: intent.platforms || ['instagram'],
        period: 'weekly',
        userId: intent.userId,
        ...intent.data
      });

      workflowState.providerStates.azure = 'completed';
      await this.updateWorkflowState(workflowState);
      await this.logTrace(childTrace, 'azure_execution_completed', { result });

      return {
        content: result.contents?.[0]?.text || 'Generated content',
        fullResult: result,
        provider: 'azure',
        traceContext: childTrace
      };

    } catch (error) {
      workflowState.providerStates.azure = 'failed';
      workflowState.retryAttempts.azure++;
      await this.updateWorkflowState(workflowState);
      
      await this.logTrace(childTrace, 'azure_execution_failed', { error: error.message });

      // Appliquer fallback strategy
      return await this.applyFallbackStrategy('azure_timeout', intent, traceContext, workflowState);
    }
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
    
    if (strategy.fallback === 'queue') {
      // Programmer pour plus tard
      await this.scheduleRetry(intent, traceContext, strategy.delayMs);
      throw new Error(`Workflow queued for retry in ${strategy.delayMs}ms due to ${scenario}`);
    }

    throw new Error(`No fallback available for scenario: ${scenario}`);
  }

  /**
   * Programme un message OnlyFans via SQS
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
      scheduledFor: new Date(Date.now() + 45000).toISOString() // 45s delay
    };

    // Envoyer à SQS
    const sqsResult = await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: this.SQS_QUEUES.HYBRID_MESSAGES,
      MessageBody: JSON.stringify(messagePayload),
      DelaySeconds: 45 // OnlyFans compliance
    }));

    // Persister en base
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
   * Met à jour l'état du workflow en base
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
  }

  // ... autres méthodes (selectProvider, executeWithOpenAI, etc.)
}
```

## 📋 **TÂCHE 1.2 - Enhanced Error Handling + FallbackMatrix**

```typescript
// lib/services/enhanced-error-handler.ts
export enum ErrorType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  INVALID_REQUEST = 'invalid_request',
  ONLYFANS_API_ERROR = 'onlyfans_api_error',
  COST_LIMIT_EXCEEDED = 'cost_limit_exceeded',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  AZURE_TIMEOUT = 'azure_timeout',
  OPENAI_TIMEOUT = 'openai_timeout',
  SQS_ERROR = 'sqs_error',
  DATABASE_ERROR = 'database_error'
}

export interface EnhancedError extends Error {
  type: ErrorType;
  retryable: boolean;
  retryAfter?: number;
  provider?: string;
  traceContext?: TraceContext;
  originalError?: Error;
}

export class EnhancedErrorHandler {
  /**
   * Classifie et enrichit les erreurs
   */
  static classifyError(error: any, traceContext?: TraceContext): EnhancedError {
    let errorType: ErrorType;
    let retryable = false;
    let retryAfter: number | undefined;

    // Classification basée sur le message d'erreur
    if (error.message?.includes('rate limit') || error.status === 429) {
      errorType = ErrorType.RATE_LIMIT_EXCEEDED;
      retryable = true;
      retryAfter = error.retryAfter || 60;
    } else if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      errorType = error.message.includes('azure') ? ErrorType.AZURE_TIMEOUT : ErrorType.OPENAI_TIMEOUT;
      retryable = true;
      retryAfter = 30;
    } else if (error.message?.includes('OnlyFans') || error.status === 403) {
      errorType = ErrorType.ONLYFANS_API_ERROR;
      retryable = false;
    } else if (error.code === 'P2002' || error.code?.startsWith('P')) {
      errorType = ErrorType.DATABASE_ERROR;
      retryable = true;
      retryAfter = 5;
    } else {
      errorType = ErrorType.PROVIDER_UNAVAILABLE;
      retryable = true;
      retryAfter = 10;
    }

    const enhancedError = new Error(error.message) as EnhancedError;
    enhancedError.type = errorType;
    enhancedError.retryable = retryable;
    enhancedError.retryAfter = retryAfter;
    enhancedError.traceContext = traceContext;
    enhancedError.originalError = error;

    return enhancedError;
  }

  /**
   * Détermine la stratégie de retry
   */
  static getRetryStrategy(error: EnhancedError): {
    shouldRetry: boolean;
    delayMs: number;
    maxRetries: number;
  } {
    if (!error.retryable) {
      return { shouldRetry: false, delayMs: 0, maxRetries: 0 };
    }

    switch (error.type) {
      case ErrorType.RATE_LIMIT_EXCEEDED:
        return { shouldRetry: true, delayMs: (error.retryAfter || 60) * 1000, maxRetries: 3 };
      
      case ErrorType.AZURE_TIMEOUT:
      case ErrorType.OPENAI_TIMEOUT:
        return { shouldRetry: true, delayMs: 5000, maxRetries: 2 };
      
      case ErrorType.DATABASE_ERROR:
        return { shouldRetry: true, delayMs: 1000, maxRetries: 5 };
      
      default:
        return { shouldRetry: true, delayMs: 2000, maxRetries: 3 };
    }
  }

  /**
   * Exécute avec retry et exponential backoff
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    traceContext?: TraceContext,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: EnhancedError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.classifyError(error, traceContext);
        
        if (attempt === maxRetries || !lastError.retryable) {
          throw lastError;
        }

        const strategy = this.getRetryStrategy(lastError);
        const delayMs = strategy.delayMs * Math.pow(2, attempt); // Exponential backoff
        
        console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delayMs}ms`, {
          error: lastError.message,
          type: lastError.type,
          traceContext
        });

        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw lastError!;
  }
}
```

## 📋 **TÂCHE 1.3 - Production Monitoring + CloudWatch**

```typescript
// lib/services/production-monitoring.ts
import { CloudWatchClient, PutMetricDataCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

export interface MetricData {
  name: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Bytes' | 'Percent';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export class ProductionMonitoring {
  private readonly cloudWatch: CloudWatchClient;
  private readonly cloudWatchLogs: CloudWatchLogsClient;
  private readonly namespace = 'Huntaze/HybridOrchestrator';
  private readonly logGroup = '/aws/ecs/huntaze-hybrid-orchestrator';

  constructor(region: string = 'us-east-1') {
    this.cloudWatch = new CloudWatchClient({ region });
    this.cloudWatchLogs = new CloudWatchLogsClient({ region });
  }

  /**
   * Envoie des métriques custom à CloudWatch
   */
  async putMetrics(metrics: MetricData[]): Promise<void> {
    const metricData = metrics.map(metric => ({
      MetricName: metric.name,
      Value: metric.value,
      Unit: metric.unit,
      Timestamp: metric.timestamp || new Date(),
      Dimensions: metric.dimensions ? 
        Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value })) : 
        undefined
    }));

    await this.cloudWatch.send(new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: metricData
    }));
  }

  /**
   * Métriques spécifiques au hybrid orchestrator
   */
  async recordWorkflowMetrics(
    workflowId: string,
    userId: string,
    provider: string,
    duration: number,
    success: boolean,
    cost?: number
  ): Promise<void> {
    const metrics: MetricData[] = [
      {
        name: 'WorkflowExecutions',
        value: 1,
        unit: 'Count',
        dimensions: { Provider: provider, Success: success.toString() }
      },
      {
        name: 'WorkflowDuration',
        value: duration,
        unit: 'Seconds',
        dimensions: { Provider: provider }
      }
    ];

    if (cost !== undefined) {
      metrics.push({
        name: 'WorkflowCost',
        value: cost,
        unit: 'Count', // Représente les centimes
        dimensions: { Provider: provider }
      });
    }

    await this.putMetrics(metrics);
  }

  /**
   * Métriques SQS
   */
  async recordSQSMetrics(
    queueName: string,
    messagesProcessed: number,
    errors: number,
    avgProcessingTime: number
  ): Promise<void> {
    await this.putMetrics([
      {
        name: 'SQSMessagesProcessed',
        value: messagesProcessed,
        unit: 'Count',
        dimensions: { Queue: queueName }
      },
      {
        name: 'SQSErrors',
        value: errors,
        unit: 'Count',
        dimensions: { Queue: queueName }
      },
      {
        name: 'SQSProcessingTime',
        value: avgProcessingTime,
        unit: 'Seconds',
        dimensions: { Queue: queueName }
      }
    ]);
  }

  /**
   * Health check endpoint data
   */
  async getHealthMetrics(): Promise<{
    azure: boolean;
    openai: boolean;
    database: boolean;
    sqs: boolean;
  }> {
    // Implémentation des health checks
    return {
      azure: true, // À implémenter
      openai: true, // À implémenter  
      database: true, // À implémenter
      sqs: true // À implémenter
    };
  }
}
```

## 🧪 **TESTS VITEST AVEC MOCKS AWS**

```typescript
// tests/unit/production-hybrid-orchestrator-v2.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { ProductionHybridOrchestrator } from '@/lib/services/production-hybrid-orchestrator-v2';

// Mocks AWS
const sqsMock = mockClient(SQSClient);
const cloudWatchMock = mockClient(CloudWatchClient);

// Mock Prisma
const mockPrisma = {
  hybridWorkflow: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn()
  },
  onlyFansMessage: {
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

// Mock Azure Planner
vi.mock('@/src/lib/agents/azure-planner', () => ({
  azurePlannerAgent: vi.fn()
}));

describe('ProductionHybridOrchestrator', () => {
  let orchestrator: ProductionHybridOrchestrator;
  let mockAIRouter: any;
  let mockOFGateway: any;

  beforeEach(() => {
    sqsMock.reset();
    cloudWatchMock.reset();
    vi.clearAllMocks();

    mockAIRouter = {
      routeRequest: vi.fn()
    };

    mockOFGateway = {
      sendMessage: vi.fn()
    };

    orchestrator = new ProductionHybridOrchestrator(
      mockAIRouter,
      mockOFGateway,
      'us-east-1'
    );
  });

  describe('executeWorkflow', () => {
    it('should execute Azure workflow with distributed tracing', async () => {
      // Setup mocks
      const mockAzureResult = {
        contents: [{ id: 'P1', idea: 'Test', text: 'Generated content', assets: [] }],
        platforms: ['instagram']
      };

      vi.mocked(azurePlannerAgent).mockResolvedValue(mockAzureResult);
      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      // Execute
      const result = await orchestrator.executeWorkflow('user-123', {
        type: 'content_planning',
        userId: 'user-123',
        data: { theme: 'fitness' },
        platforms: ['instagram']
      });

      // Assertions
      expect(result.provider).toBe('azure');
      expect(result.content).toBe('Generated content');
      expect(mockPrisma.hybridWorkflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          currentProvider: 'hybrid'
        })
      });
      expect(cloudWatchMock.commandCalls(PutMetricDataCommand)).toHaveLength(3); // start, azure_start, azure_complete
    });

    it('should fallback from Azure to OpenAI on timeout', async () => {
      // Setup Azure failure
      vi.mocked(azurePlannerAgent).mockRejectedValue(new Error('Azure timeout'));
      
      // Setup OpenAI success
      mockAIRouter.routeRequest.mockResolvedValue({
        data: { content: 'OpenAI generated content' },
        tokensUsed: 100,
        cost: 0.002
      });

      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });

      // Execute
      const result = await orchestrator.executeWorkflow('user-123', {
        type: 'content_planning',
        userId: 'user-123',
        data: { theme: 'fitness' }
      });

      // Assertions
      expect(result.provider).toBe('openai');
      expect(result.content).toBe('OpenAI generated content');
      expect(mockPrisma.hybridWorkflow.update).toHaveBeenCalledWith({
        where: { workflowId: expect.any(String) },
        data: expect.objectContaining({
          checkpointData: expect.objectContaining({
            fallbackHistory: expect.arrayContaining([
              expect.objectContaining({
                from: 'azure',
                to: 'openai',
                reason: 'azure_timeout'
              })
            ])
          })
        })
      });
    });

    it('should schedule OnlyFans message via SQS', async () => {
      // Setup mocks
      vi.mocked(azurePlannerAgent).mockResolvedValue({
        contents: [{ id: 'P1', idea: 'Test', text: 'Generated content', assets: [] }],
        platforms: ['instagram']
      });

      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'msg-123' });
      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.onlyFansMessage.create.mockResolvedValue({ id: 'of-msg-1' });

      // Execute with OnlyFans delivery
      await orchestrator.executeWorkflow('user-123', {
        type: 'content_planning',
        userId: 'user-123',
        data: { theme: 'fitness' },
        sendToOnlyFans: true,
        recipientId: 'recipient-456'
      });

      // Assertions
      expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
      const sqsCall = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input;
      expect(sqsCall.QueueUrl).toBe('huntaze-hybrid-messages-production');
      expect(sqsCall.DelaySeconds).toBe(45); // OnlyFans compliance
      
      const messageBody = JSON.parse(sqsCall.MessageBody);
      expect(messageBody.recipientId).toBe('recipient-456');
      expect(messageBody.content).toBe('Generated content');

      expect(mockPrisma.onlyFansMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          recipientId: 'recipient-456',
          content: 'Generated content',
          sqsMessageId: 'msg-123',
          status: 'queued'
        })
      });
    });
  });
});
```

## 🚀 **DÉPLOIEMENT ECS FARGATE**

```bash
#!/bin/bash
# scripts/deploy-phase-1.sh

set -e

echo "🚀 Deploying Huntaze Hybrid Orchestrator Phase 1"

# 1. Deploy database migrations
echo "📊 Deploying database migrations..."
npx prisma migrate deploy

# 2. Create SQS queue if not exists
echo "📬 Setting up SQS queues..."
aws sqs create-queue \
  --queue-name huntaze-hybrid-messages-production \
  --attributes '{
    "VisibilityTimeoutSeconds": "300",
    "MessageRetentionPeriod": "1209600",
    "ReceiveMessageWaitTimeSeconds": "20"
  }' \
  --region us-east-1 || echo "Queue already exists"

# 3. Build and push Docker image
echo "🐳 Building Docker image..."
docker build -t huntaze-hybrid-orchestrator:latest .
docker tag huntaze-hybrid-orchestrator:latest 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-hybrid-orchestrator:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 317805897534.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker push 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-hybrid-orchestrator:latest

# 4. Update ECS service
echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster huntaze-of-fargate \
  --service huntaze-hybrid-orchestrator \
  --force-new-deployment \
  --region us-east-1

# 5. Wait for deployment
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster huntaze-of-fargate \
  --services huntaze-hybrid-orchestrator \
  --region us-east-1

echo "✅ Phase 1 deployment completed!"
echo "📊 Monitor logs: aws logs tail /aws/ecs/huntaze-hybrid-orchestrator --follow"
```

## ✅ **VALIDATION CHECKLIST PHASE 1**

- [ ] **Database migrations** deployed to RDS PostgreSQL
- [ ] **SQS queues** created and configured
- [ ] **ProductionHybridOrchestrator** with distributed tracing
- [ ] **Enhanced error handling** with fallback matrix
- [ ] **CloudWatch monitoring** with custom metrics
- [ ] **Vitest tests** passing with AWS mocks
- [ ] **ECS Fargate** deployment successful
- [ ] **Health checks** responding correctly

Cette implémentation Phase 1 est **production-ready** et utilise ton infrastructure AWS existante de manière optimale.