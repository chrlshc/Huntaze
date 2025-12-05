# Design Document: Huntaze AI Features - Automations & Offers

## Overview

This design document covers the implementation of two "Coming Soon" features in Huntaze:
1. **Automations** - AI-powered workflow automation using DeepSeek R1
2. **Offers & Discounts** - AI-assisted promotional management using Llama 3.3

Both features integrate with the existing Huntaze AI infrastructure (Azure AI Foundry router) and follow the established patterns for AI service calls.

## Architecture

```mermaid
graph TB
    subgraph "Frontend"
        AP[Automations Page]
        OP[Offers Page]
        FB[Flow Builder UI]
        OC[Offer Creator UI]
    end
    
    subgraph "API Layer"
        AA[/api/automations]
        OA[/api/offers]
        AIA[/api/ai/automation-builder]
        AIO[/api/ai/offers]
    end
    
    subgraph "Services"
        AS[AutomationService]
        OS[OffersService]
        AE[AutomationEngine]
        ES[EventSystem]
    end
    
    subgraph "AI Layer"
        AR[AI Router]
        DS[DeepSeek R1]
        LL[Llama 3.3 70B]
    end
    
    subgraph "Data"
        DB[(PostgreSQL)]
        RD[(Redis Queue)]
    end
    
    AP --> AA
    OP --> OA
    FB --> AIA
    OC --> AIO
    
    AA --> AS
    OA --> OS
    AIA --> AR
    AIO --> AR
    
    AR --> DS
    AR --> LL
    
    AS --> DB
    OS --> DB
    AE --> RD
    ES --> AE
```

## Components and Interfaces

### 1. Automation Service

```typescript
// lib/automations/automation.service.ts

interface AutomationStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  name: string;
  config: Record<string, unknown>;
}

interface AutomationFlow {
  id: string;
  userId: string;
  name: string;
  description: string;
  steps: AutomationStep[];
  status: 'active' | 'paused' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationService {
  createFlow(userId: string, flow: Omit<AutomationFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationFlow>;
  getFlow(id: string): Promise<AutomationFlow | null>;
  updateFlow(id: string, updates: Partial<AutomationFlow>): Promise<AutomationFlow>;
  deleteFlow(id: string): Promise<void>;
  listFlows(userId: string): Promise<AutomationFlow[]>;
  executeFlow(flowId: string, context: TriggerContext): Promise<ExecutionResult>;
}
```

### 2. AI Automation Builder

```typescript
// lib/ai/automation-builder.service.ts

interface BuildAutomationRequest {
  description: string;
  userId: string;
}

interface BuildAutomationResponse {
  name: string;
  description: string;
  steps: AutomationStep[];
  confidence: number;
}

async function buildAutomationFlow(request: BuildAutomationRequest): Promise<BuildAutomationResponse> {
  return aiRequest<BuildAutomationResponse>({
    type: 'automation-builder',
    prompt: `Create an OnlyFans automation flow from this description:
      "${request.description}"
      
      Available triggers: new_subscriber, message_received, purchase_completed, subscription_expiring
      Available actions: send_message, create_offer, add_tag, wait
      
      Return JSON:
      {
        "name": "...",
        "description": "...",
        "steps": [
          { "id": "step-1", "type": "trigger", "name": "...", "config": {...} },
          { "id": "step-2", "type": "action", "name": "...", "config": {...} }
        ],
        "confidence": 0.0-1.0
      }`,
    model: 'deepseek-r1'
  });
}
```

### 3. Event System

```typescript
// lib/automations/event-system.ts

type TriggerType = 'new_subscriber' | 'message_received' | 'purchase_completed' | 'subscription_expiring';

interface TriggerContext {
  type: TriggerType;
  userId: string;
  fanId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface EventSystem {
  emit(trigger: TriggerContext): Promise<void>;
  subscribe(type: TriggerType, handler: (ctx: TriggerContext) => Promise<void>): void;
  unsubscribe(type: TriggerType, handler: (ctx: TriggerContext) => Promise<void>): void;
}
```

### 4. Offers Service

```typescript
// lib/offers/offers.service.ts

type DiscountType = 'percentage' | 'fixed' | 'bogo';
type OfferStatus = 'active' | 'expired' | 'scheduled' | 'draft';

interface Offer {
  id: string;
  userId: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  originalPrice?: number;
  validFrom: Date;
  validUntil: Date;
  status: OfferStatus;
  targetAudience?: string;
  redemptionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Bundle extends Offer {
  contentIds: string[];
  bundlePrice: number;
}

interface OffersService {
  createOffer(userId: string, offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'redemptionCount'>): Promise<Offer>;
  getOffer(id: string): Promise<Offer | null>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer>;
  deleteOffer(id: string): Promise<void>;
  listOffers(userId: string, status?: OfferStatus): Promise<Offer[]>;
  duplicateOffer(id: string): Promise<Offer>;
  redeemOffer(offerId: string, fanId: string): Promise<void>;
}
```

### 5. AI Offers Service

```typescript
// lib/ai/offers-ai.service.ts

interface PricingSuggestion {
  recommendedPrice: number;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
}

interface BundleSuggestion {
  name: string;
  contentIds: string[];
  suggestedPrice: number;
  expectedValue: string;
  reasoning: string;
}

interface DiscountRecommendation {
  discountType: DiscountType;
  discountValue: number;
  targetAudience: string;
  timing: string;
  reasoning: string;
}

async function suggestPricing(params: {
  contentId: string;
  historicalSales: SalesData[];
}): Promise<PricingSuggestion[]>;

async function suggestBundles(params: {
  userId: string;
  contentItems: ContentItem[];
  fanPreferences: FanPreference[];
}): Promise<BundleSuggestion[]>;

async function recommendDiscounts(params: {
  userId: string;
  fanSegments: FanSegment[];
  purchaseHistory: PurchaseData[];
}): Promise<DiscountRecommendation[]>;
```

## Data Models

### Prisma Schema Extensions

```prisma
model Automation {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  name        String
  description String?
  steps       Json
  status      String   @default("draft")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  executions  AutomationExecution[]
  
  @@map("automations")
}

model AutomationExecution {
  id           String   @id @default(uuid())
  automationId String   @map("automation_id")
  triggerType  String   @map("trigger_type")
  triggerData  Json     @map("trigger_data")
  status       String   // success, failed, partial
  stepsExecuted Int     @map("steps_executed")
  error        String?
  executedAt   DateTime @default(now()) @map("executed_at")
  
  automation   Automation @relation(fields: [automationId], references: [id])
  
  @@map("automation_executions")
}

model Offer {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  name            String
  description     String?
  discountType    String   @map("discount_type")
  discountValue   Float    @map("discount_value")
  originalPrice   Float?   @map("original_price")
  validFrom       DateTime @map("valid_from")
  validUntil      DateTime @map("valid_until")
  status          String   @default("draft")
  targetAudience  String?  @map("target_audience")
  contentIds      String[] @map("content_ids")
  redemptionCount Int      @default(0) @map("redemption_count")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  redemptions     OfferRedemption[]
  
  @@map("offers")
}

model OfferRedemption {
  id        String   @id @default(uuid())
  offerId   String   @map("offer_id")
  fanId     String   @map("fan_id")
  amount    Float
  redeemedAt DateTime @default(now()) @map("redeemed_at")
  
  offer     Offer    @relation(fields: [offerId], references: [id])
  
  @@map("offer_redemptions")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Automation Flow Round Trip
*For any* valid automation flow, saving it to the database and then retrieving it should return an equivalent flow with the same steps and configuration.
**Validates: Requirements 1.4**

### Property 2: Flow Validation Consistency
*For any* automation flow, the validation function should consistently return the same result (valid/invalid) for the same input.
**Validates: Requirements 1.2**

### Property 3: Trigger Event Emission
*For any* trigger type and context, emitting a trigger should result in all subscribed handlers being called with the correct context data.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 4: Action Execution Resilience
*For any* sequence of actions, if one action fails, the system should log the error and continue executing subsequent actions.
**Validates: Requirements 3.5**

### Property 5: Template Placeholder Validity
*For any* generated response template, all placeholders should be valid and parseable by the template engine.
**Validates: Requirements 4.3**

### Property 6: Offer CRUD Round Trip
*For any* valid offer, creating it and then retrieving it should return an equivalent offer with the same properties.
**Validates: Requirements 5.1**

### Property 7: Offer Status Expiration
*For any* offer with a validUntil date in the past, the status should be "expired" when retrieved.
**Validates: Requirements 5.3**

### Property 8: Offer Duplication Identity
*For any* duplicated offer, the copy should have a different ID but identical data (except for timestamps and redemption count).
**Validates: Requirements 5.5**

### Property 9: Pricing Suggestion Validity
*For any* pricing suggestion, the recommended price should be a positive number and confidence should be between 0 and 1.
**Validates: Requirements 6.2, 6.3**

### Property 10: Bundle Composition
*For any* bundle suggestion, the bundle should contain at least 2 content items and the suggested price should be less than the sum of individual prices.
**Validates: Requirements 7.2, 7.3**

### Property 11: Analytics Metric Consistency
*For any* set of automation executions, the calculated success rate should equal (successful executions / total executions).
**Validates: Requirements 9.1**

### Property 12: Redemption Logging
*For any* offer redemption, a corresponding log entry should be created with the correct offer ID, fan ID, and amount.
**Validates: Requirements 10.2**

## Error Handling

### Automation Errors
- **AI Generation Failure**: Return a fallback template with basic structure
- **Trigger Not Found**: Log warning and skip automation
- **Action Execution Failure**: Log error, mark step as failed, continue with next step
- **Database Error**: Retry with exponential backoff, max 3 attempts

### Offers Errors
- **AI Suggestion Failure**: Return empty suggestions with error message
- **Invalid Offer Data**: Return validation errors with specific field issues
- **Redemption Failure**: Log error, do not increment redemption count
- **Concurrent Modification**: Use optimistic locking with version field

## Testing Strategy

### Unit Testing
- Test individual service methods with mocked dependencies
- Test validation functions with edge cases
- Test AI prompt formatting

### Property-Based Testing
- Use fast-check library for TypeScript
- Minimum 100 iterations per property test
- Each property test must reference the correctness property it implements

**Property-Based Test Format:**
```typescript
// **Feature: huntaze-ai-features-coming-soon, Property 1: Automation Flow Round Trip**
describe('Automation Flow Round Trip', () => {
  it('should preserve flow data through save/retrieve cycle', () => {
    fc.assert(
      fc.property(automationFlowArbitrary, async (flow) => {
        const saved = await service.createFlow(userId, flow);
        const retrieved = await service.getFlow(saved.id);
        expect(retrieved?.steps).toEqual(saved.steps);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing
- Test API endpoints with real database
- Test AI service integration with mocked responses
- Test event system with multiple subscribers
