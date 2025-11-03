#!/bin/bash

# Script qui génère les commandes AWS CLI pour configurer Amplify
# Usage: ./scripts/amplify-commands.sh

echo "🎯 Commandes AWS CLI pour configurer Amplify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

APP_ID="d33l77zi1h78ce"
BRANCH="main"
REDIS_ENDPOINT="huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379"

echo "📋 App ID: $APP_ID"
echo "📋 Branch: $BRANCH"
echo "📋 Redis: $REDIS_ENDPOINT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Étape 1: Configure tes credentials AWS"
echo ""
echo "export AWS_ACCESS_KEY_ID=\"YOUR_ACCESS_KEY\""
echo "export AWS_SECRET_ACCESS_KEY=\"YOUR_SECRET_KEY\""
echo "export AWS_SESSION_TOKEN=\"YOUR_SESSION_TOKEN\""
echo "export AWS_REGION=\"us-east-1\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Étape 2: Configure les variables d'environnement"
echo ""
echo "Copie-colle cette commande:"
echo ""

cat << 'EOF'
aws amplify update-branch \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --environment-variables '{
    "AWS_REGION": "us-east-1",
    "RATE_LIMITER_ENABLED": "true",
    "SQS_RATE_LIMITER_QUEUE_URL": "https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue",
    "SQS_RATE_LIMITER_DLQ_URL": "https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-dlq",
    "REDIS_ENDPOINT": "huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379",
    "CLOUDWATCH_NAMESPACE": "Huntaze/OnlyFans"
  }' \
  --region us-east-1
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Étape 3: Déclenche un redéploiement"
echo ""
echo "aws amplify start-job \\"
echo "  --app-id d33l77zi1h78ce \\"
echo "  --branch-name main \\"
echo "  --job-type RELEASE \\"
echo "  --region us-east-1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Une fois le déploiement terminé (~5-10 min), teste:"
echo ""
echo "curl https://d33l77zi1h78ce.amplifyapp.com/api/onlyfans/messages/status \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
