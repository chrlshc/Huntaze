# Setup Wizard — Configuration & Backend Automation

## Overview

The setup wizard collects just enough information to configure the AI and activate the correct services. It is designed to be skippable where possible and complete in under 30 seconds.

## Wizard Architecture

### Step 1 — Welcome (≈5 seconds)

**Screen copy**
- Title: "Welcome! Configure your AI in 30 seconds."
- Primary action: Continue
- Secondary action: Skip for now (visible)

**Data persisted**: none

---

### Step 2 — Platform (Required)

**Question**: "Which platform do you create for?"

**Options**:
- OnlyFans
- Instagram
- TikTok
- Reddit
- Other

**Backend activation (immediate)**:

| Selection | Services enabled |
|-----------|-----------------|
| OnlyFans | OnlyFans scraper (proxy rotation, rate limiting), Auto-DM engine, PPV detector, templates (auto-respond, PPV promotion, subscriber welcome) |
| Instagram | Hashtag analyzer, Engagement predictor, Reel formatter, templates (DM, hashtag, engagement) |
| TikTok | Trend detector, Sound library, Clip converter, templates (caption, trend, viral) |
| Reddit | Reddit API client, Subreddit classifier, Karma optimizer, templates (post, comment) |
| Other | Minimal defaults; user can connect a platform later |

**Persisted**: `platform = "onlyfans"` (example)

---

### Step 3 — Primary Goal (Required)

**Question**: "What is your primary goal?"

**Options**:
- Grow my audience
- Automate my messages
- Generate content ideas
- All of the above

**Feature mapping**:

| Goal | Features enabled | Dashboard emphasis |
|------|-----------------|-------------------|
| Grow | Growth analytics, Recommendations engine, Follower tracking | New followers, Engagement %, Growth forecast |
| Automate | Auto-DM engine, Message templates, Best send time | Unread messages, Messages sent, Response rate |
| Content ideas | Content generator, Trend scanner, Daily ideas | Today's ideas, Trending topics, Idea library |
| All of the above | All features above | Unified overview |

**Persisted**: `primary_goal = "automate"` (example)

---

### Step 4 — AI Tone (Optional; skippable)

**Question**: "What tone should the AI use?"

**Options**:
- Playful (casual, light, suggestive, 3–5 emojis allowed)
- Professional (formal, clear, data-driven, no emojis)
- Casual (friendly, conversational, light emoji)
- Seductive (flirty, emotionally engaging)

**Skip behavior**: If skipped, default to Professional.

**Effect on system prompt**:

| Tone | System Prompt |
|------|--------------|
| Playful | "Use casual language with suggestive undertones where appropriate; allow succinct emoji use; keep replies short." |
| Professional | "Use formal, clear, data-driven language; no emojis; concise responses." |
| Casual | "Friendly and conversational; minimal emojis; concise." |
| Seductive | "Warm, flirty tone with emotional engagement; concise and respectful." |

**Persisted**: `ai_tone = "professional"` (example, or when skipped)

---

## What happens after each answer

**Example selection**: OnlyFans + Automate Messages + Skip Tone (defaults to Professional)

1. **OnlyFans scraper enabled**
   - Proxy rotation to reduce ban risk
   - Rate limiting at 5 req/s
   - Scrapes messages, followers, PPV prices

2. **Auto-DM engine enabled**
   - Message scheduling
   - Personalization rules
   - Response tracking

3. **Templates pre-loaded**
   - Auto-respond DM
   - PPV promotion
   - New subscriber welcome

4. **Dashboard configured**
   - Unread messages (priority)
   - Messages sent today
   - Response rate
   - Engagement stats

5. **AI system prompt set**
   - "Professional, helpful assistant for OnlyFans creators. Understand DM automation and PPV mechanics. Tone: professional, clear, valuable. Length: short DMs (1–2 lines). Emoji: minimal (1–2 max)."

---

## Do not ask in the wizard

| Do not ask | Reason | Alternative |
|-----------|--------|-------------|
| Email | Already collected at sign-up | N/A |
| Exact follower count | An estimate is enough | Ask: "<1k / 1k–10k / 10k–50k / 50k+" |
| Marketing budget | Out of scope for AI config | Handle later in Billing |
| Age / Gender | Not necessary | N/A |
| Tech stack | You own the defaults | N/A |
| Profile photos | Optional | Set later on the Profile page |
| Email confirmation | Delays activation | Send after onboarding |
| GDPR-sensitive data | Reduces trust | Minimize collection |
| Ten platforms at once | Creates friction | Let users add more later |
| Manual scraping settings | Auto-configured | Do it server-side |

---

## Data to persist (example payload)

```json
{
  "user_id": "user_123456",
  "platform": "onlyfans",
  "primary_goal": "automate",
  "ai_tone": "professional",
  "follower_range": "10k_50k",
  "completed_at": "2025-11-11T20:00:35Z",
  "questions_skipped": [4],
  "time_to_complete": 35,
  "ai_config_json": {
    "tone": "professional",
    "platform": "onlyfans",
    "creativity_level": "medium",
    "emoji_frequency": "low",
    "response_length": "medium"
  },
  "template_selections": {
    "dm_auto_response": true,
    "ppv_promo": true,
    "subscriber_welcome": true
  }
}
```

---

## Concrete example — Creator "Sarah"

**Inputs**:
1. Welcome → Continue
2. Platform → OnlyFans
3. Goal → Automate my messages
4. Tone → Skipped (defaults to Professional)

**Outcome (≈35 seconds)**:
- OnlyFans scraper is live
- Auto-DM is ready to use
- Templates loaded: auto-respond, PPV promotion
- Dashboard shows 14 unread messages
- AI configured: professional tone, 1–2 emojis max

**Day 1 progression (illustrative)**:
- 08:00 — Sees "14 unread messages"
- 08:05 — Activates auto-response template
- 12:00 — +23 followers
- 15:00 — Adds PPV promotion template
- 18:00 — 47 messages sent, 89% open rate

**Week 1**: 200+ automated messages, 5 PPV sales, 0 support tickets

---

## Implementation checklist

- [ ] Step 2: Platform selection triggers scrapers and template provisioning
- [ ] Step 3: Goal selection enables features and sets dashboard emphasis
- [ ] Step 4: Tone selection updates the system prompt (or defaults to Professional on skip)
- [ ] Dashboard: pre-filled metrics and quick-start actions
- [ ] Analytics: record platform/goal/tone, skips, and time-to-value
- [ ] Database: persist all fields shown above
- [ ] Backend: generate AI prompts and feature toggles from selections
