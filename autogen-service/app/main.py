from fastapi import FastAPI, HTTPException
from .config import settings
from .models import DraftRequest, DraftResponse, HumanDecisionRequest
from .store.dynamodb_store import DDBStore
from .store.cosmos_store import CosmosStore  # type: ignore
from .agents import build_team
from .utils.risk import compute_risk
from .services.events import post_event
import json
import uuid


app = FastAPI(title="AutoGen Service")

if settings.COSMOS_ENDPOINT and settings.COSMOS_KEY:
    store = CosmosStore(
        settings.COSMOS_ENDPOINT,
        settings.COSMOS_KEY,
        settings.COSMOS_DB,
        settings.COSMOS_CONTAINER_SESSIONS,
        settings.COSMOS_CONTAINER_MESSAGES,
        settings.COSMOS_CONTAINER_ARTIFACTS,
        ttl_days=settings.TTL_DAYS,
    )
else:
    store = DDBStore(
        settings.DDB_REGION,
        settings.DDB_TABLE_SESSIONS,
        settings.DDB_TABLE_MESSAGES,
        settings.DDB_TABLE_ARTIFACTS,
        ttl_days=settings.TTL_DAYS,
    )


@app.post("/draft", response_model=DraftResponse)
def draft(req: DraftRequest):
    session_id = str(uuid.uuid4())
    meta = {"trace_id": req.trace_id, "policy_version": "v1"}
    store.start_session(req.trace_id, session_id, meta)

    commander, writer, safeguard, manager, ctx = build_team(
        settings.LLM_PROXY_URL,
        req.trace_id,
        min(req.max_rounds, settings.MAX_ROUNDS),
        store,
        session_id,
    )

    initial = {
        "context": req.fan_context,
        "objectives": req.objectives,
        "constraints": req.constraints,
        "attachments": req.attachments or [],
    }
    commander.initiate_chat(
        manager, message=json.dumps(initial, ensure_ascii=False)
    )

    # Extract last messages recorded via context
    draft_txt = (ctx.last_writer or {}).get("draft") or ""
    if not draft_txt:
        draft_txt = ""
    safeguard_json = ctx.last_safeguard or {"label": "yellow", "infractions": []}
    risk = compute_risk(safeguard_json)

    if risk["score"] >= settings.REVIEW_THRESHOLD:
        store.update_status(session_id, "needs_review", step="REVIEW", risk=risk)
        post_event(
            settings.NEXTJS_WEBHOOK_URL,
            settings.AUTOGEN_HMAC_SECRET,
            {
                "trace_id": req.trace_id,
                "session_id": session_id,
                "type": "review_needed",
                "data": {"risk": risk, "draft": draft_txt},
            },
        )
        return DraftResponse(
            status="needs_review",
            session_id=session_id,
            draft=draft_txt,
            risk=risk,
            checkpoints=[],
        )

    store.update_status(session_id, "ready", step="READY", risk=risk)
    return DraftResponse(
        status="ok", session_id=session_id, draft=draft_txt, risk=risk, checkpoints=[]
    )


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    return store.get_session(session_id)


@app.post("/sessions/{session_id}/human_decision")
def human_decision(session_id: str, req: HumanDecisionRequest):
    sess = store.get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="session not found")

    if req.decision == "approve":
        store.update_status(session_id, "sending", step="SENDING")
        post_event(
            settings.NEXTJS_WEBHOOK_URL,
            settings.AUTOGEN_HMAC_SECRET,
            {
                "trace_id": sess["trace_id"],
                "session_id": session_id,
                "type": "progress",
                "data": {"status": "approved"},
            },
        )
        return {"status": "resumed", "next_state": "SENDING"}

    if req.decision in ("reject", "edit"):
        store.update_status(session_id, "closed", step="CLOSED")
        post_event(
            settings.NEXTJS_WEBHOOK_URL,
            settings.AUTOGEN_HMAC_SECRET,
            {
                "trace_id": sess["trace_id"],
                "session_id": session_id,
                "type": "done",
                "data": {"status": "rejected_or_edited"},
            },
        )
        return {"status": "closed", "next_state": "CLOSED"}

    raise HTTPException(status_code=400, detail="invalid decision")
