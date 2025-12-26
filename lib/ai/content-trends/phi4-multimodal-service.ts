/**
 * Phi-4 Multimodal Service for Content & Trends AI Engine
 * 
 * Provides unified multimodal analysis (text + images + audio context) using
 * Phi-4-multimodal-instruct via Azure AI Foundry Chat Completions API.
 * 
 * Features:
 * - OCR text extraction from images
 * - Facial expression detection
 * - Editing dynamics analysis
 * - Visual element detection
 * - Dense caption generation with audio context
 * - Timeline "seconde par seconde" analysis for shorts
 * 
 * Requirements: 3.5, 3.9, 3.10
 * @see .kiro/specs/content-trends-ai-engine/requirements.md
 */

import { getModelEndpoint, PHI4_MULTIMODAL_CONFIG } from './azure-foundry-config';
import { externalFetch } from '@/lib/services/external/http';
import { ExternalServiceError } from '@/lib/services/external/errors';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MultimodalAnalysisRequest {
  /** Image URLs (Azure Blob Storage with SAS tokens) */
  imageUrls: string[];
  /** Optional audio transcription to correlate with visual analysis */
  audioTranscript?: AudioTranscript;
  /** Analysis type */
  analysisType: MultimodalAnalysisType;
  /** Additional context or instructions */
  context?: string;
  /** Video metadata for timeline analysis */
  videoMetadata?: VideoMetadata;
}

export interface AudioTranscript {
  /** Full transcript text */
  text: string;
  /** Word-level timestamps */
  words?: TranscriptWord[];
  /** Speaker segments for diarization */
  speakers?: SpeakerSegment[];
  /** Total duration in seconds */
  durationSeconds: number;
}

export interface TranscriptWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speakerId?: string;
}

export interface SpeakerSegment {
  speakerId: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoMetadata {
  /** Video duration in seconds */
  durationSeconds: number;
  /** Keyframe timestamps */
  keyframeTimestamps: number[];
  /** Video format */
  format: string;
  /** Resolution */
  resolution: { width: number; height: number };
}

export type MultimodalAnalysisType =
  | 'ocr'                    // Extract text from images
  | 'facial_expression'      // Detect facial expressions
  | 'editing_dynamics'       // Analyze editing patterns
  | 'visual_elements'        // Detect objects and visual elements
  | 'dense_caption'          // Generate comprehensive captions
  | 'timeline_analysis'      // Second-by-second analysis for shorts
  | 'viral_hook_detection'   // Detect visual hooks in first 3 seconds
  | 'comprehensive';         // All analysis types combined

export interface MultimodalAnalysisResult {
  /** Analysis type performed */
  analysisType: MultimodalAnalysisType;
  /** OCR extracted text */
  extractedText?: ExtractedText;
  /** Facial expressions detected */
  facialExpressions?: FacialExpression[];
  /** Editing dynamics analysis */
  editingDynamics?: EditingDynamics;
  /** Visual elements detected */
  visualElements?: VisualElement[];
  /** Dense caption */
  denseCaption?: DenseCaption;
  /** Timeline analysis for shorts */
  timelineAnalysis?: TimelineAnalysis;
  /** Viral hook analysis */
  viralHookAnalysis?: ViralHookAnalysis;
  /** Raw model response */
  rawResponse?: string;
  /** Token usage */
  usage?: { inputTokens: number; outputTokens: number };
}

export interface ExtractedText {
  /** All text found in images */
  fullText: string;
  /** Text blocks with positions */
  blocks: TextBlock[];
  /** Confidence score */
  confidence: number;
}

export interface TextBlock {
  text: string;
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  imageIndex: number;
}

export interface FacialExpression {
  /** Expression type */
  expression: 'happy' | 'sad' | 'surprised' | 'angry' | 'neutral' | 'fearful' | 'disgusted';
  /** Confidence score */
  confidence: number;
  /** Image index where detected */
  imageIndex: number;
  /** Timestamp if from video keyframe */
  timestamp?: number;
  /** Intensity (0-1) */
  intensity: number;
}

export interface EditingDynamics {
  /** Detected cuts/transitions */
  cuts: EditCut[];
  /** Pacing analysis */
  pacing: 'slow' | 'moderate' | 'fast' | 'very_fast';
  /** Average shot duration in seconds */
  avgShotDuration: number;
  /** Transition types used */
  transitionTypes: string[];
  /** Pattern interrupts detected */
  patternInterrupts: PatternInterrupt[];
}

export interface EditCut {
  /** Timestamp of cut */
  timestamp: number;
  /** Type of transition */
  transitionType: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'other';
  /** Intensity of change */
  intensity: number;
}

export interface PatternInterrupt {
  /** Timestamp */
  timestamp: number;
  /** Type of interrupt */
  type: 'visual_shock' | 'audio_spike' | 'text_overlay' | 'scene_change' | 'zoom_effect';
  /** Description */
  description: string;
  /** Effectiveness score (0-1) */
  effectiveness: number;
}

export interface VisualElement {
  /** Element type */
  type: 'person' | 'object' | 'text' | 'logo' | 'product' | 'background' | 'effect';
  /** Element name/description */
  name: string;
  /** Confidence score */
  confidence: number;
  /** Image index */
  imageIndex: number;
  /** Bounding box */
  boundingBox?: { x: number; y: number; width: number; height: number };
  /** Prominence score (0-1) */
  prominence: number;
}

export interface DenseCaption {
  /** Comprehensive caption */
  caption: string;
  /** Key visual elements */
  keyElements: string[];
  /** Detected emotions/mood */
  mood: string;
  /** Storytelling elements */
  storytellingElements: string[];
  /** Audio correlation notes (if transcript provided) */
  audioCorrelation?: string;
}

export interface TimelineAnalysis {
  /** Second-by-second breakdown */
  segments: TimelineSegment[];
  /** Engagement peaks */
  engagementPeaks: EngagementPeak[];
  /** Hook effectiveness (first 3 seconds) */
  hookEffectiveness: number;
  /** Retention prediction */
  retentionPrediction: RetentionPrediction;
}

export interface TimelineSegment {
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Visual description */
  visualDescription: string;
  /** Audio content (if transcript provided) */
  audioContent?: string;
  /** Engagement score (0-1) */
  engagementScore: number;
  /** Key events in this segment */
  keyEvents: string[];
}

export interface EngagementPeak {
  /** Timestamp */
  timestamp: number;
  /** Peak type */
  type: 'visual_hook' | 'audio_hook' | 'emotional_peak' | 'information_reveal' | 'call_to_action';
  /** Intensity (0-1) */
  intensity: number;
  /** Description */
  description: string;
}

export interface RetentionPrediction {
  /** Predicted retention at 25% */
  at25Percent: number;
  /** Predicted retention at 50% */
  at50Percent: number;
  /** Predicted retention at 75% */
  at75Percent: number;
  /** Predicted completion rate */
  completionRate: number;
  /** Key drop-off points */
  dropOffPoints: number[];
}

export interface ViralHookAnalysis {
  /** Hook type detected */
  hookType: 'pointed_truth' | 'micro_scenario' | 'fast_reward' | 'constraint_negative' | 'curiosity_gap' | 'none';
  /** Hook effectiveness (0-1) */
  effectiveness: number;
  /** Pattern interrupt in first 3 seconds */
  hasPatternInterrupt: boolean;
  /** Cognitive dissonance elements */
  cognitiveDissonance: string[];
  /** Recommendations for improvement */
  recommendations: string[];
}

// ============================================================================
// Phi-4 Multimodal Service
// ============================================================================

export class Phi4MultimodalService {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;

  constructor() {
    const config = getModelEndpoint('phi-4-multimodal');
    this.endpoint = config.endpoint || process.env.AZURE_PHI4_MULTIMODAL_ENDPOINT || '';
    this.apiKey = process.env.AZURE_PHI4_MULTIMODAL_KEY || process.env.AZURE_AI_API_KEY || '';
    this.deploymentName = config.deploymentName;
  }

  /**
   * Perform multimodal analysis on images with optional audio context
   */
  async analyzeContent(request: MultimodalAnalysisRequest): Promise<MultimodalAnalysisResult> {
    const prompt = this.buildPrompt(request);
    const messages = this.buildMessages(request, prompt);
    
    const response = await this.callChatCompletions(messages);
    return this.parseResponse(response, request.analysisType);
  }

  /**
   * Extract text from images using OCR
   */
  async extractText(imageUrls: string[]): Promise<ExtractedText> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'ocr',
    });
    return result.extractedText || { fullText: '', blocks: [], confidence: 0 };
  }

  /**
   * Detect facial expressions in images
   */
  async detectFacialExpressions(
    imageUrls: string[],
    keyframeTimestamps?: number[]
  ): Promise<FacialExpression[]> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'facial_expression',
      videoMetadata: keyframeTimestamps ? {
        durationSeconds: keyframeTimestamps[keyframeTimestamps.length - 1] || 0,
        keyframeTimestamps,
        format: 'unknown',
        resolution: { width: 0, height: 0 },
      } : undefined,
    });
    return result.facialExpressions || [];
  }

  /**
   * Analyze editing dynamics from video keyframes
   */
  async analyzeEditingDynamics(
    imageUrls: string[],
    videoMetadata: VideoMetadata
  ): Promise<EditingDynamics> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'editing_dynamics',
      videoMetadata,
    });
    return result.editingDynamics || {
      cuts: [],
      pacing: 'moderate',
      avgShotDuration: 0,
      transitionTypes: [],
      patternInterrupts: [],
    };
  }

  /**
   * Detect visual elements in images
   */
  async detectVisualElements(imageUrls: string[]): Promise<VisualElement[]> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'visual_elements',
    });
    return result.visualElements || [];
  }

  /**
   * Generate dense caption with audio context
   */
  async generateDenseCaption(
    imageUrls: string[],
    audioTranscript?: AudioTranscript
  ): Promise<DenseCaption> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'dense_caption',
      audioTranscript,
    });
    return result.denseCaption || {
      caption: '',
      keyElements: [],
      mood: 'neutral',
      storytellingElements: [],
    };
  }

  /**
   * Perform timeline analysis for shorts (second-by-second)
   */
  async analyzeVideoKeyframes(
    imageUrls: string[],
    videoMetadata: VideoMetadata,
    audioTranscript?: AudioTranscript
  ): Promise<TimelineAnalysis> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'timeline_analysis',
      videoMetadata,
      audioTranscript,
    });
    return result.timelineAnalysis || {
      segments: [],
      engagementPeaks: [],
      hookEffectiveness: 0,
      retentionPrediction: {
        at25Percent: 0,
        at50Percent: 0,
        at75Percent: 0,
        completionRate: 0,
        dropOffPoints: [],
      },
    };
  }

  /**
   * Analyze viral hook in first 3 seconds
   */
  async analyzeViralHook(
    imageUrls: string[],
    audioTranscript?: AudioTranscript
  ): Promise<ViralHookAnalysis> {
    const result = await this.analyzeContent({
      imageUrls,
      analysisType: 'viral_hook_detection',
      audioTranscript,
    });
    return result.viralHookAnalysis || {
      hookType: 'none',
      effectiveness: 0,
      hasPatternInterrupt: false,
      cognitiveDissonance: [],
      recommendations: [],
    };
  }

  /**
   * Perform comprehensive analysis (all types combined)
   */
  async analyzeComprehensive(
    imageUrls: string[],
    videoMetadata?: VideoMetadata,
    audioTranscript?: AudioTranscript
  ): Promise<MultimodalAnalysisResult> {
    return this.analyzeContent({
      imageUrls,
      analysisType: 'comprehensive',
      videoMetadata,
      audioTranscript,
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildPrompt(request: MultimodalAnalysisRequest): string {
    const prompts: Record<MultimodalAnalysisType, string> = {
      ocr: `Extract ALL text visible in these images. Return a JSON object with:
- fullText: all text concatenated
- blocks: array of {text, position: {x, y, width, height}, confidence, imageIndex}
- confidence: overall confidence score (0-1)`,

      facial_expression: `Analyze facial expressions in these images. Return a JSON array of:
{expression: "happy"|"sad"|"surprised"|"angry"|"neutral"|"fearful"|"disgusted", confidence: 0-1, imageIndex: number, intensity: 0-1}`,

      editing_dynamics: `Analyze the editing dynamics from these video keyframes. Return JSON:
{cuts: [{timestamp, transitionType, intensity}], pacing: "slow"|"moderate"|"fast"|"very_fast", avgShotDuration: seconds, transitionTypes: [], patternInterrupts: [{timestamp, type, description, effectiveness}]}`,

      visual_elements: `Detect all visual elements in these images. Return JSON array:
{type: "person"|"object"|"text"|"logo"|"product"|"background"|"effect", name: string, confidence: 0-1, imageIndex: number, prominence: 0-1}`,

      dense_caption: `Generate a comprehensive dense caption for these images${request.audioTranscript ? ' correlating with the provided audio transcript' : ''}. Return JSON:
{caption: string, keyElements: [], mood: string, storytellingElements: []${request.audioTranscript ? ', audioCorrelation: string' : ''}}`,

      timeline_analysis: `Perform second-by-second timeline analysis of this video content. Return JSON:
{segments: [{startTime, endTime, visualDescription, audioContent, engagementScore, keyEvents}], engagementPeaks: [{timestamp, type, intensity, description}], hookEffectiveness: 0-1, retentionPrediction: {at25Percent, at50Percent, at75Percent, completionRate, dropOffPoints}}`,

      viral_hook_detection: `Analyze the viral hook potential in the first 3 seconds. Return JSON:
{hookType: "pointed_truth"|"micro_scenario"|"fast_reward"|"constraint_negative"|"curiosity_gap"|"none", effectiveness: 0-1, hasPatternInterrupt: boolean, cognitiveDissonance: [], recommendations: []}`,

      comprehensive: `Perform comprehensive multimodal analysis. Return JSON with ALL of these sections:
{extractedText: {...}, facialExpressions: [...], editingDynamics: {...}, visualElements: [...], denseCaption: {...}, timelineAnalysis: {...}, viralHookAnalysis: {...}}`,
    };

    let prompt = prompts[request.analysisType];

    if (request.audioTranscript) {
      prompt += `\n\nAudio Transcript:\n"${request.audioTranscript.text}"`;
      if (request.audioTranscript.speakers && request.audioTranscript.speakers.length > 0) {
        prompt += `\n\nSpeaker Segments:\n${request.audioTranscript.speakers.map(s => `[${s.startTime}s-${s.endTime}s] ${s.speakerId}: "${s.text}"`).join('\n')}`;
      }
    }

    if (request.videoMetadata) {
      prompt += `\n\nVideo Metadata:
- Duration: ${request.videoMetadata.durationSeconds}s
- Keyframe timestamps: ${request.videoMetadata.keyframeTimestamps.join(', ')}s
- Resolution: ${request.videoMetadata.resolution.width}x${request.videoMetadata.resolution.height}`;
    }

    if (request.context) {
      prompt += `\n\nAdditional Context: ${request.context}`;
    }

    return prompt;
  }

  private buildMessages(request: MultimodalAnalysisRequest, prompt: string): ChatMessage[] {
    const content: ContentPart[] = [
      { type: 'text', text: prompt },
    ];

    // Add images
    for (const imageUrl of request.imageUrls) {
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    return [
      {
        role: 'user',
        content,
      },
    ];
  }

  private async callChatCompletions(messages: ChatMessage[]): Promise<ChatCompletionResponse> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Phi-4 Multimodal endpoint or API key not configured');
    }

    const response = await externalFetch(`${this.endpoint}/chat/completions`, {
      service: 'azure-ai',
      operation: 'phi4.chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        max_tokens: PHI4_MULTIMODAL_CONFIG.defaultParams.maxTokens,
        temperature: PHI4_MULTIMODAL_CONFIG.defaultParams.temperature,
      }),
      cache: 'no-store',
      timeoutMs: 20_000,
      retry: { maxRetries: 0, retryMethods: [] },
      throwOnHttpError: true,
    });

    try {
      return (await response.json()) as ChatCompletionResponse;
    } catch (error) {
      throw new ExternalServiceError({
        service: 'azure-ai',
        code: 'INVALID_RESPONSE',
        retryable: false,
        status: response.status,
        message: 'Phi-4 Multimodal returned invalid JSON',
        cause: error,
      });
    }
  }

  private parseResponse(
    response: ChatCompletionResponse,
    analysisType: MultimodalAnalysisType
  ): MultimodalAnalysisResult {
    const content = response.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from response
    let parsed: Record<string, unknown> = {};
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch {
      // If parsing fails, return raw response
      return {
        analysisType,
        rawResponse: content,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    }

    const result: MultimodalAnalysisResult = {
      analysisType,
      rawResponse: content,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };

    // Map parsed data to result based on analysis type
    if (analysisType === 'ocr' || analysisType === 'comprehensive') {
      result.extractedText = (parsed.extractedText || parsed) as unknown as ExtractedText;
    }
    if (analysisType === 'facial_expression' || analysisType === 'comprehensive') {
      result.facialExpressions = (parsed.facialExpressions || parsed) as unknown as FacialExpression[];
    }
    if (analysisType === 'editing_dynamics' || analysisType === 'comprehensive') {
      result.editingDynamics = (parsed.editingDynamics || parsed) as unknown as EditingDynamics;
    }
    if (analysisType === 'visual_elements' || analysisType === 'comprehensive') {
      result.visualElements = (parsed.visualElements || parsed) as unknown as VisualElement[];
    }
    if (analysisType === 'dense_caption' || analysisType === 'comprehensive') {
      result.denseCaption = (parsed.denseCaption || parsed) as unknown as DenseCaption;
    }
    if (analysisType === 'timeline_analysis' || analysisType === 'comprehensive') {
      result.timelineAnalysis = (parsed.timelineAnalysis || parsed) as unknown as TimelineAnalysis;
    }
    if (analysisType === 'viral_hook_detection' || analysisType === 'comprehensive') {
      result.viralHookAnalysis = (parsed.viralHookAnalysis || parsed) as unknown as ViralHookAnalysis;
    }

    return result;
  }
}

// ============================================================================
// Helper Types for Chat Completions API
// ============================================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// ============================================================================
// Singleton Export
// ============================================================================

let phi4ServiceInstance: Phi4MultimodalService | null = null;

export function getPhi4MultimodalService(): Phi4MultimodalService {
  if (!phi4ServiceInstance) {
    phi4ServiceInstance = new Phi4MultimodalService();
  }
  return phi4ServiceInstance;
}

export default Phi4MultimodalService;
