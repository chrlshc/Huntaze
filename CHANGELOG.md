# Changelog

All notable changes to this project are documented here.

## [v1.2.1] – UX guard (2025-10-05)
- CI guard to forbid the word "backend" in UX‑facing paths (`app/**`, `components/**`, `public/locales/**`, `lib/ui/**`).
- Add friendly error adapter (`lib/ui/friendlyError.ts`) and `fetchJson` helper (propagates `X-Request-Id`, throws friendly errors).
- No product copy changes beyond removing jargon.
- PR: #3

## [v1.2.0] – CIN endpoints + smoke (2025-10-05)
- Extend `withMonitoring` to CIN endpoints: `POST /api/cin/chat`, `GET /api/cin/status`.
- Force `runtime='nodejs'` on CIN routes.
- Add Playwright smoke test for `/api/cin/chat` (checks 200 + `X-Request-Id`).
- PR: #5 (replaces closed #4)

## [v1.1.0] – Observability baseline (2025-10-05)
- Add `withMonitoring` wrapper for billing/onboarding/webhooks routes.
- Structured logs + CloudWatch EMF metrics (`HttpRequests`, `HttpLatencyMs`) with dimensions `Service`, `Route`, `Method`, `Status`.
- Default namespace `Hunt/CIN` and service `cin-api`.
- Ensure `X-Request-Id` correlation in responses.
- Add `docs/RUNBOOK-CIN-AI.md`.
- PR: #1

[v1.2.1]: https://github.com/chrlshc/Huntaze/releases/tag/v1.2.1
[v1.2.0]: https://github.com/chrlshc/Huntaze/releases/tag/v1.2.0
[v1.1.0]: https://github.com/chrlshc/Huntaze/releases/tag/v1.1.0

