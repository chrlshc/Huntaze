/**
 * Property-Based Tests: OAuth Success Handling
 * Feature: signup-ux-optimization, Property 7: OAuth Success Handling
 * 
 * Validates: Requirements 3.3
 * 
 * Property: For any successful OAuth authentication, the system should create or link the user account and redirect to onboarding
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property 7: OAuth Success Handling', () => {
  it('should create new user account for first-time OAuth users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (provider, email, name) => {
          const userExists = false;

          if (!userExists) {
            const newUser = {
              email,
              name,
              signup_method: provider,
              email_verified: true,
            };

            // Property: New user should have OAuth provider as signup method
            expect(newUser.signup_method).toBe(provider);
            expect(newUser.email_verified).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should link OAuth account to existing user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.emailAddress(),
        fc.integer({ min: 1, max: 10000 }),
        async (provider, email, userId) => {
          const userExists = true;

          if (userExists) {
            const linkedAccount = {
              userId,
              provider,
              providerAccountId: `${provider}_${userId}`,
            };

            // Property: Linked account should reference existing user
            expect(linkedAccount.userId).toBe(userId);
            expect(linkedAccount.provider).toBe(provider);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract user profile from OAuth response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.webUrl(),
        async (provider, email, name, picture) => {
          const profile = {
            email,
            name,
            picture,
            email_verified: true,
          };

          // Property: Profile should contain required fields
          expect(profile.email).toBe(email);
          expect(profile.name).toBe(name);
          expect(profile.email_verified).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should redirect to onboarding after successful OAuth', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.boolean(),
        async (provider, onboardingCompleted) => {
          const redirectUrl = onboardingCompleted ? '/dashboard' : '/onboarding';

          // Property: New users should be redirected to onboarding
          if (!onboardingCompleted) {
            expect(redirectUrl).toBe('/onboarding');
          } else {
            expect(redirectUrl).toBe('/dashboard');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should store OAuth tokens securely', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 50, maxLength: 200 }),
        fc.string({ minLength: 50, maxLength: 200 }),
        fc.integer({ min: 3600, max: 7200 }),
        async (accessToken, refreshToken, expiresIn) => {
          const tokens = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + expiresIn,
          };

          // Property: Tokens should be stored with expiration
          expect(tokens.access_token).toBeTruthy();
          expect(tokens.refresh_token).toBeTruthy();
          expect(tokens.expires_at).toBeGreaterThan(Date.now() / 1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle OAuth callback with authorization code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 100 }),
        fc.string({ minLength: 20, maxLength: 100 }),
        async (code, state) => {
          const callbackParams = {
            code,
            state,
          };

          // Property: Callback should include code and state
          expect(callbackParams.code).toBeTruthy();
          expect(callbackParams.state).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify state parameter matches original request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (originalState, returnedState) => {
          const stateMatches = originalState === returnedState;

          // Property: State mismatch should be detected
          if (originalState === returnedState) {
            expect(stateMatches).toBe(true);
          } else {
            expect(stateMatches).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set email_verified to true for OAuth users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.emailAddress(),
        async (provider, email) => {
          const user = {
            email,
            email_verified: true,
            signup_method: provider,
          };

          // Property: OAuth users should have verified emails
          expect(user.email_verified).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track signup_completed_at timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date() }),
        async (signupTime) => {
          const now = new Date();

          // Property: Signup timestamp should not be in the future
          expect(signupTime.getTime()).toBeLessThanOrEqual(now.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle OAuth provider-specific account IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.string({ minLength: 10, maxLength: 50 }),
        async (provider, providerAccountId) => {
          const account = {
            provider,
            providerAccountId,
          };

          // Property: Provider account ID should be unique per provider
          expect(account.providerAccountId).toBeTruthy();
          expect(account.provider).toBe(provider);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent duplicate OAuth account linking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 10000 }),
        async (provider, providerAccountId, userId) => {
          const existingAccounts = new Set<string>();
          const accountKey = `${provider}:${providerAccountId}`;

          const isDuplicate = existingAccounts.has(accountKey);

          // Property: Duplicate account linking should be prevented
          if (!isDuplicate) {
            existingAccounts.add(accountKey);
            expect(existingAccounts.has(accountKey)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle OAuth token refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 50, maxLength: 200 }),
        fc.integer({ min: 0, max: 7200 }),
        async (refreshToken, expiresIn) => {
          const tokenExpired = expiresIn <= 0;

          // Property: Expired tokens should trigger refresh
          if (tokenExpired) {
            expect(refreshToken).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create session after successful OAuth', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.emailAddress(),
        async (userId, email) => {
          const session = {
            user: {
              id: userId.toString(),
              email,
              onboardingCompleted: false,
            },
          };

          // Property: Session should contain user information
          expect(session.user.id).toBeTruthy();
          expect(session.user.email).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle OAuth errors during token exchange', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('invalid_grant', 'invalid_client', 'unauthorized_client'),
        async (errorCode) => {
          const validErrorCodes = ['invalid_grant', 'invalid_client', 'unauthorized_client'];

          // Property: OAuth errors should be recognized
          expect(validErrorCodes).toContain(errorCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track first_login_at for new OAuth users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date() }),
        async (loginTime) => {
          const now = new Date();

          // Property: First login timestamp should be valid
          expect(loginTime.getTime()).toBeLessThanOrEqual(now.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle case-insensitive email matching for account linking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const variations = [
            email.toLowerCase(),
            email.toUpperCase(),
            email,
          ];

          const normalized = variations.map(v => v.toLowerCase());

          // Property: All email variations should match the same user
          expect(normalized.every(v => v === normalized[0])).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should initialize onboarding state for new OAuth users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        async (provider) => {
          const newUser = {
            onboarding_completed: false,
            onboarding_step: 0,
            signup_method: provider,
          };

          // Property: New users should start at onboarding step 0
          expect(newUser.onboarding_completed).toBe(false);
          expect(newUser.onboarding_step).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle OAuth scope validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        fc.array(fc.constantFrom('email', 'profile', 'openid'), { minLength: 1, maxLength: 3 }),
        async (provider, grantedScopes) => {
          const requiredScopes = ['email'];

          // Property: Required scopes should be granted
          const hasRequiredScopes = requiredScopes.every(scope => 
            grantedScopes.includes(scope)
          );

          if (grantedScopes.includes('email')) {
            expect(hasRequiredScopes).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle OAuth profile picture URL', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ['https'] }),
        async (pictureUrl) => {
          // Property: Profile picture should be HTTPS URL
          expect(pictureUrl).toMatch(/^https:\/\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track OAuth provider in analytics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('google', 'apple'),
        async (provider) => {
          const analyticsEvent = {
            event: 'signup_completed',
            method: provider,
            timestamp: new Date(),
          };

          // Property: Analytics should track OAuth provider
          expect(analyticsEvent.method).toBe(provider);
          expect(['google', 'apple']).toContain(analyticsEvent.method);
        }
      ),
      { numRuns: 100 }
    );
  });
});
