# ============================================================================
# S3 Intelligent-Tiering - Cost Optimization
# ============================================================================
# Automatically moves objects between access tiers based on usage patterns
# No retrieval fees, small monitoring fee per object
# References: AWS S3 Intelligent-Tiering
# ============================================================================

# ============================================================================
# Data Sources - Existing S3 Buckets
# ============================================================================

data "aws_s3_bucket" "huntaze_buckets" {
  for_each = toset(var.s3_buckets_for_tiering)
  bucket   = each.value
}

# ============================================================================
# S3 Intelligent-Tiering Configuration
# ============================================================================

resource "aws_s3_bucket_intelligent_tiering_configuration" "this" {
  for_each = toset(var.s3_buckets_for_tiering)
  
  bucket = each.value
  name   = "EntireBucket"

  status = "Enabled"

  # Frequent Access Tier (default, 0 days)
  # Infrequent Access Tier (30 days)
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }

  # Deep Archive Access Tier (180 days)
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

# ============================================================================
# S3 Lifecycle Rules for Intelligent-Tiering
# ============================================================================

resource "aws_s3_bucket_lifecycle_configuration" "intelligent_tiering" {
  for_each = toset(var.s3_buckets_for_tiering)
  
  bucket = each.value

  rule {
    id     = "intelligent-tiering-transition"
    status = "Enabled"

    # Transition to Intelligent-Tiering immediately
    transition {
      days          = 0
      storage_class = "INTELLIGENT_TIERING"
    }

    # Optional: Delete old versions after 90 days
    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    # Optional: Delete incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Rule for old logs/temporary files
  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    expiration {
      days = 90
    }
  }
}

# ============================================================================
# S3 Storage Lens for Cost Visibility
# ============================================================================

resource "aws_s3control_storage_lens_configuration" "huntaze" {
  config_id = "huntaze-storage-lens"

  storage_lens_configuration {
    enabled = true

    account_level {
      bucket_level {
        activity_metrics {
          enabled = true
        }
        
        advanced_cost_optimization_metrics {
          enabled = true
        }
        
        advanced_data_protection_metrics {
          enabled = true
        }
      }
    }

    include {
      buckets = [for bucket in var.s3_buckets_for_tiering : "arn:aws:s3:::${bucket}"]
    }

    data_export {
      s3_bucket_destination {
        account_id      = var.aws_account_id
        arn             = "arn:aws:s3:::huntaze-storage-lens-reports"
        format          = "CSV"
        output_schema_version = "V_1"
        
        encryption {
          sse_s3 {}
        }
      }
    }
  }
}

# ============================================================================
# CloudWatch Dashboard for S3 Cost Optimization
# ============================================================================

resource "aws_cloudwatch_dashboard" "s3_cost_optimization" {
  dashboard_name = "Huntaze-S3-Cost-Optimization"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            for bucket in var.s3_buckets_for_tiering : [
              "AWS/S3", "BucketSizeBytes", 
              { stat = "Average", label = "${bucket} - Total Size" },
              { BucketName = bucket, StorageType = "AllStorageTypes" }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "S3 Bucket Sizes"
          period  = 86400  # Daily
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            for bucket in var.s3_buckets_for_tiering : [
              "AWS/S3", "NumberOfObjects",
              { stat = "Average", label = "${bucket} - Object Count" },
              { BucketName = bucket, StorageType = "AllStorageTypes" }
            ]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "S3 Object Counts"
          period  = 86400  # Daily
        }
      },
      {
        type = "log"
        properties = {
          query   = <<-EOT
            fields @timestamp, bucket, operation, key, storageClass
            | filter operation = "REST.PUT.OBJECT" or operation = "REST.COPY.OBJECT"
            | stats count() by storageClass
          EOT
          region  = var.aws_region
          title   = "Objects by Storage Class"
        }
      }
    ]
  })
}

# ============================================================================
# Outputs
# ============================================================================

output "intelligent_tiering_buckets" {
  description = "S3 buckets with Intelligent-Tiering enabled"
  value       = var.s3_buckets_for_tiering
}

output "estimated_s3_savings" {
  description = "Estimated monthly savings from Intelligent-Tiering"
  value       = "20-40% on infrequently accessed data"
}

output "storage_lens_config_id" {
  description = "S3 Storage Lens configuration ID"
  value       = aws_s3control_storage_lens_configuration.huntaze.config_id
}
