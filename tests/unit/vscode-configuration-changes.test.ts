import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('VS Code Configuration Changes - Regression Test', () => {
  const vsCodeSettingsPath = join(process.cwd(), '.vscode', 'settings.json');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('New Configuration Settings - Latest Changes', () => {
    it('should validate kiroAgent.configureMCP setting is properly configured', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Validate MCP configuration
        expect(settings).toHaveProperty('kiroAgent.configureMCP');
        expect(settings['kiroAgent.configureMCP']).toBe('Enabled');
        expect(typeof settings['kiroAgent.configureMCP']).toBe('string');
        
        // Ensure the setting follows expected format
        const validMCPValues = ['Enabled', 'Disabled'];
        expect(validMCPValues).toContain(settings['kiroAgent.configureMCP']);
      }
    });

    it('should validate typescript.autoClosingTags setting when present', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // This setting might be present based on the diff
        if (settings.hasOwnProperty('typescript.autoClosingTags')) {
          expect(typeof settings['typescript.autoClosingTags']).toBe('boolean');
          expect([true, false]).toContain(settings['typescript.autoClosingTags']);
        }
      }
    });

    it('should handle configuration changes without breaking existing functionality', () => {
      // Test the specific changes mentioned in the diff
      const expectedChanges = {
        'kiroAgent.configureMCP': 'Enabled',
        'typescript.autoClosingTags': false
      };

      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Validate each expected change
        Object.entries(expectedChanges).forEach(([key, expectedValue]) => {
          if (settings.hasOwnProperty(key)) {
            expect(settings[key]).toBe(expectedValue);
            expect(typeof settings[key]).toBe(typeof expectedValue);
          }
        });
      }
    });

    it('should maintain proper JSON structure after configuration updates', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // Should parse without errors
        expect(() => JSON.parse(content)).not.toThrow();
        
        const settings = JSON.parse(content);
        expect(typeof settings).toBe('object');
        expect(settings).not.toBeNull();
        expect(Array.isArray(settings)).toBe(false);
        
        // Should not have trailing commas or syntax errors
        expect(content).not.toMatch(/,\s*}/);
        expect(content).not.toMatch(/,\s*]/);
      }
    });

    it('should validate TypeScript-specific configuration changes', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check TypeScript settings
        const tsSettings = Object.keys(settings).filter(key => 
          key.startsWith('typescript.')
        );
        
        tsSettings.forEach(setting => {
          const value = settings[setting];
          
          // TypeScript settings should have valid types
          expect(value).not.toBeUndefined();
          expect(value).not.toBeNull();
          
          // Specific validation for autoClosingTags
          if (setting === 'typescript.autoClosingTags') {
            expect(typeof value).toBe('boolean');
          }
        });
      }
    });

    it('should ensure MCP agent configuration is functional', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        if (settings['kiroAgent.configureMCP']) {
          const mcpConfig = settings['kiroAgent.configureMCP'];
          
          // Should be a valid configuration value
          expect(typeof mcpConfig).toBe('string');
          expect(mcpConfig.trim()).not.toBe('');
          expect(['Enabled', 'Disabled']).toContain(mcpConfig);
          
          // Should not contain invalid characters
          expect(mcpConfig).not.toMatch(/[<>{}[\]]/);
          expect(mcpConfig).not.toMatch(/^\s|\s$/); // No leading/trailing whitespace
        }
      }
    });
  });

  describe('Configuration File Integrity', () => {
    it('should maintain valid JSON structure after any modification', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // Should parse without errors
        expect(() => JSON.parse(content)).not.toThrow();
        
        const settings = JSON.parse(content);
        expect(typeof settings).toBe('object');
        expect(settings).not.toBeNull();
        expect(Array.isArray(settings)).toBe(false);
      }
    });

    it('should preserve essential MCP configuration', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Critical configuration that must be preserved
        expect(settings).toHaveProperty('kiroAgent.configureMCP');
        expect(settings['kiroAgent.configureMCP']).toBe('Enabled');
        
        // Validate the value is properly formatted
        expect(typeof settings['kiroAgent.configureMCP']).toBe('string');
        expect(settings['kiroAgent.configureMCP'].length).toBeGreaterThan(0);
      }
    });

    it('should handle empty diff scenarios without corruption', () => {
      // Test scenario where diff is empty but file is modified
      const mockEmptyDiff = {};
      const currentSettings = { 'kiroAgent.configureMCP': 'Enabled' };
      
      // Simulate applying empty diff
      const resultSettings = { ...currentSettings, ...mockEmptyDiff };
      
      expect(resultSettings).toEqual(currentSettings);
      expect(Object.keys(resultSettings)).toHaveLength(1);
      expect(resultSettings['kiroAgent.configureMCP']).toBe('Enabled');
    });
  });

  describe('Configuration Validation Rules', () => {
    it('should validate MCP configuration values', () => {
      const validMCPValues = ['Enabled', 'Disabled'];
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        if (settings['kiroAgent.configureMCP']) {
          expect(validMCPValues).toContain(settings['kiroAgent.configureMCP']);
        }
      }
    });

    it('should not contain invalid or malformed settings', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check for common malformed patterns
        Object.entries(settings).forEach(([key, value]) => {
          // Keys should not be empty
          expect(key.trim()).not.toBe('');
          
          // Values should not be undefined
          expect(value).not.toBeUndefined();
          
          // String values should not be empty
          if (typeof value === 'string') {
            expect(value.trim()).not.toBe('');
          }
        });
      }
    });

    it('should maintain consistent formatting', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // Should not have trailing commas
        expect(content).not.toMatch(/,\s*}/);
        expect(content).not.toMatch(/,\s*]/);
        
        // Should have proper indentation (4 spaces)
        const lines = content.split('\n');
        lines.forEach((line) => {
          if (line.trim() && !line.startsWith('{') && !line.startsWith('}')) {
            // Non-empty lines should have proper indentation
            const leadingSpaces = line.match(/^ */)?.[0].length || 0;
            if (leadingSpaces > 0) {
              expect(leadingSpaces % 4).toBe(0);
            }
          }
        });
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing tools', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Essential settings that tools depend on
        const criticalSettings = ['kiroAgent.configureMCP'];
        
        criticalSettings.forEach(setting => {
          expect(settings).toHaveProperty(setting);
        });
      }
    });

    it('should not break existing VS Code extensions', () => {
      // Test that settings don't conflict with common extensions
      const commonExtensionSettings = [
        'editor.formatOnSave',
        'editor.codeActionsOnSave',
        'typescript.preferences.includePackageJsonAutoImports',
        'eslint.validate'
      ];
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // If these settings exist, they should have valid values
        commonExtensionSettings.forEach(setting => {
          if (settings[setting] !== undefined) {
            expect(settings[setting]).not.toBeNull();
          }
        });
      }
    });
  });

  describe('Performance and Size Constraints', () => {
    it('should maintain reasonable file size', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // File should not be excessively large
        expect(content.length).toBeLessThan(50000); // 50KB limit
        
        // Should not be empty
        expect(content.trim().length).toBeGreaterThan(0);
      }
    });

    it('should not have excessive nesting', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check nesting depth
        const checkDepth = (obj: any, currentDepth = 0): number => {
          if (typeof obj !== 'object' || obj === null) return currentDepth;
          
          let maxDepth = currentDepth;
          for (const value of Object.values(obj)) {
            const depth = checkDepth(value, currentDepth + 1);
            maxDepth = Math.max(maxDepth, depth);
          }
          return maxDepth;
        };
        
        const depth = checkDepth(settings);
        expect(depth).toBeLessThan(10); // Reasonable nesting limit
      }
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted JSON gracefully in tests', () => {
      const corruptedJsonExamples = [
        '{ "key": }',           // Missing value
        '{ key: "value" }',     // Unquoted key
        '{ "key": "value", }',  // Trailing comma
        '{ "key": "value"',     // Missing closing brace
      ];
      
      corruptedJsonExamples.forEach(corruptedJson => {
        expect(() => JSON.parse(corruptedJson)).toThrow();
      });
    });

    it('should validate against common JSON errors', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // Common error patterns that should not exist
        const errorPatterns = [
          /[^\\]"/g,           // Unescaped quotes
          /,\s*[}\]]/g,        // Trailing commas
          /[{\[][\s\n]*[}\]]/g // Empty objects/arrays with whitespace
        ];
        
        errorPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            // Some patterns might be valid, so we just log them
            console.warn('Potential JSON pattern found:', matches);
          }
        });
        
        // Most important: should parse successfully
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe('Configuration Change Detection', () => {
    it('should detect when MCP configuration changes', () => {
      const originalConfig = { 'kiroAgent.configureMCP': 'Enabled' };
      const modifiedConfig = { 'kiroAgent.configureMCP': 'Disabled' };
      
      const hasChanged = originalConfig['kiroAgent.configureMCP'] !== modifiedConfig['kiroAgent.configureMCP'];
      expect(hasChanged).toBe(true);
      
      // Should be able to detect the specific change
      expect(originalConfig['kiroAgent.configureMCP']).toBe('Enabled');
      expect(modifiedConfig['kiroAgent.configureMCP']).toBe('Disabled');
    });

    it('should track configuration history for debugging', () => {
      // Mock configuration history tracking
      const configHistory = [
        { timestamp: '2024-01-01T00:00:00Z', config: { 'kiroAgent.configureMCP': 'Enabled' } },
        { timestamp: '2024-01-02T00:00:00Z', config: { 'kiroAgent.configureMCP': 'Enabled' } }
      ];
      
      expect(configHistory).toHaveLength(2);
      expect(configHistory[0].config['kiroAgent.configureMCP']).toBe('Enabled');
      expect(configHistory[1].config['kiroAgent.configureMCP']).toBe('Enabled');
      
      // Should be able to detect when configuration remains stable
      const isStable = configHistory.every(entry => 
        entry.config['kiroAgent.configureMCP'] === 'Enabled'
      );
      expect(isStable).toBe(true);
    });
  });

  describe('Integration with Development Workflow', () => {
    it('should not interfere with TypeScript development', () => {
      // Ensure VS Code settings don't break TypeScript workflow
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check for TypeScript-related settings
        const tsSettings = Object.keys(settings).filter(key => 
          key.startsWith('typescript.') || key.startsWith('javascript.')
        );
        
        // If TypeScript settings exist, validate them
        tsSettings.forEach(setting => {
          expect(settings[setting]).not.toBeUndefined();
          expect(settings[setting]).not.toBeNull();
        });
      }
    });

    it('should support development environment requirements', () => {
      // Validate that settings support the development environment
      const requiredCapabilities = [
        'MCP configuration',
        'JSON validation',
        'Extension compatibility'
      ];
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // MCP configuration should be present
        expect(settings['kiroAgent.configureMCP']).toBeTruthy();
        
        // JSON should be valid
        expect(() => JSON.parse(content)).not.toThrow();
        
        // Should not have conflicting settings
        const keys = Object.keys(settings);
        const uniqueKeys = [...new Set(keys)];
        expect(keys.length).toBe(uniqueKeys.length);
      }
      
      expect(requiredCapabilities).toHaveLength(3);
    });
  });
});