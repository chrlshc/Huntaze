# OnlyFans AI Assistant Integration Guide

## Overview

The OnlyFans AI Assistant has been enhanced with persistent memory capabilities, allowing it to:
- Remember past conversations with each fan
- Adapt personality based on interaction history
- Learn content preferences
- Detect emotional states
- Optimize message timing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application Code                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              OnlyFansAIAssistantWrapper                      │
│  (Automatic fallback + backward compatibility)              │
└────────┬────────────────────────────────┬───────────────────┘
         │                                │
         ▼                                ▼
┌────────────────────┐         ┌──────────────────────────────┐
│  Basic AI Service  │         │  Enhanced AI with Memory     │
│  (No memory)       │         │  (Full memory integration)   │
└────────────────────┘         └──────────────────────────────┘
```

## Quick Start

### Basic Usage (Backward Compatible)

```typescript
import { onlyFansAIAssistant } from '@/lib/services/onlyfans-ai-assistant';

// Works exactly like before, but with memory if IDs are provided
const suggestions = await onlyFansAIAssistant.generateSuggestions({
  fanName: 'John',
  fanId: 'fan_123',           // Optional: enables memory
  creatorId: 'creator_456',   // Optional: enables memory
  lastMessage: 'Hey! How are you?',
  lastMessageDate: new Date(),
  messageCount: 5
});
```

### Memory-Enhanced Usage

```typescript
import { onlyFansAIAssistant } from '@/lib/services/onlyfans-ai-assistant';

// Full memory-enhanced experience
const suggestions = await onlyFansAIAssistant.generateSuggestions({
  fanName: 'John',
  fanId: 'fan_123',
  creatorId: 'creator_456',
  lastMessage: 'Thanks for the content!',
  lastMessageDate: new Date(),
  fanValueCents: 15000,  // $150 lifetime value
  messageCount: 25,
  conversationHistory: [
    {
      direction: 'in',
      text: 'Hey! Love your content',
      createdAt: new Date('2024-01-15')
    },
    {
      direction: 'out',
      text: 'Thank you so much! 💕',
      createdAt: new Date('2024-01-15')
    }
  ]
});

// Suggestions now include memory context
suggestions.forEach(suggestion => {
  console.log(suggestion.text);
  console.log('Personality adjusted:', suggestion.memoryContext?.personalityAdjusted);
  console.log('Emotional context:', suggestion.memoryContext?.emotionalContext);
});
```

## Features

### 1. Automatic Personality Calibration

The system automatically adjusts tone, emoji usage, and message length based on:
- Fan's response patterns
- Preferred communication style
- Interaction history

```typescript
// After 5+ interactions, personality is automatically calibrated
// No code changes needed - happens automatically
```

### 2. Emotional State Detection

```typescript
// System automatically detects emotional state
// Avoids promotional content when fan is in negative state
// Adjusts tone to be more empathetic when needed
```

### 3. Engagement Scoring

```typescript
// Get engagement score for prioritization
const score = await onlyFansAIAssistant.getEngagementScore(
  'fan_123',
  'creator_456'
);

// Score ranges from 0 to 1
// Use for prioritizing high-value fans
if (score > 0.7) {
  console.log('High-value fan - prioritize response');
}
```

### 4. Memory Statistics

```typescript
// Get memory statistics for dashboard
const stats = await onlyFansAIAssistant.getMemoryStats('creator_456');

console.log('Total fans with memory:', stats.totalFans);
console.log('Average interactions:', stats.avgInteractions);
console.log('High engagement fans:', stats.highEngagementCount);
```

## Configuration

### Environment Variables

```bash
# Enable/disable memory features (default: true)
ONLYFANS_AI_MEMORY_ENABLED=true

# Database connection (required for memory)
DATABASE_URL=postgresql://...

# Redis connection (required for caching)
REDIS_URL=redis://...
```

### Feature Flags

```typescript
import { OnlyFansAIAssistantWrapper } from '@/lib/services/onlyfans-ai-assistant';

// Create custom instance with specific config
const aiAssistant = new OnlyFansAIAssistantWrapper({
  useMemory: true,
  fallbackToBasic: true  // Fallback to basic AI if memory fails
});

// Dynamically enable/disable memory
aiAssistant.setMemoryEnabled(false);
```

## Migration Guide

### Step 1: Update Imports (Optional)

```typescript
// Old import (still works)
import { onlyFansAISuggestions } from '@/lib/services/onlyfans-ai-suggestions.service';

// New import (recommended)
import { onlyFansAIAssistant } from '@/lib/services/onlyfans-ai-assistant';
```

### Step 2: Add IDs to Context (Enables Memory)

```typescript
// Before (no memory)
const suggestions = await onlyFansAISuggestions.generateSuggestions({
  fanName: 'John',
  lastMessage: 'Hey!'
});

// After (with memory)
const suggestions = await onlyFansAIAssistant.generateSuggestions({
  fanName: 'John',
  fanId: 'fan_123',        // Add this
  creatorId: 'creator_456', // Add this
  lastMessage: 'Hey!'
});
```

### Step 3: Test Gradually

```typescript
// Test with a small percentage of users first
const useMemory = Math.random() < 0.1; // 10% of users

const aiAssistant = new OnlyFansAIAssistantWrapper({
  useMemory,
  fallbackToBasic: true
});
```

## GDPR Compliance

### Delete Fan Memory

```typescript
// When fan requests data deletion
await onlyFansAIAssistant.clearFanMemory('fan_123', 'creator_456');
```

### Export Fan Data

```typescript
import { UserMemoryService } from '@/lib/of-memory/services/user-memory-service';

const memoryService = new UserMemoryService();
const memoryContext = await memoryService.getMemoryContext('fan_123', 'creator_456');

// Export as JSON for GDPR compliance
const exportData = JSON.stringify(memoryContext, null, 2);
```

## Error Handling

The system includes automatic fallback:

```typescript
try {
  // Tries memory-enhanced AI first
  const suggestions = await onlyFansAIAssistant.generateSuggestions(context);
} catch (error) {
  // Automatically falls back to basic AI if memory fails
  // No manual error handling needed
}
```

## Performance

- Memory retrieval: < 200ms (p95)
- Cache hit rate: > 90%
- Automatic caching with Redis
- Circuit breaker for resilience

## Best Practices

### 1. Always Provide IDs

```typescript
// ✅ Good - enables memory
const suggestions = await onlyFansAIAssistant.generateSuggestions({
  fanId: 'fan_123',
  creatorId: 'creator_456',
  // ... other context
});

// ❌ Bad - memory disabled
const suggestions = await onlyFansAIAssistant.generateSuggestions({
  fanName: 'John',
  // Missing fanId and creatorId
});
```

### 2. Include Conversation History

```typescript
// ✅ Good - richer context
const suggestions = await onlyFansAIAssistant.generateSuggestions({
  fanId: 'fan_123',
  creatorId: 'creator_456',
  conversationHistory: recentMessages,  // Include this
  fanValueCents: totalSpent,            // Include this
  messageCount: totalMessages           // Include this
});
```

### 3. Monitor Engagement Scores

```typescript
// Periodically check engagement scores
const score = await onlyFansAIAssistant.getEngagementScore(fanId, creatorId);

if (score < 0.3) {
  // Fan is disengaging - take action
  console.log('Fan needs re-engagement strategy');
}
```

## Troubleshooting

### Memory Not Working

1. Check environment variables:
```bash
echo $ONLYFANS_AI_MEMORY_ENABLED
echo $DATABASE_URL
echo $REDIS_URL
```

2. Check if IDs are provided:
```typescript
console.log('Memory enabled:', onlyFansAIAssistant.isMemoryEnabled());
```

3. Check logs:
```typescript
// Look for these log messages:
// "Using memory-enhanced AI assistant"
// "Using basic AI assistant (no memory)"
```

### Performance Issues

1. Check cache hit rate in logs
2. Verify Redis connection
3. Check database connection pool

### Suggestions Not Personalized

1. Ensure at least 5 interactions for personality calibration
2. Check if conversation history is provided
3. Verify fanId and creatorId are correct

## API Reference

See [OnlyFans Memory Service API](./of-memory-service.md) for detailed API documentation.

## Support

For issues or questions:
1. Check logs for error messages
2. Verify configuration
3. Test with basic AI mode first
4. Contact support with error logs
