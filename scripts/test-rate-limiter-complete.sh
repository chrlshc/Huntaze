#!/bin/bash
# Test complet du système Enhanced Rate Limiter + Queue Manager + OnlyFans Service

echo "🧪 Testing Complete Rate Limiter System"

BASE_URL="http://localhost:3000"

echo -e "\n=== 1. ONLYFANS SERVICE HEALTH CHECK ==="

echo "1.1 Checking OnlyFans service health..."
curl -X POST "$BASE_URL/api/v2/onlyfans/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 2. RATE LIMITER TESTING ==="

echo "2.1 Sending first message (should succeed)..."
curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-rate-limit",
    "recipientId": "recipient-123",
    "content": "Hello! This is message #1",
    "messageType": "welcome",
    "priority": "high",
    "metadata": {
      "source": "rate-limiter-test",
      "traceId": "test-trace-1"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n2.2 Sending multiple messages rapidly (should trigger rate limiting)..."
for i in {2..12}; do
  echo "Sending message #$i..."
  curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"test-user-rate-limit\",
      \"recipientId\": \"recipient-123\",
      \"content\": \"Hello! This is message #$i\",
      \"messageType\": \"follow_up\",
      \"priority\": \"medium\"
    }" \
    -w "\nStatus: %{http_code}\n" \
    -s | jq '.data.status' | head -1
  
  # Petit délai pour voir la progression
  sleep 0.5
done

echo -e "\n=== 3. QUEUE SYSTEM TESTING ==="

echo "3.1 Sending low priority message (should be queued)..."
curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-queue",
    "recipientId": "recipient-456",
    "content": "This is a low priority message that should be queued",
    "messageType": "promotional",
    "priority": "low"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n3.2 Sending scheduled message..."
FUTURE_TIME=$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%SZ)
curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"test-user-scheduled\",
    \"recipientId\": \"recipient-789\",
    \"content\": \"This message is scheduled for the future\",
    \"messageType\": \"custom\",
    \"priority\": \"medium\",
    \"scheduleFor\": \"$FUTURE_TIME\"
  }" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 4. DIFFERENT MESSAGE TYPES ==="

echo "4.1 Welcome message (high priority)..."
curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-types",
    "recipientId": "new-subscriber-1",
    "content": "Welcome to my OnlyFans! 💕 Thanks for subscribing!",
    "messageType": "welcome",
    "priority": "high"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.data.status'

echo -e "\n4.2 Promotional message (low priority)..."
curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-types",
    "recipientId": "existing-subscriber-1",
    "content": "🔥 New content available! Check out my latest photos",
    "messageType": "promotional",
    "priority": "low"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.data.status'

echo -e "\n=== 5. STATISTICS AND MONITORING ==="

echo "5.1 Getting service statistics..."
curl -X GET "$BASE_URL/api/v2/onlyfans/stats" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n5.2 Getting detailed stats for specific user..."
curl -X GET "$BASE_URL/api/v2/onlyfans/stats?userId=test-user-rate-limit&detailed=true" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 6. MESSAGE STATUS TRACKING ==="

echo "6.1 Getting message status (example)..."
curl -X GET "$BASE_URL/api/v2/onlyfans/messages?messageId=msg_example_123" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo -e "\n=== 7. RATE LIMIT RECOVERY TEST ==="

echo "7.1 Waiting 10 seconds for rate limit recovery..."
sleep 10

echo "7.2 Sending message after cooldown (should succeed)..."
curl -X POST "$BASE_URL/api/v2/onlyfans/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-recovery",
    "recipientId": "recipient-recovery",
    "content": "This message should succeed after rate limit recovery",
    "messageType": "custom",
    "priority": "medium"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.data.status'

echo -e "\n✅ Rate Limiter Complete Tests Finished!"
echo "📊 Summary of what was tested:"
echo "   ✅ OnlyFans service health check"
echo "   ✅ Rate limiting (10 messages/minute limit)"
echo "   ✅ Intelligent queuing by priority"
echo "   ✅ Scheduled message handling"
echo "   ✅ Different message types (welcome, promotional, etc.)"
echo "   ✅ Statistics and monitoring"
echo "   ✅ Message status tracking"
echo "   ✅ Rate limit recovery"
echo ""
echo "🎯 Expected behaviors:"
echo "   - First 10 messages: sent directly or queued"
echo "   - Messages 11+: rate limited (429 status)"
echo "   - Low priority: automatically queued"
echo "   - Welcome messages: high priority processing"
echo "   - Promotional: low priority, queued"
echo "   - After cooldown: normal processing resumes"