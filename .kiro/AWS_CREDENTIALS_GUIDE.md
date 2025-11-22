# Guide de Gestion des Credentials AWS pour les Tests

## Problème

Les tests S3 nécessitent des credentials AWS valides. Les tokens temporaires (session tokens) expirent après ~1 heure, causant des échecs de tests.

## Solutions

### Option 1 : Credentials Temporaires (Développement Local)

#### Obtenir de Nouveaux Tokens
```bash
# Via AWS CLI
aws sts get-session-token --duration-seconds 3600

# Ou via AWS Console
# IAM → Users → Security Credentials → Create access key
```

#### Mettre à Jour .env.test
```bash
# Éditer .env.test
AWS_ACCESS_KEY_ID=REDACTED...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=REDACTED...
```

#### Lancer les Tests
```bash
npm run test:integration
```

**Avantages** :
- Sécurisé (tokens expirent automatiquement)
- Pas de credentials permanents sur la machine

**Inconvénients** :
- Doit être renouvelé régulièrement
- Peut expirer pendant les tests longs

### Option 2 : Credentials Permanents (CI/CD)

#### Créer un Utilisateur IAM pour Tests
```bash
# Via AWS CLI
aws iam create-user --user-name huntaze-test-user

# Attacher la politique S3
aws iam attach-user-policy \
  --user-name huntaze-test-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Créer les access keys
aws iam create-access-key --user-name huntaze-test-user
```

#### Configurer dans .env.test
```bash
# PAS de AWS_SESSION_TOKEN pour credentials permanents
AWS_ACCESS_KEY_ID=REDACTED...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=huntaze-beta-assets
```

**Avantages** :
- N'expire jamais
- Parfait pour CI/CD
- Pas besoin de renouvellement

**Inconvénients** :
- Doit être sécurisé (secrets, .gitignore)
- Risque si compromis

### Option 3 : Exécution Séparée (Recommandé)

#### Tests API Seulement (Pas de AWS requis)
```bash
npm run test:integration -- --exclude tests/integration/services/**
```

#### Tests S3 Seulement (Avec credentials frais)
```bash
# 1. Obtenir de nouveaux tokens
aws sts get-session-token

# 2. Mettre à jour .env.test

# 3. Lancer uniquement les tests S3
npm run test:integration -- tests/integration/services/**
```

**Avantages** :
- Tests API rapides sans dépendances AWS
- Tests S3 avec credentials frais garantis
- Meilleur contrôle

**Inconvénients** :
- Deux commandes à exécuter

## Configuration CI/CD

### GitHub Actions

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run API tests
        run: npm run test:integration -- --exclude tests/integration/services/**
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Run S3 tests
        run: npm run test:integration -- tests/integration/services/**
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
          AWS_S3_BUCKET: huntaze-beta-assets
```

### Secrets à Configurer

Dans GitHub → Settings → Secrets and variables → Actions :

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
AWS_ACCESS_KEY_ID=REDACTED...
AWS_SECRET_ACCESS_KEY=...
```

## Scripts Utiles

### Script de Renouvellement Automatique

Créer `scripts/refresh-aws-tokens.sh` :

```bash
#!/bin/bash

echo "🔄 Refreshing AWS tokens..."

# Obtenir de nouveaux tokens
TOKENS=$(aws sts get-session-token --duration-seconds 3600 --output json)

# Extraire les valeurs
ACCESS_KEY=$(echo $TOKENS | jq -r '.Credentials.AccessKeyId')
SECRET_KEY=$(echo $TOKENS | jq -r '.Credentials.SecretAccessKey')
SESSION_TOKEN=$(echo $TOKENS | jq -r '.Credentials.SessionToken')

# Mettre à jour .env.test
sed -i '' "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$ACCESS_KEY/" .env.test
sed -i '' "s/AWS_SECRET_ACCESS_KEY=.*/AWS_SECRET_ACCESS_KEY=$SECRET_KEY/" .env.test
sed -i '' "s/AWS_SESSION_TOKEN=.*/AWS_SESSION_TOKEN=$SESSION_TOKEN/" .env.test

echo "✅ Tokens refreshed successfully!"
echo "⏰ Valid for 1 hour"
```

Utilisation :
```bash
chmod +x scripts/refresh-aws-tokens.sh
./scripts/refresh-aws-tokens.sh
npm run test:integration
```

### Script de Test Complet

Créer `scripts/test-with-fresh-tokens.sh` :

```bash
#!/bin/bash

echo "🧪 Running integration tests with fresh AWS tokens..."

# Refresh tokens
./scripts/refresh-aws-tokens.sh

# Run tests
npm run test:integration

echo "✅ Tests completed!"
```

## Dépannage

### Erreur : "The provided token has expired"

**Cause** : Les tokens AWS ont expiré.

**Solution** :
```bash
# Obtenir de nouveaux tokens
aws sts get-session-token

# Mettre à jour .env.test
# Relancer les tests
```

### Erreur : "Access Denied"

**Cause** : L'utilisateur IAM n'a pas les permissions S3.

**Solution** :
```bash
# Vérifier les permissions
aws iam list-attached-user-policies --user-name huntaze-test-user

# Attacher la politique S3 si nécessaire
aws iam attach-user-policy \
  --user-name huntaze-test-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Erreur : "Bucket does not exist"

**Cause** : Le bucket S3 n'existe pas ou le nom est incorrect.

**Solution** :
```bash
# Vérifier le bucket
aws s3 ls s3://huntaze-beta-assets

# Créer le bucket si nécessaire
aws s3 mb s3://huntaze-beta-assets --region us-east-1
```

## Bonnes Pratiques

### Sécurité
1. ✅ Ne jamais commiter les credentials dans Git
2. ✅ Ajouter `.env.test` au `.gitignore`
3. ✅ Utiliser des secrets pour CI/CD
4. ✅ Renouveler régulièrement les credentials permanents
5. ✅ Limiter les permissions IAM au strict nécessaire

### Performance
1. ✅ Exécuter les tests S3 séparément si possible
2. ✅ Utiliser des mocks pour les tests unitaires
3. ✅ Réserver les vrais tests S3 pour l'intégration critique

### Maintenance
1. ✅ Documenter la procédure de renouvellement
2. ✅ Automatiser avec des scripts
3. ✅ Monitorer l'expiration des tokens
4. ✅ Avoir un plan de backup si AWS est indisponible

## Résumé

| Méthode | Durée de Vie | Sécurité | Complexité | Recommandé Pour |
|---------|--------------|----------|------------|-----------------|
| Tokens Temporaires | 1 heure | ⭐⭐⭐ | Moyenne | Développement local |
| Credentials Permanents | Illimité | ⭐⭐ | Faible | CI/CD |
| Exécution Séparée | Variable | ⭐⭐⭐ | Faible | Tous |

**Recommandation** : Utiliser l'exécution séparée en développement et des credentials permanents en CI/CD.
