/**
 * Tests for WHAT_WILL_RUN.md Documentation Validation
 * Validates that the documentation accurately describes the deployment process
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('WHAT_WILL_RUN.md Documentation Validation', () => {
  let documentationContent: string;
  let deployScriptContent: string;
  let setupInfraScriptContent: string;

  beforeEach(() => {
    // Read the documentation
    const docPath = join(process.cwd(), 'WHAT_WILL_RUN.md');
    if (existsSync(docPath)) {
      documentationContent = readFileSync(docPath, 'utf-8');
    }

    // Read the deployment script
    const deployPath = join(process.cwd(), 'scripts/deploy-huntaze-hybrid.sh');
    if (existsSync(deployPath)) {
      deployScriptContent = readFileSync(deployPath, 'utf-8');
    }

    // Read the infrastructure setup script
    const infraPath = join(process.cwd(), 'scripts/setup-aws-infrastructure.sh');
    if (existsSync(infraPath)) {
      setupInfraScriptContent = readFileSync(infraPath, 'utf-8');
    }
  });

  describe('Documentation Structure', () => {
    it('should have all required sections', () => {
      expect(documentationContent).toContain('# 🔍 Ce Qui Sera Lancé - Détails Complets');
      expect(documentationContent).toContain('## 📋 Vue d\'Ensemble');
      expect(documentationContent).toContain('## 🚀 Étape par Étape');
      expect(documentationContent).toContain('## 💰 Coûts des Ressources Créées');
      expect(documentationContent).toContain('## 🔒 Permissions AWS Requises');
      expect(documentationContent).toContain('## ⚠️ Ce Qui N\'Est PAS Lancé');
      expect(documentationContent).toContain('## 🔄 Workflow Complet');
      expect(documentationContent).toContain('## 📊 Après le Script');
      expect(documentationContent).toContain('## 🎯 Prochaines Étapes Manuelles');
      expect(documentationContent).toContain('## 🆘 Si Quelque Chose Échoue');
    });

    it('should document all deployment steps', () => {
      expect(documentationContent).toContain('1️⃣ Vérification des Credentials AWS');
      expect(documentationContent).toContain('2️⃣ Création des Ressources AWS');
      expect(documentationContent).toContain('3️⃣ Génération du Fichier amplify-env-vars.txt');
      expect(documentationContent).toContain('4️⃣ Vérification Git Status');
      expect(documentationContent).toContain('5️⃣ Génération du Résumé de Déploiement');
    });

    it('should document all AWS resources', () => {
      expect(documentationContent).toContain('DynamoDB Tables (2 tables)');
      expect(documentationContent).toContain('SQS Queues (2 queues)');
      expect(documentationContent).toContain('SNS Topics (1 topic)');
    });
  });

  describe('AWS Resources Documentation', () => {
    it('should document DynamoDB table: huntaze-ai-costs-production', () => {
      expect(documentationContent).toContain('huntaze-ai-costs-production');
      expect(documentationContent).toContain('AttributeName=id,AttributeType=S');
      expect(documentationContent).toContain('AttributeName=timestamp,AttributeType=S');
      expect(documentationContent).toContain('--billing-mode PAY_PER_REQUEST');
    });

    it('should document DynamoDB table: huntaze-cost-alerts-production', () => {
      expect(documentationContent).toContain('huntaze-cost-alerts-production');
      expect(documentationContent).toContain('AttributeName=id,AttributeType=S');
    });

    it('should document SQS queue: huntaze-hybrid-workflows', () => {
      expect(documentationContent).toContain('huntaze-hybrid-workflows');
      expect(documentationContent).toContain('aws sqs create-queue');
    });

    it('should document SQS queue: huntaze-rate-limiter-queue', () => {
      expect(documentationContent).toContain('huntaze-rate-limiter-queue');
    });

    it('should document SNS topic: huntaze-cost-alerts', () => {
      expect(documentationContent).toContain('huntaze-cost-alerts');
      expect(documentationContent).toContain('aws sns create-topic');
    });

    it('should document data structures for each resource', () => {
      // DynamoDB data structure
      expect(documentationContent).toContain('"provider": "azure"');
      expect(documentationContent).toContain('"model": "gpt-4-turbo"');
      expect(documentationContent).toContain('"tokens": 1500');
      
      // Alert data structure
      expect(documentationContent).toContain('"severity": "warning"');
      expect(documentationContent).toContain('"threshold": 50');
      
      // SQS message structure
      expect(documentationContent).toContain('"workflowId"');
      expect(documentationContent).toContain('"type": "content_planning"');
    });
  });

  describe('Cost Documentation', () => {
    it('should document costs for all resources', () => {
      expect(documentationContent).toContain('DynamoDB (2 tables)');
      expect(documentationContent).toContain('~$5');
      expect(documentationContent).toContain('SQS (2 queues)');
      expect(documentationContent).toContain('~$1');
      expect(documentationContent).toContain('SNS (1 topic)');
      expect(documentationContent).toContain('~$1');
    });

    it('should document total monthly cost', () => {
      expect(documentationContent).toContain('TOTAL');
      expect(documentationContent).toContain('~$7');
    });

    it('should mention existing infrastructure costs', () => {
      expect(documentationContent).toContain('~$65/mois');
    });

    it('should provide cost breakdown details', () => {
      expect(documentationContent).toContain('$1.25/million de requêtes');
      expect(documentationContent).toContain('$0.40/million de requêtes');
      expect(documentationContent).toContain('$0.50/million de notifications');
    });
  });

  describe('Permissions Documentation', () => {
    it('should document required DynamoDB permissions', () => {
      expect(documentationContent).toContain('dynamodb:CreateTable');
      expect(documentationContent).toContain('dynamodb:DescribeTable');
    });

    it('should document required SQS permissions', () => {
      expect(documentationContent).toContain('sqs:CreateQueue');
      expect(documentationContent).toContain('sqs:GetQueueUrl');
    });

    it('should document required SNS permissions', () => {
      expect(documentationContent).toContain('sns:CreateTopic');
      expect(documentationContent).toContain('sns:GetTopicAttributes');
    });

    it('should document required STS permissions', () => {
      expect(documentationContent).toContain('sts:GetCallerIdentity');
    });
  });

  describe('Environment Variables Documentation', () => {
    it('should document all required environment variables', () => {
      expect(documentationContent).toContain('DYNAMODB_COSTS_TABLE');
      expect(documentationContent).toContain('DYNAMODB_ALERTS_TABLE');
      expect(documentationContent).toContain('SQS_WORKFLOW_QUEUE');
      expect(documentationContent).toContain('SQS_RATE_LIMITER_QUEUE');
      expect(documentationContent).toContain('COST_ALERTS_SNS_TOPIC');
    });

    it('should document feature flags', () => {
      expect(documentationContent).toContain('HYBRID_ORCHESTRATOR_ENABLED');
      expect(documentationContent).toContain('COST_MONITORING_ENABLED');
      expect(documentationContent).toContain('RATE_LIMITER_ENABLED');
    });

    it('should document AI provider variables', () => {
      expect(documentationContent).toContain('AZURE_OPENAI_API_KEY');
      expect(documentationContent).toContain('OPENAI_API_KEY');
    });

    it('should document database variables', () => {
      expect(documentationContent).toContain('DATABASE_URL');
      expect(documentationContent).toContain('REDIS_URL');
    });
  });

  describe('Workflow Documentation', () => {
    it('should document complete workflow steps', () => {
      expect(documentationContent).toContain('[1] Vérifie AWS credentials');
      expect(documentationContent).toContain('[2] Crée DynamoDB: huntaze-ai-costs-production');
      expect(documentationContent).toContain('[3] Crée DynamoDB: huntaze-cost-alerts-production');
      expect(documentationContent).toContain('[4] Crée SQS: huntaze-hybrid-workflows');
      expect(documentationContent).toContain('[5] Crée SQS: huntaze-rate-limiter-queue');
      expect(documentationContent).toContain('[6] Crée SNS: huntaze-cost-alerts');
      expect(documentationContent).toContain('[7] Génère amplify-env-vars.txt');
      expect(documentationContent).toContain('[8] Vérifie git status');
      expect(documentationContent).toContain('[9] Génère deployment-summary.md');
      expect(documentationContent).toContain('[10] Affiche les instructions finales');
    });

    it('should document workflow duration', () => {
      expect(documentationContent).toContain('~5 minutes');
    });

    it('should document workflow diagram', () => {
      expect(documentationContent).toContain('START');
      expect(documentationContent).toContain('END');
      expect(documentationContent).toMatch(/↓/);
    });
  });

  describe('What Is NOT Done Documentation', () => {
    it('should clearly state what is not modified', () => {
      expect(documentationContent).toContain('❌ **Modifier ton code existant**');
      expect(documentationContent).toContain('Aucun fichier de code n\'est modifié');
    });

    it('should state manual deployment is required', () => {
      expect(documentationContent).toContain('❌ **Déployer sur Amplify**');
      expect(documentationContent).toContain('git push origin main');
    });

    it('should state manual env var configuration is required', () => {
      expect(documentationContent).toContain('❌ **Configurer les env vars Amplify**');
      expect(documentationContent).toContain('Tu dois les copier manuellement');
    });

    it('should state no resources are deleted', () => {
      expect(documentationContent).toContain('❌ **Supprimer des ressources**');
      expect(documentationContent).toContain('Aucune ressource n\'est supprimée');
    });

    it('should state database is not modified', () => {
      expect(documentationContent).toContain('❌ **Modifier ta base de données**');
      expect(documentationContent).toContain('RDS PostgreSQL n\'est pas touché');
      expect(documentationContent).toContain('ElastiCache Redis n\'est pas touché');
    });
  });

  describe('Post-Deployment Documentation', () => {
    it('should document generated files', () => {
      expect(documentationContent).toContain('amplify-env-vars.txt');
      expect(documentationContent).toContain('deployment-summary.md');
    });

    it('should document manual steps required', () => {
      expect(documentationContent).toContain('1. Configurer Amplify (10 min)');
      expect(documentationContent).toContain('2. Déployer (2 min)');
      expect(documentationContent).toContain('3. Vérifier (3 min)');
    });

    it('should provide verification commands', () => {
      expect(documentationContent).toContain('aws dynamodb list-tables');
      expect(documentationContent).toContain('aws sqs list-queues');
      expect(documentationContent).toContain('aws sns list-topics');
    });

    it('should provide health check endpoint', () => {
      expect(documentationContent).toContain('/api/health/hybrid-orchestrator');
    });
  });

  describe('Error Handling Documentation', () => {
    it('should document "Table already exists" scenario', () => {
      expect(documentationContent).toContain('Table already exists');
      expect(documentationContent).toContain('✅ **C\'est OK !**');
    });

    it('should document "Queue already exists" scenario', () => {
      expect(documentationContent).toContain('Queue already exists');
      expect(documentationContent).toContain('✅ **C\'est OK !**');
    });

    it('should document "Permission denied" scenario', () => {
      expect(documentationContent).toContain('Permission denied');
      expect(documentationContent).toContain('❌ **Problème !**');
      expect(documentationContent).toContain('Vérifie tes permissions IAM');
    });

    it('should document "Credentials not configured" scenario', () => {
      expect(documentationContent).toContain('Credentials not configured');
      expect(documentationContent).toContain('❌ **Problème !**');
      expect(documentationContent).toContain('Exporte tes AWS credentials');
    });
  });

  describe('AWS Account Documentation', () => {
    it('should document the correct AWS account ID', () => {
      expect(documentationContent).toContain('317805897534');
    });

    it('should document the correct AWS region', () => {
      expect(documentationContent).toContain('us-east-1');
    });

    it('should document SQS queue URLs with correct format', () => {
      expect(documentationContent).toContain('https://sqs.us-east-1.amazonaws.com/317805897534/');
    });

    it('should document SNS topic ARNs with correct format', () => {
      expect(documentationContent).toContain('arn:aws:sns:us-east-1:317805897534:');
    });
  });

  describe('Command Examples', () => {
    it('should provide AWS CLI commands for DynamoDB', () => {
      expect(documentationContent).toContain('aws dynamodb create-table');
      expect(documentationContent).toContain('--table-name');
      expect(documentationContent).toContain('--attribute-definitions');
      expect(documentationContent).toContain('--key-schema');
    });

    it('should provide AWS CLI commands for SQS', () => {
      expect(documentationContent).toContain('aws sqs create-queue');
      expect(documentationContent).toContain('--queue-name');
    });

    it('should provide AWS CLI commands for SNS', () => {
      expect(documentationContent).toContain('aws sns create-topic');
      expect(documentationContent).toContain('--name');
    });

    it('should provide git commands', () => {
      expect(documentationContent).toContain('git status --porcelain');
      expect(documentationContent).toContain('git push origin main');
    });

    it('should provide verification commands', () => {
      expect(documentationContent).toContain('curl https://YOUR-URL/api/health/hybrid-orchestrator');
    });
  });

  describe('Data Examples', () => {
    it('should provide realistic data examples for DynamoDB', () => {
      expect(documentationContent).toContain('"id": "2024-10-28-azure"');
      expect(documentationContent).toContain('"timestamp": "2024-10-28T10:30:00Z"');
      expect(documentationContent).toContain('"cost": 0.045');
    });

    it('should provide realistic data examples for alerts', () => {
      expect(documentationContent).toContain('"id": "alert-2024-10-28-001"');
      expect(documentationContent).toContain('"message": "Daily cost threshold exceeded: $52.30"');
    });

    it('should provide realistic data examples for SQS messages', () => {
      expect(documentationContent).toContain('"workflowId": "wf-123"');
      expect(documentationContent).toContain('"campaignId": "camp-456"');
    });

    it('should provide realistic data examples for SNS notifications', () => {
      expect(documentationContent).toContain('"Subject": "⚠️ Huntaze Cost Alert: Daily Threshold Exceeded"');
      expect(documentationContent).toContain('"Severity": "warning"');
    });
  });

  describe('Formatting and Readability', () => {
    it('should use emojis for visual clarity', () => {
      expect(documentationContent).toMatch(/🔍|📋|🚀|💰|🔒|⚠️|🔄|📊|🎯|🆘|🔍|🎉/);
    });

    it('should use code blocks for commands', () => {
      expect(documentationContent).toContain('```bash');
      expect(documentationContent).toContain('```json');
      expect(documentationContent).toContain('```');
    });

    it('should use tables for cost breakdown', () => {
      expect(documentationContent).toContain('| Ressource | Coût/mois | Détails |');
      expect(documentationContent).toContain('|-----------|-----------|---------|');
    });

    it('should use checkmarks and crosses for clarity', () => {
      expect(documentationContent).toContain('✅');
      expect(documentationContent).toContain('❌');
    });

    it('should use numbered steps', () => {
      expect(documentationContent).toContain('1️⃣');
      expect(documentationContent).toContain('2️⃣');
      expect(documentationContent).toContain('3️⃣');
      expect(documentationContent).toContain('4️⃣');
      expect(documentationContent).toContain('5️⃣');
    });
  });

  describe('Consistency with Deployment Scripts', () => {
    it('should match resource names in deployment script', () => {
      if (deployScriptContent) {
        // Check if documentation mentions the same resources as the script
        const resourcesInDoc = [
          'huntaze-ai-costs-production',
          'huntaze-cost-alerts-production',
          'huntaze-hybrid-workflows',
          'huntaze-rate-limiter-queue',
          'huntaze-cost-alerts'
        ];

        resourcesInDoc.forEach(resource => {
          expect(documentationContent).toContain(resource);
        });
      }
    });

    it('should match AWS region in scripts', () => {
      if (deployScriptContent) {
        expect(documentationContent).toContain('us-east-1');
      }
    });

    it('should match file names generated by scripts', () => {
      expect(documentationContent).toContain('amplify-env-vars.txt');
      expect(documentationContent).toContain('deployment-summary.md');
    });
  });

  describe('Completeness', () => {
    it('should have a clear call to action', () => {
      expect(documentationContent).toContain('Ready?');
      expect(documentationContent).toContain('./scripts/deploy-huntaze-hybrid.sh');
      expect(documentationContent).toContain('🚀');
    });

    it('should provide time estimates', () => {
      expect(documentationContent).toContain('~5 minutes');
      expect(documentationContent).toContain('10 min');
      expect(documentationContent).toContain('2 min');
      expect(documentationContent).toContain('3 min');
    });

    it('should document all 5 AWS resources', () => {
      const resourceCount = (documentationContent.match(/huntaze-ai-costs-production/g) || []).length +
                           (documentationContent.match(/huntaze-cost-alerts-production/g) || []).length +
                           (documentationContent.match(/huntaze-hybrid-workflows/g) || []).length +
                           (documentationContent.match(/huntaze-rate-limiter-queue/g) || []).length +
                           (documentationContent.match(/huntaze-cost-alerts/g) || []).length;
      
      expect(resourceCount).toBeGreaterThan(10); // Each resource mentioned multiple times
    });

    it('should have summary section', () => {
      expect(documentationContent).toContain('## 🎉 Résumé');
      expect(documentationContent).toContain('5 ressources AWS');
      expect(documentationContent).toContain('~$7/mois');
    });
  });

  describe('Language and Tone', () => {
    it('should be in French', () => {
      expect(documentationContent).toContain('Étape par Étape');
      expect(documentationContent).toContain('Coûts des Ressources');
      expect(documentationContent).toContain('Prochaines Étapes');
    });

    it('should use informal "tu" form', () => {
      expect(documentationContent).toContain('tu dois');
      expect(documentationContent).toContain('tu veux');
      expect(documentationContent).toContain('tes credentials');
    });

    it('should be encouraging and clear', () => {
      expect(documentationContent).toContain('Ready?');
      expect(documentationContent).toContain('C\'est OK !');
      expect(documentationContent).toContain('Problème !');
    });
  });

  describe('Technical Accuracy', () => {
    it('should use correct AWS service names', () => {
      expect(documentationContent).toContain('DynamoDB');
      expect(documentationContent).toContain('SQS');
      expect(documentationContent).toContain('SNS');
      expect(documentationContent).toContain('Amplify');
    });

    it('should use correct billing modes', () => {
      expect(documentationContent).toContain('PAY_PER_REQUEST');
      expect(documentationContent).toContain('Pay-per-request');
    });

    it('should use correct attribute types', () => {
      expect(documentationContent).toContain('AttributeType=S');
    });

    it('should use correct key types', () => {
      expect(documentationContent).toContain('KeyType=HASH');
      expect(documentationContent).toContain('KeyType=RANGE');
    });
  });

  describe('Safety and Warnings', () => {
    it('should warn about manual steps', () => {
      expect(documentationContent).toContain('Tu dois');
      expect(documentationContent).toContain('manuellement');
    });

    it('should clarify what is not modified', () => {
      expect(documentationContent).toContain('Aucun fichier de code n\'est modifié');
      expect(documentationContent).toContain('Aucune ressource n\'est supprimée');
    });

    it('should mention existing infrastructure', () => {
      expect(documentationContent).toContain('en plus de ton infrastructure existante');
    });

    it('should provide troubleshooting section', () => {
      expect(documentationContent).toContain('🆘 Si Quelque Chose Échoue');
    });
  });
});
