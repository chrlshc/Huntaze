Runbook — Guarded Infra Updates, SSO, and Smoke Tests

Why
- Safe, repeatable prod infra updates with guardrails (no accidental RDS/S3/RestApi/Cognito domain replacement).
- Validate infra changes via CloudFormation ChangeSets before execution.
- Keep pipelines verifiable end‑to‑end, with drift checks and smoke tests.

Pre‑requisites
- AWS CLI v2 installed and configured (SSO preferred).
- Repo secret `AWS_ROLE_TO_ASSUME` configured for GitHub OIDC (for CI workflows).

SSO Login (no static keys)
- Login: `aws sso login --profile huntaze`
- Verify: `aws sts get-caller-identity --profile huntaze`
- Optional export of short‑lived env vars (local only):
  - `aws configure export-credentials --profile huntaze --format env > ./.aws.temp_env.sh`
  - `source ./.aws.temp_env.sh` (adds `AWS_ACCESS_KEY_ID/SECRET/TOKEN` and `AWS_DEFAULT_REGION`)

App Config Update + Redeploy
- Frontend env (rebuild required for `NEXT_PUBLIC_*`):

```bash
# .env.production (frontend)
NEXT_PUBLIC_COGNITO_DOMAIN="https://huntaze-production-317805897534.auth.us-east-1.amazoncognito.com"
```

- Ensure callback/logout URLs on the Cognito App Client match app routes:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-id <CLIENT_ID> \
  --callback-urls '["https://<app-domain>/auth/callback"]' \
  --logout-urls   '["https://<app-domain>/auth/logout"]' \
  --supported-identity-providers '["COGNITO"]' \
  --allowed-o-auth-flows '["code"]' \
  --allowed-o-auth-scopes '["email","openid","profile"]' \
  --allowed-o-auth-flows-user-pool-client
```

- Redeploy frontend/backends via your normal process (if behind CloudFront, invalidate after deploy).

Guarded ChangeSets — One‑Liners
- Validate template: `aws cloudformation validate-template --template-body file://<template>.yaml`
- Create ChangeSet (never auto‑execute in CI):

```bash
aws cloudformation create-change-set \
  --stack-name <stack> \
  --change-set-name $USER-$(date +%Y%m%d-%H%M%S) \
  --template-body file://<template>.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

- List / inspect / execute:

```bash
aws cloudformation list-change-sets --stack-name <stack>
aws cloudformation describe-change-set --stack-name <stack> --change-set-name <cs>
aws cloudformation execute-change-set  --stack-name <stack> --change-set-name <cs>
```

- Rollback options:
  - `aws cloudformation cancel-update-stack --stack-name <stack>` (if update in progress)
  - or re‑apply the last known‑good template via another guarded ChangeSet

CI: Merge Workflows to `main`
- From repo root of `chrlshc/huntaze-new`:

```bash
git fetch origin
git checkout ci/cfn-workflows
gh pr create --base main --head ci/cfn-workflows --fill
# After review
gh pr merge --merge
```

- Verify OIDC secret exists (required by CI workflows):

```bash
gh secret list --repo chrlshc/huntaze-new | grep AWS_ROLE_TO_ASSUME || \
gh secret set AWS_ROLE_TO_ASSUME --repo chrlshc/huntaze-new --body 'arn:aws:iam::<ACCOUNT_ID>:role/<OIDC-Role-Name>'
```

Final Smoke Tests
- Auth (OIDC discovery):

```bash
curl -I https://huntaze-production-317805897534.auth.us-east-1.amazoncognito.com/.well-known/openid-configuration
```

- Manual login URL (open in browser):

```text
https://huntaze-production-317805897534.auth.us-east-1.amazoncognito.com/login
  ?client_id=<CLIENT_ID>
  &response_type=code
  &scope=openid+email+profile
  &redirect_uri=https%3A%2F%2F<app-domain>%2Fauth%2Fcallback
```

- Media:

```bash
aws s3 cp sample.jpg s3://<media-bucket>/uploads/sample.jpg
aws logs tail /aws/lambda/<media-processor-fn> --since 10m
aws dynamodb get-item --table-name <media-table> --key '{"id":{"S":"sample.jpg"}}'
```

- AI queue:

```bash
aws sqs send-message --queue-url https://sqs.<region>.amazonaws.com/<acct>/<ai-queue> \
  --message-body '{"type":"smoke","ts":"'"$(date -u +%FT%TZ)"'"}'
aws sqs get-queue-attributes --queue-url https://sqs.<region>.amazonaws.com/<acct>/<ai-queue> \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible
```

Optional: Deploy Media Hardening

```bash
aws cloudformation create-change-set \
  --stack-name huntaze-media \
  --change-set-name media-hardening-$(date +%Y%m%d-%H%M%S) \
  --template-body file://infrastructure/huntaze-media-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM

aws cloudformation describe-change-set \
  --stack-name huntaze-media \
  --change-set-name media-hardening-...   # inspect first

aws cloudformation execute-change-set \
  --stack-name huntaze-media \
  --change-set-name media-hardening-...
```

Observability + Guardrails
- API Gateway access logs and WAF association (verify):

```bash
aws apigateway get-stage --rest-api-id <api-id> --stage-name <stage> --query 'accessLogSettings'
aws wafv2 list-web-acls --scope REGIONAL
aws wafv2 list-resources-for-web-acl --web-acl-arn <waf-acl-arn> --resource-type API_GATEWAY
```

- Budgets (example):

```bash
aws budgets create-budget --account-id <ACCOUNT_ID> --budget '{
  "BudgetName":"huntaze-monthly",
  "BudgetLimit":{"Amount":"<AMOUNT>","Unit":"USD"},
  "BudgetType":"COST",
  "TimeUnit":"MONTHLY"
}' --notifications-with-subscribers '[
  {"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":50,"ThresholdType":"PERCENTAGE"},
   "Subscribers":[{"SubscriptionType":"EMAIL","Address":"alerts@<domain>"}]}
]'
```

- CloudWatch alarms (examples):

```bash
# Lambda error rate (per-minute > 0 for 5 mins)
aws cloudwatch put-metric-alarm --alarm-name lambda-errors-huntaze \
  --metric-name Errors --namespace AWS/Lambda --statistic Sum --period 60 --threshold 0 \
  --comparison-operator GreaterThanThreshold --evaluation-periods 5 \
  --dimensions Name=FunctionName,Value=<media-processor-fn> \
  --alarm-actions <sns-topic-arn>

# SQS DLQ growth (>0 in 5 mins)
aws cloudwatch put-metric-alarm --alarm-name sqs-dlq-depth-huntaze \
  --metric-name ApproximateNumberOfMessagesVisible --namespace AWS/SQS \
  --statistic Sum --period 300 --threshold 0 --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 --dimensions Name=QueueName,Value=<dlq-name> \
  --alarm-actions <sns-topic-arn>
```

CFN Drift Check (Scheduled)
- Workflow lives at `.github/workflows/cfn-drift.yml` (daily schedule + manual dispatch).

GitHub OIDC Role — Least Privilege (Sketch)
- Trust policy (restrict to repo and branches):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
      "StringLike": {
        "token.actions.githubusercontent.com:sub": [
          "repo:chrlshc/huntaze-new:ref:refs/heads/main",
          "repo:chrlshc/huntaze-new:pull_request"
        ]
      }
    }
  }]
}
```

- Permissions policy (CloudFormation + read‑only to touched services):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect":"Allow","Action":[
      "cloudformation:ValidateTemplate","cloudformation:CreateChangeSet",
      "cloudformation:Describe*","cloudformation:ExecuteChangeSet",
      "cloudformation:UpdateStack","cloudformation:List*"
    ],"Resource":"*"},
    {"Effect":"Allow","Action":[
      "s3:Get*","s3:List*","lambda:Get*","lambda:List*",
      "dynamodb:Describe*","dynamodb:List*",
      "apigateway:GET","apigateway:GET_EXPORT",
      "cognito-idp:Describe*","cognito-idp:List*",
      "iam:Get*","iam:List*","sqs:Get*","sqs:List*",
      "logs:Describe*","logs:Get*","logs:FilterLogEvents","logs:StartQuery","logs:GetQueryResults",
      "wafv2:Get*","wafv2:List*"
    ],"Resource":"*"}
  ]
}
```

Notes
- Prefer SSO over long‑lived IAM keys. Do not paste secrets into PRs or chats.
- Keep ChangeSets manual in CI; block destructive replacements; warn on IAM diffs.

