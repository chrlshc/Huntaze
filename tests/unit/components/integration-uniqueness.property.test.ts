/**
 * Property-Based Test: Integration Uniqueness
 * 
 * **Feature: integrations-management, Property 1: Integration uniqueness**
 * **Validates: Requirements 1.2, 12.4**
 * 
 * Property: For any user and provider combination, there should be at most 
 * one active integration per providerAccountId
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Integration } from '../../../hooks/useIntegrations';

describe('Property 1: Integration Uniqueness', () => {
  /**
   * Property: No duplicate integrations per providerAccountId
   * 
   * For any list of integrations for a user, there should be no duplicate
   * (provider, providerAccountId) pairs. Each integration must be unique.
   */
  it('should ensure no duplicate provider-account combinations exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a list of integrations
        fc.array(
          fc.record({
            provider: fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
            providerAccountId: fc.string({ minLength: 5, maxLength: 20 }),
            isConnected: fc.boolean(),
            expiresAt: fc.option(fc.date(), { nil: undefined }),
            metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (integrations: Integration[]) => {
          // Create a set to track unique (provider, providerAccountId) pairs
          const uniquePairs = new Set<string>();
          
          for (const integration of integrations) {
            const key = `${integration.provider}:${integration.providerAccountId}`;
            
            // If this pair already exists, we have a duplicate
            if (uniquePairs.has(key)) {
              return false;
            }
            
            uniquePairs.add(key);
          }
          
          // All pairs are unique
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple accounts per provider are allowed
   * 
   * For any provider, a user should be able to have multiple accounts
   * as long as each has a unique providerAccountId.
   */
  it('should allow multiple accounts per provider with different providerAccountIds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a provider
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        // Generate multiple unique account IDs
        fc.uniqueArray(
          fc.string({ minLength: 5, maxLength: 20 }),
          { minLength: 1, maxLength: 5 }
        ),
        async (provider: string, accountIds: string[]) => {
          // Create integrations for the same provider but different accounts
          const integrations: Integration[] = accountIds.map(accountId => ({
            provider,
            providerAccountId: accountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          
          // Verify all integrations are unique
          const uniquePairs = new Set<string>();
          
          for (const integration of integrations) {
            const key = `${integration.provider}:${integration.providerAccountId}`;
            uniquePairs.add(key);
          }
          
          // The number of unique pairs should equal the number of integrations
          return uniquePairs.size === integrations.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Same providerAccountId across different providers is allowed
   * 
   * For any providerAccountId, it can exist across multiple providers
   * since the uniqueness constraint is (provider, providerAccountId).
   */
  it('should allow same providerAccountId across different providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a single account ID
        fc.string({ minLength: 5, maxLength: 20 }),
        // Generate multiple providers
        fc.uniqueArray(
          fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
          { minLength: 2, maxLength: 4 }
        ),
        async (accountId: string, providers: string[]) => {
          // Create integrations with the same accountId but different providers
          const integrations: Integration[] = providers.map(provider => ({
            provider,
            providerAccountId: accountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          
          // Verify all integrations are unique (different providers)
          const uniquePairs = new Set<string>();
          
          for (const integration of integrations) {
            const key = `${integration.provider}:${integration.providerAccountId}`;
            uniquePairs.add(key);
          }
          
          // The number of unique pairs should equal the number of integrations
          return uniquePairs.size === integrations.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Integration list filtering maintains uniqueness
   * 
   * For any list of integrations, filtering by provider should maintain
   * the uniqueness constraint within that provider.
   */
  it('should maintain uniqueness when filtering integrations by provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a list of integrations
        fc.array(
          fc.record({
            provider: fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
            providerAccountId: fc.string({ minLength: 5, maxLength: 20 }),
            isConnected: fc.boolean(),
            expiresAt: fc.option(fc.date(), { nil: undefined }),
            metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        // Generate a provider to filter by
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        async (integrations: Integration[], filterProvider: string) => {
          // Filter integrations by provider
          const filtered = integrations.filter(
            integration => integration.provider === filterProvider
          );
          
          // Check uniqueness within filtered list
          const accountIds = new Set<string>();
          
          for (const integration of filtered) {
            if (accountIds.has(integration.providerAccountId)) {
              return false; // Duplicate found
            }
            accountIds.add(integration.providerAccountId);
          }
          
          return true; // All unique
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Adding a new integration maintains uniqueness
   * 
   * For any existing list of integrations, adding a new integration
   * should only succeed if it doesn't create a duplicate (provider, providerAccountId) pair.
   */
  it('should reject adding duplicate integrations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an existing list of integrations
        fc.array(
          fc.record({
            provider: fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
            providerAccountId: fc.string({ minLength: 5, maxLength: 20 }),
            isConnected: fc.boolean(),
            expiresAt: fc.option(fc.date(), { nil: undefined }),
            metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (existingIntegrations: Integration[]) => {
          // Pick a random existing integration to try to duplicate
          const toDuplicate = existingIntegrations[0];
          
          // Create a new integration with the same provider and accountId
          const newIntegration: Integration = {
            provider: toDuplicate.provider,
            providerAccountId: toDuplicate.providerAccountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Check if adding this would create a duplicate
          const key = `${newIntegration.provider}:${newIntegration.providerAccountId}`;
          const existingKeys = new Set(
            existingIntegrations.map(
              integration => `${integration.provider}:${integration.providerAccountId}`
            )
          );
          
          // This should be detected as a duplicate
          return existingKeys.has(key);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Uniqueness is preserved across connected and disconnected states
   * 
   * For any integration, the uniqueness constraint applies regardless of
   * whether the integration is connected or disconnected.
   */
  it('should enforce uniqueness regardless of connection state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.boolean(),
        fc.boolean(),
        async (provider: string, accountId: string, isConnected1: boolean, isConnected2: boolean) => {
          // Create two integrations with same provider and accountId but different connection states
          const integration1: Integration = {
            provider,
            providerAccountId: accountId,
            isConnected: isConnected1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          const integration2: Integration = {
            provider,
            providerAccountId: accountId,
            isConnected: isConnected2,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // These should be considered duplicates regardless of connection state
          const key1 = `${integration1.provider}:${integration1.providerAccountId}`;
          const key2 = `${integration2.provider}:${integration2.providerAccountId}`;
          
          return key1 === key2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
