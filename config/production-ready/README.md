# Production Ready Configuration 2025

Configuration files prêts pour la production avec toutes les meilleures pratiques de sécurité et performance.

## 📦 Fichiers Inclus

### 1. `middleware.ts` - Next.js 15.5 Middleware (Production Ready)
Middleware avec sécurité renforcée pour Next.js 15.5.

**Features:**
- ✅ CSP strict avec nonces (NO unsafe-eval/unsafe-inline)
- ✅ Security headers complets (HSTS, X-Frame-Options, etc.)
- ✅ Host validation
- ✅ Authentication checks
- ✅ Rate limiting headers

**Note:** Next.js 16 introduit `proxy.ts` mais nous restons sur 15.5 pour la stabilité.

**Installation:**
```bash
# Le middleware.ts est déjà en place
# Ajouter les security headers dans next.config.ts
```

**Usage dans layout.tsx:**
```typescript
import { headers } from 'next/headers';
import Script from 'next/script';

export default function RootLayout({ children }) {
  const nonce = headers().get('x-nonce') ?? undefined;
  
  return (
    <html>
      <body>
        {children}
        <Script src="/analytics.js" nonce={nonce} />
      </body>
    </html>
  );
}
```

### 2. `secrets.service.ts` - AWS Secrets Manager
Gestion sécurisée des secrets avec cache mémoire.

**Features:**
- ✅ IAM Role only (NO static keys)
- ✅ Memory cache avec TTL (5 min default)
- ✅ Preload critical secrets
- ✅ Health check
- ✅ Fallback sur cache expiré

**Installation:**
```bash
# Copier vers lib/
cp config/production-ready/secrets.service.ts lib/secrets.service.ts
```

**Usage:**
```typescript
import { secrets } from '@/lib/secrets.service';

// Get specific secret
const dbUrl = await secrets.getDatabaseUrl();
const apiKey = await secrets.getOnlyFansApiKey();

// Preload at startup
await preloadSecrets();
```

**Créer les secrets AWS:**
```bash
# Database
aws secretsmanager create-secret \
  --name huntaze/database/url \
  --secret-string "postgresql://..."

# NextAuth
aws secretsmanager create-secret \
  --name huntaze/nextauth/secret \
  --secret-string "your-secret-here"

# OnlyFans
aws secretsmanager create-secret \
  --name huntaze/onlyfans/api-key \
  --secret-string "your-api-key"
```

### 3. `monitoring.service.ts` - Observability
Monitoring complet avec SLIs/SLOs et DORA metrics.

**Features:**
- ✅ SLIs/SLOs tracking
- ✅ CloudWatch metrics
- ✅ DORA metrics
- ✅ Audit logs avec PII masking
- ✅ Health checks
- ✅ Performance middleware

**Installation:**
```bash
cp config/production-ready/monitoring.service.ts lib/monitoring.service.ts
```

**Usage:**
```typescript
import { 
  trackAPILatency, 
  trackAPIError,
  logAuditEvent,
  createPerformanceMiddleware 
} from '@/lib/monitoring.service';

// Track API latency
await trackAPILatency('/api/subscribers', 150);

// Track errors
await trackAPIError('/api/subscribers', 'ValidationError');

// Audit log
await logAuditEvent({
  userId: session.user.id,
  action: 'CREATE_SUBSCRIBER',
  resource: 'subscriber',
  resourceId: subscriber.id,
  success: true,
});

// Performance middleware
const withPerf = createPerformanceMiddleware('/api/subscribers');
const result = await withPerf(async () => {
  return await getSubscribers();
});
```

### 4. `prisma.config.ts` - Database
Configuration Prisma avec Accelerate (OBLIGATOIRE).

**Features:**
- ✅ Prisma Accelerate (connection pooling)
- ✅ Query optimization helpers
- ✅ Connection burst testing
- ✅ Health check

**Installation:**
```bash
cp config/production-ready/prisma.config.ts lib/prisma.ts
```

**Setup Prisma Accelerate:**
```bash
# 1. Enable Accelerate in Prisma Cloud
# https://console.prisma.io/

# 2. Update DATABASE_URL
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"

# 3. Install extension
npm install @prisma/extension-accelerate
```

**Usage:**
```typescript
import { prisma, queryOptimizations } from '@/lib/prisma';

// With cache
const users = await prisma.user.findMany({
  ...queryOptimizations.paginate(1, 20),
  ...queryOptimizations.withCache(60),
});

// Test connection burst
const isHealthy = await testConnectionBurst(); // Should be < 1s
```

### 5. `s3-presigned.service.ts` - S3 Storage
Presigned URLs avec Content-Disposition.

**Features:**
- ✅ IAM Role only
- ✅ Content-Disposition (filename preservation)
- ✅ Server-side encryption
- ✅ Content-Type validation
- ✅ File size validation

**Installation:**
```bash
cp config/production-ready/s3-presigned.service.ts lib/s3-presigned.service.ts
```

**Usage:**
```typescript
import { generateUploadUrl, generateDownloadUrl } from '@/lib/s3-presigned.service';

// Upload
const { url, key } = await generateUploadUrl({
  userId: session.user.id,
  fileName: 'photo.jpg',
  contentType: 'image/jpeg',
  expiresIn: 60, // 1 minute
});

// Download
const { url } = await generateDownloadUrl({
  key: 'user123/1234567890-photo.jpg',
  inline: true, // View in browser
  expiresIn: 3600, // 1 hour
});
```

## 🚀 Déploiement

### 1. Vérifier les prérequis

```bash
# Node.js 20.9+
node -v

# AWS CLI configuré
aws sts get-caller-identity

# Prisma Accelerate activé
echo $DATABASE_URL
```

### 2. Copier les fichiers

```bash
# Proxy
cp config/production-ready/proxy.ts ./proxy.ts

# Services
cp config/production-ready/secrets.service.ts lib/secrets.service.ts
cp config/production-ready/monitoring.service.ts lib/monitoring.service.ts
cp config/production-ready/prisma.config.ts lib/prisma.ts
cp config/production-ready/s3-presigned.service.ts lib/s3-presigned.service.ts
```

### 3. Créer les secrets AWS

```bash
# Voir scripts/create-secrets.sh
./scripts/create-secrets.sh
```

### 4. Configurer CloudWatch

```bash
# Voir infra/terraform/monitoring/
terraform apply
```

### 5. Déployer

```bash
# Production
./scripts/deploy-production-2025.sh production
```

## 📊 SLIs/SLOs

### Service Level Indicators (SLIs)
- API Availability: **99.9%**
- API Latency P95: **< 250ms**
- API Error Rate: **< 1%**
- DB Connection Time: **< 100ms**
- Queue Processing Time: **< 5s**

### Service Level Objectives (SLOs)
- Uptime: **99.9%** (monthly)
- Response Time P95: **< 500ms**
- Error Budget: **0.1%**

### DORA Metrics
- Deployment Frequency: **7/week** (daily)
- Lead Time for Changes: **< 2 hours**
- Mean Time to Recovery: **< 60 minutes**
- Change Failure Rate: **< 5%**

## 🔒 Sécurité

### CSP Headers
```
default-src 'self'
script-src 'self' 'nonce-{random}'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https: blob:
```

### Cookies
```
__Host-huntaze.session-token
__Host-huntaze.csrf-token
```

### Secrets
- ✅ AWS Secrets Manager only
- ✅ NO static keys in code
- ✅ IAM roles only
- ✅ Cache avec TTL

### Audit Logs
- ✅ PII masking automatique
- ✅ Rétention: 365 jours
- ✅ CloudWatch Logs
- ✅ Correlation IDs

## 📈 Monitoring

### CloudWatch Dashboards
- Application metrics
- Business metrics
- Infrastructure metrics

### Alarms
- API 5xx errors > 2%
- API latency P95 > 500ms
- SQS queue depth > 5,000
- DB CPU > 80%

### Logs
- Application: 30 jours
- Audit: 365 jours
- Access: 90 jours

## 🧪 Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Security tests
npm run test:security
```

## 📚 Documentation

- [Production Readiness Guide](../../docs/PRODUCTION_READINESS_2025.md)
- [Runbooks](../../docs/RUNBOOKS.md)
- [Architecture](../../docs/HUNTAZE_APP_ARCHITECTURE.md)
- [Deployment Guide](../../DEPLOYMENT_GUIDE.md)

## ✅ Checklist Production

- [ ] Node 20.9+ configuré
- [ ] Next.js 16 proxy.ts implémenté
- [ ] IAM roles uniquement (pas de clés)
- [ ] CSP strict avec nonces
- [ ] Secrets Manager configuré
- [ ] Prisma Accelerate activé
- [ ] SLIs/SLOs définis
- [ ] CloudWatch alarms configurés
- [ ] Audit logs activés
- [ ] Tests passent (unit + integration + e2e)
- [ ] Runbooks documentés
- [ ] DR tests planifiés (mensuel)

## 🆘 Support

En cas de problème:
1. Consulter les [Runbooks](../../docs/RUNBOOKS.md)
2. Vérifier les [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/)
3. Contacter l'équipe DevOps

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-30  
**Status**: ✅ Production Ready
