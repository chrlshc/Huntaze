#!/bin/bash
# Test script pour le OF Scraper Worker sur AWS ECS
# Usage: ./scripts/test-of-scraper-aws.sh "tes_cookies_ici"

WORKER_URL="http://of-scraper-alb-65094958.us-east-2.elb.amazonaws.com"

echo "🔍 Test OF Scraper Worker AWS"
echo "=============================="
echo ""

# Test 1: Health check
echo "1️⃣ Health Check..."
curl -s "$WORKER_URL/health" | jq .
echo ""

# Test 2: Root endpoint
echo "2️⃣ Service Info..."
curl -s "$WORKER_URL/" | jq .
echo ""

# Test 3: Scrape endpoint (requires cookies)
if [ -n "$1" ]; then
    echo "3️⃣ Test Scrape /api2/v2/users/me..."
    echo "   (Ceci peut prendre 30-60 secondes car Playwright démarre un navigateur)"
    echo ""
    
    curl -s -X POST "$WORKER_URL/scrape" \
        -H "Content-Type: application/json" \
        -d "{
            \"cookies\": \"$1\",
            \"endpoint\": \"/api2/v2/users/me\"
        }" | jq .
else
    echo "3️⃣ Scrape Test: SKIPPED"
    echo "   Pour tester le scraping, lance avec tes cookies OnlyFans:"
    echo ""
    echo "   ./scripts/test-of-scraper-aws.sh 'sess=xxx; auth_id=xxx; ...'"
    echo ""
    echo "   Tu peux récupérer les cookies depuis:"
    echo "   - DevTools > Application > Cookies > onlyfans.com"
    echo "   - Copie tous les cookies en format: name1=value1; name2=value2; ..."
fi

echo ""
echo "✅ Test terminé!"
