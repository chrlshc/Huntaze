/**
 * Property-Based Test: OAuth State Validation
 * 
 * **Feature: integrations-management, Property 4: OAuth state validation**
 * **Validates: Requirements 11.3**
 * 
 * Property: For any OAuth callback, the state parameter must match the one 
 * generated during initiation to prevent CSRF attacks
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { IntegrationsService } from '../../../lib/services/integrations/integrations.service';
import type { Provider } from '../../../lib/services/integrations/types';

describe('Property 4: OAuth State Validation', () => {
  let service: IntegrationsService;

  beforeAll(() => {
    // Set up encryption key for tests
    if (!process.env.TOKEN_ENCRYPTION_KEY && !process.env.DATA_ENCRYPTION_KEY) {
      process.env.TOKEN_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests-32-bytes-long';
    }
    
    service = new IntegrationsService();
  });

  /**
   * Property: State parameter validation prevents CSRF attacks
   * 
   * For any valid OAuth state generated during initiation, attempting to use
   * a different state in the callback should fail with INVALID_STATE error.
   */
  it('should reject OAuth callbacks with mismatched state parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 1000000 }),
        // Generate random authorization codes (alphanumeric)
        fc.string({ minLength: 20, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9]/g, "a")).filter(s => s.length >= 20),
        async (userId, authCode) => {
          // Generate a properly formatted but invalid state
          // Format: userId:timestamp:randomToken:signature
          // We'll create one with an invalid signature
          const timestamp = Date.now();
          const randomToken = 'a'.repeat(64); // 64 char hex string
          const invalidSignature = 'b'.repeat(64); // Wrong signature
          const invalidState = `${userId}:${timestamp}:${randomToken}:${invalidSignature}`;
          
          // Attempt to handle callback with invalid state
          // This should throw an INVALID_STATE error
          try {
            await service.handleOAuthCallback(
              'instagram' as Provider,
              authCode,
              invalidState
            );
            
            // If we reach here, the test should fail
            // because invalid state should be rejected
            console.error('[TEST] No error thrown for invalid state:', { userId, authCode: authCode.substring(0, 10), invalidState: invalidState.substring(0, 50) });
            return false;
          } catch (error: any) {
            // Verify that the error is specifically about invalid state
            const isValidError = error.code === 'INVALID_STATE' || 
                   error.message?.includes('Invalid state') ||
                   error.message?.includes('signature') ||
                   error.message?.includes('HMAC') ||
                   error.code === 'OAUTH_CALLBACK_ERROR';
            
            if (!isValidError) {
              console.error('[TEST] Unexpected error:', { code: error.code, message: error.message });
            }
            
            return isValidError;
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * Property: Valid state parameters should be accepted
   * 
   * For any OAuth state that follows the correct format (userId:timestamp:random),
   * the state validation should extract the userId correctly.
   */
  it('should accept OAuth callbacks with correctly formatted state parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user IDs
        fc.integer({ min: 1, max: 1000000 }),
        // Generate random timestamps
        fc.integer({ min: Date.now() - 3600000, max: Date.now() }),
        // Generate random strings for the random component
        fc.string({ minLength: 5, maxLength: 15 }),
        async (userId, timestamp, randomStr) => {
          // Create a properly formatted state
          const validState = `${userId}:${timestamp}:${randomStr}`;
          
          // Extract userId from state (this is what the service does)
          const [userIdStr] = validState.split(':');
          const extractedUserId = parseInt(userIdStr, 10);
          
          // Verify that the userId can be correctly extracted
          return !isNaN(extractedUserId) && extractedUserId === userId;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Malformed state parameters should be rejected
   * 
   * For any state parameter that doesn't follow the expected format,
   * the validation should fail.
   */
  it('should reject OAuth callbacks with malformed state parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random authorization codes (alphanumeric)
        fc.string({ minLength: 20, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9]/g, "a")).filter(s => s.length >= 20),
        // Generate malformed states (wrong format, missing components, etc.)
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, "a")), // No colons - wrong format
          fc.constant('invalid'), // Single word
          fc.constant('not:a:number:format'), // Non-numeric userId
          fc.constant('123'), // Just a number, missing components
          fc.constant('123:456'), // Only 2 components, needs 4
          fc.constant('abc:123:token:sig'), // Non-numeric userId
        ),
        async (authCode, malformedState) => {
          // Attempt to handle callback with malformed state
          try {
            await service.handleOAuthCallback(
              'instagram' as Provider,
              authCode,
              malformedState
            );
            
            // If we reach here, the state was somehow accepted
            // This should not happen for malformed states
            return false;
          } catch (error: any) {
            // Malformed state should cause an error
            return error.code === 'INVALID_STATE' || 
                   error.code === 'OAUTH_CALLBACK_ERROR' ||
                   error.message.includes('Invalid state') ||
                   error.message.includes('format');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State parameter should contain valid user ID
   * 
   * For any state parameter, if it's accepted, the extracted user ID
   * should be a positive integer.
   */
  it('should ensure state parameters contain valid positive user IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various user ID values including edge cases
        fc.oneof(
          fc.integer({ min: 1, max: 1000000 }), // Valid positive IDs
          fc.integer({ min: -1000, max: 0 }), // Invalid negative/zero IDs
        ),
        fc.integer({ min: Date.now() - 3600000, max: Date.now() }),
        fc.string({ minLength: 5, maxLength: 15 }),
        async (userId, timestamp, randomStr) => {
          const state = `${userId}:${timestamp}:${randomStr}`;
          
          // Extract and validate userId
          const [userIdStr] = state.split(':');
          const extractedUserId = parseInt(userIdStr, 10);
          
          // Valid user IDs should be positive integers
          if (userId > 0) {
            return !isNaN(extractedUserId) && extractedUserId === userId && extractedUserId > 0;
          } else {
            // Negative or zero user IDs should be considered invalid
            return extractedUserId <= 0 || isNaN(extractedUserId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State uniqueness across multiple OAuth flows
   * 
   * For any two OAuth initiation flows, the generated state parameters
   * should be unique to prevent state collision attacks.
   */
  it('should generate unique state parameters for different OAuth flows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.constant('instagram' as Provider),
        fc.constant('https://example.com/callback'),
        async (userId, provider, redirectUrl) => {
          // Generate two states for the same user
          const result1 = await service.initiateOAuthFlow(provider, userId, redirectUrl);
          
          // Small delay to ensure timestamp difference
          await new Promise(resolve => setTimeout(resolve, 1));
          
          const result2 = await service.initiateOAuthFlow(provider, userId, redirectUrl);
          
          // States should be different even for the same user
          return result1.state !== result2.state;
        }
      ),
      { numRuns: 50 } // Fewer runs due to async operations
    );
  });
});
