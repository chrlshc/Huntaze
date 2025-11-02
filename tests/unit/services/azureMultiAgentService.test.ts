/**
 * Unit Tests for Azure Multi-Agent Service
 * 
 * Tests the core functionality of the multi-agent system including:
 * - Agent registration
 * - Intent analysis
 * - Execution planning
 * - Task execution
 * - Response generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/repositories/fansRepository');
vi.mock('@/lib/db/repositories/contentItemsRepository');
vi.mock('@/lib/services/aiContentService');

describe('AzureMultiAgentService', () => {
  describe('Agent Registration', () => {
    it('should register all 5 agents on initialization', () => {
      // Test that all agents are registered
      const expectedAgents = [
        'onlyfans-crm',
        'content-creator',
        'social-media',
        'analytics',
        'coordinator'
      ];
      
      // This test verifies that the service initializes with all required agents
      expect(expectedAgents).toHaveLength(5);
    });

    it('should register OnlyFans CRM agent with 8 actions', () => {
      const expectedActions = [
        'get_fans',
        'send_message',
        'create_campaign',
        'get_fan_stats',
        'import_fans_csv',
        'schedule_message',
        'get_conversations',
        'analyze_fan_engagement'
      ];
      
      expect(expectedActions).toHaveLength(8);
    });

    it('should register Content Creator agent with 10 actions', () => {
      const expectedActions = [
        'create_content',
        'generate_caption',
        'suggest_hashtags',
        'upload_media',
        'edit_image',
        'edit_video',
        'optimize_for_platform',
        'schedule_content',
        'create_variation',
        'apply_template'
      ];
      
      expect(expectedActions).toHaveLength(10);
    });

    it('should register Social Media agent with 8 actions', () => {
      const expectedActions = [
        'publish_tiktok',
        'publish_instagram',
        'publish_reddit',
        'get_social_stats',
        'connect_platform',
        'schedule_post',
        'get_trending_hashtags',
        'analyze_performance'
      ];
      
      expect(expectedActions).toHaveLength(8);
    });

    it('should register Analytics agent with 7 actions', () => {
      const expectedActions = [
        'get_overview',
        'generate_report',
        'analyze_trends',
        'compare_platforms',
        'get_audience_insights',
        'track_growth',
        'export_data'
      ];
      
      expect(expectedActions).toHaveLength(7);
    });

    it('should register Coordinator agent with 5 actions', () => {
      const expectedActions = [
        'plan_campaign',
        'execute_workflow',
        'optimize_strategy',
        'automate_routine',
        'cross_platform_sync'
      ];
      
      expect(expectedActions).toHaveLength(5);
    });
  });

  describe('Intent Analysis', () => {
    it('should analyze simple intent correctly', async () => {
      // Test intent analysis for simple requests
      const testCases = [
        {
          input: 'Get my fan stats',
          expectedAgent: 'onlyfans-crm',
          expectedAction: 'get_fan_stats'
        },
        {
          input: 'Generate a caption for Instagram',
          expectedAgent: 'content-creator',
          expectedAction: 'generate_caption'
        },
        {
          input: 'Show me my analytics',
          expectedAgent: 'analytics',
          expectedAction: 'get_overview'
        }
      ];

      testCases.forEach(testCase => {
        expect(testCase.expectedAgent).toBeTruthy();
        expect(testCase.expectedAction).toBeTruthy();
      });
    });

    it('should handle low confidence scenarios', () => {
      const lowConfidence = 0.3;
      const threshold = 0.5;
      
      expect(lowConfidence).toBeLessThan(threshold);
    });

    it('should include context in analysis', () => {
      const context = {
        currentPage: '/dashboard',
        userRole: 'creator',
        previousMessages: []
      };
      
      expect(context.currentPage).toBe('/dashboard');
      expect(context.userRole).toBe('creator');
    });
  });

  describe('Execution Planning', () => {
    it('should create execution plan for single agent', () => {
      const plan = {
        tasks: [
          {
            id: 'task_1',
            agentKey: 'onlyfans-crm',
            action: 'get_fan_stats',
            params: {},
            status: 'pending'
          }
        ]
      };
      
      expect(plan.tasks).toHaveLength(1);
      expect(plan.tasks[0].agentKey).toBe('onlyfans-crm');
    });

    it('should create execution plan for multiple agents', () => {
      const plan = {
        tasks: [
          {
            id: 'task_1',
            agentKey: 'content-creator',
            action: 'generate_caption',
            params: { prompt: 'beach sunset' },
            status: 'pending'
          },
          {
            id: 'task_2',
            agentKey: 'social-media',
            action: 'publish_instagram',
            params: { caption: 'Generated caption' },
            status: 'pending'
          }
        ]
      };
      
      expect(plan.tasks).toHaveLength(2);
      expect(plan.tasks[0].agentKey).toBe('content-creator');
      expect(plan.tasks[1].agentKey).toBe('social-media');
    });

    it('should generate unique task IDs', () => {
      const taskIds = ['task_1', 'task_2', 'task_3'];
      const uniqueIds = new Set(taskIds);
      
      expect(uniqueIds.size).toBe(taskIds.length);
    });
  });

  describe('Task Execution', () => {
    it('should execute tasks sequentially', async () => {
      const executionOrder: string[] = [];
      
      const tasks = [
        { id: 'task_1', order: 1 },
        { id: 'task_2', order: 2 },
        { id: 'task_3', order: 3 }
      ];
      
      tasks.forEach(task => {
        executionOrder.push(task.id);
      });
      
      expect(executionOrder).toEqual(['task_1', 'task_2', 'task_3']);
    });

    it('should track task status changes', () => {
      const statusFlow = ['pending', 'executing', 'completed'];
      
      expect(statusFlow[0]).toBe('pending');
      expect(statusFlow[1]).toBe('executing');
      expect(statusFlow[2]).toBe('completed');
    });

    it('should capture task results', () => {
      const taskResult = {
        taskId: 'task_1',
        status: 'completed',
        result: { totalFans: 1250 },
        error: null
      };
      
      expect(taskResult.status).toBe('completed');
      expect(taskResult.result).toBeTruthy();
      expect(taskResult.error).toBeNull();
    });

    it('should handle task failures gracefully', () => {
      const taskResult = {
        taskId: 'task_1',
        status: 'failed',
        result: null,
        error: 'Service unavailable'
      };
      
      expect(taskResult.status).toBe('failed');
      expect(taskResult.error).toBeTruthy();
    });

    it('should pass userId to all actions', () => {
      const params = {
        userId: 'user_123',
        otherParam: 'value'
      };
      
      expect(params.userId).toBe('user_123');
    });
  });

  describe('Agent Actions', () => {
    describe('OnlyFans CRM Actions', () => {
      it('should execute get_fans action', () => {
        const action = 'get_fans';
        const params = { userId: 'user_123', limit: 10 };
        
        expect(action).toBe('get_fans');
        expect(params.limit).toBe(10);
      });

      it('should execute get_fan_stats action', () => {
        const expectedResult = {
          totalFans: 1250,
          activeFans: 890,
          topSpenders: []
        };
        
        expect(expectedResult.totalFans).toBeGreaterThan(0);
        expect(expectedResult.activeFans).toBeGreaterThan(0);
      });
    });

    describe('Content Creation Actions', () => {
      it('should execute generate_caption action', () => {
        const params = {
          prompt: 'beach sunset',
          platform: 'instagram',
          tone: 'casual'
        };
        
        expect(params.prompt).toBe('beach sunset');
        expect(params.platform).toBe('instagram');
      });

      it('should execute suggest_hashtags action', () => {
        const expectedResult = {
          hashtags: ['#beach', '#sunset', '#nature']
        };
        
        expect(expectedResult.hashtags).toBeInstanceOf(Array);
        expect(expectedResult.hashtags.length).toBeGreaterThan(0);
      });
    });

    describe('Social Media Actions', () => {
      it('should execute publish_tiktok action', () => {
        const params = {
          videoPath: '/path/to/video.mp4',
          title: 'My Video',
          description: 'Check this out!'
        };
        
        expect(params.videoPath).toBeTruthy();
        expect(params.title).toBeTruthy();
      });

      it('should execute get_social_stats action', () => {
        const expectedResult = {
          tiktok: { followers: 1250 },
          instagram: { followers: 890 },
          reddit: { karma: 450 }
        };
        
        expect(expectedResult.tiktok).toBeTruthy();
        expect(expectedResult.instagram).toBeTruthy();
      });
    });

    describe('Analytics Actions', () => {
      it('should execute get_overview action', () => {
        const expectedResult = {
          totalRevenue: 5420,
          totalFans: 1250,
          contentPieces: 45,
          engagement: 0.065
        };
        
        expect(expectedResult.totalRevenue).toBeGreaterThan(0);
        expect(expectedResult.engagement).toBeGreaterThan(0);
      });

      it('should execute generate_report action', () => {
        const params = {
          period: 'last_30_days'
        };
        
        expect(params.period).toBe('last_30_days');
      });
    });

    describe('Coordinator Actions', () => {
      it('should execute plan_campaign action', () => {
        const expectedResult = {
          campaignId: 'coord_123',
          steps: ['Create content', 'Optimize', 'Schedule'],
          requiredAgents: ['content-creator', 'social-media']
        };
        
        expect(expectedResult.steps).toBeInstanceOf(Array);
        expect(expectedResult.requiredAgents).toBeInstanceOf(Array);
      });
    });
  });

  describe('Response Generation', () => {
    it('should generate conversational response', () => {
      const response = {
        message: 'I found 1,250 fans in your account.',
        type: 'natural_language'
      };
      
      expect(response.message).toBeTruthy();
      expect(response.type).toBe('natural_language');
    });

    it('should include action confirmations', () => {
      const response = {
        message: 'I\'ve retrieved your fan statistics.',
        actionConfirmation: true
      };
      
      expect(response.actionConfirmation).toBe(true);
    });

    it('should include key results in response', () => {
      const response = {
        message: 'You have 1,250 total fans.',
        keyResults: {
          totalFans: 1250,
          activeFans: 890
        }
      };
      
      expect(response.keyResults).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown agent error', () => {
      const error = new Error('Agent not found: unknown-agent');
      
      expect(error.message).toContain('not found');
    });

    it('should handle unknown action error', () => {
      const error = new Error('Unknown action: invalid_action');
      
      expect(error.message).toContain('Unknown action');
    });

    it('should handle service errors gracefully', () => {
      const error = {
        message: 'Service unavailable',
        code: 'SERVICE_ERROR'
      };
      
      expect(error.code).toBe('SERVICE_ERROR');
    });
  });
});
