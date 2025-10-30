# ============================================================================
# AWS Config Conformance Pack - CIS AWS Foundations
# ============================================================================
# Deploys CIS AWS Foundations Benchmark conformance pack
# Provides automated compliance checking against CIS best practices
# ============================================================================

# ============================================================================
# AWS Config Configuration Recorder
# ============================================================================

resource "aws_config_configuration_recorder" "main" {
  name     = "huntaze-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "huntaze-config-delivery"
  s3_bucket_name = aws_s3_bucket.config_bucket.id
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  
  depends_on = [aws_config_delivery_channel.main]
}

# ============================================================================
# S3 Bucket for Config
# ============================================================================

resource "aws_s3_bucket" "config_bucket" {
  bucket = "huntaze-aws-config-${var.aws_account_id}"

  tags = {
    Name        = "huntaze-aws-config"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "AWS Config delivery"
  }
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketPutObject"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ============================================================================
# IAM Role for Config
# ============================================================================

resource "aws_iam_role" "config_role" {
  name = "huntaze-aws-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "huntaze-aws-config-role"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
        ]
      }
    ]
  })
}

# ============================================================================
# CIS AWS Foundations Conformance Pack
# ============================================================================
# Note: Commented out - requires conformance pack YAML file
# Can be enabled later by creating the conformance-packs directory with the YAML file

# resource "aws_config_conformance_pack" "cis_aws_foundations" {
#   name = "Operational-Best-Practices-for-CIS-AWS-v1-4-0"
#
#   template_body = file("${path.module}/conformance-packs/cis-aws-foundations-v1.4.0.yaml")
#
#   depends_on = [
#     aws_config_configuration_recorder_status.main
#   ]
# }

# ============================================================================
# Outputs
# ============================================================================

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = aws_config_configuration_recorder.main.name
}

output "config_bucket_name" {
  description = "S3 bucket for AWS Config"
  value       = aws_s3_bucket.config_bucket.id
}

# output "conformance_pack_name" {
#   description = "CIS conformance pack name"
#   value       = aws_config_conformance_pack.cis_aws_foundations.name
# }
