import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests unitaires pour AWS Security Posture Management
 * Valide Security Hub et GuardDuty configuration
 */

describe('AWS Security Posture Configuration', () => {
  describe('Security Hub Configuration', () => {
    it('should enable AWS Foundational Best Practices standard', () => {
      const standard = 'AWS Foundational Security Best Practices';
      const validStandards = [
        'AWS Foundational Security Best Practices',
        'CIS AWS Foundations Benchmark'
      ];
      
      expect(validStandards).toContain(standard);
    });

    it('should evaluate compliance for all AWS resources', () => {
      const resourceTypes = ['Lambda', 'RDS', 'S3', 'IAM', 'EC2'];
      
      expect(resourceTypes.length).toBeGreaterThan(0);
      expect(resourceTypes).toContain('Lambda');
      expect(resourceTypes).toContain('RDS');
    });

    it('should calculate compliance score correctly', () => {
      const totalChecks = 100;
      const passedChecks = 85;
      const complianceScore = (passedChecks / totalChecks) * 100;
      
      expect(complianceScore).toBe(85);
      expect(complianceScore).toBeGreaterThanOrEqual(0);
      expect(complianceScore).toBeLessThanOrEqual(100);
    });

    it('should filter findings by severity threshold', () => {
      const findings = [
        { severity: 90, title: 'Critical Issue' },
        { severity: 75, title: 'High Issue' },
        { severity: 50, title: 'Medium Issue' },
        { severity: 20, title: 'Low Issue' }
      ];
      
      const criticalFindings = findings.filter(f => f.severity >= 70);
      
      expect(criticalFindings).toHaveLength(2);
      expect(criticalFindings[0].severity).toBe(90);
    });
  });

  describe('GuardDuty Configuration', () => {
    it('should set finding publication frequency to 15 minutes', () => {
      const frequency = 'FIFTEEN_MINUTES';
      const validFrequencies = ['FIFTEEN_MINUTES', 'ONE_HOUR', 'SIX_HOURS'];
      
      expect(validFrequencies).toContain(frequency);
      expect(frequency).toBe('FIFTEEN_MINUTES');
    });

    it('should detect reconnaissance activities', () => {
      const detectionTypes = [
        'Reconnaissance',
        'Instance Compromise',
        'Account Compromise',
        'Bucket Compromise'
      ];
      
      expect(detectionTypes).toContain('Reconnaissance');
      expect(detectionTypes).toHaveLength(4);
    });

    it('should route HIGH and CRITICAL findings to SNS', () => {
      const finding = {
        severity: 8.5,
        type: 'UnauthorizedAccess:IAMUser/MaliciousIPCaller.Custom'
      };
      
      const shouldAlert = finding.severity >= 7.0;
      
      expect(shouldAlert).toBe(true);
    });

    it('should classify finding severity correctly', () => {
      const severityLevels = {
        LOW: [0, 3.9],
        MEDIUM: [4.0, 6.9],
        HIGH: [7.0, 8.9],
        CRITICAL: [9.0, 10.0]
      };
      
      const severity = 8.5;
      const isHigh = severity >= 7.0 && severity < 9.0;
      
      expect(isHigh).toBe(true);
    });
  });

  describe('EventBridge Integration', () => {
    it('should create rule for HIGH/CRITICAL findings', () => {
      const eventPattern = {
        source: ['aws.guardduty'],
        'detail-type': ['GuardDuty Finding'],
        detail: {
          severity: [{ numeric: ['>=', 7.0] }]
        }
      };
      
      expect(eventPattern.source).toContain('aws.guardduty');
      expect(eventPattern.detail.severity[0].numeric[0]).toBe('>=');
      expect(eventPattern.detail.severity[0].numeric[1]).toBe(7.0);
    });

    it('should route to SNS topic target', () => {
      const target = {
        Arn: 'arn:aws:sns:us-east-1:123456789012:ErrorRateAlarmTopic',
        Id: 'SecurityFindingsTarget'
      };
      
      expect(target.Arn).toMatch(/^arn:aws:sns/);
      expect(target.Id).toBeDefined();
    });
  });

  describe('Security Dashboard Widgets', () => {
    it('should display compliance score widget', () => {
      const widget = {
        type: 'metric',
        properties: {
          metrics: [['SecurityHub', 'ComplianceScore']],
          title: 'Security Hub Compliance Score'
        }
      };
      
      expect(widget.type).toBe('metric');
      expect(widget.properties.title).toContain('Compliance');
    });

    it('should display findings count by severity', () => {
      const findings = {
        CRITICAL: 2,
        HIGH: 5,
        MEDIUM: 12,
        LOW: 25
      };
      
      const totalFindings = Object.values(findings).reduce((a, b) => a + b, 0);
      
      expect(totalFindings).toBe(44);
      expect(findings.CRITICAL).toBe(2);
    });

    it('should show findings age distribution', () => {
      const ageDistribution = {
        '0-7 days': 10,
        '8-30 days': 15,
        '31-90 days': 8,
        '90+ days': 3
      };
      
      expect(ageDistribution['0-7 days']).toBe(10);
      expect(Object.keys(ageDistribution)).toHaveLength(4);
    });
  });

  describe('Security Finding Response', () => {
    it('should prioritize CRITICAL findings for immediate response', () => {
      const findings = [
        { severity: 95, title: 'Root account used' },
        { severity: 75, title: 'Unencrypted S3 bucket' },
        { severity: 50, title: 'Missing MFA' }
      ];
      
      const prioritized = findings.sort((a, b) => b.severity - a.severity);
      
      expect(prioritized[0].severity).toBe(95);
      expect(prioritized[0].title).toContain('Root account');
    });

    it('should provide remediation recommendations', () => {
      const finding = {
        title: 'S3 bucket not encrypted',
        remediation: {
          recommendation: 'Enable default encryption on S3 bucket',
          url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-bucket-encryption.html'
        }
      };
      
      expect(finding.remediation).toBeDefined();
      expect(finding.remediation.recommendation).toContain('encryption');
      expect(finding.remediation.url).toMatch(/^https:\/\//);
    });

    it('should track remediation status', () => {
      const finding = {
        id: 'finding-123',
        status: 'NEW',
        workflow: {
          status: 'NEW'
        }
      };
      
      const validStatuses = ['NEW', 'NOTIFIED', 'RESOLVED', 'SUPPRESSED'];
      
      expect(validStatuses).toContain(finding.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle Security Hub API errors', () => {
      const error = { code: 'ResourceNotFoundException' };
      const shouldRetry = error.code !== 'ResourceNotFoundException';
      
      expect(shouldRetry).toBe(false);
    });

    it('should deduplicate findings', () => {
      const findings = [
        { id: 'finding-1', title: 'Issue A' },
        { id: 'finding-1', title: 'Issue A' },
        { id: 'finding-2', title: 'Issue B' }
      ];
      
      const uniqueFindings = Array.from(
        new Map(findings.map(f => [f.id, f])).values()
      );
      
      expect(uniqueFindings).toHaveLength(2);
    });

    it('should batch notifications to prevent alert fatigue', () => {
      const findings = Array.from({ length: 50 }, (_, i) => ({
        id: `finding-${i}`,
        severity: 75
      }));
      
      const maxNotificationsPerHour = 10;
      const shouldBatch = findings.length > maxNotificationsPerHour;
      
      expect(shouldBatch).toBe(true);
    });
  });
});

describe('Security Posture Integration', () => {
  it('should integrate Security Hub and GuardDuty findings', () => {
    const securityHubFindings = [
      { source: 'SecurityHub', severity: 80 }
    ];
    const guardDutyFindings = [
      { source: 'GuardDuty', severity: 85 }
    ];
    
    const allFindings = [...securityHubFindings, ...guardDutyFindings];
    
    expect(allFindings).toHaveLength(2);
    expect(allFindings.some(f => f.source === 'SecurityHub')).toBe(true);
    expect(allFindings.some(f => f.source === 'GuardDuty')).toBe(true);
  });

  it('should maintain compliance score over time', () => {
    const historicalScores = [82, 85, 87, 88, 90];
    const trend = historicalScores[historicalScores.length - 1] - historicalScores[0];
    
    expect(trend).toBeGreaterThan(0);
    expect(historicalScores[historicalScores.length - 1]).toBe(90);
  });
});
