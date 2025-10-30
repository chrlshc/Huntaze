#!/bin/bash
# GO/NO-GO Production Readiness Audit
# Based on AWS ORR Well-Architected Framework
# Account: 317805897534 | Region: us-east-1

set -o pipefail

REGION="us-east-1"
ACCOUNT_ID="317805897534"
BUDGET_LIMIT=500
BUDGET_THRESHOLD=400  # 80% of $500

echo "🎯 HUNTAZE PRODUCTION GO/NO-GO AUDIT"
echo "===================================="
echo "Account: $ACCOUNT_ID"
echo "Region: $REGION"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN_COUNT++))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  INFRASTRUCTURE HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check ECS Clusters
echo ""
echo "🔍 Checking ECS Clusters..."
CLUSTERS=$(aws ecs describe-clusters \
    --clusters ai-team huntaze-cluster huntaze-of-fargate \
    --region $REGION \
    --query 'clusters[*].{Name:clusterName,Status:status,Active:activeServicesCount}' \
    --output json 2>/dev/null || echo "[]")

if [ "$CLUSTERS" != "[]" ]; then
    CLUSTER_COUNT=$(echo "$CLUSTERS" | jq '. | length')
    if [ "$CLUSTER_COUNT" -ge 3 ]; then
        check_pass "ECS Clusters: $CLUSTER_COUNT clusters active"
        echo "$CLUSTERS" | jq -r '.[] | "  - \(.Name): \(.Status) (\(.Active) services)"'
    else
        check_warn "ECS Clusters: Only $CLUSTER_COUNT clusters found (expected 3)"
    fi
else
    check_fail "ECS Clusters: Unable to retrieve cluster information"
fi

# Check SQS Queues
echo ""
echo "🔍 Checking SQS Queues..."
QUEUES=$(aws sqs list-queues --region $REGION --output json 2>/dev/null || echo '{"QueueUrls":[]}')
HUNTAZE_QUEUES=$(echo "$QUEUES" | jq -r '.QueueUrls[]? | select(contains("huntaze"))' | wc -l)

if [ "$HUNTAZE_QUEUES" -gt 0 ]; then
    check_pass "SQS Queues: $HUNTAZE_QUEUES huntaze queues found"
    echo "$QUEUES" | jq -r '.QueueUrls[]? | select(contains("huntaze")) | "  - " + (split("/")[-1])'
else
    check_warn "SQS Queues: No huntaze queues found (may need deployment)"
fi

# Check DynamoDB Tables
echo ""
echo "🔍 Checking DynamoDB Tables..."
TABLES=$(aws dynamodb list-tables --region $REGION --output json 2>/dev/null || echo '{"TableNames":[]}')
HUNTAZE_TABLES=$(echo "$TABLES" | jq -r '.TableNames[]? | select(contains("huntaze"))' | wc -l)

if [ "$HUNTAZE_TABLES" -gt 0 ]; then
    check_pass "DynamoDB Tables: $HUNTAZE_TABLES huntaze tables found"
    echo "$TABLES" | jq -r '.TableNames[]? | select(contains("huntaze")) | "  - " + .'
else
    check_warn "DynamoDB Tables: No huntaze tables found (may need deployment)"
fi

# Check SNS Topics
echo ""
echo "🔍 Checking SNS Topics..."
TOPICS=$(aws sns list-topics --region $REGION --output json 2>/dev/null || echo '{"Topics":[]}')
HUNTAZE_TOPICS=$(echo "$TOPICS" | jq -r '.Topics[]?.TopicArn | select(contains("huntaze"))' | wc -l)

if [ "$HUNTAZE_TOPICS" -gt 0 ]; then
    check_pass "SNS Topics: $HUNTAZE_TOPICS huntaze topics found"
    echo "$TOPICS" | jq -r '.Topics[]?.TopicArn | select(contains("huntaze")) | "  - " + (split(":")[-1])'
else
    check_warn "SNS Topics: No huntaze topics found (may need deployment)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  SECURITY POSTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check GuardDuty
echo ""
echo "🔍 Checking GuardDuty..."
GUARDDUTY=$(aws guardduty list-detectors --region $REGION --output json 2>/dev/null || echo '{"DetectorIds":[]}')
DETECTOR_COUNT=$(echo "$GUARDDUTY" | jq '.DetectorIds | length')

if [ "$DETECTOR_COUNT" -gt 0 ]; then
    DETECTOR_ID=$(echo "$GUARDDUTY" | jq -r '.DetectorIds[0]')
    DETECTOR_STATUS=$(aws guardduty get-detector --detector-id "$DETECTOR_ID" --region $REGION --query 'Status' --output text 2>/dev/null || echo "UNKNOWN")
    if [ "$DETECTOR_STATUS" = "ENABLED" ]; then
        check_pass "GuardDuty: Enabled (Detector: $DETECTOR_ID)"
    else
        check_fail "GuardDuty: Status is $DETECTOR_STATUS"
    fi
else
    check_fail "GuardDuty: No detectors found"
fi

# Check Security Hub
echo ""
echo "🔍 Checking Security Hub..."
SECURITY_HUB=$(aws securityhub describe-hub --region $REGION 2>/dev/null || echo "")
if [ -n "$SECURITY_HUB" ]; then
    HUB_ARN=$(echo "$SECURITY_HUB" | jq -r '.HubArn // empty')
    if [ -n "$HUB_ARN" ]; then
        check_pass "Security Hub: Enabled"
    else
        check_warn "Security Hub: Enabled but ARN not found"
    fi
else
    check_fail "Security Hub: Not enabled"
fi

# Check AWS Config
echo ""
echo "🔍 Checking AWS Config..."
CONFIG_RECORDERS=$(aws configservice describe-configuration-recorders --region $REGION --output json 2>/dev/null || echo '{"ConfigurationRecorders":[]}')
RECORDER_COUNT=$(echo "$CONFIG_RECORDERS" | jq '.ConfigurationRecorders | length')

if [ "$RECORDER_COUNT" -gt 0 ]; then
    RECORDER_NAME=$(echo "$CONFIG_RECORDERS" | jq -r '.ConfigurationRecorders[0].name')
    RECORDER_STATUS=$(aws configservice describe-configuration-recorder-status --region $REGION --query 'ConfigurationRecordersStatus[0].recording' --output text 2>/dev/null || echo "false")
    if [ "$RECORDER_STATUS" = "True" ]; then
        check_pass "AWS Config: Recording enabled ($RECORDER_NAME)"
    else
        check_warn "AWS Config: Recorder exists but not recording"
    fi
else
    check_fail "AWS Config: No configuration recorders found"
fi

# Check S3 Encryption
echo ""
echo "🔍 Checking S3 Bucket Encryption..."
BUCKETS=$(aws s3api list-buckets --query 'Buckets[*].Name' --output json 2>/dev/null || echo '[]')
HUNTAZE_BUCKETS=$(echo "$BUCKETS" | jq -r '.[] | select(contains("huntaze"))')

if [ -n "$HUNTAZE_BUCKETS" ]; then
    UNENCRYPTED=0
    while IFS= read -r bucket; do
        ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$bucket" 2>/dev/null || echo "")
        if [ -z "$ENCRYPTION" ]; then
            echo "  ⚠️  $bucket: No encryption configured"
            ((UNENCRYPTED++))
        else
            echo "  ✅ $bucket: Encrypted"
        fi
    done <<< "$HUNTAZE_BUCKETS"
    
    if [ "$UNENCRYPTED" -eq 0 ]; then
        check_pass "S3 Encryption: All huntaze buckets encrypted"
    else
        check_fail "S3 Encryption: $UNENCRYPTED buckets without encryption"
    fi
else
    check_warn "S3 Buckets: No huntaze buckets found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  COST MONITORING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Budgets
echo ""
echo "🔍 Checking AWS Budgets..."
BUDGETS=$(aws budgets describe-budgets --account-id $ACCOUNT_ID --output json 2>/dev/null || echo '{"Budgets":[]}')
BUDGET_COUNT=$(echo "$BUDGETS" | jq '.Budgets | length')

if [ "$BUDGET_COUNT" -gt 0 ]; then
    ACTUAL_SPEND=$(echo "$BUDGETS" | jq -r '.Budgets[0].CalculatedSpend.ActualSpend.Amount // "0"')
    BUDGET_LIMIT_ACTUAL=$(echo "$BUDGETS" | jq -r '.Budgets[0].BudgetLimit.Amount // "0"')
    
    SPEND_INT=$(printf "%.0f" "$ACTUAL_SPEND")
    
    if [ "$SPEND_INT" -lt "$BUDGET_THRESHOLD" ]; then
        check_pass "Budget: \$$ACTUAL_SPEND / \$$BUDGET_LIMIT_ACTUAL ($(echo "scale=1; $ACTUAL_SPEND * 100 / $BUDGET_LIMIT_ACTUAL" | bc)%)"
    elif [ "$SPEND_INT" -lt "$BUDGET_LIMIT" ]; then
        check_warn "Budget: \$$ACTUAL_SPEND / \$$BUDGET_LIMIT_ACTUAL ($(echo "scale=1; $ACTUAL_SPEND * 100 / $BUDGET_LIMIT_ACTUAL" | bc)%) - Approaching limit"
    else
        check_fail "Budget: \$$ACTUAL_SPEND / \$$BUDGET_LIMIT_ACTUAL ($(echo "scale=1; $ACTUAL_SPEND * 100 / $BUDGET_LIMIT_ACTUAL" | bc)%) - OVER BUDGET"
    fi
else
    check_fail "Budgets: No budgets configured"
fi

# Check Cost Anomaly Detection
echo ""
echo "🔍 Checking Cost Anomaly Detection..."
CAD_MONITORS=$(aws ce get-anomaly-monitors --output json 2>/dev/null || echo '{"AnomalyMonitors":[]}')
MONITOR_COUNT=$(echo "$CAD_MONITORS" | jq '.AnomalyMonitors | length')

if [ "$MONITOR_COUNT" -gt 0 ]; then
    check_pass "Cost Anomaly Detection: $MONITOR_COUNT monitors configured"
    echo "$CAD_MONITORS" | jq -r '.AnomalyMonitors[] | "  - \(.MonitorName): \(.MonitorType)"'
else
    check_warn "Cost Anomaly Detection: No monitors configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  MONITORING & OBSERVABILITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check CloudWatch Alarms
echo ""
echo "🔍 Checking CloudWatch Alarms..."
ALARMS=$(aws cloudwatch describe-alarms --region $REGION --output json 2>/dev/null || echo '{"MetricAlarms":[],"CompositeAlarms":[]}')
METRIC_ALARMS=$(echo "$ALARMS" | jq '.MetricAlarms | length')
COMPOSITE_ALARMS=$(echo "$ALARMS" | jq '.CompositeAlarms | length')
ALARM_STATE=$(echo "$ALARMS" | jq -r '.MetricAlarms[] | select(.StateValue == "ALARM") | .AlarmName' | wc -l)

if [ "$METRIC_ALARMS" -gt 0 ] || [ "$COMPOSITE_ALARMS" -gt 0 ]; then
    if [ "$ALARM_STATE" -eq 0 ]; then
        check_pass "CloudWatch Alarms: $METRIC_ALARMS metric + $COMPOSITE_ALARMS composite alarms (0 in ALARM state)"
    else
        check_fail "CloudWatch Alarms: $ALARM_STATE alarms in ALARM state"
        echo "$ALARMS" | jq -r '.MetricAlarms[] | select(.StateValue == "ALARM") | "  ⚠️  \(.AlarmName): \(.StateReason)"'
    fi
else
    check_warn "CloudWatch Alarms: No alarms configured"
fi

# Check Synthetics Canaries
echo ""
echo "🔍 Checking CloudWatch Synthetics Canaries..."
CANARIES=$(aws synthetics describe-canaries --region $REGION --output json 2>/dev/null || echo '{"Canaries":[]}')
CANARY_COUNT=$(echo "$CANARIES" | jq '.Canaries | length')

if [ "$CANARY_COUNT" -gt 0 ]; then
    RUNNING=$(echo "$CANARIES" | jq '[.Canaries[] | select(.Status.State == "RUNNING")] | length')
    FAILED=$(echo "$CANARIES" | jq '[.Canaries[] | select(.Status.LastRun.Status.State == "FAILED")] | length')
    
    if [ "$RUNNING" -eq "$CANARY_COUNT" ] && [ "$FAILED" -eq 0 ]; then
        check_pass "Synthetics Canaries: $CANARY_COUNT canaries running, all passing"
    elif [ "$FAILED" -gt 0 ]; then
        check_fail "Synthetics Canaries: $FAILED canaries failed"
        echo "$CANARIES" | jq -r '.Canaries[] | select(.Status.LastRun.Status.State == "FAILED") | "  ❌ \(.Name): \(.Status.LastRun.Status.StateReason)"'
    else
        check_warn "Synthetics Canaries: $RUNNING/$CANARY_COUNT canaries running"
    fi
else
    check_warn "Synthetics Canaries: No canaries configured"
fi

# Check Container Insights
echo ""
echo "🔍 Checking Container Insights..."
CONTAINER_INSIGHTS=0
for cluster in ai-team huntaze-cluster huntaze-of-fargate; do
    INSIGHTS=$(aws ecs describe-clusters --clusters $cluster --region $REGION --include SETTINGS --query 'clusters[0].settings[?name==`containerInsights`].value' --output text 2>/dev/null || echo "")
    if [ "$INSIGHTS" = "enabled" ]; then
        echo "  ✅ $cluster: Container Insights enabled"
        ((CONTAINER_INSIGHTS++))
    else
        echo "  ⚠️  $cluster: Container Insights not enabled"
    fi
done

if [ "$CONTAINER_INSIGHTS" -eq 3 ]; then
    check_pass "Container Insights: Enabled on all 3 clusters"
elif [ "$CONTAINER_INSIGHTS" -gt 0 ]; then
    check_warn "Container Insights: Enabled on $CONTAINER_INSIGHTS/3 clusters"
else
    check_fail "Container Insights: Not enabled on any cluster"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  OPERATIONAL READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Lambda Functions
echo ""
echo "🔍 Checking Lambda Functions..."
LAMBDAS=$(aws lambda list-functions --region $REGION --output json 2>/dev/null || echo '{"Functions":[]}')
HUNTAZE_LAMBDAS=$(echo "$LAMBDAS" | jq '[.Functions[] | select(.FunctionName | contains("huntaze"))] | length')

if [ "$HUNTAZE_LAMBDAS" -gt 0 ]; then
    check_pass "Lambda Functions: $HUNTAZE_LAMBDAS huntaze functions found"
    echo "$LAMBDAS" | jq -r '.Functions[] | select(.FunctionName | contains("huntaze")) | "  - \(.FunctionName): \(.Runtime)"'
else
    check_warn "Lambda Functions: No huntaze functions found (may need deployment)"
fi

# Check RDS Instances
echo ""
echo "🔍 Checking RDS Instances..."
RDS_INSTANCES=$(aws rds describe-db-instances --region $REGION --output json 2>/dev/null || echo '{"DBInstances":[]}')
HUNTAZE_RDS=$(echo "$RDS_INSTANCES" | jq '[.DBInstances[] | select(.DBInstanceIdentifier | contains("huntaze")) | select(.DBInstanceStatus == "available")] | length')

if [ "$HUNTAZE_RDS" -gt 0 ]; then
    ENCRYPTED=$(echo "$RDS_INSTANCES" | jq '[.DBInstances[] | select(.DBInstanceIdentifier | contains("huntaze")) | select(.DBInstanceStatus == "available") | select(.StorageEncrypted == true)] | length')
    PERFORMANCE_INSIGHTS=$(echo "$RDS_INSTANCES" | jq '[.DBInstances[] | select(.DBInstanceIdentifier | contains("huntaze")) | select(.DBInstanceStatus == "available") | select(.PerformanceInsightsEnabled == true)] | length')
    
    if [ "$ENCRYPTED" -eq "$HUNTAZE_RDS" ]; then
        check_pass "RDS Encryption: All $HUNTAZE_RDS active instances encrypted"
    else
        check_fail "RDS Encryption: Only $ENCRYPTED/$HUNTAZE_RDS active instances encrypted"
    fi
    
    if [ "$PERFORMANCE_INSIGHTS" -eq "$HUNTAZE_RDS" ]; then
        check_pass "RDS Performance Insights: Enabled on all $HUNTAZE_RDS active instances"
    else
        check_warn "RDS Performance Insights: Only $PERFORMANCE_INSIGHTS/$HUNTAZE_RDS active instances enabled"
    fi
else
    check_warn "RDS Instances: No active huntaze instances found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 FINAL GO/NO-GO DECISION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Results Summary:"
echo -e "  ${GREEN}✅ PASS${NC}: $PASS_COUNT checks"
echo -e "  ${YELLOW}⚠️  WARN${NC}: $WARN_COUNT checks"
echo -e "  ${RED}❌ FAIL${NC}: $FAIL_COUNT checks"
echo ""

# Decision logic
if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🚀 GO FOR PRODUCTION${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "✅ All critical checks passed"
    echo "✅ Infrastructure is production-ready"
    echo "✅ Security posture is acceptable"
    echo ""
    echo "Next Steps:"
    echo "  1. Review docs/runbooks/PRODUCTION_GO_LIVE_RUNBOOK.md"
    echo "  2. Execute deployment: ./scripts/deploy-production-hardening.sh"
    echo "  3. Monitor canaries and alarms for 2 hours"
    echo "  4. Conduct 24-hour review"
    exit 0
elif [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  CONDITIONAL GO${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "⚠️  No critical failures, but $WARN_COUNT warnings detected"
    echo "⚠️  Review warnings above before proceeding"
    echo ""
    echo "Recommended Actions:"
    echo "  1. Address warnings if possible"
    echo "  2. Document accepted risks"
    echo "  3. Proceed with caution"
    exit 1
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}🛑 NO-GO FOR PRODUCTION${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "❌ $FAIL_COUNT critical failures detected"
    echo "❌ Infrastructure is NOT production-ready"
    echo ""
    echo "Required Actions:"
    echo "  1. Fix all FAIL checks above"
    echo "  2. Re-run this audit"
    echo "  3. Do NOT proceed to production"
    exit 2
fi
