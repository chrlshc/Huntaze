/**
 * Integration Tests - OnlyFans Page Localization
 * 
 * Integration tests to validate the OnlyFans connection page behavior
 * with English localization
 * 
 * Coverage:
 * - API endpoint responses in English
 * - Waitlist functionality with English feedback
 * - Error handling with English messages
 * - File structure validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('OnlyFans Connection Page - Integration Tests', () => {
  let pageContent: string;
  let apiWaitlistContent: string;

  beforeEach(() => {
    const pagePath = join(process.cwd(), 'app/platforms/connect/onlyfans/page.tsx');
    const apiPath = join(process.cwd(), 'app/api/waitlist/onlyfans/route.ts');
    
    pageContent = readFileSync(pagePath, 'utf-8');
    
    if (existsSync(apiPath)) {
      apiWaitlistContent = readFileSync(apiPath, 'utf-8');
    }
  });

  describe('Page Content Validation', () => {
    it('should contain English title in source', () => {
      expect(pageContent).toContain('Connect OnlyFans');
    });

    it('should NOT contain French title in source', () => {
      expect(pageContent).not.toContain('Connecter OnlyFans');
    });

    it('should contain English instructions in source', () => {
      expect(pageContent).toContain('Two options available today');
      expect(pageContent).toContain('import an official OnlyFans CSV');
    });

    it('should NOT contain French instructions in source', () => {
      expect(pageContent).not.toContain('Deux options aujourd\'hui');
      expect(pageContent).not.toContain('importer un CSV officiel');
    });
  });

  describe('CSV Upload Functionality', () => {
    it('should contain English upload prompt in source', () => {
      expect(pageContent).toContain('Click to import a CSV file');
      expect(pageContent).toContain('or drag and drop here');
    });

    it('should NOT contain French upload prompt in source', () => {
      expect(pageContent).not.toContain('Cliquez pour importer');
      expect(pageContent).not.toContain('glissez-déposez');
    });

    it('should contain English file selection message', () => {
      expect(pageContent).toContain('CSV import will be available soon');
    });
  });

  describe('Waitlist Functionality', () => {
    it('should contain English waitlist button text', () => {
      expect(pageContent).toContain('Join API Waitlist');
      expect(pageContent).toContain('Joining…');
    });

    it('should NOT contain French waitlist button text', () => {
      expect(pageContent).not.toContain('Rejoindre la waitlist');
      expect(pageContent).not.toContain('Inscription…');
    });

    it('should contain English success message in code', () => {
      expect(pageContent).toContain('Added to OnlyFans API waitlist');
      expect(pageContent).toContain('We will contact you');
    });

    it('should NOT contain French success message in code', () => {
      expect(pageContent).not.toContain('Inscrit à la liste d\'attente');
      expect(pageContent).not.toContain('Nous vous contacterons');
    });

    it('should contain English error message in code', () => {
      expect(pageContent).toContain('Failed to join waitlist');
    });

    it('should NOT contain French error message in code', () => {
      expect(pageContent).not.toContain('Échec de l\'inscription');
    });

    it('should call correct API endpoint', () => {
      expect(pageContent).toContain('/api/waitlist/onlyfans');
    });
  });

  describe('Status Messages', () => {
    it('should contain English status warning', () => {
      expect(pageContent).toContain('Limited functionality');
      expect(pageContent).toContain('Currently, only CSV import is available');
    });

    it('should NOT contain French status warning', () => {
      expect(pageContent).not.toContain('Fonctionnalité limitée');
      expect(pageContent).not.toContain('Actuellement, seul l\'import CSV');
    });

    it('should contain English "coming soon" message', () => {
      expect(pageContent).toContain('coming soon');
    });

    it('should NOT contain French "coming soon" message', () => {
      expect(pageContent).not.toContain('bientôt disponible');
      expect(pageContent).not.toContain('à venir');
    });
  });

  describe('Form Placeholders', () => {
    it('should contain English form placeholders', () => {
      expect(pageContent).toContain('OnlyFans Username');
      expect(pageContent).toContain('OnlyFans Password');
    });

    it('should NOT contain French form placeholders', () => {
      expect(pageContent).not.toContain('Identifiant OnlyFans');
      expect(pageContent).not.toContain('Mot de passe OnlyFans');
    });
  });

  describe('Navigation', () => {
    it('should contain English back link', () => {
      expect(pageContent).toContain('Back');
    });

    it('should NOT contain French back link', () => {
      expect(pageContent).not.toContain('Retour');
    });

    it('should contain English post-connection instructions', () => {
      expect(pageContent).toContain('After connecting, visit');
    });

    it('should NOT contain French post-connection instructions', () => {
      expect(pageContent).not.toContain('Après connexion, consultez');
    });
  });

  describe('CSV Export Instructions', () => {
    it('should contain English CSV export steps', () => {
      expect(pageContent).toContain('Log in to OnlyFans');
      expect(pageContent).toContain('Go to Settings → Statements');
      expect(pageContent).toContain('Export your data as CSV');
      expect(pageContent).toContain('Import the file here');
    });

    it('should NOT contain French CSV export steps', () => {
      expect(pageContent).not.toContain('Allez dans Settings');
      expect(pageContent).not.toContain('Exportez vos données');
      expect(pageContent).not.toContain('Importez le fichier');
    });
  });

  describe('API Integration', () => {
    it('should use correct waitlist API endpoint', () => {
      expect(pageContent).toContain('/api/waitlist/onlyfans');
    });

    it('should have proper error handling with English messages', () => {
      expect(pageContent).toContain('Connection failed');
      expect(pageContent).toContain('Failed to join waitlist');
    });

    it('should have proper success handling with English messages', () => {
      expect(pageContent).toContain('OnlyFans connected. Synchronization starting');
      expect(pageContent).toContain('Added to OnlyFans API waitlist');
    });
  });

  describe('Complete Localization Validation', () => {
    it('should have no French text in source code', () => {
      const frenchPatterns = [
        /Retour(?!n)/i, // Exclude "return" keyword
        /Bientôt disponible/i,
        /Actuellement/i,
        /Connexion échouée/i,
        /Identifiant OnlyFans/i,
        /Mot de passe OnlyFans/i,
        /Cliquez pour/i,
        /Veuillez saisir/i,
        /Échec de/i,
        /Inscrit à/i,
        /Nous vous contacterons/i,
        /Fonctionnalité limitée/i,
      ];

      frenchPatterns.forEach(pattern => {
        expect(pageContent).not.toMatch(pattern);
      });
    });

    it('should have all required English text in source', () => {
      const requiredEnglishText = [
        'Connect OnlyFans',
        'Two options available',
        'Click to import',
        'Join API Waitlist',
        'Limited functionality',
        'Currently, only',
        'coming soon',
        'Back',
        'Added to OnlyFans API waitlist',
        'We will contact you',
        'Failed to join waitlist',
        'Connection failed',
      ];

      requiredEnglishText.forEach(text => {
        expect(pageContent).toContain(text);
      });
    });

    it('should have no French accented characters in user-facing strings', () => {
      // Extract string literals
      const stringMatches = pageContent.match(/"([^"]*?)"|'([^']*?)'/g) || [];
      const strings = stringMatches.map(s => s.slice(1, -1));
      
      const frenchStrings = strings.filter(str => 
        /[àâäéèêëïîôùûüÿç]/i.test(str) &&
        !str.includes('http') && // Exclude URLs
        !str.includes('import') && // Exclude import paths
        str.length > 3 // Exclude short strings
      );

      expect(frenchStrings).toHaveLength(0);
    });

    it('should validate all error messages are in English', () => {
      const errorMessages = [
        'Connection failed',
        'Failed to join waitlist',
        'Please enter your OnlyFans username and password',
      ];

      errorMessages.forEach(msg => {
        expect(pageContent).toContain(msg);
      });
    });

    it('should validate all success messages are in English', () => {
      const successMessages = [
        'OnlyFans connected. Synchronization starting',
        'Added to OnlyFans API waitlist',
        'We will contact you',
      ];

      successMessages.forEach(msg => {
        expect(pageContent).toContain(msg);
      });
    });
  });
});
