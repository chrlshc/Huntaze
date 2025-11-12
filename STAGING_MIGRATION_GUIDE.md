# Wizard Completions Migration - Staging Deployment Guide

## Quick Start

Run the automated deployment script:

```bash
./scripts/deploy-wizard-migration-staging.sh
```

The script will:
- ✅ Check prerequisites (AWS CLI, psql)
- ✅ Verify AWS credentials
- ✅ Retrieve staging DATABASE_URL from AWS Secrets Manager
- ✅ Test database connection
- ✅ Run the migration safely
- ✅ Verify all components were created

## Manual Deployment (if needed)

If you prefer to run commands manually:

### 1. Configure AWS Credentials

```bash
aws configure
```

### 2. Retrieve Database URL

```bash
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id staging/database-url \
  --query SecretString \
  --output text)
```

### 3. Test Connection

```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 4. Run Migration

```bash
psql $DATABASE_URL < lib/db/migrations/2025-11-11-wizard-completions.sql
```

### 5. Verify Migration

```bash
# Check table exists and row count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_wizard_completions;"

# Check indexes
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'user_wizard_completions';"

# Check view
psql $DATABASE_URL -c "SELECT * FROM wizard_analytics LIMIT 1;"

# Test function
psql $DATABASE_URL -c "SELECT * FROM get_user_wizard_config('test_user');"
```

## What Gets Created

### Table: `user_wizard_completions`
Stores user wizard completion data with:
- User ID (primary key)
- Platform selection (onlyfans, instagram, tiktok, reddit, other)
- Primary goal (grow, automate, content, all)
- AI tone preference (playful, professional, casual, seductive)
- Follower range
- Completion metrics (time, skipped questions)
- AI configuration JSON
- Template selections

### Indexes
- `idx_wizard_platform` - For platform analytics
- `idx_wizard_goal` - For goal analytics
- `idx_wizard_completed_at` - For time-series queries
- `idx_wizard_time_to_complete` - For performance analysis

### View: `wizard_analytics`
Aggregated analytics including:
- Completion counts by platform/goal/tone
- Average, median, and P95 completion times
- Skip rates

### Function: `get_user_wizard_config(user_id)`
Retrieves a user's complete wizard configuration

### Trigger: `update_wizard_updated_at`
Automatically updates the `updated_at` timestamp on row updates

## Rollback (if needed)

If you need to rollback the migration:

```bash
psql $DATABASE_URL << 'EOF'
BEGIN;
DROP VIEW IF EXISTS wizard_analytics;
DROP FUNCTION IF EXISTS get_user_wizard_config(TEXT);
DROP TRIGGER IF EXISTS trigger_update_wizard_updated_at ON user_wizard_completions;
DROP FUNCTION IF EXISTS update_wizard_updated_at();
DROP TABLE IF EXISTS user_wizard_completions CASCADE;
COMMIT;
EOF
```

## Troubleshooting

### AWS CLI not configured
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Secret not found
- Verify the secret name: `staging/database-url`
- Check your AWS permissions
- Confirm you're in the correct AWS region

### Connection refused
- Check VPN/network connectivity to staging database
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Check security group rules allow your IP

### Table already exists
The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. Existing data won't be affected.

## Post-Deployment Checklist

- [ ] Migration script completed successfully
- [ ] Table `user_wizard_completions` exists
- [ ] All 4 indexes created
- [ ] View `wizard_analytics` accessible
- [ ] Function `get_user_wizard_config` works
- [ ] Test wizard API endpoint: `POST /api/onboarding/wizard`
- [ ] Monitor application logs for errors
- [ ] Verify wizard flow in staging environment

## Related Files

- Migration SQL: `lib/db/migrations/2025-11-11-wizard-completions.sql`
- Deployment script: `scripts/deploy-wizard-migration-staging.sh`
- API endpoint: `app/api/onboarding/wizard/route.ts`
- Documentation: `docs/WIZARD_IMPLEMENTATION.md`
