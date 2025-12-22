/**
 * Property-Based Tests for Instagram Posting
 * 
 * **Feature: content-posting-system, Property 4: Instagram Container Round Trip**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 * 
 * This test verifies that the Instagram posting flow (create → poll → publish)
 * correctly handles various task configurations and returns a valid mediaId.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { postToInstagram } from "../../../worker/platforms/instagram";
import { ContentTask, SocialAccount, ContentPlatform, ContentTaskStatus, ContentSourceType } from "@prisma/client";

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

describe("Instagram Posting - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 4: Instagram Container Round Trip
   * 
   * For any valid Instagram task, the posting flow should:
   * 1. Create a container and receive a container ID
   * 2. Poll the container status until FINISHED
   * 3. Publish the container and receive a media ID
   */
  it("should complete create → poll → publish flow for any valid task", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random task data
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 30 }),
          userId: fc.integer({ min: 1, max: 10000 }),
          caption: fc.option(fc.string({ maxLength: 2200 }), { nil: null }),
          sourceUrl: fc.option(
            fc.webUrl({ validSchemes: ["https"] }),
            { nil: null }
          ),
          assetKey: fc.option(
            fc.string({ minLength: 10, maxLength: 100 }),
            { nil: null }
          ),
        }),
        // Generate random social account data
        fc.record({
          platformUserId: fc.string({ minLength: 10, maxLength: 50 }),
          pageAccessToken: fc.string({ minLength: 50, maxLength: 200 }),
        }),
        // Generate random API responses
        fc.record({
          containerId: fc.string({ minLength: 10, maxLength: 30 }),
          mediaId: fc.string({ minLength: 10, maxLength: 30 }),
          pollAttempts: fc.integer({ min: 1, max: 5 }),
        }),
        async (taskData, accountData, apiData) => {
          // Reset mock before each property test run
          mockFetch.mockClear();
          
          // Ensure at least one video source is present
          if (!taskData.sourceUrl && !taskData.assetKey) {
            taskData.sourceUrl = "https://example.com/video.mp4";
          }

          // Create mock task
          const task: ContentTask = {
            id: taskData.id,
            userId: taskData.userId,
            platform: ContentPlatform.INSTAGRAM,
            status: ContentTaskStatus.PENDING,
            sourceType: taskData.sourceUrl
              ? ContentSourceType.URL
              : ContentSourceType.UPLOAD,
            sourceUrl: taskData.sourceUrl,
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
            platform: ContentPlatform.INSTAGRAM,
            platformUserId: accountData.platformUserId,
            pageId: "test-page-id",
            pageAccessToken: accountData.pageAccessToken,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock API responses
          let callCount = 0;

          mockFetch.mockImplementation(async (url: string) => {
            callCount++;

            // Step 1: Create container
            if (url.includes("/media?") && !url.includes("media_publish")) {
              return {
                ok: true,
                json: async () => ({ id: apiData.containerId }),
              };
            }

            // Step 2: Poll status
            if (url.includes(`/${apiData.containerId}?`)) {
              const attempt = callCount - 1; // Subtract the create call

              if (attempt < apiData.pollAttempts) {
                // Return IN_PROGRESS for first N attempts
                return {
                  ok: true,
                  json: async () => ({
                    status_code: "IN_PROGRESS",
                    status: "IN_PROGRESS",
                  }),
                };
              } else {
                // Return FINISHED on final attempt
                return {
                  ok: true,
                  json: async () => ({
                    status_code: "FINISHED",
                    status: "FINISHED",
                  }),
                };
              }
            }

            // Step 3: Publish
            if (url.includes("/media_publish?")) {
              return {
                ok: true,
                json: async () => ({ id: apiData.mediaId }),
              };
            }

            throw new Error(`Unexpected URL: ${url}`);
          });

          // Execute posting
          const result = await postToInstagram(task, socialAccount);

          // Verify: Should return the media ID
          expect(result).toBe(apiData.mediaId);

          // Verify: All three API calls were made
          expect(mockFetch).toHaveBeenCalledTimes(
            1 + apiData.pollAttempts + 1 // create + polls + publish
          );

          // Verify: Create container was called with correct params
          const createCall = mockFetch.mock.calls[0][0] as string;
          expect(createCall).toContain("/media?");
          expect(createCall).toContain("media_type=REELS");
          expect(createCall).toContain(
            `access_token=${accountData.pageAccessToken}`
          );

          // Verify: Publish was called with container ID
          const publishCall = mockFetch.mock.calls[
            mockFetch.mock.calls.length - 1
          ][0] as string;
          expect(publishCall).toContain("/media_publish?");
          expect(publishCall).toContain(
            `creation_id=${apiData.containerId}`
          );
        }
      ),
      { numRuns: 10, timeout: 200000 } // 10 runs to keep test practical while still validating property
    );
  }, 200000); // 200s timeout for property test

  /**
   * Property: Error handling for missing tokens
   * 
   * For any task, if pageAccessToken is missing, the function should throw
   */
  it("should throw error if pageAccessToken is missing", async () => {
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
            platform: ContentPlatform.INSTAGRAM,
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
            platform: ContentPlatform.INSTAGRAM,
            platformUserId: "test-ig-user-id",
            pageId: "test-page-id",
            pageAccessToken: null, // Missing token
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await expect(postToInstagram(task, socialAccount)).rejects.toThrow(
            "pageAccessToken is missing"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error handling for missing platformUserId
   * 
   * For any task, if platformUserId is missing, the function should throw
   */
  it("should throw error if platformUserId is missing", async () => {
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
            platform: ContentPlatform.INSTAGRAM,
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
            platform: ContentPlatform.INSTAGRAM,
            platformUserId: "", // Missing user ID
            pageId: "test-page-id",
            pageAccessToken: "test-token",
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await expect(postToInstagram(task, socialAccount)).rejects.toThrow(
            "platformUserId"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error handling for missing video URL
   * 
   * For any task without sourceUrl or assetKey, the function should throw
   */
  it("should throw error if no video URL is available", async () => {
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
            platform: ContentPlatform.INSTAGRAM,
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
            platform: ContentPlatform.INSTAGRAM,
            platformUserId: "test-ig-user-id",
            pageId: "test-page-id",
            pageAccessToken: "test-token",
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await expect(postToInstagram(task, socialAccount)).rejects.toThrow(
            "No video URL available"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Polling timeout handling
   * 
   * If container status never reaches FINISHED, the function should timeout
   */
  it("should timeout if container status never reaches FINISHED", async () => {
    const task: ContentTask = {
      id: "test-task-id",
      userId: 1,
      platform: ContentPlatform.INSTAGRAM,
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
      userId: 1,
      platform: ContentPlatform.INSTAGRAM,
      platformUserId: "test-ig-user-id",
      pageId: "test-page-id",
      pageAccessToken: "test-token",
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock: Container creation succeeds
    // Mock: Status polling always returns IN_PROGRESS
    mockFetch.mockImplementation(async (url: string) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      
      if (urlStr.includes("/media?") && !urlStr.includes("media_publish")) {
        return {
          ok: true,
          json: async () => ({ id: "test-container-id" }),
        };
      }

      // Match polling URL - handle both encoded and non-encoded URLs
      if (urlStr.includes("test-container-id") && urlStr.includes("field")) {
        return {
          ok: true,
          json: async () => ({
            status_code: "IN_PROGRESS",
            status: "IN_PROGRESS",
          }),
        };
      }

      throw new Error(`Unexpected URL: ${urlStr}`);
    });

    await expect(postToInstagram(task, socialAccount)).rejects.toThrow(
      "polling timed out"
    );
  }, 150000); // 150s timeout for this test (30 polls * 4s + overhead)
});
