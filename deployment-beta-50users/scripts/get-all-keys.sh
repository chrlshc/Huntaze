#!/bin/bash

# ============================================================================
# 🔑 RÉCUPÉRATION AUTOMATIQUE DE TOUTES LES CLÉS
# ============================================================================

set -e

echo "🔑 Récupération automatique de toutes les clés"
echo "=============================================="
echo ""
echo "Ce script va récupérer:"
echo "  ✅ Clés Azure AI"
echo "  ✅ Clés Azure Speech"
echo "  ✅ Clés AWS (Access Key + Secret Key)"
echo "  ✅ Configuration infrastructure AWS"
echo ""
read -p "Continuer? (y/n): " CONTINUE

if [ "$CONTINUE" != "y" ]; then
    echo "❌ Annulé"
    exit 0
fi

echo ""
echo "============================================"
echo "🚀 DÉMARRAGE"
echo "============================================"
echo ""

# ============================================================================
# 1️⃣ RÉCUPÉRER LES CLÉS AZURE
# ============================================================================

echo "📋 ÉTAPE 1/2: Récupération des clés Azure"
echo "=========================================="
echo ""

if [ -f "deployment-beta-50users/scripts/get-azure-keys.sh" ]; then
    ./deployment-beta-50users/scripts/get-azure-keys.sh
else
    echo "❌ Script get-azure-keys.sh non trouvé"
    exit 1
fi

echo ""
echo "✅ Clés Azure récupérées"
echo ""

# ============================================================================
# 2️⃣ RÉCUPÉRER LES CLÉS AWS
# ============================================================================

echo "📋 ÉTAPE 2/2: Récupération des clés AWS"
echo "========================================"
echo ""

if [ -f "deployment-beta-50users/scripts/get-aws-keys.sh" ]; then
    ./deployment-beta-50users/scripts/get-aws-keys.sh
else
    echo "❌ Script get-aws-keys.sh non trouvé"
    exit 1
fi

echo ""
echo "✅ Clés AWS récupérées"
echo ""

# ============================================================================
# 3️⃣ FUSIONNER LES CLÉS
# ============================================================================

echo "📋 ÉTAPE 3/3: Fusion des clés"
echo "=============================="
echo ""

OUTPUT_FILE="deployment-beta-50users/all-keys.env"

cat > "$OUTPUT_FILE" << 'EOF'
# ============================================================================
# 🔑 TOUTES LES CLÉS - Récupérées automatiquement
# ============================================================================
# Date: $(date)
# 
# ⚠️  NE COMMITE PAS CE FICHIER DANS GIT!
# ⚠️  SAUVEGARDE-LE EN LIEU SÛR!
# ============================================================================

EOF

# Ajouter les clés AWS
if [ -f "deployment-beta-50users/aws-keys.env" ]; then
    echo "# ============================================================================" >> "$OUTPUT_FILE"
    echo "# AWS CREDENTIALS & INFRASTRUCTURE" >> "$OUTPUT_FILE"
    echo "# ============================================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "deployment-beta-50users/aws-keys.env" | grep -v "^#" | grep -v "^$" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# Ajouter les clés Azure
if [ -f "deployment-beta-50users/azure-keys.env" ]; then
    echo "# ============================================================================" >> "$OUTPUT_FILE"
    echo "# AZURE CREDENTIALS & ENDPOINTS" >> "$OUTPUT_FILE"
    echo "# ============================================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "deployment-beta-50users/azure-keys.env" | grep -v "^#" | grep -v "^$" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# Ajouter les secrets générés
echo "# ============================================================================" >> "$OUTPUT_FILE"
echo "# NEXTAUTH & SECURITY" >> "$OUTPUT_FILE"
echo "# ============================================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "NEXTAUTH_URL=https://ton-app.vercel.app" >> "$OUTPUT_FILE"
echo "NEXTAUTH_SECRET=nMvt98/qqyHFdsA/1RRKtWcl4WtakW8K8WM7htUgWnA=" >> "$OUTPUT_FILE"
echo "ENCRYPTION_KEY=08c54a4db8f3d3f479a499e345d8b6ba65a616827d177645d76bfb674f5acd11" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Ajouter Azure Service Bus
echo "# ============================================================================" >> "$OUTPUT_FILE"
echo "# AZURE SERVICE BUS" >> "$OUTPUT_FILE"
echo "# ============================================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "SERVICEBUS_CONNECTION_SEND=Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "✅ Toutes les clés fusionnées: $OUTPUT_FILE"
echo ""

# ============================================================================
# 4️⃣ CRÉER UN FICHIER PRÊT POUR VERCEL
# ============================================================================

echo "📋 ÉTAPE 4/4: Création du fichier Vercel"
echo "========================================="
echo ""

VERCEL_READY_FILE="deployment-beta-50users/VERCEL-READY.txt"

cat > "$VERCEL_READY_FILE" << 'EOF'
# ============================================================================
# 📋 VARIABLES VERCEL - PRÊTES À COPIER-COLLER
# ============================================================================
# 
# Instructions:
# 1. Va sur vercel.com → Ton projet → Settings → Environment Variables
# 2. Copie-colle TOUTES les variables ci-dessous
# 3. Sélectionne: Production, Preview, Development
# 4. Clique "Save"
# 
# ⚠️  Remplace "https://ton-app.vercel.app" par ton URL Vercel réelle
# ============================================================================

EOF

# Ajouter toutes les variables
cat "$OUTPUT_FILE" | grep -v "^#" | grep -v "^$" >> "$VERCEL_READY_FILE"

echo "✅ Fichier Vercel créé: $VERCEL_READY_FILE"
echo ""

# ============================================================================
# 5️⃣ RÉSUMÉ FINAL
# ============================================================================

echo "============================================"
echo "✅ RÉCUPÉRATION COMPLÈTE TERMINÉE"
echo "============================================"
echo ""
echo "📁 Fichiers créés:"
echo "  - deployment-beta-50users/aws-keys.env"
echo "  - deployment-beta-50users/azure-keys.env"
echo "  - deployment-beta-50users/all-keys.env (TOUTES les clés)"
echo "  - deployment-beta-50users/VERCEL-READY.txt (prêt pour Vercel)"
echo "  - deployment-beta-50users/COPY-PASTE-VERCEL.txt (mis à jour)"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "  1️⃣  VÉRIFIE les clés:"
echo "      cat deployment-beta-50users/all-keys.env"
echo ""
echo "  2️⃣  COPIE dans Vercel:"
echo "      cat deployment-beta-50users/VERCEL-READY.txt"
echo "      → Colle dans Vercel (Settings → Environment Variables)"
echo ""
echo "  3️⃣  INITIALISE la base de données:"
echo "      export DATABASE_URL=\$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)"
echo "      npx prisma db push"
echo ""
echo "  4️⃣  DÉPLOIE sur Vercel:"
echo "      vercel --prod"
echo ""
echo "🔐 Sécurité:"
echo "  ⚠️  SAUVEGARDE all-keys.env en lieu sûr!"
echo "  ⚠️  NE COMMITE PAS ces fichiers dans Git!"
echo "  ⚠️  Ils sont déjà dans .gitignore"
echo ""

# Ajouter au .gitignore
if ! grep -q "all-keys.env" .gitignore 2>/dev/null; then
    echo "all-keys.env" >> .gitignore
    echo "VERCEL-READY.txt" >> .gitignore
    echo "✅ Fichiers ajoutés au .gitignore"
    echo ""
fi

echo "============================================"
echo "🎉 PRÊT À DÉPLOYER!"
echo "============================================"
echo ""
echo "Tu as maintenant TOUTES les clés nécessaires."
echo "Suis les étapes ci-dessus pour déployer sur Vercel."
echo ""
echo "Temps estimé: 15-20 minutes"
echo ""
