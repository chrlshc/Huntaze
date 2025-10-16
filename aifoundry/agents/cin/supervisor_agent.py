from __future__ import annotations
import json
from typing import Any, Dict

from azure.ai.projects import AIProjectClient


class CINSupervisorAgent:
    """Supervisor: QA/HIL. Validates triage+plan and decides: green|yellow|red with reasons.

    Output:
    { "label": "green|yellow|red", "score": 0-100, "reasons": ["..."] }
    """

    _AGENTS: dict[tuple[str, str], str] = {}

    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4", name: str = "cin-supervisor"):
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
                "Tu es le superviseur.\n"
                "Évalue la sécurité/pertinence du plan et des actions.\n"
                "Réponds uniquement en JSON: {label, score, reasons[]} (green/yellow/red).\n"
                ),
            )
            self._AGENTS[key] = self.agent.id

    def review(self, thread_id: str, triage: Dict[str, Any], plan: Dict[str, Any]) -> Dict[str, Any]:
        payload = {"triage": triage, "plan": plan}
        self.client.agents.create_message(thread_id=thread_id, role="user", content=json.dumps(payload))
        run = self.client.agents.create_and_process_run(thread_id=thread_id, agent_id=self.agent.id)
        msgs = self.client.agents.list_messages(thread_id=thread_id)
        data = getattr(msgs, "data", [])
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
            label = obj.get("label")
            score = obj.get("score")
            if label not in ("green", "yellow", "red"):
                raise ValueError("invalid label")
            if not isinstance(score, (int, float)) or score < 0 or score > 100:
                raise ValueError("invalid score")
            reasons = obj.get("reasons", [])
            if not isinstance(reasons, list):
                obj["reasons"] = []
            return obj
        except Exception:
            return {"label": "yellow", "score": 60, "reasons": [last_text]}
