# Tâche 15 - Plan de Déploiement AWS

## 📋 Vue d'Ensemble

Cette tâche déploie et configure toutes les ressources AWS nécessaires pour l'optimisation des performances.

## ✅ Infrastructure Existante

D'après l'audit, vous avez déjà:
- ✅ **Account AWS**: 317805897534
- ✅ **Credentials**: AdministratorAccess (temporaires)
- ✅ **S3 Buckets**: huntaze-assets, huntaze-beta-assets
- ✅ **CloudFront Distribution**: E21VMD5A9KDBOO (dc825q4u11mxr.cloudfront.net)
- ✅ **Region**: us-east-1

## 🎯 Objectifs de la Tâche 15

1. **Déployer Lambda@Edge Functions**
   - viewer-request.ts → CloudFront
   - origin-response.ts → CloudFront

2. **Configurer S3 Bucket**
   - Bucket policy pour accès public
   - CORS configuration
   - Lifecycle policies

3. **Configurer CloudFront Distribution**
   - Attacher Lambda@Edge functions
   - Cache policies optimisées
   - Compression activée

4. **Configurer CloudWatch Alarms**
   - Alarmes pour Lambda@Edge
   - Alarmes pour CloudFront
   - SNS notifications

5. **Vérification Staging**
   - Tests d'intégration
   - Validation des performances
   - Rollback plan

## 📝 Étapes Détaillées

### Étape 1: Vérifier les Credentials AWS ✅

**Status**: Déjà configuré

```bash
# Vérifier
aws sts get-caller-identity
```

**Résultat attendu**:
```json
{
    "UserId": "AROAUT7VVE47A7GJBONF4:huntaze",
    "Account": "317805897534",
    "Arn": "arn:aws:sts::317805897534:assumed-role/..."
}
```

### Étape 2: Déployer Lambda@Edge Functions

**Fichiers concernés**:
- `lambda/edge/viewer-request.ts`
- `lambda/edge/origin-response.ts`
- `lambda/edge/deploy.sh`

**Commandes**:
```bash
cd lambda/edge
chmod +x deploy.sh
./deploy.sh
```

**Ce que fait le script**:
1. Compile TypeScript → JavaScript
2. Crée les packages ZIP
3. Crée/met à jour le rôle IAM
4. Crée/met à jour les fonctions Lambda
5. Publie les versions
6. Retourne les ARNs

**Résultat attendu**:
```
✅ Deployment complete!
Viewer Request ARN: arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1
Origin Response ARN: arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1
```

### Étape 3: Configurer S3 Bucket (huntaze-assets)

#### 3.1 Bucket Policy (Accès Public)

**Créer**: `s3-bucket-policy.json`
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::huntaze-assets/*"
    },
    {
      "Sid": "CloudFrontOriginAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::huntaze-assets/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::317805897534:distribution/E21VMD5A9KDBOO"
        }
      }
    }
  ]
}
```

**Appliquer**:
```bash
aws s3api put-bucket-policy \
  --bucket huntaze-assets \
  --policy file://s3-bucket-policy.json
```

#### 3.2 CORS Configuration

**Créer**: `s3-cors-config.json`
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**Appliquer**:
```bash
aws s3api put-bucket-cors \
  --bucket huntaze-assets \
  --cors-configuration file://s3-cors-config.json
```

#### 3.3 Lifecycle Policy (Nettoyage automatique)

**Créer**: `s3-lifecycle-policy.json`
```json
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "Id": "DeleteIncompleteUploads",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

**Appliquer**:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket huntaze-assets \
  --lifecycle-configuration file://s3-lifecycle-policy.json
```

### Étape 4: Configurer CloudFront Distribution

#### 4.1 Récupérer la Configuration Actuelle

```bash
aws cloudfront get-distribution-config \
  --id E21VMD5A9KDBOO \
  > cloudfront-config-original.json
```

#### 4.2 Extraire ETag et Config

```bash
# Extraire ETag
ETAG=$(jq -r '.ETag' cloudfront-config-original.json)

# Extraire DistributionConfig
jq '.DistributionConfig' cloudfront-config-original.json > cloudfront-config.json
```

#### 4.3 Modifier la Configuration

**Ajouter Lambda@Edge Associations**:

Éditer `cloudfront-config.json` et ajouter dans `DefaultCacheBehavior`:

```json
{
  "DefaultCacheBehavior": {
    "LambdaFunctionAssociations": {
      "Quantity": 2,
      "Items": [
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1",
          "EventType": "viewer-request",
          "IncludeBody": false
        },
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1",
          "EventType": "origin-response",
          "IncludeBody": false
        }
      ]
    }
  }
}
```

**Optimiser Cache Behavior**:
```json
{
  "DefaultCacheBehavior": {
    "Compress": true,
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
  }
}
```

#### 4.4 Appliquer la Configuration

```bash
aws cloudfront update-distribution \
  --id E21VMD5A9KDBOO \
  --if-match "$ETAG" \
  --distribution-config file://cloudfront-config.json
```

**Attendre le déploiement** (15-20 minutes):
```bash
aws cloudfront wait distribution-deployed --id E21VMD5A9KDBOO
```

### Étape 5: Configurer CloudWatch Alarms

#### 5.1 Alarmes Lambda@Edge

**Créer**: `scripts/setup-lambda-edge-alarms.ts`

```typescript
import { CloudWatchClient, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

async function setupLambdaEdgeAlarms() {
  const alarms = [
    {
      AlarmName: 'Lambda-ViewerRequest-Errors',
      MetricName: 'Errors',
      Namespace: 'AWS/Lambda',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold',
      Dimensions: [
        { Name: 'FunctionName', Value: 'huntaze-viewer-request' }
      ],
      AlarmActions: ['arn:aws:sns:us-east-1:317805897534:Huntaze-Performance-Alerts']
    },
    {
      AlarmName: 'Lambda-OriginResponse-Errors',
      MetricName: 'Errors',
      Namespace: 'AWS/Lambda',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold',
      Dimensions: [
        { Name: 'FunctionName', Value: 'huntaze-origin-response' }
      ],
      AlarmActions: ['arn:aws:sns:us-east-1:317805897534:Huntaze-Performance-Alerts']
    },
    {
      AlarmName: 'Lambda-ViewerRequest-Duration',
      MetricName: 'Duration',
      Namespace: 'AWS/Lambda',
      Statistic: 'Average',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 1000, // 1 second
      ComparisonOperator: 'GreaterThanThreshold',
      Dimensions: [
        { Name: 'FunctionName', Value: 'huntaze-viewer-request' }
      ],
      AlarmActions: ['arn:aws:sns:us-east-1:317805897534:Huntaze-Performance-Alerts']
    }
  ];

  for (const alarm of alarms) {
    await cloudwatch.send(new PutMetricAlarmCommand(alarm));
    console.log(`✅ Created alarm: ${alarm.AlarmName}`);
  }
}

setupLambdaEdgeAlarms();
```

**Exécuter**:
```bash
npx tsx scripts/setup-lambda-edge-alarms.ts
```

#### 5.2 Alarmes CloudFront

```typescript
const cloudfrontAlarms = [
  {
    AlarmName: 'CloudFront-4xxErrorRate',
    MetricName: '4xxErrorRate',
    Namespace: 'AWS/CloudFront',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 5, // 5%
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'DistributionId', Value: 'E21VMD5A9KDBOO' }
    ]
  },
  {
    AlarmName: 'CloudFront-5xxErrorRate',
    MetricName: '5xxErrorRate',
    Namespace: 'AWS/CloudFront',
    Statistic: 'Average',
    Period: 300,
    EvaluationPeriods: 2,
    Threshold: 1, // 1%
    ComparisonOperator: 'GreaterThanThreshold',
    Dimensions: [
      { Name: 'DistributionId', Value: 'E21VMD5A9KDBOO' }
    ]
  }
];
```

### Étape 6: Vérification en Staging

#### 6.1 Tests d'Intégration

**Créer**: `scripts/verify-aws-deployment.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

async function verifyDeployment() {
  console.log('🔍 Verifying AWS Deployment...\n');

  // 1. Verify Lambda@Edge Functions
  console.log('1. Checking Lambda@Edge Functions...');
  const lambda = new LambdaClient({ region: 'us-east-1' });
  
  const viewerRequest = await lambda.send(
    new GetFunctionCommand({ FunctionName: 'huntaze-viewer-request' })
  );
  console.log(`   ✅ Viewer Request: ${viewerRequest.Configuration?.FunctionArn}`);

  const originResponse = await lambda.send(
    new GetFunctionCommand({ FunctionName: 'huntaze-origin-response' })
  );
  console.log(`   ✅ Origin Response: ${originResponse.Configuration?.FunctionArn}`);

  // 2. Verify S3 Bucket
  console.log('\n2. Checking S3 Bucket...');
  const s3 = new S3Client({ region: 'us-east-1' });
  
  const testKey = `test-${Date.now()}.txt`;
  await s3.send(new PutObjectCommand({
    Bucket: 'huntaze-assets',
    Key: testKey,
    Body: 'Test upload',
    ContentType: 'text/plain'
  }));
  console.log(`   ✅ Upload successful: ${testKey}`);

  const getResult = await s3.send(new GetObjectCommand({
    Bucket: 'huntaze-assets',
    Key: testKey
  }));
  console.log(`   ✅ Download successful`);

  // 3. Verify CloudFront Distribution
  console.log('\n3. Checking CloudFront Distribution...');
  const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
  
  const distribution = await cloudfront.send(
    new GetDistributionCommand({ Id: 'E21VMD5A9KDBOO' })
  );
  console.log(`   ✅ Status: ${distribution.Distribution?.Status}`);
  console.log(`   ✅ Domain: ${distribution.Distribution?.DomainName}`);

  // 4. Test CloudFront + Lambda@Edge
  console.log('\n4. Testing CloudFront + Lambda@Edge...');
  const cloudfrontUrl = `https://dc825q4u11mxr.cloudfront.net/${testKey}`;
  
  const response = await fetch(cloudfrontUrl);
  console.log(`   ✅ Status: ${response.status}`);
  console.log(`   ✅ Headers:`);
  console.log(`      - X-Content-Type-Options: ${response.headers.get('x-content-type-options')}`);
  console.log(`      - Strict-Transport-Security: ${response.headers.get('strict-transport-security')}`);
  console.log(`      - Content-Encoding: ${response.headers.get('content-encoding')}`);

  console.log('\n✅ All verifications passed!');
}

verifyDeployment();
```

**Exécuter**:
```bash
npx tsx scripts/verify-aws-deployment.ts
```

#### 6.2 Tests de Performance

```bash
# Test Lighthouse avec CloudFront
npm run lighthouse -- --url=https://dc825q4u11mxr.cloudfront.net

# Test Web Vitals
npm run test:e2e -- web-vitals

# Test de charge
npm run loadtest
```

### Étape 7: Rollback Plan

En cas de problème:

#### 7.1 Rollback Lambda@Edge

```bash
# Détacher les fonctions de CloudFront
aws cloudfront get-distribution-config --id E21VMD5A9KDBOO > config-rollback.json

# Éditer config-rollback.json pour retirer LambdaFunctionAssociations
# Puis:
aws cloudfront update-distribution \
  --id E21VMD5A9KDBOO \
  --if-match "$ETAG" \
  --distribution-config file://config-rollback.json
```

#### 7.2 Rollback S3 Policy

```bash
# Restaurer l'ancienne policy
aws s3api put-bucket-policy \
  --bucket huntaze-assets \
  --policy file://s3-bucket-policy-original.json
```

## 📊 Checklist de Vérification

### Avant Déploiement
- [ ] Credentials AWS valides
- [ ] Backup de la config CloudFront actuelle
- [ ] Tests locaux passés (Tasks 1-14)
- [ ] Plan de rollback documenté

### Pendant Déploiement
- [ ] Lambda@Edge functions déployées
- [ ] S3 bucket configuré (policy, CORS, lifecycle)
- [ ] CloudFront distribution mise à jour
- [ ] CloudWatch alarms créées
- [ ] Distribution CloudFront déployée (attendre 15-20 min)

### Après Déploiement
- [ ] Tests d'intégration passés
- [ ] Upload/download S3 fonctionnel
- [ ] CloudFront sert les assets
- [ ] Lambda@Edge s'exécute (vérifier logs)
- [ ] Security headers présents
- [ ] Compression activée
- [ ] Alarmes CloudWatch actives
- [ ] Tests de performance satisfaisants

## 🎯 Critères de Succès

1. **Lambda@Edge**: Fonctions déployées et attachées à CloudFront
2. **S3**: Upload/download fonctionnel avec accès public
3. **CloudFront**: Distribution active avec Lambda@Edge
4. **Monitoring**: Alarmes CloudWatch configurées et actives
5. **Performance**: Lighthouse score > 90
6. **Security**: Tous les security headers présents
7. **Compression**: Brotli/Gzip activé

## 🚀 Commandes Rapides

```bash
# Déploiement complet
cd lambda/edge && ./deploy.sh
aws s3api put-bucket-policy --bucket huntaze-assets --policy file://s3-bucket-policy.json
aws s3api put-bucket-cors --bucket huntaze-assets --cors-configuration file://s3-cors-config.json
aws cloudfront update-distribution --id E21VMD5A9KDBOO --if-match "$ETAG" --distribution-config file://cloudfront-config.json
npx tsx scripts/setup-lambda-edge-alarms.ts

# Vérification
npx tsx scripts/verify-aws-deployment.ts
npm run lighthouse
npm run test:e2e

# Monitoring
aws cloudwatch describe-alarms
aws logs tail /aws/lambda/us-east-1.huntaze-viewer-request --follow
```

## 📚 Documentation

- [Lambda@Edge README](../../lambda/edge/README.md)
- [AWS Setup Guide](./AWS-SETUP-GUIDE.md)
- [Task 6 Complete](./task-6-complete.md)
- [AWS Configuration Status](./AWS-CONFIGURATION-STATUS.md)

## ⏭️ Prochaine Étape

Après la Tâche 15, passer à la **Tâche 16 - Final Checkpoint** pour valider la production readiness.
