# Guide: Attacher les Credentials AWS à Amplify

## 📋 Ce dont vous avez besoin

Vos credentials IAM **permanents** (SANS session token):
- Access Key ID (commence par AKIA...)
- Secret Access Key
- Région AWS (us-east-1)

## 🔧 Étape 1: Vérifier les Permissions IAM

Votre utilisateur IAM doit avoir ces permissions:

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
        "arn:aws:s3:::huntaze-assets/*",
        "arn:aws:s3:::huntaze-assets"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:log-group:/aws/amplify/*"
    }
  ]
}
```

### Comment vérifier/ajouter les permissions:

1. **AWS Console** → IAM → Users
2. Cliquez sur votre utilisateur
3. Onglet **Permissions**
4. Cliquez **Add permissions** → **Attach policies directly**
5. Cherchez et attachez:
   - `AmazonS3FullAccess` (ou créez une policy custom ci-dessus)
   - `AmazonSESFullAccess`
   - `CloudWatchLogsFullAccess`

## 🚀 Étape 2: Configurer les Variables dans Amplify

### Option A: Via AWS Console (Recommandé)

1. **AWS Console** → Amplify → Votre App
2. Dans le menu gauche: **App settings** → **Environment variables**
3. Cliquez **Manage variables**
4. Ajoutez ces variables:

```bash
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...  # Votre Access Key
AWS_SECRET_ACCESS_KEY=...  # Votre Secret Key

# S3 Configuration
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1

# SES Configuration (Email)
FROM_EMAIL=noreply@huntaze.com
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@huntaze.com
AWS_SES_FROM_NAME=Huntaze

# CloudWatch (Logs)
CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production
CLOUDWATCH_REGION=us-east-1

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
```

5. Cliquez **Save**

### Option B: Via AWS CLI

```bash
# Définir les variables
aws amplify update-app \
  --app-id <VOTRE_APP_ID> \
  --environment-variables \
    AWS_REGION=us-east-1 \
    AWS_ACCESS_KEY_ID=AKIA... \
    AWS_SECRET_ACCESS_KEY=... \
    S3_BUCKET_NAME=huntaze-assets \
    FROM_EMAIL=noreply@huntaze.com
```

## ✅ Étape 3: Vérifier la Configuration

### 3.1 Créer un bucket S3 (si pas déjà fait)

```bash
# Créer le bucket
aws s3 mb s3://huntaze-assets --region us-east-1

# Configurer les permissions CORS
aws s3api put-bucket-cors --bucket huntaze-assets --cors-configuration file://cors.json
```

Créez `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.huntaze.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 3.2 Vérifier SES

```bash
# Vérifier votre email d'envoi
aws ses verify-email-identity --email-address noreply@huntaze.com --region us-east-1

# Vérifier le statut
aws ses get-identity-verification-attributes \
  --identities noreply@huntaze.com \
  --region us-east-1
```

**Important:** Vous recevrez un email de vérification. Cliquez sur le lien!

### 3.3 Tester les Credentials

Créez un script de test:

```bash
# test-aws-credentials.sh
#!/bin/bash

echo "🔍 Testing AWS Credentials..."

# Test S3
echo "📦 Testing S3..."
aws s3 ls s3://huntaze-assets --region us-east-1
if [ $? -eq 0 ]; then
  echo "✅ S3 access OK"
else
  echo "❌ S3 access FAILED"
fi

# Test SES
echo "📧 Testing SES..."
aws ses get-send-quota --region us-east-1
if [ $? -eq 0 ]; then
  echo "✅ SES access OK"
else
  echo "❌ SES access FAILED"
fi

# Test CloudWatch
echo "📊 Testing CloudWatch..."
aws logs describe-log-groups --region us-east-1 --limit 1
if [ $? -eq 0 ]; then
  echo "✅ CloudWatch access OK"
else
  echo "❌ CloudWatch access FAILED"
fi
```

Exécutez:
```bash
chmod +x test-aws-credentials.sh
./test-aws-credentials.sh
```

## 🔄 Étape 4: Redéployer l'Application

Après avoir configuré les variables:

```bash
# Déclencher un nouveau build
git commit --allow-empty -m "Trigger rebuild with AWS credentials"
git push origin main
```

Ou dans la console Amplify:
1. **App settings** → **Build settings**
2. Cliquez **Redeploy this version**

## 🐛 Dépannage

### Erreur: "AWS credentials not configured"

**Cause:** Les variables ne sont pas définies ou mal nommées

**Solution:**
1. Vérifiez que `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` sont bien définies
2. Pas de préfixe bizarre, juste ces noms exacts
3. Redéployez l'app

### Erreur: "Access Denied" pour S3

**Cause:** Permissions IAM insuffisantes

**Solution:**
```bash
# Vérifier les permissions
aws iam list-attached-user-policies --user-name VOTRE_USER_NAME

# Attacher la policy S3
aws iam attach-user-policy \
  --user-name VOTRE_USER_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Erreur: "Email address not verified" (SES)

**Cause:** L'email n'est pas vérifié dans SES

**Solution:**
```bash
# Vérifier l'email
aws ses verify-email-identity \
  --email-address noreply@huntaze.com \
  --region us-east-1

# Vérifier le statut
aws ses get-identity-verification-attributes \
  --identities noreply@huntaze.com \
  --region us-east-1
```

Cliquez sur le lien dans l'email de vérification!

### SES en mode Sandbox

Si vous êtes en mode sandbox, vous ne pouvez envoyer qu'à des emails vérifiés.

**Pour sortir du sandbox:**
1. AWS Console → SES → Account dashboard
2. Cliquez **Request production access**
3. Remplissez le formulaire (prend 24h)

**En attendant, vérifiez les emails de test:**
```bash
aws ses verify-email-identity \
  --email-address votre-email-test@example.com \
  --region us-east-1
```

## 📊 Vérifier que tout fonctionne

### Test S3 depuis votre app

Ajoutez cette route de test: `app/api/test/s3/route.ts`

```typescript
import { s3Service } from '@/lib/services/s3Service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test upload
    const testKey = 'test/test-file.txt';
    const testContent = Buffer.from('Hello from Amplify!');
    
    const url = await s3Service.upload({
      key: testKey,
      body: testContent,
    });
    
    // Test exists
    const exists = await s3Service.exists(testKey);
    
    // Test delete
    await s3Service.delete(testKey);
    
    return NextResponse.json({
      success: true,
      message: 'S3 test passed!',
      uploadedUrl: url,
      fileExisted: exists,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

Testez: `https://votre-app.amplifyapp.com/api/test/s3`

### Test SES depuis votre app

Ajoutez: `app/api/test/ses/route.ts`

```typescript
import { sendEmail } from '@/lib/services/email/ses';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const success = await sendEmail({
      to: 'votre-email-verifie@example.com', // Email vérifié dans SES
      subject: 'Test from Amplify',
      html: '<h1>Hello from Amplify!</h1>',
      text: 'Hello from Amplify!',
    });
    
    return NextResponse.json({
      success,
      message: success ? 'Email sent!' : 'Email failed',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

Testez: `https://votre-app.amplifyapp.com/api/test/ses`

## 🎯 Checklist Finale

- [ ] Utilisateur IAM créé avec permissions S3, SES, CloudWatch
- [ ] Access Key ID et Secret Access Key générés
- [ ] Variables ajoutées dans Amplify Console
- [ ] Bucket S3 créé et configuré
- [ ] Email SES vérifié (lien cliqué)
- [ ] Application redéployée
- [ ] Tests S3 et SES passent

## 📝 Variables Complètes pour Amplify

Copiez-collez dans Amplify Console:

```bash
# AWS Core
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# S3
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1

# SES
FROM_EMAIL=noreply@huntaze.com
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@huntaze.com
AWS_SES_FROM_NAME=Huntaze

# CloudWatch
CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production
CLOUDWATCH_REGION=us-east-1

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
AMPLIFY_ENV=production
```

Voilà! Vos services AWS sont maintenant connectés à Amplify. 🚀
