/**
 * Azure AI Foundry Configuration for Content & Trends AI Engine
 * 
 * Configures MaaS endpoints for:
 * - DeepSeek R1 (reasoning) - $0.00135/1K input, $0.0054/1K output
 * - DeepSeek V3 (generation) - $0.00114/1K input, $0.00456/1K output
 * - Phi-4-multimodal-instruct (multimodal analysis) - Azure Foundry Partners & Community, 128K context
 * - Azure Speech Batch Transcription (audio) - $0.18/hour
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * @see .kiro/specs/content-trends-ai-engine/requirements.md
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ModelEndpoint {
  /** Model identifier */
  modelId: string;
  /** Display name */
  name: string;
  /** Azure deployment name */
  deploymentName: string;
  /** Azure region */
  region: string;
  /** MaaS endpoint URL */
  endpoint: string;
  /** Model capabilities */
  capabilities: ModelCapability[];
  /** Pricing per million tokens (or per hour for speech) */
  pricing: {
    inputPerMillion: number;
    outputPerMillion: number;
    perHour?: number;
  };
  /** Default parameters */
  defaultParams: ModelParameters;
}

export interface ModelParameters {
  /** Temperature for generation (0.0-1.0) */
  temperature: number;
  /** Maximum tokens to generate */
  maxTokens: number;
  /** Top-p sampling */
  topP?: number;
  /** Context window size */
  contextWindow: number;
}

export type ModelCapability = 
  | 'reasoning'      // Deep reasoning with chain-of-thought
  | 'generation'     // Fast text generation
  | 'vision'         // Image/video analysis
  | 'audio'          // Audio transcription
  | 'multimodal'     // Unified text + images + audio
  | 'ocr'            // Text extraction from images
  | 'classification' // Content classification
  | 'summarization'; // Text summarization

export type ContentTrendsModel = 
  | 'deepseek-r1'           // Reasoning model
  | 'deepseek-v3'           // MoE generation model
  | 'phi-4-multimodal'      // Multimodal vision model (replaces llama-vision)
  | 'azure-speech-batch'    // Audio transcription
  | 'llama-vision';         // Legacy - kept for backward compatibility

// ============================================================================
// Model Configurations
// ============================================================================

/**
 * DeepSeek R1 Configuration
 * - Reinforcement learning based reasoning model
 * - No SFT, pure RL training
 * - Temperature 0.6 for balanced creativity/coherence
 * - Chain-of-thought generation
 * - Pricing: $0.00135/1K input, $0.0054/1K output
 */
export const DEEPSEEK_R1_CONFIG: ModelEndpoint = {
  modelId: 'deepseek-r1',
  name: 'DeepSeek R1 (Reasoning)',
  deploymentName: process.env.AZURE_DEEPSEEK_R1_DEPLOYMENT || 'deepseek-r1-reasoning',
  region: process.env.AZURE_AI_REGION || 'eastus2',
  endpoint: process.env.AZURE_DEEPSEEK_R1_ENDPOINT || '',
  capabilities: ['reasoning', 'classification'],
  pricing: {
    inputPerMillion: 1.35,   // $0.00135/1K = $1.35/1M
    outputPerMillion: 5.40,  // $0.0054/1K = $5.40/1M
  },
  defaultParams: {
    temperature: 0.6,       // Requirement 2.4: 0.5-0.7 range
    maxTokens: 8192,
    topP: 0.95,
    contextWindow: 64000,
  },
};

/**
 * DeepSeek V3 Configuration
 * - Mixture-of-Experts (MoE) architecture
 * - 671B total params, 37B activated per token
 * - Fast generation, cost-efficient
 * - 128k context window
 * - Pricing: $0.00114/1K input, $0.00456/1K output
 */
export const DEEPSEEK_V3_CONFIG: ModelEndpoint = {
  modelId: 'deepseek-v3',
  name: 'DeepSeek V3 (Generation)',
  deploymentName: process.env.AZURE_DEEPSEEK_V3_DEPLOYMENT || 'deepseek-v3-generation',
  region: process.env.AZURE_AI_REGION || 'eastus2',
  endpoint: process.env.AZURE_DEEPSEEK_V3_ENDPOINT || '',
  capabilities: ['generation', 'summarization', 'classification'],
  pricing: {
    inputPerMillion: 1.14,   // $0.00114/1K = $1.14/1M
    outputPerMillion: 4.56,  // $0.00456/1K = $4.56/1M
  },
  defaultParams: {
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
    contextWindow: 128000,  // Requirement 2.8: 128k context
  },
};

/**
 * Phi-4-multimodal-instruct Configuration
 * - Azure Foundry Partners & Community model
 * - Unified multimodal analysis (text + images + audio context)
 * - 128K context window
 * - Chat Completions API compatible
 * - Replaces Llama 3.2 Vision for multimodal tasks
 */
export const PHI4_MULTIMODAL_CONFIG: ModelEndpoint = {
  modelId: 'phi-4-multimodal-instruct',
  name: 'Phi-4 Multimodal (Vision + Audio)',
  deploymentName: process.env.AZURE_PHI4_MULTIMODAL_DEPLOYMENT || 'phi-4-multimodal-instruct',
  region: process.env.AZURE_AI_REGION || 'eastus2',
  endpoint: process.env.AZURE_PHI4_MULTIMODAL_ENDPOINT || '',
  capabilities: ['vision', 'multimodal', 'ocr', 'classification'],
  pricing: {
    inputPerMillion: 0.40,   // Estimated pricing
    outputPerMillion: 0.40,
  },
  defaultParams: {
    temperature: 0.3,       // Lower for consistent visual analysis
    maxTokens: 4096,
    contextWindow: 128000,  // 128K context for comprehensive analysis
  },
};

/**
 * Azure Speech Batch Transcription Configuration
 * - Cost-efficient audio transcription at $0.18/hour
 * - Speaker diarization support
 * - Timestamp alignment for timeline analysis
 */
export const AZURE_SPEECH_BATCH_CONFIG: ModelEndpoint = {
  modelId: 'azure-speech-batch',
  name: 'Azure Speech Batch Transcription',
  deploymentName: 'speech-batch-transcription',
  region: process.env.AZURE_SPEECH_REGION || process.env.AZURE_AI_REGION || 'eastus2',
  endpoint: process.env.AZURE_SPEECH_ENDPOINT || '',
  capabilities: ['audio'],
  pricing: {
    inputPerMillion: 0,
    outputPerMillion: 0,
    perHour: 0.18,          // $0.18/hour for batch transcription
  },
  defaultParams: {
    temperature: 0,
    maxTokens: 0,
    contextWindow: 0,
  },
};

/**
 * Llama 3.2 Vision Configuration (LEGACY - kept for backward compatibility)
 * @deprecated Use PHI4_MULTIMODAL_CONFIG instead
 */
export const LLAMA_VISION_CONFIG: ModelEndpoint = {
  modelId: 'llama-3.2-vision',
  name: 'Llama 3.2 Vision (Legacy)',
  deploymentName: process.env.AZURE_LLAMA_VISION_DEPLOYMENT || 'llama-32-vision',
  region: process.env.AZURE_AI_REGION || 'eastus2',
  endpoint: process.env.AZURE_LLAMA_VISION_ENDPOINT || '',
  capabilities: ['vision', 'ocr', 'classification'],
  pricing: {
    inputPerMillion: 0.40,
    outputPerMillion: 0.40,
  },
  defaultParams: {
    temperature: 0.3,
    maxTokens: 2048,
    contextWindow: 128000,
  },
};

// ============================================================================
// Configuration Manager
// ============================================================================

export interface ContentTrendsAIConfig {
  /** All model endpoints */
  models: Record<ContentTrendsModel, ModelEndpoint>;
  /** Azure authentication */
  auth: {
    /** Use Managed Identity (recommended for production) */
    useManagedIdentity: boolean;
    /** API key fallback */
    apiKey?: string;
    /** Tenant ID for Entra ID */
    tenantId?: string;
    /** Azure Speech subscription key */
    speechKey?: string;
  };
  /** Regional configuration */
  regional: {
    /** Primary region */
    primaryRegion: string;
    /** Failover regions */
    failoverRegions: string[];
  };
  /** Rate limiting */
  rateLimits: {
    /** Requests per minute per model */
    requestsPerMinute: number;
    /** Tokens per minute per model */
    tokensPerMinute: number;
  };
}

/**
 * Get the full Content & Trends AI configuration
 */
export function getContentTrendsAIConfig(): ContentTrendsAIConfig {
  return {
    models: {
      'deepseek-r1': DEEPSEEK_R1_CONFIG,
      'deepseek-v3': DEEPSEEK_V3_CONFIG,
      'phi-4-multimodal': PHI4_MULTIMODAL_CONFIG,
      'azure-speech-batch': AZURE_SPEECH_BATCH_CONFIG,
      'llama-vision': LLAMA_VISION_CONFIG, // Legacy
    },
    auth: {
      useManagedIdentity: process.env.AZURE_USE_MANAGED_IDENTITY === 'true',
      apiKey: process.env.AZURE_AI_API_KEY,
      tenantId: process.env.AZURE_TENANT_ID,
      speechKey: process.env.AZURE_SPEECH_KEY,
    },
    regional: {
      primaryRegion: process.env.AZURE_AI_REGION || 'eastus2',
      failoverRegions: (process.env.AZURE_AI_FAILOVER_REGIONS || 'westus2,northeurope').split(','),
    },
    rateLimits: {
      requestsPerMinute: parseInt(process.env.AZURE_AI_RPM || '100', 10),
      tokensPerMinute: parseInt(process.env.AZURE_AI_TPM || '100000', 10),
    },
  };
}

/**
 * Get a specific model endpoint configuration
 */
export function getModelEndpoint(model: ContentTrendsModel): ModelEndpoint {
  const config = getContentTrendsAIConfig();
  return config.models[model];
}

/**
 * Get the preferred multimodal model (Phi-4, with Llama Vision as fallback)
 */
export function getPreferredMultimodalModel(): ContentTrendsModel {
  const phi4Config = getModelEndpoint('phi-4-multimodal');
  if (phi4Config.endpoint) {
    return 'phi-4-multimodal';
  }
  // Fallback to Llama Vision if Phi-4 not configured
  return 'llama-vision';
}

/**
 * Validate that all required endpoints are configured
 */
export function validateEndpointConfiguration(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getContentTrendsAIConfig();

  // Required models
  const requiredModels: ContentTrendsModel[] = ['deepseek-r1', 'deepseek-v3'];
  for (const modelId of requiredModels) {
    const endpoint = config.models[modelId];
    if (!endpoint.endpoint) {
      errors.push(`Missing endpoint URL for ${modelId}`);
    }
    if (!endpoint.deploymentName) {
      errors.push(`Missing deployment name for ${modelId}`);
    }
  }

  // Multimodal model (Phi-4 preferred, Llama Vision as fallback)
  const phi4 = config.models['phi-4-multimodal'];
  const llamaVision = config.models['llama-vision'];
  if (!phi4.endpoint && !llamaVision.endpoint) {
    errors.push('No multimodal model configured (set AZURE_PHI4_MULTIMODAL_ENDPOINT or AZURE_LLAMA_VISION_ENDPOINT)');
  } else if (!phi4.endpoint) {
    warnings.push('Phi-4 multimodal not configured, falling back to Llama Vision');
  }

  // Azure Speech (optional but recommended)
  if (!config.auth.speechKey && !process.env.AZURE_SPEECH_ENDPOINT) {
    warnings.push('Azure Speech not configured - audio transcription will be unavailable');
  }

  if (!config.auth.useManagedIdentity && !config.auth.apiKey) {
    errors.push('No authentication configured (set AZURE_USE_MANAGED_IDENTITY=true or AZURE_AI_API_KEY)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate estimated cost for a request
 */
export function estimateCost(
  model: ContentTrendsModel,
  inputTokens: number,
  outputTokens: number,
  audioDurationHours?: number
): number {
  const endpoint = getModelEndpoint(model);
  
  // For Azure Speech, use per-hour pricing
  if (model === 'azure-speech-batch' && audioDurationHours !== undefined) {
    return audioDurationHours * (endpoint.pricing.perHour || 0.18);
  }
  
  const inputCost = (inputTokens / 1_000_000) * endpoint.pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * endpoint.pricing.outputPerMillion;
  return inputCost + outputCost;
}

/**
 * Get cost summary for all models
 */
export function getCostSummary(): Record<ContentTrendsModel, { input: string; output: string; perHour?: string }> {
  return {
    'deepseek-r1': { input: '$0.00135/1K', output: '$0.0054/1K' },
    'deepseek-v3': { input: '$0.00114/1K', output: '$0.00456/1K' },
    'phi-4-multimodal': { input: '$0.0004/1K', output: '$0.0004/1K' },
    'azure-speech-batch': { input: 'N/A', output: 'N/A', perHour: '$0.18/hour' },
    'llama-vision': { input: '$0.0004/1K', output: '$0.0004/1K' },
  };
}
