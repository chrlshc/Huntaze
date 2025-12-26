import { describe, expect, it, vi, beforeEach } from 'vitest';
import { externalFetch } from '@/lib/services/external/http';
import { ExternalServiceError } from '@/lib/services/external/errors';
import { RedditPublishService } from '@/lib/services/redditPublish';

vi.mock('@/lib/services/external/http', () => ({
  externalFetch: vi.fn(),
}));

const mockExternalFetch = vi.mocked(externalFetch);

function createResponse(options: {
  ok: boolean;
  status: number;
  jsonData: unknown;
}) {
  return {
    ok: options.ok,
    status: options.status,
    statusText: options.ok ? 'OK' : 'ERROR',
    json: vi.fn().mockResolvedValue(options.jsonData),
  } as unknown as Response;
}

describe('RedditPublishService', () => {
  beforeEach(() => {
    mockExternalFetch.mockReset();
  });

  it('returns post info when response is valid', async () => {
    const service = new RedditPublishService();
    const response = createResponse({
      ok: true,
      status: 200,
      jsonData: {
        data: {
          children: [
            {
              data: {
                id: 'abc',
                name: 't3_abc',
                title: 'Hello',
                subreddit: 'test',
                author: 'user',
                score: 10,
                num_comments: 2,
                created_utc: 123,
                url: 'https://reddit.com',
                permalink: '/r/test/comments/abc',
                is_self: true,
                selftext: 'body',
              },
            },
          ],
        },
      },
    });

    mockExternalFetch.mockResolvedValue(response);

    const result = await service.getPostInfo('abc', 'token');

    expect(result.id).toBe('abc');
    expect(result.subreddit).toBe('test');
  });

  it('throws ExternalServiceError on rate limit response', async () => {
    const service = new RedditPublishService();
    const response = createResponse({
      ok: false,
      status: 429,
      jsonData: { message: 'rate limit' },
    });

    mockExternalFetch.mockResolvedValue(response);

    await expect(service.getPostInfo('abc', 'token')).rejects.toEqual(
      expect.objectContaining({
        name: 'ExternalServiceError',
        code: 'RATE_LIMIT',
        retryable: true,
      })
    );
  });

  it('throws ExternalServiceError when post is missing', async () => {
    const service = new RedditPublishService();
    const response = createResponse({
      ok: true,
      status: 200,
      jsonData: { data: { children: [] } },
    });

    mockExternalFetch.mockResolvedValue(response);

    await expect(service.getPostInfo('abc', 'token')).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
