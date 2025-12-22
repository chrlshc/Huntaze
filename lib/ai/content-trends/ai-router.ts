/**
 * AI Model Router for Content & Trends AI Engine
 * 
 * Intelligent routing of tasks to appropriate AI models based on:
 * - Task complexity (simple → V3, complex → R1)
 * - Modality (visual/multimodal → Phi-4, audio → Azure Speech)
 * - Cost optimization
 * 
 * Requirements: 2.1, 2.2, 2.5
 * Property 1: AI Model Routing Consistency
 * @see .kiro/specs/content-trends-ai-engine/design.md
 */

import {
  ContentTrendsModel,
  getModelEndpoint,
  getPreferredMultimodalModel,
  ModelEndpoint,
  ModelParameters,
} from './azure-foundry-config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum TaskComplexity {
  SIMPLE = 'simple',       // Classification, formatting, simple extraction
  MODERATE = 'moderate',   // Summarization, basic analysis
  COMPLEX = 'complex',     // Deep reasoning, viral analysis, strategy
}

export enum TaskModality {
  TEXT = 'text',           // Text-only tasks
  VISUAL = 'visual',       // Image/video analysis
  AUDIO = 'audio',         // Audio transcription
  MULTIMODAL = 'multimodal', // Combined text, visual, and audio
}

export type TaskType =
  | 'classification'       // Content type classification
  | 'formatting'           // Text formatting, JSON structuring
  | 'summarization'        // Content summarization
  | 'extraction'           // Data extraction from text
  | 'viral_analysis'       // Deep viral mechanism analysis
  | 'strategy_generation'  // Strategic recommendations
  | 'script_generation'    // Creative script writing
  | 'visual_analysis'      // Image/video understanding
  | 'ocr'                  // Text extraction from images
  | 'audio_transcription'  // Audio to text transcription
  | 'timeline_analysis'    // Second-by-second shorts analysis
  | 'hook_analysis'        // Hook-Retain-Reward framework analysis
  | 'emotional_analysis'   // Emotional trigger identification
  | 'trend_prediction';    // Trend and virality prediction

export interface AnalysisTask {
  /** Unique task identifier */
  id: string;
  /** Task type */
  type: TaskType;
  /** Task modality */
  modality: TaskModality;
  /** Input content */
  content: {
    text?: string;
    imageUrls?: string[];
    videoUrl?: string;
    audioUrl?: string;
    audioTranscript?: string;
  };
  /** Optional complexity override */
  complexityOverride?: TaskComplexity;
  /** Brand context for generation tasks */
  brandContext?: {
    industry: string;
    tone: string;
    targetAudience: string;
  };
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RoutingDecision {
  /** Selected model */
  model: ContentTrendsModel;
  /** Model endpoint configuration */
  endpoint: ModelEndpoint;
  /** Determined complexity */
  complexity: TaskComplexity;
  /** Routing reason */
  reason: string;
  /** Optimized parameters for this task */
  parameters: ModelParameters;
  /** Estimated cost (USD) */
  estimatedCost: {
    inputTokens: number;
    outputTokens: number;
    audioDurationHours?: number;
    totalCost: number;
  };
}

// ============================================================================
// Complexity Determination
// ============================================================================

/**
 * Task type to complexity mapping
 * Requirement 2.1: R1 for cognitive analysis, V3 for creative writing
 */
const TASK_COMPLEXITY_MAP: Record<TaskType, TaskComplexity> = {
  // Simple tasks → DeepSeek V3
  classification: TaskComplexity.SIMPLE,
  formatting: TaskComplexity.SIMPLE,
  extraction: TaskComplexity.SIMPLE,
  
  // Moderate tasks → DeepSeek V3 with more tokens
  summarization: TaskComplexity.MODERATE,
  script_generation: TaskComplexity.MODERATE,
  
  // Complex tasks → DeepSeek R1
  viral_analysis: TaskComplexity.COMPLEX,
  strategy_generation: TaskComplexity.COMPLEX,
  hook_analysis: TaskComplexity.COMPLEX,
  emotional_analysis: TaskComplexity.COMPLEX,
  trend_prediction: TaskComplexity.COMPLEX,
  timeline_analysis: TaskComplexity.COMPLEX,
  
  // Visual tasks → Phi-4 Multimodal (handled separately)
  visual_analysis: TaskComplexity.MODERATE,
  ocr: TaskComplexity.SIMPLE,
  
  // Audio tasks → Azure Speech (handled separately)
  audio_transcription: TaskComplexity.SIMPLE,
};

/**
 * Determine task complexity based on type and content
 */
export function determineComplexity(task: AnalysisTask): TaskComplexity {
  // Allow explicit override
  if (task.complexityOverride) {
    return task.complexityOverride;
  }

  // Get base complexity from task type
  const baseComplexity = TASK_COMPLEXITY_MAP[task.type];

  // Adjust based on content length (longer content may need more reasoning)
  if (task.content.text) {
    const wordCount = task.content.text.split(/\s+/).length;
    
    // Very long content bumps up complexity
    if (wordCount > 5000 && baseComplexity === TaskComplexity.SIMPLE) {
      return TaskComplexity.MODERATE;
    }
    if (wordCount > 10000 && baseComplexity === TaskComplexity.MODERATE) {
      return TaskComplexity.COMPLEX;
    }
  }

  return baseComplexity;
}

// ============================================================================
// Model Selection
// ============================================================================

/**
 * Select optimal model based on complexity and modality
 * 
 * Routing logic:
 * - Audio tasks → Azure Speech Batch
 * - Visual/Multimodal tasks → Phi-4 Multimodal (or Llama Vision fallback)
 * - Complex reasoning → DeepSeek R1
 * - Simple/Moderate text → DeepSeek V3
 */
export function selectModel(
  complexity: TaskComplexity,
  modality: TaskModality,
  taskType?: TaskType
): ContentTrendsModel {
  // Audio transcription always goes to Azure Speech
  if (modality === TaskModality.AUDIO || taskType === 'audio_transcription') {
    return 'azure-speech-batch';
  }

  // Visual and multimodal tasks go to Phi-4 (with Llama Vision fallback)
  if (modality === TaskModality.VISUAL || modality === TaskModality.MULTIMODAL) {
    return getPreferredMultimodalModel();
  }

  // Text tasks routed by complexity
  switch (complexity) {
    case TaskComplexity.COMPLEX:
      return 'deepseek-r1';
    case TaskComplexity.MODERATE:
    case TaskComplexity.SIMPLE:
    default:
      return 'deepseek-v3';
  }
}

/**
 * Get optimized parameters for a specific task
 */
export function getOptimizedParameters(
  model: ContentTrendsModel,
  task: AnalysisTask
): ModelParameters {
  const endpoint = getModelEndpoint(model);
  const baseParams = { ...endpoint.defaultParams };

  // Azure Speech doesn't use these parameters
  if (model === 'azure-speech-batch') {
    return baseParams;
  }

  // Adjust based on task type
  switch (task.type) {
    case 'viral_analysis':
    case 'hook_analysis':
    case 'emotional_analysis':
    case 'timeline_analysis':
      // Reasoning tasks: use R1's recommended temperature
      if (model === 'deepseek-r1') {
        baseParams.temperature = 0.6; // Requirement 2.4
        baseParams.maxTokens = 8192;  // Allow long reasoning chains
      }
      break;

    case 'script_generation':
      // Creative tasks: slightly higher temperature
      baseParams.temperature = 0.8;
      baseParams.maxTokens = 4096;
      break;

    case 'classification':
    case 'formatting':
      // Deterministic tasks: low temperature
      baseParams.temperature = 0.1;
      baseParams.maxTokens = 1024;
      break;

    case 'visual_analysis':
    case 'ocr':
      // Visual tasks: consistent analysis with Phi-4's 128K context
      baseParams.temperature = 0.3;
      baseParams.maxTokens = 4096;
      break;
  }

  return baseParams;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Estimate token counts for a task
 */
function estimateTokenCounts(task: AnalysisTask): { input: number; output: number; audioDurationHours?: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  let audioDurationHours: number | undefined;

  // Estimate input tokens from content
  if (task.content.text) {
    // Rough estimate: 1 token ≈ 4 characters
    inputTokens += Math.ceil(task.content.text.length / 4);
  }

  // Audio transcript context
  if (task.content.audioTranscript) {
    inputTokens += Math.ceil(task.content.audioTranscript.length / 4);
  }

  // Image tokens (Phi-4 Multimodal)
  if (task.content.imageUrls) {
    // Each image ≈ 1000 tokens
    inputTokens += task.content.imageUrls.length * 1000;
  }

  // Audio duration estimation (for Azure Speech pricing)
  if (task.content.audioUrl || task.type === 'audio_transcription') {
    // Default estimate: 1 minute = 0.0167 hours
    // Actual duration should be provided in task metadata
    audioDurationHours = 0.0167; // 1 minute default
  }

  // Add system prompt overhead
  inputTokens += 500;

  // Estimate output based on task type
  switch (task.type) {
    case 'viral_analysis':
    case 'strategy_generation':
    case 'timeline_analysis':
      outputTokens = 4000;
      break;
    case 'script_generation':
      outputTokens = 2000;
      break;
    case 'summarization':
      outputTokens = 1000;
      break;
    case 'classification':
    case 'formatting':
      outputTokens = 500;
      break;
    case 'audio_transcription':
      outputTokens = 0; // Azure Speech doesn't use token-based pricing
      break;
    default:
      outputTokens = 1500;
  }

  return { input: inputTokens, output: outputTokens, audioDurationHours };
}

// ============================================================================
// AI Router Class
// ============================================================================

export class ContentTrendsAIRouter {
  /**
   * Route a task to the optimal AI model
   * 
   * Property 1: AI Model Routing Consistency
   * - Simple tasks → DeepSeek V3
   * - Complex reasoning → DeepSeek R1
   * - Visual/Multimodal tasks → Phi-4 Multimodal
   * - Audio tasks → Azure Speech Batch
   */
  routeTask(task: AnalysisTask): RoutingDecision {
    // Determine complexity
    const complexity = determineComplexity(task);

    // Select model
    const model = selectModel(complexity, task.modality, task.type);

    // Get endpoint configuration
    const endpoint = getModelEndpoint(model);

    // Get optimized parameters
    const parameters = getOptimizedParameters(model, task);

    // Estimate cost
    const tokenEstimates = estimateTokenCounts(task);
    
    let totalCost: number;
    if (model === 'azure-speech-batch' && tokenEstimates.audioDurationHours) {
      // Azure Speech uses per-hour pricing
      totalCost = tokenEstimates.audioDurationHours * (endpoint.pricing.perHour || 0.18);
    } else {
      const inputCost = (tokenEstimates.input / 1_000_000) * endpoint.pricing.inputPerMillion;
      const outputCost = (tokenEstimates.output / 1_000_000) * endpoint.pricing.outputPerMillion;
      totalCost = inputCost + outputCost;
    }

    // Build routing reason
    const reason = this.buildRoutingReason(task, complexity, model);

    return {
      model,
      endpoint,
      complexity,
      reason,
      parameters,
      estimatedCost: {
        inputTokens: tokenEstimates.input,
        outputTokens: tokenEstimates.output,
        audioDurationHours: tokenEstimates.audioDurationHours,
        totalCost,
      },
    };
  }

  /**
   * Build human-readable routing reason
   */
  private buildRoutingReason(
    task: AnalysisTask,
    complexity: TaskComplexity,
    model: ContentTrendsModel
  ): string {
    const reasons: string[] = [];

    if (task.modality === TaskModality.AUDIO || task.type === 'audio_transcription') {
      reasons.push('Audio content requires Azure Speech Batch Transcription ($0.18/hour)');
    } else if (task.modality === TaskModality.VISUAL || task.modality === TaskModality.MULTIMODAL) {
      if (model === 'phi-4-multimodal') {
        reasons.push('Visual/multimodal content requires Phi-4 Multimodal (128K context)');
      } else {
        reasons.push('Visual content requires Llama Vision (fallback)');
      }
    } else if (complexity === TaskComplexity.COMPLEX) {
      reasons.push('Complex reasoning task requires DeepSeek R1 ($0.00135/$0.0054 per 1K tokens)');
    } else {
      reasons.push('Standard task routed to DeepSeek V3 for cost efficiency ($0.00114/$0.00456 per 1K tokens)');
    }

    reasons.push(`Task type: ${task.type}`);
    reasons.push(`Complexity: ${complexity}`);

    return reasons.join('. ');
  }

  /**
   * Validate that a task can be processed
   */
  validateTask(task: AnalysisTask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.id) {
      errors.push('Task must have an ID');
    }

    if (!task.type) {
      errors.push('Task must have a type');
    }

    if (task.modality === TaskModality.VISUAL && !task.content.imageUrls?.length) {
      errors.push('Visual tasks must include image URLs');
    }

    if (task.modality === TaskModality.AUDIO && !task.content.audioUrl) {
      errors.push('Audio tasks must include audio URL');
    }

    if (task.modality === TaskModality.TEXT && !task.content.text) {
      errors.push('Text tasks must include text content');
    }

    if (task.modality === TaskModality.MULTIMODAL) {
      const hasVisual = task.content.imageUrls?.length || task.content.videoUrl;
      const hasText = task.content.text || task.content.audioTranscript;
      if (!hasVisual && !hasText) {
        errors.push('Multimodal tasks must include at least visual or text content');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get model configuration for a specific model
   */
  getModelConfig(model: ContentTrendsModel): ModelEndpoint {
    return getModelEndpoint(model);
  }

  /**
   * Get the preferred multimodal model (Phi-4 or Llama Vision fallback)
   */
  getPreferredMultimodalModel(): ContentTrendsModel {
    return getPreferredMultimodalModel();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let routerInstance: ContentTrendsAIRouter | null = null;

export function getContentTrendsRouter(): ContentTrendsAIRouter {
  if (!routerInstance) {
    routerInstance = new ContentTrendsAIRouter();
  }
  return routerInstance;
}
