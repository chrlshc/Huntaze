# Authentication System Migration Guide

This guide helps you migrate from the old authentication system to the new optimized NextAuth implementation.

## 📋 Overview

The new authentication system provides:
- ✅ Comprehensive error handling
- ✅ Retry logic with exponential backoff
- ✅ Input validation and sanitization
- ✅ TypeScript strict typing
- ✅ Session management utilities
- ✅ Security best practices

## 🔄 Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
```

**After:**
```typescript
import { getSession, requireAuth, validateOwnership } from '@/lib/auth';

const session = await getSession();
// or
const session = await requireAuth(); // Throws if not authenticated
```

### Step 2: Update API Routes

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  // ...
}
```

**After:**
```typescript
import { getSession, validateOwnership } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const creatorId = request.nextUrl.searchParams.get('creatorId');
  
  if (!validateOwnership(session, creatorId)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request...
}
```

### Step 3: Add Input Validation

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  // No validation
  const result = await signIn('credentials', { email, password });
}
```

**After:**
```typescript
import { validateSignInCredentials, sanitizeEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  // Sanitize
  const cleanEmail = sanitizeEmail(email);
  
  // Validate
  const validation = validateSignInCredentials(cleanEmail, password);
  if (!validation.valid) {
    return Response.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    );
  }
  
  // Proceed with sign in
  const result = await signIn('credentials', { 
    email: cleanEmail, 
    password 
  });
}
```

### Step 4: Update Error Handling

**Before:**
```typescript
try {
  const result = await signIn('credentials', { email, password });
  if (result?.error) {
    console.error('Sign in failed:', result.error);
  }
} catch (error) {
  console.error('Error:', error);
}
```

**After:**
```typescript
import { 
  getErrorMessage, 
  getRecoveryAction, 
  AuthError 
} from '@/lib/auth';

try {
  const result = await signIn('credentials', { email, password });
  
  if (result?.error) {
    const error = result.error as AuthError;
    const message = getErrorMessage(error);
    const recovery = getRecoveryAction(error);
    
    console.error('[Auth] Sign in failed:', {
      error,
      message,
      recovery: recovery.description,
    });
    
    // Show user-friendly message
    setError(message);
    setRecoveryAction(recovery);
  }
} catch (error) {
  console.error('[Auth] Unexpected error:', error);
  setError('An unexpected error occurred. Please try again.');
}
```

### Step 5: Update Components

**Before:**
```typescript
function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn('credentials', { email, password });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

**After:**
```typescript
import { 
  validateSignInCredentials, 
  sanitizeEmail,
  getErrorMessage,
  AuthError 
} from '@/lib/auth';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    
    try {
      // Sanitize
      const cleanEmail = sanitizeEmail(email);
      
      // Validate
      const validation = validateSignInCredentials(cleanEmail, password);
      if (!validation.valid) {
        setErrors(validation.errors);
        setIsLoading(false);
        return;
      }
      
      // Sign in
      const result = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        const error = result.error as AuthError;
        setErrors([getErrorMessage(error)]);
        setIsLoading(false);
        return;
      }
      
      // Success
      router.push('/dashboard');
    } catch (error) {
      setErrors(['An unexpected error occurred.']);
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        disabled={isLoading}
      />
      <input 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)}
        disabled={isLoading}
      />
      
      {errors.length > 0 && (
        <div className="error">
          {errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## 🔒 Security Improvements

### Password Validation

**Add password strength indicator:**
```typescript
import { 
  calculatePasswordStrength, 
  getPasswordStrengthLabel 
} from '@/lib/auth';

function PasswordInput({ value, onChange }) {
  const score = calculatePasswordStrength(value);
  const { label, color } = getPasswordStrengthLabel(score);
  
  return (
    <div>
      <input 
        type="password" 
        value={value} 
        onChange={onChange}
      />
      <div className={`strength-${color}`}>
        Strength: {label} ({score}/100)
      </div>
    </div>
  );
}
```

### Disposable Email Detection

**Block disposable emails:**
```typescript
import { isDisposableEmail } from '@/lib/auth';

function validateEmail(email: string) {
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed',
    };
  }
  return { valid: true };
}
```

### Input Sanitization

**Always sanitize user input:**
```typescript
import { sanitizeEmail, sanitizeName } from '@/lib/auth';

function handleSignUp(email: string, name: string) {
  const cleanEmail = sanitizeEmail(email);
  const cleanName = sanitizeName(name);
  
  // Use cleaned values
  await createUser({ email: cleanEmail, name: cleanName });
}
```

## 📊 Type Safety

### Use Extended Types

**Before:**
```typescript
const session = await getServerSession(authOptions);
const userId = session?.user?.id; // Type: string | undefined
```

**After:**
```typescript
import type { ExtendedSession } from '@/lib/auth';

const session = await getSession();
const userId = session?.user.id; // Type: string (guaranteed if session exists)
```

### Type Guards

**Use type guards for safety:**
```typescript
import { isSessionValid } from '@/lib/auth';

const session = await getSession();

if (isSessionValid(session)) {
  // TypeScript knows session.user exists here
  console.log(session.user.email);
}
```

## 🧪 Testing

### Update Tests

**Before:**
```typescript
test('requires authentication', async () => {
  const response = await fetch('/api/protected');
  expect(response.status).toBe(401);
});
```

**After:**
```typescript
import { getSession } from '@/lib/auth';

test('requires authentication', async () => {
  const session = await getSession();
  expect(session).toBeNull();
  
  const response = await fetch('/api/protected');
  expect(response.status).toBe(401);
  
  const data = await response.json();
  expect(data.error).toBe('Unauthorized');
});
```

### Mock Auth Functions

**Create test helpers:**
```typescript
// tests/helpers/auth.ts
import type { ExtendedSession } from '@/lib/auth';

export function createMockSession(overrides?: Partial<ExtendedSession>): ExtendedSession {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'creator',
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}
```

## 📝 Checklist

### For Each API Route

- [ ] Replace `getServerSession` with `getSession` or `requireAuth`
- [ ] Add input validation with `validate*` functions
- [ ] Add input sanitization with `sanitize*` functions
- [ ] Use `validateOwnership` for resource access
- [ ] Add proper error handling with `createAuthError`
- [ ] Add correlation IDs for tracing
- [ ] Update TypeScript types to use `ExtendedSession`

### For Each Component

- [ ] Add input validation before submission
- [ ] Add loading states during auth operations
- [ ] Display user-friendly error messages
- [ ] Add recovery actions for errors
- [ ] Disable inputs during loading
- [ ] Add password strength indicator (for sign up)
- [ ] Sanitize all user inputs

### For Tests

- [ ] Update imports to use new auth module
- [ ] Use mock helpers for sessions
- [ ] Test validation logic
- [ ] Test error handling
- [ ] Test recovery actions

## 🚀 Deployment

### Environment Variables

Ensure these are set:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
```

### Monitoring

Add monitoring for:
- Authentication success/failure rates
- Error types and frequencies
- Session creation/expiration
- OAuth provider usage

### Rollback Plan

If issues occur:
1. Revert to previous auth implementation
2. Keep new validation functions (they're standalone)
3. Gradually migrate routes one by one
4. Monitor error rates closely

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Auth Module README](../lib/auth/README.md)
- [API Optimization Summary](../AUTH_API_OPTIMIZATION_SUMMARY.md)
- [Example Sign In Form](../components/auth/SignInForm.tsx)

## 🆘 Troubleshooting

### Common Issues

**Issue: "Session is null"**
```typescript
// Check if NEXTAUTH_SECRET is set
console.log('NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET);

// Check if cookies are being set
console.log('Cookies:', request.headers.get('cookie'));
```

**Issue: "Validation errors not showing"**
```typescript
// Ensure you're using the validation result
const result = validateSignInCredentials(email, password);
console.log('Validation:', result);

if (!result.valid) {
  console.log('Errors:', result.errors);
  setErrors(result.errors); // Make sure this is called
}
```

**Issue: "OAuth not working"**
```typescript
// Check OAuth configuration
console.log('Google Client ID:', !!process.env.GOOGLE_CLIENT_ID);
console.log('Google Client Secret:', !!process.env.GOOGLE_CLIENT_SECRET);

// Check callback URL
console.log('Callback URL:', `${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
```

## 💡 Best Practices

1. **Always validate input** before authentication
2. **Always sanitize input** to prevent XSS
3. **Use correlation IDs** for error tracking
4. **Log authentication events** for audit trails
5. **Provide clear error messages** to users
6. **Implement rate limiting** on auth endpoints
7. **Use TypeScript types** for type safety
8. **Test error scenarios** thoroughly

## 📞 Support

For questions or issues:
1. Check the [Auth Module README](../lib/auth/README.md)
2. Review [example implementations](../components/auth/)
3. Check [unit tests](../tests/unit/auth/) for usage patterns
4. Contact the development team

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0  
**Status:** Production Ready
