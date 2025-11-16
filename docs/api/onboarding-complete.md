# Onboarding Complete API

## Endpoint

```
POST /api/onboard/complete
```

## Description

Marks a user's onboarding as complete and optionally saves their onboarding answers. This endpoint is called after a user completes the smart onboarding wizard or chooses to skip it.

## Authentication

**Required**: Yes

This endpoint requires a valid NextAuth session. The user must be authenticated before calling this endpoint.

## Request

### Headers

```
Content-Type: application/json
Cookie: next-auth.session-token=<session-token>
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `answers` | Object | No | User's onboarding answers (platforms, goals, content types, etc.) |
| `skipped` | Boolean | No | Whether the user skipped onboarding (default: false) |

### Request Body Examples

#### Complete with Answers

```json
{
  "answers": {
    "platforms": ["instagram", "tiktok"],
    "goals": ["grow_audience", "monetize"],
    "content_types": ["photos", "videos"],
    "posting_frequency": "daily"
  },
  "skipped": false
}
```

#### Skip Onboarding

```json
{
  "skipped": true
}
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

### Error Responses

#### Unauthorized (401)

Returned when the user is not authenticated.

```json
{
  "error": "Unauthorized"
}
```

#### Internal Server Error (500)

Returned when there's a database or server error.

```json
{
  "error": "Failed to complete onboarding"
}
```

## Behavior

### Database Updates

1. **Always**: Updates `users.onboarding_completed` to `true`
2. **Conditionally**: Saves answers to `onboarding_answers` table if:
   - `answers` is provided
   - `skipped` is not `true`

### SQL Operations

```sql
-- Update onboarding status (always)
UPDATE users 
SET onboarding_completed = true 
WHERE id = $1;

-- Save answers (if provided and not skipped)
INSERT INTO onboarding_answers (user_id, answers, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT (user_id) 
DO UPDATE SET answers = $2, updated_at = NOW();
```

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Complete onboarding with answers
const handleComplete = async (answers: Record<string, string[]>) => {
  try {
    const response = await fetch('/api/onboard/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete onboarding');
    }

    const data = await response.json();
    console.log(data.message); // "Onboarding completed successfully"
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Skip onboarding
const handleSkip = async () => {
  try {
    const response = await fetch('/api/onboard/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skipped: true }),
    });

    if (!response.ok) {
      throw new Error('Failed to skip onboarding');
    }

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### cURL

```bash
# Complete with answers
curl -X POST https://your-domain.com/api/onboard/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "answers": {
      "platforms": ["instagram", "tiktok"],
      "goals": ["grow_audience"]
    }
  }'

# Skip onboarding
curl -X POST https://your-domain.com/api/onboard/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"skipped": true}'
```

## Integration with Frontend

### Onboarding Page Flow

```typescript
// app/onboarding/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    // Redirect if already completed
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
    await fetch('/api/onboard/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    router.push('/dashboard');
  };

  const handleSkip = async () => {
    await fetch('/api/onboard/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skipped: true }),
    });
    router.push('/dashboard');
  };

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <OnboardingWizard 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
```

## Security Considerations

### Authentication

- Endpoint verifies NextAuth session before processing
- User ID is extracted from session, not from request body
- Prevents unauthorized users from modifying onboarding status

### Authorization

- Users can only update their own onboarding status
- User ID from session is used for database updates
- No way to modify another user's status

### Input Validation

- Answers are stored as JSONB (flexible schema)
- No strict validation on answer structure
- Malicious input is contained within user's own record

## Rate Limiting

This endpoint is not rate-limited as it's typically called only once per user. However, consider adding rate limiting if abuse is detected:

```typescript
// Example rate limiting
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    await limiter.check(request, 5, 'ONBOARDING_COMPLETE');
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // ... rest of handler
}
```

## Monitoring and Logging

The endpoint logs the following events:

```typescript
// Success
logger.info('Onboarding completed', {
  userId: session.user.id,
  skipped: !!skipped,
  hasAnswers: !!answers,
});

// Error
logger.error('Onboarding completion error', error as Error);
```

### Metrics to Monitor

- **Success Rate**: Should be > 99%
- **Response Time**: Should be < 500ms
- **Error Rate**: Should be < 1%
- **Skip Rate**: Track how many users skip vs complete

## Testing

### Unit Tests

```typescript
describe('POST /api/onboard/complete', () => {
  it('should update onboarding status for authenticated user', async () => {
    const session = { user: { id: '123' } };
    const response = await POST(request, { session });
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Onboarding completed successfully',
    });
  });

  it('should save answers when provided', async () => {
    const answers = { platforms: ['instagram'] };
    const response = await POST(request, { 
      session: { user: { id: '123' } },
      body: { answers }
    });
    
    // Verify answers saved to database
    const saved = await query(
      'SELECT answers FROM onboarding_answers WHERE user_id = $1',
      ['123']
    );
    expect(saved.rows[0].answers).toEqual(answers);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await POST(request, { session: null });
    
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
});
```

### Integration Tests

```typescript
describe('Onboarding Flow Integration', () => {
  it('should complete full onboarding flow', async () => {
    // 1. Register user
    const user = await registerUser({ email, password });
    
    // 2. Login
    const session = await loginUser({ email, password });
    
    // 3. Complete onboarding
    const response = await fetch('/api/onboard/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${session.token}`,
      },
      body: JSON.stringify({
        answers: { platforms: ['instagram'] },
      }),
    });
    
    expect(response.status).toBe(200);
    
    // 4. Verify database
    const dbUser = await getUserById(user.id);
    expect(dbUser.onboarding_completed).toBe(true);
  });
});
```

## Troubleshooting

### Issue: Endpoint returns 401 even when logged in

**Cause**: Session cookie not being sent with request

**Solution**: Ensure credentials are included in fetch:
```typescript
fetch('/api/onboard/complete', {
  method: 'POST',
  credentials: 'include', // Important!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers }),
});
```

### Issue: Onboarding status not updating

**Cause**: Database connection issue or transaction rollback

**Solution**: Check application logs for database errors:
```bash
# Check logs
tail -f logs/application.log | grep "onboarding"

# Verify database connection
psql -h your-host -U your-user -d your-db -c "SELECT 1"
```

### Issue: Answers not being saved

**Cause**: `skipped: true` flag or missing answers

**Solution**: Verify request body:
```typescript
// Correct - answers will be saved
{ answers: { platforms: ['instagram'] } }

// Incorrect - answers will NOT be saved
{ answers: { platforms: ['instagram'] }, skipped: true }
```

## Related Documentation

- [Authentication Flow](../AUTH_FLOW.md) - Complete authentication and onboarding flow
- [Authentication Setup](../AUTH_SETUP.md) - Initial auth system setup
- [Database Migrations](../../migrations/README.md) - Schema changes
- [API Reference](../API_REFERENCE.md) - All API endpoints

## Changelog

### Version 1.0 (November 16, 2025)
- Initial implementation
- Support for saving onboarding answers
- Support for skipping onboarding
- Session-based authentication

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
