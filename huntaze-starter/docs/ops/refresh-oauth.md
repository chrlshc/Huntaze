Refresh OAuth — Ops Runbook

Overview
- EventBridge triggers the Lambda refresher.
- Lambda scans the tokens table for items expiring within 6h.
- Each provider is refreshed with jitter/backoff.
- Emits analytics events (token_refresh ok/error) to DynamoDB.

Checks
- CloudWatch logs: function errors.
- DLQ messages for failed invocations.
- /api/cron/refresh-oauth/status for last 7 days summary.

Env vars
- TOKENS_TABLE, ANALYTICS_TABLE, REDDIT_USER_AGENT, provider secrets.

Manual invoke
- Use Lambda console or AWS CLI to invoke refresh and inspect CloudWatch logs.

