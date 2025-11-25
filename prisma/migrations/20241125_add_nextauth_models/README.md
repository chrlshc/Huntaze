# Migration: Add NextAuth Models

**Date:** 2024-11-25
**Feature:** Signup UX Optimization - Phase 2

## Purpose

This migration adds the necessary database models for NextAuth v5 email provider and OAuth authentication:

1. **Signup Tracking Fields** - Track signup method and timestamps
2. **Account Model** - Store OAuth provider accounts
3. **Session Model** - Store user sessions (JWT strategy, optional)
4. **VerificationToken Model** - Store magic link tokens for email authentication

## Changes

### Users Table
- Added `signup_method` VARCHAR(50) - Tracks how user signed up (email, google, apple)
- Added `signup_completed_at` TIMESTAMP - When signup was completed
- Added `first_login_at` TIMESTAMP - When user first logged in
- Added index on `signup_method` for analytics queries

### New Tables

#### nextauth_accounts
Stores OAuth provider account information:
- Links users to their OAuth provider accounts
- Stores access tokens and refresh tokens
- Supports multiple providers per user

#### nextauth_sessions
Stores user sessions (optional with JWT strategy):
- Session tokens for cookie-based sessions
- Expiration tracking
- User association

#### nextauth_verification_tokens
Stores magic link verification tokens:
- Email-based authentication tokens
- 24-hour expiration
- Single-use tokens

## Requirements Addressed

- **Requirement 2.1**: Email-first signup flow
- **Requirement 2.2**: Magic link email authentication
- **Requirement 3.1**: Social authentication (Google, Apple)
- **Requirement 12.1**: Signup analytics tracking

## Running the Migration

```bash
# Apply migration
npm run db:migrate

# Or manually with psql
psql $DATABASE_URL -f prisma/migrations/20241125_add_nextauth_models/migration.sql
```

## Rollback

To rollback this migration:

```sql
-- Drop NextAuth tables
DROP TABLE IF EXISTS nextauth_verification_tokens;
DROP TABLE IF EXISTS nextauth_sessions;
DROP TABLE IF EXISTS nextauth_accounts;

-- Remove signup tracking fields
ALTER TABLE users DROP COLUMN IF EXISTS signup_method;
ALTER TABLE users DROP COLUMN IF EXISTS signup_completed_at;
ALTER TABLE users DROP COLUMN IF EXISTS first_login_at;

-- Drop index
DROP INDEX IF EXISTS idx_users_signup_method;
```

## Testing

After migration, verify:
1. All tables created successfully
2. Foreign key constraints working
3. Indexes created
4. No data loss in users table

## Notes

- Uses `IF NOT EXISTS` to allow safe re-running
- All foreign keys use `ON DELETE CASCADE` for data integrity
- Indexes optimized for common query patterns
- Compatible with NextAuth v5 Prisma adapter
