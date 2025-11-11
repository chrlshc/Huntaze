#!/bin/bash

# Script pour exécuter les tests smoke avec le serveur de développement
# Usage: ./scripts/run-smoke-tests.sh

set -e

echo "🚀 Starting smoke tests..."
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PORT=3000
BASE_URL="http://localhost:$PORT"
MAX_WAIT=60  # secondes

# Fonction pour nettoyer à la sortie
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo ""
        echo -e "${YELLOW}🛑 Stopping development server (PID: $SERVER_PID)...${NC}"
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Server stopped${NC}"
    fi
}

# Configurer le trap pour nettoyer à la sortie
trap cleanup EXIT INT TERM

# Vérifier si le port est déjà utilisé
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
    echo -e "${YELLOW}   Using existing server...${NC}"
    SERVER_RUNNING=true
else
    echo -e "${GREEN}📦 Starting development server on port $PORT...${NC}"
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    SERVER_RUNNING=false
    echo -e "${GREEN}   Server PID: $SERVER_PID${NC}"
fi

# Attendre que le serveur soit prêt
echo ""
echo -e "${YELLOW}⏳ Waiting for server to be ready...${NC}"

WAIT_TIME=0
while ! curl -s $BASE_URL > /dev/null 2>&1; do
    if [ $WAIT_TIME -ge $MAX_WAIT ]; then
        echo -e "${RED}❌ Server failed to start after ${MAX_WAIT}s${NC}"
        exit 1
    fi
    
    echo -n "."
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
done

echo ""
echo -e "${GREEN}✅ Server is ready!${NC}"
echo ""

# Exécuter les tests smoke
echo -e "${GREEN}🧪 Running smoke tests...${NC}"
echo ""

if npm run e2e:smoke; then
    echo ""
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    EXIT_CODE=0
else
    echo ""
    echo -e "${RED}❌ Some smoke tests failed${NC}"
    EXIT_CODE=1
fi

# Si nous avons démarré le serveur, le nettoyer
if [ "$SERVER_RUNNING" = false ]; then
    cleanup
fi

exit $EXIT_CODE
