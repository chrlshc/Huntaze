# 🚀 Scripts de Déploiement - Tâche 9

## Vue d'ensemble

Ce dossier contient tous les scripts nécessaires pour le **déploiement et la validation des corrections d'hydratation** (Tâche 9). Ces scripts automatisent le processus complet de déploiement en staging et validation en production.

## 📋 Scripts Disponibles

### 1. 🔍 Validation des Prérequis
```bash
node scripts/validate-deployment-prerequisites.js
```
**Fonction** : Valide que tous les prérequis sont en place avant le déploiement
- Variables d'environnement
- Dépendances npm
- Composants d'hydratation
- Tests
- Configuration

### 2. 🚀 Déploiement Staging
```bash
node scripts/deploy-hydration-staging.js
```
**Fonction** : Déploie automatiquement les corrections d'hydratation en staging
- Validation de l'environnement
- Exécution des tests d'hydratation
- Build de l'application
- Déploiement vers staging
- Validation post-déploiement
- Tests des flux critiques

### 3. ✅ Validation Production
```bash
node scripts/validate-hydration-production.js
```
**Fonction** : Valide le bon fonctionnement en production
- Vérification de l'accessibilité
- Monitoring des erreurs d'hydratation
- Évaluation de l'expérience utilisateur
- Mesure de l'impact sur les performances
- Tests de régression

### 4. 📊 Monitoring Continu
```bash
# Démarrer le monitoring (intervalle par défaut: 60s)
node scripts/monitor-hydration-production.js start

# Monitoring avec intervalle personnalisé (30s)
node scripts/monitor-hydration-production.js start 30

# Générer un rapport de monitoring
node scripts/monitor-hydration-production.js summary
```
**Fonction** : Surveillance en temps réel des métriques d'hydratation
- Collecte automatique des métriques
- Système d'alertes configurables
- Interface de monitoring visuelle
- Génération de rapports

### 5. 🎯 Orchestration Complète
```bash
node scripts/deploy-hydration-complete.js
```
**Fonction** : Orchestre le déploiement complet (staging + validation production)
- Déploiement staging automatique
- Validation production automatique
- Rapport final consolidé
- Recommandations d'actions

### 6. 🧪 Tests des Scripts
```bash
node scripts/test-deployment-scripts.js
```
**Fonction** : Teste le bon fonctionnement de tous les scripts
- Validation de la syntaxe
- Test des imports/exports
- Vérification des permissions
- Rapport de test complet

## 🔧 Configuration Requise

### Variables d'Environnement

#### Obligatoires
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
export NEXTAUTH_SECRET="your-secret-key"
export NEXTAUTH_URL="https://your-domain.com"
```

#### Optionnelles
```bash
export PRODUCTION_URL="https://huntaze.com"
export STAGING_URL="https://staging.huntaze.com"
export AWS_AMPLIFY_APP_ID="your-amplify-app-id"
export NODE_ENV="production"
```

### Prérequis Système
- Node.js 18+
- npm ou yarn
- Accès aux environnements staging/production
- Permissions d'écriture dans le dossier `logs/`

## 📊 Workflow Recommandé

### Déploiement Standard
```bash
# 1. Valider les prérequis
node scripts/validate-deployment-prerequisites.js

# 2. Déploiement complet automatisé
node scripts/deploy-hydration-complete.js

# 3. Démarrer le monitoring continu
node scripts/monitor-hydration-production.js start
```

### Déploiement Étape par Étape
```bash
# 1. Validation des prérequis
node scripts/validate-deployment-prerequisites.js

# 2. Déploiement staging uniquement
node scripts/deploy-hydration-staging.js

# 3. Validation production uniquement (après vérification staging)
node scripts/validate-hydration-production.js

# 4. Monitoring continu
node scripts/monitor-hydration-production.js start
```

### Développement et Tests
```bash
# Tester tous les scripts avant utilisation
node scripts/test-deployment-scripts.js

# Générer un rapport de monitoring
node scripts/monitor-hydration-production.js summary
```

## 📁 Structure des Logs

Tous les scripts génèrent des logs dans le dossier `logs/` :

```
logs/
├── prerequisites-validation-{id}.log        # Validation prérequis
├── staging-deployment-{id}.log              # Déploiement staging
├── production-validation-{id}.log           # Validation production
├── hydration-monitoring-{id}.log            # Monitoring continu
├── deployment-orchestration-{id}.log        # Orchestration complète
├── deployment-scripts-test-{id}.log         # Tests des scripts
├── final-deployment-report-{id}.json        # Rapport final
├── hydration-metrics-live.json              # Métriques temps réel
└── hydration-alerts.json                    # Historique des alertes
```

## 🚨 Système d'Alertes

### Seuils Configurés

| Métrique | Seuil d'Alerte | Sévérité |
|----------|----------------|----------|
| Erreurs d'hydratation | > 5/min | 🔴 Haute |
| Temps de réponse | > 3000ms | 🟡 Moyenne |
| Taux d'erreur | > 5% | 🔴 Haute |
| Score UX | < 70/100 | 🟡 Moyenne |

### Types d'Alertes

#### 🔴 Haute Sévérité
- Erreurs d'hydratation critiques
- Taux d'erreur élevé
- Application inaccessible

#### 🟡 Sévérité Moyenne
- Performance dégradée
- Score UX faible
- Temps de réponse élevé

## 📊 Métriques Surveillées

### Pages Critiques
- **Page d'accueil** (`/`)
- **Connexion** (`/auth/login`)
- **Inscription** (`/auth/register`)
- **Dashboard** (`/dashboard`)
- **Onboarding** (`/onboarding/setup`)

### Métriques de Performance
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **Charge serveur**
- **Temps de réponse**

## 🔄 Gestion des Erreurs

### Actions Automatiques
- **Retry automatique** pour les erreurs transitoires
- **Logging détaillé** de toutes les opérations
- **Génération d'alertes** en temps réel
- **Sauvegarde des rapports** d'erreur

### Actions Manuelles
- **Rollback** en cas de problème critique
- **Investigation** des erreurs persistantes
- **Ajustement des seuils** d'alerte
- **Optimisation** des composants problématiques

## 🛠️ Dépannage

### Problèmes Courants

#### Script ne démarre pas
```bash
# Vérifier les permissions
ls -la scripts/

# Vérifier la syntaxe
node --check scripts/script-name.js

# Tester les dépendances
node scripts/test-deployment-scripts.js
```

#### Variables d'environnement manquantes
```bash
# Vérifier les variables
env | grep -E "(DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL)"

# Charger depuis un fichier .env
source .env
```

#### Erreurs de déploiement
```bash
# Consulter les logs détaillés
tail -f logs/staging-deployment-*.log

# Vérifier l'état des services
curl -f https://staging.huntaze.com/api/health/overall
```

#### Problèmes de monitoring
```bash
# Vérifier les métriques
cat logs/hydration-metrics-live.json

# Consulter les alertes
cat logs/hydration-alerts.json
```

## 📞 Support

### Contacts
- **Équipe DevOps** : devops@huntaze.com
- **Équipe Frontend** : frontend@huntaze.com
- **Monitoring** : monitoring@huntaze.com

### Ressources
- [Guide de Déploiement Complet](../docs/HYDRATION_DEPLOYMENT_GUIDE.md)
- [Guide de Débogage](../docs/HYDRATION_TROUBLESHOOTING_GUIDE.md)
- [Bonnes Pratiques](../docs/HYDRATION_BEST_PRACTICES_GUIDE.md)

## 🔐 Sécurité

### Bonnes Pratiques
- **Ne jamais commiter** les variables d'environnement sensibles
- **Utiliser des secrets** pour les clés d'API
- **Limiter les permissions** des scripts
- **Auditer régulièrement** les logs d'accès

### Variables Sensibles
- `DATABASE_URL` - URL de connexion à la base de données
- `NEXTAUTH_SECRET` - Clé secrète pour l'authentification
- Clés d'API des services externes

## 📈 Optimisation

### Performance
- **Monitoring continu** des métriques
- **Optimisation proactive** des composants lents
- **Ajustement des ressources** selon la charge
- **Cache intelligent** des données fréquentes

### Maintenance
- **Révision hebdomadaire** des métriques
- **Nettoyage mensuel** des logs anciens
- **Mise à jour trimestrielle** des seuils d'alerte
- **Formation continue** de l'équipe

---

## 🎯 Résumé des Commandes

```bash
# Workflow complet recommandé
node scripts/validate-deployment-prerequisites.js  # Validation
node scripts/deploy-hydration-complete.js          # Déploiement
node scripts/monitor-hydration-production.js start # Monitoring

# Commandes individuelles
node scripts/deploy-hydration-staging.js           # Staging seulement
node scripts/validate-hydration-production.js      # Production seulement
node scripts/test-deployment-scripts.js            # Tests des scripts

# Monitoring et rapports
node scripts/monitor-hydration-production.js start 30  # Monitoring 30s
node scripts/monitor-hydration-production.js summary   # Rapport
```

---

*Dernière mise à jour : 4 novembre 2024*  
*Version : 1.0.0*  
*Statut : ✅ Prêt pour production*