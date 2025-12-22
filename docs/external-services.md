# External Services (Audit & Sécurisation)

Ce document recense toutes les intégrations “services tiers” détectées dans le repo, avec:
- où elles sont utilisées (fichiers/paths)
- variables d’environnement attendues (sans valeurs)
- modes sandbox/prod
- webhooks (endpoints + exigences de signature)
- points de panne typiques (timeouts, quotas, rate limits, idempotence)

## Conventions
- **Jamais** committer de fichiers `.env*` contenant des secrets (utiliser `.env.example` comme template).
- Toutes les erreurs “tiers” doivent être normalisées en `ExternalServiceError { service, code, retryable }`.
- Pour les appels HTTP externes: timeout + retries limités (par défaut **0** retry pour les actions non-idempotentes de “publish”).

---

## Inventaire (high-level)

| Service | Type | Usage (où) | Webhooks | Env vars clés |
|---|---|---|---|---|
| AWS S3 | Storage | `lib/services/s3Service.ts`, `app/api/content/*`, `workers/*` | Non | `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `CDN_URL` |
| AWS SQS | Queue | `lib/sqs.ts`, `app/api/content-factory/produce/route.ts`, `workers/video-processor/*` | Non | `AWS_REGION`, `AWS_SQS_QUEUE_URL` |
| AWS SES / SMTP | Email | `lib/mailer.ts`, `lib/services/email/ses.ts`, `lib/email/ses.ts` | Non | `SES_REGION`/`AWS_SES_REGION`, `SES_FROM_EMAIL`/`AWS_SES_FROM_EMAIL`, `SES_CONFIG_SET`, **ou** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| AWS SNS/CloudWatch | Monitoring | `lib/aws/cloudwatch.ts`, `app/api/monitoring/three-js-errors/route.ts` | Non | `AWS_REGION` (+ creds IAM) |
| AWS DynamoDB | Storage | `src/lib/of/aws-session-store.ts`, `src/lib/of/link-store.ts`, `lambda/send-worker/index.js` | Non | `AWS_REGION` (+ creds IAM) |
| AWS CloudFront | CDN | `lib/aws/asset-optimizer.ts` | Non | `AWS_CLOUDFRONT_DISTRIBUTION_ID`, `AWS_REGION` |
| AWS EventBridge | Event bus | `src/lib/aws/eventbridge.ts`, `lib/integration/module-event-bus.ts` | Oui (partenaire Stripe, cf docs) | `AWS_REGION` (+ creds IAM) |
| Redis (ElastiCache/ioredis) | Cache/Queue | `src/lib/redis.ts`, `lib/redis-client.ts`, `lib/middleware/rate-limit.ts`, `lib/ai/*` | Non | `REDIS_URL` (ou `ELASTICACHE_REDIS_HOST`, `ELASTICACHE_REDIS_PORT`) |
| Stripe | Payments | env validation + docs (`docs/eventbridge-setup.md`) | Oui (EventBridge partenaire) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| OpenAI | AI | `src/lib/ai/providers/openai.ts`, `lib/services/chatbotService.ts`, `src/services/llm-providers.ts` | Non | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Anthropic | AI | `src/lib/ai/providers/anthropic.ts`, `src/services/llm-providers.ts` | Non | `ANTHROPIC_API_KEY`, `CLAUDE_API_KEY` |
| Google Gemini | AI | `lib/ai/gemini-client.ts` | Non | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Azure AI (Foundry/MaaS endpoints) | AI | `src/lib/ai/providers/azure-ai.ts`, `lib/ai/content-trends/azure-inference-client.ts` | Non | `AZURE_*_ENDPOINT`, `AZURE_*_API_KEY`, `AZURE_AI_API_KEY` |
| Azure Key Vault | Secrets | `lib/ai/content-trends/security/key-vault-service.ts` | Non | `AZURE_KEY_VAULT_URL`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_USE_MANAGED_IDENTITY` |
| Apify | Scraping | `lib/ai/content-trends/apify/*`, `app/api/ai/content-trends/*` | Oui | `APIFY_API_TOKEN`, `APIFY_WEBHOOK_SECRET` |
| Meta/Instagram Graph | Social OAuth/Publish | `lib/services/instagramOAuth.ts`, `lib/services/instagramPublish.ts`, `src/lib/integration/instagram.ts`, `lib/marketing-war-room/publish-instagram-reel.ts`, `worker/platforms/instagram.ts` | Oui | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI`, `INSTAGRAM_WEBHOOK_SECRET`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` |
| TikTok API | Social OAuth/Publish | `lib/services/tiktokOAuth.ts`, `lib/services/tiktokUpload.ts`, `src/lib/integration/tiktok.ts`, `lib/marketing-war-room/publish-tiktok-direct-post.ts`, `worker/platforms/tiktok.ts` | Oui | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `NEXT_PUBLIC_TIKTOK_REDIRECT_URI`, `TIKTOK_SANDBOX_MODE`, `TIKTOK_WEBHOOK_SECRET` |
| Reddit API | Social OAuth/Publish | `lib/services/redditOAuth.ts`, `lib/services/redditPublish.ts`, `src/lib/integration/reddit.ts` | Non | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `NEXT_PUBLIC_REDDIT_REDIRECT_URI`, `REDDIT_USER_AGENT`, `REDDIT_TEST_SUB` |
| Threads (via Instagram API) | Social OAuth | `app/api/auth/threads/callback/route.ts` | Non | `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `NEXT_PUBLIC_THREADS_REDIRECT_URI` |
| Twitter/X API | Social Insights | `src/lib/integration/twitter.ts`, `src/lib/twitter/worker.ts` | Non | `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ID` |
| Google OAuth | Auth | `lib/auth/config.ts`, `app/api/auth/google/route.ts` | Non | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` |
| OnlyFans Webhooks | Webhook | `app/api/onlyfans/webhooks/route.ts`, `lib/automations/webhook-integration.ts` | Oui | `ONLYFANS_WEBHOOK_SECRET` (+ éventuellement `ONLYFANS_API_KEY`) |
| CRM Webhooks (placeholder) | Webhook | `app/api/crm/webhooks/*` | Oui | `CRM_WEBHOOK_SECRET` |
| OnlyFans Dashboard (upstream) | HTTP API | `src/lib/of/dashboard-service.ts` | Non | `ONLYFANS_DASHBOARD_API_URL`, `ONLYFANS_DASHBOARD_PATH`, `ONLYFANS_DASHBOARD_TOKEN` / `ONLYFANS_DASHBOARD_API_KEY` |
| Slack Webhook | Alerting | `lib/services/alertService.ts`, `lib/ai/canary/alerting.ts`, `lib/monitoring/hydrationProductionMonitor.ts` | Non | `SLACK_WEBHOOK_URL` |
| Hydration Monitoring (custom) | Observability | `lib/monitoring/hydrationProductionMonitor.ts` | Non | `HYDRATION_MONITORING_ENDPOINT`, `HYDRATION_MONITORING_API_KEY`, `HYDRATION_WEBHOOK_URL` |
| Proxy Providers (Bright Data/SmartProxy/Oxylabs) | Networking | `src/lib/of/proxy-manager.ts`, `infra/fargate/browser-worker/*` | Non | `BRIGHT_DATA_CUSTOMER`, `BRIGHT_DATA_PASSWORD`, `BRIGHT_DATA_ZONE`, `PROXY_LIST` |
| Sentry | Monitoring | `app/api/monitoring/hydration-errors/route.ts` (placeholder) | Non | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| Google Analytics | Analytics | Frontend (env only) | Non | `NEXT_PUBLIC_GA_ID` |
| Microsoft Entra ID (Azure AD) | OAuth/OIDC | `lib/ai/content-trends/security/entra-id-service.ts` | Non | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_REDIRECT_URI` |

---

## Webhooks (endpoints)

### TikTok
- Endpoint: `app/api/webhooks/tiktok/route.ts` (`POST /api/webhooks/tiktok`)
- Signature: header `x-tiktok-signature` + secret `TIKTOK_WEBHOOK_SECRET`
- Idempotence: basée sur un `externalId` stable (id événement si fourni, sinon hash du payload)
- Pannes courantes: signature manquante, payload incomplet (`event_type`), retries côté TikTok

### Instagram/Meta
- Endpoint: `app/api/webhooks/instagram/route.ts` (`POST /api/webhooks/instagram` + `GET` challenge)
- Signature: `x-hub-signature-256` + secret `INSTAGRAM_WEBHOOK_SECRET`
- Vérification challenge: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Pannes courantes: signature absente, JSON invalide, événements sans ID (nécessite fallback hash)

### OnlyFans
- Endpoint: `app/api/onlyfans/webhooks/route.ts` (`POST /api/onlyfans/webhooks`)
- Signature: `x-onlyfans-signature` + secret `ONLYFANS_WEBHOOK_SECRET`
- Pannes courantes: secret absent (endpoint doit être désactivé en prod), doublons d’événements

### Apify (Content Trends)
- Endpoint: `app/api/ai/content-trends/webhook/route.ts` (`POST /api/ai/content-trends/webhook`)
- Signature: `x-apify-signature` + `x-apify-timestamp` + secret `APIFY_WEBHOOK_SECRET`
- Protections: timestamp anti-replay, rate limiting, idempotence TTL 24h
- Pannes courantes: secret non configuré, timestamp expiré, payload trop gros, 429

### CRM (placeholder)
- Endpoint: `app/api/crm/webhooks/[provider]/route.ts`
- Signature: header `x-crm-signature` (HMAC-SHA256) + secret `CRM_WEBHOOK_SECRET`
- **Doit** être protégé par secret en prod (sinon surface d’attaque “open webhook”)
- Idempotence: basée sur le hash du payload + type d’événement (préfixé par provider)

### Worker Trigger (webhook worker)
- Endpoint: `app/api/workers/webhooks/route.ts`
- Auth: `WORKER_SECRET` (Bearer)
- Pannes courantes: endpoint ouvert si secret absent (doit être désactivé en prod)

---

## Points de panne (checklist rapide)

- **Timeouts**: AI (OpenAI/Anthropic/Azure), Social publish, Key Vault, Dashboard upstream
- **Rate limits**: TikTok (publishing), Reddit (429), Meta Graph (quota), Slack webhook
- **Idempotence**: tous les webhooks + opérations “publish” (éviter doublons)
- **Secrets manquants**: webhooks (Apify/OnlyFans/TikTok/Instagram), Stripe webhook secret
- **Sandbox vs prod**: TikTok sandbox (`TIKTOK_SANDBOX_MODE`), Stripe `sk_test`/`sk_live`
- **Alerting webhooks**: Slack/custom hydration (429/5xx, retries)
- **Proxies**: Bright Data/SmartProxy/Oxylabs (pannes réseau = automation OnlyFans instable)
