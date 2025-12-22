import { ContentTask, SocialAccount, PrismaClient } from "@prisma/client";
import { makeReqLogger } from "../../lib/logger";
import { externalFetchJson } from "../../lib/services/external/http";
import { ExternalServiceError } from "../../lib/services/external/errors";

const logger = makeReqLogger({ service: "instagram-poster" });

const GRAPH_API_VERSION = process.env.IG_GRAPH_API_VERSION || "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Poll configuration
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 4000; // 4 seconds

interface InstagramContainerResponse {
  id: string;
}

interface InstagramContainerStatusResponse {
  status_code: string;
  status: string;
}

interface InstagramPublishResponse {
  id: string;
}

type GraphApiError = {
  message?: string;
  code?: number;
  type?: string;
  error_subcode?: number;
};

/**
 * Post content to Instagram via Graph API
 * 
 * Flow:
 * 1. Create IG Container (media_type=REELS)
 * 2. Poll container status until FINISHED
 * 3. Publish the container
 * 
 * @param task - ContentTask to post
 * @param socialAccount - Instagram SocialAccount with tokens
 * @returns externalPostId (Instagram media ID)
 */
export async function postToInstagram(
  task: ContentTask,
  socialAccount: SocialAccount
): Promise<string> {
  logger.info("instagram_post_start", {
    taskId: task.id,
    userId: task.userId,
    platform: task.platform,
  });

  // Validate required fields
  if (!socialAccount.pageAccessToken) {
    const error = "Instagram pageAccessToken is missing";
    logger.error("instagram_missing_token", {
      taskId: task.id,
      userId: task.userId,
    });
    throw new Error(error);
  }

  if (!socialAccount.platformUserId) {
    const error = "Instagram platformUserId (ig_user_id) is missing";
    logger.error("instagram_missing_user_id", {
      taskId: task.id,
      userId: task.userId,
    });
    throw new Error(error);
  }

  // Determine video URL
  const videoUrl = getVideoUrl(task);
  if (!videoUrl) {
    const error = "No video URL available (sourceUrl or assetKey required)";
    logger.error("instagram_no_video_url", {
      taskId: task.id,
      sourceType: task.sourceType,
    });
    throw new Error(error);
  }

  try {
    // Step 1: Create IG Container
    const containerId = await createIGContainer(
      socialAccount.platformUserId,
      socialAccount.pageAccessToken,
      videoUrl,
      task.caption || ""
    );

    logger.info("instagram_container_created", {
      taskId: task.id,
      containerId,
    });

    // Step 2: Poll container status until FINISHED
    await pollContainerStatus(
      containerId,
      socialAccount.pageAccessToken,
      task.id
    );

    logger.info("instagram_container_finished", {
      taskId: task.id,
      containerId,
    });

    // Step 3: Publish the container
    const mediaId = await publishContainer(
      socialAccount.platformUserId,
      socialAccount.pageAccessToken,
      containerId
    );

    logger.info("instagram_post_success", {
      taskId: task.id,
      mediaId,
      containerId,
    });

    return mediaId;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const stackTrace = error instanceof Error ? error.stack : undefined;

    logger.error("instagram_post_failed", {
      taskId: task.id,
      error: errorMessage,
      stack: stackTrace,
    });

    throw error;
  }
}

/**
 * Get video URL from task (sourceUrl or construct from assetKey)
 */
function getVideoUrl(task: ContentTask): string | null {
  if (task.sourceUrl) {
    return task.sourceUrl;
  }

  if (task.assetKey) {
    // Construct S3 public URL from assetKey
    const bucket = process.env.S3_BUCKET || "huntaze-content";
    const region = process.env.S3_REGION || "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/${task.assetKey}`;
  }

  return null;
}

/**
 * Step 1: Create Instagram Container
 * POST /{ig_user_id}/media
 */
async function createIGContainer(
  igUserId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<string> {
  const url = `${GRAPH_API_BASE}/${igUserId}/media`;

  const params = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption,
    access_token: accessToken,
  });

  logger.info("instagram_create_container_request", {
    igUserId,
    videoUrl,
    captionLength: caption.length,
  });

  const data = (await externalFetchJson(
    `${url}?${params.toString()}`,
    {
      service: "instagram",
      operation: "reels.create",
      method: "POST",
      cache: "no-store",
      timeoutMs: 15_000,
      retry: { maxRetries: 0, retryMethods: ["POST"] },
    }
  )) as InstagramContainerResponse & { error?: GraphApiError };

  if (data.error) {
    logger.error("instagram_create_container_failed", {
      error: data.error,
    });
    throw new ExternalServiceError({
      service: "instagram",
      code: data.error.code === 190 ? "UNAUTHORIZED" : "BAD_REQUEST",
      retryable: false,
      message: `Instagram API error (create container): ${data.error.message || "Unknown error"}`,
      details: { error: data.error },
    });
  }

  if (!data.id) {
    logger.error("instagram_create_container_no_id", { response: data });
    throw new ExternalServiceError({
      service: "instagram",
      code: "INVALID_RESPONSE",
      retryable: false,
      message: "Instagram API did not return container ID",
      details: { response: data },
    });
  }

  return data.id;
}

/**
 * Step 2: Poll container status until FINISHED
 * GET /{container_id}?fields=status_code,status
 */
async function pollContainerStatus(
  containerId: string,
  accessToken: string,
  taskId: string
): Promise<void> {
  const url = `${GRAPH_API_BASE}/${containerId}`;

  const params = new URLSearchParams({
    fields: "status_code,status",
    access_token: accessToken,
  });

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    logger.info("instagram_poll_status", {
      taskId,
      containerId,
      attempt,
      maxAttempts: MAX_POLL_ATTEMPTS,
    });

    const data = (await externalFetchJson(`${url}?${params.toString()}`, {
      service: "instagram",
      operation: "reels.status",
      method: "GET",
      cache: "no-store",
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ["GET"] },
    })) as InstagramContainerStatusResponse & { error?: GraphApiError };

    if (data.error) {
      logger.error("instagram_poll_status_failed", {
        taskId,
        containerId,
        attempt,
        error: data.error,
      });
      throw new ExternalServiceError({
        service: "instagram",
        code: data.error.code === 190 ? "UNAUTHORIZED" : "BAD_REQUEST",
        retryable: false,
        message: `Instagram API error (poll status): ${data.error.message || "Unknown error"}`,
        details: { error: data.error },
      });
    }

    logger.info("instagram_poll_status_response", {
      taskId,
      containerId,
      attempt,
      statusCode: data.status_code,
      status: data.status,
    });

    // Check if finished
    if (data.status === "FINISHED") {
      return;
    }

    // Check for error status
    if (data.status === "ERROR") {
      throw new ExternalServiceError({
        service: "instagram",
        code: "UPSTREAM_5XX",
        retryable: false,
        message: `Instagram container processing failed (status_code: ${data.status_code})`,
        details: { status: data.status, status_code: data.status_code },
      });
    }

    // Wait before next poll
    if (attempt < MAX_POLL_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  // Max attempts reached
  throw new Error(
    `Instagram container status polling timed out after ${MAX_POLL_ATTEMPTS} attempts (${
      (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000
    }s)`
  );
}

/**
 * Step 3: Publish the container
 * POST /{ig_user_id}/media_publish
 */
async function publishContainer(
  igUserId: string,
  accessToken: string,
  containerId: string
): Promise<string> {
  const url = `${GRAPH_API_BASE}/${igUserId}/media_publish`;

  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  logger.info("instagram_publish_request", {
    igUserId,
    containerId,
  });

  const data = (await externalFetchJson(`${url}?${params.toString()}`, {
    service: "instagram",
    operation: "reels.publish",
    method: "POST",
    cache: "no-store",
    timeoutMs: 15_000,
    retry: { maxRetries: 0, retryMethods: ["POST"] },
  })) as InstagramPublishResponse & { error?: GraphApiError };

  if (data.error) {
    logger.error("instagram_publish_failed", {
      igUserId,
      containerId,
      error: data.error,
    });
    throw new ExternalServiceError({
      service: "instagram",
      code: data.error.code === 190 ? "UNAUTHORIZED" : "BAD_REQUEST",
      retryable: false,
      message: `Instagram API error (publish): ${data.error.message || "Unknown error"}`,
      details: { error: data.error },
    });
  }

  if (!data.id) {
    logger.error("instagram_publish_no_id", { response: data });
    throw new ExternalServiceError({
      service: "instagram",
      code: "INVALID_RESPONSE",
      retryable: false,
      message: "Instagram API did not return media ID",
      details: { response: data },
    });
  }

  return data.id;
}
