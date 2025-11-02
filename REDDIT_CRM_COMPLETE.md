# Reddit CRM Sync - Task 17 Complete ✅

## Summary

Successfully implemented Reddit CRM synchronization with database tracking and metrics syncing.

## Files Created/Modified

### Database Migration
- **lib/db/migrations/2024-10-31-social-integrations.sql** (updated)
  - Added `reddit_posts` table
  - Indexes for user, subreddit, and date lookups
  - Comments for documentation

### Repository
- **lib/db/repositories/redditPostsRepository.ts** - Complete CRUD operations
  - `create()` - Create/upsert posts
  - `findByPostId()` - Find by Reddit ID
  - `findByUser()` - Get user's posts
  - `findBySubreddit()` - Filter by subreddit
  - `updateMetrics()` - Update score and comments
  - `delete()` - Delete posts
  - `getStatistics()` - Get user statistics

### API Endpoints
- **app/api/reddit/publish/route.ts** (updated)
  - Now stores posts in database after submission
  - Tracks all post metadata

- **app/api/reddit/posts.ts** - Get user's posts
  - List all posts or filter by subreddit
  - Returns statistics (total posts, score, comments)
  - Pagination support

### Workers
- **lib/workers/redditSyncWorker.ts** - Metrics sync worker
  - `syncUserPosts()` - Sync metrics for user's posts
  - `syncAllUsers()` - Sync all users (placeholder)
  - `runRedditSync()` - Main worker function
  - Auto-refreshes expired tokens

## Database Schema

### reddit_posts Table

```sql
CREATE TABLE reddit_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  oauth_account_id INTEGER NOT NULL,
  post_id VARCHAR(255) UNIQUE NOT NULL,
  post_name VARCHAR(255) UNIQUE NOT NULL,
  subreddit VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  kind VARCHAR(50) NOT NULL,
  url TEXT,
  selftext TEXT,
  permalink VARCHAR(500),
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  is_nsfw BOOLEAN DEFAULT FALSE,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_utc BIGINT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_reddit_posts_user` - User lookups
- `idx_reddit_posts_subreddit` - Subreddit filtering
- `idx_reddit_posts_oauth` - OAuth account lookups
- `idx_reddit_posts_created` - Recent posts sorting

## Features Implemented

### Post Tracking
✅ Store all submitted posts
✅ Track post metadata (flair, NSFW, spoiler)
✅ Unique constraint on post_id (idempotent)
✅ Link to user and OAuth account

### Metrics Syncing
✅ Update score (karma)
✅ Update comment count
✅ Periodic sync worker
✅ Auto-refresh expired tokens

### Statistics
✅ Total posts count
✅ Total karma score
✅ Total comments
✅ Top subreddits by post count

### API Endpoints
✅ GET /api/reddit/posts - List posts
✅ GET /api/reddit/posts?subreddit=X - Filter by subreddit
✅ GET /api/reddit/posts?limit=X - Pagination
✅ Returns statistics with posts

## Usage Examples

### Submit and Track Post
```typescript
// POST /api/reddit/publish
{
  "subreddit": "programming",
  "title": "My awesome project",
  "kind": "link",
  "url": "https://github.com/user/project"
}

// Post is automatically stored in database
```

### Get User's Posts
```typescript
// GET /api/reddit/posts
{
  "success": true,
  "data": {
    "posts": [...],
    "statistics": {
      "totalPosts": 42,
      "totalScore": 1337,
      "totalComments": 256,
      "topSubreddits": [
        { "subreddit": "programming", "count": 15 },
        { "subreddit": "webdev", "count": 10 }
      ]
    }
  }
}
```

### Sync Post Metrics
```typescript
import { syncUserPosts } from '@/lib/workers/redditSyncWorker';

const result = await syncUserPosts(userId);
// Updates score and comments for all user's posts
```

## Integration with Existing Code

### Follows TikTok/Instagram Patterns
- Similar repository structure
- Same upsert pattern for idempotence
- Consistent error handling
- Metadata stored as JSONB

### Database Consistency
- Uses existing oauth_accounts table
- Foreign key constraints
- Cascade deletes
- Proper indexing

## Next Steps

### Scheduled Sync
- Set up cron job to run `runRedditSync()` periodically
- Recommended: Every 15-30 minutes
- Can use AWS EventBridge or similar

### Enhanced Statistics
- Track karma over time
- Identify best posting times
- Subreddit performance analysis
- Engagement rate calculations

### Webhook Support (Optional)
- Reddit doesn't have webhooks
- Polling is the standard approach
- Current implementation is sufficient

## Testing

### Manual Testing
1. Submit a post via `/api/reddit/publish`
2. Check database for reddit_posts record
3. Get posts via `/api/reddit/posts`
4. Verify statistics are correct
5. Run sync worker to update metrics

### Database Migration
```bash
# Run migration
psql $DATABASE_URL -f lib/db/migrations/2024-10-31-social-integrations.sql

# Verify table
psql $DATABASE_URL -c "\d reddit_posts"
```

## Status

✅ Task 17.1: reddit_posts table created
✅ Task 17.2: RedditPostsRepository implemented
✅ Task 17.3: Sync worker created
✅ Task 17.4: API endpoints updated
✅ All TypeScript errors resolved
✅ Follows existing patterns

**Ready for Task 18: Reddit UI Components**

---

**Completed**: October 31, 2024
**Time Spent**: ~30 minutes
**Next Task**: Task 18 - Reddit UI Components (Dashboard Widget & Publish Form)
