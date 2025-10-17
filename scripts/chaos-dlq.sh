#!/usr/bin/env bash
set -euo pipefail

# Chaos test — injecte un message invalide pour vérifier la redirection en DLQ.
# Prérequis: CDK déployé, DLQ configurée sur JobsQueue, Lambda dispatcher avec partial-batch failures.

REGION=${REGION:-us-east-1}
STACK=${STACK:-HuntazeByoIpStack}

JOBS_Q_NAME=$(aws cloudformation list-stack-resources --region "$REGION" --stack-name "$STACK" \
  --query "StackResourceSummaries[?LogicalResourceId=='JobsQueue'].PhysicalResourceId" --output text)
DLQ_Q_NAME=$(aws cloudformation list-stack-resources --region "$REGION" --stack-name "$STACK" \
  --query "StackResourceSummaries[?LogicalResourceId=='JobsDLQ'].PhysicalResourceId" --output text)

JOBS_Q_URL=$(aws sqs get-queue-url --region "$REGION" --queue-name "$JOBS_Q_NAME" --query QueueUrl --output text)
DLQ_Q_URL=$(aws sqs get-queue-url --region "$REGION" --queue-name "$DLQ_Q_NAME" --query QueueUrl --output text)

echo "JobsQueue: $JOBS_Q_URL"
echo "JobsDLQ:  $DLQ_Q_URL"

echo "Purge DLQ (optional warm start)…"
aws sqs purge-queue --region "$REGION" --queue-url "$DLQ_Q_URL" || true

echo "Inject invalid message (not JSON)…"
aws sqs send-message --region "$REGION" --queue-url "$JOBS_Q_URL" --message-body "INVALID_JSON_PAYLOAD" >/dev/null

echo "Watching DLQ visible messages for up to 10 minutes…"
for i in $(seq 1 60); do
  V=$(aws sqs get-queue-attributes --region "$REGION" --queue-url "$DLQ_Q_URL" \
    --attribute-names ApproximateNumberOfMessages --query 'Attributes.ApproximateNumberOfMessages' --output text)
  echo "[$(printf %02d $i)m] DLQ visible=$V"
  [[ "$V" != "0" && "$V" != "None" ]] && break
  sleep 10
done

echo "DLQ sample (if any):"
aws sqs receive-message --region "$REGION" --queue-url "$DLQ_Q_URL" --max-number-of-messages 1 --visibility-timeout 0 --wait-time-seconds 1 || true

echo "Done."

