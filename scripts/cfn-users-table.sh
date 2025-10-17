#!/usr/bin/env bash
set -euo pipefail

STACK=${STACK:-huntaze-users}
CS=${CS:-users-table-v1}
TABLE_NAME=${TABLE_NAME:-huntaze-users}
REGION=${AWS_REGION:-us-east-1}
PROFILE=${AWS_PROFILE:-huntaze}

aws cloudformation create-change-set \
  --stack-name "$STACK" \
  --change-set-name "$CS" \
  --template-body file://infrastructure/users-table.yaml \
  --parameters ParameterKey=UsersTableName,ParameterValue=$TABLE_NAME \
  --region "$REGION" --profile "$PROFILE"

echo "ChangeSet created: $CS (stack: $STACK)"
echo "Review with: aws cloudformation describe-change-set --stack-name $STACK --change-set-name $CS --region $REGION --profile $PROFILE"
echo "Execute with: aws cloudformation execute-change-set --stack-name $STACK --change-set-name $CS --region $REGION --profile $PROFILE"

