# Database Connection Pooling Configuration

## Overview

This document describes the connection pooling configuration for the Integrations Management System to optimize database performance.

Requirements: 10.1, 10.2

## Prisma Connection Pooling

Prisma automatically manages connection pooling for PostgreSQL. The default configuration is suitable for most use cases, but can be customized via the `DATABASE_URL` environment variable.

### Connection Pool Parameters

Add these parameters to your `DATABASE_URL` in `.env`:

```bash
# Example with connection pooling parameters
DATABASE_URL="postgresql://user:password@localhost:5432/huntaze?connection_limit=10&pool_timeout=20"
```

### Recommended Settings

#### Development Environment
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/huntaze?connection_limit=5&pool_timeout=10"
```

- **connection_limit**: 5 connections (sufficient for local development)
- **pool_timeout**: 10 seconds (quick timeout for development)

#### Production Environment
```bash
DATABASE_URL="postgresql://user:password@host:5432/huntaze?connection_limit=20&pool_timeout=30&connect_timeout=10"
```

- **connection_limit**: 20 connections (handles production load)
- **pool_timeout**: 30 seconds (allows for longer-running queries)
- **connect_timeout**: 10 seconds (timeout for establishing connections)

#### High-Traffic Production
```bash
DATABASE_URL="postgresql://user:password@host:5432/huntaze?connection_limit=50&pool_timeout=30&connect_timeout=10&statement_cache_size=100"
```

- **connection_limit**: 50 connections (for high-traffic scenarios)
- **statement_cache_size**: 100 (caches prepared statements)

## Connection Pool Parameters Explained

### connection_limit
- **Default**: 10
- **Description**: Maximum number of database connections in the pool
- **Recommendation**: 
  - Development: 5-10
  - Production: 20-50 (based on load)
  - Formula: `(CPU cores * 2) + effective_spindle_count`

### pool_timeout
- **Default**: 10 seconds
- **Description**: Maximum time to wait for a connection from the pool
- **Recommendation**: 20-30 seconds for production

### connect_timeout
- **Default**: 5 seconds
- **Description**: Maximum time to wait when establishing a new connection
- **Recommendation**: 10 seconds for production

### statement_cache_size
- **Default**: 100
- **Description**: Number of prepared statements to cache per connection
- **Recommendation**: 100-500 for production

## Monitoring Connection Pool

### Check Active Connections

```sql
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = 'huntaze';
```

### Check Connection Pool Exhaustion

If you see errors like:
- "Can't reach database server"
- "Connection pool timeout"
- "Too many connections"

This indicates connection pool exhaustion. Solutions:
1. Increase `connection_limit`
2. Optimize slow queries
3. Implement request batching
4. Add caching (already implemented)

## Request Batching

The IntegrationsService implements request batching for token refresh operations to reduce database load.

### Token Refresh Batching

When multiple tokens need refreshing simultaneously, the service batches them:

```typescript
// Batch refresh multiple tokens
async batchRefreshTokens(
  requests: Array<{ provider: Provider; accountId: string }>
): Promise<Integration[]> {
  // Process in batches of 5 to avoid overwhelming the database
  const batchSize = 5;
  const results: Integration[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(req => this.refreshToken(req.provider, req.accountId))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## Performance Optimization Checklist

- [x] **Caching**: 5-minute TTL cache for integration status
- [x] **Indexes**: Proper indexes on `(userId, provider)` for fast lookups
- [x] **Connection Pooling**: Configured via DATABASE_URL parameters
- [x] **Request Batching**: Batch token refresh operations
- [ ] **Query Optimization**: Use `select` to fetch only needed fields
- [ ] **Prepared Statements**: Automatically handled by Prisma

## Environment Variables

Add these to your `.env` file:

```bash
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/huntaze?connection_limit=5&pool_timeout=10"

# Production
DATABASE_URL="postgresql://user:password@host:5432/huntaze?connection_limit=20&pool_timeout=30&connect_timeout=10"

# High-Traffic Production
DATABASE_URL="postgresql://user:password@host:5432/huntaze?connection_limit=50&pool_timeout=30&connect_timeout=10&statement_cache_size=100"
```

## Troubleshooting

### Connection Pool Exhausted

**Symptoms**: 
- Slow API responses
- "Connection pool timeout" errors
- High database connection count

**Solutions**:
1. Check for connection leaks (ensure all queries complete)
2. Increase `connection_limit`
3. Optimize slow queries
4. Implement caching (already done)

### Too Many Connections

**Symptoms**:
- "Too many connections" error from PostgreSQL
- Database refusing new connections

**Solutions**:
1. Check PostgreSQL `max_connections` setting
2. Reduce `connection_limit` per application instance
3. Use connection pooler like PgBouncer

### Slow Queries

**Symptoms**:
- API timeouts
- High database CPU usage

**Solutions**:
1. Add indexes (already done for integrations)
2. Use `EXPLAIN ANALYZE` to identify slow queries
3. Implement caching (already done)
4. Optimize query patterns

## References

- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Database Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
