# BYO-IP Runner (Prototype)

Agent Playwright local (BYO-IP) qui s’orchesTRE via AWS (API Gateway WebSocket + SQS + DynamoDB).
Ce dossier contient un workspace autonome pour itérer sans impacter l’app principale.

---

## 🚀 TL;DR (local → AWS)

1. **Prérequis**
   - Node 18+, npm
   - Chromium Playwright : `npx playwright install chromium`
   - URL WebSocket (déployé) : `wss://mmctt4ftb5.execute-api.us-east-1.amazonaws.com/prod`
   - URL SQS Jobs : `https://sqs.us-east-1.amazonaws.com/317805897534/HuntazeByoIpStack-JobsQueue86ED6666-Sb4vDLBEiszi`

2. **Install**
   ```bash
   npm --prefix examples/byo-ip-runner install
   ```

3. **Lancer l’agent (headful recommandé pour le 1er login)**

   ```bash
   cd examples/byo-ip-runner
   BYO_BACKEND_URL="wss://mmctt4ftb5.execute-api.us-east-1.amazonaws.com/prod" \
   AGENT_JWT="DEV-AGENT-123" \
   BYO_AGENT_ID="DEV-AGENT-123" \
   BYO_AGENT_VISIBLE=true \
   BYO_AGENT_MASTER_KEY="local-dev-secret-32+" \
   npm run agent
   ```

   Attendu : logs `socket_opened`, échange `hb` ↔ `hb_ack`, statut **online** dans DynamoDB/AgentsTable.

4. **Injecter un job (SQS)**

   * **DM simple**

     ```bash
     JOBS_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/317805897534/HuntazeByoIpStack-JobsQueue86ED6666-Sb4vDLBEiszi" \
     JOB_TYPE="send_dm" \
     AGENT_ID="DEV-AGENT-123" \
     RECIPIENT_ID="demo-fan" \
     TEXT="Hello from BYO-IP 👋" \
     node examples/byo-ip-runner/scripts/send-job.mjs
     ```
   * **Broadcast (checkpointable)**

     ```bash
     JOBS_QUEUE_URL="..." JOB_TYPE="broadcast_dm" AGENT_ID="DEV-AGENT-123" \
     RECIPIENTS="u1,u2,u3" TEXT="Promo ✨" IDEM_KEY="camp-test" \
     node examples/byo-ip-runner/scripts/send-job.mjs
     ```
   * **Schedule post**

     ```bash
     JOBS_QUEUE_URL="..." JOB_TYPE="schedule_post" AGENT_ID="DEV-AGENT-123" \
     TEXT="Scheduled post" SCHEDULED_AT="$(date -u -v+10M +%Y-%m-%dT%H:%M:00Z)" TZ="Europe/Paris" \
     node examples/byo-ip-runner/scripts/send-job.mjs
     ```

---

## 🧩 Architecture proto

* **Agent** : Node/Playwright, session OF persistée (storageState). Flows implémentés :

  * `send_dm` (cadence humaine)
  * `broadcast_dm` (pacing + checkpoint idempotent via `~/.byo-ip-ckpt.json`)
  * `schedule_post` (sélection date/heure, upload média)
  * `scrape_subs` (résultats structurés)
* **Backend AWS (déployé)** :

  * API GW WebSocket `wss://mmctt4ftb5.execute-api.us-east-1.amazonaws.com/prod`
  * SQS Jobs Queue (visibility 120s)
  * DynamoDB : `JobsTable`, `AgentsTable`, `CreatorLimits`
  * Lambdas : `ws-connect`, `ws-message`, `ws-disconnect`, `dispatcher-sqs`
  * S3 (patches/logs) KMS, métriques CloudWatch

**Protocole WS**

```json
# → agent
{ "t":"job_assign", "job": { "jobId":"...", "type":"...", "payload":{...} } }

# ← agent
{ "t":"hb", "v":"agent-x.y.z", "ts": 1690000000 }
{ "t":"job_ack", "id":"<jobId>" }
{ "t":"job_result", "id":"<jobId>", "status":"ok|error", "data":{...}, "err": {"code":"..."} }
{ "t":"circuit_breaker", "reason":"RATE_LIMITED|QUOTA_EXCEEDED" }
```

---

## 🔐 Auth WS (dev et prod)

* **Dev (fallback)** : si `WS_JWT_SECRET` non défini côté Lambda, `ws-connect` accepte `token` brut (utilisé comme `agentId`).
* **Prod (recommandé)** : JWT HS256 court (`agentId`, `creatorId`, `exp`), voir snippet d’émission (backend) et de vérif (Lambda).

---

## ⚙️ Variables d’environnement (agent)

| Var                             | Obligatoire | Description                                                                             |
| ------------------------------- | :---------: | --------------------------------------------------------------------------------------- |
| `BYO_BACKEND_URL`               |      ✅      | URL WebSocket (API GW), ex: `wss://mmctt4ftb5.execute-api.us-east-1.amazonaws.com/prod` |
| `AGENT_JWT` \| `BYO_AGENT_TOKEN` |      ✅      | Jeton (dev : libre ; prod : JWT HS256 signé)                                            |
| `BYO_AGENT_ID`                  |      ✅      | Identifiant stable de l’agent                                                           |
| `BYO_AGENT_VISIBLE`             |  optionnel  | `true` → Playwright headful (debug/login)                                               |
| `BYO_AGENT_MASTER_KEY`          |  recommandé | ≥32 chars ; chiffre `storageState`. Absent → session volatile (re-login possible)       |
| `BYO_AGENT_DEBUG_WS`            |  optionnel  | `true` → log verbeux des frames WS (debug réseau)                                       |

---

## 🧪 Runbook E2E (contrôles)

1. **WS** : `wscat -c "wss://.../prod?token=DEV-AGENT-123"` → envoyer `{"t":"hb","v":"agent-1.0.0","ts":1690000000}` → recevoir `hb_ack`.
2. **SQS → assignation** : `aws sqs send-message ...` comme ci-dessus → `dispatcher-sqs` pousse `job_assign`.
3. **Agent** : `job_ack` puis `job_result`.
4. **Vérifs**

   * DynamoDB/JobsTable : `status = succeeded|failed`
   * CloudWatch Metrics : `Huntaze/ByoIP -> JobsAssigned / JobsCompleted / JobsFailed`
   * DynamoDB/AgentsTable : `status = online`, `lastHbAt` récent

---

## 🛡️ Garde-fous & conformité

* **Rate-limit local** : token-bucket (par défaut DM : 20/h, burst 5), pacing + jitter.
* **Broadcast** : checkpoint idempotent (`idem_key`) → reprise exacte.
* **Circuit breaker** : si `RATE_LIMITED` répété ou quota dépassé → `t:"circuit_breaker"`, l’agent se met en pause & notifie le backend.
* **Logs** : JSONL local **sans secrets** (redaction). Upload S3 **opt-in** (KMS).

---

## 🧰 Dépannage (FAQ)

* **Luxon introuvable** → `npm --prefix examples/byo-ip-runner install`
* **Pas de `BYO_AGENT_MASTER_KEY`** → OK (session volatile) ; pour persister, fournis une clé ≥32 chars
* **Acks ignorés** → l’agent envoie bien `t:"hb" | "job_ack" | "job_result"` (vérifier via `BYO_AGENT_DEBUG_WS=true`)
* **Token invalide** → activer JWT HS256 côté Lambda (`WS_JWT_SECRET`) et signer côté backend

---

## 📜 Taxonomie d’erreurs (extrait)

| code               | retry | remarque                                                   |
| ------------------ | :---: | ---------------------------------------------------------- |
| `NETWORK`          |   ✔   | backoff expo jusqu’à 5 min                                 |
| `NAV_TIMEOUT`      |   ✔   | idem                                                       |
| `RATE_LIMITED`     |   ✔   | pause + backoff ; déclenche circuit-breaker si répétitions |
| `LOGIN_REQUIRED`   |   ✖   | stop, demander action utilisateur (login/2FA)              |
| `CONTENT_BLOCKED`  |   ✖   | fatal                                                      |
| `POLICY_VIOLATION` |   ✖   | fatal (garde-fous backend)                                 |
