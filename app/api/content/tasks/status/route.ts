/**
 * Content Task Status API
 *
 * Provides task status monitoring for the content posting system.
 *
 * Requirements: 10.1, 10.2
 */

import { withAuth, AuthenticatedRequest } from "@/lib/api/middleware/auth";
import { successResponseWithStatus, badRequest } from "@/lib/api/utils/response";
import { getPrismaClient } from "@/lib/db-client";
import { ContentTaskStatus, ContentPlatform } from "@prisma/client";
import { makeReqLogger } from "@/lib/logger";

const logger = makeReqLogger({ service: "content-task-status-api" });

interface TaskStatusSummary {
  total: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  recentTasks: Array<{
    id: string;
    platform: string;
    status: string;
    createdAt: string;
    scheduledAt: string | null;
    postedAt: string | null;
    attemptCount: number;
    errorMessage: string | null;
  }>;
}

/**
 * GET /api/content/tasks/status
 *
 * Get summary of content task statuses for the authenticated user.
 *
 * Query params:
 * - limit: Number of recent tasks to return (default: 10, max: 50)
 * - platform: Filter by platform (TIKTOK, INSTAGRAM)
 * - status: Filter by status (PENDING, PROCESSING, POSTED, FAILED)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const userId = parseInt(req.user.id);
  const url = new URL(req.url);

  const limitParam = url.searchParams.get("limit");
  const platformParam = url.searchParams.get("platform");
  const statusParam = url.searchParams.get("status");

  const limit = Math.min(parseInt(limitParam || "10"), 50);

  logger.info("task_status_request", {
    userId,
    limit,
    platform: platformParam,
    status: statusParam,
  });

  const prisma = getPrismaClient();
  if (!prisma) {
    return badRequest("Database unavailable");
  }

  // Build where clause
  const where: any = { userId };

  if (platformParam) {
    if (!["TIKTOK", "INSTAGRAM"].includes(platformParam)) {
      return badRequest("Invalid platform. Must be TIKTOK or INSTAGRAM");
    }
    where.platform = platformParam as ContentPlatform;
  }

  if (statusParam) {
    if (!["PENDING", "PROCESSING", "POSTED", "FAILED", "CANCELLED"].includes(statusParam)) {
      return badRequest("Invalid status");
    }
    where.status = statusParam as ContentTaskStatus;
  }

  // Get task counts by status
  const statusCounts = await prisma.contentTask.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  const byStatus: Record<string, number> = {};
  for (const item of statusCounts) {
    byStatus[item.status] = item._count.status;
  }

  // Get task counts by platform
  const platformCounts = await prisma.contentTask.groupBy({
    by: ["platform"],
    where: { userId },
    _count: { platform: true },
  });

  const byPlatform: Record<string, number> = {};
  for (const item of platformCounts) {
    byPlatform[item.platform] = item._count.platform;
  }

  // Get total count
  const total = await prisma.contentTask.count({ where: { userId } });

  // Get recent tasks
  const recentTasks = await prisma.contentTask.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      platform: true,
      status: true,
      createdAt: true,
      scheduledAt: true,
      postedAt: true,
      attemptCount: true,
      errorMessage: true,
    },
  });

  const summary: TaskStatusSummary = {
    total,
    byStatus,
    byPlatform,
    recentTasks: recentTasks.map((task) => ({
      id: task.id,
      platform: task.platform,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      scheduledAt: task.scheduledAt?.toISOString() || null,
      postedAt: task.postedAt?.toISOString() || null,
      attemptCount: task.attemptCount,
      errorMessage: task.errorMessage,
    })),
  };

  logger.info("task_status_response", {
    userId,
    total: summary.total,
    statusCounts: summary.byStatus,
  });

  return successResponseWithStatus(summary, 200);
});
