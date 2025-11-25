#!/bin/bash

# Lighthouse Marketing Pages Audit Script
# Runs Lighthouse audits on all marketing pages and generates performance reports

set -e

echo "🔦 Starting Lighthouse Marketing Pages Audit..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
    echo "${YELLOW}Lighthouse CLI not found. Installing...${NC}"
    npm install -g lighthouse
fi

# Create output directory
OUTPUT_DIR=".kiro/reports/lighthouse"
mkdir -p "$OUTPUT_DIR"

# Base URL (can be overridden with environment variable)
BASE_URL="${LIGHTHOUSE_BASE_URL:-http://localhost:3000}"

# Marketing pages to audit
PAGES=(
    "/"
    "/features"
    "/pricing"
    "/about"
    "/case-studies"
    "/contact"
    "/roadmap"
    "/how-it-works"
    "/platforms"
    "/business"
    "/why-huntaze"
    "/use-cases"
)

# Page names for reports
PAGE_NAMES=(
    "homepage"
    "features"
    "pricing"
    "about"
    "case-studies"
    "contact"
    "roadmap"
    "how-it-works"
    "platforms"
    "business"
    "why-huntaze"
    "use-cases"
)

echo "📊 Running Lighthouse audits on ${#PAGES[@]} marketing pages..."
echo "🌐 Base URL: $BASE_URL"
echo ""

# Check if server is running
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
    echo "${RED}❌ Server is not running at $BASE_URL${NC}"
    echo "${YELLOW}Please start the server with: npm run dev or npm run start${NC}"
    exit 1
fi

echo "${GREEN}✓ Server is running${NC}"
echo ""

# Arrays to store results
declare -a PERFORMANCE_SCORES
declare -a FAILED_PAGES

# Run Lighthouse for each page
for i in "${!PAGES[@]}"; do
    PAGE="${PAGES[$i]}"
    PAGE_NAME="${PAGE_NAMES[$i]}"
    URL="$BASE_URL$PAGE"
    
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${YELLOW}Auditing: $PAGE_NAME${NC}"
    echo "URL: $URL"
    echo ""
    
    # Run Lighthouse
    lighthouse "$URL" \
        --output html \
        --output json \
        --output-path "$OUTPUT_DIR/$PAGE_NAME" \
        --preset desktop \
        --chrome-flags="--headless --no-sandbox --disable-gpu" \
        --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        2>&1 | grep -v "Chrome is being controlled" || true
    
    # Read performance score
    JSON_FILE="$OUTPUT_DIR/$PAGE_NAME.report.json"
    if [ -f "$JSON_FILE" ]; then
        PERF_SCORE=$(node -e "console.log(Math.round(require('$JSON_FILE').categories.performance.score * 100))")
        PERFORMANCE_SCORES+=("$PERF_SCORE")
        
        # Check if it meets threshold
        if [ "$PERF_SCORE" -lt 90 ]; then
            FAILED_PAGES+=("$PAGE_NAME: $PERF_SCORE")
            echo "${RED}✗ Performance: $PERF_SCORE/100 (BELOW THRESHOLD)${NC}"
        else
            echo "${GREEN}✓ Performance: $PERF_SCORE/100${NC}"
        fi
    else
        echo "${RED}✗ Failed to generate report${NC}"
        FAILED_PAGES+=("$PAGE_NAME: ERROR")
    fi
    
    echo ""
done

echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Calculate summary statistics
TOTAL_PAGES=${#PAGES[@]}
PASSED_PAGES=$((TOTAL_PAGES - ${#FAILED_PAGES[@]}))
AVG_SCORE=0

if [ ${#PERFORMANCE_SCORES[@]} -gt 0 ]; then
    SUM=0
    for score in "${PERFORMANCE_SCORES[@]}"; do
        SUM=$((SUM + score))
    done
    AVG_SCORE=$((SUM / ${#PERFORMANCE_SCORES[@]}))
fi

# Display summary
echo "${GREEN}✅ Audit Complete!${NC}"
echo ""
echo "📈 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total Pages Audited: $TOTAL_PAGES"
echo "  Pages Meeting Threshold (≥90): $PASSED_PAGES"
echo "  Pages Below Threshold: ${#FAILED_PAGES[@]}"
echo "  Average Performance Score: $AVG_SCORE/100"
echo ""

# Display failed pages if any
if [ ${#FAILED_PAGES[@]} -gt 0 ]; then
    echo "${RED}⚠️  Pages Below Performance Threshold:${NC}"
    for page in "${FAILED_PAGES[@]}"; do
        echo "  - $page"
    done
    echo ""
fi

# Display Core Web Vitals for key pages
echo "📊 Core Web Vitals (Key Pages):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for PAGE_NAME in "homepage" "features" "pricing"; do
    JSON_FILE="$OUTPUT_DIR/$PAGE_NAME.report.json"
    
    if [ -f "$JSON_FILE" ]; then
        echo ""
        echo "${YELLOW}$PAGE_NAME:${NC}"
        
        FCP=$(node -e "console.log((require('$JSON_FILE').audits['first-contentful-paint'].numericValue / 1000).toFixed(2))")
        LCP=$(node -e "console.log((require('$JSON_FILE').audits['largest-contentful-paint'].numericValue / 1000).toFixed(2))")
        CLS=$(node -e "console.log(require('$JSON_FILE').audits['cumulative-layout-shift'].numericValue.toFixed(3))")
        TBT=$(node -e "console.log(Math.round(require('$JSON_FILE').audits['total-blocking-time'].numericValue))")
        SI=$(node -e "console.log((require('$JSON_FILE').audits['speed-index'].numericValue / 1000).toFixed(2))")
        
        # Check thresholds and color code
        FCP_STATUS="${GREEN}✓${NC}"
        [ $(echo "$FCP > 2.0" | bc) -eq 1 ] && FCP_STATUS="${RED}✗${NC}"
        
        LCP_STATUS="${GREEN}✓${NC}"
        [ $(echo "$LCP > 2.5" | bc) -eq 1 ] && LCP_STATUS="${RED}✗${NC}"
        
        CLS_STATUS="${GREEN}✓${NC}"
        [ $(echo "$CLS > 0.1" | bc) -eq 1 ] && CLS_STATUS="${RED}✗${NC}"
        
        TBT_STATUS="${GREEN}✓${NC}"
        [ "$TBT" -gt 300 ] && TBT_STATUS="${YELLOW}⚠${NC}"
        
        echo -e "  FCP: ${FCP}s (target: <2s) $FCP_STATUS"
        echo -e "  LCP: ${LCP}s (target: <2.5s) $LCP_STATUS"
        echo -e "  CLS: $CLS (target: <0.1) $CLS_STATUS"
        echo -e "  TBT: ${TBT}ms (target: <300ms) $TBT_STATUS"
        echo -e "  Speed Index: ${SI}s"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Reports saved to: $OUTPUT_DIR/"
echo ""
echo "📖 View detailed reports:"
for i in "${!PAGE_NAMES[@]}"; do
    PAGE_NAME="${PAGE_NAMES[$i]}"
    echo "  - $PAGE_NAME: open $OUTPUT_DIR/$PAGE_NAME.report.html"
done
echo ""

# Exit with error if any pages failed
if [ ${#FAILED_PAGES[@]} -gt 0 ]; then
    echo "${RED}❌ Some pages did not meet the performance threshold of 90${NC}"
    echo "${YELLOW}Review the reports and optimize the failing pages${NC}"
    exit 1
else
    echo "${GREEN}✅ All pages meet the performance threshold!${NC}"
    exit 0
fi
