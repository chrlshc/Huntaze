/**
 * Regression Tests for AWS Infrastructure Audit
 * Ensures audit documentation stays synchronized with actual infrastructure
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('AWS Infrastructure Audit Regression', () => {
  const auditFilePath = path.join(process.cwd(), 'AWS_INFRASTRUCTURE_AUDIT.md');

  describe('Audit Document Existence and Structure', () => {
    it('should have AWS infrastructure audit document', () => {
      expect(fs.existsSync(auditFilePath)).toBe(true);
    });

    it('should contain required sections', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('# 🔍 AUDIT INFRASTRUCTURE AWS HUNTAZE');
      expect(content).toContain('## ✅ SERVICES DÉPLOYÉS');
      expect(content).toContain('## ❌ SERVICES MANQUANTS');
      expect(content).toContain('## 🔧 ACTIONS REQUISES');
      expect(content).toContain('## 📊 COMPARAISON AVEC L\'ARCHITECTURE DOCUMENTÉE');
      expect(content).toContain('## 💰 COÛTS ACTUELS ESTIMÉS');
      expect(content).toContain('## 🎯 RÉSUMÉ');
    });

    it('should have correct AWS account and region', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('**Compte AWS:** 317805897534');
      expect(content).toContain('**Région:** us-east-1');
    });

    it('should have audit date', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toMatch(/\*\*Date:\*\* \d{1,2} \w+ \d{4}/);
    });
  });

  describe('DynamoDB Tables Documentation', () => {
    it('should document 21 existing DynamoDB tables', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      const expectedTables = [
        'HuntazeByoIpStack-AgentsTable78E0948F-18NTJYM8XGNAB',
        'HuntazeByoIpStack-CreatorLimits9110B110-AXGTWK4NL8PY',
        'HuntazeByoIpStack-JobsTable1970BC16-LS781Y2EHH3P',
        'HuntazeMediaVault-production',
        'HuntazeOfMessages',
        'HuntazeOfSessions',
        'HuntazeOfThreads',
        'NotificationMetrics-production',
        'ai_session_artifacts',
        'ai_session_messages',
        'ai_sessions',
        'huntaze-analytics-events',
        'huntaze-oauth-tokens',
        'huntaze-of-aggregates',
        'huntaze-of-messages',
        'huntaze-of-sessions',
        'huntaze-of-threads',
        'huntaze-posts',
        'huntaze-pubkeys',
        'huntaze-stripe-events',
        'huntaze-users'
      ];

      expectedTables.forEach(table => {
        expect(content).toContain(table);
      });
    });

    it('should document missing DynamoDB tables for hybrid orchestrator', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('huntaze-ai-costs-production');
      expect(content).toContain('huntaze-cost-alerts-production');
      expect(content).toContain('Purpose: Cost tracking entries');
      expect(content).toContain('Purpose: Cost alerts history');
    });
  });

  describe('SQS Queues Documentation', () => {
    it('should document existing SQS queues', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      const expectedQueues = [
        'HuntazeOfSendQueue.fifo',
        'huntaze-ai-processing-dlq',
        'huntaze-analytics',
        'huntaze-analytics-dlq',
        'huntaze-email',
        'huntaze-email-dlq',
        'huntaze-enrichment-production',
        'huntaze-notifications-production',
        'huntaze-webhooks',
        'huntaze-webhooks-dlq',
        'onlyfans-send.fifo'
      ];

      expectedQueues.forEach(queue => {
        expect(content).toContain(queue);
      });
    });

    it('should document missing SQS queues for hybrid orchestrator', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('huntaze-hybrid-workflows');
      expect(content).toContain('huntaze-rate-limiter-queue');
      expect(content).toContain('Purpose: Workflow orchestration');
      expect(content).toContain('Purpose: Rate-limited requests');
    });
  });

  describe('SNS Topics Documentation', () => {
    it('should document existing SNS topics', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      const expectedTopics = [
        'Huntaze-Milestone-production',
        'Huntaze-NewFan-production',
        'Huntaze-NewMessage-production',
        'Huntaze-NewTip-production',
        'HuntazeAgentAlerts',
        'alerts',
        'huntaze-auth-alerts',
        'huntaze-moderation-alerts-production',
        'huntaze-production-alerts',
        'ses-bounces',
        'ses-complaints'
      ];

      expectedTopics.forEach(topic => {
        expect(content).toContain(topic);
      });
    });

    it('should document missing SNS topic for cost alerts', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('huntaze-cost-alerts');
      expect(content).toContain('Purpose: Cost alert notifications');
    });
  });

  describe('ECS Infrastructure Documentation', () => {
    it('should document ECS clusters', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('ai-team');
      expect(content).toContain('huntaze-cluster');
      expect(content).toContain('huntaze-of-fargate');
    });

    it('should document active ECS services', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('huntaze-cluster/onlyfans-scraper');
    });
  });

  describe('RDS and ElastiCache Documentation', () => {
    it('should document RDS PostgreSQL instance', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('huntaze-postgres-production');
      expect(content).toContain('Status: Available');
      expect(content).toContain('Engine: PostgreSQL');
      expect(content).toContain('Class: db.t3.micro');
    });

    it('should document ElastiCache Redis cluster', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('huntaze-redis-production');
      expect(content).toContain('Status: Available');
      expect(content).toContain('Engine: Redis 7.1.0');
      expect(content).toContain('Node Type: cache.t3.micro');
    });

    it('should flag Redis encryption as disabled', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('Encryption: Disabled');
      expect(content).toContain('⚠️ à activer');
    });
  });

  describe('S3 Buckets Documentation', () => {
    it('should document S3 buckets', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      const expectedBuckets = [
        'aws-sam-cli-managed-default-samclisourcebucket',
        'cdk-hnb659fds-assets-317805897534-us-east-1',
        'huntaze-of-traces-317805897534-us-east-1',
        'huntaze-playwright-artifacts-317805897534-us-east-1'
      ];

      expectedBuckets.forEach(bucket => {
        expect(content).toContain(bucket);
      });
    });
  });

  describe('Actions Required Documentation', () => {
    it('should provide AWS CLI commands for missing resources', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('aws dynamodb create-table');
      expect(content).toContain('aws sqs create-queue');
      expect(content).toContain('aws sns create-topic');
      expect(content).toContain('aws cloudwatch put-metric-alarm');
    });

    it('should include correct table creation commands', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('--table-name huntaze-ai-costs-production');
      expect(content).toContain('--table-name huntaze-cost-alerts-production');
      expect(content).toContain('--billing-mode PAY_PER_REQUEST');
      expect(content).toContain('--region us-east-1');
    });

    it('should include correct queue creation commands', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('--queue-name huntaze-hybrid-workflows');
      expect(content).toContain('--queue-name huntaze-rate-limiter-queue');
    });

    it('should include correct topic creation command', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('--name huntaze-cost-alerts');
    });
  });

  describe('Cost Estimation Documentation', () => {
    it('should provide monthly cost estimates', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('## 💰 COÛTS ACTUELS ESTIMÉS');
      expect(content).toContain('RDS (db.t3.micro)');
      expect(content).toContain('ElastiCache (cache.t3.micro)');
      expect(content).toContain('DynamoDB (21 tables)');
      expect(content).toContain('SQS (22 queues)');
      expect(content).toContain('ECS Fargate');
      expect(content).toContain('S3 Storage');
    });

    it('should have total cost estimate', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toMatch(/\*\*TOTAL AWS\*\*.*\$\d+-\d+\/mois/);
    });
  });

  describe('Comparison Table Documentation', () => {
    it('should have comparison table with documented vs deployed', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('| Service | Documenté | Déployé | Status |');
      expect(content).toContain('| **RDS PostgreSQL** | ✅ | ✅ | OK |');
      expect(content).toContain('| **DynamoDB (base)** | ✅ | ✅ | OK (21 tables) |');
      expect(content).toContain('| **DynamoDB (cost)** | ✅ | ❌ | MANQUANT (2 tables) |');
    });
  });

  describe('Summary and Next Steps', () => {
    it('should have summary section', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('## 🎯 RÉSUMÉ');
      expect(content).toContain('### ✅ Points Forts');
      expect(content).toContain('### ⚠️ Points d\'Attention');
      expect(content).toContain('### 🚀 Prochaines Étapes');
    });

    it('should identify infrastructure completeness', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('~80% complète');
    });

    it('should list next steps', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('Créer les ressources manquantes pour l\'orchestrateur hybride');
      expect(content).toContain('Vérifier/déployer les services ECS manquants');
      expect(content).toContain('Activer l\'encryption sur Redis');
      expect(content).toContain('Configurer les CloudWatch alarms');
      expect(content).toContain('Tester l\'orchestrateur hybride end-to-end');
    });
  });

  describe('Documentation Consistency', () => {
    it('should match HUNTAZE_COMPLETE_ARCHITECTURE.md references', () => {
      const auditContent = fs.readFileSync(auditFilePath, 'utf-8');
      const archPath = path.join(process.cwd(), 'HUNTAZE_COMPLETE_ARCHITECTURE.md');

      if (fs.existsSync(archPath)) {
        const archContent = fs.readFileSync(archPath, 'utf-8');

        // Verify key infrastructure components are mentioned in both
        if (archContent.includes('huntaze-ai-costs')) {
          expect(auditContent).toContain('huntaze-ai-costs-production');
        }

        if (archContent.includes('huntaze-cost-alerts')) {
          expect(auditContent).toContain('huntaze-cost-alerts');
        }
      }
    });

    it('should reference hybrid orchestrator requirements', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('orchestrateur hybride');
      expect(content).toContain('Orchestrateur Hybride');
    });
  });

  describe('Security Considerations', () => {
    it('should flag security issues', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('Encryption: Disabled');
      expect(content).toContain('risque sécurité');
    });

    it('should include security in action items', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('Priorité 2 - Sécurité');
      expect(content).toContain('Activer l\'encryption sur Redis');
    });
  });

  describe('Monitoring and Observability', () => {
    it('should mention CloudWatch monitoring', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('CloudWatch');
      expect(content).toContain('monitoring');
      expect(content).toContain('alarms');
    });

    it('should include monitoring in priorities', () => {
      const content = fs.readFileSync(auditFilePath, 'utf-8');

      expect(content).toContain('Priorité 3 - Monitoring');
      expect(content).toContain('Créer les CloudWatch alarms');
    });
  });
});
