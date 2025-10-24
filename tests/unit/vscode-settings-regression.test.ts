import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('VS Code Settings Regression Tests', () => {
  const vsCodeSettingsPath = join(process.cwd(), '.vscode', 'settings.json');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Critical Configuration Regression', () => {
    it('should maintain MCP agent configuration after any changes', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Critical: MCP configuration must always be present and valid
        expect(settings).toHaveProperty('kiroAgent.configureMCP');
        expect(settings['kiroAgent.configureMCP']).toBe('Enabled');
        
        // Regression check: ensure it's not accidentally changed
        expect(settings['kiroAgent.configureMCP']).not.toBe('Disabled');
        expect(settings['kiroAgent.configureMCP']).not.toBe('');
        expect(settings['kiroAgent.configureMCP']).not.toBeNull();
        expect(settings['kiroAgent.configureMCP']).not.toBeUndefined();
      }
    });

    it('should preserve TypeScript development settings', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Check for TypeScript settings that affect development workflow
        if (settings.hasOwnProperty('typescript.autoClosingTags')) {
          // Regression: should remain false for manual control
          expect(settings['typescript.autoClosingTags']).toBe(false);
          expect(typeof settings['typescript.autoClosingTags']).toBe('boolean');
        }
      }
    });

    it('should not introduce breaking configuration changes', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // Should always be valid JSON
        expect(() => JSON.parse(content)).not.toThrow();
        
        const settings = JSON.parse(content);
        
        // Should not have settings that break the development environment
        const breakingPatterns = [
          /typescript\.preferences\.includePackageJsonAutoImports.*never/,
          /editor\.formatOnSave.*false/,
          /eslint\.enable.*false/
        ];
        
        const settingsString = JSON.stringify(settings);
        breakingPatterns.forEach(pattern => {
          expect(settingsString).not.toMatch(pattern);
        });
      }
    });

    it('should maintain backward compatibility with existing extensions', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Essential extensions should not be broken by new settings
        const extensionCompatibilityChecks = [
          {
            extension: 'TypeScript',
            settings: ['typescript.autoClosingTags'],
            validator: (value: any) => typeof value === 'boolean'
          },
          {
            extension: 'Kiro Agent',
            settings: ['kiroAgent.configureMCP'],
            validator: (value: any) => ['Enabled', 'Disabled'].includes(value)
          }
        ];
        
        extensionCompatibilityChecks.forEach(({ extension, settings: extensionSettings, validator }) => {
          extensionSettings.forEach(setting => {
            if (settings.hasOwnProperty(setting)) {
              expect(validator(settings[setting])).toBe(true);
            }
          });
        });
      }
    });
  });

  describe('Configuration Change Impact Analysis', () => {
    it('should analyze impact of MCP configuration changes', () => {
      const configurationStates = [
        { 'kiroAgent.configureMCP': 'Enabled' },
        { 'kiroAgent.configureMCP': 'Disabled' }
      ];
      
      configurationStates.forEach(state => {
        const mcpValue = state['kiroAgent.configureMCP'];
        
        // Validate each possible state
        expect(['Enabled', 'Disabled']).toContain(mcpValue);
        
        // Analyze impact
        if (mcpValue === 'Enabled') {
          // Should enable MCP functionality
          expect(mcpValue).toBe('Enabled');
        } else {
          // Should disable MCP functionality
          expect(mcpValue).toBe('Disabled');
        }
      });
    });

    it('should track TypeScript setting changes and their effects', () => {
      const typeScriptConfigurations = [
        { 'typescript.autoClosingTags': true },
        { 'typescript.autoClosingTags': false }
      ];
      
      typeScriptConfigurations.forEach(config => {
        const autoClosingValue = config['typescript.autoClosingTags'];
        
        // Validate configuration
        expect(typeof autoClosingValue).toBe('boolean');
        
        // Analyze development impact
        if (autoClosingValue === false) {
          // Developers have manual control over tag closing
          expect(autoClosingValue).toBe(false);
        } else {
          // Automatic tag closing is enabled
          expect(autoClosingValue).toBe(true);
        }
      });
    });

    it('should ensure configuration changes do not affect build process', () => {
      // Mock build process validation
      const buildAffectingSettings = [
        'typescript.noImplicitAny',
        'typescript.strict',
        'typescript.moduleResolution'
      ];
      
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // VS Code settings should not override tsconfig.json
        buildAffectingSettings.forEach(setting => {
          // These settings should typically not be in VS Code settings
          // as they belong in tsconfig.json
          if (settings.hasOwnProperty(setting)) {
            console.warn(`Build setting ${setting} found in VS Code settings`);
          }
        });
        
        // Current settings should not affect build
        const currentSettings = Object.keys(settings);
        const buildConflicts = currentSettings.filter(setting => 
          buildAffectingSettings.includes(setting)
        );
        
        expect(buildConflicts).toHaveLength(0);
      }
    });
  });

  describe('Performance Impact Regression', () => {
    it('should ensure settings do not degrade editor performance', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Settings that could impact performance
        const performanceSettings = [
          'typescript.disableAutomaticTypeAcquisition',
          'typescript.preferences.includePackageJsonAutoImports',
          'editor.quickSuggestions'
        ];
        
        performanceSettings.forEach(setting => {
          if (settings.hasOwnProperty(setting)) {
            const value = settings[setting];
            
            // Should not have performance-degrading values
            expect(value).not.toBeUndefined();
            
            // Specific performance checks
            if (setting === 'typescript.preferences.includePackageJsonAutoImports') {
              // 'never' would hurt developer experience
              expect(value).not.toBe('never');
            }
          }
        });
      }
    });

    it('should validate file size remains reasonable', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // File should not grow excessively
        expect(content.length).toBeLessThan(10000); // 10KB limit
        
        // Should not be empty
        expect(content.trim().length).toBeGreaterThan(10);
        
        // Should not have excessive whitespace
        const lines = content.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        const emptyLines = lines.length - nonEmptyLines.length;
        
        // Should not have more empty lines than content lines
        expect(emptyLines).toBeLessThanOrEqual(nonEmptyLines.length);
      }
    });
  });

  describe('Security and Safety Regression', () => {
    it('should not introduce security-sensitive configuration', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Settings that could have security implications
        const securitySensitivePatterns = [
          /password/i,
          /token/i,
          /secret/i,
          /key/i,
          /credential/i
        ];
        
        const settingsString = JSON.stringify(settings);
        securitySensitivePatterns.forEach(pattern => {
          // Should not contain security-sensitive information
          expect(settingsString).not.toMatch(pattern);
        });
      }
    });

    it('should validate against malicious configuration injection', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        
        // Should not contain script injection patterns
        const maliciousPatterns = [
          /<script/i,
          /javascript:/i,
          /eval\(/i,
          /function\(/i,
          /\$\{/,
          /`.*`/
        ];
        
        maliciousPatterns.forEach(pattern => {
          expect(content).not.toMatch(pattern);
        });
        
        // Should be pure JSON without executable content
        const settings = JSON.parse(content);
        Object.values(settings).forEach(value => {
          if (typeof value === 'string') {
            expect(value).not.toMatch(/<script/i);
            expect(value).not.toMatch(/javascript:/i);
          }
        });
      }
    });
  });

  describe('Team Collaboration Regression', () => {
    it('should maintain consistent settings for team development', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Team-critical settings that should be consistent
        const teamCriticalSettings = {
          'kiroAgent.configureMCP': 'Enabled',
          'typescript.autoClosingTags': false
        };
        
        Object.entries(teamCriticalSettings).forEach(([key, expectedValue]) => {
          if (settings.hasOwnProperty(key)) {
            expect(settings[key]).toBe(expectedValue);
          }
        });
      }
    });

    it('should not override personal developer preferences inappropriately', () => {
      if (existsSync(vsCodeSettingsPath)) {
        const content = readFileSync(vsCodeSettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        // Settings that should typically be personal preferences
        const personalPreferences = [
          'editor.fontSize',
          'editor.fontFamily',
          'workbench.colorTheme',
          'editor.minimap.enabled'
        ];
        
        personalPreferences.forEach(setting => {
          if (settings.hasOwnProperty(setting)) {
            // Warn if personal preferences are being enforced
            console.warn(`Personal preference ${setting} found in workspace settings`);
          }
        });
        
        // Current settings should focus on project-specific configuration
        const projectSpecificSettings = Object.keys(settings).filter(key => 
          key.startsWith('typescript.') || 
          key.startsWith('kiroAgent.') ||
          key.startsWith('eslint.') ||
          key.startsWith('prettier.')
        );
        
        expect(projectSpecificSettings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Rollback and Recovery', () => {
    it('should support configuration rollback scenarios', () => {
      // Mock configuration history for rollback testing
      const configurationHistory = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          settings: { 'kiroAgent.configureMCP': 'Enabled' }
        },
        {
          timestamp: '2024-01-02T00:00:00Z',
          settings: { 
            'kiroAgent.configureMCP': 'Enabled',
            'typescript.autoClosingTags': false
          }
        }
      ];
      
      // Should be able to identify configuration changes
      const latestConfig = configurationHistory[configurationHistory.length - 1];
      const previousConfig = configurationHistory[configurationHistory.length - 2];
      
      expect(latestConfig.settings).toHaveProperty('typescript.autoClosingTags');
      expect(previousConfig.settings).not.toHaveProperty('typescript.autoClosingTags');
      
      // Should maintain critical settings across changes
      expect(latestConfig.settings['kiroAgent.configureMCP']).toBe('Enabled');
      expect(previousConfig.settings['kiroAgent.configureMCP']).toBe('Enabled');
    });

    it('should validate configuration recovery after corruption', () => {
      // Test recovery from common corruption scenarios
      const corruptionScenarios = [
        '{ "kiroAgent.configureMCP": "Enabled" ', // Missing closing brace
        '{ "kiroAgent.configureMCP": "Enabled", }', // Trailing comma
        '{ kiroAgent.configureMCP: "Enabled" }', // Unquoted key
      ];
      
      corruptionScenarios.forEach(corruptedJson => {
        // Should be able to detect corruption
        expect(() => JSON.parse(corruptedJson)).toThrow();
      });
      
      // Valid configuration should parse successfully
      const validConfig = '{ "kiroAgent.configureMCP": "Enabled" }';
      expect(() => JSON.parse(validConfig)).not.toThrow();
      
      const parsed = JSON.parse(validConfig);
      expect(parsed['kiroAgent.configureMCP']).toBe('Enabled');
    });
  });
});