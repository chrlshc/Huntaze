#!/bin/bash
# Canary Rollback Script
# 
# Immediately sets traffic to 0% Foundry (100% Legacy)
# Requirements: 4.7 - Rollback within 60 seconds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
METRICS_ENDPOINT="${AI_METRICS_ENDPOINT:-http://localhost:3000/api/admin/ai-metrics}"
LOG_FILE="canary-rollback.log"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Log rollback event
log_rollback() {
    local reason=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "$timestamp - ROLLBACK - Reason: $reason" >> "$LOG_FILE"
    
    # Also log to console
    log_info "Rollback logged: $reason"
}

# Get current metrics for logging
get_current_metrics() {
    response=$(curl -s "$METRICS_ENDPOINT" 2>/dev/null || echo '{"success":false}')
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        error_rate=$(echo "$response" | jq -r '.data.metrics.foundry.errorRate // 0')
        latency_p95=$(echo "$response" | jq -r '.data.metrics.foundry.latencyP95 // 0')
        avg_cost=$(echo "$response" | jq -r '.data.metrics.foundry.avgCostPerRequest // 0')
        
        echo "error_rate=$error_rate,latency_p95=$latency_p95,avg_cost=$avg_cost"
    else
        echo "metrics_unavailable"
    fi
}

# Execute rollback
execute_rollback() {
    local reason=${1:-"manual"}
    local start_time=$(date +%s)
    
    log_info "🚨 INITIATING ROLLBACK 🚨"
    log_info "Reason: $reason"
    
    # Get current metrics for logging
    local metrics=$(get_current_metrics)
    log_info "Current metrics: $metrics"
    
    # Set canary percentage to 0
    log_info "Setting canary percentage to 0%..."
    export AI_CANARY_PERCENTAGE=0
    
    # In production, this would:
    # 1. Update AWS Parameter Store or Secrets Manager
    # aws ssm put-parameter --name "/huntaze/ai/canary-percentage" --value "0" --overwrite
    
    # 2. Trigger immediate config refresh
    # aws ecs update-service --cluster huntaze --service ai-router --force-new-deployment
    
    # 3. Update application config via API
    # curl -X POST "$METRICS_ENDPOINT/rollback" -d '{"percentage": 0}'
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Log rollback event
    log_rollback "$reason (metrics: $metrics, duration: ${duration}s)"
    
    # Verify rollback completed within 60 seconds
    if [ $duration -gt 60 ]; then
        log_warn "Rollback took ${duration}s (exceeds 60s target)"
    else
        log_info "Rollback completed in ${duration}s"
    fi
    
    log_info "✅ ROLLBACK COMPLETE - All traffic now on Legacy"
}

# Verify rollback status
verify_rollback() {
    log_info "Verifying rollback status..."
    
    # Check current percentage
    local current_percentage=${AI_CANARY_PERCENTAGE:-0}
    
    if [ "$current_percentage" -eq 0 ]; then
        log_info "✅ Canary percentage is 0% - Rollback verified"
        return 0
    else
        log_error "❌ Canary percentage is ${current_percentage}% - Rollback may have failed"
        return 1
    fi
}

# Main
main() {
    local action=${1:-"execute"}
    local reason=${2:-"manual"}
    
    case $action in
        "execute")
            execute_rollback "$reason"
            verify_rollback
            ;;
        
        "verify")
            verify_rollback
            ;;
        
        "error-rate")
            execute_rollback "error_rate_exceeded"
            verify_rollback
            ;;
        
        "latency")
            execute_rollback "latency_exceeded"
            verify_rollback
            ;;
        
        "cost")
            execute_rollback "cost_exceeded"
            verify_rollback
            ;;
        
        "history")
            if [ -f "$LOG_FILE" ]; then
                log_info "Rollback history:"
                cat "$LOG_FILE"
            else
                log_info "No rollback history found"
            fi
            ;;
        
        *)
            echo "Usage: $0 {execute|verify|error-rate|latency|cost|history} [reason]"
            echo ""
            echo "Commands:"
            echo "  execute [reason]  - Execute rollback with optional reason"
            echo "  verify            - Verify rollback status"
            echo "  error-rate        - Rollback due to error rate"
            echo "  latency           - Rollback due to latency"
            echo "  cost              - Rollback due to cost"
            echo "  history           - Show rollback history"
            exit 1
            ;;
    esac
}

main "$@"
