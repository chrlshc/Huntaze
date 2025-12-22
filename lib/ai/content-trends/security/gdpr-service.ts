/**
 * GDPR Compliance Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Data protection and privacy compliance with GDPR requirements.
 * Handles PII detection, anonymization, data retention, and subject rights.
 */

import {
  GDPRConfig,
  GDPRService,
  AnonymizationRule,
  AnonymizationMethod,
  DataRetentionPolicy,
  DataSubjectRequest,
  PIIDetectionResult,
  PIIType,
  ResourceType,
} from './types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_GDPR_CONFIG: GDPRConfig = {
  dataRetentionDays: 365,
  piiFields: [
    'email', 'phone', 'name', 'address', 'ip', 'userId',
    'socialHandle', 'username', 'displayName',
  ],
  anonymizationRules: [
    { fieldPath: 'email', method: 'hash' },
    { fieldPath: 'phone', method: 'mask', preserveFormat: true },
    { fieldPath: 'name', method: 'pseudonymize' },
    { fieldPath: 'ip', method: 'generalize' },
  ],
  consentRequired: true,
  dataSubjectRightsEnabled: true,
};

// ============================================================================
// PII Detection Patterns
// ============================================================================

const PII_PATTERNS: Record<PIIType, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  name: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)\b/gi,
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  social_media_handle: /@[a-zA-Z0-9_]{1,30}/g,
  financial: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  health: /\b(?:diagnosis|treatment|medication|prescription|patient)\b/gi,
  biometric: /\b(?:fingerprint|facial|retina|voice\s*print|dna)\b/gi,
};

// ============================================================================
// GDPR Service Implementation
// ============================================================================

export class GDPRComplianceService implements GDPRService {
  private config: GDPRConfig;
  private retentionPolicies: Map<ResourceType, DataRetentionPolicy> = new Map();
  private pendingRequests: Map<string, DataSubjectRequest> = new Map();

  constructor(config: Partial<GDPRConfig> = {}) {
    this.config = { ...DEFAULT_GDPR_CONFIG, ...config };
    this.initializeRetentionPolicies();
  }

  /**
   * Anonymize data according to configured rules
   */
  async anonymizeData<T>(data: T, rules?: AnonymizationRule[]): Promise<T> {
    const rulesToApply = rules || this.config.anonymizationRules;
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const result = JSON.parse(JSON.stringify(data));
    
    for (const rule of rulesToApply) {
      this.applyAnonymizationRule(result, rule);
    }

    return result;
  }

  /**
   * Detect PII in text content
   */
  async detectPII(text: string): Promise<PIIDetectionResult[]> {
    const results: PIIDetectionResult[] = [];

    for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        results.push({
          field: 'text',
          value: match[0],
          piiType: piiType as PIIType,
          confidence: this.calculateConfidence(piiType as PIIType, match[0]),
          location: {
            start: match.index,
            end: match.index + match[0].length,
          },
        });
      }
    }

    return results;
  }

  /**
   * Process a data subject request (GDPR Article 15-22)
   */
  async processDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    this.pendingRequests.set(request.id, {
      ...request,
      status: 'in_progress',
    });

    try {
      switch (request.type) {
        case 'access':
          await this.handleAccessRequest(request);
          break;
        case 'rectification':
          await this.handleRectificationRequest(request);
          break;
        case 'erasure':
          await this.handleErasureRequest(request);
          break;
        case 'portability':
          await this.handlePortabilityRequest(request);
          break;
        case 'restriction':
          await this.handleRestrictionRequest(request);
          break;
      }

      this.pendingRequests.set(request.id, {
        ...request,
        status: 'completed',
        completedAt: new Date(),
      });
    } catch (error) {
      this.pendingRequests.set(request.id, {
        ...request,
        status: 'rejected',
        notes: error instanceof Error ? error.message : 'Processing failed',
      });
      throw error;
    }
  }

  /**
   * Enforce data retention policies
   */
  async enforceRetention(resourceType: ResourceType): Promise<number> {
    const policy = this.retentionPolicies.get(resourceType);
    if (!policy) {
      return 0;
    }

    // This would typically interact with a database
    // For now, return 0 as placeholder
    console.log(`Enforcing retention for ${resourceType}: ${policy.deleteAfterDays} days`);
    return 0;
  }

  /**
   * Check if data processing requires consent
   */
  requiresConsent(processingPurpose: string): boolean {
    if (!this.config.consentRequired) return false;

    const exemptPurposes = [
      'legal_obligation',
      'vital_interests',
      'public_interest',
      'legitimate_interests',
    ];

    return !exemptPurposes.includes(processingPurpose);
  }

  /**
   * Get retention policy for a resource type
   */
  getRetentionPolicy(resourceType: ResourceType): DataRetentionPolicy | undefined {
    return this.retentionPolicies.get(resourceType);
  }

  /**
   * Get pending data subject requests
   */
  getPendingRequests(): DataSubjectRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(r => r.status === 'pending' || r.status === 'in_progress');
  }

  /**
   * Redact PII from text
   */
  redactPII(text: string, piiTypes?: PIIType[]): string {
    let result = text;
    const typesToRedact = piiTypes || (Object.keys(PII_PATTERNS) as PIIType[]);

    for (const piiType of typesToRedact) {
      const pattern = PII_PATTERNS[piiType];
      if (pattern) {
        result = result.replace(pattern, `[REDACTED:${piiType.toUpperCase()}]`);
      }
    }

    return result;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeRetentionPolicies(): void {
    const defaultPolicies: DataRetentionPolicy[] = [
      {
        resourceType: 'viral_analysis',
        retentionDays: 365,
        archiveAfterDays: 180,
        deleteAfterDays: 730,
        legalHoldExempt: false,
      },
      {
        resourceType: 'content_script',
        retentionDays: 365,
        archiveAfterDays: 180,
        deleteAfterDays: 730,
        legalHoldExempt: false,
      },
      {
        resourceType: 'competitor_data',
        retentionDays: 90,
        deleteAfterDays: 180,
        legalHoldExempt: false,
      },
      {
        resourceType: 'trend_data',
        retentionDays: 180,
        deleteAfterDays: 365,
        legalHoldExempt: false,
      },
      {
        resourceType: 'user',
        retentionDays: 730,
        deleteAfterDays: 1095,
        legalHoldExempt: true,
      },
    ];

    for (const policy of defaultPolicies) {
      this.retentionPolicies.set(policy.resourceType, policy);
    }
  }

  private applyAnonymizationRule(obj: Record<string, unknown>, rule: AnonymizationRule): void {
    const pathParts = rule.fieldPath.split('.');
    let current: unknown = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (typeof current !== 'object' || current === null) return;
      current = (current as Record<string, unknown>)[pathParts[i]];
    }

    if (typeof current !== 'object' || current === null) return;

    const finalKey = pathParts[pathParts.length - 1];
    const value = (current as Record<string, unknown>)[finalKey];

    if (value !== undefined) {
      (current as Record<string, unknown>)[finalKey] = this.anonymizeValue(
        value,
        rule.method,
        rule.preserveFormat
      );
    }
  }

  private anonymizeValue(
    value: unknown,
    method: AnonymizationMethod,
    preserveFormat?: boolean
  ): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    switch (method) {
      case 'hash':
        return this.hashValue(value);
      case 'mask':
        return this.maskValue(value, preserveFormat);
      case 'redact':
        return '[REDACTED]';
      case 'pseudonymize':
        return this.pseudonymize(value);
      case 'generalize':
        return this.generalize(value);
      case 'suppress':
        return null;
      default:
        return value;
    }
  }

  private hashValue(value: string): string {
    // Simple hash for demonstration - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  private maskValue(value: string, preserveFormat?: boolean): string {
    if (preserveFormat) {
      return value.replace(/[a-zA-Z]/g, 'X').replace(/[0-9]/g, '0');
    }
    return '*'.repeat(value.length);
  }

  private pseudonymize(value: string): string {
    const pseudonyms = [
      'User_Alpha', 'User_Beta', 'User_Gamma', 'User_Delta',
      'User_Epsilon', 'User_Zeta', 'User_Eta', 'User_Theta',
    ];
    const index = Math.abs(this.simpleHash(value)) % pseudonyms.length;
    return pseudonyms[index];
  }

  private generalize(value: string): string {
    // For IP addresses, generalize to /24 network
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
      const parts = value.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    // For other values, return category
    return '[GENERALIZED]';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
    }
    return hash;
  }

  private calculateConfidence(piiType: PIIType, value: string): number {
    // Higher confidence for more specific patterns
    const baseConfidence: Record<PIIType, number> = {
      email: 0.95,
      phone: 0.85,
      ip_address: 0.90,
      social_media_handle: 0.80,
      financial: 0.90,
      name: 0.60,
      address: 0.70,
      health: 0.50,
      biometric: 0.50,
    };

    let confidence = baseConfidence[piiType] || 0.5;

    // Adjust based on value characteristics
    if (piiType === 'email' && value.includes('.com')) confidence += 0.02;
    if (piiType === 'phone' && value.length >= 10) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  private async handleAccessRequest(request: DataSubjectRequest): Promise<void> {
    console.log(`Processing access request for ${request.subjectEmail}`);
    // Would gather all data associated with the subject
  }

  private async handleRectificationRequest(request: DataSubjectRequest): Promise<void> {
    console.log(`Processing rectification request for ${request.subjectEmail}`);
    // Would update incorrect data
  }

  private async handleErasureRequest(request: DataSubjectRequest): Promise<void> {
    console.log(`Processing erasure request for ${request.subjectEmail}`);
    // Would delete all data associated with the subject
  }

  private async handlePortabilityRequest(request: DataSubjectRequest): Promise<void> {
    console.log(`Processing portability request for ${request.subjectEmail}`);
    // Would export data in machine-readable format
  }

  private async handleRestrictionRequest(request: DataSubjectRequest): Promise<void> {
    console.log(`Processing restriction request for ${request.subjectEmail}`);
    // Would restrict processing of subject's data
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGDPRService(config?: Partial<GDPRConfig>): GDPRComplianceService {
  return new GDPRComplianceService(config);
}
