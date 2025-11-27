# Cursor-Based Pagination

## Overview

Cursor-based pagination provides efficient pagination for large datasets by using indexed columns (like `id` or `createdAt`) as cursors instead of offset-based pagination.

**Requirements:** 7.3 - Use cursor-based pagination for large datasets

## Why Cursor Pagination?

### Performance Comparison

**Offset Pagination (skip/take):**
```sql
-- Page 1: Fast
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 0;

-- Page 100: Slow (scans 2000 rows)
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 2000;

-- Page 1000: Very slow (scans 20000 rows)
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 20000;
```

**Cursor Pagination:**
```sql
-- Page 1: Fast (index lookup)
SELECT * FROM users ORDER BY id LIMIT 20;

-- Page 100: Still fast (index lookup)
SELECT * FROM users WHERE id > 'cursor_value' ORDER BY id LIMIT 20;

-- Page 1000: Still fast (index lookup)
SELECT * FROM users WHERE id > 'cursor_value' ORDER BY id LIMIT 20;
```

### Benefits

1. **Consistent Performance**: O(log n) lookups regardless of page number
2. **Stable Results**: No duplicate/missing items when data changes
3. **Index Efficient**: Uses database indexes optimally
4. **Scalable**: Works well with millions of records

### When to Use

- ✅ Large datasets (>10,000 records)
- ✅ Infinite scroll interfaces
- ✅ Real-time data feeds
- ✅ API endpoints with high traffic

### When NOT to Use

- ❌ Small datasets (<1,000 records)
- ❌ Need to jump to specific page numbers
- ❌ Need total count of pages

## Usage

### Basic Usage

```typescript
import { paginateWithCursor } from '@/lib/database/cursor-pagination';

// In your API route
const result = await paginateWithCursor(
  (options) => prisma.user.findMany({
    ...options,
    where: { active: true },
  }),
  { 
    cursor: req.query.cursor,
    limit: 20,
    orderBy: 'desc'
  }
);

// Returns:
// {
//   data: [...],
//   nextCursor: 'encoded_cursor',
//   hasMore: true
// }
```

### With React Hook

```typescript
import { useCursorPagination } from '@/hooks/useCursorPagination';

function UserList() {
  const { data, isLoading, hasMore, loadMore } = useCursorPagination({
    endpoint: '/api/users',
    limit: 20,
  });

  return (
    <div>
      {data.map(user => <UserCard key={user.id} user={user} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          Load More
        </button>
      )}
    </div>
  );
}
```

### Date-Based Cursors

For time-series data, use date-based cursors:

```typescript
import { buildDateCursorQuery, formatDateCursorResults } from '@/lib/database/cursor-pagination';

const queryOptions = buildDateCursorQuery({
  cursor: req.query.cursor,
  limit: 20,
  cursorField: 'createdAt',
  orderBy: 'desc'
});

const results = await prisma.post.findMany({
  ...queryOptions,
  where: { published: true },
});

const paginated = formatDateCursorResults(results, 20, 'createdAt');
```

## API Reference

### `encodeCursor(id: string | number): string`

Encodes an ID into a base64 cursor string.

### `decodeCursor(cursor: string): string`

Decodes a cursor string back to an ID.

### `buildCursorQuery(params: CursorPaginationParams)`

Builds Prisma query options for cursor pagination.

**Parameters:**
- `cursor?: string` - The cursor from previous page
- `limit?: number` - Number of items per page (default: 20, max: 100)
- `orderBy?: 'asc' | 'desc'` - Sort order (default: 'desc')

**Returns:** Prisma query options with `take`, `cursor`, `skip`, and `orderBy`

### `formatCursorResults<T>(results: T[], limit: number)`

Formats query results into paginated response.

**Returns:**
```typescript
{
  data: T[];           // The actual data (limited to requested size)
  nextCursor: string | null;  // Cursor for next page
  hasMore: boolean;    // Whether more pages exist
}
```

### `paginateWithCursor<T>(queryFn, params)`

Complete helper that combines query building and result formatting.

## Examples

### Example 1: User List API

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paginateWithCursor } from '@/lib/database/cursor-pagination';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const result = await paginateWithCursor(
    (options) => prisma.user.findMany({
      ...options,
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    {
      cursor: searchParams.get('cursor'),
      limit: parseInt(searchParams.get('limit') || '20'),
      orderBy: 'desc',
    }
  );

  return NextResponse.json(result);
}
```

### Example 2: Infinite Scroll Component

```typescript
// components/InfiniteUserList.tsx
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { useEffect, useRef } from 'react';

export function InfiniteUserList() {
  const { data, isLoading, hasMore, loadMore } = useCursorPagination({
    endpoint: '/api/users',
    limit: 20,
  });

  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div>
      {data.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      {hasMore && <div ref={loadMoreRef}>Loading...</div>}
    </div>
  );
}
```

### Example 3: Posts Feed with Date Cursor

```typescript
// app/api/posts/route.ts
import { buildDateCursorQuery, formatDateCursorResults } from '@/lib/database/cursor-pagination';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '20');

  const queryOptions = buildDateCursorQuery({
    cursor,
    limit,
    cursorField: 'createdAt',
    orderBy: 'desc',
  });

  const posts = await prisma.post.findMany({
    ...queryOptions,
    where: { published: true },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  const result = formatDateCursorResults(posts, limit, 'createdAt');

  return NextResponse.json(result);
}
```

## Performance Tips

1. **Always use indexed columns as cursors** (id, createdAt, etc.)
2. **Keep cursor fields in ORDER BY clause** for optimal index usage
3. **Limit maximum page size** to prevent memory issues
4. **Use composite indexes** for filtered + sorted queries
5. **Consider date-based cursors** for time-series data

## Testing

Run the test script to verify cursor pagination:

```bash
npx tsx scripts/test-cursor-pagination.ts
```

## Migration from Offset Pagination

### Before (Offset):
```typescript
const users = await prisma.user.findMany({
  skip: page * limit,
  take: limit,
  orderBy: { id: 'desc' },
});
```

### After (Cursor):
```typescript
const result = await paginateWithCursor(
  (options) => prisma.user.findMany(options),
  { cursor, limit }
);
```

## Related Files

- `lib/database/cursor-pagination.ts` - Core utilities
- `hooks/useCursorPagination.ts` - React hooks
- `app/api/paginated-example/route.ts` - Example API
- `scripts/test-cursor-pagination.ts` - Test script
