# Auth Onboarding Flow Migration - Quick Start

## TL;DR

Add `onboarding_completed` column to track if users have completed onboarding.

## Quick Commands

### Development (Local)
```bash
# Using TypeScript
ts-node scripts/migrate-auth-onboarding.ts

# Or using SQL directly
psql $DATABASE_URL -f lib/db/migrations/2024-11-16-auth-onboarding-flow.sql
```

### Staging
```bash
export DATABASE_URL=$STAGING_DATABASE_URL
./scripts/migrate-auth-onboarding.sh
```

### Production
```bash
export DATABASE_URL=$PRODUCTION_DATABASE_URL
./scripts/migrate-auth-onboarding.sh
```

## What It Does

1. ✅ Adds `onboarding_completed BOOLEAN DEFAULT false` to users table
2. ✅ Sets existing users to `onboarding_completed = true` (backward compatibility)
3. ✅ Creates index on `onboarding_completed` for performance

## Verification

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Check user stats
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN onboarding_completed THEN 1 ELSE 0 END) as completed
FROM users;
```

## Rollback

```bash
psql $DATABASE_URL -f lib/db/migrations/2024-11-16-auth-onboarding-flow-rollback.sql
```

## Next Steps

After migration:
1. Deploy backend (NextAuth config + API)
2. Deploy frontend (auth page + onboarding page)
3. Test new user registration flow
4. Test existing user login flow

## Files

- Migration: `lib/db/migrations/2024-11-16-auth-onboarding-flow.sql`
- Rollback: `lib/db/migrations/2024-11-16-auth-onboarding-flow-rollback.sql`
- Script (Shell): `scripts/migrate-auth-onboarding.sh`
- Script (TS): `scripts/migrate-auth-onboarding.ts`
- Full Docs: `docs/migrations/auth-onboarding-flow-migration.md`

## Support

See full documentation: `docs/migrations/auth-onboarding-flow-migration.md`
