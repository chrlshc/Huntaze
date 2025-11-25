#!/bin/bash

###############################################################################
# Lighthouse Audit Script for Signup Page
#
# Runs Lighthouse performance audit on the signup page
# Generates HTML and JSON reports
# Checks against performance budget
#
# Requirements: 11.1, 11.5
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SIGNUP_URL="${SIGNUP_URL:-http://localhost:3000/signup}"
OUTPUT_DIR=".kiro/specs/signup-ux-optimization/lighthouse"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Performance budget thresholds
MIN_PERFORMANCE_SCORE=90
MAX_FCP=1500  # milliseconds
MAX_LCP=2500  # milliseconds
MAX_TTI=3500  # milliseconds

echo -e "${BLUE}🚀 Starting Lighthouse audit for signup page${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if Lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${RED}❌ Lighthouse is not installed${NC}"
    echo -e "${YELLOW}Installing Lighthouse globally...${NC}"
    npm install -g lighthouse
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}📊 Configuration:${NC}"
echo -e "  URL: $SIGNUP_URL"
echo -e "  Output: $OUTPUT_DIR"
echo -e "  Min Performance Score: $MIN_PERFORMANCE_SCORE"
echo -e "  Max FCP: ${MAX_FCP}ms"
echo -e "  Max LCP: ${MAX_LCP}ms"
echo -e "  Max TTI: ${MAX_TTI}ms"
echo -e ""

# Check if dev server is running
echo -e "${BLUE}🔍 Checking if dev server is running...${NC}"
if ! curl -s "$SIGNUP_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Dev server is not running at $SIGNUP_URL${NC}"
    echo -e "${YELLOW}Please start the dev server with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dev server is running${NC}\n"

# Run Lighthouse audit
echo -e "${BLUE}🔬 Running Lighthouse audit...${NC}"
echo -e "${YELLOW}This may take a minute...${NC}\n"

lighthouse "$SIGNUP_URL" \
  --output html \
  --output json \
  --output-path "$OUTPUT_DIR/report_$TIMESTAMP" \
  --only-categories=performance \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --quiet

# Parse JSON report
REPORT_JSON="$OUTPUT_DIR/report_$TIMESTAMP.report.json"
REPORT_HTML="$OUTPUT_DIR/report_$TIMESTAMP.report.html"

if [ ! -f "$REPORT_JSON" ]; then
    echo -e "${RED}❌ Failed to generate Lighthouse report${NC}"
    exit 1
fi

# Extract metrics using jq (if available) or grep
if command -v jq &> /dev/null; then
    PERFORMANCE_SCORE=$(jq -r '.categories.performance.score * 100' "$REPORT_JSON")
    FCP=$(jq -r '.audits["first-contentful-paint"].numericValue' "$REPORT_JSON")
    LCP=$(jq -r '.audits["largest-contentful-paint"].numericValue' "$REPORT_JSON")
    TTI=$(jq -r '.audits["interactive"].numericValue' "$REPORT_JSON")
    TBT=$(jq -r '.audits["total-blocking-time"].numericValue' "$REPORT_JSON")
    CLS=$(jq -r '.audits["cumulative-layout-shift"].numericValue' "$REPORT_JSON")
    SPEED_INDEX=$(jq -r '.audits["speed-index"].numericValue' "$REPORT_JSON")
else
    echo -e "${YELLOW}⚠️  jq not installed, using basic parsing${NC}"
    PERFORMANCE_SCORE=$(grep -o '"score":[0-9.]*' "$REPORT_JSON" | head -1 | cut -d: -f2 | awk '{print $1 * 100}')
fi

# Print results
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 LIGHTHOUSE AUDIT RESULTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Performance Score
echo -e "${BLUE}🎯 Performance Score:${NC}"
if (( $(echo "$PERFORMANCE_SCORE >= $MIN_PERFORMANCE_SCORE" | bc -l) )); then
    echo -e "  ${GREEN}✅ $PERFORMANCE_SCORE/100${NC} (Target: ≥$MIN_PERFORMANCE_SCORE)"
else
    echo -e "  ${RED}❌ $PERFORMANCE_SCORE/100${NC} (Target: ≥$MIN_PERFORMANCE_SCORE)"
fi
echo -e ""

# Core Web Vitals
echo -e "${BLUE}📈 Core Web Vitals:${NC}"

# FCP
if command -v jq &> /dev/null; then
    FCP_MS=$(echo "$FCP" | awk '{printf "%.0f", $1}')
    if (( $(echo "$FCP <= $MAX_FCP" | bc -l) )); then
        echo -e "  ${GREEN}✅ FCP: ${FCP_MS}ms${NC} (Target: ≤${MAX_FCP}ms)"
    else
        echo -e "  ${RED}❌ FCP: ${FCP_MS}ms${NC} (Target: ≤${MAX_FCP}ms)"
    fi
    
    # LCP
    LCP_MS=$(echo "$LCP" | awk '{printf "%.0f", $1}')
    if (( $(echo "$LCP <= $MAX_LCP" | bc -l) )); then
        echo -e "  ${GREEN}✅ LCP: ${LCP_MS}ms${NC} (Target: ≤${MAX_LCP}ms)"
    else
        echo -e "  ${RED}❌ LCP: ${LCP_MS}ms${NC} (Target: ≤${MAX_LCP}ms)"
    fi
    
    # TTI
    TTI_MS=$(echo "$TTI" | awk '{printf "%.0f", $1}')
    if (( $(echo "$TTI <= $MAX_TTI" | bc -l) )); then
        echo -e "  ${GREEN}✅ TTI: ${TTI_MS}ms${NC} (Target: ≤${MAX_TTI}ms)"
    else
        echo -e "  ${RED}❌ TTI: ${TTI_MS}ms${NC} (Target: ≤${MAX_TTI}ms)"
    fi
    
    # TBT
    TBT_MS=$(echo "$TBT" | awk '{printf "%.0f", $1}')
    echo -e "  ${BLUE}ℹ️  TBT: ${TBT_MS}ms${NC} (Target: ≤200ms)"
    
    # CLS
    CLS_VALUE=$(echo "$CLS" | awk '{printf "%.3f", $1}')
    if (( $(echo "$CLS <= 0.1" | bc -l) )); then
        echo -e "  ${GREEN}✅ CLS: ${CLS_VALUE}${NC} (Target: ≤0.1)"
    else
        echo -e "  ${RED}❌ CLS: ${CLS_VALUE}${NC} (Target: ≤0.1)"
    fi
    
    # Speed Index
    SI_MS=$(echo "$SPEED_INDEX" | awk '{printf "%.0f", $1}')
    echo -e "  ${BLUE}ℹ️  Speed Index: ${SI_MS}ms${NC}"
fi

echo -e ""

# Report location
echo -e "${BLUE}📄 Reports:${NC}"
echo -e "  HTML: ${GREEN}$REPORT_HTML${NC}"
echo -e "  JSON: ${GREEN}$REPORT_JSON${NC}"
echo -e ""

# Create symlink to latest report
ln -sf "$(basename "$REPORT_HTML")" "$OUTPUT_DIR/latest.html"
ln -sf "$(basename "$REPORT_JSON")" "$OUTPUT_DIR/latest.json"

echo -e "${BLUE}🔗 Latest report:${NC}"
echo -e "  ${GREEN}$OUTPUT_DIR/latest.html${NC}"
echo -e ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if (( $(echo "$PERFORMANCE_SCORE >= $MIN_PERFORMANCE_SCORE" | bc -l) )); then
    echo -e "${GREEN}✅ PASSED: Performance score meets target${NC}"
    exit 0
else
    echo -e "${RED}❌ FAILED: Performance score below target${NC}"
    echo -e "${YELLOW}💡 Review the HTML report for optimization suggestions${NC}"
    exit 1
fi
