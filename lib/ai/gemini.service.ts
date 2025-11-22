/**
 * Google Gemini AI Service
 * 
 * Service pour interagir avec l'API Google Gemini
 * Remplace OpenAI pour la génération de contenu AI
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

// Types
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface GeminiGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export interface GeminiResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: any[];
}

/**
 * Gemini AI Service
 */
export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  private constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: DEFAULT_MODEL });
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Générer du texte avec Gemini
   */
  async generateText(
    prompt: string,
    options?: GeminiGenerateOptions
  ): Promise<GeminiResponse> {
    try {
      const generationConfig: GenerationConfig = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
        stopSequences: options?.stopSequences,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      };
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Générer du texte avec conversation (chat)
   */
  async chat(
    messages: GeminiMessage[],
    options?: GeminiGenerateOptions
  ): Promise<GeminiResponse> {
    try {
      const generationConfig: GenerationConfig = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
        stopSequences: options?.stopSequences,
      };

      // Convertir les messages au format Gemini
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = this.model.startChat({
        history,
        generationConfig,
      });

      const result = await chat.sendMessage(lastMessage.parts);
      const response = result.response;
      const text = response.text();

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new Error(`Failed to chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Générer du texte en streaming
   */
  async *generateTextStream(
    prompt: string,
    options?: GeminiGenerateOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      const generationConfig: GenerationConfig = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
        stopSequences: options?.stopSequences,
      };

      const result = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw new Error(`Failed to stream text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Compter les tokens (estimation)
   */
  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      console.error('Token counting error:', error);
      // Estimation approximative si l'API échoue
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Obtenir les modèles disponibles
   */
  getAvailableModels(): string[] {
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
    ];
  }

  /**
   * Changer de modèle
   */
  setModel(modelName: string): void {
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();

// Helper functions

/**
 * Générer du texte simple
 */
export async function generateText(
  prompt: string,
  options?: GeminiGenerateOptions
): Promise<string> {
  const response = await geminiService.generateText(prompt, options);
  return response.text;
}

/**
 * Chat avec historique
 */
export async function chat(
  messages: GeminiMessage[],
  options?: GeminiGenerateOptions
): Promise<string> {
  const response = await geminiService.chat(messages, options);
  return response.text;
}

/**
 * Générer du texte en streaming
 */
export async function* generateTextStream(
  prompt: string,
  options?: GeminiGenerateOptions
): AsyncGenerator<string, void, unknown> {
  yield* geminiService.generateTextStream(prompt, options);
}
