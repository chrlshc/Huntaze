/**
 * Instagram API Connectivity Tester
 * 
 * Tests Instagram API connectivity using Facebook Graph API.
 * This module provides comprehensive API testing and permission validation.
 */

import {
  InstagramCredentials,
  ApiConnectivityError,
} from '../index';

/**
 * Instagram API test result
 */
export interface InstagramApiTestResult {
  isConnected: boolean;
  appInfo?: any;
  permissions?: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Instagram permission information
 */
export interface InstagramPermission {
  permission: string;
  status: 'granted' | 'declined' | 'expired';
}

/**
 * Instagram API connectivity tester
 */
export class InstagramApiTester {
  private readonly platform = 'instagram' as const;

  /**
   * Test comprehensive Instagram API connectivity
   */
  async testConnectivity(credentials: InstagramCredentials): Promise<InstagramApiTestResult> {
    const result: InstagramApiTestResult = {
      isConnected: false,
      errors: [],
      warnings: [],
    };

    try {
      // 1. Generate app access token
      const appAccessToken = await this.generateAppAccessToken(credentials);
      if (!appAccessToken) {
        result.errors.push('Failed to generate app access token');
        return result;
      }

      // 2. Get app information
      const appInfo = await this.getAppInfo(credentials.appId, appAccessToken);
      if (!appInfo) {
        result.errors.push('Failed to retrieve app information');
        return result;
      }

      result.appInfo = appInfo;

      // 3. Test permissions (if available)
      try {
        const permissions = await this.getAppPermissions(credentials.appId, appAccessToken);
        result.permissions = permissions;
      } catch (error) {
        result.warnings.push('Could not retrieve app permissions');
      }

      // 4. Test Instagram Basic Display API endpoint
      try {
        await this.testInstagramBasicApi(appAccessToken);
      } catch (error) {
        result.warnings.push('Instagram Basic Display API test failed');
      }

      result.isConnected = true;
      return result;

    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        result.errors.push(error.message);
      } else {
        result.errors.push(`API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return result;
    }
  }

  /**
   * Generate app access token for Facebook Graph API
   */
  async generateAppAccessToken(credentials: InstagramCredentials): Promise<string | null> {
    try {
      const response = await fetch('https://graph.facebook.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: credentials.appId,
          client_secret: credentials.appSecret,
          grant_type: 'client_credentials',
        }).toString(),
      });

      if (!response.ok) {
        throw new ApiConnectivityError(this.platform, new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        const errorMessage = data.error.message;

        // Handle specific Facebook API errors
        if (errorCode === 101) {
          throw new ApiConnectivityError(this.platform, new Error('Invalid API key (App ID)'));
        } else if (errorCode === 190) {
          throw new ApiConnectivityError(this.platform, new Error('Invalid access token or App Secret'));
        } else if (errorCode === 102) {
          throw new ApiConnectivityError(this.platform, new Error('Session key invalid or no longer valid'));
        }

        throw new ApiConnectivityError(this.platform, new Error(`Facebook API Error ${errorCode}: ${errorMessage}`));
      }

      return data.access_token || null;
    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        throw error;
      }
      throw new ApiConnectivityError(this.platform, error as Error);
    }
  }

  /**
   * Get app information from Facebook Graph API
   */
  async getAppInfo(appId: string, accessToken: string): Promise<any> {
    try {
      const fields = 'id,name,category,company,description,privacy_policy_url,terms_of_service_url';
      const response = await fetch(`https://graph.facebook.com/${appId}?access_token=${accessToken}&fields=${fields}`);

      if (!response.ok) {
        throw new ApiConnectivityError(this.platform, new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      const data = await response.json();

      if (data.error) {
        throw new ApiConnectivityError(this.platform, new Error(data.error.message));
      }

      return data;
    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        throw error;
      }
      throw new ApiConnectivityError(this.platform, error as Error);
    }
  }

  /**
   * Get app permissions from Facebook Graph API
   */
  async getAppPermissions(appId: string, accessToken: string): Promise<string[]> {
    try {
      const response = await fetch(`https://graph.facebook.com/${appId}/permissions?access_token=${accessToken}`);

      if (!response.ok) {
        throw new ApiConnectivityError(this.platform, new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      const data = await response.json();

      if (data.error) {
        throw new ApiConnectivityError(this.platform, new Error(data.error.message));
      }

      // Extract permission names
      return data.data ? data.data.map((perm: any) => perm.permission) : [];
    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        throw error;
      }
      throw new ApiConnectivityError(this.platform, error as Error);
    }
  }

  /**
   * Test Instagram Basic Display API endpoint
   */
  async testInstagramBasicApi(accessToken: string): Promise<void> {
    try {
      // Test the Instagram Basic Display API me endpoint
      const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);

      const data = await response.json();

      if (data.error) {
        // This is expected for app access tokens, but we're testing the endpoint availability
        if (data.error.code === 190 || data.error.code === 100) {
          // Expected error for app access token - endpoint is available
          return;
        }
        throw new ApiConnectivityError(this.platform, new Error(data.error.message));
      }
    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        throw error;
      }
      throw new ApiConnectivityError(this.platform, error as Error);
    }
  }

  /**
   * Validate required Instagram permissions
   */
  validatePermissions(permissions: string[]): { valid: boolean; missing: string[]; warnings: string[] } {
    const requiredPermissions = [
      'instagram_basic',
      'pages_show_list',
    ];

    const optionalPermissions = [
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_insights',
      'pages_read_engagement',
    ];

    const missing = requiredPermissions.filter(perm => !permissions.includes(perm));
    const missingOptional = optionalPermissions.filter(perm => !permissions.includes(perm));

    const warnings: string[] = [];
    if (missingOptional.length > 0) {
      warnings.push(`Missing optional permissions: ${missingOptional.join(', ')}`);
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * Test Instagram webhook configuration
   */
  async testWebhookConfiguration(appId: string, accessToken: string): Promise<{ configured: boolean; errors: string[] }> {
    try {
      const response = await fetch(`https://graph.facebook.com/${appId}/subscriptions?access_token=${accessToken}`);

      if (!response.ok) {
        return {
          configured: false,
          errors: [`HTTP ${response.status}: ${response.statusText}`],
        };
      }

      const data = await response.json();

      if (data.error) {
        return {
          configured: false,
          errors: [data.error.message],
        };
      }

      // Check if Instagram webhooks are configured
      const instagramSubscriptions = data.data?.filter((sub: any) => sub.object === 'instagram') || [];

      return {
        configured: instagramSubscriptions.length > 0,
        errors: [],
      };
    } catch (error) {
      return {
        configured: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get Instagram Business Account information
   */
  async getInstagramBusinessAccount(pageId: string, accessToken: string): Promise<any> {
    try {
      const response = await fetch(`https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);

      if (!response.ok) {
        throw new ApiConnectivityError(this.platform, new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      const data = await response.json();

      if (data.error) {
        throw new ApiConnectivityError(this.platform, new Error(data.error.message));
      }

      return data.instagram_business_account || null;
    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        throw error;
      }
      throw new ApiConnectivityError(this.platform, error as Error);
    }
  }
}