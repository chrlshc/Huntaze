# Guide de Déploiement AWS - Tests Services Simplifiés Huntaze

Ce guide vous accompagne dans le déploiement d'une infrastructure AWS complète pour exécuter automatiquement les tests des services simplifiés de Huntaze.

## 🏗️ Architecture AWS

### Composants Déployés
- **AWS CodeBuild** : Exécution des tests avec Docker
- **Amazon S3** : Stockage des artefacts et rapports
- **AWS Secrets Manager** : Gestion sécurisée des clés Stripe
- **Amazon CloudWatch** : Monitoring et dashboards
- **Amazon SNS** : Notifications par email
- **AWS EventBridge** : Déclenchement automatique
- **AWS Lambda** : Fonctions de déclenchement personnalisées

### Flux de CI/CD
```
Code Push → CodeCommit → EventBridge → CodeBuild → Tests → S3 Artifacts → SNS Notifications
```

## 🚀 Déploiement Rapide

### Prérequis
```bash
# AWS CLI configuré
aws configure

# Outils requis
brew install jq  # macOS
# ou
sudo apt-get install jq  # Ubuntu

# Vérifier les permissions
aws sts get-caller-identity
```

### Déploiement en Une Commande
```bash
# Rendre le script exécutable
chmod +x scripts/deploy-aws-infrastructure.sh

# Déployer l'infrastructure
./scripts/deploy-aws-infrastructure.sh
```

Le script vous guidera interactivement pour :
- ✅ Configurer les paramètres
- ✅ Créer les secrets Stripe
- ✅ Déployer la stack CloudFormation
- ✅ Tester le déploiement

## 📋 Configuration Détaillée

### 1. Variables d'Environnement

#### Secrets Manager (Stripe)
```json
{
  "STRIPE_SECRET_KEY": "sk_test_...",
  "STRIPE_PRO_MONTHLY_PRICE_ID": "price_...",
  "STRIPE_PRO_YEARLY_PRICE_ID": "price_...",
  "STRIPE_ENTERPRISE_MONTHLY_PRICE_ID": "price_...",
  "STRIPE_ENTERPRISE_YEARLY_PRICE_ID": "price_..."
}
```

#### Variables CodeBuild
```yaml
NODE_ENV: test
NEXT_PUBLIC_URL: https://test.huntaze.com
DATABASE_URL: postgresql://postgres:postgres@127.0.0.1:5432/huntaze_test
```

### 2. Configuration buildspec.yml

Le fichier `buildspec.yml` orchestre l'exécution des tests :

```yaml
phases:
  install:    # Installation Node.js 20 + dépendances
  pre_build:  # Setup PostgreSQL + Stripe Mock + Secrets
  build:      # TypeScript check + Tests + Coverage
  post_build: # Cleanup + Artefacts
```

### 3. Services Docker

#### PostgreSQL Test Database
```yaml
postgres:15-alpine
- Port: 5432
- Database: huntaze_test
- User: postgres
- Password: postgres
```

#### Stripe Mock Server
```yaml
stripe/stripe-mock:0.108.0
- Port: 12111
- API compatible Stripe
```

## 🔧 Utilisation

### Démarrer un Build Manuellement
```bash
# Via AWS CLI
aws codebuild start-build --project-name huntaze-simple-services

# Via script npm
npm run aws:build

# Via Lambda trigger (si déployé)
aws lambda invoke --function-name huntaze-simple-services-build-trigger response.json
```

### Monitoring des Builds
```bash
# Lister les builds récents
aws codebuild list-builds-for-project --project-name huntaze-simple-services

# Détails d'un build
aws codebuild batch-get-builds --ids <BUILD_ID>

# Logs en temps réel
aws logs tail /aws/codebuild/huntaze-simple-services --follow
```

### Télécharger les Artefacts
```bash
# Lister les artefacts
aws s3 ls s3://huntaze-simple-services-test-artifacts-<ACCOUNT_ID>/

# Télécharger les rapports
aws s3 sync s3://huntaze-simple-services-test-artifacts-<ACCOUNT_ID>/artifacts/ ./local-artifacts/
```

## 📊 Rapports et Métriques

### Types de Rapports Générés
1. **JUnit XML** : Résultats des tests pour CodeBuild
2. **Coverage HTML** : Rapport de couverture détaillé
3. **Coverage JSON** : Données de couverture pour CI/CD
4. **Test Summary** : Résumé exécutif des tests

### Dashboard CloudWatch
Accès via : `AWS Console → CloudWatch → Dashboards → huntaze-simple-services-dashboard`

**Métriques Disponibles :**
- Nombre de builds (succès/échec)
- Durée des builds
- Tendances de couverture
- Logs d'erreur

### Notifications SNS
- ✅ Build réussi
- ❌ Build échoué
- ⏹️ Build arrêté
- 📧 Email automatique avec détails

## 🔒 Sécurité et Permissions

### Rôle IAM CodeBuild
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "s3:GetObject", "s3:PutObject",
        "logs:CreateLogGroup", "logs:PutLogEvents",
        "codebuild:CreateReport", "codebuild:BatchPutTestCases"
      ],
      "Resource": ["arn:aws:secretsmanager:*:*:secret:huntaze/*"]
    }
  ]
}
```

### Bonnes Pratiques Sécurité
- ✅ Secrets dans AWS Secrets Manager (pas en variables)
- ✅ Bucket S3 privé avec chiffrement
- ✅ Rôles IAM avec permissions minimales
- ✅ Logs CloudWatch avec rétention limitée
- ✅ Accès réseau restreint (VPC si nécessaire)

## 🐛 Dépannage

### Problèmes Courants

#### Build Échoue - Docker
```bash
# Vérifier PrivilegedMode activé
aws codebuild batch-get-projects --names huntaze-simple-services \
  --query 'projects[0].environment.privilegedMode'

# Doit retourner: true
```

#### Secrets Non Trouvés
```bash
# Vérifier le secret existe
aws secretsmanager describe-secret --secret-id huntaze/stripe-secrets

# Tester l'accès
aws secretsmanager get-secret-value --secret-id huntaze/stripe-secrets
```

#### Tests Timeout
```bash
# Augmenter le timeout CodeBuild (défaut: 30min)
aws codebuild update-project \
  --name huntaze-simple-services \
  --timeout-in-minutes 60
```

#### Artefacts Non Sauvegardés
```bash
# Vérifier les permissions S3
aws s3api get-bucket-policy --bucket huntaze-simple-services-test-artifacts-<ACCOUNT_ID>

# Tester l'écriture
aws s3 cp test-file.txt s3://huntaze-simple-services-test-artifacts-<ACCOUNT_ID>/test/
```

### Logs de Debug

#### Activer les Logs Détaillés
```yaml
# Dans buildspec.yml
env:
  variables:
    DEBUG: "simple-services:*"
    VITEST_LOG_LEVEL: "verbose"
```

#### Accéder aux Logs
```bash
# Logs CodeBuild
aws logs get-log-events \
  --log-group-name /aws/codebuild/huntaze-simple-services \
  --log-stream-name <LOG_STREAM_NAME>

# Logs en temps réel
aws logs tail /aws/codebuild/huntaze-simple-services --follow
```

## 🔄 Maintenance

### Mise à Jour de l'Infrastructure
```bash
# Redéployer avec nouvelles modifications
./scripts/deploy-aws-infrastructure.sh

# Ou via CloudFormation directement
aws cloudformation update-stack \
  --stack-name huntaze-simple-services-ci \
  --template-body file://cloudformation/codebuild-simple-services.yml
```

### Nettoyage des Artefacts
```bash
# Nettoyer les anciens artefacts (>30 jours automatique)
aws s3 rm s3://huntaze-simple-services-test-artifacts-<ACCOUNT_ID>/ --recursive

# Nettoyer les logs anciens
aws logs delete-log-group --log-group-name /aws/codebuild/huntaze-simple-services
```

### Rotation des Secrets
```bash
# Mettre à jour les clés Stripe
aws secretsmanager update-secret \
  --secret-id huntaze/stripe-secrets \
  --secret-string '{"STRIPE_SECRET_KEY":"sk_test_new_key"}'
```

## 💰 Coûts Estimés

### Coût Mensuel Approximatif (région us-east-1)
- **CodeBuild** : ~$5-15/mois (selon fréquence)
- **S3 Storage** : ~$1-3/mois (artefacts)
- **CloudWatch** : ~$2-5/mois (logs + métriques)
- **Secrets Manager** : ~$0.40/mois (par secret)
- **SNS** : ~$0.50/mois (notifications)

**Total Estimé : $8-25/mois**

### Optimisation des Coûts
- ✅ Lifecycle S3 (suppression auto après 30j)
- ✅ Logs CloudWatch (rétention 14j)
- ✅ Build cache activé
- ✅ Compute type optimisé (MEDIUM)

## 🚀 Évolutions Futures

### Améliorations Recommandées
1. **Multi-Region** : Déploiement dans plusieurs régions
2. **Blue/Green** : Déploiement sans interruption
3. **Auto-Scaling** : Builds parallèles selon la charge
4. **Integration Tests** : Tests E2E avec environnements éphémères
5. **Security Scanning** : Analyse de sécurité automatique

### Intégrations Possibles
- **GitHub Actions** : Trigger depuis GitHub
- **Slack** : Notifications dans Slack
- **Jira** : Création automatique de tickets
- **DataDog** : Métriques avancées
- **SonarQube** : Analyse de qualité de code

## 📞 Support

### Ressources Utiles
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Vitest Documentation](https://vitest.dev/)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

### Contact
- **Email** : dev@huntaze.com
- **Slack** : #huntaze-dev
- **Documentation** : [Internal Wiki](https://wiki.huntaze.com)

---

**🎉 Votre infrastructure AWS est maintenant prête pour des tests automatisés de qualité industrielle !**