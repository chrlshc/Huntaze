# Email Styles Module

## Overview

This module provides standardized styles for email templates that mirror our design system tokens but are compatible with email clients.

## Why This Exists

Email clients (Gmail, Outlook, Apple Mail, etc.) have severe limitations:
- ❌ No support for CSS variables (`var(--token)`)
- ❌ No support for external stylesheets
- ❌ Limited CSS support in general
- ✅ Only inline styles work reliably

## Usage

### Basic Example

```typescript
import { 
  EMAIL_FONTS, 
  EMAIL_FONT_SIZES, 
  EMAIL_COLORS,
  EMAIL_COMPONENTS 
} from '@/lib/email/email-styles';

const html = `
  <div style="${EMAIL_COMPONENTS.container}">
    <h1 style="${EMAIL_COMPONENTS.heading}; font-size: ${EMAIL_FONT_SIZES['2xl']}">
      Welcome to Huntaze!
    </h1>
    <p style="${EMAIL_COMPONENTS.paragraph}">
      Thank you for signing up.
    </p>
    <a href="https://..." style="${EMAIL_COMPONENTS.button}">
      Get Started
    </a>
    <div style="${EMAIL_COMPONENTS.footer}">
      © 2024 Huntaze. All rights reserved.
    </div>
  </div>
`;
```

### Custom Styles

```typescript
import { emailStyle, EMAIL_FONTS, EMAIL_FONT_SIZES, EMAIL_COLORS } from '@/lib/email/email-styles';

const customStyle = emailStyle({
  fontFamily: EMAIL_FONTS.sans,
  fontSize: EMAIL_FONT_SIZES.lg,
  color: EMAIL_COLORS.accent.primary,
  padding: '20px',
  backgroundColor: EMAIL_COLORS.background.gray,
});

const html = `<div style="${customStyle}">Custom content</div>`;
```

## Available Constants

### Fonts

```typescript
EMAIL_FONTS.sans  // System font stack
EMAIL_FONTS.mono  // Monospace font stack
```

### Font Sizes

```typescript
EMAIL_FONT_SIZES.xs    // 12px
EMAIL_FONT_SIZES.sm    // 14px
EMAIL_FONT_SIZES.base  // 16px
EMAIL_FONT_SIZES.lg    // 18px
EMAIL_FONT_SIZES.xl    // 20px
EMAIL_FONT_SIZES['2xl'] // 24px
EMAIL_FONT_SIZES['3xl'] // 28px
EMAIL_FONT_SIZES['4xl'] // 32px
EMAIL_FONT_SIZES['5xl'] // 48px
```

### Colors

```typescript
EMAIL_COLORS.text.primary    // #1f2937
EMAIL_COLORS.text.secondary  // #4b5563
EMAIL_COLORS.text.tertiary   // #6b7280
EMAIL_COLORS.text.muted      // #9ca3af

EMAIL_COLORS.background.white // #ffffff
EMAIL_COLORS.background.gray  // #f9fafb

EMAIL_COLORS.accent.primary  // #6366f1
EMAIL_COLORS.accent.success  // #10b981
EMAIL_COLORS.accent.warning  // #f59e0b
EMAIL_COLORS.accent.error    // #ef4444
```

### Pre-built Components

```typescript
EMAIL_COMPONENTS.container  // Main container
EMAIL_COMPONENTS.heading    // Headings
EMAIL_COMPONENTS.paragraph  // Paragraphs
EMAIL_COMPONENTS.button     // Call-to-action buttons
EMAIL_COMPONENTS.footer     // Footer text
```

## Design Token Mapping

These constants mirror our design system:

| Email Constant | Design Token | Value |
|----------------|--------------|-------|
| `EMAIL_FONTS.sans` | `var(--font-sans)` | System fonts |
| `EMAIL_FONT_SIZES.sm` | `var(--text-sm)` | 14px |
| `EMAIL_FONT_SIZES.base` | `var(--text-base)` | 16px |
| `EMAIL_COLORS.accent.primary` | `var(--accent-primary)` | #6366f1 |

## Best Practices

### ✅ Do

```typescript
// Use constants
const html = `
  <p style="font-family: ${EMAIL_FONTS.sans}; font-size: ${EMAIL_FONT_SIZES.base};">
    Content
  </p>
`;

// Use pre-built components
const html = `<p style="${EMAIL_COMPONENTS.paragraph}">Content</p>`;

// Combine styles
const html = `
  <h1 style="${EMAIL_COMPONENTS.heading}; font-size: ${EMAIL_FONT_SIZES['3xl']};">
    Title
  </h1>
`;
```

### ❌ Don't

```typescript
// Don't hardcode values
const html = `<p style="font-family: Arial; font-size: 14px;">Content</p>`;

// Don't use CSS variables (email clients don't support them)
const html = `<p style="font-size: var(--text-base);">Content</p>`;

// Don't use external stylesheets
const html = `<link rel="stylesheet" href="styles.css">`;
```

## Testing Email Templates

Always test email templates in multiple clients:

- Gmail (web, iOS, Android)
- Outlook (Windows, Mac, web)
- Apple Mail (iOS, macOS)
- Yahoo Mail
- Proton Mail

Use services like:
- [Litmus](https://litmus.com/)
- [Email on Acid](https://www.emailonacid.com/)
- [Mailtrap](https://mailtrap.io/)

## Migration from Hardcoded Styles

### Before
```typescript
const html = `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <h1 style="font-size: 24px; color: #1f2937;">Title</h1>
    <p style="font-size: 16px; color: #4b5563;">Content</p>
  </div>
`;
```

### After
```typescript
import { EMAIL_COMPONENTS, EMAIL_FONT_SIZES, EMAIL_COLORS } from '@/lib/email/email-styles';

const html = `
  <div style="${EMAIL_COMPONENTS.container}">
    <h1 style="${EMAIL_COMPONENTS.heading}; font-size: ${EMAIL_FONT_SIZES['2xl']}; color: ${EMAIL_COLORS.text.primary};">
      Title
    </h1>
    <p style="${EMAIL_COMPONENTS.paragraph}">
      Content
    </p>
  </div>
`;
```

## Related Files

- `lib/email/email-styles.ts` - Main module
- `lib/email/ses.ts` - AWS SES integration
- `lib/services/email-verification.service.ts` - Verification emails
- `lib/auth/magic-link.ts` - Magic link emails

## Support

For questions or issues with email templates, see:
- [Design System Documentation](../../docs/design-system/README.md)
- [Email Best Practices](https://www.campaignmonitor.com/css/)
- [Can I Email](https://www.caniemail.com/) - CSS support in email clients
