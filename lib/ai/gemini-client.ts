/**
 * Gemini Client - New SDK (@google/genai)
 * 
 * Low-level wrapper around @google/genai SDK for Gemini 2.5 and 3.0
 * Provides usage metadata extraction and structured output support
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4
 */

import { GoogleGenAI } from '@google/genai';

// Lazy initialization to support testing
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    // Validate API key (Requirement 2.5)
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set the GEMINI_API_KEY environment variable.');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

/**
 * Usage metadata returned by Gemini API
 * Requirement 2.3: Return usage metadata (tokens input/output)
 */
export type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

/**
 * Configuration for Gemini generation
 * Supports structured outputs (Requirement 10.1, 10.2)
 */
export type GeminiGenerationConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  response_mime_type?: string; // For structured outputs (Requirement 10.1)
  response_json_schema?: any; // For JSON schema validation (Requirement 10.2)
};

/**
 * Parameters for text generation
 */
export type GeminiGenerateTextParams = {
  model?: string;
  contents: { 
    role: 'user' | 'system' | 'model'; 
    parts: { text: string }[] 
  }[];
  config?: GeminiGenerationConfig;
};

/**
 * Response from text generation
 * Requirement 2.3: Include usage metadata
 */
export type GeminiGenerateTextResponse = {
  model: string;
  text: string;
  usageMetadata: GeminiUsageMetadata;
};

/**
 * Generate text using Gemini API
 * 
 * Requirements:
 * - 2.1: Use @google/genai SDK
 * - 2.2: Use gemini-2.5-pro by default
 * - 2.3: Return usage metadata (tokens input/output)
 * - 2.4: Support alternative models (gemini-2.5-flash, gemini-2.5-flash-lite)
 * - 10.1: Support structured outputs with response_mime_type
 * - 10.2: Support JSON schema validation
 * - 10.3: Parse JSON automatically
 * - 10.4: Throw explicit errors on parsing failure
 */
export async function generateTextRaw(
  params: GeminiGenerateTextParams
): Promise<GeminiGenerateTextResponse> {
  // Requirement 2.2: Use gemini-2.5-pro by default
  // Requirement 2.4: Support alternative models
  const model = params.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-pro';

  try {
    const response = await getAI().models.generateContent({
      model,
      contents: params.contents,
      config: params.config,
    });

    // Extract text from response
    const text = response.text as string;

    // Requirement 10.3: Parse JSON automatically if structured output
    if (params.config?.response_mime_type === 'application/json') {
      try {
        // Validate that the response is valid JSON
        JSON.parse(text);
      } catch (parseError) {
        // Requirement 10.4: Throw explicit error on parsing failure
        throw new Error(
          `Failed to parse structured JSON output: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }
    }

    // Requirement 2.3: Return usage metadata
    const usageMetadata: GeminiUsageMetadata = {
      promptTokenCount: response.usageMetadata?.promptTokenCount,
      candidatesTokenCount: response.usageMetadata?.candidatesTokenCount,
      totalTokenCount: response.usageMetadata?.totalTokenCount,
    };

    return {
      model,
      text,
      usageMetadata,
    };
  } catch (error) {
    // Enhanced error handling for SDK errors
    if (error instanceof Error) {
      // Check for common SDK errors
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key');
      }
      if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded');
      }
      // Re-throw with context
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error(`Gemini API error: ${String(error)}`);
  }
}

/**
 * Generate structured output with JSON schema validation
 * 
 * Requirements:
 * - 10.1: Use response_mime_type: 'application/json'
 * - 10.2: Use response_json_schema for validation
 * - 10.3: Parse JSON automatically
 * - 10.4: Throw explicit error on parsing failure
 */
export async function generateStructuredOutputRaw<T = any>(
  params: Omit<GeminiGenerateTextParams, 'config'> & {
    schema: any;
    config?: Omit<GeminiGenerationConfig, 'response_mime_type' | 'response_json_schema'>;
  }
): Promise<GeminiGenerateTextResponse & { parsed: T }> {
  const response = await generateTextRaw({
    ...params,
    config: {
      ...params.config,
      response_mime_type: 'application/json',
      response_json_schema: params.schema,
    },
  });

  try {
    const parsed = JSON.parse(response.text) as T;
    return {
      ...response,
      parsed,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse structured output: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
