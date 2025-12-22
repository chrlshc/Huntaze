#!/bin/bash

# Script pour créer les tables fan_notes et fan_profiles en base AWS RDS
# Usage: ./scripts/migrate-fan-notes.sh [env]
# Exemples:
#   ./scripts/migrate-fan-notes.sh production  # Utilise .env.production
#   ./scripts/migrate-fan-notes.sh local       # Utilise .env.local

set -e

echo "🚀 Migration du système de notes des fans"
echo "=========================================="
echo ""

# Déterminer quel fichier .env utiliser
ENV_FILE=".env.production"
if [ "$1" = "local" ]; then
  ENV_FILE=".env.local"
fi

echo "📄 Fichier d'environnement: $ENV_FILE"

# Charger les variables d'environnement
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Erreur: $ENV_FILE n'existe pas"
  exit 1
fi

# Exporter DATABASE_URL depuis le fichier
export $(grep -v '^#' "$ENV_FILE" | grep DATABASE_URL | xargs)

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur: DATABASE_URL n'est pas défini dans $ENV_FILE"
  exit 1
fi

echo "✅ DATABASE_URL trouvé"
echo ""

# Afficher l'URL de la base (masquée)
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+).*/\1/')
echo "📍 Base de données: $DB_HOST"
echo ""

# Vérifier si c'est la prod
if [[ "$DB_HOST" == *"rds.amazonaws.com"* ]]; then
  echo "⚠️  ATTENTION: Vous êtes sur AWS RDS PRODUCTION!"
  echo ""
fi

# Formater le schéma Prisma
echo "📝 Formatage du schéma Prisma..."
npx prisma format
echo "✅ Schéma formaté"
echo ""

# Créer la migration
echo "🔨 Création de la migration..."
npx prisma migrate dev --name add_fan_notes --create-only
echo "✅ Migration créée"
echo ""

# Afficher un aperçu de la migration
echo "📋 Aperçu de la migration:"
echo "   - Table: fan_notes (notes sur les fans)"
echo "   - Table: fan_profiles (profils agrégés)"
echo ""

# Demander confirmation
read -p "Appliquer la migration sur AWS RDS ? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "⚡ Application de la migration..."
  npx prisma migrate deploy
  echo "✅ Migration appliquée avec succès!"
  echo ""
  
  # Générer le client Prisma
  echo "🔄 Génération du client Prisma..."
  npx prisma generate
  echo "✅ Client Prisma généré"
  echo ""
  
  echo "🎉 Migration terminée avec succès!"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Redémarrer votre serveur Next.js"
  echo "2. Tester l'API: GET /api/fans/{fanId}/notes"
  echo "3. Voir la doc: docs/FAN-NOTES-AI-INTEGRATION.md"
else
  echo "❌ Migration annulée"
  exit 1
fi
