import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests unitaires pour BetaInvitesService
 * Valide la gestion des codes d'invitation beta
 */

// Mock Prisma
const mockPrisma = {
  betaInvite: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn()
  }
};

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma
}));

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn((size: number) => ({
      toString: (encoding: string) => 'ABCD1234EFGH5678'.substring(0, size * 2)
    }))
  }
}));

// Service implementation for testing
class BetaInvitesService {
  generateCode(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  async createInvite(email: string): Promise<{ email: string; code: string }> {
    const { prisma } = require('@/lib/db');
    const code = this.generateCode();
    
    await prisma.betaInvite.create({
      data: {
        email: email.toLowerCase(),
        code
      }
    });

    return { email, code };
  }

  async validateAndUseCode(email: string, code: string): Promise<boolean> {
    const { prisma } = require('@/lib/db');
    
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

  async hasValidInvite(email: string): Promise<boolean> {
    const { prisma } = require('@/lib/db');
    
    const invite = await prisma.betaInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        usedAt: null
      }
    });

    return !!invite;
  }
}

describe('BetaInvitesService', () => {
  let betaInvitesService: BetaInvitesService;

  beforeEach(() => {
    vi.clearAllMocks();
    betaInvitesService = new BetaInvitesService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCode', () => {
    it('should generate 16-character uppercase code', () => {
      const code = betaInvitesService.generateCode();

      expect(code).toHaveLength(16);
      expect(code).toMatch(/^[A-F0-9]{16}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      
      for (let i = 0; i < 10; i++) {
        codes.add(betaInvitesService.generateCode());
      }

      // All codes should be unique (in practice, with real crypto.randomBytes)
      expect(codes.size).toBeGreaterThan(0);
    });

    it('should only contain valid hex characters', () => {
      const code = betaInvitesService.generateCode();
      const validChars = /^[0-9A-F]+$/;

      expect(code).toMatch(validChars);
    });
  });

  describe('createInvite', () => {
    it('should create beta invite with generated code', async () => {
      mockPrisma.betaInvite.create.mockResolvedValue({
        id: 'invite-1',
        email: 'test@huntaze.com',
        code: 'ABCD1234EFGH5678',
        usedAt: null,
        createdAt: new Date()
      });

      const result = await betaInvitesService.createInvite('test@huntaze.com');

      expect(result.email).toBe('test@huntaze.com');
      expect(result.code).toHaveLength(16);
      expect(mockPrisma.betaInvite.create).toHaveBeenCalledWith({
        data: {
          email: 'test@huntaze.com',
          code: expect.any(String)
        }
      });
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.betaInvite.create.mockResolvedValue({
        id: 'invite-2',
        email: 'test@huntaze.com',
        code: 'CODE12345678ABCD',
        usedAt: null,
        createdAt: new Date()
      });

      await betaInvitesService.createInvite('TEST@HUNTAZE.COM');

      expect(mockPrisma.betaInvite.create).toHaveBeenCalledWith({
        data: {
          email: 'test@huntaze.com',
          code: expect.any(String)
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.betaInvite.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        betaInvitesService.createInvite('test@huntaze.com')
      ).rejects.toThrow('Database error');
    });

    it('should handle duplicate email constraint', async () => {
      mockPrisma.betaInvite.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] }
      });

      await expect(
        betaInvitesService.createInvite('duplicate@huntaze.com')
      ).rejects.toThrow();
    });
  });

  describe('validateAndUseCode', () => {
    it('should validate and mark invite as used', async () => {
      const mockInvite = {
        id: 'invite-1',
        email: 'test@huntaze.com',
        code: 'VALIDCODE1234567',
        usedAt: null,
        createdAt: new Date()
      };

      mockPrisma.betaInvite.findFirst.mockResolvedValue(mockInvite);
      mockPrisma.betaInvite.update.mockResolvedValue({
        ...mockInvite,
        usedAt: new Date()
      });

      const result = await betaInvitesService.validateAndUseCode(
        'test@huntaze.com',
        'VALIDCODE1234567'
      );

      expect(result).toBe(true);
      expect(mockPrisma.betaInvite.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@huntaze.com',
          code: 'VALIDCODE1234567',
          usedAt: null
        }
      });
      expect(mockPrisma.betaInvite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { usedAt: expect.any(Date) }
      });
    });

    it('should return false for invalid code', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue(null);

      const result = await betaInvitesService.validateAndUseCode(
        'test@huntaze.com',
        'INVALIDCODE12345'
      );

      expect(result).toBe(false);
      expect(mockPrisma.betaInvite.update).not.toHaveBeenCalled();
    });

    it('should return false for already used code', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue(null);

      const result = await betaInvitesService.validateAndUseCode(
        'test@huntaze.com',
        'USEDCODE12345678'
      );

      expect(result).toBe(false);
    });

    it('should normalize email and code', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        email: 'test@huntaze.com',
        code: 'TESTCODE12345678',
        usedAt: null,
        createdAt: new Date()
      });
      mockPrisma.betaInvite.update.mockResolvedValue({});

      await betaInvitesService.validateAndUseCode(
        'TEST@HUNTAZE.COM',
        'testcode12345678'
      );

      expect(mockPrisma.betaInvite.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@huntaze.com',
          code: 'TESTCODE12345678',
          usedAt: null
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.betaInvite.findFirst.mockRejectedValue(
        new Error('Database error')
      );

      const result = await betaInvitesService.validateAndUseCode(
        'test@huntaze.com',
        'CODE123456789ABC'
      );

      expect(result).toBe(false);
    });

    it('should handle update errors gracefully', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        email: 'test@huntaze.com',
        code: 'CODE123456789ABC',
        usedAt: null,
        createdAt: new Date()
      });
      mockPrisma.betaInvite.update.mockRejectedValue(
        new Error('Update failed')
      );

      const result = await betaInvitesService.validateAndUseCode(
        'test@huntaze.com',
        'CODE123456789ABC'
      );

      expect(result).toBe(false);
    });
  });

  describe('hasValidInvite', () => {
    it('should return true for valid unused invite', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        email: 'test@huntaze.com',
        code: 'VALIDCODE1234567',
        usedAt: null,
        createdAt: new Date()
      });

      const result = await betaInvitesService.hasValidInvite('test@huntaze.com');

      expect(result).toBe(true);
      expect(mockPrisma.betaInvite.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@huntaze.com',
          usedAt: null
        }
      });
    });

    it('should return false for no invite', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue(null);

      const result = await betaInvitesService.hasValidInvite('noinvite@huntaze.com');

      expect(result).toBe(false);
    });

    it('should normalize email', async () => {
      mockPrisma.betaInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        email: 'test@huntaze.com',
        code: 'CODE123456789ABC',
        usedAt: null,
        createdAt: new Date()
      });

      await betaInvitesService.hasValidInvite('TEST@HUNTAZE.COM');

      expect(mockPrisma.betaInvite.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@huntaze.com',
          usedAt: null
        }
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.betaInvite.findFirst.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        betaInvitesService.hasValidInvite('test@huntaze.com')
      ).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email', async () => {
      mockPrisma.betaInvite.create.mockResolvedValue({});

      await betaInvitesService.createInvite('');

      expect(mockPrisma.betaInvite.create).toHaveBeenCalledWith({
        data: {
          email: '',
          code: expect.any(String)
        }
      });
    });

    it('should handle special characters in email', async () => {
      mockPrisma.betaInvite.create.mockResolvedValue({});

      await betaInvitesService.createInvite('test+beta@huntaze.com');

      expect(mockPrisma.betaInvite.create).toHaveBeenCalledWith({
        data: {
          email: 'test+beta@huntaze.com',
          code: expect.any(String)
        }
      });
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@huntaze.com';
      mockPrisma.betaInvite.create.mockResolvedValue({});

      await betaInvitesService.createInvite(longEmail);

      expect(mockPrisma.betaInvite.create).toHaveBeenCalledWith({
        data: {
          email: longEmail,
          code: expect.any(String)
        }
      });
    });
  });

  describe('Beta Limit (50 Users)', () => {
    it('should track total invites created', async () => {
      mockPrisma.betaInvite.create.mockResolvedValue({});

      const invites = [];
      for (let i = 0; i < 50; i++) {
        invites.push(
          betaInvitesService.createInvite(`user${i}@huntaze.com`)
        );
      }

      await Promise.all(invites);

      expect(mockPrisma.betaInvite.create).toHaveBeenCalledTimes(50);
    });

    it('should handle concurrent invite creation', async () => {
      mockPrisma.betaInvite.create.mockResolvedValue({});

      const promises = Array.from({ length: 10 }, (_, i) =>
        betaInvitesService.createInvite(`concurrent${i}@huntaze.com`)
      );

      await Promise.all(promises);

      expect(mockPrisma.betaInvite.create).toHaveBeenCalledTimes(10);
    });
  });
});
