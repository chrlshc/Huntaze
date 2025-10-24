## PR Title

One-liner describing the change.

## Summary

- What changed and why
- User impact and rollout notes

## Azure No‑Spend Circuit Breaker — Checklist

- [ ] `AZURE_BILLING_LOCK` state considered (no accidental toggle). If toggled, note reason, start/end time, and owner.
- [ ] `AI_SMOKE_TOKEN` not exposed in logs/CI; rotated if changed; never added to `NEXT_PUBLIC_*`.
- [ ] Smoke route auth matrix validated (no spend without explicit force):
  - [ ] Missing token → 401 with `WWW-Authenticate: Bearer realm="smoke", error="invalid_token"`
  - [ ] Bad token → 403 (no Azure call); >5 bad in 5m → 429 with `Retry-After`
  - [ ] Good token, no `force` → 400 `{reason:"force_required"}` (no Azure call)
  - [ ] Lock on + `force=1` → 503 `{status:"locked"}` with `Retry-After` (no Azure call)
  - [ ] Lock off + `force=1` → 200 `{status:"ok"}` with usage
- [ ] Edge rate limits in place for `/api/ai/azure/smoke` (baseline minute + 30s burst; token/IP dual keying).
- [ ] WAF scope‑down rate rule applied to `/api/ai/azure/smoke` only (ACTION=COUNT/ BLOCK as needed). Script: `scripts/waf-ensure-smoke-rate-rule.sh`.
- [ ] CloudFront Response Headers Policy attached (HSTS/XFO/Referrer/Permissions‑Policy + CSP Report‑Only).
- [ ] SSR envs: required server variables present at runtime (Amplify env or `.env.production`), none leaked to client (no `NEXT_PUBLIC_*`).
- [ ] Azure quotas: test deployments on low TPM and/or APIM policies in front if applicable.
- [ ] Observability: `azure_smoke_events_total{action,path,env,force,source}` visible in Prometheus; optional alerts enabled.

## Tests

- [ ] `scripts/smokes/app-smokes.sh` without token (expect 401/locked)
- [ ] With `AI_SMOKE_TOKEN` + `force=1` (expect 200 or 503 locked depending on `AZURE_BILLING_LOCK`)

## Rollback Plan

- How to disable feature / re‑enable billing lock safely

