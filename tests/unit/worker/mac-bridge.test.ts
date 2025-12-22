import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Message } from "@aws-sdk/client-sqs";
import { PrismaClient, ContentTaskStatus } from "@prisma/client";
import {
  parseMessage,
  handlePostContent,
  __resetClients,
} from "../../../worker/mac-bridge";

// Create mock Prisma instance
const mockPrismaInstance = {
  contentTask: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $disconnect: vi.fn(),
};

// Mock Prisma
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: vi.fn(function () {
      return mockPrismaInstance;
    }),
    ContentTaskStatus: {
      PENDING: "PENDING",
      PROCESSING: "PROCESSING",
      POSTED: "POSTED",
      FAILED: "FAILED",
    },
  };
});

// Mock logger
vi.mock("../../../lib/logger", () => ({
  makeReqLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("Worker Mac Bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetClients();

    // Reset mock functions
    mockPrismaInstance.contentTask.findUnique.mockReset();
    mockPrismaInstance.contentTask.update.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("parseMessage", () => {
    it("should parse valid SQS message", () => {
      const message: Message = {
        MessageId: "msg-123",
        Body: JSON.stringify({
          type: "POST_CONTENT",
          taskId: "task-456",
        }),
      };

      const result = parseMessage(message);

      expect(result).toEqual({
        type: "POST_CONTENT",
        taskId: "task-456",
      });
    });

    it("should return null for message without body", () => {
      const message: Message = {
        MessageId: "msg-123",
      };

      const result = parseMessage(message);

      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      const message: Message = {
        MessageId: "msg-123",
        Body: "invalid json {",
      };

      const result = parseMessage(message);

      expect(result).toBeNull();
    });

    it("should return null for message missing type", () => {
      const message: Message = {
        MessageId: "msg-123",
        Body: JSON.stringify({
          taskId: "task-456",
        }),
      };

      const result = parseMessage(message);

      expect(result).toBeNull();
    });

    it("should return null for message missing taskId", () => {
      const message: Message = {
        MessageId: "msg-123",
        Body: JSON.stringify({
          type: "POST_CONTENT",
        }),
      };

      const result = parseMessage(message);

      expect(result).toBeNull();
    });
  });

  describe("handlePostContent", () => {
    it("should skip task if already POSTED (idempotence)", async () => {
      const taskId = "task-123";

      mockPrismaInstance.contentTask.findUnique.mockResolvedValue({
        id: taskId,
        status: ContentTaskStatus.POSTED,
        externalPostId: "ext-789",
        postedAt: new Date(),
      });

      await handlePostContent(taskId);

      // Should not update the task
      expect(mockPrismaInstance.contentTask.update).not.toHaveBeenCalled();
    });

    it("should update status to PROCESSING and increment attemptCount", async () => {
      const taskId = "task-123";

      mockPrismaInstance.contentTask.findUnique.mockResolvedValue({
        id: taskId,
        status: ContentTaskStatus.PENDING,
        platform: "TIKTOK",
        attemptCount: 0,
      });

      // Mock the update to throw error (since posting is not implemented)
      mockPrismaInstance.contentTask.update.mockResolvedValue({});

      try {
        await handlePostContent(taskId);
      } catch (error) {
        // Expected to fail since posting is not implemented
      }

      // Should have called update to set PROCESSING
      expect(mockPrismaInstance.contentTask.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: {
          status: ContentTaskStatus.PROCESSING,
          startedAt: expect.any(Date),
          attemptCount: { increment: 1 },
        },
      });
    });

    it("should update status to FAILED on error", async () => {
      const taskId = "task-123";

      mockPrismaInstance.contentTask.findUnique.mockResolvedValue({
        id: taskId,
        status: ContentTaskStatus.PENDING,
        platform: "TIKTOK",
        attemptCount: 0,
      });

      // First update (PROCESSING) succeeds
      mockPrismaInstance.contentTask.update.mockResolvedValueOnce({});

      // Second update (FAILED) succeeds
      mockPrismaInstance.contentTask.update.mockResolvedValueOnce({});

      try {
        await handlePostContent(taskId);
      } catch (error) {
        // Expected to fail since posting is not implemented
      }

      // Should have called update twice: PROCESSING then FAILED
      expect(mockPrismaInstance.contentTask.update).toHaveBeenCalledTimes(2);

      // Check the FAILED update
      const failedUpdate = mockPrismaInstance.contentTask.update.mock.calls[1][0];
      expect(failedUpdate.data.status).toBe(ContentTaskStatus.FAILED);
      expect(failedUpdate.data.errorMessage).toContain(
        "TikTok posting not yet implemented"
      );
      expect(failedUpdate.data.errorMessage).toContain("Stack trace:");
    });

    it("should throw error if task not found", async () => {
      const taskId = "task-nonexistent";

      mockPrismaInstance.contentTask.findUnique.mockResolvedValue(null);

      await expect(handlePostContent(taskId)).rejects.toThrow(
        "ContentTask task-nonexistent not found in database"
      );
    });

    it("should handle database connection errors", async () => {
      const taskId = "task-123";

      mockPrismaInstance.contentTask.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(handlePostContent(taskId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should include stack trace in error message", async () => {
      const taskId = "task-123";

      mockPrismaInstance.contentTask.findUnique.mockResolvedValue({
        id: taskId,
        status: ContentTaskStatus.PENDING,
        platform: "INSTAGRAM",
        attemptCount: 0,
      });

      // First update (PROCESSING) succeeds
      mockPrismaInstance.contentTask.update.mockResolvedValueOnce({});

      // Second update (FAILED) succeeds
      mockPrismaInstance.contentTask.update.mockResolvedValueOnce({});

      try {
        await handlePostContent(taskId);
      } catch (error) {
        // Expected to fail
      }

      // Check that error message includes stack trace
      const failedUpdate = mockPrismaInstance.contentTask.update.mock.calls[1][0];
      expect(failedUpdate.data.errorMessage).toContain("Stack trace:");
      expect(failedUpdate.data.errorMessage).toContain(
        "Instagram posting not yet implemented"
      );
    });

    it("should handle unsupported platform", async () => {
      const taskId = "task-123";

      mockPrismaInstance.contentTask.findUnique.mockResolvedValue({
        id: taskId,
        status: ContentTaskStatus.PENDING,
        platform: "YOUTUBE", // Unsupported
        attemptCount: 0,
      });

      // First update (PROCESSING) succeeds
      mockPrismaInstance.contentTask.update.mockResolvedValueOnce({});

      // Second update (FAILED) succeeds
      mockPrismaInstance.contentTask.update.mockResolvedValueOnce({});

      try {
        await handlePostContent(taskId);
      } catch (error) {
        // Expected to fail
      }

      // Check that error message mentions unsupported platform
      const failedUpdate = mockPrismaInstance.contentTask.update.mock.calls[1][0];
      expect(failedUpdate.data.errorMessage).toContain(
        "Unsupported platform: YOUTUBE"
      );
    });
  });
});
