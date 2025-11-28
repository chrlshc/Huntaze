# 🔗 Guide: Attacher Lambda@Edge à CloudFront

## 📋 Informations Nécessaires

**Distribution CloudFront**: E21VMD5A9KDBOO  
**Domain**: dc825q4u11mxr.cloudfront.net

**Lambda@Edge Functions**:
- **Viewer Request**: `arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1`
- **Origin Response**: `arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1`

---

## 🖥️ Méthode 1: Via Console AWS (Recommandé - 5 minutes)

### Étape 1: Accéder à CloudFront

1. Ouvrir: https://console.aws.amazon.com/cloudfront/v3/home
2. Cliquer sur la distribution **E21VMD5A9KDBOO**

### Étape 2: Éditer le Behavior

1. Cliquer sur l'onglet **"Behaviors"**
2. Sélectionner le behavior **"Default (*)"**
3. Cliquer sur **"Edit"**

### Étape 3: Ajouter les Function Associations

1. Scroller jusqu'à la section **"Function associations"**
2. Sous **"Viewer request"**:
   - Sélectionner **"Lambda@Edge"** dans le dropdown
   - Coller l'ARN: `arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1`
   - Laisser **"Include body"** décoché

3. Sous **"Origin response"**:
   - Sélectionner **"Lambda@Edge"** dans le dropdown
   - Coller l'ARN: `arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1`
   - Laisser **"Include body"** décoché

### Étape 4: Sauvegarder

1. Cliquer sur **"Save changes"** en bas de la page
2. Attendre que le status passe à **"Deploying"**

### Étape 5: Attendre le Déploiement

⏳ **Temps d'attente**: 15-20 minutes

Le status de la distribution va passer de:
- **"Deploying"** → **"Deployed"**

Vous pouvez rafraîchir la page pour voir la progression.

---

## 💻 Méthode 2: Via AWS CLI (Avancé)

### Étape 1: Récupérer la Configuration

```bash
# Récupérer la configuration actuelle
aws cloudfront get-distribution-config \
  --id E21VMD5A9KDBOO \
  > cloudfront-config.json

# Extraire l'ETag (nécessaire pour la mise à jour)
ETAG=$(jq -r '.ETag' cloudfront-config.json)
echo "ETag: $ETAG"

# Extraire la configuration de distribution
jq '.DistributionConfig' cloudfront-config.json > cloudfront-dist-config.json
```

### Étape 2: Modifier la Configuration

Éditer `cloudfront-dist-config.json` et trouver la section `DefaultCacheBehavior`.

Ajouter ou modifier `LambdaFunctionAssociations`:

```json
{
  "DefaultCacheBehavior": {
    ...
    "LambdaFunctionAssociations": {
      "Quantity": 2,
      "Items": [
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1",
          "EventType": "viewer-request",
          "IncludeBody": false
        },
        {
          "LambdaFunctionARN": "arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1",
          "EventType": "origin-response",
          "IncludeBody": false
        }
      ]
    },
    ...
  }
}
```

### Étape 3: Appliquer les Changements

```bash
# Appliquer la nouvelle configuration
aws cloudfront update-distribution \
  --id E21VMD5A9KDBOO \
  --if-match "$ETAG" \
  --distribution-config file://cloudfront-dist-config.json

# Attendre que le déploiement soit terminé
aws cloudfront wait distribution-deployed --id E21VMD5A9KDBOO
```

---

## ✅ Vérification

### 1. Vérifier dans la Console

1. Retourner sur la distribution E21VMD5A9KDBOO
2. Onglet **"Behaviors"** → **"Default (*)"**
3. Vérifier que les 2 fonctions Lambda apparaissent dans **"Function associations"**

### 2. Vérifier via CLI

```bash
# Vérifier les Lambda associations
aws cloudfront get-distribution-config \
  --id E21VMD5A9KDBOO \
  | jq '.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations'
```

Résultat attendu:
```json
{
  "Quantity": 2,
  "Items": [
    {
      "LambdaFunctionARN": "arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1",
      "EventType": "viewer-request",
      "IncludeBody": false
    },
    {
      "LambdaFunctionARN": "arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1",
      "EventType": "origin-response",
      "IncludeBody": false
    }
  ]
}
```

### 3. Tester les Headers de Sécurité

Une fois le déploiement terminé:

```bash
# Tester les headers de sécurité
curl -I https://dc825q4u11mxr.cloudfront.net/

# Vérifier les headers suivants:
# - strict-transport-security
# - x-content-type-options
# - x-frame-options
# - x-xss-protection
# - content-security-policy
```

### 4. Vérifier les Logs Lambda@Edge

```bash
# Les logs Lambda@Edge sont créés dans la région où la fonction s'exécute
# Lister les log groups (exemple pour us-west-2)
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/us-east-1.huntaze \
  --region us-west-2

# Voir les logs récents
aws logs tail /aws/lambda/us-east-1.huntaze-viewer-request \
  --region us-west-2 \
  --follow
```

---

## 🔍 Vérification Automatique

Après le déploiement, exécuter le script de vérification:

```bash
npm run aws:verify
```

Vous devriez maintenant voir:
- ✅ CloudFront Lambda@Edge: 2 function(s) attached
- ✅ CloudFront Response: Headers de sécurité présents

---

## 🚨 Troubleshooting

### Erreur: "The function ARN must be a qualified ARN"

**Solution**: Assurez-vous d'utiliser l'ARN avec le numéro de version (`:1` à la fin), pas `$LATEST`.

### Erreur: "The function must be in us-east-1"

**Solution**: Lambda@Edge doit être déployé en us-east-1. Nos fonctions sont déjà dans la bonne région.

### Les headers de sécurité n'apparaissent pas

**Causes possibles**:
1. Le déploiement CloudFront n'est pas terminé (attendre 15-20 min)
2. Cache CloudFront contient encore l'ancienne réponse (attendre ou invalider le cache)
3. Les fonctions Lambda ne s'exécutent pas (vérifier les logs)

**Solution**:
```bash
# Invalider le cache CloudFront
aws cloudfront create-invalidation \
  --distribution-id E21VMD5A9KDBOO \
  --paths "/*"
```

### Le déploiement prend trop de temps

**Normal**: CloudFront doit propager les changements à tous les edge locations dans le monde. Cela prend 15-20 minutes.

---

## 📊 Impact Attendu

Une fois le déploiement terminé:

### Performance
- ⚡ Cache Hit Rate: +20-30%
- 💾 Bandwidth: -50-70% (compression)
- 🚀 Latency: +1-5ms (viewer-request), +5-20ms (origin-response)

### Sécurité
- 🔒 100% des réponses avec security headers
- ✅ HSTS, CSP, X-Frame-Options, etc.

### Fonctionnalités
- 📱 Device detection (mobile/tablet/desktop)
- 🔐 Edge authentication
- 🎯 A/B testing
- 📦 Compression automatique (Brotli/Gzip)

---

## ✅ Checklist Finale

Après l'attachement:

- [ ] Distribution status = "Deployed"
- [ ] Lambda functions visibles dans Behaviors
- [ ] Headers de sécurité présents (curl test)
- [ ] Compression activée (Content-Encoding header)
- [ ] Logs Lambda@Edge créés
- [ ] CloudWatch alarms actives
- [ ] Script de vérification passe à 100%

---

## 🎉 Prochaine Étape

Une fois Lambda@Edge attaché et déployé:

1. Exécuter `npm run aws:verify` pour confirmer
2. Passer à la **Tâche 16 - Final Checkpoint**
3. Valider la production readiness

---

**Créé**: 2025-11-26  
**Distribution**: E21VMD5A9KDBOO  
**Status**: Prêt pour attachement
