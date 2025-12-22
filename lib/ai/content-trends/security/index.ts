/**
 * Security Module Exports
 * Content & Trends AI Engine - Phase 6
 * 
 * Zero Trust architecture, RBAC, audit logging, and GDPR compliance.
 */

// Types
export * from './types';

// Services
export { RBACService, parsePermission, buildPermission, isReadPermission, isWritePermission, isDeletePermission, compareRoles, getHighestRole } from './rbac-service';
export { EntraIdService, createEntraIdService } from './entra-id-service';
export { AzureKeyVaultService, createKeyVaultService, SECRET_NAMES } from './key-vault-service';
export { AuditLogger, createAuditLogger, getAuditLogger } from './audit-logger';
export type { AuditLoggerConfig, AuditBackend, AuditQueryFilters } from './audit-logger';
export { GDPRComplianceService, createGDPRService } from './gdpr-service';
