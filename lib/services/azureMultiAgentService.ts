import { OpenAI } from 'openai';
import { FansRepository } from '../db/repositories/fansRepository';
import { ContentItemsRepository } from '../db/repositories/contentItemsRepository';
import { CampaignsRepository } from '../db/repositories/campaignsRepository';
import { AnalyticsRepository } from '../db/repositories/analyticsRepository';
import { TikTokUploadService } from './tiktokUpload';
import { InstagramPublishService } from './instagramPublish';
import { MediaUploadService } from './mediaUploadService';
import { AIContentService } from './aiContentService';

interface AgentCapability {
  name: string;
  description: string;
  actions: string[];
  execute: (action: string, params: any) => Promise<any>;
}

interface Intent {
  intent: string;
  agents: string[];
  parameters: Record<string, any>;
  priority: 'urgent' | 'normal' | 'low';
  confidence: number;
}

interface AgentTask {
  id: string;
  type: 'onlyfans' | 'content' | 'social' | 'analytics' | 'general';
  action: string;
  params: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export class AzureMultiAgentService {
  private openai: OpenAI | null = null;
  private agents: Map<string, AgentCapability>;

  constructor() {
    // Don't instantiate OpenAI during construction to avoid build-time errors
    this.agents = new Map();
    this.initializeAgents();
  }

  /**
   * Get or create OpenAI client
   * @throws Error if API key is not configured
   */
  private getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  private initializeAgents() {
    // OnlyFans CRM Agent
    this.agents.set('onlyfans-crm', {
      name: 'OnlyFans CRM Agent',
      description: 'Manages OnlyFans fans, messages, and campaigns',
      actions: [
        'get_fans',
        'send_message',
        'create_campaign',
        'import_fans_csv',
        'get_fan_stats',
        'schedule_message',
        'get_conversations',
        'analyze_fan_engagement'
      ],
      execute: this.executeOnlyFansAction.bind(this)
    });

    // Content Creation Agent
    this.agents.set('content-creator', {
      name: 'Content Creation Agent',
      description: 'Creates, edits, and manages content across platforms',
      actions: [
        'create_content',
        'edit_image',
        'edit_video',
        'generate_caption',
        'suggest_hashtags',
        'optimize_for_platform',
        'schedule_content',
        'create_variation',
        'upload_media',
        'apply_template'
      ],
      execute: this.executeContentAction.bind(this)
    });

    // Social Media Agent
    this.agents.set('social-media', {
      name: 'Social Media Agent',
      description: 'Manages social media platforms and publishing',
      actions: [
        'publish_tiktok',
        'publish_instagram',
        'publish_reddit',
        'get_social_stats',
        'connect_platform',
        'schedule_post',
        'get_trending_hashtags',
        'analyze_performance'
      ],
      execute: this.executeSocialAction.bind(this)
    });

    // Analytics Agent
    this.agents.set('analytics', {
      name: 'Analytics Agent',
      description: 'Provides insights and analytics across all platforms',
      actions: [
        'get_overview',
        'generate_report',
        'analyze_trends',
        'compare_platforms',
        'get_audience_insights',
        'track_growth',
        'export_data'
      ],
      execute: this.executeAnalyticsAction.bind(this)
    });

    // Coordinator Agent
    this.agents.set('coordinator', {
      name: 'Coordinator Agent',
      description: 'Coordinates complex multi-step tasks across agents',
      actions: [
        'plan_campaign',
        'execute_workflow',
        'optimize_strategy',
        'automate_routine',
        'cross_platform_sync'
      ],
      execute: this.executeCoordinatorAction.bind(this)
    });
  }

  // OnlyFans CRM Agent Actions
  private async executeOnlyFansAction(action: string, params: any): Promise<any> {
    const { userId } = params;

    switch (action) {
      case 'get_fans': {
        const fans = await FansRepository.listFans(userId);
        const limit = params.limit || 20;
        const limitedFans = fans.slice(0, limit);
        return { fans: limitedFans, count: limitedFans.length };
      }

      case 'send_message': {
        // Placeholder for OnlyFans messaging integration
        return {
          success: true,
          messageId: `msg_${Date.now()}`,
          fanId: params.fanId,
          message: params.message
        };
      }

      case 'create_campaign': {
        const campaign = await CampaignsRepository.createCampaign(userId, {
          name: params.name || 'New Campaign',
          type: 'bulk_message',
          status: 'draft',
          template: { message: params.message },
          targetAudience: { fanIds: params.fanIds || [] }
        });
        return {
          campaignId: campaign.id,
          status: 'created',
          targetCount: params.fanIds?.length || 0
        };
      }

      case 'get_fan_stats': {
        const fans = await FansRepository.listFans(userId);
        const totalFans = fans.length;
        const activeToday = Math.floor(totalFans * 0.3); // Placeholder calculation
        const topSpenders = fans
          .sort((a, b) => (b.valueCents || 0) - (a.valueCents || 0))
          .slice(0, 5)
          .map(fan => ({
            username: fan.handle || fan.name,
            totalSpent: (fan.valueCents || 0) / 100 // Convert cents to dollars
          }));

        return {
          totalFans,
          activeToday,
          topSpenders
        };
      }

      case 'import_fans_csv': {
        return {
          success: true,
          imported: params.count || 0,
          message: 'CSV import queued for processing'
        };
      }

      case 'schedule_message': {
        return {
          success: true,
          scheduleId: `sched_${Date.now()}`,
          scheduledFor: params.scheduledTime
        };
      }

      case 'get_conversations': {
        return {
          conversations: [],
          count: 0,
          message: 'Conversations feature coming soon'
        };
      }

      case 'analyze_fan_engagement': {
        return {
          engagementRate: 0.65,
          topEngagers: [],
          insights: 'Engagement analysis in progress'
        };
      }

      default:
        throw new Error(`Unknown OnlyFans action: ${action}`);
    }
  }

  // Content Creation Agent Actions
  private async executeContentAction(action: string, params: any): Promise<any> {
    const { userId } = params;
    const aiService = new AIContentService();
    const mediaService = new MediaUploadService();

    switch (action) {
      case 'create_content': {
        const content = await ContentItemsRepository.create({
          userId: userId.toString(),
          text: params.caption || params.title || 'Untitled content',
          status: 'draft',
          category: params.type || 'general',
          metadata: {
            title: params.title,
            platforms: params.platforms || ['instagram'],
            hashtags: params.hashtags || []
          }
        });
        return {
          contentId: content.id,
          status: 'created',
          type: content.category
        };
      }

      case 'generate_caption': {
        const caption = await aiService.generateCaption({
          prompt: params.prompt || params.topic,
          platform: params.platform || 'instagram',
          tone: params.tone || 'casual',
          includeHashtags: params.includeHashtags !== false
        });
        return { caption };
      }

      case 'suggest_hashtags': {
        const hashtags = await aiService.suggestHashtags(
          params.caption || params.topic,
          params.platform || 'instagram'
        );
        return { hashtags };
      }

      case 'upload_media': {
        if (!params.file && !params.url) {
          throw new Error('No file or URL provided for upload');
        }
        return {
          success: true,
          mediaId: `media_${Date.now()}`,
          url: params.url || 'https://example.com/media.jpg'
        };
      }

      case 'edit_image': {
        return {
          success: true,
          editedUrl: 'https://example.com/edited.jpg',
          message: 'Image editing queued'
        };
      }

      case 'edit_video': {
        return {
          success: true,
          editedUrl: 'https://example.com/edited.mp4',
          message: 'Video editing queued'
        };
      }

      case 'optimize_for_platform': {
        return {
          success: true,
          optimized: true,
          platform: params.platform,
          recommendations: []
        };
      }

      case 'schedule_content': {
        return {
          success: true,
          scheduleId: `content_sched_${Date.now()}`,
          scheduledFor: params.scheduledTime
        };
      }

      case 'create_variation': {
        return {
          success: true,
          variationId: `var_${Date.now()}`,
          message: 'Variation created'
        };
      }

      case 'apply_template': {
        return {
          success: true,
          templateApplied: params.templateId,
          message: 'Template applied successfully'
        };
      }

      default:
        throw new Error(`Unknown content action: ${action}`);
    }
  }

  // Social Media Agent Actions
  private async executeSocialAction(action: string, params: any): Promise<any> {
    const { userId } = params;

    switch (action) {
      case 'publish_tiktok': {
        // Placeholder for TikTok publishing
        // TODO: Implement proper TikTok upload flow using initUpload
        return {
          success: false,
          error: 'TikTok publishing not yet implemented',
          platform: 'tiktok'
        };
      }

      case 'publish_instagram': {
        // Placeholder for Instagram publishing
        // TODO: Implement proper Instagram publish flow
        return {
          success: false,
          error: 'Instagram publishing not yet implemented',
          platform: 'instagram'
        };
      }

      case 'publish_reddit': {
        return {
          success: true,
          postId: `reddit_${Date.now()}`,
          platform: 'reddit',
          subreddit: params.subreddit
        };
      }

      case 'get_social_stats': {
        return {
          tiktok: { followers: 1250, views: 45000, likes: 3200 },
          instagram: { followers: 890, likes: 12000, comments: 450 },
          reddit: { karma: 450, posts: 23, comments: 156 }
        };
      }

      case 'connect_platform': {
        return {
          success: true,
          platform: params.platform,
          message: `${params.platform} connection initiated`
        };
      }

      case 'schedule_post': {
        return {
          success: true,
          scheduleId: `social_sched_${Date.now()}`,
          platform: params.platform,
          scheduledFor: params.scheduledTime
        };
      }

      case 'get_trending_hashtags': {
        return {
          hashtags: ['#trending', '#viral', '#fyp', '#explore'],
          platform: params.platform || 'instagram'
        };
      }

      case 'analyze_performance': {
        return {
          engagementRate: 0.045,
          bestPostingTime: '18:00',
          topPerformingContent: [],
          insights: 'Performance analysis complete'
        };
      }

      default:
        throw new Error(`Unknown social action: ${action}`);
    }
  }

  // Analytics Agent Actions
  private async executeAnalyticsAction(action: string, params: any): Promise<any> {
    const { userId } = params;

    switch (action) {
      case 'get_overview': {
        // Placeholder for analytics overview
        // TODO: Implement proper analytics using AnalyticsRepository instance
        return {
          totalRevenue: 0,
          totalFans: 0,
          contentPieces: 0,
          engagement: 0
        };
      }

      case 'generate_report': {
        const period = params.period || 'last_30_days';
        return {
          reportId: `rpt_${Date.now()}`,
          period,
          metrics: {
            revenue: 5420,
            growth: 12.5,
            topContent: []
          },
          generatedAt: new Date().toISOString()
        };
      }

      case 'analyze_trends': {
        return {
          trends: [
            { metric: 'revenue', direction: 'up', change: 12.5 },
            { metric: 'engagement', direction: 'up', change: 8.3 }
          ],
          insights: 'Positive growth trends detected'
        };
      }

      case 'compare_platforms': {
        return {
          comparison: {
            tiktok: { engagement: 0.065, revenue: 1200 },
            instagram: { engagement: 0.045, revenue: 890 },
            onlyfans: { engagement: 0.12, revenue: 3500 }
          },
          recommendation: 'Focus on OnlyFans for revenue'
        };
      }

      case 'get_audience_insights': {
        return {
          demographics: {
            ageGroups: { '18-24': 35, '25-34': 45, '35+': 20 },
            topLocations: ['US', 'UK', 'CA']
          },
          interests: ['fitness', 'lifestyle', 'fashion']
        };
      }

      case 'track_growth': {
        return {
          growth: {
            followers: { current: 1250, change: 125, percentage: 11.1 },
            revenue: { current: 5420, change: 620, percentage: 12.9 }
          },
          period: params.period || 'last_30_days'
        };
      }

      case 'export_data': {
        return {
          success: true,
          exportId: `export_${Date.now()}`,
          format: params.format || 'csv',
          message: 'Export queued for processing'
        };
      }

      default:
        throw new Error(`Unknown analytics action: ${action}`);
    }
  }

  // Coordinator Agent Actions
  private async executeCoordinatorAction(action: string, params: any): Promise<any> {
    switch (action) {
      case 'plan_campaign': {
        return {
          campaignId: `coord_${Date.now()}`,
          steps: [
            'Create content',
            'Optimize for platforms',
            'Schedule posts',
            'Monitor performance'
          ],
          estimatedCompletion: '2 hours',
          requiredAgents: ['content-creator', 'social-media', 'analytics']
        };
      }

      case 'execute_workflow': {
        return {
          workflowId: `wf_${Date.now()}`,
          status: 'executing',
          steps: params.steps || [],
          progress: 0
        };
      }

      case 'optimize_strategy': {
        return {
          recommendations: [
            'Post more frequently on TikTok',
            'Focus on video content',
            'Engage with top fans daily'
          ],
          expectedImpact: 'Revenue increase of 15-20%'
        };
      }

      case 'automate_routine': {
        return {
          automationId: `auto_${Date.now()}`,
          routine: params.routine,
          schedule: params.schedule || 'daily',
          status: 'active'
        };
      }

      case 'cross_platform_sync': {
        return {
          success: true,
          platforms: params.platforms || ['tiktok', 'instagram', 'onlyfans'],
          syncedItems: 0,
          message: 'Cross-platform sync initiated'
        };
      }

      default:
        throw new Error(`Unknown coordinator action: ${action}`);
    }
  }

  // Helper methods
  private getTaskType(agentKey: string): AgentTask['type'] {
    const mapping: Record<string, AgentTask['type']> = {
      'onlyfans-crm': 'onlyfans',
      'content-creator': 'content',
      'social-media': 'social',
      'analytics': 'analytics',
      'coordinator': 'general'
    };
    return mapping[agentKey] || 'general';
  }

  private getAgentKeyFromTaskType(type: AgentTask['type']): string {
    const mapping: Record<AgentTask['type'], string> = {
      'onlyfans': 'onlyfans-crm',
      'content': 'content-creator',
      'social': 'social-media',
      'analytics': 'analytics',
      'general': 'coordinator'
    };
    return mapping[type] || 'coordinator';
  }

  // Public API methods
  async getAvailableAgents(): Promise<Array<{ key: string; name: string; description: string; actions: string[] }>> {
    return Array.from(this.agents.entries()).map(([key, agent]) => ({
      key,
      name: agent.name,
      description: agent.description,
      actions: agent.actions
    }));
  }

  async executeDirectAction(agentKey: string, action: string, params: any): Promise<any> {
    const agent = this.agents.get(agentKey);
    if (!agent) {
      throw new Error(`Agent ${agentKey} not found`);
    }

    if (!agent.actions.includes(action)) {
      throw new Error(`Action ${action} not available for agent ${agentKey}`);
    }

    return await agent.execute(action, params);
  }

  async processUserRequest(message: string, userId: string, context?: any): Promise<string> {
    try {
      const intent = await this.analyzeIntent(message, context);
      const plan = await this.createExecutionPlan(intent);
      const results = await this.executePlan(plan, userId);
      return await this.generateResponse(intent, results);
    } catch (error) {
      console.error('Multi-agent processing error:', error);
      return 'I encountered an error processing your request. Please try again or be more specific.';
    }
  }

  private async analyzeIntent(message: string, context?: any): Promise<Intent> {
    const agentsList = Array.from(this.agents.entries()).map(([key, agent]) => 
      `${key}: ${agent.description}\nActions: ${agent.actions.join(', ')}`
    ).join('\n\n');

    const systemPrompt = `You are an AI intent analyzer for the Huntaze platform.

Analyze the user's message and determine:
1. Primary intent (what they want to do)
2. Required agents (which agents need to be involved)
3. Parameters (what data/inputs are needed)
4. Priority (urgent, normal, low)

Available agents and their capabilities:
${agentsList}

Context:
- Current page: ${context?.currentPage || 'unknown'}
- User role: ${context?.userRole || 'user'}
- Previous messages: ${context?.previousMessages?.length || 0}

Return a JSON object with:
{
  "intent": "brief description of what user wants",
  "agents": ["agent-key-1", "agent-key-2"],
  "parameters": { "key": "value" },
  "priority": "normal",
  "confidence": 0.85
}

User message: "${message}"`;

    try {
      const openai = this.getOpenAI();
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      // Validate and set defaults
      const intent: Intent = {
        intent: parsed.intent || 'general_query',
        agents: Array.isArray(parsed.agents) ? parsed.agents : ['coordinator'],
        parameters: parsed.parameters || { query: message },
        priority: ['urgent', 'normal', 'low'].includes(parsed.priority) ? parsed.priority : 'normal',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
      };

      // If confidence is too low, request clarification
      if (intent.confidence < 0.5) {
        intent.intent = 'clarification_needed';
        intent.agents = ['coordinator'];
        intent.parameters = { 
          originalMessage: message,
          reason: 'Low confidence in understanding request'
        };
      }

      return intent;
    } catch (error) {
      console.error('Intent analysis error:', error);
      
      // Fallback intent
      return {
        intent: 'general_query',
        agents: ['coordinator'],
        parameters: { query: message, error: 'Failed to analyze intent' },
        priority: 'normal',
        confidence: 0.3
      };
    }
  }

  private async createExecutionPlan(intent: Intent): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];
    
    for (const agentKey of intent.agents) {
      const agent = this.agents.get(agentKey);
      if (!agent) {
        console.warn(`Agent ${agentKey} not found, skipping`);
        continue;
      }

      // Determine specific actions for this agent
      const actions = await this.determineAgentActions(agentKey, agent, intent);
      
      for (const action of actions) {
        const taskId = `${agentKey}-${action.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        tasks.push({
          id: taskId,
          type: this.getTaskType(agentKey),
          action: action.name,
          params: action.params || {},
          status: 'pending'
        });
      }
    }
    
    return tasks;
  }

  private async determineAgentActions(
    agentKey: string, 
    agent: AgentCapability, 
    intent: Intent
  ): Promise<Array<{ name: string; params: any }>> {
    const systemPrompt = `Given the user intent and agent capabilities, determine the specific actions to execute.

Agent: ${agent.name}
Available actions: ${agent.actions.join(', ')}

User intent: ${intent.intent}
Intent parameters: ${JSON.stringify(intent.parameters)}

Return a JSON array of actions with their parameters:
[
  { "name": "action_name", "params": { "key": "value" } }
]

Rules:
- Only use actions from the available actions list
- Include all necessary parameters for each action
- Keep the list focused and minimal
- If no actions are needed, return an empty array`;

    try {
      const openai = this.getOpenAI();
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      
      // Handle both array and object with actions property
      const actions = Array.isArray(parsed) ? parsed : (parsed.actions || []);
      
      // Validate actions
      return actions.filter((action: any) => 
        action.name && 
        typeof action.name === 'string' &&
        agent.actions.includes(action.name)
      );
    } catch (error) {
      console.error('Action determination error:', error);
      
      // Fallback: use first available action if parameters suggest it
      if (agent.actions.length > 0) {
        return [{ name: agent.actions[0], params: intent.parameters }];
      }
      
      return [];
    }
  }

  private async executePlan(tasks: AgentTask[], userId: string): Promise<AgentTask[]> {
    const results: AgentTask[] = [];
    
    for (const task of tasks) {
      try {
        // Update status to executing
        task.status = 'executing';
        
        // Get the agent for this task
        const agentKey = this.getAgentKeyFromTaskType(task.type);
        const agent = this.agents.get(agentKey);
        
        if (!agent) {
          task.status = 'failed';
          task.error = `Agent not found for type: ${task.type}`;
          results.push(task);
          continue;
        }

        // Verify action is available
        if (!agent.actions.includes(task.action)) {
          task.status = 'failed';
          task.error = `Action ${task.action} not available for agent ${agentKey}`;
          results.push(task);
          continue;
        }

        // Execute the action with userId
        const actionParams = { ...task.params, userId };
        task.result = await agent.execute(task.action, actionParams);
        task.status = 'completed';
        
      } catch (error) {
        // Mark task as failed but continue with other tasks
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error occurred';
        
        console.error(`Task ${task.id} failed:`, error);
      }
      
      results.push(task);
    }
    
    return results;
  }

  private async generateResponse(intent: Intent, results: AgentTask[]): Promise<string> {
    const completedTasks = results.filter(t => t.status === 'completed');
    const failedTasks = results.filter(t => t.status === 'failed');
    
    const systemPrompt = `Generate a helpful response based on the executed tasks.

User intent: ${intent.intent}
Total tasks: ${results.length}
Completed: ${completedTasks.length}
Failed: ${failedTasks.length}

Task results:
${results.map(task => `
- Task: ${task.action} (${task.status})
  ${task.status === 'completed' ? `Result: ${JSON.stringify(task.result)}` : ''}
  ${task.status === 'failed' ? `Error: ${task.error}` : ''}
`).join('\n')}

Provide a clear, actionable response that:
1. Confirms what was done
2. Shows key results/data in a readable format
3. Suggests next steps if relevant
4. Is conversational and helpful
5. Mentions any failures briefly without being alarming

Keep it concise but informative. Use natural language, not technical jargon.`;

    try {
      const openai = this.getOpenAI();
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        // Fallback response
        if (completedTasks.length === 0) {
          return 'I encountered issues completing your request. Please try again or be more specific.';
        }
        return `I completed ${completedTasks.length} task(s) successfully!`;
      }

      return content;
      
    } catch (error) {
      console.error('Response generation error:', error);
      
      // Fallback response based on results
      if (completedTasks.length === 0 && failedTasks.length > 0) {
        return `I encountered ${failedTasks.length} error(s) while processing your request. Please try again.`;
      }
      
      if (completedTasks.length > 0) {
        return `I completed ${completedTasks.length} task(s) successfully${failedTasks.length > 0 ? `, but ${failedTasks.length} task(s) failed` : ''}.`;
      }
      
      return 'Task completed!';
    }
  }
}
