Huntaze App (Next.js) — Production env to enable Azure smoke + summarizer

Scope: app.huntaze.com (Next.js). This enables GET /api/ai/azure/smoke to return JSON and aligns public base URLs.

Required environment variables (production)

- ENABLE_AZURE_AI=1
- AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.openai.azure.com/
- AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
- AZURE_OPENAI_API_KEY=<your-key>
- AZURE_OPENAI_API_VERSION=2024-10-21
- USE_AZURE_RESPONSES=1

- NEXT_PUBLIC_APP_URL=https://app.huntaze.com
- NEXT_PUBLIC_API_URL=https://app.huntaze.com/api

Optional (not required for smoke)

- DEBUG_TOKEN, DEBUG_USER, DEBUG_PASS (for /debug routes)
- ADMIN_TOKEN, ADMIN_IP_ALLOWLIST (for protected admin endpoints)

Apply steps

1) Open your hosting provider’s env settings for app.huntaze.com (e.g., Vercel/Amplify) and set the variables above for the Production environment.
2) Redeploy the app.
3) Validate smokes (from your terminal):

   - curl -sS https://app.huntaze.com/api/ai/azure/smoke | jq .
   - curl -sS -X POST https://app.huntaze.com/api/analytics/ai/summary/run \
       -H 'content-type: application/json' \
       -d '{"account_id":"acct_cli","period":"7d","platform":"instagram"}' | jq .

Expected results

- /api/ai/azure/smoke returns JSON with { status: 'ok', provider: 'azure', host, deployment, usage }.
- Summary run responds 202/200; data written to huntaze_production; ai_summary_* metrics exposed.

Notes

- The smoke route in code is gated by ENABLE_AZURE_AI. Without ENABLE_AZURE_AI=1, it returns 404 and the router may serve an HTML shell.
- Keep the EventBridge Scheduler disabled while validating to avoid unintended Fargate spend.
