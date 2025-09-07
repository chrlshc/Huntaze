# Guide de Déploiement AWS pour Huntaze

Ce guide explique comment déployer le site Huntaze Premium sur AWS avec les nouvelles animations et fonctionnalités.

## 🚀 Déploiement Rapide

### Option 1: Script Automatisé (Recommandé)

```bash
# 1. Configurer AWS CLI
aws configure

# 2. Rendre le script exécutable
chmod +x deploy-simple-aws.sh

# 3. Lancer le déploiement
./deploy-simple-aws.sh
```

### Option 2: Déploiement Manuel

#### Étape 1: Build local
```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Build Docker
docker build -t huntaze-site .
```

#### Étape 2: Push vers ECR
```bash
# Se connecter à ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com

# Créer le repository si nécessaire
aws ecr create-repository --repository-name huntaze-site --region us-east-1

# Tag et push
docker tag huntaze-site:latest [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/huntaze-site:latest
docker push [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/huntaze-site:latest
```

## 🏗️ Infrastructure AWS Complète

### Déployer avec CloudFormation

```bash
# Créer la stack
aws cloudformation create-stack \
  --stack-name huntaze-infrastructure \
  --template-body file://aws-infrastructure.yaml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=huntaze.com \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:... \
  --capabilities CAPABILITY_IAM

# Attendre la création
aws cloudformation wait stack-create-complete \
  --stack-name huntaze-infrastructure
```

### Ce qui est déployé:
- ✅ VPC avec 2 sous-réseaux publics
- ✅ Application Load Balancer (ALB)
- ✅ Cluster ECS Fargate
- ✅ Service ECS avec auto-scaling
- ✅ Repository ECR
- ✅ CloudWatch Logs
- ✅ Certificat SSL (si fourni)

## 🔧 Configuration Post-Déploiement

### 1. Configurer le DNS

Pointez votre domaine vers l'ALB:
```
huntaze.com → CNAME → [ALB-DNS-NAME].elb.amazonaws.com
```

### 2. Variables d'Environnement

Ajoutez vos variables dans la Task Definition ECS:
```json
{
  "environment": [
    {"name": "NODE_ENV", "value": "production"},
    {"name": "DATABASE_URL", "value": "your-db-url"},
    {"name": "NEXTAUTH_URL", "value": "https://huntaze.com"},
    {"name": "NEXTAUTH_SECRET", "value": "your-secret"}
  ]
}
```

### 3. Monitoring

- **CloudWatch Dashboard**: Métriques CPU, mémoire, requêtes
- **X-Ray**: Tracing des performances
- **CloudWatch Logs**: Logs centralisés

## 📊 Optimisations de Performance

### Images Docker Optimisées
- Multi-stage build
- Alpine Linux base
- Compression des assets
- Cache des dépendances

### CDN CloudFront (Optionnel)
```bash
# Créer une distribution CloudFront
aws cloudfront create-distribution \
  --origin-domain-name [ALB-DNS-NAME].elb.amazonaws.com \
  --default-root-object index.html
```

### Auto-Scaling
- Min: 2 instances
- Max: 10 instances
- Target CPU: 70%
- Scale-out: +2 instances
- Scale-in: -1 instance

## 🛡️ Sécurité

### Best Practices Appliquées
- ✅ HTTPS uniquement
- ✅ Security headers
- ✅ Principe du moindre privilège IAM
- ✅ Secrets dans AWS Secrets Manager
- ✅ VPC isolé
- ✅ Security groups restrictifs

### Backup & Disaster Recovery
- Snapshots ECR automatiques
- Multi-AZ deployment
- CloudFormation pour infrastructure as code

## 📈 Coûts Estimés (par mois)

| Service | Usage | Coût Estimé |
|---------|-------|-------------|
| ECS Fargate | 2 tasks × 0.5 vCPU × 1GB | ~$30 |
| ALB | 1 ALB + trafic | ~$25 |
| ECR | 10 GB stockage | ~$1 |
| CloudWatch | Logs + métriques | ~$10 |
| **Total** | | **~$66/mois** |

## 🔍 Dépannage

### Vérifier le déploiement
```bash
# Status du service ECS
aws ecs describe-services \
  --cluster huntaze-cluster \
  --services huntaze-service

# Logs CloudWatch
aws logs tail /ecs/huntaze --follow

# Health check
curl https://huntaze.com/api/health
```

### Problèmes Courants

**Image pull error**
```bash
# Vérifier les permissions ECR
aws ecr get-repository-policy --repository-name huntaze-site
```

**Service unhealthy**
```bash
# Augmenter le health check grace period
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-service \
  --health-check-grace-period-seconds 120
```

**Out of memory**
```bash
# Augmenter la mémoire dans la task definition
# Memory: 1024 → 2048
```

## 📞 Support

Pour toute question sur le déploiement:
- Documentation AWS ECS: https://docs.aws.amazon.com/ecs/
- CloudFormation: https://docs.aws.amazon.com/cloudformation/
- Support Huntaze: support@huntaze.com

---

🎉 **Votre site Huntaze Premium est maintenant déployé sur AWS!**