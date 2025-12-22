/**
 * Security and Compliance Types
 * Content & Trends AI Engine - Phase 6
 * 
 * Type definitions for Zero Trust architecture, RBAC, audit logging,
 * and GDPR compliance.
 */

// ============================================================================
// Authentication & Authorization Types
// ============================================================================

export interface EntraIdConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  authority: string;
  scopes: string[];
  redirectUri?: string;
}

export interface UserIdentity {
  userId: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  permissions: Permission[];
  tenantId: string;
  authenticatedAt: Date;
  tokenExpiry: Date;
  mfaEnabled: boolean;
  lastActivity?: Date;
}

export type UserRole = 
  | 'admin'
  | 'analyst'
  | 'content_creator'
  | 'viewer'
  | 'api_service';

export type Permission =
  | 'viral_analysis:read'
  | 'viral_analysis:write'
  | 'viral_analysis:delete'
  | 'content_generation:read'
  | 'content_generation:write'
  | 'competitor_intelligence:read'
  | 'competitor_intelligence:write'
  | 'audit_logs:read'
  | 'settings:read'
  | 'settings:write'
  | 'api_keys:manage'
  | 'users:manage';

export interface RBACPolicy {
  role: UserRole;
  permissions: Permission[];
  resourcePatterns: string[];
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  type: 'time_based' | 'ip_based' | 'resource_owner' | 'custom';
  config: Record<string, unknown>;
}

// ============================================================================
// Key Vault Types
// ============================================================================

export interface KeyVaultConfig {
  vaultUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  useManagedIdentity: boolean;
}

export interface SecretMetadata {
  name: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  enabled: boolean;
  contentType?: string;
  tags: Record<string, string>;
}

export interface SecretRotationConfig {
  secretName: string;
  rotationIntervalDays: number;
  notifyBeforeDays: number;
  autoRotate: boolean;
  rotationCallback?: string;
}

// ============================================================================
// Audit Logging Types
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  userEmail?: string;
  userRole?: UserRole;
  resourceType: ResourceType;
  resourceId?: string;
  action: AuditAction;
  outcome: 'success' | 'failure' | 'partial';
  details: AuditDetails;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  duration?: number;
  errorMessage?: string;
}

export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'ai_model_interaction'
  | 'content_generation'
  | 'viral_analysis'
  | 'competitor_intelligence'
  | 'configuration_change'
  | 'security_event';

export type ResourceType =
  | 'viral_analysis'
  | 'content_script'
  | 'ugc_brief'
  | 'competitor_data'
  | 'trend_data'
  | 'ai_model'
  | 'user'
  | 'api_key'
  | 'configuration'
  | 'webhook';

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'share'
  | 'invoke'
  | 'login'
  | 'logout'
  | 'token_refresh';

export interface AuditDetails {
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  tokensConsumed?: number;
  modelUsed?: string;
  analysisType?: string;
  dataClassification?: DataClassification;
  sensitiveFieldsAccessed?: string[];
  changesSummary?: string;
  previousValue?: unknown;
  newValue?: unknown;
}

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

// ============================================================================
// GDPR Compliance Types
// ============================================================================

export interface GDPRConfig {
  dataRetentionDays: number;
  piiFields: string[];
  anonymizationRules: AnonymizationRule[];
  consentRequired: boolean;
  dataSubjectRightsEnabled: boolean;
}

export interface AnonymizationRule {
  fieldPath: string;
  method: AnonymizationMethod;
  preserveFormat?: boolean;
  customTransform?: string;
}

export type AnonymizationMethod =
  | 'hash'
  | 'mask'
  | 'redact'
  | 'pseudonymize'
  | 'generalize'
  | 'suppress';

export interface DataRetentionPolicy {
  resourceType: ResourceType;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays: number;
  legalHoldExempt: boolean;
}

export interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  subjectEmail: string;
  requestedAt: Date;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedAt?: Date;
  notes?: string;
}

export interface PIIDetectionResult {
  field: string;
  value: string;
  piiType: PIIType;
  confidence: number;
  location: {
    start: number;
    end: number;
  };
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'name'
  | 'address'
  | 'ip_address'
  | 'social_media_handle'
  | 'financial'
  | 'health'
  | 'biometric';

// ============================================================================
// Data Boundary Types
// ============================================================================

export interface DataBoundaryConfig {
  allowedRegions: string[];
  restrictedDataTypes: string[];
  externalSharingPolicy: ExternalSharingPolicy;
  encryptionRequired: boolean;
  crossBorderTransferAllowed: boolean;
}

export interface ExternalSharingPolicy {
  allowedDomains: string[];
  requireApproval: boolean;
  maxRetentionDays: number;
  auditRequired: boolean;
}

export interface DataClassificationResult {
  resourceId: string;
  classification: DataClassification;
  sensitiveFields: string[];
  piiDetected: boolean;
  competitorDataDetected: boolean;
  confidenceScore: number;
  classifiedAt: Date;
}

// ============================================================================
// Security Event Types
// ============================================================================

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  severity: SecuritySeverity;
  eventType: SecurityEventType;
  source: string;
  description: string;
  affectedResources: string[];
  indicators: SecurityIndicator[];
  mitigationStatus: 'pending' | 'in_progress' | 'mitigated' | 'false_positive';
  assignedTo?: string;
}

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SecurityEventType =
  | 'unauthorized_access'
  | 'brute_force_attempt'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'suspicious_activity'
  | 'policy_violation'
  | 'api_abuse'
  | 'token_compromise';

export interface SecurityIndicator {
  type: 'ip_address' | 'user_agent' | 'request_pattern' | 'time_anomaly';
  value: string;
  confidence: number;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface SecurityService {
  validateToken(token: string): Promise<UserIdentity>;
  checkPermission(userId: string, permission: Permission, resourceId?: string): Promise<boolean>;
  logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
  detectSecurityThreat(context: SecurityContext): Promise<SecurityEvent | null>;
}

export interface KeyVaultService {
  getSecret(name: string): Promise<string>;
  setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
  rotateSecret(name: string): Promise<void>;
  listSecrets(): Promise<SecretMetadata[]>;
}

export interface GDPRService {
  anonymizeData<T>(data: T, rules: AnonymizationRule[]): Promise<T>;
  detectPII(text: string): Promise<PIIDetectionResult[]>;
  processDataSubjectRequest(request: DataSubjectRequest): Promise<void>;
  enforceRetention(resourceType: ResourceType): Promise<number>;
}

export interface SecurityContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  requestPath: string;
  requestMethod: string;
  timestamp: Date;
  sessionId?: string;
}
