# Guide de Configuration AWS

## 🔐 Credentials AWS

### Configuration Actuelle
Vous avez actuellement des credentials AWS temporaires configurés avec un accès AdministratorAccess.

**Account ID**: 317805897534  
**Region**: us-west-1  
**Role**: AWSReservedSSO_AdministratorAccess_14e08e9c1319b5a2

### Configurer les Credentials

#### Option 1: Variables d'Environnement (Recommandé pour développement)
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_SESSION_TOKEN="your-session-token"  # Si credentials temporaires
export AWS_REGION="us-west-1"
```

#### Option 2: Fichier .env
Ajoutez à votre fichier `.env.local`:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SESSION_TOKEN=your-session-token
AWS_REGION=us-west-1
```

#### Option 3: AWS CLI Profile
```bash
aws configure --profile huntaze
# Puis dans votre code:
export AWS_PROFILE=huntaze
```

### Vérifier la Configuration
```bash
aws sts get-caller-identity
```

Devrait retourner:
```json
{
    "UserId": "AROAUT7VVE47A7GJBONF4:huntaze",
    "Account": "317805897534",
    "Arn": "arn:aws:sts::317805897534:assumed-role/..."
}
```

## 🏗️ Infrastructure Créée

### CloudWatch
- **Dashboard**: Huntaze-Performance-Dashboard
- **Log Group**: /huntaze/performance
- **Alarms**: 8 alarmes configurées
- **Namespace**: Huntaze/Performance

### SNS
- **Topic**: Huntaze-Performance-Alerts
- **ARN**: arn:aws:sns:us-west-1:317805897534:Huntaze-Performance-Alerts

### S3
- **Bucket existant**: huntaze-assets
- **Bucket existant**: huntaze-beta-assets

### CloudFront
- **Distribution ID**: E21VMD5A9KDBOO
- **Domain**: dc825q4u11mxr.cloudfront.net

## 🚀 Commandes Utiles

### Setup Initial
```bash
# Configurer toute l'infrastructure
npm run aws:setup

# Avec email pour les alertes
npm run aws:setup your-email@example.com
```

### Tests
```bash
# Tester l'intégration CloudWatch
npm run aws:test

# Vérifier les métriques
aws cloudwatch list-metrics --namespace "Huntaze/Performance"

# Vérifier les alarmes
aws cloudwatch describe-alarms

# Vérifier les logs
aws logs describe-log-streams --log-group-name "/huntaze/performance"
```

### Monitoring
```bash
# Voir le dashboard
open "https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#dashboards:name=Huntaze-Performance-Dashboard"

# Voir les alarmes
open "https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#alarmsV2:"

# Voir les logs
open "https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#logsV2:log-groups/log-group/$252Fhuntaze$252Fperformance"
```

## 🔧 Maintenance

### Renouveler les Credentials Temporaires
Les credentials temporaires expirent après quelques heures. Pour les renouveler:

1. Connectez-vous à AWS SSO
2. Obtenez de nouveaux credentials
3. Mettez à jour les variables d'environnement

### Modifier les Seuils d'Alarme
Éditez `lib/aws/setup-infrastructure.ts` et modifiez `ALERT_THRESHOLDS`:
```typescript
const ALERT_THRESHOLDS = {
  pageLoadTime: 3000,    // Modifier ici
  apiResponseTime: 2000,
  lcp: 2500,
  // ...
};
```

Puis réexécutez:
```bash
npm run aws:setup
```

### Ajouter une Nouvelle Métrique
1. Ajoutez la métrique dans le dashboard (`lib/aws/setup-infrastructure.ts`)
2. Créez une alarme si nécessaire
3. Réexécutez le setup

## 📊 Coûts AWS

### CloudWatch
- **Métriques custom**: $0.30 par métrique/mois (premières 10,000 gratuites)
- **Alarmes**: $0.10 par alarme/mois (premières 10 gratuites)
- **Logs**: $0.50 par GB ingéré
- **Dashboard**: $3 par dashboard/mois

### SNS
- **Notifications email**: $0 (gratuites)
- **Notifications SMS**: $0.00645 par SMS

### Estimation Mensuelle
- 8 alarmes: Gratuit (< 10)
- 1 dashboard: $3
- Métriques (~20): Gratuit (< 10,000)
- Logs (~1GB): $0.50
- **Total estimé**: ~$3.50/mois

## 🔒 Sécurité

### Permissions Requises
Le rôle AWS doit avoir les permissions suivantes:
- `cloudwatch:PutMetricData`
- `cloudwatch:PutDashboard`
- `cloudwatch:PutMetricAlarm`
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`
- `sns:CreateTopic`
- `sns:Subscribe`

### Bonnes Pratiques
1. ✅ Utilisez des credentials temporaires (SSO)
2. ✅ Ne commitez jamais les credentials dans Git
3. ✅ Utilisez des variables d'environnement
4. ✅ Limitez les permissions au minimum nécessaire
5. ✅ Activez MFA sur le compte AWS

## 🆘 Troubleshooting

### Erreur: "The security token included in the request is expired"
**Solution**: Renouvelez vos credentials temporaires

### Erreur: "ResourceNotFoundException: The specified log stream does not exist"
**Solution**: Appelez `monitoring.initialize()` avant d'utiliser les logs

### Métriques n'apparaissent pas dans le dashboard
**Solution**: 
- Attendez 1-2 minutes pour la propagation
- Vérifiez que le namespace est correct: `Huntaze/Performance`
- Vérifiez la région: `us-west-1`

### Alarmes en état INSUFFICIENT_DATA
**Solution**: C'est normal pour les nouvelles alarmes. Envoyez des métriques pour les activer.

## 📚 Documentation AWS

- [CloudWatch Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)
- [SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)

## ✅ Checklist de Vérification

- [x] Credentials AWS configurés
- [x] Infrastructure CloudWatch créée
- [x] Dashboard visible dans la console
- [x] 8 alarmes configurées
- [x] Topic SNS créé
- [x] Log group créé
- [x] Tests d'intégration passés
- [x] Métriques visibles dans CloudWatch
- [ ] Email de confirmation SNS validé (optionnel)

## 🎉 Prêt à Utiliser!

Votre infrastructure AWS est maintenant configurée et prête à recevoir des métriques de performance!

Pour commencer à envoyer des métriques, consultez le [README](./lib/aws/README.md).
