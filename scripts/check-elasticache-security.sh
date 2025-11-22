#!/bin/bash

# Script pour vérifier la configuration de sécurité d'ElastiCache
# Usage: ./scripts/check-elasticache-security.sh

set -e

echo "🔍 Vérification de la configuration ElastiCache Redis..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI n'est pas installé${NC}"
    echo "Installez-le avec: brew install awscli"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI installé${NC}"

# Vérifier les credentials AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Credentials AWS non configurées${NC}"
    echo "Configurez-les avec: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ Credentials AWS valides (Account: $ACCOUNT_ID)${NC}"
echo ""

# Récupérer les informations du cluster
echo "📊 Informations du cluster ElastiCache..."
CLUSTER_INFO=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id huntaze-redis-production \
    --show-cache-node-info \
    --region us-east-1 \
    --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Impossible de récupérer les informations du cluster${NC}"
    exit 1
fi

# Extraire les informations
ENDPOINT=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].CacheNodes[0].Endpoint.Address')
PORT=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].CacheNodes[0].Endpoint.Port')
STATUS=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].CacheClusterStatus')
ENGINE=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].Engine')
ENGINE_VERSION=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].EngineVersion')
NODE_TYPE=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].CacheNodeType')
AZ=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].PreferredAvailabilityZone')

echo "  Endpoint: $ENDPOINT"
echo "  Port: $PORT"
echo "  Status: $STATUS"
echo "  Engine: $ENGINE $ENGINE_VERSION"
echo "  Node Type: $NODE_TYPE"
echo "  Availability Zone: $AZ"
echo ""

if [ "$STATUS" != "available" ]; then
    echo -e "${YELLOW}⚠️  Cluster status: $STATUS (devrait être 'available')${NC}"
fi

# Récupérer les security groups
echo "🔒 Security Groups..."
SECURITY_GROUPS=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].SecurityGroups[].SecurityGroupId')

if [ -z "$SECURITY_GROUPS" ]; then
    echo -e "${YELLOW}⚠️  Aucun security group trouvé${NC}"
else
    for SG_ID in $SECURITY_GROUPS; do
        echo "  Security Group: $SG_ID"
        
        # Récupérer les règles inbound
        INBOUND_RULES=$(aws ec2 describe-security-groups \
            --group-ids $SG_ID \
            --region us-east-1 \
            --query 'SecurityGroups[0].IpPermissions' \
            --output json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "  Règles Inbound:"
            echo "$INBOUND_RULES" | jq -r '.[] | "    Port: \(.FromPort // "N/A") - Protocol: \(.IpProtocol) - Source: \(.IpRanges[0].CidrIp // .UserIdGroupPairs[0].GroupId // "N/A")"'
        fi
        echo ""
    done
fi

# Récupérer le subnet group
echo "🌐 Configuration Réseau..."
SUBNET_GROUP=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].CacheSubnetGroupName')
echo "  Subnet Group: $SUBNET_GROUP"

if [ "$SUBNET_GROUP" != "null" ]; then
    SUBNET_INFO=$(aws elasticache describe-cache-subnet-groups \
        --cache-subnet-group-name $SUBNET_GROUP \
        --region us-east-1 \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        VPC_ID=$(echo $SUBNET_INFO | jq -r '.CacheSubnetGroups[0].VpcId')
        echo "  VPC ID: $VPC_ID"
        
        SUBNETS=$(echo $SUBNET_INFO | jq -r '.CacheSubnetGroups[0].Subnets[].SubnetIdentifier')
        echo "  Subnets:"
        for SUBNET in $SUBNETS; do
            echo "    - $SUBNET"
        done
    fi
fi
echo ""

# Vérifier AUTH
echo "🔐 Configuration AUTH..."
PARAM_GROUP=$(echo $CLUSTER_INFO | jq -r '.CacheClusters[0].CacheParameterGroup.CacheParameterGroupName')
echo "  Parameter Group: $PARAM_GROUP"

AUTH_ENABLED=$(aws elasticache describe-cache-parameters \
    --cache-parameter-group-name $PARAM_GROUP \
    --region us-east-1 \
    --query 'Parameters[?ParameterName==`requirepass`].ParameterValue' \
    --output text 2>/dev/null)

if [ -z "$AUTH_ENABLED" ] || [ "$AUTH_ENABLED" == "None" ]; then
    echo -e "  ${GREEN}✅ AUTH désactivé (pas de password requis)${NC}"
else
    echo -e "  ${YELLOW}⚠️  AUTH activé (password requis)${NC}"
    echo "  Ajoutez ELASTICACHE_REDIS_PASSWORD à vos variables d'environnement"
fi
echo ""

# Résumé
echo "📋 Résumé de Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Variables d'environnement à configurer:"
echo ""
echo "ELASTICACHE_REDIS_HOST=$ENDPOINT"
echo "ELASTICACHE_REDIS_PORT=$PORT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Recommandations
echo "📝 Prochaines Étapes:"
echo ""
echo "1. Vérifier que votre application est dans le VPC: $VPC_ID"
echo "2. Autoriser le trafic depuis votre app vers le security group: $SECURITY_GROUPS"
echo "3. Ajouter les variables d'environnement dans Amplify Console"
echo "4. Tester la connexion avec: npm run ts-node scripts/test-elasticache-connection.ts"
echo ""

# Test de connectivité (optionnel)
read -p "Voulez-vous tester la connexion maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🧪 Test de connexion..."
    npm run ts-node scripts/test-elasticache-connection.ts
fi
