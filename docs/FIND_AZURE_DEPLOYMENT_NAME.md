# Comment trouver le nom exact du déploiement Azure OpenAI

## Erreur actuelle
```
DeploymentNotFound: Le déploiement 'gpt-4-turbo' n'existe pas dans cette ressource
```

## Solution : Trouver le nom exact dans Azure Portal

### Étape 1 : Accéder à votre ressource Azure OpenAI

1. Connectez-vous au [Azure Portal](https://portal.azure.com)
2. Recherchez "Azure OpenAI" dans la barre de recherche
3. Cliquez sur votre ressource : **huntaze-ai-eus2-29796**

### Étape 2 : Voir les déploiements

1. Dans le menu de gauche, cliquez sur **"Deployments"** ou **"Déploiements"**
2. Vous verrez la liste de tous vos déploiements actifs
3. Notez le **nom exact** du déploiement (colonne "Name" ou "Nom")

### Étape 3 : Identifier le bon déploiement

Les noms de déploiement peuvent être différents du nom du modèle :
- ✅ Nom du modèle : `gpt-4-turbo` (ce que vous voulez utiliser)
- ❌ Nom du déploiement : `gpt-4-turbo` (n'existe pas)
- ✅ Nom du déploiement possible : `gpt-4`, `gpt4-turbo`, `gpt-4-deployment`, etc.

### Étape 4 : Mettre à jour la configuration

Une fois que vous avez trouvé le nom exact, mettez à jour votre fichier `.env` :

```bash
AZURE_OPENAI_DEPLOYMENT=<NOM_EXACT_DU_DEPLOIEMENT>
```

## Alternative : Utiliser Azure CLI

Si vous avez Azure CLI installé :

```bash
# Lister tous les déploiements
az cognitiveservices account deployment list \
  --name huntaze-ai-eus2-29796 \
  --resource-group huntaze-ai \
  --query "[].{Name:name, Model:properties.model.name}" \
  --output table
```

## Noms de déploiement courants

Voici quelques exemples de noms que vous pourriez trouver :
- `gpt-4`
- `gpt4`
- `gpt-4-deployment`
- `gpt-4-32k`
- `gpt-35-turbo`
- `gpt-4o`

## Après la mise à jour

1. Redémarrez votre application
2. Testez la connexion avec :
   ```bash
   node scripts/test-azure-connection.mjs
   ```

## Informations de votre ressource

- **Endpoint** : https://huntaze-ai-eus2-29796.openai.azure.com
- **Resource Group** : huntaze-ai
- **Resource Name** : huntaze-ai-eus2-29796
- **API Version** : 2024-05-01-preview

## Besoin d'aide ?

Si vous ne trouvez aucun déploiement :
1. Vous devez créer un déploiement dans Azure Portal
2. Allez dans votre ressource Azure OpenAI
3. Cliquez sur "Deployments" → "Create new deployment"
4. Sélectionnez le modèle GPT-4 Turbo
5. Donnez-lui un nom (ex: `gpt-4-turbo`)
6. Utilisez ce nom dans votre `.env`
