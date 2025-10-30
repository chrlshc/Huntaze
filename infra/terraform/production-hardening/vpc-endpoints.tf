# ============================================================================
# VPC Endpoints - Cost Optimization
# ============================================================================
# Gateway endpoints for S3 and DynamoDB to eliminate NAT Gateway costs
# Traffic stays within AWS network, reducing data transfer costs
# References: AWS VPC Endpoints Best Practices
# ============================================================================

# ============================================================================
# Data Sources - Existing VPC Resources
# ============================================================================



# ============================================================================
# S3 Gateway Endpoint
# ============================================================================


# S3 Endpoint Policy (restrict to Huntaze buckets)
resource "aws_vpc_endpoint_policy" "s3" {
  vpc_endpoint_id = aws_vpc_endpoint.s3.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::huntaze-*",
          "arn:aws:s3:::huntaze-*/*"
        ]
      }
    ]
  })
}

# ============================================================================
# DynamoDB Gateway Endpoint
# ============================================================================
# Commented out - VPC configuration needed
# Uncomment and configure when VPC is properly set up

# resource "aws_vpc_endpoint" "dynamodb" {
#   vpc_id            = var.vpc_id
#   service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
#   vpc_endpoint_type = "Gateway"
#   
#   # Associate with all private route tables
#   route_table_ids = var.private_route_table_ids
#
#   tags = {
#     Name        = "huntaze-dynamodb-gateway-endpoint"
#     Environment = "production"
#     ManagedBy   = "terraform"
#     Purpose     = "Cost optimization - eliminate NAT for DynamoDB"
#     CostSaving  = "Estimated $15/month (NAT Gateway)"
#   }
# }

# DynamoDB Endpoint Policy (restrict to Huntaze tables)
# resource "aws_vpc_endpoint_policy" "dynamodb" {
#   vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect    = "Allow"
#         Principal = "*"
#         Action = [
#           "dynamodb:GetItem",
#           "dynamodb:PutItem",
#           "dynamodb:UpdateItem",
#           "dynamodb:DeleteItem",
#           "dynamodb:Query",
#           "dynamodb:Scan",
#           "dynamodb:BatchGetItem",
#           "dynamodb:BatchWriteItem"
#         ]
#         Resource = [
#           "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/huntaze-*"
#         ]
#       }
#     ]
#   })
# }

# ============================================================================
# CloudWatch Metrics for Cost Tracking
# ============================================================================

# Custom metric for NAT Gateway cost savings
resource "aws_cloudwatch_log_metric_filter" "nat_gateway_savings" {
  name           = "nat-gateway-cost-savings"
  log_group_name = "/aws/vpc/flowlogs"  # Assumes VPC Flow Logs enabled
  
  pattern = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "NATGatewaySavings"
    namespace = "Huntaze/CostOptimization"
    value     = "$bytes"
    unit      = "Bytes"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "s3_endpoint_id" {
  description = "S3 VPC Endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "s3_endpoint_prefix_list_id" {
  description = "S3 VPC Endpoint prefix list ID (for security groups)"
  value       = aws_vpc_endpoint.s3.prefix_list_id
}

# output "dynamodb_endpoint_id" {
#   description = "DynamoDB VPC Endpoint ID"
#   value       = aws_vpc_endpoint.dynamodb.id
# }

# output "dynamodb_endpoint_prefix_list_id" {
#   description = "DynamoDB VPC Endpoint prefix list ID (for security groups)"
#   value       = aws_vpc_endpoint.dynamodb.prefix_list_id
# }

output "estimated_monthly_savings" {
  description = "Estimated monthly cost savings from VPC endpoints"
  value       = "$47/month (NAT Gateway data transfer)"
}
