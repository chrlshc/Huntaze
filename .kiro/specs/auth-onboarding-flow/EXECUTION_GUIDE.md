# Auth-Onboarding Flow Spec Execution Guide

This guide explains how to execute the auth-onboarding-flow spec with real database values.

## Overview

The auth-onboarding-flow spec has been fully implemented and tested. This guide provides scripts to execute the migration and tests against the production database using real AWS credentials.

## Prerequisites

1. **PostgreSQL Client**: Install `psql` command-line tool
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   ```

2. **Node.js and npm**: Ensure you have Node.js 18+ installed
   ```bash
   node --version  # Should be 18.x or higher
   npm --version
   ```

3. **AWS Credentials**: The scripts use AWS credentials for database access (already configured in the scripts)

4. **Database Access**: Ensure you can connect to the RDS instance from your network

## Available Scripts

### 1. Complete Execution (Recommended)

Execute the entire spec including migration and tests:

```bash
./scripts/execute-auth-onboarding-spec.sh
```

This script will:
- Check prerequisites (psql, npm, database connection)
- Create a database backup
- Run the migration to add `onboarding_completed` column
- Run integration tests to verify the implementation
- Provide a summary and next steps

### 2. Migration Only

Run only the database migration:

```bash
./scripts/run-auth-onboarding-migration.sh
```

This script will:
- Test database connection
- Check current migration status
- Create a backup before migration
- Run the migration SQL script
- Verify the migration was successful

### 3. Tests Only

Run only the integration tests (requires migration to be completed first):

```bash
./scripts/run-auth-onboarding-tests.sh
```

This script will:
- Verify migration is complete
- Run integration tests against the real database
- Clean up test users after tests
- Report test results

## Database Configuration

The scripts connect to the production database with these credentials:

- **Host**: `huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `huntazeadmin`
- **Region**: `us-east-1`

AWS credentials are configured in the scripts for authentication.

## What the Migration Does

The migration script (`migrations/001_add_onboarding_completed.sql`) performs these operations:

1. **Add Column**: Adds `onboarding_completed BOOLEAN DEFAULT false` to the `users` table
2. **Backfill Data**: Sets all existing users to `onboarding_completed = true` for backward compatibility
3. **Create Index**: Creates an index on `onboarding_completed` for query performance
4. **Add Comment**: Documents the column purpose

### Migration Safety

- Uses `IF NOT EXISTS` to prevent errors if column already exists
- Creates index `CONCURRENTLY` to avoid table locks
- Includes verification queries to check migration success
- Creates automatic backup before running

## What the Tests Do

The integration tests (`tests/integration/auth/auth-onboarding-flow.test.ts`) verify:

1. **Registration Flow**: New users have `onboarding_completed = false`
2. **Login Flow**: Session includes onboarding status
3. **Onboarding Completion**: Database updates correctly when onboarding is completed
4. **Onboarding Skip**: Database updates correctly when onboarding is skipped
5. **Backward Compatibility**: Existing users maintain `onboarding_completed = true`
6. **Performance**: Operations complete within acceptable time limits
7. **Concurrent Operations**: System handles concurrent updates correctly

### Test Data

Tests create temporary users with emails like:
- `test-reg-{timestamp}@example.com`
- `test-login-incomplete-{timestamp}@example.com`
- `test-complete-{timestamp}@example.com`

These are automatically cleaned up after tests complete.

## Execution Flow

```
┌─────────────────────────────────────────┐
│  1. Prerequisites Check                 │
│     - psql installed                    │
│     - npm installed                     │
│     - Database connection               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Database Migration                  │
│     - Create backup                     │
│     - Add onboarding_completed column   │
│     - Backfill existing users           │
│     - Create index                      │
│     - Verify migration                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Integration Tests                   │
│     - Test registration flow            │
│     - Test login flows                  │
│     - Test onboarding completion        │
│     - Test backward compatibility       │
│     - Clean up test data                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Verification                        │
│     - Check schema                      │
│     - Check data distribution           │
│     - Report results                    │
└─────────────────────────────────────────┘
```

## Expected Output

### Successful Execution

```
==========================================
Auth-Onboarding Flow Spec Execution
==========================================

[INFO] This script will execute the complete auth-onboarding-flow spec:
[INFO]   1. Run database migration
[INFO]   2. Run integration tests
[INFO]   3. Verify implementation

[STEP] Checking prerequisites...
[INFO] ✓ psql installed
[INFO] ✓ npm installed
[INFO] ✓ Database connection successful

==========================================
Phase 1: Database Migration
==========================================

[STEP] 1. Testing database connection...
[INFO] ✓ Database connection successful

[STEP] 2. Checking current migration status...
[INFO] Column 'onboarding_completed' does not exist - migration needed

[STEP] 3. Creating backup...
[INFO] Creating backup: backup_auth_onboarding_20240116_143022.sql
[INFO] ✓ Backup created successfully: backup_auth_onboarding_20240116_143022.sql (2.5M)

[STEP] 4. Running migration...
[INFO] ✓ Migration completed successfully

[STEP] 5. Verifying migration...
[INFO] Checking column...
 column_name         | data_type | column_default | is_nullable 
---------------------+-----------+----------------+-------------
 onboarding_completed | boolean   | false          | YES

[INFO] Checking data distribution...
 total_users | completed_users | incomplete_users | null_users 
-------------+-----------------+------------------+------------
        1234 |            1234 |                0 |          0

==========================================
Phase 2: Integration Tests
==========================================

[STEP] 3. Running integration tests...
✓ Auth-Onboarding Flow Integration Tests (15 tests passed)

==========================================
Phase 3: Verification
==========================================

[INFO] ✓ onboarding_completed column exists
[INFO] ✓ Index exists
[INFO] 2. Data distribution:
 total_users | completed_users | incomplete_users | completion_rate 
-------------+-----------------+------------------+-----------------
        1234 |            1234 |                0 |          100.00

==========================================
All tasks completed successfully!
==========================================

Next steps:
1. Review the spec documentation
2. Deploy application code to staging
3. Test the complete flow in staging
4. Monitor for 24-48 hours before production
```

## Troubleshooting

### Database Connection Failed

**Error**: `Database connection failed`

**Solution**:
1. Check your network connection
2. Verify AWS credentials are valid (they may have expired)
3. Ensure your IP is whitelisted in RDS security group
4. Try connecting manually: `psql "postgresql://huntazeadmin:PASSWORD@HOST:5432/postgres"`

### Column Already Exists

**Error**: `Column 'onboarding_completed' already exists`

**Solution**: This is safe to ignore. The migration uses `IF NOT EXISTS` to handle this case. The script will ask if you want to re-run the migration.

### Tests Failed

**Error**: Some integration tests failed

**Solution**:
1. Check the test output for specific failures
2. Verify migration completed successfully
3. Check database connection during tests
4. Review test logs for error details
5. Clean up any leftover test users: `DELETE FROM users WHERE email LIKE 'test-%@example.com';`

### Permission Denied

**Error**: `Permission denied` when running scripts

**Solution**:
```bash
chmod +x scripts/execute-auth-onboarding-spec.sh
chmod +x scripts/run-auth-onboarding-migration.sh
chmod +x scripts/run-auth-onboarding-tests.sh
```

### AWS Credentials Expired

**Error**: AWS authentication failed

**Solution**: AWS session tokens expire after a certain time. You'll need to:
1. Get new AWS credentials from AWS Console
2. Update the credentials in the scripts
3. Re-run the script

## Rollback Procedure

If you need to rollback the migration:

```bash
# Connect to database
psql "postgresql://huntazeadmin:PASSWORD@HOST:5432/postgres"

# Run rollback commands
DROP INDEX IF EXISTS idx_users_onboarding_completed;
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;

# Verify rollback
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
-- Should return 0 rows
```

Or restore from backup:

```bash
# List backups
ls -lh backup_auth_onboarding_*.sql

# Restore from backup
psql "postgresql://huntazeadmin:PASSWORD@HOST:5432/postgres" < backup_auth_onboarding_TIMESTAMP.sql
```

## Next Steps After Execution

1. **Review Documentation**:
   - Requirements: `.kiro/specs/auth-onboarding-flow/requirements.md`
   - Design: `.kiro/specs/auth-onboarding-flow/design.md`
   - Tasks: `.kiro/specs/auth-onboarding-flow/tasks.md`

2. **Deploy to Staging**:
   ```bash
   git add .
   git commit -m "feat: implement auth-onboarding flow"
   git push origin staging
   ```

3. **Test in Staging**:
   - Register a new user
   - Verify redirect to onboarding
   - Complete onboarding
   - Verify redirect to dashboard
   - Login again and verify direct dashboard access

4. **Monitor Staging**:
   - Check application logs for errors
   - Monitor database performance
   - Verify user flows work correctly
   - Wait 24-48 hours before production

5. **Deploy to Production**:
   - Follow the deployment guide: `migrations/DEPLOYMENT_GUIDE.md`
   - Create production backup
   - Run migration on production
   - Deploy application code
   - Monitor closely for 24 hours

## Support

For issues or questions:
- Review the spec documentation in `.kiro/specs/auth-onboarding-flow/`
- Check the deployment guide: `migrations/DEPLOYMENT_GUIDE.md`
- Review the migration README: `migrations/README.md`

## Security Notes

⚠️ **Important Security Considerations**:

1. **AWS Credentials**: The scripts contain AWS credentials. These should be:
   - Rotated regularly
   - Not committed to version control
   - Stored securely (use environment variables or AWS Secrets Manager)

2. **Database Password**: The database password is in the scripts. Consider:
   - Using AWS IAM authentication instead
   - Storing credentials in AWS Secrets Manager
   - Rotating passwords regularly

3. **Production Access**: These scripts access the production database. Always:
   - Create backups before running
   - Test in staging first
   - Run during low-traffic hours
   - Have a rollback plan ready

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-16 | 1.0 | Initial execution guide | Kiro AI |

---

**Last Updated**: 2024-01-16
