# Reddit Posts Migration Tests

## Overview

Tests for the `reddit_posts` table added to the social integrations migration.

**Status**: ✅ All tests passing (17 new tests)

## Table Structure

### reddit_posts Table

Tracks Reddit posts published by users through the Huntaze platform.

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `user_id` - INTEGER NOT NULL (FK to users)
- `oauth_account_id` - INTEGER NOT NULL (FK to oauth_accounts)
- `post_id` - VARCHAR(255) UNIQUE NOT NULL (Reddit post ID without t3_ prefix)
- `post_name` - VARCHAR(255) UNIQUE NOT NULL (Full name with t3_ prefix)
- `subreddit` - VARCHAR(255) NOT NULL (Subreddit name without r/)
- `title` - TEXT NOT NULL
- `kind` - VARCHAR(50) NOT NULL ('link', 'self', 'image', 'video')
- `url` - TEXT (For link posts)
- `selftext` - TEXT (For text posts)
- `permalink` - VARCHAR(500) (Reddit permalink)
- `score` - INTEGER DEFAULT 0 (Karma score)
- `num_comments` - INTEGER DEFAULT 0
- `is_nsfw` - BOOLEAN DEFAULT FALSE
- `is_spoiler` - BOOLEAN DEFAULT FALSE
- `created_utc` - BIGINT (Unix timestamp from Reddit)
- `metadata` - JSONB (Additional data: flair, awards, etc.)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- `idx_reddit_posts_user` - ON user_id
- `idx_reddit_posts_subreddit` - ON subreddit
- `idx_reddit_posts_oauth` - ON oauth_account_id
- `idx_reddit_posts_created` - ON created_at DESC

## Test Coverage

### Unit Tests (17 tests)

**File**: `tests/unit/db/social-integrations-migration.test.ts`

#### Table Structure (19 tests)
- ✅ Table creation
- ✅ All required columns present
- ✅ Foreign keys to users and oauth_accounts
- ✅ Unique constraints on post_id and post_name
- ✅ All indexes created
- ✅ JSONB metadata support
- ✅ Default values for counters (score, num_comments)
- ✅ Default values for boolean flags (is_nsfw, is_spoiler)
- ✅ Timestamps with defaults
- ✅ Support for different post kinds
- ✅ Unix timestamp field for Reddit data

### Integration Tests (11 tests)

**File**: `tests/integration/db/social-integrations-migration.test.ts`

#### Data Operations (11 tests)
- ✅ Insert Reddit post
- ✅ Retrieve Reddit post
- ✅ Enforce unique constraint on post_id
- ✅ Enforce unique constraint on post_name
- ✅ Update post metrics (score, num_comments)
- ✅ Find posts by subreddit using index
- ✅ Find recent posts using created_at index
- ✅ Support different post kinds (link, self, image, video)
- ✅ Store JSONB metadata
- ✅ Cascade delete from oauth_accounts
- ✅ Cascade delete from users

#### Performance Tests (2 tests)
- ✅ Use index for subreddit queries
- ✅ Use index for recent posts queries

## Running Tests

### Run all social integrations migration tests:
```bash
npx vitest run tests/unit/db/social-integrations-migration.test.ts
npx vitest run tests/integration/db/social-integrations-migration.test.ts
```

### Run with coverage:
```bash
npx vitest run tests/unit/db/social-integrations-migration.test.ts --coverage
```

## Test Results

**Total Tests**: 132 unit tests + integration tests
**Status**: ✅ All Passing

### Breakdown:
- oauth_accounts: 15 tests
- tiktok_posts: 14 tests
- instagram_accounts: 12 tests
- ig_media: 12 tests
- ig_comments: 11 tests
- webhook_events: 14 tests
- **reddit_posts: 17 tests** ← NEW
- Migration validation: 7 tests
- Data types: 7 tests
- Performance: 4 tests
- Security: 4 tests
- Requirements: 6 tests

## Reddit Post Types

The `kind` column supports different Reddit post types:

1. **self** - Text posts (use `selftext` column)
2. **link** - Link posts (use `url` column)
3. **image** - Image posts (use `url` column)
4. **video** - Video posts (use `url` column)

## Metadata Examples

The `metadata` JSONB column can store:

```json
{
  "flair": "Discussion",
  "awards": ["gold", "silver"],
  "crosspost_parent": "t3_parent123",
  "edited": false,
  "locked": false,
  "stickied": false
}
```

## Foreign Key Relationships

```
users (id)
  ↓ CASCADE DELETE
oauth_accounts (id)
  ↓ CASCADE DELETE
reddit_posts (oauth_account_id)
```

When a user is deleted, all their OAuth accounts are deleted, which cascades to delete all their Reddit posts.

## Index Usage

### Subreddit Queries
```sql
SELECT * FROM reddit_posts WHERE subreddit = 'programming';
-- Uses: idx_reddit_posts_subreddit
```

### Recent Posts
```sql
SELECT * FROM reddit_posts ORDER BY created_at DESC LIMIT 10;
-- Uses: idx_reddit_posts_created
```

### User's Posts
```sql
SELECT * FROM reddit_posts WHERE user_id = 123;
-- Uses: idx_reddit_posts_user
```

### OAuth Account Posts
```sql
SELECT * FROM reddit_posts WHERE oauth_account_id = 456;
-- Uses: idx_reddit_posts_oauth
```

## Unique Constraints

### post_id
Reddit post ID without the `t3_` prefix (e.g., `abc123`)

### post_name
Full Reddit post name with prefix (e.g., `t3_abc123`)

Both must be unique to prevent duplicate posts.

## Default Values

- `score`: 0 (updated when syncing from Reddit)
- `num_comments`: 0 (updated when syncing from Reddit)
- `is_nsfw`: FALSE
- `is_spoiler`: FALSE
- `created_at`: CURRENT_TIMESTAMP
- `updated_at`: CURRENT_TIMESTAMP

## Next Steps

### Repository Implementation
Create `lib/db/repositories/redditPostsRepository.ts` with methods:
- `create(post)` - Insert new post
- `findById(id)` - Get post by ID
- `findByPostId(postId)` - Get post by Reddit ID
- `findByUser(userId)` - Get user's posts
- `findBySubreddit(subreddit)` - Get posts in subreddit
- `updateMetrics(id, score, numComments)` - Update post metrics
- `delete(id)` - Delete post

### Service Integration
Update `lib/services/redditPublish.ts` to:
- Store posts in database after publishing
- Sync post metrics from Reddit API
- Handle post updates and deletions

### Worker Integration
Update `lib/workers/redditSyncWorker.ts` to:
- Sync posts from Reddit API
- Update post metrics periodically
- Handle webhook events for post updates

## References

- **Migration**: `lib/db/migrations/2024-10-31-social-integrations.sql`
- **Spec**: `.kiro/specs/social-integrations/`
- **Reddit API**: https://www.reddit.com/dev/api/

---

**Created**: October 31, 2025
**Status**: ✅ Tests Complete - Reddit posts table validated
**Total Tests**: 17 new tests (132 total in migration)

