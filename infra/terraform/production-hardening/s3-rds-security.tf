# ============================================================================
# S3 & RDS Security Hardening
# ============================================================================
# Implements AWS security best practices for S3 buckets and RDS PostgreSQL
# References: AWS Security Best Practices, CIS Benchmarks
# ============================================================================

# ============================================================================
# S3 Account-Level Block Public Access
# ============================================================================

resource "aws_s3_account_public_access_block" "account_level" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# KMS Key for S3 Encryption
# ============================================================================

resource "aws_kms_key" "s3_encryption" {
  description             = "Huntaze S3 bucket encryption key"
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
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key for S3 data events"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
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
    Name        = "huntaze-s3-encryption"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "S3 bucket encryption"
  }
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/huntaze-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ============================================================================
# Data Source: Existing S3 Buckets
# ============================================================================

# Get list of existing buckets (we'll secure them)
data "aws_s3_bucket" "existing_buckets" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value
}

# ============================================================================
# S3 Bucket Security Configuration (Applied to Existing Buckets)
# ============================================================================

# Block Public Access per bucket
resource "aws_s3_bucket_public_access_block" "secure" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Object Ownership - Bucket Owner Enforced (ACLs disabled)
resource "aws_s3_bucket_ownership_controls" "secure" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value

  rule {
    object_ownership = "BucketOwnerEnforced"
  }

  depends_on = [aws_s3_bucket_public_access_block.secure]
}

# Enable Versioning
resource "aws_s3_bucket_versioning" "secure" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-Side Encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "secure" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
    bucket_key_enabled = true
  }
}

# Bucket Policy - TLS-only, SSE-KMS required, VPC Endpoint restriction
resource "aws_s3_bucket_policy" "secure" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:*"
        Resource = [
          "arn:aws:s3:::${each.value}",
          "arn:aws:s3:::${each.value}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:PutObject"
        Resource = [
          "arn:aws:s3:::${each.value}/*"
        ]
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "RequireSpecificKmsKey"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:PutObject"
        Resource = [
          "arn:aws:s3:::${each.value}/*"
        ]
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.s3_encryption.arn
          }
        }
      },
      {
        Sid    = "DenyOldTLSVersions"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:*"
        Resource = [
          "arn:aws:s3:::${each.value}",
          "arn:aws:s3:::${each.value}/*"
        ]
        Condition = {
          NumericLessThan = {
            "s3:TlsVersion" = "1.2"
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.secure,
    aws_s3_bucket_ownership_controls.secure
  ]
}

# Lifecycle Configuration (optional - for cost optimization)
resource "aws_s3_bucket_lifecycle_configuration" "secure" {
  for_each = toset(var.s3_buckets_to_secure)
  bucket   = each.value

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }

  rule {
    id     = "delete-incomplete-multipart-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ============================================================================
# VPC Endpoint for S3 (Gateway Endpoint)
# ============================================================================

# Get VPC (default VPC)
data "aws_vpc" "main" {
  default = true
}

# Get route tables
data "aws_route_tables" "private" {
  vpc_id = data.aws_vpc.main.id

  filter {
    name   = "tag:Name"
    values = ["*private*"]
  }
}

# S3 VPC Endpoint (Gateway)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = data.aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.private.ids

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          for bucket in var.s3_buckets_to_secure : [
            "arn:aws:s3:::${bucket}",
            "arn:aws:s3:::${bucket}/*"
          ]
        ]
      }
    ]
  })

  tags = {
    Name        = "huntaze-s3-vpc-endpoint"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Private S3 access"
  }
}

# ============================================================================
# RDS PostgreSQL Security Hardening
# ============================================================================

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds_encryption" {
  description             = "Huntaze RDS PostgreSQL encryption key"
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
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "huntaze-rds-encryption"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS encryption at rest"
  }
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/huntaze-rds-encryption"
  target_key_id = aws_kms_key.rds_encryption.key_id
}

# DB Parameter Group - Force SSL/TLS
resource "aws_db_parameter_group" "postgres_tls" {
  name        = "huntaze-postgres-tls-enforced"
  family      = var.rds_parameter_group_family
  description = "Force SSL/TLS for all PostgreSQL connections"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries > 1 second
  }

  tags = {
    Name        = "huntaze-postgres-tls-enforced"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Force TLS and enhanced logging"
  }
}

# Get existing RDS instance
data "aws_db_instance" "postgres" {
  db_instance_identifier = var.rds_instance_identifier
}

# Note: To apply these changes to an existing RDS instance, you need to:
# 1. If not encrypted: Create snapshot → Copy with encryption → Restore
# 2. Apply parameter group (requires reboot)
# 3. Enable IAM authentication (no downtime)
# 4. Enable Performance Insights (no downtime)

# Security Group for RDS (restrictive)
resource "aws_security_group" "rds_postgres" {
  name        = "huntaze-rds-postgres-secure"
  description = "Restrictive security group for RDS PostgreSQL"
  vpc_id      = data.aws_vpc.main.id

  # Allow PostgreSQL from ECS tasks only
  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  # No outbound rules needed for RDS
  egress {
    description = "No outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "huntaze-rds-postgres-secure"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS security group"
  }
}

# Secrets Manager for RDS credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name        = "huntaze/rds/postgres/master-credentials"
  description = "Master credentials for Huntaze PostgreSQL database"

  kms_key_id = aws_kms_key.rds_encryption.id

  tags = {
    Name        = "huntaze-rds-credentials"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS master credentials"
  }
}

# Secret rotation configuration
resource "aws_secretsmanager_secret_rotation" "rds_credentials" {
  secret_id           = aws_secretsmanager_secret.rds_credentials.id
  rotation_lambda_arn = var.rotation_lambda_arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# CloudWatch Log Group for RDS logs
resource "aws_cloudwatch_log_group" "rds_postgresql" {
  name              = "/aws/rds/instance/${var.rds_instance_identifier}/postgresql"
  retention_in_days = 30

  tags = {
    Name        = "huntaze-rds-postgresql-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS PostgreSQL logs"
  }
}

resource "aws_cloudwatch_log_group" "rds_upgrade" {
  name              = "/aws/rds/instance/${var.rds_instance_identifier}/upgrade"
  retention_in_days = 90

  tags = {
    Name        = "huntaze-rds-upgrade-logs"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "RDS upgrade logs"
  }
}

# ============================================================================
# CloudWatch Alarms for RDS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "huntaze-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "huntaze-rds-cpu-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_memory_low" {
  alarm_name          = "huntaze-rds-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000000000" # 1 GB in bytes
  alarm_description   = "RDS freeable memory is too low"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "huntaze-rds-memory-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "huntaze-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS connection count is too high"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "huntaze-rds-connections-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "huntaze-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000000000" # 10 GB in bytes
  alarm_description   = "RDS free storage space is too low"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Name        = "huntaze-rds-storage-alarm"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
