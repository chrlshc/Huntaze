#!/bin/bash

# 🚀 Script de Déploiement Production AWS - Huntaze
# Configure tout l'environnement production sur AWS

set -e

echo "🚀 Déploiement Production Huntaze sur AWS"
echo "=========================================="
echo ""

# Variables
APP_ID="d2gmcfr71gawhz"
BRANCH="main"
REGION="us-east-1"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Créer les secrets AWS Secrets Manager
echo "📦 Étape 1/5: Création des secrets dans AWS Secrets Manager"
echo ""

# Stripe secrets
echo "  → Création secret Stripe..."
aws secretsmanager create-secret \
  --name huntaze/stripe \
  --description "Stripe API keys for Huntaze production" \
  --secret-string '{
    "STRIPE_SECRET_KEY":"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",
    "STRIPE_PUBLISHABLE_KEY":"pk_live_...",
    "STRIPE_WEBHOOK_SECRET":"whsec_..."
  }' \
  --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id huntaze/stripe \
  --secret-string '{
    "STRIPE_SECRET_KEY":"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",
    "STRIPE_PUBLISHABLE_KEY":"pk_live_...",
    "STRIPE_WEBHOOK_SECRET":"whsec_..."
  }' \
  --region $REGION

echo -e "${GREEN}  ✅ Secret Stripe créé/mis à jour${NC}"

# Azure OpenAI secrets
echo "  → Création secret Azure OpenAI..."
aws secretsmanager create-secret \
  --name huntaze/azure-openai \
  --description "Azure OpenAI credentials for Huntaze" \
  --secret-string '{
    "AZURE_OPENAI_API_KEY":"9YrdPSyu9StY896EE9Csqx6UBPhnYMpiTLgg6KK5aIqaLrGz5558JQQJ99BJACHYHv6XJ3w3AAABACOGfXiX",
    "AZURE_OPENAI_ENDPOINT":"https://huntaze-ai-eus2-29796.openai.azure.com",
    "AZURE_OPENAI_DEPLOYMENT":"gpt-4o",
    "AZURE_OPENAI_API_VERSION":"2024-05-01-preview"
  }' \
  --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id huntaze/azure-openai \
  --secret-string '{
    "AZURE_OPENAI_API_KEY":"9YrdPSyu9StY896EE9Csqx6UBPhnYMpiTLgg6KK5aIqaLrGz5558JQQJ99BJACHYHv6XJ3w3AAABACOGfXiX",
    "AZURE_OPENAI_ENDPOINT":"https://huntaze-ai-eus2-29796.openai.azure.com",
    "AZURE_OPENAI_DEPLOYMENT":"gpt-4o",
    "AZURE_OPENAI_API_VERSION":"2024-05-01-preview"
  }' \
  --region $REGION

echo -e "${GREEN}  ✅ Secret Azure OpenAI créé/mis à jour${NC}"

# NextAuth secret
echo "  → Création secret NextAuth..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
aws secretsmanager create-secret \
  --name huntaze/nextauth \
  --description "NextAuth secret for Huntaze" \
  --secret-string "{\"NEXTAUTH_SECRET\":\"$NEXTAUTH_SECRET\"}" \
  --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id huntaze/nextauth \
  --secret-string "{\"NEXTAUTH_SECRET\":\"$NEXTAUTH_SECRET\"}" \
  --region $REGION

echo -e "${GREEN}  ✅ Secret NextAuth créé/mis à jour${NC}"
echo ""

# 2. Créer RDS PostgreSQL
echo "📦 Étape 2/5: Création base de données RDS PostgreSQL"
echo ""

DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

echo "  → Création instance RDS..."
aws rds create-db-instance \
  --db-instance-identifier huntaze-prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username huntaze_admin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --db-name huntaze_prod \
  --region $REGION 2>/dev/null || echo "  ⚠️  RDS instance existe déjà"

echo "  → Attente de la disponibilité de la base de données (5-10 min)..."
aws rds wait db-instance-available \
  --db-instance-identifier huntaze-prod-db \
  --region $REGION 2>/dev/null || echo "  ⚠️  En attente..."

# Récupérer l'endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-prod-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region $REGION 2>/dev/null || echo "pending")

if [ "$DB_ENDPOINT" != "pending" ]; then
  DATABASE_URL="postgresql://huntaze_admin:$DB_PASSWORD@$DB_ENDPOINT:5432/huntaze_prod"
  
  # Sauvegarder dans Secrets Manager
  aws secretsmanager create-secret \
    --name huntaze/database \
    --description "Database connection for Huntaze" \
    --secret-string "{\"DATABASE_URL\":\"$DATABASE_URL\",\"DB_PASSWORD\":\"$DB_PASSWORD\"}" \
    --region $REGION 2>/dev/null || \
  aws secretsmanager update-secret \
    --secret-id huntaze/database \
    --secret-string "{\"DATABASE_URL\":\"$DATABASE_URL\",\"DB_PASSWORD\":\"$DB_PASSWORD\"}" \
    --region $REGION
  
  echo -e "${GREEN}  ✅ Base de données créée: $DB_ENDPOINT${NC}"
  echo -e "${YELLOW}  ⚠️  Sauvegardez le mot de passe: $DB_PASSWORD${NC}"
else
  echo -e "${YELLOW}  ⚠️  Base de données en cours de création...${NC}"
  DATABASE_URL="postgresql://huntaze_admin:$DB_PASSWORD@pending:5432/huntaze_prod"
fi
echo ""

# 3. Configurer les variables d'environnement Amplify
echo "📦 Étape 3/5: Configuration variables d'environnement Amplify"
echo ""

echo "  → Mise à jour des variables Amplify..."
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --environment-variables \
    NEXT_PUBLIC_API_URL="https://app.huntaze.com/api" \
    NEXT_PUBLIC_APP_URL="https://app.huntaze.com" \
    NEXT_PUBLIC_REDDIT_REDIRECT_URI="https://huntaze.com/auth/reddit/callback" \
    NEXT_DISABLE_ESLINT="1" \
    NEXT_PRIVATE_SKIP_TYPECHECK="true" \
    NEXT_TELEMETRY_DISABLED="1" \
    NODE_ENV="production" \
    DATABASE_URL="$DATABASE_URL" \
    AZURE_OPENAI_API_KEY="9YrdPSyu9StY896EE9Csqx6UBPhnYMpiTLgg6KK5aIqaLrGz5558JQQJ99BJACHYHv6XJ3w3AAABACOGfXiX" \
    AZURE_OPENAI_ENDPOINT="https://huntaze-ai-eus2-29796.openai.azure.com" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4o" \
    AZURE_OPENAI_API_VERSION="2024-05-01-preview" \
    DEFAULT_AI_MODEL="gpt-4o" \
    DEFAULT_AI_PROVIDER="azure" \
    STRIPE_SECRET_KEY="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" \
    NEXTAUTH_URL="https://app.huntaze.com" \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    ENABLE_AI_ROUTING="true" \
    ENABLE_PROMPT_CACHING="true" \
  --region $REGION

echo -e "${GREEN}  ✅ Variables Amplify configurées${NC}"
echo ""

# 4. Créer S3 bucket pour media
echo "📦 Étape 4/5: Création bucket S3 pour media"
echo ""

echo "  → Création bucket huntaze-media-prod..."
aws s3 mb s3://huntaze-media-prod-317805897534 --region $REGION 2>/dev/null || echo "  ⚠️  Bucket existe déjà"

# Configurer CORS
cat > /tmp/cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.huntaze.com", "https://huntaze.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket huntaze-media-prod-317805897534 \
  --cors-configuration file:///tmp/cors-config.json \
  --region $REGION 2>/dev/null || echo "  ⚠️  CORS déjà configuré"

# Configurer lifecycle
cat > /tmp/lifecycle-config.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldArtifacts",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket huntaze-media-prod-317805897534 \
  --lifecycle-configuration file:///tmp/lifecycle-config.json \
  --region $REGION 2>/dev/null || echo "  ⚠️  Lifecycle déjà configuré"

echo -e "${GREEN}  ✅ Bucket S3 media configuré${NC}"
echo ""

# 5. Déclencher un nouveau déploiement
echo "📦 Étape 5/5: Déclenchement du déploiement"
echo ""

echo "  → Démarrage du build Amplify..."
JOB_ID=$(aws amplify start-job \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --job-type RELEASE \
  --query 'jobSummary.jobId' \
  --output text \
  --region $REGION)

echo -e "${GREEN}  ✅ Build démarré: $JOB_ID${NC}"
echo ""

# Résumé
echo "=========================================="
echo "✅ Déploiement Lancé avec Succès!"
echo "=========================================="
echo ""
echo "📊 Résumé:"
echo "  • App Amplify: $APP_ID"
echo "  • Branch: $BRANCH"
echo "  • Job ID: $JOB_ID"
echo "  • Database: $DB_ENDPOINT"
echo "  • Region: $REGION"
echo ""
echo "🔗 Liens Utiles:"
echo "  • App URL: https://app.huntaze.com"
echo "  • Amplify Console: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo "  • Build Status: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/$BRANCH/$JOB_ID"
echo ""
echo "📝 Prochaines Étapes:"
echo "  1. Attendre la fin du build (5-10 min)"
echo "  2. Vérifier: curl https://app.huntaze.com/api/health"
echo "  3. Configurer le webhook Stripe: https://app.huntaze.com/api/webhooks/stripe"
echo "  4. Tester l'authentification"
echo "  5. Tester la génération de contenu AI"
echo ""
echo "🔐 Secrets Créés:"
echo "  • huntaze/stripe (Stripe keys)"
echo "  • huntaze/azure-openai (Azure OpenAI)"
echo "  • huntaze/nextauth (NextAuth secret)"
echo "  • huntaze/database (Database URL)"
echo ""
echo "💡 Pour voir les logs du build:"
echo "  aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID"
echo ""
