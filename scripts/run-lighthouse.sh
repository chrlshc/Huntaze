#!/bin/bash

# Lighthouse Performance Audit Script
# This script runs Lighthouse audits on key pages and generates reports

set -e

echo "🔦 Starting Lighthouse Performance Audit..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
    echo "${YELLOW}Lighthouse CLI not found. Installing...${NC}"
    npm install -g lighthouse
fi

# Create output directory
OUTPUT_DIR="lighthouse-reports"
mkdir -p "$OUTPUT_DIR"

# URLs to audit
URLS=(
    "http://localhost:3000/"
    "http://localhost:3000/auth/login"
    "http://localhost:3000/auth/register"
    "http://localhost:3000/home"
    "http://localhost:3000/integrations"
)

# Page names for reports
PAGES=(
    "landing"
    "login"
    "register"
    "home"
    "integrations"
)

echo "📊 Running Lighthouse audits on ${#URLS[@]} pages..."
echo ""

# Run Lighthouse for each URL
for i in "${!URLS[@]}"; do
    URL="${URLS[$i]}"
    PAGE="${PAGES[$i]}"
    
    echo "${YELLOW}Auditing: $PAGE ($URL)${NC}"
    
    lighthouse "$URL" \
        --output html \
        --output json \
        --output-path "$OUTPUT_DIR/$PAGE" \
        --preset desktop \
        --chrome-flags="--headless --no-sandbox --disable-gpu" \
        --quiet \
        --only-categories=performance,accessibility,best-practices,seo
    
    echo "${GREEN}✓ Completed: $PAGE${NC}"
    echo ""
done

echo ""
echo "${GREEN}✅ All audits completed!${NC}"
echo ""
echo "📁 Reports saved to: $OUTPUT_DIR/"
echo ""

# Parse and display Core Web Vitals
echo "📈 Core Web Vitals Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in "${!PAGES[@]}"; do
    PAGE="${PAGES[$i]}"
    JSON_FILE="$OUTPUT_DIR/$PAGE.report.json"
    
    if [ -f "$JSON_FILE" ]; then
        echo ""
        echo "${YELLOW}$PAGE:${NC}"
        
        # Extract metrics using jq if available
        if command -v jq &> /dev/null; then
            FCP=$(jq -r '.audits["first-contentful-paint"].numericValue' "$JSON_FILE")
            LCP=$(jq -r '.audits["largest-contentful-paint"].numericValue' "$JSON_FILE")
            CLS=$(jq -r '.audits["cumulative-layout-shift"].numericValue' "$JSON_FILE")
            TBT=$(jq -r '.audits["total-blocking-time"].numericValue' "$JSON_FILE")
            PERF_SCORE=$(jq -r '.categories.performance.score' "$JSON_FILE")
            
            # Convert to seconds
            FCP_SEC=$(echo "scale=2; $FCP / 1000" | bc)
            LCP_SEC=$(echo "scale=2; $LCP / 1000" | bc)
            
            # Check against targets
            FCP_STATUS="${GREEN}✓${NC}"
            [ $(echo "$FCP > 1500" | bc) -eq 1 ] && FCP_STATUS="${RED}✗${NC}"
            
            LCP_STATUS="${GREEN}✓${NC}"
            [ $(echo "$LCP > 2500" | bc) -eq 1 ] && LCP_STATUS="${RED}✗${NC}"
            
            CLS_STATUS="${GREEN}✓${NC}"
            [ $(echo "$CLS > 0.1" | bc) -eq 1 ] && CLS_STATUS="${RED}✗${NC}"
            
            TBT_STATUS="${GREEN}✓${NC}"
            [ $(echo "$TBT > 300" | bc) -eq 1 ] && TBT_STATUS="${YELLOW}⚠${NC}"
            
            echo -e "  FCP: ${FCP_SEC}s (target: <1.5s) $FCP_STATUS"
            echo -e "  LCP: ${LCP_SEC}s (target: <2.5s) $LCP_STATUS"
            echo -e "  CLS: $CLS (target: <0.1) $CLS_STATUS"
            echo -e "  TBT: ${TBT}ms (target: <300ms) $TBT_STATUS"
            echo -e "  Performance Score: $(echo "scale=0; $PERF_SCORE * 100" | bc)/100"
        else
            echo "  (Install jq for detailed metrics: brew install jq)"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 View detailed reports:"
for i in "${!PAGES[@]}"; do
    PAGE="${PAGES[$i]}"
    echo "  - $PAGE: open $OUTPUT_DIR/$PAGE.report.html"
done
echo ""
