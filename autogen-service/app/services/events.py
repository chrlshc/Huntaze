import time
import hashlib
import hmac
import json
import requests


def post_event(nextjs_webhook_url: str, secret: str, event: dict) -> None:
    raw = json.dumps(event, ensure_ascii=False).encode("utf-8")
    ts = str(int(time.time()))
    mac = hmac.new(
        secret.encode(), f"{ts}.{raw.decode('utf-8')}".encode("utf-8"), hashlib.sha256
    ).hexdigest()
    headers = {
        "content-type": "application/json",
        "x-autogen-timestamp": ts,
        "x-autogen-signature": f"sha256={mac}",
    }
    r = requests.post(nextjs_webhook_url, data=raw, headers=headers, timeout=10)
    r.raise_for_status()
