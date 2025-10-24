# Architecture et Runbook d’Exploitation — Huntaze (Beta 2025)

Ce document synthétise l’infrastructure actuelle de Huntaze, les éléments clés déjà en place, et les recommandations à plus fort ROI pour verrouiller la prod (sécurité, CI/CD, observabilité, multi‑agents IA, conformité, robustesse des intégrations).

## Résumé des points critiques

Huntaze exploite une stack unifiée Next.js + AWS Amplify (CloudFront managé), couche LLM flexible (Azure OpenAI), intégrations sociales (TikTok/Instagram/OnlyFans), observabilité (Prometheus/CloudWatch), et un pipeline CI/CD multi‑environnements. Pour pérenniser la prod : sécurité périmètre (WAF, headers), rotation des secrets, SLOs + alerting, anti‑abus API, failover LLM, conformité PII, et robustesse CI/CD (runbook d’oncall).

---

## 1) Vue d’Ensemble Applicative

- Frontend/SSR
  - Next.js (App Router, API routes SSR) déployé via AWS Amplify Hosting.
  - Distribution CDN CloudFront (managé par Amplify), build via `amplify.yml`.
- Domaines & DNS
  - `app.huntaze.com` (prod), `kpi.huntaze.com` (interne), `stagging.huntaze.com` (pré‑prod), `huntaze.com`/`www` (marketing).
  - CNAME CloudFront managé, DNS via Cloudflare/Route53.
- CI/CD
  - Amplify Console multi‑branches ; `RELEASE` manuel/scripté ; invalidation CDN instantanée.
- Observabilité
  - Logs SSR dans CloudWatch (par branche), KPIs via Logs Insights + endpoints smoke/health.
  - Prometheus pour métriques LLM/social + alertes.
- Intégrations sociales
  - TikTok OAuth v2 (authorize v2 + token v2), Instagram (Basic Display pour smoke → migration Graph API), OnlyFans connect/status + worker.
- Multi‑agents IA
  - Abstraction LLM (Claude/OpenAI via Azure), smoke IA durci, analytics (summarizer IG/TikTok : Redis → DB).
- Données & Stockage
  - Redis (snapshots), DB SQL (schema), S3/ECR si scaling jobs.

---

## 2) Sécurité & Secret Management

### 2.1 Sécurité périmètre & headers
- WAF CloudFront
  - Attacher un WebACL : `AWSManagedRulesCommonRuleSet` + `BotControl` + rate‑based (5m).
  - Logs WAF activés (Athena/Glue pour requêtes ad‑hoc).
- Headers sécurité
  - HSTS (preload), CSP (script/img), X‑Frame‑Options, Referrer‑Policy.
  - Injection via fonction CloudFront (ou headers Next pour SSR statique).

### 2.2 Secrets & rotation
- Rotation clés API (Azure/TikTok) : 2 clés → Key2 (on) → bascule app → rotate Key1.
- Jamais de secrets en `NEXT_PUBLIC_*`.
- GitHub secret scanning + push protection.
- Stockage secrets recommandé : Key Vault / AWS Secrets Manager (backer les env Amplify).

---

## 3) Orchestration LLM / Multi‑Agents & Résilience

- LLM providers : `src/services/llm-providers.ts` (draft/guardrails).
- Azure OpenAI (Chat Completions)
  - `AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.services.ai.azure.com`
  - `AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini`
  - `AZURE_OPENAI_API_VERSION=2024-08-01-preview`
  - `AZURE_OPENAI_API_KEY=<resource key>` (server‑only)
- Smoke IA durci
  - `GET /api/ai/azure/smoke` : lit l’env à chaque requête, JSON explicite (`ok/disabled/misconfigured/error` + endpoint/deployment/apiVersion/usage).
- Failover LLM (reco)
  - Double déploiement (blue/green) + bascule si 5xx>seuil, APIM possible en front (quotas/backoff global).

---

## 4) APIs, Intégrations Sociales & Robustesse

- TikTok OAuth v2
  - Authorize : `https://www.tiktok.com/v2/auth/authorize/` (client_key, state, scopes).
  - Token : `https://open.tiktokapis.com/v2/oauth/token` (body incl. `client_key`).
  - Redirect URIs exactes.
- Instagram
  - 307 OK pour smoke ; migration → Instagram Graph API (Facebook Login) pour durabilité.
- OnlyFans
  - Connect/status (démos) + worker headless (Playwright) si activé.
- Robustesse API
  - Rate‑limit middleware (route‑scoped) sur callbacks/AI/admin.
  - Idempotency keys + DLQ (outbox/dispatch) pour éviter doublons/pertes.

---

## 5) Observabilité, SLOs & CI/CD

### 5.1 Observabilité
- Prometheus : métriques LLM/social (latences, errrates, tokens), alertes SLO (Slack).
- CloudWatch Logs Insights : KPIs activation (queries doc : `docs/KPI-RUNBOOK.md`).
- Retention logs : 30–90j + scrubbing PII.

### 5.2 SLOs & CI/CD
- SLO Azure : uptime smoke 99.9%/30j, alert >1% non‑200/10min, p95 contrôlé.
- Amplify RELEASE + invalidation CDN (`/*`) après déploiement.
- Smokes auto pré‑prod : Azure/kpi/health/OAuth.
- Runbook oncall : RELEASE, invalidation, smokes, rollback.

---

## 6) Données, Stockage & Conformité

- Backups : snapshots réguliers DB/Redis/S3 + test de restore.
- Chiffrement at rest/transit ; masquage PII en logs.
- GDPR : exports/suppressions (APIs dédiées si nécessaire).

---

## 7) Recommandations Actionnables (verrou prod)

- Sécurité
  - Activer WAF CloudFront + logs.
  - Injecter headers HSTS/CSP/XFO/Referrer‑Policy.
  - Rotation périodique secrets Azure/TikTok + secret scanning GitHub.
- Observabilité
  - SLOs smoke/KPI avec alertes (Prometheus).
- Robustesse
  - Rate‑limit callbacks/AI, idempotency + DLQ outbox.
  - Failover LLM (blue/green) + APIM en front (option).
- CI/CD & Runbook
  - Runbook ONCALL 1‑pager (RELEASE/invalidate/smokes/rollback).
  - Éviter `s-maxage` sur routes SSR sensibles (smoke/oauth/kpi).
- Conformité
  - Backups/restore testés ; retention logs PII‑safe ; GDPR‑ready.

---

## Annexes — Commandes utiles

- Amplify RELEASE
  - `aws amplify start-job --app-id <id> --branch-name prod --job-type RELEASE`
- Invalidation CDN (Amplify Hosting)
  - Console Amplify → Branch prod → Invalidate cache (`/*`).
- Azure sanity cURL (Chat Completions)
  - `curl -sS -X POST -H "api-key: $KEY" -H "Content-Type: application/json" \`
  - `"https://huntaze-ai-hub-eus2.services.ai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview" \`
  - `-d '{"messages":[{"role":"user","content":"ping"}]}'`
- OAuth checks (HEAD)
  - `curl -sSI https://app.huntaze.com/api/auth/tiktok | grep -i ^location`
  - `curl -sSI https://app.huntaze.com/auth/instagram | grep -i ^location`

---

Dernière mise à jour : 2025‑10‑20

