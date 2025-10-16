def compute_risk(safeguard_json: dict) -> dict:
    label = safeguard_json.get("label", "yellow")
    infractions = safeguard_json.get("infractions", [])
    # If agent provides a score, trust it within bounds
    if "score" in safeguard_json:
        try:
            s = int(safeguard_json.get("score"))
            s = max(0, min(100, s))
            return {"label": label, "score": s, "infractions": infractions}
        except Exception:
            pass
    base = {"green": 20, "yellow": 60, "red": 90}.get(label, 60)
    high = [r for r in infractions if r.get("severity", "low") == "high"]
    score = min(100, base + min(10, 5 * len(high)))
    return {"label": label, "score": score, "infractions": infractions}
