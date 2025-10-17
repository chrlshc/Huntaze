# CloudWatch Logs Insights — Saved Queries

## 1) AI Chat 429 Spikes

```
fields @timestamp, requestId, userId, plan, code, limit, resetAt
| filter evt = "ai_chat_rate_limited"
| stats count() as throttles by bin(5m)
| sort by bin(5m) desc
```

## 2) Error Rate by Route

```
fields @timestamp, evt, requestId, route, status
| filter like(evt, /_failed/) or status >= 500
| stats count() as errors by route, bin(5m)
| sort errors desc
```

## 3) Premium Routing Mix

```
fields @timestamp, plan, premiumRouted
| filter evt = "ai_chat_completed"
| stats sum(premiumRouted) as premium, count(*) as total, 100*sum(premiumRouted)/count(*) as pct by plan, bin(1h)
| sort bin(1h) desc
```

Tip: Add `and ispresent(ts)` if you want to enforce timestamp presence.

