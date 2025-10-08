# Huntaze AWS Deployment Guide

> **Recommended path:** Use **AWS Amplify Hosting** for both staging and production.  
> - Branch `staging` → Amplify *Staging* environment  
> - Branch `main` (or `prod`) → Amplify *Production* environment  
>
> Deploy by pushing to the connected GitHub repository:
> ```bash
> git remote add amplify https://github.com/chrlshc/huntaze.git   # one time
> git push amplify staging                                       # trigger Amplify Staging build
> git push amplify main                                          # trigger Amplify Production build
> ```
> Keep environment variables in sync inside Amplify (see `aws-amplify-env-vars.txt`).  
> The sections below describe the self-managed EC2/ECS pipeline, which remains as an advanced fallback.

This document explains how to deploy the Huntaze App Router build on AWS when you need full control of the infrastructure.

---

## 🚀 Quick Deployment (scripts)

### Option 1 — Automated script (recommended for EC2)

```bash
aws configure                       # set AWS credentials
chmod +x deploy-simple-aws.sh
./deploy-simple-aws.sh
```

The script provisions dependencies, builds the Next.js project, and restarts the PM2 process.

### Option 2 — Manual deployment

#### 1. Build locally
```bash
npm install
npm run build
docker build -t huntaze-site .
```

#### 2. Push the container to ECR
```bash
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com

aws ecr create-repository --repository-name huntaze-site --region us-east-1   # only once

docker tag huntaze-site:latest [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/huntaze-site:latest
docker push [ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/huntaze-site:latest
```

---

## 🏗️ Full AWS Infrastructure (CloudFormation + ECS)

### Deploy via CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name huntaze-infrastructure \
  --template-body file://aws-infrastructure.yaml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=huntaze.com \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:... \
  --capabilities CAPABILITY_IAM

aws cloudformation wait stack-create-complete \
  --stack-name huntaze-infrastructure
```

**Stack output:**
- VPC with two public subnets
- Application Load Balancer (HTTPS)
- ECS Fargate cluster + service
- ECR repository
- CloudWatch log groups
- SSL certificate integration

---

## 🔧 Post-deployment configuration

### 1. DNS
Point your domain to the ALB:
```
huntaze.com  ->  CNAME  ->  [ALB-DNS-NAME].elb.amazonaws.com
```

### 2. Environment variables (ECS task definition)
```json
{
  "environment": [
    { "name": "NODE_ENV", "value": "production" },
    { "name": "NEXT_PUBLIC_APP_URL", "value": "https://huntaze.com" },
    { "name": "NEXT_PUBLIC_API_URL", "value": "https://api.huntaze.com" },
    { "name": "NEXTAUTH_URL", "value": "https://huntaze.com" },
    { "name": "NEXTAUTH_SECRET", "value": "..." }
  ]
}
```

### 3. Monitoring
- **CloudWatch dashboards** for CPU, memory, request count
- **CloudWatch Logs** for application output
- **AWS X-Ray** if you need distributed tracing

---

## 📊 Performance tips

- Use the multi-stage Dockerfile to keep images lean.
- Consider CloudFront in front of the ALB for global caching:
  ```bash
  aws cloudfront create-distribution \
    --origin-domain-name [ALB-DNS-NAME].elb.amazonaws.com \
    --default-root-object index.html
  ```
- Configure ECS auto scaling (min 2 tasks, max 10, target CPU 70%).

---

## 🛡️ Security checklist

- Force HTTPS everywhere.
- Apply least-privilege IAM roles for ECS tasks and CI/CD users.
- Store secrets in AWS Secrets Manager or SSM Parameter Store.
- Restrict Security Groups (only ALB is publicly accessible).
- Schedule regular ECR image lifecycle policies and backups.

---

## 📈 Monthly cost estimate

| Service         | Notes                         | Approx. cost |
|-----------------|------------------------------|--------------|
| ECS Fargate     | 2 tasks · 0.5 vCPU · 1 GB    | ~$30         |
| Application LB  | 1 ALB + standard traffic     | ~$25         |
| ECR             | 10 GB storage                | ~$1          |
| CloudWatch      | Logs + metrics + dashboards  | ~$10         |
| **Total**       |                              | **~$66/mo**  |

---

## 🔍 Troubleshooting

### Check ECS service status
```bash
aws ecs describe-services --cluster huntaze-cluster --services huntaze-service
aws logs tail /ecs/huntaze --follow
```

### Health check failures
- Increase the ECS health-check grace period:
  ```bash
  aws ecs update-service \
    --cluster huntaze-cluster \
    --service huntaze-service \
    --health-check-grace-period-seconds 120
  ```
- Verify `curl https://huntaze.com/api/health` returns `200`.

### Image pull errors
```bash
aws ecr get-repository-policy --repository-name huntaze-site
```

### Out-of-memory restarts
- Bump memory/CPU in the task definition (e.g., 2048 MB / 1 vCPU).

---

## 📞 Support resources

- AWS Amplify Hosting: https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html  
- AWS ECS / Fargate: https://docs.aws.amazon.com/ecs/  
- Huntaze support: support@huntaze.com

---

🎉 **Your Huntaze build is live on AWS!** Use Amplify for branch-driven automation, and fall back to the scripts/infrastructure above when you need custom control.
