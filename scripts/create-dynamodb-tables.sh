#!/bin/bash
# Script de création des tables DynamoDB pour Huntaze OF Scraper
# Mode "On-Demand" (PAY_PER_REQUEST) = 0$ si pas utilisé
# Pré-requis: AWS CLI configuré avec les bonnes credentials

set -e

REGION="${AWS_REGION:-us-east-2}"

echo "🚀 Création des tables DynamoDB Huntaze (Region: $REGION)..."
echo ""

# 1. Table ANALYTICS (Revenus, Stats globales)
# PK: userId (String), SK: date (String, format YYYY-MM-DD ou type#YYYY-MM-DD)
echo "📊 Création de Huntaze_Analytics..."
aws dynamodb create-table \
  --table-name Huntaze_Analytics \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=date,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=date,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=beta \
  --region "$REGION" \
  2>/dev/null && echo "✅ Huntaze_Analytics créée" || echo "⚠️  Huntaze_Analytics existe déjà"

# 2. Table FANS (CRM - Liste des abonnés)
# PK: creatorId (String), SK: fanId (String)
echo "👥 Création de Huntaze_Fans..."
aws dynamodb create-table \
  --table-name Huntaze_Fans \
  --attribute-definitions \
    AttributeName=creatorId,AttributeType=S \
    AttributeName=fanId,AttributeType=S \
  --key-schema \
    AttributeName=creatorId,KeyType=HASH \
    AttributeName=fanId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=beta \
  --region "$REGION" \
  2>/dev/null && echo "✅ Huntaze_Fans créée" || echo "⚠️  Huntaze_Fans existe déjà"

# 3. Table CONTENT (Stats des posts) - Optionnel pour beta
# PK: userId (String), SK: postId (String)
echo "📝 Création de Huntaze_Content..."
aws dynamodb create-table \
  --table-name Huntaze_Content \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=postId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=postId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=beta \
  --region "$REGION" \
  2>/dev/null && echo "✅ Huntaze_Content créée" || echo "⚠️  Huntaze_Content existe déjà"

echo ""
echo "⏳ Attente de l'activation des tables..."
sleep 5

# Vérification du statut
echo ""
echo "📋 Statut des tables:"
for TABLE in Huntaze_Analytics Huntaze_Fans Huntaze_Content; do
  STATUS=$(aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" --query 'Table.TableStatus' --output text 2>/dev/null || echo "NOT_FOUND")
  echo "   $TABLE: $STATUS"
done

echo ""
echo "🎉 Infrastructure DynamoDB prête!"
echo ""
echo "💰 Coût: 0\$ (Free Tier / Pay-per-request)"
echo "   - Lectures: 25 RCU gratuites/mois"
echo "   - Écritures: 25 WCU gratuites/mois"
echo "   - Stockage: 25 GB gratuits"
echo ""
echo "📝 Variables d'environnement à ajouter:"
echo "   OF_DDB_ANALYTICS_TABLE=Huntaze_Analytics"
echo "   OF_DDB_FANS_TABLE=Huntaze_Fans"
echo "   OF_DDB_CONTENT_TABLE=Huntaze_Content"
