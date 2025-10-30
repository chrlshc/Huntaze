#!/bin/bash

###############################################################################
# Create AWS Secrets - Production Ready 2025
# 
# Ce script crée tous les secrets nécessaires dans AWS Secrets Manager
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║   🔐 AWS Secrets Manager Setup - Production Ready 2025          ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo -e "Region: ${YELLOW}$AWS_REGION${NC}"
echo ""

###############################################################################
# Helper Functions
###############################################################################

create_secret() {
    local name=$1
    local description=$2
    local prompt=$3
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Creating secret: ${name}${NC}"
    echo -e "Description: ${description}"
    echo ""
    
    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id "$name" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${YELLOW}⚠️  Secret already exists${NC}"
        read -p "Do you want to update it? (y/n): " UPDATE
        
        if [ "$UPDATE" != "y" ]; then
            echo -e "${BLUE}Skipped${NC}"
            echo ""
            return
        fi
        
        # Update existing secret
        read -sp "$prompt: " SECRET_VALUE
        echo ""
        
        aws secretsmanager update-secret \
            --secret-id "$name" \
            --secret-string "$SECRET_VALUE" \
            --region "$AWS_REGION" \
            > /dev/null
        
        echo -e "${GREEN}✅ Secret updated${NC}"
    else
        # Create new secret
        read -sp "$prompt: " SECRET_VALUE
        echo ""
        
        if [ -z "$SECRET_VALUE" ]; then
            echo -e "${RED}❌ Secret value cannot be empty${NC}"
            return
        fi
        
        aws secretsmanager create-secret \
            --name "$name" \
            --description "$description" \
            --secret-string "$SECRET_VALUE" \
            --region "$AWS_REGION" \
            > /dev/null
        
        echo -e "${GREEN}✅ Secret created${NC}"
    fi
    
    echo ""
}

###############################################################################
# Create Secrets
###############################################################################

echo -e "${BLUE}Starting secret creation...${NC}"
echo ""

# 1. Database URL
create_secret \
    "huntaze/database/url" \
    "PostgreSQL database connection URL (Prisma Accelerate)" \
    "Enter DATABASE_URL (prisma://...)"

# 2. NextAuth Secret
create_secret \
    "huntaze/nextauth/secret" \
    "NextAuth.js secret for JWT signing" \
    "Enter NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"

# 3. OnlyFans API Key
create_secret \
    "huntaze/onlyfans/api-key" \
    "OnlyFans API key for integration" \
    "Enter OnlyFans API Key"

# 4. OnlyFans Webhook Secret
create_secret \
    "huntaze/onlyfans/webhook-secret" \
    "OnlyFans webhook signature verification secret" \
    "Enter OnlyFans Webhook Secret"

# 5. S3 Bucket Name
create_secret \
    "huntaze/aws/s3-bucket" \
    "S3 bucket name for content storage" \
    "Enter S3 Bucket Name (e.g., huntaze-content-prod)"

# 6. SQS Queue URL
create_secret \
    "huntaze/aws/sqs-queue-url" \
    "SQS queue URL for async processing" \
    "Enter SQS Queue URL"

# 7. OpenAI API Key
create_secret \
    "huntaze/openai/api-key" \
    "OpenAI API key for AI features" \
    "Enter OpenAI API Key"

# 8. Sentry DSN
create_secret \
    "huntaze/sentry/dsn" \
    "Sentry DSN for error tracking" \
    "Enter Sentry DSN"

# 9. SendGrid API Key
create_secret \
    "huntaze/sendgrid/api-key" \
    "SendGrid API key for email sending" \
    "Enter SendGrid API Key"

# 10. Google Analytics ID
create_secret \
    "huntaze/google/analytics-id" \
    "Google Analytics measurement ID" \
    "Enter Google Analytics ID (G-XXXXXXXXXX)"

# 11. Health Check Secret (for testing)
create_secret \
    "huntaze/health-check" \
    "Health check secret for monitoring" \
    "Enter any value for health check (e.g., 'ok')"

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Secret creation complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# List all secrets
echo -e "${YELLOW}Created secrets:${NC}"
aws secretsmanager list-secrets \
    --region "$AWS_REGION" \
    --query "SecretList[?starts_with(Name, 'huntaze/')].Name" \
    --output table

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your .env file with:"
echo "   AWS_REGION=$AWS_REGION"
echo ""
echo "2. Test secret retrieval:"
echo "   aws secretsmanager get-secret-value --secret-id huntaze/database/url --region $AWS_REGION"
echo ""
echo "3. Deploy your application:"
echo "   ./scripts/deploy-production-2025.sh production"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"
