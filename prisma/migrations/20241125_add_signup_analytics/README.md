# Migration: Add Signup Analytics Model

**Date:** November 25, 2024  
**Feature:** Signup UX Optimization - Phase 11 (Analytics & Monitoring)

## Purpose

Adds the `signup_analytics` table to track user behavior through the signup funnel. This enables:
- Identification of drop-off points in the signup flow
- Conversion rate optimization
- A/B testing of signup methods
- Performance monitoring

## Changes

### New Table: `signup_analytics`

Tracks complete signup funnel events:
- Page views
- Form starts
- Method selection (email, Google, Apple)
- Form submissions
- Signup completions
- Signup errors

### Indexes

- `sessionId` (unique) - Primary tracking identifier
- `userId` - Link to user after signup
- `email` - Track by email
- `createdAt` - Time-based queries
- `methodSelected` - Filter by signup method

## Data Tracked

### Session Info
- `sessionId`: Unique session identifier
- `userId`: User ID (after signup)
- `email`: User email

### Marketing Attribution
- `landingPage`: Entry page
- `referrer`: Referrer URL
- `utmSource`, `utmMedium`, `utmCampaign`: UTM parameters

### Funnel Events
- `pageViewed`: Timestamp of page view
- `formStarted`: Timestamp of first input focus
- `methodSelected`: Chosen signup method
- `formSubmitted`: Timestamp of form submission
- `signupCompleted`: Timestamp of successful signup
- `signupFailed`: Timestamp of failed signup
- `errorCode`, `errorMessage`: Error details

### Device Info
- `userAgent`: Full user agent string
- `deviceType`: mobile, tablet, or desktop
- `browser`: Browser name
- `os`: Operating system

### Performance Metrics
- `timeToSubmit`: Milliseconds from form start to submit
- `timeToComplete`: Milliseconds from page view to completion

## Usage

### Track Events

```typescript
import { trackSignupPageView, trackSignupFormStart } from '@/lib/analytics/signup-tracking';

// On page load
trackSignupPageView({
  referrer: document.referrer,
  utmSource: 'google',
});

// On first input focus
trackSignupFormStart();
```

### Query Analytics

```typescript
// Get conversion rates
const analytics = await prisma.signupAnalytics.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-11-01'),
    },
  },
});

const completionRate = analytics.filter(a => a.signupCompleted).length / analytics.length;
```

## Rollback

To rollback this migration:

```sql
DROP TABLE IF EXISTS "signup_analytics";
```

Or use Prisma:

```bash
npx prisma migrate resolve --rolled-back 20241125_add_signup_analytics
```

## Testing

After applying migration:

```bash
# Generate Prisma client
npx prisma generate

# Verify table exists
npx prisma db execute --stdin <<< "SELECT * FROM signup_analytics LIMIT 1;"
```

## Privacy Considerations

- Email addresses are stored for analytics but should be anonymized in reports
- User agents contain device information but no PII
- Session IDs are randomly generated and not linked to cookies
- Data retention policy: 90 days (implement cleanup job)

## Performance

- All queries use indexed fields
- Session ID is unique for fast lookups
- Time-based queries use `createdAt` index
- Expected volume: ~1000 records/day

## Related Files

- `lib/analytics/signup-tracking.ts` - Client-side tracking
- `app/api/analytics/signup/route.ts` - API endpoint
- `.kiro/specs/signup-ux-optimization/design.md` - Design document
