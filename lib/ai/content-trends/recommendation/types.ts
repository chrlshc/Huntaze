/**
 * Content Recommendation Engine Types
 * Task 5.3: Generate personalized content recommendations
 * Requirements: 9.1, 9.2, 9.3
 */

export type ContentType = 'video' | 'image' | 'carousel' | 'story' | 'text';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TimingStrategy = 'immediate' | 'scheduled' | 'optimal' | 'trend-aligned';

export interface BrandProfile {
  id: string;
  name: string;
  industry: string;
  tone: 'professional' | 'casual' | 'humorous' | 'authoritative' | 'inspirational';
  targetAudience: AudienceProfile;
  brandValues: string[];
  contentGoals: ContentGoal[];
  platforms: PlatformPreference[];
  contentHistory?: ContentHistoryItem[];
  competitors?: string[];
}

export interface AudienceProfile {
  ageRange: { min: number; max: number };
  genders: string[];
  interests: string[];
  locations: string[];
  behaviors: string[];
  painPoints: string[];
}

export interface ContentGoal {
  type: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'education';
  priority: number;
  kpis: string[];
}

export interface PlatformPreference {
  platform: string;
  priority: number;
  contentTypes: ContentType[];
  postingFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  bestTimes?: string[];
}

export interface ContentHistoryItem {
  id: string;
  platform: string;
  contentType: ContentType;
  topic: string;
  publishedAt: Date;
  performance: ContentPerformance;
}

export interface ContentPerformance {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  viralScore?: number;
}

export interface ContentRecommendation {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  platform: string;
  priority: RecommendationPriority;
  brandAlignmentScore: number;
  viralPotentialScore: number;
  timingScore: number;
  overallScore: number;
  trendReference?: TrendReference;
  viralMechanisms: ViralMechanismSuggestion[];
  contentBrief: ContentBrief;
  timing: TimingRecommendation;
  reasoning: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface TrendReference {
  trendId: string;
  trendName: string;
  platform: string;
  relevanceScore: number;
  adaptationNotes: string;
}

export interface ViralMechanismSuggestion {
  mechanism: string;
  description: string;
  applicationTip: string;
  exampleReference?: string;
}

export interface ContentBrief {
  hook: HookSuggestion;
  narrative: NarrativeSuggestion;
  callToAction: CallToActionSuggestion;
  visualElements: VisualElementSuggestion[];
  audioSuggestions?: AudioSuggestion[];
  hashtags: string[];
  mentions?: string[];
  duration?: number; // seconds for video
}

export interface HookSuggestion {
  type: 'pointed_truth' | 'micro_scenario' | 'fast_reward' | 'constraint_negative' | 'question' | 'statistic';
  text: string;
  timing: string; // e.g., "0-3s"
  emotionalTrigger: string;
}

export interface NarrativeSuggestion {
  structure: 'problem_solution' | 'story_arc' | 'listicle' | 'comparison' | 'tutorial' | 'behind_scenes';
  keyPoints: string[];
  transitionTips: string[];
  retentionTechniques: string[];
}

export interface CallToActionSuggestion {
  primary: string;
  secondary?: string;
  placement: 'end' | 'middle' | 'throughout';
  urgencyLevel: 'low' | 'medium' | 'high';
}

export interface VisualElementSuggestion {
  element: string;
  purpose: string;
  timing?: string;
  reference?: string;
}

export interface AudioSuggestion {
  type: 'trending_sound' | 'original' | 'voiceover' | 'music';
  suggestion: string;
  source?: string;
  trendingScore?: number;
}

export interface TimingRecommendation {
  strategy: TimingStrategy;
  suggestedDate?: Date;
  suggestedTime?: string;
  timezone?: string;
  reasoning: string;
  alternativeTimes?: string[];
  trendWindowRemaining?: number; // hours
}

export interface RecommendationConfig {
  maxRecommendations: number;
  minBrandAlignmentScore: number;
  minViralPotentialScore: number;
  prioritizeTrending: boolean;
  includeExpiringTrends: boolean;
  lookAheadDays: number;
}

export interface RecommendationResult {
  recommendations: ContentRecommendation[];
  brandProfile: BrandProfile;
  analysisTimestamp: Date;
  trendsCovered: string[];
  contentGaps: ContentGap[];
  nextRefreshAt: Date;
}

export interface ContentGap {
  area: string;
  description: string;
  opportunity: string;
  suggestedAction: string;
}

export interface OptimalTimingSlot {
  dayOfWeek: number;
  hour: number;
  score: number;
  reasoning: string;
}
