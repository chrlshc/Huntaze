# N+1 Query Prevention Guide

## What is an N+1 Query?

An N+1 query problem occurs when:
1. You fetch N records with one query
2. Then make N additional queries to fetch related data for each record

This results in N+1 total queries instead of 1-2 optimized queries.

## Example of N+1 Problem

```typescript
// ❌ BAD: N+1 queries
const users = await prisma.users.findMany();
for (const user of users) {
  const posts = await prisma.posts.findMany({
    where: { userId: user.id }
  });
  // Process posts...
}
// Result: 1 query for users + N queries for posts = N+1 queries
```

## Solutions

### 1. Use Prisma `include` (Recommended)

```typescript
// ✅ GOOD: Single query with JOIN
const users = await prisma.users.findMany({
  include: {
    posts: true,
  },
});
// Result: 1 query with JOIN
```

### 2. Use Prisma `select` for Specific Fields

```typescript
// ✅ GOOD: Fetch only needed fields
const users = await prisma.users.findMany({
  select: {
    id: true,
    name: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
    },
  },
});
```

### 3. Batch Operations with Transactions

```typescript
// ✅ GOOD: Batch multiple operations
await prisma.$transaction(
  users.map(user =>
    prisma.posts.create({
      data: {
        userId: user.id,
        title: 'New Post',
      },
    })
  )
);
```

### 4. Use `Promise.all()` for Independent Queries

```typescript
// ✅ GOOD: Parallel execution
const [users, posts, comments] = await Promise.all([
  prisma.users.findMany(),
  prisma.posts.findMany(),
  prisma.comments.findMany(),
]);
```

## Detection

Run the N+1 detection script:

```bash
npx tsx scripts/detect-n-plus-one.ts
```

This script scans the codebase for common N+1 patterns:
- Loops with Prisma queries
- `map()` with Prisma queries
- `forEach()` with Prisma queries
- Missing `include` on queries that might need related data

## Fixed Issues

### Issue 1: Monthly Charge Computation (lib/ai/billing.ts)

**Before:**
```typescript
for (const row of grouped) {
  await prisma.monthlyCharge.upsert({...});
}
```

**After:**
```typescript
await prisma.$transaction(
  grouped.map(row => prisma.monthlyCharge.upsert({...}))
);
```

**Impact:** Reduced from N+1 queries to 1 transaction

## Best Practices

1. **Always use `include` when fetching related data**
   - Prisma will generate efficient JOINs
   - Reduces round trips to the database

2. **Use `select` to fetch only needed fields**
   - Reduces data transfer
   - Improves query performance

3. **Batch operations in transactions**
   - Use `$transaction()` for multiple writes
   - Ensures atomicity and reduces round trips

4. **Monitor query counts in development**
   - Use the diagnostic tool to track queries per endpoint
   - Set up alerts for high query counts

5. **Use indexes on foreign keys**
   - All foreign keys should have indexes
   - Composite indexes for multi-column filters

## Performance Impact

Fixing N+1 queries typically results in:
- **50-90% reduction** in database queries
- **40-70% faster** API response times
- **Reduced database load** and connection pool usage
- **Better scalability** as user base grows

## Related Documentation

- [Database Indexes](../migrations/add_performance_indexes/README.md)
- [Query Optimization](./QUERY-OPTIMIZATION.md)
- [Performance Diagnostic Tool](../../scripts/analyze-database-queries.ts)
