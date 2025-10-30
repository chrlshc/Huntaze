# Dépannage Azure OpenAI - Huntaze

## ❌ Erreur 401: Access denied

### Symptôme
```
Error 401: Access denied due to invalid subscription key or wrong API endpoint
```

### Causes possibles

#### 1. Clé API invalide ou expirée

**Vérification** :
1. Allez sur le portail Azure : https://portal.azure.com
2. Naviguez vers votre ressource Azure OpenAI : `huntaze-ai-hub-eus2`
3. Menu de gauche → **Keys and Endpoint**
4. Vérifiez que la clé dans `.env` correspond à **KEY 1** ou **KEY 2**

**Solution** :
```bash
# Dans .env, remplacez par la bonne clé
AZURE_OPENAI_API_KEY=votre-vraie-cle-depuis-azure
```

#### 2. Endpoint incorrect

**Vérification** :
- L'endpoint doit être : `https://huntaze-ai-hub-eus2.openai.azure.com`
- **SANS** slash final `/`
- **SANS** `/openai/` dans l'URL de base

**Solution** :
```bash
# Dans .env
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.openai.azure.com
```

#### 3. Déploiement inexistant

**Vérification** :
1. Portail Azure → Votre ressource Azure OpenAI
2. Menu de gauche → **Model deployments**
3. Cliquez sur **Manage Deployments**
4. Vérifiez que le déploiement `gpt-4-turbo` existe

**Solution** :
```bash
# Dans .env, utilisez le nom EXACT du déploiement
AZURE_OPENAI_DEPLOYMENT=nom-exact-du-deploiement
```

#### 4. Version API non supportée

**Vérification** :
- Versions supportées : `2024-02-15-preview`, `2024-05-01-preview`, `2024-08-01-preview`

**Solution** :
```bash
# Dans .env, essayez une version différente
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

#### 5. Région incorrecte

**Vérification** :
- Votre ressource est dans **East US 2** (`eus2`)
- L'endpoint doit correspondre à cette région

**Solution** :
Vérifiez que l'endpoint correspond à la région de votre ressource Azure.

## 🔧 Étapes de dépannage

### Étape 1 : Vérifier la configuration

```bash
node scripts/test-azure-connection.mjs
```

Vérifiez que toutes les variables sont présentes.

### Étape 2 : Vérifier dans Azure Portal

1. **Ressource** : `huntaze-ai-hub-eus2`
2. **Keys and Endpoint** :
   - Copiez KEY 1
   - Copiez l'Endpoint
3. **Model deployments** :
   - Notez le nom exact du déploiement

### Étape 3 : Mettre à jour .env

```bash
# Exemple de configuration correcte
AZURE_OPENAI_API_KEY=4spL9UZ273N38AxyhlbdcpAxgkXNqbbvweUw5Sr3BHJfcNAL3D4NJQQJ99BHACYeBjFXJ3w3AAABACOG95jj
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
DEFAULT_AI_MODEL=gpt-4-turbo
DEFAULT_AI_PROVIDER=openai
NODE_ENV=development
```

### Étape 4 : Tester la connexion

```bash
node scripts/test-azure-connection.mjs --test-connection
```

Si ça fonctionne, vous verrez :
```
✅ Connexion réussie !
📝 Réponse: Hello from Huntaze!
📊 Tokens utilisés: XX
```

### Étape 5 : Tester avec l'application

```bash
# Tests unitaires
npm test tests/unit/ai-service.test.ts

# Lancer l'app
npm run dev

# Tester l'endpoint
curl http://localhost:3000/api/ai/azure/smoke?force=1 \
  -H "Authorization: Bearer votre-token"
```

## 📋 Checklist de vérification

- [ ] Clé API copiée depuis Azure Portal (Keys and Endpoint)
- [ ] Endpoint sans slash final
- [ ] Nom du déploiement exact (depuis Model deployments)
- [ ] Version API supportée
- [ ] Région correcte (East US 2)
- [ ] Ressource Azure OpenAI active
- [ ] Quota disponible dans Azure
- [ ] Pas de restrictions réseau/firewall

## 🆘 Si rien ne fonctionne

### Option 1 : Créer un nouveau déploiement

1. Azure Portal → Votre ressource
2. Model deployments → Create new deployment
3. Choisissez un modèle (ex: gpt-4o-mini)
4. Donnez un nom simple (ex: `gpt-4o-mini`)
5. Mettez à jour `.env` avec ce nouveau nom

### Option 2 : Utiliser OpenAI standard (fallback)

Si Azure ne fonctionne pas, l'app peut utiliser OpenAI standard :

```bash
# Dans .env, commentez les variables Azure
# AZURE_OPENAI_API_KEY=...
# AZURE_OPENAI_ENDPOINT=...

# Ajoutez OpenAI standard
OPENAI_API_KEY=sk-votre-cle-openai
```

L'app basculera automatiquement sur OpenAI standard.

### Option 3 : Mode sans IA

Huntaze fonctionne parfaitement sans IA (90% des fonctionnalités) :

```bash
# Dans .env, ne définissez aucune clé AI
# L'app fonctionnera sans les suggestions IA
```

## 📞 Support

- **Documentation Azure** : https://learn.microsoft.com/azure/ai-services/openai/
- **Status Azure** : https://status.azure.com/
- **Support Azure** : Ouvrez un ticket dans le portail Azure

## ✅ Configuration validée

Une fois que `node scripts/test-azure-connection.mjs --test-connection` fonctionne :

1. ✅ Tous les tests passent
2. ✅ L'app peut utiliser Azure OpenAI
3. ✅ Les suggestions IA sont disponibles
4. ✅ Prêt pour la production

---

**Dernière mise à jour** : 26 octobre 2025
