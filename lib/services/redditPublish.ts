/**
 * Reddit Publishing Service
 * 
 * Handles content submission to Reddit (links, text posts, images)
 * 
 * @see https://www.reddit.com/dev/api#POST_api_submit
 * @see https://www.reddit.com/dev/api#section_links_and_comments
 */

import { externalFetch } from '@/lib/services/external/http';
import { ExternalServiceError, isExternalServiceError, mapHttpStatusToExternalCode } from '@/lib/services/external/errors';

const REDDIT_API_URL = 'https://oauth.reddit.com';

export interface RedditSubmitParams {
  subreddit: string;
  title: string;
  kind: 'link' | 'self' | 'image' | 'video';
  url?: string; // For link posts
  text?: string; // For self (text) posts
  nsfw?: boolean;
  spoiler?: boolean;
  sendReplies?: boolean; // Send inbox replies
  flairId?: string;
  flairText?: string;
}

export interface RedditSubmitResponse {
  id: string; // Post ID (e.g., "t3_abc123")
  name: string; // Full name with prefix
  url: string; // Reddit URL to the post
  permalink: string; // Relative permalink
}

export interface RedditPostInfo {
  id: string;
  name: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  is_self: boolean;
  selftext?: string;
}

/**
 * Reddit Publishing Service
 */
export class RedditPublishService {
  private userAgent: string;

  constructor() {
    this.userAgent = 'Huntaze/1.0.0';
  }

  /**
   * Submit a post to Reddit
   * 
   * @param params - Submission parameters
   * @param accessToken - Valid access token
   * @returns Submission response with post ID and URL
   * @throws Error if submission fails
   */
  async submit(params: RedditSubmitParams, accessToken: string): Promise<RedditSubmitResponse> {
    const {
      subreddit,
      title,
      kind,
      url,
      text,
      nsfw = false,
      spoiler = false,
      sendReplies = true,
      flairId,
      flairText,
    } = params;

    // Validate parameters
    if (!subreddit || !title) {
      throw new Error('Subreddit and title are required');
    }

    if (kind === 'link' && !url) {
      throw new Error('URL is required for link posts');
    }

    if (kind === 'self' && !text) {
      throw new Error('Text is required for self posts');
    }

    // Build form data
    const formData = new URLSearchParams({
      sr: subreddit,
      title,
      kind,
      nsfw: nsfw.toString(),
      spoiler: spoiler.toString(),
      sendreplies: sendReplies.toString(),
      api_type: 'json',
    });

    // Add content based on kind
    if (kind === 'link' && url) {
      formData.append('url', url);
    } else if (kind === 'self' && text) {
      formData.append('text', text);
    }

    // Add optional flair
    if (flairId) {
      formData.append('flair_id', flairId);
    }
    if (flairText) {
      formData.append('flair_text', flairText);
    }

    const response = await externalFetch(`${REDDIT_API_URL}/api/submit`, {
      service: 'reddit',
      operation: 'submit',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.userAgent,
      },
      body: formData.toString(),
      cache: 'no-store',
      timeoutMs: 15_000,
      retry: { maxRetries: 0, retryMethods: [] },
    });

    const data = await response.json().catch(() => ({}));

    // Check for errors (Reddit uses 200 + json.errors sometimes)
    if (!response.ok || data.json?.errors?.length > 0) {
      const errors = data.json?.errors || [];
      const errorMessage =
        errors.map((e: any[]) => e.join(': ')).join(', ') ||
        data.message ||
        response.statusText ||
        'Submission failed';

      const flattened = errors.map((e: any[]) => String(e[0] ?? '')).filter(Boolean);
      const primary = flattened[0] || '';

      const mapped =
        primary === 'RATELIMIT'
          ? { code: 'RATE_LIMIT' as const, retryable: true }
          : primary === 'SUBREDDIT_NOEXIST'
            ? { code: 'NOT_FOUND' as const, retryable: false }
            : primary === 'NO_LINKS' || primary === 'NO_SELFS'
              ? { code: 'FORBIDDEN' as const, retryable: false }
              : mapHttpStatusToExternalCode(response.status);

      throw new ExternalServiceError({
        service: 'reddit',
        code: mapped.code,
        retryable: mapped.retryable,
        status: response.status,
        message: errorMessage,
        details: { errors },
      });
    }

    // Extract submission data
    const submissionData = data.json?.data;
    if (!submissionData) {
      throw new ExternalServiceError({
        service: 'reddit',
        code: 'INVALID_RESPONSE',
        retryable: false,
        status: response.status,
        message: 'Invalid response from Reddit API',
      });
    }

    return {
      id: submissionData.id,
      name: submissionData.name,
      url: submissionData.url,
      permalink: submissionData.permalink || `/r/${subreddit}/comments/${submissionData.id}`,
    };
  }

  /**
   * Submit a link post
   * 
   * @param subreddit - Subreddit name (without r/)
   * @param title - Post title
   * @param url - Link URL
   * @param accessToken - Valid access token
   * @param options - Optional parameters
   * @returns Submission response
   */
  async submitLink(
    subreddit: string,
    title: string,
    url: string,
    accessToken: string,
    options?: Partial<RedditSubmitParams>
  ): Promise<RedditSubmitResponse> {
    return this.submit(
      {
        subreddit,
        title,
        kind: 'link',
        url,
        ...options,
      },
      accessToken
    );
  }

  /**
   * Submit a text (self) post
   * 
   * @param subreddit - Subreddit name (without r/)
   * @param title - Post title
   * @param text - Post text/body (markdown supported)
   * @param accessToken - Valid access token
   * @param options - Optional parameters
   * @returns Submission response
   */
  async submitText(
    subreddit: string,
    title: string,
    text: string,
    accessToken: string,
    options?: Partial<RedditSubmitParams>
  ): Promise<RedditSubmitResponse> {
    return this.submit(
      {
        subreddit,
        title,
        kind: 'self',
        text,
        ...options,
      },
      accessToken
    );
  }

  /**
   * Get post information
   * 
   * @param postId - Post ID (with or without t3_ prefix)
   * @param accessToken - Valid access token
   * @returns Post information
   * @throws Error if post not found
   */
  async getPostInfo(postId: string, accessToken: string): Promise<RedditPostInfo> {
    try {
      // Ensure post ID has t3_ prefix
      const fullId = postId.startsWith('t3_') ? postId : `t3_${postId}`;

      const response = await externalFetch(`${REDDIT_API_URL}/api/info?id=${fullId}`, {
        service: 'reddit',
        operation: 'post.info',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const mapped = mapHttpStatusToExternalCode(response.status);
        throw new ExternalServiceError({
          service: 'reddit',
          code: mapped.code,
          retryable: mapped.retryable,
          status: response.status,
          message: data.message || data.error || 'Failed to get post info',
          details: data.error ? { error: data.error } : undefined,
        });
      }

      const post = data.data?.children?.[0]?.data;
      if (!post) {
        throw new ExternalServiceError({
          service: 'reddit',
          code: 'NOT_FOUND',
          retryable: false,
          status: response.status,
          message: 'Post not found',
        });
      }

      return {
        id: post.id,
        name: post.name,
        title: post.title,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        url: post.url,
        permalink: post.permalink,
        is_self: post.is_self,
        selftext: post.selftext,
      };
    } catch (error) {
      if (isExternalServiceError(error)) {
        throw error;
      }
      throw new ExternalServiceError({
        service: 'reddit',
        code: 'UNKNOWN',
        retryable: false,
        message: 'Failed to get post info',
        cause: error,
      });
    }
  }

  /**
   * Delete a post
   * 
   * @param postId - Post ID (with or without t3_ prefix)
   * @param accessToken - Valid access token
   * @throws Error if deletion fails
   */
  async deletePost(postId: string, accessToken: string): Promise<void> {
    try {
      // Ensure post ID has t3_ prefix
      const fullId = postId.startsWith('t3_') ? postId : `t3_${postId}`;

      const formData = new URLSearchParams({
        id: fullId,
      });

      const response = await externalFetch(`${REDDIT_API_URL}/api/del`, {
        service: 'reddit',
        operation: 'post.delete',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: formData.toString(),
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 0, retryMethods: [] },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const mapped = mapHttpStatusToExternalCode(response.status);
        throw new ExternalServiceError({
          service: 'reddit',
          code: mapped.code,
          retryable: mapped.retryable,
          status: response.status,
          message: data.message || data.error || 'Failed to delete post',
          details: data.error ? { error: data.error } : undefined,
        });
      }
    } catch (error) {
      if (isExternalServiceError(error)) {
        throw error;
      }
      throw new ExternalServiceError({
        service: 'reddit',
        code: 'UNKNOWN',
        retryable: false,
        message: 'Failed to delete post',
        cause: error,
      });
    }
  }

  /**
   * Edit a text post
   * 
   * @param postId - Post ID (with or without t3_ prefix)
   * @param text - New text content
   * @param accessToken - Valid access token
   * @returns Updated post info
   * @throws Error if edit fails
   */
  async editPost(postId: string, text: string, accessToken: string): Promise<RedditPostInfo> {
    try {
      // Ensure post ID has t3_ prefix
      const fullId = postId.startsWith('t3_') ? postId : `t3_${postId}`;

      const formData = new URLSearchParams({
        thing_id: fullId,
        text,
        api_type: 'json',
      });

      const response = await externalFetch(`${REDDIT_API_URL}/api/editusertext`, {
        service: 'reddit',
        operation: 'post.edit',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: formData.toString(),
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 0, retryMethods: [] },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.json?.errors?.length > 0) {
        const errors = data.json?.errors || [];
        const errorMessage =
          errors.map((e: any[]) => e.join(': ')).join(', ') ||
          data.message ||
          'Edit failed';
        const mapped = mapHttpStatusToExternalCode(response.status);
        throw new ExternalServiceError({
          service: 'reddit',
          code: mapped.code,
          retryable: mapped.retryable,
          status: response.status,
          message: errorMessage,
          details: errors.length > 0 ? { errors } : undefined,
        });
      }

      // Get updated post info
      return this.getPostInfo(postId, accessToken);
    } catch (error) {
      if (isExternalServiceError(error)) {
        throw error;
      }
      throw new ExternalServiceError({
        service: 'reddit',
        code: 'UNKNOWN',
        retryable: false,
        message: 'Failed to edit post',
        cause: error,
      });
    }
  }

  /**
   * Get subreddit rules
   * 
   * @param subreddit - Subreddit name (without r/)
   * @param accessToken - Valid access token
   * @returns List of subreddit rules
   */
  async getSubredditRules(subreddit: string, accessToken: string): Promise<Array<{
    kind: string;
    description: string;
    short_name: string;
    violation_reason: string;
  }>> {
    try {
      const response = await externalFetch(`${REDDIT_API_URL}/r/${subreddit}/about/rules`, {
        service: 'reddit',
        operation: 'subreddit.rules',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const mapped = mapHttpStatusToExternalCode(response.status);
        throw new ExternalServiceError({
          service: 'reddit',
          code: mapped.code,
          retryable: mapped.retryable,
          status: response.status,
          message: data.message || data.error || 'Failed to get rules',
          details: data.error ? { error: data.error } : undefined,
        });
      }

      return data.rules || [];
    } catch (error) {
      if (isExternalServiceError(error)) {
        throw error;
      }
      throw new ExternalServiceError({
        service: 'reddit',
        code: 'UNKNOWN',
        retryable: false,
        message: 'Failed to get subreddit rules',
        cause: error,
      });
    }
  }
}

// Lazy instantiation pattern - create instance only when needed
let redditPublishInstance: RedditPublishService | null = null;

function getRedditPublish(): RedditPublishService {
  if (!redditPublishInstance) {
    redditPublishInstance = new RedditPublishService();
  }
  return redditPublishInstance;
}

// Export singleton instance (lazy)
export const redditPublish = {
  submit: (...args: Parameters<RedditPublishService['submit']>) => getRedditPublish().submit(...args),
  submitLink: (...args: Parameters<RedditPublishService['submitLink']>) => getRedditPublish().submitLink(...args),
  submitText: (...args: Parameters<RedditPublishService['submitText']>) => getRedditPublish().submitText(...args),
  getPostInfo: (...args: Parameters<RedditPublishService['getPostInfo']>) => getRedditPublish().getPostInfo(...args),
  deletePost: (...args: Parameters<RedditPublishService['deletePost']>) => getRedditPublish().deletePost(...args),
  editPost: (...args: Parameters<RedditPublishService['editPost']>) => getRedditPublish().editPost(...args),
  getSubredditRules: (...args: Parameters<RedditPublishService['getSubredditRules']>) => getRedditPublish().getSubredditRules(...args),
};
