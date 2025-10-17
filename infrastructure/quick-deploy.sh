#\!/bin/bash
# Quick Cognito Deployment for Huntaze

echo "🚀 Déploiement Rapide Cognito pour Huntaze"
echo "=========================================="

# Vérification des credentials
if aws sts get-caller-identity &>/dev/null; then
    echo "✅ AWS credentials OK"
else
    echo "❌ Configure d'abord tes credentials AWS\!"
    exit 1
fi

# Variables par défaut
REGION=${AWS_DEFAULT_REGION:-us-east-1}
STACK_NAME="huntaze-auth-dev"

echo ""
echo "📋 Configuration:"
echo "  Région: $REGION"
echo "  Stack:  $STACK_NAME"
echo ""

# Déploiement
echo "🔄 Déploiement en cours (5-10 minutes)..."
aws cloudformation deploy \
    --region $REGION \
    --stack-name $STACK_NAME \
    --template-file cognito.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment=dev \
        DomainName=localhost:3000 \
        PasswordMinLength=12 \
        MfaConfiguration=OPTIONAL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Déployé avec succès\!"
    
    # Récupération des valeurs
    USER_POOL_ID=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
    CLIENT_ID=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)
    
    echo ""
    echo "🎉 SUCCÈS\! Copie ces valeurs dans ton .env.local:"
    echo ""
    echo "NEXT_PUBLIC_AWS_REGION=$REGION"
    echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
    echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$CLIENT_ID"
    echo ""
else
    echo "❌ Échec du déploiement"
fi
