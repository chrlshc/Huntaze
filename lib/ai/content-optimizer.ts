import { analyzeSentiment, extractKeyPhrases } from './comprehend-service';
import { getOptimalPricing, getFanSegment } from './personalize-service';
import { callAzureOpenAI } from './azure-openai';

export interface ContentPerformance {
  views: number;
  likes: number;
  tips: number;
  revenue: number;
  engagementRate: number;
}

export interface OptimizedContent {
  title: string;
  description: string;
  tags: string[];
  optimalPrice: number;
  bestPostTime: string;
  targetAudience: string[];
  variations: ContentVariation[];
}

export interface ContentVariation {
  id: string;
  title: string;
  description: string;
  targetSegment: 'high_spenders' | 'regular' | 'new_fans';
  estimatedRevenue: number;
}

/**
 * Analyze top performing content to find patterns
 */
export async function analyzeTopContent(contents: Array<{
  title: string;
  description: string;
  performance: ContentPerformance;
}>) {
  // Find patterns in high-performing content
  const topPerformers = contents
    .sort((a, b) => b.performance.revenue - a.performance.revenue)
    .slice(0, 10);

  const patterns = {
    titles: [],
    descriptions: [],
    commonPhrases: [],
    optimalLength: 0,
    bestEmojis: []
  };

  // Extract patterns using Comprehend
  for (const content of topPerformers) {
    const keyPhrases = await extractKeyPhrases(
      `${content.title} ${content.description}`
    );
    patterns.commonPhrases.push(...keyPhrases);
  }

  // Use GPT-4 to identify success patterns
  const analysisPrompt = await callAzureOpenAI([
    {
      role: 'system',
      content: 'Tu es un expert en analyse de performance de contenu OnlyFans. Identifie les patterns qui génèrent engagement et revenus.'
    },
    {
      role: 'user',
      content: `Analyse ces posts top performers et identifie les patterns de succès:\n${JSON.stringify(topPerformers, null, 2)}`
    }
  ], { temperature: 0.7 });

  return {
    patterns,
    insights: analysisPrompt,
    recommendations: generateRecommendations(patterns)
  };
}

/**
 * Generate optimized content variations
 */
export async function generateOptimizedContent(
  contentType: 'photo_set' | 'video' | 'live_stream' | 'custom',
  theme: string,
  targetAudience?: string[]
): Promise<OptimizedContent> {
  
  // Generate base content
  const prompt = `Create optimized OnlyFans ${contentType} content:
Theme: ${theme}
Target: ${targetAudience?.join(', ') || 'all fans'}

Generate:
1. Catchy title (max 60 chars)
2. Engaging description (max 200 chars)
3. High-converting tags
4. Call-to-action
5. Three variations for different fan segments`;

  const completion = await callAzureOpenAI([
    {
      role: 'system',
      content: 'Tu es un expert stratège de contenu OnlyFans. Crée du contenu qui maximise engagement et revenus tout en respectant les règles de la plateforme.'
    },
    {
      role: 'user',
      content: prompt
    }
  ], { temperature: 0.8 });

  const result = JSON.parse(completion);

  // Generate segment-specific variations
  const variations = await generateVariations(result, ['high_spenders', 'regular', 'new_fans']);

  // Calculate optimal pricing
  const basePrice = contentType === 'custom' ? 50 : 
                   contentType === 'video' ? 20 : 10;
  const optimalPrice = await getOptimalPricing('average_user', contentType, basePrice);

  return {
    title: result.title,
    description: result.description,
    tags: result.tags,
    optimalPrice,
    bestPostTime: calculateBestPostTime(targetAudience),
    targetAudience: targetAudience || ['all'],
    variations
  };
}

/**
 * Generate A/B test variations
 */
async function generateVariations(
  baseContent: any,
  segments: string[]
): Promise<ContentVariation[]> {
  const variations: ContentVariation[] = [];

  for (const segment of segments) {
    const variation = await callAzureOpenAI([
      {
        role: 'system',
        content: `Adapte ce contenu pour le segment ${segment}. Les gros dépensiers veulent exclusif/luxe, fans réguliers veulent valeur, nouveaux fans veulent explorer.`
      },
      {
        role: 'user',
        content: `Adapte ce contenu pour ${segment}:\nTitre: ${baseContent.title}\nDescription: ${baseContent.description}`
      }
    ], { temperature: 0.7 });

    const adapted = JSON.parse(variation);

    variations.push({
      id: `var_${segment}`,
      title: adapted.title,
      description: adapted.description,
      targetSegment: segment as any,
      estimatedRevenue: estimateRevenue(segment, baseContent)
    });
  }

  return variations;
}

/**
 * Optimize existing content
 */
export async function optimizeExistingContent(
  currentTitle: string,
  currentDescription: string,
  performance: ContentPerformance
) {
  // Analyze current sentiment
  const sentiment = await analyzeSentiment(`${currentTitle} ${currentDescription}`);
  
  // Get improvement suggestions
  const optimization = await callAzureOpenAI([
    {
      role: 'system',
      content: 'Tu es un expert en optimisation OnlyFans. Améliore le contenu pour augmenter engagement et revenus.'
    },
    {
      role: 'user',
      content: `Contenu actuel:
Titre: ${currentTitle}
Description: ${currentDescription}
Performance: ${performance.engagementRate}% engagement, ${performance.revenue}€ revenus
Sentiment: ${sentiment.sentiment}

Suggère des améliorations pour augmenter la performance de 50%.`
    }
  ], { temperature: 0.7 });

  return {
    original: { title: currentTitle, description: currentDescription },
    optimized: JSON.parse(optimization),
    expectedImprovement: '30-50%',
    reasoning: optimization
  };
}

/**
 * Generate content calendar
 */
export async function generateContentCalendar(
  creatorNiche: string,
  daysAhead: number = 30
) {
  const calendar = await callAzureOpenAI([
    {
      role: 'system',
      content: 'Crée un calendrier de contenu OnlyFans qui maximise engagement et revenus. Inclus variété, thèmes, et événements spéciaux.'
    },
    {
      role: 'user',
      content: `Génère un calendrier de ${daysAhead} jours pour créatrice ${creatorNiche}. Inclus posts quotidiens avec type, thème, et prix.`
    }
  ], { temperature: 0.8 });

  return JSON.parse(calendar);
}

/**
 * Calculate best posting time
 */
function calculateBestPostTime(targetAudience?: string[]): string {
  // Based on OnlyFans engagement data
  const timesByAudience = {
    'US': '9:00 PM EST',
    'EU': '10:00 PM CET', 
    'ASIA': '9:00 PM JST',
    'all': '2:00 PM EST' // Best global time
  };

  const audience = targetAudience?.[0] || 'all';
  return timesByAudience[audience] || timesByAudience.all;
}

/**
 * Estimate revenue by segment
 */
function estimateRevenue(segment: string, content: any): number {
  const multipliers = {
    'high_spenders': 3.5,
    'regular': 1.0,
    'new_fans': 0.5
  };

  const baseRevenue = 100; // Base estimate
  return Math.round(baseRevenue * multipliers[segment] || 1);
}

/**
 * Generate recommendations
 */
function generateRecommendations(patterns: any): string[] {
  const recommendations = [];

  if (patterns.commonPhrases.includes('exclusive')) {
    recommendations.push('Use "exclusive" in titles - drives 40% more sales');
  }

  if (patterns.optimalLength < 100) {
    recommendations.push('Keep descriptions under 100 chars for better engagement');
  }

  recommendations.push(
    'Post between 8-10 PM fan timezone',
    'Include 3-5 relevant emojis',
    'Always add a clear call-to-action'
  );

  return recommendations;
}

/**
 * Auto-generate descriptions from visual content
 */
export async function generateFromVisual(
  imageAnalysis: any, // From Rekognition
  contentType: string
) {
  const prompt = `Based on this image analysis, create engaging OnlyFans content:
${JSON.stringify(imageAnalysis)}
Type: ${contentType}`;

  const completion = await callAzureOpenAI([
    {
      role: 'system',
      content: 'Crée des descriptions attirantes mais de bon goût pour contenu adulte.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]);

  return completion;
}
