#!/bin/bash

echo "🔍 Vérification des bases de données disponibles"
echo "================================================"
echo ""

# DB 1: us-east-1
echo "📊 DB 1: huntaze-postgres-production (us-east-1)"
echo "Host: huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com"
export DATABASE_URL="postgresql://huntazeadmin:2EkPVMUktEWcyJSz4lipzUqLPxQazxSI@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/postgres"
echo "Testing connection..."
npx prisma db execute --stdin <<EOF 2>&1 | head -20
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'oauth_accounts', COUNT(*) FROM oauth_accounts
UNION ALL  
SELECT 'content', COUNT(*) FROM content
UNION ALL
SELECT 'marketing_campaigns', COUNT(*) FROM marketing_campaigns
ORDER BY table_name;
EOF
DB1_STATUS=$?
echo ""

# DB 2: us-west-1
echo "📊 DB 2: huntaze-production-cluster (us-west-1)"
echo "Host: huntaze-production-cluster.cluster-cpgwqmgg2e1f.us-west-1.rds.amazonaws.com"
export DATABASE_URL="postgresql://huntaze_admin:zOn2Rb7fL1ymggHDu@huntaze-production-cluster.cluster-cpgwqmgg2e1f.us-west-1.rds.amazonaws.com:5432/huntaze_production"
echo "Testing connection..."
npx prisma db execute --stdin <<EOF 2>&1 | head -20
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'oauth_accounts', COUNT(*) FROM oauth_accounts
UNION ALL
SELECT 'content', COUNT(*) FROM content
UNION ALL
SELECT 'marketing_campaigns', COUNT(*) FROM marketing_campaigns
ORDER BY table_name;
EOF
DB2_STATUS=$?
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Résumé:"
if [ $DB1_STATUS -eq 0 ]; then
    echo "✅ DB1 (us-east-1): Accessible"
else
    echo "❌ DB1 (us-east-1): Erreur de connexion"
fi

if [ $DB2_STATUS -eq 0 ]; then
    echo "✅ DB2 (us-west-1): Accessible"
else
    echo "❌ DB2 (us-west-1): Erreur de connexion"
fi
echo ""
