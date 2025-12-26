#!/bin/bash

# ============================================================================
# 🔐 GÉNÉRATION AUTOMATIQUE DES SECRETS
# ============================================================================
# Ce script génère tous les secrets requis pour Vercel
# Usage: ./scripts/generate-secrets.sh
# ============================================================================

set -e

echo "🔐 Génération des secrets pour Vercel..."
echo ""
echo "============================================================================"
echo "📋 SECRETS GÉNÉRÉS - COPIE-COLLE DANS VERCEL"
echo "============================================================================"
echo ""

# Génère tous les secrets
JWT_SECRET=$(openssl rand -hex 32)
OAUTH_STATE_SECRET=$(openssl rand -hex 32)
WORKER_SECRET=$(openssl rand -hex 32)
DATA_DELETION_SECRET=$(openssl rand -hex 32)
CRM_WEBHOOK_SECRET=$(openssl rand -hex 32)
INSTAGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 32)
TIKTOK_WEBHOOK_SECRET=$(openssl rand -hex 32)
ONLYFANS_WEBHOOK_SECRET=$(openssl rand -hex 32)
APIFY_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Affiche les secrets
echo "# ============================================"
echo "# SECRETS INTERNES (REQUIS)"
echo "# ============================================"
echo "JWT_SECRET=$JWT_SECRET"
echo "OAUTH_STATE_SECRET=$OAUTH_STATE_SECRET"
echo "WORKER_SECRET=$WORKER_SECRET"
echo "DATA_DELETION_SECRET=$DATA_DELETION_SECRET"
echo "CRM_WEBHOOK_SECRET=$CRM_WEBHOOK_SECRET"
echo ""
echo "# ============================================"
echo "# WEBHOOKS SECRETS (REQUIS)"
echo "# ============================================"
echo "INSTAGRAM_WEBHOOK_SECRET=$INSTAGRAM_WEBHOOK_SECRET"
echo "INSTAGRAM_WEBHOOK_VERIFY_TOKEN=$INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
echo "TIKTOK_WEBHOOK_SECRET=$TIKTOK_WEBHOOK_SECRET"
echo "ONLYFANS_WEBHOOK_SECRET=$ONLYFANS_WEBHOOK_SECRET"
echo "APIFY_WEBHOOK_SECRET=$APIFY_WEBHOOK_SECRET"
echo ""
echo "============================================================================"
echo ""
echo "✅ 10 secrets générés avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Copie TOUTES les lignes ci-dessus"
echo "2. Va sur vercel.com → Ton projet → Settings → Environment Variables"
echo "3. Colle les secrets"
echo "4. Sélectionne: Production, Preview, Development"
echo "5. Clique 'Save'"
echo ""
echo "🔴 ENSUITE, configure les OAuth (CRITIQUE!):"
echo "   - Google OAuth: https://console.cloud.google.com/apis/credentials"
echo "   - Apify: https://console.apify.com/account/integrations"
echo "   - Instagram: https://developers.facebook.com/apps/"
echo "   - TikTok: https://developers.tiktok.com/"
echo ""
echo "============================================================================"

# Sauvegarde dans un fichier (pour référence, NE PAS COMMITER)
OUTPUT_FILE="deployment-beta-50users/secrets-generated-$(date +%Y%m%d-%H%M%S).txt"
cat > "$OUTPUT_FILE" << EOF
# Secrets générés le $(date)
# ⚠️ NE PAS COMMITER CE FICHIER!

# SECRETS INTERNES
JWT_SECRET=$JWT_SECRET
OAUTH_STATE_SECRET=$OAUTH_STATE_SECRET
WORKER_SECRET=$WORKER_SECRET
DATA_DELETION_SECRET=$DATA_DELETION_SECRET
CRM_WEBHOOK_SECRET=$CRM_WEBHOOK_SECRET

# WEBHOOKS SECRETS
INSTAGRAM_WEBHOOK_SECRET=$INSTAGRAM_WEBHOOK_SECRET
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=$INSTAGRAM_WEBHOOK_VERIFY_TOKEN
TIKTOK_WEBHOOK_SECRET=$TIKTOK_WEBHOOK_SECRET
ONLYFANS_WEBHOOK_SECRET=$ONLYFANS_WEBHOOK_SECRET
APIFY_WEBHOOK_SECRET=$APIFY_WEBHOOK_SECRET
EOF

echo "💾 Secrets sauvegardés dans: $OUTPUT_FILE"
echo "⚠️  NE COMMITE PAS ce fichier!"
echo ""
