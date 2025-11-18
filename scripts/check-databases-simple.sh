#!/bin/bash

echo "🔍 Vérification des bases de données"
echo "====================================="
echo ""

# DB 1: us-east-1
echo "📊 DB 1: huntaze-postgres-production (us-east-1)"
PGPASSWORD="2EkPVMUktEWcyJSz4lipzUqLPxQazxSI" psql -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com -U huntazeadmin -d postgres -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>&1 | head -30
echo ""
echo "Nombre d'utilisateurs:"
PGPASSWORD="2EkPVMUktEWcyJSz4lipzUqLPxQazxSI" psql -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com -U huntazeadmin -d postgres -c "SELECT COUNT(*) as user_count FROM users;" 2>&1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# DB 2: us-west-1
echo "📊 DB 2: huntaze-production-cluster (us-west-1)"
PGPASSWORD="zOn2Rb7fL1ymggHDu" psql -h huntaze-production-cluster.cluster-cpgwqmgg2e1f.us-west-1.rds.amazonaws.com -U huntaze_admin -d huntaze_production -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>&1 | head -30
echo ""
echo "Nombre d'utilisateurs:"
PGPASSWORD="zOn2Rb7fL1ymggHDu" psql -h huntaze-production-cluster.cluster-cpgwqmgg2e1f.us-west-1.rds.amazonaws.com -U huntaze_admin -d huntaze_production -c "SELECT COUNT(*) as user_count FROM users;" 2>&1
echo ""
