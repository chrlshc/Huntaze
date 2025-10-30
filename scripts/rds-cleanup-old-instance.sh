#!/bin/bash
# Cleanup: Supprimer l'ancienne instance après validation (24-48h)

set -e

REGION="us-east-1"
OLD_INSTANCE="huntaze-postgres-production"

echo "🗑️ CLEANUP: Suppression de l'ancienne instance RDS"
echo "=================================================="
echo ""

# Vérification
echo "⚠️  WARNING: Cette action va supprimer définitivement:"
echo "  - Instance: $OLD_INSTANCE"
echo ""
echo "Snapshots conservés:"
aws rds describe-db-snapshots \
  --db-instance-identifier "$OLD_INSTANCE" \
  --region "$REGION" \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Encrypted:Encrypted}' \
  --output table

echo ""
read -p "Confirmer la suppression? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Suppression annulée"
  exit 0
fi

# Suppression
echo ""
echo "🗑️ Suppression de l'instance..."
aws rds delete-db-instance \
  --db-instance-identifier "$OLD_INSTANCE" \
  --skip-final-snapshot \
  --region "$REGION"

echo "✅ Instance supprimée (en cours)"
echo ""
echo "Note: Les snapshots existants sont conservés"
echo "Vous pouvez les supprimer manuellement si nécessaire:"
echo "  aws rds delete-db-snapshot --db-snapshot-identifier <snapshot-id> --region $REGION"
echo ""
