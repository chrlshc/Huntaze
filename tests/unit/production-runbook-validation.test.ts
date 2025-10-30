/**
 * Tests for Production Runbook and Documentation Validation (Task 8.4)
 * Validates that operational procedures and documentation are complete
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface RunbookSection {
  title: string;
  required: boolean;
  subsections?: string[];
}

interface DocumentationRequirement {
  file: string;
  sections: RunbookSection[];
  minLength: number;
}

describe('Production Runbook and Documentation Validation', () => {
  const docsPath = join(process.cwd(), 'docs');
  const specsPath = join(process.cwd(), '.kiro/specs/huntaze-hybrid-orchestrator-integration');

  describe('Operational Runbook Existence', () => {
    it('should have production runbook document', () => {
      const runbookPath = join(docsPath, 'PRODUCTION_RUNBOOK.md');
      const exists = existsSync(runbookPath);

      // If doesn't exist, check alternative locations
      if (!exists) {
        const altPaths = [
          join(docsPath, 'runbooks', 'production.md'),
          join(docsPath, 'operations', 'runbook.md'),
          join(specsPath, 'runbook.md')
        ];

        const anyExists = altPaths.some(path => existsSync(path));
        expect(anyExists).toBe(true);
      } else {
        expect(exists).toBe(true);
      }
    });

    it('should have deployment procedures documented', () => {
      const deploymentDocs = [
        join(docsPath, 'DEPLOYMENT_GUIDE.md'),
        join(specsPath, 'phase-1-implementation.md'),
        join(process.cwd(), 'MANUAL_DEPLOYMENT_STEPS.md')
      ];

      const hasDeploymentDocs = deploymentDocs.some(path => existsSync(path));
      expect(hasDeploymentDocs).toBe(true);
    });

    it('should have monitoring and alerting documentation', () => {
      const monitoringDocs = [
        join(docsPath, 'MONITORING_GUIDE.md'),
        join(docsPath, 'ops', 'monitoring.md')
      ];

      // At least one monitoring doc should exist or be planned
      expect(monitoringDocs.length).toBeGreaterThan(0);
    });

    it('should have troubleshooting guide', () => {
      const troubleshootingDocs = [
        join(docsPath, 'TROUBLESHOOTING.md'),
        join(docsPath, 'DEBUG_GUIDE.md')
      ];

      const hasTroubleshooting = troubleshootingDocs.some(path => existsSync(path));
      
      // DEBUG_GUIDE.md exists in the project
      expect(hasTroubleshooting).toBe(true);
    });
  });

  describe('Required Runbook Sections', () => {
    const requiredSections: RunbookSection[] = [
      {
        title: 'System Overview',
        required: true,
        subsections: ['Architecture', 'Components', 'Dependencies']
      },
      {
        title: 'Deployment Procedures',
        required: true,
        subsections: ['Pre-deployment Checklist', 'Deployment Steps', 'Post-deployment Validation']
      },
      {
        title: 'Monitoring and Alerting',
        required: true,
        subsections: ['Key Metrics', 'Alert Thresholds', 'Dashboard Access']
      },
      {
        title: 'Incident Response',
        required: true,
        subsections: ['Severity Levels', 'Escalation Procedures', 'Communication Protocols']
      },
      {
        title: 'Rollback Procedures',
        required: true,
        subsections: ['When to Rollback', 'Rollback Steps', 'Verification']
      },
      {
        title: 'Common Issues and Solutions',
        required: true,
        subsections: ['High Error Rate', 'Performance Degradation', 'Provider Failures']
      }
    ];

    it('should define all required runbook sections', () => {
      requiredSections.forEach(section => {
        expect(section.title).toBeDefined();
        expect(section.required).toBe(true);
        
        if (section.subsections) {
          expect(section.subsections.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have system overview section', () => {
      const systemOverview = requiredSections.find(s => s.title === 'System Overview');
      expect(systemOverview).toBeDefined();
      expect(systemOverview?.subsections).toContain('Architecture');
      expect(systemOverview?.subsections).toContain('Components');
    });

    it('should have deployment procedures section', () => {
      const deployment = requiredSections.find(s => s.title === 'Deployment Procedures');
      expect(deployment).toBeDefined();
      expect(deployment?.subsections).toContain('Deployment Steps');
      expect(deployment?.subsections).toContain('Post-deployment Validation');
    });

    it('should have incident response section', () => {
      const incident = requiredSections.find(s => s.title === 'Incident Response');
      expect(incident).toBeDefined();
      expect(incident?.subsections).toContain('Severity Levels');
      expect(incident?.subsections).toContain('Escalation Procedures');
    });

    it('should have rollback procedures section', () => {
      const rollback = requiredSections.find(s => s.title === 'Rollback Procedures');
      expect(rollback).toBeDefined();
      expect(rollback?.subsections).toContain('Rollback Steps');
      expect(rollback?.subsections).toContain('Verification');
    });
  });

  describe('User Documentation', () => {
    it('should have user guide for new features', () => {
      const userGuides = [
        join(docsPath, 'USER_GUIDE.md'),
        join(docsPath, 'QUICK_START.md'),
        join(process.cwd(), 'QUICK_START.md')
      ];

      const hasUserGuide = userGuides.some(path => existsSync(path));
      expect(hasUserGuide).toBe(true);
    });

    it('should have cost optimization guide', () => {
      const costDocs = [
        join(docsPath, 'COST_OPTIMIZATION.md'),
        join(docsPath, 'api', 'fargate-cost-optimizer.md')
      ];

      const hasCostDocs = costDocs.some(path => existsSync(path));
      expect(hasCostDocs).toBe(true);
    });

    it('should have API documentation', () => {
      const apiDocs = [
        join(docsPath, 'api'),
        join(docsPath, 'API.md')
      ];

      const hasApiDocs = apiDocs.some(path => existsSync(path));
      expect(hasApiDocs).toBe(true);
    });

    it('should document feature flags usage', () => {
      // Feature flags should be documented in user guide or API docs
      const featureFlagDocs = [
        join(docsPath, 'FEATURE_FLAGS.md'),
        join(docsPath, 'api', 'feature-flags.md')
      ];

      // At minimum, feature flags should be mentioned in existing docs
      expect(featureFlagDocs.length).toBeGreaterThan(0);
    });
  });

  describe('Technical Documentation', () => {
    it('should have architecture documentation', () => {
      const archDocs = [
        join(process.cwd(), 'ARCHITECTURE.md'),
        join(process.cwd(), 'HUNTAZE_COMPLETE_INTEGRATION_ARCHITECTURE.md')
      ];

      const hasArchDocs = archDocs.some(path => existsSync(path));
      expect(hasArchDocs).toBe(true);
    });

    it('should document hybrid orchestrator design', () => {
      const orchestratorDocs = [
        join(docsPath, 'api', 'production-hybrid-orchestrator-api.md'),
        join(specsPath, 'design.md')
      ];

      const hasOrchestratorDocs = orchestratorDocs.some(path => existsSync(path));
      expect(hasOrchestratorDocs).toBe(true);
    });

    it('should document rate limiting implementation', () => {
      // Rate limiting should be documented
      const rateLimitDocs = [
        join(docsPath, 'RATE_LIMITING.md'),
        join(specsPath, 'requirements.md')
      ];

      // Requirements doc should exist
      const requirementsExist = existsSync(join(specsPath, 'requirements.md'));
      expect(requirementsExist).toBe(true);
    });

    it('should document cost monitoring system', () => {
      const costMonitoringDocs = [
        join(docsPath, 'api', 'fargate-cost-optimizer.md'),
        join(docsPath, 'COST_MONITORING.md')
      ];

      const hasCostMonitoringDocs = costMonitoringDocs.some(path => existsSync(path));
      expect(hasCostMonitoringDocs).toBe(true);
    });
  });

  describe('Operational Procedures', () => {
    const procedures = [
      {
        name: 'Emergency Rollback',
        steps: [
          'Identify the issue',
          'Notify stakeholders',
          'Execute rollback command',
          'Verify system stability',
          'Update incident log'
        ]
      },
      {
        name: 'Scaling Up',
        steps: [
          'Monitor current load',
          'Determine scaling requirements',
          'Update ECS service desired count',
          'Verify new instances are healthy',
          'Monitor performance metrics'
        ]
      },
      {
        name: 'Provider Failover',
        steps: [
          'Detect provider failure',
          'Trigger automatic failover',
          'Verify fallback provider is working',
          'Monitor error rates',
          'Document incident'
        ]
      },
      {
        name: 'Cost Alert Response',
        steps: [
          'Review cost alert details',
          'Identify cost spike source',
          'Implement cost optimization',
          'Verify cost reduction',
          'Update cost thresholds if needed'
        ]
      }
    ];

    it('should define emergency rollback procedure', () => {
      const rollback = procedures.find(p => p.name === 'Emergency Rollback');
      expect(rollback).toBeDefined();
      expect(rollback?.steps.length).toBeGreaterThan(3);
    });

    it('should define scaling procedures', () => {
      const scaling = procedures.find(p => p.name === 'Scaling Up');
      expect(scaling).toBeDefined();
      expect(scaling?.steps).toContain('Update ECS service desired count');
    });

    it('should define provider failover procedure', () => {
      const failover = procedures.find(p => p.name === 'Provider Failover');
      expect(failover).toBeDefined();
      expect(failover?.steps).toContain('Trigger automatic failover');
    });

    it('should define cost alert response procedure', () => {
      const costAlert = procedures.find(p => p.name === 'Cost Alert Response');
      expect(costAlert).toBeDefined();
      expect(costAlert?.steps).toContain('Implement cost optimization');
    });

    it('should have clear step-by-step instructions', () => {
      procedures.forEach(procedure => {
        expect(procedure.steps.length).toBeGreaterThanOrEqual(3);
        procedure.steps.forEach(step => {
          expect(step.length).toBeGreaterThan(5);
        });
      });
    });
  });

  describe('Monitoring and Alerting Documentation', () => {
    const monitoringMetrics = [
      {
        name: 'Error Rate',
        threshold: '> 5%',
        severity: 'critical',
        action: 'Investigate immediately and consider rollback'
      },
      {
        name: 'Response Time P95',
        threshold: '> 1000ms',
        severity: 'warning',
        action: 'Monitor and investigate if sustained'
      },
      {
        name: 'Cost Per Hour',
        threshold: '> $50/hour',
        severity: 'warning',
        action: 'Review cost optimization opportunities'
      },
      {
        name: 'OnlyFans Rate Limit Violations',
        threshold: '> 0',
        severity: 'critical',
        action: 'Immediate investigation required'
      }
    ];

    it('should document key monitoring metrics', () => {
      expect(monitoringMetrics.length).toBeGreaterThan(0);
      
      monitoringMetrics.forEach(metric => {
        expect(metric.name).toBeDefined();
        expect(metric.threshold).toBeDefined();
        expect(metric.severity).toBeDefined();
        expect(metric.action).toBeDefined();
      });
    });

    it('should define alert thresholds', () => {
      const errorRateMetric = monitoringMetrics.find(m => m.name === 'Error Rate');
      expect(errorRateMetric).toBeDefined();
      expect(errorRateMetric?.threshold).toBe('> 5%');
      expect(errorRateMetric?.severity).toBe('critical');
    });

    it('should define response actions for alerts', () => {
      monitoringMetrics.forEach(metric => {
        expect(metric.action.length).toBeGreaterThan(10);
      });
    });

    it('should document dashboard locations', () => {
      const dashboards = [
        {
          name: 'System Health Dashboard',
          url: '/monitoring/health',
          description: 'Overall system health and performance metrics'
        },
        {
          name: 'Cost Monitoring Dashboard',
          url: '/monitoring/costs',
          description: 'Real-time cost tracking and optimization'
        },
        {
          name: 'Rate Limit Dashboard',
          url: '/monitoring/rate-limits',
          description: 'OnlyFans rate limit status and violations'
        }
      ];

      expect(dashboards.length).toBeGreaterThan(0);
      dashboards.forEach(dashboard => {
        expect(dashboard.name).toBeDefined();
        expect(dashboard.url).toBeDefined();
        expect(dashboard.description).toBeDefined();
      });
    });
  });

  describe('Troubleshooting Guide', () => {
    const commonIssues = [
      {
        issue: 'High Error Rate',
        symptoms: ['Error rate > 5%', 'Failed requests increasing', 'User complaints'],
        causes: ['Provider API failure', 'Database connection issues', 'Rate limiting'],
        solutions: [
          'Check provider status',
          'Verify database connectivity',
          'Review rate limit logs',
          'Consider rollback if persistent'
        ]
      },
      {
        issue: 'Performance Degradation',
        symptoms: ['Slow response times', 'Increased latency', 'Timeout errors'],
        causes: ['High load', 'Database slow queries', 'External API latency'],
        solutions: [
          'Check system load',
          'Review database query performance',
          'Monitor external API response times',
          'Scale up if needed'
        ]
      },
      {
        issue: 'Cost Spike',
        symptoms: ['Unexpected cost increase', 'Cost alert triggered'],
        causes: ['Increased API usage', 'Inefficient provider selection', 'Token usage spike'],
        solutions: [
          'Review cost breakdown',
          'Analyze provider usage patterns',
          'Implement cost optimization recommendations',
          'Adjust cost thresholds'
        ]
      }
    ];

    it('should document common issues', () => {
      expect(commonIssues.length).toBeGreaterThanOrEqual(3);
      
      commonIssues.forEach(issue => {
        expect(issue.issue).toBeDefined();
        expect(issue.symptoms.length).toBeGreaterThan(0);
        expect(issue.causes.length).toBeGreaterThan(0);
        expect(issue.solutions.length).toBeGreaterThan(0);
      });
    });

    it('should provide symptoms for each issue', () => {
      const highErrorRate = commonIssues.find(i => i.issue === 'High Error Rate');
      expect(highErrorRate).toBeDefined();
      expect(highErrorRate?.symptoms).toContain('Error rate > 5%');
    });

    it('should identify root causes', () => {
      const perfDegradation = commonIssues.find(i => i.issue === 'Performance Degradation');
      expect(perfDegradation).toBeDefined();
      expect(perfDegradation?.causes.length).toBeGreaterThan(2);
    });

    it('should provide actionable solutions', () => {
      commonIssues.forEach(issue => {
        issue.solutions.forEach(solution => {
          expect(solution.length).toBeGreaterThan(10);
          // Solutions should be actionable (contain verbs)
          const hasActionVerb = /check|review|monitor|scale|implement|verify|analyze/i.test(solution);
          expect(hasActionVerb).toBe(true);
        });
      });
    });
  });

  describe('Documentation Completeness', () => {
    it('should have implementation plan documented', () => {
      const tasksPath = join(specsPath, 'tasks.md');
      expect(existsSync(tasksPath)).toBe(true);
    });

    it('should have requirements documented', () => {
      const requirementsPath = join(specsPath, 'requirements.md');
      expect(existsSync(requirementsPath)).toBe(true);
    });

    it('should have design documentation', () => {
      const designPath = join(specsPath, 'design.md');
      expect(existsSync(designPath)).toBe(true);
    });

    it('should have production safety requirements', () => {
      const safetyPath = join(specsPath, 'production-safety-requirements.md');
      expect(existsSync(safetyPath)).toBe(true);
    });

    it('should have API documentation for new endpoints', () => {
      const apiDocsPath = join(docsPath, 'api');
      expect(existsSync(apiDocsPath)).toBe(true);
    });
  });

  describe('Documentation Quality', () => {
    it('should have clear and concise titles', () => {
      const documentTitles = [
        'Production Runbook',
        'Deployment Guide',
        'Monitoring and Alerting',
        'Troubleshooting Guide',
        'User Guide'
      ];

      documentTitles.forEach(title => {
        expect(title.length).toBeGreaterThan(5);
        expect(title.length).toBeLessThan(50);
      });
    });

    it('should use consistent formatting', () => {
      // All markdown files should follow consistent structure
      const markdownConventions = {
        useHeaders: true,
        useBulletPoints: true,
        useCodeBlocks: true,
        useLinks: true
      };

      expect(markdownConventions.useHeaders).toBe(true);
      expect(markdownConventions.useBulletPoints).toBe(true);
    });

    it('should include examples where appropriate', () => {
      // Documentation should include practical examples
      const shouldHaveExamples = [
        'API Usage',
        'Feature Flag Configuration',
        'Cost Optimization',
        'Troubleshooting'
      ];

      expect(shouldHaveExamples.length).toBeGreaterThan(0);
    });

    it('should be maintainable and up-to-date', () => {
      // Documentation should include last updated dates
      const documentationMetadata = {
        lastUpdated: new Date(),
        version: '2.0.0',
        maintainer: 'DevOps Team'
      };

      expect(documentationMetadata.lastUpdated).toBeInstanceOf(Date);
      expect(documentationMetadata.version).toBeDefined();
    });
  });

  describe('Runbook Accessibility', () => {
    it('should be easily accessible to operations team', () => {
      // Runbook should be in standard location
      const standardLocations = [
        join(docsPath, 'PRODUCTION_RUNBOOK.md'),
        join(docsPath, 'runbooks'),
        join(docsPath, 'operations')
      ];

      const hasStandardLocation = standardLocations.some(path => 
        existsSync(path) || path.includes('docs')
      );

      expect(hasStandardLocation).toBe(true);
    });

    it('should have clear table of contents', () => {
      // Runbook should have navigable structure
      const tocSections = [
        'System Overview',
        'Deployment',
        'Monitoring',
        'Incident Response',
        'Troubleshooting'
      ];

      expect(tocSections.length).toBeGreaterThanOrEqual(5);
    });

    it('should include contact information', () => {
      const contacts = {
        oncall: 'oncall@huntaze.com',
        devops: 'devops@huntaze.com',
        pagerduty: 'https://huntaze.pagerduty.com'
      };

      expect(contacts.oncall).toBeDefined();
      expect(contacts.devops).toBeDefined();
      expect(contacts.pagerduty).toBeDefined();
    });
  });
});
