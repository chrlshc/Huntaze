# Wizard API Endpoint

## Overview

The `/api/onboarding/wizard` endpoint processes setup wizard completion and activates services based on user selections.

**Base URL:** `/api/onboarding/wizard`  
**Authentication:** Required (JWT token)  
**Runtime:** Node.js  
**Rate Limit:** 10 requests per minute per user

## Endpoints

### POST /api/onboarding/wizard

Processes wizard completion and configures user services.

#### Request

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**

```typescript
{
  platform: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'other',
  primary_goal: 'grow' | 'automate' | 'content' | 'all',
  ai_tone?: 'playful' | 'professional' | 'casual' | 'seductive',
  follower_range?: string,
  time_to_complete?: number,
  questions_skipped?: number[]
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | Primary platform for content creation |
| `primary_goal` | string | Yes | Main objective (grow audience, automate, create content, or all) |
| `ai_tone` | string | No | AI assistant tone preference (default: 'professional') |
| `follower_range` | string | No | Current follower count range |
| `time_to_complete` | number | No | Time taken to complete wizard (seconds) |
| `questions_skipped` | number[] | No | Array of question indices that were skipped |

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/onboarding/wizard" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "primary_goal": "grow",
    "ai_tone": "professional",
    "follower_range": "1k-10k",
    "time_to_complete": 120,
    "questions_skipped": [3, 5]
  }'
```

#### Response

**Success (200 OK):**

```typescript
{
  success: boolean,
  user_id: string,
  services_enabled: string[],
  templates_loaded: string[],
  dashboard_config: {
    primary_metrics: string[],
    quick_actions: string[]
  },
  ai_config: {
    system_prompt: string,
    tone: string,
    emoji_frequency: 'none' | 'low' | 'medium' | 'high',
    response_length: 'short' | 'medium' | 'long',
    creativity_level: 'low' | 'medium' | 'high'
  },
  correlationId: string
}
```

**Example Response:**
```json
{
  "success": true,
  "user_id": "user-123",
  "services_enabled": [
    "hashtag_analyzer",
    "engagement_predictor",
    "reel_formatter",
    "story_optimizer"
  ],
  "templates_loaded": [
    "dm_template",
    "hashtag_template",
    "engagement_template"
  ],
  "dashboard_config": {
    "primary_metrics": [
      "new_followers",
      "engagement_rate",
      "growth_forecast"
    ],
    "quick_actions": [
      "view_analytics",
      "get_recommendations",
      "track_followers"
    ]
  },
  "ai_config": {
    "system_prompt": "Expert assistant for Instagram creators. Understand hashtags, Reels, and engagement strategies. Use formal, clear, data-driven language; no emojis; concise responses.",
    "tone": "professional",
    "emoji_frequency": "none",
    "response_length": "medium",
    "creativity_level": "high"
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

| Status | Description | Response Body |
|--------|-------------|---------------|
| 400 | Invalid request body | `{ "error": "Invalid request body", "details": "...", "correlationId": "..." }` |
| 401 | Unauthorized | `{ "error": "Unauthorized", "correlationId": "..." }` |
| 409 | Wizard already completed | `{ "error": "Wizard already completed", "details": "...", "correlationId": "..." }` |
| 500 | Server error | `{ "error": "Failed to process wizard completion", "details": "...", "correlationId": "..." }` |
| 503 | Service unavailable | `{ "error": "Service temporarily unavailable", "details": "...", "correlationId": "..." }` |

## Platform-Specific Services

### OnlyFans
- `onlyfans_scraper` - Content scraping and analysis
- `auto_dm_engine` - Automated DM responses
- `ppv_detector` - Pay-per-view content detection
- `proxy_rotation` - IP rotation for scraping
- `rate_limiter` - API rate limiting

### Instagram
- `hashtag_analyzer` - Hashtag performance analysis
- `engagement_predictor` - Engagement prediction
- `reel_formatter` - Reel optimization
- `story_optimizer` - Story performance optimization

### TikTok
- `trend_detector` - Trending content detection
- `sound_library` - Sound/music library
- `clip_converter` - Video format conversion
- `viral_analyzer` - Viral content analysis

### Reddit
- `reddit_api_client` - Reddit API integration
- `subreddit_classifier` - Subreddit categorization
- `karma_optimizer` - Karma optimization
- `post_scheduler` - Post scheduling

## Goal-Specific Configuration

### Grow
**Metrics:** `new_followers`, `engagement_rate`, `growth_forecast`  
**Actions:** `view_analytics`, `get_recommendations`, `track_followers`

### Automate
**Metrics:** `unread_messages`, `messages_sent`, `response_rate`  
**Actions:** `activate_auto_dm`, `view_templates`, `schedule_messages`

### Content
**Metrics:** `todays_ideas`, `trending_topics`, `idea_library_size`  
**Actions:** `generate_ideas`, `view_trends`, `save_to_library`

### All
**Metrics:** `followers`, `messages`, `content_ideas`, `engagement`  
**Actions:** `unified_dashboard`, `quick_actions`, `all_features`

## AI Tone Configuration

### Playful
- Casual language with suggestive undertones
- High emoji frequency
- Short, engaging responses

### Professional
- Formal, data-driven language
- No emojis
- Concise, clear responses

### Casual
- Friendly, conversational tone
- Low emoji frequency
- Concise responses

### Seductive
- Warm, flirty tone
- Medium emoji frequency
- Emotionally engaging, respectful responses

## Error Handling

### Validation Errors (400)

Request body validation uses Zod schema. Common validation errors:

```json
{
  "error": "Invalid request body",
  "details": "platform: Invalid enum value. Expected 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'other', received 'facebook'",
  "correlationId": "..."
}
```

### Authentication Errors (401)

```json
{
  "error": "Unauthorized",
  "correlationId": "..."
}
```

### Duplicate Completion (409)

```json
{
  "error": "Wizard already completed",
  "details": "You have already completed the setup wizard",
  "correlationId": "..."
}
```

### Database Errors (503)

```json
{
  "error": "Service temporarily unavailable",
  "details": "Please try again in a moment",
  "correlationId": "..."
}
```

## Logging

All requests are logged with structured metadata:

```typescript
{
  context: string,
  userId: string,
  platform: string,
  goal: string,
  tone: string,
  timeToComplete: number,
  servicesEnabled: number,
  templatesLoaded: number,
  correlationId: string
}
```

## Database Schema

### user_wizard_completions

```sql
CREATE TABLE user_wizard_completions (
  user_id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  primary_goal TEXT NOT NULL,
  ai_tone TEXT,
  follower_range TEXT,
  time_to_complete INTEGER,
  questions_skipped JSONB,
  ai_config_json JSONB,
  template_selections JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### onboarding_events

```sql
CREATE TABLE onboarding_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  correlation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Testing

### Manual Testing

```bash
# Test with valid payload
curl -X POST http://localhost:3000/api/onboarding/wizard \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "primary_goal": "grow",
    "ai_tone": "professional"
  }'

# Test with invalid platform
curl -X POST http://localhost:3000/api/onboarding/wizard \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "invalid",
    "primary_goal": "grow"
  }'

# Test without authentication
curl -X POST http://localhost:3000/api/onboarding/wizard \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "primary_goal": "grow"
  }'
```

### Integration Tests

See `tests/integration/api/wizard.test.ts` for comprehensive test suite.

## Related Documentation

- [Setup Wizard Guide](../SETUP_WIZARD_GUIDE.md)
- [Wizard Implementation](../WIZARD_IMPLEMENTATION.md)
- [Database Migrations](../../lib/db/migrations/2025-11-11-wizard-completions.sql)
- [Onboarding API](./onboarding-endpoint.md)

## Changelog

### 2025-11-11
- Initial implementation
- Added Zod validation
- Added transaction support
- Added structured logging
- Added comprehensive error handling

---

**Maintainer:** Platform Team  
**Last Updated:** 2025-11-11  
**Status:** ✅ Production Ready
