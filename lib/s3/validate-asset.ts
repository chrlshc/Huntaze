/**
 * S3 Asset Validation
 *
 * Validates that an asset exists in S3 before creating a task.
 *
 * Requirements: 7.5
 */

import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { makeReqLogger } from "@/lib/logger";

const logger = makeReqLogger({ service: "s3-validation" });

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

export interface AssetValidationResult {
  exists: boolean;
  contentType?: string;
  contentLength?: number;
  error?: string;
}

/**
 * Validate that an asset exists in S3
 *
 * Uses HeadObjectCommand to check existence without downloading the file.
 *
 * @param assetKey - S3 key of the asset
 * @returns Validation result with existence status and metadata
 */
export async function validateAssetExists(
  assetKey: string
): Promise<AssetValidationResult> {
  const bucket = process.env.S3_BUCKET;

  if (!bucket) {
    logger.error("s3_validation_no_bucket", { assetKey });
    return {
      exists: false,
      error: "S3 bucket not configured",
    };
  }

  if (!assetKey) {
    return {
      exists: false,
      error: "Asset key is required",
    };
  }

  try {
    logger.info("s3_validation_start", { bucket, assetKey });

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: assetKey,
    });

    const response = await getS3Client().send(command);

    logger.info("s3_validation_success", {
      bucket,
      assetKey,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    });

    return {
      exists: true,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  } catch (error: any) {
    // Check if it's a "not found" error
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      logger.warn("s3_validation_not_found", { bucket, assetKey });
      return {
        exists: false,
        error: `Asset not found: ${assetKey}`,
      };
    }

    // Check for access denied
    if (error.name === "AccessDenied" || error.$metadata?.httpStatusCode === 403) {
      logger.error("s3_validation_access_denied", { bucket, assetKey });
      return {
        exists: false,
        error: "Access denied to S3 bucket",
      };
    }

    // Other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("s3_validation_error", {
      bucket,
      assetKey,
      error: errorMessage,
    });

    return {
      exists: false,
      error: `S3 validation failed: ${errorMessage}`,
    };
  }
}

/**
 * Reset S3 client (for testing)
 */
export function resetS3Client(): void {
  s3Client = null;
}
