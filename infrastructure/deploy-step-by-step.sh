#!/bin/bash
# Interactive Cognito Deployment Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Huntaze Cognito Deployment Assistant${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Step 1: Check AWS CLI
echo -e "${YELLOW}Step 1: Checking AWS CLI Installation${NC}"
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI installed ($(aws --version | cut -d' ' -f1))${NC}"
else
    echo -e "${RED}❌ AWS CLI not found${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Step 2: Check credentials
echo ""
echo -e "${YELLOW}Step 2: Checking AWS Credentials${NC}"
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_INFO=$(aws sts get-caller-identity)
    ACCOUNT_ID=$(echo $ACCOUNT_INFO | jq -r '.Account')
    USER_ARN=$(echo $ACCOUNT_INFO | jq -r '.Arn')
    echo -e "${GREEN}✅ Authenticated as:${NC}"
    echo "   Account: $ACCOUNT_ID"
    echo "   User/Role: $USER_ARN"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo ""
    echo "Please configure AWS credentials using one of these methods:"
    echo ""
    echo "1. For AWS SSO:"
    echo -e "   ${BLUE}aws configure sso${NC}"
    echo ""
    echo "2. For IAM credentials:"
    echo -e "   ${BLUE}aws configure${NC}"
    echo ""
    echo "3. For temporary credentials, set environment variables:"
    echo -e "   ${BLUE}export AWS_ACCESS_KEY_ID=your-key-id${NC}"
    echo -e "   ${BLUE}export AWS_SECRET_ACCESS_KEY=your-secret-key${NC}"
    echo -e "   ${BLUE}export AWS_SESSION_TOKEN=your-session-token${NC} (if using temporary credentials)"
    echo ""
    exit 1
fi

# Step 3: Select region
echo ""
echo -e "${YELLOW}Step 3: Selecting AWS Region${NC}"
DEFAULT_REGION=${AWS_REGION:-us-east-1}
echo -n "AWS Region (default: $DEFAULT_REGION): "
read -r INPUT_REGION
AWS_REGION=${INPUT_REGION:-$DEFAULT_REGION}
echo -e "${GREEN}✅ Using region: $AWS_REGION${NC}"

# Step 4: Choose environment
echo ""
echo -e "${YELLOW}Step 4: Selecting Environment${NC}"
echo "1. dev (Development)"
echo "2. staging (Staging)"
echo "3. prod (Production)"
echo -n "Select environment (1-3, default: 1): "
read -r ENV_CHOICE
case $ENV_CHOICE in
    2) ENVIRONMENT="staging" ;;
    3) ENVIRONMENT="prod" ;;
    *) ENVIRONMENT="dev" ;;
esac
echo -e "${GREEN}✅ Environment: $ENVIRONMENT${NC}"

# Step 5: Set stack name
echo ""
echo -e "${YELLOW}Step 5: Setting Stack Name${NC}"
DEFAULT_STACK="huntaze-auth-$ENVIRONMENT"
echo -n "Stack name (default: $DEFAULT_STACK): "
read -r INPUT_STACK
STACK_NAME=${INPUT_STACK:-$DEFAULT_STACK}
echo -e "${GREEN}✅ Stack name: $STACK_NAME${NC}"

# Step 6: Configure domain
echo ""
echo -e "${YELLOW}Step 6: Configuring Domain${NC}"
if [ "$ENVIRONMENT" == "prod" ]; then
    DEFAULT_DOMAIN="app.huntaze.com"
elif [ "$ENVIRONMENT" == "staging" ]; then
    DEFAULT_DOMAIN="staging.huntaze.com"
else
    DEFAULT_DOMAIN="localhost:3000"
fi
echo -n "Domain name (default: $DEFAULT_DOMAIN): "
read -r INPUT_DOMAIN
DOMAIN_NAME=${INPUT_DOMAIN:-$DEFAULT_DOMAIN}
echo -e "${GREEN}✅ Domain: $DOMAIN_NAME${NC}"

# Step 7: Review configuration
echo ""
echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "${BLUE}===========================${NC}"
echo "Region:      $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo "Stack Name:  $STACK_NAME"
echo "Domain:      $DOMAIN_NAME"
echo "Account:     $ACCOUNT_ID"
echo ""
echo -n "Proceed with deployment? (y/N): "
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 8: Deploy
echo ""
echo -e "${YELLOW}Step 8: Deploying CloudFormation Stack${NC}"
echo "This may take 5-10 minutes..."
echo ""

cd "$(dirname "$0")"

if aws cloudformation deploy \
    --region "$AWS_REGION" \
    --stack-name "$STACK_NAME" \
    --template-file cognito.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DomainName="$DOMAIN_NAME" \
        PasswordMinLength=14 \
        MfaConfiguration=OPTIONAL; then
    
    echo ""
    echo -e "${GREEN}✅ Stack deployed successfully!${NC}"
    
    # Step 9: Retrieve outputs
    echo ""
    echo -e "${YELLOW}Step 9: Retrieving Stack Outputs${NC}"
    
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    CLIENT_ID=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text)
    
    COGNITO_DOMAIN=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomain`].OutputValue' \
        --output text)
    
    ISSUER=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`CognitoIssuer`].OutputValue' \
        --output text)
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo -e "${BLUE}=====================${NC}"
    echo "NEXT_PUBLIC_AWS_REGION=$AWS_REGION"
    echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
    echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$CLIENT_ID"
    echo ""
    echo -e "${BLUE}Cognito Details:${NC}"
    echo -e "${BLUE}================${NC}"
    echo "Hosted UI Domain: $COGNITO_DOMAIN"
    echo "OIDC Issuer:     $ISSUER"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "${BLUE}===========${NC}"
    echo "1. Update your .env.local file with the environment variables above"
    echo "2. Configure your production environment variables (Vercel/Amplify)"
    echo "3. Set up SES for email delivery"
    echo "4. Test the authentication flow"
    echo ""
    echo -e "${YELLOW}Would you like to update .env.local automatically? (y/N):${NC} "
    read -r UPDATE_ENV
    if [[ "$UPDATE_ENV" =~ ^[Yy]$ ]]; then
        ENV_FILE="../.env.local"
        cp "$ENV_FILE" "$ENV_FILE.backup"
        sed -i.bak "s|NEXT_PUBLIC_AWS_REGION=.*|NEXT_PUBLIC_AWS_REGION=$AWS_REGION|" "$ENV_FILE"
        sed -i.bak "s|NEXT_PUBLIC_USER_POOL_ID=.*|NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID|" "$ENV_FILE"
        sed -i.bak "s|NEXT_PUBLIC_USER_POOL_CLIENT_ID=.*|NEXT_PUBLIC_USER_POOL_CLIENT_ID=$CLIENT_ID|" "$ENV_FILE"
        echo -e "${GREEN}✅ Updated .env.local (backup saved as .env.local.backup)${NC}"
    fi
    
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Please check the error messages above and try again."
    exit 1
fi