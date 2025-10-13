# app.huntaze.com – Integration & SSO Checklist

This is a concise, actionable checklist to ensure the OnlyFans-assisted features and the web app are properly integrated at `app.huntaze.com`, with safe AWS SSO setup and environment variables.

## 1) Domain & Hosting
- Target URL: `https://app.huntaze.com`
- Hosting: AWS Amplify (recommended) or ECS/ALB.
- Confirm DNS for `app.huntaze.com` points to Amplify app or ALB/CloudFront as applicable.

## 2) Build Config (Amplify)
- File: `amplify.yml` already sets:
  - `NEXT_PUBLIC_APP_URL=https://app.huntaze.com`
  - `NEXT_PUBLIC_API_URL=https://app.huntaze.com/api`
  - `JWT_SECRET` for prod build validation
- In Amplify Console → App settings → Environment variables, add the runtime secrets listed in section 4.

## 3) AWS SSO (CLI)
- Preferred over pasting keys. Set up an SSO profile and log in:
  1. `aws configure sso`
     - SSO start URL: `https://d-906627e8bc.awsapps.com/start/#`
     - SSO region: `us-east-1`
     - Account + Role: choose the prod account/role
     - Profile name: `huntaze-sso`
  2. `aws sso login --profile huntaze-sso`
  3. Export the profile for scripts when needed:
     - `export AWS_PROFILE=huntaze-sso`
  4. Verify: `aws sts get-caller-identity`

Note: Avoid exporting static `AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN` in shells. Use SSO with short‑lived tokens or store secrets in AWS Secrets Manager/SSM.

## 4) Runtime Environment Variables
Add these in Amplify (or ECS Task Definition) – do not commit secrets:

- Core
  - `NODE_ENV=production`
  - `NEXT_PUBLIC_APP_URL=https://app.huntaze.com`
  - `NEXT_PUBLIC_API_URL=https://app.huntaze.com/api`
  - `JWT_SECRET=...` (matches server jwt usage)
  - `DATA_ENCRYPTION_KEY=` base64 32 bytes (`openssl rand -base64 32`)

- Auth/OAuth (as provisioned)
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://app.huntaze.com/auth/tiktok/callback`
  - Any other social keys in `.env.production` (move into Amplify env)

- Payments & Email
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `SES_FROM_EMAIL`
  - `AWS_REGION=us-east-1` (for SES)

- S3 Buckets (if used by runtime)
  - `S3_MEDIA_BUCKET`
  - `S3_VAULT_BUCKET`
  - `S3_EXPORTS_BUCKET`
  - `S3_ANALYTICS_BUCKET`

- OnlyFans Assisted (if AWS backend is enabled)
  - `OF_SESSIONS_BACKEND=aws`
  - `OF_AWS_REGION=us-east-1`
  - `OF_SQS_SEND_QUEUE_URL=<from CDK outputs>`
  - `OF_DDB_SESSIONS_TABLE=<from CDK outputs>`
  - `OF_DDB_MESSAGES_TABLE=<from CDK outputs>`
  - `OF_DDB_THREADS_TABLE=<from CDK outputs>`
  - `OF_KMS_KEY_ID=<from CDK outputs>`
  - Optional: `OF_BRIDGE_SECRET=<random strong secret>`

## 5) OnlyFans Features – App Integration
- Connect flow: `GET /of-connect` and `/of-connect/cookies` accept cookie ingestion for assisted mode.
- Dashboard: `/dashboard/onlyfans` shows summary cards, action list, and status.
- API endpoints under `app/api/of/*` provide login, inbox sync, campaign send, cookies ingestion, etc.
- Ensure `images.domains` in `next.config.mjs` includes `static.onlyfansassets.com` (already present).

## 6) AWS Backend (Optional, for scale)
If using the worker pipeline for inbox sync/send:
1. Bootstrap CDK if needed: `cdk bootstrap aws://<acct>/us-east-1`
2. Build CDK: `npm ci --prefix infra/cdk && npm run build --prefix infra/cdk`
3. Deploy stack: `npm exec --prefix infra/cdk -- cdk -a "node ./infra/cdk/dist/bin/huntaze-of.js" deploy HuntazeOfStack`
4. Capture stack outputs (DynamoDB tables, SQS URL, KMS key, ECS ARNs) and place into envs in section 4.

## 7) Deployment
- Amplify: push to the connected branch. The `amplify.yml` will run `npm ci && npm run build`.
- ECS/ECR (alternative):
  - `export AWS_PROFILE=huntaze-sso`
  - `./deploy-simple-aws.sh` to build, push ECR, and update ECS service.

## 8) Post‑Deploy Checks
- `https://app.huntaze.com/api/health` returns 200
- OAuth callbacks (Google/TikTok) complete without errors
- OnlyFans cookie ingestion page reachable and data stored
- Stripe webhook hits `POST /api/webhooks/stripe` and verifies signature

## 9) Security Notes
- Do not paste AWS keys in chat or commit `.env.production` with secrets.
- Move all secrets from files into Amplify Environment variables or Secrets Manager.
- Rotate any credentials that were shared or committed.

