#!/usr/bin/env bash
set -euo pipefail

# Setup SSM parameters needed by the CodeBuild load-test stage, and optionally deploy the CI stack.

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
STACK_NAME="${HUNTAZE_OF_STACK:-HuntazeOfStack}"
USER_IDS_VALUE="${USER_IDS:-user1,user2}"
DO_DEPLOY_CI="${DEPLOY_CI:-0}"

echo "[info] Using region: ${REGION}"
echo "[info] Reading CloudFormation outputs from stack: ${STACK_NAME}"

CFN_OUT=$(aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' --output json)

if [[ -z "$CFN_OUT" || "$CFN_OUT" == "null" ]]; then
  echo "[error] Could not read CloudFormation outputs for stack '$STACK_NAME'. Ensure it exists and AWS credentials are configured."
  exit 1
fi

get_output() {
  local key="$1"
  echo "$CFN_OUT" | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf-8')); const o=a.find(x=>x.OutputKey==='${key}'); console.log(o?o.OutputValue:'');"
}

CLUSTER_ARN=$(get_output ClusterArn)
TASK_DEF_ARN=$(get_output TaskDefArn)
SECURITY_GROUP=$(get_output TaskSecurityGroup)
SUBNETS=$(get_output SubnetsPrivate)

if [[ -z "$CLUSTER_ARN" || -z "$TASK_DEF_ARN" || -z "$SECURITY_GROUP" || -z "$SUBNETS" ]]; then
  echo "[error] Missing one or more required outputs: ClusterArn, TaskDefArn, TaskSecurityGroup, SubnetsPrivate"
  exit 1
fi

echo "[info] ClusterArn       = $CLUSTER_ARN"
echo "[info] TaskDefArn       = $TASK_DEF_ARN"
echo "[info] SecurityGroup    = $SECURITY_GROUP"
echo "[info] SubnetsPrivate   = $SUBNETS"
echo "[info] UserIds          = $USER_IDS_VALUE"

put_param() {
  local name="$1"; shift
  local value="$1"; shift
  aws ssm put-parameter --region "$REGION" --name "$name" --type String --value "$value" --overwrite >/dev/null
  echo "[ok] set $name"
}

put_param "/huntaze/of/clusterArn" "$CLUSTER_ARN"
put_param "/huntaze/of/taskDefArn" "$TASK_DEF_ARN"
put_param "/huntaze/of/securityGroup" "$SECURITY_GROUP"
put_param "/huntaze/of/subnets" "$SUBNETS"
put_param "/huntaze/of/userIds" "$USER_IDS_VALUE"

if [[ "$DO_DEPLOY_CI" == "1" ]]; then
  echo "[info] Deploying CI stack (HuntazeOfCiStack)"
  pushd infra/cdk >/dev/null
  npm ci
  npx cdk bootstrap "aws://$(aws sts get-caller-identity --query Account --output text)/$REGION" || true
  npx cdk deploy HuntazeOfCiStack --require-approval never
  popd >/dev/null
fi

echo "[done] SSM parameters configured."

