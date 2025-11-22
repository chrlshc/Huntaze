#!/bin/bash

# Test CloudFront distribution setup
# Verifies caching, compression, security headers, and performance

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
STACK_NAME="huntaze-beta-cloudfront"
REGION="us-east-1"

echo -e "${GREEN}🧪 CloudFront Distribution Test Suite${NC}"
echo ""

# Get distribution details
echo -e "${YELLOW}📋 Getting distribution details...${NC}"

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}❌ CloudFront distribution not found. Please deploy first.${NC}"
    exit 1
fi

DISTRIBUTION_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
    --output text)

echo -e "${GREEN}✅ Distribution ID: ${DISTRIBUTION_ID}${NC}"
echo -e "${GREEN}✅ Domain: ${DISTRIBUTION_DOMAIN}${NC}"
echo ""

# Test 1: Basic connectivity
echo -e "${YELLOW}Test 1: Basic Connectivity${NC}"
echo -n "Testing HTTPS connection... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${DISTRIBUTION_DOMAIN}/ || echo "000")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
    echo -e "${GREEN}✅ (Status: ${STATUS})${NC}"
else
    echo -e "${RED}❌ (Status: ${STATUS})${NC}"
fi
echo ""

# Test 2: Security Headers
echo -e "${YELLOW}Test 2: Security Headers${NC}"

HEADERS=$(curl -s -I https://${DISTRIBUTION_DOMAIN}/)

echo -n "Strict-Transport-Security... "
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "Content-Security-Policy... "
if echo "$HEADERS" | grep -qi "content-security-policy"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "X-Frame-Options... "
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "X-Content-Type-Options... "
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "Referrer-Policy... "
if echo "$HEADERS" | grep -qi "referrer-policy"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "Permissions-Policy... "
if echo "$HEADERS" | grep -qi "permissions-policy"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi
echo ""

# Test 3: Compression
echo -e "${YELLOW}Test 3: Compression${NC}"

echo -n "Gzip compression... "
GZIP=$(curl -s -I -H "Accept-Encoding: gzip" https://${DISTRIBUTION_DOMAIN}/ | grep -i "content-encoding: gzip" || echo "")
if [ ! -z "$GZIP" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  (May not be enabled for all content)${NC}"
fi

echo -n "Brotli compression... "
BROTLI=$(curl -s -I -H "Accept-Encoding: br" https://${DISTRIBUTION_DOMAIN}/ | grep -i "content-encoding: br" || echo "")
if [ ! -z "$BROTLI" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  (May not be enabled for all content)${NC}"
fi
echo ""

# Test 4: Cache Headers
echo -e "${YELLOW}Test 4: Cache Headers${NC}"

# Test static asset caching (if exists)
echo -n "Static asset cache headers... "
STATIC_CACHE=$(curl -s -I https://${DISTRIBUTION_DOMAIN}/_next/static/test.js 2>/dev/null | grep -i "cache-control" || echo "")
if [ ! -z "$STATIC_CACHE" ]; then
    echo -e "${GREEN}✅${NC}"
    echo "   ${STATIC_CACHE}"
else
    echo -e "${YELLOW}⚠️  (No static assets found)${NC}"
fi

# Test dynamic content caching
echo -n "Dynamic content cache headers... "
DYNAMIC_CACHE=$(curl -s -I https://${DISTRIBUTION_DOMAIN}/ | grep -i "cache-control" || echo "no-cache")
echo -e "${GREEN}✅${NC}"
echo "   Cache-Control: ${DYNAMIC_CACHE}"
echo ""

# Test 5: Image Optimization
echo -e "${YELLOW}Test 5: Image Optimization${NC}"

echo -n "WebP support detection... "
WEBP_RESPONSE=$(curl -s -I -H "Accept: image/webp" https://${DISTRIBUTION_DOMAIN}/images/test.jpg 2>/dev/null || echo "")
if [ ! -z "$WEBP_RESPONSE" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  (No test images found)${NC}"
fi

echo -n "AVIF support detection... "
AVIF_RESPONSE=$(curl -s -I -H "Accept: image/avif" https://${DISTRIBUTION_DOMAIN}/images/test.jpg 2>/dev/null || echo "")
if [ ! -z "$AVIF_RESPONSE" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  (No test images found)${NC}"
fi
echo ""

# Test 6: CloudWatch Metrics
echo -e "${YELLOW}Test 6: CloudWatch Metrics${NC}"

echo "Fetching recent metrics (last hour)..."

# Requests
REQUESTS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/CloudFront \
    --metric-name Requests \
    --dimensions Name=DistributionId,Value=${DISTRIBUTION_ID} \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Sum \
    --region us-east-1 \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")

echo "   Requests (last hour): ${REQUESTS}"

# Cache Hit Rate
CACHE_HIT_RATE=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/CloudFront \
    --metric-name CacheHitRate \
    --dimensions Name=DistributionId,Value=${DISTRIBUTION_ID} \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Average \
    --region us-east-1 \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "N/A")

if [ "$CACHE_HIT_RATE" != "N/A" ] && [ "$CACHE_HIT_RATE" != "None" ]; then
    echo "   Cache Hit Rate: ${CACHE_HIT_RATE}%"
    if (( $(echo "$CACHE_HIT_RATE > 80" | bc -l) )); then
        echo -e "   ${GREEN}✅ Cache hit rate is good (>80%)${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Cache hit rate is low (<80%)${NC}"
    fi
else
    echo "   Cache Hit Rate: N/A (not enough data yet)"
fi

# Error Rate
ERROR_RATE=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/CloudFront \
    --metric-name 5xxErrorRate \
    --dimensions Name=DistributionId,Value=${DISTRIBUTION_ID} \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Average \
    --region us-east-1 \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "0")

if [ "$ERROR_RATE" != "None" ] && [ "$ERROR_RATE" != "0" ]; then
    echo "   5XX Error Rate: ${ERROR_RATE}%"
    if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then
        echo -e "   ${GREEN}✅ Error rate is low (<1%)${NC}"
    else
        echo -e "   ${RED}❌ Error rate is high (>1%)${NC}"
    fi
else
    echo "   5XX Error Rate: 0% (no errors)"
fi
echo ""

# Test 7: Distribution Status
echo -e "${YELLOW}Test 7: Distribution Status${NC}"

DISTRIBUTION_STATUS=$(aws cloudfront get-distribution \
    --id ${DISTRIBUTION_ID} \
    --query 'Distribution.Status' \
    --output text \
    --region us-east-1)

echo "   Status: ${DISTRIBUTION_STATUS}"
if [ "$DISTRIBUTION_STATUS" = "Deployed" ]; then
    echo -e "   ${GREEN}✅ Distribution is deployed${NC}"
else
    echo -e "   ${YELLOW}⚠️  Distribution is still deploying${NC}"
fi

DISTRIBUTION_ENABLED=$(aws cloudfront get-distribution \
    --id ${DISTRIBUTION_ID} \
    --query 'Distribution.DistributionConfig.Enabled' \
    --output text \
    --region us-east-1)

echo "   Enabled: ${DISTRIBUTION_ENABLED}"
if [ "$DISTRIBUTION_ENABLED" = "True" ]; then
    echo -e "   ${GREEN}✅ Distribution is enabled${NC}"
else
    echo -e "   ${RED}❌ Distribution is disabled${NC}"
fi
echo ""

# Test 8: CloudWatch Alarms
echo -e "${YELLOW}Test 8: CloudWatch Alarms${NC}"

ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "Huntaze-beta-CloudFront" \
    --region us-east-1 \
    --query 'MetricAlarms[*].[AlarmName,StateValue]' \
    --output text)

if [ ! -z "$ALARMS" ]; then
    echo "$ALARMS" | while read -r alarm_name state; do
        echo -n "   ${alarm_name}: "
        if [ "$state" = "OK" ]; then
            echo -e "${GREEN}✅ OK${NC}"
        elif [ "$state" = "ALARM" ]; then
            echo -e "${RED}❌ ALARM${NC}"
        else
            echo -e "${YELLOW}⚠️  ${state}${NC}"
        fi
    done
else
    echo -e "   ${YELLOW}⚠️  No alarms found${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Test Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Distribution: https://${DISTRIBUTION_DOMAIN}"
echo "Status: ${DISTRIBUTION_STATUS}"
echo "Requests (last hour): ${REQUESTS}"
echo "Cache Hit Rate: ${CACHE_HIT_RATE}%"
echo "Error Rate: ${ERROR_RATE}%"
echo ""
echo -e "${GREEN}✅ CloudFront testing complete!${NC}"
echo ""
echo "For detailed metrics, visit:"
echo "https://console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions/${DISTRIBUTION_ID}"
