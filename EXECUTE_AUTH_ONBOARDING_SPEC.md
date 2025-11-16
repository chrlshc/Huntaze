# Quick Start: Execute Auth-Onboarding Spec

This document provides a quick reference for executing the auth-onboarding-flow spec with real database values.

## TL;DR

```bash
# Execute everything (migration + tests)
./scripts/execute-auth-onboarding-spec.sh
```

## What This Does

The script will:
1. ✅ Connect to production database using AWS credentials
2. ✅ Create a backup before making changes
3. ✅ Run database migration to add `onboarding_completed` column
4. ✅ Backfill existing users with `onboarding_completed = true`
5. ✅ Create performance index
6. ✅ Run integration tests to verify implementation
7. ✅ Clean up test data
8. ✅ Provide verification and next steps

## Prerequisites

```bash
# Install PostgreSQL client (if not already installed)
brew install postgresql  # macOS

# Verify installation
psql --version
node --version  # Should be 18+
npm --version
```

## Individual Scripts

### 1. Migration Only
```bash
./scripts/run-auth-onboarding-migration.sh
```

### 2. Tests Only
```bash
./scripts/run-auth-onboarding-tests.sh
```

### 3. Complete Execution (Recommended)
```bash
./scripts/execute-auth-onboarding-spec.sh
```

## Database Configuration

- **Host**: `huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com`
- **Database**: `postgres`
- **User**: `huntazeadmin`
- **Region**: `us-east-1`

AWS credentials are pre-configured in the scripts.

## What Gets Changed

### Database Schema
```sql
-- Adds this column to users table
ALTER TABLE users 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Sets existing users to true (backward compatibility)
UPDATE users SET onboarding_completed = true;

-- Creates index for performance
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);
```

### No Code Changes Required
All code has already been implemented:
- ✅ NextAuth configuration updated
- ✅ Auth page routing logic added
- ✅ Onboarding page updated
- ✅ API endpoint created
- ✅ Type definitions extended
- ✅ Tests written

## Expected Duration

- **Migration**: 30 seconds - 2 minutes (depending on user count)
- **Tests**: 1-3 minutes
- **Total**: 2-5 minutes

## Safety Features

1. **Automatic Backup**: Creates backup before migration
2. **Idempotent**: Safe to run multiple times
3. **Non-Destructive**: Only adds data, doesn't remove anything
4. **Test Cleanup**: Automatically removes test users
5. **Verification**: Checks everything worked correctly

## Rollback

If needed, rollback is simple:

```bash
# Connect to database
psql "postgresql://huntazeadmin:PASSWORD@HOST:5432/postgres"

# Rollback
DROP INDEX IF EXISTS idx_users_onboarding_completed;
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
```

Or restore from backup:
```bash
psql "postgresql://..." < backup_auth_onboarding_TIMESTAMP.sql
```

## After Execution

1. **Deploy to Staging**:
   ```bash
   git push origin staging
   ```

2. **Test in Staging**:
   - Register new user → Should see onboarding
   - Complete onboarding → Should see dashboard
   - Login again → Should go directly to dashboard

3. **Monitor for 24-48 hours**

4. **Deploy to Production** (follow deployment guide)

## Troubleshooting

### Connection Failed
- Check network connection
- Verify AWS credentials haven't expired
- Ensure IP is whitelisted in RDS security group

### Column Already Exists
- Safe to ignore - migration handles this
- Script will ask if you want to re-run

### Tests Failed
- Check test output for details
- Verify migration completed
- Clean up test users if needed

### Permission Denied
```bash
chmod +x scripts/*.sh
```

## Documentation

Full documentation available at:
- **Execution Guide**: `.kiro/specs/auth-onboarding-flow/EXECUTION_GUIDE.md`
- **Requirements**: `.kiro/specs/auth-onboarding-flow/requirements.md`
- **Design**: `.kiro/specs/auth-onboarding-flow/design.md`
- **Tasks**: `.kiro/specs/auth-onboarding-flow/tasks.md`
- **Deployment Guide**: `migrations/DEPLOYMENT_GUIDE.md`

## Security Warning

⚠️ **The scripts contain AWS credentials and database passwords**

These should be:
- Rotated regularly
- Not committed to public repositories
- Stored securely in production

Consider using:
- AWS IAM authentication
- AWS Secrets Manager
- Environment variables

## Support

For issues:
1. Check the full execution guide
2. Review error messages in output
3. Verify prerequisites are met
4. Check database connection manually

---

**Ready to execute?**

```bash
./scripts/execute-auth-onboarding-spec.sh
```

The script will guide you through each step with clear prompts and confirmations.
