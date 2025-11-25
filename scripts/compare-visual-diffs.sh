#!/bin/bash

# Visual Diff Comparison Tool
# Helps developers review visual regression test failures

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Visual Regression Diff Viewer${NC}"
echo "================================"

# Check if test-results directory exists
if [ ! -d "test-results" ]; then
  echo -e "${YELLOW}No test results found.${NC}"
  echo "Run visual regression tests first: npm run test:visual"
  exit 0
fi

# Count failed tests
FAILED_COUNT=$(find test-results -name "*-diff.png" 2>/dev/null | wc -l | tr -d ' ')

if [ "$FAILED_COUNT" -eq 0 ]; then
  echo -e "${GREEN}No visual differences found!${NC}"
  echo "All screenshots match the baselines."
  exit 0
fi

echo -e "${YELLOW}Found $FAILED_COUNT visual difference(s)${NC}"
echo ""

# List all diffs
echo "Visual differences:"
find test-results -name "*-diff.png" | while read -r diff_file; do
  # Extract test name from path
  test_name=$(basename "$diff_file" | sed 's/-diff\.png$//')
  dir_name=$(dirname "$diff_file")
  
  echo -e "  ${RED}✗${NC} $test_name"
  
  # Check if actual and expected images exist
  actual_file="$dir_name/$test_name-actual.png"
  expected_file="$dir_name/$test_name-expected.png"
  
  if [ -f "$actual_file" ] && [ -f "$expected_file" ]; then
    echo "    Expected: $expected_file"
    echo "    Actual:   $actual_file"
    echo "    Diff:     $diff_file"
  fi
  echo ""
done

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the differences in the Playwright HTML report:"
echo -e "   ${GREEN}npm run test:visual:report${NC}"
echo ""
echo "2. If changes are intentional, update baselines:"
echo -e "   ${GREEN}npm run test:visual:update${NC}"
echo ""
echo "3. If changes are unintentional, fix the code and re-run tests:"
echo -e "   ${GREEN}npm run test:visual${NC}"
echo ""

# Offer to open the HTML report
read -p "Open HTML report now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run test:visual:report
fi
