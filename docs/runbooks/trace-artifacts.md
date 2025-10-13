# Runbook: Playwright Trace & Video

Summary
- Retrieve and inspect Playwright artifacts for a worker run.

Pre-conditions
- S3 bucket name (e.g., `huntaze-playwright-artifacts-...`). User `userId` and ISO timestamp.

Steps
- Locate keys: `playwright-traces/<userId>/<ISO8601-Z>/trace.zip|last.png|page.mp4`.
- Download and open trace:
  - `aws s3 cp s3://<bucket>/playwright-traces/<userId>/<ts>/trace.zip ./trace.zip`
  - `npx playwright show-trace ./trace.zip`
- Download and view video:
  - `aws s3 cp s3://<bucket>/playwright-traces/<userId>/<ts>/page.mp4 ./page.mp4`
  - `open ./page.mp4` (macOS) or use any player.

Expected Order
- Worker stops trace, uploads `trace.zip` and `last.png`, then closes page to finalize and upload `page.mp4`.

Notes
- S3 Lifecycle: artifacts expire after 7 days.
- Optional SSE-KMS is supported via `TRACE_KMS_KEY`.

