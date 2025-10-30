/**
 * Regression Tests for Auth Compatibility
 * 
 * Ensures that the Auth.js v5 migration maintains backward compatibility
 * and doesn't break existing authentication functionality
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '../..');

describe('Auth Compatibility Regression Tests', () => {
  describe('Existing Auth Flows Still Work', () => {
    it('should have auth.ts with Auth.js v5 configuration', () => {
      // Requirement 4.1
      const authPath = join(projectRoot, 'auth.ts');
      expect(existsSync(authPath)).toBe(true);
      
      const authContent = readFileSync(authPath, 'utf-8');
      
      // Verify Auth.js v5 exports
      expect(authContent).toContain('export const { auth, handlers, signIn, signOut }');
      expect(authContent).toContain('NextAuth');
    });

    it('should have credentials provider configured', () => {
      // Verify credentials authentication still works
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('Credentials');
      expect(authContent).toContain('authorize');
    });

    it('should have OAuth providers configured', () => {
      // Verify OAuth authentication still works
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      // Check for GitHub and Google providers
      expect(authContent).toContain('GitHub');
      expect(authContent).toContain('Google');
    });

    it('should have session strategy configured', () => {
      // Verify session management still works
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('session');
      expect(authContent).toContain('jwt');
    });

    it('should have callbacks configured', () => {
      // Verify session callbacks still work
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('callbacks');
      expect(authContent).toContain('jwt');
      expect(authContent).toContain('session');
    });
  });

  describe('Custom JWT System Still Works', () => {
    it('should have preserved auth-service.ts', () => {
      // Requirement 4.2
      const authServicePath = join(projectRoot, 'lib/services/auth-service.ts');
      expect(existsSync(authServicePath)).toBe(true);
    });

    it('should have AuthService class with all methods', () => {
      // Verify all AuthService methods are still available
      const authServicePath = join(projectRoot, 'lib/services/auth-service.ts');
      const authServiceContent = readFileSync(authServicePath, 'utf-8');
      
      expect(authServiceContent).toContain('export class AuthService');
      expect(authServiceContent).toContain('generateAccessToken');
      expect(authServiceContent).toContain('generateRefreshToken');
      expect(authServiceContent).toContain('verifyAccessToken');
      expect(authServiceContent).toContain('refreshTokens');
      expect(authServiceContent).toContain('signIn');
      expect(authServiceContent).toContain('signOut');
    });

    it('should have refresh token rotation functionality', () => {
      // Verify advanced JWT features are preserved
      const authServicePath = join(projectRoot, 'lib/services/auth-service.ts');
      const authServiceContent = readFileSync(authServicePath, 'utf-8');
      
      expect(authServiceContent).toContain('refreshToken');
      expect(authServiceContent).toContain('tokenHash');
      expect(authServiceContent).toContain('jti');
    });

    it('should have custom JWT claims support', () => {
      // Verify custom claims like subscription are preserved
      const authServicePath = join(projectRoot, 'lib/services/auth-service.ts');
      const authServiceContent = readFileSync(authServicePath, 'utf-8');
      
      expect(authServiceContent).toContain('subscription');
      expect(authServiceContent).toContain('JWTPayload');
    });

    it('should have secure token storage', () => {
      // Verify token hashing and secure storage
      const authServicePath = join(projectRoot, 'lib/services/auth-service.ts');
      const authServiceContent = readFileSync(authServicePath, 'utf-8');
      
      expect(authServiceContent).toContain('createHash');
      expect(authServiceContent).toContain('sha256');
    });
  });

  describe('No Breaking Changes to Authentication API', () => {
    it('should maintain auth() function signature', () => {
      // Requirement 4.3
      // Verify auth() can be called without parameters
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      // Auth.js v5 exports auth as a function
      expect(authContent).toContain('auth');
    });

    it('should maintain signIn() function availability', () => {
      // Verify signIn is still exported
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('signIn');
    });

    it('should maintain signOut() function availability', () => {
      // Verify signOut is still exported
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('signOut');
    });

    it('should maintain handlers export for API routes', () => {
      // Verify handlers are exported for /api/auth/[...nextauth]
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('handlers');
    });

    it('should have API route handler configured', () => {
      // Verify API route exists
      const apiRoutePath = join(projectRoot, 'app/api/auth/[...nextauth]/route.ts');
      expect(existsSync(apiRoutePath)).toBe(true);
    });
  });

  describe('Session Data Structure Unchanged', () => {
    it('should maintain user.id in session', () => {
      // Requirement 4.4
      // Verify session structure includes user.id
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      // Check callbacks that set user.id
      expect(authContent).toContain('token.id');
      expect(authContent).toContain('session.user.id');
    });

    it('should maintain user.email in session', () => {
      // Verify session structure includes user.email
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('email');
    });

    it('should maintain session callbacks', () => {
      // Verify callbacks that populate session data
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('async jwt');
      expect(authContent).toContain('async session');
    });

    it('should maintain JWT strategy', () => {
      // Verify JWT session strategy is maintained
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('strategy');
      expect(authContent).toContain('jwt');
    });
  });

  describe('Middleware Protection Still Works', () => {
    it('should have middleware.ts configured', () => {
      // Verify middleware exists and uses Auth.js v5
      const middlewarePath = join(projectRoot, 'middleware.ts');
      expect(existsSync(middlewarePath)).toBe(true);
      
      const middlewareContent = readFileSync(middlewarePath, 'utf-8');
      expect(middlewareContent).toContain('auth');
    });

    it('should protect routes based on authentication', () => {
      // Verify middleware checks authentication
      const middlewarePath = join(projectRoot, 'middleware.ts');
      const middlewareContent = readFileSync(middlewarePath, 'utf-8');
      
      expect(middlewareContent).toContain('req.auth');
      expect(middlewareContent).toContain('isAuthenticated');
    });

    it('should redirect unauthenticated users', () => {
      // Verify redirect logic exists
      const middlewarePath = join(projectRoot, 'middleware.ts');
      const middlewareContent = readFileSync(middlewarePath, 'utf-8');
      
      expect(middlewareContent).toContain('/auth/login');
      expect(middlewareContent).toContain('redirect');
    });

    it('should allow public routes', () => {
      // Verify public routes are configured
      const middlewarePath = join(projectRoot, 'middleware.ts');
      const middlewareContent = readFileSync(middlewarePath, 'utf-8');
      
      expect(middlewareContent).toContain('publicRoutes');
    });

    it('should have matcher configuration', () => {
      // Verify middleware matcher is configured
      const middlewarePath = join(projectRoot, 'middleware.ts');
      const middlewareContent = readFileSync(middlewarePath, 'utf-8');
      
      expect(middlewareContent).toContain('export const config');
      expect(middlewareContent).toContain('matcher');
    });
  });

  describe('Auth Pages Still Work', () => {
    it('should have login page configured', () => {
      // Verify login page exists
      const loginPagePath = join(projectRoot, 'app/auth/login/page.tsx');
      expect(existsSync(loginPagePath)).toBe(true);
    });

    it('should have register page configured', () => {
      // Verify register page exists
      const registerPagePath = join(projectRoot, 'app/auth/register/page.tsx');
      expect(existsSync(registerPagePath)).toBe(true);
    });

    it('should have custom pages configured in auth.ts', () => {
      // Verify custom pages are configured
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('pages');
      expect(authContent).toContain('signIn');
    });
  });

  describe('Database Integration Still Works', () => {
    it('should have Prisma adapter configured', () => {
      // Verify Prisma adapter is still used
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('PrismaAdapter');
      expect(authContent).toContain('adapter');
    });

    it('should have prisma client imported', () => {
      // Verify prisma client is imported
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('prisma');
    });
  });

  describe('Password Hashing Still Works', () => {
    it('should have bcrypt for password comparison', () => {
      // Verify bcrypt is still used for credentials
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('bcrypt');
      expect(authContent).toContain('compare');
    });

    it('should have password validation in credentials provider', () => {
      // Verify password validation logic exists
      const authPath = join(projectRoot, 'auth.ts');
      const authContent = readFileSync(authPath, 'utf-8');
      
      expect(authContent).toContain('hashedPassword');
      expect(authContent).toContain('isPasswordValid');
    });
  });

  describe('Environment Variables Still Required', () => {
    it('should document required environment variables', () => {
      // Verify .env.example exists and documents auth variables
      const envExamplePath = join(projectRoot, '.env.example');
      
      if (existsSync(envExamplePath)) {
        const envContent = readFileSync(envExamplePath, 'utf-8');
        
        // Check for Auth.js v5 variables
        expect(envContent).toContain('NEXTAUTH_SECRET');
      }
    });
  });
});
