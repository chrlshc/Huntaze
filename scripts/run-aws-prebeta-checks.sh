#!/usr/bin/env bash
set -euo pipefail

if ! command -v aws >/dev/null; then
  echo "aws CLI is required" >&2
  exit 1
fi

API_URL=${API_URL:-"https://api.huntaze.com"}
API_KEY=${API_KEY:-}
LAMBDA_NAME=${LAMBDA_NAME:-smart-route}
USERS_TABLE=${USERS_TABLE:-USERS_TABLE}
PROFILE=${PROFILE:-huntaze}

log_section() {
  echo
  echo "===================="
  echo "  $1"
  echo "===================="
}

log_section "📡 API Gateway Rate Limiting"
if [[ -z "$API_KEY" ]]; then
  echo "⚠️  API_KEY environment variable not set, skipping rate limit stress test" >&2
else
  RATE_TEST_LOG="rate-limit-$(date +%s).log"
  for i in $(seq 1 150); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: $API_KEY" "$API_URL/chat/smart-route" || true)
    printf "#%03d -> %s\n" "$i" "$HTTP_CODE" | tee -a "$RATE_TEST_LOG"
    sleep 0.2
  done
  echo "Results stored in $RATE_TEST_LOG"
fi

log_section "⚡ Lambda cold start"
aws lambda invoke \
  --profile "$PROFILE" \
  --function-name "$LAMBDA_NAME" \
  --payload '{}' \
  "/tmp/${LAMBDA_NAME}-response.json" >/tmp/${LAMBDA_NAME}-invoke.log
cat "/tmp/${LAMBDA_NAME}-invoke.log"

log_section "📊 DynamoDB autoscaling"
for i in $(seq 1 50); do
  aws dynamodb put-item \
    --profile "$PROFILE" \
    --table-name "$USERS_TABLE" \
    --item "{\"userId\": {\"S\": \"prebeta-$i\"}}" \
    --return-consumed-capacity TOTAL >> "/tmp/dynamodb-put.log"
  sleep 0.1
done

log_section "☁️ CloudWatch custom metric check"
START_TIME=$(python3 - <<'PY'
import datetime
now = datetime.datetime.utcnow()
print((now - datetime.timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ'))
PY
)

END_TIME=$(python3 - <<'PY'
import datetime
print(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
PY
)

aws cloudwatch get-metric-statistics \
  --profile "$PROFILE" \
  --namespace Huntaze/Auth \
  --metric-name APIErrors \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 300 \
  --statistics Average,Sum

log_section "✅ Completed pre-beta validation commands"
