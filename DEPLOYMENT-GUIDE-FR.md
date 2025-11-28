# 🚀 Guide de Déploiement

Guide complet pour déployer l'application Huntaze sur AWS Amplify.

## Statut Actuel

✅ **Prêt à déployer**  
✅ Tous les tests passent (164/164)  
✅ Build vérifié localement  
✅ Documentation complète

## Déploiement Rapide

### Méthode Simple (Recommandée)

```bash
# Pousser vers la branche de production
git push huntaze production-ready
```

Le déploiement se lance automatiquement via AWS Amplify.

**Temps estimé**: 5-10 minutes

### Surveiller le Déploiement

1. Ouvrir la console AWS Amplify:
   https://console.aws.amazon.com/amplify/

2. Sélectionner l'application Huntaze

3. Surveiller le build dans "Build history"

4. Attendre le statut "Deployed" ✅

## Déploiement par Étapes

### Étape 1: Déployer sur Staging

```bash
# Déployer sur staging
npm run deploy:staging

# Vérifier le déploiement
npm run deploy:verify:staging
```

**Tests manuels sur staging**:
- Ouvrir https://staging.huntaze.com
- Tester la connexion utilisateur
- Vérifier le dashboard
- Tester les fonctionnalités principales

### Étape 2: Déployer en Production

```bash
# Déployer en production
npm run deploy:production

# Vérifier le déploiement
npm run deploy:verify:production
```

**Surveillance post-déploiement**:
```bash
# Surveiller les performances pendant 2 heures
npm run perf:monitor
```

## Prérequis

### Variables d'Environnement AWS Amplify

Vérifier que ces variables sont configurées dans la console Amplify:

```bash
# Base de données
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentification
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Email (SES)
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com

# Environnement
NODE_ENV=production
```

### Vérifications Locales

```bash
# Tests unitaires
npm run test:unit:optimized

# Build de production
npm run build

# Vérifier le statut Git
git status
```

## Workflow Interactif

Pour un déploiement guidé étape par étape:

```bash
npm run deploy:workflow
```

Ce script interactif vous guide à travers:
1. Vérification de l'environnement
2. Exécution des tests
3. Création du build
4. Déploiement sur staging
5. Vérification staging
6. Déploiement en production
7. Vérification production

## Résultats Attendus

Après le déploiement, vous devriez observer:

| Métrique | Amélioration |
|----------|--------------|
| Temps de chargement | **-60-70%** |
| Requêtes database | **-90%** |
| Requêtes N+1 | **-100%** |
| Cache hit rate | **>80%** |
| Erreurs 500 | **<0.1%** |

## Dépannage

### Build Échoue

**Vérifier localement**:
```bash
npm run build
```

**Consulter les logs**:
1. AWS Console → Amplify → Build history
2. Cliquer sur le build échoué
3. Examiner les logs d'erreur

**Causes communes**:
- Variables d'environnement manquantes
- Erreurs TypeScript
- Dépendances manquantes

### Tests Échouent

```bash
# Exécuter tous les tests
npm run test:unit:optimized

# Tests de performance
npm run test:performance

# Tests spécifiques
npm test -- path/to/test.ts
```

### Performance Dégradée

```bash
# Diagnostic de base
npm run diagnostic:baseline

# Vérifier AWS
npm run aws:verify

# Mesurer l'impact
npm run measure:impact
```

## Rollback

### Via Git

```bash
# Annuler le dernier commit
git revert HEAD

# Pousser le rollback
git push huntaze production-ready
```

### Via Console Amplify

1. Ouvrir https://console.aws.amazon.com/amplify/
2. Aller dans "Build history"
3. Trouver la version précédente stable
4. Cliquer "Redeploy this version"

## Commandes Utiles

```bash
# Statut du déploiement
git status

# Pousser vers GitHub
git push huntaze production-ready

# Workflow complet
npm run deploy:workflow

# Déploiement staging
npm run deploy:staging

# Vérification staging
npm run deploy:verify:staging

# Déploiement production
npm run deploy:production

# Vérification production
npm run deploy:verify:production

# Surveillance continue
npm run perf:monitor
```

## Checklist de Déploiement

### Avant le Déploiement

- [ ] Tous les tests passent localement
- [ ] Build réussit localement
- [ ] Code commité sur Git
- [ ] Variables d'environnement configurées dans Amplify
- [ ] Documentation à jour

### Pendant le Déploiement

- [ ] Build Amplify démarre
- [ ] Build se termine sans erreur
- [ ] Application déployée avec succès
- [ ] Health check passe

### Après le Déploiement

- [ ] Application accessible
- [ ] Connexion utilisateur fonctionne
- [ ] Dashboard se charge correctement
- [ ] Pas d'erreurs dans les logs
- [ ] Performances conformes aux attentes

## Support

### Documentation Complémentaire

- [Statut de Déploiement](DEPLOYMENT-STATUS.md)
- [Guide AWS](docs/aws/README.md)
- [Variables d'Environnement](docs/ENVIRONMENT_VARIABLES.md)
- [Dépannage Build](docs/BUILD_TROUBLESHOOTING.md)

### Ressources AWS

- [Console Amplify](https://console.aws.amazon.com/amplify/)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/)
- [Documentation Amplify](https://docs.aws.amazon.com/amplify/)

### Specs Techniques

Pour plus de détails sur les optimisations:
- `.kiro/specs/dashboard-performance-real-fix/`
- `.kiro/specs/performance-optimization-aws/`

## Sécurité

### Bonnes Pratiques

- ✅ Ne jamais committer les secrets dans Git
- ✅ Utiliser les variables d'environnement Amplify
- ✅ Activer HTTPS en production
- ✅ Configurer les CORS correctement
- ✅ Surveiller les logs pour détecter les anomalies

### Rotation des Secrets

```bash
# Générer un nouveau secret NextAuth
openssl rand -base64 32

# Générer un nouveau secret CSRF
openssl rand -base64 32
```

Mettre à jour dans la console Amplify et redéployer.

## Monitoring Post-Déploiement

### Métriques à Surveiller

1. **Performance**
   - Temps de chargement des pages
   - Temps de réponse API
   - Cache hit rate

2. **Erreurs**
   - Taux d'erreur 500
   - Erreurs JavaScript
   - Échecs d'authentification

3. **Infrastructure**
   - Utilisation CPU/Mémoire
   - Connexions database
   - Latence réseau

### Outils de Monitoring

```bash
# Dashboard de performance
npm run perf:dashboard

# Logs en temps réel
aws logs tail /aws/amplify/huntaze-production --follow

# Métriques CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Amplify \
  --metric-name Requests \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

**Dernière mise à jour**: 27 novembre 2025  
**Version**: 1.0  
**Statut**: ✅ Prêt pour production
