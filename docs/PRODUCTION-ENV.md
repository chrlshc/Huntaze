Huntaze Production Environment

Variables à poser (production)
- AWS/Queues
  - `AWS_REGION=us-east-1`
  - `SQS_AI_QUEUE=huntaze-ai-processing`
  - `SQS_ANALYTICS_QUEUE=huntaze-analytics`
  - `SQS_WEBHOOKS_QUEUE=huntaze-webhooks`
  - `SQS_EMAIL_QUEUE=huntaze-email`
- Postgres (RDS existant)
  - `POSTGRES_HOST=huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com`
  - `POSTGRES_DB=huntaze`
  - `POSTGRES_USER=huntazeadmin`
  - `POSTGRES_PASSWORD=<mdp>`
- Azure OpenAI
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_OPENAI_DEPLOYMENT_NAME` (ex: gpt-4o)
  - `AZURE_OPENAI_API_VERSION` (ex: 2024-02-15-preview)
- Plateformes (officielles)
  - Instagram Graph: `IG_USE_GRAPH=1`, `META_PAGE_ACCESS_TOKEN`, `IG_USER_ID`
  - TikTok Content API: `USE_TT_API=1`, `TT_ACCESS_TOKEN`
  - Reddit PRAW: `USE_REDDIT_OFFICIAL=1`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER`, `REDDIT_PASS`
- Optionnel ML: `S3_BUCKET=<bucket-us-east-1>`
- Guard interne: `HUNTAZE_INTERNAL_API_KEY`
- Redis (idempotence): `REDIS_URL=redis://...`

Fichiers utiles
- `deployment/prod-env.template.sh` → à copier en `deployment/prod-env.sh` et à sourcer en prod.
- `deployment/pm2-start-consumer.sh` → démarre le consumer PM2 (ai-sqs-consumer).
- `scripts/prod-validate.sh` → script de validation (health + enqueue sample).

Validation rapide (prod)
1) Démarrer le consumer: `pm2 start ecosystem.config.js --only ai-sqs-consumer --env production` (ou `deployment/pm2-start-consumer.sh`)
2) Health check: `GET /api/health/platforms`
3) Dashboard UI: `/app/dashboard/api-status`
4) Enqueue sample: `curl -X POST "$HUNTAZE_API_BASE/api/queues/ai/publish-sample" -H "x-huntaze-internal-key: <key>" -H "content-type: application/json" -d '{"platform":"reddit","subreddit":"OnlyFans101"}'`
5) Logs: `pm2 logs ai-sqs-consumer`

