/**
 * Amplify Environment Configuration
 * Comprehensive environment variable validation and setup for Amplify deployments
 */

class AmplifyEnvironmentConfig {
  constructor() {
    this.requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL'
    ];
    
    this.criticalVars = [
      'DATABASE_URL',
      'JWT_SECRET'
    ];
    
    this.optionalVars = [
      'REDIS_URL',
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_ENDPOINT',
      'TOKEN_ENCRYPTION_KEY',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'AWS_REGION',
      'FROM_EMAIL'
    ];

    this.socialIntegrationVars = [
      'TIKTOK_CLIENT_KEY',
      'TIKTOK_CLIENT_SECRET',
      'FACEBOOK_APP_ID',
      'FACEBOOK_APP_SECRET',
      'INSTAGRAM_APP_SECRET',
      'REDDIT_CLIENT_ID',
      'REDDIT_CLIENT_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];

    this.validationRules = {
      'DATABASE_URL': {
        pattern: /^postgresql:\/\/.+/,
        message: 'Must be a valid PostgreSQL connection string starting with postgresql://'
      },
      'NEXT_PUBLIC_APP_URL': {
        pattern: /^https?:\/\/.+/,
        message: 'Must be a valid URL starting with http:// or https://'
      },
      'JWT_SECRET': {
        minLength: 32,
        message: 'Should be at least 32 characters long for security'
      },
      'REDIS_URL': {
        pattern: /^redis:\/\/.+/,
        message: 'Must be a valid Redis connection string starting with redis://'
      }
    };

    this.errors = [];
    this.warnings = [];
    this.recommendations = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  validateRequiredVars() {
    this.log('Validating required environment variables...');
    
    const missing = [];
    const invalid = [];
    
    this.requiredVars.forEach(varName => {
      const value = process.env[varName];
      
      if (!value) {
        missing.push(varName);
      } else {
        const validation = this.validateVariableFormat(varName, value);
        if (!validation.isValid) {
          invalid.push({ 
            var: varName, 
            reason: validation.message,
            severity: validation.severity || 'error'
          });
        }
      }
    });
    
    return { missing, invalid };
  }

  validateVariableFormat(varName, value) {
    const rule = this.validationRules[varName];
    if (!rule) return { isValid: true };

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        isValid: false,
        message: rule.message,
        severity: 'error'
      };
    }

    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      return {
        isValid: false,
        message: rule.message,
        severity: 'warning'
      };
    }

    // Custom validations
    if (varName === 'DATABASE_URL') {
      try {
        const url = new URL(value);
        if (!url.hostname || !url.username || !url.password) {
          return {
            isValid: false,
            message: 'DATABASE_URL missing required components (host, username, password)',
            severity: 'warning'
          };
        }
      } catch (error) {
        return {
          isValid: false,
          message: 'DATABASE_URL format is invalid',
          severity: 'error'
        };
      }
    }

    if (varName === 'NEXT_PUBLIC_APP_URL') {
      try {
        const url = new URL(value);
        if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
          return {
            isValid: false,
            message: 'Should use HTTPS in production environment',
            severity: 'warning'
          };
        }
      } catch (error) {
        return {
          isValid: false,
          message: 'Must be a valid URL',
          severity: 'error'
        };
      }
    }

    return { isValid: true };
  }

  validateOptionalVars() {
    this.log('Checking optional environment variables...');
    
    const configured = [];
    const missing = [];
    
    this.optionalVars.forEach(varName => {
      if (process.env[varName]) {
        configured.push(varName);
        
        // Validate format if rules exist
        const validation = this.validateVariableFormat(varName, process.env[varName]);
        if (!validation.isValid) {
          this.warnings.push({
            type: 'environment',
            message: `${varName}: ${validation.message}`,
            severity: validation.severity
          });
        }
      } else {
        missing.push(varName);
      }
    });

    if (configured.length > 0) {
      this.log(`Optional variables configured: ${configured.join(', ')}`);
    }

    if (missing.length > 0) {
      this.log(`Optional variables not set: ${missing.join(', ')}`);
    }

    return { configured, missing };
  }

  validateSocialIntegrations() {
    this.log('Checking social integration variables...');
    
    const platforms = {
      tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
      instagram: ['FACEBOOK_APP_ID', 'INSTAGRAM_APP_SECRET'],
      reddit: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
      google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    };

    const enabledPlatforms = [];
    const partialPlatforms = [];

    Object.entries(platforms).forEach(([platform, vars]) => {
      const configuredVars = vars.filter(varName => process.env[varName]);
      
      if (configuredVars.length === vars.length) {
        enabledPlatforms.push(platform);
      } else if (configuredVars.length > 0) {
        partialPlatforms.push({
          platform,
          configured: configuredVars,
          missing: vars.filter(varName => !process.env[varName])
        });
      }
    });

    if (enabledPlatforms.length > 0) {
      this.log(`Social platforms enabled: ${enabledPlatforms.join(', ')}`);
    }

    if (partialPlatforms.length > 0) {
      partialPlatforms.forEach(({ platform, missing }) => {
        this.warnings.push({
          type: 'environment',
          message: `${platform} integration partially configured, missing: ${missing.join(', ')}`,
          severity: 'warning'
        });
      });
    }

    return { enabledPlatforms, partialPlatforms };
  }

  validateEnvironmentSpecific() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    this.log(`Validating ${nodeEnv} environment specific requirements...`);

    if (nodeEnv === 'production') {
      // Production-specific validations
      const productionCritical = [
        'DATABASE_URL',
        'JWT_SECRET',
        'NEXT_PUBLIC_APP_URL'
      ];
      
      const missingProd = productionCritical.filter(varName => !process.env[varName]);
      if (missingProd.length > 0) {
        this.errors.push({
          type: 'environment',
          message: `Production environment missing critical variables: ${missingProd.join(', ')}`,
          severity: 'error'
        });
      }

      // Check for development values in production
      if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
        this.errors.push({
          type: 'environment',
          message: 'NEXT_PUBLIC_APP_URL contains localhost in production',
          severity: 'error'
        });
      }

      // Recommend security enhancements for production
      if (!process.env.TOKEN_ENCRYPTION_KEY) {
        this.recommendations.push('Add TOKEN_ENCRYPTION_KEY for enhanced security in production');
      }

      if (!process.env.SESSION_SECRET) {
        this.recommendations.push('Add SESSION_SECRET for secure session management');
      }
    }

    // Check for conflicting settings
    if (nodeEnv === 'production' && process.env.SKIP_ENV_VALIDATION !== '1') {
      this.recommendations.push('Set SKIP_ENV_VALIDATION=1 for production builds to improve performance');
    }

    // Validate AWS region for AWS services
    if (process.env.AWS_REGION && !['us-east-1', 'us-west-2', 'eu-west-1'].includes(process.env.AWS_REGION)) {
      this.warnings.push({
        type: 'environment',
        message: `AWS_REGION ${process.env.AWS_REGION} may not be optimal for your use case`,
        severity: 'info'
      });
    }
  }

  setupEnvironmentDefaults() {
    this.log('Setting up environment defaults...');
    
    const defaults = {
      'NODE_ENV': 'production',
      'SKIP_ENV_VALIDATION': '1',
      'NEXT_TELEMETRY_DISABLED': '1',
      'CI': 'true'
    };
    
    const applied = [];
    Object.entries(defaults).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
        applied.push(`${key}=${value}`);
      }
    });

    if (applied.length > 0) {
      this.log(`Applied defaults: ${applied.join(', ')}`);
    }
  }

  handleMissingVariables(missing) {
    if (missing.length === 0) return true;
    
    const critical = missing.filter(varName => this.criticalVars.includes(varName));
    const nonCritical = missing.filter(varName => !this.criticalVars.includes(varName));
    
    if (critical.length > 0) {
      this.errors.push({
        type: 'environment',
        message: `Critical environment variables missing: ${critical.join(', ')}`,
        severity: 'error'
      });
      return false;
    }
    
    if (nonCritical.length > 0) {
      this.warnings.push({
        type: 'environment',
        message: `Required environment variables missing: ${nonCritical.join(', ')}`,
        severity: 'warning'
      });
    }
    
    return true;
  }

  generateConfigReport() {
    const report = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasRedis: !!process.env.REDIS_URL,
      hasAzureAI: !!process.env.AZURE_OPENAI_API_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      requiredVarsCount: this.requiredVars.filter(v => process.env[v]).length,
      totalRequiredVars: this.requiredVars.length,
      optionalVarsCount: this.optionalVars.filter(v => process.env[v]).length,
      totalOptionalVars: this.optionalVars.length,
      socialVarsCount: this.socialIntegrationVars.filter(v => process.env[v]).length,
      totalSocialVars: this.socialIntegrationVars.length
    };
    
    this.log('=== ENVIRONMENT CONFIGURATION REPORT ===');
    this.log(`Node Environment: ${report.nodeEnv}`);
    this.log(`Database: ${report.hasDatabase ? '✅ Connected' : '❌ Not configured'}`);
    this.log(`Redis: ${report.hasRedis ? '✅ Connected' : '⚠️ Not configured'}`);
    this.log(`Azure AI: ${report.hasAzureAI ? '✅ Enabled' : '⚠️ Not configured'}`);
    this.log(`App URL: ${report.appUrl || 'Not set'}`);
    this.log(`Required Variables: ${report.requiredVarsCount}/${report.totalRequiredVars}`);
    this.log(`Optional Variables: ${report.optionalVarsCount}/${report.totalOptionalVars}`);
    this.log(`Social Integration Variables: ${report.socialVarsCount}/${report.totalSocialVars}`);
    
    return report;
  }

  reportValidationResults() {
    this.log('=== VALIDATION SUMMARY ===');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ All environment validations passed!');
      return true;
    }

    if (this.errors.length > 0) {
      this.log(`Found ${this.errors.length} error(s):`, 'error');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.message}`, 'error');
      });
    }

    if (this.warnings.length > 0) {
      this.log(`Found ${this.warnings.length} warning(s):`, 'warning');
      this.warnings.forEach((warning, index) => {
        this.log(`${index + 1}. ${warning.message}`, 'warning');
      });
    }

    if (this.recommendations.length > 0) {
      this.log('Recommendations:');
      this.recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`);
      });
    }

    return this.errors.length === 0;
  }

  validate() {
    this.log('🔍 Starting comprehensive environment validation...');
    
    try {
      // Reset validation state
      this.errors = [];
      this.warnings = [];
      this.recommendations = [];

      // Run all validations
      const { missing, invalid } = this.validateRequiredVars();
      
      // Handle invalid formats
      invalid.forEach(({ var: varName, reason, severity }) => {
        if (severity === 'error') {
          this.errors.push({
            type: 'environment',
            message: `${varName}: ${reason}`,
            severity
          });
        } else {
          this.warnings.push({
            type: 'environment',
            message: `${varName}: ${reason}`,
            severity
          });
        }
      });

      // Handle missing variables
      const isValid = this.handleMissingVariables(missing);
      
      // Validate optional and social integration variables
      this.validateOptionalVars();
      this.validateSocialIntegrations();
      
      // Environment-specific validations
      this.validateEnvironmentSpecific();
      
      // Set up defaults if validation passes
      if (isValid && this.errors.length === 0) {
        this.setupEnvironmentDefaults();
      }
      
      // Generate report
      this.generateConfigReport();
      
      // Report results
      const success = this.reportValidationResults();
      
      if (success) {
        this.log('✅ Environment configuration validated successfully');
      } else {
        this.log('❌ Environment configuration validation failed', 'error');
      }
      
      return success;
      
    } catch (error) {
      this.log(`Environment validation failed with error: ${error.message}`, 'error');
      return false;
    }
  }
}

module.exports = AmplifyEnvironmentConfig;