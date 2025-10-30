#!/bin/bash
# Production Deployment Starter Script
# Interactive guide to start production deployment

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 HUNTAZE AWS PRODUCTION HARDENING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Welcome to the Huntaze Production Deployment workflow!"
echo ""
echo "This script will guide you through:"
echo "  1. AWS credentials setup"
echo "  2. Infrastructure health check"
echo "  3. GO/NO-GO decision audit"
echo "  4. Production deployment (if GO)"
echo ""
echo "Total estimated time: 60-90 minutes"
echo ""
read -p "Ready to start? (y/n): " START

if [ "$START" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: AWS Credentials Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if credentials are already set
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "✅ AWS credentials already configured"
    aws sts get-caller-identity 2>/dev/null || {
        echo "❌ Credentials invalid or expired"
        echo ""
        read -p "Do you want to reconfigure? (y/n): " RECONFIG
        if [ "$RECONFIG" = "y" ]; then
            ./scripts/setup-aws-env.sh
        else
            echo "Cannot proceed without valid credentials"
            exit 1
        fi
    }
else
    echo "No AWS credentials found"
    echo ""
    read -p "Do you want to configure credentials now? (y/n): " CONFIG
    if [ "$CONFIG" = "y" ]; then
        ./scripts/setup-aws-env.sh
    else
        echo ""
        echo "Please configure credentials manually:"
        echo "  export AWS_ACCESS_KEY_ID=\"...\""
        echo "  export AWS_SECRET_ACCESS_KEY=\"...\""
        echo "  export AWS_SESSION_TOKEN=\"...\"  # If using SSO"
        echo "  export AWS_REGION=\"us-east-1\""
        echo ""
        echo "Then run this script again"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Quick Infrastructure Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running quick infrastructure check..."
echo ""

./scripts/quick-infrastructure-check.sh

echo ""
read -p "Infrastructure check complete. Continue to GO/NO-GO audit? (y/n): " CONTINUE_AUDIT

if [ "$CONTINUE_AUDIT" != "y" ]; then
    echo "Deployment paused"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: GO/NO-GO Decision Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running comprehensive GO/NO-GO audit..."
echo "This will check:"
echo "  - Infrastructure health"
echo "  - Security posture"
echo "  - Cost monitoring"
echo "  - Monitoring & observability"
echo "  - Operational readiness"
echo ""

./scripts/go-no-go-audit.sh
AUDIT_RESULT=$?

echo ""
if [ $AUDIT_RESULT -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ GO FOR PRODUCTION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "All checks passed! You are ready to deploy to production."
    echo ""
    read -p "Do you want to proceed with deployment? (y/n): " DEPLOY
    
    if [ "$DEPLOY" = "y" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "STEP 4: Production Deployment"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Opening deployment guide..."
        echo ""
        echo "Please follow the step-by-step guide in:"
        echo "  docs/runbooks/QUICK_START_PRODUCTION.md"
        echo ""
        echo "Key phases:"
        echo "  1. Infrastructure Core (15 min)"
        echo "  2. Services Configuration (15 min)"
        echo "  3. Security & Monitoring (15 min)"
        echo "  4. Validation (15 min)"
        echo ""
        echo "Total estimated time: 60-90 minutes"
        echo ""
        
        if command -v open &> /dev/null; then
            read -p "Open the guide now? (y/n): " OPEN_GUIDE
            if [ "$OPEN_GUIDE" = "y" ]; then
                open docs/runbooks/QUICK_START_PRODUCTION.md 2>/dev/null || \
                cat docs/runbooks/QUICK_START_PRODUCTION.md
            fi
        else
            echo "View the guide with:"
            echo "  cat docs/runbooks/QUICK_START_PRODUCTION.md"
        fi
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎯 DEPLOYMENT STARTED"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Follow the guide and execute each phase carefully."
        echo ""
        echo "Monitoring dashboards:"
        echo "  - CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1"
        echo "  - ECS: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters"
        echo "  - Synthetics: https://console.aws.amazon.com/synthetics/home?region=us-east-1"
        echo ""
        echo "Emergency rollback:"
        echo "  cd infra/terraform/production-hardening"
        echo "  terraform destroy -auto-approve"
        echo ""
        echo "Good luck! 🚀"
        
    else
        echo ""
        echo "Deployment cancelled by user"
        echo ""
        echo "You can start the deployment later by following:"
        echo "  docs/runbooks/QUICK_START_PRODUCTION.md"
    fi
    
elif [ $AUDIT_RESULT -eq 1 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  CONDITIONAL GO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "No critical failures, but warnings detected."
    echo ""
    echo "Recommended actions:"
    echo "  1. Review warnings above"
    echo "  2. Address warnings if possible"
    echo "  3. Document accepted risks"
    echo "  4. Proceed with caution"
    echo ""
    read -p "Do you want to proceed anyway? (y/n): " PROCEED_ANYWAY
    
    if [ "$PROCEED_ANYWAY" = "y" ]; then
        echo ""
        echo "Proceeding with deployment (warnings accepted)"
        echo ""
        echo "Follow the deployment guide:"
        echo "  docs/runbooks/QUICK_START_PRODUCTION.md"
    else
        echo ""
        echo "Deployment cancelled"
        echo "Please address warnings and run the audit again"
    fi
    
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ NO-GO FOR PRODUCTION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Critical failures detected. Infrastructure is NOT production-ready."
    echo ""
    echo "Required actions:"
    echo "  1. Fix all FAIL checks above"
    echo "  2. Re-run the audit: ./scripts/go-no-go-audit.sh"
    echo "  3. Do NOT proceed to production"
    echo ""
    echo "Deployment cancelled"
    exit 2
fi
