# Guide de Déploiement AWS Simplifié

## Option 1: Déploiement via GitHub Actions (Recommandé)

Votre workflow GitHub Actions est déjà configuré. Pour activer le déploiement AWS:

1. **Configurer les secrets GitHub**:
   - Allez sur https://github.com/chrlshc/sitedepot/settings/secrets/actions
   - Ajoutez ces secrets:
     ```
     AWS_ACCESS_KEY_ID: votre-access-key
     AWS_SECRET_ACCESS_KEY: votre-secret-key
     AMPLIFY_APP_ID: votre-app-id (si Amplify)
     S3_BUCKET_NAME: votre-bucket (si S3)
     CLOUDFRONT_ID: votre-distribution-id (si CloudFront)
     ```

2. **Modifier le workflow** `.github/workflows/frontend-deploy.yml`:
   - Décommentez l'option souhaitée (Amplify ou S3/CloudFront)
   - Commit et push

## Option 2: AWS Amplify (Le plus simple)

1. **Créer une app Amplify**:
   ```bash
   aws amplify create-app --name huntaze-premium --repository https://github.com/chrlshc/sitedepot
   ```

2. **Connecter la branche**:
   ```bash
   aws amplify create-branch --app-id <APP_ID> --branch-name main
   ```

3. **L'app se déploiera automatiquement** à chaque push

## Option 3: Déploiement Manuel Rapide

1. **Build local**:
   ```bash
   npm run build
   ```

2. **Créer un bucket S3**:
   ```bash
   aws s3 mb s3://huntaze-premium-site
   aws s3 website s3://huntaze-premium-site --index-document index.html
   ```

3. **Déployer**:
   ```bash
   aws s3 sync ./out s3://huntaze-premium-site --delete
   ```

4. **Accès public** (optionnel):
   ```bash
   aws s3api put-bucket-policy --bucket huntaze-premium-site --policy '{
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicRead",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::huntaze-premium-site/*"
     }]
   }'
   ```

## URLs de Production

- **Amplify**: https://main.d1234567890.amplifyapp.com
- **S3**: http://huntaze-premium-site.s3-website-us-east-1.amazonaws.com
- **CloudFront**: https://d1234567890.cloudfront.net

## Variables d'Environnement

Déjà configurées dans `.env.local`:
- `NEXT_PUBLIC_APP_URL=https://huntaze.com`
- `NEXT_PUBLIC_API_URL=https://api.huntaze.com`

## Vérification du Déploiement

1. **Vérifier le build GitHub Actions**:
   https://github.com/chrlshc/sitedepot/actions

2. **Tester les animations**:
   - Gradient animé en arrière-plan
   - Mockup 3D iPhone qui tourne
   - Dashboard avec données en temps réel
   - Boutons magnétiques
   - Animations au scroll

## Support

- Le workflow est actuellement en cours d'exécution
- Les animations sont optimisées pour mobile
- Mode hors ligne activé avec PWA