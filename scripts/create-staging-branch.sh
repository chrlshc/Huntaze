#!/bin/bash

# Script pour créer une branche staging et la déployer sur Amplify
echo "🚀 Création de l'environnement de staging..."

# Créer une nouvelle branche staging basée sur prod
git checkout -b staging
git push huntaze staging

echo "✅ Branche staging créée et pushée"
echo ""
echo "📋 Prochaines étapes pour configurer le staging sur AWS Amplify:"
echo "1. Aller sur AWS Amplify Console"
echo "2. Sélectionner l'app Huntaze"
echo "3. Cliquer sur 'Connect branch'"
echo "4. Sélectionner la branche 'staging'"
echo "5. Configurer les variables d'environnement pour staging"
echo ""
echo "🔧 Variables d'environnement recommandées pour staging:"
echo "- NEXT_PUBLIC_APP_URL: https://staging.d2yjqfqvvvvvvv.amplifyapp.com"
echo "- DATABASE_URL: [URL de la base de données de staging]"
echo "- Toutes les autres variables de prod mais avec des valeurs de test"
echo ""
echo "🌐 Une fois déployé, l'URL de staging sera disponible dans Amplify Console"