# AWS Production Hardening - Terraform Infrastructure

This Terraform module creates the missing AWS resources for the Huntaze production hardening initiative.

## Resources Created

### SQS Queues (4 total)
- `huntaze-hybrid-workflows.fifo` - FIFO queue for multi-agent workflow orchestration
- `huntaze-hybrid-workflows-dlq.fifo` - Dead letter queue for failed workflows
- `huntaze-rate-limiter-queue` - Standard queue for OnlyFans rate limiting (10 msg/min)
- `huntaze-rate-limiter-queue-dlq` - Dead letter queue for failed rate limit messages

### DynamoDB Tables (2 total)
- `huntaze-ai-costs-production` - AI cost tracking by provider/agent/date (TTL: 90 days)
- `huntaze-cost-alerts-production` - Cost alert history (TTL: 30 days)

### SNS Topics (1 total)
- `huntaze-cost-alerts` - Budget and cost anomaly alerts

### AWS Budgets (1 total)
- `huntaze-monthly` - Monthly budget with 80% forecasted and 100% actual alerts

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with credentials
- AWS account: 317805897534
- Region: us-east-1

## Usage

### 1. Initialize Terraform

```bash
cd infra/terraform/production-hardening
terraform init
```

### 2. Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan the deployment

```bash
terraform plan
```

### 4. Apply the configuration

```bash
terraform apply
```

### 5. Verify resources

```bash
# List SQS queues
aws sqs list-queues --region us-east-1 | grep huntaze

# List DynamoDB tables
aws dynamodb list-tables --region us-east-1 | grep huntaze

# List SNS topics
aws sns list-topics --region us-east-1 | grep huntaze
```

## Outputs

After successful deployment, Terraform will output:

- SQS queue URLs and ARNs
- DynamoDB table names and ARNs
- SNS topic ARN
- Budget name
- Deployment summary

## Cost Estimate

Monthly costs for these resources:

| Resource | Cost |
|----------|------|
| SQS (4 queues) | ~$0.40 |
| DynamoDB (2 tables, on-demand) | ~$1-2 |
| SNS (1 topic) | ~$0.50 |
| AWS Budgets (1 budget) | $0.02 |
| **Total** | **~$2-3/month** |

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Integration

### Environment Variables

Add these to your application:

```bash
# SQS
export SQS_HYBRID_WORKFLOWS_URL="<output from terraform>"
export SQS_RATE_LIMITER_URL="<output from terraform>"

# DynamoDB
export DYNAMODB_AI_COSTS_TABLE="huntaze-ai-costs-production"
export DYNAMODB_COST_ALERTS_TABLE="huntaze-cost-alerts-production"

# SNS
export SNS_COST_ALERTS_ARN="<output from terraform>"
```

### Subscribe to SNS Topic

```bash
# Email subscription
aws sns subscribe \
  --topic-arn <SNS_ARN> \
  --protocol email \
  --notification-endpoint admin@huntaze.com

# Slack webhook (via AWS Chatbot)
# Configure in AWS Console: AWS Chatbot > Slack > Add to Slack
```

## Troubleshooting

### Permission Denied

Ensure your AWS credentials have permissions for:
- SQS (CreateQueue, SetQueueAttributes)
- DynamoDB (CreateTable, UpdateTable)
- SNS (CreateTopic, SetTopicAttributes)
- Budgets (CreateBudget)

### Budget Already Exists

If you get "Budget already exists" error:
```bash
aws budgets delete-budget --account-id 317805897534 --budget-name huntaze-monthly
```

### State Lock

If Terraform state is locked:
```bash
terraform force-unlock <LOCK_ID>
```

## Next Steps

After deploying this infrastructure:

1. **Week 1:**
   - Migrate ElastiCache to encrypted cluster
   - Enable GuardDuty, Security Hub, CloudTrail
   - Enable Container Insights on ECS clusters

2. **Week 2:**
   - Deploy rate limiter Lambda
   - Enable RDS Performance Insights
   - Configure ECS Auto Scaling
   - Implement cost optimizations

See `AWS_PRODUCTION_HARDENING_PLAN.md` for full timeline.
