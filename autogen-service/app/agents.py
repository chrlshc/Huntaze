from typing import Any, Dict
import autogen  # installed via autogen-agentchat~=0.2
from .services.llm_proxy import chat_via_proxy
from .models import WriterReply, SafeguardReply

# JSON Schemas for structured outputs
WRITER_SCHEMA = {
    "name": "writer_reply",
    "schema": {
        "type": "object",
        "properties": {
            "draft": {"type": "string"},
            "rationale": {"type": "string"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
        "required": ["draft", "rationale", "confidence"],
        "additionalProperties": False,
    },
    "strict": True,
}

SAFEGUARD_SCHEMA = {
    "name": "safeguard_reply",
    "schema": {
        "type": "object",
        "properties": {
            "label": {"type": "string", "enum": ["green", "yellow", "red"]},
            "score": {"type": "integer", "minimum": 0, "maximum": 100},
            "infractions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "rule_id": {"type": "string"},
                        "severity": {"type": "string"},
                        "reason": {"type": "string"},
                    },
                    "required": ["rule_id", "severity"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["label", "score", "infractions"],
        "additionalProperties": False,
    },
    "strict": True,
}


class ChatContext:
    def __init__(self, store, session_id: str):
        self.store = store
        self.session_id = session_id
        self.round_i = 0
        self.last_writer: Dict[str, Any] | None = None
        self.last_safeguard: Dict[str, Any] | None = None

    def record(self, agent: str, text: str, meta: Dict[str, Any]):
        if agent == "writer":
            self.round_i += 1
        self.store.append_message(self.session_id, self.round_i, agent, text, meta)
        if agent == "writer":
            # strict JSON via Pydantic v2
            try:
                wr = WriterReply.model_validate_json(text)
                self.last_writer = {"draft": wr.draft, "raw": wr.model_dump()}
                self.store.put_artifact(self.session_id, "draft", {"draft": wr.draft})
            except Exception:
                # fallback to raw text when not valid JSON
                self.last_writer = {"draft": text, "raw": None}
                self.store.put_artifact(self.session_id, "draft", {"draft": text})
        elif agent == "safeguard":
            try:
                sr = SafeguardReply.model_validate_json(text)
                data = sr.model_dump()
                self.last_safeguard = data
                self.store.put_artifact(self.session_id, "safeguard", data)
            except Exception:
                self.last_safeguard = {"label": "yellow", "infractions": [], "raw": text}
                self.store.put_artifact(
                    self.session_id, "safeguard", {"label": "yellow", "infractions": []}
                )


def _proxy_reply(system_msg: str, llm_url: str, trace_id: str, ctx: ChatContext, agent_name: str):
    def reply(recipient: Any, messages=None, sender=None, config=None):
        # Convert to simple array of {role, content}
        simplified = []
        for m in messages or []:
            role = m.get("role") or ("assistant" if m.get("name") != "User_proxy" else "user")
            simplified.append({"role": role, "content": m.get("content", "")})
        response_format = None
        if agent_name == "writer":
            response_format = {"type": "json_schema", "json_schema": WRITER_SCHEMA}
        elif agent_name == "safeguard":
            response_format = {"type": "json_schema", "json_schema": SAFEGUARD_SCHEMA}

        res = chat_via_proxy(
            llm_url,
            trace_id,
            system_msg,
            simplified,
            response_format=response_format,
        )
        text = res["text"]
        meta = {
            "model": res.get("model"),
            "provider": res.get("provider"),
            "usage": res.get("usage"),
            "latency_ms": res.get("latency_ms"),
        }
        try:
            ctx.record(agent_name, text, meta)
        except Exception:
            pass
        return True, text  # final=True, reply=text

    return reply


def build_team(llm_proxy_url: str, trace_id: str, max_rounds: int, store, session_id: str):
    writer = autogen.AssistantAgent(
        name="writer", llm_config={"config_list": [{"model": "proxy"}], "timeout": 60}
    )
    safeguard = autogen.AssistantAgent(
        name="safeguard", llm_config={"config_list": [{"model": "proxy"}], "timeout": 60}
    )
    commander = autogen.UserProxyAgent(name="commander", human_input_mode="NEVER")

    ctx = ChatContext(store, session_id)

    writer.register_reply(
        trigger=None,
        reply_func=_proxy_reply(
            "Tu es un copywriter OF. Réponds exclusivement en JSON valide conforme au schéma (draft, rationale, confidence). Aucune autre sortie n'est autorisée.",
            llm_proxy_url,
            trace_id,
            ctx,
            "writer",
        ),
        remove_other_reply_funcs=True,
    )
    safeguard.register_reply(
        trigger=None,
        reply_func=_proxy_reply(
            "Tu es l'agent conformité. Réponds exclusivement en JSON valide conforme au schéma (label, score, infractions[{rule_id,severity,reason}]). Aucune autre sortie n'est autorisée.",
            llm_proxy_url,
            trace_id,
            ctx,
            "safeguard",
        ),
        remove_other_reply_funcs=True,
    )

    group = autogen.GroupChat(
        agents=[commander, writer, safeguard], messages=[], max_round=max_rounds
    )
    manager = autogen.GroupChatManager(
        groupchat=group, llm_config={"config_list": [{"model": "proxy"}]}
    )
    return commander, writer, safeguard, manager, ctx
