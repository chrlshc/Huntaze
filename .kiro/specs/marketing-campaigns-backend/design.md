# Design Document - Marketing & Campaigns Backend

## Overview

Ce système fournit un backend complet pour la gestion de campagnes marketing multi-plateformes avec automation, A/B testing, analytics, et scheduling. Le frontend existe déjà avec des templates personnalisés, ce design se concentre sur l'implémentation backend.

### Objectifs

1. **CRUD complet** pour campagnes avec persistence
2. **Automation workflows** avec triggers et actions
3. **A/B testing** avec statistical significance
4. **Multi-platform publishing** avec adaptation de contenu
5. **Analytics** avec tracking de performance et ROI

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                          │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  API Routes      │────────▶│  CampaignService             │  │
│  │  /api/campaigns/ │         │  - CRUD operations           │  │
│  │                  │         │  - Template management       │  │
│  └──────────────────┘         │  - A/B testing               │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  AutomationService           │  │
│  │  /api/automations│         │  - Workflow management       │  │
│  │                  │         │  - Trigger execution         │  │
│  └──────────────────┘         │  - Action orchestration      │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  SegmentationService         │  │
│  │  /api/segments/  │         │  - Audience segmentation     │  │
│  │                  │         │  - Dynamic criteria          │  │
│  └──────────────────┘         │  - Performance tracking      │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  API Routes      │────────▶│  CampaignAnalyticsService    │  │
│  │  /api/campaigns/ │         │  - Metrics tracking          │  │
│  │  analytics       │         │  - ROI calculation           │  │
│  └──────────────────┘         │  - Report generation         │  │
│                                └──────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                            │
                                            │ Integrations
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        External Services                         │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  Content         │  │  Publishing      │  │  CloudWatch    ││
│  │  Generation      │  │  Service         │  │  Metrics       ││
│  │  Service         │  │  (Multi-platform)│  │                ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Background Jobs                           │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  Campaign        │  │  Automation      │  │  Analytics     ││
│  │  Scheduler       │  │  Executor        │  │  Aggregator    ││
│  │  (Cron)          │  │  (Event-driven)  │  │  (Hourly)      ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. CampaignService

Service principal pour la gestion des campagnes.

```typescript
export class CampaignService {
  constructor(
    private prisma: PrismaClient,
    private contentService: ContentGenerationService,
    private publishingService: PublishingService,
    private metrics: CloudWatchMetricsService
  ) {}

  // CRUD operations
  async createCampaign(params: CreateCampaignParams): Promise<Campaign>;
  async getCampaign(id: string): Promise<Campaign | null>;
  async updateCampaign(id: string, data: UpdateCampaignParams): Promise<Campaign>;
  async deleteCampaign(id: string): Promise<void>;
  async listCampaigns(filters: CampaignFilters): Promise<PaginatedCampaigns>;
  
  // Template management
  async getTemplates(niche?: string): Promise<CampaignTemplate[]>;
  async createFromTemplate(templateId: string, customization: any): Promise<Campaign>;
  async saveAsTemplate(campaignId: string, name: string): Promise<CampaignTemplate>;
  
  // Campaign lifecycle
  async scheduleCampaign(id: string, scheduledFor: Date): Promise<Campaign>;
  async launchCampaign(id: string): Promise<CampaignLaunchResult>;
  async pauseCampaign(id: string): Promise<Campaign>;
  async resumeCampaign(id: string): Promise<Campaign>;
  async completeCampaign(id: string): Promise<Campaign>;
  
  // A/B testing
  async createABTest(campaignId: string, variants: Variant[]): Promise<ABTest>;
  async trackVariantPerformance(variantId: string, metrics: Metrics): Promise<void>;
  async determineWinner(testId: string): Promise<Variant>;
  async applyWinner(testId: string): Promise<void>;
  
  // Duplication
  async duplicateCampaign(id: string, modifications?: Partial<Campaign>): Promise<Campaign>;
  
  // Multi-platform
  async publishToPlatforms(campaignId: string, platforms: Platform[]): Promise<PublishResult[]>;
}
```

### 2. AutomationService

Service pour les workflows automatisés.

```typescript
export class AutomationService {
  constructor(
    private prisma: PrismaClient,
    private campaignService: CampaignService,
    private segmentService: SegmentationService,
    private eventEmitter: EventEmitter
  ) {}

  // Workflow management
  async createWorkflow(params: CreateWorkflowParams): Promise<Automation>;
  async getWorkflow(id: string): Promise<Automation | null>;
  async updateWorkflow(id: string, data: UpdateWorkflowParams): Promise<Automation>;
  async deleteWorkflow(id: string): Promise<void>;
  async listWorkflows(filters: WorkflowFilters): Promise<PaginatedWorkflows>;
  
  // Workflow lifecycle
  async activateWorkflow(id: string): Promise<Automation>;
  async deactivateWorkflow(id: string): Promise<Automation>;
  
  // Trigger management
  async registerTrigger(workflowId: string, trigger: Trigger): Promise<void>;
  async evaluateTrigger(trigger: Trigger, context: TriggerContext): Promise<boolean>;
  
  // Execution
  async executeWorkflow(workflowId: string, context: ExecutionContext): Promise<ExecutionResult>;
  async executeAction(action: Action, context: ExecutionContext): Promise<ActionResult>;
  
  // History
  async getExecutionHistory(workflowId: string): Promise<Execution[]>;
  async getExecutionStats(workflowId: string): Promise<ExecutionStats>;
}
```

### 3. SegmentationService

Service pour la segmentation d'audience.

```typescript
export class SegmentationService {
  constructor(
    private prisma: PrismaClient,
    private metrics: CloudWatchMetricsService
  ) {}

  // Segment management
  async createSegment(params: CreateSegmentParams): Promise<Segment>;
  async getSegment(id: string): Promise<Segment | null>;
  async updateSegment(id: string, data: UpdateSegmentParams): Promise<Segment>;
  async deleteSegment(id: string): Promise<void>;
  async listSegments(filters: SegmentFilters): Promise<PaginatedSegments>;
  
  // Segment calculation
  async calculateSegmentSize(criteria: SegmentCriteria): Promise<number>;
  async getSegmentMembers(segmentId: string): Promise<User[]>;
  async refreshSegment(segmentId: string): Promise<Segment>;
  
  // Criteria evaluation
  async evaluateCriteria(userId: string, criteria: SegmentCriteria): Promise<boolean>;
  async addUserToSegment(userId: string, segmentId: string): Promise<void>;
  async removeUserFromSegment(userId: string, segmentId: string): Promise<void>;
  
  // Performance
  async getSegmentPerformance(segmentId: string): Promise<SegmentPerformance>;
  async compareSegments(segmentIds: string[]): Promise<SegmentComparison>;
}
```

### 4. CampaignAnalyticsService

Service pour l'analytics des campagnes.

```typescript
export class CampaignAnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private metrics: CloudWatchMetricsService
  ) {}

  // Metrics tracking
  async trackImpression(campaignId: string, userId?: string): Promise<void>;
  async trackClick(campaignId: string, userId: string): Promise<void>;
  async trackConversion(campaignId: string, userId: string, value: number): Promise<void>;
  
  // Analytics retrieval
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics>;
  async getCampaignROI(campaignId: string): Promise<ROIMetrics>;
  async getConversionFunnel(campaignId: string): Promise<FunnelMetrics>;
  
  // Comparison
  async compareCampaigns(campaignIds: string[]): Promise<CampaignComparison>;
  async comparePlatforms(campaignId: string): Promise<PlatformComparison>;
  
  // Reports
  async generateReport(campaignId: string, format: 'json' | 'csv' | 'pdf'): Promise<Report>;
  async getPerformanceTrends(userId: string, timeframe: Timeframe): Promise<TrendData>;
  
  // Insights
  async getTopPerformingCampaigns(userId: string, limit: number): Promise<Campaign[]>;
  async identifyPatterns(userId: string): Promise<Pattern[]>;
  async getRecommendations(userId: string): Promise<Recommendation[]>;
}
```

## Data Models

### Prisma Schema Extensions

```prisma
// Campaign
model Campaign {
  id              String   @id @default(cuid())
  userId          String
  name            String
  description     String?
  type            String   // ppv, subscription, promotion, engagement, retention
  status          String   // draft, scheduled, active, paused, completed, cancelled
  
  // Targeting
  platforms       String[] // onlyfans, instagram, tiktok, reddit
  segmentIds      String[]
  
  // Content
  content         Json     // Platform-specific content
  mediaUrls       String[]
  
  // Scheduling
  scheduledFor    DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Budget
  budget          Float?
  spent           Float    @default(0)
  
  // Goals
  goals           Json     // { conversions: 100, revenue: 5000, engagement: 1000 }
  
  // A/B Testing
  isABTest        Boolean  @default(false)
  abTestId        String?
  
  // Template
  templateId      String?
  isTemplate      Boolean  @default(false)
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  metrics         CampaignMetric[]
  automations     Automation[]
  abTest          ABTest?  @relation(fields: [abTestId], references: [id])
  
  @@index([userId])
  @@index([status])
  @@index([scheduledFor])
  @@map("campaigns")
}

// Campaign Template
model CampaignTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  niche           String   // fitness, gaming, adult, fashion, general
  type            String   // ppv, subscription, promotion, engagement, retention
  
  // Template content
  content         Json
  defaultSettings Json
  
  // Usage stats
  usageCount      Int      @default(0)
  avgPerformance  Float?
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([niche])
  @@index([type])
  @@map("campaign_templates")
}

// A/B Test
model ABTest {
  id              String   @id @default(cuid())
  userId          String
  name            String
  status          String   // running, completed, cancelled
  
  // Test configuration
  trafficSplit    Json     // { variantA: 50, variantB: 50 }
  minSampleSize   Int      @default(100)
  confidenceLevel Float    @default(0.95)
  
  // Results
  winnerId        String?
  significance    Float?
  
  // Dates
  startedAt       DateTime?
  completedAt     DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  campaigns       Campaign[]
  variants        ABTestVariant[]
  
  @@index([userId])
  @@index([status])
  @@map("ab_tests")
}

model ABTestVariant {
  id              String   @id @default(cuid())
  testId          String
  name            String
  isControl       Boolean  @default(false)
  
  // Content
  content         Json
  
  // Metrics
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  conversions     Int      @default(0)
  revenue         Float    @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  test            ABTest   @relation(fields: [testId], references: [id])
  
  @@index([testId])
  @@map("ab_test_variants")
}

// Automation
model Automation {
  id              String   @id @default(cuid())
  userId          String
  name            String
  description     String?
  status          String   // active, paused, archived
  
  // Workflow definition
  trigger         Json     // { type: 'time' | 'event' | 'behavior', config: {...} }
  conditions      Json[]   // Array of conditions to evaluate
  actions         Json[]   // Array of actions to execute
  
  // Execution stats
  executionCount  Int      @default(0)
  successCount    Int      @default(0)
  failureCount    Int      @default(0)
  lastExecutedAt  DateTime?
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  executions      AutomationExecution[]
  campaigns       Campaign[]
  
  @@index([userId])
  @@index([status])
  @@map("automations")
}

model AutomationExecution {
  id              String   @id @default(cuid())
  automationId    String
  status          String   // success, failure, partial
  
  // Execution details
  triggerData     Json
  executedActions Json[]
  errors          Json[]
  
  // Timing
  startedAt       DateTime
  completedAt     DateTime?
  duration        Int?     // milliseconds
  
  automation      Automation @relation(fields: [automationId], references: [id])
  
  @@index([automationId])
  @@index([startedAt])
  @@map("automation_executions")
}

// Segment
model Segment {
  id              String   @id @default(cuid())
  userId          String
  name            String
  description     String?
  type            String   // static, dynamic
  
  // Criteria
  criteria        Json     // { spendingLevel: 'high', engagement: '>50', ... }
  
  // Stats
  memberCount     Int      @default(0)
  lastRefreshedAt DateTime?
  
  // Performance
  avgEngagement   Float?
  avgRevenue      Float?
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  members         SegmentMember[]
  
  @@index([userId])
  @@index([type])
  @@map("segments")
}

model SegmentMember {
  id              String   @id @default(cuid())
  segmentId       String
  userId          String
  
  // Metadata
  addedAt         DateTime @default(now())
  
  segment         Segment  @relation(fields: [segmentId], references: [id])
  
  @@unique([segmentId, userId])
  @@index([segmentId])
  @@index([userId])
  @@map("segment_members")
}

// Campaign Metrics
model CampaignMetric {
  id              String   @id @default(cuid())
  campaignId      String
  platform        String?  // null for aggregated
  
  // Metrics
  impressions     Int      @default(0)
  reach           Int      @default(0)
  clicks          Int      @default(0)
  conversions     Int      @default(0)
  revenue         Float    @default(0)
  spent           Float    @default(0)
  
  // Calculated
  ctr             Float?   // Click-through rate
  conversionRate  Float?
  roi             Float?
  cpa             Float?   // Cost per acquisition
  
  // Timestamp
  recordedAt      DateTime @default(now())
  
  campaign        Campaign @relation(fields: [campaignId], references: [id])
  
  @@index([campaignId])
  @@index([recordedAt])
  @@map("campaign_metrics")
}

// Campaign Conversion
model CampaignConversion {
  id              String   @id @default(cuid())
  campaignId      String
  userId          String
  
  // Conversion details
  type            String   // purchase, subscription, click, engagement
  value           Float
  
  // Attribution
  platform        String
  clickedAt       DateTime?
  convertedAt     DateTime
  timeToConvert   Int?     // seconds
  
  @@index([campaignId])
  @@index([userId])
  @@index([convertedAt])
  @@map("campaign_conversions")
}
```

## Campaign Templates by Niche

### Fitness Templates

```typescript
const FITNESS_TEMPLATES = [
  {
    name: "30-Day Workout Challenge",
    type: "ppv",
    content: {
      title: "Transform Your Body in 30 Days! 💪",
      description: "Join my exclusive 30-day workout challenge with daily routines, meal plans, and personal coaching.",
      cta: "Start Your Transformation",
      price: 49.99
    },
    goals: { conversions: 50, revenue: 2500 },
    estimatedROI: 3.2
  },
  {
    name: "Meal Plan Bundle",
    type: "subscription",
    content: {
      title: "Weekly Meal Plans + Recipes 🥗",
      description: "Get personalized meal plans every week with macro tracking and shopping lists.",
      cta: "Subscribe Now",
      price: 29.99
    },
    goals: { conversions: 100, revenue: 3000 },
    estimatedROI: 2.8
  }
];
```

### Gaming Templates

```typescript
const GAMING_TEMPLATES = [
  {
    name: "Exclusive Stream Access",
    type: "subscription",
    content: {
      title: "VIP Stream Access 🎮",
      description: "Get exclusive access to private streams, behind-the-scenes content, and gaming sessions.",
      cta: "Join VIP",
      price: 19.99
    },
    goals: { conversions: 200, revenue: 4000 },
    estimatedROI: 4.5
  },
  {
    name: "Game Tutorial Series",
    type: "ppv",
    content: {
      title: "Master [Game Name] - Pro Tips 🏆",
      description: "Learn advanced strategies and techniques from a pro player.",
      cta: "Get Tutorial",
      price: 14.99
    },
    goals: { conversions: 150, revenue: 2250 },
    estimatedROI: 3.8
  }
];
```

### Adult Templates

```typescript
const ADULT_TEMPLATES = [
  {
    name: "VIP Subscription Tier",
    type: "subscription",
    content: {
      title: "VIP Access - Exclusive Content 💎",
      description: "Get access to exclusive content, custom requests, and priority messaging.",
      cta: "Upgrade to VIP",
      price: 49.99
    },
    goals: { conversions: 100, revenue: 5000 },
    estimatedROI: 5.2
  },
  {
    name: "Custom Content Offer",
    type: "ppv",
    content: {
      title: "Custom Content Just for You ✨",
      description: "Request personalized content tailored to your preferences.",
      cta: "Request Custom",
      price: 99.99
    },
    goals: { conversions: 50, revenue: 5000 },
    estimatedROI: 6.8
  }
];
```

## Automation Workflows

### Welcome Series

```typescript
const WELCOME_AUTOMATION = {
  name: "New Fan Welcome Series",
  trigger: {
    type: "event",
    event: "fan.subscribed"
  },
  actions: [
    {
      type: "wait",
      duration: "5 minutes"
    },
    {
      type: "send_message",
      template: "welcome_message",
      personalize: true
    },
    {
      type: "wait",
      duration: "24 hours"
    },
    {
      type: "send_message",
      template: "content_showcase",
      includeMedia: true
    },
    {
      type: "wait",
      duration: "3 days"
    },
    {
      type: "check_engagement",
      condition: "engagement < 1",
      ifTrue: {
        type: "send_message",
        template: "re_engagement"
      }
    }
  ]
};
```

### Re-engagement Campaign

```typescript
const RE_ENGAGEMENT_AUTOMATION = {
  name: "Win Back Inactive Fans",
  trigger: {
    type: "behavior",
    condition: "no_activity_days >= 14"
  },
  conditions: [
    { field: "subscription_status", operator: "equals", value: "active" },
    { field: "lifetime_value", operator: ">=", value: 50 }
  ],
  actions: [
    {
      type: "create_campaign",
      template: "win_back_offer",
      discount: 0.25
    },
    {
      type: "send_message",
      template: "we_miss_you",
      includeOffer: true
    },
    {
      type: "wait",
      duration: "7 days"
    },
    {
      type: "check_engagement",
      condition: "engagement > 0",
      ifFalse: {
        type: "add_to_segment",
        segment: "at_risk_fans"
      }
    }
  ]
};
```

## A/B Testing Strategy

### Statistical Significance Calculation

```typescript
function calculateSignificance(
  variantA: VariantMetrics,
  variantB: VariantMetrics
): { significant: boolean; pValue: number; winner: 'A' | 'B' | 'tie' } {
  // Z-test for proportions
  const p1 = variantA.conversions / variantA.impressions;
  const p2 = variantB.conversions / variantB.impressions;
  
  const pooledP = (variantA.conversions + variantB.conversions) / 
                  (variantA.impressions + variantB.impressions);
  
  const se = Math.sqrt(pooledP * (1 - pooledP) * 
                      (1/variantA.impressions + 1/variantB.impressions));
  
  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  const significant = pValue < 0.05;
  const winner = p1 > p2 ? 'A' : p1 < p2 ? 'B' : 'tie';
  
  return { significant, pValue, winner };
}
```

### Minimum Sample Sizes

```typescript
const MIN_SAMPLE_SIZE = {
  impressions: 1000,  // Per variant
  clicks: 100,        // Per variant
  conversions: 30,    // Per variant
};

// Confidence level: 95%
// Minimum detectable effect: 10%
```

## Error Handling

### Campaign Errors

- Invalid campaign data → Return validation errors
- Platform API failures → Retry with exponential backoff
- Budget exceeded → Pause campaign automatically
- Scheduling conflicts → Alert user

### Automation Errors

- Trigger evaluation failure → Log and skip
- Action execution failure → Retry 3 times, then alert
- Workflow timeout → Cancel and notify
- Circular dependencies → Detect and prevent

## Testing Strategy

### Unit Tests

**CampaignService:**
- Campaign CRUD operations
- Template management
- A/B test creation and winner selection
- Budget tracking

**AutomationService:**
- Workflow creation and execution
- Trigger evaluation
- Action orchestration
- Error handling

**SegmentationService:**
- Segment creation and calculation
- Criteria evaluation
- Dynamic segment updates

### Integration Tests

**API Routes:**
- POST `/api/campaigns` → Creates campaign
- GET `/api/campaigns/:id` → Returns campaign
- PUT `/api/campaigns/:id` → Updates campaign
- DELETE `/api/campaigns/:id` → Deletes campaign
- POST `/api/campaigns/:id/launch` → Launches campaign
- POST `/api/campaigns/:id/ab-test` → Creates A/B test

**Automation Workflows:**
- Welcome series execution
- Re-engagement campaign
- Scheduled campaigns

### E2E Tests

**Complete Flows:**
1. Create campaign → Schedule → Launch → Track metrics
2. Create A/B test → Run → Determine winner → Apply
3. Create automation → Trigger → Execute actions → Verify results
4. Create segment → Add members → Launch targeted campaign

## Monitoring and Observability

### CloudWatch Metrics

**Campaign Metrics:**
- `CampaignsCreated` (Count)
- `CampaignsLaunched` (Count)
- `CampaignConversions` (Count)
- `CampaignRevenue` (Sum)
- `CampaignROI` (Average)

**Automation Metrics:**
- `AutomationsExecuted` (Count)
- `AutomationSuccessRate` (Percentage)
- `AutomationExecutionTime` (Milliseconds)

**A/B Test Metrics:**
- `ABTestsCreated` (Count)
- `ABTestsCompleted` (Count)
- `WinnerDeterminationAccuracy` (Percentage)

### CloudWatch Alarms

1. **High Campaign Failure Rate** (>5%)
2. **Low Conversion Rate** (<1%)
3. **Budget Overspend** (>110% of budget)
4. **Automation Failures** (>10 failures/hour)

### Dashboard

**Widgets:**
- Campaigns by status (pie chart)
- Campaign performance over time (line chart)
- Top performing campaigns (table)
- A/B test results (comparison chart)
- Automation execution stats (bar chart)
- ROI by campaign type (bar chart)

## Security Considerations

### Access Control

- User can only access their own campaigns
- Team members have role-based permissions
- API keys encrypted in database

### Data Privacy

- PII anonymized in analytics
- GDPR compliance for user data
- Audit trail for all operations

### Rate Limiting

- API rate limits per user
- Campaign launch throttling
- Automation execution limits

## Performance Considerations

### Caching Strategy

```typescript
const CACHE_TTL = {
  campaignTemplates: 3600,    // 1 hour
  segmentSize: 300,           // 5 minutes
  campaignMetrics: 60,        // 1 minute
  automationRules: 1800,      // 30 minutes
};
```

### Batch Processing

- Metrics aggregation (hourly)
- Segment refresh (daily)
- Report generation (on-demand)

### Database Optimization

- Indexes on frequently queried fields
- Partitioning for metrics tables
- Archiving old campaigns

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Ready for Tasks

