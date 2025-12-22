/**
 * Cancel Content Task API
 *
 * Allows users to cancel pending or scheduled tasks.
 *
 * Requirements: 9.5
 */

import { withAuth, AuthenticatedRequest } from "@/lib/api/middleware/auth";
import { successResponseWithStatus, badRequest, notFound } from "@/lib/api/utils/response";
import { getPrismaClient } from "@/lib/db-client";
import { ContentTaskStatus } from "@prisma/client";
import { makeReqLogger } from "@/lib/logger";

const logger = makeReqLogger({ service: "content-task-cancel-api" });

/**
 * POST /api/content/tasks/[id]/cancel
 *
 * Cancel a content task. Only PENDING and SCHEDULED tasks can be cancelled.
 */
export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  const userId = parseInt(req.user.id);
  const taskId = context.params.id;

  logger.info("task_cancel_request", { userId, taskId });

  const prisma = getPrismaClient();
  if (!prisma) {
    return badRequest("Database unavailable");
  }

  // Find the task
  const task = await prisma.contentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    logger.warn("task_cancel_not_found", { userId, taskId });
    return notFound("Task not found");
  }

  // Verify ownership
  if (task.userId !== userId) {
    logger.warn("task_cancel_unauthorized", { userId, taskId, taskUserId: task.userId });
    return notFound("Task not found");
  }

  // Check if task can be cancelled
  const cancellableStatuses: ContentTaskStatus[] = [
    ContentTaskStatus.PENDING,
  ];

  if (!cancellableStatuses.includes(task.status)) {
    logger.warn("task_cancel_invalid_status", {
      userId,
      taskId,
      currentStatus: task.status,
    });
    return badRequest(
      `Cannot cancel task with status ${task.status}. Only PENDING tasks can be cancelled.`
    );
  }

  // Update task status to CANCELLED
  const updatedTask = await prisma.contentTask.update({
    where: { id: taskId },
    data: {
      status: "CANCELLED" as ContentTaskStatus,
      errorMessage: "Cancelled by user",
      updatedAt: new Date(),
    },
  });

  logger.info("task_cancelled", {
    userId,
    taskId,
    previousStatus: task.status,
  });

  return successResponseWithStatus({
    id: updatedTask.id,
    status: updatedTask.status,
    message: "Task cancelled successfully",
  }, 200);
});
