/**
 * Integrations Management System
 * 
 * Exports the main service and utilities for managing OAuth integrations
 */

export { IntegrationsService, integrationsService } from './integrations.service';
export { encryptToken, decryptToken, isEncrypted, safeEncrypt, safeDecrypt } from './encryption';
export * from './types';
export * from './adapters';
