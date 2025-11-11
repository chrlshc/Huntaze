# Design Document: Smart Onboarding Type Completion

## Overview

This design provides a systematic approach to identify and complete all missing TypeScript type definitions in the smart-onboarding system. Instead of ad-hoc commenting or stubbing, we'll use automated analysis, structured type definition, and validation to achieve 100% type coverage.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Type Completion System                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Type Analyzer   │─────▶│  Missing Types   │            │
│  │                  │      │     Report       │            │
│  └──────────────────┘      └──────────────────┘            │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Type Generator  │─────▶│  Core Types File │            │
│  │                  │      │   (index.ts)     │            │
│  └──────────────────┘      └──────────────────┘            │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Import Fixer     │─────▶│ Service          │            │
│  │                  │      │ Interfaces       │            │
│  └──────────────────┘      └──────────────────┘            │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Build Validator  │─────▶│  Build Success   │            │
│  │                  │      │     Report       │            │
│  └──────────────────┘      └──────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Analysis Strategy

1. **Static Analysis**: Use TypeScript compiler API to identify type errors
2. **Pattern Matching**: Find stub types (`type X = any`) and duplicates
3. **Import Validation**: Check all type imports resolve correctly
4. **Coverage Measurement**: Calculate percentage of properly typed code

## Components and Interfaces

### 1. Type Analyzer Script

**Purpose**: Scan codebase and generate comprehensive report of missing types

**Location**: `scripts/analyze-smart-onboarding-types.js`

**Functionality**:
- Parse TypeScript files using `ts-morph` or TypeScript compiler API
- Identify all stub types (e.g., `type InteractionEvent = any`)
- Find duplicate type definitions across files
- Detect import errors for missing type exports
- Generate structured JSON report

**Output Format**:
```json
{
  "stubTypes": [
    {
      "name": "InteractionEvent",
      "location": "lib/smart-onboarding/interfaces/services.ts:15",
      "usageCount": 12
    }
  ],
  "duplicateTypes": [
    {
      "name": "InteractionEvent",
      "locations": [
        "lib/smart-onboarding/interfaces/services.ts:15",
        "lib/smart-onboarding/interfaces/services.ts:180"
      ]
    }
  ],
  "missingImports": [
    {
      "type": "OnboardingContext",
      "importedFrom": "../types",
      "location": "lib/smart-onboarding/interfaces/services.ts:8"
    }
  ],
  "summary": {
    "totalStubTypes": 3,
    "totalDuplicates": 5,
    "totalMissingImports": 7,
    "filesAnalyzed": 15
  }
}
```

### 2. Type Definition Templates

**Purpose**: Provide structured templates for defining missing types

**Missing Types Identified**:

Based on the analysis of `services.ts`, the following types need to be defined:

#### High Priority Types (Used in Multiple Services)

1. **HelpContent** - Content for contextual help and assistance
2. **ComplexIssue** - Issues that require human escalation
3. **EscalationTicket** - Support ticket for escalated issues
4. **InterventionOutcome** - Result of an intervention
5. **InteractionPattern** - Patterns in user interactions
6. **Intervention** - Individual intervention instance
7. **InterventionTiming** - Timing configuration for interventions
8. **BehaviorPattern** - Detected behavioral patterns
9. **AdaptationTrigger** - Triggers for content adaptation
10. **StepContent** - Content structure for onboarding steps
11. **PersonalizedContent** - Personalized content variations
12. **ContentVariation** - Different versions of content
13. **UserFeedback** - User feedback on interventions

#### Medium Priority Types (Service-Specific)

14. **EngagementRecommendation** - Recommendations to improve engagement
15. **ContentImprovement** - Suggested content improvements
16. **CompletionCriteria** - Criteria for step completion
17. **ValidationRule** - Rules for validating user input
18. **Resource** - Help resources (articles, videos, etc.)

### 3. Core Types File Structure

**Enhanced Structure** for `lib/smart-onboarding/types/index.ts`:

```typescript
// ============================================================================
// CORE DATA MODELS
// ============================================================================
export interface UserProfile { /* existing */ }
export interface OnboardingJourney { /* existing */ }
export interface OnboardingStep { /* existing */ }

// ============================================================================
// INTERACTION AND BEHAVIOR TYPES
// ============================================================================
export interface InteractionPattern {
  type: 'click_pattern' | 'scroll_pattern' | 'navigation_pattern' | 'hesitation_pattern';
  frequency: number;
  confidence: number;
  indicators: string[];
  timeWindow: { start: Date; end: Date };
}

export interface BehaviorPattern {
  type: 'interaction' | 'navigation' | 'learning' | 'engagement' | 'struggle';
  description: string;
  frequency: number;
  strength: number;
  contexts: string[];
}

// ============================================================================
// INTERVENTION TYPES
// ============================================================================
export interface Intervention {
  id: string;
  userId: string;
  type: 'proactive_help' | 'content_adjustment' | 'pace_change' | 'encouragement' | 'clarification';
  trigger: InterventionTrigger;
  content: InterventionContent;
  timing: InterventionTiming;
  effectiveness: InterventionEffectiveness;
  createdAt: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'delivered' | 'accepted' | 'dismissed' | 'completed';
}

export interface InterventionTiming {
  delay: number;
  maxWaitTime: number;
  retryPolicy: RetryPolicy;
  contextualFactors: string[];
}

export interface InterventionOutcome {
  interventionId: string;
  userResponse: 'accepted' | 'dismissed' | 'ignored' | 'completed';
  engagementChange: number;
  completionImpact: number;
  timeToResolution?: number;
  userFeedback?: UserFeedback;
  timestamp: Date;
}

// ============================================================================
// HELP AND SUPPORT TYPES
// ============================================================================
export interface HelpContent {
  id: string;
  type: 'tooltip' | 'tutorial' | 'documentation' | 'video' | 'interactive_guide';
  title: string;
  content: string;
  media?: MediaContent[];
  relatedTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  helpfulness?: number;
}

export interface ComplexIssue {
  id: string;
  userId: string;
  stepId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  attemptedSolutions: string[];
  userFrustrationLevel: number;
  timestamp: Date;
}

export interface EscalationTicket {
  id: string;
  issueId: string;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  description: string;
  context: Record<string, any>;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  resolvedAt?: Date;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================
export interface StepContent {
  text?: string;
  media?: MediaContent[];
  interactive?: InteractiveElement[];
  quiz?: QuizQuestion[];
  tasks?: Task[];
}

export interface PersonalizedContent {
  stepId: string;
  contentVariations: ContentVariation[];
  selectedVariation: string;
  adaptationHistory: ContentAdaptation[];
}

export interface ContentVariation {
  id: string;
  type: 'default' | 'simplified' | 'detailed' | 'visual' | 'interactive';
  content: StepContent;
  targetPersona: PersonaType[];
  effectivenessScore: number;
}

export interface AdaptationTrigger {
  type: 'engagement_drop' | 'confusion_detected' | 'time_exceeded' | 'error_pattern' | 'success_pattern';
  threshold: number;
  timeWindow: number;
}

// ============================================================================
// FEEDBACK AND VALIDATION TYPES
// ============================================================================
export interface UserFeedback {
  rating: number;
  comment?: string;
  helpful: boolean;
  timestamp: Date;
  category?: 'content' | 'pacing' | 'difficulty' | 'clarity' | 'technical';
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'custom' | 'range' | 'length';
  value?: string | RegExp | number;
  message: string;
  severity: 'error' | 'warning';
}

export interface CompletionCriteria {
  type: 'time_based' | 'interaction_based' | 'task_based' | 'assessment_based';
  threshold: number;
  conditions: string[];
  optional?: boolean;
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================
export interface EngagementRecommendation {
  type: 'intervention' | 'content_adjustment' | 'pacing_change' | 'support_offer';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number;
  implementation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface ContentImprovement {
  type: 'clarity' | 'engagement' | 'accessibility' | 'personalization' | 'structure';
  description: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface Resource {
  type: 'article' | 'video' | 'tutorial' | 'documentation' | 'example';
  title: string;
  url: string;
  relevanceScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}
```

### 4. Import Fixer Strategy

**Approach**:
1. Remove duplicate type definitions from `services.ts`
2. Update imports to reference core types file
3. Fix incorrect import names (e.g., `InteractionPattern` vs `InteractionData`)
4. Ensure all imported types are exported from core types

**Example Fix**:

Before:
```typescript
// In services.ts
import { InteractionPattern } from '../types'; // ERROR: not exported

// Stub definition
type InteractionPattern = any;
```

After:
```typescript
// In services.ts
import { InteractionPattern } from '../types'; // Now works

// No stub needed - using real type
```

### 5. Build Validation Process

**Steps**:
1. Run `npm run build` to check for TypeScript errors
2. Run `tsc --noEmit` for type-only validation
3. Use `getDiagnostics` tool to check specific files
4. Generate type coverage report
5. Verify zero type errors before completion

## Data Models

### Type Analysis Report

```typescript
interface TypeAnalysisReport {
  timestamp: Date;
  filesAnalyzed: string[];
  stubTypes: StubTypeInfo[];
  duplicateTypes: DuplicateTypeInfo[];
  missingImports: MissingImportInfo[];
  typeCoverage: TypeCoverageInfo;
  recommendations: string[];
}

interface StubTypeInfo {
  name: string;
  location: string;
  usageCount: number;
  suggestedDefinition?: string;
}

interface DuplicateTypeInfo {
  name: string;
  locations: string[];
  definitions: string[];
  recommendation: 'consolidate' | 'rename' | 'keep_separate';
}

interface MissingImportInfo {
  type: string;
  importedFrom: string;
  location: string;
  availableTypes: string[];
  suggestedFix: string;
}

interface TypeCoverageInfo {
  totalTypes: number;
  properlyTyped: number;
  stubTypes: number;
  anyTypes: number;
  coveragePercentage: number;
}
```

## Error Handling

### Type Definition Errors

**Strategy**: If a type definition is ambiguous or conflicts with existing types:
1. Document the conflict in comments
2. Create a more specific type name if needed
3. Use union types or generics to handle variations
4. Consult existing usage patterns to determine correct shape

### Import Resolution Errors

**Strategy**: If imports cannot be resolved:
1. Check if type exists in target module
2. Add export if type is defined but not exported
3. Move type to correct module if misplaced
4. Create type if it doesn't exist anywhere

### Build Failures

**Strategy**: If build fails after type additions:
1. Check for circular dependencies
2. Verify all imports use correct paths
3. Ensure no conflicting type names
4. Use type aliases to resolve conflicts

## Testing Strategy

### Type Validation Tests

1. **Compilation Test**: Verify `npm run build` succeeds
2. **Type Coverage Test**: Measure percentage of properly typed code
3. **Import Resolution Test**: Verify all imports resolve correctly
4. **No Stub Types Test**: Ensure no `type X = any` remains
5. **No Duplicate Types Test**: Verify single source of truth for each type

### Test Files

```
tests/unit/smart-onboarding/
  ├── type-definitions.test.ts       # Verify all types are defined
  ├── type-imports.test.ts           # Verify imports resolve
  ├── type-coverage.test.ts          # Measure type coverage
  └── build-validation.test.ts       # Verify build succeeds
```

### Success Criteria

- ✅ Zero TypeScript compilation errors
- ✅ Zero stub types (`type X = any`)
- ✅ Zero duplicate type definitions
- ✅ 100% import resolution success
- ✅ Type coverage > 95%
- ✅ Build time < 5 minutes
- ✅ All tests pass

## Implementation Phases

### Phase 1: Analysis (Estimated: 1 hour)
- Create type analyzer script
- Run analysis on smart-onboarding files
- Generate comprehensive report
- Prioritize missing types

### Phase 2: Core Type Definitions (Estimated: 2 hours)
- Define all missing types in core types file
- Add JSDoc comments for documentation
- Organize types into logical sections
- Export all new types

### Phase 3: Import Fixes (Estimated: 1 hour)
- Remove duplicate type definitions
- Update all import statements
- Fix incorrect type names
- Verify all imports resolve

### Phase 4: Validation (Estimated: 30 minutes)
- Run build process
- Check for remaining errors
- Measure type coverage
- Generate final report

### Phase 5: Documentation (Estimated: 30 minutes)
- Document new types
- Update README files
- Create usage examples
- Add migration notes

## Performance Considerations

- **Build Time**: Type additions should not significantly impact build time
- **IDE Performance**: Ensure type definitions don't slow down IDE autocomplete
- **Type Complexity**: Keep type definitions simple and composable
- **Circular Dependencies**: Avoid circular type references

## Security Considerations

- **Type Safety**: Proper types prevent runtime errors and security vulnerabilities
- **Data Validation**: Types should match validation rules
- **API Contracts**: Service interfaces define security boundaries

## Deployment Strategy

1. **Development**: Test type changes locally
2. **Type Check**: Run `tsc --noEmit` to verify
3. **Build**: Run full build to ensure success
4. **Commit**: Commit type changes with clear messages
5. **Deploy**: Deploy with confidence knowing types are correct

## Rollback Plan

If type changes cause issues:
1. Revert to previous commit
2. Identify problematic type definitions
3. Fix issues incrementally
4. Re-test before re-deploying

## Monitoring and Maintenance

- **Type Coverage**: Monitor type coverage percentage over time
- **Build Success Rate**: Track build success after type changes
- **Developer Feedback**: Collect feedback on type usability
- **Regular Audits**: Periodically audit for new stub types or duplicates

