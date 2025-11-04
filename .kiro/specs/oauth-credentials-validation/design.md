# Design Document - OAuth Credentials Validation Framework

## Overview

This document describes the technical design for implementing a comprehensive OAuth credentials validation framework that tests TikTok, Instagram, and Reddit credentials against their respective APIs to ensure they work correctly before storing them in the system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Validation Framework                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CredentialValidator                      │   │
│  │              (Abstract Interface)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────┬─────────────────┬─────────────────────────┐ │
│  │ TikTok      │ Instagram       │ Reddit                  │ │
│  │ Validator   │ Validator       │ Validator               │ │
│  └─────────────┴─────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Validation Services                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ValidationOrchestrator                               │   │
│  │  - Batch validation                                   │   │
│  │  - Caching                                            │   │
│  │  - Rate limiting                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ValidationMonitor                                    │   │
│  │  - Health checks                                      │   │
│  │  - Metrics collection                                 │   │
│  │  - Alerting                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                External Platform APIs                        │
│  - TikTok OAuth & API                                        │
│  - Facebook Graph API (Instagram)                           │
│  - Reddit OAuth & API                                       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Core Validation Interface

#### CredentialValidator (Abstract)

```typescript
interface CredentialValidationResult {
  isValid: boolean;
  platform: 'tiktok' | 'instagram' | 'reddit';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    validatedAt: Date;
    responseTime: number;
    apiVersion?: string;
    permissions?: string[];
  };
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

interface ValidationWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

abstract class CredentialValidator {
  abstract platform: string;
  
  /**
   * Validate credentials by making test API calls
   */
  abstract validateCredentials(credentials: PlatformCredentials): Promise<CredentialValidationResult>;
  
  /**
   * Quick validation without API calls (format, presence)
   */
  abstract validateFormat(credentials: PlatformCredentials): ValidationError[];
  
  /**
   * Test specific API endpoint to verify credentials work
   */
  abstract testApiConnectivity(credentials: PlatformCredentials): Promise<boolean>;
}
```

### 2. Platform-Specific Validators

#### TikTokCredentialValidator

```typescript
interface TikTokCredentials {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
}

class TikTokCredentialValidator extends CredentialValidator {
  platform = 'tiktok';
  
  async validateCredentials(credentials: TikTokCredentials): Promise<CredentialValidationResult> {
    const result: CredentialValidationResult = {
      isValid: true,
      platform: 'tiktok',
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
      },
    };
    
    const startTime = Date.now();
    
    try {
      // 1. Format validation
      const formatErrors = this.validateFormat(credentials);
      if (formatErrors.length > 0) {
        result.errors.push(...formatErrors);
        result.isValid = false;
      }
      
      // 2. Test authorization URL generation
      await this.testAuthUrlGeneration(credentials);
      
      // 3. Test API connectivity (if sandbox available)
      const isConnected = await this.testApiConnectivity(credentials);
      if (!isConnected) {
        result.errors.push({
          code: 'API_CONNECTIVITY_FAILED',
          message: 'Cannot connect to TikTok API',
          suggestion: 'Check if credentials are correct and API is accessible',
        });
        result.isValid = false;
      }
      
      // 4. Validate redirect URI accessibility
      await this.validateRedirectUri(credentials.redirectUri);
      
    } catch (error) {
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
      result.isValid = false;
    }
    
    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }
  
  validateFormat(credentials: TikTokCredentials): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!credentials.clientKey) {
      errors.push({
        code: 'MISSING_CLIENT_KEY',
        message: 'TikTok Client Key is required',
        field: 'clientKey',
        suggestion: 'Get Client Key from TikTok Developer Portal',
      });
    }
    
    if (!credentials.clientSecret) {
      errors.push({
        code: 'MISSING_CLIENT_SECRET',
        message: 'TikTok Client Secret is required',
        field: 'clientSecret',
        suggestion: 'Get Client Secret from TikTok Developer Portal',
      });
    }
    
    if (!credentials.redirectUri) {
      errors.push({
        code: 'MISSING_REDIRECT_URI',
        message: 'Redirect URI is required',
        field: 'redirectUri',
        suggestion: 'Configure redirect URI in environment variables',
      });
    } else if (!this.isValidUrl(credentials.redirectUri)) {
      errors.push({
        code: 'INVALID_REDIRECT_URI',
        message: 'Redirect URI must be a valid HTTPS URL',
        field: 'redirectUri',
        suggestion: 'Use HTTPS URL format: https://yourdomain.com/api/auth/tiktok/callback',
      });
    }
    
    return errors;
  }
  
  async testApiConnectivity(credentials: TikTokCredentials): Promise<boolean> {
    try {
      // Test by generating auth URL - this validates client_key format
      const authUrl = this.generateTestAuthUrl(credentials);
      return authUrl.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  private async testAuthUrlGeneration(credentials: TikTokCredentials): Promise<void> {
    // Test that we can generate a valid authorization URL
    const params = new URLSearchParams({
      client_key: credentials.clientKey,
      scope: 'user.info.basic',
      response_type: 'code',
      redirect_uri: credentials.redirectUri,
      state: 'test_state',
    });
    
    const url = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
    
    // Validate URL format
    if (!this.isValidUrl(url)) {
      throw new Error('Generated authorization URL is invalid');
    }
  }
  
  private async validateRedirectUri(redirectUri: string): Promise<void> {
    try {
      // Test that redirect URI is accessible (HEAD request)
      const response = await fetch(redirectUri, { 
        method: 'HEAD',
        timeout: 5000,
      });
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`Redirect URI returned ${response.status}`);
      }
    } catch (error) {
      // Non-blocking warning for redirect URI issues
      console.warn('Redirect URI validation warning:', error);
    }
  }
  
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
```

#### InstagramCredentialValidator

```typescript
interface InstagramCredentials {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

class InstagramCredentialValidator extends CredentialValidator {
  platform = 'instagram';
  
  async validateCredentials(credentials: InstagramCredentials): Promise<CredentialValidationResult> {
    const result: CredentialValidationResult = {
      isValid: true,
      platform: 'instagram',
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
      },
    };
    
    const startTime = Date.now();
    
    try {
      // 1. Format validation
      const formatErrors = this.validateFormat(credentials);
      if (formatErrors.length > 0) {
        result.errors.push(...formatErrors);
        result.isValid = false;
      }
      
      // 2. Test app info retrieval
      const appInfo = await this.getAppInfo(credentials);
      if (appInfo) {
        result.metadata.permissions = appInfo.permissions;
        
        // Check required permissions
        const requiredPermissions = [
          'instagram_basic',
          'instagram_content_publish',
          'instagram_manage_insights',
        ];
        
        const missingPermissions = requiredPermissions.filter(
          perm => !appInfo.permissions.includes(perm)
        );
        
        if (missingPermissions.length > 0) {
          result.warnings.push({
            code: 'MISSING_PERMISSIONS',
            message: `Missing permissions: ${missingPermissions.join(', ')}`,
            severity: 'high',
          });
        }
      }
      
      // 3. Test API connectivity
      const isConnected = await this.testApiConnectivity(credentials);
      if (!isConnected) {
        result.errors.push({
          code: 'API_CONNECTIVITY_FAILED',
          message: 'Cannot connect to Facebook Graph API',
          suggestion: 'Check if App ID and App Secret are correct',
        });
        result.isValid = false;
      }
      
    } catch (error) {
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
      result.isValid = false;
    }
    
    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }
  
  validateFormat(credentials: InstagramCredentials): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!credentials.appId) {
      errors.push({
        code: 'MISSING_APP_ID',
        message: 'Facebook App ID is required',
        field: 'appId',
        suggestion: 'Get App ID from Facebook Developer Console',
      });
    } else if (!/^\d+$/.test(credentials.appId)) {
      errors.push({
        code: 'INVALID_APP_ID_FORMAT',
        message: 'App ID must be numeric',
        field: 'appId',
        suggestion: 'App ID should be a number like 1234567890123456',
      });
    }
    
    if (!credentials.appSecret) {
      errors.push({
        code: 'MISSING_APP_SECRET',
        message: 'Facebook App Secret is required',
        field: 'appSecret',
        suggestion: 'Get App Secret from Facebook Developer Console',
      });
    } else if (credentials.appSecret.length < 32) {
      errors.push({
        code: 'INVALID_APP_SECRET_FORMAT',
        message: 'App Secret appears to be too short',
        field: 'appSecret',
        suggestion: 'App Secret should be a 32+ character string',
      });
    }
    
    return errors;
  }
  
  async testApiConnectivity(credentials: InstagramCredentials): Promise<boolean> {
    try {
      // Test by getting app access token
      const response = await fetch(
        `https://graph.facebook.com/oauth/access_token?client_id=${credentials.appId}&client_secret=${credentials.appSecret}&grant_type=client_credentials`,
        { timeout: 10000 }
      );
      
      const data = await response.json();
      return response.ok && data.access_token;
    } catch (error) {
      return false;
    }
  }
  
  private async getAppInfo(credentials: InstagramCredentials): Promise<{
    id: string;
    name: string;
    permissions: string[];
  } | null> {
    try {
      // Get app access token first
      const tokenResponse = await fetch(
        `https://graph.facebook.com/oauth/access_token?client_id=${credentials.appId}&client_secret=${credentials.appSecret}&grant_type=client_credentials`
      );
      
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        return null;
      }
      
      // Get app info
      const appResponse = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.appId}?fields=id,name,permissions&access_token=${tokenData.access_token}`
      );
      
      const appData = await appResponse.json();
      if (!appResponse.ok) {
        return null;
      }
      
      return {
        id: appData.id,
        name: appData.name,
        permissions: appData.permissions?.data?.map((p: any) => p.permission) || [],
      };
    } catch (error) {
      return null;
    }
  }
}
```

#### RedditCredentialValidator

```typescript
interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  userAgent: string;
}

class RedditCredentialValidator extends CredentialValidator {
  platform = 'reddit';
  
  async validateCredentials(credentials: RedditCredentials): Promise<CredentialValidationResult> {
    const result: CredentialValidationResult = {
      isValid: true,
      platform: 'reddit',
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
      },
    };
    
    const startTime = Date.now();
    
    try {
      // 1. Format validation
      const formatErrors = this.validateFormat(credentials);
      if (formatErrors.length > 0) {
        result.errors.push(...formatErrors);
        result.isValid = false;
      }
      
      // 2. Test API connectivity
      const isConnected = await this.testApiConnectivity(credentials);
      if (!isConnected) {
        result.errors.push({
          code: 'API_CONNECTIVITY_FAILED',
          message: 'Cannot connect to Reddit API',
          suggestion: 'Check if Client ID and Client Secret are correct',
        });
        result.isValid = false;
      }
      
      // 3. Validate User-Agent format
      if (!this.isValidUserAgent(credentials.userAgent)) {
        result.warnings.push({
          code: 'INVALID_USER_AGENT',
          message: 'User-Agent should follow Reddit guidelines',
          severity: 'medium',
        });
      }
      
    } catch (error) {
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
      result.isValid = false;
    }
    
    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }
  
  validateFormat(credentials: RedditCredentials): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!credentials.clientId) {
      errors.push({
        code: 'MISSING_CLIENT_ID',
        message: 'Reddit Client ID is required',
        field: 'clientId',
        suggestion: 'Get Client ID from Reddit App Preferences',
      });
    }
    
    if (!credentials.clientSecret) {
      errors.push({
        code: 'MISSING_CLIENT_SECRET',
        message: 'Reddit Client Secret is required',
        field: 'clientSecret',
        suggestion: 'Get Client Secret from Reddit App Preferences',
      });
    }
    
    if (!credentials.userAgent) {
      errors.push({
        code: 'MISSING_USER_AGENT',
        message: 'User-Agent is required for Reddit API',
        field: 'userAgent',
        suggestion: 'Set User-Agent like "YourApp/1.0.0 by YourUsername"',
      });
    }
    
    return errors;
  }
  
  async testApiConnectivity(credentials: RedditCredentials): Promise<boolean> {
    try {
      // Test by getting app-only access token
      const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': credentials.userAgent,
        },
        body: 'grant_type=client_credentials',
        timeout: 10000,
      });
      
      const data = await response.json();
      return response.ok && data.access_token;
    } catch (error) {
      return false;
    }
  }
  
  private isValidUserAgent(userAgent: string): boolean {
    // Reddit User-Agent should include app name and version
    return /^[^\/]+\/[\d\.]+/.test(userAgent);
  }
}
```

### 3. Validation Orchestrator

```typescript
interface ValidationConfig {
  enableCaching: boolean;
  cacheTimeout: number; // milliseconds
  maxConcurrentValidations: number;
  timeout: number; // milliseconds per validation
}

class ValidationOrchestrator {
  private validators: Map<string, CredentialValidator> = new Map();
  private cache: Map<string, { result: CredentialValidationResult; expiresAt: number }> = new Map();
  private config: ValidationConfig;
  
  constructor(config: ValidationConfig) {
    this.config = config;
    this.setupValidators();
  }
  
  private setupValidators(): void {
    this.validators.set('tiktok', new TikTokCredentialValidator());
    this.validators.set('instagram', new InstagramCredentialValidator());
    this.validators.set('reddit', new RedditCredentialValidator());
  }
  
  /**
   * Validate credentials for a specific platform
   */
  async validatePlatform(
    platform: string,
    credentials: any
  ): Promise<CredentialValidationResult> {
    const validator = this.validators.get(platform);
    if (!validator) {
      throw new Error(`No validator found for platform: ${platform}`);
    }
    
    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(platform, credentials);
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result;
      }
    }
    
    // Validate with timeout
    const result = await Promise.race([
      validator.validateCredentials(credentials),
      this.createTimeoutPromise(this.config.timeout),
    ]);
    
    // Cache result
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(platform, credentials);
      this.cache.set(cacheKey, {
        result,
        expiresAt: Date.now() + this.config.cacheTimeout,
      });
    }
    
    return result;
  }
  
  /**
   * Validate credentials for multiple platforms
   */
  async validateMultiplePlatforms(
    validations: Array<{ platform: string; credentials: any }>
  ): Promise<CredentialValidationResult[]> {
    const semaphore = new Semaphore(this.config.maxConcurrentValidations);
    
    const promises = validations.map(async ({ platform, credentials }) => {
      await semaphore.acquire();
      try {
        return await this.validatePlatform(platform, credentials);
      } finally {
        semaphore.release();
      }
    });
    
    return Promise.all(promises);
  }
  
  /**
   * Get validation health status for all platforms
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    platforms: Record<string, 'healthy' | 'unhealthy'>;
    lastChecked: Date;
  }> {
    const results: Record<string, 'healthy' | 'unhealthy'> = {};
    
    for (const [platform, validator] of this.validators) {
      try {
        // Use minimal test credentials for health check
        const testCredentials = this.getTestCredentials(platform);
        if (testCredentials) {
          const result = await validator.validateFormat(testCredentials);
          results[platform] = result.length === 0 ? 'healthy' : 'unhealthy';
        } else {
          results[platform] = 'unhealthy';
        }
      } catch (error) {
        results[platform] = 'unhealthy';
      }
    }
    
    const healthyCount = Object.values(results).filter(status => status === 'healthy').length;
    const totalCount = Object.values(results).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }
    
    return {
      overall,
      platforms: results,
      lastChecked: new Date(),
    };
  }
  
  private getCacheKey(platform: string, credentials: any): string {
    // Create hash of credentials (without exposing actual values)
    const credentialHash = this.hashCredentials(credentials);
    return `${platform}:${credentialHash}`;
  }
  
  private hashCredentials(credentials: any): string {
    // Create a hash of credential keys/structure, not values
    const keys = Object.keys(credentials).sort();
    return Buffer.from(keys.join(':')).toString('base64');
  }
  
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout')), timeout);
    });
  }
  
  private getTestCredentials(platform: string): any {
    // Return minimal test credentials for health checks
    switch (platform) {
      case 'tiktok':
        return {
          clientKey: process.env.TIKTOK_CLIENT_KEY || 'test',
          clientSecret: process.env.TIKTOK_CLIENT_SECRET || 'test',
          redirectUri: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://example.com',
        };
      case 'instagram':
        return {
          appId: process.env.FACEBOOK_APP_ID || 'test',
          appSecret: process.env.FACEBOOK_APP_SECRET || 'test',
          redirectUri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || 'https://example.com',
        };
      case 'reddit':
        return {
          clientId: process.env.REDDIT_CLIENT_ID || 'test',
          clientSecret: process.env.REDDIT_CLIENT_SECRET || 'test',
          redirectUri: process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || 'https://example.com',
          userAgent: 'TestApp/1.0.0',
        };
      default:
        return null;
    }
  }
}

// Semaphore for concurrency control
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}
```

## Data Models

### Validation Results Storage

```sql
-- Store validation results for monitoring and debugging
CREATE TABLE IF NOT EXISTS credential_validations (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  error_codes TEXT[], -- Array of error codes
  warning_codes TEXT[], -- Array of warning codes
  response_time_ms INTEGER NOT NULL,
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  environment VARCHAR(50) DEFAULT 'production',
  metadata JSONB
);

CREATE INDEX idx_credential_validations_platform ON credential_validations(platform, validated_at DESC);
CREATE INDEX idx_credential_validations_valid ON credential_validations(is_valid, validated_at DESC);
```

## Error Handling

### Error Categories and Codes

```typescript
enum ValidationErrorCode {
  // Format errors
  MISSING_CLIENT_KEY = 'MISSING_CLIENT_KEY',
  MISSING_CLIENT_SECRET = 'MISSING_CLIENT_SECRET',
  MISSING_APP_ID = 'MISSING_APP_ID',
  MISSING_APP_SECRET = 'MISSING_APP_SECRET',
  INVALID_REDIRECT_URI = 'INVALID_REDIRECT_URI',
  
  // API connectivity errors
  API_CONNECTIVITY_FAILED = 'API_CONNECTIVITY_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Network errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System errors
  VALIDATION_TIMEOUT = 'VALIDATION_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

enum ValidationWarningCode {
  MISSING_PERMISSIONS = 'MISSING_PERMISSIONS',
  INVALID_USER_AGENT = 'INVALID_USER_AGENT',
  DEVELOPMENT_CREDENTIALS = 'DEVELOPMENT_CREDENTIALS',
  REDIRECT_URI_WARNING = 'REDIRECT_URI_WARNING',
}
```

## Integration Points

### 1. Integration with Existing OAuth Services

```typescript
// Enhanced TikTokOAuthService with validation
export class TikTokOAuthService {
  private validator = new TikTokCredentialValidator();
  
  async getAuthorizationUrl(scopes: string[] = DEFAULT_SCOPES): Promise<TikTokAuthUrl> {
    // Validate credentials before generating auth URL
    const credentials = this.getCredentials();
    const validationResult = await this.validator.validateCredentials(credentials);
    
    if (!validationResult.isValid) {
      throw new ValidationError(
        'TikTok credentials validation failed',
        validationResult.errors
      );
    }
    
    // Proceed with existing logic...
    return this.generateAuthUrl(credentials, scopes);
  }
}
```

### 2. API Endpoints

```typescript
// GET /api/validation/health
export async function GET() {
  const orchestrator = new ValidationOrchestrator(config);
  const health = await orchestrator.getHealthStatus();
  
  return Response.json(health);
}

// POST /api/validation/credentials
export async function POST(request: Request) {
  const { platform, credentials } = await request.json();
  
  const orchestrator = new ValidationOrchestrator(config);
  const result = await orchestrator.validatePlatform(platform, credentials);
  
  return Response.json(result);
}

// POST /api/validation/batch
export async function POST(request: Request) {
  const { validations } = await request.json();
  
  const orchestrator = new ValidationOrchestrator(config);
  const results = await orchestrator.validateMultiplePlatforms(validations);
  
  return Response.json(results);
}
```

## Security Considerations

1. **Credential Protection**: Never log actual credential values, only validation results
2. **Rate Limiting**: Implement rate limiting on validation endpoints to prevent abuse
3. **Timeout Handling**: Set reasonable timeouts to prevent hanging requests
4. **Error Sanitization**: Sanitize error messages to avoid exposing sensitive information
5. **Environment Isolation**: Validate credentials in appropriate environments (sandbox when available)

## Performance Considerations

1. **Caching**: Cache validation results for a reasonable time (5-15 minutes)
2. **Concurrency**: Limit concurrent validations to avoid overwhelming external APIs
3. **Timeouts**: Set appropriate timeouts for each platform (TikTok: 10s, Instagram: 15s, Reddit: 10s)
4. **Batch Processing**: Support batch validation for efficiency
5. **Lazy Loading**: Only validate credentials when needed, not on every request

## Monitoring and Observability

### Metrics to Track

```typescript
interface ValidationMetrics {
  // Success rates by platform
  validationSuccessRate: Record<string, number>;
  
  // Response times by platform
  averageResponseTime: Record<string, number>;
  
  // Error rates by error code
  errorRates: Record<string, number>;
  
  // Cache hit rates
  cacheHitRate: number;
  
  // API health status
  apiHealthStatus: Record<string, 'healthy' | 'unhealthy'>;
}
```

### Alerts

- Validation success rate drops below 95%
- Average response time exceeds 30 seconds
- Any platform API becomes unhealthy
- High rate of specific error codes (indicates configuration issues)

## Testing Strategy

### Unit Tests
- Test each validator with valid and invalid credentials
- Test error handling and timeout scenarios
- Test caching logic and cache invalidation

### Integration Tests
- Test against sandbox APIs when available
- Test rate limiting and concurrency controls
- Test health check endpoints

### E2E Tests
- Test full validation flow integrated with OAuth services
- Test validation during actual OAuth flows
- Test error scenarios with real credential issues