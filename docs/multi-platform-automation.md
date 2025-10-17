# Multi-Platform Traffic Automation (Q1 Pilot)

This module implements the Huntaze Q1 automation plan for cross-platform traffic
acquisition. It uses the community-driven best practices gathered for OnlyFans
creators and wraps them into a single orchestrator.

## Location

`automation/multi_platform_traffic.py`

## Features

- Instagram, TikTok, and Reddit publishers with platform-specific validation.
- Caption generator that avoids flagged keywords and enforces safe hashtags.
- Scheduler that targets optimal posting windows (IG 19h-22h, TikTok 18h-23h,
  Reddit 20h-23h).
- Metrics collection hooks so the data layer (CIN) can pivot on engagement.

## Setup

```bash
pip install instagrapi praw tiktok-uploader python-dotenv
```

Create a `.env` (or export environment variables) with:

```
IG_USERNAME=...
IG_PASSWORD=...
TIKTOK_COOKIES=path/to/cookies.txt
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER=...
REDDIT_PASS=...
```

TikTok requires a cookie jar generated after a manual login. The automation
module expects a file path via `TIKTOK_COOKIES`.

## Running the sample workflow

```bash
python automation/multi_platform_traffic.py
```

The script will:

1. Initialise publishers using the environment credentials.
2. Schedule an Instagram photo and a Reddit post at optimal times.
3. Publish a sample Instagram post immediately and print basic metrics once
   they become available.

In production, `lib/queue/content-processors.ts` calls the Python module through
`lib/automation/multi-platform-runner.ts`, allowing SQS `publish_content`
messages for Instagram/TikTok/Reddit to execute through the same automation
stack.

## Integrating with CIN workers

- Replace the simple `metrics_db` list with the Huntaze analytics storage.
- Wire the scheduler loop into the CIN worker queue so creative assets drop
  straight into the automation pipeline.
- Feed retrieved metrics back into the OnlyFans analytics deck to close the
  optimisation loop.
