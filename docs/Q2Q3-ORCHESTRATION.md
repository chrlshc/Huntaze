Q2–Q3 Orchestration (AWS)

Environment variables (runtime)
- `AWS_REGION=us-east-1`
- `POSTGRES_HOST=huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com`
- `POSTGRES_DB=huntaze`
- `POSTGRES_USER=huntazeadmin`
- `POSTGRES_PASSWORD=<your_rds_password>`
- `SQS_AI_QUEUE=huntaze-ai-processing`
- `SQS_ANALYTICS_QUEUE=huntaze-analytics`
- `SQS_WEBHOOKS_QUEUE=huntaze-webhooks`
- `SQS_EMAIL_QUEUE=huntaze-email`
- Optional ML: `S3_BUCKET=<us-east-1-bucket-for-ml>`
- Optional Azure OpenAI:
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_OPENAI_DEPLOYMENT_NAME` (ou `AZURE_OPENAI_CHAT_DEPLOYMENT`)
  - `AZURE_OPENAI_API_VERSION` (par défaut: `2024-02-15-preview`)
- Internal API guard (recommended):
  - `HUNTAZE_INTERNAL_API_KEY` and send header `x-huntaze-internal-key: <key>` to protected routes

AI Queue Worker
- Endpoint: `GET /api/queues/ai/process` runs one batch via `queueProcessors.processAIQueue()`.
- Local poller: `scripts/ai-queue-worker.sh` (defaults to `http://localhost:3000`, 5s interval)
  - Example: `HUNTAZE_API_BASE=https://your-app INTERVAL_SECONDS=3 bash scripts/ai-queue-worker.sh`
- SQS Consumer (recommended): `scripts/ai-sqs-consumer.js` (long-polling, batch, visibility)
  - Run: `npm run queue:ai:consumer` or `pm2 start ecosystem.config.js --only ai-sqs-consumer`
  - Uses Python orchestrator per platform (`automation/multi_platform_traffic.py`).

Python Orchestrator (Q2–Q3)
- File: `automation/huntaze_q2q3_aws.py`
- No hard dependency on external libs; uses optional `psycopg2`/`boto3` if available.

Commands
- Predict (ML Analytics, S3 tolerant):
  - `python3 automation/huntaze_q2q3_aws.py predict`
  - If `S3_BUCKET` set and `boto3` available, uploads JSON to `s3://$S3_BUCKET/ml/predictions/<ts>.json`
  - Without S3, runs predict-only and prints a summary.

- A/B Test (stores metrics in Postgres):
  - `python3 automation/huntaze_q2q3_aws.py abtest experiment=caption_test variant=B metric=ctr value=0.137 user_id=<uid>`
  - Creates table `ab_tests` if missing.

- DM Automation (Azure OpenAI if configured):
  - `python3 automation/huntaze_q2q3_aws.py dm user_id=<uid> platform=onlyfans conversation_id=abc123 message="Hey! Any new content?"`
  - Writes both user and assistant messages to `dm_conversations` (creates if missing).

- Content Generation (stores ideas in Postgres):
  - `python3 automation/huntaze_q2q3_aws.py content user_id=<uid> platform=instagram topic="new set release"`
  - Inserts into `generated_content` (creates if missing).

Notes
- The script is safe to run without Postgres/Azure/S3 configured; it falls back to dry-run behavior and logs accordingly.
- The queue worker route avoids any Core redeploy and uses your existing SQS and Python Q1 bridge.
- Optional platform clients (official APIs) available:
  - `automation/clients/instagram_graph.py` (container → media_publish)
  - `automation/clients/tiktok_api.py` (Content Posting API)
  - `automation/clients/reddit_praw.py` (PRAW)
