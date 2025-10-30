/**
 * Unit Tests - Auth.js v5 Setup Validation (Task 1.2)
 * 
 * Tests to validate the Auth.js v5 (NextAuth v5) setup
 * 
 * Coverage:
 * - auth.ts configuration validation
 * - Provider setup (GitHub, Google, Credentials)
 * - Session strategy (JWT)
 * - Callbacks (jwt, session)
 * - Route handler exports
 * - PrismaAdapter integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Auth.js v5 Setup Validation - Task 1.2', () => {
  let authFileContent: string;
  let routeHandlerContent: string;

  beforeAll(() => {
    const authPath = join(process.cwd(), 'auth.ts');
    const routePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
    
    authFileContent = readFileSync(authPath, 'utf-8');
    routeHandlerContent = readFileSync(routePath, 'utf-8');
  });

  describe('File Structure', () => {
    it('should have auth.ts at root', () => {
      const authPath = join(process.cwd(), 'auth.ts');
      expect(existsSync(authPath)).toBe(true);
    });

    it('should have route handler at app/api/auth/[...nextauth]/route.ts', () => {
      const routePath = join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
      expect(existsSync(routePath)).toBe(true);
    });
  });

  describe('Auth.js v5 Imports', () => {
    it('should import NextAuth from next-auth', () => {
      expect(authFileContent).toContain("import NextAuth from 'next-auth'");
    });

    it('should import providers from next-auth/providers', () => {
      expect(authFileContent).toContain("from 'next-auth/providers/github'");
      expect(authFileContent).toContain("from 'next-auth/providers/google'");
      expect(authFileContent).toContain("from 'next-auth/providers/credentials'");
    });

    it('should import PrismaAdapter', () => {
      expect(authFileContent).toContain("import { PrismaAdapter } from '@auth/prisma-adapter'");
    });

    it('should import prisma client', () => {
      expect(authFileContent).toContain("from '@/lib/prisma'");
    });

    it('should import bcrypt for password hashing', () => {
      expect(authFileContent).toContain("import bcrypt from 'bcryptjs'");
    });
  });

  describe('Auth.js v5 Exports', () => {
    it('should export auth function', () => {
      expect(authFileContent).toMatch(/export.*auth/);
    });

    it('should export handlers', () => {
      expect(authFileContent).toMatch(/export.*handlers/);
    });

    it('should export signIn function', () => {
      expect(authFileContent).toMatch(/export.*signIn/);
    });

    it('should export signOut function', () => {
      expect(authFileContent).toMatch(/export.*signOut/);
    });

    it('should use destructuring export from NextAuth', () => {
      expect(authFileContent).toContain('export const { auth, handlers, signIn, signOut } = NextAuth');
    });
  });

  describe('Provider Configuration', () => {
    it('should configure GitHub provider', () => {
      expect(authFileContent).toContain('GitHub({');
      expect(authFileContent).toContain('clientId: process.env.GITHUB_ID');
      expect(authFileContent).toContain('clientSecret: process.env.GITHUB_SECRET');
    });

    it('should configure Google provider', () => {
      expect(authFileContent).toContain('Google({');
      expect(authFileContent).toContain('clientId: process.env.GOOGLE_ID');
      expect(authFileContent).toContain('clientSecret: process.env.GOOGLE_SECRET');
    });

    it('should configure Credentials provider', () => {
      expect(authFileContent).toContain('Credentials({');
      expect(authFileContent).toContain("name: 'credentials'");
    });

    it('should define credentials schema', () => {
      expect(authFileContent).toContain('credentials: {');
      expect(authFileContent).toContain("email: { label: 'Email', type: 'email' }");
      expect(authFileContent).toContain("password: { label: 'Password', type: 'password' }");
    });

    it('should have authorize function for Credentials provider', () => {
      expect(authFileContent).toContain('async authorize(credentials)');
    });
  });

  describe('PrismaAdapter Integration', () => {
    it('should use PrismaAdapter', () => {
      expect(authFileContent).toContain('adapter: PrismaAdapter(prisma)');
    });

    it('should pass prisma instance to adapter', () => {
      expect(authFileContent).toMatch(/PrismaAdapter\(prisma\)/);
    });
  });

  describe('Session Strategy', () => {
    it('should use JWT session strategy', () => {
      expect(authFileContent).toContain('session: {');
      expect(authFileContent).toContain("strategy: 'jwt'");
    });

    it('should not use database session strategy', () => {
      expect(authFileContent).not.toContain("strategy: 'database'");
    });
  });

  describe('Custom Pages Configuration', () => {
    it('should configure custom sign in page', () => {
      expect(authFileContent).toContain('pages: {');
      expect(authFileContent).toContain("signIn: '/auth/login'");
    });

    it('should configure custom sign out page', () => {
      expect(authFileContent).toContain("signOut: '/auth/logout'");
    });

    it('should configure custom error page', () => {
      expect(authFileContent).toContain("error: '/auth/error'");
    });
  });

  describe('JWT Callback', () => {
    it('should have jwt callback', () => {
      expect(authFileContent).toContain('callbacks: {');
      expect(authFileContent).toContain('async jwt({ token, user, account })');
    });

    it('should add user id to token', () => {
      expect(authFileContent).toContain('token.id = user.id');
    });

    it('should add user email to token', () => {
      expect(authFileContent).toContain('token.email = user.email');
    });

    it('should add access token from account', () => {
      expect(authFileContent).toContain('token.accessToken = account.access_token');
    });

    it('should return token', () => {
      expect(authFileContent).toMatch(/async jwt.*return token/s);
    });
  });

  describe('Session Callback', () => {
    it('should have session callback', () => {
      expect(authFileContent).toContain('async session({ session, token })');
    });

    it('should add user id to session', () => {
      expect(authFileContent).toContain('session.user.id = token.id');
    });

    it('should add user email to session', () => {
      expect(authFileContent).toContain('session.user.email = token.email');
    });

    it('should return session', () => {
      expect(authFileContent).toMatch(/async session.*return session/s);
    });
  });

  describe('Credentials Provider Authorization', () => {
    it('should validate credentials presence', () => {
      expect(authFileContent).toContain("if (!credentials?.email || !credentials?.password)");
    });

    it('should throw error for invalid credentials', () => {
      expect(authFileContent).toContain("throw new Error('Invalid credentials')");
    });

    it('should query user from database', () => {
      expect(authFileContent).toContain('await prisma.user.findUnique');
      expect(authFileContent).toContain('where: { email: credentials.email');
    });

    it('should validate user exists', () => {
      expect(authFileContent).toContain('if (!user || !user.hashedPassword)');
    });

    it('should compare password with bcrypt', () => {
      expect(authFileContent).toContain('await bcrypt.compare');
      expect(authFileContent).toContain('credentials.password');
      expect(authFileContent).toContain('user.hashedPassword');
    });

    it('should validate password', () => {
      expect(authFileContent).toContain('if (!isPasswordValid)');
    });

    it('should return user object on success', () => {
      expect(authFileContent).toMatch(/return\s*{\s*id:\s*user\.id/s);
      expect(authFileContent).toContain('email: user.email');
      expect(authFileContent).toContain('name: user.name');
      expect(authFileContent).toContain('image: user.image');
    });
  });

  describe('Debug Configuration', () => {
    it('should enable debug in development', () => {
      expect(authFileContent).toContain("debug: process.env.NODE_ENV === 'development'");
    });
  });

  describe('Route Handler', () => {
    it('should export GET handler', () => {
      expect(routeHandlerContent).toContain('export { GET');
    });

    it('should export POST handler', () => {
      expect(routeHandlerContent).toContain('POST }');
    });

    it('should import handlers from auth.ts', () => {
      expect(routeHandlerContent).toContain("from '@/auth'");
    });

    it('should be a simple re-export', () => {
      // Route handler should be minimal (just re-exporting)
      expect(routeHandlerContent.split('\n').length).toBeLessThan(5);
    });
  });

  describe('Environment Variables', () => {
    it('should reference GITHUB_ID', () => {
      expect(authFileContent).toContain('process.env.GITHUB_ID');
    });

    it('should reference GITHUB_SECRET', () => {
      expect(authFileContent).toContain('process.env.GITHUB_SECRET');
    });

    it('should reference GOOGLE_ID', () => {
      expect(authFileContent).toContain('process.env.GOOGLE_ID');
    });

    it('should reference GOOGLE_SECRET', () => {
      expect(authFileContent).toContain('process.env.GOOGLE_SECRET');
    });

    it('should reference NODE_ENV', () => {
      expect(authFileContent).toContain('process.env.NODE_ENV');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should use type assertions for credentials', () => {
      expect(authFileContent).toContain('credentials.email as string');
      expect(authFileContent).toContain('credentials.password as string');
    });

    it('should use type assertion for token.id', () => {
      expect(authFileContent).toContain('token.id as string');
    });

    it('should use optional chaining', () => {
      expect(authFileContent).toContain('credentials?.email');
      expect(authFileContent).toContain('credentials?.password');
    });
  });

  describe('Security Best Practices', () => {
    it('should use bcrypt for password comparison', () => {
      expect(authFileContent).toContain('bcrypt.compare');
    });

    it('should not store plain text passwords', () => {
      expect(authFileContent).not.toContain('user.password');
      expect(authFileContent).toContain('user.hashedPassword');
    });

    it('should validate credentials before processing', () => {
      const authorizeIndex = authFileContent.indexOf('async authorize');
      const firstValidation = authFileContent.indexOf('if (!credentials?.email', authorizeIndex);
      const bcryptIndex = authFileContent.indexOf('bcrypt.compare', authorizeIndex);
      
      expect(firstValidation).toBeLessThan(bcryptIndex);
    });

    it('should use non-enumerable assertion for required env vars', () => {
      expect(authFileContent).toContain('process.env.GITHUB_ID!');
      expect(authFileContent).toContain('process.env.GITHUB_SECRET!');
      expect(authFileContent).toContain('process.env.GOOGLE_ID!');
      expect(authFileContent).toContain('process.env.GOOGLE_SECRET!');
    });
  });

  describe('Code Quality', () => {
    it('should use async/await for database queries', () => {
      expect(authFileContent).toContain('await prisma.user.findUnique');
      expect(authFileContent).toContain('await bcrypt.compare');
    });

    it('should have proper error messages', () => {
      const errorMessages = authFileContent.match(/throw new Error\('([^']+)'\)/g);
      expect(errorMessages).toBeDefined();
      expect(errorMessages!.length).toBeGreaterThan(0);
    });

    it('should not have console.log statements', () => {
      expect(authFileContent).not.toContain('console.log');
    });

    it('should use const for exports', () => {
      expect(authFileContent).toContain('export const {');
    });
  });

  describe('Auth.js v5 Compatibility', () => {
    it('should not use NextAuth v4 patterns', () => {
      expect(authFileContent).not.toContain('export default NextAuth');
      expect(authFileContent).not.toContain('...NextAuth');
    });

    it('should use Auth.js v5 destructuring pattern', () => {
      expect(authFileContent).toContain('= NextAuth({');
    });

    it('should not import from next-auth/next', () => {
      expect(authFileContent).not.toContain("from 'next-auth/next'");
    });

    it('should not import from next-auth/jwt', () => {
      expect(authFileContent).not.toContain("from 'next-auth/jwt'");
    });
  });

  describe('Integration with Existing Code', () => {
    it('should be compatible with lib/auth-helpers.ts', () => {
      const authHelpersPath = join(process.cwd(), 'lib/auth-helpers.ts');
      
      if (existsSync(authHelpersPath)) {
        const authHelpersContent = readFileSync(authHelpersPath, 'utf-8');
        expect(authHelpersContent).toContain("from '@/auth'");
      }
    });

    it('should export auth function used by helpers', () => {
      expect(authFileContent).toMatch(/export.*\bauth\b/);
    });
  });
});
