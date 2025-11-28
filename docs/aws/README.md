# AWS Services Documentation

This directory contains all AWS-related documentation for the Huntaze platform.

## Quick Links

- **AWS Console**: https://console.aws.amazon.com/
- **Account ID**: 317805897534
- **Primary Region**: us-east-1 (US East - N. Virginia)

## Services Overview

### Amazon S3 (Simple Storage Service)
Stores user-uploaded files, images, videos, and static assets.

**Primary Bucket**: `huntaze-assets`

**Documentation**: [S3-SETUP.md](S3-SETUP.md)

### Amazon SES (Simple Email Service)
Handles transactional emails including magic links, notifications, and verification emails.

**Verified Domain**: huntaze.com  
**From Email**: no-reply@huntaze.com  
**Status**: Sandbox Mode (200 emails/day)

**Documentation**: [SES-SETUP.md](SES-SETUP.md)

### Amazon CloudWatch
Collects application logs, metrics, and monitoring data.

**Log Group**: `/aws/amplify/huntaze-production`  
**Retention**: 30 days

**Documentation**: [CLOUDWATCH-SETUP.md](CLOUDWATCH-SETUP.md)

### AWS Amplify
Hosts and deploys the Next.js application with SSR support.

**App ID**: d33l77zi1h78ce  
**Platform**: WEB_COMPUTE (SSR)  
**Repository**: https://github.com/chrlshc/huntaze

**Documentation**: [AMPLIFY-SETUP.md](AMPLIFY-SETUP.md)

### Amazon RDS (PostgreSQL)
Primary database for application data.

**Instance**: huntaze-postgres-production  
**Engine**: PostgreSQL 14+

### Amazon ElastiCache (Redis)
Caching layer for improved performance.

**Cluster**: huntaze-redis-production

## Quick Start

### Prerequisites
- AWS CLI installed and configured
- Access to AWS account 317805897534
- Appropriate IAM permissions

### Setup All Services

```bash
# Run automated setup script
./scripts/setup-aws-services.sh

# Verify configuration
./scripts/test-aws-services.sh
```

### Environment Variables

Add these to AWS Amplify Console → Environment variables:

```bash
# S3
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1

# SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
AWS_SES_FROM_NAME=Huntaze
EMAIL_FROM=no-reply@huntaze.com

# CloudWatch
CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production
CLOUDWATCH_REGION=us-east-1

# AWS General
AWS_REGION=us-east-1
```

## Service-Specific Guides

### S3 Storage
- [Complete S3 Setup Guide](S3-SETUP.md)
- [CORS Configuration](../aws-config/s3-cors-config.json)
- [Bucket Policy](../aws-config/s3-bucket-policy.json)

### Email (SES)
- [SES Quick Start (5 minutes)](SES-QUICK-START.md)
- [Complete SES Setup](SES-SETUP.md)
- [Production Access Request](SES-PRODUCTION-ACCESS.md)

### Monitoring (CloudWatch)
- [CloudWatch Setup](CLOUDWATCH-SETUP.md)
- [Log Analysis](CLOUDWATCH-LOGS.md)
- [Alarms & Alerts](CLOUDWATCH-ALARMS.md)

### Deployment (Amplify)
- [Amplify Configuration](AMPLIFY-SETUP.md)
- [Environment Variables](AMPLIFY-ENV-VARS.md)
- [Build Troubleshooting](AMPLIFY-TROUBLESHOOTING.md)

## Verification & Testing

### Verify S3
```bash
# List buckets
aws s3 ls

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://huntaze-assets/test.txt
aws s3 ls s3://huntaze-assets/
```

### Verify SES
```bash
# Check verified identities
aws ses list-identities --region us-east-1

# Send test email
aws ses send-email \
  --from no-reply@huntaze.com \
  --to your-email@example.com \
  --subject "Test" \
  --text "Testing SES" \
  --region us-east-1
```

### Verify CloudWatch
```bash
# List log groups
aws logs describe-log-groups --region us-east-1

# Tail logs
aws logs tail /aws/amplify/huntaze-production --follow --region us-east-1
```

## IAM Permissions

### Recommended IAM Role
Instead of using access keys, create an IAM role for Amplify:

1. AWS Console → IAM → Roles → Create Role
2. Select "AWS Service" → "Amplify"
3. Attach policies:
   - AmazonS3FullAccess
   - AmazonSESFullAccess
   - CloudWatchLogsFullAccess
4. Name: `HuntazeAmplifyRole`

### Attach Role to Amplify
```bash
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --iam-service-role-arn arn:aws:iam::317805897534:role/HuntazeAmplifyRole \
  --region us-east-1
```

## Security Best Practices

1. **Use IAM Roles** instead of access keys when possible
2. **Enable MFA** on all IAM users
3. **Rotate credentials** regularly
4. **Use least privilege** principle for permissions
5. **Enable CloudTrail** for audit logging
6. **Configure S3 bucket policies** to restrict public access
7. **Use VPC** for RDS and ElastiCache
8. **Enable encryption** at rest and in transit

## Cost Optimization

### Current Monthly Costs (Estimated)
- S3: ~$5-10 (storage + requests)
- SES: Free tier (first 62,000 emails/month)
- CloudWatch: ~$5-10 (logs + metrics)
- Amplify: ~$15-30 (hosting + build minutes)
- RDS: ~$50-100 (db.t3.medium instance)
- ElastiCache: ~$30-50 (cache.t3.micro)

**Total**: ~$105-200/month

### Cost Reduction Tips
1. Use S3 lifecycle policies to archive old files
2. Set CloudWatch log retention to 30 days
3. Use RDS reserved instances for production
4. Enable S3 Intelligent-Tiering
5. Monitor and optimize CloudWatch metrics

## Troubleshooting

### Common Issues

**S3 Access Denied**
- Check IAM permissions
- Verify bucket policy
- Ensure CORS is configured

**SES Email Not Sending**
- Verify sender email in SES
- Check sandbox mode restrictions
- Review CloudWatch logs for errors

**CloudWatch Logs Not Appearing**
- Verify log group exists
- Check IAM permissions
- Ensure application is logging correctly

**Amplify Build Failing**
- Check environment variables
- Review build logs in Amplify Console
- Verify Node.js version compatibility

### Support Resources
- [AWS Support Center](https://console.aws.amazon.com/support/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Amplify Discord](https://discord.gg/amplify)

## Migration History

### Completed Migrations
- ✅ Auth.js v5 migration (Nov 2025)
- ✅ ElastiCache Redis setup (Nov 2025)
- ✅ SES email verification (Nov 2025)
- ✅ CloudWatch logging integration (Nov 2025)

### Planned Migrations
- ⏳ SES production access request
- ⏳ RDS Multi-AZ deployment
- ⏳ CloudFront CDN setup
- ⏳ Lambda@Edge for image optimization

## Additional Resources

### Internal Documentation
- [Deployment Status](../../DEPLOYMENT-STATUS.md)
- [Environment Variables Guide](../ENVIRONMENT_VARIABLES.md)
- [Build Troubleshooting](../BUILD_TROUBLESHOOTING.md)

### AWS Documentation
- [S3 Developer Guide](https://docs.aws.amazon.com/s3/)
- [SES Developer Guide](https://docs.aws.amazon.com/ses/)
- [CloudWatch User Guide](https://docs.aws.amazon.com/cloudwatch/)
- [Amplify Hosting Guide](https://docs.aws.amazon.com/amplify/)

---

**Last Updated**: November 27, 2025  
**Maintained By**: Huntaze DevOps Team  
**AWS Account**: 317805897534
