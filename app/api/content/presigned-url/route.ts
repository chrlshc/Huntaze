/**
 * Presigned URL API Endpoint
 *
 * Generates S3 presigned URLs for video uploads.
 *
 * Requirements: 7.1, 7.3
 */

import { withAuth, AuthenticatedRequest } from "@/lib/api/middleware/auth";
import { successResponseWithStatus, badRequest, internalServerError } from "@/lib/api/utils/response";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { makeReqLogger } from "@/lib/logger";

const logger = makeReqLogger({ service: "presigned-url-api" });

// Allowed content types for video uploads
const ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
  "video/x-m4v",
];

// Maximum file size: 500 MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Presigned URL expiration: 15 minutes
const URL_EXPIRATION_SECONDS = 15 * 60;

// Lazy S3 client initialization
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
    });
  }
  return s3Client;
}

interface PresignedUrlRequest {
  contentType: string;
  fileSize: number;
  fileName?: string;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  switch (contentType) {
    case "video/mp4":
      return ".mp4";
    case "video/quicktime":
      return ".mov";
    case "video/webm":
      return ".webm";
    case "video/x-m4v":
      return ".m4v";
    default:
      return ".mp4";
  }
}

/**
 * POST /api/content/presigned-url
 *
 * Generate a presigned URL for S3 upload.
 *
 * Request body:
 * - contentType: MIME type of the file (required)
 * - fileSize: Size of the file in bytes (required)
 * - fileName: Original file name (optional, for reference)
 *
 * Response:
 * - uploadUrl: Presigned URL to PUT the file
 * - assetKey: S3 key to reference the uploaded file
 * - expiresIn: Seconds until URL expires
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const requestId = generateId();
  const userId = req.user.id;

  try {
    // Parse request body
    let body: PresignedUrlRequest;
    try {
      body = await req.json();
    } catch {
      logger.warn("presigned_url_invalid_json", { requestId, userId });
      return badRequest("Invalid JSON body");
    }

    const { contentType, fileSize, fileName } = body;

    // Validate content type
    if (!contentType) {
      return badRequest("contentType is required");
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      logger.warn("presigned_url_invalid_content_type", {
        requestId,
        userId,
        contentType,
        allowed: ALLOWED_CONTENT_TYPES,
      });
      return badRequest(
        `Invalid content type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (!fileSize || typeof fileSize !== "number") {
      return badRequest("fileSize is required and must be a number");
    }

    if (fileSize <= 0) {
      return badRequest("fileSize must be greater than 0");
    }

    if (fileSize > MAX_FILE_SIZE) {
      logger.warn("presigned_url_file_too_large", {
        requestId,
        userId,
        fileSize,
        maxSize: MAX_FILE_SIZE,
      });
      return badRequest(
        `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024} MB)`
      );
    }

    // Generate unique asset key
    const extension = getExtensionFromContentType(contentType);
    const timestamp = Date.now();
    const assetKey = `uploads/${userId}/${timestamp}-${generateId()}${extension}`;

    logger.info("presigned_url_generating", {
      requestId,
      userId,
      contentType,
      fileSize,
      fileName,
      assetKey,
    });

    // Generate presigned URL
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      logger.error("presigned_url_no_bucket", { requestId });
      return internalServerError("S3 bucket not configured");
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: assetKey,
      ContentType: contentType,
      ContentLength: fileSize,
      Metadata: {
        "user-id": String(userId),
        "original-filename": fileName || "unknown",
        "upload-timestamp": timestamp.toString(),
      },
    });

    const uploadUrl = await getSignedUrl(getS3Client(), command, {
      expiresIn: URL_EXPIRATION_SECONDS,
    });

    logger.info("presigned_url_generated", {
      requestId,
      userId,
      assetKey,
      expiresIn: URL_EXPIRATION_SECONDS,
    });

    return successResponseWithStatus({
      uploadUrl,
      assetKey,
      expiresIn: URL_EXPIRATION_SECONDS,
    }, 200);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("presigned_url_error", {
      requestId,
      userId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return internalServerError("Failed to generate presigned URL");
  }
});
