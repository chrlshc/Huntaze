/**
 * Integration Checker Utility
 * 
 * Provides utilities to check if real OAuth integrations are connected
 * and ensure data comes from real sources, not mock data.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

export type Provider = 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';

export interface IntegrationStatus {
  provider: Provider;
  isConnected: boolean;
  providerAccountId?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Check if a specific provider is connected for the current user
 * 
 * @param provider - The OAuth provider to check
 * @returns Promise<boolean> - True if connected with valid OAuth tokens
 */
export async function isProviderConnected(provider: Provider): Promise<boolean> {
  try {
    const response = await fetch('/api/integrations/status');
    if (!response.ok) {
      return false;
    }
    
    const { integrations } = await response.json();
    const integration = integrations.find(
      (int: IntegrationStatus) => int.provider === provider && int.isConnected
    );
    
    return !!integration;
  } catch (error) {
    console.error(`Failed to check ${provider} connection:`, error);
    return false;
  }
}

/**
 * Get all connected integrations for the current user
 * 
 * @returns Promise<IntegrationStatus[]> - Array of connected integrations
 */
export async function getConnectedIntegrations(): Promise<IntegrationStatus[]> {
  try {
    const response = await fetch('/api/integrations/status');
    if (!response.ok) {
      return [];
    }
    
    const { integrations } = await response.json();
    return integrations.filter((int: IntegrationStatus) => int.isConnected);
  } catch (error) {
    console.error('Failed to fetch connected integrations:', error);
    return [];
  }
}

/**
 * Check if data source indicates real data (not mock)
 * 
 * @param source - The data source indicator
 * @returns boolean - True if data is from a real source
 */
export function isRealDataSource(source: string | undefined): boolean {
  if (!source) return false;
  return source === 'api' || source === 'cache' || source === 'upstream';
}

/**
 * Check if data source indicates mock data
 * 
 * @param source - The data source indicator
 * @returns boolean - True if data is from a mock source
 */
export function isMockDataSource(source: string | undefined): boolean {
  if (!source) return true;
  return source === 'mock' || source === 'default';
}

/**
 * Validate that data doesn't contain mock patterns
 * 
 * @param data - The data to validate
 * @returns boolean - True if data appears to be real (no mock patterns)
 */
export function validateRealData(data: any): boolean {
  if (!data) return false;
  
  const MOCK_PATTERNS = [
    /demo-account/i,
    /mock/i,
    /test-user/i,
    /fake-/i,
    /sample-/i,
    /placeholder/i,
    /example\.com/i,
    /default-/i,
  ];
  
  const dataStr = JSON.stringify(data);
  return !MOCK_PATTERNS.some(pattern => pattern.test(dataStr));
}

/**
 * Create an error message for missing integration
 * 
 * @param provider - The provider that needs to be connected
 * @returns string - User-friendly error message
 */
export function getMissingIntegrationMessage(provider: Provider): string {
  const providerNames: Record<Provider, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    reddit: 'Reddit',
    onlyfans: 'OnlyFans',
  };
  
  return `Please connect your ${providerNames[provider]} account to view real data`;
}
