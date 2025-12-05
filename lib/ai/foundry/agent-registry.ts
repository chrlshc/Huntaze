/**
 * FoundryAgentRegistry - Central registry for all Foundry agents
 * 
 * Provides a unified interface to access all Foundry agents
 * and route requests to the appropriate agent based on type.
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */

import { getAIProviderConfig } from '../config/provider-config';
import {
  FoundryMessagingAgent,
  createFoundryMessagingAgent,
  MessagingRequest,
  MessagingResponseData,
} from '../agents/messaging.foundry';
import {
  FoundryAnalyticsAgent,
  createFoundryAnalyticsAgent,
  AnalyticsRequest,
  AnalyticsResponseData,
} from '../agents/analytics.foundry';
import {
  FoundrySalesAgent,
  createFoundrySalesAgent,
  SalesRequest,
  SalesResponseData,
} from '../agents/sales.foundry';
import {
  FoundryComplianceAgent,
  createFoundryComplianceAgent,
  ComplianceRequest,
  ComplianceResponseData,
} from '../agents/compliance.foundry';

/**
 * Agent types supported by the registry
 */
export type FoundryAgentType = 'messaging' | 'analytics' | 'sales' | 'compliance';

/**
 * Union type for all Foundry agents
 */
export type FoundryAgent = 
  | FoundryMessagingAgent 
  | FoundryAnalyticsAgent 
  | FoundrySalesAgent 
  | FoundryComplianceAgent;

/**
 * Request type mapping for each agent
 */
export type AgentRequestMap = {
  messaging: MessagingRequest;
  analytics: AnalyticsRequest;
  sales: SalesRequest;
  compliance: ComplianceRequest;
};

/**
 * Response type mapping for each agent
 */
export type AgentResponseMap = {
  messaging: MessagingResponseData;
  analytics: AnalyticsResponseData;
  sales: SalesResponseData;
  compliance: ComplianceResponseData;
};

/**
 * Registry configuration
 */
export interface RegistryConfig {
  routerUrl?: string;
  apiKey?: string;
}

/**
 * FoundryAgentRegistry singleton
 * 
 * Manages all Foundry agents and provides routing based on agent type.
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
export class FoundryAgentRegistry {
  private static instance: FoundryAgentRegistry | null = null;
  
  private messagingAgent: FoundryMessagingAgent | null = null;
  private analyticsAgent: FoundryAnalyticsAgent | null = null;
  private salesAgent: FoundrySalesAgent | null = null;
  private complianceAgent: FoundryComplianceAgent | null = null;
  
  private routerUrl: string;
  private apiKey?: string;
  private initialized: boolean = false;

  private constructor(config?: RegistryConfig) {
    const providerConfig = getAIProviderConfig();
    this.routerUrl = config?.routerUrl || providerConfig.getRouterUrl();
    this.apiKey = config?.apiKey || providerConfig.getRouterApiKey();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: RegistryConfig): FoundryAgentRegistry {
    if (!FoundryAgentRegistry.instance) {
      FoundryAgentRegistry.instance = new FoundryAgentRegistry(config);
    }
    return FoundryAgentRegistry.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    FoundryAgentRegistry.instance = null;
  }

  /**
   * Initialize all agents
   * Creates agent instances with router configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const clientConfig = {
      baseUrl: this.routerUrl,
      apiKey: this.apiKey,
    };

    // Create all agents
    // Requirement 3.3: MessagingFoundryAgent for chat/messaging
    this.messagingAgent = createFoundryMessagingAgent(clientConfig);
    
    // Requirement 3.4: AnalyticsFoundryAgent for analytics/math
    this.analyticsAgent = createFoundryAnalyticsAgent(clientConfig);
    
    // Requirement 3.5: SalesFoundryAgent for sales/creative
    this.salesAgent = createFoundrySalesAgent(clientConfig);
    
    // Requirement 3.6: ComplianceFoundryAgent for compliance/moderation
    this.complianceAgent = createFoundryComplianceAgent(clientConfig);

    this.initialized = true;
  }

  /**
   * Get agent by type
   * Requirement 3.3, 3.4, 3.5, 3.6: Route to appropriate agent
   * 
   * @param type - Agent type
   * @returns The requested agent
   * @throws Error if agent type is unknown or registry not initialized
   */
  getAgent<T extends FoundryAgentType>(type: T): FoundryAgent {
    if (!this.initialized) {
      throw new Error('FoundryAgentRegistry not initialized. Call initialize() first.');
    }

    switch (type) {
      case 'messaging':
        if (!this.messagingAgent) {
          throw new Error('MessagingAgent not available');
        }
        return this.messagingAgent;
        
      case 'analytics':
        if (!this.analyticsAgent) {
          throw new Error('AnalyticsAgent not available');
        }
        return this.analyticsAgent;
        
      case 'sales':
        if (!this.salesAgent) {
          throw new Error('SalesAgent not available');
        }
        return this.salesAgent;
        
      case 'compliance':
        if (!this.complianceAgent) {
          throw new Error('ComplianceAgent not available');
        }
        return this.complianceAgent;
        
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Get messaging agent
   * Requirement 3.3: MessagingFoundryAgent
   */
  getMessagingAgent(): FoundryMessagingAgent {
    return this.getAgent('messaging') as FoundryMessagingAgent;
  }

  /**
   * Get analytics agent
   * Requirement 3.4: AnalyticsFoundryAgent
   */
  getAnalyticsAgent(): FoundryAnalyticsAgent {
    return this.getAgent('analytics') as FoundryAnalyticsAgent;
  }

  /**
   * Get sales agent
   * Requirement 3.5: SalesFoundryAgent
   */
  getSalesAgent(): FoundrySalesAgent {
    return this.getAgent('sales') as FoundrySalesAgent;
  }

  /**
   * Get compliance agent
   * Requirement 3.6: ComplianceFoundryAgent
   */
  getComplianceAgent(): FoundryComplianceAgent {
    return this.getAgent('compliance') as FoundryComplianceAgent;
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get router URL
   */
  getRouterUrl(): string {
    return this.routerUrl;
  }

  /**
   * Get all registered agent types
   */
  getRegisteredTypes(): FoundryAgentType[] {
    return ['messaging', 'analytics', 'sales', 'compliance'];
  }

  /**
   * Map request type to agent type
   * Used by coordinator to route requests
   * 
   * @param requestType - Request type from AIRequest
   * @returns Corresponding agent type
   */
  static mapRequestTypeToAgent(requestType: string): FoundryAgentType | null {
    const mapping: Record<string, FoundryAgentType> = {
      'fan_message': 'messaging',
      'chat': 'messaging',
      'message': 'messaging',
      'analyze_performance': 'analytics',
      'analytics': 'analytics',
      'math': 'analytics',
      'optimize_sales': 'sales',
      'sales': 'sales',
      'creative': 'sales',
      'generate_caption': 'sales', // Captions are creative content
      'compliance_check': 'compliance',
      'compliance': 'compliance',
      'moderation': 'compliance',
    };

    return mapping[requestType] || null;
  }
}

/**
 * Convenience function to get registry instance
 */
export function getFoundryAgentRegistry(config?: RegistryConfig): FoundryAgentRegistry {
  return FoundryAgentRegistry.getInstance(config);
}

/**
 * Convenience function to get initialized registry
 */
export async function getInitializedRegistry(config?: RegistryConfig): Promise<FoundryAgentRegistry> {
  const registry = FoundryAgentRegistry.getInstance(config);
  await registry.initialize();
  return registry;
}
