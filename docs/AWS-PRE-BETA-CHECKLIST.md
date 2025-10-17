# AWS Pre-Beta Checklist – Huntaze

This document centralises the tasks and evidence required to satisfy the backend pre-beta requirements.

## 1. API Gateway
- Deploy `infrastructure/api-gateway-usage-plan.yaml` to create the usage plan, API key and JWT authorizer.
- Run `scripts/configure-apigateway-stage-throttle.sh <rest-api-id> <stage> 1000 200` to enforce the global throttle (1000 rpm / burst 200).
- Attach the authorizer to protected routes via API Gateway console or additional IaC.

## 2. Lambda Functions
- Ensure every runtime that handles fan routing (e.g. `smart-route`) has:
  - `Timeout` ≤ 30 seconds.
  - Env vars sourced from SSM (`Parameter` references) defined in the stack.
  - `ReservedConcurrentExecutions`, DLQ and `TracingConfig` configured.
- Update the relevant CloudFormation stack if these settings were created manually.

## 3. CloudWatch & Budgets
- Execute `infrastructure/cloudwatch-alarms.sh` with env vars:
  ```bash
  API_GATEWAY_ID=abc123 API_GATEWAY_STAGE=prod \
  USERS_TABLE_NAME=huntaze-users DAILY_COST_BUDGET=50 \
  ./infrastructure/cloudwatch-alarms.sh
  ```
- Confirm SNS subscription and alarms for API 5XX, latency >2s, DynamoDB throttles and cost budget.

## 4. Security Controls
- Document MFA on root/admin accounts, CloudTrail enablement, WAF/VPC segmentation and least-privilege IAM roles (manual validation).
- Store Azure OpenAI / Stripe keys in AWS Secrets Manager and reference them in Lambda via env variables.

## 5. Validation Tests
Run `scripts/run-aws-prebeta-checks.sh` with appropriate variables:
```bash
API_URL=https://api.huntaze.com \
API_KEY=<usage-plan-key> \
LAMBDA_NAME=smart-route \
USERS_TABLE=huntaze-users \
PROFILE=huntaze \
./scripts/run-aws-prebeta-checks.sh
```
Archive the generated logs for the GO/NO-GO meeting.

## 6. Business Metrics
- Extend application code to publish metrics such as `Huntaze/Revenue/MRR` and `Huntaze/Users/NewSignups`.
- Add alarms via `cloudwatch-alarms.sh` or the console when metrics are present.

Following these steps ensures the checklist “critique” items are covered and auditable before the beta launch.
