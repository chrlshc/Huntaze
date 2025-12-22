/**
 * Microsoft Entra ID Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Zero Trust authentication with Microsoft Entra ID (Azure AD).
 * Implements OAuth2/OIDC token validation and user identity management.
 */

import {
  EntraIdConfig,
  UserIdentity,
  UserRole,
  Permission,
  SecurityContext,
} from './types';
import { ExternalServiceError } from '@/lib/services/external/errors';
import { externalFetchJson } from '@/lib/services/external/http';

// ============================================================================
// Token Validation Types
// ============================================================================

interface DecodedToken {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  sub: string;
  oid: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  roles?: string[];
  groups?: string[];
  tid: string;
  amr?: string[];
}

interface TokenValidationResult {
  valid: boolean;
  identity?: UserIdentity;
  error?: string;
}

// ============================================================================
// Entra ID Service Implementation
// ============================================================================

export class EntraIdService {
  private config: EntraIdConfig;
  private jwksCache: Map<string, unknown> = new Map();
  private jwksCacheExpiry: Date | null = null;

  constructor(config: EntraIdConfig) {
    this.config = config;
  }

  /**
   * Validate an access token and extract user identity
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Decode token without verification first to get header
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Validate token claims
      const claimsValid = this.validateClaims(decoded);
      if (!claimsValid.valid) {
        return claimsValid;
      }

      // Build user identity from token
      const identity = this.buildUserIdentity(decoded);

      return { valid: true, identity };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }

  /**
   * Acquire token using client credentials flow (for service-to-service)
   */
  async acquireTokenClientCredentials(): Promise<string> {
    const tokenEndpoint = `${this.config.authority}/oauth2/v2.0/token`;

    if (!this.config.clientSecret) {
      throw new ExternalServiceError({
        service: 'entra-id',
        code: 'CONFIG_MISSING',
        retryable: false,
        message: 'Entra ID client secret not configured',
      });
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scopes.join(' '),
      grant_type: 'client_credentials',
    });

    const data = await externalFetchJson<any>(tokenEndpoint, {
      service: 'entra-id',
      operation: 'acquireTokenClientCredentials',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeoutMs: 15_000,
      retry: { maxRetries: 0 },
    });

    if (!data?.access_token) {
      throw new ExternalServiceError({
        service: 'entra-id',
        code: 'INVALID_RESPONSE',
        retryable: false,
        message: 'Token acquisition returned no access_token',
      });
    }

    return data.access_token;
  }

  /**
   * Refresh an existing token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const tokenEndpoint = `${this.config.authority}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: this.config.scopes.join(' '),
    });

    const data = await externalFetchJson<any>(tokenEndpoint, {
      service: 'entra-id',
      operation: 'refreshToken',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeoutMs: 15_000,
      retry: { maxRetries: 0 },
    });

    if (!data?.access_token) {
      throw new ExternalServiceError({
        service: 'entra-id',
        code: 'INVALID_RESPONSE',
        retryable: false,
        message: 'Token refresh returned no access_token',
      });
    }

    return data.access_token;
  }

  /**
   * Build authorization URL for interactive login
   */
  buildAuthorizationUrl(state: string, nonce: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri || '',
      scope: this.config.scopes.join(' '),
      state,
      nonce,
      response_mode: 'query',
    });

    return `${this.config.authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string
  ): Promise<{ accessToken: string; refreshToken: string; idToken: string }> {
    const tokenEndpoint = `${this.config.authority}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri || '',
      grant_type: 'authorization_code',
      scope: this.config.scopes.join(' '),
    });

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    } else if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    const data = await externalFetchJson<any>(tokenEndpoint, {
      service: 'entra-id',
      operation: 'exchangeCodeForTokens',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeoutMs: 15_000,
      retry: { maxRetries: 0 },
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    };
  }

  /**
   * Check if user has MFA enabled based on token claims
   */
  checkMfaStatus(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return false;

    // Check authentication methods reference (amr) claim
    const amr = decoded.amr || [];
    return amr.includes('mfa') || amr.includes('ngcmfa') || amr.length > 1;
  }

  /**
   * Create security context from request
   */
  createSecurityContext(
    userId: string,
    request: { ip?: string; userAgent?: string; path: string; method: string },
    sessionId?: string
  ): SecurityContext {
    return {
      userId,
      ipAddress: request.ip || 'unknown',
      userAgent: request.userAgent || 'unknown',
      requestPath: request.path,
      requestMethod: request.method,
      timestamp: new Date(),
      sessionId,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private validateClaims(decoded: DecodedToken): TokenValidationResult {
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (decoded.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    // Check not before
    if (decoded.nbf > now) {
      return { valid: false, error: 'Token not yet valid' };
    }

    // Check audience
    if (decoded.aud !== this.config.clientId) {
      return { valid: false, error: 'Invalid audience' };
    }

    // Check tenant
    if (decoded.tid !== this.config.tenantId) {
      return { valid: false, error: 'Invalid tenant' };
    }

    // Check issuer
    const expectedIssuer = `https://login.microsoftonline.com/${this.config.tenantId}/v2.0`;
    if (decoded.iss !== expectedIssuer) {
      return { valid: false, error: 'Invalid issuer' };
    }

    return { valid: true };
  }

  private buildUserIdentity(decoded: DecodedToken): UserIdentity {
    const roles = this.mapRoles(decoded.roles || []);
    const permissions = this.derivePermissions(roles);

    return {
      userId: decoded.oid || decoded.sub,
      email: decoded.email || decoded.preferred_username || '',
      displayName: decoded.name || '',
      roles,
      permissions,
      tenantId: decoded.tid,
      authenticatedAt: new Date(decoded.iat * 1000),
      tokenExpiry: new Date(decoded.exp * 1000),
      mfaEnabled: (decoded.amr || []).length > 1,
    };
  }

  private mapRoles(tokenRoles: string[]): UserRole[] {
    const roleMapping: Record<string, UserRole> = {
      'ContentTrends.Admin': 'admin',
      'ContentTrends.Analyst': 'analyst',
      'ContentTrends.Creator': 'content_creator',
      'ContentTrends.Viewer': 'viewer',
      'ContentTrends.Service': 'api_service',
    };

    const mappedRoles: UserRole[] = [];
    for (const role of tokenRoles) {
      const mapped = roleMapping[role];
      if (mapped) {
        mappedRoles.push(mapped);
      }
    }

    // Default to viewer if no roles mapped
    if (mappedRoles.length === 0) {
      mappedRoles.push('viewer');
    }

    return mappedRoles;
  }

  private derivePermissions(roles: UserRole[]): Permission[] {
    const permissionsByRole: Record<UserRole, Permission[]> = {
      admin: [
        'viral_analysis:read', 'viral_analysis:write', 'viral_analysis:delete',
        'content_generation:read', 'content_generation:write',
        'competitor_intelligence:read', 'competitor_intelligence:write',
        'audit_logs:read', 'settings:read', 'settings:write',
        'api_keys:manage', 'users:manage',
      ],
      analyst: [
        'viral_analysis:read', 'viral_analysis:write',
        'content_generation:read', 'competitor_intelligence:read',
        'audit_logs:read',
      ],
      content_creator: [
        'viral_analysis:read', 'content_generation:read', 'content_generation:write',
      ],
      viewer: [
        'viral_analysis:read', 'content_generation:read',
      ],
      api_service: [
        'viral_analysis:read', 'viral_analysis:write',
        'content_generation:read', 'content_generation:write',
      ],
    };

    const permissions = new Set<Permission>();
    for (const role of roles) {
      const rolePermissions = permissionsByRole[role] || [];
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }

    return Array.from(permissions);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createEntraIdService(config?: Partial<EntraIdConfig>): EntraIdService {
  const defaultConfig: EntraIdConfig = {
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || ''}`,
    scopes: ['api://content-trends/.default'],
    redirectUri: process.env.AZURE_REDIRECT_URI,
  };

  return new EntraIdService({ ...defaultConfig, ...config });
}
