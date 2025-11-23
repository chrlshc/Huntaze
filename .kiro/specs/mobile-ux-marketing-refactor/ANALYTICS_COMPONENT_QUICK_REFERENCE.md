# Analytics Component - Quick Reference

## Overview

Privacy-first analytics component that respects DNT and GDPR preferences.

## Location

```
components/analytics/Analytics.tsx
```

## Usage

Already integrated in `app/layout.tsx` - no additional setup needed.

## Privacy Controls

### Do Not Track (DNT)

Automatically detected from:
- `navigator.doNotTrack`
- `window.doNotTrack`
- `navigator.msDoNotTrack`

Values that disable analytics: `'1'`, `'yes'`, `true`

### GDPR Consent

Controlled via localStorage:

```javascript
// Accept analytics
localStorage.setItem('analytics-consent', 'true');

// Reject analytics
localStorage.setItem('analytics-consent', 'false');

// Check current setting
localStorage.getItem('analytics-consent');
```

## Testing

### Run Tests

```bash
npm test tests/unit/components/analytics.test.tsx
```

### Manual Testing

1. **Test DNT:**
   ```javascript
   navigator.doNotTrack = '1';
   location.reload();
   // Analytics should NOT load
   ```

2. **Test Consent:**
   ```javascript
   localStorage.setItem('analytics-consent', 'false');
   location.reload();
   // Analytics should NOT load
   ```

3. **Test Loading:**
   ```javascript
   navigator.doNotTrack = '0';
   localStorage.setItem('analytics-consent', 'true');
   location.reload();
   // Analytics SHOULD load
   ```

## Verification

Check Network tab in DevTools:
- Look for `/stats/js/script.js`
- Look for `/stats/api/event`
- Should be proxied (not blocked)

## Configuration

Analytics service: **Plausible**
Domain: `huntaze.com`
Proxy paths: `/stats/*`

To change service, update:
1. `next.config.ts` rewrites
2. `Analytics.tsx` Script props

## Requirements

✅ Validates Requirement 6.4: Respects DNT and GDPR preferences

## Documentation

Full docs: `components/analytics/README.md`
