# Design Document - Migration Base de Données Production (Beta Fermée - 50 Users)

## Overview

Ce document décrit l'architecture technique pour migrer Huntaze d'une architecture mock vers une base de données PostgreSQL RDS en production, optimisée pour supporter 50 utilisateurs réels en beta fermée avec un budget de ~$50/mois.

### Objectifs

- **Performance:** Temps de réponse <500ms pour 95% des requêtes
- **Fiabilité:** Uptime 99% (acceptable pour beta)
- **Coûts:** <$50/mois AWS
- **Scalabilité:** Support de 50 utilisateurs simultanés
- **Sécurité:** Credentials dans Secrets Manager, données chiffrées au repos

### Contraintes

- Budget limité (~$50/mois)
- Déploiement rapide (1-2 jours)
- Migration progressive (conserver mocks pour features non-critiques)
- Pas de downtime critique (maintenance windows acceptables)

## Architecture

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    50 Beta Users                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Amplify (Next.js SSR)                       │
│  • 1 instance (auto-scale si besoin)                         │
│  • API Routes: /api/auth/*, /api/users/*, /api/billing/*   │
│  • Cache: In-memory (5 min pour secrets)                    │
└────────────┬──────────────┬──────────────┬─────────────────┘
             │              │              │
             ▼              ▼              ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ RDS Postgres│  │  Secrets   │  │   Azure    │
    │ db.t3.micro │  │  Manager   │  │  OpenAI    │
    │             │  │            │  │            │
    │ • 20GB SSD  │  │ • stripe   │  │ • GPT-4o   │
    │ • 1 vCPU    │  │ • azure    │  │            │
    │ • 1GB RAM   │  │ • database │  │            │
    └────────────┘  └────────────┘  └────────────┘
```

### Flux de Données

```
User Request → Amplify → Prisma Client → PostgreSQL RDS
                  ↓
            Secrets Manager (cache 5min)
                  ↓
            Azure OpenAI (si AI request)
```

## Components and Interfaces

### 1. Prisma Client Singleton (`lib/db.ts`)

**Responsabilité:** Gérer la connexion unique à PostgreSQL avec pooling

```typescript
// lib/db.ts (déjà existant, optimisé)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient 
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Optimisations pour beta (50 users)
  connectionLimit: 10, // Max 10 connexions simultanées
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Health check optimisé
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { isHealthy: true, latency: Date.now() - start };
  } catch (error) {
    return {
      isHealthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### 2. Secrets Service (`lib/services/secrets-service.ts`)

**Responsabilité:** Récupérer et cacher les secrets AWS

```typescript
// lib/services/secrets-service.ts (NOUVEAU)
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface SecretCache {
  value: string;
  expiresAt: number;
}

class SecretsService {
  private client: SecretsManagerClient;
  private cache: Map<string, SecretCache> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      const secretValue = response.SecretString || '';

      // Cache for 5 minutes
      this.cache.set(secretName, {
        value: secretValue,
        expiresAt: Date.now() + this.cacheDuration
      });

      return secretValue;
    } catch (error) {
      console.error(`Failed to get secret ${secretName}:`, error);
      
      // Fallback to env var for local dev
      const envFallback = process.env[secretName.replace('huntaze/', '').toUpperCase()];
      if (envFallback) {
        return envFallback;
      }
      
      throw error;
    }
  }

  async getStripeKey(): Promise<string> {
    const secret = await this.getSecret('huntaze/stripe');
    const parsed = JSON.parse(secret);
    return parsed.STRIPE_SECRET_KEY;
  }

  async getAzureKey(): Promise<string> {
    const secret = await this.getSecret('huntaze/azure');
    const parsed = JSON.parse(secret);
    return parsed.AZURE_OPENAI_API_KEY;
  }
}

export const secretsService = new SecretsService();
```

### 3. User Service avec Prisma (`lib/services/simple-user-service.ts`)

**Responsabilité:** Remplacer les mocks par Prisma

```typescript
// lib/services/simple-user-service.ts (MODIFIÉ)
import { prisma } from '@/lib/db';
import { User, Subscription } from '@prisma/client';
import { sanitizeUserId } from '@/lib/utils/validation';

export class SimpleUserService {
  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return null;
    
    try {
      return await prisma.user.findUnique({
        where: { 
          id: sanitizedId,
          deletedAt: null // Soft delete check
        }
      });
    } catch (error) {
      console.error('getUserById error:', error);
      return null;
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    if (!email || typeof email !== 'string') return null;
    
    try {
      return await prisma.user.findUnique({
        where: { 
          email,
          deletedAt: null
        }
      });
    } catch (error) {
      console.error('getUserByEmail error:', error);
      return null;
    }
  }

  // Create new user
  async createUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    subscription?: Subscription;
  }): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash: userData.passwordHash,
          subscription: userData.subscription || 'FREE',
          role: 'CREATOR'
        }
      });
    } catch (error) {
      console.error('createUser error:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId: string, updateData: {
    name?: string;
    email?: string;
    avatar?: string;
    subscription?: Subscription;
  }): Promise<User | null> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return null;
    
    try {
      return await prisma.user.update({
        where: { id: sanitizedId },
        data: updateData
      });
    } catch (error) {
      console.error('updateUser error:', error);
      return null;
    }
  }

  // Soft delete user
  async deleteUser(userId: string): Promise<boolean> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return false;
    
    try {
      await prisma.user.update({
        where: { id: sanitizedId },
        data: {
          deletedAt: new Date(),
          email: `${Date.now()}.deleted@huntaze.com` // Make email unique
        }
      });
      return true;
    } catch (error) {
      console.error('deleteUser error:', error);
      return false;
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const simpleUserService = new SimpleUserService();
```

### 4. Billing Service avec Prisma (`lib/services/simple-billing-service.ts`)

**Responsabilité:** Gérer les subscriptions avec Prisma

```typescript
// lib/services/simple-billing-service.ts (MODIFIÉ)
import { prisma } from '@/lib/db';
import { SubscriptionRecord, SubscriptionStatus } from '@prisma/client';
import { secretsService } from './secrets-service';

export class SimpleBillingService {
  // Get user subscription
  async getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
    try {
      return await prisma.subscriptionRecord.findUnique({
        where: { userId }
      });
    } catch (error) {
      console.error('getUserSubscription error:', error);
      return null;
    }
  }

  // Create or update subscription (upsert)
  async upsertSubscription(data: {
    userId: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    stripeSubscriptionId?: string;
    status: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }): Promise<SubscriptionRecord> {
    try {
      return await prisma.subscriptionRecord.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          plan: data.plan,
          status: data.status,
          stripeSubscriptionId: data.stripeSubscriptionId,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd
        },
        update: {
          plan: data.plan,
          status: data.status,
          stripeSubscriptionId: data.stripeSubscriptionId,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd
        }
      });
    } catch (error) {
      console.error('upsertSubscription error:', error);
      throw error;
    }
  }

  // Get Stripe key from Secrets Manager
  async getStripeKey(): Promise<string> {
    return await secretsService.getStripeKey();
  }
}

export const simpleBillingService = new SimpleBillingService();
```

### 5. Prisma Error Handler (`lib/utils/prisma-errors.ts`)

**Responsabilité:** Mapper les erreurs Prisma aux codes HTTP

```typescript
// lib/utils/prisma-errors.ts (NOUVEAU)
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return {
          status: 409,
          message: 'Un enregistrement avec ces données existe déjà'
        };
      
      case 'P2025':
        // Record not found
        return {
          status: 404,
          message: 'Enregistrement non trouvé'
        };
      
      case 'P2003':
        // Foreign key constraint violation
        return {
          status: 400,
          message: 'Référence invalide'
        };
      
      default:
        return {
          status: 500,
          message: 'Erreur de base de données'
        };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      message: 'Service de base de données indisponible'
    };
  }

  return {
    status: 500,
    message: 'Erreur interne du serveur'
  };
}
```

### 6. Beta Invites System

**Responsabilité:** Gérer les codes d'invitation beta

```typescript
// lib/services/beta-invites-service.ts (NOUVEAU)
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export class BetaInvitesService {
  // Generate beta invite code
  generateCode(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Create beta invite
  async createInvite(email: string): Promise<{ email: string; code: string }> {
    const code = this.generateCode();
    
    await prisma.betaInvite.create({
      data: {
        email: email.toLowerCase(),
        code
      }
    });

    return { email, code };
  }

  // Validate and use invite code
  async validateAndUseCode(email: string, code: string): Promise<boolean> {
    try {
      const invite = await prisma.betaInvite.findFirst({
        where: {
          email: email.toLowerCase(),
          code: code.toUpperCase(),
          usedAt: null
        }
      });

      if (!invite) {
        return false;
      }

      // Mark as used
      await prisma.betaInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      });

      return true;
    } catch (error) {
      console.error('validateAndUseCode error:', error);
      return false;
    }
  }

  // Check if email has valid invite
  async hasValidInvite(email: string): Promise<boolean> {
    const invite = await prisma.betaInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        usedAt: null
      }
    });

    return !!invite;
  }
}

export const betaInvitesService = new BetaInvitesService();
```

## Data Models

### Schéma Prisma Complet

```prisma
// prisma/schema.prisma (MODIFIÉ)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model (existant)
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String
  avatar            String?
  passwordHash      String
  subscription      Subscription @default(FREE)
  stripeCustomerId  String?   @unique
  role              Role      @default(CREATOR)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  contentAssets     ContentAsset[]
  apiKeys           ApiKey[]
  subscriptionRecord SubscriptionRecord?
  refreshTokens     RefreshToken[]
  sessions          Session[]
  accounts          Account[]
  
  @@map("users")
}

// NextAuth models (NOUVEAU)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// Beta Invites (NOUVEAU)
model BetaInvite {
  id        String    @id @default(cuid())
  email     String
  code      String    @unique
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  
  @@index([email])
  @@map("beta_invites")
}

// Subscription Record (existant)
model SubscriptionRecord {
  id                    String    @id @default(cuid())
  userId                String    @unique
  stripeSubscriptionId  String?   @unique
  status                SubscriptionStatus @default(ACTIVE)
  plan                  Subscription
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean   @default(false)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("subscription_records")
}

// Content Asset (existant)
model ContentAsset {
  id          String      @id @default(cuid())
  userId      String
  title       String
  content     String
  type        ContentType
  category    String?
  tags        String[]
  metadata    Json?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@map("content_assets")
}

// API Key (existant)
model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  name        String
  keyHash     String    @unique
  permissions String[]
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("api_keys")
}

// Refresh Token (existant)
model RefreshToken {
  id          String    @id @default(cuid())
  userId      String
  jti         String    @unique
  tokenHash   String    @unique
  expiresAt   DateTime
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

// Enums (existants)
enum Subscription {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}

enum Role {
  CREATOR
  ADMIN
}

enum ContentType {
  POST
  STORY
  VIDEO
  IMAGE
  CAPTION
}
```

## Error Handling

### Strategy

1. **Prisma Errors:** Mapper aux codes HTTP appropriés via `prisma-errors.ts`
2. **Connection Errors:** Retourner 503 Service Unavailable
3. **Validation Errors:** Retourner 400 Bad Request
4. **Not Found:** Retourner 404 Not Found
5. **Logging:** Logger toutes les erreurs avec contexte minimal (userId, operation)

### Example API Route Error Handling

```typescript
// app/api/users/profile/route.ts (EXEMPLE)
import { NextRequest, NextResponse } from 'next/server';
import { simpleUserService } from '@/lib/services/simple-user-service';
import { handlePrismaError } from '@/lib/utils/prisma-errors';
import { requireUser } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const profile = await simpleUserService.getUserById(user.id);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
```

## Testing Strategy

### Unit Tests

- Test Prisma service methods avec mock Prisma Client
- Test error handling avec différents types d'erreurs Prisma
- Test secrets service avec mock AWS SDK

### Integration Tests

```typescript
// tests/integration/prisma-database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { simpleUserService } from '@/lib/services/simple-user-service';

describe('Prisma Database Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should create and retrieve a user', async () => {
    const user = await simpleUserService.createUser({
      email: 'test@huntaze.com',
      name: 'Test User',
      passwordHash: 'hashed_password'
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@huntaze.com');

    const retrieved = await simpleUserService.getUserById(user.id);
    expect(retrieved).toEqual(user);
  });

  it('should update user subscription', async () => {
    const user = await simpleUserService.createUser({
      email: 'test2@huntaze.com',
      name: 'Test User 2',
      passwordHash: 'hashed_password'
    });

    const updated = await simpleUserService.updateUser(user.id, {
      subscription: 'PRO'
    });

    expect(updated?.subscription).toBe('PRO');
  });
});
```

## Performance Optimization

### Database

- **Connection Pooling:** Max 10 connexions (suffisant pour 50 users)
- **Indexes:** Sur email, userId, createdAt
- **Soft Deletes:** Utiliser `deletedAt` au lieu de DELETE

### Caching

- **Secrets:** Cache 5 minutes en mémoire
- **User Sessions:** NextAuth gère le cache
- **Pas de Redis:** Trop cher pour beta, utiliser in-memory

### Monitoring

```typescript
// lib/observability/database-metrics.ts (NOUVEAU)
export async function logDatabaseMetrics() {
  const start = Date.now();
  const health = await checkDatabaseHealth();
  
  console.log({
    timestamp: new Date().toISOString(),
    database: {
      healthy: health.isHealthy,
      latency: health.latency,
      error: health.error
    }
  });
}
```

## Deployment Strategy

### Phase 1: Preparation (Jour 1 matin)

1. Créer migration Prisma pour BetaInvite et NextAuth models
2. Tester migrations localement
3. Générer 50 codes d'invitation beta
4. Mettre à jour buildspec.yml

### Phase 2: Database Setup (Jour 1 après-midi)

1. Vérifier que RDS est disponible
2. Exécuter `npx prisma migrate deploy`
3. Seed la base avec 2 utilisateurs de test
4. Valider avec `scripts/validate-database.sh`

### Phase 3: Code Migration (Jour 2 matin)

1. Déployer nouveau code avec Prisma
2. Tester les 3 API routes critiques
3. Vérifier les logs Amplify

### Phase 4: Beta Launch (Jour 2 après-midi)

1. Envoyer les 50 codes d'invitation
2. Monitorer les inscriptions
3. Surveiller les métriques (latency, errors)

## Rollback Plan

Si problème critique:

1. **Rollback Code:** Revert le commit dans Git, redéployer
2. **Rollback Database:** Restaurer snapshot RDS (perte max 1h de données)
3. **Fallback Mocks:** Réactiver les mocks temporairement

## Cost Breakdown (Beta - 50 Users)

```
RDS db.t3.micro (20GB):     $15/mois
Amplify (1 instance):       $15/mois
Secrets Manager (3 secrets): $2/mois
S3 + Data Transfer:         $8/mois
CloudWatch Logs:            $5/mois
Azure OpenAI (50 users):    $10/mois (estimation)
──────────────────────────────────
TOTAL:                      $55/mois
```

**Note:** Légèrement au-dessus du budget, mais acceptable pour beta. Optimisations possibles:
- Réduire logs CloudWatch
- Limiter appels Azure OpenAI
- Utiliser Amplify free tier si éligible

## Security Considerations

1. **Credentials:** Tous dans Secrets Manager
2. **Database:** Chiffrement au repos activé (RDS)
3. **Transport:** HTTPS uniquement
4. **Beta Access:** Système d'invitations obligatoire
5. **Rate Limiting:** Pas nécessaire pour 50 users, à ajouter si scale

## Next Steps

Après validation du design:
1. Créer le plan d'implémentation (tasks.md)
2. Générer les migrations Prisma
3. Implémenter les services
4. Tester en local
5. Déployer en production
