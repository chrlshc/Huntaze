/**
 * AWS Secrets Manager avec cache mémoire
 * 
 * Utilise IAM roles (pas de clés statiques)
 * Cache les secrets pour éviter les cold starts
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Client avec IAM role (pas de credentials explicites)
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Cache mémoire
const cache = new Map<string, { value: string; timestamp: number }>();

/**
 * Récupère un secret depuis AWS Secrets Manager
 * 
 * @param name - Nom du secret (ex: 'huntaze/database/password')
 * @param ttlMs - TTL du cache en millisecondes (défaut: 5 minutes)
 * @returns La valeur du secret
 */
export async function getSecret(name: string, ttlMs = 5 * 60_000): Promise<string> {
  const now = Date.now();
  const cached = cache.get(name);
  
  // Return from cache if valid
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.value;
  }
  
  try {
    const command = new GetSecretValueCommand({ SecretId: name });
    const response = await client.send(command);
    const value = response.SecretString ?? '';
    
    // Update cache
    cache.set(name, { value, timestamp: now });
    
    return value;
  } catch (error) {
    console.error(`[Secrets] Failed to get secret: ${name}`, error);
    
    // Return cached value if available (even if expired)
    if (cached) {
      console.warn(`[Secrets] Using expired cache for: ${name}`);
      return cached.value;
    }
    
    throw error;
  }
}

/**
 * Récupère un secret JSON parsé
 */
export async function getSecretJSON<T = any>(name: string, ttlMs?: number): Promise<T> {
  const value = await getSecret(name, ttlMs);
  return JSON.parse(value);
}

/**
 * Clear cache (utile pour les tests)
 */
export function clearSecretCache() {
  cache.clear();
}

/**
 * Exemples d'utilisation:
 * 
 * // Database password
 * const dbPassword = await getSecret('huntaze/database/password');
 * 
 * // API keys
 * const onlyfansApiKey = await getSecret('huntaze/onlyfans/api-key');
 * 
 * // JSON secrets
 * const awsConfig = await getSecretJSON<{ accessKeyId: string; secretAccessKey: string }>(
 *   'huntaze/aws/credentials'
 * );
 */
