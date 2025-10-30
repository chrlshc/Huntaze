# ⚡ Quick Reference - Beta Launch

## 🚀 Launch Sequence (Copy-Paste)

```bash
# 1. Test readiness (12 tests)
cd sam && ./test-beta-ready.sh

# 2. Enable canary 1%
./enable-canary.sh

# 3. Monitor (real-time)
./monitor-beta.sh --watch
```

---

## 📊 Monitoring URLs

```bash
# Dashboard
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration"

# X-Ray Service Map
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map"

# X-Ray Traces (canary only)
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true"

# X-Ray Traces (errors only)
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=error%20%3D%20true"

# Logs Insights
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights"
```

---

## 🔍 Logs Commands

```bash
# Tail logs (real-time)
sam logs -n huntaze-mock-read --tail

# Last 10 minutes
aws logs tail /aws/lambda/huntaze-mock-read --region us-east-1 --since 10m

# Filter errors only
aws logs tail /aws/lambda/huntaze-mock-read --region us-east-1 --since 10m | grep ERROR

# Filter canary traffic
aws logs tail /aws/lambda/huntaze-mock-read --region us-east-1 --since 10m | grep CANARY

# Filter shadow diffs
aws logs tail /aws/lambda/huntaze-mock-read --region us-east-1 --since 10m | grep SHADOW-DIFF
```

---

## 📈 Metrics Commands

```bash
# Error rate (last 30 min)
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=huntaze-mock-read \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Invocations (last 30 min)
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=huntaze-mock-read \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Alarm status
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct \
  --region us-east-1 \
  --query 'MetricAlarms[0].StateValue' \
  --output text
```

---

## 🎛️ AppConfig Commands

```bash
# Get current flag value
aws appconfig get-configuration \
  --application huntaze-flags \
  --environment production \
  --configuration feature-flags \
  --client-id beta-test \
  --region us-east-1 /tmp/flags.json && cat /tmp/flags.json

# List deployments
aws appconfig list-deployments \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --region us-east-1

# Get deployment status
aws appconfig get-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-number <NUM> \
  --region us-east-1 \
  --query '[State,PercentageComplete]'

# Stop deployment (rollback)
aws appconfig stop-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-number <NUM> \
  --region us-east-1
```

---

## 🔄 Lambda Commands

```bash
# Invoke test
aws lambda invoke \
  --function-name huntaze-mock-read \
  --region us-east-1 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"userId":"user-1"}' \
  /tmp/test.json && cat /tmp/test.json

# Get alias info
aws lambda get-alias \
  --function-name huntaze-mock-read \
  --name live \
  --region us-east-1

# Get function config
aws lambda get-function-configuration \
  --function-name huntaze-mock-read \
  --region us-east-1

# Update alias (manual rollback)
aws lambda update-alias \
  --function-name huntaze-mock-read \
  --name live \
  --function-version <VERSION> \
  --region us-east-1
```

---

## 🔍 X-Ray Commands

```bash
# Get traces (last hour, canary only)
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = true" \
  --region us-east-1

# Get traces with errors
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "error = true" \
  --region us-east-1

# Get trace details
aws xray batch-get-traces \
  --trace-ids "<TRACE_ID>" \
  --region us-east-1

# Count canary vs mock traces
echo "Canary traces:"
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = true" \
  --region us-east-1 \
  --query 'length(TraceSummaries)'

echo "Mock traces:"
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = false" \
  --region us-east-1 \
  --query 'length(TraceSummaries)'
```

---

## 🚨 Rollback Commands

```bash
# 1. Stop AppConfig deployment
aws appconfig stop-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-number <NUM> \
  --region us-east-1

# 2. Rollback Lambda alias to previous version
aws lambda update-alias \
  --function-name huntaze-mock-read \
  --name live \
  --function-version <PREVIOUS_VERSION> \
  --region us-east-1

# 3. Verify rollback
aws lambda get-alias \
  --function-name huntaze-mock-read \
  --name live \
  --region us-east-1

# 4. Check alarm status
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct \
  --region us-east-1
```

---

## 📝 Logs Insights Queries (Copy-Paste)

### Query 1: Error Rate

```sql
fields @timestamp, @type, @message
| filter @type = "REPORT"
| stats count() as invocations by bin(1m)
| join (
    fields @timestamp, @message
    | filter @message like /ERROR/ or @message like /FAILED/
    | stats count() as errors by bin(1m)
  ) on bin(1m)
| eval error_rate = (errors / invocations) * 100
| fields bin(1m) as time, invocations, errors, error_rate
| sort time desc
```

### Query 2: Latency P95

```sql
fields @timestamp, @message, @duration
| filter @message like /SUCCESS/
| parse @message /duration: (?<duration>\d+)/
| parse @message /\[(?<path>\w+)-SUCCESS\]/ 
| stats 
    count() as requests,
    avg(duration) as avg_latency, 
    pct(duration, 95) as p95_latency
  by path, bin(5m)
| sort @timestamp desc
```

### Query 3: Shadow Diffs

```sql
fields @timestamp, @message
| filter @message like /SHADOW-DIFF/
| parse @message /userId: '(?<userId>[^']+)'/
| parse @message /match: (?<match>\w+)/
| stats count() as diffs, 
        sum(match = "false") as mismatches,
        (sum(match = "false") / count(*)) * 100 as mismatch_pct
  by bin(1m)
| sort @timestamp desc
```

---

## 🧪 Test Traffic Generation

```bash
# Single request
aws lambda invoke \
  --function-name huntaze-mock-read \
  --region us-east-1 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"userId":"user-1"}' \
  /tmp/test.json

# 10 requests
for i in {1..10}; do
  aws lambda invoke \
    --function-name huntaze-mock-read \
    --region us-east-1 \
    --cli-binary-format raw-in-base64-out \
    --payload "{\"userId\":\"user-$i\"}" \
    /tmp/test-$i.json &
done
wait

# Continuous load (50 req/min)
while true; do
  for i in {1..50}; do
    aws lambda invoke \
      --function-name huntaze-mock-read \
      --region us-east-1 \
      --cli-binary-format raw-in-base64-out \
      --payload "{\"userId\":\"load-test-$i\"}" \
      /tmp/load-$i.json > /dev/null 2>&1 &
  done
  wait
  sleep 60
done
```

---

## 📊 Go/No-Go Checklist

```bash
# Run all checks
echo "1. Error Rate:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=huntaze-mock-read \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1 \
  --query 'Datapoints[*].Sum' \
  --output text

echo "2. Alarm Status:"
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct \
  --region us-east-1 \
  --query 'MetricAlarms[0].StateValue' \
  --output text

echo "3. Canary Traffic (last hour):"
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = true" \
  --region us-east-1 \
  --query 'length(TraceSummaries)'

echo "4. Recent Errors:"
aws logs tail /aws/lambda/huntaze-mock-read \
  --region us-east-1 \
  --since 30m \
  --format short | grep -c ERROR || echo "0"
```

---

## 🎯 Decision Matrix

| Metric | Value | Action |
|--------|-------|--------|
| Error Rate | ≤ 2% | ✅ Continue |
| Error Rate | > 2% | 🔴 Rollback |
| P95 Latency | ±15% | ✅ Continue |
| P95 Latency | > +30% | 🟡 Investigate |
| Shadow Diffs | < 0.5% | ✅ Continue |
| Shadow Diffs | > 1% | 🟡 Investigate |
| Alarm State | OK | ✅ Continue |
| Alarm State | ALARM | 🔴 Rollback |

---

## 📚 Documentation Links

- **[BETA_LAUNCH_README.md](./BETA_LAUNCH_README.md)** - Overview complet
- **[BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md)** - Playbook 3h détaillé
- **[LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md)** - 8 requêtes production-ready
- **[XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md)** - Guide X-Ray complet
- **[README.md](./README.md)** - Documentation technique

---

## 🆘 Emergency Contacts

**Rollback Automatique:**
- CloudWatch Alarm → CodeDeploy rollback
- Pas d'intervention manuelle nécessaire

**Rollback Manuel:**
```bash
./enable-canary.sh  # Re-run pour désactiver
# OU
aws appconfig stop-deployment --application-id cjcqdvj --environment-id ghhj0jb --deployment-number <NUM> --region us-east-1
```

**Support AWS:**
- Console: https://console.aws.amazon.com/support/

---

**⚡ Quick Reference - Keep this handy during beta launch!**

