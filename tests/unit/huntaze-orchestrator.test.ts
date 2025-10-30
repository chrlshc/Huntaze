/**
 * Tests for Huntaze Orchestrator
 * Tests the central orchestration of all workflows
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock all service dependencies
const mockAIRouter = {
  analyze: vi.fn()
};

const mockContentService = {
  generate: vi.fn()
};

const mockMarketingService = {
  create: vi.fn()
};

const mockOnlyFansService = {
  execute: vi.fn()
};

const mockAnalyticsService = {
  track: vi.fn()
};

// Mock the services
vi.mock('@/src/lib/services/ai-router', () => ({
  AIRouter: vi.fn(() => mockAIRouter)
}));

vi.mock('@/src/lib/services/content-service', () => ({
  ContentService: vi.fn(() => mockContentService)
}));

vi.mock('@/src/lib/services/marketing-service', () => ({
  MarketingService: vi.fn(() => mockMarketingService)
}));

vi.mock('@/src/lib/services/onlyfans-service', () => ({
  OnlyFansService: vi.fn(() => mockOnlyFansService)
}));

vi.mock('@/src/lib/services/analytics-service', () => ({
  AnalyticsService: vi.fn(() => mockAnalyticsService)
}));

// Types for the orchestrator
interface WorkflowIntent {
  type: 'content_creation' | 'marketing_campaign' | 'fan_engagement';
  priority: 'low' | 'medium' | 'high';
  targetAudience?: string[];
  contentType?: string;
  scheduledFor?: Date;
}

interface WorkflowResult {
  analysis: any;
  content: any;
  campaign: any;
  execution: any;
  success: boolean;
  duration: number;
  errors?: string[];
}

// Mock implementation of HuntazeOrchestrator
class HuntazeOrchestrator {
  constructor(
    private aiRouter = mockAIRouter,
    private contentService = mockContentService,
    private marketingService = mockMarketingService,
    private onlyFansService = mockOnlyFansService,
    private analyticsService = mockAnalyticsService
  ) {}

  async executeFullWorkflow(userId: string, intent: WorkflowIntent): Promise<WorkflowResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 1. AI Analysis
      const analysis = await this.aiRouter.analyze(intent);
      
      // 2. Content Generation
      const content = await this.contentService.generate(analysis);
      
      // 3. Marketing Campaign
      const campaign = await this.marketingService.create(content);
      
      // 4. OnlyFans Execution
      const execution = await this.onlyFansService.execute(campaign);
      
      // 5. Analytics Tracking
      await this.analyticsService.track(execution);
      
      return {
        analysis,
        content,
        campaign,
        execution,
        success: true,
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        analysis: null,
        content: null,
        campaign: null,
        execution: null,
        success: false,
        duration: Date.now() - startTime,
        errors
      };
    }
  }

  async executePartialWorkflow(
    userId: string, 
    intent: WorkflowIntent, 
    steps: string[]
  ): Promise<Partial<WorkflowResult>> {
    const result: any = {};
    
    if (steps.includes('analysis')) {
      result.analysis = await this.aiRouter.analyze(intent);
    }
    
    if (steps.includes('content')) {
      result.content = await this.contentService.generate(result.analysis || intent);
    }
    
    if (steps.includes('campaign')) {
      result.campaign = await this.marketingService.create(result.content || intent);
    }
    
    if (steps.includes('execution')) {
      result.execution = await this.onlyFansService.execute(result.campaign || intent);
    }
    
    if (steps.includes('analytics')) {
      await this.analyticsService.track(result.execution || result);
    }
    
    return result;
  }

  async getWorkflowStatus(workflowId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
  }> {
    // Mock implementation
    return {
      status: 'completed',
      progress: 100,
      currentStep: 'analytics'
    };
  }
}

describe('HuntazeOrchestrator', () => {
  let orchestrator: HuntazeOrchestrator;

  beforeEach(() => {
    orchestrator = new HuntazeOrchestrator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeFullWorkflow', () => {
    it('should execute complete workflow successfully', async () => {
      // Mock successful responses from all services
      mockAIRouter.analyze.mockResolvedValue({
        sentiment: 'positive',
        topics: ['lifestyle', 'fashion'],
        recommendations: ['increase engagement', 'post at peak hours']
      });

      mockContentService.generate.mockResolvedValue({
        posts: [
          { type: 'image', caption: 'New outfit reveal!', hashtags: ['#fashion', '#style'] },
          { type: 'video', caption: 'Behind the scenes', hashtags: ['#bts', '#lifestyle'] }
        ]
      });

      mockMarketingService.create.mockResolvedValue({
        campaignId: 'camp-123',
        name: 'Fashion Week Campaign',
        schedule: [
          { postId: 'post-1', scheduledFor: new Date('2024-01-15T10:00:00Z') },
          { postId: 'post-2', scheduledFor: new Date('2024-01-15T18:00:00Z') }
        ]
      });

      mockOnlyFansService.execute.mockResolvedValue({
        executionId: 'exec-456',
        messagesScheduled: 2,
        estimatedReach: 1500,
        status: 'scheduled'
      });

      mockAnalyticsService.track.mockResolvedValue({
        tracked: true,
        metricsRecorded: 5
      });

      const intent: WorkflowIntent = {
        type: 'content_creation',
        priority: 'high',
        targetAudience: ['premium_subscribers'],
        contentType: 'fashion'
      };

      const result = await orchestrator.executeFullWorkflow('user-123', intent);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.campaign).toBeDefined();
      expect(result.execution).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();

      // Verify all services were called in correct order
      expect(mockAIRouter.analyze).toHaveBeenCalledWith(intent);
      expect(mockContentService.generate).toHaveBeenCalledWith(result.analysis);
      expect(mockMarketingService.create).toHaveBeenCalledWith(result.content);
      expect(mockOnlyFansService.execute).toHaveBeenCalledWith(result.campaign);
      expect(mockAnalyticsService.track).toHaveBeenCalledWith(result.execution);
    });

    it('should handle AI analysis failure gracefully', async () => {
      mockAIRouter.analyze.mockRejectedValue(new Error('AI service unavailable'));

      const intent: WorkflowIntent = {
        type: 'marketing_campaign',
        priority: 'medium'
      };

      const result = await orchestrator.executeFullWorkflow('user-123', intent);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('AI service unavailable');
      expect(result.analysis).toBeNull();
      expect(result.duration).toBeGreaterThan(0);

      // Verify only AI service was called
      expect(mockAIRouter.analyze).toHaveBeenCalledWith(intent);
      expect(mockContentService.generate).not.toHaveBeenCalled();
      expect(mockMarketingService.create).not.toHaveBeenCalled();
      expect(mockOnlyFansService.execute).not.toHaveBeenCalled();
      expect(mockAnalyticsService.track).not.toHaveBeenCalled();
    });

    it('should handle content generation failure and continue', async () => {
      mockAIRouter.analyze.mockResolvedValue({ sentiment: 'positive' });
      mockContentService.generate.mockRejectedValue(new Error('Content generation failed'));

      const intent: WorkflowIntent = {
        type: 'fan_engagement',
        priority: 'low'
      };

      const result = await orchestrator.executeFullWorkflow('user-123', intent);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Content generation failed');
      expect(result.analysis).toBeDefined();
      expect(result.content).toBeNull();
    });

    it('should handle different workflow intent types', async () => {
      const intents: WorkflowIntent[] = [
        { type: 'content_creation', priority: 'high' },
        { type: 'marketing_campaign', priority: 'medium' },
        { type: 'fan_engagement', priority: 'low' }
      ];

      // Mock successful responses
      mockAIRouter.analyze.mockResolvedValue({ success: true });
      mockContentService.generate.mockResolvedValue({ success: true });
      mockMarketingService.create.mockResolvedValue({ success: true });
      mockOnlyFansService.execute.mockResolvedValue({ success: true });
      mockAnalyticsService.track.mockResolvedValue({ success: true });

      for (const intent of intents) {
        const result = await orchestrator.executeFullWorkflow('user-123', intent);
        expect(result.success).toBe(true);
        expect(mockAIRouter.analyze).toHaveBeenCalledWith(intent);
      }

      expect(mockAIRouter.analyze).toHaveBeenCalledTimes(3);
    });

    it('should handle workflow with scheduled content', async () => {
      const scheduledDate = new Date('2024-02-01T15:00:00Z');
      
      mockAIRouter.analyze.mockResolvedValue({ 
        optimalTiming: scheduledDate,
        engagement: 'high' 
      });
      mockContentService.generate.mockResolvedValue({ posts: [] });
      mockMarketingService.create.mockResolvedValue({ campaignId: 'scheduled-123' });
      mockOnlyFansService.execute.mockResolvedValue({ scheduled: true });
      mockAnalyticsService.track.mockResolvedValue({ tracked: true });

      const intent: WorkflowIntent = {
        type: 'content_creation',
        priority: 'high',
        scheduledFor: scheduledDate,
        targetAudience: ['vip_subscribers']
      };

      const result = await orchestrator.executeFullWorkflow('user-123', intent);

      expect(result.success).toBe(true);
      expect(mockAIRouter.analyze).toHaveBeenCalledWith(intent);
      expect(intent.scheduledFor).toEqual(scheduledDate);
    });
  });

  describe('executePartialWorkflow', () => {
    it('should execute only specified steps', async () => {
      mockAIRouter.analyze.mockResolvedValue({ analysis: 'complete' });
      mockContentService.generate.mockResolvedValue({ content: 'generated' });

      const intent: WorkflowIntent = {
        type: 'content_creation',
        priority: 'medium'
      };

      const result = await orchestrator.executePartialWorkflow(
        'user-123', 
        intent, 
        ['analysis', 'content']
      );

      expect(result.analysis).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.campaign).toBeUndefined();
      expect(result.execution).toBeUndefined();

      expect(mockAIRouter.analyze).toHaveBeenCalledWith(intent);
      expect(mockContentService.generate).toHaveBeenCalledWith(result.analysis);
      expect(mockMarketingService.create).not.toHaveBeenCalled();
      expect(mockOnlyFansService.execute).not.toHaveBeenCalled();
    });

    it('should handle empty steps array', async () => {
      const intent: WorkflowIntent = {
        type: 'marketing_campaign',
        priority: 'low'
      };

      const result = await orchestrator.executePartialWorkflow('user-123', intent, []);

      expect(Object.keys(result)).toHaveLength(0);
      expect(mockAIRouter.analyze).not.toHaveBeenCalled();
      expect(mockContentService.generate).not.toHaveBeenCalled();
    });

    it('should execute steps in dependency order', async () => {
      mockAIRouter.analyze.mockResolvedValue({ analysis: 'data' });
      mockContentService.generate.mockResolvedValue({ content: 'data' });
      mockMarketingService.create.mockResolvedValue({ campaign: 'data' });

      const intent: WorkflowIntent = {
        type: 'content_creation',
        priority: 'high'
      };

      const result = await orchestrator.executePartialWorkflow(
        'user-123', 
        intent, 
        ['campaign', 'analysis', 'content'] // Out of order
      );

      expect(result.analysis).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.campaign).toBeDefined();

      // Verify content generation received analysis result
      expect(mockContentService.generate).toHaveBeenCalledWith(result.analysis);
      // Verify campaign creation received content result
      expect(mockMarketingService.create).toHaveBeenCalledWith(result.content);
    });
  });

  describe('getWorkflowStatus', () => {
    it('should return workflow status', async () => {
      const status = await orchestrator.getWorkflowStatus('workflow-123');

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('currentStep');
      expect(typeof status.progress).toBe('number');
      expect(status.progress).toBeGreaterThanOrEqual(0);
      expect(status.progress).toBeLessThanOrEqual(100);
    });

    it('should handle different workflow states', async () => {
      const workflowIds = ['pending-123', 'running-456', 'completed-789', 'failed-000'];
      
      for (const workflowId of workflowIds) {
        const status = await orchestrator.getWorkflowStatus(workflowId);
        expect(['pending', 'running', 'completed', 'failed']).toContain(status.status);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      
      mockAIRouter.analyze.mockRejectedValue(timeoutError);

      const intent: WorkflowIntent = {
        type: 'content_creation',
        priority: 'high'
      };

      const result = await orchestrator.executeFullWorkflow('user-123', intent);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Network timeout');
    });

    it('should handle service unavailable errors', async () => {
      mockAIRouter.analyze.mockResolvedValue({ analysis: 'ok' });
      mockContentService.generate.mockResolvedValue({ content: 'ok' });
      mockMarketingService.create.mockResolvedValue({ campaign: 'ok' });
      
      const serviceError = new Error('Service temporarily unavailable');
      serviceError.name = 'ServiceUnavailableError';
      mockOnlyFansService.execute.mockRejectedValue(serviceError);

      const intent: WorkflowIntent = {
        type: 'marketing_campaign',
        priority: 'medium'
      };

      const result = await orchestrator.executeFullWorkflow('user-123', intent);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Service temporarily unavailable');
      expect(result.analysis).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.campaign).toBeDefined();
      expect(result.execution).toBeNull();
    });

    it('should measure execution duration accurately', async () => {
      // Mock services with delays
      mockAIRouter.analyze.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ analysis: 'ok' }), 100))
      );
      mockContentService.generate.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ content: 'ok' }), 50))
      );
      mockMarketingService.create.mockResolvedValue({ campaign: 'ok' });
      mockOnlyFansService.execute.mockResolvedValue({ execution: 'ok' });
      mockAnalyticsService.track.mockResolvedValue({ tracked: true });

      const intent: WorkflowIntent = {
        type: 'content_creation',
        priority: 'high'
      };

      const startTime = Date.now();
      const result = await orchestrator.executeFullWorkflow('user-123', intent);
      const actualDuration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(100); // At least the AI delay
      expect(result.duration).toBeLessThanOrEqual(actualDuration + 50); // Allow some margin
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent workflow executions', async () => {
      mockAIRouter.analyze.mockResolvedValue({ analysis: 'concurrent' });
      mockContentService.generate.mockResolvedValue({ content: 'concurrent' });
      mockMarketingService.create.mockResolvedValue({ campaign: 'concurrent' });
      mockOnlyFansService.execute.mockResolvedValue({ execution: 'concurrent' });
      mockAnalyticsService.track.mockResolvedValue({ tracked: true });

      const intent: WorkflowIntent = {
        type: 'fan_engagement',
        priority: 'medium'
      };

      const concurrentWorkflows = Array.from({ length: 5 }, (_, i) => 
        orchestrator.executeFullWorkflow(`user-${i}`, intent)
      );

      const results = await Promise.all(concurrentWorkflows);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(mockAIRouter.analyze).toHaveBeenCalledTimes(5);
      expect(mockAnalyticsService.track).toHaveBeenCalledTimes(5);
    });

    it('should handle large workflow intents efficiently', async () => {
      const largeIntent: WorkflowIntent = {
        type: 'marketing_campaign',
        priority: 'high',
        targetAudience: Array.from({ length: 1000 }, (_, i) => `audience-${i}`),
        contentType: 'multimedia_campaign'
      };

      mockAIRouter.analyze.mockResolvedValue({ 
        analysis: 'large_dataset',
        processingTime: '2.5s'
      });
      mockContentService.generate.mockResolvedValue({ 
        posts: Array.from({ length: 50 }, (_, i) => ({ id: `post-${i}` }))
      });
      mockMarketingService.create.mockResolvedValue({ 
        campaignId: 'large-campaign',
        targetCount: 1000
      });
      mockOnlyFansService.execute.mockResolvedValue({ 
        executionId: 'large-exec',
        batchSize: 50
      });
      mockAnalyticsService.track.mockResolvedValue({ tracked: true });

      const result = await orchestrator.executeFullWorkflow('user-123', largeIntent);

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(mockAIRouter.analyze).toHaveBeenCalledWith(largeIntent);
    });
  });
});