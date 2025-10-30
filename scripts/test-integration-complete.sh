#!/bin/bash
# Test complet de l'intégration Legacy → Hybrid Orchestrator

echo "🧪 Testing Complete Integration: Legacy APIs → Hybrid Orchestrator"

BASE_URL="http://localhost:3000"

echo -e "\n=== 1. FEATURE FLAGS MANAGEMENT ==="

echo "1.1 Getting current feature flags..."
curl -X GET "$BASE_URL/api/admin/feature-flags" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n1.2 Checking hybrid-orchestrator flag for test user..."
curl -X POST "$BASE_URL/api/admin/feature-flags/check" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "feature": "hybrid-orchestrator"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n1.3 Enabling hybrid-orchestrator for 50% rollout..."
curl -X PUT "$BASE_URL/api/admin/feature-flags/hybrid-orchestrator" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "rolloutPercentage": 50
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 2. LEGACY API COMPATIBILITY ==="

echo "2.1 Testing legacy campaigns API..."
curl -X POST "$BASE_URL/api/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "action": "content_planning",
    "payload": {
      "theme": "fitness motivation",
      "platforms": ["instagram", "tiktok"]
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n2.2 Testing legacy content generation API..."
curl -X POST "$BASE_URL/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-456",
    "theme": "healthy lifestyle",
    "platform": "instagram",
    "content_type": "post",
    "target_audience": "young adults"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n2.3 Testing legacy message sending API..."
curl -X POST "$BASE_URL/api/messages/send" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-789",
    "recipient_id": "recipient-123",
    "content": "Welcome to my OnlyFans! 💕",
    "message_type": "welcome",
    "priority": "high"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 3. NEW HYBRID API ==="

echo "3.1 Testing new hybrid orchestrator API..."
curl -X POST "$BASE_URL/api/v2/campaigns/hybrid" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-hybrid",
    "type": "campaign_execution",
    "platforms": ["instagram", "tiktok", "onlyfans"],
    "sendToOnlyFans": true,
    "recipientId": "recipient-456",
    "requiresMultiPlatform": true,
    "data": {
      "theme": "summer vibes",
      "target_audience": "fitness enthusiasts"
    },
    "priority": "high"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n3.2 Testing hybrid orchestrator health check..."
curl -X GET "$BASE_URL/api/v2/campaigns/hybrid/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 4. FEATURE FLAG ACTIONS ==="

echo "4.1 Testing quick rollback action..."
curl -X POST "$BASE_URL/api/admin/feature-flags/hybrid-orchestrator/action" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "decrease",
    "value": 25
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n4.2 Getting updated feature flag state..."
curl -X GET "$BASE_URL/api/admin/feature-flags/hybrid-orchestrator" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 5. BACKWARD COMPATIBILITY VERIFICATION ==="

echo "5.1 Testing legacy campaigns GET..."
curl -X GET "$BASE_URL/api/campaigns?userId=test-user-123" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n5.2 Testing legacy messages GET..."
curl -X GET "$BASE_URL/api/messages/send?userId=test-user-789" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n✅ Complete Integration Tests Finished!"
echo "📊 Check the responses above to verify:"
echo "   - Feature flags are working"
echo "   - Legacy APIs route correctly"
echo "   - New hybrid API is functional"
echo "   - Backward compatibility is maintained"