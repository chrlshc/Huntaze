# Authentication Module

Comprehensive authentication system with NextAuth.js, including error handling, validation, and session management.

## 📁 Structure

```
lib/auth/
├── index.ts           # Main export file
├── types.ts           # TypeScript types and interfaces
├── errors.ts          # Error handling utilities
├── validators.ts      # Input validation functions
├── session.ts         # Session management helpers
├── config.ts          # Auth configuration
├── jwt.ts             # JWT utilities
├── tokens.ts          # Token management
└── README.md          # This file
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { getSession, requireAuth, validateEmail } from '@/lib/auth';

// Get current session
const session = await getSession();

// Require authentication (throws if not authenticated)
const session = await requireAuth();

// Validate email
const result = validateEmail('user@example.com');
if (!result.valid) {
  console.error(result.errors);
}
```

## 📖 API Reference

### Session Management

#### `getSession()`
Get current session with error handling.

```typescript
const session = await getSession();
if (session) {
  console.log('User:', session.user.email);
}
```

#### `requireAuth()`
Require authentication - throws if not authenticated.

```typescript
try {
  const session = await requireAuth();
  // User is authenticated
} catch (error) {
  // Redirect to login
}
```

#### `requireRole(allowedRoles: string[])`
Require specific role - throws if not authorized.

```typescript
try {
  await requireRole(['admin', 'creator']);
  // User has required role
} catch (error) {
  // Access denied
}
```

#### `validateOwnership(session, resourceOwnerId)`
Check if user owns a resource.

```typescript
const session = await getSession();
if (!validateOwnership(session, creatorId)) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Validation

#### `validateEmail(email: string)`
Validate email format with common typo detection.

```typescript
const result = validateEmail('user@gmial.com');
// result.valid = false
// result.errors = ['Did you mean user@gmail.com?']
```

#### `validatePassword(password: string)`
Validate password strength against requirements.

```typescript
const result = validatePassword('MyP@ssw0rd');
if (!result.valid) {
  console.error(result.errors);
}
```

#### `calculatePasswordStrength(password: string)`
Calculate password strength score (0-100).

```typescript
const score = calculatePasswordStrength('MyP@ssw0rd');
const { label, color } = getPasswordStrengthLabel(score);
// label = 'Strong', color = 'green'
```

#### `validateSignInCredentials(email, password)`
Validate sign in form inputs.

```typescript
const result = validateSignInCredentials(email, password);
if (!result.valid) {
  setErrors(result.errors);
}
```

### Error Handling

#### `createAuthError(error: AuthError, correlationId?)`
Create standardized auth error response.

```typescript
const error = createAuthError(AuthError.CREDENTIALS_SIGNIN, 'req-123');
// {
//   error: 'CredentialsSignin',
//   message: 'Invalid email or password.',
//   correlationId: 'req-123',
//   retryable: false
// }
```

#### `getErrorMessage(error: AuthError)`
Get user-friendly error message.

```typescript
const message = getErrorMessage(AuthError.SESSION_REQUIRED);
// 'You must be signed in to access this resource.'
```

#### `handleAuthErrorWithRetry(operation, maxRetries)`
Execute operation with automatic retry on retryable errors.

```typescript
const result = await handleAuthErrorWithRetry(
  async () => await authenticateUser(email, password),
  3
);
```

## 🔒 Security Features

### Password Requirements

Default password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting

Use `getRateLimitKey()` to generate keys for rate limiting:

```typescript
const key = getRateLimitKey(email, 'signin');
// 'auth:signin:user@example.com'
```

### Input Sanitization

```typescript
const clean = sanitizeEmail('  USER@EXAMPLE.COM  ');
// 'user@example.com'

const safeName = sanitizeName('<script>alert("xss")</script>John');
// 'John'
```

### Disposable Email Detection

```typescript
if (isDisposableEmail('user@tempmail.com')) {
  return { error: 'Disposable emails not allowed' };
}
```

## 🎯 Usage Examples

### API Route with Authentication

```typescript
import { getSession, validateOwnership } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Get session
  const session = await getSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get resource owner from query
  const creatorId = request.nextUrl.searchParams.get('creatorId');
  
  // Validate ownership
  if (!validateOwnership(session, creatorId)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request
  return Response.json({ data: 'success' });
}
```

### Sign In Form Validation

```typescript
import { validateSignInCredentials, sanitizeEmail } from '@/lib/auth';

function handleSubmit(email: string, password: string) {
  // Sanitize input
  const cleanEmail = sanitizeEmail(email);
  
  // Validate
  const result = validateSignInCredentials(cleanEmail, password);
  
  if (!result.valid) {
    setErrors(result.errors);
    return;
  }
  
  // Proceed with sign in
  signIn('credentials', { email: cleanEmail, password });
}
```

### Password Strength Indicator

```typescript
import { calculatePasswordStrength, getPasswordStrengthLabel } from '@/lib/auth';

function PasswordInput({ value, onChange }) {
  const score = calculatePasswordStrength(value);
  const { label, color } = getPasswordStrengthLabel(score);
  
  return (
    <div>
      <input type="password" value={value} onChange={onChange} />
      <div className={`strength-${color}`}>
        Strength: {label} ({score}/100)
      </div>
    </div>
  );
}
```

### Error Handling with Recovery

```typescript
import { 
  getErrorMessage, 
  getRecoveryAction,
  AuthError 
} from '@/lib/auth';

function ErrorDisplay({ error }: { error: AuthError }) {
  const message = getErrorMessage(error);
  const recovery = getRecoveryAction(error);
  
  return (
    <div className="error">
      <p>{message}</p>
      <button onClick={() => handleRecovery(recovery.action)}>
        {recovery.description}
      </button>
    </div>
  );
}
```

## 🧪 Testing

### Unit Tests

```typescript
import { validateEmail, validatePassword } from '@/lib/auth';

describe('Email Validation', () => {
  it('validates correct email', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
  });

  it('detects invalid email', () => {
    const result = validateEmail('invalid-email');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });
});
```

### Integration Tests

```typescript
import { getSession, requireAuth } from '@/lib/auth';

describe('Session Management', () => {
  it('returns null for unauthenticated user', async () => {
    const session = await getSession();
    expect(session).toBeNull();
  });

  it('throws error when auth required', async () => {
    await expect(requireAuth()).rejects.toThrow('Authentication required');
  });
});
```

## 📝 Configuration

### Environment Variables

Required:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

Optional (OAuth):
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Custom Password Requirements

```typescript
import { validatePassword } from '@/lib/auth';

const customRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

const result = validatePassword(password, customRequirements);
```

## 🔍 Debugging

### Enable Debug Mode

Set in NextAuth config:
```typescript
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  // ...
};
```

### Correlation IDs

All errors include correlation IDs for tracing:
```typescript
const error = createAuthError(AuthError.JWT_ERROR, 'req-abc123');
console.log(error.correlationId); // 'req-abc123'
```

### Logging

All authentication events are logged:
```typescript
[NextAuth] User signed in: {
  userId: 'user_123',
  email: 'user@example.com',
  provider: 'credentials',
  timestamp: '2024-01-15T10:30:00Z'
}
```

## 🚨 Error Types

| Error | Description | Retryable |
|-------|-------------|-----------|
| `CONFIGURATION` | Auth service misconfigured | No |
| `ACCESS_DENIED` | User lacks permission | No |
| `VERIFICATION` | Email not verified | No |
| `OAUTH_ACCOUNT_NOT_LINKED` | OAuth account not linked | No |
| `CREDENTIALS_SIGNIN` | Invalid credentials | No |
| `SESSION_REQUIRED` | Authentication required | No |
| `JWT_ERROR` | Token error | Yes |
| `OAUTH_CALLBACK` | OAuth callback failed | Yes |

## 📚 Best Practices

1. **Always validate input** before authentication
2. **Use correlation IDs** for error tracking
3. **Sanitize user input** to prevent XSS
4. **Check ownership** before allowing resource access
5. **Log authentication events** for audit trails
6. **Use retry logic** for transient errors
7. **Provide clear error messages** to users
8. **Implement rate limiting** on auth endpoints

## 🔗 Related Documentation

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 📄 License

Part of the Huntaze platform - Internal use only
