import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests pour le service utilisateur simplifié
 * Basé sur l'architecture simplifiée dans ARCHITECTURE_SIMPLIFIED.md
 */

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  }
};

// Mock du service utilisateur simplifié
class SimpleUserService {
  private prisma = mockPrisma;

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { 
        subscriptionRecord: true,
        contentAssets: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateUser(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId, deletedAt: null },
      data,
      include: { 
        subscriptionRecord: true 
      }
    });
  }

  async deleteUser(userId: string): Promise<void> {
    // Soft delete pour préserver l'intégrité des données
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${userId}@deleted.com` // Éviter les conflits d'email
      }
    });
  }

  async createUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    subscription?: 'FREE' | 'PRO' | 'ENTERPRISE';
    role?: 'CREATOR' | 'ADMIN';
  }) {
    return this.prisma.user.create({
      data: {
        ...userData,
        subscription: userData.subscription || 'FREE',
        role: userData.role || 'CREATOR',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        subscriptionRecord: true
      }
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: { subscriptionRecord: true }
    });
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    subscription: 'FREE' | 'PRO' | 'ENTERPRISE';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId, deletedAt: null },
      data: {
        subscription: subscriptionData.subscription,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        subscriptionRecord: {
          upsert: {
            create: {
              plan: subscriptionData.subscription,
              status: 'ACTIVE',
              stripeSubscriptionId: subscriptionData.stripeSubscriptionId
            },
            update: {
              plan: subscriptionData.subscription,
              stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
              updatedAt: new Date()
            }
          }
        }
      },
      include: { subscriptionRecord: true }
    });
  }

  async getUserStats(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    return {
      totalContent: user.contentAssets?.length || 0,
      subscription: user.subscription,
      memberSince: user.createdAt,
      lastActive: user.updatedAt,
      hasActiveSubscription: user.subscriptionRecord?.status === 'ACTIVE'
    };
  }

  async validateUserAccess(userId: string, requiredSubscription?: 'FREE' | 'PRO' | 'ENTERPRISE') {
    const user = await this.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (requiredSubscription) {
      const subscriptionHierarchy = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
      const userLevel = subscriptionHierarchy[user.subscription as keyof typeof subscriptionHierarchy];
      const requiredLevel = subscriptionHierarchy[requiredSubscription];

      if (userLevel < requiredLevel) {
        throw new Error(`Requires ${requiredSubscription} subscription`);
      }
    }

    return user;
  }
}

describe('SimpleUserService', () => {
  let userService: SimpleUserService;
  
  const mockUser = {
    id: 'user-123',
    email: 'creator@example.com',
    name: 'John Creator',
    passwordHash: 'hashed_password',
    subscription: 'PRO',
    stripeCustomerId: 'cus_stripe123',
    role: 'CREATOR',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    deletedAt: null,
    subscriptionRecord: {
      id: 'sub-record-123',
      plan: 'PRO',
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_stripe123'
    },
    contentAssets: [
      { id: 'content-1', title: 'Test Content 1', createdAt: new Date() },
      { id: 'content-2', title: 'Test Content 2', createdAt: new Date() }
    ]
  };

  beforeEach(() => {
    userService = new SimpleUserService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserById', () => {
    it('should get user by ID with related data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
        include: {
          subscriptionRecord: true,
          contentAssets: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById('invalid-user');

      expect(result).toBeNull();
    });

    it('should exclude soft-deleted users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userService.getUserById('deleted-user');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'deleted-user', deletedAt: null },
        include: expect.any(Object)
      });
    });

    it('should limit content assets to 10 most recent', async () => {
      await userService.getUserById('user-123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            contentAssets: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          })
        })
      );
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const updateData = { name: 'Updated Name', avatar: 'new-avatar.jpg' };
      const updatedUser = { ...mockUser, ...updateData };
      
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user-123', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
        data: updateData,
        include: { subscriptionRecord: true }
      });
    });

    it('should not update deleted users', async () => {
      const updateData = { name: 'Updated Name' };

      await userService.updateUser('user-123', updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
        data: updateData,
        include: { subscriptionRecord: true }
      });
    });

    it('should handle update errors gracefully', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        userService.updateUser('user-123', { name: 'New Name' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteUser', () => {
    it('should perform soft delete', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      mockPrisma.user.update.mockResolvedValue({});

      await userService.deleteUser('user-123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          deletedAt: mockDate,
          email: `deleted_${mockDate.getTime()}_user-123@deleted.com`
        }
      });

      vi.useRealTimers();
    });

    it('should handle deletion errors', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Deletion failed'));

      await expect(
        userService.deleteUser('user-123')
      ).rejects.toThrow('Deletion failed');
    });

    it('should generate unique deleted email to avoid conflicts', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(mockDate);

      mockPrisma.user.update.mockResolvedValue({});

      await userService.deleteUser('user-123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: `deleted_${mockDate.getTime()}_user-123@deleted.com`
          })
        })
      );

      vi.useRealTimers();
    });
  });

  describe('createUser', () => {
    it('should create user with default values', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        passwordHash: 'hashed_password'
      };

      const createdUser = {
        id: 'new-user-123',
        ...userData,
        subscription: 'FREE',
        role: 'CREATOR',
        createdAt: new Date(),
        updatedAt: new Date(),
        subscriptionRecord: null
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          subscription: 'FREE',
          role: 'CREATOR',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        },
        include: { subscriptionRecord: true }
      });
    });

    it('should create user with custom subscription and role', async () => {
      const userData = {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: 'hashed_password',
        subscription: 'ENTERPRISE' as const,
        role: 'ADMIN' as const
      };

      mockPrisma.user.create.mockResolvedValue({ id: 'admin-123', ...userData });

      await userService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subscription: 'ENTERPRISE',
          role: 'ADMIN'
        }),
        include: { subscriptionRecord: true }
      });
    });

    it('should handle creation errors', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Duplicate User',
        passwordHash: 'hashed_password'
      };

      mockPrisma.user.create.mockRejectedValue(new Error('Email already exists'));

      await expect(
        userService.createUser(userData)
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('creator@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'creator@example.com', deletedAt: null },
        include: { subscriptionRecord: true }
      });
    });

    it('should return null for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should exclude soft-deleted users by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userService.getUserByEmail('deleted@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'deleted@example.com', deletedAt: null },
        include: { subscriptionRecord: true }
      });
    });
  });

  describe('updateUserSubscription', () => {
    it('should update user subscription with upsert', async () => {
      const subscriptionData = {
        subscription: 'PRO' as const,
        stripeCustomerId: 'cus_new123',
        stripeSubscriptionId: 'sub_new123'
      };

      const updatedUser = {
        ...mockUser,
        ...subscriptionData
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUserSubscription('user-123', subscriptionData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
        data: {
          subscription: 'PRO',
          stripeCustomerId: 'cus_new123',
          subscriptionRecord: {
            upsert: {
              create: {
                plan: 'PRO',
                status: 'ACTIVE',
                stripeSubscriptionId: 'sub_new123'
              },
              update: {
                plan: 'PRO',
                stripeSubscriptionId: 'sub_new123',
                updatedAt: expect.any(Date)
              }
            }
          }
        },
        include: { subscriptionRecord: true }
      });
    });

    it('should handle subscription update without Stripe data', async () => {
      const subscriptionData = {
        subscription: 'FREE' as const
      };

      await userService.updateUserSubscription('user-123', subscriptionData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscription: 'FREE',
            stripeCustomerId: undefined,
            subscriptionRecord: expect.objectContaining({
              upsert: expect.objectContaining({
                create: expect.objectContaining({
                  plan: 'FREE',
                  stripeSubscriptionId: undefined
                })
              })
            })
          })
        })
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const stats = await userService.getUserStats('user-123');

      expect(stats).toEqual({
        totalContent: 2,
        subscription: 'PRO',
        memberSince: new Date('2024-01-01'),
        lastActive: new Date('2024-01-15'),
        hasActiveSubscription: true
      });
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const stats = await userService.getUserStats('invalid-user');

      expect(stats).toBeNull();
    });

    it('should handle user without content assets', async () => {
      const userWithoutContent = {
        ...mockUser,
        contentAssets: []
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutContent);

      const stats = await userService.getUserStats('user-123');

      expect(stats?.totalContent).toBe(0);
    });

    it('should detect inactive subscription', async () => {
      const userWithInactiveSubscription = {
        ...mockUser,
        subscriptionRecord: {
          ...mockUser.subscriptionRecord,
          status: 'CANCELED'
        }
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithInactiveSubscription);

      const stats = await userService.getUserStats('user-123');

      expect(stats?.hasActiveSubscription).toBe(false);
    });
  });

  describe('validateUserAccess', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should validate user access without subscription requirement', async () => {
      const result = await userService.validateUserAccess('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should validate user access with matching subscription', async () => {
      const result = await userService.validateUserAccess('user-123', 'PRO');

      expect(result).toEqual(mockUser);
    });

    it('should validate user access with lower subscription requirement', async () => {
      const result = await userService.validateUserAccess('user-123', 'FREE');

      expect(result).toEqual(mockUser);
    });

    it('should throw error for insufficient subscription', async () => {
      await expect(
        userService.validateUserAccess('user-123', 'ENTERPRISE')
      ).rejects.toThrow('Requires ENTERPRISE subscription');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.validateUserAccess('invalid-user')
      ).rejects.toThrow('User not found');
    });

    it('should validate subscription hierarchy correctly', async () => {
      // Test FREE user
      const freeUser = { ...mockUser, subscription: 'FREE' };
      mockPrisma.user.findUnique.mockResolvedValue(freeUser);

      await expect(
        userService.validateUserAccess('user-123', 'PRO')
      ).rejects.toThrow('Requires PRO subscription');

      // Test ENTERPRISE user
      const enterpriseUser = { ...mockUser, subscription: 'ENTERPRISE' };
      mockPrisma.user.findUnique.mockResolvedValue(enterpriseUser);

      const result = await userService.validateUserAccess('user-123', 'PRO');
      expect(result).toEqual(enterpriseUser);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        userService.getUserById('user-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent user updates', async () => {
      const concurrentError = new Error('Record updated by another process');
      mockPrisma.user.update.mockRejectedValue(concurrentError);

      await expect(
        userService.updateUser('user-123', { name: 'New Name' })
      ).rejects.toThrow('Record updated by another process');
    });

    it('should handle invalid subscription values', async () => {
      const invalidSubscriptionData = {
        subscription: 'INVALID' as any,
        stripeCustomerId: 'cus_123'
      };

      // Le service devrait rejeter les valeurs invalides
      await expect(
        userService.updateUserSubscription('user-123', invalidSubscriptionData)
      ).rejects.toThrow();
    });

    it('should handle null/undefined user data gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const stats = await userService.getUserStats('user-123');
      expect(stats).toBeNull();

      await expect(
        userService.validateUserAccess('user-123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('Data Isolation', () => {
    it('should always filter by deletedAt: null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await userService.getUserById('user-123');
      await userService.getUserByEmail('test@example.com');
      await userService.updateUser('user-123', { name: 'Test' });

      // Vérifier que toutes les requêtes filtrent les utilisateurs supprimés
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null })
        })
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null })
        })
      );
    });

    it('should ensure user data isolation in all operations', async () => {
      const userId = 'user-123';

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await userService.getUserById(userId);
      await userService.updateUser(userId, { name: 'Test' });
      await userService.deleteUser(userId);
      await userService.getUserStats(userId);
      await userService.validateUserAccess(userId);

      // Vérifier que toutes les opérations utilisent l'ID utilisateur correct
      const calls = mockPrisma.user.findUnique.mock.calls.concat(
        mockPrisma.user.update.mock.calls
      );

      calls.forEach(call => {
        expect(call[0].where.id).toBe(userId);
      });
    });
  });
});