# Guide de Sécurité Huntaze

## 🔒 Gestion des Credentials

### ❌ NE JAMAIS FAIRE

1. **Committer des credentials dans Git**
   ```bash
   # MAUVAIS - Ne jamais faire ça
   git add .env
   git commit -m "Add env file"
   ```

2. **Partager des credentials publiquement**
   - Pas dans les chats
   - Pas dans les issues GitHub
   - Pas dans la documentation

3. **Hardcoder des credentials**
   ```typescript
   // MAUVAIS
   const apiKey = "AKIAIOSFODNN7EXAMPLE";
   ```

### ✅ BONNES PRATIQUES

1. **Utiliser des variables d'environnement**
   ```typescript
   // BON
   const apiKey = process.env.AWS_ACCESS_KEY_ID;
   ```

2. **Utiliser .env.local (non commité)**
   ```bash
   # .env.local (dans .gitignore)
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   ```

3. **Utiliser AWS CLI pour les credentials**
   ```bash
   aws configure
   # Ou
   aws sso login
   ```

4. **Utiliser des secrets managers**
   - AWS Secrets Manager
   - AWS Systems Manager Parameter Store
   - Amplify Environment Variables

## 🚨 Si Vous Avez Exposé des Credentials

### Actions Immédiates

1. **Révoquer les credentials**
   ```bash
   # AWS Console > IAM > Users > Security Credentials
   # Désactiver ou supprimer les access keys
   ```

2. **Générer de nouveaux credentials**
   ```bash
   aws iam create-access-key --user-name your-username
   ```

3. **Vérifier les logs d'accès**
   ```bash
   # CloudTrail pour voir si les credentials ont été utilisés
   aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAIOSFODNN7EXAMPLE
   ```

4. **Nettoyer l'historique Git (si commité)**
   ```bash
   # Utiliser git-filter-repo ou BFG Repo-Cleaner
   git filter-repo --path .env --invert-paths
   ```

## 🔐 Configuration AWS Sécurisée

### Pour le Développement Local

```bash
# Option 1: AWS CLI
aws configure
# Entrer: Access Key, Secret Key, Region, Output format

# Option 2: Variables d'environnement
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
export AWS_REGION="us-east-1"

# Option 3: AWS SSO (recommandé)
aws sso login --profile huntaze
```

### Pour Amplify/Production

1. **Amplify Console > App Settings > Environment Variables**
2. Ajouter les variables sans les committer
3. Utiliser AWS Secrets Manager pour les valeurs sensibles

## 📋 Checklist de Sécurité

### Avant Chaque Commit

- [ ] Vérifier qu'aucun fichier .env n'est inclus
- [ ] Vérifier qu'aucun credential n'est hardcodé
- [ ] Vérifier que .gitignore est à jour
- [ ] Scanner avec git-secrets ou truffleHog

### Avant Chaque Déploiement

- [ ] Variables d'environnement configurées sur Amplify
- [ ] Credentials AWS avec permissions minimales (principe du moindre privilège)
- [ ] Secrets stockés dans AWS Secrets Manager
- [ ] Logs de sécurité activés (CloudTrail)

### Régulièrement

- [ ] Rotation des credentials (tous les 90 jours)
- [ ] Audit des permissions IAM
- [ ] Revue des logs d'accès
- [ ] Mise à jour des dépendances (npm audit)

## 🛠️ Outils de Sécurité

### Scan de Credentials

```bash
# git-secrets
git secrets --scan

# truffleHog
trufflehog git file://. --only-verified

# gitleaks
gitleaks detect --source . --verbose
```

### Scan de Vulnérabilités

```bash
# npm audit
npm audit
npm audit fix

# Snyk
npx snyk test
```

## 📞 En Cas d'Incident

1. **Révoquer immédiatement** les credentials exposés
2. **Notifier l'équipe** de sécurité
3. **Documenter** l'incident
4. **Analyser** l'impact
5. **Mettre en place** des mesures préventives

## 🔗 Ressources

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security](https://docs.github.com/en/code-security)
- [Amplify Security](https://docs.amplify.aws/guides/security/)

---

**Dernière mise à jour:** 17 Novembre 2024  
**Contact Sécurité:** security@huntaze.com
