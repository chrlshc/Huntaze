#!/bin/bash

echo "📊 Huntaze Canary Monitoring Dashboard"
echo "======================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGION="us-east-1"
FUNCTION_NAME="huntaze-mock-read"
ALARM_NAME="huntaze-lambda-error-rate-gt-2pct"

while true; do
  clear
  echo -e "${BLUE}📊 Huntaze Canary Monitoring Dashboard${NC}"
  echo "======================================"
  date
  echo ""

  # 1. Alarm Status
  echo -e "${BLUE}🚨 CloudWatch Alarm Status${NC}"
  ALARM_STATE=$(aws cloudwatch describe-alarms \
    --alarm-names $ALARM_NAME \
    --region $REGION \
    --query 'MetricAlarms[0].StateValue' \
    --output text)
  
  if [ "$ALARM_STATE" = "OK" ]; then
    echo -e "  ${GREEN}✅ Status: OK${NC}"
  elif [ "$ALARM_STATE" = "ALARM" ]; then
    echo -e "  ${RED}🔴 Status: ALARM - ROLLBACK TRIGGERED!${NC}"
  else
    echo -e "  ${YELLOW}⚠️  Status: $ALARM_STATE${NC}"
  fi
  echo ""

  # 2. Lambda Metrics (last 5 minutes)
  echo -e "${BLUE}📈 Lambda Metrics (Last 5 Minutes)${NC}"
  
  END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
  START_TIME=$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S)
  
  INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
    --start-time $START_TIME \
    --end-time $END_TIME \
    --period 300 \
    --statistics Sum \
    --region $REGION \
    --query 'Datapoints[0].Sum' \
    --output text)
  
  ERRORS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
    --start-time $START_TIME \
    --end-time $END_TIME \
    --period 300 \
    --statistics Sum \
    --region $REGION \
    --query 'Datapoints[0].Sum' \
    --output text)
  
  DURATION=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
    --start-time $START_TIME \
    --end-time $END_TIME \
    --period 300 \
    --statistics Average \
    --region $REGION \
    --query 'Datapoints[0].Average' \
    --output text)
  
  # Handle None values
  INVOCATIONS=${INVOCATIONS:-0}
  ERRORS=${ERRORS:-0}
  DURATION=${DURATION:-0}
  
  # Calculate error rate
  if [ "$INVOCATIONS" != "0" ] && [ "$INVOCATIONS" != "None" ]; then
    ERROR_RATE=$(echo "scale=4; $ERRORS / $INVOCATIONS * 100" | bc)
  else
    ERROR_RATE="0"
  fi
  
  echo "  Invocations: $INVOCATIONS"
  echo "  Errors: $ERRORS"
  
  if (( $(echo "$ERROR_RATE > 2" | bc -l) )); then
    echo -e "  ${RED}Error Rate: ${ERROR_RATE}% (> 2% THRESHOLD!)${NC}"
  else
    echo -e "  ${GREEN}Error Rate: ${ERROR_RATE}%${NC}"
  fi
  
  echo "  Avg Duration: ${DURATION}ms"
  echo ""

  # 3. Recent Logs
  echo -e "${BLUE}📝 Recent Logs (Last 10)${NC}"
  aws logs tail /aws/lambda/$FUNCTION_NAME \
    --region $REGION \
    --since 5m \
    --format short \
    --filter-pattern "[MOCK-SUCCESS] OR [CANARY-SUCCESS] OR [SHADOW-DIFF] OR [ERROR]" \
    2>/dev/null | tail -10 || echo "  No recent logs"
  
  echo ""
  echo -e "${YELLOW}Press Ctrl+C to exit. Refreshing in 30 seconds...${NC}"
  sleep 30
done
