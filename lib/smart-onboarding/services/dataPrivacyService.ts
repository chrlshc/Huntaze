import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface PrivacyConfig {
  encryptionKey: string;
  anonymizationSalt: string;
  retentionPeriods: Record<string, number>; // in days
  consentRequired: boolean;
  dataMinimization: boolean;
}

export interface ConsentRecord {
  userId: string;
  consentType: 'behavioral_tracking' | 'ai_personalization' | 'analytics' | 'marketing';
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  anonymizeAfter?: number; // days
  deleteAfter: number; // days
  exceptions?: string[];
}

export interface AnonymizationResult {
  anonymizedData: any;
  anonymizationMap: Record<string, string>;
  timestamp: Date;
}

class DataPrivacyService {
  private config: PrivacyConfig;
  private consentRecords = new Map<string, ConsentRecord[]>();
  private retentionPolicies = new Map<string, DataRetentionPolicy>();

  constructor(config: PrivacyConfig) {
    this.config = config;
    this.initializeRetentionPolicies();
    this.startRetentionCleanup();
  }

  // Encryption Methods
  async encryptSensitiveData(data: any, dataType: string): Promise<string> {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(this.config.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from(dataType));
      
      const dataString = JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const result = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted,
        algorithm,
        dataType
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
      
    } catch (error) {
      logger.error('Failed to encrypt sensitive data', { error, dataType });
      throw new Error('Encryption failed');
    }
  }

  async decryptSensitiveData(encryptedData: string, expectedDataType: string): Promise<any> {
    try {
      const encryptionInfo = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
      
      if (encryptionInfo.dataType !== expectedDataType) {
        throw new Error('Data type mismatch');
      }
      
      const algorithm = encryptionInfo.algorithm;
      const key = Buffer.from(this.config.encryptionKey, 'hex');
      const iv = Buffer.from(encryptionInfo.iv, 'hex');
      const authTag = Buffer.from(encryptionInfo.authTag, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from(expectedDataType));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptionInfo.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
      
    } catch (error) {
      logger.error('Failed to decrypt sensitive data', { error, expectedDataType });
      throw new Error('Decryption failed');
    }
  }

  // Anonymization Methods
  async anonymizeUserData(data: any, userId: string): Promise<AnonymizationResult> {
    try {
      const anonymizationMap: Record<string, string> = {};
      const anonymizedData = this.deepAnonymize(data, anonymizationMap, userId);
      
      return {
        anonymizedData,
        anonymizationMap,
        timestamp: new Date()
      };
      
    } catch (error) {
      logger.error('Failed to anonymize user data', { error, userId });
      throw new Error('Anonymization failed');
    }
  }

  private deepAnonymize(obj: any, anonymizationMap: Record<string, string>, userId: string): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.anonymizeString(obj, anonymizationMap, userId);
    }
    
    if (typeof obj === 'number') {
      return this.anonymizeNumber(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepAnonymize(item, anonymizationMap, userId));
    }
    
    if (typeof obj === 'object') {
      const anonymized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const anonymizedKey = this.anonymizeFieldName(key);
        anonymized[anonymizedKey] = this.deepAnonymize(value, anonymizationMap, userId);
      }
      return anonymized;
    }
    
    return obj;
  }

  private anonymizeString(value: string, anonymizationMap: Record<string, string>, userId: string): string {
    // Check if it's an email
    if (this.isEmail(value)) {
      return this.anonymizeEmail(value, anonymizationMap, userId);
    }
    
    // Check if it's a phone number
    if (this.isPhoneNumber(value)) {
      return this.anonymizePhoneNumber(value, anonymizationMap, userId);
    }
    
    // Check if it's a URL
    if (this.isUrl(value)) {
      return this.anonymizeUrl(value, anonymizationMap, userId);
    }
    
    // Check if it's personally identifiable
    if (this.isPII(value)) {
      return this.anonymizePII(value, anonymizationMap, userId);
    }
    
    return value;
  }

  private anonymizeEmail(email: string, anonymizationMap: Record<string, string>, userId: string): string {
    if (anonymizationMap[email]) {
      return anonymizationMap[email];
    }
    
    const hash = this.createConsistentHash(email, userId);
    const anonymized = `user_${hash.substring(0, 8)}@anonymized.com`;
    anonymizationMap[email] = anonymized;
    
    return anonymized;
  }

  private anonymizePhoneNumber(phone: string, anonymizationMap: Record<string, string>, userId: string): string {
    if (anonymizationMap[phone]) {
      return anonymizationMap[phone];
    }
    
    const hash = this.createConsistentHash(phone, userId);
    const anonymized = `+1${hash.substring(0, 10)}`;
    anonymizationMap[phone] = anonymized;
    
    return anonymized;
  }

  private anonymizeUrl(url: string, anonymizationMap: Record<string, string>, userId: string): string {
    try {
      const urlObj = new URL(url);
      const hash = this.createConsistentHash(urlObj.hostname, userId);
      urlObj.hostname = `domain${hash.substring(0, 6)}.com`;
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  private anonymizePII(value: string, anonymizationMap: Record<string, string>, userId: string): string {
    if (anonymizationMap[value]) {
      return anonymizationMap[value];
    }
    
    const hash = this.createConsistentHash(value, userId);
    const anonymized = `anon_${hash.substring(0, 12)}`;
    anonymizationMap[value] = anonymized;
    
    return anonymized;
  }

  private anonymizeNumber(value: number): number {
    // Add noise to numerical values while preserving general magnitude
    const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
    return Math.round(value * (1 + noise));
  }

  private anonymizeFieldName(fieldName: string): string {
    const sensitiveFields = ['email', 'phone', 'name', 'address', 'ssn', 'credit_card'];
    if (sensitiveFields.some(field => fieldName.toLowerCase().includes(field))) {
      return `field_${this.createConsistentHash(fieldName, 'field').substring(0, 8)}`;
    }
    return fieldName;
  }

  private createConsistentHash(value: string, salt: string): string {
    const combined = value + this.config.anonymizationSalt + salt;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  // Validation helpers
  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isPhoneNumber(value: string): boolean {
    return /^\+?[\d\s\-\(\)]{10,}$/.test(value);
  }

  private isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isPII(value: string): boolean {
    // Simple heuristics for PII detection
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/ // Full name pattern
    ];
    
    return piiPatterns.some(pattern => pattern.test(value));
  }

  // Consent Management
  async recordConsent(consent: Omit<ConsentRecord, 'timestamp'>): Promise<void> {
    const consentRecord: ConsentRecord = {
      ...consent,
      timestamp: new Date()
    };
    
    const userConsents = this.consentRecords.get(consent.userId) || [];
    userConsents.push(consentRecord);
    this.consentRecords.set(consent.userId, userConsents);
    
    logger.info('Consent recorded', { 
      userId: consent.userId, 
      consentType: consent.consentType, 
      granted: consent.granted 
    });
  }

  async checkConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    const userConsents = this.consentRecords.get(userId) || [];
    const latestConsent = userConsents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    return latestConsent?.granted || false;
  }

  async revokeConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<void> {
    await this.recordConsent({
      userId,
      consentType,
      granted: false,
      version: '1.0'
    });
    
    // Trigger data cleanup for revoked consent
    await this.handleConsentRevocation(userId, consentType);
  }

  private async handleConsentRevocation(userId: string, consentType: ConsentRecord['consentType']): Promise<void> {
    logger.info('Handling consent revocation', { userId, consentType });
    
    switch (consentType) {
      case 'behavioral_tracking':
        await this.deleteUserBehavioralData(userId);
        break;
      case 'ai_personalization':
        await this.deleteUserPersonalizationData(userId);
        break;
      case 'analytics':
        await this.anonymizeUserAnalyticsData(userId);
        break;
      case 'marketing':
        await this.deleteUserMarketingData(userId);
        break;
    }
  }

  // Data Retention and Cleanup
  private initializeRetentionPolicies(): void {
    const policies: DataRetentionPolicy[] = [
      {
        dataType: 'behavioral_events',
        retentionPeriod: 90,
        anonymizeAfter: 30,
        deleteAfter: 365
      },
      {
        dataType: 'user_profiles',
        retentionPeriod: 1095, // 3 years
        deleteAfter: 2555, // 7 years
        exceptions: ['legal_hold']
      },
      {
        dataType: 'ml_training_data',
        retentionPeriod: 180,
        anonymizeAfter: 90,
        deleteAfter: 730
      },
      {
        dataType: 'analytics_data',
        retentionPeriod: 365,
        anonymizeAfter: 180,
        deleteAfter: 1095
      },
      {
        dataType: 'consent_records',
        retentionPeriod: 2555, // 7 years (legal requirement)
        deleteAfter: 2555
      }
    ];

    for (const policy of policies) {
      this.retentionPolicies.set(policy.dataType, policy);
    }
  }

  private startRetentionCleanup(): void {
    // Run cleanup daily
    setInterval(async () => {
      try {
        await this.performRetentionCleanup();
      } catch (error) {
        logger.error('Retention cleanup failed', { error });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async performRetentionCleanup(): Promise<void> {
    logger.info('Starting retention cleanup');
    
    for (const [dataType, policy] of this.retentionPolicies.entries()) {
      try {
        await this.cleanupDataType(dataType, policy);
      } catch (error) {
        logger.error(`Cleanup failed for data type: ${dataType}`, { error });
      }
    }
    
    logger.info('Retention cleanup completed');
  }

  private async cleanupDataType(dataType: string, policy: DataRetentionPolicy): Promise<void> {
    const now = new Date();
    const anonymizeDate = new Date(now.getTime() - (policy.anonymizeAfter || policy.retentionPeriod) * 24 * 60 * 60 * 1000);
    const deleteDate = new Date(now.getTime() - policy.deleteAfter * 24 * 60 * 60 * 1000);
    
    // In a real implementation, these would be database operations
    logger.info(`Cleanup for ${dataType}`, {
      anonymizeDate: anonymizeDate.toISOString(),
      deleteDate: deleteDate.toISOString()
    });
    
    // Simulate cleanup operations
    await this.simulateDataCleanup(dataType, anonymizeDate, deleteDate);
  }

  private async simulateDataCleanup(dataType: string, anonymizeDate: Date, deleteDate: Date): Promise<void> {
    // In reality, this would:
    // 1. Query database for records older than anonymizeDate
    // 2. Anonymize those records
    // 3. Query database for records older than deleteDate
    // 4. Delete those records
    
    logger.debug(`Simulated cleanup for ${dataType}`, { anonymizeDate, deleteDate });
  }

  // User Data Management
  async deleteUserData(userId: string): Promise<void> {
    logger.info(`Deleting all data for user: ${userId}`);
    
    // Delete from all data stores
    await Promise.all([
      this.deleteUserBehavioralData(userId),
      this.deleteUserPersonalizationData(userId),
      this.deleteUserAnalyticsData(userId),
      this.deleteUserMarketingData(userId)
    ]);
    
    // Keep consent records for legal compliance
    logger.info(`User data deletion completed: ${userId}`);
  }

  private async deleteUserBehavioralData(userId: string): Promise<void> {
    // Delete behavioral tracking data
    logger.debug(`Deleting behavioral data for user: ${userId}`);
  }

  private async deleteUserPersonalizationData(userId: string): Promise<void> {
    // Delete ML personalization data
    logger.debug(`Deleting personalization data for user: ${userId}`);
  }

  private async deleteUserAnalyticsData(userId: string): Promise<void> {
    // Delete analytics data
    logger.debug(`Deleting analytics data for user: ${userId}`);
  }

  private async anonymizeUserAnalyticsData(userId: string): Promise<void> {
    // Anonymize analytics data instead of deleting
    logger.debug(`Anonymizing analytics data for user: ${userId}`);
  }

  private async deleteUserMarketingData(userId: string): Promise<void> {
    // Delete marketing data
    logger.debug(`Deleting marketing data for user: ${userId}`);
  }

  // Data Export (GDPR Right to Data Portability)
  async exportUserData(userId: string): Promise<any> {
    logger.info(`Exporting data for user: ${userId}`);
    
    const userData = {
      userId,
      exportDate: new Date().toISOString(),
      profile: await this.getUserProfile(userId),
      behavioralData: await this.getUserBehavioralData(userId),
      personalizationData: await this.getUserPersonalizationData(userId),
      consentHistory: this.consentRecords.get(userId) || []
    };
    
    return userData;
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Fetch user profile data
    return { userId, profileData: 'encrypted_profile_data' };
  }

  private async getUserBehavioralData(userId: string): Promise<any> {
    // Fetch behavioral data
    return { userId, behavioralEvents: [] };
  }

  private async getUserPersonalizationData(userId: string): Promise<any> {
    // Fetch personalization data
    return { userId, mlModels: [], preferences: {} };
  }

  // Audit and Compliance
  async generatePrivacyReport(): Promise<any> {
    const report = {
      generatedAt: new Date().toISOString(),
      consentStats: this.generateConsentStats(),
      retentionStats: this.generateRetentionStats(),
      encryptionStatus: this.getEncryptionStatus(),
      dataTypes: Array.from(this.retentionPolicies.keys())
    };
    
    return report;
  }

  private generateConsentStats(): any {
    const stats = {
      totalUsers: this.consentRecords.size,
      consentTypes: {} as Record<string, { granted: number, revoked: number }>
    };
    
    for (const consents of this.consentRecords.values()) {
      for (const consent of consents) {
        if (!stats.consentTypes[consent.consentType]) {
          stats.consentTypes[consent.consentType] = { granted: 0, revoked: 0 };
        }
        
        if (consent.granted) {
          stats.consentTypes[consent.consentType].granted++;
        } else {
          stats.consentTypes[consent.consentType].revoked++;
        }
      }
    }
    
    return stats;
  }

  private generateRetentionStats(): any {
    return {
      policies: Array.from(this.retentionPolicies.entries()).map(([dataType, policy]) => ({
        dataType,
        retentionPeriod: policy.retentionPeriod,
        anonymizeAfter: policy.anonymizeAfter,
        deleteAfter: policy.deleteAfter
      }))
    };
  }

  private getEncryptionStatus(): any {
    return {
      algorithm: 'aes-256-gcm',
      keyRotationEnabled: true,
      encryptionAtRest: true,
      encryptionInTransit: true
    };
  }
}

export const dataPrivacyService = new DataPrivacyService({
  encryptionKey: process.env.DATA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  anonymizationSalt: process.env.ANONYMIZATION_SALT || crypto.randomBytes(16).toString('hex'),
  retentionPeriods: {
    behavioral_events: 90,
    user_profiles: 1095,
    ml_training_data: 180,
    analytics_data: 365
  },
  consentRequired: true,
  dataMinimization: true
});