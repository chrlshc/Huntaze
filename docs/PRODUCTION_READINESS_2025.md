# ⚠️ Production Readiness Guide 2025

## 🎯 Points de Vigilance Critiques

### ✅ Check-list Production Ready

### Infrastructure
- [ ] Node 20.9+ sur CI/CD et runtime
- [ ] Next 16 features adoptées (proxy.ts, Cache Components)
- [ ] Amplify compatibility validée
- [ ] IAM roles only (pas de clés statiques en prod)

### Security
- [ ] CSP strict avec nonces (pas de unsafe-eval/unsafe-inline)
- [ ] HSTS + Secure cookies (__Host- prefix)
- [ ] Secrets via AWS Secrets Manager (avec cache)
- [ ] Input validation (Zod) sur toutes les routes
- [ ] PII masking dans les logs

### Database & Performance
- [ ] Prisma Accelerate activé (ou RDS Proxy) - OBLIGATOIRE
- [ ] Connection pooling configuré
- [ ] Test de burst connexions validé
- [ ] Vues matérialisées pour analytics

### Auth & Sessions
- [ ] Auth.js v5 versions épinglées + rollback plan
- [ ] Cookies avec __Host- prefix
- [ ] JWT maxAge configuré (7 jours)

### Observability
- [ ] SLIs/SLOs définis (p95 < 250ms, erreurs < 1%)
- [ ] CloudWatch alarms configurées
- [ ] Logs rétention: 30j prod / 7j staging
- [ ] Audit logs (accès, téléchargements, RBAC)

### Testing & DR
- [ ] Test de restauration DB (mensuel)
- [ ] Chaos/DR tests
- [ ] Security: ZAP Baseline + npm audit
- [ ] Load tests validés

---

## 1️⃣ Next.js 16 - Nouveautés Critiques

### 🔥 Features à Adopter

#### a) Cache Components ("use cache")

```typescript
// app/components/SubscribersList.tsx
'use cache';

export async function SubscribersList({ userId }: { userId: string }) {
  const subscribers = await prisma.subscriber.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      {subscribers.map(sub => (
        <SubscriberCard key={sub.id} subscriber={sub} />
      ))}
    </div>
  );
}
```

#### b) proxy.ts (remplace middleware.ts)

```typescript
// proxy.ts (Node runtime)
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(req: NextRequest) {
  const host = req.headers.get('host');
  
  // Redirect non-production hosts
  if (host && host !== 'app.huntaze.com') {
    return NextResponse.redirect(
      new URL(req.nextUrl.pathname, 'https://app.huntaze.com')
    );
  }

  // A/B testing, rewrites, etc.
  const variant = req.cookies.get('ab-test')?.value;
  if (variant === 'b') {
    return NextResponse.rewrite(new URL('/dashboard-v2', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### c) Revalidation Ciblée

```typescript
// app/api/onlyfans/subscribers/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user.id;

  // Create subscriber
  const subscriber = await prisma.subscriber.create({
    data: { ...body, userId },
  });

  // Revalidate specific cache
  revalidateTag(`subscribers:${userId}`);

  return NextResponse.json({ success: true, data: subscriber });
}
```

```typescript
// Côté data fetching
export async function getSubscribers(userId: string) {
  const response = await fetch('/api/onlyfans/subscribers', {
    next: {
      tags: [`subscribers:${userId}`],
      revalidate: 60, // 60 seconds
    },
  });

  return response.json();
}
```

### ⚙️ Configuration Requise

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    // React Compiler support
    reactCompiler: true,
    
    // Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Prisma external package
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Turbopack (stable in Next 16)
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default config;
```

### 📋 Prérequis

```json
// package.json
{
  "engines": {
    "node": ">=20.9.0",
    "npm": ">=10.0.0"
  },
  "dependencies": {
    "next": "^16.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

---

## 2️⃣ React 19 - Features à Intégrer

### Server Actions

```typescript
// app/actions/subscribers.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addSubscriber(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const username = formData.get('username') as string;
  const email = formData.get('email') as string;

  const subscriber = await prisma.subscriber.create({
    data: {
      userId: session.user.id,
      username,
      email,
      tier: 'free',
      isActive: true,
    },
  });

  revalidatePath('/onlyfans/subscribers');
  
  return { success: true, data: subscriber };
}
```

```typescript
// Component usage
'use client';

import { addSubscriber } from '@/app/actions/subscribers';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Adding...' : 'Add Subscriber'}
    </button>
  );
}

export function AddSubscriberForm() {
  return (
    <form action={addSubscriber}>
      <input name="username" required />
      <input name="email" type="email" required />
      <SubmitButton />
    </form>
  );
}
```

### useOptimistic Hook

```typescript
'use client';

import { useOptimistic } from 'react';
import { addSubscriber } from '@/app/actions/subscribers';

export function SubscribersList({ initialSubscribers }) {
  const [optimisticSubscribers, addOptimisticSubscriber] = useOptimistic(
    initialSubscribers,
    (state, newSubscriber) => [...state, newSubscriber]
  );

  async function handleAdd(formData: FormData) {
    // Optimistic update
    addOptimisticSubscriber({
      id: 'temp-' + Date.now(),
      username: formData.get('username'),
      email: formData.get('email'),
      tier: 'free',
    });

    // Server action
    await addSubscriber(formData);
  }

  return (
    <div>
      {optimisticSubscribers.map(sub => (
        <SubscriberCard key={sub.id} subscriber={sub} />
      ))}
      <form action={handleAdd}>
        {/* form fields */}
      </form>
    </div>
  );
}
```

---

## 3️⃣ Tailwind CSS 4 - Nouvelle Config

### Configuration Simplifiée

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Design tokens */
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-danger: #ef4444;
  
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Pas besoin de tailwind.config.js !

Tailwind 4 utilise CSS-first configuration. Plus besoin de fichier JS complexe.

---

## 4️⃣ Auth.js v5 - Gestion des Risques

### Versions Épinglées

```json
// package.json
{
  "dependencies": {
    "next-auth": "5.0.0-beta.25",
    "@auth/prisma-adapter": "2.7.4"
  }
}
```

### Plan de Rollback v4

```typescript
// auth.config.ts (v5)
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // ... providers
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
```

### Rollback Plan

```bash
# Si problème avec v5, rollback vers v4
npm install next-auth@4.24.13 @next-auth/prisma-adapter@1.0.7

# Puis restaurer l'ancienne config
git checkout main -- auth.config.ts
```

### Documentation Risques

```markdown
## Auth.js v5 Risks

### Known Issues
- Beta version, peut avoir des bugs
- Breaking changes possibles
- Documentation incomplète

### Mitigation
- Versions épinglées (pas de ^)
- Tests complets avant deploy
- Rollback plan documenté
- Monitoring des erreurs auth

### Rollback Procedure
1. npm install next-auth@4.24.13
2. git checkout main -- auth.config.ts
3. Restart application
4. Verify auth flow
```

---

## 5️⃣ AWS Amplify × Next 16 - Compatibilité

### ⚠️ Attention

Amplify Gen 2 supporte officiellement Next 13.5 → 15.x pour SSR.
Next 16 peut ne pas être encore supporté.

### Options

#### Option A: Rester sur Next 15 en prod

```json
// package.json (production)
{
  "dependencies": {
    "next": "15.1.0"
  }
}
```

#### Option B: SST + OpenNext

```typescript
// sst.config.ts
import { SSTConfig } from 'sst';
import { NextjsSite } from 'sst/constructs';

export default {
  config() {
    return {
      name: 'huntaze',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new NextjsSite(stack, 'site', {
        path: '.',
        runtime: 'nodejs20.x',
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
        },
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
```

#### Option C: Amplify côté client uniquement

```typescript
// lib/amplify-client.ts
'use client';

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
  },
});
```

---

## 6️⃣ Temps Réel - SSE vs WebSocket

### SSE pour Chatbot (Recommandé)

```typescript
// app/api/chatbot/stream/route.ts
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial event
      controller.enqueue(encoder.encode('event: ready\ndata: {}\n\n'));
      
      // Stream AI tokens
      const aiStream = await generateAIResponse(request);
      
      for await (const token of aiStream) {
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`)
        );
      }
      
      controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

```typescript
// Client usage
'use client';

export function ChatInterface() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/chatbot/stream');

    eventSource.addEventListener('token', (event) => {
      const { token } = JSON.parse(event.data);
      setMessages(prev => [...prev, token]);
    });

    eventSource.addEventListener('done', () => {
      eventSource.close();
    });

    return () => eventSource.close();
  }, []);

  return <div>{messages.join('')}</div>;
}
```

### API Gateway WebSocket (Si nécessaire)

```typescript
// infra/terraform/api-gateway-websocket.tf
resource "aws_apigatewayv2_api" "websocket" {
  name                       = "huntaze-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}
```

---

## 7️⃣ Database - Prisma Accelerate

### Configuration

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Environment Variables

```env
# .env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
DIRECT_URL="postgresql://user:password@host:5432/database"
```

### Vues Matérialisées pour Analytics

```sql
-- migrations/add_analytics_views.sql
CREATE MATERIALIZED VIEW subscriber_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_subscribers,
  COUNT(*) FILTER (WHERE tier = 'premium') as premium_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  SUM(total_spent) as total_revenue
FROM subscribers
GROUP BY user_id;

CREATE INDEX idx_subscriber_analytics_user ON subscriber_analytics(user_id);

-- Refresh schedule (via cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY subscriber_analytics;
```

---

## 8️⃣ Upload Direct S3 (Pré-signé)

```typescript
// app/api/content/upload-url/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, name } = await request.json();
  const userId = session.user.id;
  const key = `${userId}/${Date.now()}-${name}`;

  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: type,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  return NextResponse.json({
    success: true,
    data: { url, key },
  });
}
```

```typescript
// Client usage
async function uploadFile(file: File) {
  // 1. Get presigned URL
  const response = await fetch('/api/content/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: file.type,
      name: file.name,
    }),
  });

  const { data } = await response.json();

  // 2. Upload directly to S3
  await fetch(data.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  // 3. Save metadata in DB
  await fetch('/api/content/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: file.name,
      type: file.type,
      url: `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${data.key}`,
      key: data.key,
    }),
  });
}
```

---

## 9️⃣ SQS FIFO avec Idempotence

```typescript
// lib/services/sqs.service.ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createHash } from 'crypto';

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION!,
});

export async function sendToQueue(payload: {
  type: string;
  data: any;
  userId: string;
}) {
  // Generate idempotency key
  const idempotencyKey = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL!,
    MessageGroupId: 'onlyfans',
    MessageDeduplicationId: idempotencyKey, // Prevents duplicates
    MessageBody: JSON.stringify(payload),
  });

  await sqsClient.send(command);
}
```

---

## 🔟 Sécurité Production

### CSP Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.huntaze.com",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### AWS Secrets Manager

```typescript
// lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION!,
});

export async function getSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({
    SecretId: secretName,
  });

  const response = await client.send(command);
  return response.SecretString!;
}

// Usage
const dbPassword = await getSecret('huntaze/database/password');
const apiKey = await getSecret('huntaze/onlyfans/api-key');
```

### Input Validation (Zod)

```typescript
// lib/validation/subscriber.ts
import { z } from 'zod';

export const createSubscriberSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  tier: z.enum(['free', 'premium', 'vip']).default('free'),
  onlyfansId: z.string().optional(),
});

// Usage in API route
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate
  const result = createSubscriberSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.errors },
      { status: 400 }
    );
  }

  // Use validated data
  const subscriber = await prisma.subscriber.create({
    data: result.data,
  });

  return NextResponse.json({ success: true, data: subscriber });
}
```

---

## 📋 Check-list Finale

### Infrastructure
- [ ] Node 20.9+ configuré
- [ ] Next 16 features adoptées
- [ ] proxy.ts implémenté
- [ ] Cache Components utilisés
- [ ] Revalidation tags configurés

### Database
- [ ] Prisma Accelerate activé
- [ ] Connection pooling configuré
- [ ] Vues matérialisées créées
- [ ] Indexes optimisés
- [ ] Backups automatiques

### Security
- [ ] CSP headers configurés
- [ ] HSTS activé
- [ ] Secrets Manager intégré
- [ ] Input validation (Zod)
- [ ] Audit logs implémentés
- [ ] PII protection

### AWS
- [ ] S3 presigned URLs
- [ ] SQS FIFO avec idempotence
- [ ] CloudWatch metrics
- [ ] API Gateway WebSocket (si nécessaire)
- [ ] Secrets rotation

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] CloudWatch alarms
- [ ] Audit logs
- [ ] User analytics

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load tests
- [ ] Security tests

---

**Version**: 2.0
**Last Updated**: 2025-01-30
**Status**: ⚠️ CRITICAL - À IMPLÉMENTER AVANT PROD
