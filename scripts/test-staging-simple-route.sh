#!/bin/bash

echo "🧪 Testing simple API route on staging..."
echo ""

echo "1️⃣ Testing /api/test-env (should work if API routes are functional)"
curl -s https://staging.huntaze.com/api/test-env | jq '.'

echo ""
echo ""
echo "2️⃣ Testing /api/auth/signin (NextAuth - currently failing)"
curl -I https://staging.huntaze.com/api/auth/signin

echo ""
echo "📊 Analysis:"
echo "- If /api/test-env returns 200 with JSON → API routes work, problem is NextAuth v4"
echo "- If /api/test-env returns 500 → General API route problem on Amplify"
