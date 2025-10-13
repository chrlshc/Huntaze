# Onboarding — Infra & Worker OF

## Vue d’ensemble
ECS Fargate worker (2 vCPU / 8 GB) + Playwright headless. Artefacts → S3 (trace.zip, last.png, page.mp4). Sessions (cookies chiffrés KMS) → DynamoDB. Secrets (email/password) → Secrets Manager.

## Prérequis AWS
- Accès au VPC privé + NAT
- Bucket S3 artefacts avec SSE-KMS
- Tables DDB: HuntazeOfSessions, HuntazeOfMessages, HuntazeOfThreads
- Clé KMS (cookies)
- Rôles IAM (least-privilege)

## Variables de run (RunTask)
- `ACTION=login|inbox|send`
- `USER_ID`
- `OF_CREDS_SECRET_ID=of/creds/<userId>`
- `TRACE_S3_BUCKET`, `TRACE_S3_PREFIX=playwright-traces/`, `TRACE_KMS_KEY=<arn>`
- `APP_ORIGIN`, `WORKER_TOKEN`
- `OTP_CODE` (si 2FA)

## Traces & debug
- S3: structure `playwright-traces/<userId>/<ts>/`
- `npx playwright show-trace` pour rejouer
- CloudWatch Logs group: `/huntaze/of/browser-worker`
- ECS: `describe-tasks` pour `stoppedReason`, `exitCode`

## Bonnes pratiques login
- Aller sur `/login` avant fetch secrets
- Gérer consentement cookies
- “Use email” → “Continue” si présent
- Scope `role=dialog` + fallback typing si besoin
- Délai humain (2–5 s) entre actions

## Observabilité
- Publier `LoginFailures` et `MemoryUsageMB`
- Alarms: `OF-LoginFailures-gt5-per-hour`, `OF-MemoryUsageMB-gt7000`

## Sécurité
- Secrets jamais loggés
- Cookies chiffrés KMS (Base64) en DDB
- Auth interne: `WORKER_TOKEN` + `APP_ORIGIN`

## Rétention artefacts
- Lifecycle S3: **J+7** sur `playwright-traces/`

