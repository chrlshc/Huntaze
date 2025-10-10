Huntaze Design System — Pro Pass
=================================

This document tracks the source of truth for the Huntaze design system. The current implementation is driven by shared design tokens (`styles/design-system.css`, `config/design-tokens.mjs`) and Tailwind mappings (`tailwind.config.mjs`).

## Principles

- Ground everything in neutral surfaces. Light mode is clean white/blue-grey, dark mode is deep slate. Reserve color for intent.
- Maintain a visible hierarchy. Headlines stay high-contrast, body copy shifts to secondary/subtle tokens.
- Treat gradients, glow and glassmorphism as accents, not defaults. Primary actions use the brand violet, supporting actions stay muted.
- Keep motion calm. Micro-interactions (lift, fade) are fine; avoid overshooting animations that distract from revenue context.
- Accessibility is non-negotiable: 4.5:1 contrast for text, clear focus indicators, and obvious disabled states.

## Token Overview

Tokens exist in three layers:

1. **Primitives** — brand + neutral palettes, spacing, radii, shadows. Declared in `config/design-tokens.mjs`.
2. **CSS Variables** — semantic aliases exposed as `--ds-*` in `styles/design-system.css`.
3. **Tailwind Theme** — classes such as `bg-surface-muted`, `text-content-secondary`, `shadow-md`.

Key palettes:

- **Brand**: `brand-50 … brand-950` anchored on violet (#6B46FF core).
- **Neutral**: `neutral-50 … neutral-950` for surfaces, text and borders.
- **Semantic surfaces**: `surface-{base, muted, raised, overlay}`, plus inverted counterparts for dark mode.
- **Text**: `content-{primary, secondary, subtle, inverted, inverted-subtle, on-brand}`.
- **Borders**: `border-{subtle, default, strong, inverted}`.
- **Status**: `success`, `warning`, `danger`, `info` available for badges and alerts.

Spacing, radii and shadows follow an 8px rhythm and are available via Tailwind (`space`, `rounded`, `shadow`) and tokens (`--ds-spacing-*`, `--ds-radius-*`, `--ds-shadow-*`).

## Core Utilities

- `.surface` — primary card background; pairs with `shadow-sm`.
- `.surface-muted` — secondary background for grouped content.
- `.focus-ring` — apply shared focus treatment (`ring-primary`, offset on surfaces).
- `.input-quiet` — base input styling; combine with `focus:ring-primary/20` for accessibility.
- `.chip`, `.chip-ok`, `.chip-no` — pills for status, stepping parents `bg-surface-muted`.

## Buttons

Buttons now rely on the shared `<Button>` component (`components/ui/button.tsx`), which reads the Tailwind tokens. Supported variants:

- `primary` (alias: `default`, `filled`) — brand violet, white text, subtle elevation.
- `secondary` — neutral surface with border; ideal for secondary CTAs.
- `outline` — transparent fill with a neutral border.
- `ghost` — text-only with muted hover surface.
- `tonal` (aliases: `subtle`, `muted`) — soft background for inline actions.
- `gradient` — reserved for marketing hero CTAs (`bg-gradient-primary`).
- `danger` — destructive actions (`bg-danger`, white label).
- `link` — text link treatment with underline on hover.

Sizes: `sm`, `md` (default), `lg`, `xl`, `pill`.

Use Tailwind utility classes for layout customisations, but prefer the built-in variants for color and intent. Example:

```tsx
<Button variant="secondary" size="lg" className="w-full sm:w-auto">
  Talk to sales
</Button>
```

## Cards & Surfaces

- Base cards: `className="surface shadow-sm"`.
- Elevated state: apply `hover:shadow-md hover:-translate-y-0.5`.
- Empty states: mix `surface-muted` with `border-dashed border-border-subtle`.
- Integrations & feature highlights rely on the reusable `IntegrationCard` (see below) for consistency across marketing + product.

## Reusable Integration Card

`components/integrations/IntegrationCard.tsx` centralises the integration layout:

- Props: `name`, `description`, `logo`, `status` (`connected | available | coming-soon`), `badges`, optional `href`.
- Tokens: uses `surface` + border tokens, shared status chips, and focus handling.
- When possible, feed logos from `/public/logos/*` to avoid random gradients across modules.
- All integration grids (e.g. `IntegrationsSectionSimple`) now consume this component to avoid bespoke animations/styling.

## Motion & Feedback

- Default animation utilities live in `styles/simple-animations.css` (`animate-fadeIn`, `animate-scaleIn`, etc).
- Use `.hover-lift` or `.shadow-hover` for subtle affordance.
- Avoid stacking multiple animation layers; choose one motion per interaction.

## Content & Voice

- Signal the acquisition path: IG/TikTok/Reddit/Threads → Huntaze automations → OnlyFans revenue.
- Keep headings in sentence casing, short verbs/nouns, no exclamation marks unless quoting user feedback.
- Favour clarity over hype. Numbers should be sourced from analytics or flagged as illustrative.

## Forms & Inputs

- Base input: `.input-quiet`. Pair with helper text in `text-content-subtle`.
- Error states: add `aria-invalid`, `aria-describedby`, swap border to `border-danger` and show inline `text-danger`.
- Labels: `text-sm font-medium text-content-primary`; add `<span className="text-danger">*</span>` for required fields.

## Migration Notes

- Replace raw Tailwind colour literals (`bg-gray-900`, `text-white`) with token classes (`bg-surface-base`, `text-content-primary`) during touch-ups.
- Legacy CSS files (`styles/*fix.css`) stay until their host pages are retired. Prefer new work live under the token system.
- When introducing a new pattern, document it here and expose the primitive through Tailwind + CSS variables to keep parity.
