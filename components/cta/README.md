# CTA Components

Standardized Call-to-Action components for consistent UX across the Huntaze application.

## Overview

The CTA system provides:
- **Consistent styling** across all marketing pages
- **Authentication-aware behavior** (shows "Join Beta" vs "Go to Dashboard")
- **Microcopy support** for better user guidance
- **Accessibility compliance** (WCAG 2.0 AA)
- **Max 2 CTAs per section** enforcement

## Components

### StandardCTA

Individual CTA button with consistent styling and behavior.

```tsx
import { StandardCTA } from '@/components/cta';

// Basic usage (authentication-aware)
<StandardCTA />

// With microcopy
<StandardCTA microcopy="Check your email" />

// Custom text and destination
<StandardCTA 
  text="Learn More" 
  href="/features" 
  variant="secondary" 
/>

// With icon
<StandardCTA 
  icon={<ArrowRight className="ml-2 h-5 w-5" />}
  showArrow={false}
/>
```

**Props:**
- `text?: string` - CTA text (defaults to "Join Beta" or "Go to Dashboard")
- `href?: string` - Destination URL (defaults to /signup or /dashboard)
- `variant?: 'primary' | 'secondary' | 'outline'` - Visual variant
- `size?: 'sm' | 'md' | 'lg'` - Size variant
- `microcopy?: string` - Text displayed below button
- `showArrow?: boolean` - Show arrow icon
- `icon?: ReactNode` - Custom icon
- `fullWidth?: boolean` - Full width button
- `ignoreAuth?: boolean` - Override authentication-aware behavior

### CTASection

Pre-built section component with title, subtitle, and up to 2 CTAs.

```tsx
import { CTASection } from '@/components/cta';

<CTASection
  title="Ready to get started?"
  subtitle="Join thousands of creators already using Huntaze"
  primaryCTA={{ microcopy: "Check your email" }}
  secondaryCTA={{ 
    text: "Learn More", 
    href: "/features", 
    variant: "secondary" 
  }}
/>
```

**Props:**
- `title: string` - Section title
- `subtitle?: string` - Section subtitle
- `primaryCTA?: CTAConfig` - Primary CTA configuration
- `secondaryCTA?: CTAConfig` - Secondary CTA configuration
- `size?: 'sm' | 'md' | 'lg'` - CTA size
- `background?: 'dark' | 'light' | 'gradient'` - Background variant

## Usage Guidelines

### 1. Standard CTA Text

Always use **"Join Beta"** as the primary CTA text (default). This is automatically handled by `StandardCTA`.

For secondary CTAs, use:
- "Learn More"
- "View [Feature]" (e.g., "View Pricing", "View Features")
- "Contact Sales"

### 2. Microcopy

Always include microcopy for primary actions to set expectations:

```tsx
<StandardCTA microcopy="Check your email" />
<StandardCTA microcopy="See your dashboard" />
<StandardCTA microcopy="Start in 2 minutes" />
```

Format: "Action → What happens next"

### 3. Max 2 CTAs Per Section

Never exceed 2 CTAs per section:
- 1 primary CTA (required)
- 1 secondary CTA (optional)

```tsx
// ✅ Good
<CTASection
  title="Ready to start?"
  primaryCTA={{}}
  secondaryCTA={{ text: "Learn More", href: "/features" }}
/>

// ❌ Bad - Too many CTAs
<div>
  <StandardCTA />
  <StandardCTA variant="secondary" />
  <StandardCTA variant="outline" />
</div>
```

### 4. Authentication-Aware Display

`StandardCTA` automatically adapts based on authentication status:

- **Unauthenticated**: "Join Beta" → `/signup`
- **Authenticated**: "Go to Dashboard" → `/dashboard`

Override this behavior with `ignoreAuth={true}` if needed.

### 5. Variants

**Primary** - Main action, high emphasis
```tsx
<StandardCTA variant="primary" />
```

**Secondary** - Alternative action, medium emphasis
```tsx
<StandardCTA variant="secondary" text="Learn More" />
```

**Outline** - Tertiary action, low emphasis
```tsx
<StandardCTA variant="outline" text="Contact Sales" />
```

## Accessibility

All CTA components include:
- **Focus indicators** (2px purple ring)
- **Keyboard navigation** support
- **Reduced motion** support
- **WCAG 2.0 AA** compliant contrast ratios
- **ARIA labels** where appropriate

## Testing

Property-based tests ensure consistency:

```bash
npm test tests/unit/cta/cta-consistency.property.test.tsx
```

Tests validate:
- Consistent text usage
- Consistent styling
- Max 2 CTAs per section
- Accessibility compliance
- Authentication-aware behavior

## Migration Guide

### From Old CTA to StandardCTA

**Before:**
```tsx
<Link href="/auth/register" className="btn-primary">
  Get Started
</Link>
```

**After:**
```tsx
<StandardCTA microcopy="Check your email" />
```

### From Custom Section to CTASection

**Before:**
```tsx
<section className="cta-section">
  <h2>Ready to start?</h2>
  <p>Join thousands of creators</p>
  <Link href="/signup" className="btn-primary">Sign Up</Link>
  <Link href="/features" className="btn-secondary">Learn More</Link>
</section>
```

**After:**
```tsx
<CTASection
  title="Ready to start?"
  subtitle="Join thousands of creators"
  primaryCTA={{ microcopy: "Check your email" }}
  secondaryCTA={{ text: "Learn More", href: "/features" }}
/>
```

## Examples

### Hero Section CTA
```tsx
<StandardCTA 
  size="lg"
  microcopy="Check your email"
/>
```

### Feature Page CTA
```tsx
<CTASection
  title="Ready to try it?"
  subtitle="Start using this feature today"
  primaryCTA={{ microcopy: "Get started in 2 minutes" }}
  background="gradient"
/>
```

### Pricing Page CTA
```tsx
<StandardCTA 
  text="Start Free Trial"
  href="/signup?plan=pro"
  microcopy="No credit card required"
  size="lg"
/>
```

### Footer CTA
```tsx
<StandardCTA 
  size="md"
  variant="secondary"
/>
```

## Audit Tool

Run the CTA audit script to check consistency:

```bash
npx tsx scripts/audit-cta.ts
```

This will:
- Count total CTAs
- List unique CTA texts
- Identify sections with >2 CTAs
- Generate a detailed report

## Related

- [Signup UX Optimization Spec](.kiro/specs/signup-ux-optimization/)
- [Design System](../../styles/premium-design-tokens.css)
- [Accessibility Guide](../../docs/ACCESSIBILITY.md)
