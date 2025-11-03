# OPS — AI Team (Azure Multi-Agents)

This doc summarizes flags, endpoints, quotas and run commands to operate the AI Team safely.

## Flags (kill-switches)
- `LLM_PROVIDER=azure|openai` — prefer Azure OpenAI when `azure`.
- `ENABLE_AZURE_AI=1` — enable backend smoke route for Azure.
- `ENABLE_AZURE_AI_TEAM=1` — enable planner/publish routes.
- `USE_AZURE_RESPONSES=1` — prefer Azure OpenAI v1 Responses API (default ON in prod).
- `ENABLE_EVENTBRIDGE_HOOKS=1` — publish outbox to EventBridge (PutEvents).
- `ENABLE_AGENTS_PROXY=1` — proxy `/api/agents/*` to an external service (requires `AGENTS_PROXY_TOKEN`).

## Azure OpenAI
- Required: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_KEY`
- Optional: `AZURE_OPENAI_API_VERSION` (default `2024-05-01-preview`)
- Smoke: `GET /api/ai/azure/smoke` → status + usage
 - Default path: Responses API (`/openai/v1/responses`) when `USE_AZURE_RESPONSES=1`; legacy Chat Completions kept for fallback with `api-version`.

## AI Team — routes
- Plan Azure: `POST /api/ai-team/schedule/plan/azure`
  - body: `{ correlation, period: 'next_week'|'next_month', platforms: string[], preferences?: {} }`
  - 202 Accepted; persists `ai_plan` + `ai_plan_item` + emits `CONTENT_READY` (bus + outbox)
- Publish: `POST /api/ai-team/publish`
  - body: `{ correlation, contents: [...], platforms: [...] }`
  - 202 Accepted; uses `PostSchedulerAgent`
- Get plan: `GET /api/ai-team/plan/:id`

## Analytics — AI Summary
- Run: `POST /api/analytics/ai/summary/run` (202 placeholder)
- Get: `GET /api/analytics/ai/summary?account_id=...&period=7d`

## EventBridge Hooks
- Module: `src/lib/aws/eventbridge.ts`
- Limitations: ≤ 256 KB per entry; ≤ 10 entries per PutEvents batch
- Admin dispatcher: `POST /api/admin/outbox/dispatch` (Authorization: Bearer `${ADMIN_TOKEN}`)
  - Only sets `sent_at` for successful entries

## Scheduler (Insights)
- ZSET for schedules; `computeNextSeconds(ageHours)` decides next interval with jitter
- Cron: `GET /api/cron/insights-scheduler`
- K8s examples:
  - `infra/k8s/cronjob-insights-summarizer.yaml` — curl POST to summary/run
  - `infra/k8s/cronjob-outbox-dispatcher.yaml` — curl POST to admin/dispatch

## Metrics
- Prometheus endpoint: `/api/metrics`
- LLM: `llm_requests_total{provider,status}`, `llm_latency_seconds{provider}`, `llm_tokens_total{provider,kind}`
- Scheduler: `insights_scheduler_runs_total`, `insights_scheduler_inflight`, `insights_scheduler_lag_seconds`
- Publish: `social_publish_time_seconds{platform}`, `social_tiktok_publish_requests_total{result}`
- Insights: `social_insights_fetch_total{platform,kind,status}`, `social_insights_fetch_latency_seconds{platform,kind}`

## Security
- All admin/debug/proxy routes: no-store + `X-Robots-Tag: noindex`
- Tokens required: `ADMIN_TOKEN` (dispatcher), `AGENTS_PROXY_TOKEN` (agents proxy)
- Rate-Limit: enforced at route-level; Edge RL optional via Upstash (middleware)

## Rollback
- Disable flags in order: `ENABLE_EVENTBRIDGE_HOOKS=0`, `ENABLE_AZURE_AI_TEAM=0`, `ENABLE_AZURE_AI=0`
- Workers/CronJobs can be paused (K8s: `suspend: true` on CronJob)
- DB schema is additive/safe; no destructive migration in this set
