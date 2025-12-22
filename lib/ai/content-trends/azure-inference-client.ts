/**
 * Azure AI Foundry Inference Client for Content & Trends AI Engine
 * 
 * Unified client for calling DeepSeek R1, DeepSeek V3, and Llama Vision
 * via Azure AI Foundry MaaS endpoints.
 * 
 * Pipeline:
 * 1. Llama Vision: Frame-by-frame timeline analysis (1 fps, max 40 frames)
 * 2. DeepSeek R1: Viral scoring + diagnostic + recommendations
 * 3. DeepSeek V3: Content generation (hooks, scripts, captions)
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.5
 */

import {
  ContentTrendsModel,
  getModelEndpoint,
  ModelParameters,
  getContentTrendsAIConfig,
} from './azure-foundry-config';
import { externalFetchJson } from '@/lib/services/external/http';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface InferenceRequest {
  model: ContentTrendsModel;
  messages: ChatMessage[];
  parameters?: Partial<ModelParameters>;
  /** For R1: extract reasoning from <think> tags */
  extractReasoning?: boolean;
}

export interface InferenceResponse {
  content: string;
  reasoning?: string; // R1 chain-of-thought (never display in prod)
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  costUsd: number;
}

export interface VisionTimelineEntry {
  second: number;
  action: string;
  emotions: string[];
  textOnScreen: string;
  hookScore: number;
  patternInterrupts: string[];
}

export interface ViralAnalysisResult {
  viralScore: number;
  retentionPrediction: number;
  mechanisms: string[];
  emotionalTriggers: string[];
  recommendations: string[];
  timeline: VisionTimelineEntry[];
}

export interface ContentAssetsResult {
  hooks: string[];
  script: string;
  captions: string[];
  hashtags: string[];
  callToAction: string;
}

// ============================================================================
// Azure Inference Client
// ============================================================================

export class AzureInferenceClient {
  private apiKey: string;
  private useManagedIdentity: boolean;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    const config = getContentTrendsAIConfig();
    this.apiKey = config.auth.apiKey || '';
    this.useManagedIdentity = config.auth.useManagedIdentity;
  }

  /**
   * Get authentication header
   */
  private async getAuthHeader(): Promise<string> {
    if (this.useManagedIdentity) {
      // Use Managed Identity token
      if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
        await this.refreshManagedIdentityToken();
      }
      return `Bearer ${this.accessToken}`;
    }
    return `Bearer ${this.apiKey}`;
  }

  /**
   * Refresh Managed Identity token
   */
  private async refreshManagedIdentityToken(): Promise<void> {
    // In production, use @azure/identity DefaultAzureCredential
    // For now, fall back to API key
    console.warn('[AzureInferenceClient] Managed Identity not implemented, using API key');
  }

  /**
   * Call Azure AI Foundry inference endpoint
   */
  async inference(request: InferenceRequest): Promise<InferenceResponse> {
    const endpoint = getModelEndpoint(request.model);
    
    if (!endpoint.endpoint) {
      throw new Error(`Endpoint not configured for model: ${request.model}. Set AZURE_${request.model.toUpperCase().replace('-', '_')}_ENDPOINT`);
    }

    const params = {
      ...endpoint.defaultParams,
      ...request.parameters,
    };

    const body = {
      messages: request.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
    };

    const authHeader = await this.getAuthHeader();

    const data: any = await externalFetchJson(`${endpoint.endpoint}/chat/completions`, {
      service: `azure-ai-foundry:${request.model}`,
      operation: 'chat.completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      timeoutMs: 45_000,
      retry: {
        maxRetries: 1,
        retryMethods: ['POST'],
      },
    });
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract reasoning from R1 <think> tags
    let reasoning: string | undefined;
    let cleanContent = content;
    
    if (request.extractReasoning && request.model === 'deepseek-r1') {
      const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        reasoning = thinkMatch[1].trim();
        cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      }
    }

    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const costUsd = this.calculateCost(request.model, usage.prompt_tokens, usage.completion_tokens);

    return {
      content: cleanContent,
      reasoning,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      model: request.model,
      costUsd,
    };
  }

  /**
   * Calculate cost for a request
   */
  private calculateCost(model: ContentTrendsModel, inputTokens: number, outputTokens: number): number {
    const endpoint = getModelEndpoint(model);
    const inputCost = (inputTokens / 1_000_000) * endpoint.pricing.inputPerMillion;
    const outputCost = (outputTokens / 1_000_000) * endpoint.pricing.outputPerMillion;
    return inputCost + outputCost;
  }

  // ==========================================================================
  // High-Level Pipeline Methods
  // ==========================================================================

  /**
   * Analyze video frames with Llama Vision
   * Pass A: Extract timeline JSON from frames
   * 
   * @param frameUrls - Array of frame image URLs (1 fps, max 40)
   */
  async analyzeFrames(frameUrls: string[]): Promise<VisionTimelineEntry[]> {
    if (frameUrls.length === 0) {
      return [];
    }

    // Build multimodal content with all frames
    const content: ContentPart[] = [
      {
        type: 'text',
        text: `Analyze these video frames (1 per second) and provide a timeline analysis.
For each frame, identify:
- action: what's happening
- emotions: facial expressions/emotions visible
- textOnScreen: any text overlays
- hookScore: 0-100 how attention-grabbing
- patternInterrupts: visual changes that grab attention

Respond ONLY with valid JSON array:
[{"second": 0, "action": "...", "emotions": [...], "textOnScreen": "...", "hookScore": 85, "patternInterrupts": [...]}]`,
      },
    ];

    // Add all frames as images
    for (let i = 0; i < frameUrls.length; i++) {
      content.push({
        type: 'image_url',
        image_url: {
          url: frameUrls[i],
          detail: 'low', // Cost optimization
        },
      });
    }

    const response = await this.inference({
      model: 'llama-vision',
      messages: [{ role: 'user', content }],
      parameters: {
        temperature: 0.3,
        maxTokens: 4096,
      },
    });

    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[AzureInferenceClient] Failed to parse vision timeline:', e);
    }

    return [];
  }

  /**
   * Analyze viral potential with DeepSeek R1
   * Pass B: Deep reasoning on timeline + engagement
   */
  async analyzeViral(
    timeline: VisionTimelineEntry[],
    transcript?: string,
    engagementMetrics?: { views: number; likes: number; shares: number; comments: number }
  ): Promise<ViralAnalysisResult> {
    const prompt = `Tu es un expert en analyse virale de contenus courts (TikTok, Reels, Shorts).

TIMELINE DU CONTENU:
${JSON.stringify(timeline, null, 2)}

${transcript ? `TRANSCRIPT:\n${transcript}\n` : ''}
${engagementMetrics ? `MÉTRIQUES:\n- Vues: ${engagementMetrics.views}\n- Likes: ${engagementMetrics.likes}\n- Partages: ${engagementMetrics.shares}\n- Commentaires: ${engagementMetrics.comments}\n` : ''}

Analyse ce contenu selon le framework Hook-Retain-Reward:
1. HOOK (0-3s): Qu'est-ce qui capte l'attention?
2. RETAIN (3-15s): Qu'est-ce qui maintient l'engagement?
3. REWARD (fin): Quelle satisfaction pour le viewer?

Réponds UNIQUEMENT en JSON valide:
{
  "viralScore": 0-100,
  "retentionPrediction": 0-100,
  "mechanisms": ["curiosity_gap", "pattern_interrupt", ...],
  "emotionalTriggers": ["surprise", "FOMO", ...],
  "recommendations": ["Ajouter un hook textuel dans les 2 premières secondes", ...]
}`;

    const response = await this.inference({
      model: 'deepseek-r1',
      messages: [
        { role: 'system', content: 'Tu es un expert en viralité. Réponds uniquement en JSON.' },
        { role: 'user', content: prompt },
      ],
      parameters: {
        temperature: 0.6, // R1 optimal
        maxTokens: 4096,
      },
      extractReasoning: true, // Capture but don't display
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          ...result,
          timeline,
        };
      }
    } catch (e) {
      console.error('[AzureInferenceClient] Failed to parse viral analysis:', e);
    }

    return {
      viralScore: 0,
      retentionPrediction: 0,
      mechanisms: [],
      emotionalTriggers: [],
      recommendations: [],
      timeline,
    };
  }

  /**
   * Generate content assets with DeepSeek V3
   * Pass C: Fast generation of hooks, scripts, captions
   */
  async generateAssets(
    viralAnalysis: ViralAnalysisResult,
    brandContext?: { industry: string; tone: string; targetAudience: string }
  ): Promise<ContentAssetsResult> {
    const prompt = `Tu es un créateur de contenu viral expert.

ANALYSE VIRALE:
- Score viral: ${viralAnalysis.viralScore}/100
- Mécanismes identifiés: ${viralAnalysis.mechanisms.join(', ')}
- Triggers émotionnels: ${viralAnalysis.emotionalTriggers.join(', ')}
- Recommandations: ${viralAnalysis.recommendations.join('; ')}

${brandContext ? `CONTEXTE MARQUE:\n- Industrie: ${brandContext.industry}\n- Ton: ${brandContext.tone}\n- Audience: ${brandContext.targetAudience}\n` : ''}

Génère des assets de contenu optimisés:

Réponds UNIQUEMENT en JSON valide:
{
  "hooks": ["Hook 1 (max 10 mots)", "Hook 2", "Hook 3"],
  "script": "Script complet optimisé (max 150 mots)",
  "captions": ["Caption 1 avec emojis", "Caption 2"],
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "callToAction": "CTA engageant"
}`;

    const response = await this.inference({
      model: 'deepseek-v3',
      messages: [
        { role: 'system', content: 'Tu es un expert en création de contenu viral. Réponds uniquement en JSON.' },
        { role: 'user', content: prompt },
      ],
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
      },
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[AzureInferenceClient] Failed to parse content assets:', e);
    }

    return {
      hooks: [],
      script: '',
      captions: [],
      hashtags: [],
      callToAction: '',
    };
  }

  /**
   * Full pipeline: Frames → Vision → R1 → V3
   */
  async analyzeVideo(
    frameUrls: string[],
    options?: {
      transcript?: string;
      engagementMetrics?: { views: number; likes: number; shares: number; comments: number };
      brandContext?: { industry: string; tone: string; targetAudience: string };
    }
  ): Promise<{
    timeline: VisionTimelineEntry[];
    viralAnalysis: ViralAnalysisResult;
    assets: ContentAssetsResult;
    totalCostUsd: number;
  }> {
    let totalCost = 0;

    // Pass A: Vision timeline
    const timeline = await this.analyzeFrames(frameUrls);
    
    // Pass B: Viral analysis with R1
    const viralAnalysis = await this.analyzeViral(
      timeline,
      options?.transcript,
      options?.engagementMetrics
    );

    // Pass C: Content generation with V3
    const assets = await this.generateAssets(viralAnalysis, options?.brandContext);

    return {
      timeline,
      viralAnalysis,
      assets,
      totalCostUsd: totalCost,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let clientInstance: AzureInferenceClient | null = null;

export function getAzureInferenceClient(): AzureInferenceClient {
  if (!clientInstance) {
    clientInstance = new AzureInferenceClient();
  }
  return clientInstance;
}
