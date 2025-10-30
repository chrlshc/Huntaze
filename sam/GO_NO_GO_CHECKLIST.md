# ✅ Go/No-Go Checklist - Beta Launch

## 🚦 Pre-Launch (5 minutes)

```bash
# 1. Readiness check (must stay green)
cd sam && ./test-beta-ready.sh
# Expected: 12/12 ✅

# 2. Verify alarm is OK
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct \
  --region us-east-1 \
  --query 'MetricAlarms[0].StateValue' \
  --output text
# Expected: OK or INSUFFICIENT_DATA

# 3. Check current traffic (should be 100% Mock)
aws lambda get-alias \
  --function-name huntaze-mock-read \
  --name live \
  --region us-east-1
# Expected: No AdditionalVersionWeights
```

**✅ GO if all green** → Proceed to launch  
**🔴 NO-GO if any red** → Investigate before launch

---

## 🚀 Launch Sequence (2 minutes)

```bash
# 1. Enable canary 1%
./enable-canary.sh

# 2. Verify weighted alias
aws lambda get-alias \
  --function-name huntaze-mock-read \
  --name live \
  --region us-east-1 \
  --query 'RoutingConfig.AdditionalVersionWeights'
# Expected: Shows version weights

# 3. Start monitoring
./monitor-beta.sh --watch
```

---

## 📊 Go/No-Go Thresholds (3 hours)

### Critical (Auto-Rollback)

| Metric | Threshold | Status | Action |
|--------|-----------|--------|--------|
| **Error Rate** | > 2% (5 min) | 🔴 NO-GO | Auto-rollback |
| **Alarm State** | ALARM | 🔴 NO-GO | Auto-rollback |

### Warning (Manual Review)

| Metric | Threshold | Status | Action |
|--------|-----------|--------|--------|
| **P95 Latency** | > +30% vs Mock | 🟡 WARN | Investigate |
| **Shadow Diffs** | > 1% | 🟡 WARN | Investigate |
| **Canary Traffic** | < 0.5% or > 2% | 🟡 WARN | Check config |

### Target (Success)

| Metric | Target | Status |
|--------|--------|--------|
| **Error Rate** | ≤ 2% | ✅ GO |
| **P95 Latency** | ±15% vs Mock | ✅ GO |
| **Shadow Diffs** | < 0.5% | ✅ GO |
| **Availability** | > 99% | ✅ GO |

---

## 🔍 Monitoring Commands (Every 15 min)

```bash
# Quick health check
./monitor-beta.sh

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

# Recent errors
aws logs tail /aws/lambda/huntaze-mock-read \
  --region us-east-1 \
  --since 15m | grep ERROR

# X-Ray canary traces
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true"
```

---

## 🎯 Decision Points

### H+1 (After 1 hour)

**Check:**
- [ ] Error rate < 2%
- [ ] No alarms triggered
- [ ] Shadow diffs < 0.5%
- [ ] Canary traffic ~1%

**Decision:**
- ✅ All green → Continue monitoring
- 🟡 Warnings → Investigate, continue with caution
- 🔴 Critical → Manual rollback if auto didn't trigger

### H+2 (After 2 hours)

**Check:**
- [ ] Error rate stable < 2%
- [ ] P95 latency acceptable
- [ ] No rollbacks occurred
- [ ] Shadow traffic healthy

**Decision:**
- ✅ All green → Continue to H+3
- 🟡 Warnings → Extend monitoring
- 🔴 Issues → Rollback

### H+3 (Final Go/No-Go)

**Check:**
- [ ] Error rate < 1% (ideal)
- [ ] P95 latency ±15% vs Mock
- [ ] Shadow diffs < 0.5%
- [ ] No incidents

**Decision:**
- ✅ GO → Plan ramp-up to 5% (J+2)
- 🔴 NO-GO → Rollback, analyze, retry

---

## 🚨 Rollback Triggers

### Automatic (No Action Needed)

1. **CloudWatch Alarm ALARM state**
   - Error rate > 2% for 5 minutes
   - CodeDeploy rollback automatically
   - AppConfig stops deployment

2. **AppConfig Alarm**
   - Deployment stops if alarm triggers
   - Reverts to previous config

### Manual Rollback

```bash
# If auto-rollback fails or you need immediate rollback:

# Option 1: Re-run enable script (toggles off)
./enable-canary.sh

# Option 2: Stop AppConfig deployment
aws appconfig stop-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-number <NUM> \
  --region us-east-1

# Option 3: Revert Lambda alias
aws lambda update-alias \
  --function-name huntaze-mock-read \
  --name live \
  --function-version <PREVIOUS_VERSION> \
  --region us-east-1

# Verify rollback
aws lambda get-alias \
  --function-name huntaze-mock-read \
  --name live \
  --region us-east-1
```

---

## 📋 Logs Insights Quick Queries

### Error Rate (Copy-Paste)

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

### Shadow Diffs (Copy-Paste)

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

### Latency P95 (Copy-Paste)

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

---

## 🎯 Success Criteria (Final)

**✅ GO to 5% if:**
- Error rate < 1% over 3 hours
- P95 latency within ±15% of Mock
- Shadow diffs < 0.5%
- No rollbacks occurred
- No critical incidents

**🔴 NO-GO if:**
- Error rate > 2% at any point
- Multiple rollbacks
- P95 latency > +30% vs Mock
- Shadow diffs > 1%
- Any critical incidents

---

## 📞 Emergency Contacts

**Auto-Rollback:**
- CloudWatch Alarm → CodeDeploy → Lambda alias revert
- No manual intervention needed

**Manual Rollback:**
- See "Rollback Triggers" section above
- Use `./enable-canary.sh` to toggle off

**Documentation:**
- Full playbook: [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md)
- Quick ref: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- Logs queries: [LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md)
- X-Ray guide: [XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md)

---

## ✅ Final Checklist

**Before Launch:**
- [ ] `./test-beta-ready.sh` → 12/12 ✅
- [ ] Alarm state: OK
- [ ] Dashboard accessible
- [ ] X-Ray traces visible
- [ ] Team notified

**During Beta (Every 15 min):**
- [ ] Check `./monitor-beta.sh`
- [ ] Review error rate
- [ ] Check alarm state
- [ ] Scan recent logs

**After 3 Hours:**
- [ ] Review all metrics
- [ ] Make Go/No-Go decision
- [ ] Document findings
- [ ] Plan next steps (5% or rollback)

---

**🚀 Ready to Launch!**

*Validated by AWS Documentation*  
*Auto-rollback configured*  
*All systems green*  

