/**
 * Tests pour ProductionHybridOrchestrator
 * 
 * Tests avec mocks AWS réels (SQS, CloudWatch, RDS)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { ProductionHybridOrchestrator } from '@/lib/services/production-hybrid-orchestrator-v2';

// Mocks AWS
const sqsMock = mockClient(SQSClient);
const cloudWatchMock = mockClient(CloudWatchClient);

// Mock Prisma avec les vraies tables
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
  },
  $queryRaw: vi.fn(),
  $disconnect: vi.fn()
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

// Mock Azure Planner
vi.mock('@/src/lib/agents/azure-planner', () => ({
  azurePlannerAgent: vi.fn()
}));

// Mock AI Router
const mockAIRouter = {
  routeRequest: vi.fn()
};

// Mock OnlyFans Gateway
const mockOFGateway = {
  sendMessage: vi.fn(),
  healthCheck: vi.fn()
};

describe('ProductionHybridOrchestrator', () => {
  let orchestrator: ProductionHybridOrchestrator;

  beforeEach(() => {
    sqsMock.reset();
    cloudWatchMock.reset();
    vi.clearAllMocks();

    // Setup environment
    process.env.DATABASE_URL = 'postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze_production';

    orchestrator = new ProductionHybridOrchestrator(
      mockAIRouter,
      mockOFGateway,
      'us-east-1'
    );
  });

  afterEach(async () => {
    await orchestrator.cleanup();
  });

  describe('executeWorkflow', () => {
    it('should execute Azure workflow with RDS persistence', async () => {
      // Setup mocks
      const mockAzureResult = {
        contents: [{ id: 'P1', idea: 'Test', text: 'Generated content', assets: [] }],
        platforms: ['instagram']
      };

      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
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
      
      // Vérifier persistence RDS
      expect(mockPrisma.hybridWorkflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          currentProvider: 'hybrid',
          providerStates: expect.objectContaining({
            azure: 'pending',
            openai: 'pending',
            rateLimiter: 'pending',
            onlyFans: 'pending'
          })
        })
      });

      // Vérifier CloudWatch metrics
      expect(cloudWatchMock.commandCalls(PutMetricDataCommand)).toHaveLength(3);
    });

    it('should fallback from Azure to OpenAI with state tracking', async () => {
      // Setup Azure failure
      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
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
      
      // Vérifier fallback history en RDS
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

    it('should schedule OnlyFans message via SQS FIFO', async () => {
      // Setup mocks
      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
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

      // Assertions SQS FIFO
      expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
      const sqsCall = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input;
      
      expect(sqsCall.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/317805897534/onlyfans-send.fifo');
      expect(sqsCall.MessageGroupId).toBe('user-123'); // FIFO grouping
      expect(sqsCall.MessageDeduplicationId).toMatch(/^[a-f0-9-]+-\d+$/); // UUID-timestamp
      expect(sqsCall.DelaySeconds).toBe(45); // OnlyFans compliance
      
      const messageBody = JSON.parse(sqsCall.MessageBody);
      expect(messageBody.recipientId).toBe('recipient-456');
      expect(messageBody.content).toBe('Generated content');

      // Vérifier persistence RDS
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

    it('should handle distributed tracing correctly', async () => {
      // Setup mocks
      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
      vi.mocked(azurePlannerAgent).mockResolvedValue({
        contents: [{ id: 'P1', idea: 'Test', text: 'Generated content', assets: [] }],
        platforms: ['instagram']
      });

      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      // Execute with trace context
      const result = await orchestrator.executeWorkflow('user-123', {
        type: 'content_planning',
        userId: 'user-123',
        data: { theme: 'fitness' },
        traceContext: {
          traceId: 'parent-trace-123',
          spanId: 'parent-span-456',
          userId: 'user-123',
          workflowId: 'parent-workflow-789',
          timestamp: new Date()
        }
      });

      // Vérifier que le tracing est propagé
      expect(result.traceContext.traceId).toBe('parent-trace-123');
      expect(result.traceContext.parentSpanId).toBe('parent-span-456');
      expect(result.traceContext.spanId).not.toBe('parent-span-456'); // Nouveau span

      // Vérifier CloudWatch metrics avec dimensions
      const metricsCall = cloudWatchMock.commandCalls(PutMetricDataCommand)[0].args[0].input;
      expect(metricsCall.Namespace).toBe('Huntaze/HybridOrchestrator');
      expect(metricsCall.MetricData[0].Dimensions).toEqual([
        { Name: 'UserId', Value: 'user-123' },
        { Name: 'WorkflowId', Value: expect.any(String) }
      ]);
    });
  });

  describe('healthCheck', () => {
    it('should check all production services', async () => {
      // Setup mocks
      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
      vi.mocked(azurePlannerAgent).mockResolvedValue({ contents: [], platforms: [] });
      
      mockAIRouter.routeRequest.mockResolvedValue({ data: 'ok' });
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'health-123' });

      // Execute
      const health = await orchestrator.healthCheck();

      // Assertions
      expect(health).toEqual({
        azure: true,
        openai: true,
        database: true,
        sqs: true
      });

      // Vérifier les appels
      expect(azurePlannerAgent).toHaveBeenCalledWith({
        platforms: ['instagram'],
        period: 'weekly',
        userId: 'health-check'
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
      
      expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
      const sqsHealthCall = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input;
      expect(sqsHealthCall.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-dlq-production');
    });

    it('should handle partial service failures', async () => {
      // Setup partial failures
      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
      vi.mocked(azurePlannerAgent).mockRejectedValue(new Error('Azure down'));
      
      mockAIRouter.routeRequest.mockResolvedValue({ data: 'ok' });
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'health-123' });

      // Execute
      const health = await orchestrator.healthCheck();

      // Assertions
      expect(health).toEqual({
        azure: false,
        openai: true,
        database: true,
        sqs: true
      });
    });
  });

  describe('provider selection', () => {
    it('should select Azure for content planning', async () => {
      const { azurePlannerAgent } = await import('@/src/lib/agents/azure-planner');
      vi.mocked(azurePlannerAgent).mockResolvedValue({
        contents: [{ id: 'P1', idea: 'Test', text: 'Content', assets: [] }],
        platforms: ['instagram']
      });

      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });

      const result = await orchestrator.executeWorkflow('user-123', {
        type: 'content_planning',
        userId: 'user-123',
        data: {}
      });

      expect(result.provider).toBe('azure');
      expect(azurePlannerAgent).toHaveBeenCalled();
    });

    it('should select OpenAI for message generation', async () => {
      mockAIRouter.routeRequest.mockResolvedValue({
        data: { content: 'Generated message' }
      });

      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });

      const result = await orchestrator.executeWorkflow('user-123', {
        type: 'message_generation',
        userId: 'user-123',
        data: {}
      });

      expect(result.provider).toBe('openai');
      expect(mockAIRouter.routeRequest).toHaveBeenCalled();
    });

    it('should respect forceProvider parameter', async () => {
      mockAIRouter.routeRequest.mockResolvedValue({
        data: { content: 'Forced OpenAI content' }
      });

      mockPrisma.hybridWorkflow.create.mockResolvedValue({ id: 'workflow-1' });
      mockPrisma.hybridWorkflow.update.mockResolvedValue({ id: 'workflow-1' });

      const result = await orchestrator.executeWorkflow('user-123', {
        type: 'content_planning', // Normalement Azure
        userId: 'user-123',
        data: {},
        forceProvider: 'openai' // Force OpenAI
      });

      expect(result.provider).toBe('openai');
      expect(mockAIRouter.routeRequest).toHaveBeenCalled();
    });
  });
});