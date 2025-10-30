import { sanitizeUserId } from '@/lib/utils/validation';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserStats {
  totalAssets: number;
  totalCampaigns: number;
  totalRevenue: number;
  engagementRate: number;
  lastLoginAt?: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  subscription?: 'free' | 'pro' | 'enterprise';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  avatar?: string;
  subscription?: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  isActive?: boolean;
}

// Mock database for demonstration
const mockUsers: Map<string, User> = new Map();
const mockUserStats: Map<string, UserStats> = new Map();

// Initialize with some test data
mockUsers.set('user-1', {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  subscription: 'free',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

mockUserStats.set('user-1', {
  totalAssets: 10,
  totalCampaigns: 3,
  totalRevenue: 1500,
  engagementRate: 0.85,
  lastLoginAt: new Date(),
});

export class SimpleUserService {
  // Get user by ID with relations
  async getUserById(userId: string, includeRelations = false): Promise<User | null> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return null;
    
    const user = mockUsers.get(sanitizedId);
    if (!user || user.deletedAt) return null;
    
    return { ...user };
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    if (!email || typeof email !== 'string') return null;
    
    for (const user of mockUsers.values()) {
      if (user.email === email && !user.deletedAt) {
        return { ...user };
      }
    }
    
    return null;
  }

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const user: User = {
      id: userId,
      email: userData.email,
      name: userData.name,
      subscription: userData.subscription || 'free',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockUsers.set(userId, user);
    
    // Initialize stats
    mockUserStats.set(userId, {
      totalAssets: 0,
      totalCampaigns: 0,
      totalRevenue: 0,
      engagementRate: 0,
    });
    
    return { ...user };
  }

  // Update user
  async updateUser(userId: string, updateData: UpdateUserData): Promise<User | null> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return null;
    
    const user = mockUsers.get(sanitizedId);
    if (!user || user.deletedAt) return null;
    
    const updatedUser: User = {
      ...user,
      ...updateData,
      updatedAt: new Date(),
    };
    
    mockUsers.set(sanitizedId, updatedUser);
    return { ...updatedUser };
  }

  // Soft delete user
  async deleteUser(userId: string): Promise<boolean> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return false;
    
    const user = mockUsers.get(sanitizedId);
    if (!user || user.deletedAt) return false;
    
    // Soft delete by setting deletedAt
    const deletedUser: User = {
      ...user,
      deletedAt: new Date(),
      updatedAt: new Date(),
      // Make email unique for soft-deleted users
      email: `${user.email}.deleted.${Date.now()}`,
    };
    
    mockUsers.set(sanitizedId, deletedUser);
    return true;
  }

  // Update user subscription with upsert
  async updateUserSubscription(
    userId: string, 
    subscription: 'free' | 'pro' | 'enterprise',
    stripeCustomerId?: string
  ): Promise<User | null> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return null;
    
    let user = mockUsers.get(sanitizedId);
    
    if (!user) {
      // Create user if doesn't exist (upsert behavior)
      user = {
        id: sanitizedId,
        email: `user-${sanitizedId}@example.com`,
        name: `User ${sanitizedId}`,
        subscription: 'free',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    if (user.deletedAt) return null;
    
    const updatedUser: User = {
      ...user,
      subscription,
      stripeCustomerId,
      updatedAt: new Date(),
    };
    
    mockUsers.set(sanitizedId, updatedUser);
    return { ...updatedUser };
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats | null> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return null;
    
    const user = mockUsers.get(sanitizedId);
    if (!user || user.deletedAt) return null;
    
    const stats = mockUserStats.get(sanitizedId);
    return stats ? { ...stats } : null;
  }

  // Validate user access with hierarchical permissions
  async validateUserAccess(
    userId: string, 
    requiredLevel: 'free' | 'pro' | 'enterprise'
  ): Promise<boolean> {
    const sanitizedId = sanitizeUserId(userId);
    if (!sanitizedId) return false;
    
    const user = mockUsers.get(sanitizedId);
    if (!user || user.deletedAt || !user.isActive) return false;
    
    const subscriptionLevels = {
      'free': 0,
      'pro': 1,
      'enterprise': 2
    };
    
    const userLevel = subscriptionLevels[user.subscription];
    const requiredLevelValue = subscriptionLevels[requiredLevel];
    
    return userLevel >= requiredLevelValue;
  }

  // List users with pagination
  async listUsers(options: {
    page?: number;
    limit?: number;
    subscription?: 'free' | 'pro' | 'enterprise';
    isActive?: boolean;
  } = {}): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, subscription, isActive } = options;
    
    let users = Array.from(mockUsers.values()).filter(user => !user.deletedAt);
    
    // Apply filters
    if (subscription) {
      users = users.filter(user => user.subscription === subscription);
    }
    
    if (isActive !== undefined) {
      users = users.filter(user => user.isActive === isActive);
    }
    
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);
    
    return {
      users: paginatedUsers.map(user => ({ ...user })),
      total,
      page,
      limit
    };
  }

  // Bulk operations
  async bulkUpdateUsers(
    userIds: string[], 
    updateData: Partial<UpdateUserData>
  ): Promise<{ updated: User[]; failed: string[] }> {
    const updated: User[] = [];
    const failed: string[] = [];
    
    for (const userId of userIds) {
      try {
        const user = await this.updateUser(userId, updateData);
        if (user) {
          updated.push(user);
        } else {
          failed.push(userId);
        }
      } catch (error) {
        failed.push(userId);
      }
    }
    
    return { updated, failed };
  }

  // Search users
  async searchUsers(query: string, options: {
    limit?: number;
    fields?: ('name' | 'email')[];
  } = {}): Promise<User[]> {
    const { limit = 10, fields = ['name', 'email'] } = options;
    
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    const users = Array.from(mockUsers.values())
      .filter(user => !user.deletedAt)
      .filter(user => {
        return fields.some(field => {
          const value = user[field];
          return value && value.toLowerCase().includes(searchTerm);
        });
      })
      .slice(0, limit);
    
    return users.map(user => ({ ...user }));
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check - verify we can access the mock data
      return mockUsers.size >= 0;
    } catch (error) {
      return false;
    }
  }

  // Get service metrics
  async getMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    subscriptionBreakdown: Record<string, number>;
  }> {
    const users = Array.from(mockUsers.values()).filter(user => !user.deletedAt);
    
    const subscriptionBreakdown = users.reduce((acc, user) => {
      acc[user.subscription] = (acc[user.subscription] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      subscriptionBreakdown
    };
  }
}

// Export singleton instance
export const simpleUserService = new SimpleUserService();
export default simpleUserService;