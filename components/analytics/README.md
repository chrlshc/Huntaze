# Analytics Component

## Overview

The Analytics component is a privacy-first, client-side analytics solution that respects user preferences and bypasses ad-blockers through first-party proxying.

## Features

- ✅ **Do Not Track (DNT) Respect**: Automatically detects and respects DNT headers
- ✅ **GDPR Compliance**: Checks for user consent preferences
- ✅ **Ad-blocker Bypass**: Uses first-party proxy paths (`/stats/*`)
- ✅ **Non-blocking Load**: Uses `afterInteractive` strategy to avoid delaying page interactivity
- ✅ **Graceful Degradation**: Defaults to not loading in private browsing mode
- ✅ **IP Anonymization**: Configured at Plausible service level

## Usage

### Basic Implementation

Add the Analytics component to your root layout:

```tsx
import { Analytics } from '@/components/analytics/Analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Privacy Preferences

The component checks for an `analytics-consent` value in localStorage:

```typescript
// User accepts analytics
localStorage.setItem('analytics-consent', 'true');

// User rejects analytics
localStorage.setItem('analytics-consent', 'false');

// No value set (defaults to true if DNT is not enabled)
```

## How It Works

### 1. Do Not Track Detection

The component checks multiple DNT sources:
- `navigator.doNotTrack`
- `window.doNotTrack`
- `navigator.msDoNotTrack` (IE/Edge legacy)

DNT values that disable analytics:
- `'1'`
- `'yes'`
- `true`

### 2. Consent Management

The component checks `localStorage.getItem('analytics-consent')`:
- `'false'` → Analytics disabled
- `'true'` or `null` → Analytics enabled (if DNT allows)
- Error (private browsing) → Analytics disabled

### 3. First-Party Proxy

Analytics requests are proxied through first-party paths:
- Script: `/stats/js/script.js` → `https://plausible.io/js/script.js`
- Events: `/stats/api/event` → `https://plausible.io/api/event`

This bypasses ad-blockers while maintaining privacy.

### 4. Load Strategy

Uses Next.js `Script` component with `strategy="afterInteractive"`:
- Loads after page becomes interactive
- Doesn't block critical rendering path
- Improves Time to Interactive (TTI)

## Configuration

### Analytics Service

Currently configured for Plausible Analytics. To change:

1. Update proxy configuration in `next.config.ts`:
```typescript
async rewrites() {
  return [
    {
      source: '/stats/js/script.js',
      destination: 'https://your-analytics-service.com/script.js',
    },
    {
      source: '/stats/api/event',
      destination: 'https://your-analytics-service.com/api/event',
    },
  ];
}
```

2. Update the Analytics component props:
```tsx
<Script
  src="/stats/js/script.js"
  data-domain="your-domain.com"
  data-api="/stats/api/event"
  strategy="afterInteractive"
/>
```

### Domain Configuration

Update the `data-domain` attribute to match your production domain:

```tsx
data-domain="huntaze.com"
```

For multiple domains, consult your analytics service documentation.

## Privacy Compliance

### GDPR

The component respects user consent through localStorage. Implement a cookie consent banner to set the preference:

```tsx
function CookieConsent() {
  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'true');
    // Reload to initialize analytics
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem('analytics-consent', 'false');
  };

  return (
    <div>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleReject}>Reject</button>
    </div>
  );
}
```

### IP Anonymization

Plausible automatically anonymizes IP addresses. No client-side configuration needed.

### Data Retention

Configure data retention policies in your Plausible dashboard settings.

## Testing

Run the test suite:

```bash
npm test tests/unit/components/analytics.test.tsx
```

Test coverage includes:
- DNT header detection (all variants)
- GDPR consent preferences
- localStorage unavailability (private browsing)
- Edge cases (undefined/null values)

## Troubleshooting

### Analytics Not Loading

1. Check browser console for errors
2. Verify DNT is not enabled: `navigator.doNotTrack`
3. Check localStorage: `localStorage.getItem('analytics-consent')`
4. Verify proxy configuration in `next.config.ts`

### Ad-blockers Still Blocking

1. Ensure proxy paths use first-party domain
2. Avoid using keywords like "analytics", "tracking", "ga" in paths
3. Consider using more generic paths like `/stats/*` or `/metrics/*`

### Private Browsing Mode

Analytics will not load in private browsing mode as localStorage is unavailable. This is intentional and respects user privacy.

## Requirements Validation

This component validates:
- **Requirement 6.4**: Respects Do Not Track headers and GDPR preferences

## Related Documentation

- [Analytics Proxy Implementation](.kiro/specs/mobile-ux-marketing-refactor/ANALYTICS_PROXY_IMPLEMENTATION.md)
- [Analytics Proxy Quick Reference](.kiro/specs/mobile-ux-marketing-refactor/ANALYTICS_PROXY_QUICK_REFERENCE.md)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [Plausible Analytics](https://plausible.io/docs)
