# Admin Authentication Guide

This guide explains how admin authentication works in the Huntaze application and how to manage admin users.

## Overview

The admin authentication system provides role-based access control (RBAC) for sensitive endpoints like the AI cost monitoring dashboard. Only users with the `admin` role can access admin-protected endpoints.

## User Roles

The system supports two roles:

- **`user`** (default) - Regular users with standard access
- **`admin`** - Administrators with access to admin endpoints

## Database Schema

The `users` table includes a `role` field:

```sql
ALTER TABLE "users" ADD COLUMN "role" VARCHAR(20) DEFAULT 'user' NOT NULL;
CREATE INDEX "idx_users_role" ON "users"("role");
```

## Admin Utilities

### Check if Current User is Admin

```typescript
import { isAdmin } from '@/lib/auth/admin';

const userIsAdmin = await isAdmin();
if (userIsAdmin) {
  // User has admin privileges
}
```

### Check if Specific User is Admin

```typescript
import { isUserAdmin } from '@/lib/auth/admin';

const isAdmin = await isUserAdmin(userId);
```

### Require Admin Access (Throws Error)

```typescript
import { requireAdmin } from '@/lib/auth/admin';

try {
  await requireAdmin();
  // User is admin, continue
} catch (error) {
  // User is not admin or not authenticated
}
```

### Get User Role

```typescript
import { getUserRole } from '@/lib/auth/admin';

const role = await getUserRole();
// Returns: 'user' | 'admin' | null
```

## Protecting API Routes

### Example: Admin-Only Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  // 1. Check authentication
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Check admin role
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // 3. User is authenticated and is admin
  // ... your admin logic here
}
```

### Using requireAdmin Helper

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    // User is authenticated and is admin
    // ... your admin logic here
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
}
```

## Managing Admin Users

### Promote User to Admin

Using npm script:
```bash
npm run admin:promote user@example.com
```

Using tsx directly:
```bash
npx tsx scripts/promote-admin.ts user@example.com
```

### Demote Admin to User

Using npm script:
```bash
npm run admin:demote admin@example.com
```

Using tsx directly:
```bash
npx tsx scripts/promote-admin.ts demote admin@example.com
```

### List All Admins

Using npm script:
```bash
npm run admin:list
```

Using tsx directly:
```bash
npx tsx scripts/promote-admin.ts list
```

### Manual Database Update

You can also update roles directly in the database:

```sql
-- Promote user to admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Demote admin to user
UPDATE users SET role = 'user' WHERE email = 'admin@example.com';

-- List all admins
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin' 
ORDER BY created_at;
```

## Protected Endpoints

The following endpoints require admin access:

### `/api/admin/ai-costs`
- **Purpose**: AI cost monitoring dashboard
- **Method**: GET
- **Authentication**: Required
- **Authorization**: Admin only
- **Response Codes**:
  - `200` - Success (admin user)
  - `401` - Not authenticated
  - `403` - Not an admin
  - `400` - Invalid parameters
  - `500` - Server error

## Security Best Practices

### 1. Principle of Least Privilege
Only grant admin access to users who absolutely need it.

### 2. Audit Admin Actions
All admin access attempts are logged with:
- Correlation ID
- User ID
- Email
- Timestamp
- Action attempted

### 3. Regular Review
Periodically review admin users:
```bash
npm run admin:list
```

### 4. Secure Admin Credentials
- Use strong passwords for admin accounts
- Enable 2FA when available
- Rotate admin credentials regularly

### 5. Monitor Admin Activity
Check logs for:
- Unauthorized access attempts
- Unusual admin activity patterns
- Failed authentication attempts

## Error Handling

### 401 Unauthorized
User is not authenticated. They need to log in.

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "correlationId": "ai-costs-1234567890-abc123",
  "retryable": false
}
```

### 403 Forbidden
User is authenticated but not an admin.

```json
{
  "success": false,
  "error": "Admin access required. This endpoint is restricted to administrators only.",
  "code": "FORBIDDEN",
  "correlationId": "ai-costs-1234567890-abc123",
  "retryable": false
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { isUserAdmin } from '@/lib/auth/admin';

describe('Admin Authentication', () => {
  it('should identify admin users', async () => {
    const isAdmin = await isUserAdmin(adminUserId);
    expect(isAdmin).toBe(true);
  });

  it('should identify regular users', async () => {
    const isAdmin = await isUserAdmin(regularUserId);
    expect(isAdmin).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Admin Endpoints', () => {
  it('should reject non-admin users', async () => {
    const response = await fetch('/api/admin/ai-costs', {
      headers: {
        // Regular user session
      },
    });
    
    expect(response.status).toBe(403);
  });

  it('should allow admin users', async () => {
    const response = await fetch('/api/admin/ai-costs', {
      headers: {
        // Admin user session
      },
    });
    
    expect(response.status).toBe(200);
  });
});
```

## Troubleshooting

### User Can't Access Admin Endpoint

1. **Check if user is authenticated**
   ```typescript
   const session = await getServerSession();
   console.log('Session:', session);
   ```

2. **Check user role in database**
   ```sql
   SELECT id, email, role FROM users WHERE email = 'user@example.com';
   ```

3. **Verify admin check is working**
   ```typescript
   const isAdmin = await isUserAdmin(userId);
   console.log('Is admin:', isAdmin);
   ```

### Admin Status Not Updating

1. **Clear session cache** - Log out and log back in
2. **Check database** - Verify role was updated
3. **Restart server** - Ensure changes are picked up

### Script Errors

If the promote-admin script fails:

1. **Check database connection**
   ```bash
   npx prisma db pull
   ```

2. **Verify user exists**
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```

3. **Check permissions**
   - Ensure database user has UPDATE permissions
   - Verify Prisma client is generated

## Migration Guide

### Adding Admin Role to Existing Users

If you're adding the admin system to an existing application:

1. **Run the migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify migration**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'role';
   ```

3. **Promote initial admin**
   ```bash
   npm run admin:promote your-email@example.com
   ```

4. **Test admin access**
   - Log in as the admin user
   - Try accessing `/api/admin/ai-costs`
   - Verify you get a 200 response

## Related Documentation

- [Authentication Guide](./README.md)
- [API Authentication](../api/middleware/auth.ts)
- [Admin AI Costs Endpoint](../../app/api/admin/ai-costs/README.md)
- [Security Best Practices](../api/API_BEST_PRACTICES.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Verify database schema matches expected structure
4. Test with a fresh user account
