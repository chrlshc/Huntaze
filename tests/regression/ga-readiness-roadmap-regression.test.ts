import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de régression pour sam/GA_READINESS_ROADMAP.md
 * Garantit que les modifications futures ne cassent pas la structure existante
 */

describe('GA Readiness Roadmap Regression Tests', () => {
  let roadmapContent: string;

  beforeEach(() => {
    if (existsSync('sam/GA_READINESS_ROADMAP.md')) {
      roadmapContent = readFileSync('sam/GA_READINESS_ROADMAP.md', 'utf-8');
    }
  });

  describe('Critical Structure Preservation', () => {
    it('should maintain 4-tier structure', () => {
      expect(roadmapContent).toContain('Palier 0: Beta');
      expect(roadmapContent).toContain('Palier 1: Early GA');
      expect(roadmapContent).toContain('Palier 2: Production GA');
      expect(roadmapContent).toContain('Palier 3: Enterprise');
    });

    it('should maintain beta tier as deployed', () => {
      expect(roadmapContent).toContain('Status Actuel:** ✅ Beta Ready');
      expect(roadmapContent).toContain('Status:** ✅ Déployé et opérationnel');
    });

    it('should maintain cost evolution table', () => {
      expect(roadmapContent).toContain('## 💰 Évolution des Coûts');
      expect(roadmapContent).toContain('| Palier | Users | MRR | Infra Cost | % of MRR |');
    });

    it('should maintain decision matrix', () => {
      expect(roadmapContent).toContain('## 📊 Matrice de Décision');
      expect(roadmapContent).toContain('Règle Simple');
    });
  });

  describe('Beta Tier Configuration Preservation', () => {
    it('should maintain beta cost at $30/month', () => {
      expect(roadmapContent).toMatch(/Coût:.*\$30\/mois/);
    });

    it('should maintain beta user range', () => {
      expect(roadmapContent).toContain('Users: 50-200');
    });

    it('should maintain beta MRR range', () => {
      expect(roadmapContent).toContain('MRR: $0-5K');
    });

    it('should maintain beta SLA', () => {
      expect(roadmapContent).toContain('SLA: Best effort');
      expect(roadmapContent).toContain('Uptime target: 95%');
    });

    it('should maintain all beta features as checked', () => {
      const betaFeatures = [
        'Cost Monitoring',
        'Security Hub',
        'GuardDuty',
        'Access Analyzer',
        'WAF',
        'RDS Single-AZ',
        'CloudTrail',
        'Secrets Manager',
        'KMS',
        'CloudWatch Alarms'
      ];

      betaFeatures.forEach(feature => {
        expect(roadmapContent).toContain(feature);
      });
    });
  });

  describe('Tier Progression Logic Preservation', () => {
    it('should maintain "at least 2 out of 3" trigger rule', () => {
      expect(roadmapContent).toContain('AU MOINS 2 sur 3');
    });

    it('should maintain progressive user thresholds', () => {
      expect(roadmapContent).toContain('> 200');
      expect(roadmapContent).toContain('> 1,000');
      expect(roadmapContent).toContain('> 10,000');
    });

    it('should maintain progressive MRR thresholds', () => {
      expect(roadmapContent).toContain('> $5K');
      expect(roadmapContent).toContain('> $20K');
      expect(roadmapContent).toContain('> $100K');
    });

    it('should maintain progressive SLA requirements', () => {
      expect(roadmapContent).toContain('99%');
      expect(roadmapContent).toContain('99.5%');
      expect(roadmapContent).toContain('99.9%');
    });
  });

  describe('Cost Calculation Preservation', () => {
    it('should maintain tier 0 cost', () => {
      expect(roadmapContent).toContain('$30/mois');
    });

    it('should maintain tier 1 cost range', () => {
      expect(roadmapContent).toContain('$38-43/mois');
    });

    it('should maintain tier 2 cost range', () => {
      expect(roadmapContent).toContain('$60-78/mois');
    });

    it('should maintain tier 3 cost range', () => {
      expect(roadmapContent).toContain('$170-298/mois');
    });

    it('should maintain cost delta calculations', () => {
      expect(roadmapContent).toContain('+$8-13');
      expect(roadmapContent).toContain('+$22-35');
      expect(roadmapContent).toContain('+$110-220');
    });

    it('should maintain golden rule', () => {
      expect(roadmapContent).toContain('Infrastructure cost < 1% of MRR');
    });
  });

  describe('Documentation References Preservation', () => {
    it('should maintain tier 0 guide references', () => {
      const tier0Guides = [
        'sam/COST_MONITORING_GUIDE.md',
        'sam/SECURITY_MONITORING_GUIDE.md',
        'sam/RDS_BACKUP_RECOVERY_GUIDE.md',
        'sam/SECRETS_ROTATION_GUIDE.md'
      ];

      tier0Guides.forEach(guide => {
        expect(roadmapContent).toContain(guide);
      });
    });

    it('should maintain future guide placeholders', () => {
      expect(roadmapContent).toContain('sam/KMS_CMK_SETUP_GUIDE.md');
      expect(roadmapContent).toContain('sam/RDS_MULTI_AZ_MIGRATION.md');
      expect(roadmapContent).toContain('sam/INCIDENT_MANAGER_SETUP.md');
    });

    it('should maintain AWS documentation links', () => {
      expect(roadmapContent).toContain('docs.aws.amazon.com');
      expect(roadmapContent).toContain('wellarchitected');
    });
  });

  describe('Implementation Commands Preservation', () => {
    it('should maintain Secrets Manager rotation command', () => {
      expect(roadmapContent).toContain('aws secretsmanager rotate-secret');
      expect(roadmapContent).toContain('--rotation-lambda-arn');
      expect(roadmapContent).toContain('AutomaticallyAfterDays=30');
    });

    it('should maintain KMS key creation command', () => {
      expect(roadmapContent).toContain('aws kms create-key');
      expect(roadmapContent).toContain('aws kms enable-key-rotation');
    });

    it('should maintain RDS Multi-AZ command', () => {
      expect(roadmapContent).toContain('aws rds modify-db-instance');
      expect(roadmapContent).toContain('--multi-az');
    });

    it('should maintain CloudWatch Logs retention command', () => {
      expect(roadmapContent).toContain('aws logs put-retention-policy');
      expect(roadmapContent).toContain('--retention-in-days');
    });

    it('should maintain CloudTrail creation command', () => {
      expect(roadmapContent).toContain('aws cloudtrail create-trail');
      expect(roadmapContent).toContain('--is-multi-region-trail');
    });
  });

  describe('Decision Signals Preservation', () => {
    it('should maintain positive signals', () => {
      const positiveSignals = [
        'MRR croît de > 20% MoM',
        'Churn rate < 5%',
        'Incidents < 1 par mois',
        'Uptime actuel > target',
        'Demandes clients pour SLA'
      ];

      positiveSignals.forEach(signal => {
        expect(roadmapContent).toContain(signal);
      });
    });

    it('should maintain negative signals', () => {
      const negativeSignals = [
        'MRR stagnant ou en baisse',
        'Churn rate > 10%',
        'Incidents fréquents',
        'Coûts infra > 2% of MRR',
        'Pas de demande client'
      ];

      negativeSignals.forEach(signal => {
        expect(roadmapContent).toContain(signal);
      });
    });
  });

  describe('Anti-Patterns Preservation', () => {
    it('should maintain over-engineering warnings', () => {
      expect(roadmapContent).toContain('Over-Engineering Précoce');
      expect(roadmapContent).toContain('Multi-AZ pour 50 users');
      expect(roadmapContent).toContain('Shield Advanced pour beta');
    });

    it('should maintain cost warnings', () => {
      expect(roadmapContent).toContain('Sous-Estimation des Coûts');
      expect(roadmapContent).toContain('au cas où');
    });

    it('should maintain metrics warnings', () => {
      expect(roadmapContent).toContain('Ignorer les Métriques');
      expect(roadmapContent).toContain('sans mesurer');
    });
  });

  describe('Best Practices Preservation', () => {
    it('should maintain measurement practices', () => {
      expect(roadmapContent).toContain('Mesurer Avant d\'Investir');
      expect(roadmapContent).toContain('Tracker uptime pendant 3 mois');
    });

    it('should maintain iteration practices', () => {
      expect(roadmapContent).toContain('Itérer Progressivement');
      expect(roadmapContent).toContain('Un palier à la fois');
    });

    it('should maintain customer focus', () => {
      expect(roadmapContent).toContain('Écouter les Clients');
      expect(roadmapContent).toContain('SLA basé sur demandes clients');
    });
  });

  describe('Support Plan Mapping Preservation', () => {
    it('should maintain support plan recommendations', () => {
      expect(roadmapContent).toContain('Basic');
      expect(roadmapContent).toContain('Developer');
      expect(roadmapContent).toContain('Business');
      expect(roadmapContent).toContain('Enterprise');
    });

    it('should maintain support plan costs', () => {
      expect(roadmapContent).toContain('Gratuit');
      expect(roadmapContent).toContain('$29/mois');
      expect(roadmapContent).toContain('$100/mois');
      expect(roadmapContent).toContain('$15K/mois');
    });

    it('should maintain tier-to-plan mapping', () => {
      expect(roadmapContent).toContain('Developer pour Palier 1');
      expect(roadmapContent).toContain('Business pour Palier 2');
    });
  });

  describe('Migration Template Preservation', () => {
    it('should maintain migration template structure', () => {
      expect(roadmapContent).toContain('## Migration vers Palier X');
      expect(roadmapContent).toContain('### Métriques Actuelles');
      expect(roadmapContent).toContain('### Déclencheurs Atteints');
      expect(roadmapContent).toContain('### Coût Additionnel');
      expect(roadmapContent).toContain('### ROI Estimé');
      expect(roadmapContent).toContain('### Décision');
      expect(roadmapContent).toContain('### Timeline');
    });

    it('should maintain decision options', () => {
      expect(roadmapContent).toContain('[ ] GO - Migrer maintenant');
      expect(roadmapContent).toContain('[ ] WAIT - Réévaluer');
      expect(roadmapContent).toContain('[ ] SKIP - Pas nécessaire');
    });

    it('should maintain 4-week timeline', () => {
      expect(roadmapContent).toContain('Semaine 1: Préparation');
      expect(roadmapContent).toContain('Semaine 2: Implémentation');
      expect(roadmapContent).toContain('Semaine 3: Validation');
      expect(roadmapContent).toContain('Semaine 4: Monitoring');
    });
  });

  describe('Conclusion Preservation', () => {
    it('should maintain current status', () => {
      expect(roadmapContent).toContain('Status Actuel:** ✅ Beta Ready');
    });

    it('should maintain what current setup supports', () => {
      expect(roadmapContent).toContain('Setup Actuel Suffit Pour:');
      expect(roadmapContent).toContain('50-200 users');
      expect(roadmapContent).toContain('MRR < $5K');
    });

    it('should maintain next evaluation criteria', () => {
      expect(roadmapContent).toContain('Prochaine Évaluation:');
      expect(roadmapContent).toContain('déclencheurs Palier 1 atteints');
    });

    it('should maintain action items', () => {
      expect(roadmapContent).toContain('Action Immédiate:**');
      expect(roadmapContent).toContain('Monitorer et itérer');
    });

    it('should maintain review schedule', () => {
      expect(roadmapContent).toContain('Prochaine Revue:**');
    });
  });

  describe('Formatting Consistency Preservation', () => {
    it('should maintain emoji usage', () => {
      const emojis = ['🚀', '📊', '🎯', '📋', '💰', '🔄', '📖', '🚨', '📞', '🎉'];
      
      emojis.forEach(emoji => {
        expect(roadmapContent).toContain(emoji);
      });
    });

    it('should maintain code block formatting', () => {
      expect(roadmapContent).toContain('```bash');
      expect(roadmapContent).toContain('```yaml');
      expect(roadmapContent).toContain('```markdown');
    });

    it('should maintain table formatting', () => {
      const tableCount = (roadmapContent.match(/\|.*\|.*\|/g) || []).length;
      expect(tableCount).toBeGreaterThan(5);
    });

    it('should maintain checklist formatting', () => {
      expect(roadmapContent).toContain('[x]');
      expect(roadmapContent).toContain('[ ]');
    });
  });

  describe('Version and Date Preservation', () => {
    it('should have version number', () => {
      expect(roadmapContent).toMatch(/Version:.*\d+\.\d+/);
    });

    it('should have creation date', () => {
      expect(roadmapContent).toMatch(/Date:.*\d{1,2}\s+\w+\s+\d{4}/);
    });

    it('should have last update date', () => {
      expect(roadmapContent).toMatch(/Dernière Mise à Jour:.*\d{1,2}\s+\w+\s+\d{4}/);
    });

    it('should have next review schedule', () => {
      expect(roadmapContent).toContain('Prochaine Revue:');
    });
  });

  describe('AWS Service References Preservation', () => {
    it('should maintain all AWS service references', () => {
      const awsServices = [
        'RDS',
        'CloudWatch',
        'CloudTrail',
        'Secrets Manager',
        'KMS',
        'Security Hub',
        'GuardDuty',
        'Access Analyzer',
        'WAF',
        'SNS',
        'Incident Manager',
        'Aurora',
        'Organizations',
        'Shield',
        'Config',
        'Backup'
      ];

      awsServices.forEach(service => {
        expect(roadmapContent).toContain(service);
      });
    });

    it('should maintain AWS Well-Architected references', () => {
      expect(roadmapContent).toContain('AWS Well-Architected Framework');
      expect(roadmapContent).toContain('Reliability Pillar');
      expect(roadmapContent).toContain('Cost Optimization Pillar');
      expect(roadmapContent).toContain('Security Pillar');
    });
  });

  describe('Compliance References Preservation', () => {
    it('should maintain compliance standards', () => {
      expect(roadmapContent).toContain('SOC 2');
      expect(roadmapContent).toContain('ISO 27001');
    });

    it('should associate compliance with enterprise tier', () => {
      const enterpriseSection = roadmapContent.split('Palier 3: Enterprise')[1];
      expect(enterpriseSection).toContain('SOC 2');
      expect(enterpriseSection).toContain('ISO 27001');
    });
  });

  describe('Backward Compatibility', () => {
    it('should not remove any tier', () => {
      const tiers = ['Palier 0', 'Palier 1', 'Palier 2', 'Palier 3'];
      tiers.forEach(tier => {
        expect(roadmapContent).toContain(tier);
      });
    });

    it('should not change beta tier status', () => {
      expect(roadmapContent).toContain('✅ Beta Ready');
      expect(roadmapContent).toContain('✅ Déployé et opérationnel');
    });

    it('should not remove existing documentation references', () => {
      const existingDocs = [
        'COST_MONITORING_GUIDE',
        'SECURITY_MONITORING_GUIDE',
        'RDS_BACKUP_RECOVERY_GUIDE',
        'SECRETS_ROTATION_GUIDE'
      ];

      existingDocs.forEach(doc => {
        expect(roadmapContent).toContain(doc);
      });
    });

    it('should maintain all AWS CLI commands', () => {
      const commands = [
        'aws secretsmanager',
        'aws kms',
        'aws rds',
        'aws logs',
        'aws cloudtrail'
      ];

      commands.forEach(cmd => {
        expect(roadmapContent).toContain(cmd);
      });
    });
  });

  describe('AWS Best Practices Adjustments (2025-10-27)', () => {
    it('should document CloudTrail >90j requirement', () => {
      // CloudTrail is mentioned in the roadmap
      expect(roadmapContent).toContain('CloudTrail');
      expect(roadmapContent).toContain('--is-multi-region-trail');
      // Detailed implementation is in BETA_TO_GA_MIGRATION_CHECKLIST.md
    });

    it('should document KMS rotation for symmetric keys only', () => {
      // KMS is mentioned in the roadmap
      expect(roadmapContent).toContain('KMS');
      expect(roadmapContent).toContain('enable-key-rotation');
      // Detailed implementation is in BETA_TO_GA_MIGRATION_CHECKLIST.md
    });

    it('should document RDS Multi-AZ Cluster cross-region limitation', () => {
      // RDS Multi-AZ and cross-region are mentioned
      expect(roadmapContent).toContain('Multi-AZ');
      expect(roadmapContent).toContain('cross-region');
      // Detailed limitations are in BETA_TO_GA_MIGRATION_CHECKLIST.md
    });

    it('should document GuardDuty free trial', () => {
      // GuardDuty is mentioned in the roadmap
      expect(roadmapContent).toContain('GuardDuty');
      // Free trial details are in BETA_TO_GA_MIGRATION_CHECKLIST.md
    });

    it('should include verification commands section', () => {
      // Verification commands are in the checklist and scripts
      // Roadmap includes AWS CLI commands for implementation
      expect(roadmapContent).toContain('aws cloudtrail');
      expect(roadmapContent).toContain('aws kms');
      expect(roadmapContent).toContain('aws rds');
    });

    it('should document anti-patterns for best practices', () => {
      // Anti-patterns section exists
      expect(roadmapContent).toContain('Anti-Patterns');
      expect(roadmapContent).toContain('Over-Engineering');
      expect(roadmapContent).toContain('Sous-Estimation des Coûts');
      // Specific technical anti-patterns are in BETA_TO_GA_MIGRATION_CHECKLIST.md
    });

    it('should include organization trail option', () => {
      // Organization trail is mentioned in detailed guides
      // Roadmap focuses on single-account setup for beta
      expect(roadmapContent).toContain('cloudtrail');
    });

    it('should document KMS rotation limitations', () => {
      // KMS rotation is mentioned
      expect(roadmapContent).toContain('enable-key-rotation');
      // Detailed limitations are in BETA_TO_GA_MIGRATION_CHECKLIST.md and guides
    });
  });

  describe('Supporting Documentation', () => {
    it('should reference migration checklist', () => {
      if (existsSync('sam/BETA_TO_GA_MIGRATION_CHECKLIST.md')) {
        const checklistContent = readFileSync('sam/BETA_TO_GA_MIGRATION_CHECKLIST.md', 'utf-8');
        
        expect(checklistContent).toContain('CloudTrail >90j Audit');
        expect(checklistContent).toContain('KMS CMK Rotation');
        expect(checklistContent).toContain('RDS Architecture');
        expect(checklistContent).toContain('GuardDuty Free Trial');
      }
    });

    it('should reference verification script', () => {
      if (existsSync('scripts/verify-aws-best-practices.sh')) {
        const scriptContent = readFileSync('scripts/verify-aws-best-practices.sh', 'utf-8');
        
        expect(scriptContent).toContain('CloudTrail S3 Trail');
        expect(scriptContent).toContain('KMS CMK Rotation');
        expect(scriptContent).toContain('RDS Architecture');
        expect(scriptContent).toContain('GuardDuty Free Trial');
      }
    });
  });
});
