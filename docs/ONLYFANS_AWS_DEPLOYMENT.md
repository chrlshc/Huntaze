# 🚀 OnlyFans AWS Deployment Guide

**Stack:** ECS Fargate + Playwright + DynamoDB + KMS

---

## 📋 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  BrowserWorkerClient (of-browser-worker.ts)           │ │
│  │  - Launches ECS tasks                                  │ │
│  │  - Polls DynamoDB for results                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ RunTask API
┌─────────────────────────────────────────────────────────────┐
│                    AWS ECS Fargate                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Playwright Browser Worker                           │  │
│  │  - Login OnlyFans                                    │  │
│  │  - Send Messages                                     │  │
│  │  - Sync Conversations                                │  │
│  │  - PPV Support                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ Store Results
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB + KMS                          │
│  - HuntazeOfSessions (encrypted cookies)                    │
│  - HuntazeOfThreads (conversations)                         │
│  - HuntazeOfMessages (results)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 FICHIERS CRÉÉS

### 1. CDK Stack
- `infra/cdk/lib/huntaze-of-stack.ts` - Infrastructure as Code

### 2. Browser Worker Client
- `src/lib/workers/of-browser-worker.ts` - ECS client (remplace stub)

### 3. Lambda Orchestrator
- `infra/lambda/orchestrator/index.ts` - SQS → ECS orchestration
- `infra/lambda/orchestrator/package.json`
- `infra/lambda/orchestrator/tsconfig.json`

### 4. Existing (Already Deployed)
- `infra/fargate/browser-worker/` - Playwright worker code
- `td.json` - Task Definition (revision 25)

---

## 📦 DÉPLOIEMENT

### Prérequis

```bash
# AWS CLI configured
aws sts get-caller-identity

# CDK installed
npm install -g aws-cdk

# Docker running (for building images)
docker --version
```

### Étape 1: Déployer l'Infrastructure CDK

```bash
cd infra/cdk

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://317805897534/us-east-1

# Deploy stack
cdk deploy HuntazeOnlyFansStack

# Save outputs
cdk deploy HuntazeOnlyFansStack --outputs-file outputs.json
```

**Outputs attendus:**
- ClusterArn
- TaskDefinitionArn
- SessionsTableName
- SubnetIds
- SecurityGroupId
- KmsKeyArn

### Étape 2: Build & Push Docker Image

```bash
cd infra/fargate/browser-worker

# Build image
docker build -t huntaze/of-browser-worker:latest .

# Tag for ECR
docker tag huntaze/of-browser-worker:latest \
  317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze/of-browser-worker:main

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  317805897534.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze/of-browser-worker:main
```

### Étape 3: Configure Environment Variables

```bash
# In Next.js app (.env.production)
ECS_CLUSTER_ARN=arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate
ECS_TASK_DEFINITION=HuntazeOfStackBrowserWorkerTaskCED33274:25
ECS_SUBNETS=subnet-xxxxx,subnet-yyyyy
ECS_SECURITY_GROUPS=sg-xxxxx
DYNAMODB_TABLE_MESSAGES=HuntazeOfMessages
AWS_REGION=us-east-1
```

### Étape 4: Deploy Lambda Orchestrator (Optional)

```bash
cd infra/lambda/orchestrator

# Install dependencies
npm install

# Build
npm run build

# Package
zip -r function.zip dist/ node_modules/

# Deploy via AWS CLI
aws lambda create-function \
  --function-name huntaze-of-orchestrator \
  --runtime nodejs20.x \
  --role arn:aws:iam::317805897534:role/lambda-execution-role \
  --handler dist/index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{
    ECS_CLUSTER=huntaze-of-fargate,
    TASK_DEFINITION=HuntazeOfStackBrowserWorkerTaskCED33274:25,
    SUBNETS=subnet-xxxxx,
    SECURITY_GROUPS=sg-xxxxx
  }"
```

---

## 🧪 TESTING

### Test 1: Launch Task Manually

```bash
aws ecs run-task \
  --cluster huntaze-of-fargate \
  --task-definition HuntazeOfStackBrowserWorkerTaskCED33274:25 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxxxx],
    securityGroups=[sg-xxxxx],
    assignPublicIp=ENABLED
  }" \
  --overrides '{
    "containerOverrides": [{
      "name": "of-browser-worker",
      "environment": [
        {"name": "ACTION", "value": "send"},
        {"name": "USER_ID", "value": "test-user"},
        {"name": "CONTENT_TEXT", "value": "Hello test"}
      ]
    }]
  }'
```

### Test 2: From Next.js App

```typescript
import { browserWorkerClient } from '@/lib/workers/of-browser-worker';

const result = await browserWorkerClient.runBrowserTask({
  action: 'send',
  userId: 'user-123',
  data: {
    content: 'Hello from Next.js!',
    conversationId: 'conv-456'
  }
});

console.log('Result:', result);
```

### Test 3: Check CloudWatch Logs

```bash
# Stream logs
aws logs tail /huntaze/of/browser-worker --follow

# Query recent errors
aws logs filter-log-events \
  --log-group-name /huntaze/of/browser-worker \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

---

## 📊 MONITORING

### CloudWatch Metrics

**Namespace:** `Huntaze/OnlyFans/BrowserWorker`

**Metrics:**
- `BrowserTaskSuccess` - Successful tasks
- `BrowserTaskError` - Failed tasks
- `TaskDuration` - Execution time (ms)

### CloudWatch Alarms

1. **BrowserWorkerFailureAlarm**
   - Triggers if tasks fail
   - Threshold: 0 tasks running for 2 minutes

2. **BrowserWorkerErrorRateAlarm**
   - Triggers if error rate > 10 in 5 minutes
   - Action: SNS notification

### Grafana Dashboard

Import dashboard from: `grafana/dashboards/onlyfans.json`

**Panels:**
- Messages Sent/min
- Task Success Rate
- P95 Task Duration
- Active Tasks

---

## 🔐 SECURITY

### Secrets Management

```bash
# Store OnlyFans credentials
aws secretsmanager create-secret \
  --name of/creds/huntaze \
  --secret-string '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Rotate secret
aws secretsmanager rotate-secret \
  --secret-id of/creds/huntaze
```

### KMS Encryption

All data encrypted at rest:
- DynamoDB tables use customer-managed KMS key
- Cookies encrypted before storage
- Automatic key rotation enabled

### IAM Permissions

Task Role has minimal permissions:
- DynamoDB: Read/Write on OF tables only
- KMS: Encrypt/Decrypt only
- Secrets Manager: Read credentials only
- CloudWatch: Write logs only

---

## 🚨 TROUBLESHOOTING

### Task Fails to Start

```bash
# Check task definition
aws ecs describe-task-definition \
  --task-definition HuntazeOfStackBrowserWorkerTaskCED33274:25

# Check cluster capacity
aws ecs describe-clusters --clusters huntaze-of-fargate

# Check service events
aws ecs describe-services \
  --cluster huntaze-of-fargate \
  --services huntaze-of-browser-worker
```

### Timeout Waiting for Result

```bash
# Check DynamoDB for task result
aws dynamodb get-item \
  --table-name HuntazeOfMessages \
  --key '{"taskId": {"S": "task-xxxxx"}}'

# Check task logs
aws logs get-log-events \
  --log-group-name /huntaze/of/browser-worker \
  --log-stream-name ecs/of-browser/task-xxxxx
```

### High Error Rate

```bash
# Check recent errors
aws logs filter-log-events \
  --log-group-name /huntaze/of/browser-worker \
  --filter-pattern "error" \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  | jq '.events[].message'

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace Huntaze/OnlyFans/BrowserWorker \
  --metric-name BrowserTaskError \
  --start-time $(date -u -d '1 hour ago' --iso-8601) \
  --end-time $(date -u --iso-8601) \
  --period 300 \
  --statistics Sum
```

---

## 💰 COST ESTIMATION

### ECS Fargate

- **CPU:** 2 vCPU × $0.04048/hour = $0.08096/hour
- **Memory:** 8 GB × $0.004445/GB/hour = $0.03556/hour
- **Total per task:** ~$0.12/hour

**Typical usage:**
- 50 users × 250 msgs/day = 12,500 tasks/day
- Average duration: 30 seconds
- Cost: 12,500 × (30/3600) × $0.12 = **$12.50/day**

### DynamoDB

- **On-Demand:** $1.25 per million write requests
- **Storage:** $0.25/GB/month

**Typical usage:**
- 12,500 writes/day = 375,000/month
- Cost: **$0.47/month**

### Data Transfer

- **Out to Internet:** $0.09/GB
- Typical: 1 GB/day = **$2.70/month**

**Total Monthly Cost:** ~$400/month for 50 active users

---

## 📚 NEXT STEPS

1. ✅ Deploy CDK stack
2. ✅ Configure environment variables
3. ⏳ Test with staging environment
4. ⏳ Set up CloudWatch alarms
5. ⏳ Configure Grafana dashboard
6. ⏳ Run load tests (k6)
7. ⏳ Production rollout (10% → 50% → 100%)

---

**Status:** ✅ Infrastructure Ready  
**Last Updated:** 2024-10-28
