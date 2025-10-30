#!/bin/bash

# ============================================================================
# Test Rate Limiter Lambda
# ============================================================================
# Sends test messages to SQS and monitors rate limiting behavior
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="us-east-1"
QUEUE_NAME="huntaze-rate-limiter-queue"
MESSAGE_COUNT=${1:-30}  # Default 30 messages

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Testing Rate Limiter${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# ============================================================================
# 1. Get Queue URL
# ============================================================================

echo -e "${YELLOW}1. Getting queue URL...${NC}"

QUEUE_URL=$(aws sqs get-queue-url \
    --queue-name "$QUEUE_NAME" \
    --region "$AWS_REGION" \
    --query 'QueueUrl' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$QUEUE_URL" = "NOT_FOUND" ]; then
    echo -e "${RED}Error: Queue $QUEUE_NAME not found${NC}"
    exit 1
fi

echo -e "${BLUE}  Queue URL: $QUEUE_URL${NC}"
check_success "Queue found"
echo ""

# ============================================================================
# 2. Send Test Messages
# ============================================================================

echo -e "${YELLOW}2. Sending $MESSAGE_COUNT test messages...${NC}"

START_TIME=$(date +%s)

for i in $(seq 1 $MESSAGE_COUNT); do
    MESSAGE_BODY=$(cat <<EOF
{
  "messageId": "test-$i",
  "userId": "test-user",
  "content": "Test message $i",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
    
    aws sqs send-message \
        --queue-url "$QUEUE_URL" \
        --message-body "$MESSAGE_BODY" \
        --region "$AWS_REGION" > /dev/null
    
    if [ $((i % 10)) -eq 0 ]; then
        echo -e "${BLUE}  Sent $i messages...${NC}"
    fi
done

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

check_success "Sent $MESSAGE_COUNT messages in ${ELAPSED}s"
echo ""

# ============================================================================
# 3. Monitor Queue Metrics
# ============================================================================

echo -e "${YELLOW}3. Monitoring queue metrics...${NC}"
echo -e "${BLUE}  Waiting 10 seconds for processing to start...${NC}"
sleep 10

for i in {1..12}; do
    METRICS=$(aws sqs get-queue-attributes \
        --queue-url "$QUEUE_URL" \
        --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
        --region "$AWS_REGION" \
        --query 'Attributes' \
        --output json)
    
    VISIBLE=$(echo "$METRICS" | jq -r '.ApproximateNumberOfMessages')
    IN_FLIGHT=$(echo "$METRICS" | jq -r '.ApproximateNumberOfMessagesNotVisible')
    PROCESSED=$((MESSAGE_COUNT - VISIBLE - IN_FLIGHT))
    
    echo -e "${BLUE}  [$(date +%H:%M:%S)] Visible: $VISIBLE, In-flight: $IN_FLIGHT, Processed: ~$PROCESSED${NC}"
    
    if [ "$VISIBLE" -eq 0 ] && [ "$IN_FLIGHT" -eq 0 ]; then
        echo -e "${GREEN}  All messages processed!${NC}"
        break
    fi
    
    sleep 5
done

echo ""

# ============================================================================
# 4. Check Lambda Metrics
# ============================================================================

echo -e "${YELLOW}4. Checking Lambda metrics...${NC}"

# Get Lambda invocations
INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=huntaze-rate-limiter \
    --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Sum \
    --region "$AWS_REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")

# Get Lambda errors
ERRORS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=huntaze-rate-limiter \
    --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Sum \
    --region "$AWS_REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")

echo -e "${BLUE}  Lambda invocations: $INVOCATIONS${NC}"
echo -e "${BLUE}  Lambda errors: $ERRORS${NC}"

if [ "$ERRORS" = "0" ] || [ "$ERRORS" = "None" ]; then
    check_success "No Lambda errors"
else
    echo -e "${YELLOW}⚠ Lambda had $ERRORS errors${NC}"
fi

echo ""

# ============================================================================
# 5. Check Recent Logs
# ============================================================================

echo -e "${YELLOW}5. Checking recent logs...${NC}"

echo -e "${BLUE}  Recent rate limit decisions:${NC}"
aws logs tail /aws/lambda/huntaze-rate-limiter \
    --since 10m \
    --filter-pattern "Token bucket result" \
    --format short \
    --region "$AWS_REGION" 2>/dev/null | head -10 || echo "  No logs found"

echo ""

# ============================================================================
# 6. Calculate Throughput
# ============================================================================

echo -e "${YELLOW}6. Calculating throughput...${NC}"

TOTAL_TIME=$((END_TIME - START_TIME + 60))  # Add 1 minute for processing
THROUGHPUT=$(echo "scale=2; $MESSAGE_COUNT / ($TOTAL_TIME / 60)" | bc)

echo -e "${BLUE}  Messages sent: $MESSAGE_COUNT${NC}"
echo -e "${BLUE}  Total time: ${TOTAL_TIME}s (~$((TOTAL_TIME / 60))m)${NC}"
echo -e "${BLUE}  Throughput: $THROUGHPUT msg/min${NC}"

if (( $(echo "$THROUGHPUT <= 10" | bc -l) )); then
    check_success "Throughput within limit (≤10 msg/min)"
else
    echo -e "${YELLOW}⚠ Throughput exceeds limit: $THROUGHPUT msg/min${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Messages sent: $MESSAGE_COUNT"
echo "• Lambda invocations: $INVOCATIONS"
echo "• Lambda errors: $ERRORS"
echo "• Throughput: $THROUGHPUT msg/min"
echo "• Expected rate: 10 msg/min"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review CloudWatch Dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=Huntaze-Rate-Limiter"
echo ""
echo "2. Check Lambda logs:"
echo "   aws logs tail /aws/lambda/huntaze-rate-limiter --follow"
echo ""
echo "3. Monitor SQS queue:"
echo "   aws sqs get-queue-attributes --queue-url $QUEUE_URL --attribute-names All"
echo ""
