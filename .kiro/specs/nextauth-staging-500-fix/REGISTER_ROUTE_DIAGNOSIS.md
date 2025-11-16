# /api/auth/register Route Diagnosis

## Issue Summary

The `/api/auth/register` endpoint returns a 500 error with `NETWORK_ERROR` type, indicating a database connection failure.

---

## Test Results

### Request
```bash
curl -X POST https://staging.huntaze.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### Response
```json
{
  "error": "Network connection error. Please check your internet connection.",
  "type": "NETWORK_ERROR",
  "correlationId": "auth-1763298958825-eckn66q3l"
}
```

---

## Root Cause Analysis

### 1. Error Flow

**Route:** `app/api/auth/register/route.ts`
- Calls `registrationService.register()`

**Service:** `lib/services/auth/register.ts`
- Validates input ✅
- Calls `checkUserExists()` → uses `query()` from `lib/db.ts`
- **Fails here** with connection error

**Database:** `lib/db.ts`
- Creates PostgreSQL Pool with `process.env.DATABASE_URL`
- **DATABASE_URL is not set in Amplify staging** ❌
- Connection fails → throws error

**Error Mapping:** `lib/services/auth/errors.ts`
- Maps connection errors to `NETWORK_ERROR`
- Returns user-friendly message

### 2. Code Analysis

**lib/db.ts:**
```typescript
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,  // ❌ Not set
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}
```

**lib/services/auth/errors.ts:**
```typescript
export function mapDatabaseError(error: any): AuthErrorType {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('econnrefused')) {
    return AuthErrorType.NETWORK_ERROR;  // ✅ Correctly mapped
  }
  
  return AuthErrorType.DATABASE_ERROR;
}
```

### 3. Environment Check

**Current staging environment:**
```bash
curl -s https://staging.huntaze.com/api/health-check | jq .env
```

```json
{
  "hasNextAuthSecret": false,
  "hasNextAuthUrl": false,
  "hasDatabaseUrl": false,  // ❌ Missing
  "nodeEnv": "production"
}
```

---

## Solution

### Required Environment Variables

Configure these in AWS Amplify Console for the **staging** branch:

1. **DATABASE_URL** (Critical - fixes /api/auth/register)
   ```
   postgresql://username:password@host:5432/database?sslmode=require
   ```
   - Format: `postgresql://[user]:[password]@[host]:[port]/[database]`
   - Must point to your RDS PostgreSQL instance
   - Include `?sslmode=require` for production SSL

2. **NEXTAUTH_SECRET** (Critical - fixes /api/auth/[...nextauth])
   ```bash
   # Generate with:
   openssl rand -base64 32
   ```

3. **NEXTAUTH_URL** (Critical - fixes /api/auth/[...nextauth])
   ```
   https://staging.huntaze.com
   ```

### Configuration Steps

#### Option 1: AWS Amplify Console (Recommended)

1. Go to AWS Amplify Console
2. Select the Huntaze application
3. Navigate to: **App settings** → **Environment variables**
4. Click **Manage variables**
5. Add for **staging** branch:
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
   NEXTAUTH_SECRET=[generated-secret]
   NEXTAUTH_URL=https://staging.huntaze.com
   ```
6. Save changes
7. Redeploy (automatic or manual trigger)

#### Option 2: AWS CLI

```bash
# Set your Amplify App ID
export AMPLIFY_APP_ID=d33l77zi1h78ce

# Generate NEXTAUTH_SECRET
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set your DATABASE_URL (replace with actual values)
export DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# Update environment variables
aws amplify update-branch \
  --app-id $AMPLIFY_APP_ID \
  --branch-name staging \
  --environment-variables \
    DATABASE_URL="$DATABASE_URL" \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="https://staging.huntaze.com"

# Trigger rebuild
aws amplify start-job \
  --app-id $AMPLIFY_APP_ID \
  --branch-name staging \
  --job-type RELEASE
```

---

## Database Schema Requirements

The registration service expects the following table structure:

### users table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(LOWER(email));
```

### Verify Schema

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

---

## Verification Steps

### After Environment Variables Are Set

1. **Wait for rebuild** (~5 minutes)

2. **Verify environment variables:**
   ```bash
   curl -s https://staging.huntaze.com/api/health-check | jq .env
   ```
   
   Expected:
   ```json
   {
     "hasNextAuthSecret": true,
     "hasNextAuthUrl": true,
     "hasDatabaseUrl": true,
     "nodeEnv": "production"
   }
   ```

3. **Test registration endpoint:**
   ```bash
   curl -X POST https://staging.huntaze.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!",
       "fullName": "Test User"
     }' | jq .
   ```
   
   Expected success:
   ```json
   {
     "success": true,
     "user": {
       "id": 1,
       "email": "test@example.com",
       "name": "Test User"
     },
     "message": "Account created successfully. Please check your email to verify your account."
   }
   ```

4. **Test NextAuth providers:**
   ```bash
   curl -s https://staging.huntaze.com/api/auth/providers | jq .
   ```
   
   Expected:
   ```json
   {
     "credentials": {
       "id": "credentials",
       "name": "Credentials",
       "type": "credentials"
     }
   }
   ```

---

## CloudWatch Logs

### Search for Correlation ID

Use the correlation ID from the error response to find detailed logs:

```
correlationId: "auth-1763298958825-eckn66q3l"
```

**Log Group:** `/aws/amplify/[app-id]/staging`

**Filter Pattern:**
```
{ $.correlationId = "auth-1763298958825-eckn66q3l" }
```

Or search for:
```
"Registration failed"
"Database query error"
"connection"
"ECONNREFUSED"
```

### Expected Log Entries (After Fix)

```json
{
  "level": "info",
  "message": "Registration started",
  "correlationId": "auth-...",
  "email": "test@example.com"
}

{
  "level": "info",
  "message": "Registration successful",
  "correlationId": "auth-...",
  "userId": 1,
  "email": "test@example.com",
  "duration": 234
}
```

---

## Common Issues

### 1. DATABASE_URL Format Issues

**Wrong:**
```
postgres://user:pass@host:5432/db
```

**Correct:**
```
postgresql://user:pass@host:5432/db?sslmode=require
```

### 2. VPC/Security Group Issues

If DATABASE_URL is set but still getting NETWORK_ERROR:

- Check RDS Security Group allows inbound from Amplify
- Check RDS is publicly accessible (or Amplify is in same VPC)
- Check RDS endpoint is correct
- Test connection from another source

### 3. Schema Issues

If connection works but getting different errors:

```json
{
  "error": "relation \"users\" does not exist",
  "type": "DATABASE_ERROR"
}
```

Solution: Run the schema creation SQL above.

### 4. Password Column Missing

```json
{
  "error": "column \"password\" does not exist",
  "type": "DATABASE_ERROR"
}
```

Solution: Add missing column:
```sql
ALTER TABLE users ADD COLUMN password VARCHAR(255);
```

---

## Summary

**Current Status:**
- ❌ `/api/auth/register` → 500 NETWORK_ERROR (DATABASE_URL missing)
- ❌ `/api/auth/[...nextauth]` → Configuration error (NEXTAUTH_SECRET missing)
- ✅ `/api/ping` → Working
- ✅ `/api/health-check` → Working

**Required Actions:**
1. Set DATABASE_URL in Amplify staging environment
2. Set NEXTAUTH_SECRET in Amplify staging environment
3. Set NEXTAUTH_URL in Amplify staging environment
4. Verify database schema exists
5. Redeploy and test

**ETA to Fix:** 10-15 minutes (5 min config + 5 min rebuild + 5 min testing)
