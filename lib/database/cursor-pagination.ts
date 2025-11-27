/**
 * Cursor-based pagination utilities for efficient large dataset queries
 * 
 * Cursor pagination is more efficient than offset pagination for large datasets because:
 * - Uses indexed columns (id, createdAt) for O(log n) lookups
 * - Avoids scanning rows that will be skipped
 * - Consistent results even when data changes
 * 
 * Requirements: 7.3 - Use cursor-based pagination for large datasets
 */

export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Default pagination limit
 */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Encode a cursor from an ID
 */
export function encodeCursor(id: string | number): string {
  return Buffer.from(String(id)).toString('base64');
}

/**
 * Decode a cursor to an ID
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

/**
 * Build Prisma query options for cursor-based pagination
 * 
 * @example
 * const options = buildCursorQuery({ cursor: 'abc123', limit: 20 });
 * const users = await prisma.user.findMany({
 *   ...options,
 *   where: { active: true }
 * });
 */
export function buildCursorQuery(params: CursorPaginationParams) {
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const orderBy = params.orderBy || 'desc';

  const query: any = {
    take: limit + 1, // Fetch one extra to check if there are more results
    orderBy: {
      id: orderBy,
    },
  };

  if (params.cursor) {
    const cursorId = decodeCursor(params.cursor);
    query.cursor = { id: cursorId };
    query.skip = 1; // Skip the cursor itself
  }

  return query;
}

/**
 * Format the results of a cursor-based query
 * 
 * @example
 * const results = await prisma.user.findMany(options);
 * const paginated = formatCursorResults(results, params.limit);
 */
export function formatCursorResults<T extends { id: string | number }>(
  results: T[],
  limit: number = DEFAULT_LIMIT
): CursorPaginationResult<T> {
  const actualLimit = Math.min(limit, MAX_LIMIT);
  const hasMore = results.length > actualLimit;
  const data = hasMore ? results.slice(0, actualLimit) : results;
  
  const nextCursor = hasMore && data.length > 0
    ? encodeCursor(data[data.length - 1].id)
    : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}

/**
 * Complete cursor pagination helper that combines query building and result formatting
 * 
 * @example
 * const result = await paginateWithCursor(
 *   (options) => prisma.user.findMany({ ...options, where: { active: true } }),
 *   { cursor: req.query.cursor, limit: 20 }
 * );
 */
export async function paginateWithCursor<T extends { id: string | number }>(
  queryFn: (options: any) => Promise<T[]>,
  params: CursorPaginationParams
): Promise<CursorPaginationResult<T>> {
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const queryOptions = buildCursorQuery(params);
  
  const results = await queryFn(queryOptions);
  
  return formatCursorResults(results, limit);
}

/**
 * Build cursor query for date-based pagination (e.g., createdAt)
 * More efficient for time-series data
 */
export function buildDateCursorQuery(
  params: CursorPaginationParams & { cursorField?: string }
) {
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const orderBy = params.orderBy || 'desc';
  const cursorField = params.cursorField || 'createdAt';

  const query: any = {
    take: limit + 1,
    orderBy: {
      [cursorField]: orderBy,
    },
  };

  if (params.cursor) {
    const cursorDate = new Date(decodeCursor(params.cursor));
    query.cursor = { [cursorField]: cursorDate };
    query.skip = 1;
  }

  return query;
}

/**
 * Format results for date-based cursor pagination
 */
export function formatDateCursorResults<T extends Record<string, any>>(
  results: T[],
  limit: number = DEFAULT_LIMIT,
  cursorField: string = 'createdAt'
): CursorPaginationResult<T> {
  const actualLimit = Math.min(limit, MAX_LIMIT);
  const hasMore = results.length > actualLimit;
  const data = hasMore ? results.slice(0, actualLimit) : results;
  
  const nextCursor = hasMore && data.length > 0
    ? encodeCursor(data[data.length - 1][cursorField].toISOString())
    : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}
