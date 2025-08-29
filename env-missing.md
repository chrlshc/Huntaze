# Missing Environment Variables in AWS Amplify

## 1. **STRIPE_WEBHOOK_SECRET** (CRITICAL)
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```
- Go to Stripe Dashboard > Developers > Webhooks
- Create a webhook endpoint: `https://huntaze.com/api/webhooks/stripe`
- Copy the Signing secret

## 2. **Stripe Price IDs** (CRITICAL)
```
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx
```
- Go to Stripe Dashboard > Products
- Create products and prices for each plan

## 3. **DATA_ENCRYPTION_KEY** (CRITICAL)
```
DATA_ENCRYPTION_KEY=<32-byte-random-key>
```
To generate: `openssl rand -base64 32`

## 4. **AWS Credentials** (for SES)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```

## 5. **Optional but recommended**
```
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_GA_ID=G-xxxxx
```

## Action Items:

1. **Stripe Webhook**:
   - Create the webhook in Stripe Dashboard
   - Set URL: `https://api.huntaze.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`

2. **Stripe Products**:
   - Create products in Stripe for each plan
   - Note the price IDs

3. **Add these variables in AWS Amplify**:
   - Environment settings > Environment variables
   - Add a variable for each missing item
