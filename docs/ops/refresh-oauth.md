Refresh OAuth – Operations Runbook

Scope
- Scheduled token refresh for TikTok, Reddit, and Instagram.
- Stack: OAuthRefreshStack (EventBridge + Lambda).

Key resources
- Lambda: RefreshOAuthTokensFn (see stack output RefreshOAuthFnName)
- EventBridge rules:
  - RefreshOAuthRate15m-<stage> (TikTok + Reddit)
  - RefreshOAuthIG-<stage> (Instagram every 3 days at 09:00 UTC)
- Dead-letter queue: OAuthRefreshDLQ-<stage>

Environment variables (Lambda)
- Required: TOKENS_TABLE, TIKTOK_CLIENT_KEY/SECRET, REDDIT_CLIENT_ID/SECRET, REDDIT_USER_AGENT
- Optional: IG_APP_ID, IG_APP_SECRET, ANALYTICS_TABLE (defaults to huntaze-analytics-events), JITTER_SECONDS (default 120)
- Best practice: encrypt sensitive values with KMS and rotate regularly.

Monitoring
- CloudWatch alarms (basic):
  - Lambda Errors >= 1 (5 min)
  - Lambda Throttles >= 1 (5 min)
  - EventBridge FailedInvocations >= 1 for each rule (5 min)
- Logs: /aws/lambda/<function-name>
- Status API: GET /api/cron/refresh-oauth/status (aggregates token.refresh events)

Common issues and triage
1) Lambda errors
   - Open CloudWatch Logs for the function and inspect recent errors.
   - Verify environment variables are set and valid.
   - Check DynamoDB table huntaze-oauth-tokens and GSI byExpiry.
2) EventBridge failed invocations
   - Confirm Lambda permission resources exist for the rules.
   - Check DLQ messages in OAuthRefreshDLQ-<stage> for payloads that failed.
3) Rate limiting
   - TikTok user/info is 600 rpm; the job includes jitter and backoff.
   - Reddit requires a descriptive User-Agent header; missing/weak values may be blocked.
4) Concurrency throttles
   - The function runs without reserved concurrency; request a quota increase if throttles persist.

Manual run
- Invoke with a subset of providers:
  aws lambda invoke \
    --function-name <function-name> \
    --payload '{"providers":["tiktok","reddit"]}' /tmp/out.json --log-type Tail

Timezones
- EventBridge rules execute in UTC. Use EventBridge Scheduler for time zone–aware schedules if needed.

