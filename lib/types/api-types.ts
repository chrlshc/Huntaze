/**
 * Types TypeScript complets pour l'intégration API
 * Définit tous les types nécessaires pour une API type-safe
 */

// Types de base pour les réponses API
export interface BaseAPIResponse {
  success: boolean;
  meta: {
    timestamp: string;
    requestId: string;
    duration: number;
    version?: string;
  };
}

export interface SuccessAPIResponse<T = any> extends BaseAPIResponse {
  success: true;
  data: T;
  meta: BaseAPIResponse['meta'] & {
    tokensUsed?: number;
    cacheHit?: boolean;
    rateLimitRemaining?: number;
  };
}

export interface ErrorAPIResponse extends BaseAPIResponse {
  success: false;
  error: {
    type: string;
    message: string;
    code?: string;
    details?: any;
  };
}

export type APIResponse<T = any> = SuccessAPIResponse<T> | ErrorAPIResponse;

// Types pour les endpoints spécifiques

// Content Ideas
export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  category: 'photo' | 'video' | 'story' | 'ppv' | 'live';
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedEngagement: number;
  trendScore: number;
  seasonality?: {
    bestMonths?: number[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek?: string[];
  };
  targetAudience: {
    demographics: string[];
    interests: string[];
    spendingLevel?: 'low' | 'medium' | 'high';
  };
  monetizationPotential: {
    ppvSuitability: number;
    subscriptionValue: number;
    tipPotential: number;
  };
  createdAt: Date;
}

export interface CreatorProfile {
  id: string;
  niche: string[];
  contentTypes: string[];
  audiencePreferences: string[];
  performanceHistory: {
    topPerformingContent: string[];
    engagementPatterns: Record<string, number>;
    revenueByCategory: Record<string, number>;
  };
  currentGoals: Array<{
    type: 'growth' | 'revenue' | 'engagement' | 'retention';
    target: number;
    timeframe: string;
  }>;
  constraints: {
    equipment: string[];
    location: string[];
    timeAvailability: string;
  };
}

export interface GenerateContentIdeasRequest {
  creatorProfile: CreatorProfile;
  options?: {
    count?: number;
    category?: ContentIdea['category'];
    difficulty?: ContentIdea['difficulty'];
    focusArea?: 'trending' | 'evergreen' | 'seasonal' | 'monetization';
    timeframe?: 'week' | 'month' | 'quarter';
    includeAnalysis?: boolean;
  };
}

export interface GenerateContentIdeasResponse {
  ideas: ContentIdea[];
  trendAnalysis?: TrendData[];
  recommendations: string[];
  nextSteps: string[];
}

// Message Personalization
export interface FanProfile {
  id: string;
  name: string;
  subscriptionTier: 'basic' | 'premium' | 'vip';
  totalSpent: number;
  lastActive: Date;
  averageSessionDuration?: number;
  preferredContentTypes: string[];
  interactionHistory: Array<{
    type: 'message' | 'tip' | 'purchase' | 'like' | 'comment';
    content?: string;
    amount?: number;
    timestamp: Date;
  }>;
  demographics: {
    timezone?: string;
    language?: string;
    estimatedAge?: number;
  };
  behaviorMetrics: {
    responseRate?: number;
    averageSpendPerSession?: number;
    contentEngagementRate?: number;
    loyaltyScore?: number;
  };
}

export interface PersonalizeMessageRequest {
  fanProfile: FanProfile;
  messageType: 'greeting' | 'upsell' | 'ppv_offer' | 'reactivation' | 'thank_you' | 'custom';
  options?: {
    tone?: 'friendly' | 'flirty' | 'professional' | 'playful' | 'intimate' | 'mysterious' | 'confident';
    includeEmojis?: boolean;
    maxLength?: number;
    customPrompt?: string;
  };
}

export interface PersonalizeMessageResponse {
  message: string;
  template?: {
    id: string;
    name: string;
    category: string;
  };
  personalizationScore: number;
  suggestions: string[];
}

// Optimization Engine
export interface PricingData {
  contentId: string;
  currentPrice: number;
  contentType: ContentIdea['category'];
  historicalPerformance: {
    views: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
  };
  competitorPricing?: Array<{
    price: number;
    performance: number;
  }>;
  audienceData: {
    averageSpending: number;
    priceElasticity: number;
    segmentSize: number;
  };
}

export interface OptimizePricingRequest {
  pricingData: PricingData;
  options?: {
    strategy?: 'revenue_max' | 'conversion_max' | 'balanced';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    testDuration?: number;
  };
}

export interface PricingRecommendation {
  contentId: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  expectedImpact: {
    revenueChange: number;
    conversionRateChange: number;
    demandChange: number;
  };
  confidence: number;
  reasoning: string[];
  testingStrategy: {
    duration: string;
    metrics: string[];
    successCriteria: string[];
  };
}

// Caption and Hashtag Generation
export interface ContentContext {
  type: ContentIdea['category'];
  description: string;
  mood: string;
  setting: string;
  style: string;
  targetAudience: {
    demographics: string[];
    interests: string[];
    engagementPreferences: string[];
  };
  monetizationGoal?: 'subscription' | 'tips' | 'ppv' | 'engagement';
  brandVoice?: {
    personality: string[];
    avoidWords: string[];
    preferredStyle: string;
  };
}

export interface ContentStrategy {
  primaryNiche: string;
  secondaryNiches: string[];
  brandKeywords: string[];
  competitorAnalysis: {
    successfulHashtags: string[];
    engagementPatterns: Record<string, number>;
  };
  audienceInsights: {
    peakEngagementTimes: string[];
    preferredContentLength: 'short' | 'medium' | 'long';
    responseToEmojis: 'positive' | 'neutral' | 'negative';
    hashtagPreferences: string[];
  };
}

export interface GenerateCaptionRequest {
  contentContext: ContentContext;
  strategy: ContentStrategy;
  options?: {
    tone?: PersonalizeMessageRequest['options']['tone'];
    length?: 'short' | 'medium' | 'long';
    includeEmojis?: boolean;
    includeHashtags?: boolean;
    includeCallToAction?: boolean;
    variations?: number;
    customPrompt?: string;
  };
}

export interface Caption {
  id: string;
  text: string;
  tone: 'friendly' | 'flirty' | 'professional' | 'playful' | 'intimate' | 'mysterious' | 'confident';
  length: 'short' | 'medium' | 'long';
  includesEmojis: boolean;
  includesHashtags: boolean;
  callToAction?: string;
  engagementScore: number;
  createdAt: Date;
}

export interface GenerateCaptionResponse {
  captions: Caption[];
  recommendations: string[];
  hashtagSuggestions: string[];
}

// Trend Analysis
export interface TrendData {
  keyword: string;
  popularity: number;
  growth: number;
  category: string;
  relatedKeywords: string[];
  seasonality?: {
    peak?: string;
    decline?: string;
  };
}

// Performance Metrics
export interface PerformanceMetric {
  timestamp: Date;
  contentId: string;
  contentType: string;
  metrics: {
    views: number;
    engagement: number;
    revenue: number;
    conversionRate: number;
    reach: number;
  };
  context?: {
    price?: number;
    publishTime?: Date;
    promotionActive?: boolean;
    seasonalEvent?: string;
  };
}

export interface PerformanceAnomaly {
  id: string;
  type: 'spike' | 'drop' | 'trend_change' | 'outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  affectedMetrics: string[];
  description: string;
  possibleCauses: string[];
  recommendations: string[];
  expectedDuration: string;
  monitoringActions: string[];
}

// Health Check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    details?: any;
    error?: string;
  }>;
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// Authentication
export interface AuthContext {
  userId: string;
  role: 'creator' | 'admin' | 'system';
  permissions: string[];
  rateLimits: {
    contentGeneration: number;
    brainstorming: number;
    trendAnalysis: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: AuthContext['role'];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// File Upload
export interface FileUploadRequest {
  file: File;
  metadata?: {
    contentType?: string;
    description?: string;
    tags?: string[];
  };
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

// Monitoring and Analytics
export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  errorType?: string;
  tokensUsed?: number;
  cacheHit?: boolean;
}

export interface PerformanceAlert {
  id: string;
  type: 'high_latency' | 'error_rate' | 'rate_limit' | 'token_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  endpoint?: string;
  userId?: string;
}

// Webhook Events
export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
  source: string;
  version: string;
}

// Configuration Types
export interface APIConfiguration {
  baseURL: string;
  timeout: number;
  retryConfig: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitterFactor: number;
  };
  cacheConfig: {
    ttl: number;
    maxSize: number;
    keyPrefix: string;
  };
  authConfig: {
    tokenKey: string;
    refreshTokenKey: string;
    tokenEndpoint: string;
  };
  rateLimitConfig: {
    windowMs: number;
    maxRequests: number;
  };
}

// Utility Types
export type APIEndpoint = 
  | '/api/content-ideas/generate'
  | '/api/messages/personalize'
  | '/api/optimization/pricing'
  | '/api/optimization/timing'
  | '/api/captions/generate'
  | '/api/hashtags/generate'
  | '/api/health'
  | '/api/auth/login'
  | '/api/auth/refresh'
  | '/api/upload'
  | '/api/users'
  | '/api/analytics';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type APIRequestBody<T extends APIEndpoint> = 
  T extends '/api/content-ideas/generate' ? GenerateContentIdeasRequest :
  T extends '/api/messages/personalize' ? PersonalizeMessageRequest :
  T extends '/api/optimization/pricing' ? OptimizePricingRequest :
  T extends '/api/captions/generate' ? GenerateCaptionRequest :
  T extends '/api/auth/login' ? LoginRequest :
  T extends '/api/upload' ? FileUploadRequest :
  any;

export type APIResponseData<T extends APIEndpoint> = 
  T extends '/api/content-ideas/generate' ? GenerateContentIdeasResponse :
  T extends '/api/messages/personalize' ? PersonalizeMessageResponse :
  T extends '/api/optimization/pricing' ? PricingRecommendation :
  T extends '/api/captions/generate' ? GenerateCaptionResponse :
  T extends '/api/health' ? HealthCheckResponse :
  T extends '/api/auth/login' ? LoginResponse :
  T extends '/api/upload' ? FileUploadResponse :
  any;

// Type Guards
export function isSuccessResponse<T>(response: APIResponse<T>): response is SuccessAPIResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: APIResponse): response is ErrorAPIResponse {
  return response.success === false;
}

export function isContentIdea(obj: any): obj is ContentIdea {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    ['photo', 'video', 'story', 'ppv', 'live'].includes(obj.category);
}

export function isFanProfile(obj: any): obj is FanProfile {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    ['basic', 'premium', 'vip'].includes(obj.subscriptionTier);
}

// Helper Types for React Components
export interface APIHookState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

export interface APIHookOptions<T> {
  immediate?: boolean;
  dependencies?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transformData?: (data: any) => T;
  enabled?: boolean;
}

// All types are already exported as interfaces above