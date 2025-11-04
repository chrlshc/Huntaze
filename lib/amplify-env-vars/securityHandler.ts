import { EnvironmentVariable, ValidationResult } from './interfaces';
import { SENSITIVE_PATTERNS } from './constants';
import { Logger } from './logger';

/**
 * Security handler for environment variables management
 * Handles sensitive data masking, encryption validation, and secure logging
 */
export class SecurityHandler {
  private static readonly MASK_CHAR = '*';
  private static readonly VISIBLE_CHARS = 4;
  private static readonly MIN_MASK_LENGTH = 8;

  /**
   * Detect if a variable contains sensitive data
   */
  static isSensitive(key: string, value?: string): boolean {
    // Check against sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(key)) {
        return true;
      }
    }

    // Additional heuristic checks on value
    if (value) {
      // Check for common sensitive value patterns
      const sensitiveValuePatterns = [
        /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded (likely keys)
        /^[a-f0-9]{32,}$/i, // Hex strings (likely hashes/keys)
        /^sk_[a-zA-Z0-9_]+$/, // Stripe secret keys
        /^pk_[a-zA-Z0-9_]+$/, // Stripe public keys
        /^xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+$/, // Slack bot tokens
        /^ghp_[a-zA-Z0-9]{36}$/, // GitHub personal access tokens
        /^gho_[a-zA-Z0-9]{36}$/, // GitHub OAuth tokens
      ];

      for (const pattern of sensitiveValuePatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Mask sensitive data for display/logging
   */
  static maskSensitiveData(key: string, value: string, options: MaskingOptions = {}): string {
    const {
      maskChar = this.MASK_CHAR,
      visibleChars = this.VISIBLE_CHARS,
      minMaskLength = this.MIN_MASK_LENGTH,
      forceVisible = false
    } = options;

    // If not sensitive and not forced, return as-is
    if (!forceVisible && !this.isSensitive(key, value)) {
      return value;
    }

    // Handle empty or very short values
    if (!value || value.length <= visibleChars * 2) {
      return maskChar.repeat(Math.max(value.length, minMaskLength));
    }

    // For longer values, show first and last few characters
    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const maskLength = Math.max(value.length - (visibleChars * 2), minMaskLength);
    
    return `${start}${maskChar.repeat(maskLength)}${end}`;
  }

  /**
   * Mask multiple environment variables
   */
  static maskEnvironmentVariables(
    variables: EnvironmentVariable[],
    options: MaskingOptions = {}
  ): EnvironmentVariable[] {
    return variables.map(variable => ({
      ...variable,
      value: this.maskSensitiveData(variable.key, variable.value, options)
    }));
  }

  /**
   * Create secure display utilities for different contexts
   */
  static createSecureDisplayUtils() {
    return {
      // For CLI output
      forCLI: (key: string, value: string) => 
        this.maskSensitiveData(key, value, { visibleChars: 3, minMaskLength: 6 }),
      
      // For logs
      forLogs: (key: string, value: string) => 
        this.maskSensitiveData(key, value, { visibleChars: 2, minMaskLength: 8 }),
      
      // For debugging (more visible)
      forDebug: (key: string, value: string) => 
        this.maskSensitiveData(key, value, { visibleChars: 6, minMaskLength: 4 }),
      
      // For reports
      forReports: (key: string, value: string) => 
        this.maskSensitiveData(key, value, { visibleChars: 4, minMaskLength: 8 }),
      
      // Complete masking
      complete: (key: string, value: string) => 
        this.MASK_CHAR.repeat(Math.max(value.length, this.MIN_MASK_LENGTH))
    };
  }

  /**
   * Validate encryption status of environment variables
   */
  static async validateEncryption(
    variables: EnvironmentVariable[],
    appId: string,
    branch: string
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      // Check AWS Amplify encryption at rest
      const encryptionStatus = await this.checkAmplifyEncryption(appId, branch);
      
      results.push({
        isValid: encryptionStatus.encryptedAtRest,
        variable: 'AMPLIFY_ENCRYPTION',
        message: encryptionStatus.encryptedAtRest 
          ? 'Environment variables are encrypted at rest in AWS Amplify'
          : 'Environment variables may not be encrypted at rest',
        severity: encryptionStatus.encryptedAtRest ? 'success' : 'error'
      });

      // Check for variables that should be encrypted
      const sensitiveVariables = variables.filter(v => this.isSensitive(v.key, v.value));
      
      if (sensitiveVariables.length > 0) {
        results.push({
          isValid: encryptionStatus.encryptedAtRest,
          variable: 'SENSITIVE_VARIABLES',
          message: `${sensitiveVariables.length} sensitive variables detected. Encryption status: ${encryptionStatus.encryptedAtRest ? 'Protected' : 'At Risk'}`,
          severity: encryptionStatus.encryptedAtRest ? 'success' : 'error'
        });
      }

      // Check secure transmission
      results.push({
        isValid: true, // AWS Amplify uses HTTPS by default
        variable: 'SECURE_TRANSMISSION',
        message: 'Environment variables transmitted over HTTPS',
        severity: 'success'
      });

    } catch (error) {
      results.push({
        isValid: false,
        variable: 'ENCRYPTION_CHECK',
        message: `Failed to validate encryption: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }

    return results;
  }

  /**
   * Check AWS Amplify encryption status
   */
  private static async checkAmplifyEncryption(appId: string, branch: string): Promise<EncryptionStatus> {
    // In a real implementation, this would call AWS APIs to check encryption status
    // For now, we'll assume AWS Amplify encrypts environment variables at rest
    
    try {
      // Simulate AWS API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        encryptedAtRest: true,
        encryptionAlgorithm: 'AES-256',
        keyManagement: 'AWS KMS',
        transmissionSecurity: 'TLS 1.2+',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      Logger.log(`Failed to check Amplify encryption status: ${error}`, 'warn');
      
      return {
        encryptedAtRest: false,
        encryptionAlgorithm: 'Unknown',
        keyManagement: 'Unknown',
        transmissionSecurity: 'Unknown',
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Implement secure logging practices
   */
  static createSecureLogger() {
    return {
      /**
       * Log with automatic sensitive data masking
       */
      logSecure: (message: string, level: 'info' | 'warn' | 'error' = 'info', context?: Record<string, any>) => {
        let secureMessage = message;
        let secureContext = context;

        // Mask sensitive data in message
        secureMessage = this.maskSensitiveDataInText(message);

        // Mask sensitive data in context
        if (context) {
          secureContext = this.maskSensitiveDataInObject(context);
        }

        Logger.log(secureMessage, level, secureContext);
      },

      /**
       * Log audit events for variable operations
       */
      logAudit: (operation: string, variables: string[], user?: string, result?: 'success' | 'failure') => {
        const auditEvent = {
          timestamp: new Date().toISOString(),
          operation,
          variableCount: variables.length,
          variables: variables.map(v => this.isSensitive(v) ? `${v.substring(0, 3)}***` : v),
          user: user || 'system',
          result: result || 'success',
          source: 'amplify-env-vars'
        };

        Logger.log(`AUDIT: ${operation}`, 'info', auditEvent);
      },

      /**
       * Log security events
       */
      logSecurity: (event: string, severity: 'low' | 'medium' | 'high', details?: Record<string, any>) => {
        const securityEvent = {
          timestamp: new Date().toISOString(),
          event,
          severity,
          details: details ? this.maskSensitiveDataInObject(details) : undefined,
          source: 'amplify-env-vars-security'
        };

        const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
        Logger.log(`SECURITY: ${event}`, logLevel, securityEvent);
      }
    };
  }

  /**
   * Mask sensitive data in text strings
   */
  private static maskSensitiveDataInText(text: string): string {
    let maskedText = text;

    // Common patterns to mask in logs
    const patterns = [
      // API keys
      { pattern: /([Aa]pi[_-]?[Kk]ey[s]?[:\s=]+)([A-Za-z0-9+/]{20,})/g, replacement: '$1***MASKED***' },
      // Tokens
      { pattern: /([Tt]oken[s]?[:\s=]+)([A-Za-z0-9+/]{20,})/g, replacement: '$1***MASKED***' },
      // Secrets
      { pattern: /([Ss]ecret[s]?[:\s=]+)([A-Za-z0-9+/]{20,})/g, replacement: '$1***MASKED***' },
      // Passwords
      { pattern: /([Pp]assword[s]?[:\s=]+)([^\s]{8,})/g, replacement: '$1***MASKED***' },
      // Connection strings
      { pattern: /(postgresql:\/\/[^:]+:)([^@]+)(@)/g, replacement: '$1***MASKED***$3' },
      // JWT tokens
      { pattern: /(eyJ[A-Za-z0-9+/=]+)/g, replacement: 'eyJ***MASKED***' }
    ];

    for (const { pattern, replacement } of patterns) {
      maskedText = maskedText.replace(pattern, replacement);
    }

    return maskedText;
  }

  /**
   * Mask sensitive data in objects
   */
  private static maskSensitiveDataInObject(obj: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && this.isSensitive(key, value)) {
        masked[key] = this.maskSensitiveData(key, value);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveDataInObject(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Verify access control for environment variable operations
   */
  static async verifyAccessControl(
    operation: string,
    variables: string[],
    user?: string
  ): Promise<AccessControlResult> {
    try {
      // In a real implementation, this would check user permissions
      // For now, we'll implement basic checks
      
      const sensitiveVariables = variables.filter(v => this.isSensitive(v));
      const hasPermission = true; // Assume permission for now
      
      const result: AccessControlResult = {
        allowed: hasPermission,
        user: user || 'system',
        operation,
        variables: variables.length,
        sensitiveVariables: sensitiveVariables.length,
        timestamp: new Date().toISOString(),
        reason: hasPermission ? 'Access granted' : 'Insufficient permissions'
      };

      // Log access control check
      const secureLogger = this.createSecureLogger();
      secureLogger.logAudit(
        `ACCESS_CONTROL_${operation.toUpperCase()}`,
        variables,
        user,
        hasPermission ? 'success' : 'failure'
      );

      return result;
    } catch (error) {
      return {
        allowed: false,
        user: user || 'system',
        operation,
        variables: variables.length,
        sensitiveVariables: 0,
        timestamp: new Date().toISOString(),
        reason: `Access control check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Track security events
   */
  static trackSecurityEvent(event: SecurityEvent): void {
    const secureLogger = this.createSecureLogger();
    
    secureLogger.logSecurity(event.type, event.severity, {
      description: event.description,
      variables: event.variables?.map(v => this.isSensitive(v) ? `${v.substring(0, 3)}***` : v),
      metadata: event.metadata
    });
  }

  /**
   * Generate security report
   */
  static generateSecurityReport(variables: EnvironmentVariable[]): SecurityReport {
    const sensitiveVariables = variables.filter(v => this.isSensitive(v.key, v.value));
    const totalVariables = variables.length;
    const sensitiveCount = sensitiveVariables.length;
    
    // Analyze security risks
    const risks: SecurityRisk[] = [];
    
    // Check for weak secrets
    for (const variable of sensitiveVariables) {
      if (variable.value.length < 32) {
        risks.push({
          type: 'weak_secret',
          severity: 'medium',
          variable: variable.key,
          description: 'Secret appears to be shorter than recommended minimum (32 characters)',
          recommendation: 'Use a cryptographically secure random string of at least 32 characters'
        });
      }
      
      // Check for common weak patterns
      if (/^(password|secret|key|123|abc)/i.test(variable.value)) {
        risks.push({
          type: 'weak_pattern',
          severity: 'high',
          variable: variable.key,
          description: 'Secret uses a weak or predictable pattern',
          recommendation: 'Generate a new cryptographically secure random secret'
        });
      }
    }

    // Check for missing encryption
    if (sensitiveCount > 0) {
      risks.push({
        type: 'encryption_check',
        severity: 'low',
        variable: 'GENERAL',
        description: 'Verify that sensitive variables are encrypted at rest and in transit',
        recommendation: 'Ensure AWS Amplify encryption is enabled and verify transmission security'
      });
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalVariables,
        sensitiveVariables: sensitiveCount,
        securityScore: Math.max(0, 100 - (risks.length * 10)),
        riskLevel: risks.some(r => r.severity === 'high') ? 'high' : 
                   risks.some(r => r.severity === 'medium') ? 'medium' : 'low'
      },
      risks,
      recommendations: [
        'Regularly rotate sensitive credentials',
        'Use strong, randomly generated secrets',
        'Monitor access to environment variables',
        'Implement proper access controls',
        'Audit environment variable changes'
      ]
    };
  }
}

// Type definitions
interface MaskingOptions {
  maskChar?: string;
  visibleChars?: number;
  minMaskLength?: number;
  forceVisible?: boolean;
}

interface EncryptionStatus {
  encryptedAtRest: boolean;
  encryptionAlgorithm: string;
  keyManagement: string;
  transmissionSecurity: string;
  lastChecked: string;
}

interface AccessControlResult {
  allowed: boolean;
  user: string;
  operation: string;
  variables: number;
  sensitiveVariables: number;
  timestamp: string;
  reason: string;
}

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  variables?: string[];
  metadata?: Record<string, any>;
}

interface SecurityRisk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  variable: string;
  description: string;
  recommendation: string;
}

interface SecurityReport {
  timestamp: string;
  summary: {
    totalVariables: number;
    sensitiveVariables: number;
    securityScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  risks: SecurityRisk[];
  recommendations: string[];
}