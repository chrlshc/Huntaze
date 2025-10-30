#!/bin/bash
# Test de l'API Hybrid Orchestrator en production

echo "🧪 Testing Huntaze Hybrid Orchestrator API"

# Test Health Check
echo "1. Testing Health Check..."
curl -X GET http://localhost:3000/api/v2/campaigns/hybrid/health \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo -e "\n2. Testing Content Planning Workflow..."
curl -X POST http://localhost:3000/api/v2/campaigns/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "type": "content_planning",
    "platforms": ["instagram", "tiktok"],
    "contentType": "post",
    "data": {
      "theme": "fitness motivation",
      "target_audience": "young adults"
    },
    "priority": "medium"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo -e "\n3. Testing Message Generation with OnlyFans..."
curl -X POST http://localhost:3000/api/v2/campaigns/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-456",
    "type": "message_generation",
    "sendToOnlyFans": true,
    "recipientId": "recipient-789",
    "data": {
      "message_type": "welcome",
      "personalization": "high"
    },
    "priority": "high"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo -e "\n✅ API Tests completed!"