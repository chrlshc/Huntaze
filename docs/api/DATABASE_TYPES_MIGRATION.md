# Database Types Migration Guide

## Overview

This guide explains an important type behavior in PostgreSQL and how to handle it correctly in your code.

## The Issue

PostgreSQL aggregate functions (`SUM`, `COUNT`, `AVG`, etc.) return **strings**, not numbers. This can cause unexpected type errors in JavaScript/TypeScript code.

## Example of the Problem

### ❌ Before (Incorrect)

```javascript
const result = await pool.query(
  'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
  [testUserId]
);

// This will FAIL because total_value is a string
expect(result.rows[0].total_value).toBeGreaterThan(0);
// TypeError: Cannot compare string with number
```

### ✅ After (Correct)

```javascript
const result = await pool.query(
  'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
  [testUserId]
);

// Parse as integer first
expect(parseInt(result.rows[0].total_value)).toBeGreaterThan(0);
// Works correctly!
```

## Why This Happens

PostgreSQL's `node-postgres` (pg) library returns aggregate results as strings to preserve precision and avoid JavaScript's number limitations. This is by design and affects:

- `SUM()` - Returns string
- `COUNT()` - Returns string
- `AVG()` - Returns string
- Any numeric calculation in SQL

## Migration Checklist

### 1. Find All Aggregate Queries

Search your codebase for:
- `SUM(`
- `COUNT(`
- `AVG(`
- `MAX(` (if numeric)
- `MIN(` (if numeric)

### 2. Add Parsing

For each aggregate result, add appropriate parsing:

```javascript
// For SUM and COUNT
const total = parseInt(result.rows[0].total_value);

// For AVG
const average = parseFloat(result.rows[0].avg_value);
```

### 3. Update Tests

Update all test expectations:

```javascript
// ❌ Before
expect(result.rows[0].total_value).toBeGreaterThan(0);

// ✅ After
expect(parseInt(result.rows[0].total_value)).toBeGreaterThan(0);
```

## Common Patterns

### Pattern 1: SUM Aggregates

```javascript
// Get total fan value
const result = await pool.query(
  'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
  [userId]
);

const totalValue = parseInt(result.rows[0].total_value);
console.log(`Total: $${totalValue / 100}`);
```

### Pattern 2: COUNT Aggregates

```javascript
// Count messages
const result = await pool.query(
  'SELECT COUNT(*) as message_count FROM messages WHERE user_id = $1',
  [userId]
);

const messageCount = parseInt(result.rows[0].message_count);
console.log(`Messages: ${messageCount}`);
```

### Pattern 3: AVG Aggregates

```javascript
// Average response time
const result = await pool.query(
  'SELECT AVG(response_time) as avg_response FROM messages WHERE user_id = $1',
  [userId]
);

const avgResponse = parseFloat(result.rows[0].avg_response);
console.log(`Average: ${avgResponse.toFixed(2)}s`);
```

### Pattern 4: Multiple Aggregates

```javascript
// Multiple aggregates in one query
const result = await pool.query(`
  SELECT 
    COUNT(*) as total_count,
    SUM(value_cents) as total_value,
    AVG(value_cents) as avg_value
  FROM fans 
  WHERE user_id = $1
`, [userId]);

const stats = {
  count: parseInt(result.rows[0].total_count),
  total: parseInt(result.rows[0].total_value),
  average: parseFloat(result.rows[0].avg_value)
};
```

### Pattern 5: Null Handling

```javascript
// Handle null results (no rows)
const result = await pool.query(
  'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
  [userId]
);

const totalValue = result.rows[0].total_value 
  ? parseInt(result.rows[0].total_value) 
  : 0;
```

## TypeScript Support

### Define Types

```typescript
interface FanStats {
  total_count: string;  // Note: string from database
  total_value: string;  // Note: string from database
  avg_value: string;    // Note: string from database
}

interface ParsedFanStats {
  count: number;
  total: number;
  average: number;
}

function parseFanStats(raw: FanStats): ParsedFanStats {
  return {
    count: parseInt(raw.total_count),
    total: parseInt(raw.total_value),
    average: parseFloat(raw.avg_value)
  };
}
```

### Usage

```typescript
const result = await pool.query<FanStats>(`
  SELECT 
    COUNT(*) as total_count,
    SUM(value_cents) as total_value,
    AVG(value_cents) as avg_value
  FROM fans 
  WHERE user_id = $1
`, [userId]);

const stats = parseFanStats(result.rows[0]);
console.log(`Count: ${stats.count}`);
console.log(`Total: $${stats.total / 100}`);
console.log(`Average: $${stats.average / 100}`);
```

## Testing

### Update Test Expectations

```javascript
describe('Analytics', () => {
  it('should calculate total fan value', async () => {
    const result = await pool.query(
      'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
      [testUserId]
    );

    // ✅ Parse before comparing
    const totalValue = parseInt(result.rows[0].total_value);
    expect(totalValue).toBeGreaterThan(0);
    expect(totalValue).toBe(30000); // $300.00
  });

  it('should count total messages', async () => {
    const result = await pool.query(
      'SELECT COUNT(*) as message_count FROM messages WHERE user_id = $1',
      [testUserId]
    );

    // ✅ Parse before comparing
    const messageCount = parseInt(result.rows[0].message_count);
    expect(messageCount).toBeGreaterThanOrEqual(3);
  });

  it('should handle null results', async () => {
    const result = await pool.query(
      'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
      [nonExistentUserId]
    );

    // ✅ Handle null case
    const totalValue = result.rows[0].total_value 
      ? parseInt(result.rows[0].total_value) 
      : 0;
    expect(totalValue).toBe(0);
  });
});
```

## Files Changed

The following files were updated in this migration:

### Test Files
- `tests/integration/api/crm-flow.test.ts`
  - Line 369: Added `parseInt()` for `total_value`
  - Line 377: Added `parseInt()` for `message_count`
  - Line 385: Added `parseInt()` for `ai_count`
  - Line 393: Added `parseInt()` for `ppv_revenue`
  - Line 401: Added `parseInt()` for `unread_count`

### Documentation Files
- `docs/API_REFERENCE.md` - Added database types section
- `docs/api/openapi.yaml` - Documented numeric value behavior
- `docs/api/INTEGRATION_GUIDE.md` - Added parsing examples
- `docs/api/ERROR_CODES.md` - Added type error scenario
- `CHANGELOG.md` - Documented the change

## Best Practices

### 1. Always Parse Aggregates

```javascript
// ✅ Good
const total = parseInt(result.rows[0].total);

// ❌ Bad
const total = result.rows[0].total;
```

### 2. Use Appropriate Parser

```javascript
// For integers (SUM, COUNT)
const count = parseInt(value);

// For decimals (AVG)
const average = parseFloat(value);
```

### 3. Handle Null Values

```javascript
// ✅ Good
const total = result.rows[0].total 
  ? parseInt(result.rows[0].total) 
  : 0;

// ❌ Bad - will return NaN
const total = parseInt(result.rows[0].total);
```

### 4. Validate Parsed Values

```javascript
const total = parseInt(result.rows[0].total);

if (isNaN(total)) {
  console.error('Invalid numeric value');
  return 0;
}

return total;
```

### 5. Create Helper Functions

```javascript
function parseIntSafe(value: string | null): number {
  if (!value) return 0;
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
}

function parseFloatSafe(value: string | null): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// Usage
const total = parseIntSafe(result.rows[0].total_value);
const average = parseFloatSafe(result.rows[0].avg_value);
```

## Common Mistakes

### Mistake 1: Forgetting to Parse

```javascript
// ❌ Wrong
const total = result.rows[0].total_value;
if (total > 0) { // Type error!
  console.log('Has value');
}

// ✅ Correct
const total = parseInt(result.rows[0].total_value);
if (total > 0) {
  console.log('Has value');
}
```

### Mistake 2: Using Wrong Parser

```javascript
// ❌ Wrong - loses precision
const average = parseInt(result.rows[0].avg_value);

// ✅ Correct
const average = parseFloat(result.rows[0].avg_value);
```

### Mistake 3: Not Handling Null

```javascript
// ❌ Wrong - returns NaN
const total = parseInt(result.rows[0].total_value);

// ✅ Correct
const total = result.rows[0].total_value 
  ? parseInt(result.rows[0].total_value) 
  : 0;
```

## Verification

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/integration/api/crm-flow.test.ts

# Run with coverage
npm test -- --coverage
```

### Check for Issues

```bash
# Search for potential issues
grep -r "\.rows\[0\]\." tests/ | grep -E "(SUM|COUNT|AVG)"
```

## Resources

- [node-postgres Documentation](https://node-postgres.com/)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [JavaScript parseInt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)
- [JavaScript parseFloat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)

## Support

If you encounter issues with database types:

1. Check this migration guide
2. Review [API_REFERENCE.md](../API_REFERENCE.md)
3. See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
4. Contact: support@huntaze.com

---

**Migration Date**: October 31, 2025  
**Version**: 1.4.1  
**Status**: ✅ Complete
