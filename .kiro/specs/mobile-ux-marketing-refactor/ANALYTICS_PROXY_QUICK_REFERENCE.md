# Analytics Proxy - Quick Reference

## What Was Implemented

✅ **Analytics proxy configured in `next.config.ts`**

Two rewrites added to bypass ad-blockers:

```typescript
{
  source: '/stats/js/script.js',
  destination: 'https://plausible.io/js/script.js',
}
{
  source: '/stats/api/event',
  destination: 'https://plausible.io/api/event',
}
```

## How to Use

### In Your Analytics Component (Task 14)

```typescript
import Script from 'next/script';

export function Analytics() {
  return (
    <Script
      src="/stats/js/script.js"        // ← First-party path
      data-domain="huntaze.com"
      data-api="/stats/api/event"      // ← First-party path
      strategy="afterInteractive"
    />
  );
}
```

## Why This Works

| Without Proxy | With Proxy |
|--------------|------------|
| `https://plausible.io/js/script.js` ❌ Blocked | `https://huntaze.com/stats/js/script.js` ✅ Not blocked |
| `https://plausible.io/api/event` ❌ Blocked | `https://huntaze.com/stats/api/event` ✅ Not blocked |

## Testing

### Development
```bash
npm run dev
# Visit http://localhost:3000
# Check Network tab for /stats/* requests
```

### Production
```bash
# After deployment
curl https://huntaze.com/stats/js/script.js
# Should return Plausible script
```

## Requirements Satisfied

- ✅ **6.1**: Analytics proxied through first-party domain
- ✅ **6.2**: Events routed through `/stats/api/event`
- ✅ **6.3**: Headers and query params preserved automatically

## Next Steps

**Task 14**: Implement the Analytics component that:
- Uses the proxied paths
- Respects Do Not Track (DNT)
- Checks GDPR consent
- Loads asynchronously

## Files Modified

- ✅ `next.config.ts` - Added analytics rewrites
- ✅ `tests/unit/config/analytics-proxy.test.ts` - Unit tests
- ✅ Documentation created

## Common Issues

### Script Not Loading?
- Check server logs for proxy errors
- Verify Plausible.io is accessible
- Check path matches exactly: `/stats/js/script.js`

### Events Not Tracking?
- Verify `data-api="/stats/api/event"` attribute
- Check Network tab for 200 OK responses
- Ensure domain matches: `data-domain="huntaze.com"`

## Performance

- **Bundle Size**: No impact (server-side proxy)
- **Page Load**: No impact (async loading)
- **Server Load**: Minimal (simple proxy)

---

**Status**: ✅ Task 13 Complete
**Next**: Task 14 - Analytics Component
