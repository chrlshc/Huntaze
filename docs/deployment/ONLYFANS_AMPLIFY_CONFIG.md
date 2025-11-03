# 🚀 OnlyFans CRM - AWS Amplify Configuration

## Environment Variables Required

### Core Application
```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-domain.com
```

### OnlyFans Integration
```bash
ONLYFANS_API_URL=https://onlyfans.com/api2/v2
ONLYFANS_USER_AGENT=Mozilla/5.0 (compatible; HuntazeCRM/1.0)
```

### AWS Services
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/<account-id>/onlyfans-rate-limiter
```

### Email (AWS SES)
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<your-ses-smtp-user>
SMTP_PASS=<your-ses-smtp-password>
FROM_EMAIL=noreply@your-domain.com
```

## AWS Amplify Build Settings

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npm run db:migrate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Infrastructure Setup

### 1. Create SQS Queue for Rate Limiting

```bash
aws sqs create-queue \
  --queue-name onlyfans-rate-limiter \
  --attributes VisibilityTimeout=30,MessageRetentionPeriod=86400
```

### 2. Configure IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:us-east-1:*:onlyfans-rate-limiter"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Database Setup (RDS PostgreSQL)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier huntaze-onlyfans-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxx
```

## Deployment Checklist

- [ ] Environment variables configured in Amplify
- [ ] SQS queue created
- [ ] IAM policies attached
- [ ] Database created and accessible
- [ ] Database migrations run
- [ ] SES verified and configured
- [ ] Domain configured with SSL
- [ ] Health checks passing

## Post-Deployment Verification

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test OnlyFans rate limiter status
curl https://your-domain.com/api/onlyfans/messages/status

# Check database connection
npm run db:test-connection
```

## Monitoring

- CloudWatch Logs: `/aws/amplify/huntaze-onlyfans`
- SQS Metrics: Message count, age
- Database: Connection pool, query performance
- API: Response times, error rates

**Estimated Monthly Cost**: $30-50 (depending on usage)
