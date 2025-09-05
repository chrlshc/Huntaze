# Huntaze — OF 2025 Execution Roadmap (Condensed)

This file maps the strategic plan to concrete, staged changes in this codebase.

## Phase 1 (0–3 months)

- Import CSV (OnlyFans):
  - DONE: Next.js API `/api/repost/import-csv` (parser → backend `/api/repost/import`).
  - DONE: UI wired in `app/platforms/import/onlyfans/page.tsx` (file upload, success state).
  - TODO: Accept OF ZIP exports (transactions, subs), normalize to `postPerformance`.

- OF connection model:
  - DONE: Removed password flow in `app/platforms/connect/page.tsx`; added waitlist + link to import.
  - DONE: OF status proxy at `/api/integrations/onlyfans/status` (reads backend `/platforms`).
  - TODO: Auto-mark OF as “connected (read-only)” when import exists.

- Scheduler & Repost:
  - EXISTING: Scheduler, recommendations, Repost Engine → persists `ScheduledPost`/plans.
  - TODO: A/B UI polish + auto `/r` links helper.

- AI Draft (human-in-the-loop):
  - EXISTING: `/api/ofm/ai/draft` placeholder.
  - TODO: Plug real LLM (Claude/OpenAI/Azure) behind env guard + moderation.

## Phase 2 (3–6 months)

- Trends → Hooks pipeline:
  - NEW: Stubs `/api/discovery/trends` and `/api/ai/hooks` (no external calls). 
  - TODO: Replace with real discovery (APIs/ingestion) and LLM.

- Advanced analytics:
  - TODO: Last-touch attribution (clicks `/r` ↔ revenue window), cohort charts.

- Segmentation (RFM):
  - TODO: Prisma models + nightly recompute job (route exists: `/api/ofm/rfm/recompute`).

## Phase 3 (6–12 months)

- Multi-platform expansion: Fansly/Fanvue connectors (read-only data), unified attribution.
- Voice cloning workflow (optional module) and AI content suite.

## Notes

- TikTok OAuth callback fixed (POST `user/info`).
- Compliance: OF operations are read-only; no password collection.

