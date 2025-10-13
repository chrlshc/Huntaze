# Runbook: ECS Task Stopped / White Run

Summary
- Distinguish a normal run with no browser activity vs. an early container exit.

Pre-conditions
- ECS Cluster and TaskDefinition ARNs.
- CloudWatch Logs access; S3 artifact bucket.

Steps
- Describe the task:
  - `aws ecs describe-tasks --cluster <cluster> --tasks <taskArn>`
  - Inspect: `lastStatus`, `stoppedReason`, `containers[].exitCode`.
- If `exitCode=1` or `stoppedReason` indicates failure:
  - Fetch logs from `/huntaze/of/browser-worker`.
  - Download artifacts (trace.zip, last.png, page.mp4) for the corresponding timestamp.
- If logs show network errors:
  - Confirm subnets are private and `assignPublicIp=DISABLED`.
  - Validate NAT route tables; confirm outbound egress.
- If credentials missing:
  - Verify Secrets Manager `of/creds/<userId>` exists; ensure task role can `secretsmanager:GetSecretValue`.
- If DDB/KMS errors:
  - Confirm task role has DDB RW and KMS Encrypt/Decrypt for the configured key.

Notes
- Worker emits `SessionDurationMs`, `MemoryUsageMB` at the end of each run; absence suggests hard crash.

