import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour sam/SECURITY_MONITORING_GUIDE.md
 * Vérifie la cohérence et la complétude de la documentation de sécurité
 */

describe('Security Monitoring Guide Validation', () => {
  let guideContent: string;

  beforeAll(() => {
    const guidePath = 'sam/SECURITY_MONITORING_GUIDE.md';
    if (existsSync(guidePath)) {
      guideContent = readFileSync(guidePath, 'utf-8');
    }
  });

  describe('Cost Information Validation', () => {
    it('should document free trial period for security services', () => {
      expect(guideContent).toContain('30 days FREE trial');
      expect(guideContent).toContain('30 jours gratuits');
    });

    it('should specify GuardDuty free trial details', () => {
      expect(guideContent).toContain('GuardDuty');
      expect(guideContent).toContain('30 jours gratuits par région');
    });

    it('should specify Security Hub free trial details', () => {
      expect(guideContent).toContain('Security Hub');
      expect(guideContent).toContain('30 jours gratuits');
      expect(guideContent).toContain('checks + findings');
    });

    it('should warn about automatic billing after trial', () => {
      expect(guideContent).toContain('Coût démarre automatiquement');
      expect(guideContent).toContain('après la période d\'essai');
    });

    it('should provide cost monitoring recommendations', () => {
      expect(guideContent).toContain('Cost Explorer');
      expect(guideContent).toContain('après 30j');
    });

    it('should include monthly cost estimates', () => {
      expect(guideContent).toMatch(/\$10-25\/month/);
      expect(guideContent).toContain('Security Hub');
      expect(guideContent).toContain('GuardDuty');
      expect(guideContent).toContain('Access Analyzer');
    });

    it('should document per-service pricing', () => {
      // Security Hub pricing
      expect(guideContent).toMatch(/Security Hub.*\$5-10/);
      expect(guideContent).toContain('per check');

      // GuardDuty pricing
      expect(guideContent).toMatch(/GuardDuty.*\$5-15/);
      expect(guideContent).toContain('per million events');

      // Access Analyzer pricing
      expect(guideContent).toMatch(/Access Analyzer.*\$0/);
      expect(guideContent).toContain('Free for account-level');
    });
  });

  describe('Free Trial Warning Section', () => {
    it('should have a dedicated free trial details section', () => {
      expect(guideContent).toContain('⚠️ Free Trial Details');
    });

    it('should list all services with free trials', () => {
      const freeTrialSection = guideContent.split('⚠️ Free Trial Details')[1];
      
      if (freeTrialSection) {
        expect(freeTrialSection).toContain('GuardDuty');
        expect(freeTrialSection).toContain('Security Hub');
      }
    });

    it('should provide budget planning guidance', () => {
      expect(guideContent).toContain('Affiner le budget par palier');
      expect(guideContent).toContain('avant engagement long-terme');
    });

    it('should include monitoring recommendations', () => {
      expect(guideContent).toContain('Monitoring');
      expect(guideContent).toContain('Vérifier les coûts');
    });
  });

  describe('Documentation Structure', () => {
    it('should have cost estimation table', () => {
      expect(guideContent).toContain('| Service |');
      expect(guideContent).toContain('| **Total** |');
    });

    it('should use warning emoji for important information', () => {
      expect(guideContent).toContain('⚠️');
    });

    it('should be bilingual (English/French)', () => {
      // English content
      expect(guideContent).toContain('FREE trial');
      expect(guideContent).toContain('Security Hub');
      
      // French content
      expect(guideContent).toContain('jours gratuits');
      expect(guideContent).toContain('Coût démarre automatiquement');
    });
  });

  describe('Consistency Checks', () => {
    it('should have consistent trial period across services', () => {
      const trialPeriodMatches = guideContent.match(/30\s+(days|jours)/gi);
      expect(trialPeriodMatches).toBeDefined();
      expect(trialPeriodMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('should not contain conflicting cost information', () => {
      // Should not have multiple different total cost ranges
      const totalCostMatches = guideContent.match(/\*\*Total\*\*.*\$\d+-\d+/g);
      expect(totalCostMatches).toBeDefined();
      
      if (totalCostMatches && totalCostMatches.length > 1) {
        // All should be the same
        const uniqueCosts = new Set(totalCostMatches);
        expect(uniqueCosts.size).toBe(1);
      }
    });

    it('should maintain markdown formatting', () => {
      // Check for proper table formatting
      expect(guideContent).toMatch(/\|.*\|.*\|/);
      
      // Check for proper heading formatting
      expect(guideContent).toMatch(/^#{1,6}\s+/m);
      
      // Check for proper list formatting
      expect(guideContent).toMatch(/^[-*]\s+/m);
    });
  });

  describe('Regression Prevention', () => {
    it('should not remove critical cost information', () => {
      // Ensure key cost information is still present
      expect(guideContent).toContain('Security Hub');
      expect(guideContent).toContain('GuardDuty');
      expect(guideContent).toContain('Access Analyzer');
      expect(guideContent).toContain('$10-25/month');
    });

    it('should maintain support section', () => {
      expect(guideContent).toContain('Support');
      expect(guideContent).toContain('Documentation AWS');
    });

    it('should keep all service pricing details', () => {
      expect(guideContent).toContain('per check');
      expect(guideContent).toContain('per million events');
      expect(guideContent).toContain('Free for account-level');
    });
  });

  describe('User Experience', () => {
    it('should provide actionable guidance', () => {
      expect(guideContent).toContain('Utile pour');
      expect(guideContent).toContain('Vérifier');
    });

    it('should highlight important warnings', () => {
      const warningCount = (guideContent.match(/⚠️/g) || []).length;
      expect(warningCount).toBeGreaterThanOrEqual(2);
    });

    it('should include time-based recommendations', () => {
      expect(guideContent).toContain('après 30j');
      expect(guideContent).toContain('30 jours');
    });
  });
});
