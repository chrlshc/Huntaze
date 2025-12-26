# External Services (Audit & Securisation)

Ce document recense les integrations de services tiers detectees dans le repo, avec:
- usage (ou dans le code)
- env vars requises (sans valeurs)
- mode sandbox/prod
- webhooks (endpoints + signature)
- points de panne connus (timeouts, quotas, idempotence)

## Conventions
- Ne jamais committer de secrets (.env* avec valeurs).
- Tous les appels HTTP externes doivent passer par `externalFetch` / `externalFetchJson`.
- Les erreurs doivent etre normalisees en `ExternalServiceError { service, code, retryable }`.
- Retries limites, pas de retry sur les actions non idempotentes (publish, revoke, delete).

## SDKs / Clients utilises
- AWS SDK v3: `@aws-sdk/client-*`, `@aws-sdk/s3-request-presigner`.
- Azure SDK: `@azure/openai`, `@azure/identity`, `@azure/keyvault-secrets`, `@azure/monitor-opentelemetry`, `@azure/eventgrid`.
- Google GenAI: `@google/genai`, `@google/generative-ai`.
- OpenAI SDK: `openai` (certains appels utilisent HTTP direct).
- Stripe SDK: `stripe` (integration partielle, voir ci-dessous).
- Redis: `ioredis`, `@upstash/redis`.

## Fichiers de config (sources de verite)
- `config/amplify-env-vars/*.yaml`, `lib/amplify-env-vars/*` (templates + validation).
- `config/backup-config.yaml`, `config/alerting-rules.yaml`, `config/slo.yaml`.
- `aws-config/s3-bucket-policy.json`, `infrastructure/huntaze-media-stack.yaml`.
- `workers/video-processor/docker-compose.yml`, `workers/video-processor/test-setup/setup-aws.sh`.

---

## Inventaire par service

### AWS S3 (storage)
- Usage: `workers/video-processor/src/s3.ts`, `workers/video-processor/src/health.ts`, `worker/platforms/tiktok.ts`, `workers/video-processor/src/transcribe.ts`.
- Env vars: `AWS_REGION`, `AWS_S3_BUCKET`, `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `CDN_URL`.
- Mode: prod + localstack (worker test setup).
- Webhooks: events S3 dans `infrastructure/huntaze-media-stack.yaml`.
- Pannes: permissions IAM, bucket inexistant, timeouts upload/download, region mismatch.

### AWS SQS (queue)
- Usage: `worker/mac-bridge.ts`, `workers/video-processor/src/index.ts`.
- Env vars: `AWS_REGION`, `AWS_SQS_QUEUE_URL`, `SQS_QUEUE_URL`.
- Mode: prod + localstack.
- Webhooks: non.
- Pannes: queue absent, IAM, long-poll timeout, message visibility.

### AWS SES / SMTP (email)
- Usage: `lib/services/email/ses.ts`, `lib/email/ses.ts`.
- Env vars: `SES_REGION`, `AWS_SES_REGION`, `AWS_REGION`, `SES_FROM_EMAIL`, `AWS_SES_FROM_EMAIL`, `SES_CONFIG_SET` ou `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Mode: prod.
- Webhooks: non.
- Pannes: domaine non verifie, quotas, throttling, sandbox SES.

### AWS SNS / CloudWatch Logs
- Usage: `lib/aws/cloudwatch.ts`, `app/api/metrics/alert/route.ts`.
- Env vars: `AWS_REGION` (+ creds IAM).
- Mode: prod.
- Webhooks: non.
- Pannes: permissions IAM, quotas, erreurs 5xx AWS.

### AWS DynamoDB
- Usage: `src/lib/of/aws-session-store.ts`, `src/lib/of/link-store.ts`, `infrastructure/huntaze-media-stack.yaml`.
- Env vars: `AWS_REGION` (+ creds IAM).
- Mode: prod.
- Webhooks: non.
- Pannes: IAM, throttling, table manquante.

### AWS Transcribe
- Usage: `workers/video-processor/src/transcribe.ts`.
- Env vars: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`.
- Mode: prod.
- Webhooks: non.
- Pannes: quotas, erreurs 4xx/5xx, fichiers audio invalides.

### AWS EventBridge
- Usage: `src/lib/aws/eventbridge.ts`, `lib/integration/module-event-bus.ts`.
- Env vars: `AWS_REGION` (+ creds IAM).
- Mode: prod.
- Webhooks: EventBridge peut recevoir des events partenaires (ex: Stripe) via AWS.
- Pannes: IAM, regles event, throttling.

### Redis (ElastiCache/Upstash)
- Usage: `src/lib/redis.ts`, `lib/redis-client.ts`, `lib/middleware/rate-limit.ts`, `lib/ai/*`.
- Env vars: `REDIS_URL` ou `ELASTICACHE_REDIS_HOST`, `ELASTICACHE_REDIS_PORT`.
- Mode: prod/dev.
- Webhooks: non.
- Pannes: connection refused, timeouts, eviction, auth.

### Huntaze Core API (upstream interne)
- Usage: `app/api/*` (routes qui appellent `NEXT_PUBLIC_API_URL`/`API_ORIGIN`).
- Env vars: `NEXT_PUBLIC_API_URL`, `API_ORIGIN`.
- Mode: prod/dev.
- Webhooks: non.
- Pannes: timeouts, DNS, 5xx upstream.

### OpenAI API
- Usage: `src/services/llm-providers.ts`, `src/lib/ai/providers/openai.ts`, `src/lib/ai/providers/azure-ai.ts` (fallback).
- Env vars: `OPENAI_API_KEY`, `OPENAI_MODEL`.
- Mode: prod/sandbox (cle test).
- Webhooks: non.
- Pannes: quotas, timeouts, rate limits (429).

### Anthropic API
- Usage: `src/services/llm-providers.ts`, `src/lib/ai/providers/anthropic.ts`.
- Env vars: `ANTHROPIC_API_KEY`, `CLAUDE_API_KEY`.
- Mode: prod/sandbox.
- Webhooks: non.
- Pannes: quotas, timeouts, 429.

### Google Gemini
- Usage: `lib/ai/gemini-client.ts`.
- Env vars: `GEMINI_API_KEY`, `GEMINI_MODEL`.
- Mode: prod/sandbox.
- Webhooks: non.
- Pannes: quotas, timeouts, 429.

### AI Router (service interne)
- Usage: `lib/ai/foundry/router-client.ts`, `lib/ai/validation/*`.
- Env vars: `AI_ROUTER_URL`.
- Mode: prod/dev.
- Webhooks: non.
- Pannes: timeouts, 5xx, DNS, absence de service.

### Azure AI Foundry / OpenAI (Phi4, DeepSeek, Llama)
- Usage: `lib/ai/content-trends/azure-inference-client.ts`, `lib/ai/content-trends/phi4-multimodal-service.ts`, `lib/ai/content-trends/llama-vision-service.ts`.
- Env vars: `AZURE_AI_*`, `AZURE_DEEPSEEK_*`, `AZURE_PHI4_*`, `AZURE_LLAMA_VISION_*`.
- Mode: prod/sandbox.
- Webhooks: non.
- Pannes: quotas, timeouts, 429, invalid response JSON.

### Azure Speech (Cognitive Services)
- Usage: `lib/ai/content-trends/audio-transcription-service.ts`.
- Env vars: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `AZURE_SPEECH_ENDPOINT`.
- Mode: prod.
- Webhooks: non.
- Pannes: timeouts, quotas, batch job stuck.

### Azure Key Vault / Entra ID
- Usage: `lib/ai/content-trends/security/key-vault-service.ts`, `lib/ai/content-trends/security/entra-id-service.ts`.
- Env vars: `AZURE_KEY_VAULT_URL`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_USE_MANAGED_IDENTITY`, `AZURE_REDIRECT_URI`.
- Mode: prod.
- Webhooks: non.
- Pannes: token expirations, IAM/role, timeouts.

### Azure Monitor (Data Collector API)
- Usage: `lib/ai/content-trends/monitoring/azure-monitor-service.ts`, `lib/ai/content-trends/security/audit-logger.ts`.
- Env vars: `AZURE_MONITOR_WORKSPACE_ID`, `AZURE_MONITOR_INSTRUMENTATION_KEY`, `AZURE_MONITOR_CONNECTION_STRING`, `AZURE_MONITOR_RESOURCE_ID`.
- Mode: prod.
- Webhooks: non.
- Pannes: signature invalid, throttling, timeouts.

### Apify (scraping + webhooks)
- Usage: `lib/ai/content-trends/apify/*`, `app/api/ai/content-trends/scrape/route.ts`.
- Env vars: `APIFY_API_TOKEN`, `APIFY_WEBHOOK_SECRET`.
- Mode: prod.
- Webhooks: `/api/ai/content-trends/webhook`.
- Pannes: quotas, 429, webhook signature invalid, idempotence.

### Meta / Instagram Graph API
- Usage: `lib/services/instagramOAuth*.ts`, `lib/services/instagramPublish.ts`, `lib/marketing-war-room/publish-instagram-reel.ts`, `worker/platforms/instagram.ts`, `lib/workers/instagramInsightsWorker.ts`.
- Env vars: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI`, `INSTAGRAM_WEBHOOK_SECRET`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.
- Mode: prod (long-lived tokens).
- Webhooks: `/api/webhooks/instagram` + GET challenge.
- Pannes: token expire, quotas, 429, invalid signature.

### TikTok API
- Usage: `lib/services/tiktokOAuth*.ts`, `lib/services/tiktokUpload.ts`, `src/lib/tiktok/status.ts`, `worker/platforms/tiktok.ts`, `lib/services/tiktok.ts`.
- Env vars: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `NEXT_PUBLIC_TIKTOK_REDIRECT_URI`, `TIKTOK_SANDBOX_MODE`, `TIKTOK_WEBHOOK_SECRET`, `TIKTOK_SCOPES`.
- Mode: sandbox/prod (`TIKTOK_SANDBOX_MODE`).
- Webhooks: `/api/webhooks/tiktok` + GET challenge.
- Pannes: 429, timeouts, signature manquante, publish status stuck.

### Reddit API
- Usage: `lib/services/redditOAuth*.ts`, `lib/services/redditPublish.ts`, `src/lib/integration/reddit.ts`.
- Env vars: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `NEXT_PUBLIC_REDDIT_REDIRECT_URI`, `REDDIT_USER_AGENT`, `REDDIT_TEST_SUB`.
- Mode: prod.
- Webhooks: non.
- Pannes: rate limit, 403 subreddit rules, invalid grant.

### Threads (Instagram API)
- Usage: `app/api/auth/threads/callback/route.ts`.
- Env vars: `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `NEXT_PUBLIC_THREADS_REDIRECT_URI`.
- Mode: prod.
- Webhooks: non.
- Pannes: token exchange errors, 401.

### Twitter / X API
- Usage: `src/lib/integration/twitter.ts`.
- Env vars: `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ID`.
- Mode: prod.
- Webhooks: non.
- Pannes: 429, 403 scopes.

### Google OAuth
- Usage: `lib/auth/config.ts`, `app/api/auth/google/route.ts`.
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`.
- Mode: prod.
- Webhooks: non.
- Pannes: redirect mismatch, invalid client.

### OnlyFans API + Webhooks
- Usage: `lib/services/integrations/adapters/onlyfans.adapter.ts`, `lib/integrations/onlyfans.ts`, `app/api/onlyfans/webhooks/route.ts`, `lib/automations/webhook-integration.ts`.
- Env vars: `ONLYFANS_API_KEY`, `ONLYFANS_WEBHOOK_SECRET`.
- Mode: prod.
- Webhooks: `/api/onlyfans/webhooks`.
- Pannes: signature invalid, idempotence, cookies/session expire.

### CRM Webhooks (placeholder)
- Usage: `app/api/crm/webhooks/[provider]/route.ts`.
- Env vars: `CRM_WEBHOOK_SECRET`.
- Mode: prod.
- Webhooks: `/api/crm/webhooks/[provider]`.
- Pannes: signature invalid, duplicate events.

### Slack / Teams / Custom Webhooks (outgoing)
- Usage: `lib/services/alertService.ts`, `lib/ai/canary/alerting.ts`, `lib/ai/content-trends/monitoring/alerting-service.ts`, `lib/monitoring/hydrationProductionMonitor.ts`, `lib/monitoring/deployment-alerting.js`.
- Env vars: `SLACK_WEBHOOK_URL`, `HYDRATION_WEBHOOK_URL` (Teams/custom: config runtime).
- Mode: prod.
- Webhooks: outgoing only.
- Pannes: 429, invalid URL, timeouts.

### Proxy Providers (Bright Data / SmartProxy / Oxylabs)
- Usage: `src/lib/of/proxy-manager.ts`.
- Env vars: `BRIGHT_DATA_CUSTOMER`, `BRIGHT_DATA_PASSWORD`, `BRIGHT_DATA_ZONE`, `PROXY_LIST`.
- Mode: prod.
- Webhooks: non.
- Pannes: auth proxy, connection reset.

### IPify (IP lookup)
- Usage: `src/lib/of/proxy-manager.ts`.
- Env vars: aucune.
- Mode: prod/dev.
- Webhooks: non.
- Pannes: timeouts, 5xx.

### Sentry
- Usage: `app/api/monitoring/hydration-errors/route.ts` (placeholder).
- Env vars: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`.
- Mode: prod.
- Webhooks: non.
- Pannes: DSN manquant.

### Google Analytics
- Usage: frontend.
- Env vars: `NEXT_PUBLIC_GA_ID`.
- Mode: prod.
- Webhooks: non.
- Pannes: tag bloque, ad-blockers.

### Stripe (paiement)
- Usage: env + placeholders (pas de flux actif dans le code principal).
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Mode: test/prod (sk_test/sk_live).
- Webhooks: EventBridge (si active).
- Pannes: webhooks non config, 3DS/checkout.

---

## Webhooks (endpoints)

### TikTok
- Endpoint: `app/api/webhooks/tiktok/route.ts` (`POST /api/webhooks/tiktok`)
- Signature: `x-tiktok-signature` + `TIKTOK_WEBHOOK_SECRET`
- Idempotence: `computeWebhookExternalId` + table `webhook_events`

### Instagram/Meta
- Endpoint: `app/api/webhooks/instagram/route.ts` (`POST /api/webhooks/instagram` + `GET` challenge)
- Signature: `x-hub-signature-256` + `INSTAGRAM_WEBHOOK_SECRET`
- Verify token: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`

### OnlyFans
- Endpoint: `app/api/onlyfans/webhooks/route.ts`
- Signature: `x-onlyfans-signature` + `ONLYFANS_WEBHOOK_SECRET`
- Idempotence: `webhook_events` (unique external_id)

### Apify
- Endpoint: `app/api/ai/content-trends/webhook/route.ts`
- Signature: `x-apify-signature` + `x-apify-timestamp` + `APIFY_WEBHOOK_SECRET`
- Protections: anti-replay + rate limiting + idempotence (Redis)

### CRM (placeholder)
- Endpoint: `app/api/crm/webhooks/[provider]/route.ts`
- Signature: `x-crm-webhook-secret` + `CRM_WEBHOOK_SECRET`
- Idempotence: `webhook_events` (hash fallback)

### Worker Trigger
- Endpoint: `app/api/workers/webhooks/route.ts`
- Auth: `WORKER_SECRET` (Bearer)

---

## Points de panne (checklist rapide)
- Timeouts: AI Router, Azure Monitor, Apify, Graph APIs.
- Rate limits: TikTok, Reddit, Instagram Graph, Slack webhooks.
- Idempotence: tous les webhooks entrants.
- Secrets manquants: webhooks (Apify/OnlyFans/TikTok/Instagram), OAuth.
- Sandbox vs prod: TikTok (`TIKTOK_SANDBOX_MODE`), Stripe (`sk_test`/`sk_live`).
