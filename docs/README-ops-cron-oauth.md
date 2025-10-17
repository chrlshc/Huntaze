# Ops — Cron & OAuth Tokens

## 1) Architecture & flux
- Endpoint cron: `GET /api/cron/refresh-oauth` sécurisé par header `x-cron-secret` (ou `x-vercel-cron`).
- Anti-chevauchement: lock via `UpdateItem` conditionnel (`userId='cron'`, `platform='refresh-oauth'`, `expiresAt`). Les runs concurrents sont skipped.
- DynamoDB: table `huntaze-oauth-tokens` (PAY_PER_REQUEST) + GSI `byExpiry` (PK=`platform`, SK=`expiresAt`).
  - Requêtes par plateforme (pas de Scan):
    - `reddit`: `expiresAt <= now + 20m`
    - `tiktok`: `expiresAt <= now + 12h`
    - `instagram`: `expiresAt <= now + 7d`
- Déclencheurs cron (redondants, activables/désactivables indépendamment):
  - Vercel Cron: `vercel.json` ⇒ `*/30 * * * *` → `GET /api/cron/refresh-oauth`
  - EventBridge → API Destination: rule `rate(30 minutes)` → Connection (header `x-cron-secret`) → API Destination vers `https://huntaze.com/api/cron/refresh-oauth`
  - Fallback GitHub Actions: `.github/workflows/refresh-oauth.yml`
- Amplify Hosting:
  - Build SSR (Node 20) sans `export` d’env dans `amplify.yml`; variables via Amplify Console.
  - Rewrites & Redirects (ordre important):
    1) `/api/auth/*` → local
    2) `/api/cron/*` → local
    3) `/api/*` → `https://api.huntaze.com/api/<*>`

---

## 2) Runbook (opérations courantes)

### Ping manuel sécurisé
```bash
curl -i -X GET "https://huntaze.com/api/cron/refresh-oauth" \
  -H "x-cron-secret: <CRON_SECRET>"
# Attendu: 200 + { ok, refreshed, results }
```

### Vérifications après déploiement / cutover
- Vercel Cron: redeploy ⇒ vérifier que `vercel.json` est pris en compte ; vérifier les logs après ~30 min.
- EventBridge: exécuter `scripts/create-eventbridge-cron.sh` puis observer la rule `rate(30 minutes)` (métriques `Invocations`/`FailedInvocations`) et, si configuré, la DLQ.
- OAuth flows (Cognito requis):
  - Instagram: `/auth/instagram` → callback → `GET /api/platforms/status`
  - TikTok: `/api/auth/tiktok` → `/auth/tiktok` (PKCE) → callback → status
  - Reddit: `/auth/reddit` → callback → status
- DynamoDB: vérifier que `expiresAt` est repoussée selon la plateforme. Utiliser la GSI:
  - KeyConditionExpression (ex.): "platform = :p AND expiresAt <= :t"
  - Projection minimale (éviter d’hydrater des attributs inutiles)

### Variables & IAM
- Amplify Console: toutes les `GOOGLE_`, `INSTAGRAM_`, `TIKTOK_`, `REDDIT_`, `THREADS_`, `NEXT_PUBLIC_*`, `AWS_REGION`, `CRON_SECRET` (+ `AWS_ACCESS_KEY_ID/SECRET` si mode creds).
- IAM minimal (si runtime avec creds): `infra/policies/oauth-tokens-minimal-iam.json` (table + index), à attacher au rôle de l’app.

---

## 3) Dépannage & sécurité
- Run "skipped": causé par le lock actif → attendre l’expiration ou lever le lock via `UpdateItem` conditionnel (à manier avec précaution).
- EventBridge:
  - Ajouter RetryPolicy + DLQ SQS sur le target pour inspecter les échecs réels (code/latence côté endpoint).
  - Surveiller `AWS/Events:FailedInvocations` et `InvocationsSentToDlq`.
- Vercel: les requêtes cron arrivent en GET avec UA `vercel-cron/1.0`; vérifier les logs.
- Hygiène DDB: activer TTL si vous stockez des tokens périmés/invalidés pour cleanup automatique (suppression asynchrone, quelques jours).
- Sécurité: garder `CRON_SECRET` et clés OAuth en secrets (Vercel/Amplify/GHA). Éviter d’exposer les valeurs dans les logs d’API.

---

## 4) Références
- EventBridge API Destinations & Connections: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-api-destinations.html
- EventBridge RetryPolicy & DLQ: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-targets2.html#eb-targets-https-api
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Amplify Rewrites & Redirects: https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html
- DynamoDB Query vs Scan & TTL:
  - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html
  - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
