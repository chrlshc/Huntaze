# 🎯 Playbook Beta Fermée - 3 Heures (50 Users)

## Timeline

**H+0 (maintenant):** Walking skeleton déployé ✅  
**H+0 → H+1:** Shadow traffic monitoring  
**H+1 → H+2:** Canary 1% activation  
**H+2 → H+3:** Monitoring & Go/No-Go decision  

---

## 1. Shadow Traffic Monitoring (H+0 → H+1)

### Objectif
Comparer Mock vs Prisma en asynchrone sans impacter les utilisateurs.

### CloudWatch Logs Insights - Requêtes Production-Ready

**Query 1: Shadow Diffs avec Détails (Parse JSON)**
```
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

**Query 2: Error Rate par Minute (Metric Math Style)**
```
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

**Query 3: Latence P95 Mock vs Prisma (avec Path Extraction)**
```
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

### Seuils de Succès (Shadow)
- ✅ Shadow diffs < 0.5% des requêtes
- ✅ Shadow errors < 5% (acceptable car non-bloquant)
- ✅ P95 latency shadow < 1000ms

### Actions
```bash
# Invoquer quelques requêtes test
for i in {1..10}; do
  aws lambda invoke \
    --function-name huntaze-mock-read \
    --region us-east-1 \
    --cli-binary-format raw-in-base64-out \
    --payload "{\"userId\":\"user-$i\"}" \
    /tmp/response-$i.json
done

# Voir les logs en temps réel
sam logs -n huntaze-mock-read --tail --region us-east-1

# Ouvrir Logs Insights
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights"
```

---

## 2. Activer Canary 1% (H+1)

### Pré-requis
- ✅ Shadow traffic stable (< 0.5% diffs)
- ✅ Aucune erreur critique dans les logs
- ✅ Alarme CloudWatch en état OK

### Activation

```bash
# Vérifier l'alarme avant activation
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct \
  --region us-east-1 \
  --query 'MetricAlarms[0].StateValue'

# Activer le canary
cd sam
./enable-canary.sh

# Vérifier l'alias pondéré
aws lambda get-alias \
  --function-name huntaze-mock-read \
  --name live \
  --region us-east-1
```

### Vérification Déploiement AppConfig

```bash
# Surveiller le déploiement
aws appconfig get-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-number <DEPLOYMENT_NUM> \
  --region us-east-1 \
  --query '[State,PercentageComplete]'
```

---

## 3. Monitoring Canary (H+1 → H+2)

### Dashboard CloudWatch

**Métriques Clés:**
```
Errors / FILL(Invocations, 1)  # Error Rate
Duration (p95)                   # Latency P95
Invocations                      # Traffic
```

**Ouvrir Dashboard:**
```bash
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration"
```

### X-Ray Service Map avec Annotations Canary

**Annotations X-Ray Production-Ready:**

Créer `lambda/xray-utils.js`:
```javascript
const AWSXRay = require('aws-xray-sdk-core');

function annotateCanaryTrace(isCanary, userId, duration) {
  const segment = AWSXRay.getSegment();
  if (!segment) return;
  
  // Annotations (indexées, filtrable dans X-Ray console)
  segment.addAnnotation('canary', isCanary);
  segment.addAnnotation('path', isCanary ? 'prisma' : 'mock');
  segment.addAnnotation('userId', userId);
  
  // Metadata (non-indexé, pour debugging)
  segment.addMetadata('huntaze', {
    timestamp: new Date().toISOString(),
    version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
    duration_ms: duration,
    canaryEnabled: isCanary
  });
}

module.exports = { annotateCanaryTrace };
```

**Intégrer dans `lambda/mock-handler.js`:**
```javascript
const { annotateCanaryTrace } = require('./xray-utils');

// Après flag check et avant invoke:
annotateCanaryTrace(prismaEnabled, userId, 0);

// Après succès:
annotateCanaryTrace(prismaEnabled, userId, duration);
```

**Filtrer Traces X-Ray par Annotation:**
```bash
# Console X-Ray avec filtre canary
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true"

# CLI: Récupérer traces canary avec erreurs
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = true AND error = true" \
  --region us-east-1
```

**Ouvrir Service Map:**
```bash
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map"
```

### Logs Insights - Canary Specific

**Query 4: Canary Success Rate**
```
fields @timestamp, @message
| filter @message like /CANARY/
| stats 
    count(*) as total,
    sum(@message like /CANARY-SUCCESS/) as success,
    sum(@message like /ERROR/) as errors
| extend success_rate = (success / total) * 100
```

**Query 5: Latency Comparison (Mock vs Canary)**
```
fields @timestamp, duration, @message
| filter @message like /MOCK-SUCCESS/ or @message like /CANARY-SUCCESS/
| parse @message /\[(?<type>MOCK|CANARY)-SUCCESS\]/
| stats 
    avg(duration) as avg_ms,
    pct(duration, 95) as p95_ms,
    pct(duration, 99) as p99_ms
  by type, bin(5m)
```

---

## 4. Go/No-Go Decision (H+2)

### Seuils de Succès (Canary 1%)

| Métrique | Seuil | Action si Dépassé |
|----------|-------|-------------------|
| Error Rate | ≤ 2% | ✅ Continue |
| Error Rate | > 2% | 🔴 Rollback Auto |
| P95 Latency | ±15% vs Mock | ✅ Continue |
| P95 Latency | > +30% vs Mock | 🟡 Investigate |
| Shadow Diffs | < 0.5% | ✅ Continue |
| Shadow Diffs | > 1% | 🟡 Investigate |

### Commandes de Vérification

```bash
# 1. Vérifier l'alarme
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct \
  --region us-east-1

# 2. Métriques des 30 dernières minutes
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=huntaze-mock-read \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# 3. Invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=huntaze-mock-read \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

---

## 5. Rollback (Si Nécessaire)

### Rollback Automatique

**CodeDeploy** rollback automatiquement si l'alarme passe en ALARM.

Vérifier le status:
```bash
aws deploy get-deployment \
  --deployment-id <DEPLOYMENT_ID> \
  --region us-east-1
```

### Rollback Manuel (AppConfig)

```bash
# Arrêter le déploiement en cours
aws appconfig stop-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-number <NUM> \
  --region us-east-1

# Redéployer la version précédente (flag disabled)
aws appconfig start-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-strategy-id "AppConfig.Linear50PercentEvery30Seconds" \
  --configuration-profile-id l6h70ie \
  --configuration-version 1 \
  --description "Rollback to disabled" \
  --region us-east-1
```

### Rollback Manuel (Lambda)

```bash
# Revenir à la version précédente
aws lambda update-alias \
  --function-name huntaze-mock-read \
  --name live \
  --function-version <PREVIOUS_VERSION> \
  --region us-east-1
```

---

## 6. Ramp-Up (Si Go)

### Phase 2: 5% (H+3 → H+24)

```bash
# Créer nouvelle config avec 5%
cat > /tmp/feature-flags-5pct.json << EOF
{
  "version": "1",
  "flags": {
    "prismaAdapter": {
      "name": "prismaAdapter",
      "_description": "Enable Prisma - CANARY 5%",
      "attributes": {
        "enabled": {
          "constraints": {
            "type": "boolean"
          }
        }
      }
    }
  },
  "values": {
    "prismaAdapter": {
      "enabled": true
    }
  }
}
EOF

# Déployer
aws appconfig create-hosted-configuration-version \
  --application-id cjcqdvj \
  --configuration-profile-id l6h70ie \
  --content fileb:///tmp/feature-flags-5pct.json \
  --content-type "application/json" \
  --region us-east-1 \
  /tmp/version-5pct.json

# Start deployment
aws appconfig start-deployment \
  --application-id cjcqdvj \
  --environment-id ghhj0jb \
  --deployment-strategy-id "AppConfig.Linear50PercentEvery30Seconds" \
  --configuration-profile-id l6h70ie \
  --configuration-version <NEW_VERSION> \
  --description "Ramp-up to 5%" \
  --region us-east-1
```

### Phase 3: 25% → 50% → 100%

Répéter le processus ci-dessus avec monitoring à chaque étape.

---

## 7. Optimisations Prisma sur Lambda

### Binary Targets (AL2023 / Node 20)

Ajouter dans `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Rebuild:
```bash
cd lambda
npx prisma generate
```

### Connection Pooling

Prisma sur Lambda utilise des prepared statements → session pinning avec RDS Proxy.

**Alternatives:**
- **Prisma Accelerate** - Connection pooling managé
- **PgBouncer** - Transaction pooling mode
- **Long-lived connections** - Réutiliser le client Prisma entre invocations (déjà fait)

---

## 8. AppConfig Lambda Extension (Optimisation)

### Activer l'Extension

Ajouter layer dans `sam/template.yaml`:
```yaml
MockReadFn:
  Type: AWS::Serverless::Function
  Properties:
    Layers:
      - !Sub 'arn:aws:lambda:${AWS::Region}:027255383542:layer:AWS-AppConfig-Extension:82'
    Environment:
      Variables:
        AWS_APPCONFIG_EXTENSION_PREFETCH_LIST: '/applications/cjcqdvj/environments/ghhj0jb/configurations/l6h70ie'
```

**Bénéfices:**
- Cache local automatique
- Polling géré par l'extension
- Réduction des appels GetLatestConfiguration (payants)

---

## 9. Checklist Finale

### Avant Canary
- [ ] Shadow traffic < 0.5% diffs
- [ ] Alarme CloudWatch en état OK
- [ ] Dashboard configuré
- [ ] X-Ray traces visibles
- [ ] Logs Insights queries testées

### Pendant Canary
- [ ] Monitoring actif (dashboard + logs)
- [ ] Error rate < 2%
- [ ] Latency P95 stable
- [ ] Aucune alerte déclenchée

### Après Canary (Go)
- [ ] Documenter les métriques
- [ ] Planifier ramp-up 5%
- [ ] Communiquer aux stakeholders

### Après Canary (No-Go)
- [ ] Rollback effectué
- [ ] Root cause analysis
- [ ] Corrections appliquées
- [ ] Retry planifié

---

## 10. Guides Détaillés

### CloudWatch Logs Insights

Voir **[LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md)** pour :
- 8 requêtes production-ready prêtes à copier-coller
- Syntaxe et patterns regex
- Tips pour créer des dashboards
- Alertes basées sur Logs Insights

### X-Ray Tracing

Voir **[XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md)** pour :
- Filtres d'annotations canary
- Debugging workflows
- CLI commands
- X-Ray Insights configuration

---

## 11. Contacts & Escalation

**Alarme Critique:**
- CloudWatch Alarm → SNS → Email/Slack
- CodeDeploy rollback automatique

**Support AWS:**
- Console: https://console.aws.amazon.com/support/
- Docs: https://docs.aws.amazon.com/

**Ressources:**
- [Lambda Weighted Aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- [AppConfig Rollback](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-deployment-strategy.html)
- [CloudWatch Metric Math](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-metric-math.html)
- [Prisma on Lambda](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)

---

## 🎯 Quick Commands Reference

```bash
# Logs en temps réel
sam logs -n huntaze-mock-read --tail

# Status alarme
aws cloudwatch describe-alarms --alarm-names huntaze-lambda-error-rate-gt-2pct

# Alias Lambda
aws lambda get-alias --function-name huntaze-mock-read --name live

# AppConfig deployment
aws appconfig get-deployment --application-id cjcqdvj --environment-id ghhj0jb --deployment-number <NUM>

# X-Ray traces
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces"

# Dashboard
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration"
```

---

**🚀 Bonne chance pour la beta fermée !**
