# Security Runbook

## Overview

Automated security validation script that checks AWS security posture across multiple services. Run daily or after infrastructure changes to ensure compliance with security best practices.

## Usage

```bash
# Run with default region (us-east-1)
./scripts/security-runbook.sh

# Run with specific region
./scripts/security-runbook.sh eu-west-1
```

## Exit Codes

- `0`: All checks passed
- `1`: Critical issues detected (immediate action required)
- `2`: Warnings detected (plan remediation)

## Checks Performed

### 1. GuardDuty Threat Detection

- ✅ GuardDuty enabled
- ✅ No high/critical findings

**Remediation**: Enable GuardDuty via AWS Console or Terraform

### 2. Security Hub Compliance

- ✅ Security Hub enabled
- ✅ FSBP standard enabled
- ✅ No high/critical failed findings

**Remediation**: Enable Security Hub and FSBP standard

### 3. CloudTrail Audit Logging

- ✅ CloudTrail configured
- ✅ Trail is logging
- ✅ Multi-region enabled

**Remediation**: Create CloudTrail trail with multi-region support

### 4. S3 Public Access Block

- ✅ BlockPublicAcls enabled
- ✅ IgnorePublicAcls enabled
- ✅ BlockPublicPolicy enabled
- ✅ RestrictPublicBuckets enabled

**Remediation**:
```bash
aws s3control put-public-access-block \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 5. RDS Security Posture

Per RDS instance:
- ✅ Not publicly accessible
- ✅ Storage encrypted
- ✅ Deletion protection enabled

**Remediation**:
```bash
# Disable public access
aws rds modify-db-instance \
  --db-instance-identifier <instance-id> \
  --no-publicly-accessible

# Enable deletion protection
aws rds modify-db-instance \
  --db-instance-identifier <instance-id> \
  --deletion-protection
```

### 6. ElastiCache Encryption

Per Redis cluster:
- ✅ At-rest encryption enabled
- ✅ Transit encryption enabled

**Remediation**: Migrate to encrypted cluster (see `elasticache-migration-encrypted.md`)

### 7. IAM Security

- ✅ Root account MFA enabled
- ✅ No access keys older than 90 days

**Remediation**:
```bash
# Enable root MFA via AWS Console
# Rotate old access keys
aws iam create-access-key --user-name <username>
aws iam delete-access-key --user-name <username> --access-key-id <old-key-id>
```

## Automation

### Daily Scheduled Run

Add to cron:
```bash
# Run daily at 9 AM UTC
0 9 * * * /path/to/scripts/security-runbook.sh us-east-1 >> /var/log/security-runbook.log 2>&1
```

### EventBridge Schedule

```json
{
  "ScheduleExpression": "cron(0 9 * * ? *)",
  "Target": {
    "Arn": "arn:aws:lambda:us-east-1:123456789012:function:security-runbook",
    "Input": "{\"region\": \"us-east-1\"}"
  }
}
```

### Slack Notifications

Pipe output to Slack webhook:
```bash
#!/bin/bash
OUTPUT=$(./scripts/security-runbook.sh 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"Security Runbook Failed\n\`\`\`$OUTPUT\`\`\`\"}"
fi
```

## Troubleshooting

### Permission Denied

Ensure IAM role/user has required permissions:
- `guardduty:ListDetectors`
- `guardduty:ListFindings`
- `securityhub:DescribeHub`
- `securityhub:GetFindings`
- `cloudtrail:DescribeTrails`
- `cloudtrail:GetTrailStatus`
- `s3control:GetPublicAccessBlock`
- `rds:DescribeDBInstances`
- `elasticache:DescribeReplicationGroups`
- `iam:GetAccountSummary`
- `iam:GenerateCredentialReport`
- `iam:GetCredentialReport`

### False Positives

Some checks may trigger warnings in development environments. Adjust thresholds or skip checks as needed.

## Best Practices

1. **Run daily**: Schedule automated runs to catch drift
2. **Alert on failures**: Integrate with monitoring/alerting system
3. **Track trends**: Log results to track security posture over time
4. **Document exceptions**: Maintain list of accepted warnings
5. **Review regularly**: Monthly review of all findings

## Related Runbooks

- [ElastiCache Migration](./elasticache-migration-encrypted.md)
- [RDS Encryption Migration](./rds-encryption-migration.md)
- [Security Services Management](./security-services-management.md)

## Support

For issues or questions, contact the DevOps team or create a ticket in the security channel.
