// A/B Testing Engine - Test what ACTUALLY converts
// Simple mais puissant pour optimiser les conversions

import { db } from '@/lib/db';

export interface ABTest {
  id: string;
  name: string;
  type: 'message' | 'price' | 'timing' | 'caption' | 'hashtag';
  status: 'active' | 'completed' | 'paused';
  variants: ABVariant[];
  metrics: {
    totalSent: number;
    totalConversions: number;
    conversionRate: number;
    revenue: number;
    confidence: number; // Statistical confidence
  };
  winner?: string;
  startDate: Date;
  endDate?: Date;
  planLevel?: 'starter' | 'pro' | 'scale' | 'enterprise';
  autoWinnerConfig?: {
    enabled: boolean;
    confidenceThreshold: number; // Default 0.95 (95%)
    minSampleSize: number; // Min impressions per variant
    minConversions: number; // Min conversions before auto-switch
    maxDuration: number; // Max test duration in ms
    holdoutPercentage: number; // % to measure incremental gain
    multiBandits?: boolean; // Enterprise only
    autoSwitchDate?: Date; // When auto-winner was applied
  };
  holdoutMetrics?: {
    control: number;
    treatment: number;
    lift: number;
  };
}

export interface ABVariant {
  id: string;
  name: string;
  content: any; // Message, price, etc.
  metrics: {
    sent: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
  isControl: boolean;
}

// Configuration auto-winner par plan
const AUTO_WINNER_DEFAULTS = {
  starter: { enabled: false },
  pro: { enabled: false }, // Manuel seulement ou add-on optionnel
  scale: {
    enabled: true,
    confidenceThreshold: 0.95,
    minSampleSize: 300,
    minConversions: 50,
    maxDuration: 7 * 24 * 60 * 60 * 1000, // 7 jours
    holdoutPercentage: 5
  },
  enterprise: {
    enabled: true,
    confidenceThreshold: 0.95,
    minSampleSize: 200, // Plus rapide
    minConversions: 30,
    maxDuration: 5 * 24 * 60 * 60 * 1000, // 5 jours
    holdoutPercentage: 5,
    multiBandits: true // Bandits multi-bras
  }
};

export class ABTestingEngine {
  
  // Create new test
  async createTest(
    name: string,
    type: ABTest['type'],
    variants: Array<{
      name: string;
      content: any;
      isControl?: boolean;
    }>,
    planLevel: 'starter' | 'pro' | 'scale' | 'enterprise' = 'pro',
    customAutoWinnerConfig?: Partial<typeof AUTO_WINNER_DEFAULTS.scale>
  ): Promise<ABTest> {
    // Get auto-winner config for plan
    const autoWinnerConfig = {
      ...AUTO_WINNER_DEFAULTS[planLevel],
      ...customAutoWinnerConfig
    };
    
    const test: ABTest = {
      id: `test_${Date.now()}`,
      name,
      type,
      status: 'active',
      variants: variants.map((v, index) => ({
        id: `variant_${index}`,
        name: v.name,
        content: v.content,
        metrics: {
          sent: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0
        },
        isControl: v.isControl || index === 0
      })),
      metrics: {
        totalSent: 0,
        totalConversions: 0,
        conversionRate: 0,
        revenue: 0,
        confidence: 0
      },
      startDate: new Date(),
      planLevel,
      autoWinnerConfig: autoWinnerConfig as any
    };
    
    // Save to database
    await this.saveTest(test);
    
    // Schedule auto-winner check if enabled
    if (autoWinnerConfig.enabled) {
      this.scheduleAutoWinnerCheck(test.id);
    }
    
    return test;
  }
  
  // Schedule periodic checks for auto-winner
  private scheduleAutoWinnerCheck(testId: string): void {
    // Check every hour
    const checkInterval = setInterval(async () => {
      const shouldSwitch = await this.checkAutoWinner(testId);
      if (shouldSwitch) {
        clearInterval(checkInterval);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
  
  // Check if we should auto-switch to winner
  private async checkAutoWinner(testId: string): Promise<boolean> {
    const test = await this.getTest(testId);
    if (!test || test.status !== 'active' || !test.autoWinnerConfig?.enabled) {
      return false;
    }
    
    const config = test.autoWinnerConfig;
    const now = Date.now();
    const testDuration = now - test.startDate.getTime();
    
    // Check max duration
    if (testDuration > config.maxDuration) {
      return await this.applyAutoWinner(test, 'max_duration');
    }
    
    // Check sample size and conversions
    const hasEnoughData = test.variants.every(v => 
      v.metrics.sent >= config.minSampleSize &&
      v.metrics.conversions >= config.minConversions
    );
    
    if (!hasEnoughData) {
      return false;
    }
    
    // Check confidence
    if (test.metrics.confidence >= config.confidenceThreshold) {
      return await this.applyAutoWinner(test, 'confidence_met');
    }
    
    return false;
  }
  
  // Apply auto-winner
  private async applyAutoWinner(test: ABTest, reason: string): Promise<boolean> {
    const winner = this.determineWinner(test);
    if (!winner) return false;
    
    // Mark test as completed
    test.status = 'completed';
    test.winner = winner;
    test.endDate = new Date();
    
    if (test.autoWinnerConfig) {
      test.autoWinnerConfig.autoSwitchDate = new Date();
    }
    
    // Calculate holdout lift if configured
    if (test.autoWinnerConfig?.holdoutPercentage && test.autoWinnerConfig.holdoutPercentage > 0) {
      test.holdoutMetrics = await this.calculateHoldoutLift(test);
    }
    
    await this.saveTest(test);
    
    // Log auto-winner application
    console.log(`Auto-winner applied for test ${test.id}. Reason: ${reason}. Winner: ${winner}`);
    
    return true;
  }
  
  // Calculate incremental lift from holdout group
  private async calculateHoldoutLift(test: ABTest): Promise<{
    control: number;
    treatment: number;
    lift: number;
  }> {
    // Simplified holdout calculation
    // In production, track actual holdout group separately
    const controlRate = test.variants.find(v => v.isControl)?.metrics.conversionRate || 0;
    const winnerRate = test.variants.find(v => v.id === test.winner)?.metrics.conversionRate || 0;
    
    const lift = ((winnerRate - controlRate) / controlRate) * 100;
    
    return {
      control: controlRate,
      treatment: winnerRate,
      lift
    };
  }
  
  // Get variant for user (50/50 split or custom)
  selectVariant(test: ABTest, userId: string): ABVariant {
    if (test.status !== 'active') {
      // Return control if test not active
      return test.variants.find(v => v.isControl) || test.variants[0];
    }
    
    // Simple hash-based assignment for consistency
    const hash = this.hashUserId(userId);
    const variantIndex = hash % test.variants.length;
    
    return test.variants[variantIndex];
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  // Track conversion
  async trackConversion(
    testId: string,
    variantId: string,
    revenue: number
  ): Promise<void> {
    // Update variant metrics
    // Recalculate test metrics
    // Check if we have a winner
    
    const test = await this.getTest(testId);
    if (!test) return;
    
    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;
    
    variant.metrics.conversions++;
    variant.metrics.revenue += revenue;
    variant.metrics.conversionRate = 
      variant.metrics.conversions / variant.metrics.sent;
    
    // Update test totals
    test.metrics.totalConversions++;
    test.metrics.revenue += revenue;
    
    // Check for statistical significance
    if (this.hasStatisticalSignificance(test)) {
      test.winner = this.determineWinner(test);
      test.status = 'completed';
      test.endDate = new Date();
    }
    
    await this.saveTest(test);
  }
  
  // Check statistical significance
  private hasStatisticalSignificance(test: ABTest): boolean {
    // Use config minimums if auto-winner enabled
    const minConversions = test.autoWinnerConfig?.enabled
      ? test.autoWinnerConfig.minConversions
      : 100;
    
    const hasEnough = test.variants.every(v => v.metrics.conversions >= minConversions);
    if (!hasEnough) return false;
    
    // Calculate confidence level
    const confidence = this.calculateConfidence(test);
    test.metrics.confidence = confidence;
    
    // 95% confidence threshold
    return confidence >= 0.95;
  }
  
  private calculateConfidence(test: ABTest): number {
    // Simplified confidence calculation
    // In production, use proper statistical tests (Chi-square, etc.)
    
    const control = test.variants.find(v => v.isControl)!;
    const variant = test.variants.find(v => !v.isControl)!;
    
    const diff = Math.abs(
      variant.metrics.conversionRate - control.metrics.conversionRate
    );
    
    // Larger difference = higher confidence
    return Math.min(diff * 10, 0.99);
  }
  
  private determineWinner(test: ABTest): string {
    let winner = test.variants[0];
    let bestRate = 0;
    
    test.variants.forEach(variant => {
      if (variant.metrics.conversionRate > bestRate) {
        bestRate = variant.metrics.conversionRate;
        winner = variant;
      }
    });
    
    return winner.id;
  }
  
  private async saveTest(test: ABTest): Promise<void> {
    // Save to database
  }
  
  private async getTest(testId: string): Promise<ABTest | null> {
    // Get from database
    return null;
  }
  
  // Get active tests
  async getActiveTests(): Promise<ABTest[]> {
    // Return all active tests
    return [];
  }
  
  // Get test results
  async getTestResults(testId: string): Promise<{
    test: ABTest;
    analysis: {
      winner: ABVariant | null;
      improvement: number;
      confidence: number;
      insights: string[];
    };
  } | null> {
    const test = await this.getTest(testId);
    if (!test) return null;
    
    const control = test.variants.find(v => v.isControl)!;
    const winner = test.winner 
      ? (test.variants.find(v => v.id === test.winner) || null)
      : null;
    
    const improvement = winner 
      ? ((winner.metrics.conversionRate - control.metrics.conversionRate) / 
         control.metrics.conversionRate) * 100
      : 0;
    
    const insights = this.generateInsights(test);
    
    return {
      test,
      analysis: {
        winner,
        improvement,
        confidence: test.metrics.confidence,
        insights
      }
    };
  }
  
  private generateInsights(test: ABTest): string[] {
    const insights: string[] = [];
    
    // Conversion insights
    test.variants.forEach(variant => {
      if (variant.metrics.conversionRate > 0.3) {
        insights.push(`${variant.name} has exceptional conversion (${(variant.metrics.conversionRate * 100).toFixed(1)}%)`);
      }
    });
    
    // Revenue insights
    const avgRevenue = test.metrics.revenue / test.metrics.totalConversions;
    insights.push(`Average revenue per conversion: $${avgRevenue.toFixed(2)}`);
    
    // Timing insights
    if (test.type === 'timing') {
      insights.push('Consider testing at different times of day');
    }
    
    return insights;
  }
}

// COMMON A/B TESTS FOR OF CREATORS
export const COMMON_AB_TESTS = {
  ppv_messages: {
    name: "PPV Message Style",
    type: "message" as const,
    variants: [
      {
        name: "Control - Direct",
        content: "New video dropping! 🔥 It's $25 and SO hot. Want it?",
        isControl: true
      },
      {
        name: "Curiosity Gap",
        content: "OMG I can't believe I filmed this... 😱 You'll never guess what happens at 3:45. Only $25 to find out"
      },
      {
        name: "Personal Touch",
        content: "Hey babe, I made something special just thinking of you... It's exactly what you asked for 😏 $25 and it's yours"
      }
    ]
  },
  
  pricing_strategy: {
    name: "PPV Pricing Test",
    type: "price" as const,
    variants: [
      {
        name: "Control - $25",
        content: { price: 25 },
        isControl: true
      },
      {
        name: "Lower - $19",
        content: { price: 19 }
      },
      {
        name: "Anchored - $35→$25",
        content: { 
          originalPrice: 35,
          price: 25,
          message: "Special price just for you!"
        }
      }
    ]
  },
  
  send_timing: {
    name: "Message Timing",
    type: "timing" as const,
    variants: [
      {
        name: "Control - Evening",
        content: { hour: 21 }, // 9pm
        isControl: true
      },
      {
        name: "Late Night",
        content: { hour: 23 } // 11pm
      },
      {
        name: "Afternoon",
        content: { hour: 15 } // 3pm
      }
    ]
  },
  
  instagram_captions: {
    name: "IG Caption Style",
    type: "caption" as const,
    variants: [
      {
        name: "Control - Subtle",
        content: "Feeling myself today 💕 More on my exclusive page",
        isControl: true
      },
      {
        name: "Direct CTA",
        content: "New content alert! 🚨 Check my bio link for the spicy version"
      },
      {
        name: "Tease",
        content: "This outfit didn't last long... 😏 Full story in my bio link"
      }
    ]
  },
  
  hashtag_strategy: {
    name: "Hashtag Mix",
    type: "hashtag" as const,
    variants: [
      {
        name: "Control - Generic",
        content: ["#model", "#fitness", "#beauty"],
        isControl: true
      },
      {
        name: "Niche Specific",
        content: ["#alternativemodel", "#inkedgirls", "#gothgf"]
      },
      {
        name: "Trending + Niche",
        content: ["#fyp", "#alternativemodel", "#viral"]
      }
    ]
  }
};

// Test result dashboard data
export interface TestDashboard {
  activeTests: number;
  completedTests: number;
  averageImprovement: number;
  topPerformingVariants: Array<{
    testName: string;
    variantName: string;
    improvement: number;
  }>;
  insights: {
    bestMessageType: string;
    optimalPrice: number;
    bestSendTime: number;
    topHashtags: string[];
  };
}

export const abTesting = new ABTestingEngine();
