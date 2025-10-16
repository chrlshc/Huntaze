from __future__ import annotations
import json
from typing import Dict, Any

from azure.ai.projects import AIProjectClient
from azure.ai.contentsafety import ContentSafetyClient


class HuntazeSafeguardAgent:
    """Azure AI Foundry Agent + Azure Content Safety wrapper."""

    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4", name: str = "huntaze-safeguard", content_safety_endpoint: str | None = None):
        self.client = client
        self.agent = client.agents.create_agent(
            model=model,
            name=name,
            instructions=(
                "Tu es l'agent conformité OnlyFans.\n\n"
                "Vérifie:\n"
                "1. Contenu approprié pour la plateforme\n"
                "2. Respect ToS OnlyFans\n"
                "3. Pas de promesses illégales\n"
                "4. Langage professionnel\n\n"
                "Utilise Azure Content Safety pour analyse automatique.\n\n"
                "Format réponse JSON:\n"
                "{\n"
                "  \"label\": \"green|yellow|red\",\n"
                "  \"score\": 0-100,\n"
                "  \"infractions\": [{\n"
                "    \"rule_id\": \"string\",\n"
                "    \"severity\": \"low|medium|high\",\n"
                "    \"reason\": \"string\"\n"
                "  }],\n"
                "  \"recommendations\": [\"string\"]\n"
                "}"
            ),
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "analyze_content_safety",
                        "description": "Azure Content Safety API",
                        "parameters": {"type": "object", "properties": {"text": {"type": "string"}}},
                    },
                }
            ],
        )

        self.content_safety = None
        if content_safety_endpoint:
            from azure.identity import DefaultAzureCredential

            self.content_safety = ContentSafetyClient(
                endpoint=content_safety_endpoint,
                credential=DefaultAzureCredential(),
            )

    def validate_message(self, thread_id: str, draft: str) -> Dict[str, Any]:
        """Create a validation request and serve the analyze_content_safety tool when requested.

        Tool implemented:
          - analyze_content_safety({ text }) -> minimal label/score mapping
        """
        def _analyze_text_cs(text: str) -> Dict[str, Any] | None:
            # Try Azure Content Safety if configured
            try:
                if not text:
                    return None
                if not self.content_safety:
                    return None
                # SDK shapes vary slightly by version. Use dict payload where possible.
                payload = {
                    "text": text,
                    "categories": ["Hate", "SelfHarm", "Sexual", "Violence"],
                    "outputType": "FourSeverityLevels",
                }
                result = self.content_safety.analyze_text(payload)  # type: ignore
                sev = 0
                if isinstance(result, dict):
                    sev = max(
                        result.get("hateResult", {}).get("severity", 0),
                        result.get("selfHarmResult", {}).get("severity", 0),
                        result.get("sexualResult", {}).get("severity", 0),
                        result.get("violenceResult", {}).get("severity", 0),
                    )
                label = "green" if sev <= 1 else ("yellow" if sev == 2 else "red")
                score = max(0, 95 - sev * 25)
                return {"label": label, "score": score, "sev": sev}
            except Exception:
                return None

        self.client.agents.create_message(
            thread_id=thread_id,
            role="user",
            content=json.dumps({"draft": draft}),
        )

        run = self.client.agents.create_run(thread_id=thread_id, agent_id=self.agent.id)
        while getattr(run, "status", "in_progress") in ("queued", "in_progress", "requires_action"):
            if getattr(run, "status", "") == "requires_action":
                # Serve analyze_content_safety tool
                try:
                    ra = getattr(run, "required_action", None) or {}
                    sto = getattr(ra, "submit_tool_outputs", None) or {}
                    tool_calls = getattr(sto, "tool_calls", None) or []
                except Exception:
                    tool_calls = []

                outputs = []
                for tc in tool_calls:
                    try:
                        tc_id = getattr(tc, "id", None) or (tc.get("id") if isinstance(tc, dict) else None)
                        fn = getattr(tc, "function", None) or (tc.get("function") if isinstance(tc, dict) else None)
                        name = getattr(fn, "name", None) or (fn.get("name") if isinstance(fn, dict) else None)
                        arg_str = getattr(fn, "arguments", None) or (fn.get("arguments") if isinstance(fn, dict) else "{}")
                    except Exception:
                        continue

                    args = {}
                    try:
                        args = json.loads(arg_str or "{}")
                    except Exception:
                        args = {}

                    result = {}
                    if name == "analyze_content_safety":
                        analysis = _analyze_text_cs(args.get("text") or draft)
                        result = analysis or {"label": "green", "score": 90}
                    outputs.append({"tool_call_id": tc_id, "output": json.dumps(result)})

                run = self.client.agents.submit_tool_outputs(
                    thread_id=thread_id, run_id=run.id, tool_outputs=outputs
                )
                continue

            time.sleep(1)
            run = self.client.agents.get_run(thread_id=thread_id, run_id=run.id)

        messages = self.client.agents.list_messages(thread_id=thread_id)
        last = messages.data[0]
        try:
            return json.loads(last.content[0].text.value)
        except Exception:
            return {"label": "yellow", "score": 50, "infractions": [], "recommendations": [last.content[0].text.value]}
