# Runbook: OF Login Failures

Summary
- Diagnose and resolve OnlyFans login failures in the Fargate Playwright worker.

Pre-conditions
- AWS CLI configured with access to ECS, CloudWatch, S3, and DynamoDB.
- User `userId` known. Access to Secrets Manager `of/creds/<userId>`.

Steps
- Check ECS task outcome: `aws ecs describe-tasks --cluster <cluster> --tasks <taskArn>` → review `stoppedReason` and `exitCode`.
- Review logs: CloudWatch Logs group `/huntaze/of/browser-worker` → latest stream for the task.
- Pull artifacts:
  - `aws s3 cp s3://<bucket>/playwright-traces/<userId>/<ts>/trace.zip ./trace.zip`
  - `npx playwright show-trace ./trace.zip`
  - `aws s3 cp s3://<bucket>/playwright-traces/<userId>/<ts>/page.mp4 ./page.mp4`
- Look for UI branches in the trace:
  - Ensure “Use email” / “Continue” clicked, iframe/dialog re-scope;
  - Email/password input selectors matched or fallback typing triggered.
- If OTP requested: set `OTP_CODE` and re-run; session `requiresAction=true` in DDB indicates OTP or challenge.

Diagnostics
- Metrics: `Huntaze/OFWorker` → `LoginFailures`, `LoginFailureCount`, `LoginSuccessCount`, `ActionDurationMs`.
- DDB session record: `HuntazeOfSessions[userId]` → `linkState`, `errorCode`, `requiresAction`.

Rollback/Workaround
- Reset session: delete `cookiesCipherB64` for user in `HuntazeOfSessions` and re-run login.
- If UI changes break selectors, use fallback typing and broaden selectors (already implemented; verify trace confirms attempts).

