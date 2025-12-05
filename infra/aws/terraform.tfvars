# Huntaze AI Router - Terraform Variables
# Generated for AWS Account: 317805897534

aws_account_id     = "317805897534"
aws_region         = "us-east-2"
environment        = "production"

# VPC Configuration (Default VPC)
vpc_id             = "vpc-07769b343ae40a638"

# Subnets (all public in default VPC - will use for both ALB and ECS)
public_subnet_ids  = ["subnet-00b7422149f5745ab", "subnet-0e743017fa5ebadbb"]
private_subnet_ids = ["subnet-00b7422149f5745ab", "subnet-0e743017fa5ebadbb"]

# Certificate ARN - Optional (leave empty for HTTP only)
# To add HTTPS later: aws acm request-certificate --domain-name ai-router.huntaze.com --validation-method DNS --region us-east-2
certificate_arn    = ""
