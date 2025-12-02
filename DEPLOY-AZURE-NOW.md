# 🚀 DÉPLOYER AZURE OPENAI MAINTENANT

## Commande unique

```bash
cd infra/terraform/azure-ai && ./deploy-simple.sh
```

C'est tout ! Le script fait tout automatiquement.

---

## Ce qui va se passer

1. ✅ Vérification des prérequis (Azure CLI, Terraform)
2. ✅ Connexion à Azure
3. ✅ Création de l'infrastructure (3-5 min)
4. ✅ Affichage des credentials
5. ✅ Sauvegarde dans `.azure-credentials.txt`

---

## Après le déploiement

Copie les variables affichées et ajoute-les dans **AWS Amplify Console** :

```
AZURE_OPENAI_ENDPOINT="..."
AZURE_OPENAI_API_KEY="..."
AZURE_API_VERSION="2024-05-01-preview"
AZURE_DEPLOYMENT_PREMIUM="gpt-4-turbo-prod"
AZURE_DEPLOYMENT_STANDARD="gpt-35-turbo-prod"
```

---

## Besoin d'aide ?

Consulte les guides détaillés :
- `AZURE-READY-TO-DEPLOY.md` - Guide rapide
- `AZURE-DEPLOYMENT-GUIDE-SIMPLE.md` - Guide complet
- `SESSION-AZURE-SETUP-COMPLETE.md` - Résumé de la session

---

**Durée totale : 10 minutes**
