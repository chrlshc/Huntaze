from __future__ import annotations
import json
import time
from typing import Any, Dict

from azure.ai.projects import AIProjectClient


class CINPlannerAgent:
    """Planner: produce a Next Best Action plan (JSON) given triage + fan360 context.

    Output schema (example):
    {
      "plan": [
        {"action": "create_ticket", "priority": "high", "data": {"title": "Billing issue", "desc": "..."}},
        {"action": "send_message", "channel": "inbox", "data": {"text": "..."}},
        {"action": "set_followup", "when": "2025-10-20T10:00:00Z"}
      ]
    }
    """

    _AGENTS: dict[tuple[str, str], str] = {}

    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4", name: str = "cin-planner"):
        self.client = client
        self.model = model
        self.name = name
        key = (model, name)
        agent_id = self._AGENTS.get(key)
        if agent_id:
            self.agent = client.agents.get_agent(agent_id)
        else:
            self.agent = client.agents.create_agent(
                model=model,
                name=name,
                instructions=(
                "Tu es le planificateur (CIN Planner).\n"
                "Reçois un triage et un fan360 (JSON) et propose un plan d'actions concis.\n"
                "Réponds uniquement en JSON strict avec la clé 'plan' (liste d'actions).\n"
                "Chaque action a un 'action' (create_ticket|send_message|set_followup|schedule_meeting|propose_offer),\n"
                "et un objet 'data' adapté.\n"
                ),
            )
            self._AGENTS[key] = self.agent.id

    def plan(self, thread_id: str, triage: Dict[str, Any], fan360: Dict[str, Any]) -> Dict[str, Any]:
        payload = {"triage": triage, "fan360": fan360}
        self.client.agents.create_message(thread_id=thread_id, role="user", content=json.dumps(payload))
        run = self.client.agents.create_and_process_run(thread_id=thread_id, agent_id=self.agent.id)
        messages = self.client.agents.list_messages(thread_id=thread_id)
        # Pick the last assistant message
        data = getattr(messages, "data", [])
        last_text = ""
        for m in data:
            try:
                if getattr(m, "role", "assistant") == "assistant":
                    last_text = m.content[0].text.value
                    break
            except Exception:
                continue
        try:
            obj = json.loads(last_text) if last_text else {}
            # Minimal schema validation: plan is list of actions
            plan = obj.get("plan")
            if not isinstance(plan, list):
                raise ValueError("invalid plan schema")
            for item in plan:
                if not isinstance(item, dict) or not item.get("action"):
                    raise ValueError("invalid plan item")
            return obj
        except Exception:
            # Wrap freeform into minimal plan
            text = last_text or ""
            return {"plan": [{"action": "send_message", "data": {"text": text}}]}
