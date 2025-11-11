// Security Token Management
export {
  SecurityTokenGenerator,
  securityTokenGenerator,
  type SecurityTokens,
  type TokenValidationResult,
} from './securityTokenGenerator';

export {
  TokenBackupService,
  tokenBackupService,
  type TokenBackup,
  type BackupMetadata,
} from './tokenBackupService';

export {
  SecurityTokenService,
  securityTokenService,
  type SecurityTokenValidationReport,
  type TokenRotationResult,
} from './securityTokenService';

// Import instances for utility functions
import { securityTokenGenerator, type SecurityTokens } from './securityTokenGenerator';
import { tokenBackupService } from './tokenBackupService';
import { securityTokenService } from './securityTokenService';

// Utility functions for quick access
export const generateSecureTokens = () => securityTokenGenerator.generateSecurityTokens();
export const validateTokens = (adminToken: string, debugToken: string) => 
  securityTokenGenerator.validateExistingTokens(adminToken, debugToken);
export const createTokenBackup = (tokens: SecurityTokens, environment?: string) => 
  tokenBackupService.createBackup(tokens, environment);
export const getSecurityHealth = () => securityTokenService.getSecurityHealthStatus();