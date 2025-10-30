# 🚀 Huntaze OnlyFans - Étapes de Déploiement Manuel

**Problème rencontré** : Le CDK a un cache qui force `us-west-1` au lieu de `us-east-1`.

**Solution** : Déploiement manuel avec nettoyage complet du cache.

---

## ⚡ Étapes à Suivre

### 1. Nettoyer le Cache CDK

```bash
cd infra/cdk
rm -rf cdk.out cdk.context.json
rm -rf bin/*.js lib/*.js
```

### 2. Configurer les Variables d'Environnement

```bash
export AWS_ACCESS_KEY_ID="ASIAUT7VVE47FUQZIENE"
export AWS_SECRET_ACCESS_KEY="1hHhce4ievDYYbD6gA7Ox7S3EPnt6fv4EN0J2OM4"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEAQaCXVzLWVhc3QtMSJGMEQCIFFzSIsRkAoUli5CT2u33QYFV9Pa5HhKgOed3JGiFeQOAiBlnTfFxkwyOki9CwwCDBfNd9c12/M2c4WQcK15CpqCvir3Agi9//////////8BEAAaDDMxNzgwNTg5NzUzNCIMNdDdDC/a68TfJZ9KKssCpp3RvsKLhyWyxYqAuiVjiC4NzBj+FxA8WX4gyaDwo4f9bUBIl2CJe2JQ0Xgc5HHjnUYErLPsEhYt80vup2TfS4T+IKpgrJPbvdpq7xZlNTONCg9SJX4ZU8HjffkR4jpkgYfUMoSrEl1of/f2TIBgYFN3xaSl06EQa8kS4LSNS1mKlX7Wv/eZAIA70GPbgXfRVqt2om7zMPQ/9hQTXZ4WtV25Ok8Qsbq1wMVMrLOT3dsT8/mXSS7/2JAfJVmdJodP0eNgJXaXpybw0GRVhjT06I8R4+uGLqhWWK3NWNDgctT/6arFs4BIH41EXbtACU6Mp0COJlsqKVd8xnV1jPAOTmBSc2Ka1OKp12XW26xKKW7L/+FFOYw20FwtT0mBTHVKRQJRP5GHEA32EXPUc2/LzfFfm6ejwlnrYGr4Efit8uo3lNntCqVVpn0bCDD03YLIBjqmAcJiZEcZpUzB+yPTLA3kU3odKtBHXtN/gQElE8QlWyMDo9GPKstRm6K+/ATiQSDzzYA325fEzqgAKHuSQxTJ3fj4nb6vIUZP0bubKMh5H9MREApldo2mp9j9j7+Rnva/neXgpJfnYiWFNDqXx0PIOUZ8UwKpiElJz6z+D6TT+qZ29G+xM3pZ6lmFwPWpvohewMLjB6BvR9qkULS74lT9b+ueg5ER/V8="

export CDK_DEFAULT_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=317805897534
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Rebuild le CDK

```bash
npm run build
```

### 4. Créer le fichier cdk.context.json avec us-east-1

```bash
cat > cdk.context.json << 'EOF'
{
  "availability-zones:account=317805897534:region=us-east-1": [
    "us-east-1a",
    "us-east-1b",
    "us-east-1c",
    "us-east-1d",
    "us-east-1e",
    "us-east-1f"
  ]
}
EOF
```

### 5. Déployer le Stack

```bash
npx cdk deploy HuntazeOnlyFansStack --require-approval never
```

---

## 🔍 Diagnostic du Problème

Le CDK essaie de déployer dans `us-west-1` au lieu de `us-east-1`. Cela vient probablement d'un cache CDK global ou d'un déploiement précédent.

**Messages d'erreur observés** :
```
HuntazeOnlyFansStack: fail: No bucket named 'cdk-hnb659fds-assets-317805897534-us-west-1'. 
Is account 317805897534 bootstrapped?
```

---

## 🛠️ Solution Alternative : Utiliser AWS CloudFormation Directement

Si le CDK continue à avoir des problèmes, tu peux générer le template CloudFormation et le déployer manuellement :

### 1. Générer le Template

```bash
cd infra/cdk
npx cdk synth HuntazeOnlyFansStack > template.yaml
```

### 2. Déployer avec CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name HuntazeOnlyFansStack \
  --template-body file://template.yaml \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 3. Surveiller le Déploiement

```bash
aws cloudformation describe-stacks \
  --stack-name HuntazeOnlyFansStack \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

---

## 📊 Vérification Post-Déploiement

Une fois le stack déployé, vérifie les ressources :

```bash
# Vérifier le stack
aws cloudformation describe-stacks \
  --stack-name HuntazeOnlyFansStack \
  --region us-east-1

# Vérifier l'ECS cluster
aws ecs describe-clusters \
  --clusters huntaze-of-fargate \
  --region us-east-1

# Vérifier les tables DynamoDB
aws dynamodb list-tables --region us-east-1 | grep Huntaze

# Récupérer les outputs
aws cloudformation describe-stacks \
  --stack-name HuntazeOnlyFansStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

---

## 🔧 Troubleshooting

### Problème : Credentials Expirés

Les credentials AWS temporaires (avec SESSION_TOKEN) expirent généralement après 1 heure.

**Solution** : Régénère les credentials :
```bash
# Si tu utilises AWS SSO
aws sso login --profile huntaze

# Puis récupère les nouvelles credentials
aws configure export-credentials --profile huntaze
```

### Problème : Bootstrap CDK Manquant

Si tu vois "Is account bootstrapped?", bootstrap le compte :

```bash
npx cdk bootstrap aws://317805897534/us-east-1
```

### Problème : Permissions IAM Insuffisantes

Vérifie que tu as les permissions nécessaires :

```bash
aws sts get-caller-identity
```

Tu devrais voir :
```json
{
    "UserId": "AROAUT7VVE47A7GJBONF4:huntaze",
    "Account": "317805897534",
    "Arn": "arn:aws:sts::317805897534:assumed-role/AWSReservedSSO_AdministratorAccess_..."
}
```

---

## 📝 Notes Importantes

1. **Credentials Temporaires** : Tes credentials incluent un `AWS_SESSION_TOKEN`, ce qui signifie qu'ils sont temporaires et expireront (généralement après 1h).

2. **Région** : Assure-toi que toutes les commandes utilisent `--region us-east-1`.

3. **Cache CDK** : Le problème `us-west-1` vient probablement d'un cache CDK. Le nettoyage complet devrait résoudre le problème.

4. **Bootstrap** : Le compte est déjà bootstrappé dans `us-east-1`, donc pas besoin de le refaire.

---

## ✅ Checklist

- [ ] Nettoyer le cache CDK
- [ ] Configurer les variables d'environnement
- [ ] Rebuild le CDK
- [ ] Créer cdk.context.json avec us-east-1
- [ ] Déployer le stack
- [ ] Vérifier les ressources créées
- [ ] Récupérer les outputs

---

## 🆘 Besoin d'Aide ?

Si tu rencontres toujours des problèmes, voici les informations de debug utiles :

```bash
# Version CDK
npx cdk --version

# Configuration AWS
aws configure list

# Région par défaut
aws configure get region

# Stacks existants
aws cloudformation list-stacks --region us-east-1

# Bootstrap status
aws cloudformation describe-stacks \
  --stack-name CDKToolkit \
  --region us-east-1
```

---

**🎯 Objectif** : Déployer le stack `HuntazeOnlyFansStack` dans `us-east-1` avec succès.

**Durée estimée** : 10-15 minutes une fois le cache nettoyé.

**Status** : ⏳ En attente de déploiement manuel
