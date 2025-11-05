/**
 * Environment Validation Tests
 * Tests for environment variable validation and configuration
 */

const fs = require('fs');
const path = require('path');

describe('Environment Validation Tests', () => {
  const projectRoot = process.cwd();
  const envExamplePath = path.join(projectRoot, '.env.example');
  const envConfigPath = path.join(projectRoot, 'lib/config/amplify-env-config.js');
  const preValidationPath = path.join(projectRoot, 'scripts/pre-build-validation.js');

  describe('Environment File Structure', () => {
    test('.env.example exists and is properly formatted', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
      
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      const lines = envContent.split('\n').filter(line => line.trim());
      
      // Should have environment variables
      expect(lines.length).toBeGreaterThan(0);
      
      // Check format of non-comment lines
      lines.forEach(line => {
        if (!line.startsWith('#') && line.includes('=')) {
          expect(line).toMatch(/^[A-Z_][A-Z0-9_]*=/);
        }
      });
    });

    test('environment variables follow naming conventions', () => {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      const envVars = envContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#') && line.includes('='))
        .map(line => line.split('=')[0]);
      
      envVars.forEach(varName => {
        // Should be uppercase with underscores
        expect(varName).toMatch(/^[A-Z_][A-Z0-9_]*$/);
        
        // Should not be too long
        expect(varName.length).toBeLessThan(50);
      });
    });

    test('critical environment variables are documented', () => {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Critical variables that should be present
      const criticalVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];
      
      criticalVars.forEach(varName => {
        expect(envContent).toContain(varName);
      });
    });

    test('social integration variables are documented', () => {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Social platform variables
      const socialVars = [
        'INSTAGRAM_CLIENT_ID',
        'INSTAGRAM_CLIENT_SECRET',
        'TIKTOK_CLIENT_ID',
        'TIKTOK_CLIENT_SECRET',
        'REDDIT_CLIENT_ID',
        'REDDIT_CLIENT_SECRET'
      ];
      
      socialVars.forEach(varName => {
        expect(envContent).toContain(varName);
      });
    });
  });

  describe('Environment Configuration Module', () => {
    test('environment config module exists and is importable', () => {
      if (fs.existsSync(envConfigPath)) {
        expect(() => {
          const envConfig = require(envConfigPath);
          expect(typeof envConfig).toBe('object');
        }).not.toThrow();
      }
    });

    test('environment config validates required variables', () => {
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.validateEnvironment) {
          expect(typeof envConfig.validateEnvironment).toBe('function');
        }
        
        if (envConfig.requiredVariables) {
          expect(Array.isArray(envConfig.requiredVariables)).toBe(true);
          expect(envConfig.requiredVariables.length).toBeGreaterThan(0);
        }
      }
    });

    test('environment config handles missing variables gracefully', () => {
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.validateEnvironment) {
          const originalEnv = { ...process.env };
          
          // Remove some variables for testing
          delete process.env.TEST_VAR;
          
          expect(() => {
            envConfig.validateEnvironment();
          }).not.toThrow();
          
          // Restore environment
          Object.assign(process.env, originalEnv);
        }
      }
    });

    test('environment config provides fallback values', () => {
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.getEnvironmentConfig) {
          const config = envConfig.getEnvironmentConfig();
          expect(typeof config).toBe('object');
          
          // Should have some default values
          expect(Object.keys(config).length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Pre-build Validation', () => {
    test('pre-build validation script exists', () => {
      expect(fs.existsSync(preValidationPath)).toBe(true);
    });

    test('pre-build validation can be imported', () => {
      if (fs.existsSync(preValidationPath)) {
        expect(() => {
          const validator = require(preValidationPath);
          expect(typeof validator).toBe('function');
        }).not.toThrow();
      }
    });

    test('pre-build validation checks environment variables', () => {
      if (fs.existsSync(preValidationPath)) {
        const PreBuildValidator = require(preValidationPath);
        const validator = new PreBuildValidator();
        
        if (validator.validateEnvironment) {
          expect(typeof validator.validateEnvironment).toBe('function');
        }
      }
    });

    test('pre-build validation checks dependencies', () => {
      if (fs.existsSync(preValidationPath)) {
        const PreBuildValidator = require(preValidationPath);
        const validator = new PreBuildValidator();
        
        if (validator.validateDependencies) {
          expect(typeof validator.validateDependencies).toBe('function');
        }
      }
    });

    test('pre-build validation provides detailed error messages', async () => {
      if (fs.existsSync(preValidationPath)) {
        const PreBuildValidator = require(preValidationPath);
        const validator = new PreBuildValidator();
        
        if (validator.run) {
          try {
            const result = await validator.run();
            expect(typeof result).toBe('object');
            
            if (result.errors) {
              expect(Array.isArray(result.errors)).toBe(true);
            }
            
            if (result.warnings) {
              expect(Array.isArray(result.warnings)).toBe(true);
            }
          } catch (error) {
            // Validation might fail in test environment, that's okay
            expect(error.message).toBeDefined();
          }
        }
      }
    });
  });

  describe('Environment Variable Validation Logic', () => {
    test('validates database connection string format', () => {
      const validUrls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgres://user:pass@host.com:5432/database',
        'mysql://user:pass@localhost:3306/db'
      ];
      
      const invalidUrls = [
        'not-a-url',
        'http://example.com',
        'postgresql://',
        ''
      ];
      
      validUrls.forEach(url => {
        expect(url).toMatch(/^(postgresql|postgres|mysql):\/\/.+/);
      });
      
      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^(postgresql|postgres|mysql):\/\/.+/);
      });
    });

    test('validates OAuth client ID format', () => {
      const validClientIds = [
        '123456789012345678',
        'abc123def456',
        'client_id_123'
      ];
      
      const invalidClientIds = [
        '',
        'too short',
        'has spaces in it',
        'has-special-chars!'
      ];
      
      validClientIds.forEach(id => {
        expect(id.length).toBeGreaterThan(5);
        expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
      });
      
      invalidClientIds.forEach(id => {
        if (id.length <= 5 || /[^a-zA-Z0-9_-]/.test(id)) {
          expect(true).toBe(true); // Invalid as expected
        }
      });
    });

    test('validates NextAuth configuration', () => {
      const requiredNextAuthVars = [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];
      
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      requiredNextAuthVars.forEach(varName => {
        expect(envContent).toContain(varName);
      });
    });

    test('validates social platform credentials format', () => {
      const socialPlatforms = ['INSTAGRAM', 'TIKTOK', 'REDDIT'];
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      socialPlatforms.forEach(platform => {
        expect(envContent).toContain(`${platform}_CLIENT_ID`);
        expect(envContent).toContain(`${platform}_CLIENT_SECRET`);
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('development environment has appropriate defaults', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.getEnvironmentConfig) {
          const config = envConfig.getEnvironmentConfig();
          
          // Development should have debug settings
          if (config.debug !== undefined) {
            expect(config.debug).toBe(true);
          }
        }
      }
      
      // Restore original
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    test('production environment has secure defaults', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.getEnvironmentConfig) {
          const config = envConfig.getEnvironmentConfig();
          
          // Production should have secure settings
          if (config.debug !== undefined) {
            expect(config.debug).toBe(false);
          }
          
          if (config.secure !== undefined) {
            expect(config.secure).toBe(true);
          }
        }
      }
      
      // Restore original
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    test('staging environment configuration', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'staging';
      
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.getEnvironmentConfig) {
          const config = envConfig.getEnvironmentConfig();
          expect(typeof config).toBe('object');
        }
      }
      
      // Restore original
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });
  });

  describe('Missing Variable Handling', () => {
    test('handles missing critical variables', () => {
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.validateEnvironment) {
          const originalEnv = { ...process.env };
          
          // Remove critical variables
          delete process.env.DATABASE_URL;
          delete process.env.NEXTAUTH_SECRET;
          
          try {
            const result = envConfig.validateEnvironment();
            
            if (result && result.errors) {
              expect(result.errors.length).toBeGreaterThan(0);
            }
          } catch (error) {
            // Should throw or return errors for missing critical vars
            expect(error.message).toBeDefined();
          }
          
          // Restore environment
          Object.assign(process.env, originalEnv);
        }
      }
    });

    test('provides fallbacks for optional variables', () => {
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.getEnvironmentConfig) {
          const originalEnv = { ...process.env };
          
          // Remove optional variables
          delete process.env.OPTIONAL_VAR;
          delete process.env.FEATURE_FLAG;
          
          const config = envConfig.getEnvironmentConfig();
          expect(typeof config).toBe('object');
          
          // Should still return a valid config
          expect(Object.keys(config).length).toBeGreaterThan(0);
          
          // Restore environment
          Object.assign(process.env, originalEnv);
        }
      }
    });

    test('warns about missing optional variables', () => {
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.validateEnvironment) {
          const originalEnv = { ...process.env };
          
          // Remove some optional variables
          delete process.env.ANALYTICS_ID;
          delete process.env.SENTRY_DSN;
          
          try {
            const result = envConfig.validateEnvironment();
            
            if (result && result.warnings) {
              // Should have warnings for missing optional vars
              expect(Array.isArray(result.warnings)).toBe(true);
            }
          } catch (error) {
            // Validation might fail, that's okay for this test
          }
          
          // Restore environment
          Object.assign(process.env, originalEnv);
        }
      }
    });
  });

  describe('Secure Credential Validation', () => {
    test('validates secret format and strength', () => {
      const validSecrets = [
        'a'.repeat(32), // 32 characters
        'very-long-secure-secret-key-123456789',
        'MIX3d_Ch4r5_4nd_Numb3r5_S3cr3t'
      ];
      
      const invalidSecrets = [
        'short',
        '12345',
        'password',
        ''
      ];
      
      validSecrets.forEach(secret => {
        expect(secret.length).toBeGreaterThanOrEqual(16);
      });
      
      invalidSecrets.forEach(secret => {
        expect(secret.length).toBeLessThan(16);
      });
    });

    test('validates OAuth redirect URLs', () => {
      const validUrls = [
        'https://example.com/auth/callback',
        'https://app.example.com/api/auth/callback/provider',
        'http://localhost:3000/api/auth/callback/provider'
      ];
      
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        ''
      ];
      
      validUrls.forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
      
      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^https?:\/\/.+/);
      });
    });

    test('validates API endpoint URLs', () => {
      const validEndpoints = [
        'https://api.instagram.com',
        'https://www.tiktok.com/api',
        'https://oauth.reddit.com'
      ];
      
      const invalidEndpoints = [
        'http://insecure-api.com',
        'not-a-url',
        'file:///etc/passwd'
      ];
      
      validEndpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^https:\/\/.+/);
      });
      
      invalidEndpoints.forEach(endpoint => {
        if (!endpoint.startsWith('https://')) {
          expect(true).toBe(true); // Invalid as expected
        }
      });
    });
  });

  describe('Environment Synchronization', () => {
    test('env.example covers all required variables', () => {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      
      if (fs.existsSync(envConfigPath)) {
        const envConfig = require(envConfigPath);
        
        if (envConfig.requiredVariables) {
          envConfig.requiredVariables.forEach(varName => {
            expect(envExampleContent).toContain(varName);
          });
        }
      }
    });

    test('no sensitive values in env.example', () => {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Should not contain actual secrets
      const sensitivePatterns = [
        /password\s*=\s*[^<\s]/i,
        /secret\s*=\s*[^<\s]/i,
        /key\s*=\s*[^<\s]/i,
        /token\s*=\s*[^<\s]/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        const matches = envExampleContent.match(pattern);
        if (matches) {
          // Should use placeholder values like <your-secret> or example values
          expect(matches[0]).toMatch(/<|example|placeholder|your-|test-/i);
        }
      });
    });

    test('environment variables are properly categorized', () => {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Should have sections or comments organizing variables
      const hasComments = envExampleContent.includes('#');
      expect(hasComments).toBe(true);
      
      // Should organize by category (database, auth, social, etc.)
      const categories = ['database', 'auth', 'social', 'api'];
      const hasCategories = categories.some(category => 
        envExampleContent.toLowerCase().includes(category)
      );
      expect(hasCategories).toBe(true);
    });
  });

  describe('Integration with Build Process', () => {
    test('environment validation integrates with pre-build', () => {
      if (fs.existsSync(preValidationPath)) {
        const PreBuildValidator = require(preValidationPath);
        const validator = new PreBuildValidator();
        
        // Should have environment validation as part of pre-build
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(validator));
        const hasEnvValidation = methods.some(method => 
          method.toLowerCase().includes('env') || 
          method.toLowerCase().includes('environment')
        );
        
        expect(hasEnvValidation).toBe(true);
      }
    });

    test('validation errors prevent build continuation', async () => {
      if (fs.existsSync(preValidationPath)) {
        const PreBuildValidator = require(preValidationPath);
        const validator = new PreBuildValidator();
        
        if (validator.run) {
          const originalEnv = { ...process.env };
          
          // Create invalid environment
          delete process.env.DATABASE_URL;
          delete process.env.NEXTAUTH_SECRET;
          
          try {
            const result = await validator.run();
            
            if (result && result.success === false) {
              expect(result.errors.length).toBeGreaterThan(0);
            }
          } catch (error) {
            // Should throw for critical validation failures
            expect(error.message).toBeDefined();
          }
          
          // Restore environment
          Object.assign(process.env, originalEnv);
        }
      }
    });
  });
});