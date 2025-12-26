#!/bin/bash

# ============================================================================
# 🔐 Finaliser le Setup AWS - Créer les Secrets
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-2"
PROJECT_NAME="huntaze"
ENVIRONMENT="beta"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔐 Finalisation AWS Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# 1. Récupérer les Endpoints
# ============================================================================
echo -e "${BLUE}📡 Récupération des endpoints...${NC}"

DB_ENDPOINT=$(aws rds describe-db-instances \
  --region $REGION \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

REDIS_ENDPOINT=$(aws elasticache describe-serverless-caches \
  --region $REGION \
  --serverless-cache-name huntaze-beta-redis \
  --query 'ServerlessCaches[0].Endpoint.Address' \
  --output text)

S3_BUCKET=$(aws s3api list-buckets \
  --query "Buckets[?starts_with(Name, 'huntaze-beta-storage')].Name" \
  --output text | head -1)

echo -e "${GREEN}✓ RDS Endpoint: $DB_ENDPOINT${NC}"
echo -e "${GREEN}✓ Redis Endpoint: $REDIS_ENDPOINT${NC}"
echo -e "${GREEN}✓ S3 Bucket: $S3_BUCKET${NC}"
echo ""

# ============================================================================
# 2. Générer/Demander le Mot de Passe
# ============================================================================
echo -e "${YELLOW}⚠️  Le mot de passe RDS doit être configuré${NC}"
echo ""
echo "Options:"
echo "1. Générer un nouveau mot de passe et réinitialiser RDS"
echo "2. Entrer le mot de passe existant"
echo ""
read -p "Choix (1 ou 2): " choice

if [ "$choice" == "1" ]; then
  echo -e "${BLUE}🔑 Génération d'un nouveau mot de passe...${NC}"
  DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
  
  echo -e "${YELLOW}Réinitialisation du mot de passe RDS...${NC}"
  aws rds modify-db-instance \
    --region $REGION \
    --db-instance-identifier huntaze-beta-db \
    --master-user-password "$DB_PASSWORD" \
    --apply-immediately
  
  echo -e "${GREEN}✓ Mot de passe réinitialisé${NC}"
  echo -e "${YELLOW}⏳ Attente de l'application du changement (30 secondes)...${NC}"
  sleep 30
else
  read -sp "Entrez le mot de passe RDS: " DB_PASSWORD
  echo ""
fi

DB_USERNAME="huntaze_admin"
DB_NAME="huntaze_production"

# ============================================================================
# 3. Créer les URLs
# ============================================================================
echo -e "${BLUE}🔗 Création des URLs de connexion...${NC}"

DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/${DB_NAME}"
REDIS_URL="redis://${REDIS_ENDPOINT}:6379"

echo -e "${GREEN}✓ URLs créées${NC}"
echo ""

# ============================================================================
# 4. Stocker dans Secrets Manager
# ============================================================================
echo -e "${BLUE}🔐 Stockage dans AWS Secrets Manager...${NC}"

# Database URL
aws secretsmanager create-secret \
  --region $REGION \
  --name "${PROJECT_NAME}/${ENVIRONMENT}/database-url" \
  --description "Huntaze Database URL" \
  --secret-string "$DATABASE_URL" \
  2>/dev/null && echo -e "${GREEN}✓ Secret database-url créé${NC}" || \
aws secretsmanager update-secret \
  --region $REGION \
  --secret-id "${PROJECT_NAME}/${ENVIRONMENT}/database-url" \
  --secret-string "$DATABASE_URL" && echo -e "${GREEN}✓ Secret database-url mis à jour${NC}"

# Redis URL
aws secretsmanager create-secret \
  --region $REGION \
  --name "${PROJECT_NAME}/${ENVIRONMENT}/redis-url" \
  --description "Huntaze Redis URL" \
  --secret-string "$REDIS_URL" \
  2>/dev/null && echo -e "${GREEN}✓ Secret redis-url créé${NC}" || \
aws secretsmanager update-secret \
  --region $REGION \
  --secret-id "${PROJECT_NAME}/${ENVIRONMENT}/redis-url" \
  --secret-string "$REDIS_URL" && echo -e "${GREEN}✓ Secret redis-url mis à jour${NC}"

# DB Password seul
aws secretsmanager create-secret \
  --region $REGION \
  --name "${PROJECT_NAME}/${ENVIRONMENT}/db-password" \
  --description "Huntaze DB Password" \
  --secret-string "$DB_PASSWORD" \
  2>/dev/null && echo -e "${GREEN}✓ Secret db-password créé${NC}" || \
aws secretsmanager update-secret \
  --region $REGION \
  --secret-id "${PROJECT_NAME}/${ENVIRONMENT}/db-password" \
  --secret-string "$DB_PASSWORD" && echo -e "${GREEN}✓ Secret db-password mis à jour${NC}"

echo ""

# ============================================================================
# 5. Sauvegarder la Configuration
# ============================================================================
echo -e "${BLUE}💾 Sauvegarde de la configuration...${NC}"

CONFIG_FILE="deployment-beta-50users/aws-infrastructure-config.env"

cat > $CONFIG_FILE <<EOF
# AWS Infrastructure Configuration
# Generated: $(date)
# Region: $REGION

# RDS PostgreSQL
DATABASE_URL=$DATABASE_URL
DB_ENDPOINT=$DB_ENDPOINT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME

# ElastiCache Redis
REDIS_URL=$REDIS_URL
REDIS_ENDPOINT=$REDIS_ENDPOINT

# S3
AWS_S3_BUCKET=$S3_BUCKET

# AWS
AWS_REGION=$REGION
EOF

chmod 600 $CONFIG_FILE
echo -e "${GREEN}✓ Configuration sauvegardée: $CONFIG_FILE${NC}"
echo ""

# ============================================================================
# 6. Afficher les Variables pour Vercel
# ============================================================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📋 Variables d'Environnement pour Vercel${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Copie ces variables dans Vercel:${NC}"
echo ""
echo "DATABASE_URL=$DATABASE_URL"
echo "REDIS_URL=$REDIS_URL"
echo "AWS_REGION=$REGION"
echo "AWS_S3_BUCKET=$S3_BUCKET"
echo ""
echo -e "${YELLOW}N'oublie pas d'ajouter aussi:${NC}"
echo "AWS_ACCESS_KEY_ID=<ton_access_key>"
echo "AWS_SECRET_ACCESS_KEY=<ton_secret_key>"
echo ""

# ============================================================================
# 7. Commandes de Test
# ============================================================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🧪 Commandes de Test${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Test PostgreSQL:${NC}"
echo "psql \"$DATABASE_URL\""
echo ""
echo -e "${YELLOW}Test Redis:${NC}"
echo "redis-cli -h $REDIS_ENDPOINT -p 6379 ping"
echo ""
echo -e "${YELLOW}Test S3:${NC}"
echo "aws s3 ls s3://$S3_BUCKET --region $REGION"
echo ""
echo -e "${YELLOW}Initialiser la base de données:${NC}"
echo "export DATABASE_URL=\"$DATABASE_URL\""
echo "npx prisma db push"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Setup AWS Finalisé!${NC}"
echo -e "${GREEN}============================================${NC}"
