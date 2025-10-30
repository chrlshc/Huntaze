# Deployment Instructions - Production Hardening Infrastructure

## ✅ Status: Ready to Deploy

All Terraform configuration files have been created and validated.

## 📋 What Was Created

### Terraform Files
- `main.tf` - Main infrastructure (SQS, DynamoDB, SNS, Budgets)
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `terraform.tfvars.example` - Example configuration
- `README.md` - Documentation

### Deployment Script
- `scripts/deploy-production-hardening.sh` - Automated deployment script

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
./scripts/deploy-production-hardening.sh
```

This script will:
1. Check prerequisites (Terraform, AWS CLI, credentials)
2. Verify AWS account (317805897534)
3. Initialize Terraform
4. Validate configuration
5. Show plan and ask for confirmation
6. Apply changes
7. Verify resources created
8. Display next steps

### Option 2: Manual Deployment

```bash
# 1. Navigate to Terraform directory
cd infra/terraform/production-hardening

# 2. Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars

# 3. Initialize Terraform
terraform init

# 4. Plan deployment
terraform plan

# 5. Apply deployment
terraform apply
```

## 📊 Resources to be Created

| Resource Type | Count | Names |
|---------------|-------|-------|
| **SQS Queues** | 4 | huntaze-hybrid-workflows.fifo<br>huntaze-hybrid-workflows-dlq.fifo<br>huntaze-rate-limiter-queue<br>huntaze-rate-limiter-queue-dlq |
| **DynamoDB Tables** | 2 | huntaze-ai-costs-production<br>huntaze-cost-alerts-production |
| **SNS Topics** | 1 | huntaze-cost-alerts |
| **AWS Budgets** | 1 | huntaze-monthly ($500/month) |

## 💰 Estimated Monthly Cost

- SQS (4 queues): ~$0.40
- DynamoDB (2 tables, on-demand): ~$1-2
- SNS (1 topic): ~$0.50
- AWS Budgets: $0.02
- **Total: ~$2-3/month**

## ✅ Validation

After deployment, verify resources:

```bash
# SQS Queues
aws sqs list-queues --region us-east-1 | grep huntaze

# DynamoDB Tables
aws dynamodb list-tables --region us-east-1 | grep huntaze

# SNS Topics
aws sns list-topics --region us-east-1 | grep huntaze

# Budgets
aws budgets describe-budgets --account-id 317805897534
```

## 🔔 Post-Deployment Steps

### 1. Subscribe to SNS Topic

```bash
# Get SNS topic ARN from Terraform output
SNS_ARN=$(terraform output -raw sns_cost_alerts_arn)

# Subscribe email
aws sns subscribe \
  --topic-arn $SNS_ARN \
  --protocol email \
  --notification-endpoint admin@huntaze.com

# Confirm subscription via email
```

### 2. Update Application Environment Variables

Add these to your ECS task definitions or `.env`:

```bash
# SQS
SQS_HYBRID_WORKFLOWS_URL="<from terraform output>"
SQS_RATE_LIMITER_URL="<from terraform output>"

# DynamoDB
DYNAMODB_AI_COSTS_TABLE="huntaze-ai-costs-production"
DYNAMODB_COST_ALERTS_TABLE="huntaze-cost-alerts-production"

# SNS
SNS_COST_ALERTS_ARN="<from terraform output>"
```

### 3. Test Resources

```bash
# Test SQS queue
aws sqs send-message \
  --queue-url <QUEUE_URL> \
  --message-body "Test message"

# Test DynamoDB table
aws dynamodb put-item \
  --table-name huntaze-ai-costs-production \
  --item '{"pk":{"S":"TEST"},"sk":{"S":"TEST"},"ttl":{"N":"'$(date -d '+1 day' +%s)'"}}'

# Test SNS topic
aws sns publish \
  --topic-arn <SNS_ARN> \
  --message "Test alert"
```

## 🔄 Rollback

If you need to destroy resources:

```bash
cd infra/terraform/production-hardening
terraform destroy
```

## 📝 Next Steps (Week 1)

After deploying this infrastructure, continue with:

1. **Day 3:** Migrate ElastiCache to encrypted cluster
2. **Day 4:** Enable GuardDuty, Security Hub, CloudTrail
3. **Day 5:** Enable Container Insights on ECS clusters

See `AWS_PRODUCTION_HARDENING_PLAN.md` for full timeline.

## 🆘 Troubleshooting

### Terraform Init Fails

```bash
# Clear Terraform cache
rm -rf .terraform .terraform.lock.hcl
terraform init
```

### AWS Credentials Error

```bash
# Verify credentials
aws sts get-caller-identity

# Verify account
aws sts get-caller-identity --query Account --output text
# Should output: 317805897534
```

### Budget Already Exists

```bash
# Delete existing budget
aws budgets delete-budget \
  --account-id 317805897534 \
  --budget-name huntaze-monthly
```

### Permission Denied

Ensure your IAM user/role has permissions for:
- `sqs:CreateQueue`, `sqs:SetQueueAttributes`
- `dynamodb:CreateTable`, `dynamodb:UpdateTable`
- `sns:CreateTopic`, `sns:SetTopicAttributes`
- `budgets:CreateBudget`

## 📚 Documentation

- [Terraform Configuration](./README.md)
- [Production Hardening Plan](../../../AWS_PRODUCTION_HARDENING_PLAN.md)
- [Spec Requirements](.kiro/specs/aws-production-hardening/requirements.md)
- [Spec Design](.kiro/specs/aws-production-hardening/design.md)
- [Spec Tasks](.kiro/specs/aws-production-hardening/tasks.md)

---

**Ready to deploy? Run:** `./scripts/deploy-production-hardening.sh`
