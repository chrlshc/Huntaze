#!/bin/bash
# Option B: Garder les 2 instances temporairement (24-48h)
# STOP l'ancienne pour économiser le compute

set -e

REGION="us-east-1"
OLD_INSTANCE="huntaze-postgres-production"
NEW_INSTANCE="huntaze-postgres-production-encrypted"

echo "🛡️ OPTION B: Configuration Prudente (24-48h)"
echo "=============================================="
echo ""

# 1. Vérifier que la nouvelle instance est bien chiffrée et disponible
echo "1️⃣ Vérification de la nouvelle instance chiffrée..."
NEW_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$NEW_INSTANCE" \
  --region "$REGION" \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Encrypted:StorageEncrypted}' \
  --output json)

echo "$NEW_STATUS" | jq .

if [ "$(echo "$NEW_STATUS" | jq -r '.Encrypted')" != "true" ]; then
  echo "❌ ERROR: New instance is not encrypted!"
  exit 1
fi

if [ "$(echo "$NEW_STATUS" | jq -r '.Status')" != "available" ]; then
  echo "❌ ERROR: New instance is not available!"
  exit 1
fi

echo "✅ New encrypted instance verified"
echo ""

# 2. Créer un snapshot final de l'ancienne instance (backup de sécurité)
echo "2️⃣ Création d'un snapshot final de l'ancienne instance..."
FINAL_SNAPSHOT="$OLD_INSTANCE-final-before-stop-$(date +%Y%m%d-%H%M%S)"

aws rds create-db-snapshot \
  --db-instance-identifier "$OLD_INSTANCE" \
  --db-snapshot-identifier "$FINAL_SNAPSHOT" \
  --region "$REGION"

echo "⏳ Waiting for snapshot to complete..."
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier "$FINAL_SNAPSHOT" \
  --region "$REGION"

echo "✅ Final snapshot created: $FINAL_SNAPSHOT"
echo ""

# 3. STOP l'ancienne instance pour économiser le compute
echo "3️⃣ STOP de l'ancienne instance (économie de compute)..."
echo "⚠️  Note: L'instance redémarrera automatiquement après 7 jours"

aws rds stop-db-instance \
  --db-instance-identifier "$OLD_INSTANCE" \
  --region "$REGION"

echo "✅ Old instance stopped"
echo ""

# 4. Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ OPTION B CONFIGURÉE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "État actuel:"
echo "  ✅ Instance chiffrée: $NEW_INSTANCE (ACTIVE)"
echo "  ⏸️  Instance ancienne: $OLD_INSTANCE (STOPPED)"
echo "  💾 Snapshot final: $FINAL_SNAPSHOT"
echo ""
echo "Économies:"
echo "  - Compute de l'ancienne instance: ARRÊTÉ"
echo "  - Coût: Stockage uniquement (~\$2-3/mois pour 20GB)"
echo ""
echo "Période d'observation: 24-48 heures"
echo ""
echo "Actions à faire:"
echo "  1. Surveiller canaries/alarms pendant 24-48h"
echo "  2. Vérifier que l'application utilise bien la nouvelle instance"
echo "  3. Après validation, supprimer l'ancienne:"
echo "     ./scripts/rds-cleanup-old-instance.sh"
echo ""
echo "Rollback rapide (si besoin):"
echo "  aws rds start-db-instance --db-instance-identifier $OLD_INSTANCE --region $REGION"
echo "  # Puis repointer l'application vers l'ancien endpoint"
echo ""
