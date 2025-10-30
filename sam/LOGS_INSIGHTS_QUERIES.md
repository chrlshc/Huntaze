# 📊 CloudWatch Logs Insights - Requêtes Production-Ready

## Quick Access

```bash
# Ouvrir Logs Insights
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights"

# Sélectionner log group: /aws/lambda/huntaze-mock-read
# Time range: 1h (ou personnalisé)
```

---

## 1. Shadow Traffic Diffs avec Détails

**Objectif:** Identifier les divergences entre Mock et Prisma avec taux de mismatch

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

**Interprétation:**
- `diffs` = nombre total de comparaisons shadow
- `mismatches` = nombre de divergences
- `mismatch_pct` = pourcentage de divergences (cible: < 0.5%)

**Alerte si:** `mismatch_pct > 1%`

---

## 2. Error Rate par Minute (Style Metric Math)

**Objectif:** Calculer le taux d'erreur exact (Errors / Invocations)

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

**Interprétation:**
- `invocations` = nombre total de requêtes
- `errors` = nombre d'erreurs
- `error_rate` = pourcentage d'erreurs (cible: < 2%)

**Alerte si:** `error_rate > 2%` (rollback automatique)

---

## 3. Latence P95 Mock vs Prisma

**Objectif:** Comparer les performances Mock vs Canary (Prisma)

```sql
fields @timestamp, @message, @duration
| filter @message like /SUCCESS/
| parse @message /duration: (?<duration>\d+)/
| parse @message /\[(?<path>\w+)-SUCCESS\]/ 
| stats 
    count() as requests,
    avg(duration) as avg_latency, 
    pct(duration, 50) as p50_latency,
    pct(duration, 95) as p95_latency,
    pct(duration, 99) as p99_latency
  by path, bin(5m)
| sort @timestamp desc
```

**Interprétation:**
- `path` = MOCK ou CANARY
- `avg_latency` = latence moyenne en ms
- `p95_latency` = 95% des requêtes sous cette latence
- `p99_latency` = 99% des requêtes sous cette latence

**Alerte si:** `p95_latency (CANARY) > p95_latency (MOCK) * 1.3` (30% plus lent)

---

## 4. Canary Success Rate

**Objectif:** Vérifier le taux de succès du canary

```sql
fields @timestamp, @message
| filter @message like /CANARY/
| stats 
    count(*) as total,
    sum(@message like /CANARY-SUCCESS/) as success,
    sum(@message like /ERROR/) as errors
| eval success_rate = (success / total) * 100
```

**Interprétation:**
- `total` = nombre total de requêtes canary
- `success` = nombre de succès
- `success_rate` = pourcentage de succès (cible: > 98%)

---

## 5. Shadow Traffic Performance

**Objectif:** Vérifier que le shadow traffic ne timeout pas

```sql
fields @timestamp, @message
| filter @message like /SHADOW/
| parse @message /duration: (?<duration>\d+)/
| stats 
    count() as total,
    avg(duration) as avg_ms,
    pct(duration, 95) as p95_ms,
    sum(@message like /SHADOW-TIMEOUT/) as timeouts,
    sum(@message like /SHADOW-FAILED/) as failures
  by bin(5m)
```

**Interprétation:**
- `avg_ms` = latence moyenne shadow (cible: < 500ms)
- `p95_ms` = P95 latence shadow
- `timeouts` = nombre de timeouts (cible: 0)
- `failures` = nombre d'échecs (acceptable: < 5%)

---

## 6. Traffic Distribution (Mock vs Canary)

**Objectif:** Vérifier la répartition du trafic (devrait être ~1% canary)

```sql
fields @timestamp, @message
| filter @message like /SUCCESS/
| parse @message /\[(?<path>\w+)-SUCCESS\]/
| stats count() as requests by path
| eval percentage = (requests / sum(requests)) * 100
```

**Interprétation:**
- `MOCK` = devrait être ~99%
- `CANARY` = devrait être ~1%

---

## 7. Erreurs Détaillées (Debugging)

**Objectif:** Extraire les détails des erreurs pour investigation

```sql
fields @timestamp, @message
| filter @message like /ERROR/ or @message like /FAILED/
| parse @message /userId: '(?<userId>[^']+)'/
| parse @message /error: '(?<error>[^']+)'/
| parse @message /duration: (?<duration>\d+)/
| sort @timestamp desc
| limit 50
```

---

## 8. AppConfig Flag Changes

**Objectif:** Tracer les changements de feature flags

```sql
fields @timestamp, @message
| filter @message like /FLAGS/
| parse @message /Retrieved: (?<flags>.+)/
| stats count() by flags, bin(5m)
| sort @timestamp desc
```

---

## Tips & Best Practices

### Syntaxe Logs Insights

- **filter:** Filtrer les logs (like, =, !=, <, >)
- **parse:** Extraire des champs avec regex
- **stats:** Agréger (count, sum, avg, min, max, pct)
- **eval:** Calculer de nouveaux champs
- **join:** Joindre deux requêtes
- **bin():** Grouper par intervalle de temps (1m, 5m, 1h)
- **sort:** Trier les résultats
- **limit:** Limiter le nombre de résultats

### Regex Patterns

```sql
-- Extraire userId
parse @message /userId: '(?<userId>[^']+)'/

-- Extraire duration (nombre)
parse @message /duration: (?<duration>\d+)/

-- Extraire path (MOCK ou CANARY)
parse @message /\[(?<path>\w+)-SUCCESS\]/

-- Extraire JSON field
parse @message /"enabled":(?<enabled>\w+)/
```

### Percentiles

```sql
-- P50, P95, P99
pct(duration, 50) as p50
pct(duration, 95) as p95
pct(duration, 99) as p99
```

### Time Binning

```sql
-- Par minute
by bin(1m)

-- Par 5 minutes
by bin(5m)

-- Par heure
by bin(1h)
```

---

## Dashboard Widgets

### Créer un Dashboard avec ces Requêtes

```bash
# Créer dashboard
aws cloudwatch put-dashboard \
  --dashboard-name huntaze-beta-monitoring \
  --dashboard-body file://sam/cloudwatch-dashboard.json \
  --region us-east-1
```

### Widgets Recommandés

1. **Error Rate** (Query 2) - Line chart
2. **Latency P95** (Query 3) - Line chart avec 2 séries (Mock vs Canary)
3. **Shadow Diffs** (Query 1) - Number widget
4. **Traffic Distribution** (Query 6) - Pie chart
5. **Recent Errors** (Query 7) - Table

---

## Alertes CloudWatch

### Créer une Alarme sur Error Rate

```bash
# Alarme si error rate > 2% sur 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-logs-insights-error-rate \
  --alarm-description "Error rate > 2% from Logs Insights" \
  --metric-name ErrorRate \
  --namespace Huntaze/Beta \
  --statistic Average \
  --period 300 \
  --threshold 2 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region us-east-1
```

---

## Références

- [Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Logs Insights Sample Queries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax-examples.html)
- [Parse Command](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax-Parse.html)
- [Stats Command](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax-Stats.html)

---

**🎯 Quick Start:**

1. Ouvrir Logs Insights console
2. Sélectionner log group `/aws/lambda/huntaze-mock-read`
3. Copier-coller Query 2 (Error Rate)
4. Time range: 1h
5. Run query
6. Ajouter au dashboard si besoin

