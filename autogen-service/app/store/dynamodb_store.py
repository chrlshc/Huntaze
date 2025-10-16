from __future__ import annotations
import time
from typing import Any, Dict, List, Optional
import boto3
from boto3.dynamodb.conditions import Key
from botocore.config import Config


class DDBStore:
    def __init__(self, region: str, t_sessions: str, t_msgs: str, t_art: str, ttl_days: int = 30):
        cfg = Config(max_pool_connections=50, retries={"max_attempts": 3, "mode": "adaptive"})
        self._d = boto3.resource("dynamodb", region_name=region, config=cfg)
        self.t_sessions = self._d.Table(t_sessions)
        self.t_msgs = self._d.Table(t_msgs)
        self.t_art = self._d.Table(t_art)
        self._ttl_days = ttl_days

    # --- Sessions ---
    def start_session(self, trace_id: str, session_id: str, meta: Dict[str, Any]) -> None:
        now = int(time.time())
        expires_at = now + self._ttl_days * 86400
        item = {
            "session_id": session_id,
            "trace_id": trace_id,
            "status": "running",
            "step": "INIT",
            "created_at": now,
            "updated_at": now,
            "expires_at": expires_at,
            **meta,
        }
        self.t_sessions.put_item(Item=item)

    def update_status(
        self,
        session_id: str,
        status: str,
        step: Optional[str] = None,
        risk: Optional[Dict[str, Any]] = None,
    ):
        expr_parts = ["#s = :s", "updated_at = :now"]
        names = {"#s": "status"}
        vals = {":s": status, ":now": int(time.time())}
        if step:
            expr_parts.append("step = :step")
            vals[":step"] = step
        if risk is not None:
            expr_parts.append("risk = :risk")
            vals[":risk"] = risk
        self.t_sessions.update_item(
            Key={"session_id": session_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=vals,
        )

    def get_session(self, session_id: str) -> Dict[str, Any]:
        return self.t_sessions.get_item(Key={"session_id": session_id}).get("Item", {})

    # --- Messages ---
    def append_message(
        self, session_id: str, round_i: int, speaker: str, content: str, meta: Dict[str, Any]
    ):
        sk = f"ts#{int(time.time()*1000)}#round#{round_i}#speaker#{speaker}"
        expires_at = int(time.time()) + self._ttl_days * 86400
        self.t_msgs.put_item(
            Item={
                "session_id": session_id,
                "sk": sk,
                "speaker": speaker,
                "content": content,
                "expires_at": expires_at,
                **meta,
            }
        )

    def list_messages(self, session_id: str) -> List[Dict[str, Any]]:
        # Note: requires a KeySchema with PK=session_id and SK=sk
        res = self.t_msgs.query(
            KeyConditionExpression=Key("session_id").eq(session_id)
        )
        return res.get("Items", [])

    # --- Sessions by status (requires GSI: status-index with PK=status, SK=created_at) ---
    def list_sessions_by_status(
        self, status: str, limit: int = 50, last_key: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {
            "IndexName": "status-index",
            "KeyConditionExpression": Key("status").eq(status),
            "Limit": limit,
            "ScanIndexForward": True,
        }
        if last_key:
            params["ExclusiveStartKey"] = last_key
        res = self.t_sessions.query(**params)
        return {"items": res.get("Items", []), "last_key": res.get("LastEvaluatedKey")}

    # --- Batch append messages ---
    def batch_append_messages(self, session_id: str, messages: List[Dict[str, Any]]):
        with self.t_msgs.batch_writer() as batch:
            now_ms = int(time.time() * 1000)
            for i, m in enumerate(messages):
                sk = m.get("sk") or f"ts#{now_ms+i}#round#{m.get('round', 0)}#speaker#{m.get('speaker','unknown')}"
                item = {"session_id": session_id, "sk": sk, **m}
                batch.put_item(Item=item)

    # --- Artifacts ---
    def put_artifact(self, session_id: str, a_type: str, data: Dict[str, Any]):
        expires_at = int(time.time()) + self._ttl_days * 86400
        self.t_art.put_item(
            Item={
                "session_id": session_id,
                "sk": f"artifact#{a_type}",
                "expires_at": expires_at,
                **data,
            }
        )
