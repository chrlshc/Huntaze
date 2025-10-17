# Huntaze Scheduler Overview

This project supports three recurring back‑office jobs. You can run them via AWS EventBridge (recommended), Vercel Cron, or PM2 (self‑host).

- OAuth refresh: refreshes Reddit/TikTok/Instagram tokens.
- Monthly billing: aggregates earnings (e.g., OnlyFans) and creates commission invoice items in Stripe.
- Analytics snapshots: emits lightweight per‑provider snapshots for dashboards and runbooks.

## Endpoints & Lambdas

- `GET/POST /api/cron/refresh-oauth`
  - Header: `x-cron-secret: $CRON_SECRET` or `x-vercel-cron` (Vercel)
  - Refreshes OAuth tokens, writes events to `huntaze-analytics-events`.

- `POST /api/cron/monthly-billing`
  - Header: `x-cron-secret: $CRON_SECRET`
  - Pulls OnlyFans monthly earnings (via saved credentials), calculates commission and persists summary on the user record.

- Lambda `refresh-analytics-snapshots`
  - Deployed via `scripts/deploy-refresh-analytics.sh`.
  - Scheduled with EventBridge (default: `rate(6 hours)`).

- Lambda `ingest-of-results`
  - Trigger: S3 `ObjectCreated` with filters `prefix=jobs/`, `suffix=result.json`.
  - Deploy and wire with: `scripts/deploy-of-ingestor.sh` (requires `BUCKET=<results-bucket>`).
  - Writes to `huntaze-analytics-events` and updates minimal user snapshots in `USERS_TABLE`.

- API `/api/ingest/of-aggregates`
  - Server-to-server endpoint to upsert monthly earnings aggregates into `OF_AGGREGATES_TABLE` (default `huntaze-of-aggregates`).
  - Auth via `x-cron-secret`. Idempotent per `{bucket,key,etag}` or fallback `{userId,month}`.
  - Provision table using `infrastructure/of-aggregates-table.yaml`.

## EventBridge Setup (recommended)

1. Stripe events → API destination:
   - See `docs/eventbridge-setup.md` (section 1). Target: `POST https://<app>/api/eventbridge/stripe` with `x-api-key: $EVENTBRIDGE_API_KEY`.

2. Monthly billing (1st of month, 02:00 UTC):
   - Use the CloudFormation template in `infrastructure/eventbridge-monthly-billing.yaml` (see `docs/eventbridge-setup.md`). Target: `POST https://<app>/api/cron/monthly-billing` with `x-cron-secret`.

3. OAuth refresh (every 30 minutes):
   - Run `scripts/create-eventbridge-cron.sh` (uses API destination for `/api/cron/refresh-oauth`).

4. Analytics snapshots (every 6 hours):
   - Run `scripts/deploy-refresh-analytics.sh` to deploy/schedule the Lambda.

5. OnlyFans results ingestion (continuous):
   - Run `scripts/deploy-of-ingestor.sh` with `BUCKET` set to your results bucket (the worker’s `RESULTS_BUCKET`).
   - Ensure the worker writes JSON to `s3://$BUCKET/jobs/<jobId>/result.json`.

6. Dashboard + alarms (observability):
   - Run `scripts/deploy-scheduler-dashboard.sh` with your `ENV`, `REGION` and names if different.
   - Opens metrics for EventBridge, Lambda, and DLQ with basic alarms.

## Security

- Internal calls (EventBridge/API Destination, Cron) use headers:
  - `x-api-key: $EVENTBRIDGE_API_KEY` for server‑to‑server billing helpers.
  - `x-cron-secret: $CRON_SECRET` for cron endpoints.

## Minimum Required Env

```
EVENTBRIDGE_API_KEY=your-32-char-key
CRON_SECRET=your-32-char-key
USERS_TABLE=huntaze-users
AWS_REGION=us-east-1
DATA_ENCRYPTION_KEY=base64-32-byte-key
STRIPE_SECRET_KEY=sk_live_...
```

## Notes

- The commission calculator now accepts internal callers (via headers above), which unblocks EventBridge flows.
- Users table lookups are minimal and should be adapted to your final schema (e.g., `onlyfansUserId`, `createdAt`, `subscriptionTier`, `stripeCustomerId`).
