import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';
import { getAIService } from '@/lib/services/ai-service';

const ContentIdeasSchema = z.object({
  contentTypes: z.array(z.enum(['photo', 'video', 'story', 'ppv', 'live'])).min(1),
  themes: z.array(z.string()).default([]),
  targetAudience: z.object({
    demographics: z.object({
      ageRange: z.string().optional(),
      interests: z.array(z.string()).default([]),
      spendingBehavior: z.enum(['low', 'medium', 'high']).optional(),
    }).default({}),
    preferences: z.array(z.string()).default([]),
  }).default({}),
  performanceData: z.object({
    topPerformingContent: z.array(z.object({
      type: z.string(),
      title: z.string(),
      engagement: z.number(),
      revenue: z.number(),
      tags: z.array(z.string()).default([]),
    })).default([]),
    trends: z.array(z.object({
      keyword: z.string(),
      growth: z.number(),
      relevance: z.number(),
    })).default([]),
  }).default({}),
  constraints: z.object({
    budget: z.enum(['low', 'medium', 'high']).optional(),
    timeToCreate: z.enum(['quick', 'moderate', 'extensive']).optional(),
    equipment: z.array(z.string()).default([]),
  }).default({}),
  numberOfIdeas: z.number().min(1).max(20).default(5),
  creativityLevel: z.enum(['conservative', 'balanced', 'innovative']).default('balanced'),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = ContentIdeasSchema.safeParse(body);

    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid content ideas request', 400, {
        errors: validatedData.error.errors,
      });
    }

    const {
      contentTypes,
      themes,
      targetAudience,
      performanceData,
      constraints,
      numberOfIdeas,
      creativityLevel,
    } = validatedData.data;

    try {
      const aiService = getAIService();

      const prompt = buildContentIdeasPrompt({
        contentTypes,
        themes,
        targetAudience,
        performanceData,
        constraints,
        numberOfIdeas,
        creativityLevel,
      });

      const response = await aiService.generateText({
        prompt,
        context: {
          userId: auth.user.id,
          contentType: 'idea',
          metadata: {
            contentTypes,
            creativityLevel,
            numberOfIdeas,
          },
        },
        options: {
          temperature: creativityLevel === 'conservative' ? 0.5 : 
                      creativityLevel === 'balanced' ? 0.7 : 0.9,
          maxTokens: numberOfIdeas * 150, // Roughly 150 tokens per idea
        },
      });

      // Parse the generated ideas
      const ideas = parseContentIdeas(response.content, contentTypes);

      // Enhance ideas with additional metadata
      const enhancedIdeas = ideas.map((idea, index) => ({
        ...idea,
        id: `idea-${Date.now()}-${index}`,
        difficulty: estimateDifficulty(idea, constraints),
        monetizationPotential: estimateMonetizationPotential(idea, performanceData),
        trendAlignment: calculateTrendAlignment(idea, performanceData.trends),
        estimatedEngagement: predictEngagement(idea, performanceData.topPerformingContent),
      }));

      return Response.json({
        success: true,
        data: {
          ideas: enhancedIdeas,
          metadata: {
            totalIdeas: enhancedIdeas.length,
            contentTypes,
            creativityLevel,
            generatedAt: new Date().toISOString(),
            provider: response.provider,
            model: response.model,
          },
          usage: response.usage,
          recommendations: generateImplementationRecommendations(enhancedIdeas, constraints),
        },
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
      });

    } catch (error: any) {
      console.error('Content ideas generation error:', error);
      return jsonError('CONTENT_IDEAS_GENERATION_FAILED', 'Failed to generate content ideas', 500, {
        error: error.message,
      });
    }
  });
}

function buildContentIdeasPrompt(params: {
  contentTypes: string[];
  themes: string[];
  targetAudience: any;
  performanceData: any;
  constraints: any;
  numberOfIdeas: number;
  creativityLevel: string;
}): string {
  const {
    contentTypes,
    themes,
    targetAudience,
    performanceData,
    constraints,
    numberOfIdeas,
    creativityLevel,
  } = params;

  let prompt = `Generate ${numberOfIdeas} creative content ideas for a content creator.`;

  // Content types
  prompt += `\n\nContent Types to focus on: ${contentTypes.join(', ')}`;

  // Themes
  if (themes.length > 0) {
    prompt += `\nThemes to incorporate: ${themes.join(', ')}`;
  }

  // Audience information
  if (targetAudience.demographics.interests.length > 0) {
    prompt += `\nAudience interests: ${targetAudience.demographics.interests.join(', ')}`;
  }

  if (targetAudience.preferences.length > 0) {
    prompt += `\nAudience preferences: ${targetAudience.preferences.join(', ')}`;
  }

  // Performance data
  if (performanceData.topPerformingContent.length > 0) {
    prompt += `\n\nTop performing content for reference:`;
    performanceData.topPerformingContent.slice(0, 3).forEach((content: any, index: number) => {
      prompt += `\n${index + 1}. ${content.title} (${content.type}) - ${content.engagement} engagement, $${content.revenue} revenue`;
      if (content.tags.length > 0) {
        prompt += ` - Tags: ${content.tags.join(', ')}`;
      }
    });
  }

  // Trending topics
  if (performanceData.trends.length > 0) {
    prompt += `\n\nCurrent trends to consider:`;
    performanceData.trends.slice(0, 5).forEach((trend: any) => {
      prompt += `\n- ${trend.keyword} (${trend.growth > 0 ? '+' : ''}${trend.growth}% growth)`;
    });
  }

  // Constraints
  if (constraints.budget) {
    prompt += `\n\nBudget level: ${constraints.budget}`;
  }

  if (constraints.timeToCreate) {
    prompt += `\nTime available: ${constraints.timeToCreate}`;
  }

  if (constraints.equipment.length > 0) {
    prompt += `\nAvailable equipment: ${constraints.equipment.join(', ')}`;
  }

  // Creativity guidance
  const creativityGuidance = {
    conservative: 'Focus on proven concepts with slight variations. Prioritize safe, reliable content that builds on past successes.',
    balanced: 'Mix proven concepts with some creative twists. Balance innovation with reliability.',
    innovative: 'Push creative boundaries. Suggest unique, trend-setting ideas that could differentiate the creator.',
  };

  prompt += `\n\nCreativity level: ${creativityGuidance[creativityLevel as keyof typeof creativityGuidance]}`;

  prompt += `\n\nFor each idea, provide:
1. Title (catchy and descriptive)
2. Content type (${contentTypes.join('/')})
3. Description (2-3 sentences explaining the concept)
4. Key elements (props, setting, style, etc.)
5. Target audience appeal (why this will resonate)
6. Monetization angle (how to make money from this)
7. Production notes (practical tips for creation)

Format each idea clearly and number them 1-${numberOfIdeas}.`;

  return prompt;
}

function parseContentIdeas(content: string, contentTypes: string[]): any[] {
  const ideas: any[] = [];
  const sections = content.split(/\d+\./);

  sections.slice(1).forEach((section, index) => {
    const lines = section.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return;

    const idea: any = {
      title: '',
      contentType: contentTypes[0], // Default
      description: '',
      keyElements: [],
      targetAppeal: '',
      monetizationAngle: '',
      productionNotes: '',
    };

    // Parse the structured content
    let currentField = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Check for field headers
      if (trimmed.toLowerCase().includes('title:') || (!idea.title && index === 0)) {
        currentField = 'title';
        idea.title = trimmed.replace(/title:\s*/i, '').replace(/^\d+\.\s*/, '');
      } else if (trimmed.toLowerCase().includes('content type:')) {
        currentField = 'contentType';
        const type = trimmed.replace(/content type:\s*/i, '').toLowerCase();
        idea.contentType = contentTypes.find(t => type.includes(t)) || contentTypes[0];
      } else if (trimmed.toLowerCase().includes('description:')) {
        currentField = 'description';
        idea.description = trimmed.replace(/description:\s*/i, '');
      } else if (trimmed.toLowerCase().includes('key elements:')) {
        currentField = 'keyElements';
        const elements = trimmed.replace(/key elements:\s*/i, '');
        idea.keyElements = elements.split(',').map(e => e.trim()).filter(e => e);
      } else if (trimmed.toLowerCase().includes('target audience:') || trimmed.toLowerCase().includes('audience appeal:')) {
        currentField = 'targetAppeal';
        idea.targetAppeal = trimmed.replace(/target audience.*?:\s*/i, '').replace(/audience appeal:\s*/i, '');
      } else if (trimmed.toLowerCase().includes('monetization:')) {
        currentField = 'monetizationAngle';
        idea.monetizationAngle = trimmed.replace(/monetization.*?:\s*/i, '');
      } else if (trimmed.toLowerCase().includes('production:')) {
        currentField = 'productionNotes';
        idea.productionNotes = trimmed.replace(/production.*?:\s*/i, '');
      } else if (currentField && trimmed) {
        // Continue previous field
        if (currentField === 'keyElements') {
          const newElements = trimmed.split(',').map(e => e.trim()).filter(e => e);
          idea.keyElements.push(...newElements);
        } else {
          idea[currentField] += ' ' + trimmed;
        }
      }
    });

    // Clean up and validate
    if (idea.title) {
      idea.title = idea.title.trim();
      idea.description = idea.description.trim();
      idea.targetAppeal = idea.targetAppeal.trim();
      idea.monetizationAngle = idea.monetizationAngle.trim();
      idea.productionNotes = idea.productionNotes.trim();
      
      ideas.push(idea);
    }
  });

  return ideas;
}

function estimateDifficulty(idea: any, constraints: any): 'easy' | 'medium' | 'hard' {
  let score = 0;

  // Check production complexity
  if (idea.keyElements.length > 5) score += 1;
  if (idea.productionNotes.toLowerCase().includes('professional') || 
      idea.productionNotes.toLowerCase().includes('complex')) score += 2;
  
  // Check budget requirements
  if (constraints.budget === 'low' && 
      (idea.description.toLowerCase().includes('expensive') || 
       idea.keyElements.some((e: string) => e.toLowerCase().includes('professional')))) {
    score += 2;
  }

  // Check time requirements
  if (constraints.timeToCreate === 'quick' && 
      idea.productionNotes.toLowerCase().includes('time')) {
    score += 1;
  }

  return score <= 1 ? 'easy' : score <= 3 ? 'medium' : 'hard';
}

function estimateMonetizationPotential(idea: any, performanceData: any): number {
  let score = 50; // Base score

  // Check against top performing content
  if (performanceData.topPerformingContent.length > 0) {
    const avgRevenue = performanceData.topPerformingContent.reduce((sum: number, content: any) => 
      sum + content.revenue, 0) / performanceData.topPerformingContent.length;
    
    // Boost score if similar to high-performing content
    const similarContent = performanceData.topPerformingContent.find((content: any) =>
      content.type === idea.contentType || 
      content.tags.some((tag: string) => 
        idea.description.toLowerCase().includes(tag.toLowerCase())
      )
    );
    
    if (similarContent && similarContent.revenue > avgRevenue) {
      score += 20;
    }
  }

  // PPV content typically has higher monetization potential
  if (idea.contentType === 'ppv') score += 15;
  
  // Check monetization angle quality
  if (idea.monetizationAngle.toLowerCase().includes('exclusive') || 
      idea.monetizationAngle.toLowerCase().includes('premium')) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateTrendAlignment(idea: any, trends: any[]): number {
  if (trends.length === 0) return 50;

  let alignment = 0;
  let matchCount = 0;

  trends.forEach(trend => {
    if (idea.title.toLowerCase().includes(trend.keyword.toLowerCase()) ||
        idea.description.toLowerCase().includes(trend.keyword.toLowerCase()) ||
        idea.keyElements.some((element: string) => 
          element.toLowerCase().includes(trend.keyword.toLowerCase())
        )) {
      alignment += trend.growth;
      matchCount++;
    }
  });

  return matchCount > 0 ? Math.min(100, 50 + (alignment / matchCount)) : 50;
}

function predictEngagement(idea: any, topContent: any[]): number {
  if (topContent.length === 0) return 50;

  const avgEngagement = topContent.reduce((sum, content) => 
    sum + content.engagement, 0) / topContent.length;

  // Find similar content
  const similarContent = topContent.find(content =>
    content.type === idea.contentType ||
    content.tags.some((tag: string) => 
      idea.description.toLowerCase().includes(tag.toLowerCase())
    )
  );

  if (similarContent) {
    return Math.min(100, (similarContent.engagement / avgEngagement) * 50);
  }

  return 50; // Default prediction
}

function generateImplementationRecommendations(ideas: any[], constraints: any): string[] {
  const recommendations: string[] = [];

  // Sort ideas by difficulty and potential
  const easyHighPotential = ideas.filter(idea => 
    idea.difficulty === 'easy' && idea.monetizationPotential > 70
  );

  if (easyHighPotential.length > 0) {
    recommendations.push(`Start with "${easyHighPotential[0].title}" - it's easy to create and has high monetization potential`);
  }

  // Budget-specific recommendations
  if (constraints.budget === 'low') {
    const lowBudgetIdeas = ideas.filter(idea => idea.difficulty === 'easy');
    if (lowBudgetIdeas.length > 0) {
      recommendations.push(`Focus on low-budget ideas like "${lowBudgetIdeas[0].title}" to maximize ROI`);
    }
  }

  // Time-specific recommendations
  if (constraints.timeToCreate === 'quick') {
    recommendations.push('Prioritize photo content over video for faster turnaround');
  }

  // Trend recommendations
  const trendAligned = ideas.filter(idea => idea.trendAlignment > 70);
  if (trendAligned.length > 0) {
    recommendations.push(`"${trendAligned[0].title}" aligns well with current trends - consider prioritizing it`);
  }

  return recommendations.length > 0 ? recommendations : [
    'Start with the highest-rated ideas and test audience response',
    'Consider creating a content calendar to plan implementation',
    'Track performance metrics to refine future content strategies',
  ];
}