/**
 * Regression Tests for GPT-5 Documentation (August 2025)
 * Ensures documentation stays in sync with actual model configuration
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GPT-5 Documentation Regression Tests', () => {
  const docPath = join(process.cwd(), 'HUNTAZE_O1_CONFIGURATION.md');
  let docContent: string;

  try {
    docContent = readFileSync(docPath, 'utf-8');
  } catch (error) {
    docContent = '';
  }

  describe('Documentation Content Validation', () => {
    it('should mention GPT-5 availability in August 2025', () => {
      expect(docContent).toContain('Août 2025');
      expect(docContent).toContain('août 2025');
    });

    it('should document GPT-5 full model', () => {
      expect(docContent).toContain('GPT-5 (Full Model)');
      expect(docContent).toContain('gpt-5');
      expect(docContent).toContain('256K tokens');
      expect(docContent).toContain('1M tokens');
    });

    it('should document GPT-5 Mini model', () => {
      expect(docContent).toContain('GPT-5 Mini');
      expect(docContent).toContain('gpt-5-mini');
      expect(docContent).toContain('45-60% moins cher');
    });

    it('should document GPT-5 Nano model', () => {
      expect(docContent).toContain('GPT-5 Nano');
      expect(docContent).toContain('gpt-5-nano');
      expect(docContent).toContain('High-Throughput');
    });

    it('should mark legacy models correctly', () => {
      expect(docContent).toContain('GPT-4 Turbo');
      expect(docContent).toContain('Legacy');
      expect(docContent).toContain('remplacé par GPT-5');
    });

    it('should document availability status', () => {
      expect(docContent).toContain('✅ Disponible');
      expect(docContent).toContain('Disponibilité');
    });

    it('should document context window sizes', () => {
      expect(docContent).toContain('256K tokens');
      expect(docContent).toContain('Contexte');
    });

    it('should document use cases for each model', () => {
      expect(docContent).toContain('Idéal pour');
      expect(docContent).toContain('Raisonnement complexe');
      expect(docContent).toContain('Chat équilibré');
      expect(docContent).toContain('haute-débit');
    });

    it('should include model comparison table', () => {
      expect(docContent).toContain('Comparaison des Modèles');
      expect(docContent).toContain('Coût Relatif');
      expect(docContent).toContain('Reasoning');
    });

    it('should document relative costs', () => {
      expect(docContent).toContain('100%'); // GPT-5 baseline
      expect(docContent).toContain('40-55%'); // GPT-5 Mini
      expect(docContent).toContain('10-20%'); // GPT-5 Nano
    });

    it('should document reasoning levels', () => {
      expect(docContent).toContain('High');
      expect(docContent).toContain('Medium');
      expect(docContent).toContain('Low');
    });
  });

  describe('Model Naming Consistency', () => {
    it('should use consistent naming for GPT-5', () => {
      const gpt5Mentions = docContent.match(/gpt-5(?!-)/gi) || [];
      expect(gpt5Mentions.length).toBeGreaterThan(0);
    });

    it('should use consistent naming for GPT-5 Mini', () => {
      const gpt5MiniMentions = docContent.match(/gpt-5-mini/gi) || [];
      expect(gpt5MiniMentions.length).toBeGreaterThan(0);
    });

    it('should use consistent naming for GPT-5 Nano', () => {
      const gpt5NanoMentions = docContent.match(/gpt-5-nano/gi) || [];
      expect(gpt5NanoMentions.length).toBeGreaterThan(0);
    });

    it('should not use outdated o1 naming as primary', () => {
      // o1 should be mentioned as legacy, not as primary recommendation
      const o1InTitle = docContent.match(/^##.*o1.*$/gm) || [];
      expect(o1InTitle.length).toBe(0);
    });
  });

  describe('Use Case Documentation', () => {
    it('should document complex reasoning use cases for GPT-5', () => {
      const gpt5Section = docContent.match(/### GPT-5.*?(?=###)/s)?.[0] || '';
      expect(gpt5Section).toContain('Stratégie marketing');
      expect(gpt5Section).toContain('Analyse de données');
      expect(gpt5Section).toContain('multi-étapes');
    });

    it('should document balanced use cases for GPT-5 Mini', () => {
      const miniSection = docContent.match(/### GPT-5 Mini.*?(?=###)/s)?.[0] || '';
      expect(miniSection).toContain('contenu quotidien');
      expect(miniSection).toContain('Captions');
      expect(miniSection).toContain('chatbot');
    });

    it('should document high-throughput use cases for GPT-5 Nano', () => {
      const nanoSection = docContent.match(/### GPT-5 Nano.*?(?=###)/s)?.[0] || '';
      expect(nanoSection).toContain('haute-débit');
      expect(nanoSection).toContain('classification');
      expect(nanoSection).toContain('répétitives');
    });
  });

  describe('Cost Information', () => {
    it('should document relative cost structure', () => {
      expect(docContent).toContain('Coût Relatif');
      expect(docContent).toContain('%');
    });

    it('should indicate GPT-5 Mini is cheaper than GPT-5', () => {
      const miniCost = docContent.match(/GPT-5 Mini.*?(\d+)-(\d+)%/s);
      if (miniCost) {
        const minPercent = parseInt(miniCost[1]);
        const maxPercent = parseInt(miniCost[2]);
        expect(minPercent).toBeLessThan(100);
        expect(maxPercent).toBeLessThan(100);
      }
    });

    it('should indicate GPT-5 Nano is cheapest', () => {
      const nanoCost = docContent.match(/GPT-5 Nano.*?(\d+)-(\d+)%/s);
      if (nanoCost) {
        const minPercent = parseInt(nanoCost[1]);
        const maxPercent = parseInt(nanoCost[2]);
        expect(minPercent).toBeLessThan(50);
        expect(maxPercent).toBeLessThan(50);
      }
    });
  });

  describe('Availability Status', () => {
    it('should mark all GPT-5 models as available', () => {
      const gpt5Section = docContent.match(/### GPT-5.*?(?=###)/s)?.[0] || '';
      const miniSection = docContent.match(/### GPT-5 Mini.*?(?=###)/s)?.[0] || '';
      const nanoSection = docContent.match(/### GPT-5 Nano.*?(?=###)/s)?.[0] || '';

      expect(gpt5Section).toContain('✅');
      expect(miniSection).toContain('✅');
      expect(nanoSection).toContain('✅');
    });

    it('should indicate availability date', () => {
      expect(docContent).toContain('août 2025');
      expect(docContent).toContain('Août 2025');
    });
  });

  describe('Legacy Model Documentation', () => {
    it('should document GPT-4 Turbo as legacy', () => {
      const comparisonTable = docContent.match(/\| Modèle.*?\|.*?\n(?:\|.*?\n)+/s)?.[0] || '';
      expect(comparisonTable).toContain('GPT-4 Turbo');
      expect(comparisonTable).toContain('Legacy');
    });

    it('should document GPT-3.5 Turbo as legacy', () => {
      const comparisonTable = docContent.match(/\| Modèle.*?\|.*?\n(?:\|.*?\n)+/s)?.[0] || '';
      expect(comparisonTable).toContain('GPT-3.5 Turbo');
      expect(comparisonTable).toContain('Legacy');
    });

    it('should indicate replacement models', () => {
      expect(docContent).toContain('remplacé par GPT-5');
      expect(docContent).toContain('remplacé par GPT-5 Nano');
    });
  });

  describe('Technical Specifications', () => {
    it('should document context window for GPT-5', () => {
      const gpt5Section = docContent.match(/### GPT-5.*?(?=###)/s)?.[0] || '';
      expect(gpt5Section).toContain('256K');
      expect(gpt5Section).toContain('1M');
    });

    it('should document reasoning capabilities', () => {
      const comparisonTable = docContent.match(/\| Modèle.*?\|.*?\n(?:\|.*?\n)+/s)?.[0] || '';
      expect(comparisonTable).toContain('Reasoning');
      expect(comparisonTable).toContain('High');
      expect(comparisonTable).toContain('Medium');
      expect(comparisonTable).toContain('Low');
    });

    it('should document recommended usage', () => {
      const comparisonTable = docContent.match(/\| Modèle.*?\|.*?\n(?:\|.*?\n)+/s)?.[0] || '';
      expect(comparisonTable).toContain('Usage Recommandé');
    });
  });

  describe('Documentation Structure', () => {
    it('should have proper markdown headers', () => {
      expect(docContent).toMatch(/^## /m);
      expect(docContent).toMatch(/^### /m);
    });

    it('should have comparison table', () => {
      expect(docContent).toMatch(/\|.*\|.*\|/);
      expect(docContent).toMatch(/\|-+\|-+\|/);
    });

    it('should use bullet points for features', () => {
      expect(docContent).toMatch(/^- \*\*Nom:\*\*/m);
      expect(docContent).toMatch(/^- \*\*Usage:\*\*/m);
      expect(docContent).toMatch(/^- \*\*Idéal pour:\*\*/m);
    });
  });

  describe('Consistency Checks', () => {
    it('should not have conflicting information about availability', () => {
      const unavailableMatches = docContent.match(/❌.*GPT-5/gi) || [];
      expect(unavailableMatches.length).toBe(0);
    });

    it('should not reference future dates after August 2025', () => {
      const futureMatches = docContent.match(/septembre 2025|octobre 2025|2026/gi) || [];
      expect(futureMatches.length).toBe(0);
    });

    it('should use consistent French terminology', () => {
      // Should use French terms consistently
      expect(docContent).toContain('Disponible');
      expect(docContent).toContain('Coût');
      expect(docContent).toContain('Usage');
    });

    it('should have consistent model name formatting', () => {
      // Model names should be in code format
      expect(docContent).toMatch(/`gpt-5`/);
      expect(docContent).toMatch(/`gpt-5-mini`/);
      expect(docContent).toMatch(/`gpt-5-nano`/);
    });
  });

  describe('Completeness Checks', () => {
    it('should document all three GPT-5 variants', () => {
      expect(docContent).toContain('GPT-5 (Full Model)');
      expect(docContent).toContain('GPT-5 Mini');
      expect(docContent).toContain('GPT-5 Nano');
    });

    it('should provide use cases for each model', () => {
      const useCaseSections = docContent.match(/- \*\*Idéal pour:\*\*/g) || [];
      expect(useCaseSections.length).toBeGreaterThanOrEqual(3);
    });

    it('should include comparison with legacy models', () => {
      expect(docContent).toContain('GPT-4 Turbo');
      expect(docContent).toContain('GPT-3.5 Turbo');
    });

    it('should document cost structure', () => {
      expect(docContent).toContain('Coût');
      expect(docContent).toContain('%');
    });
  });

  describe('Date Accuracy', () => {
    it('should reference August 2025 as availability date', () => {
      expect(docContent).toMatch(/août 2025|Août 2025/);
    });

    it('should not reference outdated dates', () => {
      const outdatedMatches = docContent.match(/2024|2023|2022/g) || [];
      // Should not have many references to old years
      expect(outdatedMatches.length).toBeLessThan(5);
    });
  });

  describe('Formatting and Readability', () => {
    it('should use checkmarks for availability', () => {
      expect(docContent).toContain('✅');
    });

    it('should use proper markdown tables', () => {
      const tables = docContent.match(/\|.*\|.*\|\n\|[-:]+\|[-:]+\|/g) || [];
      expect(tables.length).toBeGreaterThan(0);
    });

    it('should have clear section headers', () => {
      expect(docContent).toMatch(/^## .*Modèles/m);
      expect(docContent).toMatch(/^### GPT-5/m);
    });

    it('should use bold for important terms', () => {
      expect(docContent).toMatch(/\*\*Nom:\*\*/);
      expect(docContent).toMatch(/\*\*Usage:\*\*/);
      expect(docContent).toMatch(/\*\*Coût:\*\*/);
    });
  });
});
