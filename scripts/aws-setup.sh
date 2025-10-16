#!/usr/bin/env bash
set -euo pipefail

# AWS resources setup for AutoGen V1
# - Enable TTL on DynamoDB tables (expires_at)
# - Create GSI status-index on ai_sessions (PK=status, SK=created_at)
# - Configure SQS FIFO DLQ + visibility timeout
#
# Requirements:
# - AWS CLI v2 installed
# - Credentials via SSO/role (AWS_PROFILE + AWS_SDK_LOAD_CONFIG=1) or env

REGION=${AWS_REGION:-us-east-1}
SESSIONS_TABLE=${DDB_TABLE_SESSIONS:-ai_sessions}
MSGS_TABLE=${DDB_TABLE_MESSAGES:-ai_session_messages}
ART_TABLE=${DDB_TABLE_ARTIFACTS:-ai_session_artifacts}

QUEUE_URL=${OF_SQS_URL:-}
DLQ_URL=${OF_DLQ_URL:-}
VISIBILITY_TIMEOUT=${OF_SQS_VISIBILITY_TIMEOUT:-900}

echo "Region: ${REGION}"

enable_ttl() {
  local table=$1
  echo "[DDB] Enabling TTL on ${table} (expires_at)"
  aws dynamodb update-time-to-live \
    --region "${REGION}" \
    --table-name "${table}" \
    --time-to-live-specification Enabled=true,AttributeName=expires_at >/dev/null || true
}

has_gsi() {
  local table=$1 index=$2
  # Return length if table exists; return "None" if table missing to avoid set -e aborts
  aws dynamodb describe-table --region "${REGION}" --table-name "${table}" \
    --query "Table.GlobalSecondaryIndexes[?IndexName=='${index}'] | length(@)" --output text 2>/dev/null || echo "None"
}

billing_mode() {
  local table=$1
  aws dynamodb describe-table --region "${REGION}" --table-name "${table}" \
    --query "Table.BillingModeSummary.BillingMode" --output text 2>/dev/null || echo "PROVISIONED"
}

create_status_gsi() {
  local table=$1
  echo "[DDB] Creating GSI status-index on ${table} (if missing)"
  local exists=$(has_gsi "${table}" "status-index")
  if [ "${exists}" != "0" ] && [ "${exists}" != "None" ]; then
    echo "[DDB] GSI already exists"
    return 0
  fi
  local bm=$(billing_mode "${table}")
  if [ "${bm}" = "PAY_PER_REQUEST" ]; then
    aws dynamodb update-table --region "${REGION}" --table-name "${table}" \
      --attribute-definitions AttributeName=status,AttributeType=S AttributeName=created_at,AttributeType=N \
      --global-secondary-index-updates '[{"Create":{"IndexName":"status-index","KeySchema":[{"AttributeName":"status","KeyType":"HASH"},{"AttributeName":"created_at","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}}]' >/dev/null
  else
    aws dynamodb update-table --region "${REGION}" --table-name "${table}" \
      --attribute-definitions AttributeName=status,AttributeType=S AttributeName=created_at,AttributeType=N \
      --global-secondary-index-updates '[{"Create":{"IndexName":"status-index","KeySchema":[{"AttributeName":"status","KeyType":"HASH"},{"AttributeName":"created_at","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}}}]' >/dev/null
  fi
  echo "[DDB] GSI creation initiated (asynchronous)."
}

configure_sqs() {
  if [ -z "${QUEUE_URL}" ]; then
    echo "[SQS] OF_SQS_URL not set, skipping queue configuration"
    return 0
  fi
  echo "[SQS] Configuring queue ${QUEUE_URL}"
  local is_fifo=0
  if [[ "${QUEUE_URL}" == *.fifo ]]; then is_fifo=1; fi

  # Create DLQ if needed
  if [ -z "${DLQ_URL}" ]; then
    local dlq_name
    if [ ${is_fifo} -eq 1 ]; then dlq_name="autogen-send-dlq.fifo"; else dlq_name="autogen-send-dlq"; fi
    echo "[SQS] Creating DLQ ${dlq_name} (if missing)"
    local attrs=( )
    if [ ${is_fifo} -eq 1 ]; then attrs+=(--attributes FifoQueue=true) ; fi
    DLQ_URL=$(aws sqs create-queue --region "${REGION}" --queue-name "${dlq_name}" "${attrs[@]}" --query QueueUrl --output text 2>/dev/null || true)
    if [ -z "${DLQ_URL}" ]; then
      # If exists, fetch URL
      DLQ_URL=$(aws sqs get-queue-url --region "${REGION}" --queue-name "${dlq_name}" --query QueueUrl --output text)
    fi
  fi

  # DLQ ARN
  local dlq_arn
  dlq_arn=$(aws sqs get-queue-attributes --region "${REGION}" --queue-url "${DLQ_URL}" --attribute-names QueueArn --query Attributes.QueueArn --output text)

  # Redrive policy
  local redrive
  redrive=$(jq -cn --arg arn "${dlq_arn}" '{deadLetterTargetArn:$arn,maxReceiveCount:5}')
  echo "[SQS] Setting RedrivePolicy and VisibilityTimeout=${VISIBILITY_TIMEOUT}"
  # Pass attributes with proper quoting for JSON value
  aws sqs set-queue-attributes --region "${REGION}" --queue-url "${QUEUE_URL}" \
    --attributes RedrivePolicy="${redrive}",VisibilityTimeout="${VISIBILITY_TIMEOUT}" >/dev/null
}

main() {
  command -v aws >/dev/null || { echo "AWS CLI not found"; exit 1; }
  command -v jq >/dev/null || { echo "jq not found (required for RedrivePolicy JSON)"; exit 1; }

  enable_ttl "${SESSIONS_TABLE}"
  enable_ttl "${MSGS_TABLE}"
  enable_ttl "${ART_TABLE}"
  create_status_gsi "${SESSIONS_TABLE}"
  configure_sqs
  echo "Done. Note: GSI creation and TTL enablement are asynchronous."
}

main "$@"
