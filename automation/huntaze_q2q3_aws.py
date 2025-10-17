#!/usr/bin/env python3
"""
Huntaze Q2–Q3 Orchestrator (AWS)

- Predict (ML Analytics): connects to Postgres if available and writes simple predictions.
- A/B Testing: stores variant metrics in `ab_tests` (creates table if missing).
- DM Automation: generates a reply (Claude if API key set) and writes to `dm_conversations`.
- Content Generation: creates captions/hashtags/ideas and writes to `generated_content`.

Dependencies are optional. If `psycopg2`/`boto3` are not present, the script falls back to dry-run behavior.
"""
from __future__ import annotations

import os
import sys
import json
import time
import base64
import typing as t
from dataclasses import dataclass
from datetime import datetime


# Optional deps
try:
    import psycopg2  # type: ignore
    from psycopg2.extras import RealDictCursor  # type: ignore
except Exception:  # pragma: no cover
    psycopg2 = None  # type: ignore
    RealDictCursor = None  # type: ignore

try:
    import boto3  # type: ignore
except Exception:  # pragma: no cover
    boto3 = None  # type: ignore

try:
    import urllib.request
    import urllib.error
except Exception:
    urllib = None  # type: ignore


def eprint(*args: t.Any) -> None:
    print(*args, file=sys.stderr)


def env(name: str, default: t.Optional[str] = None) -> t.Optional[str]:
    return os.environ.get(name, default)


# ---------- Postgres helpers ----------


def get_pg_conn():
    host = env("POSTGRES_HOST")
    db = env("POSTGRES_DB", "huntaze")
    user = env("POSTGRES_USER", "huntazeadmin")
    pwd = env("POSTGRES_PASSWORD")
    if not host or not pwd:
        eprint("[orchestrator] Postgres not configured (POSTGRES_HOST/POSTGRES_PASSWORD missing) — running dry mode.")
        return None
    if not psycopg2:
        eprint("[orchestrator] psycopg2 not installed — running dry mode.")
        return None
    conn = psycopg2.connect(host=host, dbname=db, user=user, password=pwd)
    conn.autocommit = True
    return conn


def pg_exec(conn, sql: str, params: t.Tuple = ()):
    with conn.cursor() as cur:
        cur.execute(sql, params)


def pg_fetch_all(conn, sql: str, params: t.Tuple = ()) -> t.List[dict]:
    if RealDictCursor is None:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, r)) for r in cur.fetchall()]
    else:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())


def ensure_tables(conn) -> None:
    # Create minimal tables if they don't exist yet.
    pg_exec(
        conn,
        """
        CREATE TABLE IF NOT EXISTS ab_tests (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          experiment_name TEXT NOT NULL,
          variant TEXT NOT NULL,
          metric TEXT NOT NULL,
          value DOUBLE PRECISION NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
    )
    pg_exec(
        conn,
        """
        CREATE TABLE IF NOT EXISTS generated_content (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          platform TEXT,
          content_type TEXT,
          title TEXT,
          body TEXT,
          tags JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
    )
    pg_exec(
        conn,
        """
        CREATE TABLE IF NOT EXISTS dm_conversations (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          platform TEXT,
          conversation_id TEXT,
          role TEXT,
          message TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
    )


# ---------- Azure OpenAI helper ----------


def call_azure_openai(prompt: str, system: str = "You are a helpful assistant.") -> str:
    """Minimal Azure OpenAI Chat Completions call via REST.

    Requires:
      - AZURE_OPENAI_ENDPOINT (e.g. https://<resource>.openai.azure.com)
      - AZURE_OPENAI_API_KEY
      - AZURE_OPENAI_DEPLOYMENT_NAME (chat deployment)
      - AZURE_OPENAI_API_VERSION (optional, default '2024-02-15-preview')
    """
    endpoint = (env("AZURE_OPENAI_ENDPOINT") or "").rstrip("/")
    api_key = env("AZURE_OPENAI_API_KEY")
    deployment = env("AZURE_OPENAI_DEPLOYMENT_NAME") or env("AZURE_OPENAI_CHAT_DEPLOYMENT") or "gpt-4o"
    api_version = env("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

    if not endpoint or not api_key:
        return f"[stubbed-azure] {prompt[:120]}..."

    url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"
    data = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 256,
        "n": 1,
    }
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url=url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "api-key": api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            out = json.loads(resp.read().decode("utf-8"))
            content = out.get("choices", [{}])[0].get("message", {}).get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()
            return json.dumps(out)[:512]
    except Exception as e:  # noqa: BLE001
        return f"[azure-error] {e}"


# ---------- S3 helper (optional) ----------


def s3_put_json(bucket: str, key: str, obj: dict) -> str:
    if not boto3 or not bucket:
        return "s3_skipped"
    s3 = boto3.client("s3", region_name=env("AWS_REGION", "us-east-1"))
    s3.put_object(Bucket=bucket, Key=key, Body=json.dumps(obj).encode("utf-8"), ContentType="application/json")
    return f"s3://{bucket}/{key}"


# ---------- Commands ----------


def cmd_predict(args: dict) -> int:
    conn = get_pg_conn()
    bucket = env("S3_BUCKET")

    if conn:
        ensure_tables(conn)
        # Attempt to read basic user/fan metrics if available
        try:
            fans = pg_fetch_all(conn, "SELECT id, userId as user_id, totalSpendSubscription, totalSpendPPV, totalSpendTips FROM \"Fan\" LIMIT 100")
        except Exception:
            fans = []
    else:
        fans = []

    # Simple heuristic prediction when no ML lib available
    preds = []
    for f in fans:
        spend = (f.get("totalspendsubscription") or 0) + (f.get("totalspendppv") or 0) + (f.get("totalspendtips") or 0)
        ltv = round(spend * 1.25 + 10, 2)
        preds.append({"fan_id": f.get("id"), "user_id": f.get("user_id"), "predicted_ltv": ltv})

    out = {"ts": datetime.utcnow().isoformat(), "count": len(preds), "predictions": preds[:20]}

    # Optional S3 upload (tolerant if missing)
    if bucket:
        key = f"ml/predictions/{int(time.time())}.json"
        url = s3_put_json(bucket, key, out)
        print(json.dumps({"ok": True, "uploaded": url, "count": out["count"]}))
    else:
        print(json.dumps({"ok": True, "uploaded": False, "count": out["count"], "note": "S3_BUCKET not set; running predict-only"}))

    return 0


def cmd_abtest(args: dict) -> int:
    conn = get_pg_conn()
    user_id = args.get("user_id") or "anonymous"
    experiment = args.get("experiment") or "caption_test"
    variant = args.get("variant") or "A"
    metric = args.get("metric") or "ctr"
    value = float(args.get("value") or 0.0)

    if not conn:
        print(json.dumps({"ok": True, "dry_run": True, "record": {"user_id": user_id, "experiment": experiment, "variant": variant, "metric": metric, "value": value}}))
        return 0

    ensure_tables(conn)
    pg_exec(
        conn,
        "INSERT INTO ab_tests (user_id, experiment_name, variant, metric, value) VALUES ($1, $2, $3, $4, $5)".replace("$", "%s"),
        (user_id, experiment, variant, metric, value),
    )
    print(json.dumps({"ok": True, "stored": True}))
    return 0


def cmd_dm(args: dict) -> int:
    conn = get_pg_conn()
    user_id = args.get("user_id") or "anonymous"
    platform = args.get("platform") or "onlyfans"
    convo_id = args.get("conversation_id") or f"conv-{int(time.time())}"
    last_msg = args.get("message") or "Hey! Any new content?"

    system = "You help creators respond in a warm, persuasive tone."
    reply = call_azure_openai(
        f"Incoming message: {last_msg}\nWrite a short, friendly reply.",
        system=system,
    )

    if conn:
        ensure_tables(conn)
        pg_exec(
            conn,
            "INSERT INTO dm_conversations (user_id, platform, conversation_id, role, message) VALUES ($1,$2,$3,$4,$5)".replace("$", "%s"),
            (user_id, platform, convo_id, "user", last_msg),
        )
        pg_exec(
            conn,
            "INSERT INTO dm_conversations (user_id, platform, conversation_id, role, message) VALUES ($1,$2,$3,$4,$5)".replace("$", "%s"),
            (user_id, platform, convo_id, "assistant", reply),
        )

    print(json.dumps({"ok": True, "conversation_id": convo_id, "reply": reply}))
    return 0


def cmd_content(args: dict) -> int:
    conn = get_pg_conn()
    user_id = args.get("user_id") or "anonymous"
    platform = args.get("platform") or "instagram"
    topic = args.get("topic") or "new set release"

    prompt = (
        f"Generate: 1) a short caption about '{topic}', 2) 6 hashtags, 3) a content idea."
    )
    text = call_azure_openai(prompt, system="You are a social media content assistant.")

    # Basic parsing heuristics
    caption = text.split('\n')[0][:220]
    tags = [t.strip() for t in text.split('#') if t.strip()][:6]
    idea = text[:500]

    if conn:
        ensure_tables(conn)
        pg_exec(
            conn,
            "INSERT INTO generated_content (user_id, platform, content_type, title, body, tags) VALUES ($1,$2,$3,$4,$5,$6)".replace("$", "%s"),
            (user_id, platform, "caption", topic, caption, json.dumps(tags)),
        )

    print(json.dumps({"ok": True, "platform": platform, "caption": caption, "tags": tags, "idea_excerpt": idea}))
    return 0


def main(argv: t.List[str]) -> int:
    if len(argv) < 2:
        print(
            "Usage: python3 automation/huntaze_q2q3_aws.py <command> [key=value ...]\n"
            "Commands: predict | abtest | dm | content"
        )
        return 2

    cmd = argv[1].strip().lower()
    kv = {}
    for item in argv[2:]:
        if "=" in item:
            k, v = item.split("=", 1)
            kv[k] = v

    if cmd == "predict":
        return cmd_predict(kv)
    if cmd == "abtest":
        return cmd_abtest(kv)
    if cmd == "dm":
        return cmd_dm(kv)
    if cmd == "content":
        return cmd_content(kv)

    eprint(f"Unknown command: {cmd}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
