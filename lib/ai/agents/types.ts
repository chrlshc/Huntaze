/**
 * AI Agent Types and Interfaces
 * 
 * Defines the common interface for all AI agents
 * Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { AIKnowledgeNetwork } from '../knowledge-network';
import type { TypeHint } from '../foundry/mapping';

/**
 * Base interface for all AI team members
 * Requirement 6.1: Agents implement common interface
 * Requirement 5.1: Maintain same input/output interface
 */
export interface AITeamMember {
  id: string;
  name: string;
  role: string;
  model: string;
  
  /**
   * Type hint for router model selection
   * Requirement 2.1-2.4: Each agent type mapped to appropriate model selection hints
   * - MessagingAgent → 'chat' (fan interactions)
   * - AnalyticsAgent → 'math' (data analysis requiring reasoning)
   * - SalesAgent → 'creative' (persuasive message generation)
   * - ComplianceAgent → 'chat' (content policy checking)
   */
  typeHint: TypeHint;
  
  /**
   * Initialize the agent with access to the Knowledge Network
   * Requirement 7.1: Agents access Knowledge Network
   */
  initialize(network: AIKnowledgeNetwork): Promise<void>;
  
  /**
   * Process a request and return a response
   * Requirement 6.2: Route requests to appropriate agents
   */
  processRequest(request: any): Promise<any>;
}

/**
 * Request types for agent routing
 * Requirement 6.1: Identify request types
 */
export type AIRequest =
  | { type: 'fan_message'; creatorId: number; fanId: string; message: string; context?: any }
  | { type: 'generate_caption'; creatorId: number; platform: string; contentInfo: any }
  | { type: 'analyze_performance'; creatorId: number; metrics: any }
  | { type: 'optimize_sales'; creatorId: number; fanId: string; context: any };

/**
 * Response format from agents
 * Requirement 5.2: Include usage statistics in existing format with deployment and region
 */
export type AIResponse = {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    /** Model name from router response (e.g., "Llama-3.3-70B") */
    model: string;
    /** Deployment name from router response (e.g., "llama33-70b-us") */
    deployment: string;
    /** Azure region from router response (e.g., "eastus2") */
    region: string;
    /** Number of input tokens consumed */
    inputTokens: number;
    /** Number of output tokens generated */
    outputTokens: number;
    /** Cost in USD calculated from model pricing */
    costUsd: number;
  };
};

/**
 * Insight metadata for Knowledge Network storage
 * Requirement 5.4: Include actual model used in insight metadata
 * Requirement 7.3: Include deployment name and region from router response
 */
export interface InsightMetadata {
  /** Model name (e.g., "Llama-3.3-70B") */
  model: string;
  /** Deployment name (e.g., "llama33-70b-us") */
  deployment: string;
  /** Azure region (e.g., "eastus2") */
  region: string;
  /** Provider identifier */
  provider: 'azure-foundry';
  /** ISO timestamp */
  timestamp: string;
}
