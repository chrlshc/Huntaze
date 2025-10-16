from __future__ import annotations
import json
import os
import time
from typing import Any, Dict

import requests
from azure.ai.projects import AIProjectClient

from .triage_agent import CINTriageAgent
from .planner_agent import CINPlannerAgent
from .executor_agent import CINExecutor
from .supervisor_agent import CINSupervisorAgent


class CINAgentOrchestrator:
    """Customer management orchestrator (CIN): Triage -> Fan360 -> Planner -> Executor -> Supervisor."""

    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4"):
        self.client = client
        self.model = model
        self.triage = CINTriageAgent(client, model=model)
        self.planner = CINPlannerAgent(client, model=model)
        self.executor = CINExecutor()
        self.supervisor = CINSupervisorAgent(client, model=model)
        self.func_base = os.getenv("FUNC_BASE") or os.getenv("CIN_FUNC_BASE")

    def _fan360(self, fan_id: str, lang: str = "en", window_days: int = 30) -> Dict[str, Any]:
        if not self.func_base:
            return {}
        url = f"{self.func_base.rstrip('/')}/api/fan360/{fan_id}"
        try:
            headers = {}
            func_key = os.getenv("FUNC_KEY") or os.getenv("CIN_FUNC_KEY")
            if func_key:
                headers["x-functions-key"] = func_key
            r = requests.get(url, params={"lang": lang, "window_days": str(window_days)}, headers=headers, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        return {}

    def _triage_http(self, *, message_id: str, fan_id: str, text: str, lang: str = "en") -> Dict[str, Any] | None:
        if not self.func_base:
            return None
        url = f"{self.func_base.rstrip('/')}/api/triage/classify"
        try:
            headers = {"content-type": "application/json"}
            func_key = os.getenv("FUNC_KEY") or os.getenv("CIN_FUNC_KEY")
            if func_key:
                headers["x-functions-key"] = func_key
            body = {"message_id": message_id, "fan_id": fan_id, "text": text, "lang": lang}
            r = requests.post(url, data=json.dumps(body), headers=headers, timeout=12)
            if r.status_code == 200:
                return r.json().get("meta", {}).get("triage") or r.json()
        except Exception:
            pass
        return None

    def process(self, *, trace_id: str, message: str, fan_id: str, lang: str = "en") -> Dict[str, Any]:
        thread = self.client.agents.create_thread(metadata={"trace_id": trace_id, "ts": int(time.time())})

        # Step 1: Triage via Function (source de vérité: CS + structured outputs)
        tri = self._triage_http(message_id=trace_id, fan_id=fan_id, text=message, lang=lang)
        if tri is None:
            # Fallback to agent-based triage if HTTP triage is unavailable
            tri = self.triage.classify(thread.id, {"text": message, "lang": lang, "fan_id": fan_id})
        triage = tri

        # Step 2: Context (Fan 360) via HTTP Function if configured
        fan360 = self._fan360(fan_id, lang=lang)

        # Step 3: Planner
        plan = self.planner.plan(thread.id, triage, fan360)

        # Step 4: Supervisor (pre-exec)
        review = self.supervisor.review(thread.id, triage, plan)
        if (review or {}).get("label") == "red":
            return {"status": "needs_review", "triage": triage, "fan360": fan360, "plan": plan, "review": review}

        # Step 5: Executor (integration-only: publish actions to Service Bus)
        exec_result = self.executor.execute(plan, context={"fan_id": fan_id, "trace_id": trace_id})

        # Step 6: Supervisor (post-exec)
        post = self.supervisor.review(thread.id, triage, {**plan, **{"executed": exec_result}})

        status = "ok" if (post or {}).get("label") == "green" else "needs_review"
        return {"status": status, "triage": triage, "fan360": fan360, "plan": plan, "executed": exec_result, "review": post}
