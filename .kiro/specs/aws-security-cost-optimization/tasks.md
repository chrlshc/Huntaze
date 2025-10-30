# Implementation Plan - AWS Security & Cost Optimization

- [x] 1. Setup Cost Monitoring Infrastructure
  - Create AWS Budgets configuration with monthly threshold of $100 and alert levels at 50%, 80%, and 100%
  - Configure Cost Anomaly Detection monitor for SERVICE dimension with $10 threshold
  - Create SNS subscription for cost alerts reusing existing ErrorRateAlarmTopic
  - Add cost monitoring widgets to existing CloudWatch dashboard huntaze-prisma-migration
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement Security Posture Monitoring
- [x] 2.1 Create Security Hub activation script
  - Write bash script to enable Security Hub with AWS Foundational Best Practices standard
  - Add verification checks to confirm Security Hub is active and collecting findings
  - _Requirements: 2.1, 2.3_

- [x] 2.2 Create GuardDuty activation script
  - Write bash script to enable GuardDuty with 15-minute finding publication frequency
  - Configure EventBridge rule to route HIGH/CRITICAL findings to SNS topic
  - _Requirements: 2.2, 2.3_

- [x] 2.3 Add security monitoring dashboard widgets
  - Create CloudWatch dashboard widgets for Security Hub compliance score
  - Add widgets for GuardDuty findings count by severity
  - Integrate with existing huntaze-prisma-migration dashboard
  - _Requirements: 2.3, 2.4_

- [x] 3. Deploy WAF Protection for API Gateway
- [x] 3.1 Create WAF Web ACL with core rules
  - Define WebACL resource in SAM template with IP whitelist rule (priority 1)
  - Add rate limiting rule: 2000 requests per 5 minutes per IP (priority 10)
  - Include AWS Managed Rules: Core Rule Set and Known Bad Inputs (priority 20-30)
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Associate WAF with API Gateway
  - Create WebACLAssociation resource linking WAF to API Gateway stage
  - Configure WAF to run in COUNT mode initially for testing
  - _Requirements: 3.1_

- [x] 3.3 Add WAF monitoring and metrics
  - Create CloudWatch dashboard widgets for WAF blocked/allowed requests
  - Add metrics for top blocked IPs and rule match distribution
  - Configure alarm for WAF block rate exceeding 10% of total traffic
  - _Requirements: 3.4_

- [x] 3.4 Create WAF management script
  - Write script to switch WAF from COUNT to BLOCK mode after validation
  - Add functionality to manage IP whitelist
  - Include commands to review WAF logs and blocked requests
  - _Requirements: 3.3_

- [x] 4. Configure RDS Backup and Recovery
- [x] 4.1 Configure RDS automated backups
  - Write script to modify RDS instance with 7-day backup retention
  - Set preferred backup window to 03:00-04:00 UTC (off-peak)
  - Enable CloudWatch Logs exports for PostgreSQL
  - Verify PITR is enabled automatically
  - _Requirements: 4.1, 4.2_

- [x] 4.2 Create backup testing Lambda function
  - Implement Lambda function to create manual snapshot
  - Add logic to restore snapshot to temporary instance
  - Include health check verification of restored instance
  - Add cleanup logic to delete temporary instance
  - Configure SNS alert on test failure
  - _Requirements: 4.4_

- [x] 4.3 Deploy backup testing automation
  - Create EventBridge rule for monthly schedule (1st of month at 2 AM)
  - Add Lambda permissions for RDS snapshot and restore operations
  - Configure Lambda environment variables for instance identifiers
  - _Requirements: 4.4_

- [x] 4.4 Create disaster recovery runbook
  - Document PITR restore procedure with step-by-step commands
  - Define RTO (2 hours) and RPO (5 minutes) expectations
  - Include verification steps for data integrity after restore
  - Add rollback procedures if restore fails
  - _Requirements: 4.5_

- [ ] 5. Create Deployment and Management Scripts
- [ ] 5.1 Create master deployment script
  - Write deploy-security-cost-optimization.sh script that orchestrates all deployments
  - Include pre-deployment checks for AWS credentials and existing resources
  - Add validation steps after each component deployment
  - Include rollback capability for each component
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1_

- [ ] 5.2 Create verification script
  - Write verify-security-cost-setup.sh to check all components are active
  - Verify AWS Budgets and Cost Anomaly Detection are configured
  - Check Security Hub and GuardDuty are enabled and collecting data
  - Confirm WAF is associated with API Gateway
  - Validate RDS backup configuration and PITR status
  - _Requirements: 1.4, 2.3, 3.4, 4.1_

- [ ] 6. Create Operational Documentation
- [ ] 6.1 Write cost monitoring guide
  - Document how to read budget reports in AWS Console
  - Explain how to investigate cost anomalies using Cost Explorer
  - Provide examples of adjusting budget thresholds
  - _Requirements: 1.3, 1.4_

- [ ] 6.2 Write security response guide
  - Document how to access and navigate Security Hub console
  - Explain severity levels and how to interpret findings
  - Provide remediation steps for common security issues
  - Include GuardDuty finding types and response procedures
  - _Requirements: 2.2, 2.4_

- [ ] 6.3 Write WAF management guide
  - Document procedure to whitelist legitimate IPs
  - Explain how to adjust rate limits for specific endpoints
  - Provide steps to review and analyze blocked requests
  - Include troubleshooting for false positives
  - _Requirements: 3.3, 3.4_

- [ ] 6.4 Write backup and recovery guide
  - Document how to verify automated backups are running
  - Provide step-by-step PITR restore procedure
  - Explain RTO/RPO expectations and limitations
  - Include monthly backup test verification steps
  - _Requirements: 4.3, 4.5_

- [ ] 7. Update SAM Template with New Resources
- [ ] 7.1 Add cost monitoring resources to template
  - Add AWS::Budgets::Budget resource with configured thresholds
  - Add AWS::CE::AnomalyMonitor and AWS::CE::AnomalySubscription resources
  - Update SNS topic to include cost alert subscriptions
  - _Requirements: 1.1, 1.2_

- [ ] 7.2 Add WAF resources to template
  - Add AWS::WAFv2::WebACL resource with all configured rules
  - Add AWS::WAFv2::WebACLAssociation for API Gateway
  - Add CloudWatch alarms for WAF metrics
  - _Requirements: 3.1, 3.2_

- [ ] 7.3 Add backup testing resources to template
  - Add Lambda function resource for backup testing
  - Add EventBridge rule for monthly schedule
  - Add IAM role with RDS snapshot permissions
  - Add Lambda permission for EventBridge invocation
  - _Requirements: 4.4_

- [ ] 7.4 Update CloudWatch dashboard
  - Add cost monitoring widgets (current spend, forecast, anomalies)
  - Add security widgets (compliance score, findings count)
  - Add WAF widgets (blocked requests, top IPs)
  - Add backup widgets (last backup time, test status)
  - _Requirements: 1.4, 2.3, 3.4_

- [ ] 8. Create Quick Start Guide
  - Write SECURITY_COST_OPTIMIZATION_QUICKSTART.md with deployment steps
  - Include prerequisites and AWS credentials setup
  - Provide estimated deployment time for each phase (30-120 min)
  - Add verification checklist for post-deployment
  - Include cost breakdown and ROI expectations
  - Add links to detailed operational guides
  - _Requirements: 1.1, 2.1, 3.1, 4.1_
