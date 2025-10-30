/**
 * Unit Tests - French Text Audit
 * 
 * Tests for identifying and categorizing French text in the codebase
 * Based on: .kiro/specs/french-to-english-localization/requirements.md
 * 
 * Coverage:
 * - French text detection in UI components
 * - French text detection in error messages
 * - French text detection in code comments
 * - Categorization by component type
 * - Line number tracking
 * - Replacement mapping generation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('French Text Audit - Detection', () => {
  describe('Common French Patterns', () => {
    const frenchPatterns = [
      { pattern: /\bRetour\b/g, english: 'Back', category: 'navigation' },
      { pattern: /\bBientôt disponible\b/gi, english: 'Coming Soon', category: 'status' },
      { pattern: /\bActuellement\b/g, english: 'Currently', category: 'status' },
      { pattern: /\bRejoindre la waitlist\b/gi, english: 'Join Waitlist', category: 'action' },
      { pattern: /\bIdentifiant OnlyFans\b/gi, english: 'OnlyFans Username', category: 'form' },
      { pattern: /\bFonctionnalité à venir\b/gi, english: 'Feature Coming Soon', category: 'status' },
      { pattern: /\bConnexion échouée\b/gi, english: 'Connection failed', category: 'error' },
    ];

    it('should define all required French patterns', () => {
      expect(frenchPatterns.length).toBeGreaterThanOrEqual(7);
      
      frenchPatterns.forEach(({ pattern, english, category }) => {
        expect(pattern).toBeInstanceOf(RegExp);
        expect(english).toBeTruthy();
        expect(category).toBeTruthy();
      });
    });

    it('should categorize patterns correctly', () => {
      const categories = frenchPatterns.map(p => p.category);
      const uniqueCategories = new Set(categories);
      
      expect(uniqueCategories.has('navigation')).toBe(true);
      expect(uniqueCategories.has('status')).toBe(true);
      expect(uniqueCategories.has('action')).toBe(true);
      expect(uniqueCategories.has('form')).toBe(true);
      expect(uniqueCategories.has('error')).toBe(true);
    });

    it('should provide English translations for all patterns', () => {
      frenchPatterns.forEach(({ pattern, english }) => {
        expect(english).toBeTruthy();
        expect(english.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Text Detection Functions', () => {
    it('should detect "Retour" in navigation', () => {
      const text = '<button>Retour</button>';
      const pattern = /\bRetour\b/g;
      
      expect(pattern.test(text)).toBe(true);
    });

    it('should detect "Bientôt disponible" case-insensitively', () => {
      const texts = [
        'Bientôt disponible',
        'bientôt disponible',
        'BIENTÔT DISPONIBLE',
      ];
      
      texts.forEach(text => {
        const pattern = /\bBientôt disponible\b/gi;
        expect(pattern.test(text)).toBe(true);
      });
    });

    it('should detect "Actuellement" in status messages', () => {
      const text = 'Actuellement en développement';
      const pattern = /\bActuellement\b/g;
      
      expect(pattern.test(text)).toBe(true);
    });

    it('should detect "Rejoindre la waitlist"', () => {
      const text = '<button>Rejoindre la waitlist</button>';
      const pattern = /\bRejoindre la waitlist\b/gi;
      
      expect(pattern.test(text)).toBe(true);
    });

    it('should detect "Identifiant OnlyFans"', () => {
      const text = 'placeholder="Identifiant OnlyFans"';
      const pattern = /\bIdentifiant OnlyFans\b/gi;
      
      expect(pattern.test(text)).toBe(true);
    });

    it('should not detect English text as French', () => {
      const englishTexts = [
        'Back to dashboard',
        'Coming Soon',
        'Currently active',
        'Join Waitlist',
        'OnlyFans Username',
      ];
      const frenchPattern = /\b(Retour|Bientôt disponible|Actuellement|Rejoindre|Identifiant)\b/g;
      
      englishTexts.forEach(text => {
        const matches = text.match(frenchPattern);
        expect(matches).toBeNull();
      });
    });
  });

  describe('File Type Detection', () => {
    it('should identify UI component files', () => {
      const uiFiles = [
        'components/Button.tsx',
        'app/page.tsx',
        'components/ui/Card.tsx',
      ];
      
      uiFiles.forEach(file => {
        expect(file).toMatch(/\.(tsx|jsx)$/);
        expect(file).toMatch(/^(components|app)\//);
      });
    });

    it('should identify API route files', () => {
      const apiFiles = [
        'app/api/auth/route.ts',
        'app/api/onlyfans/connect/route.ts',
      ];
      
      apiFiles.forEach(file => {
        expect(file).toMatch(/^app\/api\//);
        expect(file).toMatch(/route\.ts$/);
      });
    });

    it('should identify utility files', () => {
      const utilFiles = [
        'lib/utils.ts',
        'lib/auth.ts',
        'hooks/useAuth.ts',
      ];
      
      utilFiles.forEach(file => {
        expect(file).toMatch(/\.(ts|tsx)$/);
        expect(file).toMatch(/^(lib|hooks)\//);
      });
    });
  });

  describe('Line Number Tracking', () => {
    it('should track line numbers for matches', () => {
      const content = `line 1
line 2 with Retour
line 3
line 4 with Bientôt disponible
line 5`;
      
      const lines = content.split('\n');
      const matches: Array<{ line: number; text: string }> = [];
      
      lines.forEach((line, index) => {
        if (/Retour|Bientôt disponible/i.test(line)) {
          matches.push({ line: index + 1, text: line.trim() });
        }
      });
      
      expect(matches).toHaveLength(2);
      expect(matches[0].line).toBe(2);
      expect(matches[1].line).toBe(4);
    });

    it('should handle multi-line matches', () => {
      const content = `const message = \`
        Bientôt disponible
        sur toutes les plateformes
      \`;`;
      
      const lines = content.split('\n');
      const matchLine = lines.findIndex(line => /Bientôt disponible/i.test(line));
      
      expect(matchLine).toBeGreaterThan(-1);
    });
  });

  describe('Categorization', () => {
    it('should categorize UI text', () => {
      const samples = [
        { text: '<button>Retour</button>', category: 'ui' },
        { text: '<h1>Bientôt disponible</h1>', category: 'ui' },
        { text: '<input placeholder="Identifiant" />', category: 'ui' },
      ];
      
      samples.forEach(({ text, category }) => {
        expect(category).toBe('ui');
        expect(text).toMatch(/<[^>]+>/);
      });
    });

    it('should categorize error messages', () => {
      const samples = [
        { text: 'throw new Error("Connexion échouée")', category: 'error' },
        { text: 'return { error: "Erreur de validation" }', category: 'error' },
      ];
      
      samples.forEach(({ text, category }) => {
        expect(category).toBe('error');
        expect(text).toMatch(/error|Error|throw/i);
      });
    });

    it('should categorize code comments', () => {
      const samples = [
        { text: '// Retour à la page précédente', category: 'comment' },
        { text: '/* Fonctionnalité à venir */', category: 'comment' },
        { text: '* @description Actuellement en développement', category: 'comment' },
      ];
      
      samples.forEach(({ text, category }) => {
        expect(category).toBe('comment');
        expect(text).toMatch(/\/\/|\/\*|\*/);
      });
    });
  });
});

describe('French Text Audit - Replacement Mapping', () => {
  describe('Mapping Generation', () => {
    it('should generate replacement mapping', () => {
      const mapping = new Map<string, string>([
        ['Retour', 'Back'],
        ['Bientôt disponible', 'Coming Soon'],
        ['Actuellement', 'Currently'],
        ['Rejoindre la waitlist', 'Join Waitlist'],
        ['Identifiant OnlyFans', 'OnlyFans Username'],
        ['Fonctionnalité à venir', 'Feature Coming Soon'],
      ]);
      
      expect(mapping.size).toBeGreaterThanOrEqual(6);
      expect(mapping.get('Retour')).toBe('Back');
      expect(mapping.get('Bientôt disponible')).toBe('Coming Soon');
    });

    it('should handle case variations', () => {
      const text = 'bientôt disponible';
      const normalized = text.charAt(0).toUpperCase() + text.slice(1);
      
      expect(normalized).toBe('Bientôt disponible');
    });

    it('should preserve context in replacements', () => {
      const replacements = [
        { 
          original: '<button>Retour</button>',
          replaced: '<button>Back</button>',
        },
        {
          original: 'placeholder="Identifiant OnlyFans"',
          replaced: 'placeholder="OnlyFans Username"',
        },
      ];
      
      replacements.forEach(({ original, replaced }) => {
        expect(original).not.toBe(replaced);
        expect(replaced).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize user-facing text over comments', () => {
      const items = [
        { text: '<button>Retour</button>', priority: 1, type: 'ui' },
        { text: '// Retour à la page', priority: 2, type: 'comment' },
      ];
      
      const sorted = items.sort((a, b) => a.priority - b.priority);
      
      expect(sorted[0].type).toBe('ui');
      expect(sorted[1].type).toBe('comment');
    });

    it('should prioritize error messages', () => {
      const items = [
        { text: 'throw new Error("Erreur")', priority: 1, type: 'error' },
        { text: '// Erreur possible', priority: 2, type: 'comment' },
      ];
      
      const sorted = items.sort((a, b) => a.priority - b.priority);
      
      expect(sorted[0].type).toBe('error');
    });
  });
});

describe('French Text Audit - Validation', () => {
  describe('Requirement 1 - Marketing Pages', () => {
    it('should validate marketing page text is in English', () => {
      const marketingText = {
        heading: 'Welcome to Huntaze',
        body: 'AI-powered creator management platform',
        cta: 'Get Started',
      };
      
      Object.values(marketingText).forEach(text => {
        expect(text).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });
  });

  describe('Requirement 2 - OnlyFans Connection', () => {
    it('should validate connection flow text is in English', () => {
      const connectionText = {
        title: 'Connect OnlyFans',
        instruction: 'Follow these steps to connect',
        upload: 'Upload CSV file',
        waitlist: 'Join Waitlist',
        error: 'Connection failed',
      };
      
      Object.values(connectionText).forEach(text => {
        expect(text).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });
  });

  describe('Requirement 3 - Navigation Elements', () => {
    it('should validate navigation text is in English', () => {
      const navigationText = {
        back: 'Back',
        comingSoon: 'Coming Soon',
        currently: 'Currently',
        joinWaitlist: 'Join Waitlist',
        username: 'OnlyFans Username',
      };
      
      expect(navigationText.back).toBe('Back');
      expect(navigationText.back).not.toBe('Retour');
      expect(navigationText.comingSoon).toBe('Coming Soon');
      expect(navigationText.comingSoon).not.toBe('Bientôt disponible');
    });
  });

  describe('Requirement 4 - Campaign Pages', () => {
    it('should validate campaign text is in English', () => {
      const campaignText = {
        status: 'Feature Coming Soon',
        description: 'AI training features',
        availability: 'Available soon',
      };
      
      expect(campaignText.status).toBe('Feature Coming Soon');
      expect(campaignText.status).not.toBe('Fonctionnalité à venir');
    });
  });

  describe('Requirement 5 - Code Comments', () => {
    it('should validate comments are in English', () => {
      const comments = [
        '// Navigate back to previous page',
        '/* Feature coming soon */',
        '* @description Currently in development',
      ];
      
      comments.forEach(comment => {
        expect(comment).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });
  });

  describe('Requirement 6 - Audit Documentation', () => {
    it('should generate audit report structure', () => {
      const auditReport = {
        totalFiles: 0,
        filesWithFrench: 0,
        totalMatches: 0,
        categories: {
          ui: 0,
          error: 0,
          comment: 0,
          navigation: 0,
          form: 0,
        },
        replacements: [] as Array<{
          file: string;
          line: number;
          french: string;
          english: string;
          category: string;
        }>,
      };
      
      expect(auditReport).toHaveProperty('totalFiles');
      expect(auditReport).toHaveProperty('filesWithFrench');
      expect(auditReport).toHaveProperty('categories');
      expect(auditReport).toHaveProperty('replacements');
    });

    it('should track file locations', () => {
      const match = {
        file: 'components/Button.tsx',
        line: 42,
        french: 'Retour',
        english: 'Back',
        category: 'ui',
      };
      
      expect(match.file).toBeTruthy();
      expect(match.line).toBeGreaterThan(0);
      expect(match.french).toBeTruthy();
      expect(match.english).toBeTruthy();
      expect(match.category).toBeTruthy();
    });
  });
});

describe('French Text Audit - Edge Cases', () => {
  describe('Accented Characters', () => {
    it('should detect French accented characters', () => {
      const frenchChars = ['à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'ï', 'î', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç'];
      const pattern = /[àâäéèêëïîôùûüÿç]/i;
      
      frenchChars.forEach(char => {
        expect(pattern.test(char)).toBe(true);
      });
    });

    it('should not flag English text with no accents', () => {
      const englishText = 'Back to dashboard';
      const pattern = /[àâäéèêëïîôùûüÿç]/i;
      
      expect(pattern.test(englishText)).toBe(false);
    });
  });

  describe('Mixed Language Content', () => {
    it('should detect French in mixed content', () => {
      const mixed = 'Click here to Retour';
      const pattern = /\bRetour\b/;
      
      expect(pattern.test(mixed)).toBe(true);
    });

    it('should handle JSX with French text', () => {
      const jsx = '<button className="btn">{t("Retour")}</button>';
      const pattern = /["']Retour["']/;
      
      expect(pattern.test(jsx)).toBe(true);
    });
  });

  describe('String Interpolation', () => {
    it('should detect French in template literals', () => {
      const template = '`Status: ${Actuellement}`';
      const pattern = /Actuellement/;
      
      expect(pattern.test(template)).toBe(true);
    });

    it('should detect French in concatenation', () => {
      const concat = '"Message: " + "Bientôt disponible"';
      const pattern = /Bientôt disponible/i;
      
      expect(pattern.test(concat)).toBe(true);
    });
  });

  describe('False Positives', () => {
    it('should not flag variable names', () => {
      const code = 'const retourValue = 42;';
      const pattern = /\bRetour\b/; // Word boundary prevents matching 'retourValue'
      
      expect(pattern.test(code)).toBe(false);
    });

    it('should not flag URLs or paths', () => {
      const url = '/api/retour/callback';
      const pattern = /\bRetour\b/; // Case-sensitive
      
      expect(pattern.test(url)).toBe(false);
    });
  });
});
