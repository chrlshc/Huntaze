from __future__ import annotations
import json
from typing import Any, Dict, List

from azure.identity import DefaultAzureCredential
from azure.servicebus import ServiceBusClient, ServiceBusMessage  # type: ignore
import os


class CINExecutor:
    """Executor: apply a plan by emitting action events to Service Bus for downstream workers.

    Integration-only: publishes JSON events to a queue (default: cin-actions). Downstream systems
    (CRM/ticketing/messaging) subscribe and perform side effects.
    """

    def __init__(self, *, queue_name: str | None = None):
        self.fqns = os.getenv("SERVICE_BUS_FQNS")
        self.queue = queue_name or os.getenv("SERVICE_BUS_QUEUE_CIN") or "cin-actions"
        self._client: ServiceBusClient | None = None

    def _get_client(self) -> ServiceBusClient | None:
        if not self.fqns:
            return None
        if self._client is None:
            cred = DefaultAzureCredential()
            self._client = ServiceBusClient(self.fqns, credential=cred)
        return self._client

    def execute(self, plan: Dict[str, Any], *, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        actions: List[Dict[str, Any]] = plan.get("plan", []) if isinstance(plan, dict) else []
        client = self._get_client()
        if client is None:
            return {"acknowledged": len(actions), "published": 0}
        published = 0
        trace_id = (context or {}).get("trace_id") if isinstance(context, dict) else None
        fan_id = (context or {}).get("fan_id") if isinstance(context, dict) else None
        try:
            with client:
                sender = client.get_queue_sender(queue_name=self.queue)
                with sender:
                    msgs = []
                    for i, action in enumerate(actions):
                        evt = {
                            "type": "cin.action",
                            "seq": i,
                            "action": action.get("action"),
                            "data": action.get("data", {}),
                            "context": context or {},
                        }
                        body = json.dumps(evt)
                        m = ServiceBusMessage(body)
                        # Duplicate detection: use deterministic message_id
                        if trace_id is not None:
                            m.message_id = f"{trace_id}-{i}"
                        # Session (optional FIFO by fan)
                        if fan_id is not None:
                            m.session_id = str(fan_id)
                        # Content type and custom props
                        m.content_type = "application/json"
                        m.application_properties = {
                            "type": "cin.action",
                            "seq": i,
                            "trace_id": trace_id or "",
                            "fan_id": fan_id or "",
                            "action": action.get("action", ""),
                        }
                        msgs.append(m)
                    if msgs:
                        sender.send_messages(msgs)
                        published = len(msgs)
        except Exception:
            pass
        return {"acknowledged": len(actions), "published": published}
