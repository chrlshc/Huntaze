#!/bin/bash
# test-workers.sh
# Test Azure Workers deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 Testing Azure Workers"
echo "========================"
echo ""

# Configuration
VERCEL_URL="${VERCEL_URL:-}"
TEST_CREATOR_ID="${TEST_CREATOR_ID:-123}"
RG="${AZURE_RG:-huntaze-beta-rg}"
SB_NAMESPACE="${AZURE_SB_NAMESPACE:-}"
FUNCAPP="${AZURE_FUNCAPP:-}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not installed (optional for pretty output)${NC}"
    echo "Install: brew install jq"
    echo ""
fi

# Test 1: Video Analysis Job (only if Vercel URL is set)
if [ -n "$VERCEL_URL" ]; then
    echo -e "${BLUE}Test 1: Video Analysis Job (via Vercel API)${NC}"
    echo "--------------------------------------------"

    VIDEO_RESPONSE=$(curl -s -X POST "$VERCEL_URL/api/jobs/video-analysis" \
      -H "Content-Type: application/json" \
      -d "{
        \"videoUrl\": \"https://example.com/test-video.mp4\",
        \"creatorId\": \"$TEST_CREATOR_ID\"
      }")

if command -v jq &> /dev/null; then
    echo "$VIDEO_RESPONSE" | jq .
else
    echo "$VIDEO_RESPONSE"
fi

VIDEO_JOB_ID=$(echo "$VIDEO_RESPONSE" | jq -r '.jobId' 2>/dev/null || echo "")

if [ -n "$VIDEO_JOB_ID" ] && [ "$VIDEO_JOB_ID" != "null" ]; then
    echo -e "${GREEN}✅ Video analysis job created: $VIDEO_JOB_ID${NC}"
else
    echo -e "${RED}❌ Failed to create video analysis job${NC}"
fi

echo ""

# Test 2: Chat Suggestions Job
echo -e "${BLUE}Test 2: Chat Suggestions Job${NC}"
echo "-----------------------------"

CHAT_RESPONSE=$(curl -s -X POST "$VERCEL_URL/api/jobs/chat-suggestions" \
  -H "Content-Type: application/json" \
  -d "{
    \"fanMessage\": \"Hey babe, what are you up to?\",
    \"context\": {\"fanName\": \"John\", \"tier\": \"vip\"},
    \"creatorId\": \"$TEST_CREATOR_ID\"
  }")

if command -v jq &> /dev/null; then
    echo "$CHAT_RESPONSE" | jq .
else
    echo "$CHAT_RESPONSE"
fi

CHAT_JOB_ID=$(echo "$CHAT_RESPONSE" | jq -r '.jobId' 2>/dev/null || echo "")

if [ -n "$CHAT_JOB_ID" ] && [ "$CHAT_JOB_ID" != "null" ]; then
    echo -e "${GREEN}✅ Chat suggestions job created: $CHAT_JOB_ID${NC}"
else
    echo -e "${RED}❌ Failed to create chat suggestions job${NC}"
fi

echo ""

# Test 3: Check Job Status (if API exists)
if [ -n "$VIDEO_JOB_ID" ] && [ "$VIDEO_JOB_ID" != "null" ]; then
    echo -e "${BLUE}Test 3: Check Job Status${NC}"
    echo "-------------------------"
    
    echo "Waiting 5 seconds for job to process..."
    sleep 5
    
    STATUS_RESPONSE=$(curl -s "$VERCEL_URL/api/jobs/status/$VIDEO_JOB_ID")
    
    if command -v jq &> /dev/null; then
        echo "$STATUS_RESPONSE" | jq .
    else
        echo "$STATUS_RESPONSE"
    fi
    
    JOB_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null || echo "")
    
    if [ -n "$JOB_STATUS" ]; then
        echo -e "${GREEN}✅ Job status retrieved: $JOB_STATUS${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve job status${NC}"
    fi
    
    echo ""
fi

# Test 4: Azure Service Bus Metrics
echo -e "${BLUE}Test 4: Azure Service Bus Metrics${NC}"
echo "----------------------------------"

if command -v az &> /dev/null; then
    # Get resource group and namespace from environment or prompt
    RG="${AZURE_RG:-huntaze-beta-rg}"
    SB_NAMESPACE="${AZURE_SB_NAMESPACE}"
    
    if [ -z "$SB_NAMESPACE" ]; then
        echo -e "${YELLOW}⚠️  AZURE_SB_NAMESPACE not set${NC}"
        echo "Set it with: export AZURE_SB_NAMESPACE=your-namespace"
        echo ""
    else
        echo "Checking subscriptions..."
        
        for SUB in video-analysis chat-suggestions content-suggestions content-analysis; do
            METRICS=$(az servicebus topic subscription show \
              --resource-group "$RG" \
              --namespace-name "$SB_NAMESPACE" \
              --topic-name "huntaze-jobs" \
              --name "$SUB" \
              --query "{activeMessages:countDetails.activeMessageCount, deadLetterMessages:countDetails.deadLetterMessageCount}" \
              -o json 2>/dev/null || echo "{}")
            
            if [ "$METRICS" != "{}" ]; then
                ACTIVE=$(echo "$METRICS" | jq -r '.activeMessages' 2>/dev/null || echo "0")
                DLQ=$(echo "$METRICS" | jq -r '.deadLetterMessages' 2>/dev/null || echo "0")
                
                echo "  $SUB:"
                echo "    Active: $ACTIVE"
                echo "    DLQ: $DLQ"
                
                if [ "$DLQ" -gt 0 ]; then
                    echo -e "    ${RED}⚠️  Dead-letter messages detected!${NC}"
                fi
            fi
        done
        
        echo -e "${GREEN}✅ Service Bus metrics retrieved${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Azure CLI not installed, skipping Service Bus metrics${NC}"
fi

echo ""

# Test 5: Function App Health
echo -e "${BLUE}Test 5: Function App Health${NC}"
echo "----------------------------"

if command -v az &> /dev/null && [ -n "$AZURE_FUNCAPP" ]; then
    FUNCAPP_STATE=$(az functionapp show \
      --resource-group "$RG" \
      --name "$AZURE_FUNCAPP" \
      --query "state" -o tsv 2>/dev/null || echo "")
    
    if [ "$FUNCAPP_STATE" = "Running" ]; then
        echo -e "${GREEN}✅ Function App is running${NC}"
    else
        echo -e "${RED}❌ Function App state: $FUNCAPP_STATE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  AZURE_FUNCAPP not set or Azure CLI not installed${NC}"
fi

echo ""

# Summary
echo "========================"
echo -e "${GREEN}✅ Testing Complete${NC}"
echo "========================"
echo ""
echo "📊 Summary:"
echo "  Video Analysis Job: ${VIDEO_JOB_ID:-N/A}"
echo "  Chat Suggestions Job: ${CHAT_JOB_ID:-N/A}"
echo ""
echo "🔗 Next Steps:"
echo "  1. Check Application Insights for detailed metrics"
echo "  2. Monitor DLQ for failed jobs"
echo "  3. Review function logs: az functionapp log tail --name \$AZURE_FUNCAPP"
echo ""
echo "💡 Tips:"
echo "  - Set VERCEL_URL to your actual Vercel deployment URL"
echo "  - Set AZURE_SB_NAMESPACE to check Service Bus metrics"
echo "  - Set AZURE_FUNCAPP to check Function App health"
echo ""
