#!/bin/bash
# Option A: Suppression immédiate de l'ancienne instance (conformité stricte)

set -e

REGION="us-east-1"
OLD_INSTANCE="huntaze-postgres-production"
NEW_INSTANCE="huntaze-postgres-production-encrypted"

echo "⚡ OPTION A: Suppression Immédiate (Conformité Stricte)"
echo "======================================================="
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

# 2. Vérifier qu'un snapshot chiffré existe déjà
echo "2️⃣ Vérification des snapshots chiffrés existants..."
ENCRYPTED_SNAPSHOTS=$(aws rds describe-db-snapshots \
  --db-instance-identifier "$OLD_INSTANCE" \
  --region "$REGION" \
  --query 'DBSnapshots[?Encrypted==`true`].DBSnapshotIdentifier' \
  --output json)

SNAPSHOT_COUNT=$(echo "$ENCRYPTED_SNAPSHOTS" | jq '. | length')

if [ "$SNAPSHOT_COUNT" -eq 0 ]; then
  echo "⚠️  No encrypted snapshot found. Creating one now..."
  
  FINAL_SNAPSHOT="$OLD_INSTANCE-final-encrypted-$(date +%Y%m%d-%H%M%S)"
  TEMP_SNAPSHOT="$OLD_INSTANCE-temp-$(date +%Y%m%d-%H%M%S)"
  
  # Créer snapshot non chiffré
  aws rds create-db-snapshot \
    --db-instance-identifier "$OLD_INSTANCE" \
    --db-snapshot-identifier "$TEMP_SNAPSHOT" \
    --region "$REGION"
  
  aws rds wait db-snapshot-completed \
    --db-snapshot-identifier "$TEMP_SNAPSHOT" \
    --region "$REGION"
  
  # Copier avec chiffrement
  aws rds copy-db-snapshot \
    --source-db-snapshot-identifier "$TEMP_SNAPSHOT" \
    --target-db-snapshot-identifier "$FINAL_SNAPSHOT" \
    --kms-key-id alias/aws/rds \
    --region "$REGION"
  
  aws rds wait db-snapshot-completed \
    --db-snapshot-identifier "$FINAL_SNAPSHOT" \
    --region "$REGION"
  
  # Supprimer le snapshot temporaire
  aws rds delete-db-snapshot \
    --db-snapshot-identifier "$TEMP_SNAPSHOT" \
    --region "$REGION"
  
  echo "✅ Encrypted snapshot created: $FINAL_SNAPSHOT"
else
  echo "✅ Found $SNAPSHOT_COUNT encrypted snapshot(s)"
  echo "$ENCRYPTED_SNAPSHOTS" | jq -r '.[]'
fi

echo ""

# 3. Confirmation finale
echo "⚠️  CONFIRMATION FINALE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Cette action va:"
echo "  ❌ Supprimer définitivement: $OLD_INSTANCE"
echo "  ✅ Conserver les snapshots chiffrés pour rollback"
echo "  ✅ Nouvelle instance active: $NEW_INSTANCE"
echo ""
read -p "Confirmer la suppression? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Suppression annulée"
  exit 0
fi

# 4. Suppression
echo ""
echo "🗑️ Suppression de l'ancienne instance..."
aws rds delete-db-instance \
  --db-instance-identifier "$OLD_INSTANCE" \
  --skip-final-snapshot \
  --region "$REGION"

echo "✅ Instance supprimée (en cours)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ OPTION A COMPLÉTÉE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "État:"
echo "  ✅ Instance chiffrée: $NEW_INSTANCE (ACTIVE)"
echo "  ❌ Instance ancienne: $OLD_INSTANCE (DELETED)"
echo "  💾 Snapshots chiffrés: CONSERVÉS"
echo ""
echo "Conformité: ✅ Zéro ressource non chiffrée"
echo ""
echo "Rollback (si nécessaire):"
echo "  1. Restaurer depuis snapshot chiffré"
echo "  2. ETA: 15-30 minutes"
echo ""
