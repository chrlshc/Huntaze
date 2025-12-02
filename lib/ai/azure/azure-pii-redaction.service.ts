/**
 * Azure PII Redaction Service
 * Implements PII detection and redaction for logs before sending to Application Insights
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 36: Implement PII redaction for logs
 * Validates: Requirements 9.4
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PIIPattern {
  name: string;
  type: PIIType;
  pattern: RegExp;
  replacement: string;
  enabled: boolean;
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'name'
  | 'address'
  | 'date_of_birth'
  | 'passport'
  | 'driver_license'
  | 'bank_account'
  | 'api_key'
  | 'password'
  | 'custom';

export interface RedactionResult {
  original: string;
  redacted: string;
  redactionsApplied: RedactionMatch[];
  containsPII: boolean;
}

export interface RedactionMatch {
  type: PIIType;
  patternName: string;
  originalValue: string;
  startIndex: number;
  endIndex: number;
}

export interface RedactionConfig {
  enabled: boolean;
  logRedactions: boolean;
  preserveFormat: boolean;
  customPatterns: PIIPattern[];
}

export interface RedactionStats {
  totalProcessed: number;
  totalRedacted: number;
  byType: Record<PIIType, number>;
}

// ============================================================================
// Default PII Patterns
// ============================================================================

export const DEFAULT_PII_PATTERNS: PIIPattern[] = [
  // Email addresses
  {
    name: 'email',
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    replacement: '[EMAIL_REDACTED]',
    enabled: true,
  },
  // Phone numbers (various formats)
  {
    name: 'phone_us',
    type: 'phone',
    pattern: /\b(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    replacement: '[PHONE_REDACTED]',
    enabled: true,
  },
  {
    name: 'phone_international',
    type: 'phone',
    pattern: /\b\+[0-9]{1,3}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}\b/g,
    replacement: '[PHONE_REDACTED]',
    enabled: true,
  },
  // Social Security Numbers
  {
    name: 'ssn',
    type: 'ssn',
    pattern: /\b[0-9]{3}[-\s]?[0-9]{2}[-\s]?[0-9]{4}\b/g,
    replacement: '[SSN_REDACTED]',
    enabled: true,
  },
  // Credit Card Numbers (basic patterns)
  {
    name: 'credit_card',
    type: 'credit_card',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    replacement: '[CARD_REDACTED]',
    enabled: true,
  },
  {
    name: 'credit_card_formatted',
    type: 'credit_card',
    pattern: /\b[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/g,
    replacement: '[CARD_REDACTED]',
    enabled: true,
  },
  // IP Addresses
  {
    name: 'ipv4',
    type: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    replacement: '[IP_REDACTED]',
    enabled: true,
  },
  {
    name: 'ipv6',
    type: 'ip_address',
    pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    replacement: '[IP_REDACTED]',
    enabled: true,
  },
  // API Keys and Secrets (common patterns)
  {
    name: 'api_key_generic',
    type: 'api_key',
    pattern: /\b(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)[=:\s]+['"]?[A-Za-z0-9_-]{20,}['"]?/gi,
    replacement: '[API_KEY_REDACTED]',
    enabled: true,
  },
  {
    name: 'bearer_token',
    type: 'api_key',
    pattern: /\bBearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi,
    replacement: 'Bearer [TOKEN_REDACTED]',
    enabled: true,
  },
  {
    name: 'azure_key',
    type: 'api_key',
    pattern: /\b[A-Za-z0-9]{32,}\b/g,
    replacement: '[KEY_REDACTED]',
    enabled: false, // Disabled by default as it's too broad
  },
  // Passwords in logs
  {
    name: 'password_field',
    type: 'password',
    pattern: /\b(?:password|passwd|pwd)[=:\s]+['"]?[^\s'"]{4,}['"]?/gi,
    replacement: '[PASSWORD_REDACTED]',
    enabled: true,
  },
  // Date of Birth patterns
  {
    name: 'dob_us',
    type: 'date_of_birth',
    pattern: /\b(?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12][0-9]|3[01])[-/](?:19|20)[0-9]{2}\b/g,
    replacement: '[DOB_REDACTED]',
    enabled: true,
  },
  {
    name: 'dob_iso',
    type: 'date_of_birth',
    pattern: /\b(?:19|20)[0-9]{2}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12][0-9]|3[01])\b/g,
    replacement: '[DOB_REDACTED]',
    enabled: true,
  },
  // Bank Account Numbers (basic)
  {
    name: 'bank_account',
    type: 'bank_account',
    pattern: /\b(?:account|acct)[#:\s]+[0-9]{8,17}\b/gi,
    replacement: '[ACCOUNT_REDACTED]',
    enabled: true,
  },
  // IBAN
  {
    name: 'iban',
    type: 'bank_account',
    pattern: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]?){0,16}\b/g,
    replacement: '[IBAN_REDACTED]',
    enabled: true,
  },
];

// ============================================================================
// Azure PII Redaction Service
// ============================================================================

export class AzurePIIRedactionService {
  private patterns: PIIPattern[] = [];
  private config: RedactionConfig;
  private stats: RedactionStats;
  private static instance: AzurePIIRedactionService | null = null;

  constructor(config?: Partial<RedactionConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      logRedactions: config?.logRedactions ?? false,
      preserveFormat: config?.preserveFormat ?? false,
      customPatterns: config?.customPatterns ?? [],
    };

    this.patterns = [...DEFAULT_PII_PATTERNS, ...this.config.customPatterns];
    this.stats = this.initializeStats();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AzurePIIRedactionService {
    if (!AzurePIIRedactionService.instance) {
      AzurePIIRedactionService.instance = new AzurePIIRedactionService();
    }
    return AzurePIIRedactionService.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    AzurePIIRedactionService.instance = null;
  }

  /**
   * Initialize stats
   */
  private initializeStats(): RedactionStats {
    const byType: Record<PIIType, number> = {
      email: 0,
      phone: 0,
      ssn: 0,
      credit_card: 0,
      ip_address: 0,
      name: 0,
      address: 0,
      date_of_birth: 0,
      passport: 0,
      driver_license: 0,
      bank_account: 0,
      api_key: 0,
      password: 0,
      custom: 0,
    };

    return {
      totalProcessed: 0,
      totalRedacted: 0,
      byType,
    };
  }

  /**
   * Redact PII from a string
   * **Feature: huntaze-ai-azure-migration, Property 32: PII redaction in logs**
   * **Validates: Requirements 9.4**
   */
  redact(input: string): RedactionResult {
    if (!this.config.enabled || !input) {
      return {
        original: input,
        redacted: input,
        redactionsApplied: [],
        containsPII: false,
      };
    }

    this.stats.totalProcessed++;

    let redacted = input;
    const redactionsApplied: RedactionMatch[] = [];

    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;

      // Reset regex lastIndex for global patterns
      pattern.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      const matches: { value: string; index: number }[] = [];

      // Collect all matches first
      while ((match = pattern.pattern.exec(input)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
        });
      }

      // Apply redactions (in reverse order to preserve indices)
      for (const m of matches.reverse()) {
        redactionsApplied.push({
          type: pattern.type,
          patternName: pattern.name,
          originalValue: this.config.logRedactions ? m.value : '[LOGGED_SEPARATELY]',
          startIndex: m.index,
          endIndex: m.index + m.value.length,
        });

        // Update stats
        this.stats.byType[pattern.type]++;
      }

      // Apply replacement
      pattern.pattern.lastIndex = 0;
      redacted = redacted.replace(pattern.pattern, pattern.replacement);
    }

    const containsPII = redactionsApplied.length > 0;
    if (containsPII) {
      this.stats.totalRedacted++;
    }

    return {
      original: input,
      redacted,
      redactionsApplied,
      containsPII,
    };
  }

  /**
   * Redact PII from an object (recursively)
   */
  redactObject<T extends Record<string, unknown>>(obj: T): T {
    if (!this.config.enabled) return obj;

    const redacted = { ...obj } as Record<string, unknown>;

    for (const [key, value] of Object.entries(redacted)) {
      if (typeof value === 'string') {
        redacted[key] = this.redact(value).redacted;
      } else if (Array.isArray(value)) {
        redacted[key] = value.map(item => {
          if (typeof item === 'string') {
            return this.redact(item).redacted;
          } else if (typeof item === 'object' && item !== null) {
            return this.redactObject(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactObject(value as Record<string, unknown>);
      }
    }

    return redacted as T;
  }

  /**
   * Check if a string contains PII
   */
  containsPII(input: string): boolean {
    if (!input) return false;

    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;
      pattern.pattern.lastIndex = 0;
      if (pattern.pattern.test(input)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect PII types in a string
   */
  detectPIITypes(input: string): PIIType[] {
    if (!input) return [];

    const types = new Set<PIIType>();

    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;
      pattern.pattern.lastIndex = 0;
      if (pattern.pattern.test(input)) {
        types.add(pattern.type);
      }
    }

    return Array.from(types);
  }

  /**
   * Add a custom pattern
   */
  addPattern(pattern: PIIPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove a pattern by name
   */
  removePattern(name: string): boolean {
    const index = this.patterns.findIndex(p => p.name === name);
    if (index === -1) return false;
    this.patterns.splice(index, 1);
    return true;
  }

  /**
   * Enable/disable a pattern
   */
  setPatternEnabled(name: string, enabled: boolean): boolean {
    const pattern = this.patterns.find(p => p.name === name);
    if (!pattern) return false;
    pattern.enabled = enabled;
    return true;
  }

  /**
   * Get all patterns
   */
  getPatterns(): PIIPattern[] {
    return [...this.patterns];
  }

  /**
   * Get enabled patterns
   */
  getEnabledPatterns(): PIIPattern[] {
    return this.patterns.filter(p => p.enabled);
  }

  /**
   * Get redaction statistics
   */
  getStats(): RedactionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RedactionConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.customPatterns) {
      this.patterns = [...DEFAULT_PII_PATTERNS, ...config.customPatterns];
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RedactionConfig {
    return { ...this.config };
  }

  /**
   * Verify redaction completeness
   * Returns true if no PII is found in the redacted string
   */
  verifyRedaction(redactedString: string): boolean {
    return !this.containsPII(redactedString);
  }

  /**
   * Create a safe log entry
   */
  createSafeLogEntry(
    message: string,
    data?: Record<string, unknown>
  ): { message: string; data?: Record<string, unknown> } {
    const safeMessage = this.redact(message).redacted;
    const safeData = data ? this.redactObject(data) : undefined;

    return {
      message: safeMessage,
      data: safeData,
    };
  }
}

// Export singleton instance
export const azurePIIRedactionService = AzurePIIRedactionService.getInstance();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick redact function for convenience
 */
export function redactPII(input: string): string {
  return azurePIIRedactionService.redact(input).redacted;
}

/**
 * Check if string contains PII
 */
export function hasPII(input: string): boolean {
  return azurePIIRedactionService.containsPII(input);
}

/**
 * Create safe log entry
 */
export function safeLog(
  message: string,
  data?: Record<string, unknown>
): { message: string; data?: Record<string, unknown> } {
  return azurePIIRedactionService.createSafeLogEntry(message, data);
}
