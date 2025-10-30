# Design Document - Content Optimization & Multi-Platform Publishing

## Overview

Ce système permet aux creators d'optimiser et publier du contenu sur Instagram, TikTok et Reddit avec A/B testing, respect des règles plateformes, et recommandations AI pour maximiser la visibilité.

### Objectifs

1. **Optimiser le contenu** pour chaque plateforme (bio, captions, hashtags)
2. **A/B tester** différentes variantes pour identifier les gagnantes
3. **Vérifier la conformité** avec les règles de chaque plateforme
4. **Publier au bon moment** avec timing optimal
5. **Analyser les performances** et fournir des insights

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                          │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  API Routes      │────────▶│  ContentOptimizerService     │  │
│  │  /api/content/   │         │  - Bio optimization          │  │
│  │  optimize        │         │  - Caption generation        │  │
│  └──────────────────┘         │  - Hashtag strategy          │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  ABTestingEngine             │  │
│  │  /api/content/   │         │  - Variant creation          │  │
│  │  ab-test         │         │  - Performance tracking      │  │
│  └──────────────────┘         │  - Winner selection          │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  PlatformComplianceChecker   │  │
│  │  /api/content/   │         │  - Rules validation          │  │
│  │  validate        │         │  - Shadowban detection       │  │
│  └──────────────────┘         │  - Content moderation        │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  PublishingService           │  │
│  │  /api/content/   │         │  - Multi-platform publish    │  │
│  │  publish         │         │  - Timing optimization       │  │
│  └──────────────────┘         │  - Scheduling                │  │
│                                └──────────┬───────────────────┘  │
└───────────────────────────────────────────┼──────────────────────┘
                                            │
                                            │ Platform APIs
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Platform APIs                             │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  Instagram API   │  │  TikTok API      │  │  Reddit API    ││
│  │  - Graph API     │  │  - Content API   │  │  - OAuth API   ││
│  │  - Insights API  │  │  - Analytics API │  │  - Submit API  ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        AI Services                               │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  Azure OpenAI    │  │  Content         │  │  Performance   ││
│  │  - GPT-4 Turbo   │  │  Moderation API  │  │  Analytics     ││
│  │  - Embeddings    │  │  - NSFW detect   │  │  - Insights    ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ContentOptimizerService

Service principal pour l'optimisation de contenu.

```typescript
export class ContentOptimizerService {
  constructor(
    private aiService: AzureOpenAIService,
    private prisma: PrismaClient,
    private metrics: CloudWatchMetricsService
  ) {}

  // Bio optimization
  async optimizeBio(params: OptimizeBioParams): Promise<BioSuggestion[]>;
  async generateBioVariants(bio: string, platform: Platform, count: number): Promise<string[]>;
  
  // Caption optimization
  async optimizeCaption(params: OptimizeCaptionParams): Promise<CaptionSuggestion>;
  async generateCaptionVariants(caption: string, platform: Platform): Promise<string[]>;
  
  // Hashtag strategy
  async suggestHashtags(params: HashtagParams): Promise<HashtagStrategy>;
  async validateHashtags(hashtags: string[], platform: Platform): Promise<HashtagValidation>;
  
  // CTA optimization
  async suggestCTA(platform: Platform, goal: string): Promise<CTASuggestion[]>;
  
  // Platform-specific optimization
  async optimizeForInstagram(content: Content): Promise<OptimizedContent>;
  async optimizeForTikTok(content: Content): Promise<OptimizedContent>;
  async optimizeForReddit(content: Content, subreddit: string): Promise<OptimizedContent>;
}
```

### 2. ABTestingEngine

Moteur d'A/B testing pour le contenu.

```typescript
export class ABTestingEngine {
  constructor(
    private prisma: PrismaClient,
    private metrics: CloudWatchMetricsService
  ) {}

  // Test management
  async createTest(params: CreateTestParams): Promise<ABTest>;
  async createVariants(testId: string, variants: Variant[]): Promise<void>;
  async startTest(testId: string): Promise<void>;
  async stopTest(testId: string): Promise<void>;
  
  // Performance tracking
  async trackVariantPerformance(variantId: string, metrics: PerformanceMetrics): Promise<void>;
  async calculateStatisticalSignificance(testId: string): Promise<SignificanceResult>;
  
  // Winner selection
  async selectWinner(testId: string): Promise<Variant>;
  async applyWinner(testId: string): Promise<void>;
  
  // Analytics
  async getTestResults(testId: string): Promise<TestResults>;
  async getTestHistory(userId: string): Promise<ABTest[]>;
}
```

### 3. PlatformComplianceChecker

Vérificateur de conformité multi-plateformes.

```typescript
export class PlatformComplianceChecker {
  constructor(
    private prisma: PrismaClient,
    private contentModerationAPI: ContentModerationAPI
  ) {}

  // Compliance validation
  async validateContent(content: Content, platform: Platform): Promise<ComplianceResult>;
  async validateBio(bio: string, platform: Platform): Promise<ComplianceResult>;
  async validateCaption(caption: string, platform: Platform): Promise<ComplianceResult>;
  async validateHashtags(hashtags: string[], platform: Platform): Promise<HashtagComplianceResult>;
  
  // Shadowban detection
  async detectShadowban(userId: string, platform: Platform): Promise<ShadowbanResult>;
  async analyzeShadowbanCause(userId: string, platform: Platform): Promise<ShadowbanCause[]>;
  async suggestShadowbanFix(cause: ShadowbanCause): Promise<string[]>;
  
  // Content moderation
  async moderateContent(content: Content): Promise<ModerationResult>;
  async detectNSFW(mediaUrl: string): Promise<NSFWResult>;
  
  // Banned content management
  async getBannedHashtags(platform: Platform): Promise<string[]>;
  async updateBannedHashtags(platform: Platform): Promise<void>;
  async checkProhibitedTerms(text: string, platform: Platform): Promise<ProhibitedTermsResult>;
}
```

### 4. PublishingService

Service de publication multi-plateformes.

```typescript
export class PublishingService {
  constructor(
    private instagramService: InstagramService,
    private tiktokService: TikTokService,
    private redditService: RedditService,
    private prisma: PrismaClient,
    private metrics: CloudWatchMetricsService
  ) {}

  // Publishing
  async publishContent(params: PublishParams): Promise<PublishResult>;
  async crossPost(content: Content, platforms: Platform[]): Promise<CrossPostResult>;
  async schedulePost(params: ScheduleParams): Promise<ScheduledPost>;
  
  // Timing optimization
  async getOptimalPostingTime(userId: string, platform: Platform): Promise<Date[]>;
  async analyzeAudienceActivity(userId: string, platform: Platform): Promise<ActivityPattern>;
  
  // Platform-specific publishing
  async publishToInstagram(post: InstagramPost): Promise<PublishResult>;
  async publishToTikTok(video: TikTokVideo): Promise<PublishResult>;
  async publishToReddit(post: RedditPost): Promise<PublishResult>;
  
  // Performance tracking
  async trackPostPerformance(postId: string): Promise<PerformanceMetrics>;
  async getPostAnalytics(postId: string): Promise<PostAnalytics>;
}
```

## Data Models

### Prisma Schema Extensions

```prisma
// Content optimization
model ContentOptimization {
  id              String   @id @default(cuid())
  userId          String
  platform        String   // instagram, tiktok, reddit
  contentType     String   // bio, caption, post
  originalContent String
  optimizedContent String
  suggestions     Json     // Array of suggestions
  applied         Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([platform])
  @@map("content_optimizations")
}

// A/B Testing
model ABTest {
  id              String   @id @default(cuid())
  userId          String
  name            String
  platform        String
  testType        String   // bio, caption, hashtags, timing
  status          String   // draft, running, completed, cancelled
  startDate       DateTime?
  endDate         DateTime?
  winnerId        String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  variants        ABTestVariant[]
  
  @@index([userId])
  @@index([status])
  @@map("ab_tests")
}

model ABTestVariant {
  id              String   @id @default(cuid())
  testId          String
  name            String
  content         String
  isControl       Boolean  @default(false)
  
  // Metrics
  impressions     Int      @default(0)
  reach           Int      @default(0)
  engagement      Int      @default(0)
  clicks          Int      @default(0)
  conversions     Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  test            ABTest   @relation(fields: [testId], references: [id])
  
  @@index([testId])
  @@map("ab_test_variants")
}

// Platform compliance
model ComplianceCheck {
  id              String   @id @default(cuid())
  userId          String
  platform        String
  contentType     String
  content         String
  status          String   // passed, warning, failed
  issues          Json     // Array of issues
  suggestions     Json     // Array of suggestions
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([platform])
  @@index([status])
  @@map("compliance_checks")
}

// Shadowban tracking
model ShadowbanCheck {
  id              String   @id @default(cuid())
  userId          String
  platform        String
  isShadowbanned  Boolean
  confidence      Float    // 0-1
  probableCauses  Json     // Array of causes
  reachDrop       Float?   // Percentage drop
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([platform])
  @@map("shadowban_checks")
}

// Published content
model PublishedContent {
  id              String   @id @default(cuid())
  userId          String
  platform        String
  platformPostId  String?  // ID from platform
  contentType     String   // post, story, video, reel
  caption         String?
  mediaUrls       String[]
  hashtags        String[]
  
  // Scheduling
  scheduledFor    DateTime?
  publishedAt     DateTime?
  
  // Status
  status          String   // draft, scheduled, published, failed
  error           String?
  
  // Performance metrics
  impressions     Int      @default(0)
  reach           Int      @default(0)
  likes           Int      @default(0)
  comments        Int      @default(0)
  shares          Int      @default(0)
  saves           Int      @default(0)
  engagementRate  Float?
  
  // A/B test link
  abTestId        String?
  variantId       String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([platform])
  @@index([status])
  @@index([scheduledFor])
  @@map("published_content")
}

// Hashtag performance
model HashtagPerformance {
  id              String   @id @default(cuid())
  userId          String
  platform        String
  hashtag         String
  usageCount      Int      @default(0)
  avgReach        Float    @default(0)
  avgEngagement   Float    @default(0)
  isBanned        Boolean  @default(false)
  lastUsed        DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, platform, hashtag])
  @@index([userId])
  @@index([platform])
  @@map("hashtag_performance")
}

// Optimal posting times
model OptimalPostingTime {
  id              String   @id @default(cuid())
  userId          String
  platform        String
  dayOfWeek       Int      // 0-6
  hour            Int      // 0-23
  score           Float    // 0-1
  avgEngagement   Float
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, platform, dayOfWeek, hour])
  @@index([userId])
  @@map("optimal_posting_times")
}
```



## Platform-Specific Rules & Best Practices

### Instagram

**Bio Optimization:**
- Character limit: 150
- Best practices:
  - Include niche keywords in first 50 characters
  - Use 2-3 relevant emojis
  - Clear CTA (link in bio, DM for collabs)
  - Line breaks for readability
  - Contact info if business account

**Caption Optimization:**
- First 125 characters visible without "more"
- Hook in first line
- 3-5 hashtags in caption, rest in first comment
- Ask questions to boost comments
- Tag relevant accounts
- Include CTA (save, share, comment)

**Hashtag Strategy:**
- Mix: 30% high-volume (100K-1M), 40% medium (10K-100K), 30% niche (<10K)
- Max 30 hashtags
- Avoid banned hashtags (check regularly)
- Use branded hashtag
- Location tags for local reach

**Posting Times:**
- Best: 11 AM - 1 PM, 7 PM - 9 PM
- Worst: 3 AM - 5 AM
- Analyze audience insights for personalization

**Content Types Priority:**
- Reels > Carousel > Single image > Video
- Stories for engagement
- Lives for reach boost

**Shadowban Triggers:**
- Banned hashtags
- Repetitive comments
- Too many hashtags
- Spammy behavior
- Copyrighted content

---

### TikTok

**Bio Optimization:**
- Character limit: 80
- Best practices:
  - Fun, casual tone
  - Emojis encouraged
  - Link to other platforms
  - Niche keywords

**Caption Optimization:**
- Keep short (50-100 characters)
- Use trending sounds/effects
- Include 3-5 relevant hashtags
- Ask for engagement (duet, stitch, comment)
- Trending challenges

**Hashtag Strategy:**
- Mix trending + niche hashtags
- Use #FYP, #ForYou strategically
- 3-5 hashtags optimal
- Avoid overused hashtags
- Create branded hashtag

**Posting Times:**
- Best: 6 AM - 10 AM, 7 PM - 11 PM
- Post 1-3 times per day
- Consistency > frequency

**Content Best Practices:**
- First 3 seconds critical (hook)
- Vertical video (9:16)
- Captions/text overlays
- Trending sounds
- 15-60 seconds optimal

**Algorithm Factors:**
- Watch time
- Completion rate
- Shares > Likes > Comments
- Re-watches
- Profile visits

---

### Reddit

**Bio Optimization:**
- Character limit: 200
- Best practices:
  - Professional tone
  - Expertise/credentials
  - No promotional links
  - Subreddit participation

**Post Optimization:**
- Title is critical (80% of success)
- Provide value (educational, entertaining)
- No self-promotion in first posts
- Engage in comments
- Follow subreddit rules

**Subreddit Strategy:**
- Build karma first (comments)
- Read and follow rules
- Participate authentically
- No cross-posting spam
- Timing matters per subreddit

**Posting Times:**
- Varies by subreddit
- Generally: 6 AM - 8 AM, 12 PM - 2 PM EST
- Check subreddit analytics

**Content Best Practices:**
- Original content preferred
- High-quality images/videos
- Descriptive titles
- Engage in comments quickly
- No clickbait

**Shadowban Triggers:**
- Spam behavior
- Self-promotion too early
- Breaking subreddit rules
- Low karma account
- Suspicious activity

---

## AI-Powered Optimization

### Bio Generation Prompt Template

```typescript
const BIO_OPTIMIZATION_PROMPT = `
You are an expert social media strategist specializing in ${platform} optimization.

Generate an optimized bio for a ${niche} creator with the following goals: ${goals}.

Requirements:
- Character limit: ${charLimit}
- Include relevant keywords: ${keywords}
- Tone: ${tone}
- Include CTA: ${ctaType}
- Use emojis strategically

Current bio: "${currentBio}"

Generate 3 optimized variants that:
1. Maximize discoverability (keywords)
2. Increase conversions (CTA)
3. Build trust (social proof)

Format: JSON array of bio strings
`;
```

### Caption Generation Prompt Template

```typescript
const CAPTION_OPTIMIZATION_PROMPT = `
You are a ${platform} content expert for ${niche} creators.

Generate an optimized caption for this content:
- Content type: ${contentType}
- Description: ${description}
- Goal: ${goal}
- Audience: ${audience}

Platform best practices:
${platformBestPractices}

Generate a caption that:
1. Hooks in first line
2. Provides value
3. Encourages engagement
4. Includes optimal hashtags
5. Has clear CTA

Format: JSON with caption, hashtags, and cta
`;
```

### Hashtag Strategy Prompt Template

```typescript
const HASHTAG_STRATEGY_PROMPT = `
You are a hashtag strategist for ${platform}.

Suggest optimal hashtags for:
- Niche: ${niche}
- Content: ${contentDescription}
- Goal: ${goal}

Strategy:
- 30% high-volume hashtags (100K-1M posts)
- 40% medium hashtags (10K-100K posts)
- 30% niche hashtags (<10K posts)

Avoid:
- Banned hashtags
- Overused generic hashtags
- Irrelevant hashtags

Return: JSON with hashtags categorized by volume
`;
```

## A/B Testing Strategy

### Test Types

1. **Bio A/B Test**
   - Variants: 2-5 different bios
   - Duration: 7-14 days
   - Metrics: Profile visits, follower growth, link clicks
   - Winner: Highest conversion rate

2. **Caption A/B Test**
   - Variants: 2-3 different captions
   - Duration: 24-48 hours
   - Metrics: Reach, engagement rate, saves
   - Winner: Highest engagement rate

3. **Hashtag A/B Test**
   - Variants: 2-3 hashtag sets
   - Duration: 7 days
   - Metrics: Reach, impressions, discovery
   - Winner: Highest reach

4. **Timing A/B Test**
   - Variants: Different posting times
   - Duration: 14 days
   - Metrics: Immediate engagement, 24h reach
   - Winner: Highest 24h engagement

5. **CTA A/B Test**
   - Variants: Different CTAs
   - Duration: 7 days
   - Metrics: Click-through rate, conversions
   - Winner: Highest CTR

### Statistical Significance

```typescript
// Minimum sample size per variant
const MIN_SAMPLE_SIZE = {
  bio: 1000, // Profile visits
  caption: 500, // Post impressions
  hashtags: 500, // Post impressions
  timing: 10, // Posts
  cta: 100, // Clicks
};

// Confidence level: 95%
// Minimum detectable effect: 10%

function calculateSignificance(
  variantA: Metrics,
  variantB: Metrics
): { significant: boolean; pValue: number; winner: 'A' | 'B' | 'tie' } {
  // Z-test for proportions
  // Implementation details...
}
```

## Error Handling

### Platform API Errors

**Instagram:**
- Rate limit: 200 calls/hour
- Error codes: Handle 400, 401, 403, 429, 500
- Retry strategy: Exponential backoff

**TikTok:**
- Rate limit: Varies by endpoint
- Error codes: Handle authentication, upload, publish errors
- Retry strategy: 3 attempts with backoff

**Reddit:**
- Rate limit: 60 calls/minute
- Error codes: Handle 401, 403, 429, 500
- Retry strategy: Respect rate limit headers

### Content Validation Errors

- Invalid format → Return specific error
- Prohibited content → Suggest modifications
- Shadowban risk → Warn user
- Compliance failure → Block publication

## Testing Strategy

### Unit Tests

**ContentOptimizerService:**
- Bio generation (valid/invalid inputs)
- Caption optimization
- Hashtag validation
- Platform-specific rules

**ABTestingEngine:**
- Variant creation
- Performance tracking
- Statistical significance
- Winner selection

**PlatformComplianceChecker:**
- Rules validation
- Shadowban detection
- Content moderation
- Banned hashtags

### Integration Tests

**API Routes:**
- POST `/api/content/optimize` → Returns suggestions
- POST `/api/content/ab-test` → Creates test
- POST `/api/content/validate` → Validates compliance
- POST `/api/content/publish` → Publishes content

**Platform APIs:**
- Instagram Graph API integration
- TikTok Content API integration
- Reddit API integration

### E2E Tests

**Complete Flows:**
1. Optimize bio → A/B test → Apply winner
2. Generate caption → Validate → Publish → Track performance
3. Detect shadowban → Suggest fix → Verify recovery

## Monitoring and Observability

### CloudWatch Metrics

**Content Optimization:**
- `ContentOptimizationsGenerated` (Count)
- `OptimizationAcceptanceRate` (Percentage)
- `AIGenerationLatency` (Milliseconds)

**A/B Testing:**
- `ABTestsCreated` (Count)
- `ABTestsCompleted` (Count)
- `WinnerSelectionAccuracy` (Percentage)

**Publishing:**
- `ContentPublished` (Count by platform)
- `PublishSuccessRate` (Percentage)
- `PublishLatency` (Milliseconds)

**Compliance:**
- `ComplianceChecks` (Count)
- `ComplianceFailures` (Count)
- `ShadowbanDetections` (Count)

### CloudWatch Alarms

1. **High Compliance Failure Rate** (>10%)
2. **Publishing Errors** (>5%)
3. **AI Generation Failures** (>2%)
4. **Shadowban Spike** (>5 detections/day)

### Dashboard

**Widgets:**
- Content optimizations per day
- A/B test win rates
- Publishing success rate by platform
- Compliance check results
- Shadowban detections timeline
- Top performing hashtags
- Optimal posting times heatmap

## Security Considerations

### Content Safety

- NSFW detection for non-adult platforms
- Hate speech detection
- Spam detection
- Copyright infringement detection

### Platform Credentials

- OAuth tokens encrypted in database
- Refresh tokens stored securely
- Access tokens rotated regularly
- Secrets Manager for API keys

### Rate Limiting

- Respect platform rate limits
- Implement backoff strategies
- Queue requests during high load
- Monitor rate limit usage

## Performance Considerations

### Caching Strategy

```typescript
// Cache optimization results
const CACHE_TTL = {
  bioSuggestions: 3600, // 1 hour
  hashtagStrategy: 1800, // 30 minutes
  complianceRules: 86400, // 24 hours
  bannedHashtags: 3600, // 1 hour
  optimalTimes: 86400, // 24 hours
};
```

### Batch Processing

- Generate multiple variants in parallel
- Batch hashtag validation
- Bulk compliance checks
- Scheduled publishing in batches

### AI Optimization

- Cache AI responses for similar requests
- Use embeddings for content similarity
- Batch AI requests when possible
- Fallback to templates if AI unavailable

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Ready for Tasks
