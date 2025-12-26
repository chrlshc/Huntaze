#!/bin/bash
# ============================================================================
# Huntaze Beta - Script de Vérification Post-Déploiement
# ============================================================================
# Vérifie que tous les services sont opérationnels
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-2"
PROJECT_NAME="huntaze-beta"

# Load environment variables
if [ -f .env.production.local ]; then
    source .env.production.local
fi

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

test_service() {
    local service_name=$1
    local test_command=$2
    
    log_info "Test $service_name..."
    
    if eval "$test_command" &> /dev/null; then
        log_success "$service_name OK"
        return 0
    else
        log_error "$service_name FAILED"
        return 1
    fi
}

# ============================================================================
# Tests
# ============================================================================

echo "============================================================================"
echo "🔍 Vérification du déploiement Huntaze Beta"
echo "============================================================================"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================================================
# Test 1: RDS PostgreSQL
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 1: RDS PostgreSQL"

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL non définie"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log_success "RDS PostgreSQL accessible"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Check tables
        TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        log_info "Tables trouvées: $TABLE_COUNT"
    else
        log_error "RDS PostgreSQL inaccessible"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

echo ""

# ============================================================================
# Test 2: ElastiCache Redis
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 2: ElastiCache Redis"

if [ -z "$REDIS_URL" ]; then
    log_error "REDIS_URL non définie"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    REDIS_HOST=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f1)
    
    if redis-cli -h $REDIS_HOST ping &> /dev/null; then
        log_success "Redis accessible"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Check memory
        REDIS_MEMORY=$(redis-cli -h $REDIS_HOST INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        log_info "Redis memory: $REDIS_MEMORY"
    else
        log_error "Redis inaccessible"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

echo ""

# ============================================================================
# Test 3: S3 Bucket
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 3: S3 Bucket"

if [ -z "$AWS_S3_BUCKET" ]; then
    log_error "AWS_S3_BUCKET non défini"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    if aws s3 ls s3://$AWS_S3_BUCKET --region $REGION &> /dev/null; then
        log_success "S3 bucket accessible"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Check CORS
        if aws s3api get-bucket-cors --bucket $AWS_S3_BUCKET --region $REGION &> /dev/null; then
            log_info "CORS configuré"
        else
            log_warning "CORS non configuré"
        fi
    else
        log_error "S3 bucket inaccessible"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

echo ""

# ============================================================================
# Test 4: Lambda AI Router
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 4: Lambda AI Router"

if [ -z "$AI_ROUTER_URL" ]; then
    log_warning "AI_ROUTER_URL non définie (optionnel)"
    TOTAL_TESTS=$((TOTAL_TESTS - 1))
else
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $AI_ROUTER_URL/health)
    
    if [ "$HEALTH_RESPONSE" == "200" ]; then
        log_success "AI Router accessible"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Test routing
        ROUTE_RESPONSE=$(curl -s -X POST $AI_ROUTER_URL/route \
            -H "Content-Type: application/json" \
            -d '{"prompt":"Hello world"}' \
            -o /dev/null -w "%{http_code}")
        
        if [ "$ROUTE_RESPONSE" == "200" ]; then
            log_info "Routing fonctionne"
        else
            log_warning "Routing retourne: $ROUTE_RESPONSE"
        fi
    else
        log_error "AI Router inaccessible (HTTP $HEALTH_RESPONSE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

echo ""

# ============================================================================
# Test 5: CloudWatch Alarms
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 5: CloudWatch Alarms"

ALARM_COUNT=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix $PROJECT_NAME \
    --region $REGION \
    --query 'length(MetricAlarms)' \
    --output text)

if [ "$ALARM_COUNT" -gt 0 ]; then
    log_success "$ALARM_COUNT alarmes configurées"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # List alarms
    aws cloudwatch describe-alarms \
        --alarm-name-prefix $PROJECT_NAME \
        --region $REGION \
        --query 'MetricAlarms[*].[AlarmName,StateValue]' \
        --output text | while read alarm state; do
        log_info "  - $alarm: $state"
    done
else
    log_warning "Aucune alarme configurée"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# ============================================================================
# Test 6: Vercel Deployment (if URL provided)
# ============================================================================

if [ ! -z "$NEXTAUTH_URL" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Test 6: Vercel Deployment"
    
    VERCEL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $NEXTAUTH_URL/api/health)
    
    if [ "$VERCEL_HEALTH" == "200" ]; then
        log_success "Vercel accessible"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_error "Vercel inaccessible (HTTP $VERCEL_HEALTH)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
fi

# ============================================================================
# Test 7: Environment Variables
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 7: Variables d'environnement"

REQUIRED_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "NEXTAUTH_SECRET"
    "AWS_S3_BUCKET"
)

MISSING_VARS=0

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_warning "  - $var: MANQUANTE"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        log_info "  - $var: ✓"
    fi
done

if [ $MISSING_VARS -eq 0 ]; then
    log_success "Toutes les variables requises sont définies"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_error "$MISSING_VARS variables manquantes"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# ============================================================================
# Test 8: AWS Costs
# ============================================================================

TOTAL_TESTS=$((TOTAL_TESTS + 1))
log_info "Test 8: Coûts AWS"

# Get current month costs
CURRENT_MONTH=$(date +%Y-%m-01)
CURRENT_COST=$(aws ce get-cost-and-usage \
    --time-period Start=$CURRENT_MONTH,End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --region us-east-1 \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text 2>/dev/null || echo "0")

if [ "$CURRENT_COST" != "0" ]; then
    log_info "Coût du mois: \$$(printf "%.2f" $CURRENT_COST)"
    
    # Check if over budget
    if (( $(echo "$CURRENT_COST > 100" | bc -l) )); then
        log_warning "Coût > \$100 (budget dépassé)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        log_success "Coût < \$100 (dans le budget)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    log_warning "Impossible de récupérer les coûts"
    TOTAL_TESTS=$((TOTAL_TESTS - 1))
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo "============================================================================"
echo "📊 Résumé des Tests"
echo "============================================================================"
echo ""
echo "Total: $TOTAL_TESTS tests"
echo -e "${GREEN}Réussis: $PASSED_TESTS${NC}"
echo -e "${RED}Échoués: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "Tous les tests sont passés ! 🎉"
    echo ""
    echo "✅ Votre déploiement est opérationnel"
    echo ""
    echo "🚀 Prochaines étapes:"
    echo "  1. Tester l'application: $NEXTAUTH_URL"
    echo "  2. Monitorer les coûts: AWS Cost Explorer"
    echo "  3. Vérifier les logs: CloudWatch Logs"
    echo ""
    exit 0
else
    log_error "$FAILED_TESTS test(s) ont échoué"
    echo ""
    echo "🔧 Actions recommandées:"
    echo "  1. Vérifier les logs CloudWatch"
    echo "  2. Vérifier les Security Groups"
    echo "  3. Vérifier les variables d'environnement"
    echo "  4. Relancer: ./scripts/deploy-beta-complete.sh"
    echo ""
    exit 1
fi
