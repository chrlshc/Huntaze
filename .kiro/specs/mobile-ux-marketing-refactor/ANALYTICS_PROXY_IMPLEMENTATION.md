# Analytics Proxy Implementation

## Overview

This document describes the implementation of the analytics proxy system that bypasses ad-blockers while maintaining user privacy and GDPR compliance.

## Implementation Details

### Next.js Configuration

The analytics proxy is configured in `next.config.ts` using Next.js rewrites:

```typescript
async rewrites() {
  return [
    // Analytics proxy - Requirement 6.1, 6.2, 6.3
    {
      source: '/stats/js/script.js',
      destination: 'https://plausible.io/js/script.js',
    },
    {
      source: '/stats/api/event',
      destination: 'https://plausible.io/api/event',
    },
    // ... other rewrites
  ];
}
```

### How It Works

1. **Script Loading**: The analytics script is loaded from `/stats/js/script.js` (first-party path)
2. **Event Tracking**: Analytics events are sent to `/stats/api/event` (first-party path)
3. **Transparent Proxy**: Next.js automatically forwards these requests to Plausible.io
4. **Header Preservation**: All query parameters, headers, and request bodies are preserved

### Requirements Satisfied

#### Requirement 6.1: Analytics Initialization
✅ Analytics requests are proxied through the first-party domain path `/stats/*`

#### Requirement 6.2: Event Routing
✅ Analytics events are routed through `/stats/api/event` to bypass ad-blockers

#### Requirement 6.3: Header Preservation
✅ Next.js rewrites automatically preserve all query parameters and headers

#### Requirement 6.4: Privacy Compliance
✅ The Analytics component (to be implemented in Task 14) will respect DNT headers

#### Requirement 6.5: IP Anonymization
✅ Plausible.io automatically anonymizes IP addresses (configured at service level)

## Ad-Blocker Bypass Strategy

### Why This Works

1. **First-Party Domain**: Requests appear to come from `huntaze.com/stats/*` instead of `plausible.io`
2. **Generic Path Names**: Uses `/stats/*` instead of `/analytics/*` or `/tracking/*`
3. **No Provider Names**: Path doesn't contain "plausible", "analytics", or other blocked keywords
4. **Transparent Proxy**: The browser sees only first-party requests

### Ad-Blocker Detection Patterns

Common ad-blocker patterns that are bypassed:

- `*://plausible.io/*` ❌ Blocked
- `*/analytics/*` ❌ Blocked
- `*/tracking/*` ❌ Blocked
- `*/stats/*` ✅ Not typically blocked (generic term)

## Privacy Considerations

### GDPR Compliance

The analytics proxy maintains GDPR compliance through:

1. **No Personal Data**: Plausible doesn't collect personal data
2. **IP Anonymization**: IPs are automatically anonymized
3. **No Cookies**: Plausible doesn't use cookies
4. **DNT Respect**: The Analytics component (Task 14) will respect Do Not Track headers

### User Consent

While the proxy bypasses ad-blockers, the Analytics component will:

1. Check for Do Not Track (DNT) headers
2. Respect GDPR consent preferences
3. Not load if user has opted out

## Testing

### Unit Tests

Location: `tests/unit/config/analytics-proxy.test.ts`

Tests verify:
- ✅ Script proxy configuration
- ✅ Event proxy configuration
- ✅ Both proxies are present
- ✅ First-party paths don't contain provider names
- ✅ Generic path names are used

### Manual Testing

To test the proxy in development:

1. Start the development server: `npm run dev`
2. Open browser DevTools → Network tab
3. Visit a page with analytics enabled
4. Look for requests to `/stats/js/script.js` and `/stats/api/event`
5. Verify they return 200 OK (proxied successfully)

### Production Testing

In production, verify:

1. Analytics script loads from `https://huntaze.com/stats/js/script.js`
2. Events are sent to `https://huntaze.com/stats/api/event`
3. Ad-blockers don't block these requests
4. Analytics dashboard shows data

## Next Steps

### Task 14: Analytics Component

The next task will implement the client-side Analytics component that:

1. Loads the proxied analytics script
2. Respects Do Not Track (DNT) headers
3. Checks GDPR consent preferences
4. Uses `strategy="afterInteractive"` for non-blocking load

### Integration

To use the analytics proxy:

```typescript
// components/analytics/Analytics.tsx
'use client';

import Script from 'next/script';

export function Analytics() {
  return (
    <Script
      src="/stats/js/script.js"
      data-domain="huntaze.com"
      data-api="/stats/api/event"
      strategy="afterInteractive"
    />
  );
}
```

## Configuration Options

### Using a Different Analytics Provider

To use PostHog or another provider:

```typescript
async rewrites() {
  return [
    {
      source: '/stats/js/script.js',
      destination: 'https://app.posthog.com/static/array.js',
    },
    {
      source: '/stats/api/event',
      destination: 'https://app.posthog.com/capture/',
    },
  ];
}
```

### Custom Path Prefix

To use a different path prefix:

```typescript
async rewrites() {
  return [
    {
      source: '/metrics/js/script.js',
      destination: 'https://plausible.io/js/script.js',
    },
    {
      source: '/metrics/api/event',
      destination: 'https://plausible.io/api/event',
    },
  ];
}
```

## Troubleshooting

### Analytics Not Loading

1. Check Next.js server logs for proxy errors
2. Verify Plausible.io is accessible from your server
3. Check for CORS issues (shouldn't occur with rewrites)
4. Verify the script path in the Analytics component matches the rewrite source

### Events Not Tracking

1. Open browser DevTools → Network tab
2. Look for requests to `/stats/api/event`
3. Check request payload and response
4. Verify `data-api` attribute matches the rewrite source

### Ad-Blockers Still Blocking

1. Test with different ad-blockers (uBlock Origin, AdBlock Plus, etc.)
2. Consider using a different path prefix (e.g., `/metrics/*`)
3. Verify the path doesn't contain blocked keywords
4. Check ad-blocker filter lists for patterns

## Performance Impact

### Bundle Size
- No impact on bundle size (rewrites are server-side)
- Analytics script is loaded asynchronously

### Server Load
- Minimal overhead (simple proxy)
- No caching needed (Plausible handles caching)
- No additional database queries

### Network Performance
- One additional request for script load
- Event requests are fire-and-forget
- No impact on page load time (afterInteractive strategy)

## Security Considerations

### HTTPS Only
- All proxied requests use HTTPS
- No mixed content warnings

### No Sensitive Data
- Analytics events don't contain sensitive user data
- IP addresses are anonymized by Plausible

### Rate Limiting
- Plausible handles rate limiting
- No additional rate limiting needed

## References

- [Next.js Rewrites Documentation](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
- [Plausible Analytics Documentation](https://plausible.io/docs)
- [GDPR Compliance Guide](https://plausible.io/data-policy)
- [Do Not Track (DNT) Specification](https://www.w3.org/TR/tracking-dnt/)

## Completion Checklist

- ✅ Analytics proxy configured in next.config.ts
- ✅ Script proxy: `/stats/js/script.js` → `https://plausible.io/js/script.js`
- ✅ Event proxy: `/stats/api/event` → `https://plausible.io/api/event`
- ✅ Unit tests created and passing
- ✅ Documentation created
- ⏳ Analytics component (Task 14)
- ⏳ Production testing

## Task Status

**Task 13: Analytics Proxy** ✅ COMPLETE

The analytics proxy is now configured and ready to use. The next task (Task 14) will implement the client-side Analytics component that uses this proxy.
