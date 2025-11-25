#!/bin/bash

# Visual Regression Testing Script
# This script runs visual regression tests and manages baseline screenshots

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
MODE="test"
UPDATE_BASELINES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --update-baselines)
      UPDATE_BASELINES=true
      shift
      ;;
    --headed)
      HEADED="--headed"
      shift
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    --ui)
      UI="--ui"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--update-baselines] [--headed] [--debug] [--ui]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}Visual Regression Testing${NC}"
echo "================================"

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${YELLOW}Warning: Dev server not detected at http://localhost:3000${NC}"
  echo "Starting dev server..."
  npm run dev &
  DEV_SERVER_PID=$!
  
  # Wait for server to be ready
  echo "Waiting for dev server to start..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo -e "${GREEN}Dev server is ready!${NC}"
      break
    fi
    sleep 2
  done
  
  if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}Failed to start dev server${NC}"
    exit 1
  fi
fi

# Run visual regression tests
if [ "$UPDATE_BASELINES" = true ]; then
  echo -e "${YELLOW}Updating baseline screenshots...${NC}"
  npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots $HEADED $DEBUG $UI
  echo -e "${GREEN}Baselines updated successfully!${NC}"
else
  echo -e "${GREEN}Running visual regression tests...${NC}"
  npx playwright test tests/e2e/visual-regression.spec.ts $HEADED $DEBUG $UI
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}All visual regression tests passed!${NC}"
  else
    echo -e "${RED}Visual regression tests failed!${NC}"
    echo "To update baselines, run: $0 --update-baselines"
    exit 1
  fi
fi

# Kill dev server if we started it
if [ ! -z "$DEV_SERVER_PID" ]; then
  echo "Stopping dev server..."
  kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo -e "${GREEN}Visual regression testing complete!${NC}"
