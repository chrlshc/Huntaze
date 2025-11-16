# Database Migrations

This directory contains database migration scripts for the Huntaze platform.

## Migration 001: Add Onboarding Completed Column

**Purpose**: Add `onboarding_completed` boolean field to the `users` table to track whether users have completed the onboarding flow.

**Requirements**: Addresses requirement 5.4 from the auth-onboarding-flow spec.

### Files

- `001_add_onboarding_completed.sql` - Standard migration for small to medium databases
- `001_add_onboarding_completed_batch.sql` - Batch migration for large databases (100k+ users)
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions for staging and production

### Quick Start

#### For Small/Medium Databases (< 100k users)

```bash
# Connect to your database
psql -h your-host -U your-user -d your-database

# Run the migration
\i migrations/001_add_onboarding_completed.sql
```

#### For Large Databases (100k+ users)

```bash
# Connect to your database
psql -h your-host -U your-user -d your-database

# Run the batch migration
\i migrations/001_add_onboarding_completed_batch.sql
```

### What This Migration Does

1. **Adds Column**: Creates `onboarding_completed BOOLEAN DEFAULT false` column
2. **Backfills Data**: Sets existing users to `onboarding_completed = true` for backward compatibility
3. **Creates Index**: Adds index on `onboarding_completed` for query performance
4. **Adds Documentation**: Adds column comment for future reference

### Backward Compatibility

This migration ensures backward compatibility by:

- Setting all existing users to `onboarding_completed = true`
- Using `DEFAULT false` for new users only
- Allowing the application to work with or without the column (using `IF NOT EXISTS`)

### Rollback

If you need to rollback this migration:

```sql
-- Drop the index
DROP INDEX IF EXISTS idx_users_onboarding_completed;

-- Drop the column
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
```

**WARNING**: Rollback will permanently delete all onboarding status data.

### Verification

After running the migration, verify it was successful:

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Check data distribution
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete
FROM users;

-- Check index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
```

### Performance Considerations

- **Small tables** (< 10k rows): Migration completes in seconds
- **Medium tables** (10k-100k rows): Migration completes in under 1 minute
- **Large tables** (100k+ rows): Use batch script, completes in 5-15 minutes

The `CREATE INDEX CONCURRENTLY` command allows the migration to run without blocking table access.

### Troubleshooting

#### Error: "column already exists"

This is safe to ignore. The migration uses `IF NOT EXISTS` to handle this case.

#### Error: "CONCURRENTLY cannot be used inside a transaction"

Run the `CREATE INDEX` statement separately outside of a transaction block.

#### Slow performance on large tables

Use the batch migration script (`001_add_onboarding_completed_batch.sql`) instead.

### Next Steps

After running this migration:

1. Deploy the updated application code that uses `onboarding_completed`
2. Monitor application logs for any issues
3. Verify new user registrations set `onboarding_completed = false`
4. Verify existing users can still log in and access the dashboard

### Support

For issues or questions about this migration, refer to:
- Design document: `.kiro/specs/auth-onboarding-flow/design.md`
- Requirements: `.kiro/specs/auth-onboarding-flow/requirements.md`
- Deployment guide: `migrations/DEPLOYMENT_GUIDE.md`
