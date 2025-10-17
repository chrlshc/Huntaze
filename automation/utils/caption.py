import random

IG_CTA = [
    "DM me 'VIP' for a surprise",
    "Need to see more? Link in bio.",
    "Ready for exclusive content? Check my profile.",
]

TT_CTA = [
    "Full clip on my profile",
    "Want more? Follow link in bio",
]

REDDIT_TEMPLATES = [
    "Sneak peek – more on my profile",
    "Exclusive drop today – check my profile",
]

def _sanitize_caption(text: str) -> str:
    # Remove explicit OnlyFans mentions/links and replace with soft CTA
    bad_words = ["onlyfans", "only fans", "only-fans"]
    for w in bad_words:
        text = text.replace(w, "link in bio") if w in text.lower() else text
    # Strip URLs
    import re
    text = re.sub(r"https?://\S+", "link in bio", text)
    return text

def make_ig_caption(copy: dict | None) -> str:
    base = (copy or {}).get('base_caption') or random.choice(IG_CTA)
    base = _sanitize_caption(base)
    tags = (copy or {}).get('hashtags') or []
    safe = [t for t in tags if 'onlyfans' not in t.lower()][:8]
    if safe:
        base += "\n\n" + " ".join(f"#{t}" for t in safe)
    return base

def make_tt_caption(copy: dict | None) -> str:
    base = (copy or {}).get('base_caption') or random.choice(TT_CTA)
    base = _sanitize_caption(base)
    tags = (copy or {}).get('hashtags') or []
    safe = [t for t in tags if 'onlyfans' not in t.lower()][:5]
    if safe:
        base += " " + " ".join(f"#{t}" for t in safe)
    return base

def make_reddit_title(copy: dict | None) -> str:
    return (copy or {}).get('title') or random.choice(REDDIT_TEMPLATES)
