#!/bin/bash

# ============================================================================
# 🔑 RÉCUPÉRATION AUTOMATIQUE DES CLÉS AWS
# ============================================================================

set -e

echo "🔑 Récupération des clés AWS via CLI"
echo "===================================="
echo ""

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé"
    echo ""
    echo "Installation:"
    echo "  macOS: brew install awscli"
    echo "  Linux: pip install awscli"
    echo "  Windows: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI installé"
echo ""

# Vérifier la connexion AWS
echo "🔐 Vérification de la connexion AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Non connecté à AWS"
    echo ""
    echo "Configuration:"
    echo "  aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
echo "✅ Connecté à AWS"
echo "   Account: $ACCOUNT_ID"
echo "   User: $USER_ARN"
echo ""

# ============================================================================
# 1️⃣ VÉRIFIER LES ACCESS KEYS EXISTANTES
# ============================================================================

echo "📋 1. VÉRIFICATION DES ACCESS KEYS EXISTANTES"
echo ""

# Extraire le nom d'utilisateur de l'ARN
if echo "$USER_ARN" | grep -q "assumed-role"; then
    echo "⚠️  Tu utilises un rôle IAM (assumed-role)"
    echo "   Les access keys ne sont pas disponibles pour les rôles"
    echo ""
    echo "Options:"
    echo "  1. Utilise les credentials temporaires du rôle"
    echo "  2. Crée un utilisateur IAM avec access keys"
    echo ""
    read -p "Veux-tu créer un utilisateur IAM? (y/n): " CREATE_USER
    
    if [ "$CREATE_USER" = "y" ]; then
        read -p "Nom de l'utilisateur IAM: " IAM_USER
        
        echo "🔧 Création de l'utilisateur IAM..."
        aws iam create-user --user-name "$IAM_USER"
        
        echo "🔧 Attachement de la politique AdministratorAccess..."
        aws iam attach-user-policy \
            --user-name "$IAM_USER" \
            --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess"
        
        echo "✅ Utilisateur IAM créé: $IAM_USER"
        echo ""
    else
        echo "❌ Impossible de continuer sans access keys"
        exit 1
    fi
else
    IAM_USER=$(echo "$USER_ARN" | sed 's/.*user\///')
    echo "✅ Utilisateur IAM: $IAM_USER"
fi

echo ""

# Lister les access keys existantes
echo "🔍 Recherche des access keys existantes..."
EXISTING_KEYS=$(aws iam list-access-keys --user-name "$IAM_USER" --query "AccessKeyMetadata[].AccessKeyId" --output text)

if [ -n "$EXISTING_KEYS" ]; then
    echo "✅ Access keys existantes:"
    echo "$EXISTING_KEYS" | while read -r key; do
        STATUS=$(aws iam list-access-keys --user-name "$IAM_USER" --query "AccessKeyMetadata[?AccessKeyId=='$key'].Status" --output text)
        echo "  - $key (Status: $STATUS)"
    done
    echo ""
    
    # Compter le nombre de clés
    KEY_COUNT=$(echo "$EXISTING_KEYS" | wc -w)
    
    if [ "$KEY_COUNT" -ge 2 ]; then
        echo "⚠️  Tu as déjà 2 access keys (maximum AWS)"
        echo ""
        echo "Options:"
        echo "  1. Utiliser une clé existante"
        echo "  2. Supprimer une clé et en créer une nouvelle"
        echo ""
        read -p "Choix (1/2): " CHOICE
        
        if [ "$CHOICE" = "2" ]; then
            echo ""
            echo "Clés existantes:"
            echo "$EXISTING_KEYS" | nl
            echo ""
            read -p "Numéro de la clé à supprimer: " KEY_NUM
            KEY_TO_DELETE=$(echo "$EXISTING_KEYS" | sed -n "${KEY_NUM}p")
            
            echo "🗑️  Suppression de la clé: $KEY_TO_DELETE"
            aws iam delete-access-key --user-name "$IAM_USER" --access-key-id "$KEY_TO_DELETE"
            echo "✅ Clé supprimée"
            echo ""
            
            CREATE_NEW_KEY="y"
        else
            echo ""
            echo "⚠️  Tu dois récupérer la secret key manuellement"
            echo "   (AWS ne permet pas de récupérer les secret keys existantes)"
            echo ""
            read -p "Access Key ID: " AWS_ACCESS_KEY_ID
            read -p "Secret Access Key: " AWS_SECRET_ACCESS_KEY
            CREATE_NEW_KEY="n"
        fi
    else
        read -p "Créer une nouvelle access key? (y/n): " CREATE_NEW_KEY
    fi
else
    echo "⚠️  Aucune access key existante"
    CREATE_NEW_KEY="y"
fi

echo ""

# ============================================================================
# 2️⃣ CRÉER UNE NOUVELLE ACCESS KEY
# ============================================================================

if [ "$CREATE_NEW_KEY" = "y" ]; then
    echo "📋 2. CRÉATION D'UNE NOUVELLE ACCESS KEY"
    echo ""
    
    echo "🔧 Création de l'access key..."
    KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER" --output json)
    
    AWS_ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*"' | sed 's/"AccessKeyId": "\(.*\)"/\1/')
    AWS_SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*"' | sed 's/"SecretAccessKey": "\(.*\)"/\1/')
    
    echo "✅ Access key créée"
    echo ""
fi

# ============================================================================
# 3️⃣ RÉCUPÉRER LA CONFIGURATION AWS
# ============================================================================

echo "📋 3. RÉCUPÉRATION DE LA CONFIGURATION AWS"
echo ""

# Région par défaut
AWS_REGION=$(aws configure get region || echo "us-east-2")
echo "✅ Région AWS: $AWS_REGION"
echo ""

# Récupérer les informations de l'infrastructure déployée
echo "🔍 Recherche de l'infrastructure déployée..."

# RDS
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --region "$AWS_REGION" \
    --query "DBInstances[?contains(DBInstanceIdentifier, 'huntaze')].Endpoint.Address" \
    --output text 2>/dev/null | head -n 1)

if [ -n "$RDS_ENDPOINT" ]; then
    echo "✅ RDS trouvé: $RDS_ENDPOINT"
else
    echo "⚠️  RDS non trouvé"
    RDS_ENDPOINT="huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com"
fi

# Redis
REDIS_ENDPOINT=$(aws elasticache describe-serverless-caches \
    --region "$AWS_REGION" \
    --query "ServerlessCaches[?contains(ServerlessCacheName, 'huntaze')].Endpoint.Address" \
    --output text 2>/dev/null | head -n 1)

if [ -n "$REDIS_ENDPOINT" ]; then
    echo "✅ Redis trouvé: $REDIS_ENDPOINT"
else
    echo "⚠️  Redis non trouvé"
    REDIS_ENDPOINT="huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com"
fi

# S3
S3_BUCKET=$(aws s3api list-buckets \
    --query "Buckets[?contains(Name, 'huntaze')].Name" \
    --output text 2>/dev/null | head -n 1)

if [ -n "$S3_BUCKET" ]; then
    echo "✅ S3 trouvé: $S3_BUCKET"
else
    echo "⚠️  S3 non trouvé"
    S3_BUCKET="huntaze-beta-storage-1766460248"
fi

echo ""

# ============================================================================
# 4️⃣ SAUVEGARDER LES CLÉS
# ============================================================================

echo "📋 4. SAUVEGARDE DES CLÉS"
echo ""

OUTPUT_FILE="deployment-beta-50users/aws-keys.env"

cat > "$OUTPUT_FILE" << EOF
# AWS Keys - Récupérées automatiquement
# Date: $(date)
# Account: $ACCOUNT_ID
# User: $IAM_USER

# AWS Credentials
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_REGION=$AWS_REGION

# AWS Infrastructure
DATABASE_URL=postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@$RDS_ENDPOINT:5432/huntaze_production
REDIS_URL=redis://$REDIS_ENDPOINT:6379
AWS_S3_BUCKET=$S3_BUCKET
EOF

echo "✅ Clés sauvegardées: $OUTPUT_FILE"
echo ""

# ============================================================================
# 5️⃣ AFFICHER LES CLÉS
# ============================================================================

echo "============================================"
echo "📋 CLÉS AWS RÉCUPÉRÉES"
echo "============================================"
echo ""
echo "AWS Credentials:"
echo "  AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
echo "  AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
echo "  AWS_REGION=$AWS_REGION"
echo ""
echo "AWS Infrastructure:"
echo "  DATABASE_URL=postgresql://huntaze_admin:***@$RDS_ENDPOINT:5432/huntaze_production"
echo "  REDIS_URL=redis://$REDIS_ENDPOINT:6379"
echo "  AWS_S3_BUCKET=$S3_BUCKET"
echo ""
echo "============================================"
echo ""

# ============================================================================
# 6️⃣ METTRE À JOUR COPY-PASTE-VERCEL.txt
# ============================================================================

echo "📋 5. MISE À JOUR DE COPY-PASTE-VERCEL.txt"
echo ""

VERCEL_FILE="deployment-beta-50users/COPY-PASTE-VERCEL.txt"

# Créer une copie de backup si pas déjà fait
if [ ! -f "${VERCEL_FILE}.backup" ]; then
    cp "$VERCEL_FILE" "${VERCEL_FILE}.backup"
fi

# Remplacer les placeholders
sed -i.tmp "s|<TON_ACCESS_KEY_ID>|$AWS_ACCESS_KEY_ID|g" "$VERCEL_FILE"
sed -i.tmp "s|<TON_SECRET_ACCESS_KEY>|$AWS_SECRET_ACCESS_KEY|g" "$VERCEL_FILE"
rm -f "${VERCEL_FILE}.tmp"

echo "✅ COPY-PASTE-VERCEL.txt mis à jour"
echo ""

# ============================================================================
# 7️⃣ TESTER LES CLÉS
# ============================================================================

echo "📋 6. TEST DES CLÉS"
echo ""

# Test S3
echo "🧪 Test S3..."
if aws s3 ls "s3://$S3_BUCKET" --region "$AWS_REGION" &> /dev/null; then
    echo "✅ S3 accessible"
else
    echo "❌ S3 non accessible"
fi
echo ""

# Test RDS (connexion réseau)
echo "🧪 Test RDS (connexion réseau)..."
if nc -z -w5 "$RDS_ENDPOINT" 5432 2>/dev/null; then
    echo "✅ RDS accessible (port 5432 ouvert)"
else
    echo "⚠️  RDS non accessible (vérifie le Security Group)"
fi
echo ""

# Test Redis (connexion réseau)
echo "🧪 Test Redis (connexion réseau)..."
if nc -z -w5 "$REDIS_ENDPOINT" 6379 2>/dev/null; then
    echo "✅ Redis accessible (port 6379 ouvert)"
else
    echo "⚠️  Redis non accessible (vérifie le Security Group)"
fi
echo ""

# ============================================================================
# 8️⃣ RÉSUMÉ
# ============================================================================

echo "============================================"
echo "✅ RÉCUPÉRATION TERMINÉE"
echo "============================================"
echo ""
echo "📁 Fichiers créés:"
echo "  - $OUTPUT_FILE"
echo "  - ${VERCEL_FILE}.backup (backup)"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifie les clés dans: $OUTPUT_FILE"
echo "  2. Copie les variables depuis: $VERCEL_FILE"
echo "  3. Colle dans Vercel (Settings → Environment Variables)"
echo "  4. Déploie: vercel --prod"
echo ""
echo "🔐 Sécurité:"
echo "  ⚠️  SAUVEGARDE ta Secret Access Key!"
echo "  ⚠️  AWS ne permet pas de la récupérer plus tard"
echo "  ⚠️  Ne commite PAS ces fichiers dans Git!"
echo ""

# Ajouter au .gitignore
if ! grep -q "aws-keys.env" .gitignore 2>/dev/null; then
    echo "aws-keys.env" >> .gitignore
    echo "✅ aws-keys.env ajouté au .gitignore"
fi

echo "🎉 Terminé!"
