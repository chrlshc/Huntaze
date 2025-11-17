# Auth Onboarding Flow - Database Migration Guide

## Overview

This migration adds the `onboarding_completed` column to the `users` table to track whether users have completed the onboarding flow. This enables proper routing after authentication.

## Migration Details

### Changes

1. **Add Column**: `onboarding_completed BOOLEAN DEFAULT false`
   - New users will have `onboarding_completed = false` by default
   - Ensures new users are directed to onboarding after registration

2. **Backfill Existing Users**: Set `onboarding_completed = true` for all existing users
   - Maintains backward compatibility
   - Prevents existing users from being forced through onboarding

3. **Create Index**: `idx_users_onboarding_completed`
   - Optimizes queries that filter by onboarding status
   - Improves performance for authentication routing logic

### Requirements Addressed

- **Requirement 1.3**: Post-authentication routing based on onboarding status
- **Requirement 2.1**: Onboarding status tracking in database
- **Requirement 5.3**: Backward compatibility for existing users
- **Requirement 5.4**: Database migration with proper indexing

## Running the Migration

### Option 1: Using the Shell Script (Recommended for Production)

```bash
# Set your database URL
export DATABASE_URL='postgresql://user:password@host:port/database'

# Run the migration script
./scripts/migrate-auth-onboarding.sh
```

The script will:
- Verify DATABASE_URL is set
- Show migration details
- Prompt for confirmation
- Execute the migration
- Display verification results

### Option 2: Using the TypeScript Script (Recommended for Development)

```bash
# Make sure DATABASE_URL is set in your .env file
ts-node scripts/migrate-auth-onboarding.ts
```

Or add to package.json:
```json
{
  "scripts": {
    "migrate:auth-onboarding": "ts-node scripts/migrate-auth-onboarding.ts"
  }
}
```

Then run:
```bash
npm run migrate:auth-onboarding
```

### Option 3: Direct SQL Execution

```bash
psql $DATABASE_URL -f lib/db/migrations/2024-11-16-auth-onboarding-flow.sql
```

## Verification

After running the migration, verify the changes:

### 1. Check Column Exists

```sql
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
```

Expected result:
```
column_name          | data_type | column_default | is_nullable
---------------------|-----------|----------------|------------
onboarding_completed | boolean   | false          | YES
```

### 2. Check User Statistics

```sql
SELECT 
  COUNT(*) as total_users, 
  SUM(CASE WHEN onboarding_completed = true THEN 1 ELSE 0 END) as completed_onboarding,
  SUM(CASE WHEN onboarding_completed = false THEN 1 ELSE 0 END) as incomplete_onboarding
FROM users;
```

Expected result (for existing users):
- All existing users should have `onboarding_completed = true`
- New users created after migration will have `onboarding_completed = false`

### 3. Check Index Exists

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
```

Expected result:
```
indexname                        | indexdef
---------------------------------|------------------------------------------
idx_users_onboarding_completed   | CREATE INDEX idx_users_onboarding_completed ON public.users USING btree (onboarding_completed)
```

## Rollback

If you need to rollback the migration:

### Option 1: Using the Rollback SQL File

```bash
psql $DATABASE_URL -f lib/db/migrations/2024-11-16-auth-onboarding-flow-rollback.sql
```

### Option 2: Manual Rollback

```sql
-- Drop the index
DROP INDEX IF EXISTS idx_users_onboarding_completed;

-- Remove the column
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
```

### Verify Rollback

```sql
-- Should return 0 rows
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Should return 0 rows
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
```

## Deployment Strategy

### Staging Environment

1. **Run Migration**
   ```bash
   export DATABASE_URL=$STAGING_DATABASE_URL
   ./scripts/migrate-auth-onboarding.sh
   ```

2. **Deploy Backend Changes**
   - NextAuth configuration updates
   - Onboarding completion API endpoint

3. **Deploy Frontend Changes**
   - Auth page routing logic
   - Onboarding page updates

4. **Test Flows**
   - New user registration → onboarding → dashboard
   - Existing user login → dashboard (skip onboarding)
   - Onboarding completion → dashboard

5. **Monitor for 24 Hours**
   - Check error logs
   - Verify user flows
   - Monitor database performance

### Production Environment

1. **Schedule Maintenance Window** (Optional)
   - Migration is non-blocking and safe to run during normal operation
   - Consider off-peak hours for large user bases

2. **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup-before-onboarding-migration.sql
   ```

3. **Run Migration**
   ```bash
   export DATABASE_URL=$PRODUCTION_DATABASE_URL
   ./scripts/migrate-auth-onboarding.sh
   ```

4. **Deploy Backend Changes**
   - Use blue-green deployment or rolling updates
   - Monitor error rates

5. **Deploy Frontend Changes**
   - Deploy to CDN/static hosting
   - Clear CDN cache if necessary

6. **Monitor Closely**
   - Watch error logs for 1-2 hours
   - Check user registration/login metrics
   - Verify onboarding completion rates

## Performance Impact

### Expected Impact

- **Migration Time**: < 1 second for small databases, < 10 seconds for large databases
- **Downtime**: None (migration is non-blocking)
- **Query Performance**: Improved for onboarding status checks due to index

### Database Size Considerations

- **Column Size**: 1 byte per row (BOOLEAN)
- **Index Size**: ~8 bytes per row + overhead
- **Total Impact**: Minimal (< 10 bytes per user)

For 1 million users:
- Column: ~1 MB
- Index: ~8 MB
- Total: ~9 MB additional storage

## Troubleshooting

### Issue: DATABASE_URL not set

**Error**: `DATABASE_URL environment variable is not set`

**Solution**:
```bash
export DATABASE_URL='postgresql://user:password@host:port/database'
```

### Issue: Permission denied

**Error**: `ERROR: must be owner of table users`

**Solution**: Ensure the database user has ALTER TABLE permissions:
```sql
GRANT ALL PRIVILEGES ON TABLE users TO your_user;
```

### Issue: Column already exists

**Error**: `ERROR: column "onboarding_completed" of relation "users" already exists`

**Solution**: This is safe to ignore. The migration uses `IF NOT EXISTS` to handle this case. Verify the column exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
```

### Issue: Index already exists

**Error**: `ERROR: relation "idx_users_onboarding_completed" already exists`

**Solution**: This is safe to ignore. The migration uses `IF NOT EXISTS` to handle this case.

## Testing

### Manual Testing

1. **Test New User Registration**
   ```bash
   # Register a new user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
   
   # Verify onboarding_completed = false
   psql $DATABASE_URL -c "SELECT email, onboarding_completed FROM users WHERE email = 'test@example.com';"
   ```

2. **Test Existing User**
   ```bash
   # Check existing user
   psql $DATABASE_URL -c "SELECT email, onboarding_completed FROM users LIMIT 1;"
   # Should show onboarding_completed = true
   ```

3. **Test Onboarding Completion**
   ```bash
   # Complete onboarding (requires authentication)
   curl -X POST http://localhost:3000/api/onboard/complete \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{"answers":{"goal":"grow_audience"}}'
   
   # Verify onboarding_completed = true
   psql $DATABASE_URL -c "SELECT email, onboarding_completed FROM users WHERE email = 'test@example.com';"
   ```

### Automated Testing

Run integration tests after migration:
```bash
npm run test:integration -- tests/integration/auth/onboarding-flow.test.ts
```

## Related Files

### Migration Files
- `lib/db/migrations/2024-11-16-auth-onboarding-flow.sql` - Forward migration
- `lib/db/migrations/2024-11-16-auth-onboarding-flow-rollback.sql` - Rollback migration

### Scripts
- `scripts/migrate-auth-onboarding.sh` - Shell script for migration
- `scripts/migrate-auth-onboarding.ts` - TypeScript script for migration

### Documentation
- `.kiro/specs/auth-onboarding-flow/requirements.md` - Feature requirements
- `.kiro/specs/auth-onboarding-flow/design.md` - Feature design
- `.kiro/specs/auth-onboarding-flow/tasks.md` - Implementation tasks

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the design document: `.kiro/specs/auth-onboarding-flow/design.md`
3. Check database logs for detailed error messages
4. Verify DATABASE_URL is correct and accessible

## Changelog

### 2024-11-16
- Initial migration created
- Added onboarding_completed column
- Created index for performance
- Backfilled existing users for backward compatibility
