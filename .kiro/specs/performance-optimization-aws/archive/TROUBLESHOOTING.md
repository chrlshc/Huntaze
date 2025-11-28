# 🔧 Dépannage - Performance Optimization AWS

## ⚠️ Problème : L'application ne fonctionne pas après l'implémentation AWS

### Symptômes
- Pages qui ne chargent pas (home, analytics, content, etc.)
- Erreurs liées à AWS dans la console
- Messages d'erreur sur les buckets S3 ou CloudWatch

### Cause
Les fonctionnalités AWS sont **optionnelles** mais le code essaie de les utiliser même si AWS n'est pas configuré.

---

## ✅ Solution Rapide (Application fonctionne SANS AWS)

### 1. Vérifier que les wrappers sûrs sont en place

Les fichiers suivants ont été créés pour permettre à l'app de fonctionner sans AWS :

```
✅ lib/aws/config.ts - Configuration et feature flags
✅ lib/aws/safe-wrapper.ts - Wrappers no-op pour AWS
✅ lib/aws/index.ts - Exports sûrs (mis à jour)
```

### 2. Redémarrer l'application

```bash
# Arrêter le serveur de développement
# Ctrl+C

# Nettoyer le cache Next.js
rm -rf .next

# Redémarrer
npm run dev
```

### 3. Vérifier les logs

L'application devrait afficher ce message au démarrage :

```
[AWS] AWS services not configured. Application will run with reduced functionality.
```

C'est **normal** et **attendu** si vous n'avez pas configuré AWS.

---

## 🔍 Diagnostic

### Vérifier si AWS est configuré

```bash
# Vérifier les variables d'environnement
cat .env.local | grep AWS

# Devrait être vide ou commenté si AWS n'est pas configuré
```

### Tester l'application

```bash
# Démarrer en mode développement
npm run dev

# Ouvrir http://localhost:3000
# L'application devrait fonctionner normalement
```

---

## 📋 Fonctionnalités avec/sans AWS

### ✅ Fonctionne SANS AWS (Mode Dégradé)
- ✅ Toutes les pages de l'application
- ✅ Authentification
- ✅ Dashboard
- ✅ Content, Analytics, Messages
- ✅ Intégrations
- ✅ Billing
- ✅ Toutes les fonctionnalités de base

### ⚠️ Désactivé SANS AWS
- ⚠️ CloudWatch metrics (pas de métriques envoyées)
- ⚠️ S3 asset storage (images non optimisées)
- ⚠️ Performance monitoring avancé
- ⚠️ Lambda@Edge features

**Important** : L'application fonctionne parfaitement sans ces fonctionnalités !

---

## 🚀 Activer AWS (Optionnel)

Si vous voulez activer les fonctionnalités AWS :

### 1. Configurer les credentials AWS

Éditez `.env.local` :

```bash
# AWS Services (OPTIONAL)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_S3_BUCKET=your-bucket-name
CDN_URL=https://your-cdn-url.com
```

### 2. Créer les ressources AWS

```bash
# Exécuter le script de setup
npm run aws:setup

# Vérifier la configuration
npm run aws:verify
```

### 3. Redémarrer l'application

```bash
rm -rf .next
npm run dev
```

---

## 🐛 Erreurs Courantes

### Erreur : "AWS Access Key Id you provided does not exist"

**Cause** : AWS credentials non configurés ou invalides

**Solution** : 
1. Vérifier que `.env.local` n'a PAS de variables AWS (ou qu'elles sont commentées)
2. Redémarrer l'application
3. L'app devrait fonctionner en mode dégradé

### Erreur : "The security token included in the request is invalid"

**Cause** : Token AWS expiré ou invalide

**Solution** :
1. Commenter toutes les variables AWS dans `.env.local`
2. Redémarrer l'application
3. L'app fonctionnera sans AWS

### Erreur : Pages blanches ou erreurs 500

**Cause** : Code qui essaie d'utiliser AWS sans vérifier la configuration

**Solution** :
1. Vérifier que `lib/aws/safe-wrapper.ts` existe
2. Vérifier que `lib/aws/index.ts` utilise les wrappers sûrs
3. Nettoyer et redémarrer :
```bash
rm -rf .next
npm run dev
```

---

## 📝 Checklist de Dépannage

- [ ] Arrêter le serveur de développement
- [ ] Vérifier que `.env.local` n'a pas de variables AWS (ou qu'elles sont commentées)
- [ ] Supprimer le dossier `.next` : `rm -rf .next`
- [ ] Redémarrer : `npm run dev`
- [ ] Vérifier les logs : devrait afficher "[AWS] AWS services not configured"
- [ ] Tester l'application : toutes les pages devraient fonctionner
- [ ] Si ça ne fonctionne toujours pas, vérifier les erreurs dans la console

---

## 🆘 Besoin d'Aide ?

### Logs à vérifier

```bash
# Logs du serveur de développement
npm run dev

# Chercher ces messages :
# ✅ "[AWS] AWS services not configured" - Normal, OK
# ❌ "AWS Access Key" errors - Problème de configuration
# ❌ "CloudWatch" errors - Problème d'initialisation
```

### Fichiers à vérifier

```bash
# Vérifier que les wrappers existent
ls -la lib/aws/config.ts
ls -la lib/aws/safe-wrapper.ts

# Vérifier le contenu de index.ts
cat lib/aws/index.ts | grep "safeCloudWatch"
```

### Commandes de diagnostic

```bash
# Nettoyer complètement
rm -rf .next
rm -rf node_modules/.cache

# Réinstaller si nécessaire
npm install

# Redémarrer
npm run dev
```

---

## ✅ Validation

L'application fonctionne correctement si :

1. ✅ Le serveur démarre sans erreurs AWS
2. ✅ Vous voyez le message "[AWS] AWS services not configured"
3. ✅ Toutes les pages se chargent (home, analytics, content, etc.)
4. ✅ Pas d'erreurs dans la console du navigateur
5. ✅ L'authentification fonctionne
6. ✅ Le dashboard s'affiche correctement

---

## 📚 Documentation

- [AWS Setup Guide](./AWS-SETUP-GUIDE.md) - Pour configurer AWS (optionnel)
- [README](./README.md) - Documentation principale
- [COMMENCEZ-ICI](./COMMENCEZ-ICI.md) - Guide de démarrage

---

**Date** : 26 Novembre 2025  
**Statut** : Application fonctionne SANS AWS par défaut  
**AWS** : Optionnel, peut être activé plus tard
