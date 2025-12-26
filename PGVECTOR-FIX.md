# Quick Fix for pgvector Error

## The Problem
Your Prisma schema uses `vector(1536)` type for AI embeddings, but PostgreSQL doesn't have the pgvector extension enabled.

## Quick Solution

Run this command to enable pgvector on your database:

```bash
psql "postgresql://USER:PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production" -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Replace `USER` and `PASSWORD` with your actual database credentials.

## Then retry:
```bash
npx prisma db push
```

## Alternative: Skip Vector Support for Now

If you don't need AI embeddings right now, you can temporarily disable it:

1. Open `prisma/schema.prisma`
2. Find the line with `embedding   Unsupported("vector(1536)")?`
3. Comment it out:
   ```prisma
   // embedding   Unsupported("vector(1536)")?
   ```
4. Run `npx prisma db push` again

## What This Fixes

The vector type is used for:
- Storing AI embeddings (1536-dimensional vectors)
- Semantic search capabilities
- ML feature storage

If you're not using these features yet, you can safely comment it out and add it back later when needed.

## Full Documentation

See `docs/PGVECTOR-SETUP.md` for complete setup instructions and troubleshooting.
