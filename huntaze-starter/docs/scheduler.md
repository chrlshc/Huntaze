Huntaze Starter — Scheduler Integration

Components
- API: POST `/api/content/schedule` records a `schedule_request` event in DynamoDB.
- EventBridge/Lambda: provisioned by CDK (`OAuthRefreshStack` placeholder) — add a dedicated scheduler rule and worker Lambda to pick `schedule_request` and publish.

Minimal flow
1) Frontend calls `/api/cin/chat` to get `best time` and CTA `Schedule for HH:MM`.
2) Frontend POSTs `/api/content/schedule` with `{ content, time, platforms, price }`.
3) Worker consumes events and posts to OnlyFans (scraper/publisher) at the scheduled time.

Extending
- Create `ScheduleWorker` Lambda subscribed to EventBridge or a DDB stream.
- On schedule time window, publish via OF publisher (existing worker flow) or enqueue to SQS.

