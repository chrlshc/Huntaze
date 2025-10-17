#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:=us-east-1}"
: "${AWS_PROFILE:=huntaze}"

STACK=${STACK:-stripe-eventbridge}
CS=${CS:-stripe-eb-v1}

if [[ -z "${PARTNER_BUS:-}" ]]; then
  echo "ERROR: Set PARTNER_BUS to your partner bus name (aws.partner/stripe.com/...)" >&2
  exit 1
fi

if [[ -z "${LAMBDA_ARN:-}" ]]; then
  echo "ERROR: Set LAMBDA_ARN to your handler Lambda ARN" >&2
  exit 1
fi

CREATE_BUS=${CREATE_BUS:-false}
RULE_NAME=${RULE_NAME:-stripe-billing-v1}
DLQ_NAME=${DLQ_NAME:-stripe-events-dlq}
USERS_TABLE=${USERS_TABLE:-huntaze-users}

aws cloudformation create-change-set \
  --stack-name "$STACK" \
  --change-set-name "$CS" \
  --template-body file://infrastructure/stripe-eventbridge.yaml \
  --parameters \
    ParameterKey=PartnerBusName,ParameterValue="$PARTNER_BUS" \
    ParameterKey=PartnerEventSourceName,ParameterValue="$PARTNER_BUS" \
    ParameterKey=CreateBus,ParameterValue=$( $CREATE_BUS && echo true || echo false ) \
    ParameterKey=RuleName,ParameterValue="$RULE_NAME" \
    ParameterKey=LambdaArn,ParameterValue="$LAMBDA_ARN" \
    ParameterKey=DLQName,ParameterValue="$DLQ_NAME" \
    ParameterKey=UsersTableName,ParameterValue="$USERS_TABLE" \
  --region "$AWS_REGION" --profile "$AWS_PROFILE"

echo "ChangeSet created: $CS (stack: $STACK)"
echo "Review with: aws cloudformation describe-change-set --stack-name $STACK --change-set-name $CS --region $AWS_REGION --profile $AWS_PROFILE"
echo "Execute with: aws cloudformation execute-change-set --stack-name $STACK --change-set-name $CS --region $AWS_REGION --profile $AWS_PROFILE"

