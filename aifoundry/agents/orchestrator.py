from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Any, Dict

from azure.ai.projects import AIProjectClient

from .writer_agent import HuntazeWriterAgent
from .safeguard_agent import HuntazeSafeguardAgent


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


class HuntazeAgentOrchestrator:
    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4", content_safety_endpoint: str | None = None):
        self.client = client
        self.writer = HuntazeWriterAgent(client, model=model)
        self.safeguard = HuntazeSafeguardAgent(client, model=model, content_safety_endpoint=content_safety_endpoint)

    async def process_message_request(self, request: DraftRequest) -> DraftResponse:
        thread = self.client.agents.create_thread(
            metadata={
                "trace_id": request.trace_id,
                "fan_id": request.fan_context.get("fan_id"),
                "session_type": "message_generation",
                "ts": int(time.time()),
            }
        )

        max_iterations = 3
        last_draft = ""
        last_validation: Dict[str, Any] = {}
        for i in range(max_iterations):
            draft_result = self.writer.generate_message(
                thread_id=thread.id,
                context={
                    "fan_context": request.fan_context,
                    "objectives": request.objectives,
                    "iteration": i,
                },
            )
            last_draft = draft_result.get("draft", "")
            last_validation = self.safeguard.validate_message(thread_id=thread.id, draft=last_draft)

            if last_validation.get("label") == "green":
                return DraftResponse(
                    status="ok",
                    session_id=thread.id,
                    draft=last_draft,
                    risk=last_validation,
                    iterations=i + 1,
                )

        return DraftResponse(
            status="needs_review",
            session_id=thread.id,
            draft=last_draft,
            risk=last_validation,
            iterations=max_iterations,
        )

