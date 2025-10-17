#!/usr/bin/env bash
set -euo pipefail

REGION=${REGION:-us-east-1}
ENV=${ENV:-production}
COST_CENTER=${COST_CENTER:-HUNTAZE}
CC=${COST_CENTER}
OWNER=${OWNER:-Platform}
OPS_ALERT_EMAIL=${OPS_ALERT_EMAIL:-ops@exemple.com}
OPS_EMAIL=${OPS_ALERT_EMAIL}
SUFFIX=$(date +'%Y%m%d-%H%M%S')

urlencode() { python3 - <<'PY' "$1"; exit
import urllib.parse, sys
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
}

create_cs () {
  local stack="$1"; shift
  local template="$1"; shift
  local name="${stack}-${SUFFIX}"

  CS_ARN=$(aws cloudformation create-change-set \
    --region "$REGION" \
    --stack-name "$stack" \
    --change-set-name "$name" \
    --change-set-type UPDATE \
    --template-body "file://${template}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameters "$@" \
    --query 'Id' --output text)

  aws cloudformation wait change-set-create-complete --region "$REGION" --change-set-name "$CS_ARN" || true

  DESC=$(aws cloudformation describe-change-set --region "$REGION" --change-set-name "$CS_ARN")
  STACK_ID=$(echo "$DESC" | jq -r '.StackId')
  CS_ID=$(echo "$DESC" | jq -r '.ChangeSetId')
  python3 - <<PY
import urllib.parse, sys
stack = urllib.parse.quote("${STACK_ID}", safe="")
cs    = urllib.parse.quote("${CS_ID}",   safe="")
print(f"https://console.aws.amazon.com/cloudformation/home?region=${REGION}#/stacks/changesets/changes?stackId={stack}&changeSetId={cs}")
PY
}

# core
create_cs huntaze-core-prod infrastructure/core-infrastructure.yaml \
  ParameterKey=Environment,ParameterValue=$ENV \
  ParameterKey=CostCenter,ParameterValue=$CC \
  ParameterKey=Owner,ParameterValue=$OWNER \
  ParameterKey=OpsAlertEmail,ParameterValue=$OPS_EMAIL

# récupérer ARN ops exporté
OPS_ARN=$(aws cloudformation list-exports --region "$REGION" \
  --query "Exports[?Name=='huntaze-core-prod-OpsAlertsTopicArn'].Value" --output text)
echo "OPS_ARN=${OPS_ARN}" >&2

# media
create_cs huntaze-media-prod infrastructure/huntaze-media-stack.yaml \
  ParameterKey=Environment,ParameterValue=$ENV \
  ParameterKey=CostCenter,ParameterValue=$CC \
  ParameterKey=Owner,ParameterValue=$OWNER \
  ParameterKey=OpsAlertsTopicArn,ParameterValue=$OPS_ARN

# ai (simple)
create_cs huntaze-ai-simple-prod infrastructure/ai-services-simple.yaml \
  ParameterKey=Environment,ParameterValue=$ENV \
  ParameterKey=CostCenter,ParameterValue=$CC \
  ParameterKey=Owner,ParameterValue=$OWNER

echo "Done. Open the URLs above to review/execute the ChangeSets." >&2

