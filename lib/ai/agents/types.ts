/**
 * AI Agent Types and Interfaces
 * 
 * Defines the common interface for all AI agents
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { AIKnowledgeNetwork } from '../knowledge-network';

/**
 * Base interface for all AI team members
 * Requirement 6.1: Agents implement common interface
 */
export interface AITeamMember {
  id: string;
  name: string;
  role: string;
  model: string;
  
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
 */
export type AIResponse = {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
};
