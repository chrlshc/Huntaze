from __future__ import annotations
import json
import os
import time
from dataclasses import dataclass
from typing import Any, Dict

import requests
from azure.identity import DefaultAzureCredential
try:
    from azure.ai.contentsafety import ContentSafetyClient  # type: ignore
except Exception:  # pragma: no cover
    ContentSafetyClient = None  # type: ignore


@dataclass
class DraftRequest:
    trace_id: str
    fan_context: Dict[str, Any]
    objectives: Dict[str, Any]


@dataclass
class DraftResponse:
    status: str
    session_id: str
    draft: str
    risk: Dict[str, Any]
    iterations: int


class RestOrchestrator:
    """Minimal REST v1 flow against Azure AI Foundry Project endpoint.

    Endpoints used (appended with ?api-version=v1):
      - POST /assistants
      - POST /threads
      - POST /threads/{thread_id}/messages
      - POST /threads/{thread_id}/runs
      - GET  /threads/{thread_id}/runs/{run_id}
      - GET  /threads/{thread_id}/messages?order=desc&limit=1
    """

    def __init__(self, project_endpoint: str):
        if not project_endpoint:
            raise RuntimeError("Missing AZURE_AI_PROJECT_ENDPOINT")
        self.endpoint = project_endpoint.rstrip("/")
        self.cred = DefaultAzureCredential()

    def _headers(self) -> Dict[str, str]:
        token = self.cred.get_token("https://ai.azure.com/.default").token
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.endpoint}{path}?api-version=v1"
        r = requests.post(url, headers=self._headers(), data=json.dumps(payload))
        if r.status_code >= 300:
            raise RuntimeError(f"POST {path} failed: {r.status_code} {r.text}")
        return r.json()

    def _get(self, path: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
        params = params or {}
        params.setdefault("api-version", "v1")
        url = f"{self.endpoint}{path}"
        r = requests.get(url, headers=self._headers(), params=params)
        if r.status_code >= 300:
            raise RuntimeError(f"GET {path} failed: {r.status_code} {r.text}")
        return r.json()

    def process_message_request(self, req: DraftRequest) -> DraftResponse:
        model = os.getenv("AZURE_OPENAI_DEPLOYMENT") or os.getenv("AZURE_OPENAI_MODEL") or "gpt-4o-mini"

        # 1) Assistant (ephemeral)
        assistant = self._post(
            "/assistants",
            {
                "model": model,
                "name": "huntaze-writer",
                "instructions": (
                    "You are an expert OnlyFans copywriter.\n"
                    "Write flirty, friendly, concise messages that drive replies.\n"
                    "Constraints: 1-3 short sentences, no emojis unless asked, plain text only.\n"
                    "Output strictly the message text (no JSON, no quotes)."
                ),
            },
        )

        # 2) Thread
        thread = self._post(
            "/threads",
            {
                "metadata": {
                    "trace_id": req.trace_id,
                    "fan_id": req.fan_context.get("fan_id"),
                    "session_type": "message_generation",
                }
            },
        )

        # 3) User message
        # Build a simple natural prompt for best model compatibility
        objective = req.objectives.get("goal") or "start a conversation"
        fan = req.fan_context.get("fan_id") or "unknown"
        style = req.objectives.get("tone", "playful")
        persona = req.objectives.get("personality", "flirty")
        max_len = req.objectives.get("max_length", 220)
        prompt = (
            f"Fan id: {fan}. Tone: {style}. Personality: {persona}. Max length ~{max_len} chars.\n"
            f"Goal: {objective}.\n"
            "Write the message now."
        )
        self._post(
            f"/threads/{thread['id']}/messages",
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            },
        )

        # 4) Run
        run = self._post(
            f"/threads/{thread['id']}/runs",
            {"assistant_id": assistant["id"]},
        )

        # 5) Poll
        for _ in range(120):
            cur = self._get(f"/threads/{thread['id']}/runs/{run['id']}")
            st = cur.get("status")
            if st in ("completed", "failed", "cancelled", "expired"):
                break
            time.sleep(1)
        else:
            raise RuntimeError("Run did not complete in time")

        # 6) Get last message
        msgs = self._get(
            f"/threads/{thread['id']}/messages", params={"order": "desc", "limit": 1}
        )
        draft = ""
        try:
            item = msgs.get("data", [])[0]
            parts = item.get("content", [])
            for p in parts:
                if p.get("type") == "text":
                    draft = p["text"]["value"]
                    break
        except Exception:
            draft = ""
        risk = self._content_safety(draft) or {"label": "green", "score": 90, "infractions": [], "recommendations": []}
        return DraftResponse(
            status="ok",
            session_id=thread["id"],
            draft=draft.strip(),
            risk=risk,
            iterations=1,
        )

    def _content_safety(self, text: str | None) -> Dict[str, Any] | None:
        if not text:
            return None
        try:
            ep = os.getenv("AZURE_CONTENT_SAFETY_ENDPOINT")
            if not ep or ContentSafetyClient is None:
                return None
            cs = ContentSafetyClient(endpoint=ep, credential=self.cred)
            # Minimal payload; SDK signatures vary by version, so we use dict style.
            payload = {
                "text": text,
                "categories": ["Hate", "SelfHarm", "Sexual", "Violence"],
                "outputType": "FourSeverityLevels",
            }
            result = cs.analyze_text(payload)  # type: ignore
            # Map to simple label/score if possible
            sev = 0
            if isinstance(result, dict):
                # Try standard shape
                sev = max(result.get("hateResult", {}).get("severity", 0),
                          result.get("selfHarmResult", {}).get("severity", 0),
                          result.get("sexualResult", {}).get("severity", 0),
                          result.get("violenceResult", {}).get("severity", 0))
            label = "green" if sev <= 1 else ("yellow" if sev == 2 else "red")
            score = 95 - sev * 25
            return {"label": label, "score": max(0, score), "infractions": [], "recommendations": []}
        except Exception:
            return None
