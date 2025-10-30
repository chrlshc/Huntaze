#!/bin/bash
# Verify Deployment Readiness
# Checks that all required files and scripts are in place

echo "🔍 Verifying Deployment Readiness"
echo "=================================="
echo ""

MISSING=0
TOTAL=0

check_file() {
    local file=$1
    local description=$2
    ((TOTAL++))
    
    if [ -f "$file" ]; then
        echo "✅ $description"
    else
        echo "❌ MISSING: $description"
        echo "   Expected: $file"
        ((MISSING++))
    fi
}

check_executable() {
    local file=$1
    local description=$2
    ((TOTAL++))
    
    if [ -f "$file" ] && [ -x "$file" ]; then
        echo "✅ $description (executable)"
    elif [ -f "$file" ]; then
        echo "⚠️  $description (not executable)"
        echo "   Run: chmod +x $file"
        ((MISSING++))
    else
        echo "❌ MISSING: $description"
        echo "   Expected: $file"
        ((MISSING++))
    fi
}

echo "📋 Checking Scripts..."
echo ""
check_executable "scripts/go-no-go-audit.sh" "GO/NO-GO Audit Script"
check_executable "scripts/quick-infrastructure-check.sh" "Quick Infrastructure Check"
check_executable "scripts/setup-aws-env.sh" "AWS Environment Setup"
check_executable "scripts/start-production-deployment.sh" "Production Deployment Starter"

echo ""
echo "📚 Checking Documentation..."
echo ""
check_file "START_HERE.md" "Quick Start Guide"
check_file "PRODUCTION_DEPLOYMENT_README.md" "Main Deployment README"
check_file "PRODUCTION_READY_SUMMARY.md" "Production Ready Summary"
check_file "DEPLOYMENT_FLOWCHART.md" "Deployment Flowchart"
check_file "docs/runbooks/QUICK_START_PRODUCTION.md" "Quick Start Runbook"
check_file "docs/runbooks/PRODUCTION_GO_LIVE_RUNBOOK.md" "Detailed Go-Live Runbook"
check_file "docs/PRODUCTION_DEPLOYMENT_INDEX.md" "Documentation Index"

echo ""
echo "🏗️  Checking Infrastructure..."
echo ""
check_file "infra/terraform/production-hardening/main.tf" "Terraform Main Config"
check_file "infra/terraform/production-hardening/security-services.tf" "Security Services Module"
check_file "infra/terraform/production-hardening/cloudwatch-alarms.tf" "CloudWatch Alarms Module"

echo ""
echo "🧪 Checking Validation Scripts..."
echo ""
check_executable "scripts/validate-security-comprehensive.sh" "Comprehensive Security Validation"
check_executable "scripts/deploy-production-hardening.sh" "Production Hardening Deployment"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 READINESS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total checks: $TOTAL"
echo "Passed: $((TOTAL - MISSING))"
echo "Failed: $MISSING"
echo ""

if [ $MISSING -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED - READY FOR PRODUCTION DEPLOYMENT"
    echo ""
    echo "Next steps:"
    echo "  1. Read: START_HERE.md"
    echo "  2. Run: ./scripts/start-production-deployment.sh"
    echo ""
    exit 0
else
    echo "❌ $MISSING CHECKS FAILED - NOT READY"
    echo ""
    echo "Please fix the missing files/permissions above"
    echo ""
    exit 1
fi
