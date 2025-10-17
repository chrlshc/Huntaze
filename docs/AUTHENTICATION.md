# Authentication Implementation Guide

This document describes the production-ready authentication system implemented in the Huntaze Next.js application.

## Overview

The authentication system uses:
- **AWS Cognito** for user management
- **JWT tokens** with edge-compatible verification
- **Secure HTTP-only cookies** for token storage
- **Middleware-based protection** for routes
- **Rate limiting** for security
- **Comprehensive E2E testing** with Playwright

## Architecture

### 1. JWT Middleware (`/middleware.ts`)
- Edge-runtime compatible JWT verification using `jose`
- Automatic token refresh when expiring
- Security headers (HSTS, CSP, etc.)
- User context injection for server components

### 2. Cookie Management (`/lib/cookies.ts`)
- Secure cookie configuration (HttpOnly, Secure, SameSite)
- Separate configurations for access, refresh, and ID tokens
- Helper functions for setting/clearing auth cookies

### 3. Server Auth Helpers (`/lib/auth-server.ts`)
- `getServerAuth()` - Get current user from headers
- `requireAuth()` - Protect routes with redirect
- `requireRole()` - Role-based access control
- `hasPermission()` - Permission checking

### 4. Rate Limiting (`/lib/rate-limit.ts`)
- In-memory LRU cache for development
- Configurable tiers (strict, normal, relaxed)
- Per-endpoint configurations
- Redis-ready for production scaling

## Authentication Flows

### Login Flow
1. User submits credentials to `/api/auth/login`
2. Credentials validated against AWS Cognito
3. JWT tokens stored in secure cookies
4. User redirected to dashboard

### Password Reset Flow
1. User requests reset at `/auth/forgot-password`
2. 6-digit code sent via AWS Cognito
3. User enters code and new password
4. Password updated in Cognito
5. User redirected to login

### Protected Routes
Routes listed in `protectedRoutes` array are automatically protected:
- `/dashboard`
- `/profile`
- `/admin`
- `/messages`
- `/campaigns`
- `/analytics`

## Security Features

### Token Security
- Access tokens expire in 1 hour
- Refresh tokens expire in 30 days
- Automatic rotation on refresh
- Secure storage in HTTP-only cookies

### Rate Limiting
- Login: 5 attempts per 15 minutes
- Signup: 3 attempts per hour
- Password reset: 3 attempts per 15 minutes
- Configurable per endpoint

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: [configured]

## Testing

### E2E Tests with Playwright
```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Debug tests
npm run test:debug

# Generate test code
npm run test:codegen
```

### Test Categories
1. **Authentication Tests** (`/tests/auth/`)
   - Login flow
   - Password reset
   - Session management

2. **Security Tests** (`/tests/security/`)
   - XSS prevention
   - CSRF protection
   - Rate limiting
   - Cookie security

### CI/CD Integration
GitHub Actions workflow runs tests on:
- Push to main/develop
- Pull requests
- Daily schedule (2 AM UTC)

## Environment Variables

### Required for Production
```env
JWT_SECRET=your-secret-key
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
```

### Required for Testing
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
BASE_URL=http://localhost:3000
```

## Development Mode

In development, the system includes:
- Mock responses for Cognito operations
- Relaxed security for local testing
- Verbose logging for debugging

## Production Deployment Checklist

- [ ] Set all required environment variables
- [ ] Enable Cognito Plus tier for advanced security
- [ ] Configure custom domain for Cognito
- [ ] Set up CloudWatch alarms
- [ ] Enable audit logging
- [ ] Configure Redis for distributed rate limiting
- [ ] Run security audit (`npm audit`)
- [ ] Verify all E2E tests pass
- [ ] Monitor Core Web Vitals

## Troubleshooting

### Common Issues

1. **"Token expired" errors**
   - Check token validity periods
   - Ensure refresh mechanism is working
   - Verify system time sync

2. **Rate limiting false positives**
   - Check IP detection in middleware
   - Verify cache configuration
   - Consider user-based limits

3. **Cookie not being set**
   - Check secure flag in production
   - Verify domain configuration
   - Check SameSite settings

## Future Enhancements

1. **Biometric Authentication**
   - WebAuthn support
   - FaceID/TouchID integration

2. **Enhanced Security**
   - Hardware token support
   - Risk-based authentication
   - Anomaly detection

3. **Performance**
   - Edge caching for JWT verification
   - Distributed session management
   - GraphQL subscriptions for real-time auth