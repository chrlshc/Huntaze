# Design Document - Adaptive Onboarding System

## Overview

The Adaptive Onboarding System provides an intelligent, progressive setup experience that configures Huntaze based on user skill level and goals. The system dynamically unlocks features as users connect platforms and complete setup steps, similar to Shopify's onboarding flow but with AI-powered personalization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Onboarding Wizard  │  Progress Tracker  │  Feature Tours   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Onboarding Orchestrator                    │
├─────────────────────────────────────────────────────────────┤
│  Step Manager  │  Progress Calculator  │  Path Generator    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Core Services                           │
├──────────────────┬──────────────────┬──────────────────────┤
│  Level Assessor  │  Feature Unlocker│  AI Adapter          │
└──────────────────┴──────────────────┴──────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├──────────────────┬──────────────────┬──────────────────────┤
│  User Profiles   │  Progress State  │  Analytics Events    │
└──────────────────┴──────────────────┴──────────────────────┘
```

### System Components

#### 1. Onboarding Wizard (UI Component)
- Multi-step form interface
- Step navigation and validation
- Contextual help and tooltips
- Responsive design for mobile/desktop

#### 2. Progress Tracker (UI Component)
- Visual progress indicator
- Checklist of completed/pending steps
- Feature unlock notifications
- Estimated time remaining

#### 3. Onboarding Orchestrator (Service)
- Manages onboarding flow state
- Coordinates between services
- Handles step transitions
- Persists progress

#### 4. Level Assessor (Service)
- Evaluates creator level questionnaire
- Assigns appropriate tier
- Provides level recommendations
- Handles level changes

#### 5. Feature Unlocker (Service)
- Tracks feature unlock conditions
- Evaluates unlock requirements
- Triggers feature availability
- Manages feature gates

#### 6. AI Adapter (Service)
- Configures AI behavior per level
- Adjusts response complexity
- Personalizes suggestions
- Manages AI context

## Components and Interfaces

### Database Schema

```typescript
// User Onboarding Profile
interface OnboardingProfile {
  userId: string;
  creatorLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primaryGoals: string[]; // ['content_creation', 'audience_growth', 'monetization']
  completedSteps: string[];
  skippedSteps: string[];
  currentStep: string;
  progressPercentage: number;
  startedAt: Date;
  completedAt: Date | null;
  estimatedTimeRemaining: number; // minutes
  customPath: OnboardingStep[];
}

// Feature Unlock State
interface FeatureUnlockState {
  userId: string;
  unlockedFeatures: string[];
  lockedFeatures: FeatureLock[];
  lastUnlockAt: Date;
}

interface FeatureLock {
  featureId: string;
  requirements: UnlockRequirement[];
  priority: number;
}

interface UnlockRequirement {
  type: 'platform_connection' | 'step_completion' | 'time_based';
  condition: string;
  met: boolean;
}

// Onboarding Analytics
interface OnboardingEvent {
  userId: string;
  eventType: 'step_started' | 'step_completed' | 'step_skipped' | 'feature_unlocked';
  stepId: string;
  timestamp: Date;
  duration: number; // seconds
  metadata: Record<string, any>;
}
```

### API Endpoints

```typescript
// Onboarding Management
POST   /api/onboarding/start
GET    /api/onboarding/status
POST   /api/onboarding/step/:stepId/complete
POST   /api/onboarding/step/:stepId/skip
PATCH  /api/onboarding/creator-level
GET    /api/onboarding/path

// Feature Management
GET    /api/features/unlocked
GET    /api/features/locked
POST   /api/features/:featureId/unlock
GET    /api/features/:featureId/requirements

// Progress Tracking
GET    /api/onboarding/progress
GET    /api/onboarding/analytics
POST   /api/onboarding/event
```

### Service Interfaces

```typescript
// Onboarding Orchestrator
interface OnboardingOrchestrator {
  startOnboarding(userId: string, goals: string[]): Promise<OnboardingProfile>;
  getProgress(userId: string): Promise<OnboardingProgress>;
  completeStep(userId: string, stepId: string): Promise<void>;
  skipStep(userId: string, stepId: string): Promise<void>;
  generatePath(userId: string, goals: string[]): Promise<OnboardingStep[]>;
}

// Level Assessor
interface LevelAssessor {
  assessLevel(responses: QuestionnaireResponse[]): CreatorLevel;
  updateLevel(userId: string, newLevel: CreatorLevel): Promise<void>;
  getRecommendedLevel(userId: string): Promise<CreatorLevel>;
}

// Feature Unlocker
interface FeatureUnlocker {
  checkUnlockConditions(userId: string): Promise<string[]>;
  unlockFeature(userId: string, featureId: string): Promise<void>;
  getLockedFeatures(userId: string): Promise<FeatureLock[]>;
  evaluateRequirements(userId: string, requirements: UnlockRequirement[]): Promise<boolean>;
}

// AI Adapter
interface AIAdapter {
  configureForLevel(level: CreatorLevel): AIConfig;
  adjustComplexity(level: CreatorLevel, content: string): string;
  generateSuggestions(userId: string, context: string): Promise<string[]>;
}
```

## Data Models

### Creator Levels

```typescript
enum CreatorLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

interface LevelConfig {
  level: CreatorLevel;
  aiVerbosity: 'detailed' | 'balanced' | 'concise' | 'minimal';
  uiComplexity: 'simple' | 'standard' | 'advanced' | 'expert';
  featureRecommendations: string[];
  helpFrequency: 'high' | 'medium' | 'low' | 'minimal';
}

const LEVEL_CONFIGS: Record<CreatorLevel, LevelConfig> = {
  [CreatorLevel.BEGINNER]: {
    level: CreatorLevel.BEGINNER,
    aiVerbosity: 'detailed',
    uiComplexity: 'simple',
    featureRecommendations: ['basic_content', 'simple_scheduling'],
    helpFrequency: 'high'
  },
  [CreatorLevel.INTERMEDIATE]: {
    level: CreatorLevel.INTERMEDIATE,
    aiVerbosity: 'balanced',
    uiComplexity: 'standard',
    featureRecommendations: ['content_variations', 'analytics_basic'],
    helpFrequency: 'medium'
  },
  [CreatorLevel.ADVANCED]: {
    level: CreatorLevel.ADVANCED,
    aiVerbosity: 'concise',
    uiComplexity: 'advanced',
    featureRecommendations: ['advanced_analytics', 'automation'],
    helpFrequency: 'low'
  },
  [CreatorLevel.EXPERT]: {
    level: CreatorLevel.EXPERT,
    aiVerbosity: 'minimal',
    uiComplexity: 'expert',
    featureRecommendations: ['api_access', 'custom_workflows'],
    helpFrequency: 'minimal'
  }
};
```

### Onboarding Steps

```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'required' | 'recommended' | 'optional';
  category: 'account' | 'platforms' | 'content' | 'ai' | 'preferences';
  estimatedMinutes: number;
  dependencies: string[]; // step IDs that must be completed first
  unlocks: string[]; // feature IDs that unlock upon completion
  component: string; // React component name
  validationRules: ValidationRule[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'creator_assessment',
    title: 'Tell us about your experience',
    description: 'Help us personalize your experience',
    type: 'required',
    category: 'account',
    estimatedMinutes: 2,
    dependencies: [],
    unlocks: [],
    component: 'CreatorAssessment',
    validationRules: []
  },
  {
    id: 'goal_selection',
    title: 'What are your goals?',
    description: 'Select your primary objectives',
    type: 'required',
    category: 'account',
    estimatedMinutes: 1,
    dependencies: ['creator_assessment'],
    unlocks: [],
    component: 'GoalSelection',
    validationRules: [{ field: 'goals', rule: 'min_length', value: 1 }]
  },
  {
    id: 'first_platform',
    title: 'Connect your first platform',
    description: 'Link your social media account',
    type: 'required',
    category: 'platforms',
    estimatedMinutes: 3,
    dependencies: ['goal_selection'],
    unlocks: ['basic_content_creation'],
    component: 'PlatformConnection',
    validationRules: []
  },
  {
    id: 'ai_configuration',
    title: 'Configure AI assistant',
    description: 'Set up your AI preferences',
    type: 'recommended',
    category: 'ai',
    estimatedMinutes: 2,
    dependencies: ['first_platform'],
    unlocks: ['ai_content_generation'],
    component: 'AIConfiguration',
    validationRules: []
  },
  {
    id: 'additional_platforms',
    title: 'Connect more platforms',
    description: 'Add more social accounts',
    type: 'optional',
    category: 'platforms',
    estimatedMinutes: 5,
    dependencies: ['first_platform'],
    unlocks: ['cross_platform_scheduling', 'unified_analytics'],
    component: 'AdditionalPlatforms',
    validationRules: []
  }
];
```

### Feature Unlock Rules

```typescript
interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  unlockRequirements: UnlockRequirement[];
  minCreatorLevel: CreatorLevel | null;
  icon: string;
  priority: number;
}

const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    id: 'basic_content_creation',
    name: 'Content Creation',
    description: 'Create and edit content for your platforms',
    category: 'content',
    unlockRequirements: [
      { type: 'platform_connection', condition: 'any', met: false }
    ],
    minCreatorLevel: null,
    icon: 'edit',
    priority: 1
  },
  {
    id: 'cross_platform_scheduling',
    name: 'Cross-Platform Scheduling',
    description: 'Schedule content across multiple platforms',
    category: 'scheduling',
    unlockRequirements: [
      { type: 'platform_connection', condition: 'count >= 2', met: false }
    ],
    minCreatorLevel: CreatorLevel.INTERMEDIATE,
    icon: 'calendar',
    priority: 2
  },
  {
    id: 'ai_content_generation',
    name: 'AI Content Generation',
    description: 'Generate content with AI assistance',
    category: 'ai',
    unlockRequirements: [
      { type: 'step_completion', condition: 'ai_configuration', met: false }
    ],
    minCreatorLevel: null,
    icon: 'sparkles',
    priority: 3
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into your content performance',
    category: 'analytics',
    unlockRequirements: [
      { type: 'platform_connection', condition: 'count >= 2', met: false },
      { type: 'time_based', condition: 'days_active >= 7', met: false }
    ],
    minCreatorLevel: CreatorLevel.ADVANCED,
    icon: 'chart',
    priority: 4
  },
  {
    id: 'crm_messaging',
    name: 'CRM & Messaging',
    description: 'Manage fan relationships and messages',
    category: 'crm',
    unlockRequirements: [
      { type: 'platform_connection', condition: 'onlyfans', met: false }
    ],
    minCreatorLevel: null,
    icon: 'messages',
    priority: 5
  }
];
```

## Error Handling

### Error Types

```typescript
enum OnboardingError {
  INVALID_STEP = 'INVALID_STEP',
  DEPENDENCY_NOT_MET = 'DEPENDENCY_NOT_MET',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PLATFORM_CONNECTION_FAILED = 'PLATFORM_CONNECTION_FAILED',
  FEATURE_UNLOCK_FAILED = 'FEATURE_UNLOCK_FAILED',
  PROGRESS_SAVE_FAILED = 'PROGRESS_SAVE_FAILED'
}

interface OnboardingErrorResponse {
  error: OnboardingError;
  message: string;
  details?: any;
  retryable: boolean;
  suggestedAction?: string;
}
```

### Error Handling Strategy

1. **Validation Errors**: Display inline with specific field guidance
2. **Connection Errors**: Provide retry mechanism with troubleshooting tips
3. **Save Errors**: Auto-retry with exponential backoff, show warning if persistent
4. **Dependency Errors**: Redirect to required step with explanation
5. **Feature Unlock Errors**: Log silently, retry on next check

## Testing Strategy

### Unit Tests
- Level assessment logic
- Feature unlock condition evaluation
- Progress calculation
- Path generation algorithms
- AI configuration adaptation

### Integration Tests
- Complete onboarding flow
- Platform connection workflow
- Feature unlock triggers
- Progress persistence
- Multi-step navigation

### E2E Tests
- Full onboarding journey for each creator level
- Platform connection flows
- Feature discovery experience
- Progress recovery after interruption
- Re-onboarding for existing users

### Performance Tests
- Onboarding load time < 2s
- Step transition < 500ms
- Progress save < 1s
- Feature unlock check < 500ms

## Security Considerations

1. **Data Privacy**: Onboarding responses encrypted at rest
2. **OAuth Security**: Platform connections use secure token storage
3. **Progress Integrity**: Validate step completion server-side
4. **Feature Gates**: Enforce unlock requirements on backend
5. **Analytics**: Anonymize user data in analytics aggregation

## Deployment Strategy

### Phase 1: Core Onboarding (Week 1-2)
- Basic wizard UI
- Creator level assessment
- Progress tracking
- Database schema

### Phase 2: Feature Unlocking (Week 3)
- Feature gate system
- Unlock condition evaluation
- Feature announcements
- Platform connection integration

### Phase 3: AI Adaptation (Week 4)
- AI configuration per level
- Content suggestion adaptation
- Help system integration

### Phase 4: Analytics & Optimization (Week 5)
- Event tracking
- Analytics dashboard
- A/B testing framework
- Performance optimization

## Monitoring and Metrics

### Key Metrics
- Onboarding completion rate
- Average time to complete
- Drop-off points
- Feature unlock rate
- Creator level distribution
- Platform connection success rate

### Alerts
- Completion rate drops below 70%
- Average time exceeds 15 minutes
- Platform connection failure rate > 10%
- Feature unlock failures

## Future Enhancements

1. **Video Tutorials**: Embedded video guides for each step
2. **Live Chat Support**: Real-time help during onboarding
3. **Gamification**: Badges and rewards for completion
4. **Social Proof**: Show popular choices and success stories
5. **Mobile App**: Native onboarding experience
6. **Multi-language**: Localized onboarding flows
7. **Team Onboarding**: Collaborative setup for agencies
8. **Import Wizard**: Migrate data from competitors
