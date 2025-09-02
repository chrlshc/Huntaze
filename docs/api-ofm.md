# OFM API (Draft)

Base path: `/api/ofm` (requires auth)

## POST /ai/draft
Generate an AI-assisted draft with guardrails pre-check. Server currently produces a placeholder draft (no external LLM call) and logs it when the `AiDraft` model exists.

Request body:
```json
{
  "fanMessage": "string",
  "fanData": {
    "name": "string",
    "rfmSegment": "WHALE|VIP|CASUAL|CHURN_RISK|UNKNOWN",
    "lastActive": "2025-09-03T10:00:00Z",
    "totalSpent": 250.0,
    "messageCount": 42,
    "propensityScore": 0.72
  },
  "persona": {
    "name": "Luna Star",
    "style_guide": "...",
    "tone_keywords": ["warm", "playful"],
    "templates": { "welcome": "...", "upsell": "...", "reactivation": "..." }
  },
  "guardrails": {
    "forbidden_words": ["whatsapp", "phone", "meet"],
    "escalation_triggers": ["refund", "chargeback", "legal"],
    "frequency_limits": { "max_per_hour": 3, "cooldown_minutes": 20 }
  },
  "conversationId": "optional"
}
```

Response body:
```json
{
  "action": "DRAFT|ESCALATE",
  "confidence_score": 0.5,
  "draft_message": "string",
  "reasoning": "string",
  "guardrails_triggered": ["forbidden:xxx"],
  "persona_elements_used": ["warm"],
  "upsell_opportunity": false,
  "recommended_ppv_price": null,
  "validated": true,
  "timestamp": "2025-09-03T10:05:00Z",
  "reason": "optional when ESCALATE"
}
```

Notes:
- Replace placeholder generation with a proper LLM provider once configured server-side.
- Store draft logs in `AiDraft` for audit.

## POST /rfm/recompute
Schedules recomputation of RFM for the authenticated user.

Response: `202 { "status": "scheduled" }`

## Personas & Guardrails (planned)
- GET /personas
- POST /personas
- PUT /personas/:id
- GET /guardrails
- PUT /guardrails

