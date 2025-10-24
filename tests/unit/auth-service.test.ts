import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '@/lib/services/auth-service';
import bcrypt from 'bcryptjs';

// Mock des dépendances
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    refreshToken: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }))
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mock-hash-123')
    }))
  }
});

const mockPrisma = await import('@/lib/db').then(m => m.prisma);
const mockBcrypt = bcrypt as any;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        subscription: 'pro' as const
      };

      const token = await AuthService.generateAccessToken(user);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should include correct payload in token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        subscription: 'free' as const
      };

      const token = await AuthService.generateAccessToken(user);
      
      // Décoder le payload (sans vérification pour le test)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      expect(payload.sub).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.subscription).toBe(user.subscription);
      expect(payload.iat).toBeTruthy();
      expect(payload.exp).toBeTruthy();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token and store hash', async () => {
      const userId = 'user-123';
      
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'refresh-123',
        userId,
        jti: 'mock-uuid-123',
        tokenHash: 'mock-hash-123',
        expiresAt: new Date()
      });

      const result = await AuthService.generateRefreshToken(userId);

      expect(result.token).toBeTruthy();
      expect(result.jti).toBe('mock-uuid-123');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Vérifier que les anciens tokens sont supprimés
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId }
      });

      // Vérifier que le nouveau token est stocké
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          jti: 'mock-uuid-123',
          tokenHash: 'mock-hash-123',
          expiresAt: expect.any(Date)
        }
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        subscription: 'pro' as const
      };

      const token = await AuthService.generateAccessToken(user);
      const payload = await AuthService.verifyAccessToken(token);

      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe(user.id);
      expect(payload?.email).toBe(user.email);
      expect(payload?.subscription).toBe(user.subscription);
    });

    it('should return null for invalid token', async () => {
      const payload = await AuthService.verifyAccessToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Créer un token avec une expiration dans le passé
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInN1YnNjcmlwdGlvbiI6InBybyIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
      
      const payload = await AuthService.verifyAccessToken(expiredToken);
      expect(payload).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const userId = 'user-123';
      const refreshToken = await AuthService.generateRefreshToken(userId);
      
      // Mock de la recherche du token en base
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'refresh-123',
        userId,
        jti: 'mock-uuid-123',
        tokenHash: 'mock-hash-123',
        expiresAt: new Date(Date.now() + 86400000), // +1 jour
        user: {
          id: userId,
          email: 'test@example.com',
          subscription: 'PRO',
          deletedAt: null
        }
      });

      // Mock pour le nouveau token
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'new-refresh-123',
        userId,
        jti: 'new-mock-uuid-123',
        tokenHash: 'new-mock-hash-123',
        expiresAt: new Date()
      });

      const result = await AuthService.refreshTokens(refreshToken.token);

      expect(result).toBeTruthy();
      expect(result?.accessToken).toBeTruthy();
      expect(result?.refreshToken).toBeTruthy();
      expect(result?.expiresAt).toBeInstanceOf(Date);
    });

    it('should return null for invalid refresh token', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      const result = await AuthService.refreshTokens('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for deleted user', async () => {
      const userId = 'user-123';
      const refreshToken = await AuthService.generateRefreshToken(userId);
      
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'refresh-123',
        userId,
        jti: 'mock-uuid-123',
        tokenHash: 'mock-hash-123',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: userId,
          email: 'test@example.com',
          subscription: 'PRO',
          deletedAt: new Date() // Utilisateur supprimé
        }
      });

      const result = await AuthService.refreshTokens(refreshToken.token);
      expect(result).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        name: 'Test User',
        passwordHash: hashedPassword,
        subscription: 'PRO'
      });

      mockBcrypt.compare.mockResolvedValue(true);
      
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'refresh-123',
        userId: 'user-123',
        jti: 'mock-uuid-123',
        tokenHash: 'mock-hash-123',
        expiresAt: new Date()
      });

      const result = await AuthService.signIn(email, password);

      expect(result).toBeTruthy();
      expect(result?.user.email).toBe(email);
      expect(result?.user.name).toBe('Test User');
      expect(result?.accessToken).toBeTruthy();
      expect(result?.refreshToken).toBeTruthy();
      expect(result?.expiresAt).toBeInstanceOf(Date);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await AuthService.signIn('nonexistent@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        name: 'Test User',
        passwordHash: 'hashed-password',
        subscription: 'PRO'
      });

      mockBcrypt.compare.mockResolvedValue(false);

      const result = await AuthService.signIn(email, password);
      expect(result).toBeNull();
    });

    it('should return null for deleted user', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        name: 'Test User',
        passwordHash: 'hashed-password',
        subscription: 'PRO',
        deletedAt: new Date() // Utilisateur supprimé
      });

      const result = await AuthService.signIn(email, password);
      expect(result).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should delete all refresh tokens for user', async () => {
      const userId = 'user-123';
      
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await AuthService.signOut(userId);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId }
      });
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      mockBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await AuthService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const password = 'StrongP@ssw0rd123';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password too short', () => {
      const password = 'Short1!';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 8 caractères');
    });

    it('should reject password without uppercase', () => {
      const password = 'lowercase123!';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une majuscule');
    });

    it('should reject password without lowercase', () => {
      const password = 'UPPERCASE123!';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une minuscule');
    });

    it('should reject password without number', () => {
      const password = 'NoNumbers!';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins un chiffre');
    });

    it('should reject password without special character', () => {
      const password = 'NoSpecialChar123';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins un caractère spécial');
    });

    it('should return multiple errors for weak password', () => {
      const password = 'weak';
      
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Cookie Management', () => {
    it('should set secure cookies in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockCookies = {
        set: vi.fn()
      };

      vi.mocked(require('next/headers').cookies).mockReturnValue(mockCookies);

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 86400000)
      };

      AuthService.setAuthCookies(tokens);

      expect(mockCookies.set).toHaveBeenCalledWith('access_token', 'access-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 900, // 15 minutes
        path: '/'
      });

      expect(mockCookies.set).toHaveBeenCalledWith('refresh_token', 'refresh-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: tokens.expiresAt,
        path: '/api/auth/refresh'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should clear auth cookies', () => {
      const mockCookies = {
        delete: vi.fn()
      };

      vi.mocked(require('next/headers').cookies).mockReturnValue(mockCookies);

      AuthService.clearAuthCookies();

      expect(mockCookies.delete).toHaveBeenCalledWith('access_token');
      expect(mockCookies.delete).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(AuthService.signIn(email, password)).rejects.toThrow('Database connection failed');
    });

    it('should handle JWT signing errors', async () => {
      // Mock JWT signing to fail
      const originalJWT = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const user = {
        id: 'user-123',
        email: 'test@example.com',
        subscription: 'pro' as const
      };

      await expect(AuthService.generateAccessToken(user)).rejects.toThrow();

      process.env.JWT_SECRET = originalJWT;
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete authentication flow', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      // Mock sign in
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        name: 'Test User',
        passwordHash: hashedPassword,
        subscription: 'PRO'
      });

      mockBcrypt.compare.mockResolvedValue(true);
      
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'refresh-123',
        userId: 'user-123',
        jti: 'mock-uuid-123',
        tokenHash: 'mock-hash-123',
        expiresAt: new Date(Date.now() + 86400000)
      });

      // Sign in
      const signInResult = await AuthService.signIn(email, password);
      expect(signInResult).toBeTruthy();

      // Verify access token
      const payload = await AuthService.verifyAccessToken(signInResult!.accessToken);
      expect(payload?.sub).toBe('user-123');

      // Mock refresh token flow
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'refresh-123',
        userId: 'user-123',
        jti: 'mock-uuid-123',
        tokenHash: 'mock-hash-123',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-123',
          email,
          subscription: 'PRO',
          deletedAt: null
        }
      });

      // Refresh tokens
      const refreshResult = await AuthService.refreshTokens(signInResult!.refreshToken);
      expect(refreshResult).toBeTruthy();
      expect(refreshResult?.accessToken).toBeTruthy();

      // Sign out
      await AuthService.signOut('user-123');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      });
    });
  });
});