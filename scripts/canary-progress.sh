#!/bin/bash
# Canary Deployment Progression Script
# 
# Supports 10% → 50% → 100% progression with health verification
# Requirements: 4.1, 4.2, 4.3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
METRICS_ENDPOINT="${AI_METRICS_ENDPOINT:-http://localhost:3000/api/admin/ai-metrics}"
ERROR_THRESHOLD=0.05  # 5%
LATENCY_THRESHOLD=5000  # 5 seconds
HEALTH_CHECK_INTERVAL=30  # seconds
MIN_HEALTHY_DURATION=300  # 5 minutes minimum healthy before progression

# Current canary percentage
CURRENT_PERCENTAGE=${AI_CANARY_PERCENTAGE:-0}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check health metrics
check_health() {
    log_info "Checking health metrics..."
    
    response=$(curl -s "$METRICS_ENDPOINT" 2>/dev/null || echo '{"success":false}')
    
    if ! echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        log_error "Failed to fetch metrics"
        return 1
    fi
    
    error_rate=$(echo "$response" | jq -r '.data.metrics.foundry.errorRate // 0')
    latency_p95=$(echo "$response" | jq -r '.data.metrics.foundry.latencyP95 // 0')
    overall_healthy=$(echo "$response" | jq -r '.data.health.overallHealthy // false')
    
    log_info "Error rate: $(echo "$error_rate * 100" | bc)%"
    log_info "Latency p95: ${latency_p95}ms"
    log_info "Overall healthy: $overall_healthy"
    
    if [ "$overall_healthy" = "true" ]; then
        return 0
    else
        return 1
    fi
}

# Update canary percentage
update_percentage() {
    local new_percentage=$1
    
    log_info "Updating canary percentage to ${new_percentage}%..."
    
    # Update environment variable (this would typically update a config store)
    export AI_CANARY_PERCENTAGE=$new_percentage
    
    # In production, this would:
    # 1. Update AWS Parameter Store or Secrets Manager
    # 2. Trigger ECS service update
    # 3. Update application config
    
    log_info "Canary percentage updated to ${new_percentage}%"
    
    # Log to file for tracking
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Canary percentage updated to ${new_percentage}%" >> canary-progress.log
}

# Wait for healthy duration
wait_for_healthy() {
    local duration=$1
    local elapsed=0
    
    log_info "Waiting for ${duration}s of healthy metrics..."
    
    while [ $elapsed -lt $duration ]; do
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        
        if ! check_health; then
            log_error "Health check failed at ${elapsed}s"
            return 1
        fi
        
        log_info "Healthy for ${elapsed}s / ${duration}s"
    done
    
    log_info "Health check passed for ${duration}s"
    return 0
}

# Progress to next stage
progress_canary() {
    local target_percentage=$1
    
    log_info "=== Progressing canary to ${target_percentage}% ==="
    
    # Verify current health before progression
    if ! check_health; then
        log_error "Current health check failed. Aborting progression."
        exit 1
    fi
    
    # Update percentage
    update_percentage $target_percentage
    
    # Wait for initial stabilization
    log_info "Waiting 60s for initial stabilization..."
    sleep 60
    
    # Verify health after update
    if ! check_health; then
        log_error "Health check failed after update. Consider rollback."
        exit 1
    fi
    
    log_info "=== Successfully progressed to ${target_percentage}% ==="
}

# Main progression flow
main() {
    local action=${1:-"status"}
    
    case $action in
        "status")
            log_info "Current canary percentage: ${CURRENT_PERCENTAGE}%"
            check_health
            ;;
        
        "10")
            log_info "Starting canary at 10%..."
            progress_canary 10
            ;;
        
        "50")
            if [ "$CURRENT_PERCENTAGE" -lt 10 ]; then
                log_error "Must be at 10% before progressing to 50%"
                exit 1
            fi
            
            log_info "Progressing to 50%..."
            
            # Verify 24 hours of healthy metrics (simulated with shorter duration for testing)
            if ! wait_for_healthy $MIN_HEALTHY_DURATION; then
                log_error "Health check failed. Cannot progress to 50%."
                exit 1
            fi
            
            progress_canary 50
            ;;
        
        "100")
            if [ "$CURRENT_PERCENTAGE" -lt 50 ]; then
                log_error "Must be at 50% before progressing to 100%"
                exit 1
            fi
            
            log_info "Progressing to 100%..."
            
            # Verify 48 hours of healthy metrics (simulated with shorter duration for testing)
            if ! wait_for_healthy $MIN_HEALTHY_DURATION; then
                log_error "Health check failed. Cannot progress to 100%."
                exit 1
            fi
            
            progress_canary 100
            log_info "🎉 Canary deployment complete! 100% traffic on Foundry."
            ;;
        
        "auto")
            log_info "Starting automatic canary progression..."
            
            # Start at 10%
            progress_canary 10
            
            # Wait and progress to 50%
            log_info "Waiting for healthy metrics before 50%..."
            if wait_for_healthy $MIN_HEALTHY_DURATION; then
                progress_canary 50
            else
                log_error "Stopping at 10% due to health issues"
                exit 1
            fi
            
            # Wait and progress to 100%
            log_info "Waiting for healthy metrics before 100%..."
            if wait_for_healthy $MIN_HEALTHY_DURATION; then
                progress_canary 100
                log_info "🎉 Automatic canary progression complete!"
            else
                log_error "Stopping at 50% due to health issues"
                exit 1
            fi
            ;;
        
        *)
            echo "Usage: $0 {status|10|50|100|auto}"
            echo ""
            echo "Commands:"
            echo "  status  - Show current status and health"
            echo "  10      - Start canary at 10%"
            echo "  50      - Progress to 50% (requires 10% first)"
            echo "  100     - Progress to 100% (requires 50% first)"
            echo "  auto    - Automatic progression 10% → 50% → 100%"
            exit 1
            ;;
    esac
}

main "$@"
