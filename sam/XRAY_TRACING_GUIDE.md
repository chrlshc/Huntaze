# 🔍 X-Ray Tracing Guide - Canary Debugging

## Quick Access

```bash
# Service Map
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map"

# Traces (toutes)
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces"

# Traces canary uniquement
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true"

# Traces avec erreurs
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=error%20%3D%20true"
```

---

## Annotations X-Ray Disponibles

### Annotations Indexées (Searchable)

Notre implémentation ajoute ces annotations à chaque trace :

| Annotation | Type | Valeurs | Description |
|------------|------|---------|-------------|
| `canary` | boolean | true/false | Indique si la requête utilise Prisma (canary) |
| `path` | string | "mock" / "prisma" | Chemin de traitement utilisé |
| `userId` | string | user-* | ID de l'utilisateur (pour debugging) |

### Metadata (Non-indexé, pour debugging)

```json
{
  "huntaze": {
    "timestamp": "2025-10-27T11:09:31.456Z",
    "version": "$LATEST",
    "duration_ms": 334,
    "canaryEnabled": true,
    "region": "us-east-1"
  }
}
```

---

## Filtres X-Ray Console

### 1. Toutes les Traces Canary

**Filter Expression:**
```
annotation.canary = true
```

**URL Direct:**
```bash
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true"
```

**Use Case:** Voir toutes les requêtes qui passent par Prisma

---

### 2. Toutes les Traces Mock

**Filter Expression:**
```
annotation.canary = false
```

**URL Direct:**
```bash
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20false"
```

**Use Case:** Voir toutes les requêtes qui passent par Mock

---

### 3. Traces Canary avec Erreurs

**Filter Expression:**
```
annotation.canary = true AND error = true
```

**URL Direct:**
```bash
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true%20AND%20error%20%3D%20true"
```

**Use Case:** Debugging des erreurs Prisma uniquement

---

### 4. Traces Lentes (> 500ms)

**Filter Expression:**
```
duration >= 0.5
```

**URL Direct:**
```bash
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=duration%20%3E%3D%200.5"
```

**Use Case:** Identifier les requêtes lentes (duration en secondes)

---

### 5. Traces Canary Lentes

**Filter Expression:**
```
annotation.canary = true AND duration >= 0.5
```

**Use Case:** Comparer latence Prisma vs Mock

---

### 6. Traces pour un Utilisateur Spécifique

**Filter Expression:**
```
annotation.userId = "user-123"
```

**Use Case:** Debugging d'un utilisateur spécifique

---

### 7. Traces avec Shadow Traffic

**Filter Expression:**
```
service(id(name: "shadow-traffic", type: "subsegment"))
```

**Use Case:** Voir les requêtes qui ont déclenché du shadow traffic

---

## CLI X-Ray

### Récupérer Traces Canary avec Erreurs

```bash
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = true AND error = true" \
  --region us-east-1 \
  --query 'TraceSummaries[*].[Id,Duration,Http.HttpStatus,Annotations.canary[0].AnnotationValue]' \
  --output table
```

### Récupérer Détails d'une Trace

```bash
# Remplacer TRACE_ID par l'ID de la trace
aws xray batch-get-traces \
  --trace-ids "1-68ff5234-1a2b3c4d5e6f7890abcdef12" \
  --region us-east-1 \
  --query 'Traces[0].Segments[*].Document' \
  --output json | jq -r '.[] | fromjson'
```

### Statistiques Canary vs Mock

```bash
# Canary traces (dernière heure)
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = true" \
  --region us-east-1 \
  --query 'length(TraceSummaries)' \
  --output text

# Mock traces (dernière heure)
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --filter-expression "annotation.canary = false" \
  --region us-east-1 \
  --query 'length(TraceSummaries)' \
  --output text
```

---

## Service Map Analysis

### Interpréter la Service Map

**Nodes Attendus:**
- `huntaze-mock-read` (Lambda principale)
- `huntaze-prisma-read` (Lambda Prisma, si canary actif)
- `AWS::Lambda` (invocations inter-Lambda)
- `AWS::AppConfig` (récupération feature flags)

**Edges (Connexions):**
- Mock → Prisma (si canary ou shadow actif)
- Mock → AppConfig (récupération flags)

**Métriques par Node:**
- **Requests:** Nombre de requêtes
- **Errors:** Nombre d'erreurs
- **Throttles:** Nombre de throttles
- **Latency:** Distribution de latence (P50, P90, P99)

### Filtrer la Service Map

```bash
# Voir uniquement les erreurs
# Dans la console, cliquer sur "View traces" puis filtrer par "error = true"

# Voir uniquement le canary
# Filtrer par "annotation.canary = true"
```

---

## Debugging Workflow

### Scénario 1: Error Rate > 2%

1. **Ouvrir X-Ray Traces avec filtre:**
   ```
   annotation.canary = true AND error = true
   ```

2. **Identifier les patterns:**
   - Erreurs sur tous les users ou seulement certains ?
   - Erreurs sur toutes les requêtes ou intermittentes ?
   - Latence élevée avant l'erreur ?

3. **Examiner une trace:**
   - Cliquer sur une trace avec erreur
   - Voir le segment qui a échoué
   - Lire les metadata pour contexte

4. **Corréler avec Logs:**
   ```bash
   # Récupérer le requestId de la trace
   # Chercher dans CloudWatch Logs
   aws logs filter-log-events \
     --log-group-name /aws/lambda/huntaze-mock-read \
     --filter-pattern "REQUEST_ID_HERE" \
     --region us-east-1
   ```

---

### Scénario 2: Latence Élevée

1. **Ouvrir X-Ray Traces avec filtre:**
   ```
   annotation.canary = true AND duration >= 0.5
   ```

2. **Analyser la timeline:**
   - Temps passé dans chaque segment
   - Temps d'invocation Prisma
   - Temps de connexion DB (si visible)

3. **Comparer avec Mock:**
   ```
   annotation.canary = false AND duration >= 0.5
   ```

4. **Identifier le bottleneck:**
   - Cold start Lambda ?
   - Connexion DB lente ?
   - Query Prisma lente ?

---

### Scénario 3: Shadow Diffs

1. **Ouvrir Logs Insights** (Query 1 du guide)

2. **Identifier les users avec diffs:**
   ```sql
   fields @timestamp, @message
   | filter @message like /SHADOW-DIFF/
   | parse @message /userId: '(?<userId>[^']+)'/
   | stats count() by userId
   | sort count desc
   ```

3. **Examiner une trace spécifique:**
   ```
   annotation.userId = "user-problematic"
   ```

4. **Comparer Mock vs Prisma:**
   - Voir les metadata de chaque segment
   - Vérifier les données retournées

---

## X-Ray Insights (Optionnel)

### Activer X-Ray Insights

```bash
# Créer un groupe X-Ray pour le canary
aws xray create-group \
  --group-name huntaze-canary \
  --filter-expression "annotation.canary = true" \
  --insights-configuration InsightsEnabled=true \
  --region us-east-1

# Créer un groupe pour les erreurs
aws xray create-group \
  --group-name huntaze-errors \
  --filter-expression "error = true" \
  --insights-configuration InsightsEnabled=true \
  --region us-east-1
```

**Bénéfices:**
- Détection automatique d'anomalies
- Alertes sur patterns inhabituels
- Analyse de root cause automatique

---

## Annotations Custom (Avancé)

### Ajouter des Annotations Métier

Dans `lambda/xray-utils.js`, ajouter :

```javascript
function annotateBusinessMetrics(segment, metrics) {
  // Annotations indexées (max 50 par trace)
  segment.addAnnotation('subscription_type', metrics.subscriptionType);
  segment.addAnnotation('feature_used', metrics.featureName);
  
  // Metadata non-indexé (illimité)
  segment.addMetadata('business', {
    revenue_impact: metrics.revenueImpact,
    user_segment: metrics.userSegment,
    ab_test_variant: metrics.abTestVariant
  });
}
```

**Use Cases:**
- Filtrer par type d'abonnement
- Analyser l'impact par feature
- Corréler avec A/B tests

---

## Performance Tips

### Sampling Rate

Par défaut, X-Ray sample 1 requête/seconde + 5% du reste.

**Augmenter le sampling pour la beta:**

Dans `sam/template.yaml`:
```yaml
MockReadFn:
  Type: AWS::Serverless::Function
  Properties:
    Tracing: Active
    Environment:
      Variables:
        AWS_XRAY_TRACING_NAME: huntaze-mock-read
        AWS_XRAY_CONTEXT_MISSING: LOG_ERROR
```

**Sampling Rule Custom:**
```bash
aws xray create-sampling-rule \
  --cli-input-json file://xray-sampling-rule.json \
  --region us-east-1
```

`xray-sampling-rule.json`:
```json
{
  "SamplingRule": {
    "RuleName": "huntaze-beta-100pct",
    "Priority": 1000,
    "FixedRate": 1.0,
    "ReservoirSize": 100,
    "ServiceName": "huntaze-mock-read",
    "ServiceType": "*",
    "Host": "*",
    "HTTPMethod": "*",
    "URLPath": "*",
    "Version": 1,
    "Attributes": {
      "canary": "true"
    }
  }
}
```

**Effet:** 100% des traces canary sont capturées pendant la beta

---

## Coûts X-Ray

**Pricing (us-east-1):**
- Traces enregistrées: $5 / 1M traces
- Traces récupérées: $0.50 / 1M traces
- Traces scannées (Insights): $5 / 1M traces

**Estimation Beta (3h, 50 users):**
- ~1000 requêtes/heure = 3000 traces
- Coût: $0.015 (négligeable)

**Optimisation:**
- Sampling à 10% après la beta
- Garder 100% pour les erreurs uniquement

---

## Références

- [X-Ray Filter Expressions](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-filters.html)
- [X-Ray Annotations](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-segment.html#xray-sdk-nodejs-segment-annotations)
- [X-Ray Sampling](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-sampling.html)
- [X-Ray Insights](https://docs.aws.amazon.com/xray/latest/devguide/xray-insights.html)

---

**🎯 Quick Start:**

1. Déployer le code avec annotations X-Ray (déjà fait)
2. Ouvrir Service Map pour vue d'ensemble
3. Filtrer traces canary: `annotation.canary = true`
4. Examiner quelques traces pour vérifier les annotations
5. Créer des groupes X-Ray pour monitoring continu

