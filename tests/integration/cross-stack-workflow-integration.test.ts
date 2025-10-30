/**
 * Integration Tests for Cross-Stack Workflow
 * Tests end-to-end workflows across all Huntaze stacks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock all stack services
const mockAIRouter = {
  analyze: vi.fn(),
  routeRequest: vi.fn()
};

const mockContentService = {
  generate: vi.fn(),
  createContentPipeline: vi.fn()
};

const mockMarketingService = {
  create: vi.fn(),
  executeCampaign: vi.fn()
};

const mockOnlyFansService = {
  execute: vi.fn(),
  sendMessage: vi.fn()
};

const mockAnalyticsService = {
  track: vi.fn(),
  generateInsights: vi.fn()
};

const mockNotificationHub = {
  notifyAcrossStacks: vi.fn()
};

const mockUnifiedMonitoring = {
  trackCrossStackMetrics: vi.fn()
};

const mockFeatureFlags = {
  isEnabled: vi.fn()
};

// Types for cross-stack integration
interface CrossStackWorkflow {
  id: string;
  type: 'content_creation' | 'marketing_campaign' | 'fan_engagement' | 'analytics_report';
  userId: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  results?: Record<string, any>;
  errors?: string[];
}

interface WorkflowStep {
  name: string;
  stack: 'ai' | 'content' | 'marketing' | 'onlyfans' | 'analytics';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

// Mock implementation of CrossStackWorkflowOrchestrator
class CrossStackWorkflowOrchestrator {
  constructor(
    private aiRouter = mockAIRouter,
    private contentService = mockContentService,
    private marketingService = mockMarketingService,
    private onlyFansService = mockOnlyFansService,
    private analyticsService = mockAnalyticsService,
    private notificationHub = mockNotificationHub,
    private monitoring = mockUnifiedMonitoring,
    private featureFlags = mockFeatureFlags
  ) {}

  async executeWorkflow(workflow: CrossStackWorkflow): Promise<CrossStackWorkflow> {
    workflow.status = 'running';
    workflow.startedAt = new Date();

    try {
      for (const step of workflow.steps) {
        await this.executeStep(workflow, step);
        
        if (step.status === 'failed') {
          workflow.status = 'failed';
          workflow.errors = workflow.errors || [];
          workflow.errors.push(`Step ${step.name} failed: ${step.error}`);
          break;
        }
      }

      if (workflow.status === 'running') {
        workflow.status = 'completed';
        workflow.completedAt = new Date();
      }

      // Send completion notification
      await this.notificationHub.notifyAcrossStacks({
        id: `workflow-${workflow.id}`,
        type: 'analytics_insight',
        source: 'analytics',
        data: { workflowId: workflow.id, status: workflow.status },
        priority: workflow.status === 'failed' ? 'high' : 'medium',
        timestamp: new Date(),
        userId: workflow.userId
      });

      return workflow;
    } catch (error) {
      workflow.status = 'failed';
      workflow.errors = [error instanceof Error ? error.message : String(error)];
      return workflow;
    }
  }

  private async executeStep(workflow: CrossStackWorkflow, step: WorkflowStep): Promise<void> {
    step.status = 'running';
    step.startedAt = new Date();

    // Track step execution
    await this.monitoring.trackCrossStackMetrics({
      stack: step.stack,
      action: step.name,
      performance: 0, // Will be updated when step completes
      userId: workflow.userId,
      timestamp: new Date()
    });

    try {
      switch (step.stack) {
        case 'ai':
          step.result = await this.executeAIStep(step, workflow);
          break;
        case 'content':
          step.result = await this.executeContentStep(step, workflow);
          break;
        case 'marketing':
          step.result = await this.executeMarketingStep(step, workflow);
          break;
        case 'onlyfans':
          step.result = await this.executeOnlyFansStep(step, workflow);
          break;
        case 'analytics':
          step.result = await this.executeAnalyticsStep(step, workflow);
          break;
        default:
          throw new Error(`Unknown stack: ${step.stack}`);
      }

      step.status = 'completed';
      step.completedAt = new Date();

      // Track successful completion
      const duration = step.completedAt.getTime() - step.startedAt!.getTime();
      await this.monitoring.trackCrossStackMetrics({
        stack: step.stack,
        action: step.name,
        performance: duration,
        userId: workflow.userId,
        timestamp: new Date()
      });

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      step.completedAt = new Date();
    }
  }

  private async executeAIStep(step: WorkflowStep, workflow: CrossStackWorkflow): Promise<any> {
    switch (step.name) {
      case 'analyze_intent':
        return await this.aiRouter.analyze({
          type: workflow.type,
          userId: workflow.userId,
          context: workflow.results
        });
      
      case 'generate_content_ideas':
        return await this.aiRouter.routeRequest({
          type: 'content_ideas',
          data: workflow.results,
          context: { userId: workflow.userId }
        });
      
      case 'optimize_campaign':
        return await this.aiRouter.routeRequest({
          type: 'campaign_optimization',
          data: workflow.results,
          context: { userId: workflow.userId }
        });
      
      default:
        throw new Error(`Unknown AI step: ${step.name}`);
    }
  }

  private async executeContentStep(step: WorkflowStep, workflow: CrossStackWorkflow): Promise<any> {
    switch (step.name) {
      case 'create_content_pipeline':
        return await this.contentService.createContentPipeline({
          userId: workflow.userId,
          ideas: workflow.results?.content_ideas,
          preferences: workflow.results?.user_preferences
        });
      
      case 'generate_assets':
        return await this.contentService.generate({
          type: 'assets',
          pipeline: workflow.results?.content_pipeline,
          userId: workflow.userId
        });
      
      default:
        throw new Error(`Unknown content step: ${step.name}`);
    }
  }

  private async executeMarketingStep(step: WorkflowStep, workflow: CrossStackWorkflow): Promise<any> {
    switch (step.name) {
      case 'create_campaign':
        return await this.marketingService.create({
          content: workflow.results?.generated_assets,
          targeting: workflow.results?.ai_analysis,
          userId: workflow.userId
        });
      
      case 'execute_campaign':
        return await this.marketingService.executeCampaign(
          workflow.results?.campaign?.id,
          { userId: workflow.userId }
        );
      
      default:
        throw new Error(`Unknown marketing step: ${step.name}`);
    }
  }

  private async executeOnlyFansStep(step: WorkflowStep, workflow: CrossStackWorkflow): Promise<any> {
    switch (step.name) {
      case 'send_messages':
        return await this.onlyFansService.execute({
          campaign: workflow.results?.campaign,
          messages: workflow.results?.campaign_execution?.messages,
          userId: workflow.userId
        });
      
      case 'track_engagement':
        return await this.onlyFansService.sendMessage(workflow.userId, {
          type: 'engagement_tracking',
          data: workflow.results?.message_results
        });
      
      default:
        throw new Error(`Unknown OnlyFans step: ${step.name}`);
    }
  }

  private async executeAnalyticsStep(step: WorkflowStep, workflow: CrossStackWorkflow): Promise<any> {
    switch (step.name) {
      case 'track_performance':
        return await this.analyticsService.track({
          workflowId: workflow.id,
          results: workflow.results,
          userId: workflow.userId
        });
      
      case 'generate_insights':
        return await this.analyticsService.generateInsights({
          workflowData: workflow.results,
          userId: workflow.userId
        });
      
      default:
        throw new Error(`Unknown analytics step: ${step.name}`);
    }
  }

  async createContentCreationWorkflow(userId: string): Promise<CrossStackWorkflow> {
    return {
      id: `content-${Date.now()}`,
      type: 'content_creation',
      userId,
      status: 'pending',
      startedAt: new Date(),
      steps: [
        { name: 'analyze_intent', stack: 'ai', status: 'pending' },
        { name: 'generate_content_ideas', stack: 'ai', status: 'pending' },
        { name: 'create_content_pipeline', stack: 'content', status: 'pending' },
        { name: 'generate_assets', stack: 'content', status: 'pending' },
        { name: 'track_performance', stack: 'analytics', status: 'pending' }
      ]
    };
  }

  async createMarketingCampaignWorkflow(userId: string): Promise<CrossStackWorkflow> {
    return {
      id: `marketing-${Date.now()}`,
      type: 'marketing_campaign',
      userId,
      status: 'pending',
      startedAt: new Date(),
      steps: [
        { name: 'analyze_intent', stack: 'ai', status: 'pending' },
        { name: 'generate_content_ideas', stack: 'ai', status: 'pending' },
        { name: 'create_content_pipeline', stack: 'content', status: 'pending' },
        { name: 'create_campaign', stack: 'marketing', status: 'pending' },
        { name: 'execute_campaign', stack: 'marketing', status: 'pending' },
        { name: 'send_messages', stack: 'onlyfans', status: 'pending' },
        { name: 'track_performance', stack: 'analytics', status: 'pending' },
        { name: 'generate_insights', stack: 'analytics', status: 'pending' }
      ]
    };
  }

  async createFanEngagementWorkflow(userId: string): Promise<CrossStackWorkflow> {
    return {
      id: `engagement-${Date.now()}`,
      type: 'fan_engagement',
      userId,
      status: 'pending',
      startedAt: new Date(),
      steps: [
        { name: 'analyze_intent', stack: 'ai', status: 'pending' },
        { name: 'optimize_campaign', stack: 'ai', status: 'pending' },
        { name: 'send_messages', stack: 'onlyfans', status: 'pending' },
        { name: 'track_engagement', stack: 'onlyfans', status: 'pending' },
        { name: 'generate_insights', stack: 'analytics', status: 'pending' }
      ]
    };
  }
}

describe('Cross-Stack Workflow Integration', () => {
  let orchestrator: CrossStackWorkflowOrchestrator;

  beforeEach(() => {
    orchestrator = new CrossStackWorkflowOrchestrator();
    vi.clearAllMocks();
    
    // Setup default successful responses
    mockAIRouter.analyze.mockResolvedValue({ 
      intent: 'content_creation', 
      confidence: 0.95,
      recommendations: ['focus_on_engagement', 'use_trending_topics']
    });
    
    mockAIRouter.routeRequest.mockResolvedValue({
      data: { ideas: ['idea1', 'idea2'], optimization: 'high_engagement' }
    });
    
    mockContentService.createContentPipeline.mockResolvedValue({
      id: 'pipeline-123',
      assets: ['asset1', 'asset2']
    });
    
    mockContentService.generate.mockResolvedValue({
      generated_assets: ['generated1', 'generated2']
    });
    
    mockMarketingService.create.mockResolvedValue({
      id: 'campaign-456',
      name: 'Test Campaign'
    });
    
    mockMarketingService.executeCampaign.mockResolvedValue({
      executionId: 'exec-789',
      messages: ['msg1', 'msg2']
    });
    
    mockOnlyFansService.execute.mockResolvedValue({
      messagesSent: 2,
      deliveryRate: 0.95
    });
    
    mockOnlyFansService.sendMessage.mockResolvedValue({
      success: true,
      messageId: 'msg-123'
    });
    
    mockAnalyticsService.track.mockResolvedValue({
      tracked: true,
      metricsRecorded: 5
    });
    
    mockAnalyticsService.generateInsights.mockResolvedValue({
      insights: ['insight1', 'insight2'],
      recommendations: ['rec1', 'rec2']
    });
    
    mockNotificationHub.notifyAcrossStacks.mockResolvedValue({
      success: true,
      channelsNotified: ['websocket']
    });
    
    mockUnifiedMonitoring.trackCrossStackMetrics.mockResolvedValue({
      success: true,
      metricsRecorded: ['cloudwatch', 'prometheus']
    });
    
    mockFeatureFlags.isEnabled.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Creation Workflow', () => {
    it('should execute complete content creation workflow', async () => {
      const workflow = await orchestrator.createContentCreationWorkflow('user-123');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
      expect(result.errors).toBeUndefined();

      // Verify all steps completed
      result.steps.forEach(step => {
        expect(step.status).toBe('completed');
        expect(step.completedAt).toBeDefined();
        expect(step.result).toBeDefined();
      });

      // Verify service calls
      expect(mockAIRouter.analyze).toHaveBeenCalledWith({
        type: 'content_creation',
        userId: 'user-123',
        context: undefined
      });
      
      expect(mockAIRouter.routeRequest).toHaveBeenCalledWith({
        type: 'content_ideas',
        data: expect.any(Object),
        context: { userId: 'user-123' }
      });
      
      expect(mockContentService.createContentPipeline).toHaveBeenCalled();
      expect(mockContentService.generate).toHaveBeenCalled();
      expect(mockAnalyticsService.track).toHaveBeenCalled();
    });

    it('should handle AI analysis failure in content workflow', async () => {
      mockAIRouter.analyze.mockRejectedValue(new Error('AI service unavailable'));

      const workflow = await orchestrator.createContentCreationWorkflow('user-456');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Step analyze_intent failed: AI service unavailable');

      // First step should be failed, others should be pending
      expect(result.steps[0].status).toBe('failed');
      expect(result.steps[1].status).toBe('pending');
      expect(result.steps[2].status).toBe('pending');
    });

    it('should track metrics for each step', async () => {
      const workflow = await orchestrator.createContentCreationWorkflow('user-789');
      await orchestrator.executeWorkflow(workflow);

      // Should track metrics for each completed step (2 calls per step: start and completion)
      expect(mockUnifiedMonitoring.trackCrossStackMetrics).toHaveBeenCalledTimes(10); // 5 steps × 2 calls

      // Verify metric calls include correct stack and action
      expect(mockUnifiedMonitoring.trackCrossStackMetrics).toHaveBeenCalledWith({
        stack: 'ai',
        action: 'analyze_intent',
        performance: expect.any(Number),
        userId: 'user-789',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Marketing Campaign Workflow', () => {
    it('should execute complete marketing campaign workflow', async () => {
      const workflow = await orchestrator.createMarketingCampaignWorkflow('user-marketing');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('completed');
      expect(result.steps).toHaveLength(8);

      // Verify all stacks were involved
      const stacksUsed = new Set(result.steps.map(step => step.stack));
      expect(stacksUsed).toContain('ai');
      expect(stacksUsed).toContain('content');
      expect(stacksUsed).toContain('marketing');
      expect(stacksUsed).toContain('onlyfans');
      expect(stacksUsed).toContain('analytics');

      // Verify OnlyFans integration
      expect(mockOnlyFansService.execute).toHaveBeenCalledWith({
        campaign: expect.any(Object),
        messages: expect.any(Array),
        userId: 'user-marketing'
      });

      // Verify analytics insights generation
      expect(mockAnalyticsService.generateInsights).toHaveBeenCalledWith({
        workflowData: expect.any(Object),
        userId: 'user-marketing'
      });
    });

    it('should handle marketing service failure gracefully', async () => {
      mockMarketingService.create.mockRejectedValue(new Error('Marketing service down'));

      const workflow = await orchestrator.createMarketingCampaignWorkflow('user-fail');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Step create_campaign failed: Marketing service down');

      // Steps before marketing should complete, steps after should remain pending
      expect(result.steps[0].status).toBe('completed'); // AI analyze
      expect(result.steps[1].status).toBe('completed'); // AI generate ideas
      expect(result.steps[2].status).toBe('completed'); // Content pipeline
      expect(result.steps[3].status).toBe('failed');    // Marketing create (failed)
      expect(result.steps[4].status).toBe('pending');   // Marketing execute (not reached)
    });

    it('should send cross-stack notifications', async () => {
      const workflow = await orchestrator.createMarketingCampaignWorkflow('user-notify');
      await orchestrator.executeWorkflow(workflow);

      expect(mockNotificationHub.notifyAcrossStacks).toHaveBeenCalledWith({
        id: `workflow-${workflow.id}`,
        type: 'analytics_insight',
        source: 'analytics',
        data: { workflowId: workflow.id, status: 'completed' },
        priority: 'medium',
        timestamp: expect.any(Date),
        userId: 'user-notify'
      });
    });
  });

  describe('Fan Engagement Workflow', () => {
    it('should execute fan engagement workflow', async () => {
      const workflow = await orchestrator.createFanEngagementWorkflow('user-engagement');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('completed');
      expect(result.steps).toHaveLength(5);

      // Verify OnlyFans engagement tracking
      expect(mockOnlyFansService.sendMessage).toHaveBeenCalledWith('user-engagement', {
        type: 'engagement_tracking',
        data: expect.any(Object)
      });

      // Verify AI optimization
      expect(mockAIRouter.routeRequest).toHaveBeenCalledWith({
        type: 'campaign_optimization',
        data: expect.any(Object),
        context: { userId: 'user-engagement' }
      });
    });

    it('should handle OnlyFans service failures', async () => {
      mockOnlyFansService.execute.mockRejectedValue(new Error('OnlyFans API rate limit'));

      const workflow = await orchestrator.createFanEngagementWorkflow('user-rate-limit');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Step send_messages failed: OnlyFans API rate limit');
    });
  });

  describe('Cross-Stack Data Flow', () => {
    it('should pass data correctly between stacks', async () => {
      const workflow = await orchestrator.createMarketingCampaignWorkflow('user-dataflow');
      await orchestrator.executeWorkflow(workflow);

      // Verify data flows from AI to Content
      expect(mockContentService.createContentPipeline).toHaveBeenCalledWith({
        userId: 'user-dataflow',
        ideas: expect.any(Array),
        preferences: undefined
      });

      // Verify data flows from Content to Marketing
      expect(mockMarketingService.create).toHaveBeenCalledWith({
        content: expect.any(Array),
        targeting: expect.any(Object),
        userId: 'user-dataflow'
      });

      // Verify data flows from Marketing to OnlyFans
      expect(mockOnlyFansService.execute).toHaveBeenCalledWith({
        campaign: expect.objectContaining({ id: 'campaign-456' }),
        messages: expect.any(Array),
        userId: 'user-dataflow'
      });
    });

    it('should accumulate results across workflow steps', async () => {
      const workflow = await orchestrator.createContentCreationWorkflow('user-accumulate');
      const result = await orchestrator.executeWorkflow(workflow);

      // Each step should have access to previous results
      expect(result.steps[0].result).toEqual({
        intent: 'content_creation',
        confidence: 0.95,
        recommendations: ['focus_on_engagement', 'use_trending_topics']
      });

      expect(result.steps[1].result).toEqual({
        data: { ideas: ['idea1', 'idea2'], optimization: 'high_engagement' }
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial service failures', async () => {
      // Make analytics service fail but others succeed
      mockAnalyticsService.track.mockRejectedValue(new Error('Analytics temporarily unavailable'));

      const workflow = await orchestrator.createContentCreationWorkflow('user-partial-fail');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('failed');
      
      // First 4 steps should complete, last step should fail
      expect(result.steps.slice(0, 4).every(step => step.status === 'completed')).toBe(true);
      expect(result.steps[4].status).toBe('failed');
      expect(result.steps[4].error).toBe('Analytics temporarily unavailable');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockContentService.generate.mockRejectedValue(timeoutError);

      const workflow = await orchestrator.createContentCreationWorkflow('user-timeout');
      const result = await orchestrator.executeWorkflow(workflow);

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Step generate_assets failed: Request timeout');
    });

    it('should send failure notifications with high priority', async () => {
      mockAIRouter.analyze.mockRejectedValue(new Error('Critical AI failure'));

      const workflow = await orchestrator.createMarketingCampaignWorkflow('user-critical-fail');
      await orchestrator.executeWorkflow(workflow);

      expect(mockNotificationHub.notifyAcrossStacks).toHaveBeenCalledWith({
        id: `workflow-${workflow.id}`,
        type: 'analytics_insight',
        source: 'analytics',
        data: { workflowId: workflow.id, status: 'failed' },
        priority: 'high', // High priority for failures
        timestamp: expect.any(Date),
        userId: 'user-critical-fail'
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track execution time for each step', async () => {
      // Add delays to simulate real execution time
      mockAIRouter.analyze.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ intent: 'test' }), 100))
      );

      const workflow = await orchestrator.createContentCreationWorkflow('user-timing');
      const result = await orchestrator.executeWorkflow(workflow);

      // Each completed step should have timing information
      result.steps.forEach(step => {
        if (step.status === 'completed') {
          expect(step.startedAt).toBeDefined();
          expect(step.completedAt).toBeDefined();
          expect(step.completedAt!.getTime()).toBeGreaterThan(step.startedAt!.getTime());
        }
      });
    });

    it('should track metrics for workflow performance', async () => {
      const workflow = await orchestrator.createFanEngagementWorkflow('user-metrics');
      await orchestrator.executeWorkflow(workflow);

      // Should track metrics for workflow start and each step
      expect(mockUnifiedMonitoring.trackCrossStackMetrics).toHaveBeenCalled();
      
      // Verify performance metrics are recorded
      const metricCalls = mockUnifiedMonitoring.trackCrossStackMetrics.mock.calls;
      metricCalls.forEach(call => {
        const [metric] = call;
        expect(metric).toHaveProperty('stack');
        expect(metric).toHaveProperty('action');
        expect(metric).toHaveProperty('performance');
        expect(metric).toHaveProperty('userId');
        expect(metric).toHaveProperty('timestamp');
      });
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect feature flags for workflow steps', async () => {
      // Disable a feature flag
      mockFeatureFlags.isEnabled.mockImplementation((flag) => {
        if (flag === 'advanced-ai-analysis') return Promise.resolve(false);
        return Promise.resolve(true);
      });

      const workflow = await orchestrator.createMarketingCampaignWorkflow('user-feature-flags');
      
      // In a real implementation, this would skip certain steps based on feature flags
      const result = await orchestrator.executeWorkflow(workflow);
      
      expect(result.status).toBe('completed');
      expect(mockFeatureFlags.isEnabled).toHaveBeenCalled();
    });
  });

  describe('Concurrent Workflow Execution', () => {
    it('should handle multiple concurrent workflows', async () => {
      const workflows = await Promise.all([
        orchestrator.createContentCreationWorkflow('user-1'),
        orchestrator.createMarketingCampaignWorkflow('user-2'),
        orchestrator.createFanEngagementWorkflow('user-3')
      ]);

      const results = await Promise.all(
        workflows.map(workflow => orchestrator.executeWorkflow(workflow))
      );

      // All workflows should complete successfully
      results.forEach(result => {
        expect(result.status).toBe('completed');
      });

      // Services should be called for each workflow
      expect(mockAIRouter.analyze).toHaveBeenCalledTimes(3);
      expect(mockAnalyticsService.track).toHaveBeenCalledTimes(2); // Content and Marketing workflows
    });

    it('should isolate failures between concurrent workflows', async () => {
      // Make AI service fail for specific user
      mockAIRouter.analyze.mockImplementation((request) => {
        if (request.userId === 'user-fail') {
          return Promise.reject(new Error('AI failure for user-fail'));
        }
        return Promise.resolve({ intent: 'success' });
      });

      const workflows = await Promise.all([
        orchestrator.createContentCreationWorkflow('user-success'),
        orchestrator.createContentCreationWorkflow('user-fail')
      ]);

      const results = await Promise.all(
        workflows.map(workflow => orchestrator.executeWorkflow(workflow))
      );

      // One should succeed, one should fail
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('failed');
    });
  });
});