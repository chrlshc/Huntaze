#!/bin/bash

echo "🧪 Testing NextAuth endpoints directly..."
echo ""

echo "1️⃣ Testing GET /api/auth/providers"
curl -s https://staging.huntaze.com/api/auth/providers | jq '.' || echo "Failed"
echo ""
echo ""

echo "2️⃣ Testing GET /api/auth/csrf"
curl -s https://staging.huntaze.com/api/auth/csrf | jq '.' || echo "Failed"
echo ""
echo ""

echo "3️⃣ Testing GET /api/auth/session"
curl -s https://staging.huntaze.com/api/auth/session | jq '.' || echo "Failed"
echo ""
echo ""

echo "4️⃣ Testing GET /api/auth/signin (HTML page)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://staging.huntaze.com/api/auth/signin)
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Sign-in page accessible"
else
  echo "❌ Sign-in page returned $HTTP_CODE"
fi
echo ""

echo "5️⃣ Checking environment variables are set"
echo "Testing if NEXTAUTH_URL is accessible..."
curl -s https://staging.huntaze.com/api/health 2>&1 | head -5
