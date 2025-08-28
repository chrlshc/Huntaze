# Variables d'environnement manquantes dans AWS Amplify

## 1. **STRIPE_WEBHOOK_SECRET** (CRITIQUE)
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```
- Va dans Stripe Dashboard > Developers > Webhooks
- Crée un webhook endpoint : `https://huntaze.com/api/webhooks/stripe`
- Copie le Signing secret

## 2. **Stripe Price IDs** (CRITIQUE)
```
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx
```
- Va dans Stripe Dashboard > Products
- Crée les produits et prix pour chaque plan

## 3. **DATA_ENCRYPTION_KEY** (CRITIQUE)
```
DATA_ENCRYPTION_KEY=<32-byte-random-key>
```
Pour générer : `openssl rand -base64 32`

## 4. **AWS Credentials** (Pour SES)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```

## 5. **Optionnel mais recommandé**
```
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_GA_ID=G-xxxxx
```

## Actions à faire :

1. **Stripe Webhook** :
   - Crée le webhook dans Stripe Dashboard
   - Configure l'URL : `https://api.huntaze.com/api/webhooks/stripe`
   - Sélectionne les événements : `checkout.session.completed`, `customer.subscription.*`

2. **Stripe Products** :
   - Crée les produits dans Stripe pour chaque plan
   - Note les price IDs

3. **Ajoute ces variables dans AWS Amplify** :
   - Environment settings > Environment variables
   - Add variable pour chaque manquante