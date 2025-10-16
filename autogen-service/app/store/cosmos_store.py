from __future__ import annotations
import time
from typing import Any, Dict, List, Optional

from azure.cosmos import CosmosClient, exceptions


class CosmosStore:
    def __init__(
        self,
        endpoint: str,
        key: str,
        database: str,
        container_sessions: str,
        container_messages: str,
        container_artifacts: str,
        ttl_days: int = 30,
    ):
        self._c = CosmosClient(endpoint, credential=key)
        db = self._c.get_database_client(database)
        self.c_sessions = db.get_container_client(container_sessions)
        self.c_msgs = db.get_container_client(container_messages)
        self.c_art = db.get_container_client(container_artifacts)
        self._ttl_days = ttl_days

    # --- Sessions ---
    def start_session(self, trace_id: str, session_id: str, meta: Dict[str, Any]) -> None:
        now = int(time.time())
        expires_at = now + self._ttl_days * 86400
        item = {
            "id": session_id,  # Cosmos requires 'id'
            "session_id": session_id,  # partition key
            "trace_id": trace_id,
            "status": "running",
            "step": "INIT",
            "created_at": now,
            "updated_at": now,
            "expires_at": expires_at,
            **meta,
        }
        self.c_sessions.upsert_item(item)

    def update_status(
        self,
        session_id: str,
        status: str,
        step: Optional[str] = None,
        risk: Optional[Dict[str, Any]] = None,
    ):
        try:
            it = self.c_sessions.read_item(item=session_id, partition_key=session_id)
        except exceptions.CosmosResourceNotFoundError:
            return
        it["status"] = status
        it["updated_at"] = int(time.time())
        if step is not None:
            it["step"] = step
        if risk is not None:
            it["risk"] = risk
        self.c_sessions.replace_item(item=it, body=it)

    def get_session(self, session_id: str) -> Dict[str, Any]:
        try:
            it = self.c_sessions.read_item(item=session_id, partition_key=session_id)
            return dict(it)
        except exceptions.CosmosResourceNotFoundError:
            return {}

    # --- Messages ---
    def append_message(
        self, session_id: str, round_i: int, speaker: str, content: str, meta: Dict[str, Any]
    ):
        sk = f"ts#{int(time.time()*1000)}#round#{round_i}#speaker#{speaker}"
        expires_at = int(time.time()) + self._ttl_days * 86400
        item = {
            "id": f"{session_id}:{sk}",
            "session_id": session_id,
            "sk": sk,
            "speaker": speaker,
            "content": content,
            "expires_at": expires_at,
            **meta,
        }
        self.c_msgs.upsert_item(item)

    def list_messages(self, session_id: str) -> List[Dict[str, Any]]:
        query = (
            "SELECT c.id, c.sk, c.speaker, c.content, c.expires_at, c.session_id "
            "FROM c WHERE c.session_id = @sid ORDER BY c.sk ASC"
        )
        items = list(
            self.c_msgs.query_items(
                query=query,
                parameters=[{"name": "@sid", "value": session_id}],
                enable_cross_partition_query=False,
            )
        )
        return items

    # --- Sessions by status (approximate equivalent) ---
    def list_sessions_by_status(
        self, status: str, limit: int = 50, last_key: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        query = (
            "SELECT c.id, c.session_id, c.trace_id, c.status, c.step, c.created_at, c.updated_at "
            "FROM c WHERE c.status = @st ORDER BY c.created_at ASC"
        )
        it = self.c_sessions.query_items(
            query=query,
            parameters=[{"name": "@st", "value": status}],
            enable_cross_partition_query=True,
            max_item_count=limit,
        )
        items = []
        token = None
        for page in it.by_page(continuation_token=(last_key or {}).get("ct")):
            items = list(page)
            token = it._response_hook_data.get("continuation_token") if hasattr(it, "_response_hook_data") else None
            break
        return {"items": items, "last_key": {"ct": token} if token else None}

    # --- Batch append messages ---
    def batch_append_messages(self, session_id: str, messages: List[Dict[str, Any]]):
        # Cosmos SDK lacks a simple bulk in this variant; upsert in a loop
        now_ms = int(time.time() * 1000)
        for i, m in enumerate(messages):
            sk = m.get("sk") or f"ts#{now_ms+i}#round#{m.get('round', 0)}#speaker#{m.get('speaker','unknown')}"
            item = {
                "id": f"{session_id}:{sk}",
                "session_id": session_id,
                "sk": sk,
                **m,
            }
            self.c_msgs.upsert_item(item)

    # --- Artifacts ---
    def put_artifact(self, session_id: str, a_type: str, data: Dict[str, Any]):
        expires_at = int(time.time()) + self._ttl_days * 86400
        item = {
            "id": f"{session_id}:artifact#{a_type}",
            "session_id": session_id,
            "sk": f"artifact#{a_type}",
            "expires_at": expires_at,
            **data,
        }
        self.c_art.upsert_item(item)

