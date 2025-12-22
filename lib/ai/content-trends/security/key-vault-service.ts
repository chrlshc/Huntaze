/**
 * Azure Key Vault Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Secure secrets management with Azure Key Vault.
 * Supports Managed Identity and client credentials authentication.
 */

import {
  KeyVaultConfig,
  SecretMetadata,
  SecretRotationConfig,
  KeyVaultService,
} from './types';
import { externalFetchJson } from '@/lib/services/external/http';

// ============================================================================
// Key Vault Service Implementation
// ============================================================================

export class AzureKeyVaultService implements KeyVaultService {
  private config: KeyVaultConfig;
  private secretCache: Map<string, { value: string; expiry: Date }> = new Map();
  private cacheTtlMs: number = 5 * 60 * 1000; // 5 minutes default

  constructor(config: KeyVaultConfig, cacheTtlMs?: number) {
    this.config = config;
    if (cacheTtlMs) {
      this.cacheTtlMs = cacheTtlMs;
    }
  }

  /**
   * Get a secret value from Key Vault
   */
  async getSecret(name: string): Promise<string> {
    // Check cache first
    const cached = this.secretCache.get(name);
    if (cached && cached.expiry > new Date()) {
      return cached.value;
    }

    const token = await this.getAccessToken();
    const url = `${this.config.vaultUrl}/secrets/${name}?api-version=7.4`;

    const data: any = await externalFetchJson(url, {
      service: 'azure-key-vault',
      operation: 'getSecret',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      timeoutMs: 15_000,
      retry: { maxRetries: 2, retryMethods: ['GET'] },
    });
    const value = data.value;

    // Cache the secret
    this.secretCache.set(name, {
      value,
      expiry: new Date(Date.now() + this.cacheTtlMs),
    });

    return value;
  }

  /**
   * Set a secret in Key Vault
   */
  async setSecret(
    name: string,
    value: string,
    metadata?: Partial<SecretMetadata>
  ): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.config.vaultUrl}/secrets/${name}?api-version=7.4`;

    const body: Record<string, unknown> = { value };

    if (metadata?.contentType) {
      body.contentType = metadata.contentType;
    }

    if (metadata?.tags) {
      body.tags = metadata.tags;
    }

    if (metadata?.expiresAt) {
      body.attributes = {
        exp: Math.floor(metadata.expiresAt.getTime() / 1000),
      };
    }

    await externalFetchJson(url, {
      service: 'azure-key-vault',
      operation: 'setSecret',
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      timeoutMs: 20_000,
      retry: { maxRetries: 1, retryMethods: ['PUT'] },
    });

    // Invalidate cache
    this.secretCache.delete(name);
  }

  /**
   * Rotate a secret (generate new value)
   */
  async rotateSecret(name: string): Promise<void> {
    // Get current secret metadata
    const metadata = await this.getSecretMetadata(name);
    
    // Generate new secret value
    const newValue = this.generateSecretValue();

    // Set new version
    await this.setSecret(name, newValue, {
      tags: {
        ...metadata.tags,
        rotatedAt: new Date().toISOString(),
        previousVersion: metadata.version,
      },
    });
  }

  /**
   * List all secrets in the vault
   */
  async listSecrets(): Promise<SecretMetadata[]> {
    const token = await this.getAccessToken();
    const url = `${this.config.vaultUrl}/secrets?api-version=7.4`;

    const data: any = await externalFetchJson(url, {
      service: 'azure-key-vault',
      operation: 'listSecrets',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      timeoutMs: 20_000,
      retry: { maxRetries: 2, retryMethods: ['GET'] },
    });
    const secrets: SecretMetadata[] = [];

    for (const item of data.value || []) {
      const name = item.id.split('/').pop();
      secrets.push({
        name,
        version: item.attributes?.version || 'current',
        createdAt: new Date(item.attributes?.created * 1000),
        updatedAt: new Date(item.attributes?.updated * 1000),
        expiresAt: item.attributes?.exp 
          ? new Date(item.attributes.exp * 1000) 
          : undefined,
        enabled: item.attributes?.enabled ?? true,
        contentType: item.contentType,
        tags: item.tags || {},
      });
    }

    return secrets;
  }

  /**
   * Get secret metadata without the value
   */
  async getSecretMetadata(name: string): Promise<SecretMetadata> {
    const token = await this.getAccessToken();
    const url = `${this.config.vaultUrl}/secrets/${name}?api-version=7.4`;

    const data: any = await externalFetchJson(url, {
      service: 'azure-key-vault',
      operation: 'getSecretMetadata',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      timeoutMs: 15_000,
      retry: { maxRetries: 2, retryMethods: ['GET'] },
    });

    return {
      name,
      version: data.id.split('/').pop() || 'current',
      createdAt: new Date(data.attributes?.created * 1000),
      updatedAt: new Date(data.attributes?.updated * 1000),
      expiresAt: data.attributes?.exp 
        ? new Date(data.attributes.exp * 1000) 
        : undefined,
      enabled: data.attributes?.enabled ?? true,
      contentType: data.contentType,
      tags: data.tags || {},
    };
  }

  /**
   * Delete a secret (soft delete)
   */
  async deleteSecret(name: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.config.vaultUrl}/secrets/${name}?api-version=7.4`;
    await externalFetchJson(url, {
      service: 'azure-key-vault',
      operation: 'deleteSecret',
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      timeoutMs: 20_000,
      retry: { maxRetries: 1, retryMethods: ['DELETE'] },
    });

    // Invalidate cache
    this.secretCache.delete(name);
  }

  /**
   * Check if secrets need rotation based on config
   */
  async checkRotationNeeded(
    configs: SecretRotationConfig[]
  ): Promise<{ name: string; daysUntilExpiry: number }[]> {
    const needsRotation: { name: string; daysUntilExpiry: number }[] = [];

    for (const config of configs) {
      try {
        const metadata = await this.getSecretMetadata(config.secretName);
        
        if (!metadata.updatedAt) continue;

        const daysSinceUpdate = Math.floor(
          (Date.now() - metadata.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        const daysUntilExpiry = config.rotationIntervalDays - daysSinceUpdate;

        if (daysUntilExpiry <= config.notifyBeforeDays) {
          needsRotation.push({
            name: config.secretName,
            daysUntilExpiry: Math.max(0, daysUntilExpiry),
          });
        }
      } catch {
        // Secret might not exist yet
        continue;
      }
    }

    return needsRotation;
  }

  /**
   * Clear the secret cache
   */
  clearCache(): void {
    this.secretCache.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async getAccessToken(): Promise<string> {
    if (this.config.useManagedIdentity) {
      return this.getTokenFromManagedIdentity();
    }
    return this.getTokenFromClientCredentials();
  }

  private async getTokenFromManagedIdentity(): Promise<string> {
    // Azure IMDS endpoint for managed identity
    const url = new URL('http://169.254.169.254/metadata/identity/oauth2/token');
    url.searchParams.set('api-version', '2019-08-01');
    url.searchParams.set('resource', 'https://vault.azure.net');

    const data: any = await externalFetchJson(url.toString(), {
      service: 'azure-imds',
      operation: 'getToken',
      method: 'GET',
      headers: { Metadata: 'true' },
      cache: 'no-store',
      timeoutMs: 5_000,
      retry: { maxRetries: 1, retryMethods: ['GET'] },
    });
    return data.access_token;
  }

  private async getTokenFromClientCredentials(): Promise<string> {
    const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret || '',
      scope: 'https://vault.azure.net/.default',
      grant_type: 'client_credentials',
    });

    const data: any = await externalFetchJson(tokenEndpoint, {
      service: 'azure-oauth',
      operation: 'clientCredentialsToken',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 2, retryMethods: ['POST'] },
    });
    return data.access_token;
  }

  private generateSecretValue(): string {
    // Generate a cryptographically secure random string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 32;
    let result = '';
    
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createKeyVaultService(config?: Partial<KeyVaultConfig>): AzureKeyVaultService {
  const defaultConfig: KeyVaultConfig = {
    vaultUrl: process.env.AZURE_KEY_VAULT_URL || '',
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    useManagedIdentity: process.env.AZURE_USE_MANAGED_IDENTITY === 'true',
  };

  return new AzureKeyVaultService({ ...defaultConfig, ...config });
}

// ============================================================================
// Secret Name Constants
// ============================================================================

export const SECRET_NAMES = {
  APIFY_API_KEY: 'apify-api-key',
  DEEPSEEK_API_KEY: 'deepseek-api-key',
  AZURE_AI_KEY: 'azure-ai-key',
  WEBHOOK_SECRET: 'webhook-secret',
  REDIS_PASSWORD: 'redis-password',
  DATABASE_URL: 'database-url',
  ENCRYPTION_KEY: 'encryption-key',
} as const;
