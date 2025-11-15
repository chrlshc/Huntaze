# Personality Calibrator API Documentation

## Overview

The Personality Calibrator automatically adjusts AI personality parameters based on fan interaction history to maximize engagement and authenticity.

**Module**: `lib/of-memory/services/personality-calibrator.ts`

## Features

- ✅ Automatic personality calibration based on interaction patterns
- ✅ Retry logic with exponential backoff (3 attempts, 1s-10s delays)
- ✅ Circuit breaker integration for resilience
- ✅ Comprehensive error handling and logging
- ✅ Type-safe API responses
- ✅ Graceful degradation on failures

## API Reference

### Class: `PersonalityCalibrator`

#### Constructor

```typescript
constructor(retryConfig?: Partial<RetryConfig>)
```

**Parameters:**
- `retryConfig` (optional): Retry configuration override
  - `maxAttempts`: Maximum retry attempts (default: 3)
  - `initialDelay`: Initial delay in ms (default: 1000)
  - `maxDelay`: Maximum delay in ms (default: 10000)
  - `backoffFactor`: Backoff multiplier (default: 2)

**Example:**
```typescript
const calibrator = new PersonalityCalibrator({
  maxAttempts: 5,
  initialDelay: 500
});
```

---

### Method: `calibratePersonality`

Calibrate personality based on interaction history.

```typescript
async calibratePersonality(
  fanId: string,
  interactionHistory: InteractionEvent[]
): Promise<PersonalityProfile>
```

**Parameters:**
- `fanId` (required): Unique fan identifier
- `interactionHistory` (required): Array of interaction events

**Returns:** `Promise<PersonalityProfile>`

**Throws:**
- `CalibrationError` with code:
  - `INVALID_INPUT`: Invalid fanId or interaction history
  - `INSUFFICIENT_DATA`: Less than 5 interactions (returns default profile instead)
  - `ANALYSIS_FAILED`: Analysis computation failed
  - `PROFILE_GENERATION_FAILED`: Profile creation failed
  - `CIRCUIT_OPEN`: Circuit breaker is open (returns default profile instead)

**Example:**
```typescript
try {
  const profile = await calibrator.calibratePersonality('fan-123', interactions);
  console.log('Calibrated tone:', profile.tone);
  console.log('Confidence:', profile.confidenceScore);
} catch (error) {
  if (error instanceof CalibrationError) {
    console.error('Calibration failed:', error.code, error.message);
  }
}
```

**Response Schema:**
```typescript
interface PersonalityProfile {
  fanId: string;
  tone: 'flirty' | 'friendly' | 'professional' | 'playful' | 'dominant';
  emojiFrequency: number; // 0-1
  messageLengthPreference: 'short' | 'medium' | 'long';
  punctuationStyle: 'casual' | 'proper';
  preferredEmojis: string[];
  responseSpeed: 'immediate' | 'delayed' | 'variable';
  confidenceScore: number; // 0-1
  lastCalibrated: Date;
  interactionCount: number;
}
```

**Minimum Data Requirements:**
- Minimum 5 interactions for calibration
- Less than 5 interactions returns default profile
- Confidence score increases with more data (max at 20+ interactions)

**Performance:**
- First calibration: ~50-200ms
- Subsequent calibrations: ~10-50ms (cached analysis)
- Timeout: 30s (circuit breaker)

---

### Method: `adjustTone`

Adjust tone based on real-time feedback.

```typescript
adjustTone(
  currentProfile: PersonalityProfile,
  feedback: InteractionFeedback
): PersonalityProfile
```

**Parameters:**
- `currentProfile` (required): Current personality profile
- `feedback` (required): Interaction feedback

**Returns:** `PersonalityProfile` (updated)

**Example:**
```typescript
const feedback = {
  fanEngaged: true,
  sentiment: 'positive',
  responseTime: 300,
  messageLength: 150
};

const updatedProfile = calibrator.adjustTone(currentProfile, feedback);
console.log('New confidence:', updatedProfile.confidenceScore);
```

**Feedback Schema:**
```typescript
interface InteractionFeedback {
  fanEngaged: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  responseTime: number; // milliseconds
  messageLength: number; // characters
}
```

**Tone Adjustment Rules:**
- Positive engagement → Increase confidence (+0.05)
- Negative engagement → Decrease confidence (-0.02)
- Negative sentiment → Try alternative tone
- Confidence clamped to [0, 1]

**Error Handling:**
- Returns unchanged profile on error
- Logs error but doesn't throw
- Safe for real-time adjustments

---

### Method: `getOptimalResponseStyle`

Get optimal response style for a fan.

```typescript
async getOptimalResponseStyle(
  fanId: string,
  context: MemoryContext
): Promise<ResponseStyle>
```

**Parameters:**
- `fanId` (required): Unique fan identifier
- `context` (required): Memory context with profile and preferences

**Returns:** `Promise<ResponseStyle>`

**Example:**
```typescript
const style = await calibrator.getOptimalResponseStyle('fan-123', context);

console.log('Max message length:', style.maxLength);
console.log('Emoji count:', style.emojiCount);
console.log('Preferred topics:', style.topics);
console.log('Topics to avoid:', style.avoidTopics);
```

**Response Schema:**
```typescript
interface ResponseStyle {
  maxLength: number; // 100, 200, or 400
  emojiCount: number; // 0-5
  tone: PersonalityProfile['tone'];
  topics: string[]; // High-interest topics (score > 0.6)
  avoidTopics: string[]; // Low-interest topics (score < 0.3)
}
```

**Safe Defaults (on error):**
```typescript
{
  maxLength: 200,
  emojiCount: 2,
  tone: 'friendly',
  topics: [],
  avoidTopics: []
}
```

---

## Error Handling

### CalibrationError

Custom error class for calibration failures.

```typescript
class CalibrationError extends Error {
  code: CalibrationErrorCode;
  fanId?: string;
  cause?: Error;
}
```

**Error Codes:**
```typescript
enum CalibrationErrorCode {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_INPUT = 'INVALID_INPUT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  PROFILE_GENERATION_FAILED = 'PROFILE_GENERATION_FAILED',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN'
}
```

**Example Error Handling:**
```typescript
try {
  const profile = await calibrator.calibratePersonality(fanId, interactions);
} catch (error) {
  if (error instanceof CalibrationError) {
    switch (error.code) {
      case CalibrationErrorCode.INSUFFICIENT_DATA:
        console.log('Need more interactions');
        break;
      case CalibrationErrorCode.INVALID_INPUT:
        console.error('Invalid input:', error.message);
        break;
      case CalibrationErrorCode.CIRCUIT_OPEN:
        console.warn('Service temporarily unavailable');
        break;
      default:
        console.error('Calibration failed:', error.message);
    }
  }
}
```

---

## Retry Strategy

### Configuration

```typescript
interface RetryConfig {
  maxAttempts: number; // Default: 3
  initialDelay: number; // Default: 1000ms
  maxDelay: number; // Default: 10000ms
  backoffFactor: number; // Default: 2
}
```

### Behavior

1. **First attempt**: Immediate execution
2. **Retry 1**: Wait 1s (initialDelay)
3. **Retry 2**: Wait 2s (initialDelay * backoffFactor)
4. **Retry 3**: Wait 4s (capped at maxDelay)

**Retryable Errors:**
- Transient network failures
- Temporary service unavailability
- Database connection timeouts

**Non-Retryable Errors:**
- Invalid input (INVALID_INPUT)
- Circuit breaker open (CIRCUIT_OPEN)

---

## Circuit Breaker

### Configuration

```typescript
{
  failureThreshold: 5, // Open after 5 failures
  resetTimeout: 60000, // Reset after 1 minute
  monitoringPeriod: 120000 // Monitor over 2 minutes
}
```

### States

1. **CLOSED**: Normal operation
2. **OPEN**: Blocking requests (returns default profile)
3. **HALF_OPEN**: Testing if service recovered

### Behavior

- Opens after 5 consecutive failures
- Blocks requests for 1 minute
- Automatically attempts recovery
- Returns default profile when open

---

## Logging

All operations are logged with correlation IDs for tracing.

### Log Levels

**INFO**: Normal operations
```typescript
[PersonalityCalibrator] Starting calibration {
  fanId: 'fan-123',
  interactionCount: 25,
  correlationId: '550e8400-...'
}
```

**WARN**: Retries and degraded performance
```typescript
[PersonalityCalibrator] Operation failed, retrying {
  operationName: 'calibratePersonality-fan-123',
  attempt: 2,
  maxAttempts: 3,
  nextRetryIn: 2000
}
```

**ERROR**: Failures
```typescript
[PersonalityCalibrator] Calibration failed {
  fanId: 'fan-123',
  error: 'Analysis failed',
  correlationId: '550e8400-...'
}
```

---

## Performance Benchmarks

| Operation | First Call | Subsequent | Target |
|-----------|-----------|------------|--------|
| calibratePersonality (10 interactions) | ~100ms | ~50ms | <200ms |
| calibratePersonality (100 interactions) | ~500ms | ~200ms | <1s |
| adjustTone | ~5ms | ~5ms | <10ms |
| getOptimalResponseStyle | ~10ms | ~10ms | <50ms |

---

## Integration Examples

### Basic Usage

```typescript
import { personalityCalibrator } from '@/lib/of-memory/services/personality-calibrator';

// Calibrate personality
const profile = await personalityCalibrator.calibratePersonality(
  'fan-123',
  interactionHistory
);

// Use profile for response generation
const style = await personalityCalibrator.getOptimalResponseStyle(
  'fan-123',
  memoryContext
);

// Generate response with style
const response = await generateResponse(message, style);
```

### With Error Handling

```typescript
import {
  personalityCalibrator,
  CalibrationError,
  CalibrationErrorCode
} from '@/lib/of-memory/services/personality-calibrator';

async function calibrateWithFallback(fanId: string, interactions: InteractionEvent[]) {
  try {
    return await personalityCalibrator.calibratePersonality(fanId, interactions);
  } catch (error) {
    if (error instanceof CalibrationError) {
      if (error.code === CalibrationErrorCode.CIRCUIT_OPEN) {
        // Use cached profile
        return await getCachedProfile(fanId);
      }
    }
    
    // Log and use default
    console.error('Calibration failed, using default', error);
    return getDefaultProfile(fanId);
  }
}
```

### Real-Time Adjustment

```typescript
// After each interaction
const feedback = analyzeFeedback(interaction);
const updatedProfile = personalityCalibrator.adjustTone(currentProfile, feedback);

// Save updated profile
await saveProfile(updatedProfile);

// Use for next response
const style = await personalityCalibrator.getOptimalResponseStyle(
  fanId,
  { ...context, personalityProfile: updatedProfile }
);
```

---

## Testing

### Unit Tests

```bash
npm run test tests/unit/of-memory/personality-calibrator.test.ts
```

### Integration Tests

```bash
npm run test:integration tests/integration/of-memory/personality-calibrator.test.ts
```

### Coverage

Target: >90% code coverage

---

## Related Documentation

- [OnlyFans AI Memory System](./of-memory-service.md)
- [Circuit Breaker Pattern](../circuit-breaker-pattern.md)
- [Retry Strategies](./retry-strategies.md)
- [User Memory Service](./user-memory-service.md)

---

## Support

For issues or questions:
1. Check logs for correlation IDs
2. Review error codes and messages
3. Consult integration tests for examples
4. Contact platform team with correlation ID

---

**Last Updated:** 2024-11-12  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
