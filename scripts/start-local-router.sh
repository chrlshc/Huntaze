#!/bin/bash
# =============================================================================
# Local AI Router Startup Script
# =============================================================================
# Starts the Python AI Router locally for development and testing.
# 
# Usage:
#   ./scripts/start-local-router.sh [--port PORT] [--no-health-check]
#
# Options:
#   --port PORT         Port to run the router on (default: 8000)
#   --no-health-check   Skip health check verification after startup
#
# Environment:
#   Reads Azure AI credentials from .env.local or lib/ai/router/.env
#
# Requirements:
#   - Python 3.10+
#   - pip or uv package manager
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
PORT=8000
HEALTH_CHECK=true
ROUTER_DIR="lib/ai/router"
MAX_HEALTH_RETRIES=10
HEALTH_RETRY_DELAY=1

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --no-health-check)
            HEALTH_CHECK=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--port PORT] [--no-health-check]"
            echo ""
            echo "Options:"
            echo "  --port PORT         Port to run the router on (default: 8000)"
            echo "  --no-health-check   Skip health check verification after startup"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Huntaze AI Router - Local Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the project root
if [ ! -d "$ROUTER_DIR" ]; then
    echo -e "${RED}Error: Router directory not found at $ROUTER_DIR${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python not found. Please install Python 3.10+${NC}"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Load environment variables
echo -e "${YELLOW}Loading environment variables...${NC}"

# Priority: .env.local > lib/ai/router/.env > .env
ENV_FILE=""
if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
elif [ -f "$ROUTER_DIR/.env" ]; then
    ENV_FILE="$ROUTER_DIR/.env"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -n "$ENV_FILE" ]; then
    echo -e "${GREEN}✓ Loading from $ENV_FILE${NC}"
    # Export variables from env file (handle quotes and comments)
    set -a
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        # Remove leading/trailing whitespace and quotes
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        # Only export if key is valid
        if [[ $key =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            export "$key=$value"
        fi
    done < "$ENV_FILE"
    set +a
else
    echo -e "${YELLOW}⚠ No .env file found, using existing environment${NC}"
fi

# Verify required environment variables
echo -e "${YELLOW}Verifying Azure AI configuration...${NC}"

if [ -z "$AZURE_AI_CHAT_ENDPOINT" ]; then
    echo -e "${RED}Error: AZURE_AI_CHAT_ENDPOINT is not set${NC}"
    echo "Please set it in .env.local or lib/ai/router/.env"
    echo "Example: AZURE_AI_CHAT_ENDPOINT=https://your-endpoint.eastus2.inference.ai.azure.com"
    exit 1
fi

if [ -z "$AZURE_AI_CHAT_KEY" ]; then
    echo -e "${RED}Error: AZURE_AI_CHAT_KEY is not set${NC}"
    echo "Please set it in .env.local or lib/ai/router/.env"
    exit 1
fi

echo -e "${GREEN}✓ Azure AI endpoint configured${NC}"

# Install dependencies if needed
echo -e "${YELLOW}Checking dependencies...${NC}"
cd "$ROUTER_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install/update dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -q -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Go back to project root
cd - > /dev/null

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port $PORT is already in use${NC}"
    echo "Checking if it's the AI Router..."
    
    # Try health check on existing service
    if curl -s "http://localhost:$PORT/health" | grep -q "healthy"; then
        echo -e "${GREEN}✓ AI Router is already running on port $PORT${NC}"
        exit 0
    else
        echo -e "${RED}Error: Port $PORT is in use by another service${NC}"
        echo "Please stop the service or use --port to specify a different port"
        exit 1
    fi
fi

# Start the router
echo ""
echo -e "${BLUE}Starting AI Router on port $PORT...${NC}"
echo ""

# Start uvicorn in background
cd "$ROUTER_DIR"
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port $PORT --reload &
ROUTER_PID=$!
cd - > /dev/null

# Save PID for later cleanup
echo $ROUTER_PID > /tmp/ai-router.pid

# Wait for startup
echo -e "${YELLOW}Waiting for router to start...${NC}"
sleep 2

# Health check
if [ "$HEALTH_CHECK" = true ]; then
    echo -e "${YELLOW}Performing health check...${NC}"
    
    HEALTH_OK=false
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        if curl -s "http://localhost:$PORT/health" | grep -q "healthy"; then
            HEALTH_OK=true
            break
        fi
        echo -e "${YELLOW}  Retry $i/$MAX_HEALTH_RETRIES...${NC}"
        sleep $HEALTH_RETRY_DELAY
    done
    
    if [ "$HEALTH_OK" = true ]; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  ✓ AI Router is running!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "  URL:     ${BLUE}http://localhost:$PORT${NC}"
        echo -e "  Health:  ${BLUE}http://localhost:$PORT/health${NC}"
        echo -e "  Route:   ${BLUE}POST http://localhost:$PORT/route${NC}"
        echo ""
        echo -e "  PID:     $ROUTER_PID"
        echo -e "  Stop:    ${YELLOW}kill $ROUTER_PID${NC} or ${YELLOW}./scripts/stop-local-router.sh${NC}"
        echo ""
        
        # Show health response
        echo -e "${YELLOW}Health check response:${NC}"
        curl -s "http://localhost:$PORT/health" | python3 -m json.tool 2>/dev/null || curl -s "http://localhost:$PORT/health"
        echo ""
    else
        echo -e "${RED}Error: Health check failed after $MAX_HEALTH_RETRIES attempts${NC}"
        echo "Check the router logs for errors."
        kill $ROUTER_PID 2>/dev/null
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}✓ AI Router started (PID: $ROUTER_PID)${NC}"
    echo -e "  URL: http://localhost:$PORT"
    echo ""
fi

# Keep script running to show logs (Ctrl+C to stop)
echo -e "${YELLOW}Press Ctrl+C to stop the router${NC}"
echo ""

# Wait for the router process
wait $ROUTER_PID
