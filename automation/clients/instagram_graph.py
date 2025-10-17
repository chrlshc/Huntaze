import os
import time
import requests

GRAPH = os.getenv("META_GRAPH_URL", "https://graph.facebook.com/v20.0")
META_TOKEN = os.getenv("META_PAGE_ACCESS_TOKEN")
IG_USER_ID = os.getenv("IG_USER_ID")

def _assert_cfg():
    if not META_TOKEN or not IG_USER_ID:
        raise RuntimeError("Instagram Graph not configured: set META_PAGE_ACCESS_TOKEN and IG_USER_ID")

def create_media_container(image_url: str, caption: str):
    _assert_cfg()
    payload = {"image_url": image_url, "caption": caption, "access_token": META_TOKEN}
    r = requests.post(f"{GRAPH}/{IG_USER_ID}/media", data=payload, timeout=30)
    r.raise_for_status()
    return r.json()["id"]

def wait_container(container_id: str, timeout_s: int = 120):
    _assert_cfg()
    t0 = time.time()
    while time.time() - t0 < timeout_s:
        r = requests.get(
            f"{GRAPH}/{container_id}",
            params={"fields": "status_code", "access_token": META_TOKEN},
            timeout=15,
        )
        r.raise_for_status()
        if r.json().get("status_code") == "FINISHED":
            return True
        time.sleep(2)
    raise TimeoutError("IG container not ready in time")

def publish_container(container_id: str):
    _assert_cfg()
    r = requests.post(
        f"{GRAPH}/{IG_USER_ID}/media_publish",
        data={"creation_id": container_id, "access_token": META_TOKEN},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()

def publish_image(image_url: str, caption: str):
    cid = create_media_container(image_url, caption)
    wait_container(cid)
    return publish_container(cid)

