import { ContentTask, SocialAccount } from "@prisma/client";
import { makeReqLogger } from "../../lib/logger";
import { externalFetch, externalFetchJson } from "../../lib/services/external/http";
import { ExternalServiceError } from "../../lib/services/external/errors";

const logger = makeReqLogger({ service: "tiktok-poster" });

const TIKTOK_API_BASE = "https://open.tiktokapis.com";
const INIT_PULL_URL = `${TIKTOK_API_BASE}/v2/post/publish/video/init/`;
const INIT_UPLOAD_URL = `${TIKTOK_API_BASE}/v2/post/publish/inbox/video/init/`;

// Default privacy level for posts
const DEFAULT_PRIVACY_LEVEL = "PUBLIC_TO_EVERYONE";

interface TikTokInitResponse {
  data?: {
    publish_id: string;
    upload_url?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id?: string;
  };
}

interface TikTokPublishResult {
  externalPostId: string;
}

function mapTikTokErrorCode(code?: string): ExternalServiceError["code"] {
  switch (code) {
    case "access_token_invalid":
      return "UNAUTHORIZED";
    case "scope_not_authorized":
      return "FORBIDDEN";
    case "rate_limit_exceeded":
      return "RATE_LIMIT";
    default:
      return "BAD_REQUEST";
  }
}

/**
 * Post content to TikTok via Content Posting API
 *
 * Supports two modes:
 * - PULL_FROM_URL: TikTok pulls video from a public URL
 * - FILE_UPLOAD: Upload video to TikTok's upload URL
 *
 * @param task - ContentTask to post
 * @param socialAccount - TikTok SocialAccount with tokens
 * @returns externalPostId (TikTok publish_id)
 */
export async function postToTikTok(
  task: ContentTask,
  socialAccount: SocialAccount
): Promise<string> {
  logger.info("tiktok_post_start", {
    taskId: task.id,
    userId: task.userId,
    platform: task.platform,
    sourceType: task.sourceType,
  });

  // Validate required fields
  if (!socialAccount.accessToken) {
    const error = "TikTok accessToken is missing";
    logger.error("tiktok_missing_token", {
      taskId: task.id,
      userId: task.userId,
    });
    throw new Error(error);
  }

  try {
    let result: TikTokPublishResult;

    // Determine upload method based on source type
    if (task.sourceUrl) {
      // Option A: PULL_FROM_URL - TikTok pulls from public URL
      result = await publishViaPullFromUrl(
        task,
        socialAccount.accessToken
      );
    } else if (task.assetKey) {
      // Option B: FILE_UPLOAD - Upload to TikTok
      result = await publishViaFileUpload(
        task,
        socialAccount.accessToken
      );
    } else {
      const error = "No video source available (sourceUrl or assetKey required)";
      logger.error("tiktok_no_video_source", {
        taskId: task.id,
        sourceType: task.sourceType,
      });
      throw new Error(error);
    }

    logger.info("tiktok_post_success", {
      taskId: task.id,
      publishId: result.externalPostId,
    });

    return result.externalPostId;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const stackTrace = error instanceof Error ? error.stack : undefined;

    logger.error("tiktok_post_failed", {
      taskId: task.id,
      error: errorMessage,
      stack: stackTrace,
    });

    throw error;
  }
}

/**
 * Option A: PULL_FROM_URL
 * POST /v2/post/publish/video/init/
 *
 * TikTok pulls the video from a public URL
 */
async function publishViaPullFromUrl(
  task: ContentTask,
  accessToken: string
): Promise<TikTokPublishResult> {
  const videoUrl = task.sourceUrl!;

  logger.info("tiktok_pull_from_url_start", {
    taskId: task.id,
    videoUrl,
  });

  const body = {
    post_info: {
      title: buildCaption(task),
      privacy_level: DEFAULT_PRIVACY_LEVEL,
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: videoUrl,
    },
  };

  let data: TikTokInitResponse;
  try {
    data = (await externalFetchJson(INIT_PULL_URL, {
      service: "tiktok",
      operation: "publish.pull.init",
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      timeoutMs: 15_000,
      retry: { maxRetries: 0, retryMethods: ["POST"] },
    })) as TikTokInitResponse;
  } catch (error) {
    logger.error("tiktok_pull_from_url_failed", {
      taskId: task.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }

  // Check for API error in response body
  if (data.error?.code) {
    const errorMsg = formatTikTokError(data.error);
    logger.error("tiktok_pull_from_url_api_error", {
      taskId: task.id,
      errorCode: data.error.code,
      errorMessage: data.error.message,
      logId: data.error.log_id,
    });
    throw new ExternalServiceError({
      service: "tiktok",
      code: mapTikTokErrorCode(data.error.code),
      retryable: data.error.code === "rate_limit_exceeded",
      message: errorMsg,
      details: { error: data.error },
    });
  }

  if (!data.data?.publish_id) {
    logger.error("tiktok_pull_from_url_no_publish_id", {
      taskId: task.id,
      response: data,
    });
    throw new ExternalServiceError({
      service: "tiktok",
      code: "INVALID_RESPONSE",
      retryable: false,
      message: "TikTok API did not return publish_id",
      details: { response: data },
    });
  }

  logger.info("tiktok_pull_from_url_success", {
    taskId: task.id,
    publishId: data.data.publish_id,
  });

  return { externalPostId: data.data.publish_id };
}

/**
 * Option B: FILE_UPLOAD
 * 1. POST /v2/post/publish/inbox/video/init/ to get upload_url
 * 2. Download video from S3 using assetKey
 * 3. PUT to upload_url with the file
 */
async function publishViaFileUpload(
  task: ContentTask,
  accessToken: string
): Promise<TikTokPublishResult> {
  const assetKey = task.assetKey!;

  logger.info("tiktok_file_upload_start", {
    taskId: task.id,
    assetKey,
  });

  // Step 1: Initialize upload to get upload_url
  const initBody = {
    post_info: {
      title: buildCaption(task),
      privacy_level: DEFAULT_PRIVACY_LEVEL,
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: 0, // Will be updated after fetching from S3
      chunk_size: 0, // Single chunk upload
      total_chunk_count: 1,
    },
  };

  let initData: TikTokInitResponse;
  try {
    initData = (await externalFetchJson(INIT_UPLOAD_URL, {
      service: "tiktok",
      operation: "publish.upload.init",
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(initBody),
      cache: "no-store",
      timeoutMs: 15_000,
      retry: { maxRetries: 0, retryMethods: ["POST"] },
    })) as TikTokInitResponse;
  } catch (error) {
    logger.error("tiktok_file_upload_init_failed", {
      taskId: task.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }

  // Check for API error in response body
  if (initData.error?.code) {
    const errorMsg = formatTikTokError(initData.error);
    logger.error("tiktok_file_upload_init_api_error", {
      taskId: task.id,
      errorCode: initData.error.code,
      errorMessage: initData.error.message,
      logId: initData.error.log_id,
    });
    throw new ExternalServiceError({
      service: "tiktok",
      code: mapTikTokErrorCode(initData.error.code),
      retryable: initData.error.code === "rate_limit_exceeded",
      message: errorMsg,
      details: { error: initData.error },
    });
  }

  if (!initData.data?.publish_id || !initData.data?.upload_url) {
    logger.error("tiktok_file_upload_init_invalid_response", {
      taskId: task.id,
      response: initData,
    });
    throw new ExternalServiceError({
      service: "tiktok",
      code: "INVALID_RESPONSE",
      retryable: false,
      message: "TikTok API did not return publish_id or upload_url for FILE_UPLOAD",
      details: { response: initData },
    });
  }

  const { publish_id, upload_url } = initData.data;

  logger.info("tiktok_file_upload_init_success", {
    taskId: task.id,
    publishId: publish_id,
    uploadUrl: upload_url.substring(0, 50) + "...",
  });

  // Step 2: Download video from S3
  const videoBuffer = await downloadFromS3(assetKey, task.id);

  logger.info("tiktok_file_upload_s3_downloaded", {
    taskId: task.id,
    assetKey,
    size: videoBuffer.length,
  });

  // Step 3: Upload video to TikTok
  const uploadResponse = await externalFetch(upload_url, {
    service: "tiktok",
    operation: "upload.put",
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": videoBuffer.length.toString(),
      "Content-Range": `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    body: videoBuffer,
    cache: "no-store",
    timeoutMs: 30_000,
    retry: { maxRetries: 0, retryMethods: [] },
    throwOnHttpError: false,
  });

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text();
    logger.error("tiktok_file_upload_put_failed", {
      taskId: task.id,
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      body: errorBody,
    });
    throw new ExternalServiceError({
      service: "tiktok",
      code: "UPSTREAM_5XX",
      retryable: false,
      status: uploadResponse.status,
      message: `TikTok upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
      details: { body: errorBody },
    });
  }

  logger.info("tiktok_file_upload_success", {
    taskId: task.id,
    publishId: publish_id,
  });

  return { externalPostId: publish_id };
}

/**
 * Download video from S3 using assetKey
 */
async function downloadFromS3(assetKey: string, taskId: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET || "huntaze-content";
  const region = process.env.S3_REGION || "us-east-1";
  const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${assetKey}`;

  logger.info("tiktok_s3_download_start", {
    taskId,
    assetKey,
    s3Url,
  });

  const response = await externalFetch(s3Url, {
    service: "s3",
    operation: "asset.download",
    method: "GET",
    cache: "no-store",
    timeoutMs: 30_000,
    retry: { maxRetries: 1, retryMethods: ["GET"] },
    throwOnHttpError: false,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("tiktok_s3_download_failed", {
      taskId,
      assetKey,
      status: response.status,
      statusText: response.statusText,
      body: errorBody.substring(0, 500),
    });
    throw new ExternalServiceError({
      service: "s3",
      code: "UPSTREAM_5XX",
      retryable: response.status >= 500,
      status: response.status,
      message: `Failed to download video from S3: ${response.status} ${response.statusText}`,
      details: { body: errorBody.substring(0, 500) },
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Build caption from task fields (hook, body, cta, or caption)
 */
function buildCaption(task: ContentTask): string {
  // If caption is provided, use it directly
  if (task.caption) {
    return task.caption;
  }

  // Otherwise, build from hook, body, cta
  const parts: string[] = [];

  if (task.hook) {
    parts.push(task.hook);
  }

  if (task.body) {
    parts.push(task.body);
  }

  if (task.cta) {
    parts.push(task.cta);
  }

  return parts.join("\n\n") || "";
}

/**
 * Format TikTok API error for detailed error message
 */
function formatTikTokError(error: {
  code: string;
  message: string;
  log_id?: string;
}): string {
  const parts = [`TikTok API error (${error.code}): ${error.message}`];

  if (error.log_id) {
    parts.push(`Log ID: ${error.log_id}`);
  }

  // Add user-friendly messages for common errors
  switch (error.code) {
    case "access_token_invalid":
      parts.push("Your TikTok access token is invalid or expired. Please reconnect your account.");
      break;
    case "scope_not_authorized":
      parts.push("Missing required permissions. Please reconnect with video.upload scope.");
      break;
    case "url_ownership_unverified":
      parts.push("Video URL ownership not verified. Please use a verified domain or FILE_UPLOAD mode.");
      break;
    case "rate_limit_exceeded":
      parts.push("Rate limit exceeded. Maximum 6 requests per minute.");
      break;
    case "spam_risk_too_many_pending_share":
      parts.push("Too many pending uploads. Maximum 5 pending uploads per 24 hours.");
      break;
    case "invalid_param":
      parts.push("Check that video meets TikTok requirements (3s-10min, MP4/WebM, <4GB).");
      break;
  }

  return parts.join(" | ");
}
