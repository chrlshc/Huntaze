#!/bin/bash

# 🧹 Script de nettoyage des services AWS inutilisés
# Date: 12 Décembre 2025
# Économie estimée: $30-150/mois

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION_DYNAMODB="us-east-1"
AWS_REGION_SQS="us-east-1"
DRY_RUN=${DRY_RUN:-true}  # Par défaut en mode dry-run

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧹 NETTOYAGE DES SERVICES AWS INUTILISÉS                 ║${NC}"
echo -e "${BLUE}║  Économie estimée: \$30-150/mois                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  MODE DRY-RUN ACTIVÉ${NC}"
    echo -e "${YELLOW}   Aucune suppression ne sera effectuée${NC}"
    echo -e "${YELLOW}   Pour supprimer réellement: DRY_RUN=false ./scripts/cleanup-unused-aws-services.sh${NC}"
    echo ""
fi

# Fonction pour afficher les commandes en dry-run
run_command() {
    local cmd="$1"
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $cmd"
    else
        echo -e "${GREEN}[EXEC]${NC} $cmd"
        eval "$cmd"
    fi
}

# ═══════════════════════════════════════════════════════════
# 1. SUPPRESSION DES TABLES DYNAMODB
# ═══════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. SUPPRESSION DES TABLES DYNAMODB (us-east-1)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Lister toutes les tables DynamoDB
echo -e "${YELLOW}📋 Récupération de la liste des tables DynamoDB...${NC}"
DYNAMODB_TABLES=$(aws dynamodb list-tables --region $AWS_REGION_DYNAMODB --output json | jq -r '.TableNames[]' | grep -i huntaze || true)

if [ -z "$DYNAMODB_TABLES" ]; then
    echo -e "${GREEN}✅ Aucune table DynamoDB Huntaze trouvée${NC}"
else
    TABLE_COUNT=$(echo "$DYNAMODB_TABLES" | wc -l | tr -d ' ')
    echo -e "${YELLOW}📊 $TABLE_COUNT tables DynamoDB trouvées:${NC}"
    echo "$DYNAMODB_TABLES" | while read -r table; do
        echo -e "   • $table"
    done
    echo ""
    
    # Supprimer chaque table
    echo "$DYNAMODB_TABLES" | while read -r table; do
        echo -e "${RED}🗑️  Suppression de la table: $table${NC}"
        run_command "aws dynamodb delete-table --table-name $table --region $AWS_REGION_DYNAMODB"
        
        if [ "$DRY_RUN" = false ]; then
            echo -e "${GREEN}   ✅ Table supprimée${NC}"
        fi
    done
    
    if [ "$DRY_RUN" = false ]; then
        echo -e "${GREEN}✅ Toutes les tables DynamoDB ont été supprimées${NC}"
        echo -e "${GREEN}💰 Économie estimée: \$20-100/mois${NC}"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 2. SUPPRESSION DES QUEUES SQS
# ═══════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. SUPPRESSION DES QUEUES SQS (us-east-1)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Lister toutes les queues SQS
echo -e "${YELLOW}📋 Récupération de la liste des queues SQS...${NC}"
SQS_QUEUES=$(aws sqs list-queues --region $AWS_REGION_SQS --output json | jq -r '.QueueUrls[]?' | grep -i huntaze || true)

if [ -z "$SQS_QUEUES" ]; then
    echo -e "${GREEN}✅ Aucune queue SQS Huntaze trouvée${NC}"
else
    QUEUE_COUNT=$(echo "$SQS_QUEUES" | wc -l | tr -d ' ')
    echo -e "${YELLOW}📊 $QUEUE_COUNT queues SQS trouvées:${NC}"
    echo "$SQS_QUEUES" | while read -r queue; do
        QUEUE_NAME=$(basename "$queue")
        echo -e "   • $QUEUE_NAME"
    done
    echo ""
    
    # Supprimer chaque queue
    echo "$SQS_QUEUES" | while read -r queue; do
        QUEUE_NAME=$(basename "$queue")
        echo -e "${RED}🗑️  Suppression de la queue: $QUEUE_NAME${NC}"
        run_command "aws sqs delete-queue --queue-url $queue --region $AWS_REGION_SQS"
        
        if [ "$DRY_RUN" = false ]; then
            echo -e "${GREEN}   ✅ Queue supprimée${NC}"
        fi
    done
    
    if [ "$DRY_RUN" = false ]; then
        echo -e "${GREEN}✅ Toutes les queues SQS ont été supprimées${NC}"
        echo -e "${GREEN}💰 Économie estimée: \$10-50/mois${NC}"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# 3. RÉSUMÉ FINAL
# ═══════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. RÉSUMÉ FINAL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  MODE DRY-RUN - Aucune suppression effectuée${NC}"
    echo ""
    echo -e "${YELLOW}Pour supprimer réellement les services:${NC}"
    echo -e "${YELLOW}  DRY_RUN=false ./scripts/cleanup-unused-aws-services.sh${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Nettoyage terminé avec succès !${NC}"
    echo ""
    echo -e "${GREEN}📊 Services supprimés:${NC}"
    if [ -n "$DYNAMODB_TABLES" ]; then
        echo -e "${GREEN}   • DynamoDB: $TABLE_COUNT tables${NC}"
    fi
    if [ -n "$SQS_QUEUES" ]; then
        echo -e "${GREEN}   • SQS: $QUEUE_COUNT queues${NC}"
    fi
    echo ""
    echo -e "${GREEN}💰 Économie mensuelle estimée: \$30-150/mois${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
    echo -e "${YELLOW}   • Les services sont supprimés définitivement${NC}"
    echo -e "${YELLOW}   • Les données sont perdues (mais tu n'en avais pas)${NC}"
    echo -e "${YELLOW}   • Tu peux toujours les recréer plus tard si besoin${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ SCRIPT TERMINÉ                                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
