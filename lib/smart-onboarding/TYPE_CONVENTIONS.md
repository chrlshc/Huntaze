# Smart Onboarding Type System Conventions

## Overview

This document defines the conventions and standards for the Smart Onboarding type system to ensure consistency, maintainability, and clarity.

## Naming Conventions

### Interfaces and Types
- **PascalCase**: All interface and type names use PascalCase
  - ✅ `UserProfile`, `OnboardingJourney`, `InterventionPlan`
  - ❌ `userProfile`, `onboarding_journey`, `interventionPlan`

### Properties
- **camelCase**: All property names use camelCase
  - ✅ `userId`, `createdAt`, `engagementScore`
  - ❌ `UserId`, `created_at`, `EngagementScore`
- **snake_case**: Allowed only for specific technical fields that match external APIs
  - ✅ `user_id` (when matching external API)
  - Use sparingly and document the reason

## Optional Properties

### When to Use Optional Properties

Properties should be marked as optional (`?`) when:

1. **Conditional Existence**: The property may not exist in all instances
   ```typescript
   interface OnboardingJourney {
     completedAt?: Date;  // Only exists when journey is completed
   }
   ```

2. **Progressive Enhancement**: The property is added later in the lifecycle
   ```typescript
   interface Intervention {
     deliveredAt?: Date;  // Set when intervention is delivered
     completedAt?: Date;  // Set when user completes the intervention
   }
   ```

3. **Optional Metadata**: Additional information that may not always be available
   ```typescript
   interface OnboardingResult {
     userSatisfaction?: number;  // User may not provide feedback
     metadata?: Record<string, any>;  // Additional context if available
   }
   ```

### Documentation Requirements

All optional properties SHOULD be documented with:
- **Why** the property is optional
- **When** the property will be present
- **What** the absence means

Example:
```typescript
interface Intervention {
  /**
   * Timestamp when the intervention was delivered to the user
   * Optional: Only present after the intervention has been sent
   */
  deliveredAt?: Date;
  
  /**
   * Timestamp when the user completed the intervention
   * Optional: Only present if the user accepted and completed the intervention
   */
  completedAt?: Date;
}
```

## Property Consistency

### Common Properties

Properties that appear across multiple interfaces should maintain consistent:

1. **Naming**: Use the exact same name
   - ✅ `userId` everywhere
   - ❌ `userId` in some places, `user_id` in others

2. **Type**: Use the same type definition
   - ✅ `userId: string` everywhere
   - ❌ `userId: string` in some places, `userId: number` in others

3. **Optionality**: Be consistent about when a property is optional
   - If `userId` is required in most interfaces, it should be required everywhere unless there's a specific reason

### Handling Inconsistencies

When a property needs different optionality across interfaces:

1. **Document the reason** in a comment
2. **Consider creating specialized interfaces** if the difference is significant
3. **Use inheritance** to share common required properties

Example:
```typescript
// Base interface with required userId
interface UserAssociatedEntity {
  userId: string;
}

// Most interfaces extend this
interface OnboardingJourney extends UserAssociatedEntity {
  // userId is required here
}

// Special case where userId might not be known yet
interface FeatureVector {
  userId?: string;  // Optional: May be extracted before user identification
}
```

## Type Inheritance

### Base Interfaces

Use base interfaces to share common properties:

```typescript
// Base entity with ID
interface BaseEntity {
  id: string;
}

// Base entity with timestamps
interface TimestampedEntity {
  createdAt: Date;
  updatedAt?: Date;
}

// Base entity associated with a user
interface UserAssociatedEntity extends BaseEntity {
  userId: string;
}
```

### When to Use Inheritance

Use `extends` when:
1. **Multiple interfaces share 3+ properties**
2. **The shared properties represent a logical concept** (e.g., "has an ID", "belongs to a user")
3. **The relationship is "is-a"** not "has-a"

Example:
```typescript
// Good: Intervention IS a user-associated entity with timestamps
interface Intervention extends UserAssociatedEntity, TimestampedEntity {
  type: string;
  content: InterventionContent;
}

// Avoid: Don't use inheritance just to save a few lines
interface SmallInterface extends BaseEntity {
  name: string;  // Only one additional property
}
```

## Type Organization

### File Structure

Types are organized in `lib/smart-onboarding/types/index.ts` with clear sections:

1. **Base Interfaces**: Foundational interfaces used across the system
2. **Type Aliases**: Simple type definitions and unions
3. **Domain Models**: Grouped by functional area
   - User Profile and Journey Models
   - Behavioral Analytics Models
   - ML and AI Models
   - Intervention Models
   - etc.

### Section Comments

Each major section should have a clear header:

```typescript
// ============================================================================
// SECTION NAME
// ============================================================================
```

### Interface Comments

All interfaces should have JSDoc comments explaining:
- **Purpose**: What the interface represents
- **Usage**: When/where it's used
- **Key Properties**: Explanation of important or complex properties

Example:
```typescript
/**
 * Represents the outcome of a delivered intervention
 * Used for tracking intervention effectiveness and user response
 * 
 * Key properties:
 * - userResponse: How the user reacted to the intervention
 * - engagementChange: Impact on user engagement (-1 to 1)
 * - completionImpact: Effect on completion probability (0 to 1)
 */
export interface InterventionOutcome {
  interventionId: string;
  userId: string;
  userResponse: 'accepted' | 'dismissed' | 'ignored' | 'completed';
  engagementChange: number;
  completionImpact: number;
  timeToResolution?: number;
  userFeedback?: UserFeedback;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## Best Practices

### 1. Prefer Explicit Over Implicit

```typescript
// Good: Explicit type
interface UserProfile {
  proficiency: ProficiencyLevel;  // Clear what values are allowed
}

// Avoid: Implicit type
interface UserProfile {
  proficiency: string;  // What values are valid?
}
```

### 2. Use Union Types for Enums

```typescript
// Good: Union type
export type PersonaType = 'content_creator' | 'business_user' | 'influencer';

// Avoid: String without constraints
export type PersonaType = string;
```

### 3. Document Complex Types

```typescript
// Good: Documented complex type
/**
 * Represents a decision node in the adaptation decision tree
 * Each node evaluates a condition and executes an action
 * Can have child nodes for nested decision logic
 */
export interface DecisionNode {
  condition: string;
  action: AdaptationAction;
  children?: DecisionNode[];
}
```

### 4. Use Readonly for Immutable Data

```typescript
// Good: Readonly for data that shouldn't change
interface ModelMetrics {
  readonly modelId: string;
  readonly version: string;
  readonly trainingDate: Date;
  accuracy: number;  // Can be updated
}
```

### 5. Avoid `any` Type

```typescript
// Avoid: Using any
interface ApiResponse {
  data: any;  // What is the structure?
}

// Good: Use generics or specific types
interface ApiResponse<T> {
  data: T;
}

// Or use Record for flexible objects
interface ApiResponse {
  data: Record<string, unknown>;
}
```

## Validation

Use the type consistency validator to check adherence to these conventions:

```bash
node scripts/validate-type-consistency.js
```

This will report:
- Naming convention violations
- Property consistency issues
- Optional property documentation gaps
- Inheritance opportunities

## Maintenance

When adding new types:

1. **Follow naming conventions** (PascalCase for types, camelCase for properties)
2. **Add JSDoc comments** explaining purpose and usage
3. **Consider inheritance** if sharing properties with existing types
4. **Document optional properties** with why/when/what
5. **Run the validator** to check consistency
6. **Update this document** if introducing new patterns

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- JSDoc Reference: https://jsdoc.app/
- Type System Design: Internal design document
