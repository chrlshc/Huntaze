from __future__ import annotations
import json
import time
from typing import Dict, Any

from azure.ai.projects import AIProjectClient


class HuntazeWriterAgent:
    """Azure AI Foundry Agent: content generator (OnlyFans use case).

    Exposes a generate_message(thread_id, context) method returning a JSON dict.
    """

    def __init__(self, client: AIProjectClient, *, model: str = "gpt-4", name: str = "huntaze-writer"):
        self.client = client
        self.agent = client.agents.create_agent(
            model=model,
            name=name,
            instructions=(
                "Tu es un copywriter expert OnlyFans.\n\n"
                "Règles:\n"
                "- Personnalité: {personality} (flirty/friendly/playful)\n"
                "- Ton: {tone}\n"
                "- Max longueur: {max_length}\n"
                "- Upsell PPV si pertinent\n\n"
                "Format réponse JSON:\n"
                "{\n"
                "  \"draft\": \"message text\",\n"
                "  \"rationale\": \"why this approach\",\n"
                "  \"confidence\": 0.0-1.0,\n"
                "  \"upsell_opportunity\": true/false,\n"
                "  \"estimated_engagement\": 0.0-1.0\n"
                "}"
            ),
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "get_fan_context",
                        "description": "Récupère historique et préférences fan",
                        "parameters": {
                            "type": "object",
                            "properties": {"fan_id": {"type": "string"}},
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "calculate_ppv_price",
                        "description": "Suggère prix PPV optimal",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "fan_segment": {"type": "string"},
                                "content_type": {"type": "string"},
                            },
                        },
                    },
                },
            ],
            metadata={"version": "1.0", "service": "huntaze"},
        )

    def generate_message(self, thread_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create a user message, run the agent, and satisfy required tool calls.

        Tools implemented:
          - get_fan_context({ fan_id }) -> JSON context
          - calculate_ppv_price({ fan_segment, content_type }) -> { price }
        """
        self.client.agents.create_message(
            thread_id=thread_id,
            role="user",
            content=json.dumps(context),
        )

        def _safe_json_loads(s: str) -> Dict[str, Any]:
            try:
                return json.loads(s) if s else {}
            except Exception:
                return {}

        def _get_fan_context(args: Dict[str, Any]) -> Dict[str, Any]:
            fan_id = args.get("fan_id") or (context.get("fan_context") or {}).get("fan_id")
            base = context.get("fan_context") or {}
            # Minimal enrichment placeholder; in production, fetch from DB or API
            enriched = {
                "fan_id": fan_id,
                "rfm_segment": base.get("rfm_segment", "UNKNOWN"),
                "last_active": base.get("last_active"),
                "total_spent": base.get("total_spent", 0),
                "message_count": base.get("message_count", 0),
                "preferences": base.get("preferences", {}),
            }
            return enriched

        def _calculate_ppv_price(args: Dict[str, Any]) -> Dict[str, Any]:
            seg = (args.get("fan_segment") or (context.get("fan_context") or {}).get("rfm_segment") or "UNKNOWN").upper()
            content_type = (args.get("content_type") or (context.get("objectives") or {}).get("content_type") or "generic").lower()
            # Simple heuristic pricing model
            base = 9.99
            seg_mult = {"WHALE": 2.5, "VIP": 1.8, "CASUAL": 1.1, "CHURN_RISK": 0.9, "UNKNOWN": 1.0}.get(seg, 1.0)
            type_add = {"photo": 0, "video": 5, "bundle": 8, "custom": 12}.get(content_type, 3)
            price = round(max(4.99, base * seg_mult + type_add), 2)
            return {"price": price, "currency": "USD", "segment": seg, "content_type": content_type}

        run = self.client.agents.create_run(thread_id=thread_id, agent_id=self.agent.id)
        # Poll until completion; handle tool calls when required
        while getattr(run, "status", "in_progress") in ("queued", "in_progress", "requires_action"):
            if getattr(run, "status", "") == "requires_action":
                try:
                    ra = getattr(run, "required_action", None) or {}
                    sto = getattr(ra, "submit_tool_outputs", None) or {}
                    tool_calls = getattr(sto, "tool_calls", None) or []
                except Exception:
                    tool_calls = []

                outputs = []
                for tc in tool_calls:
                    # Support both obj and dict styles
                    try:
                        tc_id = getattr(tc, "id", None) or (tc.get("id") if isinstance(tc, dict) else None)
                        fn = getattr(tc, "function", None) or (tc.get("function") if isinstance(tc, dict) else None)
                        name = getattr(fn, "name", None) or (fn.get("name") if isinstance(fn, dict) else None)
                        arg_str = getattr(fn, "arguments", None) or (fn.get("arguments") if isinstance(fn, dict) else "{}")
                    except Exception:
                        continue

                    args = _safe_json_loads(arg_str or "{}")
                    result: Dict[str, Any] | None = None
                    if name == "get_fan_context":
                        result = _get_fan_context(args)
                    elif name == "calculate_ppv_price":
                        result = _calculate_ppv_price(args)
                    else:
                        # Unknown tool: return empty object to unblock
                        result = {}
                    outputs.append({"tool_call_id": tc_id, "output": json.dumps(result)})

                run = self.client.agents.submit_tool_outputs(
                    thread_id=thread_id, run_id=run.id, tool_outputs=outputs
                )
                # Continue loop without sleeping to re-check status quickly
                continue

            time.sleep(1)
            run = self.client.agents.get_run(thread_id=thread_id, run_id=run.id)

        messages = self.client.agents.list_messages(thread_id=thread_id)
        if not getattr(messages, "data", []):
            return {"draft": "", "rationale": "", "confidence": 0.0, "upsell_opportunity": False, "estimated_engagement": 0.0}
        last = messages.data[0]
        try:
            return json.loads(last.content[0].text.value)
        except Exception:
            return {"draft": last.content[0].text.value, "rationale": "freeform", "confidence": 0.5, "upsell_opportunity": False, "estimated_engagement": 0.5}
