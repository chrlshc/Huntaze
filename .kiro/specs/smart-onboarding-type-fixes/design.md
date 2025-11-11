# Design Document

## Overview

This design addresses the type mismatch between the `OnboardingJourney` interface and its usage in the smart onboarding orchestrator. The solution involves extending the `OnboardingJourney` interface to include all properties that are accessed by the orchestrator code, ensuring type safety and build success.

## Architecture

### Current State

The `OnboardingJourney` interface in `lib/smart-onboarding/types/index.ts` currently has:
- `currentStep: OnboardingStep`
- `completedSteps: OnboardingStep[]`
- `personalizedPath: LearningPath`
- `engagementHistory: EngagementMetric[]`
- `interventions: Intervention[]`
- `predictedSuccessRate: number`
- `estimatedCompletionTime: number`
- `adaptationHistory: AdaptationEvent[]`
- `startedAt: Date`
- `lastActiveAt: Date`
- `completedAt?: Date`
- `status: 'active' | 'paused' | 'completed' | 'abandoned'`

### Required State

The orchestrator code expects these additional properties:
- `steps: OnboardingStep[]` - Array of all journey steps with their status
- `currentStepIndex: number` - Index of the current step in the steps array
- `personalization: PersonalizationData` - Tracks intervention and adaptation history
- `progress: ProgressData` - Tracks completion metrics and time estimates
- `metadata: Record<string, any>` - Flexible storage for additional journey data

## Components and Interfaces

### 1. Extended OnboardingJourney Interface

```typescript
export interface OnboardingJourney extends UserAssociatedEntity, TimestampedEntity {
  // Existing properties
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  personalizedPath: LearningPath;
  engagementHistory: EngagementMetric[];
  interventions: Intervention[];
  predictedSuccessRate: number;
  estimatedCompletionTime: number;
  adaptationHistory: AdaptationEvent[];
  startedAt: Date;
  lastActiveAt: Date;
  completedAt?: Date;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  
  // New properties for orchestrator compatibility
  steps: OnboardingStep[];
  currentStepIndex: number;
  personalization: PersonalizationData;
  progress: ProgressData;
  metadata: Record<string, any>;
}
```

### 2. Supporting Type Definitions

```typescript
export interface PersonalizationData {
  interventionHistory: Array<{
    timestamp: Date;
    interventions: any[];
    stepIndex: number;
  }>;
  adaptationHistory: Array<{
    timestamp: Date;
    adaptation: AdaptationDecision;
    stepIndex: number;
    trigger: string;
  }>;
}

export interface ProgressData {
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  engagementScore: number;
}
```

### 3. OnboardingStep Extension

The `OnboardingStep` interface needs additional properties for tracking:

```typescript
export interface OnboardingStep {
  id: string;
  type: 'introduction' | 'assessment' | 'tutorial' | 'practice' | 'configuration' | 'completion' | 'preparation';
  title: string;
  description: string;
  content: StepContent;
  estimatedTime: number;
  difficulty: number;
  isOptional: boolean;
  adaptationPoints: AdaptationPoint[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  result?: StepResult;
  
  // Additional properties from OptimizedStep
  prerequisites?: string[];
  learningObjectives?: string[];
  adaptationRules?: AdaptationRule[];
  completionCriteria?: CompletionCriteria;
  personalizedContent?: PersonalizedContent;
  adaptationTriggers?: AdaptationTrigger[];
  successPrediction?: number;
}
```

## Data Models

### Journey State Transitions

```
not_started → active → completed
                ↓
              paused → active
                ↓
            abandoned
```

### Step State Transitions

```
pending → in_progress → completed
            ↓
          skipped
```

## Error Handling

### Type Safety Errors

1. **Missing Property Access**: When code tries to access a property that doesn't exist on the type
   - Solution: Add the property to the interface with the correct type
   - Fallback: Provide default values during initialization

2. **Type Mismatch**: When a property exists but has the wrong type
   - Solution: Update the type definition to match actual usage
   - Validation: Ensure database schema matches the type definition

3. **Null/Undefined Access**: When optional properties are accessed without checking
   - Solution: Use optional chaining (`?.`) or provide default values
   - Validation: Initialize all required properties during journey creation

### Database Serialization

1. **JSON Serialization**: Complex objects need to be serialized for database storage
   - Solution: Use `JSON.stringify()` for complex types
   - Deserialization: Use `JSON.parse()` when loading from database

2. **Date Handling**: Dates need special handling during serialization
   - Solution: Store as ISO strings, convert back to Date objects on load
   - Validation: Ensure date fields are properly typed

## Testing Strategy

### Unit Tests

1. **Type Validation Tests**
   - Verify all properties are accessible
   - Verify types match expected values
   - Test default value initialization

2. **Journey State Management Tests**
   - Test journey creation with all properties
   - Test journey updates preserve existing data
   - Test step progression updates indices correctly

3. **Serialization Tests**
   - Test database storage serializes correctly
   - Test database loading deserializes correctly
   - Test date handling in serialization

### Integration Tests

1. **Orchestrator Integration**
   - Test full journey lifecycle
   - Test real-time adaptations
   - Test intervention application

2. **Build Validation**
   - Verify TypeScript compilation succeeds
   - Verify no type errors in orchestrator
   - Verify generated JavaScript is valid

## Implementation Approach

### Phase 1: Type Definition Updates
1. Update `OnboardingJourney` interface in `types/index.ts`
2. Add `PersonalizationData` and `ProgressData` interfaces
3. Update `OnboardingStep` interface with missing properties

### Phase 2: Orchestrator Compatibility
1. Update journey initialization to set all new properties
2. Ensure all property accesses are type-safe
3. Add default values for optional properties

### Phase 3: Validation and Testing
1. Run TypeScript compiler to verify no errors
2. Test journey creation and updates
3. Verify database serialization works correctly

## Migration Considerations

### Existing Data

If there are existing journeys in the database:
1. Add migration script to add missing fields
2. Set default values for new properties
3. Validate data integrity after migration

### Backward Compatibility

Ensure changes don't break existing code:
1. Make new properties optional where possible
2. Provide default values during initialization
3. Update all code that creates or updates journeys

## Performance Considerations

1. **Memory Usage**: Additional properties increase memory footprint
   - Mitigation: Only store necessary data in memory
   - Use database for historical data

2. **Serialization Overhead**: More properties mean more serialization time
   - Mitigation: Only serialize when persisting to database
   - Use caching to reduce database round-trips

3. **Type Checking**: More complex types increase compilation time
   - Impact: Minimal, TypeScript compilation is already fast
   - Benefit: Catch errors at compile time instead of runtime
