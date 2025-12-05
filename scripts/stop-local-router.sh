#!/bin/bash
# =============================================================================
# Stop Local AI Router
# =============================================================================
# Stops the Python AI Router running locally.
#
# Usage:
#   ./scripts/stop-local-router.sh [--port PORT]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PORT=8000

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${YELLOW}Stopping AI Router on port $PORT...${NC}"

# Method 1: Use saved PID
if [ -f /tmp/ai-router.pid ]; then
    PID=$(cat /tmp/ai-router.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        rm /tmp/ai-router.pid
        echo -e "${GREEN}✓ Stopped router (PID: $PID)${NC}"
        exit 0
    fi
    rm /tmp/ai-router.pid
fi

# Method 2: Find by port
PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill 2>/dev/null || true
    echo -e "${GREEN}✓ Stopped processes on port $PORT${NC}"
else
    echo -e "${YELLOW}No router found running on port $PORT${NC}"
fi
