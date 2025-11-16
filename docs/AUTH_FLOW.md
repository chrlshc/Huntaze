# Authentication and Onboarding Flow

## Overview

This document describes the complete authentication and onboarding flow for Huntaze, including user registration, login, session management, and the smart onboarding process.

## Table of Contents

- [Architecture](#architecture)
- [User Flows](#user-flows)
- [Components](#components)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Session Management](#session-management)
- [Security](#security)
- [Testing](#testing)

## Architecture

### High-Level Flow

```
┌─────────────────┐
│   Landing Page  │
│   /             │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Auth Page     │
│   /auth         │
└────────┬────────┘
         │
         ├─ New User ──────► Registration
         │                       │
         └─ Existing User ──► Login
                                 │
                                 ▼
                         ┌───────────────┐
                         │  NextAuth     │
                         │  Session      │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         onboarding_completed?                │
                    │                         │
              ┌─────┴─────┐                  │
              │           │                  │
            false       true                 │
              │           │                  │
              ▼           ▼                  │
      ┌──────────┐  ┌──────────┐           │
      │Onboarding│  │Dashboard │           │
      │  /onboarding│  /dashboard│           │
      └─────┬────┘  └──────────┘           │
            │                               │
            │ Complete                      │
            │                               │
            ▼                               │
    ┌──────────────┐                       │
    │ /api/onboard/│                       │
    │   complete   │                       │
    └──────┬───────┘                       │
           │                                │
           │ Update DB                      │
           │                                │
           ▼                                │
    ┌──────────────┐                       │
    │  Dashboard   │◄──────────────────────┘
    │  /dashboard  │
    └──────────────┘
```

## User Flows

### 1. New User Registration Flow

**Steps:**

1. User visits `/auth` page
2. User fills registration form (email, password, name)
3. Frontend validates input client-side
4. Frontend calls `POST /api/auth/register`
5. Backend creates user with `onboarding_completed = false`
6. Backend auto-logs in user via NextAuth
7. NextAuth creates session with `onboardingCompleted: false`
8. Frontend redirects to `/onboarding`
9. User completes onboarding wizard
10. Frontend calls `POST /api/onboard/complete`
11. Backend updates `onboarding_completed = true`
12. Frontend redirects to `/dashboard`

**Code Example:**

```typescript
// Registration handler in /app/auth/page.tsx
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Call registration API
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    setError('Registration failed');
    return;
  }

  // Auto-login after registration
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (result?.ok) {
    // Always redirect new users to onboarding
    router.push('/onboarding');
  }
};
```

### 2. Existing User Login Flow (Incomplete Onboarding)

**Steps:**

1. User visits `/auth` page
2. User fills login form (email, password)
3. Frontend calls NextAuth `signIn()`
4. NextAuth validates credentials
5. NextAuth creates session with `onboardingCompleted: false`
6. Frontend checks session.user.onboardingCompleted
7. Frontend redirects to `/onboarding`
8. User completes onboarding
9. Frontend calls `POST /api/onboard/complete`
10. Backend updates `onboarding_completed = true`
11. Frontend redirects to `/dashboard`

**Code Example:**

```typescript
// Login handler in /app/auth/page.tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Call NextAuth signIn
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    setError('Invalid credentials');
    return;
  }

  // Get session to check onboarding status
  const session = await getSession();
  
  // Redirect based on onboarding status
  if (session?.user?.onboardingCompleted) {
    router.push('/dashboard');
  } else {
    router.push('/onboarding');
  }
};
```

### 3. Existing User Login Flow (Completed Onboarding)

**Steps:**

1. User visits `/auth` page
2. User fills login form (email, password)
3. Frontend calls NextAuth `signIn()`
4. NextAuth validates credentials
5. NextAuth creates session with `onboardingCompleted: true`
6. Frontend checks session.user.onboardingCompleted
7. Frontend redirects directly to `/dashboard`

### 4. Onboarding Completion Flow

**Steps:**

1. User is on `/onboarding` page
2. User completes all onboarding steps
3. Frontend calls `POST /api/onboard/complete` with answers
4. Backend verifies authentication
5. Backend updates `onboarding_completed = true`
6. Backend saves onboarding answers (optional)
7. Backend returns success response
8. Frontend redirects to `/dashboard`

**Code Example:**

```typescript
// Onboarding completion in /app/onboarding/page.tsx
const handleComplete = async (answers: Record<string, string[]>) => {
  try {
    await fetch('/api/onboard/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
  }
};
```

### 5. Onboarding Skip Flow

**Steps:**

1. User is on `/onboarding` page
2. User clicks "Skip" button
3. Frontend calls `POST /api/onboard/complete` with `skipped: true`
4. Backend updates `onboarding_completed = true`
5. Backend does NOT save answers
6. Frontend redirects to `/dashboard`

## Components

### Auth Page (`/app/auth/page.tsx`)

**Purpose**: Handles user registration and login

**Key Features**:
- Dual-mode form (login/register)
- Client-side validation
- Error handling and display
- Automatic redirect based on onboarding status

**Props**: None (page component)

**State**:
- `isLogin`: boolean - Toggle between login/register mode
- `email`: string - User email input
- `password`: string - User password input
- `name`: string - User name input (register only)
- `error`: string - Error message to display
- `isLoading`: boolean - Loading state during submission

### Onboarding Page (`/app/onboarding/page.tsx`)

**Purpose**: Collects user preferences and configures account

**Key Features**:
- Session-based authentication (no token required)
- Automatic redirect if already completed
- Loading state during auth check
- Shopify-style backdrop design

**Authentication Check**:
```typescript
const { data: session, status } = useSession();

useEffect(() => {
  // Redirect to auth if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth');
    return;
  }

  // Redirect to dashboard if already completed
  if (status === 'authenticated' && session?.user?.onboardingCompleted) {
    router.push('/dashboard');
    return;
  }

  // Ready to show onboarding
  if (status === 'authenticated') {
    setIsReady(true);
  }
}, [status, session, router]);
```

### SimpleOnboarding Component

**Purpose**: Multi-step wizard for collecting user preferences

**Props**:
- `onComplete`: (answers: Record<string, string[]>) => void
- `onSkip`: () => void

**Features**:
- Multi-step form with progress indicator
- Platform selection (Instagram, TikTok, etc.)
- Goal selection (grow audience, monetize, etc.)
- Content type preferences
- Smooth animations and transitions

## API Endpoints

### POST /api/auth/register

**Purpose**: Create a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Email already exists"
}
```

**Implementation Details**:
- Validates email format and password strength
- Hashes password with bcrypt (10 rounds)
- Creates user with `onboarding_completed = false`
- Returns user object (without password)

### POST /api/auth/[...nextauth]

**Purpose**: NextAuth authentication endpoint

**Credentials Provider**:
```typescript
CredentialsProvider({
  async authorize(credentials) {
    // Validate credentials
    const user = await query(
      'SELECT id, email, name, password, onboarding_completed FROM users WHERE email = $1',
      [credentials.email]
    );
    
    // Verify password
    const isValid = await bcrypt.compare(credentials.password, user.password);
    
    if (!isValid) return null;
    
    // Return user with onboarding status
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingCompleted: user.onboarding_completed,
    };
  }
})
```

**Callbacks**:
```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      token.onboardingCompleted = user.onboardingCompleted;
    }
    
    // Refresh on update trigger
    if (trigger === 'update') {
      const result = await query(
        'SELECT onboarding_completed FROM users WHERE id = $1',
        [token.id]
      );
      token.onboardingCompleted = result.rows[0].onboarding_completed;
    }
    
    return token;
  },
  
  async session({ session, token }) {
    session.user.id = token.id;
    session.user.onboardingCompleted = token.onboardingCompleted;
    return session;
  }
}
```

### POST /api/onboard/complete

**Purpose**: Mark user onboarding as complete

**Authentication**: Required (NextAuth session)

**Request Body**:
```json
{
  "answers": {
    "platforms": ["instagram", "tiktok"],
    "goals": ["grow_audience", "monetize"],
    "content_types": ["photos", "videos"]
  },
  "skipped": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

**Response** (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { answers, skipped } = body;

  // Update onboarding status
  await query(
    'UPDATE users SET onboarding_completed = true WHERE id = $1',
    [session.user.id]
  );

  // Save answers if provided
  if (answers && !skipped) {
    await query(
      `INSERT INTO onboarding_answers (user_id, answers, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET answers = $2`,
      [session.user.id, JSON.stringify(answers)]
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Onboarding completed successfully',
  });
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);
```

### Onboarding Answers Table (Optional)

```sql
CREATE TABLE onboarding_answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_onboarding_answers_user_id ON onboarding_answers(user_id);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

## Session Management

### NextAuth Configuration

**Session Strategy**: JWT (JSON Web Tokens)

**Session Duration**: 30 days

**Token Contents**:
```typescript
interface JWT {
  id: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
  iat: number;
  exp: number;
}
```

**Session Object**:
```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    onboardingCompleted: boolean;
  };
  expires: string;
}
```

### Accessing Session Data

**Client-Side**:
```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;
  
  return <div>Welcome {session.user.name}!</div>;
}
```

**Server-Side** (API Routes):
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use session.user.id, session.user.onboardingCompleted, etc.
}
```

**Server-Side** (Server Components):
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth');
  }
  
  return <div>Welcome {session.user.name}!</div>;
}
```

### Updating Session Data

When onboarding status changes, update the session:

```typescript
import { useSession } from 'next-auth/react';

const { update } = useSession();

// After completing onboarding
await fetch('/api/onboard/complete', { method: 'POST' });

// Trigger session refresh
await update();
```

## Security

### Password Security

- **Hashing**: bcrypt with 10 rounds
- **Minimum Length**: 8 characters
- **Validation**: Enforced on both client and server
- **Storage**: Never stored in plain text

### Session Security

- **HTTP-Only Cookies**: Not accessible via JavaScript
- **Secure Flag**: HTTPS only in production
- **SameSite**: Lax (CSRF protection)
- **Expiration**: 30 days with automatic refresh

### API Security

- **Authentication**: Required for all protected endpoints
- **Authorization**: User can only access their own data
- **Rate Limiting**: Implemented on auth endpoints
- **Input Validation**: All inputs validated and sanitized

### CSRF Protection

- NextAuth provides built-in CSRF protection
- All state-changing requests require valid CSRF token
- Tokens automatically included in forms

## Testing

### Unit Tests

**Auth Page Tests**:
```typescript
describe('Auth Page', () => {
  it('should redirect to onboarding after registration', async () => {
    // Test implementation
  });
  
  it('should redirect to dashboard for completed users', async () => {
    // Test implementation
  });
  
  it('should redirect to onboarding for incomplete users', async () => {
    // Test implementation
  });
});
```

**Onboarding API Tests**:
```typescript
describe('POST /api/onboard/complete', () => {
  it('should update onboarding status', async () => {
    // Test implementation
  });
  
  it('should save onboarding answers', async () => {
    // Test implementation
  });
  
  it('should reject unauthenticated requests', async () => {
    // Test implementation
  });
});
```

### Integration Tests

**Full Registration Flow**:
```typescript
describe('Registration Flow', () => {
  it('should complete full registration and onboarding', async () => {
    // 1. Register user
    // 2. Verify redirect to onboarding
    // 3. Complete onboarding
    // 4. Verify redirect to dashboard
    // 5. Verify database state
  });
});
```

**Full Login Flow**:
```typescript
describe('Login Flow', () => {
  it('should redirect based on onboarding status', async () => {
    // Test both completed and incomplete scenarios
  });
});
```

### Manual Testing Checklist

- [ ] Register new user → redirects to onboarding
- [ ] Complete onboarding → redirects to dashboard
- [ ] Skip onboarding → redirects to dashboard
- [ ] Login with incomplete onboarding → redirects to onboarding
- [ ] Login with completed onboarding → redirects to dashboard
- [ ] Logout and login again → maintains onboarding status
- [ ] Direct access to /onboarding when unauthenticated → redirects to auth
- [ ] Direct access to /onboarding when completed → redirects to dashboard

## Troubleshooting

### User Stuck in Onboarding Loop

**Symptom**: User completes onboarding but is redirected back to onboarding

**Causes**:
1. Database update failed
2. Session not refreshed
3. Cache issue

**Solutions**:
```sql
-- Manually update user status
UPDATE users SET onboarding_completed = true WHERE email = 'user@example.com';
```

### Session Not Including Onboarding Status

**Symptom**: `session.user.onboardingCompleted` is undefined

**Causes**:
1. Type definitions not updated
2. JWT callback not including field
3. Old session cached

**Solutions**:
1. Verify type definitions in `lib/types/auth.ts`
2. Check NextAuth callbacks in `lib/auth/config.ts`
3. Clear session and login again

### Redirect Loop

**Symptom**: User bounces between pages infinitely

**Causes**:
1. Onboarding status check logic error
2. Middleware interfering
3. Race condition in useEffect

**Solutions**:
1. Add logging to track redirect decisions
2. Check middleware.ts for conflicts
3. Add dependency array to useEffect

## Migration Guide

See [Database Migrations](../migrations/README.md) for detailed migration instructions.

### Quick Migration

```bash
# Connect to database
psql -h your-host -U your-user -d your-database

# Run migration
\i migrations/001_add_onboarding_completed.sql

# Verify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
```

## Related Documentation

- [Authentication Setup](./AUTH_SETUP.md) - Initial auth system setup
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment
- [Database Migrations](../migrations/README.md) - Schema changes
- [Design Document](../.kiro/specs/auth-onboarding-flow/design.md) - Technical design
- [Requirements](../.kiro/specs/auth-onboarding-flow/requirements.md) - Feature requirements

## Support

For issues or questions:
1. Check this documentation
2. Review the [troubleshooting section](#troubleshooting)
3. Check application logs
4. Open an issue on GitHub

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
