# 🎯 Guide Simple: S3, SES & CloudWatch

## ⚡ Configuration Rapide (5 minutes)

### Étape 1: Exécuter le Script de Setup

```bash
./scripts/setup-aws-services.sh
```

**Ce script va:**
- ✅ Créer le bucket S3 `huntaze-assets`
- ✅ Configurer les permissions S3
- ✅ Vérifier SES (domain + email)
- ✅ Créer le log group CloudWatch
- ✅ Tout configurer automatiquement

---

### Étape 2: Tester les Services

```bash
./scripts/test-aws-services.sh
```

**Ce script va:**
- ✅ Uploader un fichier test sur S3
- ✅ Envoyer un email test via SES
- ✅ Écrire un log test dans CloudWatch
- ✅ Afficher les résultats

---

### Étape 3: Vérifier les Résultats

**S3:**
```bash
aws s3 ls s3://huntaze-assets/
```

**SES:**
- Vérifiez votre email (charles@huntaze.com)
- Vous devriez avoir reçu un email test

**CloudWatch:**
```bash
aws logs tail /aws/amplify/huntaze-production --follow
```

---

## 📋 Variables d'Environnement à Ajouter

Après avoir testé, ajoutez ces variables dans Amplify:

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

---

## 🔐 Credentials AWS

### Option 1: IAM Role (Recommandé) ⭐

**Pas besoin de AWS_ACCESS_KEY_ID/SECRET!**

**Créer le role:**
```bash
# 1. AWS Console → IAM → Roles → Create Role
# 2. Select "AWS Service" → "Amplify"
# 3. Attach policies:
#    - AmazonS3FullAccess
#    - AmazonSESFullAccess
#    - CloudWatchLogsFullAccess
# 4. Name: HuntazeAmplifyRole
```

**Attacher à Amplify:**
```bash
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --iam-service-role-arn arn:aws:iam::317805897534:role/HuntazeAmplifyRole
```

### Option 2: Credentials Statiques

**Si vous devez absolument les utiliser:**

```bash
# Créer access key
aws iam create-access-key --user-name huntaze

# Ajouter dans Amplify:
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

---

## 🎯 Résumé Ultra-Rapide

### Ce Dont Vous Avez Besoin:

1. **S3 Bucket** → `huntaze-assets` (créé par script)
2. **SES Vérifié** → `no-reply@huntaze.com` ✅ (déjà fait!)
3. **CloudWatch Log Group** → `/aws/amplify/huntaze-production` (créé par script)
4. **IAM Role** → HuntazeAmplifyRole (à créer)

### Commandes Rapides:

```bash
# 1. Setup tout
./scripts/setup-aws-services.sh

# 2. Tester tout
./scripts/test-aws-services.sh

# 3. Vérifier S3
aws s3 ls s3://huntaze-assets/

# 4. Vérifier SES
aws ses get-send-quota --region us-east-1

# 5. Vérifier CloudWatch
aws logs describe-log-groups --log-group-name-prefix /aws/amplify/huntaze
```

---

## 📊 Status Actuel

### S3
- **Bucket:** huntaze-assets
- **Status:** À créer (ou vérifier)
- **Action:** Exécuter `setup-aws-services.sh`

### SES
- **Domain:** huntaze.com ✅ Vérifié
- **Email:** no-reply@huntaze.com ✅ Vérifié
- **Status:** Sandbox Mode (200 emails/jour)
- **Action:** Demander production access

### CloudWatch
- **Log Group:** /aws/amplify/huntaze-production
- **Status:** À créer (ou vérifier)
- **Action:** Exécuter `setup-aws-services.sh`

---

## 🆘 Troubleshooting

### "Access Denied" lors du setup?
→ Vérifiez que votre utilisateur AWS a les permissions nécessaires

### SES en Sandbox Mode?
→ Normal! Demandez production access dans SES Console

### Bucket S3 déjà existe?
→ Parfait! Le script va juste vérifier la configuration

### CloudWatch logs n'apparaissent pas?
→ Attendez quelques minutes, puis vérifiez dans la Console

---

## 📚 Documentation Complète

Pour plus de détails:
- **Guide complet:** `GUIDE_AWS_S3_SES_CLOUDWATCH.md`
- **Credentials:** `CREDENTIALS_GÉNÉRÉS.md`
- **Configuration:** `RÉPONSES_RAPIDES.md`

---

**Temps estimé:** 5 minutes  
**Difficulté:** ⭐ Facile  
**Résultat:** ✅ Services AWS configurés
