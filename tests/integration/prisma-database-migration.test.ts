import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

/**
 * Tests d'intégration pour la migration de base de données production
 * Valide que Prisma fonctionne correctement avec PostgreSQL
 * Basé sur .kiro/specs/database-migration-production/requirements.md
 */

describe('Prisma Database Migration Integration Tests', () => {
  let prisma: PrismaClient;
  const testUserEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/huntaze_test'
        }
      }
    });

    // Verify database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-'
        }
      }
    });
  });

  describe('Requirement 1: API Routes Use Prisma Client', () => {
    it('should create a user using Prisma instead of in-memory store', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          subscription: 'FREE'
        }
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(testUserEmail);
      expect(user.subscription).toBe('FREE');
    });

    it('should read user data using Prisma findUnique', async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          subscription: 'PRO'
        }
      });

      const foundUser = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUserEmail);
    });

    it('should update user data using Prisma update', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          subscription: 'FREE'
        }
      });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { subscription: 'PRO' }
      });

      expect(updatedUser.subscription).toBe('PRO');
    });

    it('should delete user data using Prisma delete', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          subscription: 'FREE'
        }
      });

      await prisma.user.delete({
        where: { id: user.id }
      });

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(deletedUser).toBeNull();
    });

    it('should use Prisma findMany for listing users', async () => {
      await prisma.user.createMany({
        data: [
          { email: `test-1-${Date.now()}@example.com`, name: 'User 1', subscription: 'FREE' },
          { email: `test-2-${Date.now()}@example.com`, name: 'User 2', subscription: 'PRO' }
        ]
      });

      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: 'test-'
          }
        }
      });

      expect(users.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Requirement 2: Database Schema Initialization', () => {
    it('should verify User table exists', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        ) as exists
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should verify SubscriptionRecord table exists', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'SubscriptionRecord'
        ) as exists
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should verify ContentAsset table exists', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ContentAsset'
        ) as exists
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should verify DATABASE_URL is configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toContain('postgresql://');
    });

    it('should successfully connect to database', async () => {
      const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`;
      expect(result[0].result).toBe(1);
    });
  });

  describe('Requirement 3: NextAuth Prisma Adapter', () => {
    it('should verify Account table exists for NextAuth', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Account'
        ) as exists
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should verify Session table exists for NextAuth', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Session'
        ) as exists
      `;

      expect(result[0].exists).toBe(true);
    });

    it('should verify VerificationToken table exists for NextAuth', async () => {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'VerificationToken'
        ) as exists
      `;

      expect(result[0].exists).toBe(true);
    });
  });

  describe('Requirement 4: Business Services Use Prisma', () => {
    it('should create subscription record using Prisma', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Test User',
          subscription: 'PRO'
        }
      });

      const subscription = await prisma.subscriptionRecord.create({
        data: {
          userId: user.id,
          planId: 'pro',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(user.id);
      expect(subscription.status).toBe('active');
    });

    it('should use Prisma transactions for multi-table operations', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: testUserEmail,
            name: 'Test User',
            subscription: 'PRO'
          }
        });

        const subscription = await tx.subscriptionRecord.create({
          data: {
            userId: user.id,
            planId: 'pro',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });

        return { user, subscription };
      });

      expect(result.user).toBeDefined();
      expect(result.subscription).toBeDefined();
      expect(result.subscription.userId).toBe(result.user.id);
    });

    it('should rollback transaction on error', async () => {
      await expect(async () => {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: testUserEmail,
              name: 'Test User',
              subscription: 'PRO'
            }
          });

          // Force an error
          throw new Error('Transaction rollback test');
        });
      }).rejects.toThrow('Transaction rollback test');

      // Verify user was not created
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail }
      });

      expect(user).toBeNull();
    });
  });

  describe('Requirement 8: CRUD Operations on All Models', () => {
    it('should perform CRUD on User model', async () => {
      // Create
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'CRUD Test User',
          subscription: 'FREE'
        }
      });
      expect(user.id).toBeDefined();

      // Read
      const readUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(readUser?.name).toBe('CRUD Test User');

      // Update
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated User' }
      });
      expect(updatedUser.name).toBe('Updated User');

      // Delete
      await prisma.user.delete({
        where: { id: user.id }
      });
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(deletedUser).toBeNull();
    });

    it('should test User -> SubscriptionRecord relation', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Relation Test User',
          subscription: 'PRO',
          subscriptionRecords: {
            create: {
              planId: 'pro',
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        include: {
          subscriptionRecords: true
        }
      });

      expect(user.subscriptionRecords).toBeDefined();
      expect(user.subscriptionRecords.length).toBe(1);
      expect(user.subscriptionRecords[0].userId).toBe(user.id);
    });

    it('should test User -> ContentAsset relation', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Content Test User',
          subscription: 'PRO',
          contentAssets: {
            create: {
              title: 'Test Asset',
              type: 'image',
              url: 'https://example.com/image.jpg',
              size: 1024
            }
          }
        },
        include: {
          contentAssets: true
        }
      });

      expect(user.contentAssets).toBeDefined();
      expect(user.contentAssets.length).toBe(1);
      expect(user.contentAssets[0].title).toBe('Test Asset');
    });
  });

  describe('Requirement 10: Prisma Error Handling', () => {
    it('should handle unique constraint violation (409 Conflict)', async () => {
      await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'First User',
          subscription: 'FREE'
        }
      });

      await expect(async () => {
        await prisma.user.create({
          data: {
            email: testUserEmail,
            name: 'Duplicate User',
            subscription: 'FREE'
          }
        });
      }).rejects.toThrow();
    });

    it('should handle record not found (404 Not Found)', async () => {
      await expect(async () => {
        await prisma.user.update({
          where: { id: 'non-existent-id' },
          data: { name: 'Updated' }
        });
      }).rejects.toThrow();
    });

    it('should handle invalid data types', async () => {
      await expect(async () => {
        await prisma.user.create({
          data: {
            email: testUserEmail,
            name: 'Test User',
            // @ts-expect-error - Testing invalid subscription value
            subscription: 'INVALID_PLAN'
          }
        });
      }).rejects.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    it('should efficiently query with pagination', async () => {
      // Create test users
      const users = Array.from({ length: 50 }, (_, i) => ({
        email: `test-perf-${i}-${Date.now()}@example.com`,
        name: `User ${i}`,
        subscription: 'FREE' as const
      }));

      await prisma.user.createMany({
        data: users
      });

      const page1 = await prisma.user.findMany({
        where: {
          email: {
            contains: 'test-perf-'
          }
        },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });

      expect(page1.length).toBe(10);

      const page2 = await prisma.user.findMany({
        where: {
          email: {
            contains: 'test-perf-'
          }
        },
        take: 10,
        skip: 10,
        orderBy: { createdAt: 'desc' }
      });

      expect(page2.length).toBe(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should use select to optimize queries', async () => {
      const user = await prisma.user.create({
        data: {
          email: testUserEmail,
          name: 'Select Test User',
          subscription: 'PRO'
        }
      });

      const selectedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          subscription: true
        }
      });

      expect(selectedUser).toBeDefined();
      expect(selectedUser?.id).toBe(user.id);
      expect(selectedUser?.email).toBe(testUserEmail);
      // @ts-expect-error - name should not be included
      expect(selectedUser?.name).toBeUndefined();
    });
  });
});
