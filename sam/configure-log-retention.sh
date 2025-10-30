#!/bin/bash

# Script pour configurer la rétention des logs CloudWatch
# Usage: ./configure-log-retention.sh

set -e

echo "🔧 Configuration de la rétention des logs CloudWatch"
echo "===================================================="

REGION="us-east-1"

# Vérifier que AWS CLI est configuré
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI n'est pas configuré ou les credentials ont expiré"
    echo ""
    echo "Pour configurer AWS CLI:"
    echo "  aws configure"
    echo ""
    echo "Ou exporter les credentials temporaires:"
    echo "  export AWS_ACCESS_KEY_ID='...'"
    echo "  export AWS_SECRET_ACCESS_KEY='...'"
    echo "  export AWS_SESSION_TOKEN='...'"
    exit 1
fi

echo "✅ AWS credentials OK"
echo ""

# Configurer la rétention pour chaque log group
echo "📝 Configuration de la rétention..."

# Mock Read Lambda - 30 jours
echo "  → /aws/lambda/huntaze-mock-read (30 jours)"
aws logs put-retention-policy \
    --log-group-name /aws/lambda/huntaze-mock-read \
    --retention-in-days 30 \
    --region $REGION 2>/dev/null || echo "    ⚠️  Log group n'existe pas encore"

# Prisma Read Lambda - 30 jours
echo "  → /aws/lambda/huntaze-prisma-read (30 jours)"
aws logs put-retention-policy \
    --log-group-name /aws/lambda/huntaze-prisma-read \
    --retention-in-days 30 \
    --region $REGION 2>/dev/null || echo "    ⚠️  Log group n'existe pas encore"

# Cleanup Lambda - 14 jours
echo "  → /aws/lambda/huntaze-flag-cleanup (14 jours)"
aws logs put-retention-policy \
    --log-group-name /aws/lambda/huntaze-flag-cleanup \
    --retention-in-days 14 \
    --region $REGION 2>/dev/null || echo "    ⚠️  Log group n'existe pas encore"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📊 Vérification des log groups:"
aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/huntaze" \
    --region $REGION \
    --query 'logGroups[*].[logGroupName,retentionInDays]' \
    --output table

echo ""
echo "💰 Économie estimée: ~\$5-10/mois"
echo "⏱️  Suppression effective: sous 72h"
