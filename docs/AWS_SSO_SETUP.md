# AWS SSO Setup (Huntaze)

This app uses the AWS SDK default credential chain. For secure, keyless auth in engineering and admin workflows, configure AWS IAM Identity Center (SSO) and run with an SSO profile — never commit static keys.

- SSO start URL: https://d-906627e8bc.awsapps.com/start/#
- SSO region: us-east-1

## Configure an SSO profile (CLI)

1) Install the AWS CLI v2.
2) Run: `aws configure sso` and provide:
   - SSO start URL: `https://d-906627e8bc.awsapps.com/start/#`
   - SSO region: `us-east-1`
   - Select account + role, choose a profile name (e.g., `huntaze-sso`).

This creates entries in `~/.aws/config` that the SDKs can use.

## Run with SSO (server/runtime)

- Ensure the process environment includes:
  - `AWS_PROFILE=huntaze-sso`
  - `AWS_SDK_LOAD_CONFIG=1`
  - `AWS_REGION=us-east-1` (or your workload region)

The Node AWS SDK v3 (Next.js API routes) and Boto3 (FastAPI) will automatically load SSO credentials via the default chain when `AWS_SDK_LOAD_CONFIG=1` is set and the profile is active.

## Production

- Prefer task/instance roles (ECS/EKS/Lambda) for production — no profiles or keys needed in containers.
- For CI/CD, use OIDC to assume a deployment role (no long‑lived secrets).

## Important

- Do NOT export static access keys in code or repo. Rotate any exposed keys immediately in IAM.
- Keep SSO scoped (least privilege) and expire sessions per your security policy.
