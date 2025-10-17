PR Checklist — CloudFormation Workflows (ChangeSets + Guardrails)

Summary
- Merge CI workflows for guarded ChangeSets and executions. Validate changes for auth, media, and AI; maintain drift checks and smoke tests.

Pre‑flight
- [ ] Branch is `ci/cfn-workflows` → targeting `main`
- [ ] Repo secret `AWS_ROLE_TO_ASSUME` exists and points to OIDC role
- [ ] CFN templates validate: `aws cloudformation validate-template --template-body file://<template>.yaml`
- [ ] SSO logged in locally (no static keys): `aws sso login --profile huntaze`

Guardrails
- [ ] Workflows do NOT auto‑execute ChangeSets in CI
- [ ] Replacement protections enabled (RDS/S3/RestApi/Cognito Domain)
- [ ] IAM diff warnings surfaced in logs

ChangeSets — Proven Flow
- [ ] Created change sets for: `huntaze-media`, `huntaze-ai`, `huntaze-auth`
- [ ] Reviewed `describe-change-set` output (no unintended replacements)
- [ ] Executed change sets after review; stacks `UPDATE_COMPLETE`

Cognito Domain
- [ ] New Hosted UI domain confirmed: `https://huntaze-production-317805897534.auth.us-east-1.amazoncognito.com`
- [ ] App client callback/logout URLs match app routes

App Config + Redeploy
- [ ] `.env.production` contains:

  ```bash
  NEXT_PUBLIC_COGNITO_DOMAIN="https://huntaze-production-317805897534.auth.us-east-1.amazoncognito.com"
  ```

- [ ] Frontend rebuilt and deployed (CloudFront invalidated if applicable)
- [ ] Backends deployed as needed

Final Smoke Tests
- Auth
  - [ ] OIDC discovery 200:

    ```bash
    curl -I https://huntaze-production-317805897534.auth.us-east-1.amazoncognito.com/.well-known/openid-configuration
    ```

  - [ ] Code flow success (login → callback → session → logout)

- Media
  - [ ] Upload test image to S3 and confirm Lambda logs / DynamoDB writes

- AI
  - [ ] Send SQS test message and confirm processing or expected persistence

Observability
- [ ] API Gateway access logs enabled and WAF associated (if used)
- [ ] Budgets/alarms in place (spend, SQS DLQ growth, Lambda error rate)
- [ ] Drift workflow `.github/workflows/cfn-drift.yml` present and scheduled

Operational One‑Liners (for reference)

```bash
# Create guarded ChangeSet
aws cloudformation create-change-set \
  --stack-name <stack> \
  --change-set-name $USER-$(date +%Y%m%d-%H%M%S) \
  --template-body file://<template>.yaml \
  --capabilities CAPABILITY_NAMED_IAM

# Inspect / Execute
aws cloudformation describe-change-set --stack-name <stack> --change-set-name <cs>
aws cloudformation execute-change-set  --stack-name <stack> --change-set-name <cs>

# Rollback option
aws cloudformation cancel-update-stack --stack-name <stack>
```

Notes
- Keep secrets out of PRs; prefer SSO and OIDC.
- Never auto‑execute ChangeSets from CI; require human review.

