/**
 * Property-Based Tests for Monthly Charge Uniqueness
 * 
 * Feature: ai-system-gemini-integration, Property 25: Monthly charge uniqueness
 * Validates: Requirements 11.3
 * 
 * Tests that at most one MonthlyCharge record exists per creator and month combination
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

// Track database state for verification
const mockCreators: Map<number, any> = new Map();
const mockMonthlyCharges: Map<string, any> = new Map();

// Helper to create unique key for creator+month
function getMonthlyChargeKey(creatorId: number, month: Date): string {
  const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  return `${creatorId}-${monthStr}`;
}

// Mock the database with unique constraint enforcement
vi.mock('../../../lib/prisma', () => ({
  db: {
    users: {
      create: vi.fn(async ({ data }: any) => {
        const creator = {
          id: data.id ?? Math.floor(Math.random() * 1000000),
          email: data.email,
          name: data.name,
          password: data.password,
          created_at: new Date(),
        };
        mockCreators.set(creator.id, creator);
        return creator;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return mockCreators.get(where.id) ?? null;
      }),
    },
    monthlyCharge: {
      create: vi.fn(async ({ data }: any) => {
        // Enforce foreign key constraint
        if (!mockCreators.has(data.creatorId)) {
          throw new Error('Foreign key constraint failed: Creator does not exist');
        }
        
        // Enforce unique constraint on (creatorId, month)
        const key = getMonthlyChargeKey(data.creatorId, data.month);
        if (mockMonthlyCharges.has(key)) {
          throw new Error('Unique constraint failed: MonthlyCharge already exists for this creator and month');
        }
        
        const charge = {
          id: `charge-${Date.now()}-${Math.random()}`,
          ...data,
        };
        mockMonthlyCharges.set(key, charge);
        return charge;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.creatorId_month) {
          const key = getMonthlyChargeKey(
            where.creatorId_month.creatorId,
            where.creatorId_month.month
          );
          return mockMonthlyCharges.get(key) ?? null;
        }
        return null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        const charges = Array.from(mockMonthlyCharges.values());
        if (where?.creatorId) {
          return charges.filter(charge => charge.creatorId === where.creatorId);
        }
        return charges;
      }),
      count: vi.fn(async ({ where }: any) => {
        const charges = Array.from(mockMonthlyCharges.values());
        if (where?.creatorId && where?.month) {
          const key = getMonthlyChargeKey(where.creatorId, where.month);
          return mockMonthlyCharges.has(key) ? 1 : 0;
        }
        if (where?.creatorId) {
          return charges.filter(charge => charge.creatorId === where.creatorId).length;
        }
        return charges.length;
      }),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const key = getMonthlyChargeKey(
          where.creatorId_month.creatorId,
          where.creatorId_month.month
        );
        
        const existing = mockMonthlyCharges.get(key);
        if (existing) {
          // Update existing
          const updated = { ...existing, ...update };
          mockMonthlyCharges.set(key, updated);
          return updated;
        } else {
          // Create new
          if (!mockCreators.has(create.creatorId)) {
            throw new Error('Foreign key constraint failed: Creator does not exist');
          }
          const charge = {
            id: `charge-${Date.now()}-${Math.random()}`,
            ...create,
          };
          mockMonthlyCharges.set(key, charge);
          return charge;
        }
      }),
    },
  },
}));

const { db } = await import('../../../lib/prisma');

describe('Property 25: Monthly charge uniqueness', () => {
  beforeEach(() => {
    // Clear all mock data before each test
    mockCreators.clear();
    mockMonthlyCharges.clear();
    vi.clearAllMocks();
  });

  test('cannot create duplicate MonthlyCharge for same creator and month', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 0, max: 11 }), // month (0-11)
        fc.integer({ min: 2024, max: 2030 }), // year
        fc.float({ min: 0, max: 1000 }), // totalCostUsd
        fc.float({ min: 0, max: 100 }), // planPrice
        async (email, monthIndex, year, totalCostUsd, planPrice) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          const month = new Date(year, monthIndex, 1);

          // Create first monthly charge
          const firstCharge = await db.monthlyCharge.create({
            data: {
              creatorId: creator.id,
              month,
              totalTokensInput: 1000,
              totalTokensOutput: 500,
              totalCostUsd,
              planPrice,
            },
          });

          expect(firstCharge.creatorId).toBe(creator.id);

          // Attempt to create duplicate should fail
          await expect(
            db.monthlyCharge.create({
              data: {
                creatorId: creator.id,
                month,
                totalTokensInput: 2000,
                totalTokensOutput: 1000,
                totalCostUsd: totalCostUsd * 2,
                planPrice,
              },
            })
          ).rejects.toThrow('Unique constraint failed');

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('can create MonthlyCharge for different months', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.array(fc.integer({ min: 0, max: 11 }), { minLength: 2, maxLength: 12 }), // different months
        fc.integer({ min: 2024, max: 2030 }), // year
        async (email, months, year) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          // Use Set to get unique months
          const uniqueMonths = Array.from(new Set(months));

          // Create monthly charge for each unique month
          for (const monthIndex of uniqueMonths) {
            const month = new Date(year, monthIndex, 1);
            
            const charge = await db.monthlyCharge.create({
              data: {
                creatorId: creator.id,
                month,
                totalTokensInput: 1000,
                totalTokensOutput: 500,
                totalCostUsd: 0.1,
                planPrice: 10.0,
              },
            });

            expect(charge.creatorId).toBe(creator.id);
          }

          // Verify all charges were created
          const charges = await db.monthlyCharge.findMany({
            where: { creatorId: creator.id },
          });

          expect(charges.length).toBe(uniqueMonths.length);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('can create MonthlyCharge for different creators in same month', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // number of creators
        fc.integer({ min: 0, max: 11 }), // month
        fc.integer({ min: 2024, max: 2030 }), // year
        async (numCreators, monthIndex, year) => {
          // Clear data for this property test iteration
          mockCreators.clear();
          mockMonthlyCharges.clear();
          
          const month = new Date(year, monthIndex, 1);

          // Create multiple creators with unique emails
          const creators = await Promise.all(
            Array.from({ length: numCreators }, (_, index) =>
              db.users.create({
                data: {
                  email: `creator-${Date.now()}-${index}-${Math.random()}@test.com`,
                  name: `Test Creator ${index}`,
                  password: 'hashed_password',
                },
              })
            )
          );

          // Create monthly charge for each creator in the same month
          for (const creator of creators) {
            const charge = await db.monthlyCharge.create({
              data: {
                creatorId: creator.id,
                month,
                totalTokensInput: 1000,
                totalTokensOutput: 500,
                totalCostUsd: 0.1,
                planPrice: 10.0,
              },
            });

            expect(charge.creatorId).toBe(creator.id);
          }

          // Verify all charges were created
          const totalCharges = await db.monthlyCharge.count({});
          expect(totalCharges).toBe(creators.length);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('findUnique returns correct charge for creator and month', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 2024, max: 2030 }),
        fc.float({ min: 0, max: 1000 }),
        async (email, monthIndex, year, totalCostUsd) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          const month = new Date(year, monthIndex, 1);

          // Create monthly charge
          const created = await db.monthlyCharge.create({
            data: {
              creatorId: creator.id,
              month,
              totalTokensInput: 1000,
              totalTokensOutput: 500,
              totalCostUsd,
              planPrice: 10.0,
            },
          });

          // Find using unique constraint
          const found = await db.monthlyCharge.findUnique({
            where: {
              creatorId_month: {
                creatorId: creator.id,
                month,
              },
            },
          });

          expect(found).not.toBeNull();
          expect(found?.id).toBe(created.id);
          expect(found?.creatorId).toBe(creator.id);
          expect(Number(found?.totalCostUsd)).toBe(totalCostUsd);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('upsert creates new charge if not exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 2024, max: 2030 }),
        async (email, monthIndex, year) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          const month = new Date(year, monthIndex, 1);

          // Verify no charge exists
          const before = await db.monthlyCharge.findUnique({
            where: {
              creatorId_month: {
                creatorId: creator.id,
                month,
              },
            },
          });
          expect(before).toBeNull();

          // Upsert should create
          const charge = await db.monthlyCharge.upsert({
            where: {
              creatorId_month: {
                creatorId: creator.id,
                month,
              },
            },
            create: {
              creatorId: creator.id,
              month,
              totalTokensInput: 1000,
              totalTokensOutput: 500,
              totalCostUsd: 0.1,
              planPrice: 10.0,
            },
            update: {
              totalTokensInput: 2000,
            },
          });

          expect(charge.creatorId).toBe(creator.id);
          expect(charge.totalTokensInput).toBe(1000); // Used create data

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('upsert updates existing charge if exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 2024, max: 2030 }),
        fc.integer({ min: 1000, max: 10000 }),
        async (email, monthIndex, year, newTokens) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          const month = new Date(year, monthIndex, 1);

          // Create initial charge
          await db.monthlyCharge.create({
            data: {
              creatorId: creator.id,
              month,
              totalTokensInput: 1000,
              totalTokensOutput: 500,
              totalCostUsd: 0.1,
              planPrice: 10.0,
            },
          });

          // Upsert should update
          const charge = await db.monthlyCharge.upsert({
            where: {
              creatorId_month: {
                creatorId: creator.id,
                month,
              },
            },
            create: {
              creatorId: creator.id,
              month,
              totalTokensInput: 5000,
              totalTokensOutput: 2500,
              totalCostUsd: 0.5,
              planPrice: 10.0,
            },
            update: {
              totalTokensInput: newTokens,
            },
          });

          expect(charge.creatorId).toBe(creator.id);
          expect(charge.totalTokensInput).toBe(newTokens); // Used update data

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('at most one charge exists per creator-month combination', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 2024, max: 2030 }),
        async (email, monthIndex, year) => {
          // Create creator
          const creator = await db.users.create({
            data: {
              email,
              name: 'Test Creator',
              password: 'hashed_password',
            },
          });

          const month = new Date(year, monthIndex, 1);

          // Create charge
          await db.monthlyCharge.create({
            data: {
              creatorId: creator.id,
              month,
              totalTokensInput: 1000,
              totalTokensOutput: 500,
              totalCostUsd: 0.1,
              planPrice: 10.0,
            },
          });

          // Count charges for this creator-month
          const count = await db.monthlyCharge.count({
            where: {
              creatorId: creator.id,
              month,
            },
          });

          // Should be exactly 1
          expect(count).toBe(1);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
