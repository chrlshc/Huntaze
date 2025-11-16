# Design Document

## Overview

This design addresses the broken post-authentication flow in staging by implementing proper routing logic that directs users to the smart onboarding flow after registration or first login. The solution involves:

1. Adding an `onboarding_completed` field to the users table
2. Updating the NextAuth session to include onboarding status
3. Modifying the auth page to redirect based on onboarding status
4. Removing token-based authentication from the onboarding page
5. Implementing an API endpoint to mark onboarding as complete

The design prioritizes backward compatibility with existing users while ensuring new users complete the onboarding flow before accessing the dashboard.

## Architecture

### System Components

```
┌─────────────────┐
│   Auth Page     │
│  /auth/page.tsx │
└────────┬────────┘
         │
         ├─ Registration ──────┐
         │                     │
         ├─ Login ─────────────┤
         │                     │
         ▼                     ▼
┌─────────────────┐    ┌──────────────────┐
│  NextAuth       │◄───│  Database        │
│  lib/auth/      │    │  users table     │
│  config.ts      │    │  + onboarding_   │
└────────┬────────┘    │    completed     │
         │             └──────────────────┘
         │ Session with
         │ onboarding status
         │
         ▼
┌─────────────────┐
│  Routing Logic  │
│  (auth page)    │
└────────┬────────┘
         │
         ├─ onboarding_completed = false ──► /onboarding
         │
         └─ onboarding_completed = true ───► /dashboard
                                              
┌─────────────────┐
│  Onboarding     │
│  /onboarding/   │
│  page.tsx       │
└────────┬────────┘
         │
         │ Uses NextAuth session
         │ (no token required)
         │
         ▼
┌─────────────────┐
│  Complete API   │
│  /api/onboard/  │
│  complete       │
└────────┬────────┘
         │
         │ Updates DB
         │
         ▼
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
```

### Data Flow

1. **Registration Flow**:
   - User submits registration form
   - User record created with `onboarding_completed = false`
   - NextAuth creates session with onboarding status
   - Auth page redirects to `/onboarding`

2. **Login Flow (New User)**:
   - User submits login credentials
   - NextAuth validates and creates session
   - Session includes `onboarding_completed = false`
   - Auth page redirects to `/onboarding`

3. **Login Flow (Existing User)**:
   - User submits login credentials
   - NextAuth validates and creates session
   - Session includes `onboarding_completed = true`
   - Auth page redirects to `/dashboard`

4. **Onboarding Completion**:
   - User completes onboarding wizard
   - Frontend calls `/api/onboard/complete`
   - API updates `onboarding_completed = true`
   - Frontend redirects to `/dashboard`

## Components and Interfaces

### Database Schema Changes

```sql
-- Add onboarding_completed column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Set existing users as having completed onboarding (backward compatibility)
UPDATE users 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding 
ON users(onboarding_completed);
```

### NextAuth Session Extension

```typescript
// lib/types/auth.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      onboardingCompleted: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    onboardingCompleted: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    onboardingCompleted: boolean;
  }
}
```

### NextAuth Configuration Updates

```typescript
// lib/auth/config.ts - Updated callbacks

callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      token.onboardingCompleted = user.onboardingCompleted;
    }
    
    // Refresh onboarding status on update trigger
    if (trigger === 'update') {
      const result = await query(
        'SELECT onboarding_completed FROM users WHERE id = $1',
        [token.id]
      );
      if (result.rows.length > 0) {
        token.onboardingCompleted = result.rows[0].onboarding_completed;
      }
    }
    
    return token;
  },
  
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.onboardingCompleted = token.onboardingCompleted as boolean;
    }
    return session;
  },
}
```

### Auth Page Routing Logic

```typescript
// app/auth/page.tsx - Updated handleSubmit

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    if (isLogin) {
      // Login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
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
    } else {
      // Registration - always redirect to onboarding
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/onboarding');
      }
    }
  } catch (err) {
    setError('An unexpected error occurred. Please try again.');
    setIsLoading(false);
  }
};
```

### Onboarding Page Updates

```typescript
// app/onboarding/page.tsx - Remove token requirement

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShopifyBackdrop } from '@/components/onboarding/huntaze-onboarding/ShopifyBackdrop';
import SimpleOnboarding from '@/components/onboarding/huntaze-onboarding/SimpleOnboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Redirect to auth if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    // If already completed onboarding, redirect to dashboard
    if (status === 'authenticated' && session?.user?.onboardingCompleted) {
      router.push('/dashboard');
      return;
    }

    // Ready to show onboarding
    if (status === 'authenticated') {
      setIsReady(true);
    }
  }, [status, session, router]);

  const handleComplete = async (answers: Record<string, string[]>) => {
    try {
      // Save onboarding answers
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

  const handleSkip = async () => {
    try {
      // Mark onboarding as complete (without answers)
      await fetch('/api/onboard/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  // Show loading state while checking auth
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ShopifyBackdrop accent1="#a78bfa" accent2="#f472b6">
      <div className="w-full max-w-3xl">
        <SimpleOnboarding onComplete={handleComplete} onSkip={handleSkip} />
      </div>
    </ShopifyBackdrop>
  );
}
```

### Onboarding Completion API

```typescript
// app/api/onboard/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/db';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('onboarding-complete');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { answers, skipped } = body;

    // Update onboarding status
    await query(
      'UPDATE users SET onboarding_completed = true WHERE id = $1',
      [session.user.id]
    );

    // Optionally save onboarding answers
    if (answers && !skipped) {
      await query(
        `INSERT INTO onboarding_answers (user_id, answers, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET answers = $2, updated_at = NOW()`,
        [session.user.id, JSON.stringify(answers)]
      );
    }

    logger.info('Onboarding completed', {
      userId: session.user.id,
      skipped: !!skipped,
      hasAnswers: !!answers,
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    logger.error('Onboarding completion error', error as Error);
    
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
```

## Data Models

### Users Table Schema

```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  email_verified: boolean;
  onboarding_completed: boolean; // NEW FIELD
  created_at: Date;
  updated_at: Date;
}
```

### Onboarding Answers Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_onboarding_answers_user_id ON onboarding_answers(user_id);
```

### Session Data Model

```typescript
interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    onboardingCompleted: boolean; // NEW FIELD
  };
  expires: string;
}
```

## Error Handling

### Authentication Errors

- **Unauthenticated Access to Onboarding**: Redirect to `/auth` with return URL
- **Session Expired**: Redirect to `/auth` with session expired message
- **Invalid Session**: Clear session and redirect to `/auth`

### Database Errors

- **Failed to Update Onboarding Status**: Log error, show user-friendly message, allow retry
- **Failed to Save Answers**: Log error but still mark onboarding as complete
- **Connection Timeout**: Retry with exponential backoff (max 3 attempts)

### Routing Errors

- **Failed to Determine Onboarding Status**: Default to showing onboarding (safe fallback)
- **Redirect Loop Detection**: Log error and break loop by forcing dashboard redirect

## Testing Strategy

### Unit Tests

1. **NextAuth Callbacks**:
   - Test JWT callback includes onboarding status
   - Test session callback includes onboarding status
   - Test update trigger refreshes onboarding status

2. **Routing Logic**:
   - Test redirect to onboarding for new users
   - Test redirect to dashboard for existing users
   - Test redirect to auth for unauthenticated users

3. **API Endpoint**:
   - Test successful onboarding completion
   - Test unauthorized access handling
   - Test database error handling

### Integration Tests

1. **Registration Flow**:
   - Register new user
   - Verify redirect to onboarding
   - Complete onboarding
   - Verify redirect to dashboard

2. **Login Flow (New User)**:
   - Login with incomplete onboarding
   - Verify redirect to onboarding
   - Complete onboarding
   - Verify redirect to dashboard

3. **Login Flow (Existing User)**:
   - Login with completed onboarding
   - Verify direct redirect to dashboard

4. **Onboarding Skip**:
   - Access onboarding
   - Skip onboarding
   - Verify redirect to dashboard
   - Verify onboarding marked complete

### Manual Testing (Staging)

1. **New User Registration**:
   - Register on staging
   - Verify onboarding flow appears
   - Complete onboarding
   - Verify dashboard access

2. **Existing User Login**:
   - Login with existing account
   - Verify direct dashboard access

3. **Session Persistence**:
   - Complete onboarding
   - Logout and login again
   - Verify direct dashboard access

## Performance Considerations

### Database Queries

- Add index on `onboarding_completed` for faster filtering
- Use connection pooling to minimize overhead
- Cache session data to reduce database hits

### Session Management

- Include onboarding status in JWT to avoid database queries
- Refresh status only on explicit update trigger
- Set appropriate session expiry (30 days)

### Page Load Performance

- Use loading states during auth checks
- Prefetch dashboard/onboarding routes
- Minimize redirects (max 1 redirect per flow)

## Security Considerations

### Authentication

- Verify session on every onboarding page load
- Use secure session cookies (httpOnly, secure, sameSite)
- Implement CSRF protection on completion endpoint

### Authorization

- Verify user owns the session before updating onboarding status
- Prevent unauthorized access to onboarding completion endpoint
- Rate limit onboarding completion endpoint

### Data Privacy

- Store onboarding answers securely (encrypted at rest)
- Allow users to update/delete their answers
- Include onboarding data in GDPR export/deletion

## Migration Strategy

### Backward Compatibility

1. **Database Migration**:
   - Add column with default value `false`
   - Update existing users to `true`
   - Create index for performance

2. **Gradual Rollout**:
   - Deploy database changes first
   - Deploy backend changes (API, NextAuth)
   - Deploy frontend changes (auth page, onboarding)

3. **Rollback Plan**:
   - Keep old routing logic as fallback
   - Feature flag for new routing logic
   - Monitor error rates and user feedback

### Data Migration

```sql
-- Step 1: Add column (safe, non-blocking)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Step 2: Backfill existing users (can be done in batches)
UPDATE users 
SET onboarding_completed = true 
WHERE created_at < '2024-01-01' -- Adjust date as needed
  AND onboarding_completed IS NULL;

-- Step 3: Create index (can be done concurrently)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_onboarding 
ON users(onboarding_completed);
```

## Deployment Checklist

1. ✅ Run database migration on staging
2. ✅ Deploy backend changes to staging
3. ✅ Deploy frontend changes to staging
4. ✅ Test registration flow on staging
5. ✅ Test login flow on staging
6. ✅ Test onboarding completion on staging
7. ✅ Monitor staging for 24 hours
8. ✅ Run database migration on production
9. ✅ Deploy backend changes to production
10. ✅ Deploy frontend changes to production
11. ✅ Monitor production for errors
12. ✅ Verify user flows in production
