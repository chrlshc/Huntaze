# Verify CloudWatch EMF metrics

This guide helps verify that `withMonitoring` publishes EMF metrics and that they appear in CloudWatch under the expected namespace and dimensions.

## Prerequisites
- AWS CLI v2 configured with credentials that can read CloudWatch Logs and Metrics.
- The service is already deployed and producing logs.

## 1) Confirm EMF in Logs (optional)
If you know your log group name (e.g., `/aws/lambda/<fn>` or custom), you can run a quick query to count EMF events.

```
LOG_GROUP="/aws/lambda/your-api-fn"  # update
START="-30 minutes"
END="now"

aws logs start-query \
  --log-group-name "$LOG_GROUP" \
  --start-time $(date -v-30M +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter ispresent(@aws) or ispresent(_aws) | stats count() by bin(5m)' \
  --query-id out.json >/dev/null 2>&1 || true
```

Alternatively, use the Console: CloudWatch > Logs Insights, pick the log group and run a similar query.

## 2) Metrics: HttpRequests and HttpLatencyMs
Open CloudWatch > Metrics and search the namespace:
- Namespace: `Hunt/CIN` (or `MONITORING_NAMESPACE` if customized)
- Metrics: `HttpRequests` (Count), `HttpLatencyMs` (Milliseconds)
- Dimensions: `Service`, `Route`, `Method`, `Status`

With the CLI, you can list metrics and fetch recent datapoints:

```
NAMESPACE="Hunt/CIN"

aws cloudwatch list-metrics \
  --namespace "$NAMESPACE" \
  --metric-name HttpRequests \
  --dimensions Name=Service,Value=cin-api \
  --recently-active PT3H

# Example: get latest 5 minutes of data for a specific route
aws cloudwatch get-metric-statistics \
  --namespace "$NAMESPACE" \
  --metric-name HttpLatencyMs \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average \
  --dimensions Name=Service,Value=cin-api Name=Route,Value=/api/cin/chat Name=Method,Value=POST \
  --region us-east-1
```

Note: adjust region, route, and method as needed.

## 3) Alarms (optional)
Use `put-metric-alarm` to set up p95 latency or 5xx rate alarms as described in the runbook. Example p95 on `AILatencyMs` or adapt for `HttpLatencyMs`.

## 4) X-Ray (optional)
If X-Ray is enabled, verify segments/subsegments in the X-Ray console. Ensure outbound HTTP capture is on when running in production.

***

Troubleshooting:
- No metrics? Ensure logs are reaching CloudWatch and EMF JSON is printed as single-line events.
- Dimensions mismatch? Validate `Service`, `Route`, `Method`, `Status` keys exist and are strings.

