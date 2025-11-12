import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getPool } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * POST /api/onboarding/wizard
 * 
 * Processes wizard completion and activates services based on selections.
 * Implements the spec from docs/SETUP_WIZARD_GUIDE.md
 * 
 * @route POST /api/onboarding/wizard
 * @access Authenticated users only
 * @ratelimit 10 requests per minute per user
 * 
 * Request Body:
 * {
 *   platform: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'other',
 *   primary_goal: 'grow' | 'automate' | 'content' | 'all',
 *   ai_tone?: 'playful' | 'professional' | 'casual' | 'seductive',
 *   follower_range?: string,
 *   time_to_complete?: number,
 *   questions_skipped?: number[]
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   user_id: string,
 *   services_enabled: string[],
 *   templates_loaded: string[],
 *   dashboard_config: object,
 *   ai_config: object,
 *   correlationId: string
 * }
 * 
 * Error Responses:
 * - 400: Invalid request body or missing required fields
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */

// Zod schema for request validation
const WizardPayloadSchema = z.object({
  platform: z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit', 'other']),
  primary_goal: z.enum(['grow', 'automate', 'content', 'all']),
  ai_tone: z.enum(['playful', 'professional', 'casual', 'seductive']).optional(),
  follower_range: z.string().optional(),
  time_to_complete: z.number().min(0).optional(),
  questions_skipped: z.array(z.number()).optional()
});

type WizardPayload = z.infer<typeof WizardPayloadSchema>;

// Response types
interface DashboardConfig {
  primary_metrics: string[];
  quick_actions: string[];
}

interface AIConfig {
  system_prompt: string;
  tone: string;
  emoji_frequency: 'none' | 'low' | 'medium' | 'high';
  response_length: 'short' | 'medium' | 'long';
  creativity_level: 'low' | 'medium' | 'high';
}

interface ServiceConfig {
  services_enabled: string[];
  templates_loaded: string[];
  dashboard_config: DashboardConfig;
  ai_config: AIConfig;
}

interface WizardResponse extends ServiceConfig {
  success: boolean;
  user_id: string;
  correlationId: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  correlationId: string;
}

/**
 * Generate service configuration based on platform selection
 */
function getServicesForPlatform(platform: string): string[] {
  const serviceMap: Record<string, string[]> = {
    onlyfans: [
      'onlyfans_scraper',
      'auto_dm_engine',
      'ppv_detector',
      'proxy_rotation',
      'rate_limiter'
    ],
    instagram: [
      'hashtag_analyzer',
      'engagement_predictor',
      'reel_formatter',
      'story_optimizer'
    ],
    tiktok: [
      'trend_detector',
      'sound_library',
      'clip_converter',
      'viral_analyzer'
    ],
    reddit: [
      'reddit_api_client',
      'subreddit_classifier',
      'karma_optimizer',
      'post_scheduler'
    ],
    other: ['basic_analytics']
  };
  
  return serviceMap[platform] || serviceMap.other;
}

/**
 * Generate template configuration based on platform and goal
 */
function getTemplatesForPlatform(platform: string, goal: string): string[] {
  const platformTemplates: Record<string, string[]> = {
    onlyfans: ['dm_auto_response', 'ppv_promo', 'subscriber_welcome'],
    instagram: ['dm_template', 'hashtag_template', 'engagement_template'],
    tiktok: ['caption_template', 'trend_template', 'viral_template'],
    reddit: ['post_template', 'comment_template'],
    other: []
  };
  
  const baseTemplates = platformTemplates[platform] || [];
  
  // Add goal-specific templates
  if (goal === 'automate' || goal === 'all') {
    baseTemplates.push('auto_scheduler', 'response_tracker');
  }
  
  return baseTemplates;
}

/**
 * Generate dashboard configuration based on goal
 */
function getDashboardConfig(goal: string): DashboardConfig {
  const configs: Record<string, DashboardConfig> = {
    grow: {
      primary_metrics: ['new_followers', 'engagement_rate', 'growth_forecast'],
      quick_actions: ['view_analytics', 'get_recommendations', 'track_followers']
    },
    automate: {
      primary_metrics: ['unread_messages', 'messages_sent', 'response_rate'],
      quick_actions: ['activate_auto_dm', 'view_templates', 'schedule_messages']
    },
    content: {
      primary_metrics: ['todays_ideas', 'trending_topics', 'idea_library_size'],
      quick_actions: ['generate_ideas', 'view_trends', 'save_to_library']
    },
    all: {
      primary_metrics: ['followers', 'messages', 'content_ideas', 'engagement'],
      quick_actions: ['unified_dashboard', 'quick_actions', 'all_features']
    }
  };
  
  return configs[goal] || configs.all;
}

/**
 * Generate AI system prompt based on platform and tone
 */
function generateSystemPrompt(platform: string, tone: string): string {
  const toneDescriptions: Record<string, string> = {
    playful: 'Use casual language with suggestive undertones where appropriate; allow succinct emoji use; keep replies short.',
    professional: 'Use formal, clear, data-driven language; no emojis; concise responses.',
    casual: 'Friendly and conversational; minimal emojis; concise.',
    seductive: 'Warm, flirty tone with emotional engagement; concise and respectful.'
  };
  
  const platformContext: Record<string, string> = {
    onlyfans: 'Professional, helpful assistant for OnlyFans creators. Understand DM automation and PPV mechanics.',
    instagram: 'Expert assistant for Instagram creators. Understand hashtags, Reels, and engagement strategies.',
    tiktok: 'Creative assistant for TikTok creators. Understand trends, sounds, and viral content.',
    reddit: 'Strategic assistant for Reddit creators. Understand subreddits, karma, and community engagement.',
    other: 'Helpful assistant for content creators. Adaptable to various platforms.'
  };
  
  const context = platformContext[platform] || platformContext.other;
  const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;
  
  return `${context} ${toneDesc}`;
}

/**
 * Get AI configuration based on tone
 */
function getAIConfig(platform: string, tone: string): AIConfig {
  const emojiFrequency: Record<string, 'none' | 'low' | 'medium' | 'high'> = {
    playful: 'high',
    professional: 'none',
    casual: 'low',
    seductive: 'medium'
  };
  
  const creativityLevel: Record<string, 'low' | 'medium' | 'high'> = {
    onlyfans: 'medium',
    instagram: 'high',
    tiktok: 'high',
    reddit: 'medium',
    other: 'medium'
  };
  
  return {
    system_prompt: generateSystemPrompt(platform, tone),
    tone,
    emoji_frequency: emojiFrequency[tone] || 'low',
    response_length: 'medium' as const,
    creativity_level: creativityLevel[platform] || 'medium'
  };
}

/**
 * Structured logging helper
 */
function logInfo(context: string, metadata?: Record<string, any>) {
  console.log(`[Wizard API] ${context}`, metadata);
}

function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[Wizard API] ${context}`, {
    error: errorMessage,
    stack: errorStack,
    ...metadata
  });
}

/**
 * Main handler
 */
export async function POST(req: Request): Promise<NextResponse<WizardResponse | ErrorResponse>> {
  const correlationId = crypto.randomUUID();
  
  try {
    const user = await requireUser();
    
    logInfo('POST request started', { userId: user.id, correlationId });
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      logError('Invalid JSON in request body', error, { userId: user.id, correlationId });
      return NextResponse.json(
        { error: 'Invalid JSON in request body', correlationId },
        { status: 400 }
      );
    }
    
    // Validate with Zod schema
    const validationResult = WizardPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      logInfo('Validation failed', { 
        userId: user.id, 
        errors: validationResult.error.errors,
        correlationId 
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          correlationId 
        },
        { status: 400 }
      );
    }
    
    const payload = validationResult.data;
    
    // Default tone to professional if not provided
    const tone = payload.ai_tone || 'professional';
    
    // Generate service configuration
    const services_enabled = getServicesForPlatform(payload.platform);
    const templates_loaded = getTemplatesForPlatform(payload.platform, payload.primary_goal);
    const dashboard_config = getDashboardConfig(payload.primary_goal);
    const ai_config = getAIConfig(payload.platform, tone);
    
    // Persist to database with transaction
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const wizardData = {
        user_id: user.id,
        platform: payload.platform,
        primary_goal: payload.primary_goal,
        ai_tone: tone,
        follower_range: payload.follower_range,
        onboarding_complete_at: new Date().toISOString(),
        questions_skipped: payload.questions_skipped || [],
        time_to_complete: payload.time_to_complete || 0,
        ai_config_json: ai_config,
        template_selections: templates_loaded.reduce((acc, template) => {
          acc[template] = true;
          return acc;
        }, {} as Record<string, boolean>)
      };
      
      // Store wizard completion data
      await client.query(
        `INSERT INTO user_wizard_completions 
         (user_id, platform, primary_goal, ai_tone, follower_range, 
          time_to_complete, questions_skipped, ai_config_json, template_selections, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET
           platform = EXCLUDED.platform,
           primary_goal = EXCLUDED.primary_goal,
           ai_tone = EXCLUDED.ai_tone,
           follower_range = EXCLUDED.follower_range,
           time_to_complete = EXCLUDED.time_to_complete,
           questions_skipped = EXCLUDED.questions_skipped,
           ai_config_json = EXCLUDED.ai_config_json,
           template_selections = EXCLUDED.template_selections,
           completed_at = NOW()`,
        [
          user.id,
          payload.platform,
          payload.primary_goal,
          tone,
          payload.follower_range,
          payload.time_to_complete || 0,
          JSON.stringify(payload.questions_skipped || []),
          JSON.stringify(ai_config),
          JSON.stringify(wizardData.template_selections)
        ]
      );
      
      // Track analytics event
      await client.query(
        `INSERT INTO onboarding_events 
         (user_id, event_type, metadata, correlation_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          user.id,
          'wizard_completed',
          JSON.stringify({
            platform: payload.platform,
            goal: payload.primary_goal,
            tone,
            time_to_complete: payload.time_to_complete,
            questions_skipped: payload.questions_skipped,
            services_enabled: services_enabled.length,
            templates_loaded: templates_loaded.length
          }),
          correlationId
        ]
      );
      
      await client.query('COMMIT');
      
      logInfo('Wizard completed successfully', {
        userId: user.id,
        platform: payload.platform,
        goal: payload.primary_goal,
        tone,
        timeToComplete: payload.time_to_complete,
        servicesEnabled: services_enabled.length,
        templatesLoaded: templates_loaded.length,
        correlationId
      });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
    
    // Return configuration
    const response: WizardResponse = {
      success: true,
      user_id: user.id,
      services_enabled,
      templates_loaded,
      dashboard_config,
      ai_config,
      correlationId
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    logError('Error processing wizard', error, { correlationId });
    
    // Handle specific error types
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('Unauthorized') || error.message.includes('No session')) {
        return NextResponse.json(
          { error: 'Unauthorized', correlationId },
          { status: 401 }
        );
      }
      
      // Database constraint violations
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        logInfo('Duplicate wizard completion attempt', { correlationId });
        return NextResponse.json(
          { 
            error: 'Wizard already completed',
            details: 'You have already completed the setup wizard',
            correlationId 
          },
          { status: 409 }
        );
      }
      
      // Database connection errors
      if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        logError('Database connection error', error, { correlationId });
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable',
            details: 'Please try again in a moment',
            correlationId 
          },
          { status: 503 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to process wizard completion',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      },
      { status: 500 }
    );
  }
}
