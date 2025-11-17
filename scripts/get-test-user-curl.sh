#!/bin/bash
# Generate curl commands for testing with a test user

STAGING_URL="https://staging-new.d33l77zi1h78ce.amplifyapp.com"
TEST_EMAIL="test@huntaze.com"
TEST_PASSWORD="TestPassword123!"

echo "=== Huntaze Staging API Test Commands ==="
echo ""
echo "1. Register a new test user:"
echo ""
cat << 'EOF'
curl -X POST https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@huntaze.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
EOF

echo ""
echo ""
echo "2. Login and get session:"
echo ""
cat << 'EOF'
curl -X POST https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@huntaze.com",
    "password": "TestPassword123!"
  }' \
  -c cookies.txt -b cookies.txt
EOF

echo ""
echo ""
echo "3. Get current session (after login):"
echo ""
cat << 'EOF'
curl https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/auth/session \
  -b cookies.txt
EOF

echo ""
echo ""
echo "4. Test protected API endpoint (dashboard stats):"
echo ""
cat << 'EOF'
curl https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/dashboard/stats \
  -H "Content-Type: application/json" \
  -b cookies.txt
EOF

echo ""
echo ""
echo "5. Complete onboarding:"
echo ""
cat << 'EOF'
curl -X POST https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["instagram", "tiktok"],
    "goals": ["grow_audience", "monetize"]
  }' \
  -b cookies.txt
EOF

echo ""
echo ""
echo "6. Health check (no auth required):"
echo ""
cat << 'EOF'
curl https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/health
EOF

echo ""
echo ""
echo "=== Quick Test Sequence ==="
echo ""
echo "Run these commands in order:"
echo ""
echo "# 1. Register"
echo 'curl -X POST https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/auth/register -H "Content-Type: application/json" -d '"'"'{"email":"test@huntaze.com","password":"TestPassword123!","name":"Test User"}'"'"''
echo ""
echo "# 2. Login"
echo 'curl -X POST https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/auth/callback/credentials -H "Content-Type: application/json" -d '"'"'{"email":"test@huntaze.com","password":"TestPassword123!"}'"'"' -c cookies.txt -b cookies.txt'
echo ""
echo "# 3. Get session"
echo 'curl https://staging-new.d33l77zi1h78ce.amplifyapp.com/api/auth/session -b cookies.txt'
echo ""
