#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:=us-east-1}"
: "${AWS_PROFILE:=huntaze}"

STACK=${STACK:-stripe-events-handler}
CS=${CS:-se-handler-v1}
USERS_TABLE=${USERS_TABLE:-huntaze-users}
FUNCTION_NAME=${FUNCTION_NAME:-stripe-events-handler}

aws cloudformation create-change-set \
  --stack-name "$STACK" \
  --change-set-name "$CS" \
  --template-body file://infrastructure/stripe-events-handler.yaml \
  --parameters ParameterKey=UsersTableName,ParameterValue="$USERS_TABLE" \
               ParameterKey=FunctionName,ParameterValue="$FUNCTION_NAME" \
  --region "$AWS_REGION" --profile "$AWS_PROFILE"

echo "ChangeSet created: $CS (stack: $STACK)"
echo "Review with: aws cloudformation describe-change-set --stack-name $STACK --change-set-name $CS --region $AWS_REGION --profile $AWS_PROFILE"
echo "Execute with: aws cloudformation execute-change-set --stack-name $STACK --change-set-name $CS --region $AWS_REGION --profile $AWS_PROFILE"

