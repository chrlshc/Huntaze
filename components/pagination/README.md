# Pagination Implementation

This directory contains pagination and infinite scroll components for Huntaze platform.

## Overview

Two pagination strategies are implemented:
1. **Traditional Pagination** - Page-based navigation with page numbers
2. **Infinite Scroll** - Load more items as user scrolls

## Components

### Pagination Component

Traditional pagination with page numbers and navigation buttons.

```typescript
import { Pagination } from '@/components/pagination/Pagination';

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  showPageNumbers={true}
  showItemCount={true}
/>
```

### InfiniteScroll Component

Infinite scroll with automatic loading on scroll.

```typescript
import { InfiniteScroll } from '@/components/pagination/InfiniteScroll';

<InfiniteScroll
  hasMore={hasMore}
  isLoading={isLoading}
  onLoadMore={loadMore}
  threshold={0.8}
  loader={<LoadingSpinner />}
  endMessage="No more items"
>
  {items.map(item => <Item key={item.id} {...item} />)}
</InfiniteScroll>
```

## Hooks

### usePagination Hook

Client-side pagination for arrays.

```typescript
import { usePagination } from '@/hooks/usePagination';

const {
  currentPage,
  totalPages,
  paginatedItems,
  goToPage,
  nextPage,
  previousPage,
} = usePagination(items, {
  initialPage: 1,
  itemsPerPage: 20,
});
```

### useServerPagination Hook

Server-side pagination with API calls.

```typescript
import { useServerPagination } from '@/hooks/usePagination';

const {
  currentPage,
  totalPages,
  goToPage,
} = useServerPagination({
  totalItems: 1000,
  itemsPerPage: 20,
  onPageChange: (page) => fetchData(page),
});
```

### useInfiniteScroll Hook

Infinite scroll with automatic data fetching.

```typescript
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const {
  items,
  isLoading,
  hasMore,
  loadMore,
  refresh,
} = useInfiniteScroll({
  itemsPerPage: 50,
  fetchItems: async (page, limit) => {
    const res = await fetch(`/api/items?page=${page}&limit=${limit}`);
    return res.json();
  },
});
```

## Usage Examples

### Example 1: Campaigns List with Pagination

```typescript
'use client';

import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination/Pagination';

export default function CampaignsPage() {
  const [campaigns] = useState(/* fetch campaigns */);

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems,
    goToPage,
  } = usePagination(campaigns, {
    itemsPerPage: 20,
  });

  return (
    <div>
      <div className="space-y-4">
        {paginatedItems.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

### Example 2: Messages with Infinite Scroll

```typescript
'use client';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { InfiniteScroll } from '@/components/pagination/InfiniteScroll';

export default function MessagesPage() {
  const {
    items: messages,
    isLoading,
    hasMore,
    loadMore,
  } = useInfiniteScroll({
    itemsPerPage: 50,
    fetchItems: async (page, limit) => {
      const res = await fetch(`/api/messages?page=${page}&limit=${limit}`);
      return res.json();
    },
  });

  return (
    <InfiniteScroll
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={loadMore}
      endMessage="No more messages"
    >
      <div className="space-y-2">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </InfiniteScroll>
  );
}
```

### Example 3: Fans List with Server Pagination

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useServerPagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination/Pagination';

export default function FansPage() {
  const [fans, setFans] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 50;

  const {
    currentPage,
    totalPages,
    goToPage,
  } = useServerPagination({
    totalItems,
    itemsPerPage,
    onPageChange: async (page) => {
      const res = await fetch(`/api/fans?page=${page}&limit=${itemsPerPage}`);
      const data = await res.json();
      setFans(data.fans);
      setTotalItems(data.total);
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fans.map(fan => (
          <FanCard key={fan.id} fan={fan} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

### Example 4: PPV List with Items Per Page Selector

```typescript
'use client';

import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination/Pagination';

export default function PPVPage() {
  const [ppvCampaigns] = useState(/* fetch campaigns */);

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems,
    goToPage,
    setItemsPerPage,
  } = usePagination(ppvCampaigns, {
    itemsPerPage: 20,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>PPV Campaigns</h1>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedItems.map(campaign => (
          <PPVCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

## API Implementation

### Pagination Query Parameters

```typescript
// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  // Fetch from database
  const campaigns = await db.campaign.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await db.campaign.count();

  return NextResponse.json({
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + campaigns.length < total,
    },
  });
}
```

### Cursor-based Pagination (for Infinite Scroll)

```typescript
// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const messages = await db.message.findMany({
    take: limit + 1, // Fetch one extra to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, -1) : messages;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    messages: items,
    nextCursor,
    hasMore,
  });
}
```

## Configuration

### Pagination Settings

```typescript
// lib/config/pagination.ts
export const PAGINATION_CONFIG = {
  CAMPAIGNS: {
    itemsPerPage: 20,
    maxItemsPerPage: 100,
  },
  MESSAGES: {
    itemsPerPage: 50,
    maxItemsPerPage: 200,
  },
  FANS: {
    itemsPerPage: 50,
    maxItemsPerPage: 100,
  },
  PPV: {
    itemsPerPage: 20,
    maxItemsPerPage: 50,
  },
  CONTENT: {
    itemsPerPage: 30,
    maxItemsPerPage: 100,
  },
} as const;
```

## Best Practices

### 1. Choose the Right Strategy

**Use Traditional Pagination when:**
- Users need to jump to specific pages
- Total count is important
- Data is relatively static
- SEO is important

**Use Infinite Scroll when:**
- Content is time-based (feeds, messages)
- Users typically scroll through content
- Total count is not important
- Mobile-first experience

### 2. Optimize Database Queries

```typescript
// ✅ Good - Use indexes and limit
const items = await db.item.findMany({
  where: { userId },
  skip: offset,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// ❌ Bad - Fetch all then slice
const allItems = await db.item.findMany({ where: { userId } });
const items = allItems.slice(offset, offset + limit);
```

### 3. Cache Pagination Results

```typescript
import { getCacheOrSet, CACHE_TTL } from '@/lib/cache/redis';

const cacheKey = `campaigns:page:${page}:limit:${limit}`;
const data = await getCacheOrSet(
  cacheKey,
  CACHE_TTL.CAMPAIGNS,
  () => fetchCampaigns(page, limit)
);
```

### 4. Handle Edge Cases

```typescript
// Validate page number
const page = Math.max(1, Math.min(requestedPage, totalPages));

// Validate items per page
const limit = Math.max(10, Math.min(requestedLimit, MAX_ITEMS_PER_PAGE));

// Handle empty results
if (items.length === 0 && page > 1) {
  // Redirect to last valid page
  return redirect(`/campaigns?page=${totalPages}`);
}
```

### 5. Provide Loading States

```typescript
{isLoading ? (
  <LoadingSpinner />
) : items.length === 0 ? (
  <EmptyState message="No items found" />
) : (
  <ItemsList items={items} />
)}
```

## Performance Considerations

### Database Indexes

```sql
-- Index for pagination queries
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX idx_fans_user_tier ON fans(user_id, tier);
```

### Query Optimization

```typescript
// ✅ Good - Select only needed fields
const campaigns = await db.campaign.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    createdAt: true,
  },
  skip: offset,
  take: limit,
});

// ❌ Bad - Select all fields
const campaigns = await db.campaign.findMany({
  skip: offset,
  take: limit,
});
```

### Caching Strategy

- Cache first page aggressively (5-10 min)
- Cache other pages moderately (2-5 min)
- Invalidate on data mutations
- Use cursor-based pagination for real-time data

## Accessibility

### Keyboard Navigation

```typescript
<button
  onClick={() => goToPage(page)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      goToPage(page);
    }
  }}
  aria-label={`Go to page ${page}`}
  aria-current={currentPage === page ? 'page' : undefined}
>
  {page}
</button>
```

### Screen Reader Support

```typescript
<nav aria-label="Pagination">
  <Pagination {...props} />
</nav>

<div role="status" aria-live="polite">
  Showing {startItem} to {endItem} of {totalItems} results
</div>
```

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  it('should paginate items correctly', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const { result } = renderHook(() =>
      usePagination(items, { itemsPerPage: 10 })
    );

    expect(result.current.paginatedItems).toHaveLength(10);
    expect(result.current.totalPages).toBe(10);

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/pagination/Pagination';

describe('Pagination', () => {
  it('should navigate between pages', () => {
    const onPageChange = jest.fn();
    
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByTitle('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
```

## Resources

- [Pagination Best Practices](https://www.smashingmagazine.com/2016/03/pagination-infinite-scrolling-load-more-buttons/)
- [Infinite Scroll vs Pagination](https://uxplanet.org/ux-infinite-scrolling-vs-pagination-1030d29376f1)
- [Cursor-based Pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination)

## Support

For issues or questions:
- Check API response format
- Verify pagination parameters
- Test with different page sizes
- Review database indexes
- Monitor query performance
