#!/bin/bash

# Huntaze Amplify Environment Variables Checker
# Vérifie que toutes les variables requises sont configurées

set -e

echo "🔍 Huntaze Amplify Environment Variables Checker"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
MISSING=0
PRESENT=0

# Function to check env var
check_env() {
    local var_name=$1
    local category=$2
    
    TOTAL=$((TOTAL + 1))
    
    if [ -z "${!var_name}" ]; then
        echo -e "${RED}❌ MISSING${NC} $var_name ($category)"
        MISSING=$((MISSING + 1))
    else
        echo -e "${GREEN}✅ OK${NC}      $var_name"
        PRESENT=$((PRESENT + 1))
    fi
}

echo "📦 Database & Cache"
echo "-------------------"
check_env "DATABASE_URL" "Database"
check_env "REDIS_URL" "Cache"
echo ""

echo "🤖 Azure OpenAI (Primary)"
echo "-------------------------"
check_env "AZURE_OPENAI_ENDPOINT" "Azure"
check_env "AZURE_OPENAI_DEPLOYMENT" "Azure"
check_env "AZURE_OPENAI_API_KEY" "Azure"
check_env "AZURE_OPENAI_API_VERSION" "Azure"
echo ""

echo "🤖 OpenAI (Secondary)"
echo "--------------------"
check_env "OPENAI_API_KEY" "OpenAI"
check_env "OPENAI_ORG_ID" "OpenAI"
echo ""

echo "☁️  AWS Services"
echo "---------------"
check_env "AWS_REGION" "AWS"
check_env "AWS_ACCESS_KEY_ID" "AWS"
check_env "AWS_SECRET_ACCESS_KEY" "AWS"
echo ""

echo "🗄️  DynamoDB Tables"
echo "------------------"
check_env "DYNAMODB_COSTS_TABLE" "DynamoDB"
check_env "DYNAMODB_ALERTS_TABLE" "DynamoDB"
echo ""

echo "📬 SQS Queues"
echo "-------------"
check_env "SQS_URL" "SQS"
check_env "SQS_WORKFLOW_QUEUE" "SQS"
check_env "SQS_RATE_LIMITER_QUEUE" "SQS"
echo ""

echo "📢 SNS Topics"
echo "-------------"
check_env "COST_ALERTS_SNS_TOPIC" "SNS"
echo ""

echo "💰 Cost Monitoring"
echo "-----------------"
check_env "COST_ALERT_EMAIL" "Monitoring"
check_env "SLACK_WEBHOOK_URL" "Monitoring"
echo ""

echo "🚩 Feature Flags"
echo "---------------"
check_env "HYBRID_ORCHESTRATOR_ENABLED" "Feature Flags"
check_env "COST_MONITORING_ENABLED" "Feature Flags"
check_env "RATE_LIMITER_ENABLED" "Feature Flags"
echo ""

echo "🔐 Auth & Security"
echo "-----------------"
check_env "JWT_SECRET" "Auth"
check_env "NEXTAUTH_SECRET" "Auth"
check_env "NEXTAUTH_URL" "Auth"
echo ""

echo "💳 Stripe"
echo "--------"
check_env "STRIPE_SECRET_KEY" "Stripe"
echo ""

echo "🌐 App URLs"
echo "----------"
check_env "NEXT_PUBLIC_APP_URL" "URLs"
check_env "NEXT_PUBLIC_API_URL" "URLs"
echo ""

echo "================================================"
echo ""
echo "📊 Summary:"
echo "  Total variables:   $TOTAL"
echo -e "  ${GREEN}Present:${NC}           $PRESENT"
echo -e "  ${RED}Missing:${NC}           $MISSING"
echo ""

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ All environment variables are configured!${NC}"
    echo ""
    echo "You're ready to deploy to Amplify! 🚀"
    exit 0
else
    echo -e "${RED}❌ $MISSING environment variable(s) missing!${NC}"
    echo ""
    echo "Please configure missing variables in:"
    echo "  Amplify Console > App Settings > Environment variables"
    echo ""
    echo "Or export them locally for testing:"
    echo "  export VARIABLE_NAME=value"
    exit 1
fi
