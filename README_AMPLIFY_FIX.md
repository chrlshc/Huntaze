# 🎯 Huntaze - Amplify Fix & Environment Setup

## 🚨 Problème Résolu

**Erreur dans le build:**
```
⚠ Attempted import error: 'prisma' is not exported from '@/lib/db-client'
```

**✅ Solution appliquée:** Export `prisma` ajouté dans `lib/db-client.ts`

---

## 🚀 Configuration Rapide (3 Options)

### Option 1: Script Bash Rapide ⭐ **RECOMMANDÉ**

```bash
./QUICK_FIX_COMMANDS.sh
```

**Ce que ça fait:**
- ✅ Génère NEXTAUTH_SECRET et CSRF_SECRET automatiquement
- ✅ Affiche toutes les variables à copier-coller
- ✅ Guide étape par étape

**Temps:** 2 minutes

---

### Option 2: Script Python Interactif

```bash
python3 scripts/convert-env-to-amplify.py
```

**Ce que ça fait:**
- ✅ Mode interactif pour entrer chaque variable
- ✅ Génère automatiquement les secrets
- ✅ Crée un fichier JSON prêt à l'emploi
- ✅ Peut pousser directement vers Amplify

**Temps:** 5-10 minutes

---

### Option 3: Script Bash Complet

```bash
./scripts/setup-amplify-env.sh
```

**Ce que ça fait:**
- ✅ Configuration complète interactive
- ✅ Génération automatique des secrets
- ✅ Push direct vers AWS Amplify via CLI
- ✅ Validation des credentials AWS

**Temps:** 10-15 minutes

---

## 📚 Documentation Disponible

| Fichier | Description | Utilisation |
|---------|-------------|-------------|
| **RÉSOLUTION_COMPLÈTE.md** | Vue d'ensemble complète | 📖 Lire en premier |
| **AMPLIFY_ENV_CHECKLIST.md** | Liste rapide des variables | ✅ Référence rapide |
| **AMPLIFY_ENV_VARS_SETUP.md** | Guide détaillé complet | 📚 Documentation complète |
| **FIX_SUMMARY.md** | Résumé des changements | 🔍 Comprendre les fixes |
| **QUICK_FIX_COMMANDS.sh** | Script génération rapide | ⚡ Démarrage rapide |
| **scripts/setup-amplify-env.sh** | Script bash complet | 🔧 Configuration complète |
| **scripts/convert-env-to-amplify.py** | Script Python interactif | 🐍 Alternative Python |
| **.env.amplify.template.json** | Template JSON | 📋 Format structuré |

---

## 🎯 Démarrage Rapide (30 secondes)

```bash
# 1. Générer les secrets
./QUICK_FIX_COMMANDS.sh

# 2. Copier les variables affichées dans Amplify Console
# https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce

# 3. Redéployer
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-type RELEASE
```

---

## 🔑 Variables Critiques à Configurer

### 1. Secrets (Auto-générés)
```bash
NEXTAUTH_SECRET=<généré-automatiquement>
CSRF_SECRET=<généré-automatiquement>
```

### 2. Database (À remplacer!)
```bash
DATABASE_URL=postgresql://USERNAME:PASSWORD@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require
```
⚠️ **Remplacez USERNAME et PASSWORD**

### 3. AWS Credentials (À remplacer!)
```bash
AWS_ACCESS_KEY_ID=<votre-clé>
AWS_SECRET_ACCESS_KEY=<votre-secret>
```

### 4. AI (À remplacer!)
```bash
GEMINI_API_KEY=<votre-clé-gemini>
```

### 5. Email/SES (À remplacer!)
```bash
EMAIL_SERVER_USER=<votre-username-ses>
EMAIL_SERVER_PASSWORD=<votre-password-ses>
```

---

## ✅ Checklist de Vérification

Après configuration:

- [ ] ✅ Fix appliqué dans `lib/db-client.ts`
- [ ] 🔑 Secrets générés (NEXTAUTH_SECRET, CSRF_SECRET)
- [ ] 🗄️ DATABASE_URL configuré avec vraies credentials
- [ ] ☁️ AWS credentials configurés
- [ ] 🤖 GEMINI_API_KEY configuré
- [ ] 📧 SES credentials configurés
- [ ] 🔄 Variables ajoutées dans Amplify Console
- [ ] 🚀 Nouveau déploiement lancé
- [ ] ✅ Build réussi sans erreurs d'import
- [ ] 🌐 App accessible sur: https://production-ready.d33l77zi1h78ce.amplifyapp.com

---

## 🐛 Troubleshooting

### Build montre toujours l'erreur d'import?
→ Redéployez pour appliquer le fix

### Database timeout pendant le build?
→ **Normal!** La DB est désactivée pendant le build

### Redis timeout pendant le build?
→ **Normal!** Redis est désactivé pendant le build

### Comment vérifier mes variables?
```bash
aws amplify get-branch \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --query 'branch.environmentVariables'
```

---

## 📞 Commandes Utiles

### Déclencher un nouveau build
```bash
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-type RELEASE
```

### Voir les logs du dernier build
```bash
aws amplify get-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-id <job-id>
```

### Lister tous les builds
```bash
aws amplify list-jobs \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --max-results 10
```

---

## 🎉 Résumé

**Problèmes identifiés:**
1. ❌ Import error: `prisma` not exported → ✅ **RÉSOLU**
2. ⚠️ Variables d'environnement manquantes → 📋 **GUIDES CRÉÉS**

**Fichiers créés:**
- ✅ 8 fichiers de documentation
- ✅ 3 scripts automatiques
- ✅ 1 template JSON

**Temps total estimé:** 10-15 minutes

**Prochaine étape:** Exécutez `./QUICK_FIX_COMMANDS.sh` et suivez les instructions!

---

## 🌐 Liens Utiles

- **Amplify Console:** https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce
- **App URL:** https://production-ready.d33l77zi1h78ce.amplifyapp.com
- **AWS CLI Docs:** https://docs.aws.amazon.com/cli/latest/reference/amplify/

---

**Besoin d'aide?** Consultez `RÉSOLUTION_COMPLÈTE.md` pour plus de détails!
