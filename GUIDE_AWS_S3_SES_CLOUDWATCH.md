# 🚀 Guide Complet: S3, SES & CloudWatch pour Huntaze

**Date:** 2024-11-25  
**Compte AWS:** 317805897534  
**Région:** us-east-1

---

## 📦 1. Amazon S3 (Simple Storage Service)

### 🎯 À Quoi Ça Sert?

S3 stocke vos fichiers (images, vidéos, documents):
- Photos de profil utilisateurs
- Images uploadées par les créateurs
- Vidéos pour OnlyFans
- Assets statiques (logos, etc.)

### ✅ Configuration Actuelle

**Bucket existant:** `huntaze-assets`  
**Région:** us-east-1

### 🔧 Vérifier que le Bucket Existe

```bash
# Lister vos buckets
aws s3 ls

# Vérifier huntaze-assets spécifiquement
aws s3 ls s3://huntaze-assets/
```

### 📋 Créer le Bucket (Si nécessaire)

```bash
# Créer le bucket
aws s3 mb s3://huntaze-assets --region us-east-1

# Configurer les permissions
aws s3api put-public-access-block \
  --bucket huntaze-assets \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Activer le versioning (optionnel mais recommandé)
aws s3api put-bucket-versioning \
  --bucket huntaze-assets \
  --versioning-configuration Status=Enabled

# Configurer CORS (pour uploads depuis le browser)
aws s3api put-bucket-cors \
  --bucket huntaze-assets \
  --cors-configuration file://s3-cors.json
```

**Fichier `s3-cors.json`:**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://app.huntaze.com",
        "https://production-ready.d33l77zi1h78ce.amplifyapp.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 🔐 Permissions IAM pour S3

**Policy minimale nécessaire:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::huntaze-assets",
        "arn:aws:s3:::huntaze-assets/*"
      ]
    }
  ]
}
```

### 💻 Utilisation dans Votre Code

**Installation:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Exemple d'upload:**
```typescript
// lib/storage/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ 
  region: process.env.S3_REGION || "us-east-1" 
});

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

// Générer une URL signée pour upload direct
export async function getUploadUrl(key: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

### 📊 Variables d'Environnement

```bash
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1
AWS_REGION=us-east-1
```

---

## 📧 2. Amazon SES (Simple Email Service)

### 🎯 À Quoi Ça Sert?

SES envoie vos emails:
- Magic links pour connexion
- Emails de vérification
- Notifications utilisateurs
- Emails transactionnels

### ✅ Configuration Actuelle

**Status:** ✅ Vérifié (Sandbox Mode)  
**Domain:** huntaze.com ✅  
**Email:** no-reply@huntaze.com ✅  
**Région:** us-east-1  
**Limite:** 200 emails/jour (Sandbox)

### 🚀 Sortir du Sandbox Mode

**Pourquoi?**
- Sandbox: 200 emails/jour, seulement vers emails vérifiés
- Production: 50,000+ emails/jour, vers n'importe qui

**Comment:**

1. **AWS Console → SES → Account Dashboard**
2. **Request production access**
3. **Remplir le formulaire:**
   ```
   Mail Type: Transactional
   Website URL: https://huntaze.com
   Use Case: Magic link authentication for user signup and login
   Expected Volume: 1,000 emails/day initially, scaling to 10,000/day
   Bounce/Complaint Handling: Automated via SNS notifications
   ```
4. **Attendre 24-48h** pour approbation

### 🔐 Permissions IAM pour SES

**Policy minimale:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:SendTemplatedEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### 💻 Utilisation dans Votre Code

**Installation:**
```bash
npm install @aws-sdk/client-ses
```

**Exemple d'envoi d'email:**
```typescript
// lib/email/ses.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ 
  region: process.env.AWS_SES_REGION || "us-east-1" 
});

export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
}: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) {
  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  const response = await sesClient.send(command);
  return response.MessageId;
}

// Exemple: Envoyer un magic link
export async function sendMagicLink(email: string, token: string) {
  const magicLink = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
  
  return await sendEmail({
    to: email,
    subject: "Connexion à Huntaze",
    htmlBody: `
      <h1>Connexion à Huntaze</h1>
      <p>Cliquez sur le lien ci-dessous pour vous connecter:</p>
      <a href="${magicLink}">Se connecter</a>
      <p>Ce lien expire dans 24 heures.</p>
    `,
    textBody: `
      Connexion à Huntaze
      
      Cliquez sur ce lien pour vous connecter:
      ${magicLink}
      
      Ce lien expire dans 24 heures.
    `,
  });
}
```

### 📊 Variables d'Environnement

```bash
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
AWS_SES_FROM_NAME=Huntaze
EMAIL_FROM=no-reply@huntaze.com
```

### 🧪 Tester SES

```bash
# Test simple via AWS CLI
aws ses send-email \
  --from no-reply@huntaze.com \
  --to charles@huntaze.com \
  --subject "Test Email" \
  --text "Testing SES configuration" \
  --region us-east-1

# Vérifier les statistiques
aws ses get-send-statistics --region us-east-1
```

### 📈 Monitoring SES

**Métriques importantes:**
- **Sends:** Emails envoyés
- **Bounces:** Emails rejetés (hard/soft)
- **Complaints:** Marqués comme spam
- **Delivery Rate:** Taux de livraison

**Configurer SNS pour les notifications:**
```bash
# Créer un topic SNS
aws sns create-topic --name huntaze-ses-bounces

# Configurer SES pour publier vers SNS
aws ses set-identity-notification-topic \
  --identity huntaze.com \
  --notification-type Bounce \
  --sns-topic arn:aws:sns:us-east-1:317805897534:huntaze-ses-bounces
```

---

## 📊 3. Amazon CloudWatch

### 🎯 À Quoi Ça Sert?

CloudWatch collecte vos logs et métriques:
- Logs d'application (erreurs, debug)
- Métriques de performance
- Alertes automatiques
- Monitoring en temps réel

### ✅ Configuration pour Amplify

**Log Group:** `/aws/amplify/huntaze-production`  
**Région:** us-east-1

### 🔧 Créer le Log Group

```bash
# Créer le log group
aws logs create-log-group \
  --log-group-name /aws/amplify/huntaze-production \
  --region us-east-1

# Configurer la rétention (30 jours)
aws logs put-retention-policy \
  --log-group-name /aws/amplify/huntaze-production \
  --retention-in-days 30 \
  --region us-east-1
```

### 🔐 Permissions IAM pour CloudWatch

**Policy minimale:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:us-east-1:317805897534:log-group:/aws/amplify/huntaze-production:*"
    }
  ]
}
```

### 💻 Utilisation dans Votre Code

**Installation:**
```bash
npm install @aws-sdk/client-cloudwatch-logs
```

**Exemple de logging:**
```typescript
// lib/logging/cloudwatch.ts
import { 
  CloudWatchLogsClient, 
  PutLogEventsCommand,
  CreateLogStreamCommand 
} from "@aws-sdk/client-cloudwatch-logs";

const cwClient = new CloudWatchLogsClient({ 
  region: process.env.CLOUDWATCH_REGION || "us-east-1" 
});

const LOG_GROUP = process.env.CLOUDWATCH_LOG_GROUP || "/aws/amplify/huntaze-production";

export async function logToCloudWatch(
  streamName: string,
  message: string,
  level: "INFO" | "WARN" | "ERROR" = "INFO"
) {
  try {
    // Créer le stream s'il n'existe pas
    try {
      await cwClient.send(new CreateLogStreamCommand({
        logGroupName: LOG_GROUP,
        logStreamName: streamName,
      }));
    } catch (e) {
      // Stream existe déjà, c'est ok
    }

    // Envoyer le log
    await cwClient.send(new PutLogEventsCommand({
      logGroupName: LOG_GROUP,
      logStreamName: streamName,
      logEvents: [{
        timestamp: Date.now(),
        message: JSON.stringify({
          level,
          message,
          timestamp: new Date().toISOString(),
        }),
      }],
    }));
  } catch (error) {
    console.error("Failed to log to CloudWatch:", error);
  }
}

// Wrapper pour faciliter l'utilisation
export const logger = {
  info: (message: string) => logToCloudWatch("app-info", message, "INFO"),
  warn: (message: string) => logToCloudWatch("app-warn", message, "WARN"),
  error: (message: string) => logToCloudWatch("app-error", message, "ERROR"),
};
```

**Utilisation:**
```typescript
import { logger } from "@/lib/logging/cloudwatch";

// Dans votre code
await logger.info("User signed up successfully");
await logger.error("Failed to send email: " + error.message);
```

### 📊 Variables d'Environnement

```bash
CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production
CLOUDWATCH_REGION=us-east-1
```

### 🔍 Consulter les Logs

**Via AWS CLI:**
```bash
# Lister les log streams
aws logs describe-log-streams \
  --log-group-name /aws/amplify/huntaze-production \
  --region us-east-1

# Voir les logs récents
aws logs tail /aws/amplify/huntaze-production \
  --follow \
  --region us-east-1

# Filtrer les erreurs
aws logs filter-log-events \
  --log-group-name /aws/amplify/huntaze-production \
  --filter-pattern "ERROR" \
  --region us-east-1
```

**Via Console:**
1. AWS Console → CloudWatch → Log groups
2. Sélectionner `/aws/amplify/huntaze-production`
3. Voir les streams et logs

### 📈 Créer des Alarmes

**Exemple: Alerte sur erreurs:**
```bash
# Créer une métrique de filtre
aws logs put-metric-filter \
  --log-group-name /aws/amplify/huntaze-production \
  --filter-name ErrorCount \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=Huntaze,metricValue=1

# Créer une alarme
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-high-error-rate \
  --alarm-description "Alert when error rate is high" \
  --metric-name ErrorCount \
  --namespace Huntaze \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 🎯 Configuration Complète - Résumé

### 📋 Variables d'Environnement Nécessaires

```bash
# S3
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1

# SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
AWS_SES_FROM_NAME=Huntaze
EMAIL_FROM=no-reply@huntaze.com

# CloudWatch
CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production
CLOUDWATCH_REGION=us-east-1

# AWS General
AWS_REGION=us-east-1
```

### 🔐 IAM Role Recommandé (Au lieu de credentials)

**Créer un role avec ces policies:**
1. S3: `AmazonS3FullAccess` (ou custom policy ci-dessus)
2. SES: `AmazonSESFullAccess` (ou custom policy ci-dessus)
3. CloudWatch: `CloudWatchLogsFullAccess` (ou custom policy ci-dessus)

**Attacher à Amplify:**
```bash
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --iam-service-role-arn arn:aws:iam::317805897534:role/HuntazeAmplifyRole
```

---

## 🧪 Scripts de Test

### Test S3
```bash
# Upload un fichier test
echo "test" > test.txt
aws s3 cp test.txt s3://huntaze-assets/test.txt

# Vérifier
aws s3 ls s3://huntaze-assets/

# Télécharger
aws s3 cp s3://huntaze-assets/test.txt downloaded.txt

# Nettoyer
rm test.txt downloaded.txt
aws s3 rm s3://huntaze-assets/test.txt
```

### Test SES
```bash
# Envoyer un email test
aws ses send-email \
  --from no-reply@huntaze.com \
  --to charles@huntaze.com \
  --subject "Test Huntaze" \
  --text "Test email from SES" \
  --region us-east-1
```

### Test CloudWatch
```bash
# Créer un log test
aws logs put-log-events \
  --log-group-name /aws/amplify/huntaze-production \
  --log-stream-name test-stream \
  --log-events timestamp=$(date +%s)000,message="Test log message" \
  --region us-east-1

# Voir les logs
aws logs tail /aws/amplify/huntaze-production --follow
```

---

## 📚 Ressources

### Documentation AWS
- **S3:** https://docs.aws.amazon.com/s3/
- **SES:** https://docs.aws.amazon.com/ses/
- **CloudWatch:** https://docs.aws.amazon.com/cloudwatch/

### SDK JavaScript
- **AWS SDK v3:** https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/

### Votre Console AWS
- **S3:** https://s3.console.aws.amazon.com/s3/buckets/huntaze-assets
- **SES:** https://console.aws.amazon.com/ses/home?region=us-east-1
- **CloudWatch:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1

---

## ✅ Checklist de Configuration

- [ ] S3 Bucket `huntaze-assets` créé
- [ ] S3 CORS configuré
- [ ] S3 Permissions IAM configurées
- [ ] SES Domain vérifié (huntaze.com) ✅
- [ ] SES Email vérifié (no-reply@huntaze.com) ✅
- [ ] SES Production access demandé
- [ ] CloudWatch Log Group créé
- [ ] CloudWatch Permissions IAM configurées
- [ ] IAM Role créé et attaché à Amplify
- [ ] Variables d'environnement ajoutées à Amplify
- [ ] Tests effectués (S3, SES, CloudWatch)

---

**Besoin d'aide?** Consultez `CREDENTIALS_GÉNÉRÉS.md` pour plus de détails sur les credentials AWS!
