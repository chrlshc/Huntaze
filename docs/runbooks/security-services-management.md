# Security Services Management Runbook

## Overview

This runbook covers the management and monitoring of AWS security services:
- **GuardDuty**: Threat detection
- **Security Hub**: Compliance monitoring (AWS FSBP)
- **CloudTrail**: Multi-region audit logging

## Quick Reference

| Service | Purpose | Alert Threshold | Response Time |
|---------|---------|----------------|---------------|
| GuardDuty | Threat detection | High/Critical findings | < 15 minutes |
| Security Hub | Compliance | Failed controls (High/Critical) | < 1 hour |
| CloudTrail | Audit logging | Logging stopped | < 5 minutes |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Account                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  GuardDuty   │    │ Security Hub │    │  CloudTrail  │  │
│  │              │    │              │    │              │  │
│  │ • S3 Protect │    │ • AWS FSBP   │    │ • Multi-Reg  │  │
│  │ • Malware    │    │ • Compliance │    │ • Encrypted  │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │           │
│         └───────────┬───────┴───────────────────┘           │
│                     │                                        │
│              ┌──────▼──────┐                                │
│              │ EventBridge │                                │
│              │   Rules     │                                │
│              └──────┬──────┘                                │
│                     │                                        │
│              ┌──────▼──────┐                                │
│              │  SNS Topics │                                │
│              │  (Encrypted)│                                │
│              └──────┬──────┘                                │
│                     │                                        │
│         ┌───────────┼───────────┐                           │
│         │           │           │                           │
│    ┌────▼────┐ ┌───▼────┐ ┌───▼────┐                      │
│    │  Email  │ │ Slack  │ │PagerDuty│                      │
│    └─────────┘ └────────┘ └────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## 1. GuardDuty Management

### 1.1 Enable GuardDuty

```bash
# Via Terraform
cd infra/terraform/production-hardening
terraform apply -target=aws_guardduty_detector.main

# Via AWS CLI
aws guardduty create-detector \
  --enable \
  --finding-publishing-frequency FIFTEEN_MINUTES \
  --region us-east-1
```

### 1.2 Monitor GuardDuty Findings

**Check current findings:**
```bash
# List all findings
aws guardduty list-findings \
  --detector-id <detector-id> \
  --region us-east-1

# Get high/critical findings
aws guardduty list-findings \
  --detector-id <detector-id> \
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}' \
  --region us-east-1
```

**Get finding details:**
```bash
aws guardduty get-findings \
  --detector-id <detector-id> \
  --finding-ids <finding-id> \
  --region us-east-1
```

### 1.3 Common GuardDuty Findings

#### UnauthorizedAccess:EC2/SSHBruteForce
**Severity:** Medium  
**Description:** SSH brute force attack detected

**Response:**
1. Identify the affected EC2 instance
2. Review security group rules
3. Block the source IP in NACL
4. Enable AWS Systems Manager Session Manager
5. Disable SSH access if not needed

```bash
# Block IP in security group
aws ec2 revoke-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr <malicious-ip>/32
```

#### CryptoCurrency:EC2/BitcoinTool.B!DNS
**Severity:** High  
**Description:** EC2 instance querying cryptocurrency mining pool

**Response:**
1. **IMMEDIATE**: Isolate the instance
2. Take snapshot for forensics
3. Terminate the instance
4. Review IAM credentials
5. Rotate all access keys
6. Review CloudTrail for unauthorized actions

```bash
# Isolate instance
aws ec2 modify-instance-attribute \
  --instance-id i-xxxxx \
  --groups sg-isolated

# Take snapshot
aws ec2 create-snapshot \
  --volume-id vol-xxxxx \
  --description "Forensic snapshot - crypto mining"

# Terminate instance
aws ec2 terminate-instances --instance-ids i-xxxxx
```

#### Recon:EC2/PortProbeUnprotectedPort
**Severity:** Low  
**Description:** Port scan detected on unprotected port

**Response:**
1. Review security group rules
2. Close unnecessary ports
3. Enable VPC Flow Logs
4. Monitor for follow-up attacks

### 1.4 Suppress False Positives

```bash
# Create suppression rule
aws guardduty create-filter \
  --detector-id <detector-id> \
  --name "suppress-known-scanner" \
  --finding-criteria '{"Criterion":{"service.action.networkConnectionAction.remoteIpDetails.ipAddressV4":{"Eq":["<known-scanner-ip>"]}}}' \
  --action ARCHIVE \
  --region us-east-1
```

## 2. Security Hub Management

### 2.1 Enable Security Hub

```bash
# Via Terraform
cd infra/terraform/production-hardening
terraform apply -target=aws_securityhub_account.main
terraform apply -target=aws_securityhub_standards_subscription.fsbp

# Via AWS CLI
aws securityhub enable-security-hub --region us-east-1

# Enable AWS FSBP standard
aws securityhub batch-enable-standards \
  --standards-subscription-requests '[{"StandardsArn":"arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0"}]' \
  --region us-east-1
```

### 2.2 Review Compliance Status

```bash
# Get compliance summary
aws securityhub get-compliance-summary-by-resource-type \
  --region us-east-1

# Get failed findings
aws securityhub get-findings \
  --filters '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],"SeverityLabel":[{"Value":"HIGH","Comparison":"EQUALS"},{"Value":"CRITICAL","Comparison":"EQUALS"}]}' \
  --region us-east-1
```

### 2.3 Common Security Hub Findings

#### [S3.1] S3 Block Public Access setting should be enabled
**Severity:** Medium  
**Remediation:**
```bash
# Enable at account level
aws s3control put-public-access-block \
  --account-id <account-id> \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### [RDS.3] RDS DB instances should have encryption at rest enabled
**Severity:** Medium  
**Remediation:**
```bash
# Create encrypted snapshot
aws rds create-db-snapshot \
  --db-instance-identifier <db-instance> \
  --db-snapshot-identifier <snapshot-name>

# Copy with encryption
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier <snapshot-name> \
  --target-db-snapshot-identifier <encrypted-snapshot> \
  --kms-key-id <kms-key-id>

# Restore from encrypted snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier <new-db-instance> \
  --db-snapshot-identifier <encrypted-snapshot>
```

#### [CloudTrail.1] CloudTrail should be enabled and configured
**Severity:** High  
**Remediation:** See CloudTrail section below

### 2.4 Suppress Findings

```bash
# Update finding to suppressed
aws securityhub batch-update-findings \
  --finding-identifiers Id=<finding-id>,ProductArn=<product-arn> \
  --workflow Status=SUPPRESSED \
  --note Text="Suppressed: Known exception",UpdatedBy="security-team" \
  --region us-east-1
```

## 3. CloudTrail Management

### 3.1 Enable CloudTrail

```bash
# Via Terraform
cd infra/terraform/production-hardening
terraform apply -target=aws_cloudtrail.main

# Via AWS CLI
aws cloudtrail create-trail \
  --name huntaze-production-trail \
  --s3-bucket-name huntaze-cloudtrail-logs-<account-id> \
  --is-multi-region-trail \
  --enable-log-file-validation \
  --kms-key-id <kms-key-id> \
  --region us-east-1

# Start logging
aws cloudtrail start-logging \
  --name huntaze-production-trail \
  --region us-east-1
```

### 3.2 Query CloudTrail Logs

**Recent API calls:**
```bash
# Last 10 events
aws cloudtrail lookup-events \
  --max-results 10 \
  --region us-east-1

# Filter by user
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=<username> \
  --region us-east-1

# Filter by event name
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket \
  --region us-east-1
```

**Using CloudWatch Logs Insights:**
```sql
-- Failed authentication attempts
fields @timestamp, userIdentity.principalId, errorCode, errorMessage
| filter errorCode like /Unauthorized|Forbidden|AccessDenied/
| sort @timestamp desc
| limit 100

-- Root account usage
fields @timestamp, userIdentity.type, eventName, sourceIPAddress
| filter userIdentity.type = "Root"
| sort @timestamp desc

-- Security group changes
fields @timestamp, userIdentity.principalId, eventName, requestParameters
| filter eventName like /AuthorizeSecurityGroup|RevokeSecurityGroup/
| sort @timestamp desc
```

### 3.3 Monitor CloudTrail Health

```bash
# Check trail status
aws cloudtrail get-trail-status \
  --name huntaze-production-trail \
  --region us-east-1

# Verify logging
aws cloudtrail lookup-events \
  --max-results 1 \
  --region us-east-1
```

**Alert if logging stops:**
```bash
# CloudWatch alarm for CloudTrail
aws cloudwatch put-metric-alarm \
  --alarm-name cloudtrail-logging-stopped \
  --alarm-description "Alert when CloudTrail stops logging" \
  --metric-name IsLogging \
  --namespace AWS/CloudTrail \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --alarm-actions <sns-topic-arn>
```

## 4. Incident Response

### 4.1 High Severity GuardDuty Finding

**Response Timeline:**
- **0-5 min**: Acknowledge alert
- **5-15 min**: Initial assessment
- **15-30 min**: Containment
- **30-60 min**: Remediation
- **60+ min**: Post-incident review

**Steps:**
1. **Acknowledge**: Confirm receipt of alert
2. **Assess**: Review finding details
3. **Contain**: Isolate affected resources
4. **Investigate**: Review CloudTrail logs
5. **Remediate**: Fix vulnerability
6. **Document**: Update incident log
7. **Review**: Post-mortem analysis

### 4.2 Critical Security Hub Finding

**Response Timeline:**
- **0-15 min**: Acknowledge alert
- **15-60 min**: Assessment and remediation plan
- **1-4 hours**: Implementation
- **4-24 hours**: Validation

**Steps:**
1. **Acknowledge**: Confirm receipt
2. **Assess**: Determine impact
3. **Plan**: Create remediation plan
4. **Implement**: Fix the issue
5. **Validate**: Verify compliance
6. **Document**: Update runbook

### 4.3 CloudTrail Logging Stopped

**Response Timeline:**
- **0-5 min**: Immediate action required

**Steps:**
1. **Check trail status**
2. **Verify S3 bucket exists**
3. **Check IAM permissions**
4. **Restart logging**
5. **Investigate cause**
6. **Prevent recurrence**

```bash
# Restart logging
aws cloudtrail start-logging \
  --name huntaze-production-trail \
  --region us-east-1

# Check for errors
aws cloudtrail get-trail-status \
  --name huntaze-production-trail \
  --region us-east-1
```

## 5. Maintenance Tasks

### 5.1 Weekly Tasks

- [ ] Review GuardDuty findings
- [ ] Check Security Hub compliance score
- [ ] Verify CloudTrail is logging
- [ ] Review SNS subscription confirmations

### 5.2 Monthly Tasks

- [ ] Review suppressed findings
- [ ] Update EventBridge rules if needed
- [ ] Review CloudTrail S3 bucket size
- [ ] Test incident response procedures
- [ ] Review and update this runbook

### 5.3 Quarterly Tasks

- [ ] Conduct security audit
- [ ] Review and update security policies
- [ ] Test disaster recovery procedures
- [ ] Review access logs
- [ ] Update security training

## 6. Troubleshooting

### GuardDuty Not Generating Findings

**Possible causes:**
1. Detector not enabled
2. No suspicious activity
3. Findings suppressed

**Resolution:**
```bash
# Check detector status
aws guardduty get-detector \
  --detector-id <detector-id> \
  --region us-east-1

# List suppression rules
aws guardduty list-filters \
  --detector-id <detector-id> \
  --region us-east-1
```

### Security Hub Findings Not Updating

**Possible causes:**
1. Standard not enabled
2. Resources not in scope
3. Findings archived

**Resolution:**
```bash
# Check enabled standards
aws securityhub get-enabled-standards \
  --region us-east-1

# Re-enable standard
aws securityhub batch-enable-standards \
  --standards-subscription-requests '[{"StandardsArn":"<standard-arn>"}]' \
  --region us-east-1
```

### CloudTrail Not Logging

**Possible causes:**
1. Trail stopped
2. S3 bucket permissions
3. KMS key permissions

**Resolution:**
```bash
# Check trail status
aws cloudtrail get-trail-status \
  --name huntaze-production-trail \
  --region us-east-1

# Check S3 bucket policy
aws s3api get-bucket-policy \
  --bucket huntaze-cloudtrail-logs-<account-id>

# Restart logging
aws cloudtrail start-logging \
  --name huntaze-production-trail \
  --region us-east-1
```

## 7. Cost Optimization

### Current Costs (Estimated)

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| GuardDuty | $4-6 | Based on CloudTrail events + S3 logs |
| Security Hub | $0.001/check | ~$10-15/month for FSBP |
| CloudTrail | $2/trail + $0.10/100k events | ~$5-10/month |
| S3 Storage | $0.023/GB | ~$2-5/month for logs |
| **Total** | **~$21-36/month** | |

### Cost Reduction Tips

1. **GuardDuty**: Disable unused protections (EKS if not used)
2. **Security Hub**: Disable unused standards
3. **CloudTrail**: Use data event filtering
4. **S3**: Enable lifecycle policies for log archival

## 8. References

- [GuardDuty User Guide](https://docs.aws.amazon.com/guardduty/)
- [Security Hub User Guide](https://docs.aws.amazon.com/securityhub/)
- [CloudTrail User Guide](https://docs.aws.amazon.com/cloudtrail/)
- [AWS FSBP Standard](https://docs.aws.amazon.com/securityhub/latest/userguide/fsbp-standard.html)

## 9. Contacts

- **Security Team**: security@huntaze.com
- **On-Call Engineer**: Check PagerDuty
- **AWS Support**: Enterprise support case
- **Escalation**: CTO / Lead DevOps Engineer

---

**Last Updated:** 2025-10-28  
**Version:** 1.0  
**Owner:** Security Team
