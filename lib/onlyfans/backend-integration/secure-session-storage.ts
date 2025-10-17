import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

interface SessionData {
  userId: string;
  platform: string;
  encryptedData: string;
  keyId: string;
  createdAt: string;
  expiresAt: string;
  lastUsed: string;
  ipAddress?: string;
  deviceFingerprint: string;
}

export class SecureSessionStorage {
  private dynamodb: DynamoDBClient;
  private kms: KMSClient;
  private tableName = 'huntaze-platform-sessions';
  private kmsKeyId: string;
  // Simple in-memory DEK cache to reduce KMS Decrypt calls
  private static dekCache = new Map<string, { key: Buffer; exp: number }>();
  private static dekTtlMs = Number(process.env.KMS_DEK_CACHE_TTL_MS || 15 * 60 * 1000);

  constructor() {
    this.dynamodb = new DynamoDBClient({
      region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    });
    this.kms = new KMSClient({ region: process.env.AWS_REGION });
    this.kmsKeyId = process.env.KMS_KEY_ID!;
  }

  /**
   * Store encrypted session with multi-layer security
   */
  async storeSession(
    userId: string,
    platform: string,
    sessionData: any,
    ipAddress?: string
  ): Promise<void> {
    // Layer 1: Encrypt session data with AES-256-GCM
    const dataKey = randomBytes(32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
    
    const jsonData = JSON.stringify(sessionData);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Layer 2: Encrypt the data key with AWS KMS
    const encryptedDataKey = await this.kms.send(
      new EncryptCommand({
        KeyId: this.kmsKeyId,
        Plaintext: dataKey
      })
    );

    // Combine encrypted data with metadata
    const envelope = {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encryptedKey: Buffer.from(encryptedDataKey.CiphertextBlob!).toString('base64'),
      algorithm: 'aes-256-gcm',
      kmsKeyId: this.kmsKeyId
    };

    // Generate device fingerprint
    const deviceFingerprint = this.generateDeviceFingerprint(sessionData);

    // Store in DynamoDB with TTL
    const item: SessionData = {
      userId,
      platform,
      encryptedData: JSON.stringify(envelope),
      keyId: `${userId}#${platform}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: new Date().toISOString(),
      ipAddress,
      deviceFingerprint
    };

    await this.dynamodb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: this.marshallItem(item),
        ConditionExpression: 'attribute_not_exists(keyId)'
      })
    );

    // Audit log
    await this.logSessionAccess(userId, platform, 'CREATE', ipAddress);
  }

  /**
   * Retrieve and decrypt session
   */
  async getSession(
    userId: string,
    platform: string,
    ipAddress?: string
  ): Promise<any | null> {
    const response = await this.dynamodb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: {
          keyId: { S: `${userId}#${platform}` }
        }
      })
    );

    if (!response.Item) {
      return null;
    }

    const item = this.unmarshallItem(response.Item) as SessionData;

    // Check expiration
    if (new Date(item.expiresAt) < new Date()) {
      await this.deleteSession(userId, platform);
      return null;
    }

    // Verify IP if strict mode
    if (process.env.STRICT_IP_CHECK === 'true' && ipAddress !== item.ipAddress) {
      await this.logSessionAccess(userId, platform, 'IP_MISMATCH', ipAddress);
      throw new Error('Session access from different IP');
    }

    // Decrypt the envelope
    const envelope = JSON.parse(item.encryptedData);
    
    // Layer 2: Decrypt data key with KMS (with in-memory cache)
    const encKeyB64: string = envelope.encryptedKey;
    const keyId = createHash('sha256').update(encKeyB64).digest('hex');
    let dataKey: Buffer | null = null;
    const now = Date.now();
    try {
      const hit = SecureSessionStorage.dekCache.get(keyId);
      if (hit && hit.exp > now) {
        dataKey = hit.key;
      }
    } catch {}
    if (!dataKey) {
      const decryptedKeyResponse = await this.kms.send(
        new DecryptCommand({
          CiphertextBlob: Buffer.from(encKeyB64, 'base64'),
          KeyId: this.kmsKeyId
        })
      );
      dataKey = Buffer.from(decryptedKeyResponse.Plaintext!);
      try {
        SecureSessionStorage.dekCache.set(keyId, { key: dataKey, exp: now + SecureSessionStorage.dekTtlMs });
        // Optional: naive size control
        if (SecureSessionStorage.dekCache.size > 1000) {
          const first = SecureSessionStorage.dekCache.keys().next().value as string | undefined;
          if (first) SecureSessionStorage.dekCache.delete(first);
        }
      } catch {}
    }
    
    // Layer 1: Decrypt session data
    const decipher = createDecipheriv(
      'aes-256-gcm',
      dataKey,
      Buffer.from(envelope.iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(envelope.data, 'base64')),
      decipher.final()
    ]);

    // Update last used
    await this.updateLastUsed(userId, platform);
    
    // Audit log
    await this.logSessionAccess(userId, platform, 'ACCESS', ipAddress);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Delete session
   */
  async deleteSession(userId: string, platform: string): Promise<void> {
    await this.dynamodb.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: {
          keyId: { S: `${userId}#${platform}` }
        }
      })
    );

    await this.logSessionAccess(userId, platform, 'DELETE');
  }

  /**
   * Rotate session encryption
   */
  async rotateSession(
    userId: string,
    platform: string
  ): Promise<void> {
    const session = await this.getSession(userId, platform);
    if (!session) return;

    await this.deleteSession(userId, platform);
    await this.storeSession(userId, platform, session);
    
    await this.logSessionAccess(userId, platform, 'ROTATE');
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(sessionData: any): string {
    const data = {
      userAgent: sessionData.userAgent,
      viewport: sessionData.viewport,
      timezone: sessionData.timezone,
      cookies: sessionData.cookies?.map((c: any) => c.name).sort()
    };
    
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(
    userId: string,
    platform: string
  ): Promise<void> {
    await this.dynamodb.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: {
          keyId: { S: `${userId}#${platform}` }
        },
        UpdateExpression: 'SET lastUsed = :now',
        ExpressionAttributeValues: {
          ':now': { S: new Date().toISOString() }
        }
      })
    );
  }

  /**
   * Audit logging
   */
  private async logSessionAccess(
    userId: string,
    platform: string,
    action: string,
    ipAddress?: string
  ): Promise<void> {
    // Log to CloudWatch or audit table
    console.log({
      timestamp: new Date().toISOString(),
      userId,
      platform,
      action,
      ipAddress,
      environment: process.env.NODE_ENV
    });
  }

  /**
   * Marshall DynamoDB item
   */
  private marshallItem(item: any): any {
    const marshalled: any = {};
    for (const [key, value] of Object.entries(item as Record<string, any>)) {
      if (typeof value === 'string') {
        marshalled[key] = { S: value };
      } else if (typeof value === 'number') {
        marshalled[key] = { N: value.toString() };
      } else if (typeof value === 'boolean') {
        marshalled[key] = { BOOL: value };
      }
    }
    return marshalled;
  }

  /**
   * Unmarshall DynamoDB item
   */
  private unmarshallItem(item: any): any {
    const unmarshalled: any = {};
    for (const [key, value] of Object.entries(item as Record<string, any>)) {
      if (value.S) unmarshalled[key] = value.S;
      else if (value.N) unmarshalled[key] = parseFloat(value.N);
      else if (value.BOOL !== undefined) unmarshalled[key] = value.BOOL;
    }
    return unmarshalled;
  }

  /**
   * Batch session check (for monitoring)
   */
  async checkSessionHealth(userId: string): Promise<{
    platform: string;
    status: 'active' | 'expired' | 'missing';
    lastUsed?: string;
    expiresAt?: string;
  }[]> {
    const platforms = ['onlyfans', 'fansly', 'reddit', 'instagram'];
    const results = [];

    for (const platform of platforms) {
      try {
        const session = await this.getSession(userId, platform);
        if (session) {
          results.push({
            platform,
            status: 'active' as const,
            lastUsed: session.lastUsed,
            expiresAt: session.expiresAt
          });
        } else {
          results.push({
            platform,
            status: 'missing' as const
          });
        }
      } catch (error) {
        results.push({
          platform,
          status: 'expired' as const
        });
      }
    }

    return results;
  }
}

// Environment variables needed:
// KMS_KEY_ID - AWS KMS key for encryption
// STRICT_IP_CHECK - Whether to enforce IP consistency
// AWS_REGION - AWS region for services

// Usage:
// const storage = new SecureSessionStorage();
// await storage.storeSession(userId, 'onlyfans', sessionData, ipAddress);
// const session = await storage.getSession(userId, 'onlyfans', ipAddress);
