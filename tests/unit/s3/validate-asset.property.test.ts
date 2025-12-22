/**
 * Property-Based Tests for S3 Asset Validation
 *
 * **Feature: content-posting-system, Property 8: S3 Asset Validation**
 * **Validates: Requirements 7.5**
 *
 * Tests that task creation fails if S3 asset doesn't exist.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";

// Mock logger before importing the module
vi.mock("@/lib/logger", () => ({
  makeReqLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock S3 client with a controllable send function
const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class MockS3Client {
    send = mockSend;
  },
  HeadObjectCommand: class MockHeadObjectCommand {
    constructor(public input: any) {}
  },
}));

// Import after mocks are set up
import { validateAssetExists, resetS3Client } from "../../../lib/s3/validate-asset";

describe("S3 Asset Validation - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockReset();
    resetS3Client();
    vi.stubEnv("S3_BUCKET", "test-bucket");
    vi.stubEnv("S3_REGION", "us-east-1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /**
   * Property 8: S3 Asset Validation - Existing assets
   */
  it("should return exists: true for valid asset keys when S3 returns success", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.integer({ min: 1, max: 10000 }),
          timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
          extension: fc.constantFrom(".mp4", ".mov", ".webm"),
        }),
        fc.record({
          contentType: fc.constantFrom("video/mp4", "video/quicktime", "video/webm"),
          contentLength: fc.integer({ min: 1000, max: 500 * 1024 * 1024 }),
        }),
        async (keyData, metadata) => {
          resetS3Client();
          const assetKey = `uploads/${keyData.userId}/${keyData.timestamp}-abc123${keyData.extension}`;

          mockSend.mockResolvedValue({
            ContentType: metadata.contentType,
            ContentLength: metadata.contentLength,
          });

          const result = await validateAssetExists(assetKey);

          expect(result.exists).toBe(true);
          expect(result.contentType).toBe(metadata.contentType);
          expect(result.contentLength).toBe(metadata.contentLength);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Non-existent assets return exists: false
   */
  it("should return exists: false when S3 returns NotFound", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (assetKey) => {
          resetS3Client();
          const notFoundError = new Error("Not Found");
          (notFoundError as any).name = "NotFound";
          (notFoundError as any).$metadata = { httpStatusCode: 404 };
          mockSend.mockRejectedValue(notFoundError);

          const result = await validateAssetExists(assetKey);

          expect(result.exists).toBe(false);
          expect(result.error).toContain("not found");
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Access denied returns exists: false
   */
  it("should return exists: false with access denied error", async () => {
    resetS3Client();
    const accessDeniedError = new Error("Access Denied");
    (accessDeniedError as any).name = "AccessDenied";
    (accessDeniedError as any).$metadata = { httpStatusCode: 403 };
    mockSend.mockRejectedValue(accessDeniedError);

    const result = await validateAssetExists("test-key");

    expect(result.exists).toBe(false);
    expect(result.error).toContain("Access denied");
  });

  /**
   * Property: Empty asset key returns exists: false
   */
  it("should return exists: false for empty asset key", async () => {
    const result = await validateAssetExists("");

    expect(result.exists).toBe(false);
    expect(result.error).toContain("required");
  });

  /**
   * Property: Missing S3 bucket returns exists: false
   */
  it("should return exists: false when S3 bucket is not configured", async () => {
    vi.stubEnv("S3_BUCKET", "");
    resetS3Client();

    const result = await validateAssetExists("some-asset-key");

    expect(result.exists).toBe(false);
    expect(result.error).toContain("bucket not configured");
  });

  /**
   * Property: Generic S3 errors return exists: false
   */
  it("should return exists: false for generic S3 errors", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (assetKey, errorMessage) => {
          resetS3Client();
          mockSend.mockRejectedValue(new Error(errorMessage));

          const result = await validateAssetExists(assetKey);

          expect(result.exists).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test: S3 send is called for valid requests
   */
  it("should call S3 send for valid asset key", async () => {
    resetS3Client();
    mockSend.mockResolvedValue({
      ContentType: "video/mp4",
      ContentLength: 1024,
    });

    await validateAssetExists("uploads/123/test-video.mp4");

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
