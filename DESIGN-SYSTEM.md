Huntaze Design System — Pro Pass

This document summarizes the neutral, professional UI guidelines and tokens applied across Huntaze.

## Principles

- Neutral surfaces: favor white/gray for clarity; use dark grays in dark mode.
- Clear hierarchy: headers neutral, strong typography, restrained accents.
- Solid buttons: no heavy gradients; use brand violet for primary, black for TikTok, orange for Reddit.
- Subtle elevation: small, consistent shadows; avoid glow/tilt effects.
- Accessibility: sufficient contrast and clear focus rings.

## Tokens

- Surfaces (light): `bg-white`, `bg-gray-50` with `border-gray-200`
- Surfaces (dark): `dark:bg-gray-900`, `dark:bg-gray-800` with `dark:border-gray-800/700`
- Text (body): `text-gray-700` (light), `dark:text-gray-400` (dark)
- Headings: `text-gray-900`, `dark:text-white`
- Accents: brand violet `bg-purple-600 hover:bg-purple-700`
- Status: `bg-amber-400` (VIP), `bg-green-100 text-green-700` (success chips)

## Utilities

- `.surface`: base card/background — `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800`
- `.surface-muted`: muted background — `bg-gray-50 dark:bg-gray-800 border gray-200/dark:gray-700`
- `.elevation-0/1/2`: increase elevation (`none`, `shadow-sm`, `shadow-md`)

Use these utilities to reduce repetitive Tailwind classes and keep styling consistent.

## Components

- Buttons: solid fills, rounded-lg; primary violet. Avoid gradients/shimmer/glow.
- Cards: `.surface elevation-1`; headings strong, body text `text-gray-700`/`dark:text-gray-400`.
- Badges: solid backgrounds; avoid multicolor gradients.
- Lists/Tables: muted headers with `bg-gray-50` (dark: `bg-gray-900`).

## Platform Logos

Use SVG components in `src/components/platform-icons.tsx` (OnlyFans, Instagram, TikTok, Reddit, Threads).

## Copy Guidelines

- Make traffic flow explicit: IG/TikTok/Reddit/Threads → drive traffic to OnlyFans; OF is revenue hub.
- Keep headings short; prefer nouns/verbs; avoid exclamation overload.

## Migration Notes

- Gradients removed across marketing and app; if re-introduced, constrain to small, decorative accents only.
- For remaining legacy screens, replace `bg-gradient-to*` with `.surface`/`.surface-muted` + `elevation-*`.

## Interaction States

- Default: neutral surface/border; cursor-pointer for clickables.
- Hover: subtle `hover:bg-gray-50` (dark: `hover:bg-gray-800`) or elevation-2.
- Focus: `.focus-ring` or `focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`.
- Active: slight scale or `bg-gray-100` (dark `bg-gray-700`), never large motion.
- Disabled: `opacity-50 cursor-not-allowed`; keep readable text.
- Error (forms): add `.input-error` and error text `text-red-600`.

## Forms

- Inputs: use `.input-base`; apply `.input-error` on validation errors.
- Labels: `text-sm font-medium text-gray-900 dark:text-white`; include required `*`.
- Help text: `text-sm text-gray-500 dark:text-gray-400`.
- Error text: `text-sm text-red-600` and `aria-invalid`, `aria-describedby`.
- Accessibility: always associate `<label for>` + `id`, describe errors via `aria-describedby`.
