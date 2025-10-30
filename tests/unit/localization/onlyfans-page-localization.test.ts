/**
 * Unit Tests - OnlyFans Page Localization
 * 
 * Tests to validate that the OnlyFans connection page is fully in English
 * Based on: .kiro/specs/french-to-english-localization/requirements.md (Requirement 2)
 * 
 * Coverage:
 * - Page title is in English
 * - Form labels and placeholders are in English
 * - Error messages are in English
 * - Success messages are in English
 * - Instructions are in English
 * - Button labels are in English
 * - No French text remains
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('OnlyFans Connection Page - Localization', () => {
  let pageContent: string;

  beforeAll(() => {
    const pagePath = join(process.cwd(), 'app/platforms/connect/onlyfans/page.tsx');
    pageContent = readFileSync(pagePath, 'utf-8');
  });

  describe('Requirement 2.1 - Page Title', () => {
    it('should display "Connect OnlyFans" in English', () => {
      expect(pageContent).toContain('Connect OnlyFans');
    });

    it('should NOT contain French title "Connecter OnlyFans"', () => {
      expect(pageContent).not.toContain('Connecter OnlyFans');
    });
  });

  describe('Requirement 2.2 - Instructions', () => {
    it('should display instructions in English', () => {
      expect(pageContent).toContain('Two options available today');
      expect(pageContent).toContain('import an official OnlyFans CSV');
      expect(pageContent).toContain('join the waitlist for the official API');
    });

    it('should NOT contain French instructions', () => {
      expect(pageContent).not.toContain('Deux options aujourd\'hui');
      expect(pageContent).not.toContain('importer un CSV officiel');
      expect(pageContent).not.toContain('vous inscrire à la liste d\'attente');
    });

    it('should display CSV export steps in English', () => {
      expect(pageContent).toContain('Log in to OnlyFans');
      expect(pageContent).toContain('Go to Settings → Statements');
      expect(pageContent).toContain('Export your data as CSV');
      expect(pageContent).toContain('Import the file here');
    });

    it('should NOT contain French CSV export steps', () => {
      expect(pageContent).not.toContain('Allez dans Settings → Statements');
      expect(pageContent).not.toContain('Exportez vos données en CSV');
      expect(pageContent).not.toContain('Importez le fichier ici');
    });
  });

  describe('Requirement 2.3 - File Upload Prompts', () => {
    it('should display upload prompt in English', () => {
      expect(pageContent).toContain('Click to import a CSV file');
      expect(pageContent).toContain('or drag and drop here');
    });

    it('should NOT contain French upload prompts', () => {
      expect(pageContent).not.toContain('Cliquez pour importer un fichier CSV');
      expect(pageContent).not.toContain('glissez-déposez ici');
    });
  });

  describe('Requirement 2.4 - Waitlist Messages', () => {
    it('should display waitlist success message in English', () => {
      expect(pageContent).toContain('Added to OnlyFans API waitlist');
      expect(pageContent).toContain('We will contact you');
    });

    it('should NOT contain French waitlist messages', () => {
      expect(pageContent).not.toContain('Inscrit à la liste d\'attente API OnlyFans');
      expect(pageContent).not.toContain('Nous vous contacterons');
    });

    it('should display waitlist button label in English', () => {
      expect(pageContent).toContain('Join API Waitlist');
      expect(pageContent).toContain('Joining…');
    });

    it('should NOT contain French waitlist button labels', () => {
      expect(pageContent).not.toContain('Rejoindre la waitlist API');
      expect(pageContent).not.toContain('Inscription…');
    });
  });

  describe('Requirement 2.5 - Error Messages', () => {
    it('should display error messages in English', () => {
      expect(pageContent).toContain('Connection failed');
      expect(pageContent).toContain('Failed to join waitlist');
      expect(pageContent).toContain('Please enter your OnlyFans username and password');
    });

    it('should NOT contain French error messages', () => {
      expect(pageContent).not.toContain('Connexion échouée');
      expect(pageContent).not.toContain('Échec de connexion');
      expect(pageContent).not.toContain('Échec de l\'inscription à la liste d\'attente');
      expect(pageContent).not.toContain('Veuillez saisir votre identifiant et mot de passe OnlyFans');
    });
  });

  describe('Form Placeholders and Labels', () => {
    it('should display form placeholders in English', () => {
      expect(pageContent).toContain('OnlyFans Username');
      expect(pageContent).toContain('OnlyFans Password');
    });

    it('should NOT contain French form placeholders', () => {
      expect(pageContent).not.toContain('Identifiant OnlyFans');
      expect(pageContent).not.toContain('Mot de passe OnlyFans');
    });
  });

  describe('Status Messages', () => {
    it('should display status messages in English', () => {
      expect(pageContent).toContain('Limited functionality');
      expect(pageContent).toContain('Currently, only CSV import is available');
      expect(pageContent).toContain('Direct connection (coming soon)');
    });

    it('should NOT contain French status messages', () => {
      expect(pageContent).not.toContain('Fonctionnalité limitée');
      expect(pageContent).not.toContain('Actuellement, seul l\'import CSV est disponible');
      expect(pageContent).not.toContain('Connexion directe (bientôt disponible)');
      expect(pageContent).not.toContain('Connexion directe (à venir)');
    });
  });

  describe('Success Messages', () => {
    it('should display success messages in English', () => {
      expect(pageContent).toContain('OnlyFans connected. Synchronization starting');
    });

    it('should NOT contain French success messages', () => {
      expect(pageContent).not.toContain('OnlyFans connecté. La synchronisation démarre');
    });
  });

  describe('Navigation Elements', () => {
    it('should display navigation in English', () => {
      expect(pageContent).toContain('Back');
    });

    it('should NOT contain French navigation', () => {
      expect(pageContent).not.toContain('Retour');
    });

    it('should display post-connection instructions in English', () => {
      expect(pageContent).toContain('After connecting, visit');
      expect(pageContent).toContain('Messages → OnlyFans');
      expect(pageContent).toContain('Sync Now');
    });

    it('should NOT contain French post-connection instructions', () => {
      expect(pageContent).not.toContain('Après connexion, consultez');
    });
  });

  describe('Button Labels', () => {
    it('should display button labels in English', () => {
      expect(pageContent).toContain('Import OF CSV');
      expect(pageContent).toContain('Join API Waitlist');
    });

    it('should NOT contain French button labels', () => {
      expect(pageContent).not.toContain('Importer CSV OF');
      expect(pageContent).not.toContain('Rejoindre la waitlist');
    });
  });

  describe('Comprehensive French Text Detection', () => {
    it('should NOT contain any French accented characters in user-facing text', () => {
      // Extract JSX content (between return statements)
      const jsxContent = pageContent.match(/return \(([\s\S]*?)\);/g)?.join('') || '';
      
      // Common French words with accents
      const frenchPatterns = [
        /\bà\b/i,
        /\bété\b/i,
        /\bêtre\b/i,
        /\bdéjà\b/i,
        /\bprès\b/i,
        /\bvoilà\b/i,
        /\bça\b/i,
      ];

      frenchPatterns.forEach(pattern => {
        expect(jsxContent).not.toMatch(pattern);
      });
    });

    it('should NOT contain common French phrases', () => {
      const frenchPhrases = [
        'Bientôt disponible',
        'Actuellement',
        'Fonctionnalité',
        'Connexion',
        'Identifiant',
        'Mot de passe',
        'Cliquez',
        'Veuillez',
        'Échec',
        'Inscrit',
        'Nous vous',
      ];

      frenchPhrases.forEach(phrase => {
        expect(pageContent).not.toContain(phrase);
      });
    });

    it('should contain only English text in user-facing strings', () => {
      const englishPhrases = [
        'Connect OnlyFans',
        'Two options available',
        'Click to import',
        'Join API Waitlist',
        'Connection failed',
        'Added to',
        'We will contact you',
        'Limited functionality',
        'Currently, only',
        'coming soon',
      ];

      englishPhrases.forEach(phrase => {
        expect(pageContent).toContain(phrase);
      });
    });
  });

  describe('Code Quality - No French Comments', () => {
    it('should NOT contain French comments', () => {
      const frenchCommentPatterns = [
        /\/\/.*[àâäéèêëïîôùûüÿç]/i,
        /\/\*.*[àâäéèêëïîôùûüÿç].*\*\//i,
      ];

      frenchCommentPatterns.forEach(pattern => {
        expect(pageContent).not.toMatch(pattern);
      });
    });

    it('should have English comments if any', () => {
      const comments = pageContent.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || [];
      
      comments.forEach(comment => {
        // Comments should not contain French accented characters
        expect(comment).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });
  });

  describe('Accessibility - English Labels', () => {
    it('should have English aria-labels if present', () => {
      const ariaLabels = pageContent.match(/aria-label="([^"]*)"/g) || [];
      
      ariaLabels.forEach(label => {
        expect(label).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });

    it('should have English alt text if present', () => {
      const altTexts = pageContent.match(/alt="([^"]*)"/g) || [];
      
      altTexts.forEach(alt => {
        expect(alt).not.toMatch(/[àâäéèêëïîôùûüÿç]/i);
      });
    });
  });

  describe('Validation - Complete English Translation', () => {
    it('should pass all localization requirements', () => {
      const requirements = {
        'Page title in English': pageContent.includes('Connect OnlyFans'),
        'Instructions in English': pageContent.includes('Two options available today'),
        'Upload prompts in English': pageContent.includes('Click to import a CSV file'),
        'Waitlist messages in English': pageContent.includes('Added to OnlyFans API waitlist'),
        'Error messages in English': pageContent.includes('Connection failed'),
        'Form placeholders in English': pageContent.includes('OnlyFans Username'),
        'Status messages in English': pageContent.includes('Limited functionality'),
        'Navigation in English': pageContent.includes('Back'),
        'No French text': !pageContent.match(/Retour|Bientôt|Actuellement|Connexion|Identifiant/),
      };

      Object.entries(requirements).forEach(([requirement, passed]) => {
        expect(passed).toBe(true);
      });
    });

    it('should have 100% English coverage in user-facing text', () => {
      // Extract all string literals from JSX
      const stringLiterals = pageContent.match(/"([^"]*?)"|'([^']*?)'/g) || [];
      
      const frenchStrings = stringLiterals.filter(str => 
        /[àâäéèêëïîôùûüÿç]/i.test(str) ||
        /\b(Retour|Bientôt|Actuellement|Connexion|Identifiant|Échec|Inscrit)\b/i.test(str)
      );

      expect(frenchStrings).toHaveLength(0);
    });
  });
});
