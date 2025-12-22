#!/bin/bash

# Content Trends AI Integration - Quick Deployment
# Integrates Content Trends with existing AI infrastructure

set -e

echo "🚀 Integrating Content Trends AI with existing system..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if AI Router is running
check_ai_router() {
    log_info "Checking AI Router status..."
    
    if curl -s "${AI_ROUTER_URL:-http://localhost:8000}/health" > /dev/null; then
        log_info "AI Router is running ✓"
    else
        log_warn "AI Router not accessible. Make sure it's running."
        log_info "Start with: npm run start:router"
    fi
}

# Update environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Add Content Trends specific variables to .env.local if not present
    if ! grep -q "CONTENT_TRENDS_ENABLED" .env.local 2>/dev/null; then
        echo "" >> .env.local
        echo "# Content Trends AI Configuration" >> .env.local
        echo "CONTENT_TRENDS_ENABLED=true" >> .env.local
        echo "CONTENT_TRENDS_REDIS_URL=\${REDIS_URL}" >> .env.local
        log_info "Environment variables added ✓"
    else
        log_info "Environment variables already configured ✓"
    fi
}

# Install dependencies if needed
install_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if Content Trends dependencies are installed
    if npm list @azure/storage-blob > /dev/null 2>&1; then
        log_info "Azure dependencies already installed ✓"
    else
        log_info "Installing Azure dependencies..."
        npm install @azure/storage-blob @azure/identity
    fi
}

# Test the integration
test_integration() {
    log_info "Testing Content Trends integration..."
    
    # Test API endpoint
    if curl -s -X POST "http://localhost:3000/api/ai/content-trends/analyze" \
        -H "Content-Type: application/json" \
        -d '{"analysisType":"trend_detection","platform":"tiktok"}' > /dev/null; then
        log_info "API endpoint accessible ✓"
    else
        log_warn "API endpoint test failed. Make sure the app is running."
    fi
}

# Main integration flow
main() {
    log_info "Content Trends AI Integration"
    log_info "============================="
    
    check_ai_router
    setup_environment
    install_dependencies
    
    log_info ""
    log_info "🎉 Content Trends AI integrated successfully!"
    log_info ""
    log_info "Available endpoints:"
    log_info "• POST /api/ai/content-trends/analyze - Viral analysis"
    log_info "• POST /api/ai/content-trends/recommendations - Content recommendations"  
    log_info "• GET /api/ai/content-trends/trends - Trending content"
    log_info ""
    log_info "Access the dashboard at: /content-trends"
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure Azure AI Foundry credentials"
    log_info "2. Set up Redis for queue management"
    log_info "3. Test the Content Trends dashboard"
    
    test_integration
}

# Run main function
main "$@"