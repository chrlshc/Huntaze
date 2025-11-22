#!/bin/bash

# Script de vérification de la configuration ElastiCache
# Usage: ./scripts/verify-elasticache-setup.sh

set -e

echo "🔍 Vérification de la configuration ElastiCache Redis"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
CLUSTER_ID="huntaze-redis-production"
REGION="us-east-1"
VPC_ID="vpc-033be7e71ec9548d2"

# Fonction pour afficher un succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher une erreur
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher un avertissement
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier les credentials AWS
echo "1. Vérification des credentials AWS..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    success "Credentials AWS valides (Account: $ACCOUNT_ID)"
else
    error "Credentials AWS invalides ou manquantes"
    echo "   Exportez vos credentials AWS:"
    echo "   export AWS_ACCESS_KEY_ID=..."
    echo "   export AWS_SECRET_ACCESS_KEY=..."
    echo "   export AWS_SESSION_TOKEN=..."
    exit 1
fi
echo ""

# Vérifier l'existence du cluster ElastiCache
echo "2. Vérification du cluster ElastiCache..."
if aws elasticache describe-cache-clusters \
    --cache-cluster-id $CLUSTER_ID \
    --region $REGION &> /dev/null; then
    
    STATUS=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id $CLUSTER_ID \
        --region $REGION \
        --query 'CacheClusters[0].CacheClusterStatus' \
        --output text)
    
    if [ "$STATUS" == "available" ]; then
        success "Cluster ElastiCache disponible (Status: $STATUS)"
        
        # Obtenir l'endpoint
        ENDPOINT=$(aws elasticache describe-cache-clusters \
            --cache-cluster-id $CLUSTER_ID \
            --show-cache-node-info \
            --region $REGION \
            --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
            --output text)
        
        PORT=$(aws elasticache describe-cache-clusters \
            --cache-cluster-id $CLUSTER_ID \
            --show-cache-node-info \
            --region $REGION \
            --query 'CacheClusters[0].CacheNodes[0].Endpoint.Port' \
            --output text)
        
        echo "   Endpoint: $ENDPOINT:$PORT"
    else
        warning "Cluster ElastiCache existe mais n'est pas disponible (Status: $STATUS)"
    fi
else
    error "Cluster ElastiCache '$CLUSTER_ID' introuvable"
    exit 1
fi
echo ""

# Vérifier le VPC
echo "3. Vérification du VPC..."
CACHE_VPC=$(aws elasticache describe-cache-subnet-groups \
    --cache-subnet-group-name huntaze-cache-subnet-production \
    --region $REGION \
    --query 'CacheSubnetGroups[0].VpcId' \
    --output text)

if [ "$CACHE_VPC" == "$VPC_ID" ]; then
    success "VPC correct: $VPC_ID"
else
    error "VPC incorrect. Attendu: $VPC_ID, Trouvé: $CACHE_VPC"
fi
echo ""

# Vérifier les Security Groups
echo "4. Vérification des Security Groups..."
REDIS_SG=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id $CLUSTER_ID \
    --region $REGION \
    --query 'CacheClusters[0].SecurityGroups[0].SecurityGroupId' \
    --output text 2>/dev/null || echo "none")

if [ "$REDIS_SG" != "none" ] && [ "$REDIS_SG" != "None" ]; then
    success "Security Group ElastiCache: $REDIS_SG"
    
    # Vérifier les règles d'ingress
    echo "   Règles d'ingress:"
    aws ec2 describe-security-groups \
        --group-ids $REDIS_SG \
        --region $REGION \
        --query 'SecurityGroups[0].IpPermissions[*].[FromPort,ToPort,IpProtocol,IpRanges[0].CidrIp]' \
        --output table
else
    warning "Aucun Security Group trouvé (ElastiCache utilise peut-être les règles par défaut)"
fi
echo ""

# Vérifier RDS PostgreSQL
echo "5. Vérification de RDS PostgreSQL..."
if aws rds describe-db-instances \
    --db-instance-identifier huntaze-postgres-production \
    --region $REGION &> /dev/null; then
    
    RDS_VPC=$(aws rds describe-db-instances \
        --db-instance-identifier huntaze-postgres-production \
        --region $REGION \
        --query 'DBInstances[0].DBSubnetGroup.VpcId' \
        --output text)
    
    if [ "$RDS_VPC" == "$VPC_ID" ]; then
        success "RDS dans le même VPC que ElastiCache"
    else
        warning "RDS dans un VPC différent: $RDS_VPC"
    fi
    
    RDS_SG=$(aws rds describe-db-instances \
        --db-instance-identifier huntaze-postgres-production \
        --region $REGION \
        --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
        --output text)
    
    echo "   Security Group RDS: $RDS_SG"
else
    warning "RDS PostgreSQL 'huntaze-postgres-production' introuvable"
fi
echo ""

# Vérifier les variables d'environnement locales
echo "6. Vérification des variables d'environnement..."
if [ -f .env ]; then
    if grep -q "ELASTICACHE_REDIS_HOST" .env; then
        success "Variable ELASTICACHE_REDIS_HOST trouvée dans .env"
    else
        warning "Variable ELASTICACHE_REDIS_HOST manquante dans .env"
        echo "   Ajoutez: ELASTICACHE_REDIS_HOST=$ENDPOINT"
    fi
    
    if grep -q "ELASTICACHE_REDIS_PORT" .env; then
        success "Variable ELASTICACHE_REDIS_PORT trouvée dans .env"
    else
        warning "Variable ELASTICACHE_REDIS_PORT manquante dans .env"
        echo "   Ajoutez: ELASTICACHE_REDIS_PORT=$PORT"
    fi
else
    warning "Fichier .env introuvable"
fi
echo ""

# Résumé
echo "=================================================="
echo "📊 Résumé de la Configuration"
echo "=================================================="
echo ""
echo "ElastiCache Redis:"
echo "  - Cluster ID: $CLUSTER_ID"
echo "  - Endpoint: $ENDPOINT:$PORT"
echo "  - VPC: $VPC_ID"
echo "  - Security Group: $REDIS_SG"
echo ""
echo "RDS PostgreSQL:"
echo "  - Instance: huntaze-postgres-production"
echo "  - VPC: $RDS_VPC"
echo "  - Security Group: $RDS_SG"
echo ""
echo "=================================================="
echo ""

# Recommandations
echo "📝 Prochaines Étapes:"
echo ""
echo "1. Configurer Amplify pour accéder au VPC:"
echo "   - Aller dans App settings > VPC"
echo "   - Activer VPC access"
echo "   - Sélectionner VPC: $VPC_ID"
echo ""
echo "2. Ajouter les variables d'environnement dans Amplify:"
echo "   ELASTICACHE_REDIS_HOST=$ENDPOINT"
echo "   ELASTICACHE_REDIS_PORT=$PORT"
echo ""
echo "3. Autoriser Amplify à accéder à Redis:"
echo "   aws ec2 authorize-security-group-ingress \\"
echo "     --group-id $REDIS_SG \\"
echo "     --protocol tcp \\"
echo "     --port 6379 \\"
echo "     --source-group <AMPLIFY_SG> \\"
echo "     --region $REGION"
echo ""
echo "4. Tester la connexion avec:"
echo "   curl https://votre-app.amplifyapp.com/api/test-redis"
echo ""
echo "✅ Vérification terminée!"
