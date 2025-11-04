/**
 * Tests unitaires pour le validateur d'hydratation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HydrationValidator } from '@/lib/validation/hydrationValidator';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('HydrationValidator', () => {
  let validator: HydrationValidator;
  let testDir: string;

  beforeEach(() => {
    validator = new HydrationValidator();
    testDir = join(process.cwd(), 'test-temp');
    
    // Créer le répertoire de test
    try {
      mkdirSync(testDir, { recursive: true });
    } catch (error) {
      // Le répertoire existe déjà
    }
  });

  afterEach(() => {
    // Nettoyer le répertoire de test
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  });

  describe('validateFile', () => {
    it('should detect unsafe Date usage', async () => {
      const testFile = join(testDir, 'unsafe-date.tsx');
      const content = `
        import React from 'react';
        
        export function UnsafeComponent() {
          const now = new Date();
          return <div>{now.toString()}</div>;
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('unsafe-pattern');
      expect(issues[0].severity).toBe('error');
      expect(issues[0].message).toContain('new Date()');
    });

    it('should detect unsafe Math.random usage', async () => {
      const testFile = join(testDir, 'unsafe-random.tsx');
      const content = `
        import React from 'react';
        
        export function RandomComponent() {
          const randomValue = Math.random();
          return <div>{randomValue}</div>;
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('unsafe-pattern');
      expect(issues[0].message).toContain('Math.random()');
    });

    it('should detect unsafe window access', async () => {
      const testFile = join(testDir, 'unsafe-window.tsx');
      const content = `
        import React from 'react';
        
        export function WindowComponent() {
          const width = window.innerWidth;
          return <div>Width: {width}</div>;
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('client-only-api');
      expect(issues[0].message).toContain('window');
    });

    it('should detect unsafe document access', async () => {
      const testFile = join(testDir, 'unsafe-document.tsx');
      const content = `
        import React from 'react';
        
        export function DocumentComponent() {
          const title = document.title;
          return <div>{title}</div>;
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('client-only-api');
      expect(issues[0].message).toContain('document');
    });

    it('should detect dynamic React keys', async () => {
      const testFile = join(testDir, 'dynamic-keys.tsx');
      const content = `
        import React from 'react';
        
        export function DynamicKeysComponent() {
          return (
            <div>
              <span key={Math.random()}>Item 1</span>
              <span key={Date.now()}>Item 2</span>
            </div>
          );
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      expect(issues.length).toBeGreaterThanOrEqual(2);
      expect(issues.some(i => i.type === 'dynamic-content')).toBe(true);
    });

    it('should not flag safe hydration patterns', async () => {
      const testFile = join(testDir, 'safe-component.tsx');
      const content = `
        import React from 'react';
        import { SafeDateRenderer, SafeRandomContent, SafeBrowserAPI } from '@/components/hydration';
        
        export function SafeComponent() {
          return (
            <div>
              <SafeDateRenderer date={new Date()} format="year" />
              <SafeRandomContent seed="test">
                {(value) => <span>{value}</span>}
              </SafeRandomContent>
              <SafeBrowserAPI>
                {(api) => <div>Width: {api.window?.innerWidth}</div>}
              </SafeBrowserAPI>
            </div>
          );
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      expect(issues).toHaveLength(0);
    });

    it('should handle non-existent files gracefully', async () => {
      const issues = await validator.validateFile('non-existent-file.tsx');
      expect(issues).toHaveLength(0);
    });
  });

  describe('generateReport', () => {
    it('should generate a proper report for successful validation', () => {
      const result = {
        passed: true,
        issues: [],
        summary: {
          totalFiles: 5,
          filesWithIssues: 0,
          errors: 0,
          warnings: 0,
          info: 0
        }
      };

      const report = validator.generateReport(result);
      
      expect(report).toContain('✅ SUCCÈS');
      expect(report).toContain('Fichiers analysés: 5');
      expect(report).toContain('Aucun problème d\'hydratation détecté');
    });

    it('should generate a proper report with issues', () => {
      const result = {
        passed: false,
        issues: [
          {
            file: 'test.tsx',
            line: 5,
            column: 10,
            type: 'unsafe-pattern' as const,
            severity: 'error' as const,
            message: 'Test error message',
            suggestion: 'Test suggestion',
            code: 'new Date()'
          }
        ],
        summary: {
          totalFiles: 1,
          filesWithIssues: 1,
          errors: 1,
          warnings: 0,
          info: 0
        }
      };

      const report = validator.generateReport(result);
      
      expect(report).toContain('❌ ÉCHEC');
      expect(report).toContain('test.tsx');
      expect(report).toContain('Test error message');
      expect(report).toContain('Test suggestion');
    });
  });

  describe('validateHydrationComponents', () => {
    it('should validate hydration-safe components', async () => {
      // Créer un faux répertoire de composants d'hydratation
      const hydrationDir = join(testDir, 'components', 'hydration');
      mkdirSync(hydrationDir, { recursive: true });

      const wrapperFile = join(hydrationDir, 'HydrationSafeWrapper.tsx');
      const wrapperContent = `
        import React from 'react';
        
        export function HydrationSafeWrapper({ children }: { children: React.ReactNode }) {
          return <div>{children}</div>;
        }
      `;
      
      writeFileSync(wrapperFile, wrapperContent);

      // Mock glob pour retourner notre fichier de test
      const originalGlob = require('glob').glob;
      jest.spyOn(require('glob'), 'glob').mockResolvedValue([wrapperFile]);

      const result = await validator.validateHydrationComponents(testDir);
      
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].message).toContain('suppressHydrationWarning');

      // Restaurer glob
      require('glob').glob = originalGlob;
    });
  });

  describe('getLineAndColumn', () => {
    it('should correctly calculate line and column positions', () => {
      const content = 'line 1\nline 2\nline 3 with error here';
      const errorIndex = content.indexOf('error');
      
      // Utiliser une méthode publique ou tester indirectement
      // Ici on teste via validateFile qui utilise getLineAndColumn
      const testFile = join(testDir, 'position-test.tsx');
      writeFileSync(testFile, `
import React from 'react';

export function Component() {
  const date = new Date(); // Cette ligne devrait être détectée
  return <div>{date.toString()}</div>;
}
      `);

      return validator.validateFile(testFile).then(issues => {
        expect(issues).toHaveLength(1);
        expect(issues[0].line).toBe(5); // La ligne avec new Date()
        expect(issues[0].column).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', async () => {
      const testFile = join(testDir, 'empty.tsx');
      writeFileSync(testFile, '');
      
      const issues = await validator.validateFile(testFile);
      expect(issues).toHaveLength(0);
    });

    it('should handle files with only comments', async () => {
      const testFile = join(testDir, 'comments-only.tsx');
      writeFileSync(testFile, `
        // This is a comment
        /* This is a block comment */
        /**
         * JSDoc comment
         */
      `);
      
      const issues = await validator.validateFile(testFile);
      expect(issues).toHaveLength(0);
    });

    it('should handle complex nested patterns', async () => {
      const testFile = join(testDir, 'complex.tsx');
      const content = `
        import React from 'react';
        
        export function ComplexComponent() {
          const data = {
            timestamp: new Date(),
            random: Math.random(),
            nested: {
              windowWidth: window.innerWidth
            }
          };
          
          return (
            <div>
              {data.nested.windowWidth > 768 ? (
                <span key={Math.random()}>Desktop</span>
              ) : (
                <span key={Date.now()}>Mobile</span>
              )}
            </div>
          );
        }
      `;
      
      writeFileSync(testFile, content);
      
      const issues = await validator.validateFile(testFile);
      
      // Devrait détecter plusieurs problèmes
      expect(issues.length).toBeGreaterThan(3);
      
      const errorTypes = issues.map(i => i.type);
      expect(errorTypes).toContain('unsafe-pattern');
      expect(errorTypes).toContain('client-only-api');
      expect(errorTypes).toContain('dynamic-content');
    });
  });
});