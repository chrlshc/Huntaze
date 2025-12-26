# pgvector Setup for RDS PostgreSQL

## Problem
When running `npx prisma db push`, you get:
```
ERROR: type "vector" does not exist
```

This happens because the `pgvector` extension is not enabled in your PostgreSQL database.

## Solution

### Option 1: Using the Script (Recommended)

```bash
# Make sure DATABASE_URL is set in your .env file
./scripts/enable-pgvector.sh

# Then run prisma db push
npx prisma db push
```

### Option 2: Manual Setup

1. Connect to your database:
```bash
psql "$DATABASE_URL"
```

2. Enable the extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Verify it's installed:
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

4. Exit psql and run:
```bash
npx prisma db push
```

## AWS RDS Specific Notes

### Prerequisites
- PostgreSQL version 11 or higher
- Your database user needs `rds_superuser` role or SUPERUSER privileges
- The pgvector extension must be available in your RDS instance

### Check if pgvector is available
```bash
psql "$DATABASE_URL" -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"
```

### If pgvector is not available
You may need to:
1. Upgrade your RDS PostgreSQL version
2. Check if your RDS instance type supports extensions
3. Contact AWS support to enable pgvector for your instance

### Grant privileges (if needed)
If you get permission errors, ask your database admin to run:
```sql
GRANT rds_superuser TO your_username;
```

## What is pgvector?

pgvector is a PostgreSQL extension for vector similarity search. It's used in your schema for:
- AI embeddings storage (1536-dimensional vectors)
- Semantic search capabilities
- ML feature storage

## Troubleshooting

### Error: "permission denied to create extension"
Your user doesn't have sufficient privileges. You need `rds_superuser` role.

### Error: "extension 'vector' is not available"
The pgvector extension is not installed on your RDS instance. You may need to:
- Upgrade PostgreSQL version
- Use a different RDS instance type
- Install pgvector manually (not possible on managed RDS)

### Error: "could not access file"
The pgvector library files are missing. This usually means your RDS version doesn't support it.

## Alternative: Remove Vector Support

If you don't need vector/embedding features right now, you can comment out the vector field in your schema:

```prisma
// embedding   Unsupported("vector(1536)")?
```

Then run `npx prisma db push` again.
