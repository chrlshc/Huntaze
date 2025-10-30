# ============================================================================
# AWS Security Services - GuardDuty, Security Hub, CloudTrail
# ============================================================================
# Enables threat detection, compliance monitoring, and audit logging
# ============================================================================

# ============================================================================
# GuardDuty - Threat Detection
# ============================================================================

resource "aws_guardduty_detector" "main" {
  enable = true

  # Enable S3 protection
  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false # Set to true if using EKS
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  # Enable findings export to S3
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = {
    Name        = "huntaze-guardduty"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Threat detection"
  }
}

# SNS topic for GuardDuty findings
resource "aws_sns_topic" "guardduty_findings" {
  name              = "huntaze-guardduty-findings"
  display_name      = "Huntaze GuardDuty Findings"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name        = "huntaze-guardduty-findings"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "GuardDuty alerts"
  }
}

# SNS topic policy for EventBridge
resource "aws_sns_topic_policy" "guardduty_findings" {
  arn = aws_sns_topic.guardduty_findings.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.guardduty_findings.arn
      }
    ]
  })
}

# Email subscription for GuardDuty findings
resource "aws_sns_topic_subscription" "guardduty_email" {
  topic_arn = aws_sns_topic.guardduty_findings.arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

# EventBridge rule for high/critical GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "huntaze-guardduty-high-critical-findings"
  description = "Capture high and critical severity GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [
        { numeric = [">=", 7] } # High (7.0-8.9) and Critical (9.0-10.0)
      ]
    }
  })

  tags = {
    Name        = "huntaze-guardduty-findings-rule"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# EventBridge target to SNS
resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.guardduty_findings.arn
}

# ============================================================================
# Security Hub - Compliance Monitoring
# ============================================================================

resource "aws_securityhub_account" "main" {
  enable_default_standards = false # We'll enable specific standards
  control_finding_generator = "SECURITY_CONTROL"
  auto_enable_controls      = true
}

# Enable AWS Foundational Security Best Practices standard
resource "aws_securityhub_standards_subscription" "fsbp" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/aws-foundational-security-best-practices/v/1.0.0"
}

# SNS topic for Security Hub findings
resource "aws_sns_topic" "securityhub_findings" {
  name              = "huntaze-securityhub-findings"
  display_name      = "Huntaze Security Hub Findings"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name        = "huntaze-securityhub-findings"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Security Hub compliance alerts"
  }
}

# SNS topic policy for EventBridge
resource "aws_sns_topic_policy" "securityhub_findings" {
  arn = aws_sns_topic.securityhub_findings.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.securityhub_findings.arn
      }
    ]
  })
}

# Email subscription for Security Hub findings
resource "aws_sns_topic_subscription" "securityhub_email" {
  topic_arn = aws_sns_topic.securityhub_findings.arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

# EventBridge rule for Security Hub compliance failures
resource "aws_cloudwatch_event_rule" "securityhub_findings" {
  name        = "huntaze-securityhub-failed-findings"
  description = "Capture failed Security Hub compliance findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Compliance = {
          Status = ["FAILED"]
        }
        Severity = {
          Label = ["HIGH", "CRITICAL"]
        }
      }
    }
  })

  tags = {
    Name        = "huntaze-securityhub-findings-rule"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# EventBridge target to SNS
resource "aws_cloudwatch_event_target" "securityhub_sns" {
  rule      = aws_cloudwatch_event_rule.securityhub_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.securityhub_findings.arn
}

# ============================================================================
# CloudTrail - Multi-Region Audit Logging
# ============================================================================

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "huntaze-cloudtrail-logs-${var.aws_account_id}"

  tags = {
    Name        = "huntaze-cloudtrail-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "CloudTrail audit logs"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail_encryption.arn
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy to transition old logs to Glacier
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555 # 7 years retention for compliance
    }
  }
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# KMS key for CloudTrail encryption
resource "aws_kms_key" "cloudtrail_encryption" {
  description             = "Huntaze CloudTrail encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${var.aws_account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "kms:DescribeKey"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "huntaze-cloudtrail-encryption"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "CloudTrail log encryption"
  }
}

resource "aws_kms_alias" "cloudtrail_encryption" {
  name          = "alias/huntaze-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail_encryption.key_id
}

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/huntaze-production"
  retention_in_days = 90

  tags = {
    Name        = "huntaze-cloudtrail-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "CloudTrail log aggregation"
  }
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "huntaze-cloudtrail-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "huntaze-cloudtrail-cloudwatch-role"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# IAM policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "huntaze-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# CloudTrail multi-region trail
resource "aws_cloudtrail" "main" {
  name                          = "huntaze-production-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail_encryption.arn

  # CloudWatch Logs integration
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  # Advanced event selectors for better filtering
  advanced_event_selector {
    name = "Log all management events"
    field_selector {
      field  = "eventCategory"
      equals = ["Management"]
    }
  }

  advanced_event_selector {
    name = "Log S3 write events"
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
    field_selector {
      field  = "resources.type"
      equals = ["AWS::S3::Object"]
    }
    field_selector {
      field  = "readOnly"
      equals = ["false"]
    }
  }

  tags = {
    Name        = "huntaze-production-trail"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Multi-region audit logging"
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs,
    aws_iam_role_policy.cloudtrail_cloudwatch
  ]
}

# KMS key for SNS encryption (shared by GuardDuty and Security Hub)
resource "aws_kms_key" "sns_encryption" {
  description             = "Huntaze SNS encryption key for security alerts"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EventBridge to use the key"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "huntaze-sns-security-alerts-encryption"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "SNS encryption for security alerts"
  }
}

resource "aws_kms_alias" "sns_encryption" {
  name          = "alias/huntaze-sns-security-alerts"
  target_key_id = aws_kms_key.sns_encryption.key_id
}
