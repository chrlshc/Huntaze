/**
 * Policy Resolution Module
 * 
 * Resolves rate limit policies based on endpoint patterns and user identity.
 */

import { Identity, RateLimitPolicy, UserTier } from './types';
import {
  RATE_LIMIT_POLICIES,
  DEFAULT_POLICY,
  IP_RATE_LIMITS,
  isIPWhitelisted,
} from '../../config/rate-limits';

/**
 * Resolve rate limit policy for a request
 * 
 * Takes into account:
 * - Endpoint pattern matching (exact and prefix)
 * - User tier (free/premium/enterprise)
 * - IP whitelist bypass
 * - Unauthenticated vs authenticated requests
 * 
 * @param endpoint API endpoint path
 * @param identity User identity
 * @returns Resolved rate limit policy
 */
export function resolveRateLimitPolicy(
  endpoint: string,
  identity: Identity
): RateLimitPolicy | null {
  // Check IP whitelist first
  if (identity.type === 'ip' && isIPWhitelisted(identity.value)) {
    // Whitelisted IPs bypass rate limiting
    return null;
  }
  
  // Get base policy for endpoint
  let policy = findPolicyForEndpoint(endpoint);
  
  // If no specific policy found, use default or IP limits
  if (!policy) {
    policy = identity.type === 'ip' ? IP_RATE_LIMITS : DEFAULT_POLICY;
  }
  
  // Apply tier-based overrides
  if (identity.tier && policy.tiers?.[identity.tier]) {
    policy = {
      ...policy,
      ...policy.tiers[identity.tier],
    };
  }
  
  return policy;
}

/**
 * Find policy for an endpoint using pattern matching
 * 
 * Tries exact match first, then prefix match.
 * 
 * @param endpoint API endpoint path
 * @returns Matching policy or null
 */
export function findPolicyForEndpoint(endpoint: string): RateLimitPolicy | null {
  // 1. Try exact match
  if (RATE_LIMIT_POLICIES[endpoint]) {
    return RATE_LIMIT_POLICIES[endpoint];
  }
  
  // 2. Try prefix match (longest match wins)
  let longestMatch: string | null = null;
  let longestMatchLength = 0;
  
  for (const pattern of Object.keys(RATE_LIMIT_POLICIES)) {
    if (endpoint.startsWith(pattern) && pattern.length > longestMatchLength) {
      longestMatch = pattern;
      longestMatchLength = pattern.length;
    }
  }
  
  if (longestMatch) {
    return RATE_LIMIT_POLICIES[longestMatch];
  }
  
  // 3. No match found
  return null;
}

/**
 * Check if a policy should be bypassed
 * 
 * @param identity User identity
 * @returns True if rate limiting should be bypassed
 */
export function shouldBypassRateLimit(identity: Identity): boolean {
  // Whitelist check for IPs
  if (identity.type === 'ip' && isIPWhitelisted(identity.value)) {
    return true;
  }
  
  // Could add other bypass conditions here
  // For example: admin users, service accounts, etc.
  
  return false;
}

/**
 * Get effective limit for a policy and time window
 * 
 * @param policy Rate limit policy
 * @param window Time window ('minute' | 'hour' | 'day')
 * @returns Effective limit for the window
 */
export function getEffectiveLimit(
  policy: RateLimitPolicy,
  window: 'minute' | 'hour' | 'day'
): number {
  switch (window) {
    case 'minute':
      return policy.perMinute;
    case 'hour':
      return policy.perHour || policy.perMinute * 60;
    case 'day':
      return policy.perDay || (policy.perHour || policy.perMinute * 60) * 24;
    default:
      return policy.perMinute;
  }
}

/**
 * Merge multiple policies (for complex scenarios)
 * 
 * Takes the most restrictive limit from each policy.
 * 
 * @param policies Array of policies to merge
 * @returns Merged policy with most restrictive limits
 */
export function mergePolicies(policies: RateLimitPolicy[]): RateLimitPolicy {
  if (policies.length === 0) {
    return DEFAULT_POLICY;
  }
  
  if (policies.length === 1) {
    return policies[0];
  }
  
  // Take the most restrictive (lowest) limit for each window
  const merged: RateLimitPolicy = {
    perMinute: Math.min(...policies.map(p => p.perMinute)),
    algorithm: policies[0].algorithm, // Use first policy's algorithm
  };
  
  // Optional windows
  const hourLimits = policies
    .map(p => p.perHour)
    .filter((l): l is number => l !== undefined);
  if (hourLimits.length > 0) {
    merged.perHour = Math.min(...hourLimits);
  }
  
  const dayLimits = policies
    .map(p => p.perDay)
    .filter((l): l is number => l !== undefined);
  if (dayLimits.length > 0) {
    merged.perDay = Math.min(...dayLimits);
  }
  
  const burstLimits = policies
    .map(p => p.burst)
    .filter((b): b is number => b !== undefined);
  if (burstLimits.length > 0) {
    merged.burst = Math.min(...burstLimits);
  }
  
  return merged;
}

/**
 * Format policy for logging/display
 * 
 * @param policy Rate limit policy
 * @returns Human-readable policy description
 */
export function formatPolicy(policy: RateLimitPolicy): string {
  const parts: string[] = [];
  
  parts.push(`${policy.perMinute}/min`);
  
  if (policy.perHour) {
    parts.push(`${policy.perHour}/hour`);
  }
  
  if (policy.perDay) {
    parts.push(`${policy.perDay}/day`);
  }
  
  if (policy.burst) {
    parts.push(`burst:${policy.burst}`);
  }
  
  parts.push(`algo:${policy.algorithm}`);
  
  return parts.join(', ');
}

/**
 * Validate that a policy is well-formed
 * 
 * @param policy Policy to validate
 * @returns True if valid
 */
export function isValidPolicy(policy: RateLimitPolicy): boolean {
  // Must have perMinute
  if (!policy.perMinute || policy.perMinute <= 0) {
    return false;
  }
  
  // If perHour exists, must be >= perMinute
  if (policy.perHour && policy.perHour < policy.perMinute) {
    return false;
  }
  
  // If perDay exists, must be >= perHour (or perMinute * 60 * 24)
  if (policy.perDay) {
    const minPerDay = policy.perHour || policy.perMinute * 60 * 24;
    if (policy.perDay < minPerDay) {
      return false;
    }
  }
  
  // Must have valid algorithm
  if (!['token-bucket', 'sliding-window', 'fixed-window'].includes(policy.algorithm)) {
    return false;
  }
  
  return true;
}
