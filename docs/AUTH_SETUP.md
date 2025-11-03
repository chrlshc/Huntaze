# Authentication Setup Guide

## Overview

The authentication system is now fully connected to PostgreSQL database with:
- ✅ User registration with bcrypt password hashing
- ✅ User login with JWT tokens
- ✅ Session management
- ✅ HTTP-only cookies for security
- ✅ Database schema for users and sessions

## Database Setup

### 1. Initialize Database Tables

Run this command to create the required tables:

```bash
npm run db:init
```

This will create:
- `users` table (id, email, name, password_hash, email_verified, created_at, updated_at)
- `sessions` table (id, user_id, token, expires_at, created_at)

### 2. Environment Variables

Make sure these are set in your `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-change-this
```

## API Endpoints

### POST /api/auth/register
Register a new user

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/login
Login existing user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### GET /api/auth/me
Get current authenticated user

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

## Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ HTTP-only cookies (not accessible via JavaScript)
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite=lax for CSRF protection
- ✅ Email validation
- ✅ Password strength validation (min 8 characters)

## Frontend Integration

The frontend forms (`RegisterForm` and `LoginForm`) are already connected to these API endpoints and will:
1. Validate input client-side
2. Send requests to API routes
3. Handle errors and display messages
4. Redirect to dashboard on success
5. Store auth token in HTTP-only cookie

## Testing

To test the authentication flow:

1. Go to `/auth/register`
2. Create an account
3. You'll be redirected to `/dashboard`
4. Your session is stored in a secure cookie
5. Try `/auth/login` to test login

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Ensure `DATABASE_URL` points to production database
- [ ] Run `npm run db:init` on production database
- [ ] Verify SSL is enabled for database connection
- [ ] Test registration and login flows
- [ ] Verify cookies are set with `secure: true`
