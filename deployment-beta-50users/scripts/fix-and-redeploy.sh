#!/bin/bash
# fix-and-redeploy.sh
# Fix subscription registration and redeploy

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Azure Subscription Registration${NC}"
echo "=========================================="
echo ""

# Register required providers
echo "📝 Registering required providers..."
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.ServiceBus
az provider register --namespace Microsoft.Storage

echo ""
echo -e "${YELLOW}⏳ Waiting for registration to complete...${NC}"
echo "This usually takes 1-2 minutes"
echo ""

# Wait for Microsoft.Web
while true; do
    STATE=$(az provider show --namespace Microsoft.Web --query "registrationState" -o tsv)
    echo "  Microsoft.Web: $STATE"
    
    if [ "$STATE" = "Registered" ]; then
        break
    fi
    
    sleep 10
done

echo ""
echo -e "${GREEN}✅ All providers registered!${NC}"
echo ""
echo -e "${BLUE}🚀 Relaunching deployment...${NC}"
echo ""

# Relaunch deployment
./deploy-azure-workers.sh
