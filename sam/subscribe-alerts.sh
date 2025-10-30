#!/bin/bash

# Script pour s'abonner aux alertes SNS
# Usage: ./subscribe-alerts.sh your-email@example.com

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: ./subscribe-alerts.sh your-email@example.com"
    exit 1
fi

EMAIL="$1"
TOPIC_ARN="arn:aws:sns:us-east-1:317805897534:huntaze-production-alerts"
REGION="us-east-1"

echo "📧 Abonnement aux alertes de production"
echo "========================================"
echo ""
echo "Email: $EMAIL"
echo "Topic: $TOPIC_ARN"
echo ""

# Vérifier AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI n'est pas configuré"
    exit 1
fi

# Créer la subscription
echo "📝 Création de la subscription..."
SUBSCRIPTION_ARN=$(aws sns subscribe \
    --topic-arn "$TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$EMAIL" \
    --region "$REGION" \
    --query 'SubscriptionArn' \
    --output text)

echo "✅ Subscription créée: $SUBSCRIPTION_ARN"
echo ""
echo "📬 IMPORTANT:"
echo "   1. Vérifie ton email: $EMAIL"
echo "   2. Cherche 'AWS Notification - Subscription Confirmation'"
echo "   3. Clique sur 'Confirm subscription'"
echo ""
echo "⏱️  L'email peut prendre quelques minutes à arriver"
echo "📁 Vérifie aussi tes spams/promotions"
