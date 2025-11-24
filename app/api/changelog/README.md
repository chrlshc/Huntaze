# Changelog API

## Overview

The Changelog API serves changelog updates for the "What's New" widget in the application. It provides a structured list of feature releases, updates, and improvements.

## Endpoint

```
GET /api/changelog
```

## Response Format

### Success Response (200)

```json
{
  "entries": [
    {
      "id": "1",
      "title": "Mobile UX Improvements",
      "description": "Enhanced mobile experience with viewport locking and safe area support",
      "releaseDate": "2024-01-15T00:00:00Z",
      "features": [
        "Fixed horizontal scrolling issues",
        "Added support for iPhone notches",
        "Improved touch interactions"
      ]
    }
  ],
  "latestReleaseDate": "2024-01-15T00:00:00Z"
}
```

### Error Response (500)

```json
{
  "entries": [],
  "latestReleaseDate": "1970-01-01T00:00:00.000Z"
}
```

## Data Model

### ChangelogEntry

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the changelog entry |
| `title` | string | Title of the release or update |
| `description` | string | Brief description of the changes |
| `releaseDate` | string | ISO 8601 formatted date (e.g., "2024-01-15T00:00:00Z") |
| `features` | string[] | Array of feature descriptions |

### ChangelogResponse

| Field | Type | Description |
|-------|------|-------------|
| `entries` | ChangelogEntry[] | Array of changelog entries, sorted by date (newest first) |
| `latestReleaseDate` | string | ISO 8601 date of the most recent release |

## Usage Example

### Client-Side Fetch

```typescript
import { ChangelogResponse } from '@/app/api/changelog/route';

async function fetchChangelog(): Promise<ChangelogResponse> {
  const response = await fetch('/api/changelog');
  
  if (!response.ok) {
    throw new Error('Failed to fetch changelog');
  }
  
  return response.json();
}

// Usage
const { entries, latestReleaseDate } = await fetchChangelog();
```

### With Error Handling

```typescript
async function fetchChangelogSafe(): Promise<ChangelogResponse> {
  try {
    const response = await fetch('/api/changelog');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Changelog fetch failed:', error);
    // Return empty fallback
    return {
      entries: [],
      latestReleaseDate: new Date(0).toISOString(),
    };
  }
}
```

## Implementation Details

### Current Implementation (MVP)

The API currently returns **mocked data** for rapid development and testing. This allows the frontend to be built and tested without waiting for CMS integration.

### Future Integration Options

The API is designed to be easily replaced with real data sources:

#### Option 1: CMS Integration (Recommended)

```typescript
// Example with Contentful
import { createClient } from 'contentful';

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

async function fetchFromCMS(): Promise<ChangelogEntry[]> {
  const response = await client.getEntries({
    content_type: 'changelog',
    order: '-fields.releaseDate',
  });
  
  return response.items.map(item => ({
    id: item.sys.id,
    title: item.fields.title,
    description: item.fields.description,
    releaseDate: item.fields.releaseDate,
    features: item.fields.features,
  }));
}
```

#### Option 2: Database Query

```typescript
// Example with Prisma
import { prisma } from '@/lib/prisma';

async function fetchFromDatabase(): Promise<ChangelogEntry[]> {
  const cache = await prisma.changelogCache.findFirst({
    orderBy: { cachedAt: 'desc' },
  });
  
  if (!cache) {
    return [];
  }
  
  return cache.entries as ChangelogEntry[];
}
```

#### Option 3: External API

```typescript
// Example with external API
async function fetchFromExternalAPI(): Promise<ChangelogEntry[]> {
  const response = await fetch('https://api.example.com/changelog', {
    headers: {
      'Authorization': `Bearer ${process.env.CHANGELOG_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('External API request failed');
  }
  
  return response.json();
}
```

## Error Handling

The API implements graceful error handling:

1. **Catch All Errors**: Any error during data fetching is caught
2. **Fallback Response**: Returns empty entries array with Unix epoch date
3. **Non-Breaking**: Ensures the UI continues to function even if the API fails
4. **Structured Logging**: Logs errors with context for debugging

## Requirements Validation

This API satisfies the following requirements from the mobile-ux-marketing-refactor spec:

- **Requirement 7.1**: Checks lastViewedChangelog cookie against latest release date
- **Requirement 7.5**: Handles CMS unavailability gracefully with cached fallback content

## Testing

### Manual Testing

```bash
# Test the API endpoint
curl http://localhost:3000/api/changelog

# Expected response: JSON with entries array and latestReleaseDate
```

### Unit Testing

See `tests/unit/api/changelog.test.ts` for comprehensive unit tests.

### Integration Testing

The Changelog Widget component (`components/engagement/ChangelogWidget.tsx`) provides integration testing of the API.

## Performance Considerations

- **Response Size**: Current mock data is ~2KB. Real data should be paginated if it exceeds 10KB
- **Caching**: Consider adding cache headers for production:
  ```typescript
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
  ```
- **Rate Limiting**: Not currently implemented, but recommended for production

## Security Considerations

- **No Authentication Required**: This is a public endpoint (changelog is public information)
- **Input Validation**: No user input to validate (GET endpoint with no parameters)
- **XSS Prevention**: All data is JSON-encoded, preventing XSS attacks
- **CORS**: Uses Next.js default CORS settings (same-origin)

## Migration Path

To migrate from mock data to real data:

1. Choose your data source (CMS, Database, or External API)
2. Replace the `getMockChangelogEntries()` function with your fetch logic
3. Update environment variables with necessary credentials
4. Test thoroughly with real data
5. Update this README with new implementation details

## Related Files

- **API Route**: `app/api/changelog/route.ts`
- **Widget Component**: `components/engagement/ChangelogWidget.tsx` (to be implemented in Task 16)
- **Types**: Exported from `app/api/changelog/route.ts`
- **Design Document**: `.kiro/specs/mobile-ux-marketing-refactor/design.md`
- **Requirements**: `.kiro/specs/mobile-ux-marketing-refactor/requirements.md`
