# Huntaze BYO-IP — Infra CDK (AWS)

## Composants déployés
- API Gateway **WebSocket** (stage `prod`) → Lambdas `ws-connect`, `ws-message`, `ws-disconnect`
- **SQS** `JobsQueue` (visibility 120s) → Lambda `dispatcher-sqs`
- **DynamoDB** : `JobsTable`, `AgentsTable`, `CreatorLimits`
- **S3** : `AgentPatchesBucket` (versionné, KMS), `AgentLogsBucket` (KMS)
- **CloudWatch** : métriques (`Huntaze/ByoIP`) + dashboard

## Outputs (CloudFormation)
- `WebSocketUrl` : `wss://mmctt4ftb5.execute-api.us-east-1.amazonaws.com/prod`
- `JobsQueueUrl` : `https://sqs.us-east-1.amazonaws.com/317805897534/HuntazeByoIpStack-JobsQueue86ED6666-Sb4vDLBEiszi`

## Déploiement
```bash
npm i
npm run build
npm run deploy
```

## Auth WS (JWT HS256)

* Var Lambda `WS_JWT_SECRET` (Secrets Manager recommandé)
* `ws-connect` vérifie `?token=<JWT>` (claims : `agentId`, `creatorId`, `exp` court)

## Observabilité

* Metrics : `JobsAssigned`, `JobsCompleted`, `JobsFailed`, `AgentHeartbeats`
* Logs : CloudWatch Logs (Lambdas)
* SNS pour alertes (DLQ, backlog, erreurs/throttles, durée élevée, partial-fail)

### Dashboards

- New consolidated: `BYOIP-Ops-${STAGE}` (primary)
- Deprecated (temporary): `ByoIpRunner-${STAGE}` — banner with link to the new dashboard

### Alerting (SNS Email)

Avant `deploy`, vous pouvez câbler un email d’alerte:

```bash
export OPS_ALERTS_EMAIL=ops@exemple.com   # remplacez par votre email
cd infra/aws-cdk && npm run build && npm run deploy
```

Outputs:
- `OpsAlertsTopicArn` pour s’abonner manuellement si besoin.

Les alarmes notifiantes incluent:
- DLQ non vide (OK action lorsqu’elle est vidée)
- Backlog (age-of-oldest élevé)
- Erreurs/Throttles/Durée élevée (dispatcher)
- Pourcentage d’échecs partiels (custom metrics)
- Composite: `DLQNotEmpty OR (DispatcherErrors AND Backlog)`

#### Toggle: composite-only vs all

Contrôlez quelles alarmes envoient des emails via une variable d’environnement au déploiement:

```bash
export ALERT_MODE=composite   # 'composite' (défaut) ou 'all'
```

- `composite` : seule l’alarme composite envoie un email. Les unitaires restent visibles sur le dashboard. DLQ a une action OK pour fermer la boucle.
- `all` : les alarmes unitaires envoient aussi un email (DLQ, backlog, errors, throttles, duration, partial-fail, heartbeats, stale-conn).

### SQS visibility timeout

`JobsQueue` est configurée avec `visibilityTimeout=360s` (>= 6 × timeout Lambda 60s) pour suivre les bonnes pratiques AWS.

### Contexte/Stage

Les métriques custom `Huntaze/Dispatcher` incluent la dimension `Stage` (var d’env `STAGE`, défaut `prod`). Définissez-la si besoin:

```bash
export STAGE=staging
```

### Redrive depuis la DLQ

Une redrive allow policy est appliquée: vous pouvez renvoyer les messages de la DLQ vers la queue principale après correction.
Exemple AWS CLI:

```bash
MAIN_Q_URL=$(aws sqs get-queue-url --queue-name <MainQueueName> --query QueueUrl --output text)
DLQ_URL=$(aws sqs get-queue-url --queue-name <DlqName> --query QueueUrl --output text)
aws sqs receive-message --queue-url "$DLQ_URL" --max-number-of-messages 10 --wait-time-seconds 1 \
  | jq -r '.Messages[] | .ReceiptHandle + "\t" + .Body' \
  | while IFS=$'\t' read -r rh body; do
      aws sqs send-message --queue-url "$MAIN_Q_URL" --message-body "$body" && \
      aws sqs delete-message --queue-url "$DLQ_URL" --receipt-handle "$rh"; done
```

## Triage Runbook

> One-pager for on-call. Use with the **BYOIP-Ops-${STAGE}** dashboard.

### Pre-flight
1. Open dashboard: BYOIP-Ops-${STAGE}.
2. Note which alarms fired (Alarm widget) and the time window.
3. Confirm recent deploys or config changes (CDK, Lambda env, SQS).

---

### A. DLQ Not Empty
**Signal:** `DLQ visible > 0` (and DLQ alarm firing)

1) Sample messages (3–5) to identify cause (don’t purge):
- Poison pill (bad JSON / missing `agentId`).
- Transient (agent offline / 410 / delivery 4xx).
- Unexpected (schema/regression).

2) Fix cause:
- Bad payload → rollback/patch dispatcher or producer.
- Agent offline → see E. Stale connections.
- Schema mismatch → bump emitter & handler together.

3) Redrive safely:
- Console: “Redrive to source queue”.
- CLI (API: StartMessageMoveTask):
  ```bash
  aws sqs start-message-move-task \
    --source-arn arn:aws:sqs:<region>:<acct>:<DLQ_NAME> \
    --destination-arn arn:aws:sqs:<region>:<acct>:<MAIN_QUEUE_NAME> \
    --max-number-of-messages-per-second 50
  ```

Verify: DLQ visible → 0, backlog/age trending down.

Do not purge the DLQ unless explicitly agreed in incident notes.

---

### B. Main Queue Backlog / Age High

**Signal:** `ApproxAgeOfOldestMessage` > threshold; composite alarm may fire.

Checklist:

- CloudWatch Lambda Errors/Throttles graphs.
- If Throttles > 0 → raise reserved concurrency or lower event-source concurrency; confirm `maxBatchingWindow=10s` is applied.
- If Duration p95 ~ timeout → investigate slowness (downstream calls, retries); consider raising timeout or optimizing handler.
- If Errors spike with 4xx/5xx → jump to D. Lambda errors.

Recovery: once function processes faster than arrival rate, age/backlog will decay.

---

### C. Partial-Fail % > 10% (custom math)

**Signal:** `100 * failures / MAX(1, items)` > 10 (for ≥2/3 periods)

Likely causes:

- Campaign targeting a large segment while many agents are offline.
- New input schema causing selective rejects.
- Site-level change causing certain items to fail mid-batch.

Actions:

1. Check Agent heartbeats trend; if fleet dip → pause campaigns, re-try later.
2. Inspect Lambda logs by reason code (see Queries).
3. If a specific segment is bad, disable that segment and requeue others.

---

### D. Lambda Errors / Duration / Throttles

Errors

- Open Logs Insights (see queries below).
- Classify by reason (`json_invalid`, `agent_missing`, `delivery_410`, etc.).
- Fix fast-failers in dispatcher; prefer partial-batch fail to keep good items flowing.

Duration

- If p95 > 80% of timeout (48s for 60s timeout), check:
  - External calls (OnlyFans, Dynamo, S3) latency.
  - Batch size too big? Reduce work per batch.
  - Add short-circuit paths for clearly bad items.

Throttles

- Raise reserved concurrency or reduce event-source concurrency / batch rate.
- If sustained, consider sharding queues by segment.

---

### E. “Stale Connections” / 410 Spikes

**Signal:** Metric filter alarm on `status=410` (stale/closed WS, agent offline)

1. Check Agent heartbeats metric. If down:
   - Verify agent service/process is running on creator device.
   - If prolonged, backend should hold non-critical jobs and notify creator.
2. For live campaigns, enable circuit breaker: pause after threshold breaches and alert.

---

### F. Verification & Close

- DLQ visible: 0
- Main queue age: trending to baseline
- Errors/Throttles: 0 (or back to normal)
- Partial-fail %: < 10% for ≥2 periods
- Add a brief incident note if customer-impacting.

---

### Useful CloudWatch Logs Insights Queries

1) Error types breakdown (Lambda log group)

```sql
fields @timestamp, @message
| filter @message like /ERROR|Failed|status=/
| parse @message /reason=(?<reason>\w+)/ 
| stats count() as c by reason
| sort c desc
```

2) Stale connections (410) over time

```sql
fields @timestamp, @message
| filter @message like /status=410/
| stats count() as c by bin(5m)
```

3) Partial-batch failures context

```sql
fields @timestamp, @message, jobId, reason
| filter @message like /batch_item_failed/
| stats count() by reason, bin(1m)
```

---

### CLI Snippets

Redrive helper (preferred)

```bash
export AWS_REGION=<region>
scripts/redrive-dlq.sh \
  --source-arn arn:aws:sqs:<region>:<acct>:<DLQ_NAME> \
  --destination-arn arn:aws:sqs:<region>:<acct>:<MAIN_QUEUE_NAME> \
  --region $AWS_REGION \
  --max-pps 50 \
  --wait \
  --yes
```

Redrive DLQ → main (after fix)

```bash
aws sqs start-message-move-task \
  --source-arn arn:aws:sqs:<region>:<acct>:<DLQ_NAME> \
  --destination-arn arn:aws:sqs:<region>:<acct>:<MAIN_QUEUE_NAME>
```

Check move tasks

```bash
aws sqs list-message-move-tasks --source-arn arn:aws:sqs:<region>:<acct>:<DLQ_NAME>
```

Tail Lambda errors (most recent)

```bash
aws logs tail /aws/lambda/<dispatcher-name> --since 1h --filter-pattern "ERROR"
```

## Bonnes pratiques

* **ApiGatewayManagementApi** : utiliser l’endpoint **complet** (`https://.../prod`)
* **SQS DLQ** : activer une DLQ (ex: 5 tentatives) pour jobs irrécupérables
* **DynamoDB TTL** : purger historiques (`ttl`) sur `JobsTable`
