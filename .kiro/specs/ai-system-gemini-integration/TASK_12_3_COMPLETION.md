# Task 12.3 Completion: Admin Authentication for AI Costs Endpoint

## Overview

Task 12.3 implemented comprehensive admin authentication and authorization for the AI costs monitoring endpoint (`/api/admin/ai-costs`). This ensures that only authorized administrators can access sensitive cost and usage data.

## What Was Implemented

### 1. Database Schema Update

**Migration**: `prisma/migrations/20241122_add_user_role/migration.sql`
- Added `role` field to `users` table
- Default value: `'user'`
- Possible values: `'user'` | `'admin'`
- Created index on `role` field for performance

```sql
ALTER TABLE "users" ADD COLUMN "role" VARCHAR(20) DEFAULT 'user' NOT NULL;
CREATE INDEX "idx_users_role" ON "users"("role");
```

### 2. Admin Authentication Utilities

**File**: `lib/auth/admin.ts`

Provides comprehensive admin authentication functions:

#### `isAdmin(): Promise<boolean>`
Check if the current session user is an admin.

```typescript
const userIsAdmin = await isAdmin();
if (userIsAdmin) {
  // User has admin privileges
}
```

#### `isUserAdmin(userId: number): Promise<boolean>`
Check if a specific user ID is an admin.

```typescript
const isAdmin = await isUserAdmin(userId);
```

#### `requireAdmin(): Promise<void>`
Require admin access - throws error if not admin. Use in API routes.

```typescript
try {
  await requireAdmin();
  // User is authenticated and is admin
} catch (error) {
  // Handle unauthorized/forbidden
}
```

#### `getUserRole(): Promise<UserRole | null>`
Get the current user's role.

```typescript
const role = await getUserRole();
// Returns: 'user' | 'admin' | null
```

### 3. Updated AI Costs Endpoint

**File**: `app/api/admin/ai-costs/route.ts`

Enhanced with proper admin authentication:

1. **Authentication Check** - Verifies user is logged in
2. **Authorization Check** - Verifies user has admin role
3. **Detailed Logging** - Logs all access attempts with correlation IDs
4. **Proper Error Responses** - Returns appropriate HTTP status codes

```typescript
// 1. Check authentication
const session = await getServerSession();
if (!session?.user?.id) {
  return NextResponse.json(
    { error: 'Authentication required', code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

// 2. Check admin role
const userIsAdmin = await isAdmin();
if (!userIsAdmin) {
  return NextResponse.json(
    { error: 'Admin access required', code: 'FORBIDDEN' },
    { status: 403 }
  );
}

// 3. User is authenticated and authorized
// ... proceed with admin logic
```

### 4. Admin Management Scripts

**File**: `scripts/promote-admin.ts`

Comprehensive script for managing admin users:

#### Promote User to Admin
```bash
npm run admin:promote user@example.com
```

#### Demote Admin to User
```bash
npm run admin:demote admin@example.com
```

#### List All Admins
```bash
npm run admin:list
```

**Features**:
- User-friendly output with emojis
- Error handling and validation
- Confirmation messages
- Database connection management

### 5. Integration Tests

**File**: `tests/integration/api/admin-ai-costs-auth.integration.test.ts`

Comprehensive test suite covering:
- Unauthorized access (401)
- Non-admin access (403)
- Admin access (200)
- Correlation ID tracking
- Admin utility functions
- Error handling

### 6. Documentation

**File**: `lib/auth/ADMIN_AUTH_GUIDE.md`

Complete guide covering:
- Overview of admin authentication
- User roles and database schema
- Admin utility functions
- Protecting API routes
- Managing admin users
- Security best practices
- Error handling
- Testing strategies
- Troubleshooting
- Migration guide

## Security Features

### 1. Role-Based Access Control (RBAC)
- Two-tier role system: `user` and `admin`
- Database-backed role verification
- Session-based authentication

### 2. Comprehensive Logging
All admin access attempts are logged with:
- Correlation ID for request tracking
- User ID and email
- Timestamp
- Access result (granted/denied)

### 3. Proper HTTP Status Codes
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not admin
- `200 OK` - Authenticated and authorized

### 4. Error Messages
Clear, actionable error messages:
- "Authentication required" for 401
- "Admin access required. This endpoint is restricted to administrators only." for 403

### 5. Correlation IDs
Every request gets a unique correlation ID for:
- Request tracking
- Debugging
- Audit trails

## Usage Examples

### Protecting an API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check admin role
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // User is authenticated and authorized
  return NextResponse.json({ data: 'Admin data' });
}
```

### Using requireAdmin Helper

```typescript
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    // User is admin, proceed
    return NextResponse.json({ data: 'Admin data' });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
```

### Managing Admins

```bash
# Promote a user to admin
npm run admin:promote admin@huntaze.com

# List all admins
npm run admin:list

# Demote an admin to regular user
npm run admin:demote former-admin@huntaze.com
```

## Response Examples

### 401 Unauthorized (Not Logged In)

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "correlationId": "ai-costs-1732234567890-abc123",
  "retryable": false
}
```

### 403 Forbidden (Not Admin)

```json
{
  "success": false,
  "error": "Admin access required. This endpoint is restricted to administrators only.",
  "code": "FORBIDDEN",
  "correlationId": "ai-costs-1732234567890-def456",
  "retryable": false
}
```

### 200 OK (Admin Access Granted)

```json
{
  "totalSpending": {
    "costUsd": 125.45,
    "tokensInput": 1500000,
    "tokensOutput": 500000
  },
  "perCreatorBreakdown": [...],
  "highCostCreators": [...],
  "anomalies": [...]
}
```

## Testing

### Unit Tests

```typescript
describe('Admin Authentication', () => {
  it('should identify admin users', async () => {
    const isAdmin = await isUserAdmin(adminUserId);
    expect(isAdmin).toBe(true);
  });

  it('should identify regular users', async () => {
    const isAdmin = await isUserAdmin(regularUserId);
    expect(isAdmin).toBe(false);
  });

  it('should handle non-existent users', async () => {
    const isAdmin = await isUserAdmin(999999);
    expect(isAdmin).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Admin AI Costs Endpoint', () => {
  it('should return 401 when not authenticated', async () => {
    const response = await fetch('/api/admin/ai-costs');
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin users', async () => {
    // With regular user session
    const response = await fetch('/api/admin/ai-costs', {
      headers: { /* regular user session */ },
    });
    expect(response.status).toBe(403);
  });

  it('should return 200 for admin users', async () => {
    // With admin user session
    const response = await fetch('/api/admin/ai-costs', {
      headers: { /* admin user session */ },
    });
    expect(response.status).toBe(200);
  });
});
```

## Security Best Practices

### 1. Principle of Least Privilege
Only grant admin access to users who absolutely need it.

### 2. Regular Audits
Periodically review admin users:
```bash
npm run admin:list
```

### 3. Secure Credentials
- Use strong passwords for admin accounts
- Enable 2FA when available
- Rotate credentials regularly

### 4. Monitor Access
Check logs for:
- Unauthorized access attempts
- Unusual admin activity
- Failed authentication

### 5. Database Security
- Protect database credentials
- Use connection pooling
- Enable SSL for database connections

## Migration Steps

For existing applications adding admin authentication:

1. **Run Prisma Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Promote Initial Admin**
   ```bash
   npm run admin:promote your-email@example.com
   ```

4. **Test Admin Access**
   - Log in as admin user
   - Access `/api/admin/ai-costs`
   - Verify 200 response

5. **Test Non-Admin Access**
   - Log in as regular user
   - Access `/api/admin/ai-costs`
   - Verify 403 response

## Files Created/Modified

### Created
- ✅ `prisma/migrations/20241122_add_user_role/migration.sql` - Database migration
- ✅ `lib/auth/admin.ts` - Admin authentication utilities
- ✅ `scripts/promote-admin.ts` - Admin management script
- ✅ `tests/integration/api/admin-ai-costs-auth.integration.test.ts` - Integration tests
- ✅ `lib/auth/ADMIN_AUTH_GUIDE.md` - Comprehensive documentation

### Modified
- ✅ `prisma/schema.prisma` - Added `role` field to users table
- ✅ `app/api/admin/ai-costs/route.ts` - Implemented admin authentication
- ✅ `package.json` - Added admin management scripts

## Validation

### Code Quality
- ✅ TypeScript compilation successful
- ✅ No linting errors
- ✅ Proper error handling
- ✅ Type-safe implementations

### Security
- ✅ Authentication check before authorization
- ✅ Proper HTTP status codes
- ✅ Detailed logging for audit trails
- ✅ Correlation IDs for request tracking

### Documentation
- ✅ Comprehensive admin guide
- ✅ Usage examples
- ✅ Security best practices
- ✅ Troubleshooting guide

## Next Steps

1. **Deploy Migration** - Run migration in production
2. **Create Initial Admin** - Promote first admin user
3. **Test in Production** - Verify authentication works
4. **Monitor Logs** - Watch for unauthorized access attempts
5. **Regular Audits** - Review admin users periodically

## Conclusion

Task 12.3 successfully implemented comprehensive admin authentication for the AI costs endpoint. The implementation includes:

- Database schema with role field
- Admin authentication utilities
- Protected API endpoint
- Admin management scripts
- Integration tests
- Comprehensive documentation

The system now properly restricts access to sensitive AI cost data to authorized administrators only, with full audit logging and proper error handling.

**Status: ✅ COMPLETE**

**Next Task: 14 - Add AI-specific monitoring and alerting**
