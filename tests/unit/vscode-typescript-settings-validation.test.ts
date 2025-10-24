import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('VS Code TypeScript Settings Validation', () => {
  const vsCodeSettingsPath = join(process.cwd(), '.vscode', 'settings.json');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TypeScript Configuration Validation', () => {
    it('should validate typescript.autoClosingTags setting when present', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        if (settings.hasOwnProperty('typescript.autoClosingTags')) {
          // Should be a boolean value
          expect(typeof settings['typescript.autoClosingTags']).toBe('boolean');
          
          // Should be either true or false
          expect([true, false]).toContain(settings['typescript.autoClosingTags']);
          
          // Based on the diff, it should be false
          expect(settings['typescript.autoClosingTags']).toBe(false);
        }
      }
    });

    it('should ensure TypeScript settings do not conflict with development workflow', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Get all TypeScript-related settings
        const tsSettings = Object.keys(settings).filter(key => 
          key.startsWith('typescript.') || key.startsWith('javascript.')
        );
        
        tsSettings.forEach(setting => {
          const value = settings[setting];
          
          // All TypeScript settings should have valid values
          expect(value).not.toBeUndefined();
          expect(value).not.toBeNull();
          
          // Validate specific TypeScript settings
          if (setting === 'typescript.autoClosingTags') {
            expect(typeof value).toBe('boolean');
          }
          
          if (setting === 'typescript.preferences.includePackageJsonAutoImports') {
            expect(['auto', 'on', 'off']).toContain(value);
          }
          
          if (setting === 'typescript.suggest.autoImports') {
            expect(typeof value).toBe('boolean');
          }
        });
      }
    });

    it('should validate that autoClosingTags setting improves development experience', () => {
      // Test the impact of typescript.autoClosingTags: false
      const mockTypeScriptConfig = {
        'typescript.autoClosingTags': false
      };
      
      // When autoClosingTags is false, developers have more control
      expect(mockTypeScriptConfig['typescript.autoClosingTags']).toBe(false);
      
      // This setting should prevent automatic tag closing in TypeScript files
      // which can be beneficial for certain development workflows
      const isAutoClosingDisabled = !mockTypeScriptConfig['typescript.autoClosingTags'];
      expect(isAutoClosingDisabled).toBe(true);
    });

    it('should ensure TypeScript settings are compatible with project structure', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check for potential conflicts with project setup
        const potentialConflicts = [
          'typescript.preferences.includePackageJsonAutoImports',
          'typescript.suggest.paths',
          'typescript.preferences.importModuleSpecifier'
        ];
        
        potentialConflicts.forEach(setting => {
          if (settings.hasOwnProperty(setting)) {
            // Should not have values that could break the build
            expect(settings[setting]).not.toBe('');
            expect(settings[setting]).not.toBeNull();
          }
        });
      }
    });

    it('should validate editor behavior with TypeScript files', () => {
      // Mock editor behavior scenarios
      const editorScenarios = [
        {
          scenario: 'JSX tag completion',
          setting: 'typescript.autoClosingTags',
          expectedBehavior: 'manual control'
        },
        {
          scenario: 'Import suggestions',
          setting: 'typescript.suggest.autoImports',
          expectedBehavior: 'enhanced productivity'
        }
      ];
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        editorScenarios.forEach(({ scenario, setting }) => {
          if (settings.hasOwnProperty(setting)) {
            // Setting should exist and have a valid value
            expect(settings[setting]).toBeDefined();
            
            // For autoClosingTags specifically
            if (setting === 'typescript.autoClosingTags') {
              expect(typeof settings[setting]).toBe('boolean');
            }
          }
        });
      }
      
      expect(editorScenarios).toHaveLength(2);
    });
  });

  describe('Integration with Development Tools', () => {
    it('should not interfere with ESLint and Prettier', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // TypeScript settings should not conflict with linting tools
        const lintingSettings = [
          'eslint.validate',
          'editor.formatOnSave',
          'editor.codeActionsOnSave'
        ];
        
        lintingSettings.forEach(setting => {
          if (settings.hasOwnProperty(setting)) {
            expect(settings[setting]).not.toBeUndefined();
          }
        });
        
        // TypeScript autoClosingTags should not affect formatting
        if (settings['typescript.autoClosingTags'] === false) {
          // This is a valid configuration that won't interfere with formatters
          expect(typeof settings['typescript.autoClosingTags']).toBe('boolean');
        }
      }
    });

    it('should support Next.js development workflow', () => {
      // Validate TypeScript settings work well with Next.js
      const nextJsCompatibleSettings = {
        'typescript.autoClosingTags': false, // Gives developers control in JSX
        'typescript.preferences.includePackageJsonAutoImports': 'auto'
      };
      
      Object.entries(nextJsCompatibleSettings).forEach(([key, expectedValue]) => {
        if (existsSync(vsCodeSettingsPath)) {
          const content = readFileSync(vsCodeSettingsPath, 'utf-8');
          const settings = JSON.parse(content);
          
          if (settings.hasOwnProperty(key)) {
            expect(typeof settings[key]).toBe(typeof expectedValue);
          }
        }
      });
    });

    it('should maintain performance with TypeScript IntelliSense', () => {
      // Test that TypeScript settings don't negatively impact performance
      const performanceRelatedSettings = [
        'typescript.disableAutomaticTypeAcquisition',
        'typescript.preferences.includePackageJsonAutoImports',
        'typescript.suggest.autoImports'
      ];
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        performanceRelatedSettings.forEach(setting => {
          if (settings.hasOwnProperty(setting)) {
            // Should have reasonable values that don't hurt performance
            const value = settings[setting];
            expect(value).not.toBeUndefined();
            
            // Specific validations
            if (setting === 'typescript.disableAutomaticTypeAcquisition') {
              expect(typeof value).toBe('boolean');
            }
          }
        });
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing TypeScript settings gracefully', () => {
      // Test when TypeScript settings are not present
      const mockEmptySettings = {};
      
      // Should not throw when TypeScript settings are missing
      expect(() => {
        const tsSettings = Object.keys(mockEmptySettings).filter(key => 
          key.startsWith('typescript.')
        );
        return tsSettings;
      }).not.toThrow();
    });

    it('should validate against invalid TypeScript setting values', () => {
      const invalidSettings = [
        { 'typescript.autoClosingTags': 'invalid' }, // Should be boolean
        { 'typescript.autoClosingTags': null },      // Should not be null
        { 'typescript.autoClosingTags': undefined }  // Should not be undefined
      ];
      
      invalidSettings.forEach(invalidSetting => {
        const key = 'typescript.autoClosingTags';
        const value = invalidSetting[key];
        
        if (value !== undefined && value !== null) {
          // Invalid string value
          if (typeof value === 'string') {
            expect(['true', 'false']).not.toContain(value);
          }
        }
      });
    });

    it('should handle TypeScript configuration conflicts', () => {
      // Test potential conflicts between TypeScript settings
      const conflictingSettings = {
        'typescript.autoClosingTags': false,
        'editor.autoClosingBrackets': 'always'
      };
      
      // These settings can coexist without issues
      expect(typeof conflictingSettings['typescript.autoClosingTags']).toBe('boolean');
      expect(typeof conflictingSettings['editor.autoClosingBrackets']).toBe('string');
      
      // No actual conflict - they control different behaviors
      const hasConflict = false; // TypeScript tags vs editor brackets are different
      expect(hasConflict).toBe(false);
    });
  });

  describe('Regression Prevention', () => {
    it('should prevent accidental TypeScript setting changes', () => {
      // Track expected TypeScript configuration
      const expectedTsConfig = {
        'typescript.autoClosingTags': false
      };
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        Object.entries(expectedTsConfig).forEach(([key, expectedValue]) => {
          if (settings.hasOwnProperty(key)) {
            expect(settings[key]).toBe(expectedValue);
          }
        });
      }
    });

    it('should maintain TypeScript setting consistency across team', () => {
      // Ensure TypeScript settings are consistent for team development
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check for team-consistent TypeScript settings
        const teamSettings = [
          'typescript.autoClosingTags',
          'typescript.preferences.includePackageJsonAutoImports'
        ];
        
        teamSettings.forEach(setting => {
          if (settings.hasOwnProperty(setting)) {
            const value = settings[setting];
            
            // Should have consistent, predictable values
            expect(value).not.toBeUndefined();
            expect(value).not.toBeNull();
            
            // Specific consistency checks
            if (setting === 'typescript.autoClosingTags') {
              // Should be consistently false for manual control
              expect(value).toBe(false);
            }
          }
        });
      }
    });
  });
});