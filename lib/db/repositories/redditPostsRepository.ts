/**
 * Reddit Posts Repository
 * 
 * Manages Reddit posts tracking:
 * - Create/update posts
 * - Find posts by user, subreddit
 * - Update post metrics (score, comments)
 * - Track post performance
 */

import { getPool } from '../index';

export interface RedditPost {
  id: number;
  userId: number;
  oauthAccountId: number;
  postId: string;
  postName: string;
  subreddit: string;
  title: string;
  kind: 'link' | 'self' | 'image' | 'video';
  url?: string;
  selftext?: string;
  permalink: string;
  score: number;
  numComments: number;
  isNsfw: boolean;
  isSpoiler: boolean;
  createdUtc?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRedditPostParams {
  userId: number;
  oauthAccountId: number;
  postId: string;
  postName: string;
  subreddit: string;
  title: string;
  kind: 'link' | 'self' | 'image' | 'video';
  url?: string;
  selftext?: string;
  permalink: string;
  score?: number;
  numComments?: number;
  isNsfw?: boolean;
  isSpoiler?: boolean;
  createdUtc?: number;
  metadata?: Record<string, any>;
}

export interface UpdatePostMetricsParams {
  postId: string;
  score: number;
  numComments: number;
}

/**
 * Reddit Posts Repository
 */
export class RedditPostsRepository {
  /**
   * Create or update a Reddit post
   * Uses upsert to handle duplicate submissions
   * 
   * @param params - Post parameters
   * @returns Created/updated post
   */
  async create(params: CreateRedditPostParams): Promise<RedditPost> {
    const {
      userId,
      oauthAccountId,
      postId,
      postName,
      subreddit,
      title,
      kind,
      url,
      selftext,
      permalink,
      score = 0,
      numComments = 0,
      isNsfw = false,
      isSpoiler = false,
      createdUtc,
      metadata,
    } = params;

    const pool = getPool();

    // Upsert (insert or update if exists)
    const result = await pool.query(
      `INSERT INTO reddit_posts (
        user_id,
        oauth_account_id,
        post_id,
        post_name,
        subreddit,
        title,
        kind,
        url,
        selftext,
        permalink,
        score,
        num_comments,
        is_nsfw,
        is_spoiler,
        created_utc,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      ON CONFLICT (post_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        num_comments = EXCLUDED.num_comments,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING 
        id, user_id, oauth_account_id, post_id, post_name, subreddit, title, kind,
        url, selftext, permalink, score, num_comments, is_nsfw, is_spoiler,
        created_utc, metadata, created_at, updated_at`,
      [
        userId,
        oauthAccountId,
        postId,
        postName,
        subreddit,
        title,
        kind,
        url,
        selftext,
        permalink,
        score,
        numComments,
        isNsfw,
        isSpoiler,
        createdUtc,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    const row = result.rows[0];
    return this.mapRowToPost(row);
  }

  /**
   * Find post by Reddit post ID
   * 
   * @param postId - Reddit post ID (with or without t3_ prefix)
   * @returns Post or null if not found
   */
  async findByPostId(postId: string): Promise<RedditPost | null> {
    const pool = getPool();

    // Remove t3_ prefix if present
    const cleanPostId = postId.replace(/^t3_/, '');

    const result = await pool.query(
      `SELECT 
        id, user_id, oauth_account_id, post_id, post_name, subreddit, title, kind,
        url, selftext, permalink, score, num_comments, is_nsfw, is_spoiler,
        created_utc, metadata, created_at, updated_at
       FROM reddit_posts
       WHERE post_id = $1
       LIMIT 1`,
      [cleanPostId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPost(result.rows[0]);
  }

  /**
   * Find posts by user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of posts to return
   * @returns List of posts
   */
  async findByUser(userId: number, limit: number = 50): Promise<RedditPost[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
        id, user_id, oauth_account_id, post_id, post_name, subreddit, title, kind,
        url, selftext, permalink, score, num_comments, is_nsfw, is_spoiler,
        created_utc, metadata, created_at, updated_at
       FROM reddit_posts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapRowToPost(row));
  }

  /**
   * Find posts by subreddit
   * 
   * @param userId - User ID
   * @param subreddit - Subreddit name (without r/)
   * @param limit - Maximum number of posts to return
   * @returns List of posts
   */
  async findBySubreddit(
    userId: number,
    subreddit: string,
    limit: number = 50
  ): Promise<RedditPost[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
        id, user_id, oauth_account_id, post_id, post_name, subreddit, title, kind,
        url, selftext, permalink, score, num_comments, is_nsfw, is_spoiler,
        created_utc, metadata, created_at, updated_at
       FROM reddit_posts
       WHERE user_id = $1 AND subreddit = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [userId, subreddit, limit]
    );

    return result.rows.map(row => this.mapRowToPost(row));
  }

  /**
   * Update post metrics (score, comments)
   * 
   * @param params - Update parameters
   */
  async updateMetrics(params: UpdatePostMetricsParams): Promise<void> {
    const { postId, score, numComments } = params;

    const pool = getPool();

    // Remove t3_ prefix if present
    const cleanPostId = postId.replace(/^t3_/, '');

    await pool.query(
      `UPDATE reddit_posts
       SET score = $1,
           num_comments = $2,
           updated_at = NOW()
       WHERE post_id = $3`,
      [score, numComments, cleanPostId]
    );
  }

  /**
   * Delete post
   * 
   * @param postId - Reddit post ID
   * @returns True if deleted
   */
  async delete(postId: string): Promise<boolean> {
    const pool = getPool();

    // Remove t3_ prefix if present
    const cleanPostId = postId.replace(/^t3_/, '');

    const result = await pool.query(
      `DELETE FROM reddit_posts WHERE post_id = $1`,
      [cleanPostId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get post statistics for user
   * 
   * @param userId - User ID
   * @returns Statistics
   */
  async getStatistics(userId: number): Promise<{
    totalPosts: number;
    totalScore: number;
    totalComments: number;
    topSubreddits: Array<{ subreddit: string; count: number }>;
  }> {
    const pool = getPool();

    // Get totals
    const totalsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_posts,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(SUM(num_comments), 0) as total_comments
       FROM reddit_posts
       WHERE user_id = $1`,
      [userId]
    );

    // Get top subreddits
    const subredditsResult = await pool.query(
      `SELECT 
        subreddit,
        COUNT(*) as count
       FROM reddit_posts
       WHERE user_id = $1
       GROUP BY subreddit
       ORDER BY count DESC
       LIMIT 10`,
      [userId]
    );

    const totals = totalsResult.rows[0];

    return {
      totalPosts: parseInt(totals.total_posts),
      totalScore: parseInt(totals.total_score),
      totalComments: parseInt(totals.total_comments),
      topSubreddits: subredditsResult.rows.map(row => ({
        subreddit: row.subreddit,
        count: parseInt(row.count),
      })),
    };
  }

  /**
   * Map database row to RedditPost object
   */
  private mapRowToPost(row: any): RedditPost {
    return {
      id: row.id,
      userId: row.user_id,
      oauthAccountId: row.oauth_account_id,
      postId: row.post_id,
      postName: row.post_name,
      subreddit: row.subreddit,
      title: row.title,
      kind: row.kind,
      url: row.url,
      selftext: row.selftext,
      permalink: row.permalink,
      score: row.score,
      numComments: row.num_comments,
      isNsfw: row.is_nsfw,
      isSpoiler: row.is_spoiler,
      createdUtc: row.created_utc,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton instance
export const redditPostsRepository = new RedditPostsRepository();
