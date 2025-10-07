# MCP — App Mapping, Live Data, and Staging Behavior

This MCP document captures the “single source of truth” for the app shell under `/app/app`, the URL mapping policy, live data wiring (no mocks), and environment-specific auth behavior. It reflects the current repository state and intended usage in staging and production.

## Scope

- Normalize the product shell under `/app/app/**` with clean, predictable URLs.
- Keep staging frictionless (auth bypass), keep production gated.
- Replace dev mocks with thin upstream proxies where applicable.
- Provide a minimal, modern analytics stack using Chart.js via `react-chartjs-2`.

## URL Structure (wrappers/aliases → real screens)

- Entry
  - `/app` → rewrite to `/app/app` (then redirects to dashboard inside the app shell)

- Engagement
  - `/app/app/messages` (+ `/:conversationId`) → wraps `app/messages/*`
  - `/app/app/fans`, `/app/app/fans/import` → wraps `app/fans/*`

- Monetization / OnlyFans
  - `/app/app/onlyfans/dashboard`, `/app/app/onlyfans/analytics` → wraps `app/of-analytics/page.tsx`
  - `/app/app/onlyfans/inbox` → wraps `app/messages/onlyfans/page.tsx`
  - `/app/app/onlyfans/threads/[id]` → detail thread (backed by `/api/of/threads/[id]`)

- Content & Social
  - `/app/app/content/scheduler` → wraps `app/schedule/page.tsx`
  - `/app/app/content/library` → wraps `app/repost/page.tsx`
  - `/app/app/social/tiktok/upload` → wraps `app/social/tiktok/upload/page.tsx`
  - `/app/app/social/diagnostic` → wraps `app/tiktok-diagnostic/page.tsx`

- Insights
  - `/app/app/analytics` → modernized page with charts
  - `/app/app/analytics/revenue` → focused line chart (overview revenue)
  - `/app/app/analytics/top-hours` → bar chart (best hours)

- Automations
  - `/app/app/automations` → automation starter (AI hooks/quick replies)

- Settings & Integrations
  - `/app/app/settings/billing` → wraps `app/billing/page.tsx`
  - `/app/app/settings/billing/packs` → wraps `app/billing/packs/page.tsx`
  - `/app/app/settings/integrations` → wraps `app/platforms/connect/page.tsx`
  - `/app/app/settings/integrations/onlyfans` → wraps `app/platforms/connect/onlyfans/page.tsx`
  - `/app/app/platforms/import/onlyfans` → wraps `app/platforms/import/onlyfans/page.tsx`

- AI / CIN
  - `/app/app/huntaze-ai` → wraps `app/(app)/dashboard/huntaze-ai/page.tsx`
  - `/app/app/ai/training` → wraps `app/ai/training/page.tsx`

- Ops / Health
  - `/app/app/status` → wraps `app/status/page.tsx`
  - `/app/app/ops/costs` → wraps `app/ops/costs/page.tsx`

- Onboarding (optional aliases into shell)
  - `/app/app/onboarding/setup` → `app/onboarding/setup/page.tsx`
  - `/app/app/onboarding/optimize` → `app/onboarding/optimize/page.tsx`

- Out of shell
  - Tracking shortlinks: `/r/**`
  - Auth: `/auth/**`, `/join/**`, OAuth callbacks
  - Marketing/Website: top-level pages like `/marketing`, `/how-it-works`, etc. remain outside `/app/app`. Do not create `/app/app/marketing`; use `/marketing`.

## Rewrites and Middleware

- Rewrites: see `next.config.mjs:20`
  - `/app` and `/app/` → `/app/app`
  - Explicit section aliases `/app/<section>[/:path*]` → `/app/app/<section>[/:path*]` for: `analytics`, `automations`, `campaigns`, `cinai`, `configure`, `content`, `dashboard`, `fans`, `manager-ai`, `marketing`, `messages`, `onlyfans`, `platforms`, `profile`, `settings`, `social`.
  - Billing alias (lives at root): `/app/billing[/:path*]` → `/billing[/:path*]`.
  - Kept: `/app/huntaze-ai` → `/dashboard/huntaze-ai`.

- Middleware: see `middleware.ts:13`
  - Staging bypass: host `staging.huntaze.com` (or `STAGING_BYPASS_AUTH=true`) → no auth gating.
  - Production gating: protect canonical app routes (`/dashboard`, `/messages`, etc.) and the `/app/<section>` aliases and legacy `/app/app/**`.
  - If unauthenticated and hitting protected routes → redirect to `/auth` with return hint.

## Live Data (No Mocks)

- OnlyFans Inbox/Threads proxies
  - `app/api/of/inbox/route.ts` → proxy to `${NEXT_PUBLIC_API_URL}/of/inbox`, `cache: 'no-store'`, `dynamic`.
  - `app/api/of/threads/[id]/route.ts` → proxy to `${NEXT_PUBLIC_API_URL}/of/threads/:id`, `no-store`.
  - Auth propagation via `Authorization: Bearer <access_token>` (cookie-sourced) or full cookie header when required.

- Metrics endpoints (aggregators/scaffolds)
  - `app/api/nav/badges/route.ts` → unread, new fans (24h), active campaigns, integration status.
  - `app/api/messages/metrics/route.ts` → byDay / TTR / SLA; returns empty arrays if upstream unavailable.
  - `app/api/fans/metrics/route.ts` → cohorts / retention / LTV; empty arrays if upstream unavailable.

## Charts and Analytics

- Libraries: `react-chartjs-2` + `chart.js/auto` (already in deps).
- Components: `src/components/charts/SimpleCharts.tsx` for small primitives; register controllers/scales only once.
- Pages:
  - `/app/app/analytics` → overview; time series with ms-epoch timestamps; `parsing: false` for performance.
  - `/app/app/analytics/revenue` → focused line chart.
  - `/app/app/analytics/top-hours` → bar chart. Heatmap (scheduler) uses `chartjs-chart-matrix` when needed.

## UI Normalization

- Styles: `styles/theme-normalize.css` loaded last in `app/layout.tsx` to unify brand (blue), surfaces, borders, remove purple theme remnants.

## Auth Gating Policy

- Cookies: `access_token`, `refresh_token` (JWT) are the source of truth.
- Staging: bypass enabled by default to accelerate QA.
- Production: `/app/app/**` and mapped app routes are gated by middleware; optional server-side `auth/me` validation in the shell layout for extra safety.

## Validation Checklist (Staging)

1. `/app` → resolves into `/app/app` app shell and redirects to dashboard.
2. Real sections resolve under `/app/app/**` and render live data where configured.
3. OnlyFans inbox/threads pages hit upstream (no mock responses) and show errors gracefully when upstream is unavailable.
4. Analytics pages render charts from live endpoints (or show empty-state placeholders in absence of data).
5. Nav badges endpoint returns counts; can be wired into the shell header.

## Next Steps

- Wire nav badges in the shell: fetch `/api/nav/badges` and surface counts.
- Add `loading.tsx` and `error.tsx` per major section (messages, fans, analytics, onlyfans, scheduler).
- Extend OnlyFans threads detail page using the live proxy.
- Optionally migrate more legacy routes into thin wrappers under `/app/app` for UX consistency.

---

Authoritative summary excerpt (for quick reference)

> Got it — I implemented the next pass focused on real starter features with clean mapping, live data, and normalized UI.
>
> What I added
>
> - /app/app structure
>     - Wrappers/aliases for real screens:
>         - Messages: /app/app/messages (+ /[conversationId])
>         - Fans: /app/app/fans, /app/app/fans/import
>         - OnlyFans: /app/app/onlyfans/{dashboard, analytics, inbox}
>         - Content/Social: /app/app/content/{scheduler, library}, /app/app/social/{tiktok/upload, diagnostic}
>         - Analytics: /app/app/analytics (already modernized), + /analytics/revenue, + /analytics/top-hours
>         - Dashboard: /app/app/dashboard (wraps dynamic dashboard)
>     - /app → /app/app (rewrite already present)
> - OF inbox/threads → live proxy (no mocks)
>     - app/api/of/inbox/route.ts: proxies to ${NEXT_PUBLIC_API_URL}/of/inbox with Bearer cookie, cache no-store, dynamic
>     - app/api/of/threads/[id]/route.ts: proxies to ${NEXT_PUBLIC_API_URL}/of/threads/:id, no-store, dynamic
> - Metrics endpoints
>     - app/api/nav/badges/route.ts: aggregates unread, new fans (24h), active campaigns, integration status
>     - app/api/messages/metrics/route.ts: scaffold for byDay/TTR/SLA (uses CRM APIs, returns empty arrays if unavailable)
>     - app/api/fans/metrics/route.ts: scaffold for cohorts/retention/LTV (returns empty arrays if unavailable)
> - Charts and modern analytics
>     - Analytics: /app/app/analytics now uses react-chartjs-2 (already in deps) and SimpleCharts
>     - New pages:
>         - /app/app/analytics/revenue: focused line chart
>         - /app/app/analytics/top-hours: bar chart for top hours
>     - Components: src/components/charts/SimpleCharts.tsx (uses chart.js/auto, no extra adapters needed)
> - UI normalization (kill purple, unify brand)
>     - styles/theme-normalize.css → loaded last in app/layout.tsx
>     - Unified brand (blue), surfaces/text/borders input variables
>     - Replaces violet focus/animations with clean brand states
>
> Auth gating
>
> - Existing middleware already covers /app and /app/:path*; with the /app → /app/app rewrite it protects /app/app/** in non-staging.
> - If you want strict gating on staging too, say the word and I’ll remove the staging bypass.
>
> Next steps (suggested)
>
> - If you want nav badges visible in the app shell, I can wire hznew/app-shell.tsx to fetch /api/nav/badges and render counts (messages.unread, etc.).
> - I can add loading.tsx/error.tsx skeletons per section (messages/fans/analytics/onlyfans/scheduler).
> - I can add wrappers for any more sections you want under /app/app (onboarding, security, threads detail UI, etc.).
> - Once staging build finishes, validate:
>     - /app/app, /app/app/dashboard, /app/app/analytics(/revenue, /top-hours)
>     - /app/app/onlyfans/inbox (no mocks; upstream must respond)
>     - /app/app/content/{scheduler, library}
>     - /app/app/fans(/import)
> - If OF upstream endpoints need cookies instead of Bearer, I’ll switch to passing cookies() string instead of Authorization header.

## Deployment (Amplify)

- Connected repository (canonical): https://github.com/chrlshc/huntaze (lowercase)
- Branch mapping:
  - staging → Amplify Staging environment
  - main/prod → Amplify Production environment
- Push example:
  - `git remote add amplify https://github.com/chrlshc/huntaze.git`
  - `git push amplify staging`
- Environment variables per Amplify env: set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, OAuth/Stripe secrets. Staging can enable `STAGING_BYPASS_AUTH=true` to bypass gating.
