from __future__ import annotations
import json
from typing import Any, Dict

from azure.ai.projects import AIProjectClient


class CINTriageAgent:
    """Triage: classify intent, priority, SLA, route."""

    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4", name: str = "cin-triage"):
        self.client = client
        self.agent = client.agents.create_agent(
            model=model,
            name=name,
            instructions=(
                "Tu es l'agent TRIAGE pour la gestion client.\n"
                "But: Classer l'intention, la priorité, le SLA, et le routage.\n\n"
                "Réponds en JSON strict:\n"
                "{\n"
                "  \"intent\": \"scheduling|billing|support|sales|analytics|general\",\n"
                "  \"priority\": \"low|medium|high|urgent\",\n"
                "  \"sla_minutes\":  integer,\n"
                "  \"route\": \"sales|success|support|billing|ops\"\n"
                "}"
            ),
        )

    def classify(self, thread_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.client.agents.create_message(
            thread_id=thread_id,
            role="user",
            content=json.dumps({"triage_input": payload}),
        )
        run = self.client.agents.create_and_process_run(thread_id=thread_id, agent_id=self.agent.id)
        messages = self.client.agents.list_messages(thread_id=thread_id)
        last = messages.data[0]
        try:
            return json.loads(last.content[0].text.value)
        except Exception:
            return {
                "intent": "general",
                "priority": "medium",
                "sla_minutes": 60,
                "route": "support",
            }

