# AWS Infrastructure Audit

This audit tool analyzes your AWS infrastructure usage and provides recommendations on whether to keep, optimize, or remove AWS services.

## What It Audits

### 1. S3 (Simple Storage Service)
- Number of buckets
- Storage size and object count
- Request volume (last 30 days)
- Data transfer metrics
- Estimated monthly costs

### 2. CloudFront (CDN)
- Number of distributions
- Request volume (last 30 days)
- Data transfer metrics
- Cache hit rates
- Estimated monthly costs

### 3. CloudWatch (Monitoring)
- Custom metric namespaces
- Data point volume (last 30 days)
- Metric counts
- Estimated monthly costs

## How to Run

### Option 1: With AWS Credentials

If you have AWS credentials configured:

```bash
# Make sure AWS credentials are in .env.local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Run the audit
npm run audit:aws
# or
tsx scripts/audit-aws-infrastructure.ts
```

### Option 2: Without AWS Credentials

If AWS is not configured (recommended for most users):

```bash
tsx scripts/audit-aws-infrastructure.ts
```

The script will detect that AWS is not configured and provide a recommendation to keep it disabled.

## Understanding the Report

### Recommendations

**🔴 REMOVE** - Service is not being used or has zero activity
- Action: Remove AWS configuration and dependencies
- Benefit: Reduce complexity and potential costs

**🟡 OPTIMIZE** - Service is used but inefficiently
- Action: Review usage patterns and optimize configuration
- Benefit: Reduce costs while maintaining functionality

**🟢 KEEP** - Service is actively used and providing value
- Action: Continue using the service
- Benefit: Maintain current functionality

### Cost Estimates

The audit provides estimated monthly costs based on:
- S3: $0.023/GB storage + $0.0004/1000 requests
- CloudFront: $0.0075/10,000 requests + $0.085/GB transfer
- CloudWatch: $0.30/1000 metrics + $0.01/1000 data points

These are approximate costs and may vary by region and usage patterns.

## Common Scenarios

### Scenario 1: AWS Not Configured (Most Common)

```
⚠️  AWS credentials not configured

Recommendation: KEEP AWS DISABLED
The application is working well without AWS infrastructure.
```

**Action**: No action needed. Your app works fine without AWS.

### Scenario 2: AWS Configured But Not Used

```
🔴 REMOVE ALL AWS SERVICES

No AWS services are being actively used.
Estimated Monthly Savings: $15.00
```

**Action**: 
1. Remove AWS SDK dependencies from package.json
2. Remove AWS configuration from .env files
3. Remove AWS-related code from lib/aws/

### Scenario 3: Low AWS Usage

```
🟡 OPTIMIZE AWS USAGE

All AWS services are configured but usage is minimal ($8.50/month).
```

**Action**:
1. Review which services are actually needed
2. Consider local alternatives for development
3. Keep only production-critical services

### Scenario 4: Active AWS Usage

```
🟢 KEEP ACTIVE SERVICES

AWS services are providing value ($45.00/month).
Active services: S3, CloudFront
```

**Action**: Continue using AWS services as configured.

## Output Files

The audit generates two outputs:

1. **Console Report**: Detailed breakdown printed to terminal
2. **JSON Report**: Full data saved to `.kiro/specs/dashboard-performance-real-fix/aws-audit-report.json`

## Troubleshooting

### Error: "AWS credentials are invalid"

**Cause**: Credentials in .env.local are incorrect or expired

**Solution**: 
- Update AWS credentials
- Or remove AWS configuration to disable AWS features

### Error: "AWS permissions are insufficient"

**Cause**: AWS user doesn't have required permissions

**Required Permissions**:
- s3:ListBuckets
- s3:GetBucketLocation
- s3:ListObjects
- cloudfront:ListDistributions
- cloudfront:GetDistribution
- cloudwatch:GetMetricStatistics
- cloudwatch:ListMetrics

**Solution**: Update IAM permissions or use an admin account for the audit

### No Data in Report

**Cause**: AWS services exist but have no recent activity

**Solution**: This is expected if services were set up but never used. Follow the "REMOVE" recommendation.

## Integration with Performance Optimization

This audit is part of Task 7 in the dashboard performance optimization spec. The results help determine:

1. Whether AWS infrastructure is contributing to performance
2. If AWS costs are justified by usage
3. Whether to keep or remove AWS dependencies

## Next Steps After Audit

Based on the audit results:

### If Recommendation is REMOVE:
1. Complete Task 7 by documenting the decision
2. Optionally clean up AWS resources
3. Continue to Task 8 (Database Optimization)

### If Recommendation is OPTIMIZE:
1. Review specific service recommendations
2. Implement suggested optimizations
3. Re-run audit to verify improvements
4. Continue to Task 8

### If Recommendation is KEEP:
1. Document current AWS usage
2. Set up cost alerts in AWS
3. Continue to Task 8

## Cost Monitoring

To monitor AWS costs ongoing:

1. Set up AWS Cost Explorer
2. Create billing alerts in AWS Console
3. Review monthly AWS bills
4. Re-run this audit quarterly

## Questions?

If you're unsure about the recommendations:

1. Review the detailed reasoning in the report
2. Check actual AWS bills in AWS Console
3. Consider your application's specific needs
4. When in doubt, start with REMOVE and add back only if needed
