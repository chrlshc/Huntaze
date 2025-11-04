import { ConsentRecord, dataPrivacyService } from './dataPrivacyService';
import { logger } from '../../utils/logger';

export interface ConsentConfiguration {
  consentTypes: ConsentTypeConfig[];
  defaultConsents: Record<string, boolean>;
  requireExplicitConsent: boolean;
  consentVersion: string;
  legalBasis: Record<string, string>;
}

export interface ConsentTypeConfig {
  type: ConsentRecord['consentType'];
  name: string;
  description: string;
  required: boolean;
  category: 'essential' | 'functional' | 'analytics' | 'marketing';
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  dataProcessed: string[];
  retentionPeriod: number;
  thirdParties?: string[];
}

export interface ConsentPreferences {
  userId: string;
  preferences: Record<string, boolean>;
  version: string;
  timestamp: Date;
  source: 'onboarding' | 'settings' | 'banner' | 'api';
}

export interface ConsentBannerConfig {
  showBanner: boolean;
  position: 'top' | 'bottom' | 'modal';
  allowGranular: boolean;
  defaultToOptOut: boolean;
  cookieNotice: boolean;
}

class UserConsentManager {
  private consentConfig: ConsentConfiguration;
  private bannerConfig: ConsentBannerConfig;
  private userPreferences = new Map<string, ConsentPreferences>();

  constructor() {
    this.consentConfig = this.getDefaultConsentConfig();
    this.bannerConfig = this.getDefaultBannerConfig();
  }

  // Consent Collection
  async collectConsent(
    userId: string, 
    consents: Record<string, boolean>,
    source: ConsentPreferences['source'] = 'onboarding',
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    try {
      // Validate consent types
      for (const consentType of Object.keys(consents)) {
        if (!this.isValidConsentType(consentType)) {
          throw new Error(`Invalid consent type: ${consentType}`);
        }
      }

      // Check required consents
      await this.validateRequiredConsents(consents);

      // Record individual consents
      for (const [consentType, granted] of Object.entries(consents)) {
        await dataPrivacyService.recordConsent({
          userId,
          consentType: consentType as ConsentRecord['consentType'],
          granted,
          version: this.consentConfig.consentVersion,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        });
      }

      // Store user preferences
      const preferences: ConsentPreferences = {
        userId,
        preferences: consents,
        version: this.consentConfig.consentVersion,
        timestamp: new Date(),
        source
      };

      this.userPreferences.set(userId, preferences);

      // Apply consent decisions
      await this.applyConsentDecisions(userId, consents);

      logger.info('User consent collected', { userId, consents, source });

    } catch (error) {
      logger.error('Failed to collect consent', { error, userId, consents });
      throw error;
    }
  }

  async updateConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    source: ConsentPreferences['source'] = 'settings'
  ): Promise<void> {
    try {
      // Record the consent change
      await dataPrivacyService.recordConsent({
        userId,
        consentType,
        granted,
        version: this.consentConfig.consentVersion
      });

      // Update user preferences
      const currentPreferences = this.userPreferences.get(userId);
      if (currentPreferences) {
        currentPreferences.preferences[consentType] = granted;
        currentPreferences.timestamp = new Date();
        currentPreferences.source = source;
      }

      // Apply the consent decision
      await this.applyConsentDecision(userId, consentType, granted);

      logger.info('User consent updated', { userId, consentType, granted, source });

    } catch (error) {
      logger.error('Failed to update consent', { error, userId, consentType });
      throw error;
    }
  }

  async revokeAllConsent(userId: string): Promise<void> {
    try {
      const consentTypes = this.consentConfig.consentTypes
        .filter(config => !config.required)
        .map(config => config.type);

      for (const consentType of consentTypes) {
        await this.updateConsent(userId, consentType, false, 'settings');
      }

      logger.info('All non-essential consent revoked', { userId });

    } catch (error) {
      logger.error('Failed to revoke all consent', { error, userId });
      throw error;
    }
  }

  // Consent Validation
  private async validateRequiredConsents(consents: Record<string, boolean>): Promise<void> {
    const requiredConsents = this.consentConfig.consentTypes
      .filter(config => config.required)
      .map(config => config.type);

    for (const requiredConsent of requiredConsents) {
      if (!consents[requiredConsent]) {
        throw new Error(`Required consent not granted: ${requiredConsent}`);
      }
    }
  }

  private isValidConsentType(consentType: string): boolean {
    return this.consentConfig.consentTypes.some(config => config.type === consentType);
  }

  // Consent Application
  private async applyConsentDecisions(userId: string, consents: Record<string, boolean>): Promise<void> {
    for (const [consentType, granted] of Object.entries(consents)) {
      await this.applyConsentDecision(userId, consentType as ConsentRecord['consentType'], granted);
    }
  }

  private async applyConsentDecision(
    userId: string, 
    consentType: ConsentRecord['consentType'], 
    granted: boolean
  ): Promise<void> {
    if (!granted) {
      // Handle consent revocation
      await dataPrivacyService.revokeConsent(userId, consentType);
    }

    // Configure data collection based on consent
    await this.configureDataCollection(userId, consentType, granted);
  }

  private async configureDataCollection(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean
  ): Promise<void> {
    switch (consentType) {
      case 'behavioral_tracking':
        await this.configureBehavioralTracking(userId, granted);
        break;
      case 'ai_personalization':
        await this.configureAIPersonalization(userId, granted);
        break;
      case 'analytics':
        await this.configureAnalytics(userId, granted);
        break;
      case 'marketing':
        await this.configureMarketing(userId, granted);
        break;
    }
  }

  private async configureBehavioralTracking(userId: string, enabled: boolean): Promise<void> {
    // Configure behavioral event tracking
    logger.debug(`Behavioral tracking ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);
  }

  private async configureAIPersonalization(userId: string, enabled: boolean): Promise<void> {
    // Configure AI personalization features
    logger.debug(`AI personalization ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);
  }

  private async configureAnalytics(userId: string, enabled: boolean): Promise<void> {
    // Configure analytics data collection
    logger.debug(`Analytics ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);
  }

  private async configureMarketing(userId: string, enabled: boolean): Promise<void> {
    // Configure marketing data collection
    logger.debug(`Marketing ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);
  }

  // Consent Checking
  async hasConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    return await dataPrivacyService.checkConsent(userId, consentType);
  }

  async getUserConsents(userId: string): Promise<Record<string, boolean>> {
    const consents: Record<string, boolean> = {};
    
    for (const consentConfig of this.consentConfig.consentTypes) {
      consents[consentConfig.type] = await this.hasConsent(userId, consentConfig.type);
    }
    
    return consents;
  }

  async requiresConsentUpdate(userId: string): Promise<boolean> {
    const preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      return true; // No consent recorded
    }
    
    // Check if consent version is outdated
    if (preferences.version !== this.consentConfig.consentVersion) {
      return true;
    }
    
    // Check if new consent types have been added
    const currentConsentTypes = new Set(Object.keys(preferences.preferences));
    const requiredConsentTypes = new Set(this.consentConfig.consentTypes.map(c => c.type));
    
    for (const requiredType of requiredConsentTypes) {
      if (!currentConsentTypes.has(requiredType)) {
        return true;
      }
    }
    
    return false;
  }

  // Consent Banner Management
  async getConsentBannerConfig(userId?: string): Promise<ConsentBannerConfig & { consentTypes: ConsentTypeConfig[] }> {
    let showBanner = this.bannerConfig.showBanner;
    
    if (userId) {
      const requiresUpdate = await this.requiresConsentUpdate(userId);
      showBanner = showBanner && requiresUpdate;
    }
    
    return {
      ...this.bannerConfig,
      showBanner,
      consentTypes: this.consentConfig.consentTypes
    };
  }

  async dismissConsentBanner(userId: string, consents: Record<string, boolean>): Promise<void> {
    await this.collectConsent(userId, consents, 'banner');
  }

  // Configuration Management
  updateConsentConfiguration(config: Partial<ConsentConfiguration>): void {
    this.consentConfig = { ...this.consentConfig, ...config };
    logger.info('Consent configuration updated', { config });
  }

  updateBannerConfiguration(config: Partial<ConsentBannerConfig>): void {
    this.bannerConfig = { ...this.bannerConfig, ...config };
    logger.info('Banner configuration updated', { config });
  }

  getConsentConfiguration(): ConsentConfiguration {
    return { ...this.consentConfig };
  }

  // Default Configurations
  private getDefaultConsentConfig(): ConsentConfiguration {
    return {
      consentTypes: [
        {
          type: 'behavioral_tracking',
          name: 'Behavioral Analytics',
          description: 'Track your interactions to improve the onboarding experience',
          required: false,
          category: 'functional',
          legalBasis: 'consent',
          dataProcessed: ['mouse_movements', 'click_patterns', 'scroll_behavior', 'time_spent'],
          retentionPeriod: 90,
          thirdParties: []
        },
        {
          type: 'ai_personalization',
          name: 'AI Personalization',
          description: 'Use AI to personalize your onboarding journey and content recommendations',
          required: false,
          category: 'functional',
          legalBasis: 'consent',
          dataProcessed: ['user_profile', 'preferences', 'behavior_patterns', 'ml_predictions'],
          retentionPeriod: 365,
          thirdParties: ['Azure OpenAI']
        },
        {
          type: 'analytics',
          name: 'Usage Analytics',
          description: 'Collect anonymized usage statistics to improve our service',
          required: false,
          category: 'analytics',
          legalBasis: 'legitimate_interest',
          dataProcessed: ['page_views', 'feature_usage', 'performance_metrics'],
          retentionPeriod: 730,
          thirdParties: ['Google Analytics']
        },
        {
          type: 'marketing',
          name: 'Marketing Communications',
          description: 'Send you personalized marketing communications and product updates',
          required: false,
          category: 'marketing',
          legalBasis: 'consent',
          dataProcessed: ['email', 'preferences', 'engagement_history'],
          retentionPeriod: 1095,
          thirdParties: ['Email Service Provider']
        }
      ],
      defaultConsents: {
        behavioral_tracking: false,
        ai_personalization: false,
        analytics: false,
        marketing: false
      },
      requireExplicitConsent: true,
      consentVersion: '1.0',
      legalBasis: {
        behavioral_tracking: 'consent',
        ai_personalization: 'consent',
        analytics: 'legitimate_interest',
        marketing: 'consent'
      }
    };
  }

  private getDefaultBannerConfig(): ConsentBannerConfig {
    return {
      showBanner: true,
      position: 'bottom',
      allowGranular: true,
      defaultToOptOut: true,
      cookieNotice: true
    };
  }

  // Reporting and Compliance
  async generateConsentReport(userId?: string): Promise<any> {
    if (userId) {
      return this.generateUserConsentReport(userId);
    } else {
      return this.generateGlobalConsentReport();
    }
  }

  private async generateUserConsentReport(userId: string): Promise<any> {
    const consents = await this.getUserConsents(userId);
    const preferences = this.userPreferences.get(userId);
    
    return {
      userId,
      consents,
      preferences,
      lastUpdated: preferences?.timestamp,
      version: preferences?.version,
      requiresUpdate: await this.requiresConsentUpdate(userId)
    };
  }

  private async generateGlobalConsentReport(): Promise<any> {
    const totalUsers = this.userPreferences.size;
    const consentStats: Record<string, { granted: number; percentage: number }> = {};
    
    for (const consentType of this.consentConfig.consentTypes) {
      let grantedCount = 0;
      
      for (const preferences of this.userPreferences.values()) {
        if (preferences.preferences[consentType.type]) {
          grantedCount++;
        }
      }
      
      consentStats[consentType.type] = {
        granted: grantedCount,
        percentage: totalUsers > 0 ? (grantedCount / totalUsers) * 100 : 0
      };
    }
    
    return {
      totalUsers,
      consentStats,
      consentVersion: this.consentConfig.consentVersion,
      generatedAt: new Date().toISOString()
    };
  }
}

export const userConsentManager = new UserConsentManager();