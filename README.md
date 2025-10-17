# Huntaze - AI Platform for Content Creators
<!-- Deployment: 2025-08-27 -->
# huntaze-new

## App structure quick reference

- The full AI experience now lives in `huntaze-new/app/app/...`. Key routes: `/app/huntazeai/ai-manager` (chatbot control center) and `/app/dashboard/huntaze-ai/cin` (executive dashboard). Internal diagnostics stay behind `/app/tests/integration` during development.
- The legacy prototype in `app/app` is still accessible with `npm run dev:legacy` when you need it.
- Root npm scripts target `huntaze-new` by default (`npm run dev`, `npm run build`, `npm run start`).

## OnlyFans scraping architecture (Fargate + Puppeteer)

We now ship a headless scraping agent for OnlyFans built around your dispatcher (SQS ➜ Lambda ➜ API Gateway WebSocket). The code lives in `agents/onlyfans-scraper` and is designed to run inside an ECS Fargate service with rotating browser fingerprints (Puppeteer-Stealth).

High level flow:

1. SQS receives `onlyfans_scrape` jobs (created by Huntaze backend).
2. `dispatcher-sqs` Lambda (existing code) assigns an available agent via WebSocket.
3. Fargate agent (`agents/onlyfans-scraper`) launches Chromium with the selected fingerprint profile, navigates OnlyFans, scrapes data, and stores JSON in S3 (optional).
4. The agent pushes a `job_complete` message back on the WebSocket so DynamoDB + metrics stay in sync.
5. Another Lambda (or Huntaze API) ingests the JSON into Prisma to feed dashboards/autopilot.

Key folders:

- `agents/onlyfans-scraper/` – TypeScript worker + Dockerfile for Fargate.
- `infra/onlyfans-fargate/` – Task definition sample + deployment notes.
- `huntaze-starter/prisma/` – Schema & seed for persisting OnlyFans analytics locally.
- `huntaze-starter/app/api/onlyfans/results` – HTTP webhook to ingest scrape results (writes into `ScrapeLog`).

See `agents/onlyfans-scraper/README.md` for build/push instructions and runtime environment variables.
