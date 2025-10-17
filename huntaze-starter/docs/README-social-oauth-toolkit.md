Huntaze — Social OAuth Toolkit (Starter)

Scope
- OAuth callbacks: TikTok, Reddit, Instagram (Basic)
- Token persistence (DynamoDB): providerUserId, extra, expiresAt (ISO+epoch)
- Token refresh Lambda + EventBridge rules + DLQ
- Analytics events (DynamoDB) for token.refresh + stat_snapshot
- Status endpoint: /api/cron/refresh-oauth/status

Environment
- AWS_REGION / NEXT_PUBLIC_AWS_REGION
- TOKENS_TABLE (default: huntaze-oauth-tokens)
- ANALYTICS_TABLE (default: huntaze-analytics-events)
- REDDIT_USER_AGENT (e.g. Huntaze:v1.0.0)
- TikTok: TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET
- Reddit: REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET
- Instagram: INSTAGRAM_CLIENT_ID/SECRET or NEXT_PUBLIC_INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET

Notes
- Instagram Basic Display is used here. For Instagram Graph (Business/Creator), add a separate provider and scopes, and persist Page Access Token and ig_user_id.

