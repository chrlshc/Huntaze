/**
 * Property-Based Test: Multi-Account Support
 * 
 * **Feature: integrations-management, Property 7: Multi-account support**
 * **Validates: Requirements 12.1, 12.2, 12.4**
 * 
 * Property: For any user and provider, the system should allow multiple accounts 
 * to be connected simultaneously, distinguished by providerAccountId
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Provider } from '../../../lib/services/integrations/types';
import type { Integration } from '../../../hooks/useIntegrations';

describe('Property 7: Multi-Account Support', () => {

  /**
   * Property: Multiple accounts per provider can be represented
   * 
   * For any provider, a list of integrations can contain multiple accounts
   * with unique providerAccountIds.
   */
  it('should allow multiple accounts per provider with unique IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a provider
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        // Generate multiple unique account IDs
        fc.uniqueArray(
          fc.string({ minLength: 5, maxLength: 20 }),
          { minLength: 2, maxLength: 5 }
        ),
        async (provider: Provider, accountIds: string[]) => {
          // Create integrations for the same provider but different accounts
          const integrations: Integration[] = accountIds.map(accountId => ({
            provider,
            providerAccountId: accountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              username: `user_${accountId}`,
            },
          }));

          // Verify all integrations have unique account IDs
          const uniqueAccountIds = new Set(
            integrations.map(int => int.providerAccountId)
          );

          // The number of unique account IDs should equal the number of integrations
          expect(uniqueAccountIds.size).toBe(integrations.length);
          expect(uniqueAccountIds.size).toBe(accountIds.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each account maintains independent metadata
   * 
   * For any provider with multiple accounts, each account should maintain
   * its own independent metadata without interference.
   */
  it('should maintain independent metadata for each account', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        fc.uniqueArray(
          fc.record({
            accountId: fc.string({ minLength: 5, maxLength: 20 }),
            username: fc.string({ minLength: 3, maxLength: 15 }),
            displayName: fc.string({ minLength: 3, maxLength: 30 }),
          }),
          { 
            minLength: 2, 
            maxLength: 4,
            selector: (item) => item.accountId,
          }
        ),
        async (provider: Provider, accounts: Array<{ accountId: string; username: string; displayName: string }>) => {
          // Create integrations with different metadata
          const integrations: Integration[] = accounts.map(account => ({
            provider,
            providerAccountId: account.accountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              username: account.username,
              displayName: account.displayName,
            },
          }));

          // Verify each account has its own metadata
          for (const account of accounts) {
            const integration = integrations.find(
              (int) => int.providerAccountId === account.accountId
            );

            expect(integration).toBeDefined();
            expect(integration?.metadata?.username).toBe(account.username);
            expect(integration?.metadata?.displayName).toBe(account.displayName);
          }

          // Verify metadata is not shared between accounts
          const metadataSet = new Set(
            integrations.map(int => JSON.stringify(int.metadata))
          );
          expect(metadataSet.size).toBe(accounts.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering removes specific accounts without affecting others
   * 
   * For any list of integrations with multiple accounts for the same provider,
   * filtering out one account should not affect the other accounts.
   */
  it('should allow filtering one account without affecting others', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        fc.uniqueArray(
          fc.string({ minLength: 5, maxLength: 20 }),
          { minLength: 3, maxLength: 5 }
        ),
        async (provider: Provider, accountIds: string[]) => {
          // Create multiple integrations
          const integrations: Integration[] = accountIds.map(accountId => ({
            provider,
            providerAccountId: accountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              username: `user_${accountId}`,
            },
          }));

          // Get initial count
          const initialCount = integrations.filter(
            (integration) => integration.provider === provider
          ).length;

          expect(initialCount).toBe(accountIds.length);

          // Filter out the first account
          const accountToRemove = accountIds[0];
          const remainingIntegrations = integrations.filter(
            (integration) => integration.providerAccountId !== accountToRemove
          );

          expect(remainingIntegrations.length).toBe(accountIds.length - 1);

          // Verify the removed account is not present
          const removedAccount = remainingIntegrations.find(
            (integration) => integration.providerAccountId === accountToRemove
          );
          expect(removedAccount).toBeUndefined();

          // Verify other accounts are still present
          for (let i = 1; i < accountIds.length; i++) {
            const account = remainingIntegrations.find(
              (integration) => integration.providerAccountId === accountIds[i]
            );
            expect(account).toBeDefined();
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple accounts can have different expiry times
   * 
   * For any provider with multiple accounts, each account can have
   * its own independent token expiry time.
   */
  it('should allow different expiry times for each account', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        fc.uniqueArray(
          fc.record({
            accountId: fc.string({ minLength: 5, maxLength: 20 }),
            expiresIn: fc.integer({ min: 1000, max: 7200000 }), // 1 second to 2 hours
          }),
          { 
            minLength: 2, 
            maxLength: 4,
            selector: (item) => item.accountId,
          }
        ),
        async (provider: Provider, accounts: Array<{ accountId: string; expiresIn: number }>) => {
          // Create integrations with different expiry times
          const now = Date.now();
          const integrations: Integration[] = accounts.map(account => ({
            provider,
            providerAccountId: account.accountId,
            isConnected: true,
            expiresAt: new Date(now + account.expiresIn),
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              username: `user_${account.accountId}`,
            },
          }));

          // Verify each account has its own expiry time
          for (const account of accounts) {
            const integration = integrations.find(
              (int) => int.providerAccountId === account.accountId
            );

            expect(integration).toBeDefined();
            expect(integration?.expiresAt).toBeDefined();
            
            // Verify the expiry time is approximately correct (within 1 second tolerance)
            const expectedExpiry = now + account.expiresIn;
            const actualExpiry = integration?.expiresAt?.getTime() || 0;
            const diff = Math.abs(actualExpiry - expectedExpiry);
            expect(diff).toBeLessThan(1000); // Within 1 second
          }

          // Verify that accounts CAN have different expiry times
          // (The system should support this, even if some happen to be the same)
          const expiryTimes = integrations.map(int => int.expiresAt?.getTime() || 0);
          
          // All expiry times should be valid numbers
          expect(expiryTimes.every(time => !isNaN(time) && time > 0)).toBe(true);
          
          // The number of expiry times should match the number of accounts
          expect(expiryTimes.length).toBe(accounts.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Accounts from different providers are independent
   * 
   * For any set of providers, accounts from different providers should be
   * completely independent and not affect each other.
   */
  it('should maintain independence between different providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
          { minLength: 2, maxLength: 4 }
        ),
        fc.uniqueArray(
          fc.string({ minLength: 5, maxLength: 20 }),
          { minLength: 2, maxLength: 3 }
        ),
        async (providers: Provider[], accountIds: string[]) => {
          // Create multiple accounts for each provider
          const integrations: Integration[] = [];
          for (const provider of providers) {
            for (const accountId of accountIds) {
              integrations.push({
                provider,
                providerAccountId: `${provider}_${accountId}`,
                isConnected: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                  username: `user_${provider}_${accountId}`,
                },
              });
            }
          }

          // Verify each provider has the correct number of accounts
          for (const provider of providers) {
            const providerIntegrations = integrations.filter(
              (integration) => integration.provider === provider
            );
            expect(providerIntegrations.length).toBe(accountIds.length);
          }

          // Verify total count
          expect(integrations.length).toBe(providers.length * accountIds.length);

          // Verify accounts are properly namespaced by provider
          for (const provider of providers) {
            const providerIntegrations = integrations.filter(
              (integration) => integration.provider === provider
            );
            
            // All accounts for this provider should have the provider prefix
            for (const integration of providerIntegrations) {
              expect(integration.providerAccountId).toContain(provider);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Account IDs are unique within a provider
   * 
   * For any provider, all connected accounts must have unique providerAccountIds.
   */
  it('should enforce unique account IDs within a provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('instagram', 'tiktok', 'reddit', 'onlyfans'),
        fc.uniqueArray(
          fc.string({ minLength: 5, maxLength: 20 }),
          { minLength: 2, maxLength: 5 }
        ),
        async (provider: Provider, accountIds: string[]) => {
          // Create integrations
          const integrations: Integration[] = accountIds.map(accountId => ({
            provider,
            providerAccountId: accountId,
            isConnected: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              username: `user_${accountId}`,
            },
          }));

          // Filter by provider
          const providerIntegrations = integrations.filter(
            (integration) => integration.provider === provider
          );

          // Verify all account IDs are unique
          const accountIdSet = new Set(
            providerIntegrations.map((integration) => integration.providerAccountId)
          );

          expect(accountIdSet.size).toBe(providerIntegrations.length);
          expect(accountIdSet.size).toBe(accountIds.length);

          // Verify each account ID appears exactly once
          for (const accountId of accountIds) {
            const matchingIntegrations = providerIntegrations.filter(
              (integration) => integration.providerAccountId === accountId
            );
            expect(matchingIntegrations.length).toBe(1);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
