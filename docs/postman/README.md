Huntaze Postman Packs

Import order
- Import environment: `huntaze_env.postman_environment.json`.
- Import collections:
  - `huntaze_tiktok.postman_collection.json`
  - `huntaze_instagram_graph.postman_collection.json`
  - `huntaze_reddit.postman_collection.json`

Environment variables
- TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `NEXT_PUBLIC_TIKTOK_REDIRECT_URI`, optional PKCE `TIKTOK_CODE_CHALLENGE/VERIFIER`.
- Instagram Graph: `IG_APP_ID`, `IG_APP_SECRET`, `IG_GRAPH_VERSION` (default v20.0), tokens and IDs.
- Reddit: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`, `NEXT_PUBLIC_REDDIT_REDIRECT_URI`.

Throttling guidance
- TikTok user/info: ≤ 600 rpm/window; prefer 300–400 rpm.
- Reddit: honor `X-Ratelimit-*` headers; strict `User-Agent`.
- Instagram Graph: watch `X-App-Usage`.

