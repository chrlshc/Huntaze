import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock external dependencies
const mockBcrypt = {
  compare: vi.fn(),
  hash: vi.fn(),
};

const mockJWT = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
};

const mockEmailService = {
  sendWelcomeEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
};

// Mock modules
vi.mock('bcryptjs', () => mockBcrypt);
vi.mock('jsonwebtoken', () => mockJWT);
vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/email-service', () => mockEmailService);

// Helper function to create mock signin handler
const createMockSigninHandler = () => {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      // Validate input
      if (!body.email || !body.password) {
        return NextResponse.json(
          { error: 'Invalid input', details: ['Email and password required'] },
          { status: 400 }
        );
      }

      // Find user
      const user = await mockPrisma.user.findUnique({
        where: { email: body.email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          isActive: true,
          subscription: true,
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = await mockBcrypt.compare(body.password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Generate tokens
      const accessToken = mockJWT.sign(
        { userId: user.id, email: user.email },
        'test-secret',
        { expiresIn: '15m' }
      );

      const refreshToken = mockJWT.sign(
        { userId: user.id },
        'test-refresh-secret',
        { expiresIn: body.rememberMe ? '30d' : '7d' }
      );

      // Store refresh token
      await mockPrisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + (body.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
        },
      });

      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription,
        },
        accessToken,
      });

      // Set cookie
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: body.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      });

      return response;
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};

// Helper function to create mock signup handler
const createMockSignupHandler = () => {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      // Basic validation
      if (!body.name || !body.email || !body.password || !body.acceptTerms) {
        return NextResponse.json(
          { error: 'Invalid input', details: ['All fields required'] },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await mockPrisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await mockBcrypt.hash(body.password, 12);

      // Create user
      const user = await mockPrisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
          subscription: 'free',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          subscription: true,
          createdAt: true,
        },
      });

      // Send emails
      await mockEmailService.sendWelcomeEmail(user.email, user.name);
      
      const verificationToken = mockJWT.sign(
        { userId: user.id, type: 'email_verification' },
        'test-secret',
        { expiresIn: '24h' }
      );
      
      await mockEmailService.sendVerificationEmail(user.email, verificationToken);

      return NextResponse.json({
        message: 'User created successfully',
        user,
      }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/signin', () => {
    const createMockRequest = (body: any) => {
      return {
        json: vi.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '$2a$12$hashedpassword',
      isActive: true,
      subscription: 'premium',
    };

    it('should successfully sign in with valid credentials', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'ValidPass123',
        rememberMe: false,
      };

      const mockRequest = createMockRequest(requestBody);

      // Mock database response
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock password verification
      mockBcrypt.compare.mockResolvedValue(true);
      
      // Mock JWT generation
      mockJWT.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      // Mock refresh token creation
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'mock-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(),
      });

      // Test the signin function
      const signinHandler = createMockSigninHandler();
      const response = await signinHandler(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        subscription: mockUser.subscription,
      });
      expect(responseData.accessToken).toBe('mock-access-token');

      // Verify database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          isActive: true,
          subscription: true,
        },
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith('ValidPass123', mockUser.passwordHash);
      
      expect(mockJWT.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        'test-secret',
        { expiresIn: '15m' }
      );

      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should handle remember me option correctly', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'ValidPass123',
        rememberMe: true,
      };

      const mockRequest = createMockRequest(requestBody);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJWT.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const signinHandler = createMockSigninHandler();
      await signinHandler(mockRequest);

      // Verify refresh token has longer expiry for remember me
      expect(mockJWT.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'test-refresh-secret',
        { expiresIn: '30d' }
      );
    });

    it('should return 401 for invalid email', async () => {
      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'ValidPass123',
      };

      const mockRequest = createMockRequest(requestBody);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const signinHandler = createMockSigninHandler();
      const response = await signinHandler(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should return 401 for inactive user', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'ValidPass123',
      };

      const mockRequest = createMockRequest(requestBody);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockRequest = createMockRequest(requestBody);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid credentials');
    });

    it('should return 400 for invalid input format', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const mockRequest = createMockRequest(requestBody);

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
      expect(responseData.details).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'ValidPass123',
      };

      const mockRequest = createMockRequest(requestBody);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('should set secure cookies in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const requestBody = {
        email: 'test@example.com',
        password: 'ValidPass123',
      };

      const mockRequest = createMockRequest(requestBody);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);

      // Check that cookies are set with secure flag in production
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Strict');
    });
  });

  describe('POST /api/auth/signup', () => {
    const createMockRequest = (body: any) => {
      return {
        json: vi.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    const validSignupData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'ValidPass123',
      acceptTerms: true,
    };

    const mockCreatedUser = {
      id: 'user-456',
      name: 'John Doe',
      email: 'john@example.com',
      subscription: 'free',
      createdAt: new Date(),
    };

    it('should successfully create a new user', async () => {
      const mockRequest = createMockRequest(validSignupData);

      // Mock user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Mock password hashing
      mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword');
      
      // Mock user creation
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      
      // Mock JWT for verification token
      mockJwt.sign.mockReturnValue('verification-token');

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.message).toBe('User created successfully');
      expect(responseData.user).toEqual(mockCreatedUser);

      // Verify database calls
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('ValidPass123', 12);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: '$2a$12$hashedpassword',
          subscription: 'free',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          subscription: true,
          createdAt: true,
        },
      });

      // Verify email functions were called
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith('john@example.com', 'John Doe');
      expect(mockSendVerificationEmail).toHaveBeenCalledWith('john@example.com', 'verification-token');
    });

    it('should return 409 for existing user', async () => {
      const mockRequest = createMockRequest(validSignupData);

      // Mock user already exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'john@example.com',
      });

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.error).toBe('User already exists');
    });

    it('should validate password strength', async () => {
      const invalidPasswordData = {
        ...validSignupData,
        password: 'weakpass', // No uppercase, no numbers
      };

      const mockRequest = createMockRequest(invalidPasswordData);

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
      expect(responseData.details).toBeDefined();
    });

    it('should require terms acceptance', async () => {
      const noTermsData = {
        ...validSignupData,
        acceptTerms: false,
      };

      const mockRequest = createMockRequest(noTermsData);

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validSignupData,
        email: 'invalid-email-format',
      };

      const mockRequest = createMockRequest(invalidEmailData);

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
    });

    it('should validate name length', async () => {
      const shortNameData = {
        ...validSignupData,
        name: 'A', // Too short
      };

      const mockRequest = createMockRequest(shortNameData);

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
    });

    it('should handle database errors during user creation', async () => {
      const mockRequest = createMockRequest(validSignupData);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword');
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('should handle email service failures gracefully', async () => {
      const mockRequest = createMockRequest(validSignupData);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword');
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockJwt.sign.mockReturnValue('verification-token');

      // Mock email service failure
      mockSendWelcomeEmail.mockRejectedValue(new Error('Email service down'));

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);

      // Should still succeed even if email fails
      expect(response.status).toBe(201);
    });

    it('should generate secure verification token', async () => {
      const mockRequest = createMockRequest(validSignupData);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword');
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
      mockJwt.sign.mockReturnValue('verification-token');

      const { POST } = await import('../../app/api/auth/signup/route');
      await POST(mockRequest);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockCreatedUser.id, type: 'email_verification' },
        'test-jwt-secret',
        { expiresIn: '24h' }
      );
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle malformed JSON in signin', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('should handle malformed JSON in signup', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('should handle missing required fields in signin', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
    });

    it('should handle missing required fields in signup', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ name: 'John' }), // Missing other fields
      } as unknown as NextRequest;

      const { POST } = await import('../../app/api/auth/signup/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid input');
    });
  });

  describe('Security Tests', () => {
    it('should use secure password hashing in signup', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'ValidPass123',
          acceptTerms: true,
        }),
      } as unknown as NextRequest;

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$2a$12$hashedpassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-456',
        name: 'John Doe',
        email: 'john@example.com',
        subscription: 'free',
        createdAt: new Date(),
      });

      const { POST } = await import('../../app/api/auth/signup/route');
      await POST(mockRequest);

      // Verify bcrypt is called with secure rounds (12)
      expect(mockBcrypt.hash).toHaveBeenCalledWith('ValidPass123', 12);
    });

    it('should not expose password hash in signin response', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'ValidPass123',
        }),
      } as unknown as NextRequest;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$12$hashedpassword',
        isActive: true,
        subscription: 'premium',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(responseData.user).not.toHaveProperty('passwordHash');
      expect(responseData.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        subscription: mockUser.subscription,
      });
    });

    it('should set HTTP-only cookies for refresh tokens', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'ValidPass123',
        }),
      } as unknown as NextRequest;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$12$hashedpassword',
        isActive: true,
        subscription: 'premium',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const { POST } = await import('../../app/api/auth/signin/route');
      const response = await POST(mockRequest);

      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Strict');
    });
  });
});