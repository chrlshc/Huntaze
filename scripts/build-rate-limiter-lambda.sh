#!/bin/bash

# ============================================================================
# Build Rate Limiter Lambda
# ============================================================================
# Builds and packages the rate limiter Lambda function
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LAMBDA_DIR="lib/lambda/rate-limiter"
DIST_DIR="dist"
ZIP_FILE="rate-limiter.zip"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building Rate Limiter Lambda${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# ============================================================================
# 1. Check Prerequisites
# ============================================================================

echo -e "${YELLOW}1. Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${BLUE}  Node.js version: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${BLUE}  npm version: $NPM_VERSION${NC}"

check_success "Prerequisites check"
echo ""

# ============================================================================
# 2. Clean Previous Build
# ============================================================================

echo -e "${YELLOW}2. Cleaning previous build...${NC}"

# Remove old zip
if [ -f "$DIST_DIR/$ZIP_FILE" ]; then
    rm "$DIST_DIR/$ZIP_FILE"
    echo -e "${BLUE}  Removed old $ZIP_FILE${NC}"
fi

# Clean node_modules in Lambda directory
if [ -d "$LAMBDA_DIR/node_modules" ]; then
    rm -rf "$LAMBDA_DIR/node_modules"
    echo -e "${BLUE}  Removed old node_modules${NC}"
fi

check_success "Clean"
echo ""

# ============================================================================
# 3. Install Dependencies
# ============================================================================

echo -e "${YELLOW}3. Installing dependencies...${NC}"

cd "$LAMBDA_DIR"

# Install production dependencies only
npm install --production --no-optional

check_success "Dependencies installed"
cd - > /dev/null
echo ""

# ============================================================================
# 4. Create Deployment Package
# ============================================================================

echo -e "${YELLOW}4. Creating deployment package...${NC}"

# Create dist directory if it doesn't exist
mkdir -p "$DIST_DIR"

# Create zip file
cd "$LAMBDA_DIR"
zip -r "../../$DIST_DIR/$ZIP_FILE" . \
    -x "*.git*" \
    -x "node_modules/.cache/*" \
    -x "*.md" \
    -x "test.mjs" \
    -x ".DS_Store"

cd - > /dev/null

check_success "Deployment package created"
echo ""

# ============================================================================
# 5. Verify Package
# ============================================================================

echo -e "${YELLOW}5. Verifying package...${NC}"

# Check if zip file exists
if [ ! -f "$DIST_DIR/$ZIP_FILE" ]; then
    echo -e "${RED}Error: Deployment package not found${NC}"
    exit 1
fi

# Get file size
FILE_SIZE=$(du -h "$DIST_DIR/$ZIP_FILE" | cut -f1)
echo -e "${BLUE}  Package size: $FILE_SIZE${NC}"

# List contents
echo -e "${BLUE}  Package contents:${NC}"
unzip -l "$DIST_DIR/$ZIP_FILE" | head -20

check_success "Package verification"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Package: $DIST_DIR/$ZIP_FILE"
echo "• Size: $FILE_SIZE"
echo "• Node.js: $NODE_VERSION"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Deploy with Terraform:"
echo "   cd infra/terraform/production-hardening"
echo "   terraform apply -target=aws_lambda_function.rate_limiter"
echo ""
echo "2. Test the Lambda:"
echo "   aws lambda invoke --function-name huntaze-rate-limiter \\"
echo "     --payload file://test-event.json response.json"
echo ""
echo "3. Monitor logs:"
echo "   aws logs tail /aws/lambda/huntaze-rate-limiter --follow"
echo ""
