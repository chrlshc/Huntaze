import os
import requests

BASE = os.getenv("TIKTOK_API_BASE", "https://open.tiktokapis.com/v2")
ACCESS_TOKEN = os.getenv("TT_ACCESS_TOKEN")

def _hdr():
    if not ACCESS_TOKEN:
        raise RuntimeError("TikTok API not configured: set TT_ACCESS_TOKEN")
    return {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}

def upload_video_from_url(video_url: str) -> str:
    r = requests.post(f"{BASE}/post/publish/initialize/", headers=_hdr(), json={"source": "PULL_FROM_URL", "video_url": video_url}, timeout=60)
    r.raise_for_status()
    data = r.json().get("data", {})
    return data.get("upload_id")

def commit_post(upload_id: str, caption: str):
    r = requests.post(f"{BASE}/post/publish/commit/", headers=_hdr(), json={"upload_id": upload_id, "text": caption}, timeout=60)
    r.raise_for_status()
    return r.json()

