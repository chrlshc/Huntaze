# 🔓 Activer l'accès public Azure OpenAI

## Guide étape par étape

### Étape 1 : Se connecter au portail Azure

1. Allez sur https://portal.azure.com
2. Connectez-vous avec votre compte Microsoft

### Étape 2 : Trouver votre ressource

1. Dans la barre de recherche en haut, tapez : `huntaze-ai-eus2-29796`
2. Cliquez sur la ressource dans les résultats

### Étape 3 : Accéder aux paramètres réseau

1. Dans le menu de gauche, cherchez **"Networking"** ou **"Réseau"**
2. Cliquez dessus

### Étape 4 : Configurer l'accès

Vous verrez plusieurs options :

#### Option A : Autoriser toutes les IPs (Plus simple)

1. Sélectionnez **"All networks"** ou **"Tous les réseaux"**
2. Cliquez sur **"Save"** ou **"Enregistrer"** en haut
3. Attendez 1-2 minutes

✅ **Avantages** : Fonctionne de partout  
⚠️ **Inconvénients** : Moins sécurisé

#### Option B : Autoriser votre IP uniquement (Plus sécurisé)

1. Sélectionnez **"Selected networks"** ou **"Réseaux sélectionnés"**
2. Dans la section **"Firewall"**, cliquez sur **"Add client IP"** ou **"Ajouter l'IP du client"**
3. Votre IP actuelle sera ajoutée automatiquement
4. Cliquez sur **"Save"** ou **"Enregistrer"**
5. Attendez 1-2 minutes

✅ **Avantages** : Plus sécurisé  
⚠️ **Inconvénients** : Si votre IP change, vous devrez la mettre à jour

### Étape 5 : Vérifier votre IP (si Option B)

```bash
# Dans votre terminal
curl https://api.ipify.org
```

Cette commande affiche votre IP publique actuelle.

### Étape 6 : Tester la connexion

```bash
# Dans votre terminal
node scripts/test-azure-connection.mjs --test-connection
```

**Résultat attendu** :
```
✅ Connexion réussie !
📝 Réponse: Hello from Huntaze!
📊 Tokens utilisés: 15
```

## 🎉 C'est fait !

Une fois l'accès public activé, tout fonctionne :

```bash
# Tester les services AI
npm test tests/unit/ai-service.test.ts -- --run

# Lancer l'application
npm run dev

# Tester le chatting IA
# L'app sera sur http://localhost:3000
```

## 🔒 Sécurité

### Pour le développement

**Option A** (All networks) est acceptable car :
- Vous avez toujours besoin de la clé API
- C'est temporaire pour le dev
- Vous pouvez restreindre plus tard

### Pour la production

**Recommandations** :
1. Utilisez **Option B** (Selected networks)
2. Ajoutez uniquement les IPs de vos serveurs de production
3. Ou utilisez un private endpoint avec VNet integration

## ❓ Problèmes courants

### "Je ne vois pas l'option Networking"

**Solution** : Vous n'avez peut-être pas les permissions. Contactez l'administrateur Azure.

### "Save est grisé"

**Solution** : Attendez que la page charge complètement, puis réessayez.

### "Toujours erreur 403 après activation"

**Solutions** :
1. Attendez 2-3 minutes (propagation)
2. Vérifiez que vous avez bien cliqué "Save"
3. Rafraîchissez la page Azure Portal
4. Retestez

### "Mon IP change souvent"

**Solutions** :
1. Utilisez **Option A** (All networks) pour le dev
2. Ou ajoutez une plage d'IPs
3. Ou utilisez un VPN avec IP fixe

## 📞 Besoin d'aide ?

Si vous rencontrez des difficultés :

1. **Vérifiez vos permissions** : Vous devez être Owner ou Contributor sur la ressource
2. **Contactez l'admin Azure** : Si vous n'avez pas accès aux paramètres réseau
3. **Alternative** : Créez une nouvelle ressource Azure OpenAI avec accès public dès le départ

---

**Temps estimé** : 5 minutes  
**Difficulté** : Facile  
**Prérequis** : Accès au portail Azure avec permissions appropriées
