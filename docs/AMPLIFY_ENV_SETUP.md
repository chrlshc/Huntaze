# AWS Amplify Environment Variables Setup Guide

## 📋 Configuration rapide

Allez dans **AWS Amplify Console** > Votre App > **Environment variables** et ajoutez ces variables:

## ✅ Variables CRITIQUES (Obligatoires)

### 🗄️ Database
```bash
DATABASE_URL=postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require
```

### 🔴 Redis
```bash
REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
```

### 🔐 Authentication
```bash
NEXTAUTH_URL=https://staging.huntaze.com
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
CSRF_SECRET=<générer avec: openssl rand -base64 32>
```

### ☁️ AWS Core
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<votre access key>
AWS_SECRET_ACCESS_KEY=<votre secret key>
```

### 🤖 AI Services
```bash
GEMINI_API_KEY=<votre clé Gemini>
```

## 🔧 Variables VPC (Pour Amplify Compute)

Ces variables permettent à Amplify d'accéder à RDS et ElastiCache dans votre VPC:

```bash
LAMBDA_SECURITY_GROUP_ID=sg-xxxxxxxxx
PRIVATE_SUBNET_1_ID=subnet-xxxxxxxxx
PRIVATE_SUBNET_2_ID=subnet-yyyyyyyyy
```

## 📦 Variables Optionnelles

### 📧 Email (SES)
```bash
SES_FROM_EMAIL=noreply@huntaze.com
SES_REGION=us-east-1
```

### 💳 Stripe
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 📱 Social Media
```bash
# Instagram
INSTAGRAM_CLIENT_ID=xxxxx
INSTAGRAM_CLIENT_SECRET=xxxxx
INSTAGRAM_REDIRECT_URI=https://staging.huntaze.com/api/auth/callback/instagram

# TikTok
TIKTOK_CLIENT_KEY=xxxxx
TIKTOK_CLIENT_SECRET=xxxxx
TIKTOK_REDIRECT_URI=https://staging.huntaze.com/api/auth/callback/tiktok

# Reddit
REDDIT_CLIENT_ID=xxxxx
REDDIT_CLIENT_SECRET=xxxxx
REDDIT_REDIRECT_URI=https://staging.huntaze.com/api/auth/callback/reddit
```

### 🎭 OnlyFans Integration
```bash
OF_SESSION_KEY=<32 caractères>
OF_SESSIONS_BACKEND=aws
OF_AWS_REGION=us-east-1
OF_DDB_SESSIONS_TABLE=HuntazeOfSessions
OF_DDB_FAN_CAPS_TABLE=HuntazeFanCaps
OF_KMS_KEY_ID=<votre KMS key>
OF_SQS_SEND_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxxxx/huntaze-of-send-queue

# Proxy Bright Data
BRIGHT_DATA_CUSTOMER=xxxxx
BRIGHT_DATA_PASSWORD=xxxxx
BRIGHT_DATA_ZONE=residential
```

### 📊 Analytics
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 🚀 Commandes utiles

### Générer des secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CSRF_SECRET
openssl rand -base64 32

# OF_SESSION_KEY (32 caractères)
openssl rand -hex 16
```

### Vérifier les ressources AWS
```bash
npx tsx scripts/verify-aws-resources.ts
```

### Tester les connexions
```bash
npx tsx scripts/test-connections.ts
```

## 📝 Notes importantes

1. **Ne jamais commiter** les fichiers `.env` avec des vraies valeurs
2. **Utiliser des secrets différents** pour staging et production
3. **Rotation des secrets** tous les 90 jours recommandée
4. **VPC Access**: Assurez-vous que les security groups autorisent les connexions depuis Amplify
5. **SSL/TLS**: Toujours utiliser `sslmode=require` pour PostgreSQL

## 🔍 Troubleshooting

### Erreur: "connect ETIMEDOUT"
- Vérifiez que `LAMBDA_SECURITY_GROUP_ID` est correct
- Vérifiez que les subnets sont dans le bon VPC
- Vérifiez les règles du security group RDS/ElastiCache

### Erreur: "Authentication failed"
- Vérifiez `DATABASE_URL` username/password
- Vérifiez que l'utilisateur a les permissions nécessaires

### Erreur: "Redis connection refused"
- Vérifiez `REDIS_HOST` et `REDIS_PORT`
- Vérifiez que ElastiCache autorise les connexions depuis le security group

## 📚 Ressources

- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
