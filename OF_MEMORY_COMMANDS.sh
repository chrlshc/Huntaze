#!/bin/bash

# OnlyFans AI Memory API - Commands Quick Reference
# Usage: bash OF_MEMORY_COMMANDS.sh [command]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 OnlyFans AI Memory API - Commands"
echo "===================================="
echo ""

# Function to show usage
show_usage() {
  echo "Usage: bash OF_MEMORY_COMMANDS.sh [command]"
  echo ""
  echo "Commands:"
  echo "  build          - Build the application"
  echo "  test           - Run integration tests"
  echo "  test-unit      - Run unit tests"
  echo "  test-all       - Run all tests"
  echo "  dev            - Start development server"
  echo "  diagnostics    - Check TypeScript diagnostics"
  echo "  stats          - Show circuit breaker stats"
  echo "  docs           - Open documentation"
  echo "  validate       - Validate implementation"
  echo "  deploy-staging - Deploy to staging"
  echo "  help           - Show this help"
  echo ""
}

# Build
build() {
  echo -e "${YELLOW}📦 Building application...${NC}"
  npm run build
  echo -e "${GREEN}✅ Build complete${NC}"
}

# Run integration tests
test_integration() {
  echo -e "${YELLOW}🧪 Running integration tests...${NC}"
  npm run test:integration tests/integration/api/of-memory.test.ts
  echo -e "${GREEN}✅ Integration tests complete${NC}"
}

# Run unit tests
test_unit() {
  echo -e "${YELLOW}🧪 Running unit tests...${NC}"
  npm run test:unit tests/unit/of-memory/
  echo -e "${GREEN}✅ Unit tests complete${NC}"
}

# Run all tests
test_all() {
  echo -e "${YELLOW}🧪 Running all tests...${NC}"
  test_unit
  test_integration
  echo -e "${GREEN}✅ All tests complete${NC}"
}

# Start dev server
dev() {
  echo -e "${YELLOW}🚀 Starting development server...${NC}"
  npm run dev
}

# Check TypeScript diagnostics
diagnostics() {
  echo -e "${YELLOW}🔍 Checking TypeScript diagnostics...${NC}"
  npx tsc --noEmit --project tsconfig.json
  echo -e "${GREEN}✅ No TypeScript errors${NC}"
}

# Show circuit breaker stats
stats() {
  echo -e "${YELLOW}📊 Circuit Breaker Statistics${NC}"
  echo ""
  echo "To get stats, run in Node.js:"
  echo ""
  echo "  import { userMemoryService } from '@/lib/of-memory/services/user-memory-service';"
  echo "  const stats = userMemoryService.getCircuitBreakerStats();"
  echo "  console.log(stats);"
  echo ""
  echo "Or via API:"
  echo "  curl http://localhost:3000/api/of-memory/stats"
  echo ""
}

# Open documentation
docs() {
  echo -e "${YELLOW}📚 Opening documentation...${NC}"
  echo ""
  echo "Documentation files:"
  echo "  1. Quick Start (FR):     OF_MEMORY_RESUME_FR.md"
  echo "  2. Quick Start (EN):     OF_MEMORY_QUICK_START.md"
  echo "  3. Integration Guide:    docs/api/of-memory-api-integration-guide.md"
  echo "  4. Visual Guide:         OF_MEMORY_CIRCUIT_BREAKER_VISUAL.md"
  echo "  5. Index:                OF_MEMORY_API_INDEX.md"
  echo ""
  echo "Opening index..."
  open OF_MEMORY_API_INDEX.md 2>/dev/null || cat OF_MEMORY_API_INDEX.md
}

# Validate implementation
validate() {
  echo -e "${YELLOW}✅ Validating implementation...${NC}"
  echo ""
  
  # Check files exist
  echo "📁 Checking files..."
  FILES=(
    "lib/of-memory/services/user-memory-service.ts"
    "lib/of-memory/utils/circuit-breaker.ts"
    "lib/of-memory/types.ts"
    "lib/of-memory/interfaces.ts"
    "docs/api/of-memory-api-integration-guide.md"
    "tests/integration/api/of-memory.test.ts"
  )
  
  for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
      echo -e "  ${GREEN}✅${NC} $file"
    else
      echo -e "  ${RED}❌${NC} $file (missing)"
    fi
  done
  echo ""
  
  # Check TypeScript compilation
  echo "🔍 Checking TypeScript compilation..."
  if npx tsc --noEmit --project tsconfig.json 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} No TypeScript errors"
  else
    echo -e "  ${RED}❌${NC} TypeScript errors found"
  fi
  echo ""
  
  # Check circuit breaker integration
  echo "🛡️ Checking circuit breaker integration..."
  if grep -q "circuitBreakerRegistry" lib/of-memory/services/user-memory-service.ts; then
    echo -e "  ${GREEN}✅${NC} Circuit breaker imported"
  else
    echo -e "  ${RED}❌${NC} Circuit breaker not imported"
  fi
  
  if grep -q "withDatabaseCircuitBreaker" lib/of-memory/services/user-memory-service.ts; then
    echo -e "  ${GREEN}✅${NC} Database circuit breaker used"
  else
    echo -e "  ${RED}❌${NC} Database circuit breaker not used"
  fi
  
  if grep -q "withCacheCircuitBreaker" lib/of-memory/services/user-memory-service.ts; then
    echo -e "  ${GREEN}✅${NC} Cache circuit breaker used"
  else
    echo -e "  ${RED}❌${NC} Cache circuit breaker not used"
  fi
  echo ""
  
  # Check documentation
  echo "📚 Checking documentation..."
  DOC_COUNT=$(ls OF_MEMORY_*.md 2>/dev/null | wc -l | tr -d ' ')
  echo -e "  ${GREEN}✅${NC} $DOC_COUNT documentation files created"
  echo ""
  
  echo -e "${GREEN}✅ Validation complete${NC}"
}

# Deploy to staging
deploy_staging() {
  echo -e "${YELLOW}🚀 Deploying to staging...${NC}"
  echo ""
  echo "Steps:"
  echo "  1. Build application"
  echo "  2. Run tests"
  echo "  3. Deploy to staging"
  echo "  4. Run smoke tests"
  echo ""
  
  read -p "Continue? (y/n) " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    build
    test_all
    echo -e "${YELLOW}Deploying...${NC}"
    npm run deploy:staging
    echo -e "${GREEN}✅ Deployed to staging${NC}"
  else
    echo "Deployment cancelled"
  fi
}

# Main command router
case "${1:-help}" in
  build)
    build
    ;;
  test)
    test_integration
    ;;
  test-unit)
    test_unit
    ;;
  test-all)
    test_all
    ;;
  dev)
    dev
    ;;
  diagnostics)
    diagnostics
    ;;
  stats)
    stats
    ;;
  docs)
    docs
    ;;
  validate)
    validate
    ;;
  deploy-staging)
    deploy_staging
    ;;
  help|*)
    show_usage
    ;;
esac
