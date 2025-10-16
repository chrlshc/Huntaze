import requests
import time
from typing import List, Dict, Any, Optional


def chat_via_proxy(
    llm_proxy_url: str,
    trace_id: str,
    system: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.5,
    max_tokens: int = 512,
    response_format: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload = {
        "trace_id": trace_id,
        "system": system,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format is not None:
        payload["response_format"] = response_format
    t0 = time.time()
    r = requests.post(llm_proxy_url, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    data["latency_ms"] = int((time.time() - t0) * 1000)
    return data  # { text, usage, model, provider, latency_ms }
