# AutoGen Microservice (FastAPI)

This microservice orchestrates multi-agent drafting using AutoGen v0.2.

- Frameworks: FastAPI + Uvicorn, AutoGen AgentChat 0.2
- Persistence: DynamoDB (`ai_sessions`, `ai_session_messages`, `ai_session_artifacts`)
- Integrations: Next.js LLM proxy, HMAC-signed webhook events, SQS enqueue (via Next.js)

## Endpoints
- `POST /draft` — start a session and iterate Writer ↔ Safeguard (POC stubbed outputs)
- `GET /sessions/{session_id}` — fetch session summary
- `POST /sessions/{session_id}/human_decision` — approve/reject/edit gate

## Env
- `LLM_PROXY_URL` (default `https://app.huntaze.com/api/internal/llm`)
- `NEXTJS_WEBHOOK_URL` (default `https://app.huntaze.com/api/internal/autogen/events`)
- `AUTOGEN_HMAC_SECRET`
- `DDB_REGION`, `DDB_TABLE_SESSIONS`, `DDB_TABLE_MESSAGES`, `DDB_TABLE_ARTIFACTS`
- `AUTOGEN_MAX_ROUNDS`, `QUALITY_THRESHOLD`, `REVIEW_THRESHOLD`, `BLOCK_THRESHOLD`

## Run (local)
pip install -r requirements.txt
export LLM_PROXY_URL="https://app.huntaze.com/api/internal/llm"
export NEXTJS_WEBHOOK_URL="https://app.huntaze.com/api/internal/autogen/events"
export AUTOGEN_HMAC_SECRET="set-a-strong-secret"
uvicorn app.main:app --host 0.0.0.0 --port 8000

## Docker
docker build -t autogen-service ./
docker run --rm -p 8000:8000 \
  -e LLM_PROXY_URL=https://app.huntaze.com/api/internal/llm \
  -e NEXTJS_WEBHOOK_URL=https://app.huntaze.com/api/internal/autogen/events \
  -e AUTOGEN_HMAC_SECRET=change-me \
  autogen-service

> Use docker-compose to run side-by-side with the Next.js app (see root `docker-compose.yml`).
