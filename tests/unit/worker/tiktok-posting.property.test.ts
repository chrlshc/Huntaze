/**
 * Property-Based Tests for TikTok Posting
 *
 * **Feature: content-posting-system, Property 5: TikTok Upload Round Trip**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * This test verifies that the TikTok posting flow (init → upload → publish)
 * correctly handles various task configurations and returns a valid publishId.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { postToTikTok } from "../../../worker/platforms/tiktok";
import {
  ContentTask,
  SocialAccount,
  ContentPlatform,
  ContentTaskStatus,
  ContentSourceType,
} from "@prisma/client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock logger
vi.mock("../../../lib/logger", () => ({
  makeReqLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe("TikTok Posting - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 5: TikTok Upload Round Trip (PULL_FROM_URL)
   *
   * For any valid TikTok task with sourceUrl, the posting flow should:
   * 1. Call init endpoint with PULL_FROM_URL
   * 2. Receive a publish_id
   */
  it("should complete PULL_FROM_URL flow for any valid task with sourceUrl", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random task data
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
          caption: fc.option(fc.string({ maxLength: 2200 }), { nil: null }),
          sourceUrl: fc.webUrl({ validSchemes: ["https"] }),
        }),
        // Generate random social account data
        fc.record({
          accessToken: fc.string({ minLength: 50, maxLength: 200 }),
          platformUserId: fc.string({ minLength: 10, maxLength: 50 }),
        }),
        // Generate random API response
        fc.record({
          publishId: fc.string({ minLength: 10, maxLength: 30 }),
        }),
        async (taskData, accountData, apiData) => {
          // Reset mock before each property test run
          mockFetch.mockClear();

          // Create mock task
          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            status: ContentTaskStatus.PENDING,
            sourceType: ContentSourceType.URL,
            sourceUrl: taskData.sourceUrl,
            assetKey: null,
            caption: taskData.caption,
            hook: null,
            body: null,
            cta: null,
            trendLabel: null,
            scheduledAt: null,
            startedAt: null,
            postedAt: null,
            externalPostId: null,
            errorMessage: null,
            attemptCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Create mock social account
          const socialAccount: SocialAccount = {
            id: "test-account-id",
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            platformUserId: accountData.platformUserId,
            pageId: null,
            pageAccessToken: null,
            accessToken: accountData.accessToken,
            refreshToken: "test-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock API response for PULL_FROM_URL
          mockFetch.mockImplementation(async (url: string) => {
            if (url.includes("/v2/post/publish/video/init/")) {
              return {
                ok: true,
                json: async () => ({
                  data: {
                    publish_id: apiData.publishId,
                  },
                }),
              };
            }

            throw new Error(`Unexpected URL: ${url}`);
          });

          // Execute posting
          const result = await postToTikTok(task, socialAccount);

          // Verify: Should return the publish ID
          expect(result).toBe(apiData.publishId);

          // Verify: Init endpoint was called
          expect(mockFetch).toHaveBeenCalledTimes(1);

          // Verify: Correct endpoint was called
          const initCall = mockFetch.mock.calls[0][0] as string;
          expect(initCall).toContain("/v2/post/publish/video/init/");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: TikTok Upload Round Trip (FILE_UPLOAD)
   *
   * For any valid TikTok task with assetKey, the posting flow should:
   * 1. Call init endpoint with FILE_UPLOAD
   * 2. Download video from S3
   * 3. Upload to TikTok upload_url
   * 4. Return publish_id
   */
  it("should complete FILE_UPLOAD flow for any valid task with assetKey", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random task data
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
          caption: fc.option(fc.string({ maxLength: 2200 }), { nil: null }),
          assetKey: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        // Generate random social account data
        fc.record({
          accessToken: fc.string({ minLength: 50, maxLength: 200 }),
          platformUserId: fc.string({ minLength: 10, maxLength: 50 }),
        }),
        // Generate random API response
        fc.record({
          publishId: fc.string({ minLength: 10, maxLength: 30 }),
          uploadUrl: fc.webUrl({ validSchemes: ["https"] }),
        }),
        async (taskData, accountData, apiData) => {
          // Reset mock before each property test run
          mockFetch.mockClear();

          // Create mock task
          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            status: ContentTaskStatus.PENDING,
            sourceType: ContentSourceType.UPLOAD,
            sourceUrl: null,
            assetKey: taskData.assetKey,
            caption: taskData.caption,
            hook: null,
            body: null,
            cta: null,
            trendLabel: null,
            scheduledAt: null,
            startedAt: null,
            postedAt: null,
            externalPostId: null,
            errorMessage: null,
            attemptCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Create mock social account
          const socialAccount: SocialAccount = {
            id: "test-account-id",
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            platformUserId: accountData.platformUserId,
            pageId: null,
            pageAccessToken: null,
            accessToken: accountData.accessToken,
            refreshToken: "test-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock video content
          const mockVideoBuffer = Buffer.from("mock-video-content");

          // Mock API responses
          mockFetch.mockImplementation(async (url: string, options?: any) => {
            // Step 1: Init upload
            if (url.includes("/v2/post/publish/inbox/video/init/")) {
              return {
                ok: true,
                json: async () => ({
                  data: {
                    publish_id: apiData.publishId,
                    upload_url: apiData.uploadUrl,
                  },
                }),
              };
            }

            // Step 2: Download from S3
            if (url.includes(".s3.") && url.includes(".amazonaws.com")) {
              return {
                ok: true,
                arrayBuffer: async () => mockVideoBuffer.buffer,
              };
            }

            // Step 3: Upload to TikTok
            if (url === apiData.uploadUrl && options?.method === "PUT") {
              return {
                ok: true,
              };
            }

            throw new Error(`Unexpected URL: ${url}`);
          });

          // Execute posting
          const result = await postToTikTok(task, socialAccount);

          // Verify: Should return the publish ID
          expect(result).toBe(apiData.publishId);

          // Verify: All three API calls were made (init, S3 download, upload)
          expect(mockFetch).toHaveBeenCalledTimes(3);

          // Verify: Init endpoint was called
          const initCall = mockFetch.mock.calls[0][0] as string;
          expect(initCall).toContain("/v2/post/publish/inbox/video/init/");

          // Verify: S3 download was called
          const s3Call = mockFetch.mock.calls[1][0] as string;
          expect(s3Call).toContain(".s3.");
          expect(s3Call).toContain(taskData.assetKey);

          // Verify: Upload was called
          const uploadCall = mockFetch.mock.calls[2][0] as string;
          expect(uploadCall).toBe(apiData.uploadUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error handling for missing accessToken
   *
   * For any task, if accessToken is missing, the function should throw
   */
  it("should throw error if accessToken is missing", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
        }),
        async (taskData) => {
          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            status: ContentTaskStatus.PENDING,
            sourceType: ContentSourceType.URL,
            sourceUrl: "https://example.com/video.mp4",
            assetKey: null,
            caption: "Test caption",
            hook: null,
            body: null,
            cta: null,
            trendLabel: null,
            scheduledAt: null,
            startedAt: null,
            postedAt: null,
            externalPostId: null,
            errorMessage: null,
            attemptCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const socialAccount: SocialAccount = {
            id: "test-account-id",
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            platformUserId: "test-tiktok-user-id",
            pageId: null,
            pageAccessToken: null,
            accessToken: null, // Missing token
            refreshToken: null,
            expiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await expect(postToTikTok(task, socialAccount)).rejects.toThrow(
            "accessToken is missing"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error handling for missing video source
   *
   * For any task without sourceUrl or assetKey, the function should throw
   */
  it("should throw error if no video source is available", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
        }),
        async (taskData) => {
          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            status: ContentTaskStatus.PENDING,
            sourceType: ContentSourceType.URL,
            sourceUrl: null, // No URL
            assetKey: null, // No asset key
            caption: "Test caption",
            hook: null,
            body: null,
            cta: null,
            trendLabel: null,
            scheduledAt: null,
            startedAt: null,
            postedAt: null,
            externalPostId: null,
            errorMessage: null,
            attemptCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const socialAccount: SocialAccount = {
            id: "test-account-id",
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            platformUserId: "test-tiktok-user-id",
            pageId: null,
            pageAccessToken: null,
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await expect(postToTikTok(task, socialAccount)).rejects.toThrow(
            "No video source available"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: API error handling
   *
   * When TikTok API returns an error, the function should throw with detailed message
   */
  it("should throw detailed error when TikTok API returns error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
        }),
        fc.constantFrom(
          "access_token_invalid",
          "scope_not_authorized",
          "rate_limit_exceeded",
          "spam_risk_too_many_pending_share",
          "invalid_param"
        ),
        async (taskData, errorCode) => {
          mockFetch.mockClear();

          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            status: ContentTaskStatus.PENDING,
            sourceType: ContentSourceType.URL,
            sourceUrl: "https://example.com/video.mp4",
            assetKey: null,
            caption: "Test caption",
            hook: null,
            body: null,
            cta: null,
            trendLabel: null,
            scheduledAt: null,
            startedAt: null,
            postedAt: null,
            externalPostId: null,
            errorMessage: null,
            attemptCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const socialAccount: SocialAccount = {
            id: "test-account-id",
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            platformUserId: "test-tiktok-user-id",
            pageId: null,
            pageAccessToken: null,
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock API error response
          mockFetch.mockImplementation(async () => ({
            ok: true,
            json: async () => ({
              error: {
                code: errorCode,
                message: `Error: ${errorCode}`,
                log_id: "test-log-id",
              },
            }),
          }));

          await expect(postToTikTok(task, socialAccount)).rejects.toThrow(
            errorCode
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Caption building from hook, body, cta
   *
   * When caption is not provided, it should be built from hook, body, cta
   */
  it("should build caption from hook, body, cta when caption is null", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
          hook: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
            nil: null,
          }),
          body: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
            nil: null,
          }),
          cta: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
            nil: null,
          }),
        }),
        fc.record({
          publishId: fc.string({ minLength: 10, maxLength: 30 }),
        }),
        async (taskData, apiData) => {
          mockFetch.mockClear();

          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            status: ContentTaskStatus.PENDING,
            sourceType: ContentSourceType.URL,
            sourceUrl: "https://example.com/video.mp4",
            assetKey: null,
            caption: null, // No caption - should use hook, body, cta
            hook: taskData.hook,
            body: taskData.body,
            cta: taskData.cta,
            trendLabel: null,
            scheduledAt: null,
            startedAt: null,
            postedAt: null,
            externalPostId: null,
            errorMessage: null,
            attemptCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const socialAccount: SocialAccount = {
            id: "test-account-id",
            userId: taskData.userId,
            platform: ContentPlatform.TIKTOK,
            platformUserId: "test-tiktok-user-id",
            pageId: null,
            pageAccessToken: null,
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          let capturedTitle: string | null = null;

          mockFetch.mockImplementation(async (url: string, options?: any) => {
            if (url.includes("/v2/post/publish/video/init/")) {
              const body = JSON.parse(options.body);
              capturedTitle = body.post_info.title;
              return {
                ok: true,
                json: async () => ({
                  data: {
                    publish_id: apiData.publishId,
                  },
                }),
              };
            }
            throw new Error(`Unexpected URL: ${url}`);
          });

          await postToTikTok(task, socialAccount);

          // Verify caption was built correctly
          const expectedParts: string[] = [];
          if (taskData.hook) expectedParts.push(taskData.hook);
          if (taskData.body) expectedParts.push(taskData.body);
          if (taskData.cta) expectedParts.push(taskData.cta);
          const expectedCaption = expectedParts.join("\n\n");

          expect(capturedTitle).toBe(expectedCaption);
        }
      ),
      { numRuns: 100 }
    );
  });
});
