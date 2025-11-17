#!/bin/bash
# Script pour nettoyer les utilisateurs de test de la base de données staging

echo "🧹 Nettoyage des utilisateurs de test"
echo "======================================"
echo ""

DATABASE_URL="postgresql://huntazeadmin:2EkPVMUktEWcyJSz4lipzUqLPxQazxSI@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/postgres"

# Liste des patterns d'emails de test à supprimer
TEST_PATTERNS=(
  "test-%@example.com"
  "user%@example.com"
  "%@test.com"
  "test-success@example.com"
  "test-autologin@example.com"
  "test-flow-%@example.com"
  "test-curl-direct@example.com"
  "test-final@example.com"
)

echo "📊 Utilisateurs actuels:"
psql "$DATABASE_URL?sslmode=disable" -c "SELECT id, email, name, created_at FROM users ORDER BY id;"

echo ""
echo "⚠️  Les utilisateurs de test suivants seront supprimés:"
for pattern in "${TEST_PATTERNS[@]}"; do
  echo "   - $pattern"
done

echo ""
read -p "Continuer? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Annulé"
  exit 0
fi

echo ""
echo "🗑️  Suppression en cours..."

# Supprimer les utilisateurs de test
for pattern in "${TEST_PATTERNS[@]}"; do
  COUNT=$(psql "$DATABASE_URL?sslmode=disable" -t -c "SELECT COUNT(*) FROM users WHERE email LIKE '$pattern';")
  if [ "$COUNT" -gt 0 ]; then
    echo "   Suppression de $COUNT utilisateur(s) correspondant à: $pattern"
    psql "$DATABASE_URL?sslmode=disable" -c "DELETE FROM users WHERE email LIKE '$pattern';"
  fi
done

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "📊 Utilisateurs restants:"
psql "$DATABASE_URL?sslmode=disable" -c "SELECT id, email, name, created_at FROM users ORDER BY id;"
