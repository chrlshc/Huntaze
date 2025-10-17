#!/usr/bin/env bash
set -euo pipefail

# Finisher “prod” — valide SQS→Lambda→Dynamo (+ S3/metrics)
# Prérequis: AWS CLI authentifié, stack déployée, queue active.

REGION=${REGION:-us-east-1}
STACK=${STACK:-HuntazeByoIpStack}
AGENT_ID=${AGENT_ID:-DEV-AGENT-123}
CREATOR_ID=${CREATOR_ID:-creator-xyz}

# URL de la queue: par défaut la valeur connue du README. Peut être surchargée via env JOBS_Q_URL.
JOBS_Q_URL=${JOBS_Q_URL:-"https://sqs.us-east-1.amazonaws.com/317805897534/HuntazeByoIpStack-JobsQueue86ED6666-Sb4vDLBEiszi"}

AGENTS_TBL=$(aws cloudformation list-stack-resources --region "$REGION" --stack-name "$STACK" \
  --query "StackResourceSummaries[?ResourceType=='AWS::DynamoDB::Table' && contains(LogicalResourceId, 'AgentsTable')].PhysicalResourceId | [0]" --output text)
JOBS_TBL=$(aws cloudformation list-stack-resources --region "$REGION" --stack-name "$STACK" \
  --query "StackResourceSummaries[?ResourceType=='AWS::DynamoDB::Table' && contains(LogicalResourceId, 'JobsTable')].PhysicalResourceId | [0]" --output text)
LOGS_BUCKET=$(aws cloudformation list-stack-resources --region "$REGION" --stack-name "$STACK" --query "StackResourceSummaries[?LogicalResourceId=='AgentLogsBucket'].PhysicalResourceId" --output text)

JOB_ID="job-notifs-$(date +%s)"
BODY=$(jq -nc --arg jobId "$JOB_ID" --arg agentId "$AGENT_ID" --arg creatorId "$CREATOR_ID" '{"jobId":$jobId,"agentId":$agentId,"creatorId":$creatorId,"type":"check_notifications","payload":{"since_id":""}}')
aws sqs send-message --region "$REGION" --queue-url "$JOBS_Q_URL" --message-body "$BODY" >/dev/null
echo "sent $JOB_ID"

# watch 120s (1s/tick)
for i in $(seq 1 120); do
  STATUS=$(aws dynamodb get-item --region "$REGION" --table-name "$JOBS_TBL" \
    --key "{\"jobId\":{\"S\":\"$JOB_ID\"}}" --query "Item.status.S" --output text 2>/dev/null || echo "N/A")
  echo "[$(printf %03d $i)s] status=$STATUS"
  [[ "$STATUS" == "succeeded" || "$STATUS" == "failed" || "$STATUS" == "assigned" ]] && break
  sleep 1
done

echo "— job record —"
aws dynamodb get-item --region "$REGION" --table-name "$JOBS_TBL" \
  --key "{\"jobId\":{\"S\":\"$JOB_ID\"}}" \
  --query "Item.{status:status.S,assignedTo:assignedTo.S,attempts:attempts.N,lease:leaseExpiresAt.N,error:error.M}" --output json || true

echo "— latest S3 notify —"
aws s3 ls "s3://${LOGS_BUCKET}/notifications/" --recursive --region "$REGION" | tail -n 5 || true

echo "— NotificationsIngested (last 10m) —"
START=$(date -u -d '10 minutes ago' +%FT%TZ 2>/dev/null || date -u -v-10M +%FT%TZ)
END=$(date -u +%FT%TZ)
aws cloudwatch get-metric-statistics --region "$REGION" \
  --namespace "Huntaze/ByoIP" --metric-name NotificationsIngested \
  --start-time "$START" --end-time "$END" --period 60 --statistics Sum || true

echo "— agent state —"
aws dynamodb get-item --region "$REGION" --table-name "$AGENTS_TBL" \
  --key "{\"agentId\":{\"S\":\"$AGENT_ID\"}}" \
  --query "Item.{status:status.S,lastHbAt:lastHbAt.N,version:version.S}" --output json || true

echo "Done."
