// Trend Detection & Content Suggestions
// Surf la vague des tendances TikTok/Instagram pour OnlyFans

import { db } from '@/lib/db';

export interface Trend {
  id: string;
  platform: 'tiktok' | 'instagram' | 'twitter';
  type: 'audio' | 'hashtag' | 'challenge' | 'filter' | 'format';
  name: string;
  description: string;
  metrics: {
    views: number;
    growth: number; // % last 24h
    creators: number;
    engagement: number;
  };
  demographics: {
    age: string[];
    gender: string[];
    interests: string[];
  };
  peakTime: 'rising' | 'peak' | 'declining';
  suggestedContent: ContentSuggestion[];
  expiresAt: Date;
}

export interface ContentSuggestion {
  type: 'teaser' | 'bts' | 'transition' | 'lifestyle';
  concept: string;
  script?: string;
  shots: string[];
  estimatedTime: number; // minutes to create
  expectedROI: 'high' | 'medium' | 'low';
  ofTieIn: string; // How to promote OF
}

// REAL-TIME TREND MONITORING
export class TrendDetector {
  
  // Get current hot trends
  async getHotTrends(
    niche?: string,
    platform?: string
  ): Promise<Trend[]> {
    // In production: API calls to TikTok/IG analytics
    // For now, return curated trends
    
    const trends: Trend[] = [
      {
        id: 'trend_1',
        platform: 'tiktok',
        type: 'audio',
        name: 'Shut up and bend over audio',
        description: 'Transition from sweet to spicy with beat drop',
        metrics: {
          views: 45000000,
          growth: 127,
          creators: 8900,
          engagement: 8.7
        },
        demographics: {
          age: ['18-24', '25-34'],
          gender: ['M', 'F'],
          interests: ['dating', 'fitness', 'lifestyle']
        },
        peakTime: 'rising',
        suggestedContent: [
          {
            type: 'transition',
            concept: 'Cute outfit → Lingerie reveal on beat drop',
            shots: ['Full body cute outfit', 'Spin transition', 'Lingerie pose'],
            estimatedTime: 15,
            expectedROI: 'high',
            ofTieIn: 'Caption: Full video where? You know where 😏 (link in bio)'
          }
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'trend_2',
        platform: 'instagram',
        type: 'format',
        name: 'Get Ready With Me (GRWM)',
        description: 'Morning/night routine with personality',
        metrics: {
          views: 89000000,
          growth: 45,
          creators: 23000,
          engagement: 5.4
        },
        demographics: {
          age: ['18-24', '25-34', '35-44'],
          gender: ['F', 'M'],
          interests: ['beauty', 'lifestyle', 'fashion']
        },
        peakTime: 'peak',
        suggestedContent: [
          {
            type: 'lifestyle',
            concept: 'GRWM for a "special date" (OF content shoot)',
            script: 'Start in robe, show outfit selection, tease the final look',
            shots: ['Mirror setup', 'Outfit options', 'Getting dressed (tasteful)', 'Final look'],
            estimatedTime: 30,
            expectedROI: 'medium',
            ofTieIn: 'See the full date night content on my exclusive page 💋'
          }
        ],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'trend_3',
        platform: 'tiktok',
        type: 'challenge',
        name: 'Silhouette Challenge 2.0',
        description: 'Backlit silhouette with colored lights',
        metrics: {
          views: 123000000,
          growth: 89,
          creators: 45000,
          engagement: 9.2
        },
        demographics: {
          age: ['18-24', '25-34'],
          gender: ['F', 'M'],
          interests: ['fitness', 'dance', 'art']
        },
        peakTime: 'rising',
        suggestedContent: [
          {
            type: 'teaser',
            concept: 'Silhouette tease → "See the full version..."',
            shots: ['Room setup with colored lights', 'Silhouette poses', 'Tease reveal'],
            estimatedTime: 20,
            expectedROI: 'high',
            ofTieIn: 'The lights go off on my other page... 🔥'
          }
        ],
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Filter by platform
    let filtered = platform 
      ? trends.filter(t => t.platform === platform)
      : trends;
    
    // Sort by growth rate
    return filtered.sort((a, b) => b.metrics.growth - a.metrics.growth);
  }
  
  // Generate content calendar based on trends
  async generateTrendCalendar(
    creatorNiche: string[],
    daysAhead: number = 7
  ): Promise<Array<{
    date: Date;
    trend: Trend;
    content: ContentSuggestion;
    platform: string;
    bestTime: string;
  }>> {
    const trends = await this.getHotTrends();
    const calendar = [];
    
    // Spread trends across days
    for (let day = 0; day < daysAhead; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      const trend = trends[day % trends.length];
      const content = trend.suggestedContent[0];
      
      calendar.push({
        date,
        trend,
        content,
        platform: trend.platform,
        bestTime: this.getBestPostTime(trend.platform, date.getDay())
      });
    }
    
    return calendar;
  }
  
  private getBestPostTime(platform: string, dayOfWeek: number): string {
    const times = {
      tiktok: {
        weekday: '6am, 10am, 3pm, 7pm',
        weekend: '9am, 12pm, 7pm'
      },
      instagram: {
        weekday: '7am, 12pm, 5pm, 9pm',
        weekend: '11am, 2pm, 5pm'
      },
      twitter: {
        weekday: '8am, 12pm, 5pm, 9pm',
        weekend: '10am, 1pm, 7pm'
      }
    };
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const schedule = times[platform as keyof typeof times];
    
    return isWeekend ? schedule.weekend : schedule.weekday;
  }
  
  // Analyze competitor trends
  async analyzeCompetitors(
    niche: string,
    topPerformers: number = 10
  ): Promise<{
    trending: string[];
    formats: string[];
    postingTimes: string[];
    hashtagCombos: string[][];
  }> {
    // In production: scrape competitor data
    // For now, return insights
    
    const nicheInsights: Record<string, any> = {
      fitness: {
        trending: ['Gym transitions', 'Workout in lingerie', 'Progress updates'],
        formats: ['Reels 15-30s', 'Carousel before/after', 'Stories Q&A'],
        postingTimes: ['6am', '12pm', '6pm'],
        hashtagCombos: [
          ['#fitgirl', '#workoutmotivation', '#gymlooks'],
          ['#fitnessgirl', '#glutes', '#squats']
        ]
      },
      gamer: {
        trending: ['Cosplay transitions', 'Setup tours', 'Controller shots'],
        formats: ['Gaming clips', 'Cosplay reveals', 'Tier lists'],
        postingTimes: ['3pm', '7pm', '11pm'],
        hashtagCombos: [
          ['#gamergirl', '#cosplay', '#egirl'],
          ['#twitchstreamer', '#gamerlife', '#pcgaming']
        ]
      },
      default: {
        trending: ['Transitions', 'GRWM', 'Day in life'],
        formats: ['Reels', 'Stories', 'Carousels'],
        postingTimes: ['9am', '5pm', '8pm'],
        hashtagCombos: [
          ['#model', '#content', '#lifestyle'],
          ['#creator', '#exclusive', '#linkinbio']
        ]
      }
    };
    
    return nicheInsights[niche] || nicheInsights.default;
  }
  
  // SEO optimization for TikTok/IG
  optimizeSEO(
    caption: string,
    platform: string
  ): {
    optimized: string;
    keywords: string[];
    warnings: string[];
  } {
    const platformRules = {
      tiktok: {
        maxLength: 150,
        maxHashtags: 5,
        bannedWords: ['onlyfans', 'link in bio', 'adult content'],
        keywords: ['fyp', 'foryoupage', 'viral', 'trending']
      },
      instagram: {
        maxLength: 2200,
        maxHashtags: 30,
        bannedWords: ['onlyfans', 'porn', 'nude'],
        keywords: ['explore', 'reels', 'discover']
      }
    };
    
    const rules = platformRules[platform as keyof typeof platformRules];
    let optimized = caption;
    const warnings = [];
    
    // Check banned words
    rules.bannedWords.forEach(word => {
      if (optimized.toLowerCase().includes(word)) {
        warnings.push(`Remove "${word}" to avoid shadowban`);
        optimized = optimized.replace(new RegExp(word, 'gi'), '');
      }
    });
    
    // Add trending keywords if missing
    const missingKeywords = rules.keywords.filter(kw => 
      !optimized.toLowerCase().includes(kw)
    );
    
    // Trim if too long
    if (optimized.length > rules.maxLength) {
      optimized = optimized.substring(0, rules.maxLength - 3) + '...';
      warnings.push(`Caption trimmed to ${rules.maxLength} chars`);
    }
    
    return {
      optimized,
      keywords: missingKeywords,
      warnings
    };
  }
  
  // Content performance prediction
  predictPerformance(
    content: {
      type: string;
      trend?: string;
      time?: string;
      niche: string;
    }
  ): {
    expectedViews: string;
    conversionRate: string;
    confidence: number;
  } {
    let score = 50; // Base score
    
    // Trend bonus
    if (content.trend) score += 30;
    
    // Optimal time bonus
    if (content.time && ['6am', '7pm', '9pm'].includes(content.time)) {
      score += 20;
    }
    
    // Content type bonus
    if (['transition', 'teaser'].includes(content.type)) {
      score += 15;
    }
    
    // Niche performance
    const highPerformingNiches = ['fitness', 'cosplay', 'milf'];
    if (highPerformingNiches.includes(content.niche)) {
      score += 10;
    }
    
    const viewRanges = {
      90: '100k-500k',
      80: '50k-100k',
      70: '20k-50k',
      60: '10k-20k',
      50: '5k-10k',
      0: '1k-5k'
    };
    
    const conversionRanges = {
      90: '3-5%',
      80: '2-3%',
      70: '1.5-2%',
      60: '1-1.5%',
      50: '0.5-1%',
      0: '0.1-0.5%'
    };
    
    const getRange = (ranges: Record<number, string>, score: number) => {
      for (const [threshold, range] of Object.entries(ranges).sort((a, b) => Number(b[0]) - Number(a[0]))) {
        if (score >= Number(threshold)) return range;
      }
      return ranges[0];
    };
    
    return {
      expectedViews: getRange(viewRanges, score),
      conversionRate: getRange(conversionRanges, score),
      confidence: Math.min(score, 95)
    };
  }
}

// HOT CONTENT FORMULAS
export const CONTENT_FORMULAS = {
  transition: {
    formula: "Setup → Build anticipation → Payoff",
    examples: [
      "Outfit check → Spin → Lingerie reveal",
      "Makeup routine → Wipe camera → Full glam",
      "Gym clothes → Flex → Sports bra reveal"
    ],
    tips: [
      "Match transition to beat drop",
      "Use hand to cover camera",
      "Film multiple takes",
      "Tease but don't show everything"
    ]
  },
  
  teaser: {
    formula: "Hook → Tease → CTA",
    examples: [
      "POV text → Reaction → 'Full video on...'",
      "Question → Partial answer → 'Rest on my page'",
      "Setup scenario → Cut before climax → Link in bio"
    ],
    tips: [
      "First 3 seconds are CRUCIAL",
      "Use text overlay for context",
      "End on cliffhanger",
      "Clear but subtle CTA"
    ]
  },
  
  lifestyle: {
    formula: "Relatable → Aspirational → Accessible",
    examples: [
      "Morning coffee → Workout → 'Join my routine'",
      "Cooking → Eating → 'Get my meal plans'",
      "Shopping haul → Try-on → 'See full haul'"
    ],
    tips: [
      "Show personality not just body",
      "Be authentic and relatable",
      "Soft sell your OF",
      "Focus on lifestyle benefits"
    ]
  }
};

export const trendDetector = new TrendDetector();