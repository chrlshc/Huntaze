import {
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

const defaultRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const secretsClient = new SecretsManagerClient({ region: defaultRegion });
type CacheEntry = { value: string; exp: number };
const secretCache = new Map<string, CacheEntry>();
const SECRET_TTL_MS = Number(process.env.SECRETS_CACHE_TTL_MS || 10 * 60 * 1000);

function decodeSecretValue(result: GetSecretValueCommandOutput): string {
  if (result.SecretString) {
    return result.SecretString;
  }

  if (result.SecretBinary) {
    return Buffer.from(result.SecretBinary as Uint8Array).toString('utf-8');
  }

  throw new Error('Secret value is empty.');
}

export async function getSecretString(secretId: string): Promise<string> {
  if (!secretId) {
    throw new Error('Secret identifier is required.');
  }

  const now = Date.now();
  const hit = secretCache.get(secretId);
  if (hit && hit.exp > now) return hit.value;

  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretsClient.send(command);
  const value = decodeSecretValue(response);
  secretCache.set(secretId, { value, exp: now + SECRET_TTL_MS });
  return value;
}

export async function getSecretFromEnv(options: {
  directValueEnv: string;
  secretNameEnv: string;
  defaultSecretName?: string;
}): Promise<string> {
  const { directValueEnv, secretNameEnv, defaultSecretName } = options;
  const directValue = process.env[directValueEnv];
  if (directValue) {
    return directValue;
  }

  const secretName = process.env[secretNameEnv] || defaultSecretName;
  if (!secretName) {
    throw new Error(
      `Missing configuration: set ${directValueEnv} or ${secretNameEnv} to resolve secret value.`,
    );
  }

  return getSecretString(secretName);
}

export function clearSecretCache(): void {
  secretCache.clear();
}
