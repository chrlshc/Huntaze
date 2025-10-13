#!/usr/bin/env bash
set -euo pipefail

# Allow a CodeBuild service role to assume CDK bootstrap roles and (optionally) update trust.
# Usage:
#   CB_ROLE_NAME="<your-codebuild-role-name>" ACCT=317805897534 REGION=us-east-1 \
#     bash scripts/allow-cdk-assets-assume.sh [--include-deploy-trust]
#
# Requires: aws cli, jq

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found in PATH" >&2; exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found in PATH (brew install jq or equivalent)" >&2; exit 1
fi

CB_ROLE_NAME=${CB_ROLE_NAME:-${CB_ROLE:-}}
ACCT=${ACCT:-}
REGION=${REGION:-us-east-1}
INCLUDE_DEPLOY_TRUST=${INCLUDE_DEPLOY_TRUST:-0}

if [[ -z "${CB_ROLE_NAME}" ]]; then
  echo "CB_ROLE_NAME is required (the CodeBuild service role name)" >&2; exit 2
fi
if [[ -z "${ACCT}" ]]; then
  echo "ACCT not provided; resolving from caller identity ..." >&2
  ACCT=$(aws sts get-caller-identity --query Account --output text)
fi

echo "Using Account=${ACCT} Region=${REGION} CodeBuildRole=${CB_ROLE_NAME}" >&2

CB_ARN=$(aws iam get-role --role-name "${CB_ROLE_NAME}" --query 'Role.Arn' --output text)

# 1) Grant STS:AssumeRole on bootstrap roles to the CodeBuild service role
cat > /tmp/AllowCdkBootstrapAssume.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": [
      "arn:aws:iam::${ACCT}:role/cdk-hnb659fds-lookup-role-${ACCT}-${REGION}",
      "arn:aws:iam::${ACCT}:role/cdk-hnb659fds-file-publishing-role-${ACCT}-${REGION}",
      "arn:aws:iam::${ACCT}:role/cdk-hnb659fds-image-publishing-role-${ACCT}-${REGION}"${INCLUDE_DEPLOY_TRUST:+,
      "arn:aws:iam::${ACCT}:role/cdk-hnb659fds-deploy-role-${ACCT}-${REGION}"}
    ]
  }]
}
JSON

aws iam put-role-policy \
  --role-name "${CB_ROLE_NAME}" \
  --policy-name AllowCdkBootstrapAssume \
  --policy-document file:///tmp/AllowCdkBootstrapAssume.json

echo "Attached inline policy AllowCdkBootstrapAssume to ${CB_ROLE_NAME}" >&2

# 2) Ensure bootstrap roles trust the CodeBuild role (only if trust was hardened)
roles=(
  "cdk-hnb659fds-lookup-role-${ACCT}-${REGION}"
  "cdk-hnb659fds-file-publishing-role-${ACCT}-${REGION}"
  "cdk-hnb659fds-image-publishing-role-${ACCT}-${REGION}"
)
if [[ "${INCLUDE_DEPLOY_TRUST}" == "1" ]]; then
  roles+=("cdk-hnb659fds-deploy-role-${ACCT}-${REGION}")
fi

for R in "${roles[@]}"; do
  echo "Patching trust for role: ${R}" >&2
  aws iam get-role --role-name "${R}" --query 'Role.AssumeRolePolicyDocument' \
    --output json > /tmp/trust.json

  jq --arg arn "${CB_ARN}" '
    .Statement |= map(
      if (.Effect=="Allow") and (
          ( ( .Action | type=="array" ) and ( .Action | index("sts:AssumeRole") != null ) ) or
          ( .Action == "sts:AssumeRole" )
        ) then
        .Principal |= (
          if has("AWS") then
            .AWS |= (if type=="array" then (. + [$arn] | unique) else [., $arn] | unique end)
          else
            . + {AWS: [$arn]}
          end)
      else . end)
  ' /tmp/trust.json > /tmp/trust_patched.json

  aws iam update-assume-role-policy --role-name "${R}" \
    --policy-document file:///tmp/trust_patched.json
done

# 3) Sanity: attempt to assume the file publishing role
aws sts assume-role \
  --role-arn "arn:aws:iam::${ACCT}:role/cdk-hnb659fds-file-publishing-role-${ACCT}-${REGION}" \
  --role-session-name cdk-publish-smoke >/dev/null && echo "Assume OK: file-publishing role"

echo "Done. Your CodeBuild role should now be able to publish CDK assets." >&2

