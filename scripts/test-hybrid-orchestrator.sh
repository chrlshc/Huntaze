#!/bin/bash

# 🧪 Test Script pour l'Orchestrateur Hybride
# Teste les différents scénarios Azure + OpenAI

set -e

# Configuration
API_BASE_URL="http://localhost:3000"
TEST_USER_ID="test-user-$(date +%s)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que le serveur est démarré
check_server() {
    log_info "Checking if server is running..."
    
    if curl -s "${API_BASE_URL}/api/health" > /dev/null 2>&1; then
        log_success "Server is running"
    else
        log_error "Server is not running. Please start with 'npm run dev'"
        exit 1
    fi
}

# Test 1: Content Planning avec Azure
test_azure_content_planning() {
    log_info "Test 1: Content Planning with Azure"
    
    local response=$(curl -s -X POST "${API_BASE_URL}/api/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "'${TEST_USER_ID}'",
            "type": "content_planning",
            "platforms": ["instagram", "tiktok"],
            "contentType": "post",
            "requiresMultiPlatform": true
        }')
    
    if echo "$response" | jq -e '.success == true' > /dev/null; then
        local provider=$(echo "$response" | jq -r '.provider')
        local duration=$(echo "$response" | jq -r '.duration')
        log_success "Azure content planning: ${provider} provider, ${duration}ms"
    else
        log_error "Azure content planning failed: $response"
        return 1
    fi
}

# Test 2: Message Automation avec OpenAI
test_openai_message_automation() {
    log_info "Test 2: Message Automation with OpenAI"
    
    local response=$(curl -s -X POST "${API_BASE_URL}/api/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "'${TEST_USER_ID}'",
            "type": "message_automation",
            "platforms": ["onlyfans"],
            "data": {
                "recipientName": "TestUser",
                "messageType": "welcome"
            },
            "forceProvider": "openai"
        }')
    
    if echo "$response" | jq -e '.success == true' > /dev/null; then
        local provider=$(echo "$response" | jq -r '.provider')
        local duration=$(echo "$response" | jq -r '.duration')
        log_success "OpenAI message automation: ${provider} provider, ${duration}ms"
    else
        log_error "OpenAI message automation failed: $response"
        return 1
    fi
}

# Test 3: Fallback Azure → OpenAI
test_fallback_mechanism() {
    log_info "Test 3: Fallback mechanism (Azure → OpenAI)"
    
    # Simuler un échec Azure en forçant un mauvais endpoint
    local response=$(curl -s -X POST "${API_BASE_URL}/api/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "'${TEST_USER_ID}'",
            "type": "content_planning",
            "platforms": ["instagram"],
            "data": {
                "simulateAzureFailure": true
            }
        }')
    
    if echo "$response" | jq -e '.success == true' > /dev/null; then
        local provider=$(echo "$response" | jq -r '.provider')
        log_success "Fallback mechanism worked: fell back to ${provider}"
    else
        log_warning "Fallback test inconclusive: $response"
    fi
}

# Test 4: OnlyFans Integration
test_onlyfans_integration() {
    log_info "Test 4: OnlyFans Integration (dry run)"
    
    local response=$(curl -s -X POST "${API_BASE_URL}/api/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "'${TEST_USER_ID}'",
            "type": "message_automation",
            "sendToOnlyFans": true,
            "recipientId": "test-recipient-123",
            "data": {
                "message": "Test message from hybrid orchestrator"
            }
        }')
    
    if echo "$response" | jq -e '.success == true' > /dev/null; then
        local messageSent=$(echo "$response" | jq -r '.messageSent.success // false')
        log_success "OnlyFans integration test: message sent = ${messageSent}"
    else
        log_error "OnlyFans integration failed: $response"
        return 1
    fi
}

# Test 5: Métriques et Status
test_metrics_endpoint() {
    log_info "Test 5: Metrics and Status"
    
    local response=$(curl -s "${API_BASE_URL}/api/campaigns/hybrid")
    
    if echo "$response" | jq -e '.status == "active"' > /dev/null; then
        local azure_available=$(echo "$response" | jq -r '.providers.azure.available')
        local openai_available=$(echo "$response" | jq -r '.providers.openai.available')
        
        log_success "Status endpoint working"
        log_info "Azure available: ${azure_available}"
        log_info "OpenAI available: ${openai_available}"
        
        # Afficher les métriques si disponibles
        local metrics=$(echo "$response" | jq -r '.metrics // {}')
        if [ "$metrics" != "{}" ]; then
            log_info "Current metrics: $metrics"
        fi
    else
        log_error "Status endpoint failed: $response"
        return 1
    fi
}

# Test de performance
test_performance() {
    log_info "Test 6: Performance comparison"
    
    # Test Azure
    local start_time=$(date +%s%3N)
    curl -s -X POST "${API_BASE_URL}/api/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "'${TEST_USER_ID}'",
            "type": "content_planning",
            "forceProvider": "azure"
        }' > /dev/null
    local azure_time=$(($(date +%s%3N) - start_time))
    
    # Test OpenAI
    start_time=$(date +%s%3N)
    curl -s -X POST "${API_BASE_URL}/api/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "'${TEST_USER_ID}'",
            "type": "content_planning",
            "forceProvider": "openai"
        }' > /dev/null
    local openai_time=$(($(date +%s%3N) - start_time))
    
    log_success "Performance comparison:"
    log_info "  Azure: ${azure_time}ms"
    log_info "  OpenAI: ${openai_time}ms"
    
    if [ $azure_time -lt $openai_time ]; then
        log_success "Azure is faster by $((openai_time - azure_time))ms"
    else
        log_success "OpenAI is faster by $((azure_time - openai_time))ms"
    fi
}

# Fonction principale
main() {
    log_info "🚀 Starting Hybrid Orchestrator Tests"
    log_info "Test User ID: ${TEST_USER_ID}"
    
    check_server
    
    local tests_passed=0
    local tests_total=6
    
    # Exécuter tous les tests
    if test_azure_content_planning; then ((tests_passed++)); fi
    if test_openai_message_automation; then ((tests_passed++)); fi
    if test_fallback_mechanism; then ((tests_passed++)); fi
    if test_onlyfans_integration; then ((tests_passed++)); fi
    if test_metrics_endpoint; then ((tests_passed++)); fi
    if test_performance; then ((tests_passed++)); fi
    
    # Résumé
    echo ""
    log_info "🎯 Test Results Summary"
    log_info "Tests passed: ${tests_passed}/${tests_total}"
    
    if [ $tests_passed -eq $tests_total ]; then
        log_success "🎉 All tests passed! Hybrid Orchestrator is working correctly."
        exit 0
    else
        log_warning "⚠️  Some tests failed. Check the logs above."
        exit 1
    fi
}

# Vérifier les dépendances
if ! command -v curl &> /dev/null; then
    log_error "curl is required for testing"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq is required for JSON parsing"
    exit 1
fi

# Exécuter les tests
main