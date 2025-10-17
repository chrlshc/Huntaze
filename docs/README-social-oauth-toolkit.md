Social OAuth Toolkit

What’s included
- Postman collection and environment (TikTok, Instagram Graph, Reddit) covering authorize → token/refresh → snapshot flows.
- Refresh Lambda (TypeScript) for scheduled token rotation: `lambda/refresh-oauth-tokens/index.ts`.

TikTok user/info
- Uses GET with `fields` query as per v2: `open_id,union_id,display_name,avatar_url,profile_deep_link,follower_count,likes_count,video_count`.
- Code updated in `app/api/auth/tiktok/callback/route.ts`.

DynamoDB token storage
- Table: `huntaze-oauth-tokens` (PK `userId`, SK `platform`).
- Attributes persisted: `accessToken`, `refreshToken`, `expiresAt` (epoch ms), `expiresAtIso` (ISO), `scope` (comma), `scopes` (list), optional `providerUserId`, optional `extra` (JSON string).
- GSI `byExpiry` (PK `platform`, SK `expiresAt`) used for scheduled refresh scans.

Scheduled refresh
- Lambda handler: `lambda/refresh-oauth-tokens/index.ts`.
- Defaults:
  - Reddit: refresh when < 20 minutes remain.
  - TikTok: refresh when < 12 hours remain.
  - Instagram: refresh when < 7 days remain.
- Environment variables:
  - `TOKENS_TABLE=huntaze-oauth-tokens`
  - `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
  - `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`
  - `IG_APP_ID`, `IG_APP_SECRET`, `IG_GRAPH_VERSION=v20.0`

EventBridge schedules (suggested)
- `rate(15 minutes)` → providers: ["tiktok","reddit"].
- `cron(0 9 */3 * ? *)` → providers: ["instagram"].

Deployment notes
- You can deploy with AWS CDK (new stack) or create the Lambda + two EventBridge rules via console/IaC. Grant the Lambda least-privilege read/write access to `huntaze-oauth-tokens` and to the `byExpiry` GSI.
- If `byExpiry` GSI is not present, the Lambda falls back to a limited table scan.

Postman
- Import the collection and environment JSONs and set client credentials and redirect URIs. Use the authorize → token exchange → snapshot sequence for each provider.

