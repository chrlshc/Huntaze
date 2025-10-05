# RUNBOOK — CIN AI (prod-ready)

## 0) Variables d’env & feature flag

```
# .env / env vars
ENABLE_CIN_AI=true
LLM_PROVIDER=mock|openai|azure

# OpenAI
OPENAI_API_KEY=...

# Azure OpenAI (clé) ou Entra ID (recommandé en prod)
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=<deployment-name>
# Entra ID (managed identity / DefaultAzureCredential)
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...  # si app registration
```

- Modération OpenAI : utiliser `omni-moderation-latest` pour filtrer entrées/sorties. (OpenAI Platform)
- Azure sans clé (Entra ID) : support officiel des connexions keyless/managed identity. (Microsoft Learn)

## 1) Tests de fumée

### cURL (avec traçage)

```bash
REQ=$(uuidgen)
curl -sS -X POST https://<host>/api/cin/chat \
  -H "content-type: application/json" \
  -H "x-request-id: $REQ" \
  -d '{"message":"ping"}' | jq .
```

Vérifie que `x-request-id` est injecté par le middleware et remonte dans les logs/traces.

### Playwright – API + Trace

```ts
// tests/api/cin-chat.spec.ts
import { test, expect, request } from '@playwright/test';
test('POST /api/cin/chat returns 200', async ({ }) => {
  const ctx = await request.newContext();
  const res = await ctx.post('/api/cin/chat', {
    headers: { 'x-request-id': 'e2e-' + Date.now() },
    data: { message: 'ping' },
  });
  expect(res.ok()).toBeTruthy();
});
```

## 2) Observabilité (CloudWatch + X-Ray)

### EMF (metrics extraites des logs)

- Visualiser les métriques EMF publiées (`AIRequest`, `AILatencyMs`) dans CloudWatch > Metrics (extraction auto depuis Logs).
- Rappel EMF & librairies Node.

### X-Ray

- Active le tracing HTTP sortant (`captureHTTPsGlobal`) + AWS SDK.

### 2 alarmes CloudWatch (CLI)

- 5xx % (ex : sur une métrique `Http5xxRate` que tu publies en EMF) :

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name CIN-API-5xx-High \
  --namespace Hunt/CIN --metric-name Http5xxRate \
  --statistic Average --period 60 --evaluation-periods 3 \
  --threshold 1 --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching --alarm-actions arn:aws:sns:...
```

- p95 latence (sur `AILatencyMs`) :

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name CIN-AI-p95-Latency \
  --namespace Hunt/CIN --metric-name AILatencyMs \
  --extended-statistic p95 --period 60 --evaluation-periods 3 \
  --threshold 2500 --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching --alarm-actions arn:aws:sns:...
```

## 3) Hardening LLM (retry/backoff, budget tokens, dédup)

### Exponential backoff + jitter (pseudo-TS)

```ts
for (let a = 0; a < 6; a++) {
  try { return await llmCall(); }
  catch (e:any) {
    const retryAfter = Number(e?.response?.headers?.['retry-after']);
    const base = retryAfter ? retryAfter*1000 : Math.min(100*2**a, 3000);
    await new Promise(r => setTimeout(r, base + Math.random()*250));
  }
}
throw new Error('LLM failed after retries');
```

### Budget tokens

- Limiter la réponse avec `max_completion_tokens` / `max_output_tokens` selon le modèle/SDK.

### Modération / filtres

- Entrée + sortie via `omni-moderation-latest`; côté Azure, combiner avec Content Filter si activé.

### Sanity OWASP LLM Top-10

- Smoke test: prompt-injection, data exfiltration, overreliance…

## 4) SSE (NICE TO HAVE) pour `/api/cin/chat`

```ts
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`event: start\ndata: {}\n\n`);
      controller.enqueue(`event: message\ndata: {"text":"..."}\n\n`);
      controller.close();
    }
  });
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
    }
  });
}
```

## 5) Middleware & runtime

- Injection d’`x-request-id` via `NextResponse.next({ request: { headers }})` en middleware (pas de body dans Middleware).
- Forcer runtime Node.js si nécessaire : `export const runtime = 'nodejs'`.

---

# PATCH-TYPE — Étendre `withMonitoring` (exemple)

```ts
// app/api/billing/charge/route.ts
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

async function handler(req: Request) {
  // ... logique billing
  return Response.json({ ok: true });
}

export const POST = withMonitoring('billing.charge', handler);
```

À répliquer sur `onboarding/*`, `webhooks/*`, etc. (tagger `service=cin-api`, `route=/api/...` pour les dimensions EMF).

---

## Table de contrôle (prod)

- [ ] `ENABLE_CIN_AI=true` + provider choisi
- [ ] Test `POST /api/cin/chat` (200, payload correct)
- [ ] Metrics visibles : `AIRequest`, `AILatencyMs`
- [ ] Traces X-Ray : segments route + sous-segments HTTP/AWS
- [ ] Alarmes actives : 5xx %, p95 latence
- [ ] Backoff + token budget en place
- [ ] Modération ON (entrée/sortie)

