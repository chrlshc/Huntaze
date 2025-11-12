# Wizard Implementation Guide

## Overview

This guide explains how to integrate the 4-step setup wizard into your application. The wizard is designed to complete in under 30 seconds and automatically configures AI services based on user selections.

## Files Created

### Documentation
- `docs/SETUP_WIZARD_GUIDE.md` - User-facing help documentation
- `docs/WIZARD_IMPLEMENTATION.md` - This file (developer guide)

### Components
- `components/onboarding/huntaze-onboarding/SetupWizard.tsx` - Main wizard component
- `components/ui/ShopifyBackdrop.tsx` - Reusable dark backdrop with glows
- `components/ui/ShopifyStyleOnboardingModal.tsx` - Modal wrapper with backdrop

### API
- `app/api/onboarding/wizard/route.ts` - Wizard completion endpoint

### Database
- `lib/db/migrations/2025-11-11-wizard-completions.sql` - Wizard data schema

## Quick Start

### 1. Run the migration

```bash
psql $DATABASE_URL < lib/db/migrations/2025-11-11-wizard-completions.sql
```

### 2. Import and use the wizard

```tsx
import SetupWizard from '@/components/onboarding/huntaze-onboarding/SetupWizard';

function OnboardingPage() {
  const handleComplete = async (data) => {
    // Send to API
    const response = await fetch('/api/onboarding/wizard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const config = await response.json();
    
    // Redirect to dashboard with new config
    router.push('/dashboard');
  };
  
  const handleSkip = () => {
    // User skipped wizard, use defaults
    router.push('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <SetupWizard 
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </div>
    </div>
  );
}
```

### 3. Use the backdrop independently

```tsx
import { ShopifyBackdrop } from '@/components/ui';

function MyPage() {
  return (
    <ShopifyBackdrop accent1="#a78bfa" accent2="#f472b6">
      <div className="container mx-auto py-12">
        {/* Your content */}
      </div>
    </ShopifyBackdrop>
  );
}
```

## API Response Structure

When the wizard completes, the API returns:

```json
{
  "success": true,
  "user_id": "user_123456",
  "services_enabled": [
    "onlyfans_scraper",
    "auto_dm_engine",
    "ppv_detector"
  ],
  "templates_loaded": [
    "dm_auto_response",
    "ppv_promo",
    "subscriber_welcome"
  ],
  "dashboard_config": {
    "primary_metrics": ["unread_messages", "messages_sent", "response_rate"],
    "quick_actions": ["activate_auto_dm", "view_templates"]
  },
  "ai_config": {
    "system_prompt": "Professional, helpful assistant for OnlyFans creators...",
    "tone": "professional",
    "emoji_frequency": "none",
    "response_length": "medium",
    "creativity_level": "medium"
  }
}
```

## Service Activation Logic

### Platform → Services

| Platform | Services Enabled |
|----------|------------------|
| OnlyFans | `onlyfans_scraper`, `auto_dm_engine`, `ppv_detector`, `proxy_rotation`, `rate_limiter` |
| Instagram | `hashtag_analyzer`, `engagement_predictor`, `reel_formatter`, `story_optimizer` |
| TikTok | `trend_detector`, `sound_library`, `clip_converter`, `viral_analyzer` |
| Reddit | `reddit_api_client`, `subreddit_classifier`, `karma_optimizer`, `post_scheduler` |
| Other | `basic_analytics` |

### Goal → Dashboard

| Goal | Primary Metrics | Quick Actions |
|------|----------------|---------------|
| Grow | `new_followers`, `engagement_rate`, `growth_forecast` | `view_analytics`, `get_recommendations`, `track_followers` |
| Automate | `unread_messages`, `messages_sent`, `response_rate` | `activate_auto_dm`, `view_templates`, `schedule_messages` |
| Content | `todays_ideas`, `trending_topics`, `idea_library_size` | `generate_ideas`, `view_trends`, `save_to_library` |
| All | `followers`, `messages`, `content_ideas`, `engagement` | `unified_dashboard`, `quick_actions`, `all_features` |

### Tone → AI Config

| Tone | Emoji Frequency | System Prompt Style |
|------|----------------|---------------------|
| Playful | High (3-5) | Casual, suggestive, short |
| Professional | None | Formal, clear, data-driven |
| Casual | Low (1-2) | Friendly, conversational |
| Seductive | Medium (2-3) | Flirty, emotionally engaging |

## Analytics Queries

### Get wizard completion stats

```sql
SELECT * FROM wizard_analytics;
```

### Get average completion time by platform

```sql
SELECT 
  platform,
  AVG(time_to_complete) as avg_seconds,
  COUNT(*) as completions
FROM user_wizard_completions
GROUP BY platform
ORDER BY avg_seconds;
```

### Get skip rate by question

```sql
SELECT 
  jsonb_array_elements_text(questions_skipped) as question_number,
  COUNT(*) as skip_count
FROM user_wizard_completions
WHERE jsonb_array_length(questions_skipped) > 0
GROUP BY question_number
ORDER BY skip_count DESC;
```

### Get user's wizard config

```sql
SELECT * FROM get_user_wizard_config('user_123456');
```

## Customization

### Change wizard colors

Edit the accent colors in your page:

```tsx
<SetupWizard 
  onComplete={handleComplete}
  onSkip={handleSkip}
  // Colors are set in the component, but you can wrap with ShopifyBackdrop
/>
```

Or wrap with custom backdrop:

```tsx
<ShopifyBackdrop accent1="#your-color-1" accent2="#your-color-2">
  <SetupWizard onComplete={handleComplete} onSkip={handleSkip} />
</ShopifyBackdrop>
```

### Add more platforms

Edit `SetupWizard.tsx`:

```tsx
const PLATFORMS = [
  // ... existing platforms
  { 
    id: 'youtube' as Platform, 
    title: 'YouTube', 
    description: 'Video optimization, thumbnails, SEO' 
  },
];
```

Then update the API service mapping in `app/api/onboarding/wizard/route.ts`:

```tsx
function getServicesForPlatform(platform: string): string[] {
  const serviceMap: Record<string, string[]> = {
    // ... existing platforms
    youtube: [
      'youtube_api_client',
      'thumbnail_generator',
      'seo_optimizer'
    ],
  };
  // ...
}
```

### Modify AI prompts

Edit `generateSystemPrompt()` in `app/api/onboarding/wizard/route.ts`:

```tsx
const platformContext: Record<string, string> = {
  onlyfans: 'Your custom prompt for OnlyFans...',
  // ...
};
```

## Testing

### Manual testing checklist

- [ ] Complete wizard in < 30 seconds
- [ ] Skip tone question (defaults to Professional)
- [ ] Skip entire wizard (redirects to dashboard)
- [ ] Select each platform and verify services
- [ ] Select each goal and verify dashboard config
- [ ] Select each tone and verify AI config
- [ ] Check database for persisted data
- [ ] Verify analytics tracking

### Automated tests

```bash
# Run integration tests
npm run test:integration -- wizard

# Check wizard completion time
npm run test:performance -- wizard
```

## Monitoring

### Key metrics to track

- **Completion rate**: % of users who complete wizard
- **Time to complete**: Target < 30 seconds
- **Skip rate**: % who skip tone question (acceptable < 30%)
- **Drop-off rate**: % who abandon at each step
- **Platform distribution**: Most popular platforms
- **Goal distribution**: Most common goals

### Alerts to set up

- Completion rate drops below 70%
- Average time exceeds 45 seconds
- Drop-off rate at any step exceeds 20%
- API errors exceed 1%

## Troubleshooting

### Wizard doesn't submit

Check browser console for errors. Common issues:
- Missing CSRF token
- Network timeout
- Invalid data format

### Services not activating

Check API logs:
```bash
grep "Wizard API" logs/app.log
```

Verify database entry:
```sql
SELECT * FROM user_wizard_completions WHERE user_id = 'your_user_id';
```

### Slow completion times

Check:
- Database query performance
- API response times
- Frontend rendering performance

## Production Checklist

Before deploying to production:

- [ ] Run migration on production database
- [ ] Test wizard with real user accounts
- [ ] Set up monitoring and alerts
- [ ] Configure analytics tracking
- [ ] Test skip flows
- [ ] Verify service activation
- [ ] Check mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Verify ARIA labels for accessibility
- [ ] Load test API endpoint
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Document rollback procedure

## Support

For issues or questions:
- Check `docs/SETUP_WIZARD_GUIDE.md` for user documentation
- Review API logs for errors
- Check database for data persistence
- Contact: dev@huntaze.com
