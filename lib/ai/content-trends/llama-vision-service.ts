/**
 * Llama 3.2 Vision Service for Content & Trends AI Engine
 * 
 * Provides multimodal analysis capabilities including OCR,
 * facial expression detection, and editing dynamics analysis.
 * 
 * Requirements: 3.5
 */

import { ContentTrendsAIRouter, TaskType, RoutingDecision } from './ai-router';
import { getModelEndpoint, ModelEndpointConfig } from './azure-foundry-config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface VisualAnalysisResult {
  analysisId: string;
  imageUrl: string;
  ocr: OCRResult;
  facialExpressions: FacialExpressionResult[];
  editingDynamics: EditingDynamicsResult;
  visualElements: VisualElement[];
  sceneDescription: string;
  confidence: number;
  processingTimeMs: number;
  tokenConsumption: number;
}

export interface OCRResult {
  text: string;
  textBlocks: TextBlock[];
  languages: string[];
  confidence: number;
}

export interface TextBlock {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
  fontSize: 'small' | 'medium' | 'large';
  style: 'normal' | 'bold' | 'italic';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FacialExpressionResult {
  faceId: string;
  boundingBox: BoundingBox;
  expression: EmotionType;
  expressionConfidence: number;
  age: AgeRange;
  gender: 'male' | 'female' | 'unknown';
  attributes: FaceAttributes;
}

export type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'fearful' 
  | 'disgusted' 
  | 'neutral'
  | 'contempt';

export interface AgeRange {
  min: number;
  max: number;
  estimated: number;
}

export interface FaceAttributes {
  smile: number;
  eyesOpen: boolean;
  mouthOpen: boolean;
  lookingAtCamera: boolean;
}

export interface EditingDynamicsResult {
  transitionTypes: TransitionType[];
  textOverlays: TextOverlay[];
  visualEffects: VisualEffect[];
  pacing: PacingAnalysis;
  colorGrading: ColorGradingAnalysis;
}

export type TransitionType = 
  | 'cut' 
  | 'fade' 
  | 'dissolve' 
  | 'wipe' 
  | 'zoom' 
  | 'pan'
  | 'jump_cut'
  | 'match_cut';

export interface TextOverlay {
  text: string;
  position: 'top' | 'center' | 'bottom';
  style: 'caption' | 'title' | 'subtitle' | 'meme';
  animation: string | null;
}

export interface VisualEffect {
  type: string;
  intensity: number;
  description: string;
}

export interface PacingAnalysis {
  averageShotDuration: number;
  pacingStyle: 'slow' | 'moderate' | 'fast' | 'dynamic';
  rhythmConsistency: number;
}

export interface ColorGradingAnalysis {
  dominantColors: string[];
  mood: string;
  saturation: 'low' | 'normal' | 'high';
  contrast: 'low' | 'normal' | 'high';
  temperature: 'cool' | 'neutral' | 'warm';
}

export interface VisualElement {
  type: 'person' | 'object' | 'text' | 'logo' | 'product' | 'background';
  description: string;
  boundingBox?: BoundingBox;
  prominence: number;
  relevance: number;
}

export interface LlamaVisionConfig {
  endpoint?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface AnalysisRequest {
  imageUrl: string;
  analysisTypes: AnalysisType[];
  context?: string;
  language?: string;
}

export type AnalysisType = 
  | 'ocr' 
  | 'facial_expressions' 
  | 'editing_dynamics' 
  | 'visual_elements'
  | 'scene_description'
  | 'full';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: LlamaVisionConfig = {
  maxTokens: 4096,
  temperature: 0.3,
  timeout: 60000,
};

// ============================================================================
// Llama Vision Service Class
// ============================================================================

export class LlamaVisionService {
  private config: LlamaVisionConfig;
  private router: ContentTrendsAIRouter;
  private modelConfig: ModelEndpointConfig;

  constructor(config: Partial<LlamaVisionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.router = new ContentTrendsAIRouter();
    this.modelConfig = getModelEndpoint('llama-vision');
  }

  /**
   * Perform comprehensive visual analysis on an image
   */
  async analyzeImage(request: AnalysisRequest): Promise<VisualAnalysisResult> {
    const startTime = Date.now();
    const analysisId = `va-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine which analyses to perform
    const analysisTypes = request.analysisTypes.includes('full')
      ? ['ocr', 'facial_expressions', 'editing_dynamics', 'visual_elements', 'scene_description'] as AnalysisType[]
      : request.analysisTypes;

    // Build the analysis prompt
    const prompt = this.buildAnalysisPrompt(analysisTypes, request.context, request.language);

    // Call Llama Vision API
    const response = await this.callLlamaVision(request.imageUrl, prompt);

    // Parse the response
    const parsedResult = this.parseAnalysisResponse(response.content, analysisTypes);

    const processingTimeMs = Date.now() - startTime;

    return {
      analysisId,
      imageUrl: request.imageUrl,
      ...parsedResult,
      confidence: this.calculateOverallConfidence(parsedResult),
      processingTimeMs,
      tokenConsumption: response.tokenConsumption,
    };
  }

  /**
   * Perform OCR on an image
   */
  async extractText(imageUrl: string): Promise<OCRResult> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisTypes: ['ocr'],
    });
    return result.ocr;
  }

  /**
   * Detect facial expressions in an image
   */
  async detectFacialExpressions(imageUrl: string): Promise<FacialExpressionResult[]> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisTypes: ['facial_expressions'],
    });
    return result.facialExpressions;
  }

  /**
   * Analyze editing dynamics from a composite grid image
   */
  async analyzeEditingDynamics(imageUrl: string): Promise<EditingDynamicsResult> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisTypes: ['editing_dynamics'],
      context: 'This is a composite grid of video keyframes. Analyze the editing style and dynamics.',
    });
    return result.editingDynamics;
  }

  /**
   * Generate a dense caption for viral content analysis
   */
  async generateDenseCaption(imageUrl: string, context?: string): Promise<string> {
    const prompt = `Analyze this image and provide a dense, detailed caption that captures:
1. Main subjects and their actions
2. Emotional tone and expressions
3. Visual style and composition
4. Text overlays or captions visible
5. Editing techniques visible (if this is a video grid)
6. Potential viral elements or hooks

${context ? `Context: ${context}` : ''}

Provide a comprehensive description in a single paragraph.`;

    const response = await this.callLlamaVision(imageUrl, prompt);
    return response.content;
  }

  /**
   * Build analysis prompt based on requested types
   */
  private buildAnalysisPrompt(
    analysisTypes: AnalysisType[],
    context?: string,
    language?: string
  ): string {
    const sections: string[] = [];

    sections.push('Analyze this image and provide a detailed JSON response with the following sections:\n');

    if (analysisTypes.includes('ocr')) {
      sections.push(`
"ocr": {
  "text": "all text found in the image",
  "textBlocks": [{"text": "...", "fontSize": "small|medium|large", "style": "normal|bold|italic", "confidence": 0.0-1.0}],
  "languages": ["detected languages"],
  "confidence": 0.0-1.0
}`);
    }

    if (analysisTypes.includes('facial_expressions')) {
      sections.push(`
"facialExpressions": [{
  "faceId": "unique id",
  "expression": "happy|sad|angry|surprised|fearful|disgusted|neutral|contempt",
  "expressionConfidence": 0.0-1.0,
  "age": {"min": 0, "max": 0, "estimated": 0},
  "gender": "male|female|unknown",
  "attributes": {"smile": 0.0-1.0, "eyesOpen": true/false, "mouthOpen": true/false, "lookingAtCamera": true/false}
}]`);
    }

    if (analysisTypes.includes('editing_dynamics')) {
      sections.push(`
"editingDynamics": {
  "transitionTypes": ["cut", "fade", "dissolve", "wipe", "zoom", "pan", "jump_cut", "match_cut"],
  "textOverlays": [{"text": "...", "position": "top|center|bottom", "style": "caption|title|subtitle|meme", "animation": "..."}],
  "visualEffects": [{"type": "...", "intensity": 0.0-1.0, "description": "..."}],
  "pacing": {"averageShotDuration": 0.0, "pacingStyle": "slow|moderate|fast|dynamic", "rhythmConsistency": 0.0-1.0},
  "colorGrading": {"dominantColors": ["#hex"], "mood": "...", "saturation": "low|normal|high", "contrast": "low|normal|high", "temperature": "cool|neutral|warm"}
}`);
    }

    if (analysisTypes.includes('visual_elements')) {
      sections.push(`
"visualElements": [{
  "type": "person|object|text|logo|product|background",
  "description": "...",
  "prominence": 0.0-1.0,
  "relevance": 0.0-1.0
}]`);
    }

    if (analysisTypes.includes('scene_description')) {
      sections.push(`
"sceneDescription": "A detailed description of the scene, including setting, mood, and key visual elements"`);
    }

    let prompt = sections.join('\n');

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    if (language) {
      prompt += `\n\nRespond in ${language}.`;
    }

    prompt += '\n\nRespond ONLY with valid JSON, no additional text.';

    return prompt;
  }

  /**
   * Call Llama Vision API
   */
  private async callLlamaVision(
    imageUrl: string,
    prompt: string
  ): Promise<{ content: string; tokenConsumption: number }> {
    const endpoint = this.config.endpoint || this.modelConfig.endpoint;
    const apiKey = this.config.apiKey || process.env.AZURE_AI_LLAMA_VISION_KEY || '';

    const requestBody = {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new LlamaVisionError(
          `API request failed: ${response.status} ${response.statusText}`,
          'API_ERROR',
          { status: response.status, body: errorText }
        );
      }

      const data = await response.json();

      return {
        content: data.choices?.[0]?.message?.content || '',
        tokenConsumption: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof LlamaVisionError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new LlamaVisionError('Request timeout', 'TIMEOUT');
      }

      throw new LlamaVisionError(
        `Request failed: ${(error as Error).message}`,
        'REQUEST_FAILED'
      );
    }
  }

  /**
   * Parse analysis response from Llama Vision
   */
  private parseAnalysisResponse(
    content: string,
    analysisTypes: AnalysisType[]
  ): Omit<VisualAnalysisResult, 'analysisId' | 'imageUrl' | 'confidence' | 'processingTimeMs' | 'tokenConsumption'> {
    // Try to extract JSON from the response
    let jsonContent = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      // If JSON parsing fails, return default values
      return this.getDefaultAnalysisResult(analysisTypes);
    }

    return {
      ocr: this.parseOCRResult(parsed.ocr),
      facialExpressions: this.parseFacialExpressions(parsed.facialExpressions),
      editingDynamics: this.parseEditingDynamics(parsed.editingDynamics),
      visualElements: this.parseVisualElements(parsed.visualElements),
      sceneDescription: (parsed.sceneDescription as string) || '',
    };
  }

  /**
   * Parse OCR result from response
   */
  private parseOCRResult(data: unknown): OCRResult {
    if (!data || typeof data !== 'object') {
      return { text: '', textBlocks: [], languages: [], confidence: 0 };
    }

    const ocrData = data as Record<string, unknown>;
    return {
      text: (ocrData.text as string) || '',
      textBlocks: Array.isArray(ocrData.textBlocks) 
        ? ocrData.textBlocks.map(this.parseTextBlock)
        : [],
      languages: Array.isArray(ocrData.languages) ? ocrData.languages : [],
      confidence: typeof ocrData.confidence === 'number' ? ocrData.confidence : 0,
    };
  }

  /**
   * Parse text block from response
   */
  private parseTextBlock(block: unknown): TextBlock {
    if (!block || typeof block !== 'object') {
      return {
        text: '',
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        confidence: 0,
        fontSize: 'medium',
        style: 'normal',
      };
    }

    const blockData = block as Record<string, unknown>;
    return {
      text: (blockData.text as string) || '',
      boundingBox: blockData.boundingBox as BoundingBox || { x: 0, y: 0, width: 0, height: 0 },
      confidence: typeof blockData.confidence === 'number' ? blockData.confidence : 0,
      fontSize: (blockData.fontSize as 'small' | 'medium' | 'large') || 'medium',
      style: (blockData.style as 'normal' | 'bold' | 'italic') || 'normal',
    };
  }

  /**
   * Parse facial expressions from response
   */
  private parseFacialExpressions(data: unknown): FacialExpressionResult[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((face, index) => {
      const faceData = face as Record<string, unknown>;
      return {
        faceId: (faceData.faceId as string) || `face-${index}`,
        boundingBox: faceData.boundingBox as BoundingBox || { x: 0, y: 0, width: 0, height: 0 },
        expression: (faceData.expression as EmotionType) || 'neutral',
        expressionConfidence: typeof faceData.expressionConfidence === 'number' ? faceData.expressionConfidence : 0,
        age: faceData.age as AgeRange || { min: 0, max: 0, estimated: 0 },
        gender: (faceData.gender as 'male' | 'female' | 'unknown') || 'unknown',
        attributes: faceData.attributes as FaceAttributes || {
          smile: 0,
          eyesOpen: true,
          mouthOpen: false,
          lookingAtCamera: false,
        },
      };
    });
  }

  /**
   * Parse editing dynamics from response
   */
  private parseEditingDynamics(data: unknown): EditingDynamicsResult {
    if (!data || typeof data !== 'object') {
      return this.getDefaultEditingDynamics();
    }

    const dynamicsData = data as Record<string, unknown>;
    return {
      transitionTypes: Array.isArray(dynamicsData.transitionTypes) 
        ? dynamicsData.transitionTypes as TransitionType[]
        : [],
      textOverlays: Array.isArray(dynamicsData.textOverlays)
        ? dynamicsData.textOverlays as TextOverlay[]
        : [],
      visualEffects: Array.isArray(dynamicsData.visualEffects)
        ? dynamicsData.visualEffects as VisualEffect[]
        : [],
      pacing: dynamicsData.pacing as PacingAnalysis || {
        averageShotDuration: 0,
        pacingStyle: 'moderate',
        rhythmConsistency: 0,
      },
      colorGrading: dynamicsData.colorGrading as ColorGradingAnalysis || {
        dominantColors: [],
        mood: '',
        saturation: 'normal',
        contrast: 'normal',
        temperature: 'neutral',
      },
    };
  }

  /**
   * Parse visual elements from response
   */
  private parseVisualElements(data: unknown): VisualElement[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((element) => {
      const elementData = element as Record<string, unknown>;
      return {
        type: (elementData.type as VisualElement['type']) || 'object',
        description: (elementData.description as string) || '',
        boundingBox: elementData.boundingBox as BoundingBox | undefined,
        prominence: typeof elementData.prominence === 'number' ? elementData.prominence : 0,
        relevance: typeof elementData.relevance === 'number' ? elementData.relevance : 0,
      };
    });
  }

  /**
   * Get default analysis result
   */
  private getDefaultAnalysisResult(
    _analysisTypes: AnalysisType[]
  ): Omit<VisualAnalysisResult, 'analysisId' | 'imageUrl' | 'confidence' | 'processingTimeMs' | 'tokenConsumption'> {
    return {
      ocr: { text: '', textBlocks: [], languages: [], confidence: 0 },
      facialExpressions: [],
      editingDynamics: this.getDefaultEditingDynamics(),
      visualElements: [],
      sceneDescription: '',
    };
  }

  /**
   * Get default editing dynamics
   */
  private getDefaultEditingDynamics(): EditingDynamicsResult {
    return {
      transitionTypes: [],
      textOverlays: [],
      visualEffects: [],
      pacing: {
        averageShotDuration: 0,
        pacingStyle: 'moderate',
        rhythmConsistency: 0,
      },
      colorGrading: {
        dominantColors: [],
        mood: '',
        saturation: 'normal',
        contrast: 'normal',
        temperature: 'neutral',
      },
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    result: Omit<VisualAnalysisResult, 'analysisId' | 'imageUrl' | 'confidence' | 'processingTimeMs' | 'tokenConsumption'>
  ): number {
    const scores: number[] = [];

    if (result.ocr.confidence > 0) {
      scores.push(result.ocr.confidence);
    }

    if (result.facialExpressions.length > 0) {
      const avgFaceConfidence = result.facialExpressions.reduce(
        (sum, face) => sum + face.expressionConfidence, 0
      ) / result.facialExpressions.length;
      scores.push(avgFaceConfidence);
    }

    if (result.visualElements.length > 0) {
      const avgElementRelevance = result.visualElements.reduce(
        (sum, el) => sum + el.relevance, 0
      ) / result.visualElements.length;
      scores.push(avgElementRelevance);
    }

    if (result.sceneDescription) {
      scores.push(0.8); // Default confidence for scene description
    }

    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class LlamaVisionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LlamaVisionError';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createLlamaVisionService(config?: Partial<LlamaVisionConfig>): LlamaVisionService {
  return new LlamaVisionService(config);
}
